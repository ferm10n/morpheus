const defaultConfig = require('./config');
const mergeWith = require('lodash.mergewith');
const morpheus = require('./morpheus');
const glob = require('glob');

/**
 * @param {Partial<typeof defaultConfig>} config
 */
module.exports = function (config = {}) {
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
  if (!mergedConfig.compileCommand) {
    mergedConfig.compileCommand = `g++ -I . -I ${__dirname} ${mergedConfig.cppPath} -std=c++11 -o ${mergedConfig.exePath}`;
  }

  return morpheus(mergedConfig);
};
