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

  server: {
    /** the port for the server to attach to */
    port: 8080
  }
};

module.exports = config;
