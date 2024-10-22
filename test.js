import {describe, it, beforeEach, expect} from '@jest/globals'
import {produce} from './index.js'

describe('simple immer', () => {
  let baseState
  beforeEach(() => {
    baseState = {
      object: {
        a: true,
        b: 0,
        c: null,
      },
      value: 'hi',
      array: [1, 2, [3, 4, {value: 'immer'}]],
    }
  })

  it('should return the original without modifications', () => {
    const nextState = produce(baseState, () => {})
    expect(nextState).toBe(baseState)
  })

  it('should return the original when reading stuff', () => {
    const nextState = produce(baseState, (draft) => {
      expect(draft.value).toBe('hi')
      expect(draft.value).toBe('hi')
      expect(draft.array[2][2].value).toBe('immer')
    })
    expect(nextState).toBe(baseState)
  })

  it('deep change on object bubbles up', () => {
    const nextState = produce(baseState, (draft) => {
      draft.object.a = false
    })
    expect(nextState).not.toBe(baseState)
    expect(nextState.object).not.toBe(baseState.object)
    expect(baseState.object.a).toBe(true)
    expect(nextState.object.a).toBe(false)
    expect(nextState.array).toBe(baseState.array)
  })

  it('deep change on array bubbles up', () => {
    const nextState = produce(baseState, (draft) => {
      draft.array[2][0]++
    })
    expect(nextState).not.toBe(baseState)
    expect(nextState.array).not.toBe(baseState.array)
    expect(baseState.array[2][0]).toBe(3)
    expect(nextState.array[2][0]).toBe(4)
    expect(nextState.object).toBe(baseState.object)
  })

  it('processes single non-modification', () => {
    const nextState = produce(baseState, (draft) => {
      draft.value = 'hi'
    })
    expect(nextState).toBe(baseState)
  })

  it('processes single modification', () => {
    const nextState = produce(baseState, (draft) => {
      draft.value = 'hello'
      draft.value = 'hi'
    })
    expect(nextState).not.toBe(baseState)
    expect(nextState).toEqual(baseState)
  })

  it('processes multi modification', () => {
    const nextState = produce(baseState, (draft) => {
      draft.array[2][0]++
      draft.array[2][2].value = 'hi'
    })
    expect(nextState.array[2][0]).toBe(4)
    expect(nextState.array[2][2].value).toBe('hi')
  })

  it('in should work', () => {
    produce(baseState, (draft) => {
      expect('array' in draft).toBe(true)
      expect(Reflect.has(draft, 'array')).toBe(true)
    })
  })

  it('ownKeys should work', () => {
    produce(baseState, (draft) => {
      const keys = ['object', 'value', 'array']
      expect(Reflect.ownKeys(draft)).toEqual(keys)
      expect(Object.getOwnPropertyNames(draft)).toEqual(keys)
      expect(Object.keys(draft)).toEqual(keys) // getOwnPropertyDescriptor
    })
  })

  it('delete should work', () => {
    const nextState = produce(baseState, (draft) => {
      delete draft.value
    })
    expect(nextState.value).toBeUndefined()
  })

  it('processes async produce', async () => {
    const nextState = await produce(baseState, async (draft) => {
      draft.value = 'hello'
      await Promise.resolve()
      draft.value = 'world'
    })
    expect(nextState.value).toBe('world')
  })

  it('self reference', async () => {
    const nextState = produce(baseState, (draft) => {
      draft.value = draft
    })
    expect(nextState.value).toBe(nextState)
  })

  it('curry produce', async () => {
    const mapper = produce((draft, index) => {
      draft.index = index
    }, {})
    expect([{}, {}, {}].map(mapper))
      .toEqual([{index: 0}, {index: 1}, {index: 2}])
    expect(mapper(undefined, 1)).toEqual({index: 1})
  })

  it('produce as object method', async () => {
    const world = {
      counter: {count: 1},
      inc: produce(function(draft) {
        expect(this).toBe(world)
        draft.counter.count = this.counter.count + 1
      }),
    }
    expect(world.inc(world).counter.count).toBe(2)
  })

  it('supports the spread operator', () => {
    const base = {foo: {x: 0, y: 0}, bar: [0, 0]}
    const result = produce(base, (draft) => {
      draft.foo = {x: 1, ...draft.foo, y: 1}
      draft.bar = [1, ...draft.bar, 1]
    })
    expect(result).toEqual({
      foo: {x: 0, y: 1},
      bar: [1, 0, 0, 1],
    })
  })
})
