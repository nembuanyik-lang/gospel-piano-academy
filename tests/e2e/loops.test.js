// Loops and beats in the Song Lab: import audio loops, a whole beat and a MIDI file; tempo and key are read from the
// name or measured; loops are stretched to the song's tempo with their pitch kept and moved into the song's key;
// the app's own parts can be switched off; everything reaches the audio and MIDI exports.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const serve = require('./serve');

const PORT = 8798;
let srv, browser;
test.before(async () => { srv = serve(path.join(__dirname, '..', '..', 'app'), PORT); browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); });
test.after(async () => { await browser.close(); srv.close(); });

function wav(samples, sr) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 32767))), 44 + i * 2));
  return b;
}
function drums(bpm, beats, sr, lead) {
  const n = Math.round(((lead || 0) + beats * 60 / bpm) * sr), x = new Array(n).fill(0), spb = 60 / bpm * sr, off = Math.round((lead || 0) * sr);
  for (let k = 0; k < beats * 2; k++) { const at = off + Math.round(k * spb / 2), amp = k % 2 ? 0.25 : (k % 4 === 0 ? 0.9 : 0.5); for (let i = 0; i < 1500 && at + i < n; i++) x[at + i] += amp * Math.sin(2 * Math.PI * (k % 4 === 0 ? 70 : 900) * i / sr) * Math.exp(-i / 400); }
  return x;
}
const tone = (hz, secs, sr) => Array.from({ length: Math.round(secs * sr) }, (_, i) => 0.4 * Math.sin(2 * Math.PI * hz * i / sr));
function midiFile() {
  const ev = [0x00, 0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20, 0x00, 0x99, 36, 100, 0x00, 0x90, 60, 90, 0x83, 0x60, 0x89, 36, 0, 0x00, 0x80, 60, 0, 0x00, 0xFF, 0x2F, 0x00];
  return Buffer.from([0x4D, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xE0, 0x4D, 0x54, 0x72, 0x6B, 0, 0, 0, ev.length].concat(ev));
}

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'Loops'; P.key = 'C'; P.bpm = 120; P.beat = 'ballad';
    P.form = [{ s: 'Verse' }, { s: 'Chorus' }]; P.structure = ['Verse', 'Chorus'];
    g.go('song', { pid: P.id });
  });
  return { page, errors };
}
const P = page => page.evaluate(() => { const g = window.__gpa; return JSON.parse(JSON.stringify(g.S().songs[g.S().songs.length - 1])); });

test('import a drum loop, a keys loop and a MIDI file: tempo, key, sections, stretching and pitch', async () => {
  const { page, errors } = await open();
  const sr = 22050;
  await page.setInputFiles('#loopfile', [
    { name: 'Praise_Drums_96bpm.wav', mimeType: 'audio/wav', buffer: wav(drums(96, 8, sr), sr) },
    { name: 'Keys_G.wav', mimeType: 'audio/wav', buffer: wav(tone(392, 8 * 60 / 100, sr), sr) },
    { name: 'groove.mid', mimeType: 'audio/midi', buffer: midiFile() }
  ]);
  await page.waitForFunction(() => { const g = window.__gpa; return (g.S().songs[g.S().songs.length - 1].loops || []).length === 3; }, null, { timeout: 20000 });
  const p = await P(page);
  const [d, k, m] = p.loops;
  assert.deepEqual([d.kind, d.role, d.bpm, d.beats], ['loop', 'drums', 96, 8]);
  assert.deepEqual([k.kind, k.role, Math.round(k.bpm), k.beats, k.tr], ['loop', 'music', 100, 8, 5], 'tempo from its length; G moved up to C');
  assert.deepEqual([m.kind, m.bpm, m.beats, m.midi.notes.length, m.midi.drums.length], ['midi', 120, 4, 1, 1]);
  assert.deepEqual(d.secs, ['Verse', 'Chorus']);
  const r = await page.evaluate(async () => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1];
    const dl = await loopAt(P, P.loops[0], 0), kl = await loopAt(P, P.loops[1], 0), A = arrangeSong(P);
    const seg = kl.getChannelData(0).slice(4000, 6048);
    return { dlen: dl.duration, klen: kl.duration, hz: Pitch.yin(seg, kl.sampleRate).hz, places: A.places.length, midiEv: A.events.filter(e => e.loop).length };
  });
  assert.ok(Math.abs(r.dlen - 4) < 0.05, '8 beats at 120 BPM = 4 s, got ' + r.dlen);
  assert.ok(Math.abs(r.klen - 4) < 0.05);
  assert.ok(Math.abs(r.hz - 523.25) < 4, 'G4 moved up a fourth to C5, pitch kept through the stretch: ' + r.hz);
  assert.equal(r.places, 8, 'two loops, each twice in the verse and twice in the chorus (16 beats each)');
  assert.ok(r.midiEv >= 16);
  // a loop can be taken out of a section, muted, and heard alone
  await page.uncheck('[data-bind=plsec][data-i="0"][data-s="Verse"]');
  await page.check('[data-bind=plmute][data-i="1"]');
  assert.equal(await page.evaluate(() => { const g = window.__gpa; return arrangeSong(g.S().songs[g.S().songs.length - 1]).places.length; }), 2);
  await page.click('[data-lp=hear][data-i="0"]'); await page.waitForTimeout(400);
  // the song plays and exports with its loops
  await page.click('#songplay'); await page.waitForTimeout(1200); await page.click('#songplay');
  const [mid] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=pmidi]')]);
  assert.match(fs.readFileSync(await mid.path()).toString('latin1'), /MIDI loops/);
  const [w] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('[data-act=pwav][data-mix=full]')]);
  assert.equal(fs.readFileSync(await w.path()).toString('latin1', 8, 12), 'WAVE');
  assert.deepEqual(errors, []);
});

