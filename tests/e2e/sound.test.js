// Sound engine in a real browser: the instrument library (SoundFont) is loaded, plays in tune, drives drums
// and the Song Lab bass, and the gospel organ, Leslie and rooms work. Uses a small synthetic SoundFont.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { chromium } = require('playwright');
const serve = require('./serve');
const { build } = require('../fixtures/make-sf2');

const ROOT = path.join(__dirname, '..', '..', 'app');
const PORT = 8793;
let srv, browser;
test.before(async () => { srv = serve(ROOT, PORT); browser = await chromium.launch(); });
test.after(async () => { await browser.close(); srv.close(); });

async function open(withBank) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  if (withBank) {
    const sf = build();
    await page.route('**/sounds/manifest.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ format: 1, file: 'Test.sf2', credit: 'Instruments: test bank.' }) }));
    await page.route('**/sounds/Test.sf2', r => r.fulfill({ contentType: 'application/octet-stream', body: sf }));
  }
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => { const g = window.__gpa; g.S().profile.onboarded = true; g.go('home'); g.Snd.ensure(); });
  await page.waitForFunction(() => { const b = window.__gpa.Snd.info().bank; return b === 'ready' || b === 'none'; }, null, { timeout: 10000 });
  return { page, errors };
}
/* render notes offline and measure the pitch and loudness in the browser */
const measure = (page, inst, notes, extra) => page.evaluate(async ([inst, notes, extra]) => {
  const Snd = window.__gpa.Snd;
  const ev = Object.assign({ t: 0, d: 2, notes, vel: 0.8 }, extra || {});
  const buf = await Snd.render({ bpm: 60, total: 2, events: [ev] }, { inst });
  const L = buf.getChannelData(0), R = buf.getChannelData(1), sr = buf.sampleRate;
  const seg = L.slice(Math.floor(0.5 * sr), Math.floor(0.5 * sr) + 4096);
  const p = Pitch.yin(seg, sr);
  let el = 0, er = 0; for (let i = 0; i < sr * 1.5; i++) { el += L[i] * L[i]; er += R[i] * R[i]; }
  let peak = 0; for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  return { hz: p ? p.hz : null, el, er, peak };
}, [inst, notes, extra]);

test('without the library the built-in instruments play and the extra ones stay hidden', async () => {
  const { page, errors } = await open(false);
  const info = await page.evaluate(() => window.__gpa.Snd.info());
  assert.equal(info.bank, 'none');
  const ids = await page.evaluate(() => window.__gpa.Snd.instruments().map(i => i.id));
  assert.ok(ids.includes('organ') && ids.includes('brass') && !ids.includes('pipe') && !ids.includes('bass'));
  await page.evaluate(() => window.__gpa.Snd.setRoom('off'));
  const r = await measure(page, 'flute', [69]);
  assert.ok(Math.abs(r.hz - 440) < 2, 'the synthesised flute is in tune: ' + r.hz);
  assert.deepEqual(errors, []);
});

test('the instrument library plays in tune, with its own tuning, pan and attenuation rules', async () => {
  const { page, errors } = await open(true);
  const info = await page.evaluate(() => window.__gpa.Snd.info());
  assert.equal(info.bank, 'ready');
  assert.match(info.bankCredit, /test bank/);
  const ids = await page.evaluate(() => window.__gpa.Snd.instruments().map(i => i.id));
  assert.ok(ids.includes('pipe') && ids.includes('brasssec') && ids.includes('pad') && !ids.includes('bass'), ids.join());
  await page.evaluate(() => window.__gpa.Snd.setRoom('off'));
  // church organ (GM 19) uses the Split instrument: the high half is panned right, the low half is tuned an octave up
  const hi = await measure(page, 'pipe', [69]);
  assert.ok(Math.abs(hi.hz - 440) < 1.5, 'A4 plays 440 Hz: ' + hi.hz);
  assert.ok(hi.er > hi.el * 1.5, 'the zone pan places it to the right');
  const lo = await measure(page, 'pipe', [57]);
  assert.ok(Math.abs(lo.hz - 440) < 1.5, 'coarse tune +12 on the low zone: ' + lo.hz);
  // with no recorded piano installed the grand piano comes from the library (program 0, the looped sine)
  const pn = await measure(page, 'piano', [57]);
  assert.ok(Math.abs(pn.hz - 220) < 1, 'A3 transposed from the A4 sample: ' + pn.hz);
  const pn2 = await measure(page, 'piano', [64]);
  assert.ok(Math.abs(pn2.hz - 329.63) < 1.5, 'E4: ' + pn2.hz);
  // the loop holds the note well past the end of the one-second sample
  const held = await page.evaluate(async () => {
    const buf = await window.__gpa.Snd.render({ bpm: 60, total: 3, events: [{ t: 0, d: 2.6, notes: [69], vel: 0.8 }] }, { inst: 'piano' });
    const L = buf.getChannelData(0), sr = buf.sampleRate; let e = 0; for (let i = Math.floor(2.0 * sr); i < 2.3 * sr; i++) e += L[i] * L[i];
    return e;
  });
  assert.ok(held > 1, 'still sounding after 2 s (looped): ' + held);
  // softer velocity is quieter (the SoundFont velocity curve)
  const soft = await measure(page, 'piano', [69], { vel: 0.3 }), loud = await measure(page, 'piano', [69], { vel: 1 });
  assert.ok(loud.el > soft.el * 4, 'velocity changes loudness');
  assert.deepEqual(errors, []);
});

