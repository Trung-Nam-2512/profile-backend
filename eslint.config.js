import eslint from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tseslintparser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslintparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-namespace': 'off'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.js', 'src/test/**']
  }
]