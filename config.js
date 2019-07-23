const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const merge = require('lodash.merge');

// default config
const config = {
  /**
   * Path to .ino file
   */
  inoPath: path.resolve('strandtest.ino'),
  /**
   * Other source files involved in the .ino project.
   * These will have fs watchers attached to them so they recompile when changes are made.
   */
  otherSourceFiles: [
    // path.resolve('file1'),
    // path.resolve('file2'),
    path.resolve(__dirname, 'Adafruit_NeoPixel_Mock.h')
  ],
  /**
   * The .ino will be copied to a .cpp. Stores the path of this
   */
  cppPath: null,
  /**
   * Path to compile and run the exe from
   */
  exePath: path.resolve('./a.out'),
  /**
   * The shell command used to compile the .cpp
   */
  compileCommand: null
};
config.cppPath = config.inoPath.replace(/(\.ino)$/, '.cpp');
config.compileCommand = `g++ -I . -I ${__dirname} ${config.cppPath} -std=c++11 -o ${config.exePath}`;

const userConfigPath = path.resolve('morpheus-config.js');
if (fs.existsSync(userConfigPath)) {
  merge(config, require(userConfigPath));
}

module.exports = config;