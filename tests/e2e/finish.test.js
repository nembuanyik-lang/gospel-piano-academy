// Finishing a song in the Song Lab: multitrack recording with overdubs, the mixer, mastering to a loudness target,
// MP3 (with a stand-in encoder: the real LAME encoder is added by the release build), stems in a ZIP, drum fills,
// swells and endings, and the song details in the files and on the lyrics sheet.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const serve = require('./serve');
const FIX = path.join(__dirname, '..', 'fixtures');
if (!fs.existsSync(path.join(FIX, 'voice-five.wav'))) execFileSync('python3', [path.join(FIX, 'make-voice.py'), FIX]);

const PORT = 8800;
let srv, browser;
test.before(async () => {
  srv = serve(path.join(__dirname, '..', '..', 'app'), PORT);
  browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + path.join(FIX, 'voice-five.wav'), '--autoplay-policy=no-user-gesture-required'] });
});
test.after(async () => { await browser.close(); srv.close(); });

async function open(init) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, permissions: ['microphone'] });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'He Did It'; P.key = 'D'; P.bpm = 120; P.beat = 'ballad'; P.style = 'groove';
    P.sections.Verse.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 5, q: 'major', b: null, beats: 4, push: false }];
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
    P.melodies.Chorus = { notes: [{ m: 62, t: 0, d: 2 }, { m: 66, t: 2, d: 2 }, { m: 69, t: 4, d: 4 }] };
    P.lyrics.chorus = 'He did it, He did it\nGlory to His name';
    P.form = [{ s: 'Verse' }, { s: 'Chorus' }]; P.structure = ['Verse', 'Chorus'];
    g.go('song', { pid: P.id });
  });
  return { page, errors };
}
const proj = page => page.evaluate(() => { const g = window.__gpa; return JSON.parse(JSON.stringify(g.S().songs[g.S().songs.length - 1])); });
const recordOn = async (page, n) => {
  await page.click('#guiderec');
  await page.waitForFunction(n => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], T = trackOf(P, g.ui.proj.trk || ''); return T && T.takes.length === n; }, n, { timeout: 40000 });
  await page.waitForTimeout(300);
};

test('multitrack: a lead vocal, then a harmony recorded while the lead plays along', async () => {
  const { page, errors } = await open();
  await recordOn(page, 1);                                   // the lead vocal (guide)
  await page.click('[data-act=ptrkadd][data-kind=vocal]');
  await page.fill('[data-bind=ptrkname]', 'Alto harmony'); await page.locator('[data-bind=ptrkname]').blur();
  // spy: what plays while the harmony is recorded
  await page.evaluate(() => { const real = window.__gpa.Snd.play; window.__played = []; window.__gpa.Snd.play = (sc, o) => { window.__played.push((sc.audio || []).length); return real(sc, o); }; });
  await recordOn(page, 1);
  const p = await proj(page);
  assert.equal(p.tracks.length, 1); assert.equal(p.tracks[0].name, 'Alto harmony');
  assert.match(p.tracks[0].takes[0].k, new RegExp('^' + p.id + ':t' + p.tracks[0].id + ':1$'));
  assert.ok((await page.evaluate(() => window.__played)).some(n => n >= 1), 'the lead vocal played while the harmony was recorded');
  assert.equal(await page.evaluate(() => { const g = window.__gpa; return recordedTracks(g.S().songs[g.S().songs.length - 1]).length; }), 2);
  assert.match(await page.textContent('.trackbar'), /Lead vocal \(guide\).*Alto harmony/);
  // each track has its own vocal sound
  await page.selectOption('[data-bind=pfxpreset]', 'choir');
  assert.equal((await proj(page)).tracks[0].fx.preset, 'choir');
  assert.deepEqual(errors, []);
});

test('the mixer: volume, left-right, mute and solo reach playback; the master meter moves', async () => {
  const { page, errors } = await open();
  await page.locator('[data-bind=mxvol][data-k=chords]').evaluate(el => { el.value = '50'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('[data-bind=mxpan][data-k=chords]').evaluate(el => { el.value = '-40'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('[data-act=mxmute][data-k=drums]');
  let r = await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], A = arrangeSong(P); return { mix: A.script.mix, drums: A.events.filter(e => e.drum).length, bass: A.events.filter(e => e.part === 'bass').length }; });
  assert.deepEqual([r.mix.chords.v, r.mix.chords.pan, r.drums], [0.5, -0.4, 0]); assert.ok(r.bass > 0);
  await page.click('[data-act=mxsolo][data-k=bass]');
  r = await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], A = arrangeSong(P); return { mix: A.script.mix, kinds: [...new Set(A.events.map(e => Snd.partOf(e)))] }; });
  assert.deepEqual(r.kinds, ['bass'], 'solo: only the bass plays'); assert.equal(r.mix.chords.v, 0);
  await page.click('[data-act=mxunsolo]');
  // the meter shows the level while the song plays
  await page.click('#songplay'); await page.waitForTimeout(1500);
  const w = await page.evaluate(() => parseFloat(document.querySelector('#mastermeter').style.width));
  await page.click('#songplay');
  assert.ok(w > 10, 'the meter moved: ' + w);
  assert.deepEqual(errors, []);
});

