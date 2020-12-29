import ts from '@wessberg/rollup-plugin-ts';
import cjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'live-query/src/index.ts',
    output: [
      {
        dir: 'live-query/dist',
        format: 'cjs',
        entryFileNames: 'index.cjs.js',
      },
      {
        dir: 'live-query/dist',
        format: 'esm',
        entryFileNames: 'index.esm.js',
      },
    ],
    plugins: [ts({ tsconfig: 'live-query/tsconfig.json' }), cjs()],
    external: ['eventemitter3', 'leancloud-realtime/core', 'leancloud-realtime-plugin-live-query'],
  },
];
