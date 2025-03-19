// @see https://dev.to/devidev/setting-up-eslint-9130-with-prettier-typescript-vuejs-and-vscode-autosave-autoformat-n0

import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';

/**# @type {import('eslint').Linter.Config[]} */
const config = tseslint.config(
    {
        ignores: [
            '**/*.d.ts',
            "build/**",
            "demo/**",
            "dist/**",
            "node_modules/**",
        ],
    },
    // js
    pluginJs.configs.recommended,
    // ts, vue
    {
        extends: [
            ...tseslint.configs.strict,
            ...tseslint.configs.stylistic,
            ...pluginVue.configs['flat/recommended'],
        ],
        files: ['**/*.{ts,vue}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                parser: tseslint.parser,
            },
        },
        rules: {
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/prefer-for-of': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-misused-new': 'error',
            '@typescript-eslint/no-namespace': 'error',
            '@typescript-eslint/no-extra-non-null-assertion': 'error',

            'vue/html-closing-bracket-spacing': 0,
            'vue/html-indent': ['error', 4],
            'vue/no-v-html': 0,
        },
    },
    // js rules override
    {
        rules: {
            indent: ['error', 4, { SwitchCase: 1 }],
            semi: ["error", "always"],
            "comma-dangle": ["error", "always-multiline"],
            "arrow-parens": ["error", "always"],
            "space-before-function-paren": ["error", {
                anonymous: "never",
                named: "never",
                asyncArrow: "always",
            }],
            'max-len': ['off'],
            'no-param-reassign': ['off'],
            'no-use-before-define': ['off'],
            'no-unused-vars': 'off',
            'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
            // allow let
            'prefer-const': 'off',
            // allow extension in imports
            // 'import/extensions': ['error', 'always'],
            'prefer-object-spread': 'off',
        },
    },
    // {
    //     files: ['*.vue', '**/*.vue'],
    //     rules: {
    //         indent: 0,
    //         "vue/script-indent": ["error", 4, {
    //             "baseIndent": 0,
    //             "switchCase": 1,
    //             "ignores": [],
    //         }],
    //     },
    // },
);

export default config;
