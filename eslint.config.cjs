module.exports = [
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    languageOptions: {
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: { project: ['./tsconfig.json'] }
    },
    plugins: { '@typescript-eslint': require('@typescript-eslint/eslint-plugin') },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
]