test('mastering hits the loudness target; MP3 is offered when the encoder is present; stems come in a ZIP', async () => {
  // a stand-in for the LAME encoder (the release build copies the real one into app/vendor)
  const { page, errors } = await open(() => { window.lamejs = { Mp3Encoder: class { constructor(c, sr, k) { this.k = k; } encodeBuffer() { return new Int8Array([-1, -5, 1, 2]); } flush() { return new Int8Array([0]); } } }; });
  await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.info = { writers: 'Minister Kemamah', artist: 'Kemamah Worship', year: '2026' }; g.render(); });
  const [w] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('[data-act=pexp][data-format=wav]')]);
  await page.waitForFunction(() => /LUFS/.test(document.querySelector('#expinfo').textContent), null, { timeout: 60000 });
  const txt = await page.textContent('#expinfo'), lufs = parseFloat(/(-?\d+\.\d) LUFS/.exec(txt)[1]), tp = parseFloat(/peak (-?\d+\.\d) dBTP/.exec(txt)[1]);
  assert.ok(Math.abs(lufs - -14) <= 1, 'streaming loudness: ' + txt); assert.ok(tp <= -0.9, 'true peak under −1 dB: ' + txt);
  const wav = fs.readFileSync(await w.path());
  assert.ok(wav.includes(Buffer.from('Minister Kemamah')) && wav.includes(Buffer.from('ICOP')), 'writers and copyright in the WAV');
  await page.selectOption('[data-bind=pmaster]', 'loud');
  const [m] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('[data-act=pexp][data-format=mp3]')]);
  const mp3 = fs.readFileSync(await m.path());
  assert.equal(mp3.toString('latin1', 0, 3), 'ID3'); assert.ok(mp3.includes(Buffer.from('TIT2')) && /\.mp3$/.test(m.suggestedFilename()));
  await page.waitForFunction(() => /LUFS/.test(document.querySelector('#expinfo').textContent) && /-1\d\.\d LUFS|-9\.\d LUFS/.test(document.querySelector('#expinfo').textContent), null, { timeout: 60000 });
  assert.match(await page.textContent('#expinfo'), /-(9|10|11)\.\d LUFS/, 'loud target');
  // stems
  const [z] = await Promise.all([page.waitForEvent('download', { timeout: 180000 }), page.click('[data-act=pstems]')]);
  const zip = fs.readFileSync(await z.path()), names = [];
  for (let o = 0; o + 46 < zip.length; o++) if (zip.readUInt32LE(o) === 0x02014b50) { const n = zip.readUInt16LE(o + 28); names.push(zip.toString('utf8', o + 46, o + 46 + n)); }
  assert.ok(names.includes('README.txt') && names.some(n => /Drums\.wav$/.test(n)) && names.some(n => /Bass\.wav$/.test(n)) && names.some(n => /Keyboard chords\.wav$/.test(n)) && names.some(n => /Melody\.wav$/.test(n)), names.join(', '));
  const sizes = []; for (let o = 0; o + 30 < zip.length; o++) if (zip.readUInt32LE(o) === 0x04034b50) { const n = zip.readUInt16LE(o + 26), nm = zip.toString('utf8', o + 30, o + 30 + n); if (/\.wav$/.test(nm)) sizes.push(zip.readUInt32LE(o + 30 + n + 40)); }   // the audio data size of each WAV
  assert.ok(sizes.length >= 4 && sizes.every(s => s === sizes[0]), 'every stem has the same length: ' + sizes);
  assert.deepEqual(errors, []);
});

