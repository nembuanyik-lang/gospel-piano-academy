// Proves that the MP3 maker works before an installer is made: loads app/vendor/lame.min.js the way the app does
// (as a plain script defining `lamejs`), encodes a 3-second stereo tone with the app's own MP3 code (app/js/mp3.js),
// and reads the file back: ID3 tag with the title, valid MPEG Layer III frames, 44.1 kHz, about 192 kbps, 3 seconds.
// Run by prepare.js on GitHub Actions (and by hand: node scripts/check-mp3.js). Exit code 1 on any problem.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Mp3 = require('../app/js/mp3.js');
function check(file) {
  file = file || path.join(__dirname, '..', 'app', 'vendor', 'lame.min.js');
  if (!fs.existsSync(file)) return { ok: false, why: 'app/vendor/lame.min.js is missing' };
  const ctx = { console, window: {}, self: {}, navigator: {} }; ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: 'lame.min.js' });
  const lame = ctx.lamejs || (ctx.window && ctx.window.lamejs);
  if (!lame || typeof lame.Mp3Encoder !== 'function') return { ok: false, why: 'the file does not define lamejs.Mp3Encoder the way the app loads it' };
  const sr = 44100, n = sr * 3, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = 0.4 * Math.sin(2 * Math.PI * 440 * i / sr); R[i] = 0.4 * Math.sin(2 * Math.PI * 660 * i / sr); }
  const bytes = Mp3.encode(lame, [L, R], sr, 192, { title: 'Test tone', artist: 'Gospel Music Academy', year: '2026', genre: 'Gospel' });
  const info = Mp3.inspect(bytes);
  const problems = [];
  if (info.id3.TIT2 !== 'Test tone') problems.push('ID3 title missing');
  if (!info.ok || info.frames < 100) problems.push('too few MPEG frames (' + info.frames + ')');
  if (info.sampleRate !== 44100) problems.push('sample rate ' + info.sampleRate);
  if (info.channels !== 2) problems.push('not stereo');
  if (Math.abs(info.seconds - 3) > 0.15) problems.push('length ' + info.seconds.toFixed(2) + ' s instead of 3');
  if (Math.abs(info.bitrate - 192) > 8) problems.push('bitrate ' + info.bitrate + ' kbps');
  return { ok: !problems.length, why: problems.join('; '), info, bytes: bytes.length };
}
module.exports = { check };
if (require.main === module) {
  const r = check(process.argv[2]);
  if (r.ok) console.log('MP3 maker: OK (' + r.info.frames + ' frames, ' + r.info.seconds.toFixed(2) + ' s, ' + r.info.bitrate + ' kbps, ' + r.bytes + ' bytes).');
  else { console.error('MP3 maker: FAILED: ' + r.why); process.exitCode = 1; }
}
