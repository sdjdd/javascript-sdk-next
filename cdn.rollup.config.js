import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'browser/index.js',
    output: [
      {
        file: 'browser/lc.min.js',
        format: 'umd',
        name: 'LC',
      },
    ],
    plugins: [nodeResolve({ browser: true }), commonjs(), terser()],
  },
];
