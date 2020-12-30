module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'standard',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  overrides: [
    {
      files: [
        '**/*.test.js',
        '**/test.js',
      ],
      env: {
        jest: true,
      },
    },
  ],
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
  },
}
