// Downloads a recorded grand piano (Salamander Grand Piano, hosted by the Tone.js project) into app/samples
// and writes samples/manifest.json.   npm run get-samples
// The GitHub release build does this automatically (scripts/prepare.js calls download() on GitHub Actions),
// so installed apps play the recorded piano instead of the synthesised stand-in.
// Licence: "Salamander Grand Piano" by Alexander Holm, CC BY 3.0 (credit is shown in the app's Profile screen).
// If a file cannot be fetched after three tries it is skipped; at least 8 are needed for the app to use them.
const fs = require('fs');
const path = require('path');
const BASE = process.env.SAMPLES_BASE || 'https://tonejs.github.io/audio/salamander/';
const DEST = process.env.SAMPLES_DEST || path.join(__dirname, '..', 'app', 'samples');
const NAMES = ['A0'];
for (let o = 1; o <= 7; o++) ['C', 'Ds', 'Fs', 'A'].forEach(n => NAMES.push(n + o));
NAMES.push('C8');

function haveSamples(dest) {
  try { const m = JSON.parse(fs.readFileSync(path.join(dest || DEST, 'manifest.json'), 'utf8')); return Object.keys(m.notes || {}).length >= 8; } catch (e) { return false; }
}
async function fetchTry(url, tries) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 30000);
      const r = await fetch(url, { signal: ctl.signal }); clearTimeout(t);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 1000) throw new Error('file too small');
      return buf;
    } catch (e) { last = e; await new Promise(res => setTimeout(res, 500 * (i + 1))); }
  }
  throw last;
}
async function download(o) {
  o = o || {};
  const base = o.base || BASE, dest = o.dest || DEST, log = o.quiet ? () => {} : (...a) => console.log(...a);
  fs.mkdirSync(dest, { recursive: true });
  const notes = {};
  for (const n of NAMES) {
    const file = n + '.mp3';
    try { fs.writeFileSync(path.join(dest, file), await fetchTry(base + file, 3)); notes[n] = file; if (!o.quiet) process.stdout.write('.'); }
    catch (e) { console.warn('\nSkipped ' + file + ': ' + e.message); }
  }
  const count = Object.keys(notes).length;
  fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify({
    format: 1, credit: 'Piano samples: Salamander Grand Piano by Alexander Holm (CC BY 3.0).', notes
  }, null, 1));
  log('\nPiano: ' + count + ' of ' + NAMES.length + ' recorded notes saved to app/samples.' + (count < 8 ? ' Too few: the app will keep using the built-in sound.' : ''));
  return count;
}
module.exports = { download, haveSamples, NAMES };
if (require.main === module) download().catch(e => { console.error(e); process.exit(1); });
