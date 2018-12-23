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
const { Writable } = require('stream');

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
     * The .ino will be copied to a .cpp. Store the path of this
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

/**
 * @type {DataSegment}
 */
let activeDataSegment = null;

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
      } else { // stop the exe
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

    cp.stdout.on('data');
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

    /** @type {number} */
    this.startIdx = null;

    /** @type {number} */
    this.stopIdx = null;

    /**
         * the next idx expected to be EATED
         */
    this.nextIdx = null;
  }

  /**
     * @param {{startIdx: number, stopIdx: number}}
     * Prepares this data segment for receiving data for indices startIdx to stopIdx
     */
  activate ({ startIdx, stopIdx }) {
    this.startIdx = startIdx;
    this.stopIdx = stopIdx;
    this.nextIdx = this.startIdx; // reset tracker
  }

  /**
     * Processes incoming data. OMNOMNOM
     * "WHY IS THE BASE DATA UNIT FOR COMPUTERS CALLED A BYTE? BECAUSE ITS THE MOST DATA IT CAN CHEW ON AT A TIME!"
     * @param {Buffer} data
     */
  nom (data) {
    this.destination.buffer.set(data, this.nextIdx);
    this.nextIdx += data.length;

    if (this.full) {
      io.sockets.emit('data-segment', {
        id: this.id,
        startIdx: this.startIdx,
        buffer: this.stopIdx - this.startIdx // take the difference of positions to find the width
      });
    }
  }

  get full () {
    return this.nextIdx > this.ledStopIdx;
  }
}

/**
 * @param {Buffer} data - data from child process. called at least once for each line of output.
 */
function onCpData (data) {
  console.log('data', chalk.yellow(data.toString()));
  // we handle incoming data differently depending on application state.
  // each block here is a different state
  if (outputs.expectedSize === undefined) { // state: determining how many outputs from cp
    outputs.expectedSize = parseInt(data.toString());
  } else if (outputs.size < outputs.expectedSize) { // state: determining properties of outputs
    // outputCount will be 0 when all outputs are set up
    // line N,i: get name and buffer length of output i
    // format: <stripName>:<length>
    const outputProperties = data.toString().split(':');

    const ds = new DataSegment({
      id: outputs.size,
      name: outputProperties[0],
      length: parseInt(outputProperties[1])
    });

    outputs.set(outputs.size, ds);
  } else if (inputs.expectedSize === undefined) { // state: determining how many inputs into cp
    sendOutputs(); // since outputs have just been all declared, send them
    inputs.expectedSize = parseInt(data.toString());
  } else if (inputs.size < inputs.expectedSize) { // state: determining properties of inputs
    // not implemented
    inputs.set(inputs.size, {});
  } else if (!activeDataSegment) { // state: determining properties of next DataSegment
    // format: <stripId>:<ledStartIdx>:<ledStopIdx>
    const segmentProperties = data.toString().split(':');

    const ds = outputs.get(segmentProperties[0]);

    ds.activate({
      startIdx: segmentProperties[1],
      stopIdx: segmentProperties[2]
    });
    activeDataSegment = ds;
  } else {
    activeDataSegment.nom(data);

    if (activeDataSegment.full) {
      activeDataSegment = null;
    }
  }
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
      buffer: ds.buffer
    });
  }

  const target = socket || io.sockets;
  target.emit('outputs', payload);
  console.log(chalk.blue('sending new outputs', payload));
}

// Attach watchers to source files
watch([config.inoPath, ...config.otherSourceFiles], compileAndRun);

// initial compile
compileAndRun();

// start server

app.use(express.static(path.join(__dirname, 'public'))); // serve files from public folder
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
