const T = require('./tabs').auto;
// A full-length song as a real session would leave it: about four minutes, three recorded tracks (four-minute 24-bit
// takes with the vocal chain on), a drum loop, a keys loop, choir parts, a key change, tags and an ending. Measures
// how long playback takes to start, the mastered export, and the stems, and checks the results.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const serve = require('./serve');
const useFakeSounds = require('./fake-sounds.js');   // sample-based piano and instruments, like the installed app

const PORT = 8812;
let srv, browser;
const { execSync } = require('child_process');
/* the memory of the whole browser (every Chromium process: the page, the audio thread, the GPU process), sampled
   twice a second from outside the browser, so audio buffers held outside JavaScript are counted too */
let lastSplit = {};
/* proportional memory (PSS): memory shared between Chromium's processes is counted once, not once per process,
   which is what the computer actually has to find */
function browserMB() {
  try {
    const out = execSync("ps -eo pid,args | grep -E 'chrom|headless_shell' | grep -v grep", { encoding: 'utf8' });
    const split = {}; let total = 0;
    out.trim().split('\n').forEach(l => {
      const pid = parseInt(l, 10); let kb = 0;
      try { kb = +(/Pss:\s+(\d+)/.exec(fs.readFileSync('/proc/' + pid + '/smaps_rollup', 'utf8')) || [0, 0])[1]; } catch (e) { return; }
      const sub = /--utility-sub-type=([\w.]+)/.exec(l), t = (/--type=([\w-]+)/.exec(l) || [0, 'browser'])[1] + (sub ? ':' + sub[1].split('.').pop() : '');
      split[t] = (split[t] || 0) + Math.round(kb / 1024); total += kb;
    });
    lastSplit = split;
    return Math.round(total / 1024);
  } catch (e) { return 0; }
}
test.before(async () => { srv = serve(process.env.APP_ROOT || path.join(__dirname, '..', '..', 'app'), PORT); browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); });
test.after(async () => { await browser.close(); srv.close(); });

