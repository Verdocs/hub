import { config } from '@verdocs/eslint-config/react-internal';
import verdocsLocal from '../../eslint-local.mjs';

export default [
  ...config,
  {
    plugins: { verdocs: verdocsLocal },
    rules: {
      'verdocs/no-non-ascii': 'error',
      'react/function-component-definition': [
        'error',
        { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: [ 'FC', 'FunctionComponent' ],
              message: 'Components are function declarations with typed props objects. See docs/standards/react.md rule 1.',
            },
          ],
        },
      ],
    },
  },
];
