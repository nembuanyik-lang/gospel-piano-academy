// Downloads a recorded grand piano (Salamander Grand Piano, hosted by the Tone.js project) into app/samples
// and writes samples/manifest.json. Run once on a computer with internet:   npm run get-samples
// Licence: "Salamander Grand Piano" by Alexander Holm, CC BY 3.0 (credit is shown in the app's Profile screen).
// If any file cannot be fetched it is skipped; at least 8 are needed for the app to switch to recorded sound.
const fs = require('fs');
const path = require('path');
const BASE = 'https://tonejs.github.io/audio/salamander/';
const dest = path.join(__dirname, '..', 'app', 'samples');
const names = ['A0'];
for (let o = 1; o <= 7; o++) ['C', 'Ds', 'Fs', 'A'].forEach(n => names.push(n + o));
names.push('C8');
(async () => {
  fs.mkdirSync(dest, { recursive: true });
  const notes = {};
  for (const n of names) {
    const file = n + '.mp3';
    try {
      const r = await fetch(BASE + file);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      fs.writeFileSync(path.join(dest, file), Buffer.from(await r.arrayBuffer()));
      notes[n] = file; process.stdout.write('.');
    } catch (e) { console.warn('\nSkipped ' + file + ': ' + e.message); }
  }
  const count = Object.keys(notes).length;
  fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify({
    format: 1, credit: 'Piano samples: Salamander Grand Piano by Alexander Holm (CC BY 3.0).', notes
  }, null, 1));
  console.log('\n' + count + ' of ' + names.length + ' samples saved to app/samples.' + (count < 8 ? ' Too few: the app will keep using the built-in sound.' : ' Rebuild the app to include them.'));
})();
