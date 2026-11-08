'use strict';
// Sound that lingers after you let go of a key: held pads (strings, choir) used to hang on for 1.5 to 2.5 seconds with a slow wobble.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { chromium } = require('playwright');
const serve = require('./serve');
const PORT = 8801;
let srv, browser;
test.before(async () => { srv = serve(path.join(__dirname, '..', '..', 'app'), PORT); browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); });
test.after(async () => { await browser.close(); srv.close(); });

test('every instrument is quiet within a second of letting go, and its pitch wobble stops with the note', async () => {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:' + PORT + '/');
  const res = await page.evaluate(async () => {
    Snd.tone(60, 0.1); await new Promise(r => setTimeout(r, 300));
    const out = {};
    for (const i of Snd.instruments()) {
      const id = i.id, sr = 22050, c = new OfflineAudioContext(2, sr * 6, sr), dest = c.createGain(); dest.connect(c.destination);
      let vib = false;
      [48, 60, 64, 67].forEach(m => { const v = Snd._buildVoice(c, dest, m, 0.1, 0.7, 0.6, false, id); Snd._release(v, 1.6); if (v.vibG) vib = true; });
      const d = (await c.startRendering()).getChannelData(0), w = Math.round(sr * 0.025), db = [];
      for (let k = 0; k + w < d.length; k += w) { let s = 0; for (let j = 0; j < w; j++) s += d[k + j] * d[k + j]; db.push(10 * Math.log10(s / w + 1e-12)); }
      const rel = Math.round(1.6 / 0.025), sus = Math.max(...db.slice(Math.round(1 / 0.025), rel));
      let t40 = null; for (let k = rel; k < db.length; k++) if (db[k] < sus - 40) { t40 = (k - rel) * 0.025; break; }
      out[id] = { t40, vib };
    }
    return out;
  });
  const ids = Object.keys(res); assert.ok(ids.length >= 8, 'instruments found: ' + ids);
  for (const id of ids) assert.ok(res[id].t40 !== null && res[id].t40 < 1.0, id + ' is silent (40 dB down) within a second: ' + res[id].t40);
  assert.ok(res.strings.vib && res.choir.vib, 'the vibrato of strings and choir belongs to each note, so it can fade out');
  assert.deepEqual(errors, []);
});
