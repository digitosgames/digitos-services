module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    // extends: [
    //     'eslint:recommended',
    //     'plugin:import/errors',
    //     'plugin:import/warnings',
    //     'plugin:import/typescript',
    //     'google',
    //     'plugin:@typescript-eslint/recommended',
    // ],
    // plugins: [
    //     '@typescript-eslint',
    //     'import',
    // ],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier
    ],
    plugins: ['@typescript-eslint', 'prettier'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: ['tsconfig.json', 'tsconfig.dev.json'],
        sourceType: 'module',
        tsconfigRootDir: __dirname,
    },
    ignorePatterns: [
        '/lib/**/*', // Ignore built files.
    ],
    rules: {
        // 'quotes': ['error', 'double'],
        'import/no-unresolved': 0,
        indent: ['error', 4],
        'object-curly-spacing': ['error', 'always'],
        'valid-jsdoc': 0,
        'require-jsdoc': 0,
        semi: 0,
        'max-len': ['error', { code: 120 }],
    },
};
