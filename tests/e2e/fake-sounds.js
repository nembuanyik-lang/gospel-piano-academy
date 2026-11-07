// A stand-in for the recorded piano (Salamander) and the instrument library, for tests that need the installed
// app's sample-based sound engine: 30 piano notes (4-second decaying tones, 44.1 kHz WAV) and the test SoundFont.
const { NAMES } = require('../../scripts/get-piano-samples.js');
const { build } = require('../fixtures/make-sf2');
const midiOf = n => { const m = /^([A-G])(s?)(\d)$/.exec(n); return 12 * (+m[3] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0); };
function tone(m) {
  const sr = 44100, n = sr * 4, b = Buffer.alloc(44 + n * 2), f = 440 * Math.pow(2, (m - 69) / 12);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) { const t = i / sr, v = Math.exp(-t * 1.2) * (0.5 * Math.sin(2 * Math.PI * f * t) + 0.2 * Math.sin(4 * Math.PI * f * t) + 0.1 * Math.sin(6 * Math.PI * f * t)); b.writeInt16LE(Math.round(v * 20000), 44 + i * 2); }
  return b;
}
module.exports = async function useFakeSounds(page) {
  const notes = {}; NAMES.forEach(n => { notes[n] = n + '.wav'; });
  await page.route('**/samples/manifest.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ notes, credit: 'Piano: test samples.' }) }));
  await page.route(/\/samples\/[A-G]s?\d\.wav$/, r => { const n = /([A-G]s?\d)\.wav$/.exec(r.request().url())[1]; r.fulfill({ contentType: 'audio/wav', body: tone(midiOf(n)) }); });
  const sf = build();
  await page.route('**/sounds/manifest.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ format: 1, file: 'Test.sf2', credit: 'Instruments: test bank.' }) }));
  await page.route('**/sounds/Test.sf2', r => r.fulfill({ contentType: 'application/octet-stream', body: sf }));
};
