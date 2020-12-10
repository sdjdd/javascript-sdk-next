import ts from '@wessberg/rollup-plugin-ts';

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
    plugins: [ts({ tsconfig: 'core/tsconfig.json' })],
    external: ['lodash', 'eventemitter3'],
  },
];
