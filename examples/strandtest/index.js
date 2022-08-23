const { Morpheus } = require('morpheus-neopixel');

/** @type {import('morpheus-neopixel/config').LedOutputConfig} */
const strip0 = {
  coords: [],
};

// generate a line of 20 LEDs
for (let i = 0; i < 20; i++) {
  strip0.coords.push([
    (i - 10)*2,
    0,
    0
  ])
}

const morpheus = Morpheus({
  outputs: {
    'strip_0': strip0,
  },
});
morpheus.init();
