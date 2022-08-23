# Morpheus

Provides a simulation environment for Neo(pixels) or other individually addressible LEDs without the need for an Arduino or other microcontroller.

## Getting started

* Nodejs ^12.13.0, and g++ are required
* in the arduino project, run `npm init -y` to create a package.json
* `npm i git+https://github.com/ferm10n/morpheus.git` to add morpheus module
* add `"start": "morpheus"` to the "scripts" part of your package.json
* create morpheus-config.js
* `npm start`. this will compile and run your arduino sketch.
  * depending on what special arduino functions your sketch uses, you might need to write mocks for them. I put some of the common ones in there already but this is the most likely thing to fail when switching to a new sketch.
* implement `onDataSegment()` in **public/index.js**. See the example there for details. This gets called for every update to the LED outputs.
* open your browser to http://localhost:8080

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
