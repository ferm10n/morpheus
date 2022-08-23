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

  } else {
    // not much is needed to be implemented once the pixel's positions are set up.
    updatePixelsFromOutput(pixels, outputs.get(0));
  }
};
