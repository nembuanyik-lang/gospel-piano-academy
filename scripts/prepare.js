// Copies the web fonts from npm packages into app/fonts so the app works fully offline.
const fs = require('fs');
const path = require('path');
const fams = {
  'bricolage-grotesque': [600, 700, 800],
  'hanken-grotesk': [400, 500, 600, 700],
  'ibm-plex-mono': [400, 500],
};
const dest = path.join(__dirname, '..', 'app', 'fonts');
fs.mkdirSync(dest, { recursive: true });
let missing = 0;
for (const [slug, weights] of Object.entries(fams)) {
  for (const w of weights) {
    const name = `${slug}-latin-${w}-normal.woff2`;
    const src = path.join(__dirname, '..', 'node_modules', '@fontsource', slug, 'files', name);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dest, name));
    else { missing++; console.warn('Font not found (system fallback will be used):', name); }
  }
}
if (missing && process.argv.includes('--strict')) {
  console.error(`Fonts: ${missing} missing. Run "npm install" first; an installer built now would look wrong.`);
  process.exit(1);
}
console.log(missing ? `Fonts: ${missing} missing` : 'Fonts copied.');

// The recorded grand piano: downloaded automatically on GitHub Actions (the release build) or with --samples,
// so the installed app plays real piano recordings. Without them the app uses its synthesised piano.
const { download, haveSamples } = require('./get-piano-samples.js');
if ((process.env.GITHUB_ACTIONS === 'true' || process.argv.includes('--samples')) && !haveSamples()) {
  download().then(n => { if (n < 8) console.warn('Recorded piano not included: the synthesised piano will be used.'); }, e => console.warn('Recorded piano not included:', e.message));
} else if (haveSamples()) console.log('Recorded piano: present.');


// The instrument library (GeneralUser GS: organs, brass, strings, choir, bass, drums and more), the same way.
const sounds = require('./get-sounds.js');
if ((process.env.GITHUB_ACTIONS === 'true' || process.argv.includes('--samples')) && !sounds.haveSounds()) {
  sounds.download().catch(e => console.warn('Instruments not included:', e.message));
} else if (sounds.haveSounds()) console.log('Instrument library: present.');

// The MP3 maker (LAME, as lamejs, LGPL-3.0): copied from npm into app/vendor so the app can save MP3 files offline.
// The package ships two browser builds; the first one that passes the check (scripts/check-mp3.js: loaded the way
// the app loads it, encoding with the app's own code) is used. On GitHub a failure stops the build.
const lameDir = path.join(__dirname, '..', 'node_modules', 'lamejs'), vendor = path.join(__dirname, '..', 'app', 'vendor', 'lame.min.js');
const lameFiles = ['lame.min.js', 'lame.all.js'].map(f => path.join(lameDir, f)).filter(f => fs.existsSync(f));
if (lameFiles.length) {
  const { check } = require('./check-mp3.js');
  let ok = null, why = '';
  for (const f of lameFiles) { const r = check(f); if (r.ok) { ok = { f, r }; break; } why += path.basename(f) + ': ' + r.why + '. '; }
  if (ok) {
    fs.mkdirSync(path.dirname(vendor), { recursive: true }); fs.copyFileSync(ok.f, vendor);
    console.log('MP3 maker: ' + path.basename(ok.f) + ' copied and checked (' + ok.r.info.frames + ' frames, ' + ok.r.info.seconds.toFixed(2) + ' s, ' + ok.r.info.bitrate + ' kbps).');
  } else { console.error('MP3 maker: FAILED: ' + why); if (process.env.GITHUB_ACTIONS === 'true' || process.argv.includes('--strict')) process.exitCode = 1; }
} else if (process.env.GITHUB_ACTIONS === 'true') { console.error('MP3 maker not found: npm install did not add lamejs.'); process.exitCode = 1; }
else console.warn('MP3 encoder not found (run npm install): the app will offer WAV only.');
