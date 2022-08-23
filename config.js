const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// default config
const config = {
  /**
   * Path to .ino sketch file.
   * morpheus will try to automatically find and use the first .ino it sees in the project dir
   * @example '~/strandtest/strandtest.ino'
   */
  inoPath: null,
  /**
   * Other source files/folders involved in the .ino project.
   * They will be automatically injected into the sketch, replacing the `// MORPHEUS-INCLUDES-ANCHOR//`
   *
   * These will have fs watchers attached to them so they recompile when changes are made.
   * @default [ '<morpheus-path>/morpheus-mocks' ]
   */
  additionalIncludes: [
    // path.resolve('file1'),
    // path.resolve('file2'),
  ],
  /**
   * The .ino will be copied to a .cpp. `cppPath` stores the path to write this cpp file to.
   * @type {string}
   * @example '~/strandtest/strandtest.cpp'
   */
  cppPath: null,
  /**
   * Path to compile and run the exe from
   * @example '~/strandtest/a.out'
   */
  exePath: path.resolve('./a.out'),
  /**
   * The shell command used to compile the .cpp
   * @type {string}
   * @example 'g++ -I ~/strandtest ~/strandtest/strandtest.cpp -std=c++11 -o ~/strandtest/a.out'
   */
  compileCommand: null,

  /**
   * @type {import('webpack').Configuration & { devServer: import('webpack-dev-server').Configuration }}
   */
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
