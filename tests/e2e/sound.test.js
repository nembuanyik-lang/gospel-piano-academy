const T = require('./tabs').auto;
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
  const page = T(await ctx.newPage());
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

test('your own sound library: choose a .sf2, it plays and is kept after a restart, bad files are refused, and you can go back', async () => {
  const fs = require('fs'), os = require('os');
  const { page, errors } = await open(false);
  assert.equal(await page.evaluate(() => window.__gpa.Snd.info().bank), 'none', 'no library to start with');
  const good = path.join(os.tmpdir(), 'My-Test-Library.sf2'); fs.writeFileSync(good, build());
  const notSf = path.join(os.tmpdir(), 'Not-A-Font.sf2'); fs.writeFileSync(notSf, 'this is not a soundfont at all');
  const wrong = path.join(os.tmpdir(), 'Library.sf3'); fs.writeFileSync(wrong, build());
  await page.evaluate(() => window.__gpa.go('profile', { tab: 'settings' }));
  await page.waitForSelector('#sndlibfile', { state: 'attached' });
  // refused files change nothing
  await page.setInputFiles('#sndlibfile', notSf); await page.waitForFunction(() => /not a SoundFont|could not be read/.test(document.getElementById('sndlibmsg').textContent), null, { timeout: 8000 });
  await page.setInputFiles('#sndlibfile', wrong); await page.waitForFunction(() => /ends in \.sf2/.test(document.getElementById('sndlibmsg').textContent), null, { timeout: 8000 });
  assert.equal(await page.evaluate(() => window.__gpa.Snd.info().bank), 'none');
  // a good one is used right away
  await page.setInputFiles('#sndlibfile', good);
  await page.waitForFunction(() => window.__gpa.Snd.info().bank === 'ready', null, { timeout: 10000 });
  let info = await page.evaluate(() => window.__gpa.Snd.info());
  assert.equal(info.bankOwn.name, 'My-Test-Library.sf2'); assert.match(info.bankCredit, /your own sound library/);
  await page.waitForSelector('[data-act=sndlibreset]');
  // it is kept: a fresh page load uses it again
  await page.reload(); await page.evaluate(() => { const g = window.__gpa; g.S().profile.onboarded = true; g.Snd.ensure(); });
  await page.waitForFunction(() => window.__gpa.Snd.info().bank === 'ready', null, { timeout: 10000 });
  assert.equal((await page.evaluate(() => window.__gpa.Snd.info().bankOwn)).name, 'My-Test-Library.sf2', 'kept after a restart');
  // it really plays: the library's tone is 440 Hz, so A4 comes out in tune
  const pitch = await page.evaluate(async () => { const buf = await window.__gpa.Snd.render({ bpm: 60, total: 2, events: [{ t: 0, d: 2, notes: [69], vel: 0.8 }] }, { inst: 'epiano' }); const sr = buf.sampleRate, seg = buf.getChannelData(0).slice(Math.floor(0.5 * sr), Math.floor(0.5 * sr) + 4096); const r = Pitch.yin(seg, sr); return r ? r.hz : null; });
  assert.ok(Math.abs(pitch - 440) < 3, 'plays the library: ' + pitch);
  // and back to the built-in library
  await page.evaluate(() => window.__gpa.go('profile', { tab: 'settings' })); await page.waitForSelector('[data-act=sndlibreset]');
  await page.click('[data-act=sndlibreset]');
  await page.waitForFunction(() => { const i = window.__gpa.Snd.info(); return !i.bankOwn && i.bank !== 'loading'; }, null, { timeout: 10000 });
  await page.reload(); await page.evaluate(() => { window.__gpa.S().profile.onboarded = true; window.__gpa.Snd.ensure(); });
  await page.waitForFunction(() => { const b = window.__gpa.Snd.info().bank; return b === 'ready' || b === 'none'; }, null, { timeout: 10000 });
  assert.equal(await page.evaluate(() => window.__gpa.Snd.info().bankOwn), null, 'the choice is forgotten');
  for (const f of [good, notSf, wrong]) fs.unlinkSync(f);
  assert.deepEqual(errors, []);
});