test('in the desktop app, stems and the song package are written to disk piece by piece (or not at all if you cancel)', { timeout: 300000 }, async () => {
  const useDesktopSave = require('./desktop-save.js'), { zipNames } = useDesktopSave;
  const { page, errors } = await open();
  const desk = await useDesktopSave(page);
  await desk.install();
  // a recorded track, so the package carries audio
  await page.evaluate(async () => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], c = g.Snd.ensure(), b = c.createBuffer(1, 48000 * 3, 48000), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = 0.3 * Math.sin(2 * Math.PI * 330 * i / 48000);
    await GuideStore.put(P.id + ':1', new Blob([encodeWav(b, 24)], { type: 'audio/wav' }));
    P.guide = { at: 1, dur: 3, gain: 1, nudgeMs: 0, takes: [{ k: P.id + ':1', at: 1, dur: 3, n: 1 }], main: 0, comp: {}, fx: { preset: 'off', nr: 'off' } };
    g.go('song', { pid: P.id });
  });
  // cancel in the save window: nothing is made, and the app says so
  desk.cancelNext();
  await page.click('[data-act=pstems]');
  await page.waitForFunction(() => /Not saved/.test(document.querySelector('#expinfo').textContent), null, { timeout: 30000 });
  assert.equal(desk.saved.length, 0);
  await page.click('[data-act=pstems]');
  await page.waitForFunction(() => /stems \(/.test(document.querySelector('#expinfo').textContent), null, { timeout: 180000 });
  await page.click('[data-act=ppkg]');
  await page.waitForFunction(() => /recordings and loops/.test(document.querySelector('#expinfo').textContent), null, { timeout: 60000 });
  assert.equal(desk.saved.length, 2, 'two files on disk: ' + desk.saved.join(', '));
  assert.ok(desk.log.maxPiece <= 8 * 1048576, 'sent in pieces of 8 MB at most: ' + desk.log.maxPiece);
  assert.deepEqual(fs.readdirSync(desk.dir).filter(f => /\.part$/.test(f)), [], 'no half-written files left');
  const zlib = require('zlib');
  for (const f of desk.saved) {
    const z = fs.readFileSync(f), entries = zipNames(z);
    for (const e of entries) assert.equal(zlib.crc32(z.subarray(e.at, e.at + e.size)) >>> 0, e.crc >>> 0, 'checksum of ' + e.name + ' in ' + path.basename(f));
    if (/stems/.test(f)) assert.ok(entries.some(e => /Drums\.wav$/.test(e.name)) && entries.some(e => /README/.test(e.name)) && entries.some(e => /Lead vocal/.test(e.name)), entries.map(e => e.name).join(', '));
    else {
      assert.match(f, /\.gmasong$/);
      assert.deepEqual(entries.map(e => e.name).filter(n => /json$/.test(n)).sort(), ['manifest.json', 'song.json']);
      // the package opens again in the app
      const back = await page.evaluate(async b64 => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); const r = await importPackage(u); return { stored: r.stored, title: r.P.title }; }, z.toString('base64'));
      assert.deepEqual(back, { stored: 1, title: 'He Did It (copy)' });
    }
  }
  assert.deepEqual(errors, []);
});

test('without the encoder the app says so and offers WAV', async () => {
  const { page, errors } = await open();
  await page.click('[data-act=pexp][data-format=mp3]');
  await page.waitForFunction(() => /MP3 maker is not in this copy/.test(document.querySelector('#expinfo').textContent), null, { timeout: 60000 });
  assert.deepEqual(errors, []);
});

test('arrangement touches: drum fills, a swell, and the three endings', async () => {
  const { page, errors } = await open();
  await page.check('[data-bind=pffill][data-i="0"]');
  await page.check('[data-bind=pfswell][data-i="0"]');
  const a = await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], A = arrangeSong(P); return { toms: A.events.filter(e => /^t[hml]$/.test(e.drum)).map(e => e.t), swell: A.events.filter(e => e.drum === 'sw').map(e => [e.t, e.d]), crash8: A.events.some(e => e.drum === 'c' && Math.abs(e.t - 8) < 1e-6) }; });
  // the verse is two chords of a bar each (8 beats): the fill is on its last beat, the swell on its last two
  assert.ok(a.toms.length >= 2 && a.toms.every(t => t >= 7 && t < 8), 'toms on the last beat of the verse: ' + a.toms);
  assert.deepEqual(a.swell, [[6, 2]]); assert.ok(a.crash8, 'a crash on the chorus after the fill');
  for (const [end, check] of [['hold', 'hold'], ['ritard', 'ritard'], ['fade', 'fade']]) {
    await page.selectOption('[data-bind=pending]', end);
    const r = await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], A = arrangeSong(P); return { total: A.total, labels: A.timeline.map(t => t.label), fade: A.script.fade, lastChordD: A.events.filter(e => e.notes && e.part !== 'bass' && !e.mel).slice(-1)[0].d }; });
    if (check === 'hold') { assert.equal(r.total, 24); assert.equal(r.labels.slice(-1)[0], 'Ending (hold)'); }
    if (check === 'ritard') { assert.ok(r.total > 16.5 && r.total < 24, 'the last two bars take longer: ' + r.total); }
    if (check === 'fade') { assert.deepEqual(r.fade, { from: 8, to: 16 }, 'a short song fades over its second half'); }
  }
  assert.deepEqual(errors, []);
});

