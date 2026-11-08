const T = require('./tabs').auto;
// Seeing and fixing recordings: the timeline, silencing a part, singing a part again (punch-in), Undo and Redo, the
// reminder to keep a copy, the words and chords on screen while recording, and the audio interface settings.
// A fake microphone sings (voice-five.wav) in place of a person.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const serve = require('./serve');
const FIX = path.join(__dirname, '..', 'fixtures');
if (!fs.existsSync(path.join(FIX, 'voice-five.wav'))) execFileSync('python3', [path.join(FIX, 'make-voice.py'), FIX]);

const PORT = 8798;
let srv, browser;
test.before(async () => {
  srv = serve(path.join(__dirname, '..', '..', 'app'), PORT);
  browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + path.join(FIX, 'voice-five.wav'), '--autoplay-policy=no-user-gesture-required'] });
});
test.after(async () => { await browser.close(); srv.close(); });

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, permissions: ['microphone'] });
  const page = T(await ctx.newPage()), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'Fixing'; P.key = 'D'; P.bpm = 120; P.beat = 'none';
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
    P.lyrics.chorus = 'He did it for me\nHe did it for you';
    P.form = [{ s: 'Chorus' }, { s: 'Chorus' }]; P.structure = ['Chorus', 'Chorus'];
    g.go('song', { pid: P.id });
  });
  return { page, errors };
}
const proj = page => page.evaluate(() => { const g = window.__gpa; return JSON.parse(JSON.stringify(g.S().songs[g.S().songs.length - 1])); });
async function recordTake(page, n) {
  await page.click('#guiderec');
  await page.waitForFunction(k => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return P.guide && P.guide.takes && P.guide.takes.length === k; }, n, { timeout: 40000 });
  await page.waitForSelector('#tlcard canvas.tl-wave');
}
const rmsIn = (page, from, to, edited) => page.evaluate(async ([a, b]) => {
  const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], E = await GuideStore.editedPcm(P, guideOf(P)), sr = E.sr; let s = 0, n = 0;
  for (let i = Math.round(a * sr); i < Math.min(E.pcm.length, Math.round(b * sr)); i++) { s += E.pcm[i] * E.pcm[i]; n++; }
  return Math.sqrt(s / Math.max(1, n));
}, [from, to]);

test('the timeline draws each track; a chosen part can be silenced, and Undo, Redo and the keys bring it back', async () => {
  const { page, errors } = await open();
  assert.equal(await page.locator('#tlcard').count(), 0, 'no timeline until something is recorded');
  await recordTake(page, 1);
  await page.waitForTimeout(500);
  const ink = await page.evaluate(() => { const c = document.querySelector('.tl-wave'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return { n, w: c.width }; });
  assert.ok(ink.n > 200, 'the waveform is drawn (' + ink.n + ' pixels)');
  const before = await rmsIn(page, 4.2, 7.8); assert.ok(before > 0.01, 'there is sound in the second chorus: ' + before);
  // choose the second chorus from the list of parts, then silence it
  await page.selectOption('[data-bind=htlpart]', '1');
  assert.match(await page.textContent('#tlinfo'), /Chosen: 0:04\.0 to 0:08\.0/);
  assert.equal(await page.locator('.tl-sel').count(), 1, 'the chosen part is shown on the waveform');
  await page.click('[data-act=htlsilence]');
  let P = await proj(page);
  assert.equal(P.guide.mutes.length, 1); assert.ok(Math.abs(P.guide.mutes[0].a - 4) < 0.01 && Math.abs(P.guide.mutes[0].b - 8) < 0.01);
  assert.equal(await page.locator('.tl-edits li').count(), 1);
  assert.ok(await rmsIn(page, 4.2, 7.8) < 1e-6, 'that part is silent');
  assert.ok(Math.abs(await rmsIn(page, 0.5, 3.5) - (await rmsIn(page, 0.5, 3.5))) < 1e-9 && await rmsIn(page, 0.5, 3.5) > 0.01, 'the rest is as sung');
  // the recording itself was not changed
  assert.ok(await page.evaluate(async () => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], b = await GuideStore.takeBuffer(P.guide.takes[0].k), d = b.getChannelData(0); let m = 0; for (let i = Math.round(5 * b.sampleRate); i < Math.round(6 * b.sampleRate); i++) m = Math.max(m, Math.abs(d[i])); return m > 0.01; }), 'the take still has its sound');
  // Undo and Redo with the buttons, then with the keys
  assert.equal(await page.isEnabled('[data-act=hundo]'), true);
  await page.click('[data-act=hundo]'); P = await proj(page); assert.equal(P.guide.mutes.length, 0, 'Undo brings the sound back');
  assert.ok(await rmsIn(page, 4.2, 7.8) > 0.01);
  await page.click('[data-act=hredo]'); P = await proj(page); assert.equal(P.guide.mutes.length, 1, 'Redo silences it again');
  await page.locator('h1.sr-only').evaluate(e => e.ownerDocument.body.focus());
  await page.keyboard.press('Control+z'); await page.waitForTimeout(150);
  P = await proj(page); assert.equal(P.guide.mutes.length, 0, 'Ctrl+Z');
  await page.keyboard.press('Control+y'); await page.waitForTimeout(150);
  P = await proj(page); assert.equal(P.guide.mutes.length, 1, 'Ctrl+Y');
  // Undo works for everything in the song, not only recordings
  await page.fill('#ptitle', 'Renamed'); await page.keyboard.press('Tab'); await page.waitForTimeout(900);
  await page.click('[data-act=hundo]'); await page.click('[data-act=hundo]'); P = await proj(page);
  assert.equal(P.title, 'Fixing', 'the title is back'); assert.equal(P.guide.mutes.length, 0);
  assert.deepEqual(errors, []);
});

