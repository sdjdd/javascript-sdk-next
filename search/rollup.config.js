import ts from '@wessberg/rollup-plugin-ts';

export default [
  {
    input: 'search/src/index.ts',
    output: [
      {
        dir: 'search/dist',
        format: 'cjs',
        entryFileNames: 'index.cjs.js',
      },
      {
        dir: 'search/dist',
        format: 'esm',
        entryFileNames: 'index.esm.js',
      },
    ],
    plugins: [ts({ tsconfig: 'search/tsconfig.json' })],
  },
];
