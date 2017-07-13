module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  extends: 'airbnb-base',
  plugins: [
  ],
  env: {
    browser: true,
    node: true
  },
  'settings': {
    'import/resolver': 'node'
  },
  // add your custom rules here
  'rules': {
    // don't require .vue extension when importing
    'import/extensions': ['error', 'always', {
      'js': 'never',
      'vue': 'never'
    }],
    'import/no-extraneous-dependencies': ['error', {
      'devDependencies': [ '**/*.test.js' ]
    }],
    'no-param-reassign': ['error', { props: false }],
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'max-len': 0,
    'import/prefer-default-export': 0
  }
}