import ts from '@wessberg/rollup-plugin-ts';

export default [
  {
    input: 'database/src/index.ts',
    output: [
      {
        dir: 'database/dist',
        format: 'cjs',
        entryFileNames: 'index.cjs.js',
      },
      {
        dir: 'database/dist',
        format: 'esm',
        entryFileNames: 'index.esm.js',
      },
    ],
    plugins: [ts({ tsconfig: 'database/tsconfig.json' })],
    external: ['lodash'],
  },
];
