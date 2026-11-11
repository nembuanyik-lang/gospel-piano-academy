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

test('picture cards: choose a drum beat and a sound; "Hear" plays the beat; the old list still works', async () => {
  const { page, errors } = await open();
  await page.click('[data-act=ptab][data-t="arrange"]');
  assert.ok(await page.locator('[data-act=pbeatcard]').count() >= 15, 'a card for each beat');
  assert.ok(await page.locator('[data-act=instcard]').count() >= 6, 'a card for each sound');
  assert.ok(await page.locator('[data-act=pbeatcard][data-v=makossa] .bprow i.on').count() > 0, 'the pattern is drawn');
  await page.click('[data-act=pbeatcard][data-v=makossa]');
  assert.equal((await P(page)).beat, 'makossa');
  assert.equal(await page.locator('[data-act=pbeatcard][aria-pressed=true]').count(), 1);
  assert.equal(await page.$eval('[data-bind=pbeat]', e => e.value), 'makossa', 'the list follows the card');
  await page.click('[data-act=pbeathear][data-v=makossa]');
  await page.waitForTimeout(1200);
  const lvl = await page.evaluate(() => { const m = Snd.meter(), b = new Float32Array(m.fftSize); m.getFloatTimeDomainData(b); return Math.max(...b.map(Math.abs)); });
  assert.ok(lvl > 0.001, 'the beat is audible: ' + lvl);
  await page.click('[data-act=instcard][data-v=organ]');
  assert.equal(await page.evaluate(() => window.__gpa.S().prefs.instrument), 'organ');
  assert.equal(await page.locator('[data-act=instcard][aria-pressed=true]').count(), 1);
  await page.click('summary:has-text("Choose the drums from a list")');
  await page.selectOption('[data-bind=pbeat]', 'ballad');
  assert.equal((await P(page)).beat, 'ballad');
  assert.deepEqual(errors, []);
});

test('ready to upload: the song check, the cover check and the release ZIP', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.title = 'Mercy Song'; P.beat = 'praise'; P.info = { writers: 'Minister Kemamah', artist: 'Kemamah', year: '2026' };
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }, { r: 9, q: 'minor', b: null, beats: 4, push: false }, { r: 5, q: 'major', b: null, beats: 4, push: false }];
    P.form = [{ s: 'Chorus' }, { s: 'Chorus' }, { s: 'Chorus' }]; P.structure = ['Chorus', 'Chorus', 'Chorus']; g.go('song', { pid: P.id }); });
  await page.click('[data-act=ptab][data-t="share"]');
  await page.click('[data-act=prcheck]');
  await page.waitForSelector('#relresult .relnotes', { timeout: 90000 });
  const titles = await page.$$eval('#relresult .relnotes li', els => els.map(e => e.className + ' | ' + e.textContent));
  assert.ok(titles.some(t => /Loudness -?\d+\.\d LUFS/.test(t)), 'loudness is reported: ' + titles.join(' / '));
  assert.ok(titles.some(t => /Peak -?\d+\.\d dBTP/.test(t)), 'peak is reported');
  assert.ok(titles.some(t => /Title: Mercy Song/.test(t)), 'the title is checked');
  assert.ok(!titles.some(t => /^rel-bad/.test(t)), 'nothing is wrong with this song: ' + titles.join(' / '));
  // a cover picture: a square 3000 x 3000 PNG, then a 2000 x 1000 JPG
  const pick = async (w, h, type) => {
    await page.evaluate(async ([w, h, type]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').fillRect(0, 0, w, h);
      const blob = await new Promise(r => c.toBlob(r, type)); const dt = new DataTransfer(); dt.items.add(new File([blob], 'cover.' + (type === 'image/png' ? 'png' : 'jpg'), { type })); const f = document.getElementById('coverfile'); f.files = dt.files; f.dispatchEvent(new Event('change')); }, [w, h, type]);
    await page.waitForFunction(() => /Cover picture/.test(document.getElementById('relresult').textContent), null, { timeout: 15000 });
    return page.$eval('#relresult', e => e.textContent);
  };
  let txt = await pick(3000, 3000, 'image/png'); assert.match(txt, /Size 3000 × 3000/); assert.match(txt, /Meets the 3000/);
  txt = await pick(2000, 1000, 'image/jpeg'); assert.match(txt, /Not square \(2000 × 1000\)/);
  // the release ZIP
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('[data-act=prelease]')]);
  const file = path.join(require('os').tmpdir(), 'rel-' + Date.now() + '.zip'); await dl.saveAs(file);
  const list = execFileSync('python3', ['-c', 'import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); print("\\n".join(n+":"+str(z.getinfo(n).file_size) for n in z.namelist())); print(z.read("README.txt").decode())', file]).toString();
  assert.match(list, /mercy-song.*\.wav:\d{5,}/i, list); assert.match(list, /README\.txt/); assert.match(list, /16-bit/); assert.match(list, /\[OK\]/);
  fs.unlinkSync(file);
  assert.deepEqual(errors, []);
});

