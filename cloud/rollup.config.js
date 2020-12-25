import ts from '@wessberg/rollup-plugin-ts';

export default [
  {
    input: 'cloud/src/index.ts',
    output: [
      {
        dir: 'cloud/dist',
        format: 'cjs',
        entryFileNames: 'index.cjs.js',
      },
      {
        dir: 'cloud/dist',
        format: 'esm',
        entryFileNames: 'index.esm.js',
      },
    ],
    plugins: [ts({ tsconfig: 'cloud/tsconfig.json' })],
    external: ['lodash/pick'],
  },
];
