import io from 'socket.io-client';
const socket = io();
socket.on('connect', () => {
  socket.emit('get-outputs'); // request outputs when connected
});

/**
 * @type {Map<number, {name: string, buffer: Uint8Array}>}
 */
export const outputs = new Map();

// when new outputs are declared
socket.on('outputs', newOutputs => {
  // when server sends outputs
  for (let output of newOutputs) { // extract data out of outputs
    outputs.set(output.id, {
      name: output.name,
      buffer: new Uint8Array(output.buffer)
    });
  }
});

// when update is received
socket.on('data-segment', update => {
  if (outputs.size === 0) return;

  const ds = outputs.get(update.id);
  ds.buffer.set(new Uint8Array(update.buffer), update.startIdx);

  window.onDataSegment(ds, update);
});

socket.on('signal-reload', () => {
  window.location.reload();
});

/**
 * Override me
 * @param {{name: string, buffer: Uint8Array}} ds
 * @param {{id: number, buffer: ArrayBuffer, startIdx: number}} update
 */
window.onDataSegment = function onDataSegment () {};