test('song details: copyright line, lyrics sheet, and credits on the charts', async () => {
  const { page, errors } = await open();
  await page.fill('[data-bind=pinfo][data-k=writers]', 'Minister Kemamah');
  await page.fill('[data-bind=pinfo][data-k=theme]', 'Psalm 126:3');
  await page.fill('[data-bind=pinfo][data-k=year]', '2026');
  assert.match(await page.textContent('#copyline'), /© 2026 Minister Kemamah · Words and music: Minister Kemamah/);
  const [l] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=plyrics]')]);
  const html = fs.readFileSync(await l.path(), 'utf8');
  assert.ok(/He Did It/.test(html) && /Words and music: Minister Kemamah/.test(html) && /Glory to His name/.test(html) && /Psalm 126:3/.test(html));
  const [c] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=pchart][data-mode=numbers]')]);
  assert.match(fs.readFileSync(await c.path(), 'utf8'), /© 2026 Minister Kemamah/);
  assert.deepEqual(errors, []);
});

test('playing through the keyboard: the notes go to the keyboard and the recorded tracks and loops play on the computer', async () => {
  const { page, errors } = await open();
  await recordOn(page, 1);
  const r = await page.evaluate(async () => {
    const g = window.__gpa, S = g.S(), sent = [], w = ms => new Promise(res => setTimeout(res, ms));
    Midi.access = { outputs: new Map([['o1', { name: 'Digital Keyboard', send: d => sent.push(Array.from(d)) }]]), inputs: new Map() }; Midi.names = ['Digital Keyboard']; Midi.status = 'ready';
    S.prefs.kbdOut = { on: true, prog: 0 };
    let clips = null; const orig = g.Snd.playClips; g.Snd.playClips = (a, t, b) => { clips = a.length; return orig.call(g.Snd, a, t, b); };
    g.render(); await w(100);
    document.querySelector('#songplay').click(); await w(2500); document.querySelector('#songplay').click();
    g.Snd.playClips = orig; S.prefs.kbdOut = { on: false, prog: 0 };
    return { notes: sent.filter(d => (d[0] & 0xF0) === 0x90).length, clips };
  });
  assert.ok(r.notes > 3, 'notes went to the keyboard: ' + r.notes);
  assert.equal(r.clips, 1, 'the recorded lead vocal played on the computer');
  assert.deepEqual(errors, []);
});

test('memory saver: tracks play with a live vocal sound, the saved song still has them, and leaving a song frees its audio', async () => {
  const { page, errors } = await open();
  await recordOn(page, 1);
  await page.evaluate(() => { const g = window.__gpa; g.S().prefs.memSaver = 'on'; g.render(); });
  assert.match(await page.textContent('.memnote'), /Memory saver is on/);
  const r = await page.evaluate(async () => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1];
    const live = await recordedAudio(P, { live: true });
    const held = GuideStore.heldMB();
    // the saved song with the saver: the track is mixed in one at a time
    const withT = await renderSong(P, {}), without = await renderSong(P, { tracks: false });
    let diff = 0; const a = withT.getChannelData(0), b = without.getChannelData(0); for (let i = 0; i < a.length; i += 64) diff += Math.abs(a[i] - b[i]);
    g.S().prefs.memSaver = 'off';
    const full = await recordedAudio(P, { live: true });
    return { chain: live[0].chain, mono: live[0].buf.numberOfChannels, held, diff, fullChain: full[0].chain, fullCh: full[0].buf.numberOfChannels };
  });
  assert.equal(r.chain, 'worship', 'played through the live vocal sound'); assert.equal(r.mono, 1, 'only the light mono copy is kept');
  assert.ok(r.diff > 1, 'the saved song contains the track');
  assert.equal(r.fullChain, null); assert.equal(r.fullCh, 2, 'without the saver the full processed sound is kept ready');
  // play with the saver on: no errors
  await page.evaluate(() => { window.__gpa.S().prefs.memSaver = 'on'; });
  await page.click('#songplay'); await page.waitForTimeout(1500); await page.click('#songplay');
  // leaving the song frees its audio
  assert.ok(await page.evaluate(() => GuideStore.heldMB()) > 0);
  await page.evaluate(() => window.__gpa.go('home')); await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => GuideStore.heldMB()), 0, 'nothing held after leaving the song');
  assert.deepEqual(errors, []);
});