test('a whole beat: bar 1 found, tempo and key offered to the song, and the app\'s own parts switched off', async () => {
  const { page, errors } = await open();
  const sr = 22050;
  await page.setInputFiles('#loopfile', [{ name: 'Worship_Beat_90bpm_Am.wav', mimeType: 'audio/wav', buffer: wav(drums(90, 48, sr, 0.4), sr) }]);
  await page.waitForFunction(() => { const g = window.__gpa; return (g.S().songs[g.S().songs.length - 1].loops || []).length === 1; }, null, { timeout: 20000 });
  let p = await P(page);
  const b = p.loops[0];
  assert.deepEqual([b.kind, b.bpm, b.keyPc, b.minor], ['beat', 90, 9, true]);
  assert.ok(Math.abs(b.offset - 0.4) < 0.02, 'bar 1 starts where the sound starts: ' + b.offset);
  await page.click('[data-act=plusebpm]');
  await page.click('[data-act=plusekey]');
  await page.uncheck('[data-bind=pmix][data-k=drums]');
  await page.uncheck('[data-bind=pmix][data-k=chords]');
  p = await P(page);
  assert.equal(p.bpm, 90); assert.equal(p.key, 'C', 'A minor beat: the song goes to its relative major, C');
  const r = await page.evaluate(() => { const g = window.__gpa, A = arrangeSong(g.S().songs[g.S().songs.length - 1]); return { drums: A.events.filter(e => e.drum).length, chords: A.events.filter(e => e.notes && !e.mel && e.part !== 'bass' && !e.choir).length, bass: A.events.filter(e => e.part === 'bass').length, places: A.places.map(x => [x.at, x.offset]) }; });
  assert.deepEqual([r.drums, r.chords], [0, 0]); assert.ok(r.bass > 0, 'the bass stays');
  assert.deepEqual(r.places, [[0, 0.4]]);
  // the section loop starts the beat at that section's place in the song
  await page.click('[data-act=psec][data-s=Chorus]');
  await page.click('[data-act=psecplay]'); await page.waitForTimeout(800);
  assert.deepEqual(errors, []);
});

test('the slow-down ending: loops and a beat play to the end and slow down with the band', async () => {
  const { page, errors } = await open();
  const sr = 22050;
  await page.setInputFiles('#loopfile', [{ name: 'Praise_Drums_120bpm.wav', mimeType: 'audio/wav', buffer: wav(drums(120, 8, sr), sr) }, { name: 'Worship_Beat_120bpm.wav', mimeType: 'audio/wav', buffer: wav(drums(120, 72, sr), sr) }]);
  await page.waitForFunction(() => { const g = window.__gpa; return (g.S().songs[g.S().songs.length - 1].loops || []).length === 2; }, null, { timeout: 20000 });
  await page.selectOption('[data-bind=pending]', 'ritard');
  assert.match(await page.textContent('body'), /slow down with the band over the last two bars/);
  const r = await page.evaluate(async () => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], A = arrangeSong(P), audio = await loopAudio(P, A.places);
    const tails = audio.filter((a, i) => A.places[i] && A.places[i].tail), spb = 60 / P.bpm;
    // where the drum hits of the slowed loop land, against where the band's slowed beats land
    const t = tails[0].buf, x = t.getChannelData(0), hits = []; let last = -1;
    for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > 0.3 && i / t.sampleRate - last > 0.15) { last = i / t.sampleRate; hits.push(+(last).toFixed(3)); }
    // the band's beats in the slowdown: beat b (from its start) is played at (b + slow·b²/(2·span)) beats
    const R = A.ritard, band = []; for (let b = 0; b <= R.span; b += 0.5) band.push(+((b + R.slow * b * b / (2 * R.span)) * spb).toFixed(3));
    return { from: A.ritard.from, total: A.total, tails: tails.length, tailSecs: tails.map(a => +a.buf.duration.toFixed(2)), before: A.places.filter(p => !p.tail).every(p => p.at + p.dur <= A.ritard.from + 1e-6), hits: hits.slice(0, 8), band };
  });
  assert.equal(r.tails, 2, 'the loop and the beat both slow down');
  r.tailSecs.forEach(s => assert.ok(Math.abs(s - 4 * (1 + 0.67 / 2)) < 0.15, 'two bars at 120 BPM slowing to about 60%: ' + s + ' s'));
  assert.ok(r.before, 'before the slowdown, loops play as they are');
  // every hit of the slowed loop lands on the slowed beat grid of the band (within 30 ms)
  r.hits.forEach(h => assert.ok(r.band.some(b => Math.abs(b - h) < 0.03), 'hit at ' + h + ' s; band beats ' + r.band));
  assert.ok(r.hits.length >= 6);
  const [w] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('[data-act=pexp][data-format=wav]')]);
  assert.equal(fs.readFileSync(await w.path()).toString('latin1', 8, 12), 'WAVE');
  assert.deepEqual(errors, []);
});
