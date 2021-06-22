import ts from '@wessberg/rollup-plugin-ts';

export default [
  {
    input: './src/index.ts',
    output: {
      dir: './dist',
      format: 'cjs',
    },
    plugins: [ts()],
    external: ['debug'],
  },
];
