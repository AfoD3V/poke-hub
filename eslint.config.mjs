import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      'server/drizzle/**',
      'resources/**',
      'ui-svelte/**',
    ],
  },

  // JS baseline
  js.configs.recommended,

  // TypeScript — server, shared
  {
    files: ['server/src/**/*.ts', 'shared/**/*.ts'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'no-undef': 'off', // TypeScript handles this
    },
  },

  // React / Next.js (ui/src/**/*.{ts,tsx})
  {
    files: ['ui/src/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.browser },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
  },
]
