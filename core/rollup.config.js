import ts from '@wessberg/rollup-plugin-ts';
import replace from '@rollup/plugin-replace';

import { version } from '../package.json';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.js',
      format: 'cjs',
    },
    plugins: [ts(), replace({ __buildVersion: version })],
    external: [
      'eventemitter3',
      'lodash/castArray',
      'lodash/clone',
      'lodash/isDate',
      'lodash/isEmpty',
      'lodash/isPlainObject',
      'lodash/isUndefined',
      'lodash/mapValues',
      'lodash/omit',
      'lodash/omitBy',
      'lodash/trimEnd',
      'lodash/trimStart',
    ],
  },
];