test('part sound: tone, even out and extra room change the sound, flat changes nothing, and the controls work', async () => {
  const { page, errors } = await open(false);
  await page.evaluate(() => window.__gpa.Snd.setRoom('off'));
  const R = (mixPart, events) => page.evaluate(async ([m, events]) => { const buf = await window.__gpa.Snd.render({ bpm: 60, total: 4, events, mix: m ? { chords: m } : undefined }, { inst: 'piano' }); return Array.from(buf.getChannelData(0)).filter((x, i) => i % 1 === 0).length ? (() => { const d = buf.getChannelData(0), sr = buf.sampleRate; let e = 0, de = 0, pk = 0; for (let i = 1; i < d.length; i++) { e += d[i] * d[i]; de += (d[i] - d[i - 1]) ** 2; pk = Math.max(pk, Math.abs(d[i])); } const win = (a, b) => { let s = 0; for (let i = Math.floor(a * sr); i < Math.floor(b * sr); i++) s += d[i] * d[i]; return Math.sqrt(s / (Math.floor(b * sr) - Math.floor(a * sr))); }; return { bright: de / e, peak: pk, w1: win(0.2, 0.9), w2: win(2.2, 2.9), tail: win(1.4, 2.4) }; })() : null; }, [mixPart, events]);
  const chord = [{ t: 0, d: 2, notes: [48, 55, 60, 64, 67], vel: 0.8 }];
  const flat = await R(null, chord), zero = await R({ v: 1, pan: 0 }, chord);
  assert.ok(Math.abs(flat.peak - zero.peak) < 0.03 * flat.peak && Math.abs(flat.bright - zero.bright) < 0.02 * flat.bright, 'flat = no change (the synthesised piano has a little random noise): ' + [flat.peak, zero.peak, flat.bright, zero.bright].join(' '));
  const warm = await R({ v: 1, pan: 0, tone: -1 }, chord), bright = await R({ v: 1, pan: 0, tone: 1 }, chord);
  assert.ok(bright.bright > flat.bright * 1.1 && warm.bright < flat.bright * 0.9, 'tone: ' + [warm.bright, flat.bright, bright.bright].map(x => x.toFixed(4)));
  const loudSoft = [{ t: 0, d: 0.6, notes: [60, 64, 67], vel: 1 }, { t: 2, d: 0.6, notes: [60, 64, 67], vel: 0.15 }];
  const dry = await R({ v: 1, pan: 0 }, loudSoft), even = await R({ v: 1, pan: 0, comp: 1 }, loudSoft);
  assert.ok(even.w1 / even.w2 < dry.w1 / dry.w2 * 0.85, 'evening out: ' + (dry.w1 / dry.w2).toFixed(2) + ' -> ' + (even.w1 / even.w2).toFixed(2));
  const note = [{ t: 0, d: 0.3, notes: [60], vel: 0.8, drum: undefined }];
  const noRoom = await R({ v: 1, pan: 0 }, [{ t: 0, d: 0.2, notes: [72], vel: 0.8 }]), room = await R({ v: 1, pan: 0, room: 1 }, [{ t: 0, d: 0.2, notes: [72], vel: 0.8 }]);
  assert.ok(room.tail > noRoom.tail * 1.5, 'extra room adds a tail: ' + noRoom.tail.toExponential(2) + ' -> ' + room.tail.toExponential(2));
  assert.deepEqual(errors, []);
});

