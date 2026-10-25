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
console.log(missing ? `Fonts: ${missing} missing` : 'Fonts copied.');
