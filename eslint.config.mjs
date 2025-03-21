import antfu from '@antfu/eslint-config';
import perfectionist from 'eslint-plugin-perfectionist';

export default antfu({
  formatters: true,
  gitignore: true,
  jsonc: true,
  lessOpinionated: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: true
  },
  typescript: {
    overrides: {
      'no-use-before-define': 'off',
      'ts/consistent-type-definitions': ['error', 'type'],
      'ts/consistent-type-imports': [
        'error',
        {
          disallowTypeAnnotations: false,
          fixStyle: 'separate-type-imports',
          prefer: 'type-imports'
        }
      ],
      'ts/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_'
        }
      ],
      'ts/no-use-before-define': [
        'error',
        {
          classes: false,
          enums: false,
          functions: true,
          ignoreTypeReferences: true,
          typedefs: false,
          variables: true
        }
      ]
    }
  }
})
  .override('antfu/stylistic/rules', {
    rules: {
      'arrow-body-style': ['error', 'as-needed'],
      'style/arrow-parens': ['error', 'always'],
      'style/brace-style': ['error', '1tbs'],
      'style/comma-dangle': ['error', 'never'],
      'style/indent': [
        'error',
        2,
        {
          flatTernaryExpressions: true,
          offsetTernaryExpressions: true,
          SwitchCase: 1
        }
      ],
      'style/no-multiple-empty-lines': ['error', { max: 1 }],
      'style/operator-linebreak': [
        'error',
        'after',
        {
          overrides: { ':': 'before', '?': 'before' }
        }
      ],
      'style/quote-props': ['error', 'as-needed']
    }
  })
  .override('antfu/perfectionist/setup', {
    rules: {
      ...(perfectionist.configs['recommended-alphabetical'].rules ?? {}),
      'perfectionist/sort-exports': [
        'error',
        {
          groupKind: 'types-first',
          ignoreCase: true,
          order: 'asc',
          type: 'alphabetical'
        }
      ],
      'perfectionist/sort-imports': [
        'error',
        {
          environment: 'bun',
          groups: [
            'style',
            'internal-type',
            ['parent-type', 'sibling-type', 'index-type'],
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'unknown'
          ],
          ignoreCase: true,
          internalPattern: ['\\@dbfg\\/+'],
          maxLineLength: undefined,
          newlinesBetween: 'always',
          order: 'asc',
          type: 'alphabetical'
        }
      ],
      'perfectionist/sort-modules': ['error', { partitionByNewLine: true }],
      'perfectionist/sort-object-types': [
        'error',
        {
          customGroups: { callbacks: 'on*' },
          groupKind: 'required-first',
          groups: ['unknown', 'callbacks', 'multiline'],
          ignoreCase: true,
          order: 'asc',
          partitionByNewLine: true,
          type: 'alphabetical'
        }
      ]
    }
  });
