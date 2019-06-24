# neopixel-emulator

## Getting started

* Nodejs ~10.14.1, and g++ are required
* Clone this repo and run `npm i`
* Replace strandtest.ino with your sketch.
  * make sure to update the properties of `config` in **main.js** accordingly. They should be self-explanitory.
* `npm start`. this will compile and run your arduino sketch.
  * depending on what special arduino functions your sketch uses, you might need to implement them in **Adafruit_NeoPixel_mock.h**. I put some of the common ones in there already but this is the most likely place for things to fail when switching to a new sketch.
* implement `onDataSegment()` in **public/index.js**. See the example there for details. This gets called for every update to the LED outputs.
* open your browser to http://localhost:8080

## Transactions

* start cp
* cp runs setup()
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
