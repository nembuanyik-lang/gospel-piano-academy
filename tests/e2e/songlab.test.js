const T = require('./tabs').auto;
// Song Lab 2.9 in a real browser: any chord, per-chord length and pushes, suggestions, the song form (repeats, key
// change with its lead-in, tags, stops), words under the melody, choir parts, lead sheet and number chart exports,
// and singing a melody in through a (fake) microphone.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const serve = require('./serve');
const FIX = path.join(__dirname, '..', 'fixtures');
if (!fs.existsSync(path.join(FIX, 'voice-five.wav'))) execFileSync('python3', [path.join(FIX, 'make-voice.py'), FIX]);

const ROOT = path.join(__dirname, '..', '..', 'app');
const PORT = 8794;
let srv, browser;
test.before(async () => {
  srv = serve(ROOT, PORT);
  browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + path.join(FIX, 'voice-five.wav'), '--autoplay-policy=no-user-gesture-required'] });
});
test.after(async () => { await browser.close(); srv.close(); });

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, permissions: ['microphone'] });
  const page = T(await ctx.newPage());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'Gospel Test'; P.key = 'C'; P.bpm = 120; P.beat = 'none';
    g.go('song', { pid: P.id });
  });
  return { page, errors };
}
const P = page => page.evaluate(() => { const g = window.__gpa; return JSON.parse(JSON.stringify(g.S().songs[g.S().songs.length - 1])); });
const chip = (page, name) => page.locator('[data-act=pcadd]').filter({ has: page.locator('b', { hasText: new RegExp('^' + name.replace(/[/+]/g, '\\$&') + '$') }) }).first().click();

test('chords: any chord from the palette, the colours and the suggestions; type, bass, length and push', async () => {
  const { page, errors } = await open();
  await page.click('[data-act=psec][data-s=Verse]');
  // start a fresh verse: remove down to one chord
  for (let i = 0; i < 8; i++) await page.click('[data-act=pundo]');
  await chip(page, 'Em');                                   // diatonic
  await page.click('details.colours summary');
  await chip(page, 'A7');                                   // VI7 from the gospel colours
  await chip(page, 'Dm');                                   // the suggestion after A7 (or from the key)
  await chip(page, 'F/G');                                  // the slash chord
  let p = await P(page);
  assert.deepEqual(p.sections.Verse.chords.slice(1).map(c => [c.r, c.q, c.b]), [[4, 'minor', null], [9, '7', null], [2, 'minor', null], [5, 'major', 7]]);
  // the suggestions after F/G start with going home
  const sugg = await page.locator('.field:has-text("What could come next") [data-act=pcadd] b').allTextContents();
  assert.equal(sugg[0], 'C', 'IV/V suggests I first: ' + sugg);
  // edit the Dm: make it a Dm9, two beats, pushed
  await page.click('.cchord[data-i="3"]');
  await page.selectOption('[data-bind=pcq]', 'm9');
  await page.selectOption('[data-bind=pclen]', '2');
  await page.check('[data-bind=pcpush]');
  p = await P(page);
  assert.deepEqual(p.sections.Verse.chords[3], { r: 2, q: 'm9', b: null, beats: 2, push: true });
  assert.match(await page.textContent('.cchord[data-i="3"]'), /Dm9.*2m⁹.*2 beats/);
  // the arrangement sounds the pushed chord half a beat early, with a kick on the push when drums play
  const t = await page.evaluate(() => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.beat = 'ballad'; P.form = [{ s: 'Verse' }]; P.structure = ['Verse'];
    const A = arrangeSong(P), seg = A.timeline[0];
    return { chs: seg.chs.map(c => [c.name, c.t, c.d]), kick: A.events.some(e => e.drum === 'k' && Math.abs(e.t - seg.chs[3].t) < 1e-6) };
  });
  assert.deepEqual(t.chs.slice(1), [['Em', 4, 4], ['A7', 8, 3.5], ['Dm9', 11.5, 2.5], ['F/G', 14, 4]]);
  assert.ok(t.kick, 'a kick on the push');
  // keyboard in: a ♭VII chord (B♭) is accepted now
  await page.evaluate(() => { const g = window.__gpa; g.ui.proj.ci = -1; });
  await page.click('#pkbin');
  await page.evaluate(async () => { const g = window.__gpa, w = ms => new Promise(r => setTimeout(r, ms)); [46, 62, 65, 69].forEach(m => g.Input.noteOn(m, 'test', 0.8)); await w(30); [46, 62, 65, 69].forEach(m => g.Input.noteOff(m, 'test')); await w(30); });
  p = await P(page);
  assert.deepEqual(p.sections.Verse.chords.slice(-1)[0], { r: 10, q: 'maj7', b: null, beats: 4, push: false }, 'B♭maj7 (♭VIImaj7) played in');
  assert.deepEqual(errors, []);
});

