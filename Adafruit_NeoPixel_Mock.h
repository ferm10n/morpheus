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
    static bool sentInit;
    
    static uint32_t Color (byte, byte, byte);
    
    int id;
    std::vector<uint32_t> pixels; // container for pixel data
    int startIdx = 0;
    int stopIdx = 0;

    Adafruit_NeoPixel(int, int, int);

    void show();
    uint16_t numPixels();
    void begin();
    void setPixelColor(uint8_t i, uint32_t c);
};
int Adafruit_NeoPixel::instances = 0;
std::ostringstream Adafruit_NeoPixel::initializerPayload = std::ostringstream();
bool Adafruit_NeoPixel::sentInit = 0;

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
  Adafruit_NeoPixel::initializerPayload << "strip_" << id << ":" << pixelCount * 3 << std::endl;

  pixels = std::vector<uint32_t>(pixelCount, 0); // init all pixels to black
  stopIdx = pixelCount * 3; // 3 bytes per pixel
}

void Adafruit_NeoPixel::show () {
  if (!Adafruit_NeoPixel::sentInit) {
    std::cout << Adafruit_NeoPixel::instances << std::endl; // how many outputs
  
    // is there really no good method for piping an ostream to another ostream,
    // other than converting it to a string and then piping that?

    std::string s = Adafruit_NeoPixel::initializerPayload.str(); // convert init payload to string
    std::cout << s; // write init payload

    std::cout << 0 << std::endl; // how many inputs

    Adafruit_NeoPixel::sentInit = 1;
  }

  // segment header
  std::cout << id << ':' << startIdx << ':' << stopIdx << std::endl;

  // segment data
  for (int i = 0; i < pixels.size(); i++) {
    uint32_t c = pixels.at(i);
    // bitfidly magic
    int r = (uint8_t)(c >> 16),
        g = (uint8_t)(c >> 8)&0xFF,
        b = (uint8_t)c&0xFF;
    putchar(r);
    putchar(g);
    putchar(b);
  }
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
  usleep(d * 2000);
}

void setup ();
void loop ();
int main() {
  setup();
  
  while (true) {
    loop();
  }
  return 0;
}
