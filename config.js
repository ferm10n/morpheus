const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// default config
const config = {
  inoPath: null,
  additionalIncludes: [],
  cppPath: null,
  exePath: path.resolve('./a.out'),
  compileCommand: null,

  webpack: {
    mode: 'development',
    entry: path.join(__dirname, 'client/webpack-entry.js'),
    watch: true,
    plugins: [ new HtmlWebpackPlugin() ],
    devServer: {
      host: '0.0.0.0',
      port: 'auto',
      devMiddleware: {
        publicPath: '/',
        stats: 'minimal'
      },
      static: {
        directory: path.join(__dirname, 'client/public') // not used
      }
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [ 'style-loader', 'css-loader' ]
        }
      ]
    }
  }
};

module.exports = config;