test('singing a part again keeps only that part, joins it to the take without changing it, and Undo and leaving the song tidy up', async () => {
  const { page, errors } = await open();
  await recordTake(page, 1);
  const before = await proj(page), takeBytes = await page.evaluate(async k => (await GuideStore.get(k)).size, before.guide.takes[0].k);
  await page.selectOption('[data-bind=htlpart]', '1');
  await page.click('#tlpunch');
  await page.waitForFunction(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return P.guide.patches && P.guide.patches.length === 1; }, null, { timeout: 60000 });
  await page.waitForTimeout(400);
  const P = await proj(page), p = P.guide.patches[0];
  assert.equal(P.guide.takes.length, 1, 'no new take: it is a fix, not a take');
  assert.ok(Math.abs(p.a - 4) < 0.01 && Math.abs(p.b - 8) < 0.01, 'the part: ' + p.a + ' to ' + p.b);
  assert.ok(p.t0 < p.a && p.t0 > p.a - 0.05, 'the saved clip starts a moment before the part, for the smooth join');
  assert.equal(await page.evaluate(async k => (await GuideStore.get(k)).size, before.guide.takes[0].k), takeBytes, 'the original take is byte for byte the same');
  const clipBytes = await page.evaluate(async k => { const b = await GuideStore.get(k); return b ? b.size : 0; }, p.k);
  assert.ok(clipBytes > 0 && clipBytes < takeBytes, 'only the part was kept (' + clipBytes + ' of ' + takeBytes + ' bytes)');
  // the level of the new part matches the take around it
  const around = await rmsIn(page, 0.5, 3.5), inside = await rmsIn(page, 4.2, 7.8);
  assert.ok(inside > 0.01 && inside / around > 0.3 && inside / around < 3.3, 'level matches: ' + inside + ' vs ' + around);
  assert.equal(await page.locator('.tl-edits li').count(), 1);
  assert.match(await page.textContent('.tl-edits li'), /Sung again 0:04\.0 to 0:08\.0/);
  // Undo takes the fix away; the clip is removed when the song is left
  await page.click('[data-act=hundo]');
  assert.equal((await proj(page)).guide.patches.length, 0);
  assert.ok(await page.evaluate(async k => !!(await GuideStore.get(k)), p.k), 'still there while the song is open (Redo needs it)');
  await page.evaluate(() => window.__gpa.go('song'));
  await page.waitForTimeout(1200);
  assert.ok(await page.evaluate(async k => !(await GuideStore.get(k)), p.k), 'removed after leaving the song');
  assert.ok(await page.evaluate(async k => !!(await GuideStore.get(k)), before.guide.takes[0].k), 'the take is kept');
  assert.deepEqual(errors, []);
});

