import ts from '@wessberg/rollup-plugin-ts';

export default [
  {
    input: 'storage/src/index.ts',
    output: [
      {
        dir: 'storage/dist',
        format: 'cjs',
        entryFileNames: 'index.cjs.js',
      },
      {
        dir: 'storage/dist',
        format: 'esm',
        entryFileNames: 'index.esm.js',
      },
    ],
    plugins: [ts({ tsconfig: 'storage/tsconfig.json' })],
    external: ['base64-arraybuffer'],
  },
];
