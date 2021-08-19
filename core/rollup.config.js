import ts from '@wessberg/rollup-plugin-ts';
import json from '@rollup/plugin-json';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.js',
      format: 'cjs',
    },
    plugins: [ts(), json()],
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
