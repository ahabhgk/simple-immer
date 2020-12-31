module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    'node': true,
  },
  'extends': [
    'google',
  ],
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module',
  },
  'rules': {
    'require-jsdoc': 'off',
    'semi': ['error', 'never', {'beforeStatementContinuationChars': 'always'}],
    'indent': ['error', 2],
    'no-invalid-this': 'off',
  },
}
