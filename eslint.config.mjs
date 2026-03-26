import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const ignores = ['**/node_modules/**', '**/dist/**', '**/.expo/**', '**/.next/**', 'coverage/**'];

export default [
  {
    ignores,
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        afterAll: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        test: 'readonly',
        vi: 'readonly',
      },
    },
  },
  {
    rules: {
      'no-console': 'off',
    },
  },
];
