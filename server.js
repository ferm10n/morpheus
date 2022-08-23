const SocketIO = require('socket.io');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server/lib/Server');

const io = new SocketIO();

module.exports = {
  /**
   * @param {typeof import('./config')} config
   */
  init (config) {
    const compiler = webpack(config.webpack);
    config.webpack.devServer.onListening = listeningWds => {
      io.attach(listeningWds.server);
    };
    const wds = new WebpackDevServer(config.webpack.devServer, compiler);
    wds.start(config.webpack.devServer.port, config.webpack.devServer.host).catch(err => {
      console.error('Failed to start Webpack Dev Server', err);
      process.exit(1);
    });
  },
  io
};
