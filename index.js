const defaultConfig = require('./config');
const mergeWith = require('lodash.mergewith');
const morpheus = require('./morpheus');
const glob = require('glob');
const path = require('path');

/**
 * Gets the path to the morpheus mocks folder, relative to the project.
 */
function getRelativeMocksPath () {
  return path.relative(path.resolve(), path.join(__dirname, 'morpheus-mocks'));
}

module.exports = {
  /**
   * @param {Partial<typeof defaultConfig>} config
   */
  Morpheus (config = {}) {
    const mergedConfig = mergeWith({}, defaultConfig, config, (objValue, srcValue) => {
      if (objValue && objValue instanceof Array) {
        return objValue.concat(srcValue);
      }
    });
    if (!mergedConfig.inoPath) { // look for a .ino file
      mergedConfig.inoPath = glob.sync('*.ino')[0];
    }
    if (!mergedConfig.cppPath) {
      mergedConfig.cppPath = mergedConfig.inoPath.replace(/(\.ino)$/, '.cpp');
    }
    if (mergedConfig.additionalIncludes.length === 0) {
      mergedConfig.additionalIncludes.push(getRelativeMocksPath());
    }
    if (!mergedConfig.compileCommand) {
      mergedConfig.compileCommand = `g++ -I ${path.resolve()} ${mergedConfig.cppPath} -std=c++11 -o ${mergedConfig.exePath}`;
    }

    return morpheus(mergedConfig);
  },
  getRelativeMocksPath
};
