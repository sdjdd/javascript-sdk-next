import ts from '@wessberg/rollup-plugin-ts';

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
    plugins: [ts()],
    external: ['uuid'],
  },
];
