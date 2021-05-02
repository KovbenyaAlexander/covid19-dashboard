module.exports = {
  extends: ['airbnb'],
  parser: 'babel-eslint',
  rules: {
    'no-unused-vars': 'warn',
    'max-len': ['error', { code: 200 }],
    'no-param-reassign': [2, { props: false }],
  },
  env: {
    es6: true,
    browser: true,
    node: true,
  },
};