test('the song form: repeats, a key change with its lead-in, a tag, a band stop and energy', async () => {
  const { page, errors } = await open();
  for (const s of ['Verse', 'Chorus', 'Chorus']) await page.click('[data-act=padds][data-s="' + s + '"]');
  await page.selectOption('[data-bind=pfx][data-i="1"]', '2');
  await page.selectOption('[data-bind=pfup][data-i="2"]', '2');
  await page.selectOption('[data-bind=pftag][data-i="2"]', '2');
  await page.check('[data-bind=pfstop][data-i="2"]');
  await page.selectOption('[data-bind=pfen][data-i="0"]', 'soft');
  const r = await page.evaluate(() => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], A = arrangeSong(P);
    return { tl: A.timeline.map(t => [t.label, t.key, t.beats, t.chs.map(c => c.name).join(' ')]), markers: A.markers.map(m => m.text), last: A.events.filter(e => e.notes && !e.mel).reduce((a, e) => Math.max(a, e.t), 0), total: A.total };
  });
  // Chorus is I V vi IV a bar each (16 beats); the 2nd pass ends with A7 (V7 of D) on the last two beats
  assert.deepEqual(r.tl.map(x => x[0]), ['Verse', 'Chorus 1 of 2', 'Chorus 2 of 2', 'Chorus', 'Chorus tag 1', 'Chorus tag 2']);
  assert.match(r.tl[2][3], / A7$/, 'lead-in to the new key: ' + r.tl[2][3]);
  assert.equal(r.tl[3][1], 'D'); assert.match(r.tl[3][3], /^D A Bm G$/);
  assert.deepEqual(r.tl.slice(4).map(x => x[2]), [8, 8], 'a tag is the last two bars');
  assert.ok(r.last <= r.total - 4 + 1e-6, 'the band stops on beat 1 of the last bar');
  assert.match(r.markers[2], /key D/);
  assert.match(await page.textContent('#songpos'), /Chorus ×2/);
  assert.deepEqual(errors, []);
});

test('words, choir parts, lead sheet, number chart and rehearsal audio', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1];
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 5, q: 'major', b: 7, beats: 4, push: true }, { r: 4, q: '7', b: null, beats: 4, push: false }, { r: 9, q: 'm7', b: null, beats: 4, push: false }];
    P.melodies.Chorus = { notes: [{ m: 72, t: 0, d: 1 }, { m: 74, t: 1, d: 1 }, { m: 76, t: 2, d: 3 }, { m: 74, t: 5, d: 2 }, { m: 72, t: 7, d: 1 }, { m: 71, t: 8, d: 4 }, { m: 72, t: 12, d: 4 }] };
    P.form = [{ s: 'Chorus' }, { s: 'Chorus', up: 1 }]; P.structure = ['Chorus', 'Chorus'];
    g.render();
  });
  await page.fill('[data-bind=pwords]', 'Je-sus, my Lord _ I a-dore');
  await page.locator('[data-bind=pwords]').blur();
  const roll = await page.locator('#roll .rly').allTextContents();
  assert.deepEqual(roll, ['Je-', 'sus,', 'my', 'Lord', 'I', 'a-', 'dore'].slice(0, 6), 'one syllable per note; the _ holds Lord over the fifth note: ' + roll);
  await page.check('[data-bind=pchoir]');
  // MIDI: alto and tenor tracks
  const [dm] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=pmidi]')]);
  const midi = fs.readFileSync(await dm.path()).toString('latin1');
  assert.ok(/Alto/.test(midi) && /Tenor/.test(midi) && /Soprano/.test(midi), 'choir tracks in the MIDI file');
  // lead sheet: staff, chord symbols, words, key change; number chart: Nashville numbers
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=plead]')]);
  const lead = fs.readFileSync(await dl.path(), 'utf8');
  fs.writeFileSync(path.join(require('os').tmpdir(), 'gma-lead.html'), lead);
  assert.ok(/<svg class="staff"/.test(lead), 'staff'); assert.ok(/st-lyric/.test(lead) && />Je-</.test(lead), 'words'); assert.ok(/F\/G/.test(lead), 'chords'); assert.ok(/st-tie/.test(lead), 'ties');
  assert.match(lead, /key of D♭/);
  const [dn] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=pchart][data-mode=numbers]')]);
  const num = fs.readFileSync(await dn.path(), 'utf8');
  assert.ok(/>1</.test(num) && /4\/5/.test(num) && /3⁷/.test(num) && /6m⁷/.test(num) && /KEY CHANGE to D♭/.test(num) && /‹/.test(num), 'number chart');
  // hear the alto alone, and save the alto rehearsal audio
  await page.click('[data-act=pchoirhear][data-part=alto]');
  const [dw] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('[data-act=pwav][data-focus=alto]')]);
  assert.match(dw.suggestedFilename(), /alto-rehearsal/);
  assert.deepEqual(errors, []);
});

test('sing it in: the microphone line becomes melody notes on the grid', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1];
    P.key = 'D'; P.bpm = 60; P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
    g.ui.proj.singBack = 'click'; g.render();
  });
  await page.click('#melsing');
  await page.waitForFunction(() => window.__gpa.ui.proj.take, null, { timeout: 30000 });
  const take = await page.evaluate(() => window.__gpa.ui.proj.take);
  // the fake microphone sings D E F♯ G A G F♯ E D, one note a second (one beat at 60 BPM), looping
  assert.ok(take.sung && take.notes.length >= 5, 'notes: ' + JSON.stringify(take.notes));
  take.notes.forEach(n => assert.ok([50, 52, 54, 55, 57].includes(n.m), 'a note of the sung scale: ' + n.m));
  const steps = take.notes.slice(1).map((n, i) => Math.abs(n.m - take.notes[i].m));
  assert.ok(steps.filter(s => s <= 2).length >= steps.length - 1, 'the scale moves by step: ' + steps);
  const full = take.notes.filter(n => n.d === 1).length;
  assert.ok(full >= take.notes.length - 2, 'one-beat notes: ' + JSON.stringify(take.notes));
  await page.click('[data-act=ptakekeep]');
  const kept = await page.evaluate(() => { const g = window.__gpa; return g.S().songs[g.S().songs.length - 1].melodies.Chorus.notes.length; });
  assert.equal(kept, take.notes.length);
  assert.deepEqual(errors, []);
});
