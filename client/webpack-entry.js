import { outputs } from './stream';
import './renderer';

/* globals pixels, createPixelsFromOutput, updatePixelsFromOutput */

window.pixels = null;

/**
 * @param {{name: string, buffer: Uint8Array}} ds
 * @param {{id: number, buffer: ArrayBuffer, startIdx: number}} update
 */
window.onDataSegment = function (ds, update) {
  if (!pixels) { // set up pixels
    window.pixels = createPixelsFromOutput(outputs.get(0));

    // I'm planning on adding convenience methods to aid in positioning LED strips in 3D space

    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];
      // position each pixel
      pixel.position.x = (i - (pixels.length / 2)) * 2;
    }
  } else {
    // not much is needed to be implemented once the pixel's positions are set up.
    updatePixelsFromOutput(pixels, outputs.get(0));
  }
};
