import eslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const config = [
  {
    // Global configuration
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  {
    // TypeScript files configuration
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest' as const,
        sourceType: 'module' as const,
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': eslint,
      prettier: prettierPlugin,
    },
    rules: {
      // Prettier
      'prettier/prettier': 'error',

      // TypeScript
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Include recommended rules
      ...eslint.configs.recommended.rules,
      ...prettier.rules,
    },
  },
  {
    // JavaScript files configuration (for config files)
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest' as const,
      sourceType: 'module' as const,
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      ...prettier.rules,
    },
  },
] as const;

export default config;
