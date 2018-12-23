#define NEO_KHZ800 0
#define NEO_KHZ400 0
#define NEO_GRB 0
#define NEO_RGB 0
#define NEO_RGBW 0
#define PI 3.14159265

#include <vector>
#include <cstdint>
#include <cstddef>
#include <iostream>
#include <unistd.h>
#include <signal.h>
#include <sstream>
#include <math.h>

typedef uint8_t byte; // i can haz a bite? omnomnom

long random(long min, long max) {
  if (max - min == 0) return 0;
  return (rand() % (max-min)) + min;
}

class Adafruit_NeoPixel {
  public:
    static int instances; // counter for how many instances have been created
    static std::ostringstream initializerPayload; // used to build the initializer message for nodejs
    
    static uint32_t Color (byte, byte, byte);
    
    int id;
    std::vector<uint32_t> pixels; // container for pixel data

    Adafruit_NeoPixel(int, int, int);

    void show();
    uint16_t numPixels();
    void begin();
    void setPixelColor(uint8_t i, uint32_t c);
};
int Adafruit_NeoPixel::instances = 0;
std::ostringstream Adafruit_NeoPixel::initializerPayload = std::ostringstream();

uint32_t Adafruit_NeoPixel::Color (byte r, byte g, byte b) {
  uint32_t color = r;
  color <<= 8;
  color |= g;
  color <<= 8;
  color |= b;
  return color;
}

Adafruit_NeoPixel::Adafruit_NeoPixel(int pixelCount, int pinNum, int mode) {
  id = Adafruit_NeoPixel::instances;
  Adafruit_NeoPixel::instances++;
  Adafruit_NeoPixel::initializerPayload << "strip_" << id << ":" << pixelCount << std::endl;

  pixels = std::vector<uint32_t>(pixelCount, 0); // init all pixels to black
}

void Adafruit_NeoPixel::show () {
  // std::cout << 0 << ' ' << pixels.size() << '\n';
  // putchar(0); // strip index
  // putchar(pixels.size()); // light count

  // std::ostringstream os; // we build a string
  // os << '\n'; // change this to '\r' if you don't want the terminal to scroll. But this is better performance wise.
  for (int i = 0; i < pixels.size(); i++) {
    uint32_t c = pixels.at(i);
    // bitfidly magic
    int r = (uint8_t)(c >> 16),
        g = (uint8_t)(c >> 8)&0xFF,
        b = (uint8_t)c&0xFF;
    // os << "\x1b[48;2;" << r << ";" << g << ";" << b << "m \x1b[0m";
    // std::cout << r << ' ' << g << ' ' << b << ' ';
    // putchar(r);
    // putchar(g);
    // putchar(b);
    // std::cout << 255 << 255 << '\n';
  }
  // putchar('\n');
  // std::cout << '\n';
  // std::cout << "!\n";
  // std::string s = os.str();
  // std::cout << s;
  // std::cout << 1 << std::endl;
}

uint16_t Adafruit_NeoPixel::numPixels () {
  return pixels.size();
}

void Adafruit_NeoPixel::begin () {}

void Adafruit_NeoPixel::setPixelColor(uint8_t i, uint32_t c) {
  if (i >= 0 && i < pixels.size()) {
    pixels.at(i) = c; // protect out of range stuff
  } 
}

void delay(uint8_t d) {
  usleep(d * 1000);
}

void setup ();
void loop ();
int main() {
  setup();
  std::cout << Adafruit_NeoPixel::instances << std::endl; // how many outputs
  // TODO: converting to string strips the "flush" from endl.
  // in node, implement something that will chomp the lines and emit data on each LINE.
  // I suppose it's okay to buffer data spanning multiple lines too.
  std::string s = Adafruit_NeoPixel::initializerPayload.str(); // convert init payload to string
  std::cout << s; // write output properties
  while (true) {
    loop();
  }
  return 0;
}
