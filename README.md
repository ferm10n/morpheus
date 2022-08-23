# Morpheus

Provides a simulation environment for Neo(pixels) or other individually addressible LEDs without the need for an Arduino or other microcontroller hardware. Preview LED patterns directly from your browser, edit and see your changes live!

> HEADS UP! I'm building this project in my free time and it's kinda jank/inconsistent. I hope that enough of the vision for it is captured here until I get around to polishing it more :)

## Quick start

- Clone this project, make sure you have node ^12.13.0
- cd to examples/strandtest and `npm ci`
- `npm start`

## Adding morpheus to an existing Arduino project

* Nodejs ^12.13.0, and g++ are required
* in the arduino project, run `npm init -y` to create a package.json
* `npm i git+https://github.com/ferm10n/morpheus.git` to add morpheus module
* create an `index.js`, [like this one](./examples/index.js)
* edit the `coords` in `index.js` so that it contains the coordinates of your LEDs in 3d space
* `node index.js`. this will compile and run your arduino sketch.
  * depending on what special arduino functions your sketch uses, you might need to write mocks for them. I put some of the common ones in there already but this is the most likely thing to fail when switching to a new sketch.
* open your browser to the URL printed to your console

## Transactions

* morpheus compiles and starts cp (child process)
* cp runs arduino function setup()
  * we expect all the instances of LED strips have been initialized after this
* before loop() starts, cp writes LED strip info to node
  * first line is how many strips N (string)
  * next N lines are how many lights are in strip N<sub>i</sub> in the form `<stripName>:<length>`
    * each strip is assigned an ID = i
  * next line is how many inputs from node are expected M
  * next M lines are for each node input, in the form `<inputType>:<inputName>`
* cp does loop()
* node allocates a buffer for each strip
* At the moment, node inputs are not implemented yet, so they are ignored
* When cp tries to flush data to an led strip, the following is written:
  * header data, and the range of leds being updated (inclusive): `<stripId>:<ledStartIdx>:<ledStopIdx>`
  * we refer to this as a `DataSegment`
  * node uses the range of leds to determine how many bytes to read B = (M * 3)
  * B bytes are then read.

## Mocks

Morpheus includes some mocked arduino libraries so it can allow your sketch to run on your PC. Most of these are incomplete and are only really being implemented on an as needed basis. I'm not entirely sure how I want to implement all of them, and might ditch them in favor of an actual atmega emulator.
