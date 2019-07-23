const fs = require('fs');
const chalk = require('chalk');
const path = require('path');

const userConfigPath = path.resolve('morpheus-config.js');

// default config
let config = {
  /**
   * Path to .ino file
   */
  inoPath: path.resolve('./strandtest.ino'),
  /**
   * Other source files involved in the .ino project.
   * These will have fs watchers attached to them so they recompile when changes are made.
   */
  otherSourceFiles: [
    // path.resolve('file1'),
    // path.resolve('file2'),
    path.resolve('./Adafruit_NeoPixel_Mock.h')
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


// if (fs.existsSync(userConfigPath)) {
//   module.exports = require(userConfigPath);
// } else {
    
// }

// hey there, I've been experimenting a lot with JSDoc documentation for types and whatnot.
// It might looks really different to what you might be used to, but the idea is that
// it can self document itself pretty well, while also giving your IDE hints to what is actually
// going on. I might be going a bit overboard on the typedefs, so sorry if it's overwhelming!
// just trying this out

config.cppPath = config.inoPath.replace(/(\.ino)$/, '.cpp');
config.compileCommand = `g++ -I . ${config.cppPath} -std=c++11 -o ${config.exePath}`;

module.exports = config;