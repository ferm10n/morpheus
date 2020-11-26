const path = require('path');

// default config
const config = {
  /**
   * Path to .ino sketch file.
   * morpheus will try to automatically find and use the first .ino it sees in the project dir
   * @example '~/strandtest/strandtest.ino'
   */
  inoPath: null,
  /**
   * Other source files involved in the .ino project.
   * These will have fs watchers attached to them so they recompile when changes are made.
   */
  additionalIncludes: [
    // path.resolve('file1'),
    // path.resolve('file2'),
    path.resolve(__dirname, 'Adafruit_NeoPixel_Mock.h')
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
   * @example 'g++ -I . -I ~/strandtest ~/strandtest/strandtest.cpp -std=c++11 -o ~/strandtest/a.out'
   */
  compileCommand: null,

  server: {
    /** the port for the server to attach to */
    port: 8080
  }
};

module.exports = config;
