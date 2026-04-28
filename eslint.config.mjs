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
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    rules: {
      ...(perfectionist.configs['recommended-alphabetical'].rules ?? {}),
      'perfectionist/sort-exports': [
        'error',
        {
          groups: ['type-export', 'value-export'],
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
            'type-internal',
            ['type-parent', 'type-sibling', 'type-index'],
            ['type-builtin', 'type-external', 'value-builtin', 'value-external'],
            'value-internal',
            ['value-parent', 'value-sibling', 'value-index'],
            'unknown'
          ],
          ignoreCase: true,
          internalPattern: ['\\@dbfg\\/+'],
          newlinesBetween: 1,
          order: 'asc',
          type: 'alphabetical'
        }
      ],
      'perfectionist/sort-modules': ['error', { partitionByNewLine: true }],
      'perfectionist/sort-object-types': [
        'error',
        {
          customGroups: [
            { elementNamePattern: '^on.*', groupName: 'callbacks' },
            { groupName: 'multiline', modifiers: ['multiline'] }
          ],
          groups: ['unknown', 'callbacks', 'multiline'],
          ignoreCase: true,
          order: 'asc',
          partitionByNewLine: true,
          type: 'alphabetical'
        }
      ]
    }
  });
