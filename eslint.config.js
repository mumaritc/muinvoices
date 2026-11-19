import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
import refresh from 'eslint-plugin-react-refresh'
export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      '.tools',
      'output',
      'playwright-report',
      'test-results',
      'test-results-offline',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['scripts/*.mjs'], languageOptions: { globals: { console: 'readonly' } } },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    plugins: { 'react-hooks': hooks, 'react-refresh': refresh },
    rules: {
      ...hooks.configs.recommended.rules,
      // RHF subscriptions are intentional; React Compiler is not enabled.
      'react-hooks/incompatible-library': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['public/**/*.js'],
    languageOptions: {
      globals: { self: 'readonly', caches: 'readonly', fetch: 'readonly', URL: 'readonly' },
    },
  },
)
