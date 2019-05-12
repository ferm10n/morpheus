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
    const radius = 10;
    for (let idx = 0; idx < pixels.length; idx++) {
      const pixel = pixels[idx];
      const angle = 2*Math.PI * (idx/pixels.length);
      pixel.position.x = Math.cos(angle) * radius;
      pixel.position.y = Math.sin(angle) * radius;
      pixel.position.z = -2;

      pixel.geometry.scale(.5, .5, .5);
    }
  } else {
    // not much is needed to be implemented once the pixel's positions are set up.
    updatePixelsFromOutput(pixels, outputs.get(0));
  }
};
