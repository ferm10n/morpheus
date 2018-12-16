const path = require('path');
const { execSync, spawn } = require('child_process');
const watch = require('node-watch');
const fs = require('fs');

/**
 * Path to .ino file
 */
const inoPath = path.resolve('./strandtest.ino');
/**
 * Other source files involved in the .ino project. These will have fs watchers attached to them so they recompile when changes are made.
 */
const otherSourceFiles = [
    // path.resolve('file1'),
    // path.resolve('file2'),
    path.resolve('./Adafruit_NeoPixel_Mock.h')
];
/**
 * The .ino will be copied to a .cpp. Store the path of this
 */
const cppPath = inoPath.replace(/(\.ino)$/, '.cpp');
/**
 * Path to compile and run the exe from
 */
const exePath = path.resolve('./a.out');
/**
 * The shell command used to compile the .cpp
 */
const compileCommand = `g++ -I . ${cppPath} -std=c++11 -o ${exePath}`;

/**
 * @type {import('child_process').ChildProcess}
 * The spawned executable
 */
let cp = null;

/**
 * Compiles the emulator and starts the child process.
 */
async function compile () {
    try {
        // copy ino to cpp
        fs.copyFileSync(inoPath, cppPath);

        // make sure the exe is not running before compiling
        await new Promise((resolve) => {
            if (!cp) { // if it is not running, proceed immediate
                resolve();
                return;
            } else { // stop the exe
                console.log('Stopping exe before compiling');
                cp.off('close'); // remove the current close handler
                cp.on('close', resolve); // proceed once it is closed
                cp.kill('SIGINT');
            }
        });

        console.log('compiling...');
        execSync(compileCommand);
        console.log('compiler finished.');
    } catch (err) {
        console.error('compile failed!');
        console.error('Waiting for changes before trying to compile again.');
        if (!err.stderr.toString().length === 0) { // only show error if the compiler didn't show an error
            console.error(err);
        }
    }
}

function runExecutable () {
    if (cp) {
        console.log('exe is currently')
    }
}

// Attach watchers to source files
watch([inoPath, ...otherSourceFiles], compile);

// initial compile
compile();


// start child proc
// const exePath = path.resolve('./a.out'); // output from g++


// process.stdin.resume()
// let strips = new Map(); // working data for the leds
// let currentStrip = null;
// let stripOffset = 0;

// process.stdin.on('data', function(data) {
//     debugger;
//     for (var i = 0; i < data.length; i++) {
//         const byte = data[i];

//         if (currentStrip === null) { // is this the start of a strip?
//             currentStrip = byte;
//             stripOffset = 0;
//         } else if (!strips.has(currentStrip)) { // is this a new strip?
//             const stripLength = byte;
//             strips.set(currentStrip, new Uint8Array(stripLength * 3)); // 3 bytes for each light
//         } else { // current strip is known
//             const strip = strips.get(currentStrip);
//             if (stripOffset === strip.length) { // advance to the next strip?
//                 console.log('strip', currentStrip, 'contents', strip);
//                 currentStrip = byte;
//                 stripOffset = null;
//             } else if (stripOffset === null) { // strip is known, skipping strip length byte
//                 stripOffset = 0;
//             } else { // consume a byte as rgb
//                 strip[stripOffset] = byte;
//                 stripOffset++;
//             }
//         }

//         // if (stripCount === null) { // first byte b is how many strips
//         //     stripCount = byte;
//         // } else if (buffs.length < strips) { // next b bytes are lengths of strip b<i>
//         //     const stripLength = byte;
//         //     const stripBytes = stripLength * 3; // how many bytes per strip
//         //     maxBytes += stripBytes;
//         //     buffs.push(new Uint8Array(stripBytes));
//         // } else { // remaining bytes are rgb values
//         //     let currentStrip = buffs[stripIndex];
//         //     if (stripOffset === currentString.length) { // last byte of the strip?
//         //         stripIndex++;
//         //         if (stripIndex === stripCount) { // last strip of the set?
//         //             console.log(buffs);
//         //             stripIndex = 0;
//         //         }
//         //     }
//         // }
//     }
//     // let startIndex = 0; // where to start reading RGB values
//     // if (maxLength === null) {
        
//     // }
    
//     // if (data.toString().match('!')) {
//     //     console.log(arr);
//     //     arr = [];
//     // } else {
//     //     arr.push(data.toString());
//     // }
// })
// process.stdout.on('error', function(err) {
//   if (err.code === 'EPIPE') return process.exit()
//   process.emit('error', err)
// })