// Adapted from https://github.com/adafruit/Adafruit_NeoPixel/blob/master/examples/strandtest/strandtest.ino
#ifdef __AVR__
  #include <Adafruit_NeoPixel.h>
  #include <avr/power.h>
#else
  #include <Adafruit_NeoPixel_Mock.h>
#endif

#define PIXEL_PIN 6
#define PIXEL_COUNT 60

const float minPeriod = PIXEL_COUNT * .2;
const float maxPeriod = PIXEL_COUNT;
const float minSpeed = -1;
const float maxSpeed = 1;

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
  Color(byte hue) {
    hue = 255 - hue;
    if(hue < 85) {
      r = 255 - hue * 3;
      g = 0;
      b = hue * 3;
    } else if(hue < 170) {
      hue -= 85;
      r = 0;
      g = hue * 3;
      b = 255 - hue * 3;
    } else {
      hue -= 170;
      r = hue * 3;
      g = 255 - hue * 3;
      b = 0;
    }
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

  bool isDone () {
    return i == 1;
  }
};

bool chance (float percent) {
  return random(0, 100) < percent * 100;
}
class PixelLayer {
public:
  Color color;
  Deltable hue = Deltable(0);
  Deltable speed = Deltable(0);
  float position;
  float offset;
  float frequency;
  Deltable period = Deltable(PIXEL_COUNT * 10);
  float targetPeriod;

  PixelLayer () {
    color = Color();
    position = 0;
    offset = 0;
    period.go(maxPeriod, .005);
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
    speed.update();
    period.update();
    if (hue.isDone() && (speed.isDone() || period.isDone())) hue.go(random(0, 255), .005);
    if (speed.isDone() && chance(.001)) speed.go(random(-1,1), .005);
    if (period.isDone() && chance(.01)) period.go(random(minPeriod, maxPeriod), .005);


    position += speed.value;
    while (position < 0) position += PIXEL_COUNT;
    while (position > PIXEL_COUNT) position -= PIXEL_COUNT;

    offset = period.value - (float) PIXEL_COUNT;

    hue.update();
    color = Color(hue.value);
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