test('a deleted take can be brought back with Undo until the song is left', async () => {
  const { page, errors } = await open();
  await recordTake(page, 1); await page.waitForTimeout(300); await recordTake(page, 2);
  const P0 = await proj(page), gone = P0.guide.takes[0].k;
  await page.click('[data-act=ptkdel][data-i="0"]'); await page.click('[data-act=ptkdel][data-i="0"]');
  await page.waitForFunction(() => window.__gpa.S().songs[window.__gpa.S().songs.length - 1].guide.takes.length === 1);
  assert.ok(await page.evaluate(async k => !!(await GuideStore.get(k)), gone), 'the recording is still kept');
  await page.click('[data-act=hundo]');
  assert.equal((await proj(page)).guide.takes.length, 2, 'Undo brings the take back');
  assert.ok(await page.evaluate(async k => { const b = await GuideStore.takeBuffer(k); return !!b && b.duration > 5; }, gone), 'and its sound plays');
  assert.deepEqual(errors, []);
});

test('the reminder to keep a copy: shown after recording, listed in the Song Lab, and gone once a song package is saved', async () => {
  const { page, errors } = await open();
  assert.equal(await page.locator('.callout.warn').count(), 0, 'nothing to keep yet');
  await recordTake(page, 1); await page.waitForTimeout(300);
  assert.match(await page.textContent('.callout.warn'), /only on this computer/);
  await page.click('.callout.warn [data-act=hsafelater]');
  assert.equal(await page.locator('.callout.warn').count(), 0, 'Remind me later hides it for now');
  await page.evaluate(() => window.__gpa.go('song'));
  assert.match(await page.textContent('.callout.warn'), /1 song has recordings that are only on this computer: Fixing/);
  await page.evaluate(() => { const g = window.__gpa; g.go('song', { pid: g.S().songs[g.S().songs.length - 1].id }); });
  await page.waitForSelector('#tlcard');
  assert.equal(await page.locator('.callout.warn').count(), 1, 'it comes back when the song is opened again');
  const dl = page.waitForEvent('download', { timeout: 30000 });
  await page.click('.callout.warn [data-act=ppkg]');
  assert.match((await dl).suggestedFilename(), /\.gmasong$/);
  await page.waitForFunction(() => { const P = window.__gpa.S().songs[window.__gpa.S().songs.length - 1]; return P.pkgAt && P.pkgAt >= P.recAt; }, null, { timeout: 15000 });
  await page.waitForTimeout(1800);
  assert.equal(await page.locator('.callout.warn').count(), 0, 'saved: the reminder rests');
  await recordTake(page, 2);
  assert.equal(await page.locator('.callout.warn').count(), 1, 'a new recording brings it back');
  assert.deepEqual(errors, []);
});

test('the words and chords appear in big letters while recording, follow the song, and can be hidden or switched off', async () => {
  const { page, errors } = await open();
  await page.click('#guiderec');
  await page.waitForSelector('.stage', { timeout: 20000 });
  await page.waitForFunction(() => { const n = document.querySelector('.stage-now'); return n && /^[A-G]/.test(n.textContent); }, null, { timeout: 15000 });
  const t = await page.evaluate(() => ({ now: document.querySelector('.stage-now').textContent, sec: document.querySelector('.stage-sec').textContent, lines: [...document.querySelectorAll('.stage-lines p')].map(p => p.textContent) }));
  assert.match(t.now, /^D/); assert.match(t.sec, /Chorus/); assert.deepEqual(t.lines, ['He did it for me', 'He did it for you']);
  assert.ok(await page.locator('.stage-lines p.on').count() === 1, 'one line is the current one');
  await page.waitForFunction(() => { const P = window.__gpa.S().songs[window.__gpa.S().songs.length - 1]; return P.guide && P.guide.takes.length === 1; }, null, { timeout: 40000 });
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.stage').count(), 0, 'it goes away when the recording ends');
  // switched off: nothing appears
  await page.uncheck('[data-bind=pstage]');
  await page.click('#guiderec'); await page.waitForTimeout(2500);
  assert.equal(await page.locator('.stage').count(), 0, 'switched off');
  await page.click('#guiderec');   // stop
  await page.waitForTimeout(500);
  // playing the song shows it too, and Hide works
  await page.check('[data-bind=pstage]');
  await page.click('#songplay'); await page.waitForSelector('.stage', { timeout: 10000 });
  await page.click('#stclose'); assert.equal(await page.locator('.stage').count(), 0);
  await page.click('#songplay');
  assert.deepEqual(errors, []);
});

