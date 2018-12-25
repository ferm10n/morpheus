// IMPORTED MODULES
const path = require('path');
const { execSync, spawn } = require('child_process');
const watch = require('node-watch');
const fs = require('fs');
const express = require('express');
const http = require('http');
const app = express();
const SocketIO = require('socket.io');
const chalk = require('chalk');
const assert = require('assert');

// hey there, I've been experimenting a lot with JSDoc documentation for types and whatnot.
// It might looks really different to what you might be used to, but the idea is that
// it can self document itself pretty well, while also giving your IDE hints to what is actually
// going on. I might be going a bit overboard on the typedefs, so sorry if it's overwhelming!
// just trying this out

const config = {
  /**
   * Path to .ino file
   */
  inoPath: path.resolve('./strandtest.ino'),
  /**
   * Other source files involved in the .ino project.
   * These will have fs watchers attached to them so they recompile when changes are made.
   */
  otherSourceFiles: [
    // path.resolve('file1'),
    // path.resolve('file2'),
    path.resolve('./Adafruit_NeoPixel_Mock.h')
  ],
  /**
   * The .ino will be copied to a .cpp. Stores the path of this
   */
  cppPath: null,
  /**
   * Path to compile and run the exe from
   */
  exePath: path.resolve('./a.out'),
  /**
   * The shell command used to compile the .cpp
   */
  compileCommand: null
};
config.cppPath = config.inoPath.replace(/(\.ino)$/, '.cpp');
config.compileCommand = `g++ -I . ${config.cppPath} -std=c++11 -o ${config.exePath}`;

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

const server = http.createServer(app);

const io = new SocketIO(server);

const PORT = 8080;

/**
 * Compiles the emulator and starts the child process.
 */
async function compileAndRun () {
  try {
    // copy ino to cpp
    fs.copyFileSync(config.inoPath, config.cppPath);

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

    console.log(chalk.blue('compiling...'));
    execSync(config.compileCommand);
    console.log(chalk.green('compiler finished.'));

    // const outputStream = new Writable();
    cp = spawn(config.exePath, {
      stdio: ['ignore', 'pipe', process.stderr]
    });

    processStream(cp.stdout).catch(err => {
      console.error(chalk.red('stream interrupted'), err);
    });
  } catch (err) {
    console.error(chalk.red('compile failed!'));
    console.error(chalk.yellow('Waiting for changes before trying to compile again.'));

    if (!err.stderr || !err.stderr.toString().length === 0) { // only show error if the compiler didn't show an error
      console.error(err);
    }
  }
}

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

async function processStream (cpStream) {
  cp.stdout.pause();
  console.assert(cp.stdout.isPaused(), 'stream is paused');
  console.assert(cp.stdout.readable, 'reading is allowed');

  // reset variables
  outputs = new Map();
  inputs = new Map();

  // determine how many outputs
  outputs.expectedSize = parseInt(await bufferStreamUntilNewline(cpStream));
  console.log('# of outputs:', outputs.expectedSize);
  assert.ok(outputs.expectedSize >= 0);

  // determine properties of outputs
  for (let i = 0; i < outputs.expectedSize; i++) {
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
  inputs.expectedSize = parseInt(await bufferStreamUntilNewline(cpStream));
  console.log('# of inputs:', inputs.expectedSize);
  assert.ok(inputs.expectedSize >= 0);

  // determine properties of inputs
  for (let i = 0; i < inputs.expectedSize; i++) {
    // format: <inputType>:<inputName>
    // const inputProperties = (await bufferStreamUntilNewline(cpStream)).toString().split(':');

    console.log('skipping input setup');
  }

  while (true) {
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
    io.sockets.emit('data-segment', segmentPayload);
    outputs.get(segmentId).buffer.set(segmentData, startIdx); // save
    // console.log('data-segment', segmentId, segmentData);
  }
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

  const target = socket || io.sockets;
  target.emit('outputs', payload);
  console.log(chalk.blue('sending new outputs'), payload);
}

// Attach watchers to source files
watch([config.inoPath, ...config.otherSourceFiles], compileAndRun);
watch(path.resolve('./public'), { recursive: true }, () => {
  console.log(chalk.blue('signal-reload to client'))
  io.sockets.emit('signal-reload');
});

// initial compile
compileAndRun();

// start server:
app.use(express.static(path.join(__dirname, 'public'))); // serve files from public folder
const three = fs.readFileSync(require.resolve('three'));
app.get('/lib/three.js', (req, res) => {
  res.send(three);
  res.end();
});
server.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    throw err;
  }
  console.log('server listening on hostname 0.0.0.0 with port', PORT);
  console.log(`http://127.0.0.1:${PORT}`);
}); // start accepting connections!

io.on('connect', socket => {
  // when a socket connects, set up event bindings
  socket.on('get-outputs', () => sendOutputs(socket));
});
