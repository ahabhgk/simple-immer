const DRAFT_STATE = Symbol('immer-draft-state')

const isDraft = (value) => !!value && !!value[DRAFT_STATE]
const isDraftable = (value) => value !== null && typeof value === 'object'
const has = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
const shallowCopy = (value) => (Array.isArray(value) ? [...value] : { ...value })

function createDraft (parent, base, proxies) {
  const state = {
    finalized: false,
    parent,
    base,
    copy: undefined,
    drafts: {},
  }
  const p = Proxy.revocable(state, {
    get (state, prop) {
      if (prop === DRAFT_STATE) return state
      if (state.copy) {
        const value = state.copy[prop]
        if (value === state.base[prop] && isDraftable(value)) {
          return (state.copy[prop] = createDraft(state, value, proxies))
        }
        return value
      }
      if (has(state.drafts, prop)) return state.drafts[prop]
      const value = state.base[prop]
      if (!isDraft(state) && isDraftable(value)) {
        return (state.drafts[prop] = createDraft(state, value, proxies))
      }
      return value
    },
    has (state, prop) {
      return Reflect.has(state.copy ?? state.base, prop)
    },
    ownKeys (state) {
      return Reflect.ownKeys(state.copy ?? state.base)
    },
    set (state, prop, value) {
      if (!state.copy) {
        if (
          (prop in state.base && value === state.base[prop]) ||
          (has(state.drafts, prop) && state.drafts[prop] === value)
        ) { return true }
        markChanged(state)
      }
      state.copy[prop] = value
      return true
    },
    deleteProperty (state, prop) {
      markChanged(state)
      delete state.copy[prop]
      return true
    },
    getOwnPropertyDescriptor (state, prop) {
      const owner = state.copy ?? has(state.drafts, prop) ? state.drafts : state.base
      return Reflect.getOwnPropertyDescriptor(owner, prop)
    },
  })
  proxies.push(p)
  return p.proxy
}

function markChanged (state) {
  if (!state.copy) {
    state.copy = shallowCopy(state.base)
    Object.assign(state.copy, state.drafts) // works on Array
    if (state.parent) markChanged(state.parent)
  }
}

function finalize (draft) {
  if (isDraft(draft)) {
    const state = draft[DRAFT_STATE]
    if (state.copy) {
      if (state.finalized) return state.copy // TEST: self reference
      state.finalized = true
      return finalizeObj(state.copy, state)
    }
    return state.base
  }
  return draft
}

function finalizeObj (copy, state) {
  const { base } = state
  Object.entries(copy).forEach(([prop, value]) => { // works on Array
    if (value !== base[prop]) copy[prop] = finalize(value)
  })
  return copy
}

export function createImmer (base) {
  const proxies = []
  const draft = createDraft(undefined, base, proxies)
  const finish = () => {
    const res = finalize(draft)
    proxies.forEach((p) => p.revoke())
    return res
  }
  return {
    draft,
    finish,
  }
}

export function produce (base, producer) {
  const { draft, finish } = createImmer(base)
  const p = producer(draft)
  if (p instanceof Promise) {
    return p.then(() => finish())
  }
  return finish()
}