test('song at a glance: a coloured row for each backing part, a playhead that moves, and a mixer meter for each part', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.beat = 'praise';
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
    P.form = [{ s: 'Chorus' }, { s: 'Chorus' }]; P.structure = ['Chorus', 'Chorus']; g.go('song', { pid: P.id }); });
  await page.click('[data-act=ptab][data-t="mix"]');
  const rows = await page.$$eval('#overview .ovrow:not(.ovhead) .ovname', els => els.map(e => e.textContent.trim()));
  assert.deepEqual(rows.slice(0, 3), ['Keys', 'Bass', 'Drums']);
  assert.ok(await page.locator('#overview .ovrow.ch-drums .ovcells i:not(.empty)').count() >= 2, 'the drums play in the song');
  await page.evaluate(() => document.querySelector('#songplay').click());
  await page.waitForTimeout(2500);
  const left = await page.$eval('#ovcur', e => e.style.left), x1 = await page.$eval('#ovcur', e => e.getBoundingClientRect().left);
  await page.waitForTimeout(1200); const x2 = await page.$eval('#ovcur', e => e.getBoundingClientRect().left);
  assert.ok(left && x2 > x1, 'the playhead moves: ' + left + ' ' + x1 + ' -> ' + x2);
  const h = await page.$$eval('[data-meter]', els => els.map(e => parseFloat(e.style.height) || 0)); assert.ok(h.length >= 3 && h.some(x => x > 1), 'part meters move: ' + h);
  await page.evaluate(() => document.querySelector('#songplay').click());
  assert.deepEqual(errors, []);
});

test('the drummer: automatic fills, busyness, percussion and kit reach the arrangement and the controls work', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.beat = 'praise'; P.human = 0;
    const ch = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
    P.sections.Verse.chords = ch.slice(); P.sections.Chorus.chords = ch.slice();
    P.form = [{ s: 'Verse' }, { s: 'Chorus' }]; P.structure = ['Verse', 'Chorus']; g.go('song', { pid: P.id }); });
  const count = (fn) => page.evaluate(fn => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; const A = arrangeSong(P, { melody: false }); return (new Function('A', 'P', 'return (' + fn + ')(A, P)'))(A, P); }, String(fn));
  const toms = () => count((A) => A.events.filter(e => ['th', 'tm', 'tl'].includes(e.drum)).length);
  const drums = () => count((A) => A.events.filter(e => e.drum).length);
  assert.equal(await toms(), 0, 'no fills by default');
  await page.click('[data-act=ptab][data-t="arrange"]');
  await page.check('[data-bind=pautofill]');
  assert.ok(await toms() > 0, 'a fill before the chorus when automatic fills are on');
  await page.uncheck('[data-bind=pautofill]'); assert.equal(await toms(), 0);
  await page.click('[data-act=pbeatcard][data-v=rock]');
  const base = await drums();
  await page.click('[data-act=pbusy][data-v="1"]'); const busier = await drums();
  await page.click('[data-act=pbusy][data-v="-1"]'); const calmer = await drums();
  assert.ok(busier > base && base > calmer, 'busier > as written > calmer: ' + [busier, base, calmer]);
  await page.click('[data-act=pbusy][data-v="0"]');
  await page.selectOption('[data-bind=pperc]', 'shakercongas');
  assert.ok(await count((A) => A.events.filter(e => e.drum === 'sh').length) > 0, 'a shaker');
  assert.ok(await count((A) => A.events.filter(e => e.drum === 'cg' || e.drum === 'cd').length) > 0, 'congas');
  await page.selectOption('[data-bind=pperc]', 'off'); assert.equal(await count((A) => A.events.filter(e => ['sh', 'tb', 'cg', 'cd'].includes(e.drum)).length), 0);
  await page.selectOption('[data-bind=pkit]', '40');
  assert.equal(await count((A, P) => A.script.kit), 40, 'the kit goes with the script');
  // percussion also plays when the song has no drums
  await page.click('[data-act=pbeatcard][data-v=none]'); await page.selectOption('[data-bind=pperc]', 'tambourine');
  assert.ok(await count((A) => A.events.filter(e => e.drum === 'tb').length) > 0, 'a tambourine without drums');
  assert.equal(await count((A) => A.events.filter(e => e.drum === 'c').length), 0, 'no crash cymbal from percussion alone');
  assert.deepEqual(errors, []);
});

