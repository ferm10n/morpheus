const defaultConfig = require('./config');
const mergeWith = require('lodash.mergewith');
const morpheus = require('./morpheus');
const glob = require('glob');
const path = require('path');

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
  if (mergedConfig.additionalIncludes.length === 0) {
    mergedConfig.additionalIncludes.concat(glob.sync(path.resolve(__dirname, './mocks')));
  }
  if (!mergedConfig.compileCommand) {
    mergedConfig.compileCommand = `g++ -I ${path.resolve()} -I ${__dirname} ${mergedConfig.cppPath} -std=c++11 -o ${mergedConfig.exePath}`;
  }

  return morpheus(mergedConfig);
};