test('audio interface and microphone settings: devices refresh by themselves, an input socket is chosen, each microphone and headphones pair keeps its own timing', async () => {
  const { page, errors } = await open();
  assert.equal(await page.locator('[data-bind=pchan] option').count(), 4);
  await page.selectOption('[data-bind=pchan]', '2');
  assert.equal(await page.evaluate(() => window.__gpa.S().prefs.micChannel), '2');
  await recordTake(page, 1);
  const P = await proj(page); assert.ok(P.guide.takes[0].dur >= 6, 'recording from input 2 works: ' + P.guide.takes[0].dur + ' s');
  await page.selectOption('[data-bind=pchan]', 'mix'); await recordTake(page, 2);
  await page.selectOption('[data-bind=pchan]', 'auto');
  assert.equal(await page.evaluate(() => window.__gpa.S().prefs.micChannel), undefined);
  // timing is remembered for each pair
  const r = await page.evaluate(() => {
    const prefs = window.__gpa.S().prefs; delete prefs.micLatencyMs; delete prefs.micLatencyById;
    const none = micLatInfo('devA'); prefs.micLatencyMs = 90;
    const old = micLatInfo('devA'); prefs.micLatencyById = { 'devA>default': 35 };
    const own = micLatInfo('devA'), other = micLatInfo('devB'); prefs.outId = 'speakers1';
    const pairChanged = micLatInfo('devA'); delete prefs.outId; delete prefs.micLatencyById; delete prefs.micLatencyMs;
    return { none, old, own, other, pairChanged };
  });
  assert.deepEqual(r.old, { ms: 90, measured: true, own: false }); assert.deepEqual(r.own, { ms: 35, measured: true, own: true });
  assert.equal(r.other.own, false); assert.equal(r.pairChanged.own, false, 'other headphones need their own measurement'); assert.equal(r.none.measured, false);
  // a new device appearing refreshes the lists, and the output list is there
  await page.evaluate(() => navigator.mediaDevices.dispatchEvent(new Event('devicechange')));
  await page.waitForTimeout(300);
  assert.ok(await page.locator('#guideout').count() === 1 && await page.locator('#guidemic option').count() >= 1);
  assert.match(await page.textContent('details.ifacehelp summary'), /audio interface/i);
  // the nudge slider reaches 500 ms
  assert.equal(await page.getAttribute('[data-bind=pguidenudge]', 'max'), '500');
  assert.deepEqual(errors, []);
});

test('the part of the song a fix starts from: events and clips are moved earlier, running notes carry on, and the song ends where asked', async () => {
  const { page, errors } = await open();
  const r = await page.evaluate(() => {
    const script = { bpm: 120, total: 16, fade: { from: 12, to: 16 }, events: [{ t: 0, d: 8, notes: [60] }, { t: 8, d: 4, notes: [62] }, { t: 12, d: 4, notes: [64] }, { t: 4, drum: 'kick' }],
      audio: [{ buf: {}, at: 2, dur: 10, offset: 0, gain: 1 }, { buf: {}, at: 10, dur: 4, offset: 1, gain: 1 }] };
    const a = scriptFrom(script, 6, 14);
    return { total: a.total, fade: a.fade, ev: a.events.map(e => [e.t, e.d, e.notes ? e.notes[0] : e.drum]), au: a.audio.map(x => [x.at, x.dur, x.offset]) };
  });
  assert.equal(r.total, 8); assert.equal(r.fade, null);
  assert.deepEqual(r.ev, [[0, 2, 60], [2, 4, 62], [6, 2, 64]], 'the running note carries on; the earlier drum hit is left out; the last note is cut at the end');
  assert.deepEqual(r.au, [[0, 6, 2], [4, 4, 1]].map(x => x), 'the clip already playing carries on from where it is');
  assert.deepEqual(errors, []);
});

test('the Song Lab is in tabs: one short screen at a time, the player stays on top, and the tab is remembered while you work', async () => {
  const { page, errors } = await open();
  const shown = () => page.evaluate(() => [...document.querySelectorAll('.ptab.on')].map(e => e.dataset.tab));
  assert.deepEqual(await shown(), ['write'], 'it opens on Write');
  assert.ok(await page.isVisible('#songplay'), 'the player is always there');
  assert.ok(await page.isVisible('#chordstrip, .chordstrip, [data-act=pchord], [data-bind=lchorus]'), 'chords and words are on Write');
  assert.equal(await page.isVisible('#guiderec'), false, 'the recorder is not on Write');
  for (const [t, sel] of [['arrange', '[data-act=pts][data-v="3"], [data-bind=pffill][data-i="0"], .songbar'], ['record', '#guiderec'], ['mix', '[data-act=mxmute]'], ['share', '[data-act=ppkg]']]) {
    await page.click('[data-act=ptab][data-t=' + t + ']');
    assert.deepEqual(await shown(), [t]);
    assert.ok(await page.isVisible(sel), t + ' shows its own cards');
    assert.ok(await page.isVisible('#songplay'), 'the player stays on ' + t);
  }
  assert.equal(await page.getAttribute('[data-act=ptab][data-t=share]', 'aria-selected'), 'true');
  await page.click('[data-act=ptab][data-t=write]');
  assert.deepEqual(errors, []);
});