test('human feel for keys and bass: chords roll, timing varies, the same every time; the melody and the MIDI stay exact', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.beat = 'praise';
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }, { r: 9, q: 'minor', b: null, beats: 4, push: false }, { r: 5, q: 'major', b: null, beats: 4, push: false }];
    P.melodies.Chorus = { notes: [{ m: 72, t: 0, d: 1 }, { m: 74, t: 1, d: 1 }] };
    P.form = [{ s: 'Chorus' }, { s: 'Chorus' }]; P.structure = ['Chorus', 'Chorus']; g.go('song', { pid: P.id }); });
  const snap = (level) => page.evaluate((lv) => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.humanKeys = lv; const A = arrangeSong(P, { melody: true, melInst: 'piano' });
    const keys = A.events.filter(e => e.notes && !e.drum && !e.mel && !e.choir && e.part !== 'bass'), bass = A.events.filter(e => e.part === 'bass'), mel = A.events.filter(e => e.mel);
    return { keys: keys.map(e => [e.notes.length, +e.t.toFixed(4), +e.vel.toFixed(3)]), bass: bass.map(e => +e.t.toFixed(4)), mel: mel.map(e => [e.t, e.vel]), midi: JSON.stringify(A.parts.chords.concat(A.parts.bass)) }; }, level);
  const a = await snap(0), b = await snap(2), c = await snap(2);
  assert.ok(a.keys.every(k => k[0] >= 3), 'exact: each chord is one block of notes');
  assert.ok(b.keys.length > a.keys.length && b.keys.every(k => k[0] === 1), 'loose: the chord is rolled note by note');
  assert.deepEqual(b, c, 'the same every time');
  assert.notDeepEqual(a.bass, b.bass, 'the bass moves a little');
  assert.ok(b.bass.every((t, i) => Math.abs(t - a.bass[i]) < 0.12), 'but only a little');
  assert.deepEqual(a.mel, b.mel, 'the melody stays exact');
  assert.equal(a.midi, b.midi, 'the MIDI file stays exact');
  await page.click('[data-act=ptab][data-t="arrange"]'); await page.selectOption('[data-bind=phumankeys]', '1');
  assert.equal(await page.evaluate(() => window.__gpa.S().songs.slice(-1)[0].humanKeys), 1);
  // it also sounds: render with the feel on
  const pk = await page.evaluate(async () => { const P = window.__gpa.S().songs.slice(-1)[0]; P.humanKeys = 2; const buf = await renderSong(P, { melody: true }); let m = 0; const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) { const x = Math.abs(d[i]); if (x > m) m = x; } return m; });
  assert.ok(pk > 0.05, 'audible: ' + pk);
  assert.deepEqual(errors, []);
});

