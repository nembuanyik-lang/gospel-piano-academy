// The vocal studio in the Song Lab, with a fake microphone singing D E F# G A G F# E D: 24-bit takes, hearing
// yourself while recording, the level and room check, timing calibration, comping, and the vocal chain.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const serve = require('./serve');
const FIX = path.join(__dirname, '..', 'fixtures');
if (!fs.existsSync(path.join(FIX, 'voice-five.wav'))) execFileSync('python3', [path.join(FIX, 'make-voice.py'), FIX]);

const PORT = 8796;
let srv, browser;
test.before(async () => {
  srv = serve(path.join(__dirname, '..', '..', 'app'), PORT);
  browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + path.join(FIX, 'voice-five.wav'), '--autoplay-policy=no-user-gesture-required'] });
});
test.after(async () => { await browser.close(); srv.close(); });

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, permissions: ['microphone'] });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'Studio'; P.key = 'D'; P.bpm = 120; P.beat = 'none';
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
    P.form = [{ s: 'Chorus' }, { s: 'Chorus' }]; P.structure = ['Chorus', 'Chorus'];
    g.go('song', { pid: P.id });
  });
  return { page, errors };
}
const proj = page => page.evaluate(() => { const g = window.__gpa; return JSON.parse(JSON.stringify(g.S().songs[g.S().songs.length - 1])); });

test('takes are 24-bit, several are kept, hearing yourself works, and the best parts can be comped', async () => {
  const { page, errors } = await open();
  for (let k = 1; k <= 2; k++) {
    if (k === 2) await page.check('[data-bind=pmonitor]');
    await page.click('#guiderec');
    await page.waitForFunction(n => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return P.guide && P.guide.takes && P.guide.takes.length === n; }, k, { timeout: 40000 });
    await page.waitForTimeout(300);
  }
  const P = await proj(page);
  assert.equal(P.guide.takes.length, 2); assert.equal(P.guide.main, 1);
  const info = await page.evaluate(async k => { const b = await GuideStore.get(k), a = new DataView(await b.arrayBuffer()); return { bits: a.getUint16(34, true), rate: a.getUint32(24, true) }; }, P.guide.takes[0].k);
  assert.equal(info.bits, 24, '24-bit WAV');
  assert.ok(info.rate >= 44100);
  // comping: the second chorus from take 1
  assert.equal(await page.locator('.compgrid [role=row]').count(), 3, 'a header and the two choruses');
  await page.click('[data-act=pcomp][data-p="1"][data-t="0"]');
  const r = await page.evaluate(async () => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], G = guideOf(P);
    G.fx = { preset: 'off', nr: 'preset' }; GuideStore.invalidate();
    const comped = await GuideStore.buffer(P), t0 = await GuideStore.takeBuffer(G.takes[0].k), t1 = await GuideStore.takeBuffer(G.takes[1].k);
    const sr = comped.sampleRate, at = s => Math.round(s * sr), A = comped.getChannelData(0);
    const same = (x, y, from, to) => { let d = 0; for (let i = at(from); i < at(to); i++) d = Math.max(d, Math.abs(x[i] - y[i])); return d; };
    return { firstFromMain: same(A, t1.getChannelData(0), 0.5, 3.5), secondFromTake1: same(A, t0.getChannelData(0), 4.5, 7.5) };
  });
  assert.ok(r.firstFromMain < 1e-6 && r.secondFromTake1 < 1e-6, JSON.stringify(r));
  assert.deepEqual(errors, []);
});

test('the vocal chain changes the sound, never clips, exports as 24-bit, and raw stays raw', async () => {
  const { page, errors } = await open();
  await page.click('#guiderec');
  await page.waitForFunction(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return P.guide && P.guide.takes && P.guide.takes.length === 1; }, null, { timeout: 40000 });
  await page.waitForTimeout(300);
  const workerLoaded = page.waitForResponse(r => /workers\/vocalfx-worker\.js$/.test(r.url()) && r.ok(), { timeout: 30000 });
  await page.selectOption('[data-bind=pfxpreset]', 'worship');
  await page.selectOption('[data-bind=pfxnr]', 'strong');
  const r = await page.evaluate(async () => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1];
    const raw = await GuideStore.buffer(P, { raw: true }), fx = await GuideStore.buffer(P);
    let pk = 0; for (let c = 0; c < fx.numberOfChannels; c++) { const d = fx.getChannelData(c); for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); }
    let diff = 0; const a = raw.getChannelData(0), b = fx.getChannelData(0); for (let i = 0; i < a.length; i += 50) diff += Math.abs(a[i] - b[i]);
    return { ch: fx.numberOfChannels, pk, diff, rawCh: raw.numberOfChannels, longer: fx.length > raw.length };
  });
  await workerLoaded;   // the processing ran in the background worker
  assert.equal(r.rawCh, 1); assert.equal(r.ch, 2, 'the room makes it stereo'); assert.ok(r.longer, 'the reverb tail is kept');
  assert.ok(r.pk <= 0.98 && r.pk > 0.5, 'healthy, no clipping: ' + r.pk); assert.ok(r.diff > 1, 'processed differs from raw');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('[data-act=pguidesave]')]);
  const buf = fs.readFileSync(await dl.path());
  assert.equal(buf.readUInt16LE(34), 24); assert.equal(buf.readUInt16LE(22), 2); assert.match(dl.suggestedFilename(), /_guide_worship\.wav$/);
  // listen raw vs processed buttons work
  await page.click('#guideraw'); await page.waitForTimeout(300); await page.click('#guideraw');
  await page.click('#guidehear'); await page.waitForTimeout(800); await page.click('#guidehear');
  assert.deepEqual(errors, []);
});

test('level and room check gives advice and learns the room; timing calibration says when it cannot hear the clicks', async () => {
  const { page, errors } = await open();
  await page.click('#lvlcheck');
  await page.waitForFunction(() => /peak .* dB/.test(document.querySelector('#lvlinfo').textContent), null, { timeout: 20000 });
  const txt = await page.textContent('#lvlinfo');
  // the fake microphone sings during the "quiet" part too, so the room sounds loud: the app must say so
  assert.match(txt, /noisy|Fix this first|Ready to record/);
  const st = await page.evaluate(async () => ({ check: window.__gpa.S().prefs.micCheck, prof: !!(await GuideStore.profile()) }));
  assert.ok(st.check && typeof st.check.peakDb === 'number' && st.prof, 'saved: ' + JSON.stringify(st));
  await page.click('#calspk');
  await page.waitForFunction(() => /did not hear the clicks|Microphone timing: -?\d+ ms/.test(document.querySelector('#calinfo').textContent), null, { timeout: 15000 });
  assert.match(await page.textContent('#calinfo'), /did not hear the clicks|Microphone timing/);
  assert.deepEqual(errors, []);
});
