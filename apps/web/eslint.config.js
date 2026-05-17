import js from '@eslint/js'
import { fixupPluginRules } from '@eslint/compat'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      'dist',
      'node_modules',
      '*.config.js',
      '*.config.ts',
      'vite.config.ts',
      'public/',
      'coverage/',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react: fixupPluginRules(react),
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      // Relaxed for existing codebase - to be tightened in Phase 2 cleanup
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-unused-vars': 'off', // Handled by TS rule
      'react/no-unknown-property': 'off', // Three.js props
      'react/no-unescaped-entities': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      // Disable React Compiler rules (v7 recommended adds these by default;
      // existing codebase was not compiled with React Compiler)
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off',
      'react-hooks/incompatible-library': 'off',
      'no-redeclare': 'off', // Allow function overloading patterns
      'no-undef': 'off', // TypeScript handles this
    },
  },
]
