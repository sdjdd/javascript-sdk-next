import ts from '@wessberg/rollup-plugin-ts';
import json from '@rollup/plugin-json';

export default [
  {
    input: './src/index.ts',
    output: [
      {
        dir: './dist',
        format: 'cjs',
        entryFileNames: 'index.js',
      },
      {
        dir: './dist',
        format: 'esm',
        entryFileNames: 'index.mjs',
      },
    ],
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
