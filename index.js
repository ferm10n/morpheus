const defaultConfig = require('./config');
const merge = require('lodash.merge');
const morpheus = require('./morpheus');
const glob = require('glob');

/**
 * @param {Partial<typeof defaultConfig>} config
 */
module.exports = function (config = {}) {
  const mergedConfig = merge(defaultConfig, config);
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