test('Song Lab bass and drums use the library; the open hi-hat is cut by the closed one', async () => {
  const { page, errors } = await open(true);
  await page.evaluate(() => window.__gpa.Snd.setRoom('off'));
  const r = await page.evaluate(async () => {
    const Snd = window.__gpa.Snd;
    const energy = async events => { const b = await Snd.render({ bpm: 60, total: 2, events }); const L = b.getChannelData(0); let e = 0; for (let i = 0; i < L.length; i++) e += L[i] * L[i]; return e; };
    const open1 = await energy([{ t: 0, drum: 'o', vel: 0.9 }]);
    const cut = await energy([{ t: 0, drum: 'o', vel: 0.9 }, { t: 0.005, drum: 'h', vel: 0.01 }]);
    const kick = await energy([{ t: 0, drum: 'k', vel: 0.9 }]);
    const bass = await energy([{ t: 0, d: 1, notes: [45], vel: 0.8, part: 'bass' }]);
    return { open1, cut, kick, bass };
  });
  assert.ok(r.kick > 0.1, 'the kick sounds from the kit');
  assert.ok(r.cut < r.open1 * 0.25, 'the closed hi-hat stops the open one: ' + r.cut + ' vs ' + r.open1);
  // the test bank has no GM 33, so the bass falls back to its preset rules: still plays
  assert.ok(r.bass > 0.01);
  assert.deepEqual(errors, []);
});

test('gospel organ: in tune, percussion on the first key, Leslie spins with the pedal', async () => {
  const { page, errors } = await open(false);
  await page.evaluate(() => { window.__gpa.Snd.setRoom('off'); window.__gpa.S().prefs.instrument = 'organ'; });
  const r = await measure(page, 'organ', [57]);
  assert.ok(r.hz && Math.abs(r.hz / 110 - Math.round(r.hz / 110)) < 0.03, 'locked to the A harmonic series: ' + r.hz);
  assert.ok(r.peak > 0.05 && r.peak < 1.01, 'a healthy level: ' + r.peak);
  // the sustain pedal switches the Leslie instead of sustaining
  const s = await page.evaluate(() => { const Snd = window.__gpa.Snd; const a = Snd.leslieFast(); Snd.pedal(true, 'midi'); const b = Snd.leslieFast(), held = Snd.pedalState(); Snd.pedal(false, 'midi'); return { a, b, held, c: Snd.leslieFast() }; });
  assert.deepEqual(s, { a: false, b: true, held: false, c: false });
  // the Leslie button appears with the sound picker in the Piano Lab and toggles
  await page.evaluate(() => window.__gpa.go('lab'));
  await page.click('button.leslie');
  assert.equal(await page.evaluate(() => window.__gpa.Snd.leslieFast()), true);
  assert.match(await page.textContent('button.leslie'), /fast/);
  // chorale vs tremolo: the fast Leslie wobbles the level much more within a short window
  const wob = await page.evaluate(async () => {
    const Snd = window.__gpa.Snd, out = {};
    for (const fast of [false, true]) {
      Snd.leslie(fast);
      const b = await Snd.render({ bpm: 60, total: 2, events: [{ t: 0, d: 2, notes: [72], vel: 0.8 }] }, { inst: 'organ' });
      const L = b.getChannelData(0), sr = b.sampleRate, w = Math.floor(sr * 0.01), lv = [];
      for (let i = Math.floor(0.6 * sr); i < 1.6 * sr; i += w) { let e = 0; for (let j = 0; j < w; j++) e += L[i + j] * L[i + j]; lv.push(Math.sqrt(e / w)); }
      let crossings = 0; const mean = lv.reduce((a, x) => a + x, 0) / lv.length;
      for (let i = 1; i < lv.length; i++) if ((lv[i - 1] - mean) * (lv[i] - mean) < 0) crossings++;
      out[fast ? 'fast' : 'slow'] = crossings;
    }
    Snd.leslie(false);
    return out;
  });
  assert.ok(wob.fast > wob.slow * 2, 'the tremolo is faster: ' + JSON.stringify(wob));
  assert.deepEqual(errors, []);
});

test('rooms: dry has no tail, the church rings longer than the studio room, and the Profile picker works', async () => {
  const { page, errors } = await open(false);
  const tails = await page.evaluate(async () => {
    const Snd = window.__gpa.Snd, out = {};
    for (const room of ['off', 'room', 'church']) {
      Snd.setRoom(room);
      const b = await Snd.render({ bpm: 120, total: 8, events: [{ t: 0, d: 0.2, drum: 'k', vel: 0.9 }] });
      const L = b.getChannelData(0), sr = b.sampleRate; let e = 0; for (let i = Math.floor(1.2 * sr); i < 2.2 * sr; i++) e += L[i] * L[i];
      out[room] = e;
    }
    return out;
  });
  assert.ok(tails.off < 1e-6, 'dry: silent after the drum: ' + tails.off);
  assert.ok(tails.church > tails.room * 3, 'church rings longer: ' + JSON.stringify(tails));
  await page.evaluate(() => window.__gpa.go('profile', { tab: 'settings' }));
  await page.selectOption('#roompick', 'room');
  assert.equal(await page.evaluate(() => window.__gpa.S().prefs.room), 'room');
  assert.deepEqual(errors, []);
});
