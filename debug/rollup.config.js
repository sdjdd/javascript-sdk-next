import ts from '@wessberg/rollup-plugin-ts';

export default [
  {
    input: 'debug/src/index.ts',
    output: {
      dir: 'debug/dist',
      format: 'cjs',
    },
    plugins: [ts({ tsconfig: 'debug/tsconfig.json' })],
    external: ['debug'],
  },
];
