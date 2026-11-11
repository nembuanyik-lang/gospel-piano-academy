const T = require('./tabs').auto;
// Gentle pitch correction on a recorded track: a scale sung 40 cents flat is pulled towards the key of the song,
// the length stays the same, switching it off gives the recording back exactly as sung, and it works with the
// studio sound, in the memory-saver way and in an export.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const serve = require('./serve');
const FIX = path.join(__dirname, '..', 'fixtures');
if (!fs.existsSync(path.join(FIX, 'voice-five-flat.wav'))) execFileSync('python3', [path.join(FIX, 'make-voice.py'), FIX]);
const PORT = 8812;
let srv, browser;
test.before(async () => { srv = serve(path.join(__dirname, '..', '..', 'app'), PORT); browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); });
test.after(async () => { await browser.close(); srv.close(); });

test('pitch correction: a flat recording is pulled to the key, the length is kept, Off gives it back as sung', async () => {
  const page = T(await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage()), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:' + PORT + '/');
  const b64 = fs.readFileSync(path.join(FIX, 'voice-five-flat.wav')).toString('base64');
  const r = await page.evaluate(async b64 => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'Tune'; P.key = 'D'; P.bpm = 120;
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    await GuideStore.put(P.id, new Blob([bytes], { type: 'audio/wav' }));
    const dec = await GuideStore.takeBuffer(P.id), dur = dec.duration;
    P.guide = { at: 0, dur, gain: 1, nudgeMs: 0, takes: [{ k: P.id, dur }], main: 0, comp: {}, fx: { preset: 'off', nr: 'preset', reverb: true, tune: 'off', tuneScale: 'key' } };
    const pcs = PitchFix.scalePcs('D', false), out = {};
    const meas = async fx => { P.guide.fx = Object.assign({}, P.guide.fx, fx); GuideStore.invalidate(); const t0 = performance.now(), b = await GuideStore.trackBuffer(P, P.guide); return { b, ms: Math.round(performance.now() - t0), err: PitchFix.report(b.getChannelData(0), b.sampleRate, pcs).meanCents, n: b.length }; };
    const off = await meas({ tune: 'off' }); out.off = { err: off.err, n: off.n };
    const raw = off.b.getChannelData(0).slice();
    const full = await meas({ tune: 'full' }); out.full = { err: full.err, n: full.n, ms: full.ms };
    const gentle = await meas({ tune: 'gentle' }); out.gentle = { err: gentle.err, n: gentle.n };
    const withFx = await meas({ preset: 'worship', tune: 'full' }); out.withFx = { err: withFx.err, n: withFx.n, ch: withFx.b.numberOfChannels };
    const back = await meas({ preset: 'off', tune: 'off' }); const bd = back.b.getChannelData(0); let same = bd.length === raw.length; for (let i = 0; same && i < raw.length; i += 97) if (bd[i] !== raw[i]) same = false; out.same = same;
    let peak = 0; const fd = full.b.getChannelData(0); for (let i = 0; i < fd.length; i++) peak = Math.max(peak, Math.abs(fd[i])); out.peak = peak;
    return out;
  }, b64);
  assert.ok(r.off.err > 30, 'the flat recording starts about 40 cents out: ' + r.off.err);
  assert.ok(r.full.err < r.off.err * 0.5, 'full correction at least halves the error: ' + r.off.err + ' → ' + r.full.err);
  assert.ok(r.gentle.err < r.off.err && r.gentle.err > r.full.err, 'gentle sits between: ' + r.gentle.err);
  assert.equal(r.full.n, r.off.n, 'same length');
  assert.ok(r.withFx.err < r.off.err * 0.6 && r.withFx.n >= r.off.n, 'works together with the vocal sound: ' + r.withFx.err);
  assert.ok(r.same, 'Off returns the recording exactly as sung');
  assert.ok(r.peak < 1.0, 'no clipping');
  assert.ok(r.full.ms < 8000, 'quick enough: ' + r.full.ms + ' ms');
  assert.deepEqual(errors, []);
});

test('pitch correction: the Record tab has the control and it is saved with the song', async () => {
  const page = T(await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage()), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:' + PORT + '/');
  const b64 = fs.readFileSync(path.join(FIX, 'voice-five-flat.wav')).toString('base64');
  await page.evaluate(async b64 => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'Tune2'; P.key = 'D';
    await GuideStore.put(P.id, new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'audio/wav' }));
    const dur = (await GuideStore.takeBuffer(P.id)).duration;
    P.guide = { at: 0, dur, gain: 1, nudgeMs: 0, takes: [{ k: P.id, dur }], main: 0, comp: {}, fx: { preset: 'worship', nr: 'preset', reverb: true } };
    g.go('song', { pid: P.id, tab: 'record' });
  }, b64);
  const sel = page.locator('select[data-bind="pfxtune"]');
  await page.waitForSelector('[data-act=ptab][data-t="record"]'); await page.click('[data-act=ptab][data-t="record"]');
  await sel.waitFor({ state: 'attached', timeout: 15000 });
  await page.evaluate(() => { let d = document.querySelector('select[data-bind="pfxtune"]').closest('details'); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); } });
  await sel.waitFor({ timeout: 5000 });
  assert.equal(await sel.inputValue(), 'off');
  await sel.selectOption('gentle');
  await page.waitForSelector('select[data-bind="pfxtunescale"]:not([disabled])');
  await page.selectOption('select[data-bind="pfxtunescale"]', 'any');
  const fx = await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return JSON.parse(JSON.stringify(Sanitize.cleanState({ songs: [JSON.parse(JSON.stringify(P))] }, { keys: E.ROOT_NAMES, styles: Object.keys(E.STYLES), beats: Object.keys(E.BEATS), earTypes: [] }).songs[0].guide.fx)); });
  assert.deepEqual([fx.tune, fx.tuneScale], ['gentle', 'any']);
  assert.deepEqual(errors, []);
});

test('perform screen: full-screen chords and words follow the song, a part can be chosen, and Escape leaves it', async () => {
  const page = T(await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage()), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'Perform'; P.key = 'D'; P.bpm = 120; P.beat = 'none';
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
    P.lyrics.chorus = 'He did it for me\nHe did it for you'; P.form = [{ s: 'Chorus' }, { s: 'Chorus' }]; P.structure = ['Chorus', 'Chorus'];
    g.go('song', { pid: P.id });
  });
  await page.click('[data-act=pperform]'); await page.waitForSelector('#perform');
  assert.equal(await page.textContent('#pfnow'), 'D');
  assert.equal(await page.textContent('#pfnext'), 'A');
  assert.match(await page.textContent('#pfwords'), /He did it for me/);
  assert.equal(await page.locator('.pf-part').count(), 2);
  await page.click('.pf-part[data-part="1"]');
  assert.ok(await page.locator('.pf-part[data-part="1"].on').count() === 1);
  await page.uncheck('#pfcount'); await page.click('#pfplay');
  await page.waitForFunction(() => document.getElementById('pfplay').textContent === 'Stop');
  await page.waitForFunction(() => parseFloat(document.getElementById('pfprog').style.width) > 0, null, { timeout: 8000 });
  await page.click('#pfplay');
  assert.equal(await page.textContent('#pfplay'), 'Play');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#perform').count(), 0);
  assert.deepEqual(errors, []);
});
