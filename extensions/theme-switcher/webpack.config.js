var webpack = require('webpack');

module.exports = {
  entry: './out/index.js',
  target: 'electron-renderer',
  node: { __filename: false, __dirname: false },
  output: {
    libraryTarget: 'commonjs2',
    library: 'theme-switcher',
    filename: './dist/index.js'
  },
  module: {
    loaders: [
      { test: /\.json?$/, loader: 'json-loader' },
    ]
  },
  resolve: { extensions: ['', '.js', '.jsx', '.json'] },
  _plugins: [
    new webpack.optimize.UglifyJsPlugin(
        { compress: { warnings: false }, comments: false, sourceMap: false })
  ],
  devtool: 'source-map',
  externals: [
    'bluebird',
    'ffi',
    'font-manager',
    './font-manager',
    'fs',
    'fs-extra-promise',
    'immutability-helper',
    'path',
    'net',
    'nmm-api',
    'node',
    'nbind',
    'react',
    'react-act',
    'react-bootstrap',
    'react-i18next',
    'react-layout-pane',
    'react-redux',
    'ref',
    'util'
  ]
};
