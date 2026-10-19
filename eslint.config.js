import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
import a11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.ssr/**',
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'public/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': hooks,
      'react-refresh': refresh,
      'jsx-a11y': a11y,
    },
    rules: {
      ...hooks.configs.recommended.rules,
      ...a11y.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'jsx-a11y/anchor-is-valid': [
        'error',
        { components: ['Link'], specialLink: ['to'] },
      ],
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['group'] }],
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
    },
  },
);