test('a four-minute song with three tracks, loops and choir: plays, masters, exports and makes stems in reasonable time', { timeout: 30 * 60 * 1000 }, async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await ctx.addInitScript(() => { window.lamejs = { Mp3Encoder: class { encodeBuffer(l) { return new Int8Array(Math.ceil(l.length / 1152) * 626); } flush() { return new Int8Array(0); } } }; });
  const page = T(await ctx.newPage()), errors = [];
  await useFakeSounds(page);
  if (process.env.MEM_SAVER) await page.addInitScript(v => { window.__memSaver = v; }, process.env.MEM_SAVER);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:' + PORT + '/');
  const setup = await page.evaluate(async () => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.Snd.ensure();
    if (window.__memSaver) g.S().prefs.memSaver = window.__memSaver;
    for (let i = 0; i < 100 && g.Snd.info().state !== 'ready'; i++) await new Promise(r => setTimeout(r, 100));
    g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1];
    Object.assign(P, { title: 'Stress', key: 'Ab', bpm: 76, beat: 'sunday', style: 'sunday', bassStyle: 'gospel', ending: 'ritard', choir: { on: true }, info: { writers: 'Minister Kemamah' } });
    P.mixer = { chords: { v: 1, pan: -0.2, tone: 0.3, comp: 0.5, room: 0.3, lc: 100, em: 3, ef: 1500, duck: 0.4 }, bass: { v: 1, pan: 0, tone: -0.3, comp: 0.6, el: 2, eh: -2, duck: 0.5 }, drums: { v: 1, pan: 0, comp: 0.4, room: 0.2 }, melody: { v: 1, pan: 0.2, tone: 0.2, room: 0.4 }, choir: { v: 0.9, pan: 0, comp: 0.3, room: 0.5 }, loops: { v: 1, pan: 0 } };   // every part has its sound switched on
    const C = (r, q, b) => ({ r, q, b: b === undefined ? null : b, beats: 4, push: false });
    P.sections.Intro.chords = [C(0, 'maj9'), C(5, 'major', 7)];
    P.sections.Verse.chords = [C(0, 'maj7'), C(4, '7'), C(9, 'm7'), C(5, 'maj7'), C(2, 'm7'), C(7, '13'), C(0, 'major', 4), C(5, 'major')];
    P.sections.Chorus.chords = [C(5, 'major'), C(6, 'dim7'), C(0, 'major', 7), C(9, 'm9'), C(2, 'm9'), C(7, '7#9'), C(0, 'maj9'), C(5, 'major', 7)];
    P.sections.Bridge.chords = [C(9, 'm7'), C(5, 'maj7'), C(2, 'm7'), C(7, '9sus4')];
    P.sections.Outro.chords = [C(0, 'maj9'), C(5, 'minor')];
    const mel = []; for (let b = 0; b < 32; b += 1) mel.push({ m: 68 + [0, 2, 4, 7, 4, 2, 0, -1][b % 8], t: b, d: 1 }); P.melodies.Chorus = { notes: mel }; P.melodies.Verse = { notes: mel.slice(0, 24) };
    P.form = [{ s: 'Intro' }, { s: 'Verse', fill: true }, { s: 'Chorus', x: 2, swell: true }, { s: 'Verse' }, { s: 'Chorus', x: 2 }, { s: 'Bridge', en: 'soft' }, { s: 'Chorus', x: 2, up: 1, tag: 2, en: 'full' }, { s: 'Outro' }];
    P.structure = P.form.map(i => i.s);
    const A = arrangeSong(P), secs = A.total * 60 / P.bpm;
    // three recorded tracks: the length of the song, 48 kHz, 24-bit, a voice-like tone with breath noise
    const c = g.Snd.ensure(), sr = 48000, n = Math.round(secs * sr);
    const take = async (key, f) => { const b = c.createBuffer(1, n, sr), d = b.getChannelData(0); let s = 7; for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; d[i] = (i % (sr * 2) < sr * 1.6 ? 0.3 * Math.sin(2 * Math.PI * f * i / sr) * (1 + 0.2 * Math.sin(i / 3000)) : 0) + (s / 2147483647 - 0.5) * 0.01; } await GuideStore.put(key, new Blob([encodeWav(b, 24)], { type: 'audio/wav' })); };
    await take(P.id + ':1', 415); await take(P.id + ':th1:1', 523); await take(P.id + ':tg1:1', 207);
    P.guide = { at: 1, dur: Math.round(secs), gain: 1, nudgeMs: 0, takes: [{ k: P.id + ':1', at: 1, dur: Math.round(secs), n: 1 }], main: 0, comp: {}, fx: { preset: 'worship', nr: 'preset' } };
    P.tracks = [{ id: 'h1', name: 'Harmony', kind: 'vocal', takes: [{ k: P.id + ':th1:1', at: 1, dur: Math.round(secs), n: 1 }], main: 0, comp: {}, fx: { preset: 'choir', nr: 'preset' }, gain: 0.7, pan: -0.3 },
      { id: 'g1', name: 'Guitar', kind: 'instrument', takes: [{ k: P.id + ':tg1:1', at: 1, dur: Math.round(secs), n: 1 }], main: 0, comp: {}, fx: { preset: 'natural', nr: 'off' }, gain: 0.8, pan: 0.35 }];
    // a drum loop and a keys loop
    const loop = async (id, f, beats, bpm) => { const ln = Math.round(beats * 60 / bpm * 44100), b = c.createBuffer(2, ln, 44100); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < ln; i++) d[i] = 0.2 * Math.sin(2 * Math.PI * f * i / 44100) * Math.exp(-((i % (44100 * 60 / bpm)) / 4000)); } await GuideStore.put('loop:' + P.id + ':' + id, new Blob([encodeWav(b, 16)], { type: 'audio/wav' })); };
    await loop('ld1', 90, 8, 90); await loop('lk1', 440, 8, 100);
    P.loops = [{ id: 'ld1', name: 'Drums', kind: 'loop', role: 'drums', bpm: 90, beats: 8, tr: 0, gain: 0.8, mute: false, secs: ['Verse', 'Chorus', 'Bridge'], offset: 0, dur: 5 },
      { id: 'lk1', name: 'Keys', kind: 'loop', role: 'music', bpm: 100, beats: 8, tr: 2, gain: 0.6, mute: false, secs: ['Chorus'], offset: 0, dur: 5 }];
    g.touch && g.touch(); window.__gpa.go('song', { pid: P.id });
    return { secs: Math.round(secs), beats: A.total };
  });
  assert.ok(setup.secs > 200 && setup.secs < 330, 'a full-length song: ' + setup.secs + ' s');
  // the desktop app's save-to-disk (as the installed app saves stems and packages)
  const useDesktopSave = require('./desktop-save.js'), desk = await useDesktopSave(page); if (!process.env.BROWSER_SAVE) await desk.install();   // BROWSER_SAVE=1: downloads, as in a browser (or an older version)
  const timing = {};
  let peak = 0; const peaks = {}; let phase = 'setup';
  let peakSplit = {}; const sampler = setInterval(() => { const m = browserMB(); if (m > peak) { peak = m; peakSplit = Object.assign({ phase }, lastSplit); } peaks[phase] = Math.max(peaks[phase] || 0, m); }, 500);
  phase = 'play';
  let t = Date.now();
  await page.click('#songplay');
  await page.waitForFunction(() => !/Preparing/.test(document.querySelector('#songpos').textContent), null, { timeout: 180000 });
  timing.firstPlay = (Date.now() - t) / 1000;
  await page.waitForTimeout(1500); await page.click('#songplay');
  t = Date.now(); await page.click('#songplay');
  await page.waitForFunction(() => !/Preparing/.test(document.querySelector('#songpos').textContent), null, { timeout: 60000 });
  timing.secondPlay = (Date.now() - t) / 1000;
  await page.waitForTimeout(800); await page.click('#songplay');
  phase = 'mp3'; t = Date.now();
  const [mp3] = await Promise.all([page.waitForEvent('download', { timeout: 600000 }), page.click('[data-act=pexp][data-format=mp3]')]);
  await page.waitForFunction(() => /LUFS/.test(document.querySelector('#expinfo').textContent), null, { timeout: 120000 });
  timing.mp3 = (Date.now() - t) / 1000;
  const info = await page.textContent('#expinfo');
  assert.match(info, /-1[345]\.\d LUFS/); assert.ok(fs.statSync(await mp3.path()).size > 1e6);
  phase = 'stems'; t = Date.now();
  let dlStems = null; if (process.env.BROWSER_SAVE) page.once('download', d => { dlStems = d; });
  await page.click('[data-act=pstems]');
  await page.waitForFunction(() => /stems \(/.test(document.querySelector('#expinfo').textContent), null, { timeout: 1500000, polling: 1000 });
  if (dlStems) desk.saved.push(await dlStems.path());
  timing.stems = (Date.now() - t) / 1000;
  const z = fs.readFileSync(desk.saved[0]), names = useDesktopSave.zipNames(z).map(e => e.name);
  phase = 'package'; t = Date.now();
  let dlPkg = null; if (process.env.BROWSER_SAVE) page.once('download', d => { dlPkg = d; });
  await page.click('[data-act=ppkg]');
  await page.waitForFunction(() => /recordings and loops/.test(document.querySelector('#expinfo').textContent), null, { timeout: 300000, polling: 1000 });
  if (dlPkg) desk.saved.push(await dlPkg.path());
  timing.package = (Date.now() - t) / 1000;
  phase = 'release'; t = Date.now();
  let dlRel = null; if (process.env.BROWSER_SAVE) page.once('download', d => { dlRel = d; });
  await page.click('[data-act=prelease]');
  await page.waitForFunction(() => /Checked/.test((document.querySelector('#relresult') || {}).textContent || ''), null, { timeout: 900000, polling: 1000 });
  if (dlRel) desk.saved.push(await dlRel.path());
  timing.release = (Date.now() - t) / 1000;
  const relNames = useDesktopSave.zipNames(fs.readFileSync(desk.saved[desk.saved.length - 1])).map(e => e.name);
  assert.ok(relNames.some(n => /\.wav$/.test(n)) && relNames.includes('README.txt'), 'the release ZIP holds the WAV and the note: ' + relNames);
  const mem = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
  // limits a musician would accept on a laptop (this test machine is slower than most)
  assert.ok(timing.firstPlay < 90, 'first play starts within 90 s: ' + timing.firstPlay);
  assert.ok(timing.secondPlay < 15, 'later plays start quickly (cached): ' + timing.secondPlay);
  assert.ok(timing.mp3 < 240, 'mastered MP3 within 4 minutes: ' + timing.mp3);
  const heap = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0);
  assert.ok(heap < 1200, 'working memory stays well under laptop limits: ' + Math.round(heap) + ' MB');
  clearInterval(sampler);
  console.log('MEMORY', JSON.stringify({ peakMB: peak, byPhase: peaks, atPeak: peakSplit }));
  console.log('TIMING', JSON.stringify(Object.assign({ songSeconds: setup.secs, stems: names.length - 1, zipMB: +(z.length / 1048576).toFixed(1), packageMB: +(fs.statSync(desk.saved[1]).size / 1048576).toFixed(1), heapMB: mem }, timing)));
  // a hard limit for a 4 GB laptop: Windows itself needs about 2-2.5 GB, so the whole app must stay well under 1.5 GB
  const LIMIT = +(process.env.MEM_LIMIT_MB || 1400);
  assert.ok(peak > 200, 'the memory sampler worked: ' + peak + ' MB');
  assert.ok(peak < LIMIT, 'the whole browser stays under ' + LIMIT + ' MB at its peak: ' + peak + ' MB');
  assert.equal(names.length, 11, 'drums, bass, keys, melody, choir, two loops, three tracks and the README: ' + names.join(', '));
  assert.deepEqual(errors, []);
});
