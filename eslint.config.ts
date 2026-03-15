import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'services/**/node_modules/**',
      'services/**/dist/**',
      'infrastructure/monitoring/grafana/dashboards/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['services/backend/src/**/*.ts', 'services/backend/prisma.config.ts'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['services/frontend/src/**/*.ts', 'services/frontend/src/**/*.tsx', 'services/frontend/vite.config.ts'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  eslintConfigPrettier
];
