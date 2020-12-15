import ts from '@wessberg/rollup-plugin-ts';

export default [
  {
    input: 'auth/src/index.ts',
    output: [
      {
        dir: 'auth/dist',
        format: 'cjs',
        entryFileNames: 'index.cjs.js',
      },
      {
        dir: 'auth/dist',
        format: 'esm',
        entryFileNames: 'index.esm.js',
      },
    ],
    plugins: [ts({ tsconfig: 'auth/tsconfig.json' })],
    external: ['uuid'],
  },
];
