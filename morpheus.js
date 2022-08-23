const { execSync, spawn } = require('child_process');
const chokidar = require('chokidar');
const fs = require('fs');
const chalk = require('chalk');
const assert = require('assert');
const { glob } = require('glob');
const morpheusServer = require('./server');

/** @typedef {import('./config')} Config */

class DataSegment {
  /**
   * @param {{id: number, name: string, length: number}}
   */
  constructor ({ id, name, length }) {
    this.id = id;
    this.name = name;
    this.buffer = new Uint8Array(length);
  }
}

/**
 * @param {Config} config
 */
module.exports = function morpheus (config) {
  /**
   * @type {import('child_process').ChildProcess}
   * The spawned executable
   */
  let cp = null;

  /**
   * @typedef {number} segmentId
   * @typedef {Map<segmentId, DataSegment>} DataSegmentMap
   * @property {number} expectedSize - the size of this object when it will have all segments enumerated.
   */

  /**
   * @type {DataSegmentMap}
   * Data segments from the child process to be sent to client
   */
  let outputs = new Map();

  /**
   * @type {DataSegmentMap}
   * Data segments from the client to be sent to the child process
   */
  let inputs = new Map();

  /**
   * Compiles the emulator and starts the child process.
   */
  async function compileAndRun () {
    try {
      // copy ino to cpp, making modifications
      const inoSource = fs.readFileSync(config.inoPath, 'utf-8');
      /** additional includes, but expanding directories */
      const morpheusIncludes = [];
      for (const additionalInclude of config.additionalIncludes) {
        const includeStat = fs.statSync(additionalInclude);
        if (includeStat.isDirectory()) {
          morpheusIncludes.push(...glob.sync(`${additionalInclude}/**/*.[h,cpp]`));
        } else {
          morpheusIncludes.push(additionalInclude);
        }
      }
      fs.writeFileSync(
        config.cppPath,
        inoSource.replace('// MORPHEUS-INCLUDES-ANCHOR //', morpheusIncludes.map(i => `#include <${i}>`).join('\n'))
      );

      // make sure the exe is not running before compiling
      await new Promise((resolve) => {
        if (!cp) { // if it is not running, proceed immediate
          resolve();
        } else {
          // stop the exe
          console.log('Stopping exe before compiling');
          cp.removeAllListeners('close'); // remove the current close handler (if any)
          const forceKill = setTimeout(() => {
            console.log(chalk.red('EXE UNRESPONSIVE. SENDING SIGKILL'));
            cp.kill('SIGKILL');
            resolve();
          }, 3000);
          cp.on('close', () => {
            clearTimeout(forceKill);
            resolve();
          }); // proceed once it is closed
          cp.kill('SIGINT');
        }
      });

      console.log(chalk.blue('compiling sketch...'));
      execSync(config.compileCommand);
      console.log(chalk.green('sketch compiler finished.'));

      // const outputStream = new Writable();
      cp = spawn(config.exePath, {
        stdio: ['ignore', 'pipe', process.stderr]
      });

      processStream(cp.stdout).catch(err => {
        console.error(chalk.red('stream interrupted'), err);
      });
    } catch (err) {
      console.error(chalk.red('compiling sketch failed!'));
      console.error(chalk.yellow('Waiting for changes before trying to compile again.'));

      if (!err.stderr || !err.stderr.toString().length === 0) { // only show error if the compiler didn't show an error
        console.error(err);
      }
    }
  }

  async function processStream (cpStream) {
    cp.stdout.pause();
    console.assert(cp.stdout.isPaused(), 'stream is paused');
    console.assert(cp.stdout.readable, 'reading is allowed');

    // reset variables
    outputs = new Map();
    inputs = new Map();

    // determine how many outputs
    let expectedOutputs = parseInt(await bufferStreamUntilNewline(cpStream));
    console.log('# of outputs:', expectedOutputs);
    assert.ok(expectedOutputs >= 0);

    // determine properties of outputs
    for (let i = 0; i < expectedOutputs; i++) {
      // format: <stripName>:<length>
      const outputProperties = (await bufferStreamUntilNewline(cpStream)).toString().split(':');

      const ds = new DataSegment({
        id: i,
        name: outputProperties[0],
        length: parseInt(outputProperties[1])
      });

      console.log('new output:', ds);
      assert.ok(ds.name.length > 0);
      assert.ok(typeof ds.buffer.length === 'number');
      outputs.set(outputs.size, ds);
    }

    // determine how many inputs
    let expectedInputs = parseInt(await bufferStreamUntilNewline(cpStream));
    console.log('# of inputs:', expectedInputs);
    assert.ok(expectedInputs >= 0);

    // determine properties of inputs
    for (let i = 0; i < expectedInputs; i++) {
      // format: <inputType>:<inputName>
      // const inputProperties = (await bufferStreamUntilNewline(cpStream)).toString().split(':');

      console.log('skipping input setup');
    }

    async function routine () {
      // get properties of next data segment
      // format: <outputId>:<startIdx>:<stopIdx>
      const segmentProperties = (await bufferStreamUntilNewline(cpStream)).toString().split(':');
      const segmentId = parseInt(segmentProperties[0]);
      const startIdx = parseInt(segmentProperties[1]);
      const stopIdx = parseInt(segmentProperties[2]);
      const segmentLength = stopIdx - startIdx;

      const segmentData = await bufferStreamUntil(cpStream, buffer => {
        return buffer.length === segmentLength;
      });

      const segmentPayload = {
        id: segmentId,
        startIdx,
        buffer: new Uint8Array(segmentData).buffer // socket.io can only send ArrayBuffer type
      };
      morpheusServer.io.sockets.emit('data-segment', segmentPayload);
      outputs.get(segmentId).buffer.set(segmentData, startIdx); // save
      // console.log('data-segment', segmentId, segmentData);

      setImmediate(routine);
    }
    setImmediate(routine);
  }

  /**
   * @param {import('stream').Readable} stream
   * @param {testCb} testCb - function called the buffer to test completion
   * @returns {Promise<Buffer>}
   * @callback testCb - returns true if buffer meets completion condition
   * @param {Buffer} b
   * @returns {Boolean}
   */
  function bufferStreamUntil (stream, testCb) {
    let b = Buffer.from(''); // start with empty buffer

    return new Promise((resolve, reject) => {
      onReadable();

      function onReadable () {
        let chunk = null;
        while ((chunk = stream.read(1)) !== null) { // character cruncher loop
          b = Buffer.concat([b, chunk], b.length + 1);
          if (testCb(b)) {
            done();
            return; // escape character cruncher loop
          }
        }
        stream.once('readable', onReadable); // must have gotten a null chunk. await new data.
      }

      function onError (err) {
        reject(err);
      }

      function onEnd () {
        onError(new Error('test callback never returned true!'));
      }

      function done (err) {
        stream.removeListener('end', onEnd);
        stream.removeListener('error', onError);
        stream.removeListener('readable', onReadable);

        if (err) {
          reject(err);
        } else {
          resolve(b);
        }
      }
    });
  }

  function bufferStreamUntilNewline (stream) {
    return bufferStreamUntil(stream, buffer => {
      return String.fromCharCode(buffer[buffer.length - 1]) === '\n';
    });
  }

  /**
   * a function for sending declared outputs to sockets.
   * @param {import('socket.io').Socket} [socket] - if specified, only send to this socket
   */
  function sendOutputs (socket) {
    const payload = [];
    for (let [id, ds] of outputs) {
      payload.push({
        id,
        name: ds.name,
        buffer: ds.buffer.buffer
      });
    }

    const target = socket || morpheusServer.io.sockets;
    target.emit('outputs', payload);
    console.log(chalk.blue('sending new outputs'), payload);
  }

  return {
    config,
    init () {
      // Attach watchers to source files
      const watcher = chokidar.watch([
        config.inoPath,
        ...config.additionalIncludes
      ]);
      watcher.on('change', compileAndRun);

      // initial compile
      compileAndRun();

      morpheusServer.init(config);
      morpheusServer.io.on('connect', socket => {
        // when a socket connects, set up event bindings
        socket.on('get-outputs', () => sendOutputs(socket));
      });
    }
  };
};