test('chords can be chosen in any flavour: 7th, 9th, add9, sus and the gospel colours, for the chords of the key and for colour chords outside it', async () => {
  const { page, errors } = await open();
  const chips = () => page.$$eval('[data-act=pcadd]', es => es.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  const before = (await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return P.sections.Chorus.chords.length; }));
  assert.ok((await chips()).some(t => /^D\b/.test(t)), 'plain chords to begin with');
  await page.click('[data-act=pflav][data-f=ninth]');
  const t9 = (await chips()).join(' | '); assert.match(t9, /Dmaj9/); assert.match(t9, /A9/); assert.match(t9, /Em9/);
  await page.click('[data-act=pflav][data-f=sus4]'); assert.match((await chips()).join(' | '), /Dsus4/);
  await page.click('[data-act=pflav][data-f=add9]'); assert.match((await chips()).join(' | '), /Dadd9/);
  await page.click('[data-act=pflav][data-f=gospel]'); assert.match((await chips()).join(' | '), /A13/);
  // a chord outside the key (the flat seven, Cb... here C in the key of D) in the gospel flavour is a 9th chord
  await page.click('details.colours summary >> nth=0');
  const other = await page.$$eval('details.colours:first-of-type [data-act=pcadd]', es => es.map(e => e.dataset.q));
  assert.ok(other.length === 5 && other.every(q => q === '9'), 'five colour chords, as 9ths: ' + other);
  // choosing one adds it with that quality
  await page.click('[data-act=pflav][data-f=ninth]');
  await page.click('[data-act=pcadd][data-q=maj9] >> nth=0');
  const q = await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; const c = P.sections.Chorus.chords; return [c.length, c[c.length - 1].q]; });
  assert.deepEqual(q, [before + 1, 'maj9']);
  assert.deepEqual(errors, []);
});

