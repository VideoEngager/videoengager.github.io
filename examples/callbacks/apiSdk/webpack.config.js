
const path = require('path');

// webpack config
module.exports = {
  entry: {
    smartvideo: './dist/callback-sdk.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist', 'browser'),
    filename: '[name].js',
    libraryTarget: 'umd',
    clean: true,
    library: 'SmartVideoSdk'

  },
  mode: process.env.NODE_ENV || 'development',
  watch: process.env.NODE_ENV === 'development',
  watchOptions: {
    ignored: './node_modules/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx|ts)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
  // ...
};
