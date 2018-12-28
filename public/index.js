/* globals pixels, outputs, createPixelsFromOutput, updatePixelsFromOutput */

window.pixels = null;

/**
 * @param {{name: string, buffer: Uint8Array}} ds
 * @param {{id: number, buffer: ArrayBuffer, startIdx: number}} update
 */
window.onDataSegment = function (ds, update) {
  if (!pixels) { // set up pixels
    window.pixels = createPixelsFromOutput(outputs.get(0));

    // I'm planning on adding convenience methods to aid in positioning LED strips in 3D space
    debugger
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        for (let z = 0; z < 4; z++) {
          const idx = x*16 + y*4 + z;
          const pixel = pixels[idx];
          pixel.position.x = (x - 2)*3;
          pixel.position.y = (y - 2)*3;
          pixel.position.z = (z - 2)*3;
        }
      }
    }
    // for (let i = 0; i < pixels.length; i++) {
    //   const pixel = pixels[i];
    //   // position each pixel
    //   pixel.position.x = (i - (pixels.length / 2)) * 2;
    // }
  } else {
    // not much is needed to be implemented once the pixel's positions are set up.
    updatePixelsFromOutput(pixels, outputs.get(0));
  }
};
