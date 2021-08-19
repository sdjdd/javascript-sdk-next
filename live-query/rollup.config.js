import ts from '@wessberg/rollup-plugin-ts';
import cjs from '@rollup/plugin-commonjs';

export default [
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.js',
      format: 'cjs',
    },
    plugins: [ts(), cjs()],
    external: ['eventemitter3', 'leancloud-realtime/core', 'leancloud-realtime-plugin-live-query'],
  },
];
