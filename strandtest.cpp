// Adapted from https://github.com/adafruit/Adafruit_NeoPixel/blob/master/examples/strandtest/strandtest.ino
#ifdef __AVR__
  #include <Adafruit_NeoPixel.h>
  #include <avr/power.h>
#else
  #include <Adafruit_NeoPixel_Mock.h>
#endif

#define PIXEL_PIN 6
#define PIXEL_COUNT 60

const float maxPeriod = 10;

// Added prototypes
uint32_t Wheel(byte);
void colorWipe(uint32_t, uint8_t);
void rainbow(uint8_t);
void rainbowCycle(uint8_t);
void theaterChase(uint32_t, uint8_t);
void theaterChaseRainbow(uint8_t);

// Parameter 1 = number of pixels in strip
// Parameter 2 = Arduino pin number (most are valid)
// Parameter 3 = pixel type flags, add together as needed:
//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)
//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)
//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)
//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)
//   NEO_RGBW    Pixels are wired for RGBW bitstream (NeoPixel RGBW products)
Adafruit_NeoPixel strip = Adafruit_NeoPixel(PIXEL_COUNT, PIXEL_PIN, NEO_GRB + NEO_KHZ800);

// IMPORTANT: To reduce NeoPixel burnout risk, add 1000 uF capacitor across
// pixel power leads, add 300 - 500 Ohm resistor on first pixel's data input
// and minimize distance between Arduino and first pixel.  Avoid connecting
// on a live circuit...if you must, connect GND first.

struct Color {
  byte r;
  byte g;
  byte b;
  Color (byte R, byte G, byte B) {
    r = R;
    g = G;
    b = B;
  }
  Color () {
    r = 255;
    g = 255;
    b = 255;
  }
};

class Deltable {
private:
  float i = 0;
  float speed = 0;
public:
  float value;
  float target;
  float previousValue = 0;

  Deltable (float initialValue) {
    value = initialValue;
    previousValue = 0;
    target = value;
    i = 1;
  }

  void go (float newTarget, float stepSpeed) {
    i = 0;
    speed = stepSpeed;
    previousValue = value;
    target = newTarget;
  }

  void update () {
    i += speed;
    if (i > 1) i = 1;
    float y = sin(.5*PI*i);
    value = previousValue + (target - previousValue)*y*y;
  }

  bool isClose () {
    return (abs(value - target) < .1);
  }
};

class PixelLayer {
public:
  Color color;
  float speed;
  float position;
  float offset;
  float frequency;
  float fade;
  Deltable period = Deltable(PIXEL_COUNT * 10);
  float targetPeriod;

  PixelLayer () {
    color = Color();
    position = 0;
    offset = 0;
  }

  Color get (int pixelIndex) {
    Color pixel = color;
    float x = fmod((pixelIndex + position), PIXEL_COUNT);
    float intensity = cos((PI/period.value)*(x + offset*.5));
    intensity *= intensity;
    pixel.r *= intensity;
    pixel.g *= intensity;
    pixel.b *= intensity;
    return pixel;
  }

  void update () {
    period.update();
    if (period.isClose()) period.go(period.target == 10 ? 50 : 10, .01);

    offset = period.value - (float) PIXEL_COUNT;
  }
};

PixelLayer l1;

void setup() {
  // This is for Trinket 5V 16MHz, you can remove these three lines if you are not using a Trinket
  #if defined (__AVR_ATtiny85__)
    if (F_CPU == 16000000) clock_prescale_set(clock_div_1);
  #endif
  // End of trinket special code

  strip.begin();
  strip.show(); // Initialize all pixels to 'off'
}

void loop() {
  l1.update();
  // l1.position += .1;
  for (int i = 0; i < PIXEL_COUNT; i++) {
    Color pixel = l1.get(i);
    strip.setPixelColor(i, strip.Color(pixel.r, pixel.g, pixel.b));
  }
  strip.show();
  delay(10);
}

#ifndef __AVR__
// Added main
int main() {
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
#endif
