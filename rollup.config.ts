// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'cjs',
    sourcemap: true
  },

  // See baml-native-modules/README.md for more details
  external: [
    '@boundaryml/baml-darwin-arm64',
    '@boundaryml/baml-darwin-x64',
    '@boundaryml/baml-linux-arm64-gnu',
    '@boundaryml/baml-linux-arm64-musl',
    '@boundaryml/baml-linux-x64-gnu',
    '@boundaryml/baml-linux-x64-musl',
    '@boundaryml/baml-win32-x64-msvc'
  ],
  plugins: [typescript(), nodeResolve({ preferBuiltins: true }), commonjs()]
}

export default config