test('mixer part sound controls: sliders change the project, play with them, Flat resets', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.beat = 'praise';
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
    P.form = [{ s: 'Chorus' }]; P.structure = ['Chorus']; g.go('song', { pid: P.id }); });
  await page.click('[data-act=ptab][data-t="mix"]');
  const set = (bind, k, v) => page.$eval('[data-bind=' + bind + '][data-k=' + k + ']', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await set('mxtone', 'chords', '40'); await set('mxcomp', 'chords', '60'); await set('mxroom', 'chords', '25');
  const mx = await page.evaluate(() => { const m = window.__gpa.S().songs.slice(-1)[0].mixer.chords; return [m.tone, m.comp, m.room]; });
  assert.deepEqual(mx, [0.4, 0.6, 0.25]);
  const sent = await page.evaluate(() => { const P = window.__gpa.S().songs.slice(-1)[0]; return arrangeSong(P, { melody: false }).script.mix.chords; });
  assert.deepEqual([sent.tone, sent.comp, sent.room], [0.4, 0.6, 0.25], 'the sound goes with the song to the player and the export');
  const untouched = await page.evaluate(() => { const P = window.__gpa.S().songs.slice(-1)[0]; return arrangeSong(P, { melody: false }).script.mix.bass; });
  assert.deepEqual(Object.keys(untouched).sort(), ['pan', 'v'], 'a part left flat sends nothing extra');
  await page.evaluate(() => document.querySelector('#songplay').click()); await page.waitForTimeout(1500);
  assert.ok(await page.$$eval('[data-meter]', els => els.some(e => parseFloat(e.style.height) > 1)), 'it plays with the effects on');
  await page.evaluate(() => document.querySelector('#songplay').click());
  await page.evaluate(() => { document.querySelector('.strip.ch-chords .fxmore').open = true; });
  await page.click('[data-act=mxfxreset][data-k=chords]');
  assert.deepEqual(await page.evaluate(() => { const m = window.__gpa.S().songs.slice(-1)[0].mixer.chords; return [m.tone, m.comp, m.room]; }), [0, 0, 0]);
  assert.deepEqual(errors, []);
});

test('bass: every style plays in range and keeps to its bar, the bass sound is chosen per song, and styles survive a backup', async () => {
  const { page, errors } = await open();
  const r = await page.evaluate(() => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.title = 'Bass'; P.key = 'D'; P.bpm = 100; P.beat = 'none';
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }, { r: 9, q: 'minor', b: null, beats: 4, push: false }, { r: 5, q: 'major', b: null, beats: 4, push: false }];
    P.form = [{ s: 'Chorus' }]; P.structure = ['Chorus'];
    const out = {};
    Object.keys(BASS_STYLES).forEach(k => {
      P.bassStyle = k; const A = arrangeSong(P), b = A.parts.bass;
      out[k] = { n: b.length, lo: Math.min(...b.map(x => x.m)), hi: Math.max(...b.map(x => x.m)), end: Math.max(...b.map(x => x.t + x.d)), total: A.total, first: Math.min(...b.map(x => x.t)) };
    });
    P.bassStyle = 'funk'; P.bassSound = 'upright';
    const ev = arrangeSong(P).script.events.filter(e => e.part === 'bass'); out.ins = [...new Set(ev.map(e => e.bassIns))];
    P.bassSound = 'finger'; out.fin = [...new Set(arrangeSong(P).script.events.filter(e => e.part === 'bass').map(e => e.bassIns))];
    const kept = Sanitize.cleanState({ songs: [{ id: 'pbs', bassStyle: 'makossa', bassSound: 'slap' }, { id: 'pbt', bassStyle: 'bikutsi', bassSound: 'nope' }] }, { styles: ['groove'], beats: ['none'], keys: ['C'] }).songs;
    out.kept = kept.map(s => [s.bassStyle, s.bassSound]);
    return out;
  });
  Object.keys(r).filter(k => !['ins', 'fin', 'kept'].includes(k)).forEach(k => {
    assert.ok(r[k].n >= 4, k + ' has notes: ' + r[k].n);
    assert.ok(r[k].lo >= 28 && r[k].hi <= 55, k + ' stays in the bass range ' + r[k].lo + '-' + r[k].hi);
    assert.ok(r[k].end <= r[k].total + 0.01 && r[k].first >= 0, k + ' stays inside the song');
  });
  assert.deepEqual(r.ins, ['bass_upright']);
  assert.deepEqual(r.fin, [undefined]);
  assert.deepEqual(r.kept, [['makossa', 'slap'], ['bikutsi', undefined]]);
  assert.deepEqual(errors, []);
});

