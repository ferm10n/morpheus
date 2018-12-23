/* globals io */
const div = document.querySelector('#app');

const socket = io();
function onConnect () {
  socket.emit('get-outputs'); // request outputs when connected
}
socket.on('connect', onConnect);

/**
 * @type {Map<number, {name: string, buffer: Uint8Array}>}
 */
let outputs = null;

socket.on('outputs', newOutputs => {
  // when server sends outputs
  outputs = new Map();
  for (let output of newOutputs) { // extract data out of outputs
    outputs.set(output.id, {
      name: output.name,
      buffer: new Uint8Array(output.buffer)
    });
  }
});

socket.on('data-segment', update => {
  // when server sends an update
  const ds = outputs.get(update.id);
  ds.buffer.set(update.buffer, update.startIdx);
  div.innerHTML = `name: ${ds.name}<br>
    buffer: ${ds.buffer.toString()}
  `;
});
