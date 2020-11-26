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
      io.attach(listeningWds.listeningApp);
    };
    const wds = new WebpackDevServer(compiler, config.webpack.devServer);
    wds.listen(config.webpack.devServer.port, config.webpack.devServer.host);
  },
  io
};
