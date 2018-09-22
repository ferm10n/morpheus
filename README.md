# neopixel-emulator
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
