import ts from '@wessberg/rollup-plugin-ts';
import json from '@rollup/plugin-json';

export default [
  {
    input: 'core/src/index.ts',
    output: [
      {
        dir: 'core/dist',
        format: 'cjs',
        entryFileNames: 'index.cjs.js',
      },
      {
        dir: 'core/dist',
        format: 'esm',
        entryFileNames: 'index.esm.js',
      },
    ],
    plugins: [ts({ tsconfig: 'core/tsconfig.json' }), json()],
    external: [
      'eventemitter3',
      'lodash/clone',
      'lodash/isEmpty',
      'lodash/isPlainObject',
      'lodash/isUndefined',
      'lodash/mapValues',
      'lodash/omit',
      'lodash/omitBy',
      'lodash/trimStart',
    ],
  },
];
