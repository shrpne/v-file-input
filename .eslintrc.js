// module.exports = {
//   root: true,
//   parser: 'babel-eslint',
//   parserOptions: {
//     sourceType: 'module'
//   },
//   extends: [
//     'plugin:vue/essential'
//   ],
//   // add your custom rules here
//   'rules': {
//     "indent": ["error", 4, { "SwitchCase": 1 }],
//     // allow async-await
//     'generator-star-spacing': 0,
//     // allow debugger during development
//     'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
//   },
//   // required to lint *.vue files
//   plugins: [
//     'vue'
//   ],
//   globals: {
//     requestAnimationFrame: true,
//     performance: true
//   }
// }

module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/essential'
  ],
  // required to lint *.vue files
  plugins: [
    'vue'
  ],
  // add your custom rules here
  'rules': {
    // "indent": ["error", 4, { "SwitchCase": 1 }],
    semi: ["error", "always", { "omitLastInOneLineBlock": false}],
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    // vue
    "vue/script-indent": ["error", 4, {
      "baseIndent": 1,
      "switchCase": 1,
      "ignores": []
    }],
  },
  globals: {
    requestAnimationFrame: true,
    performance: true
  }
}
