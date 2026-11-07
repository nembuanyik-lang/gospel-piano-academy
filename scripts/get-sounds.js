// Downloads the instrument library (GeneralUser GS by S. Christian Collins: a General MIDI SoundFont with
// pianos, organs, brass, strings, choirs, basses, drum kits and more) into app/sounds and writes
// sounds/manifest.json.   npm run get-sounds
// The GitHub release build does this automatically (scripts/prepare.js calls download() on GitHub Actions).
// Licence: GeneralUser GS may be used in software projects, free of charge; the app still credits it.
// Several mirrors are tried; a file is only accepted if it is a real SoundFont of a believable size.
const fs = require('fs');
const path = require('path');
const FILE = 'GeneralUser-GS.sf2';
const URLS = (process.env.SOUNDS_URLS ? process.env.SOUNDS_URLS.split(',') : [
  'https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main/GeneralUser-GS.sf2',
  'https://github.com/mrbumpy409/GeneralUser-GS/raw/main/GeneralUser-GS.sf2',
  'https://media.githubusercontent.com/media/mrbumpy409/GeneralUser-GS/main/GeneralUser-GS.sf2',
  'https://github.com/slopsmith/slopsmith-desktop/releases/download/soundfonts-v1/GeneralUser-GS.sf2'
]).map(s => s.trim()).filter(Boolean);
const DEST = process.env.SOUNDS_DEST || path.join(__dirname, '..', 'app', 'sounds');
const MIN_BYTES = Number(process.env.SOUNDS_MIN_BYTES || 5e6);
const CREDIT = 'Instruments: GeneralUser GS by S. Christian Collins.';

function isSoundFont(buf) {
  return buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'sfbk';
}
function haveSounds(dest) {
  dest = dest || DEST;
  try {
    const m = JSON.parse(fs.readFileSync(path.join(dest, 'manifest.json'), 'utf8'));
    const st = fs.statSync(path.join(dest, m.file));
    return st.size >= MIN_BYTES;
  } catch (e) { return false; }
}
async function fetchTry(url, tries, minBytes) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 180000);
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) { clearTimeout(t); throw new Error('HTTP ' + r.status); }
      const buf = Buffer.from(await r.arrayBuffer()); clearTimeout(t);
      if (!isSoundFont(buf)) throw new Error('not a SoundFont (a web page or a placeholder came back)');
      if (buf.length < minBytes) throw new Error('file too small (' + buf.length + ' bytes)');
      return buf;
    } catch (e) { last = e; await new Promise(res => setTimeout(res, 800 * (i + 1))); }
  }
  throw last;
}
async function download(o) {
  o = o || {};
  const urls = o.urls || URLS, dest = o.dest || DEST, minBytes = o.minBytes == null ? MIN_BYTES : o.minBytes;
  const log = o.quiet ? () => {} : (...a) => console.log(...a);
  fs.mkdirSync(dest, { recursive: true });
  for (const url of urls) {
    try {
      const buf = await fetchTry(url, o.tries || 3, minBytes);
      fs.writeFileSync(path.join(dest, FILE), buf);
      fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify({ format: 1, file: FILE, credit: CREDIT }, null, 1));
      log('Instruments: GeneralUser GS saved to app/sounds (' + (buf.length / 1048576).toFixed(1) + ' MB).');
      return true;
    } catch (e) { console.warn('Instruments: ' + url + ' failed: ' + e.message); }
  }
  console.warn('Instruments: not included. The app will use its built-in instruments.');
  return false;
}
module.exports = { download, haveSounds, isSoundFont, FILE };
if (require.main === module) download().then(ok => { if (!ok) process.exitCode = 1; });
