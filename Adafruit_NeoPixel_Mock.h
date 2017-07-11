#define NEO_KHZ800 0
#define NEO_KHZ400 0
#define NEO_GRB 0
#define NEO_RGB 0
#define NEO_RGBW 0

#include <vector>
#include <cstdint>
#include <cstddef>
#include <iostream>
#include <unistd.h>
#include <signal.h>
#include <sstream>

typedef uint8_t byte; // i can haz a bite? omnomnom

class Adafruit_NeoPixel {
public:
  static volatile sig_atomic_t shouldQuit; // flag for when SIGINT was fired
  static bool signalSet; // flag for if SIGINT handler was registered
  std::vector<uint32_t> pixels; // container for pixel data
  Adafruit_NeoPixel(int pixelCount, int pinNum, int mode) {
    pixels = std::vector<uint32_t>(pixelCount, 0); // init black
  }
  static void doQuit (int sig) { // SIGINT handler
    shouldQuit = 1;
  }
  static uint32_t Color (byte r, byte g, byte b) {
    uint32_t color = r;
    color <<= 8;
    color |= g;
    color <<= 8;
    color |= b;
    return color;
  }
  void begin () { // doesn't do much. just sets the SIGINT handler if it isn't already
    if (!signalSet) {
      signalSet = true;
      signal(SIGINT, doQuit);
    }
  }
  void show () {
    std::ostringstream os; // we build a string
    os << '\n'; // change this to '\r' if you don't want the terminal to scroll. But this is better performance wise.
    for (int i = 0; i < pixels.size(); i++) {
      uint32_t c = pixels.at(i);
      // bitfidly magic
      int r = (uint8_t)(c >> 16),
          g = (uint8_t)(c >> 8)&0xFF,
          b = (uint8_t)c&0xFF;
      os << "\x1b[48;2;" << r << ";" << g << ";" << b << "m \x1b[0m";
    }
    std::string s = os.str();
    std::cout << s;
  }
  uint16_t numPixels () {
    return pixels.size();
  }
  void setPixelColor(uint8_t i, uint32_t c) {
    if (i < pixels.size() && i > 0) pixels.at(i) = c; // protect out of range stuff
  }
  static void cleanup () {
    printf("\x1b[48;2;0;0;0m\n\x1b[0m"); // ensure color is set back to normal
  }
};
bool Adafruit_NeoPixel::signalSet = false;
volatile sig_atomic_t Adafruit_NeoPixel::shouldQuit = 0;

void delay(uint8_t d) {
  usleep(d * 1000);
  if (Adafruit_NeoPixel::shouldQuit) { // should we keep going?
    throw 'i'; // nawh
  }
}
