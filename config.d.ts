import { Configuration as WebpackConfig } from 'webpack';
import { Configuration as WebpackDevServerConfig } from 'webpack-dev-server';

export type LedOutputConfig = {
  /** XYZ for each LED */
  coords: [
    [ number, number, number ]
  ],
};

export type MorpheusConfig = {
  outputs?: {
    [ outputName: string ]: LedOutputConfig
  },
  /**
   * Path to .ino sketch file.
   * morpheus will try to automatically find and use the first .ino it sees in the project dir
   * @example '~/strandtest/strandtest.ino'
   */
  inoPath?: string,
  /**
   * Other source files/folders involved in the .ino project.
   * They will be automatically injected into the sketch, replacing the `// MORPHEUS-INCLUDES-ANCHOR//`
   *
   * These will have fs watchers attached to them so they recompile when changes are made.
   * @default [ '<morpheus-path>/morpheus-mocks' ]
   */
  additionalIncludes?: string[],
  /**
   * The .ino will be copied to a .cpp. `cppPath` stores the path to write this cpp file to.
   * @type {string}
   * @example '~/strandtest/strandtest.cpp'
   */
  cppPath?: string,
  /**
   * Path to compile and run the exe from
   * @example '~/strandtest/a.out'
   */
  exePath?: string,
  /**
   * The shell command used to compile the .cpp
   * @type {string}
   * @example 'g++ -I ~/strandtest ~/strandtest/strandtest.cpp -std=c++11 -o ~/strandtest/a.out'
   */
  compileCommand?: string,
  /**
   * @type {import('webpack').Configuration & { devServer: import('webpack-dev-server').Configuration }}
   */
  webpack?: WebpackConfig & { devServer: WebpackDevServerConfig },
}

export default MorpheusConfig;