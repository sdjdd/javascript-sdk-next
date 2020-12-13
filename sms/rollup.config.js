import ts from '@wessberg/rollup-plugin-ts';

export default [
  {
    input: 'sms/src/index.ts',
    output: [
      {
        dir: 'sms/dist',
        format: 'cjs',
        entryFileNames: 'index.cjs.js',
      },
      {
        dir: 'sms/dist',
        format: 'esm',
        entryFileNames: 'index.esm.js',
      },
    ],
    plugins: [ts({ tsconfig: 'sms/tsconfig.json' })],
  },
];
