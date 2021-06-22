import ts from '@wessberg/rollup-plugin-ts';
import cjs from '@rollup/plugin-commonjs';

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
    plugins: [ts(), cjs()],
    external: ['eventemitter3', 'leancloud-realtime/core', 'leancloud-realtime-plugin-live-query'],
  },
];
