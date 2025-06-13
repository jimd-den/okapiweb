// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  {
    // Base ESLint recommended rules
    extends: [eslint.configs.recommended],
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
  },
  {
    // TypeScript specific rules
    extends: [...tseslint.configs.recommended],
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  {
    // Next.js specific rules (using the plugin directly)
    files: ['**/*.ts', '**/*.tsx'], // Apply to Next.js relevant files
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // example: '@next/next/no-html-link-for-pages': 'error'
    },
  },
  {
    // React specific rules
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Often not needed with Next.js/React 17+
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
  }
);