test('edit by hand: click the bass and drum grids, the section plays as drawn, undo to automatic, saved in a backup', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.key = 'D'; P.bpm = 100; P.beat = 'rock'; P.bassStyle = 'root';
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
    P.form = [{ s: 'Chorus' }]; P.structure = ['Chorus']; g.go('song', { pid: P.id });
  });
  await page.click('[data-act=ptab][data-t="arrange"]');
  const grid = page.locator('.edgrid'); await grid.waitFor({ state: 'attached' });
  await grid.scrollIntoViewIfNeeded();
  assert.match(await page.textContent('#edcard'), /automatic/);
  const bass0 = await page.evaluate(() => arrangeSong(window.__gpa.S().songs.slice(-1)[0]).parts.bass.length);
  // add one bass note on row 5 (note 50), at beat 1 (column 4)
  await page.locator('.edgrid').click({ position: { x: 4 * 16 + 4, y: 5 * 18 + 4 } });
  let r = await page.evaluate(() => { const P = window.__gpa.S().songs.slice(-1)[0]; return { e: JSON.parse(JSON.stringify(P.edits)), n: arrangeSong(P).parts.bass.map(n => [n.t, n.m]) }; });
  assert.ok(r.e.bass.Chorus.some(n => n.t === 1 && n.m === 50), 'the note is added: ' + JSON.stringify(r.e.bass.Chorus));
  assert.ok(r.n.some(n => n[0] === 1 && n[1] === 50), 'and it plays');
  assert.equal(r.e.bass.Chorus.length, bass0 + 1, 'the automatic notes were kept as the starting point');
  assert.match(await page.textContent('#edcard'), /Drawn by hand/);
  await page.locator('.edgrid').click({ position: { x: 4 * 16 + 4, y: 5 * 18 + 4 } });
  r = await page.evaluate(() => window.__gpa.S().songs.slice(-1)[0].edits.bass.Chorus.length);
  assert.equal(r, bass0, 'clicking the note takes it away');
  // drums
  await page.selectOption('[data-bind=pedpart]', 'drums');
  const d0 = await page.evaluate(() => arrangeSong(window.__gpa.S().songs.slice(-1)[0]).parts.drums.length);
  await page.locator('.edgrid').click({ position: { x: 6 * 16 + 4, y: 5 * 18 + 4 } });   // row 5 = Side stick lane, column 6
  const dd = await page.evaluate(() => { const P = window.__gpa.S().songs.slice(-1)[0]; return { e: P.edits.drums.Chorus.filter(n => n.drum === 'r' && n.t === 1.5).length, n: arrangeSong(P).parts.drums.length }; });
  assert.equal(dd.e, 1); assert.ok(dd.n >= 1);
  // a backup keeps it, junk is cleaned
  const kept = await page.evaluate(() => { const P = JSON.parse(JSON.stringify(window.__gpa.S().songs.slice(-1)[0])); P.edits.bass.Chorus.push({ t: 99999, d: 1, m: 40 }, { t: 1, d: 1, m: 5 }); P.edits.drums.Evil = [{ t: 0, drum: 'k' }]; const c = Sanitize.cleanState({ songs: [P] }, { styles: ['groove'], beats: ['rock'], keys: ['D'] }).songs[0].edits; return { b: c.bass.Chorus.length, evil: !!c.drums.Evil, d: c.drums.Chorus.length }; });
  assert.equal(kept.evil, false); assert.equal(kept.b, bass0); assert.ok(kept.d > 0);
  // back to automatic
  await page.click('[data-act=pedreset]');
  assert.equal(await page.evaluate(() => { const e = window.__gpa.S().songs.slice(-1)[0].edits; return !e || !e.drums; }), true);
  await page.click('[data-act=pedhear]');
  assert.deepEqual(errors, []);
});