test('real drums, a human feel, chosen fills and endings, and saved progressions', async () => {
  const { page, errors } = await open();
  const P = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__gpa.S().songs[window.__gpa.S().songs.length - 1])));
  // --- a drummer's feel, saved with the song and the same every time
  await page.evaluate(() => { const g = window.__gpa; g.S().songs[g.S().songs.length - 1].beat = 'makossa'; g.go('song', { pid: g.S().songs[g.S().songs.length - 1].id }); });
  await page.click('[data-act=ptab][data-t=arrange]');
  await page.selectOption('[data-bind=phuman]', '2'); assert.equal((await P()).human, 2);
  const run = () => page.evaluate(() => JSON.stringify(arrangeSong(window.__gpa.S().songs[window.__gpa.S().songs.length - 1]).events.filter(e => e.drum).slice(0, 40).map(e => [e.t, e.vel])));
  const a = await run(), b = await run(); assert.equal(a, b, 'the same every time it is played');
  await page.selectOption('[data-bind=phuman]', '0'); assert.notEqual(await run(), a, 'exact is different from loose');
  // --- the Cameroonian grooves are on offer
  const opts = await page.$$eval('[data-bind=pbeat] option', os => os.map(o => o.value)); ['makossa', 'makossalight', 'bikutsi', 'assiko', 'ndombolo'].forEach(k => assert.ok(opts.includes(k), k));
  // --- fills: each kind makes a different fill and the song still plays out to the end
  const fills = await page.evaluate(() => ['', 'snare', 'toms', 'half', 'crash'].map(k => { const f = fillEvents(16, 4, 0.9, k); return [k, f.ev.length, Math.min(...f.ev.map(e => e.t)), Math.max(...f.ev.map(e => e.t))]; }));
  fills.forEach(([k, n, lo, hi]) => { assert.ok(n >= 1 && lo >= 13.5 && hi < 16, 'fill ' + k + ' sits in the last bar or two: ' + [n, lo, hi]); });
  assert.equal(new Set(fills.map(f => f[1])).size >= 4, true, 'the kinds differ');
  await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.form = [{ s: 'Chorus' }, { s: 'Chorus' }]; P.structure = ['Chorus', 'Chorus']; g.go('song', { pid: P.id }); });
  await page.click('[data-act=ptab][data-t=arrange]');
  await page.click('[data-bind=pffill][data-i="0"]');
  await page.selectOption('[data-bind=pffk][data-i="0"]', 'toms'); assert.equal((await P()).form[0].fk, 'toms');
  // --- endings
  const ends = await page.$$eval('[data-bind=pending] option', os => os.map(o => o.value)); assert.deepEqual(ends, ['none', 'hold', 'ritard', 'ritardhold', 'bigfinish', 'fade']);
  const tot = await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], out = {}; for (const k of ['none', 'hold', 'ritard', 'ritardhold', 'bigfinish']) { P.ending = k; const A = arrangeSong(P); const at = A.total - 8; out[k] = [A.total, A.events.filter(e => e.drum === 's' && e.t >= at - 4 && e.t < at).length, A.events.some(e => e.drum === 'c' && Math.abs(e.t - at) < 0.01 && e.vel > 0.9)]; } P.ending = 'none'; return out; });
  assert.ok(tot.hold[0] > tot.none[0] && tot.bigfinish[0] > tot.none[0], 'hold and big finish add a held chord');
  assert.ok(tot.ritardhold[0] > tot.ritard[0], 'slow down then hold is longer than slowing down alone');
  assert.ok(tot.bigfinish[1] > tot.hold[1] + 8, 'the big finish has a snare roll: ' + JSON.stringify(tot));
  assert.ok(tot.bigfinish[2], 'and a big crash on the final chord');
  // --- a real drum recording replaces the built-in drums, and can be put back
  const wav = (() => { const sr = 22050, n = sr * 4, x = Buffer.alloc(44 + n * 2); x.write('RIFF', 0); x.writeUInt32LE(36 + n * 2, 4); x.write('WAVEfmt ', 8); x.writeUInt32LE(16, 16); x.writeUInt16LE(1, 20); x.writeUInt16LE(1, 22); x.writeUInt32LE(sr, 24); x.writeUInt32LE(sr * 2, 28); x.writeUInt16LE(2, 32); x.writeUInt16LE(16, 34); x.write('data', 36); x.writeUInt32LE(n * 2, 40);
    for (let b = 0; b < 8; b++) for (let i = 0; i < 2000; i++) x.writeInt16LE(Math.round(Math.sin(i * 0.2) * 20000 * Math.exp(-i / 400)), 44 + (Math.round(b * sr * 0.5) + i) * 2); return x; })();
  const wp = path.join(require('os').tmpdir(), 'real-drums-120.wav'); fs.writeFileSync(wp, wav);
  await page.click('[data-act=pdrumreal]');
  await page.setInputFiles('#loopfile', wp);
  await page.waitForFunction(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return P.loops && P.loops.length === 1; }, null, { timeout: 20000 });
  let q = await P(); assert.equal(q.loops[0].role, 'drums'); assert.equal(q.beat, 'none'); assert.equal(q.beatWas, 'makossa');
  await page.click('[data-act=ptab][data-t=arrange]');
  await page.click('[data-act=pdrumback]');
  q = await P(); assert.equal(q.beat, 'makossa'); assert.equal(q.beatWas, undefined); assert.equal(q.loops[0].mute, true);
  // --- progressions you keep
  await page.click('[data-act=ptab][data-t=write]');
  await page.click('#progcard summary');
  await page.fill('#progname', 'Sunday opening');
  await page.click('[data-act=psaveprog]');
  assert.equal(await page.evaluate(() => window.__gpa.S().progs.length), 1);
  await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }]; g.go('song', { pid: P.id }); });
  assert.equal(await page.getAttribute('#progcard', 'open'), '', 'the list stays open after saving');
  await page.click('[data-act=pprogadd]');
  assert.equal((await P()).sections.Chorus.chords.length, 3);
  await page.click('[data-act=pprogreplace]');
  assert.equal((await P()).sections.Chorus.chords.length, 2);
  await page.click('[data-act=pprogdel]');
  assert.equal(await page.evaluate(() => window.__gpa.S().progs.length), 0);
  assert.deepEqual(errors, []);
});