test('levels through the song: a silenced part really is silent in the rendered song, the rest is untouched', async () => {
  const srv2 = serve(path.join(__dirname, '..', '..', 'app'), 8822), b = await chromium.launch();
  try {
    const page = await (await b.newContext()).newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8822/');
    const r = await page.evaluate(async () => {
      const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
      const P = g.S().songs[g.S().songs.length - 1]; P.key = 'D'; P.bpm = 120; P.beat = 'rock';
      P.sections.Verse.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
      P.sections.Chorus.chords = P.sections.Verse.chords.map(c => Object.assign({}, c)); P.form = [{ s: 'Verse' }, { s: 'Chorus' }]; P.structure = ['Verse', 'Chorus'];
      const rms = (buf, a, b) => { const d = buf.getChannelData(0), sr = buf.sampleRate; let s = 0, n = 0; for (let i = Math.round(a * sr); i < Math.round(b * sr) && i < d.length; i++) { s += d[i] * d[i]; n++; } return Math.sqrt(s / n); };
      const half = (60 / P.bpm) * 8, base = await renderSong(P, {}), b0 = [rms(base, 0.2, half - 0.2), rms(base, half + 0.2, 2 * half - 0.2)];
      P.form[1].lv = { drums: -60, bass: -60, chords: -60 };
      const q = await renderSong(P, {}), b1 = [rms(q, 0.2, half - 0.2), rms(q, 2 * half - 1, 2 * half - 0.1)];
      return { b0, b1 };
    });
    assert.ok(Math.abs(r.b1[0] - r.b0[0]) < 0.002, 'the verse is the same');
    assert.ok(r.b1[1] < r.b0[1] * 0.05, 'the silenced chorus is silent: ' + r.b1[1]);
    assert.deepEqual(errors, []);
  } finally { await b.close(); srv2.close(); }
});

test('mixer EQ, low cut and duck under the kick: each changes the rendered sound as asked', async () => {
  const srv2 = serve(path.join(__dirname, '..', '..', 'app'), 8825), b = await chromium.launch();
  try {
    const page = await (await b.newContext()).newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8825/');
    const r = await page.evaluate(async () => {
      const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
      const P = g.S().songs[g.S().songs.length - 1]; P.key = 'D'; P.bpm = 120; P.beat = 'rock'; P.bassStyle = 'root'; P.style = 'whole';
      P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 8, push: false }]; P.form = [{ s: 'Chorus' }]; P.structure = ['Chorus'];
      const rms = (buf, a, b) => { const d = buf.getChannelData(0), sr = buf.sampleRate; let s = 0, n = 0; for (let i = Math.round(a * sr); i < Math.round(b * sr) && i < d.length; i++) { s += d[i] * d[i]; n++; } return Math.sqrt(s / n); };
      const m = mixerOf(P), out = {};
      let st = await renderSong(P, { only: { part: 'bass' } }); const bass = rms(st, 0.3, 3.5);
      m.bass.lc = 250; st = await renderSong(P, { only: { part: 'bass' } }); out.lowCut = rms(st, 0.3, 3.5) / bass; m.bass.lc = 0;
      m.bass.el = -12; st = await renderSong(P, { only: { part: 'bass' } }); out.shelf = rms(st, 0.3, 3.5) / bass; m.bass.el = 0;
      st = await renderSong(P, { only: { part: 'chords' } }); const ch = rms(st, 0.3, 3.5); m.chords.em = 12; m.chords.ef = 1000; st = await renderSong(P, { only: { part: 'chords' } }); out.mid = rms(st, 0.3, 3.5) / ch; m.chords.em = 0;
      m.drums.v = 0.0005; const f0 = await renderSong(P, {}); const a0 = rms(f0, 0, 0.1);
      m.bass.duck = 0.9; m.chords.duck = 0.9; const f1 = await renderSong(P, {}); out.duck = rms(f1, 0, 0.1) / a0;
      const c = Sanitize.cleanState({ songs: [{ id: 'pq', mixer: { bass: { lc: 9999, el: -99, em: 3, ef: 5, eh: 'x', duck: 5 } } }] }, { styles: ['groove'], beats: ['none'], keys: ['C'] }).songs[0].mixer.bass;
      out.clean = [c.lc, c.el, c.em, c.ef, c.eh, c.duck];
      return out;
    });
    assert.ok(r.lowCut < 0.7, 'the low cut takes out the deep bass: ' + r.lowCut);
    assert.ok(r.shelf < 0.6, 'the bass shelf turns the low end down: ' + r.shelf);
    assert.ok(r.mid > 1.3, 'the middle band brings the keys forward: ' + r.mid);
    assert.ok(r.duck < 0.5, 'the keys and bass dip when the kick hits: ' + r.duck);
    assert.deepEqual(r.clean, [500, -12, 3, 150, 0, 0.9]);
    assert.deepEqual(errors, []);
  } finally { await b.close(); srv2.close(); }
});