test('levels through the song: a part louder or softer in one part of the form, for the band and for recorded clips', async () => {
  const { page, errors } = await open();
  const r = await page.evaluate(async () => {
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.key = 'D'; P.bpm = 120; P.beat = 'rock'; P.bassStyle = 'root';
    P.sections.Verse.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }]; P.sections.Chorus.chords = [{ r: 7, q: 'major', b: null, beats: 4, push: false }];
    P.form = [{ s: 'Verse' }, { s: 'Chorus' }]; P.structure = ['Verse', 'Chorus'];
    const out = {};
    const base = arrangeSong(P).script.events.filter(e => e.part === 'bass').map(e => e.gx);
    out.baseNone = base.every(x => x === undefined);
    P.form[1].lv = { bass: 6, drums: -60 };
    const A = arrangeSong(P), ch = A.timeline[1].start;
    out.bass = [...new Set(A.script.events.filter(e => e.part === 'bass').map(e => e.t >= ch ? e.gx : e.gx))];
    out.verseBass = A.script.events.filter(e => e.part === 'bass' && e.t < ch).every(e => e.gx === undefined);
    out.chorusDrums = A.script.events.filter(e => e.drum && e.t >= ch).every(e => e.gx === 0);
    out.chorusKeysPlain = A.script.events.filter(e => !e.drum && e.part !== 'bass' && e.t >= ch).every(e => e.gx === undefined);
    // a recorded clip is cut at the parts of the form
    const sr = 8000, n = sr * 20, buf = Snd.ensure().createBuffer(1, n, sr); P.form[1].lv = { tk: -6 };
    const segs = levelSegments(P), pieces = splitByLevels({ buf, at: 0, offset: 0, dur: 40, gain: 1 }, 'tk', segs, 60 / P.bpm);
    out.pieces = pieces.map(p => [p.at, p.dur, Math.round(p.gain * 100) / 100, p.offset]);
    out.ch = ch;
    // backups keep it and clean it
    P.form[0].lv = { bass: 99, junk: 3, drums: 0 };
    const c = Sanitize.cleanState({ songs: [JSON.parse(JSON.stringify(P))] }, { styles: ['groove'], beats: ['rock'], keys: ['D'] }).songs[0].form;
    out.clean = c.map(i => i.lv || null);
    return out;
  });
  assert.ok(r.baseNone); assert.ok(r.verseBass && r.chorusDrums && r.chorusKeysPlain);
  assert.deepEqual(r.bass.filter(x => x !== undefined), [Math.pow(10, 6 / 20)]);
  assert.equal(r.pieces.length, 2, 'the clip is cut at the chorus');
  assert.deepEqual([r.pieces[0][0], r.pieces[0][2]], [0, 1]); assert.equal(r.pieces[1][0], r.ch);
  assert.equal(r.pieces[1][2], 0.5); assert.ok(Math.abs(r.pieces[1][3] - r.ch * 0.5) < 1e-9, 'the second piece starts at the right place in the recording');
  assert.deepEqual(r.clean, [{ bass: 9 }, { tk: -6 }]);
  // the screen
  await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; delete P.form[0].lv; delete P.form[1].lv; g.go('song', { pid: P.id }); });
  await page.click('[data-act=ptab][data-t="mix"]');
  const sel = page.locator('select[data-bind=plv]').first(); await sel.waitFor({ state: 'attached' });
  await sel.scrollIntoViewIfNeeded(); await sel.selectOption('3');
  assert.equal(await page.evaluate(() => { const P = window.__gpa.S().songs.slice(-1)[0]; return JSON.stringify(P.form[0].lv); }), JSON.stringify({ [await page.evaluate(() => document.querySelector('select[data-bind=plv]').dataset.k)]: 3 }));
  await page.click('[data-act=plvreset]');
  assert.equal(await page.evaluate(() => window.__gpa.S().songs.slice(-1)[0].form.some(i => i.lv)), false);
  assert.deepEqual(errors, []);
});

test('mixer EQ controls: low cut, bass, middle, treble and duck sliders change the project and Flat clears them', async () => {
  const { page, errors } = await open();
  await page.click('[data-act=ptab][data-t="mix"]');
  const bassStrip = page.locator('.strip.ch-bass'); await bassStrip.waitFor({ state: 'attached' });
  await bassStrip.locator('details.fxmore summary').click();
  await bassStrip.locator('select[data-f=lc]').selectOption('100');
  await bassStrip.locator('input[data-f=el]').fill('4'); await bassStrip.locator('input[data-f=duck]').fill('50');
  const m = await page.evaluate(() => { const c = window.__gpa.S().songs.slice(-1)[0].mixer.bass; return [c.lc, c.el, c.duck]; });
  assert.deepEqual(m, [100, 4, 0.5]);
  assert.equal(await page.locator('.strip.ch-drums input[data-f=duck]').count(), 0, 'the drums have no duck control');
  await bassStrip.locator('[data-act=mxfxreset]').click();
  assert.deepEqual(await page.evaluate(() => { const c = window.__gpa.S().songs.slice(-1)[0].mixer.bass; return [c.lc, c.el, c.duck]; }), [0, 0, 0]);
  assert.deepEqual(errors, []);
});
