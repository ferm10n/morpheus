# neopixel-emulator

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

## Emulate an arduino neopixel setup right from your terminal

This serves as a drop in replacement for Adafruit_NeoPixel.h, allowing you to experiment with patterns and such without an arduino or other microcontroller!

Your terminal must support Truecolor ANSI escape sequences for 8bpc color. (xterm is usually sufficient)


Test your terminal support with: `printf "\x1b[38;2;40;177;249mTRUECOLOR\x1b[0m\n"`
It should print a light blue color if it works.

  NOTE: because of the use of escape sequences, Ctrl+C might jack up your
  terminal colors temporarily. This is because the program can be terminated
  before it has a chance to signal the end of colored text.
  To get around this, the SIGINT signal is registered. When it is received,
  subsequent calls to `delay()` will terminate the application.
  Interruptions are detected in `main()` by looking for a thrown
  'i' char. Probably not the most elegant solution, but it works.
  If you want to do something different, then remove the try-catch in your main,
  calls to `begin()`, and make sure to call `cleanup()` before exiting.

  ## How to use:

  * Rename your .ino sketch file to .cpp, or keep your .ino file and move everything in it to a new .cpp file in the same directory
  * Put Adafruit_NeoPixel_Mock.h file in the same directory as your sketch
  * then, in your sketch
      - change `#include <Adafruit_NeoPixel.h>` to `#include <Adafruit_NeoPixel_Mock.h>`
      - make sure all needed prototypes are defined (Arduino compiler
        automagically creates them during compilation!)
      - add this main:
        ```
        int main () {
          setup();
          try {
            while (true) {
              loop();
            }
          } catch (char c) {
            if (c == 'i') { // 'i' for interrupt!
              strip.cleanup();
            } else {
              throw c;
            }
          }
          return 0;
        }
        ```
  * compile: (if sketch name is strandtest) `g++ -I . strandtest.cpp -std=c++11 -o strandtest`
  
See strandtest_example.cpp for an example which compiles for both pc and arduino based micros
