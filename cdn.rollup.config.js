import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const plugins = [nodeResolve({ browser: true }), commonjs(), terser()];

export default [
  {
    input: './browser/index.mjs',
    output: [
      {
        file: './browser/lc.min.js',
        format: 'umd',
        name: 'LC',
      },
    ],
    plugins,
  },
  {
    input: './core/browser.mjs',
    output: [
      {
        file: './browser/core.min.js',
        format: 'umd',
        name: 'LC',
      },
    ],
    plugins,
  },
  {
    input: './auth/dist/index.mjs',
    output: [
      {
        file: './browser/auth.min.js',
        format: 'umd',
        name: 'LC',
      },
    ],
    plugins,
  },
];
