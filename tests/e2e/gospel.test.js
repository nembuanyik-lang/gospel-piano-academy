const T = require('./tabs').auto;
// Gospel ear training, the licks library (played back on keys and sung through a fake microphone), and the song
// package (everything, with recordings and loops) saved and opened again, also after another program re-zipped it.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const serve = require('./serve');
const FIX = path.join(__dirname, '..', 'fixtures');
if (!fs.existsSync(path.join(FIX, 'voice-five.wav'))) execFileSync('python3', [path.join(FIX, 'make-voice.py'), FIX]);

const PORT = 8802;
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
  await page.evaluate(() => { window.__gpa.S().profile.onboarded = true; });
  return { page, errors };
}

test('gospel ear training: questions in numbers, feedback with the chords, and levels that move', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { window.__gpa.ui.practiceTab = 'gospel'; window.__gpa.go('practice'); });
  await page.click('[data-act=pview][data-view=gear]');
  await page.waitForSelector('[data-g=ans]');
  assert.equal(await page.locator('[data-g=ans]').count(), 4);
  for (let i = 0; i < 10; i++) {
    const a = await page.evaluate(() => +document.querySelector('#gear').dataset.answer);
    await page.click('[data-g=ans][data-i="' + a + '"]');
    assert.match(await page.textContent('#gfb'), /Yes!.* In [A-G]/);
    await page.click('[data-g=next]');
  }
  const g = await page.evaluate(() => window.__gpa.S().gear);
  assert.equal(g.level, 2, 'ten right moves up a level'); assert.equal(g.correct, 10);
  // a wrong answer names the progression and shows its chords
  const a = await page.evaluate(() => +document.querySelector('#gear').dataset.answer);
  await page.click('[data-g=ans][data-i="' + ((a + 1) % 4) + '"]');
  assert.match(await page.textContent('#gfb'), /It was .* In [A-G][♭♯]?: [A-G]/);
  assert.deepEqual(errors, []);
});

test('licks: hear one, play it back on the keys and get the tempo raised; sing a run back', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => window.__gpa.go('practice', { view: 'licks' }));
  assert.ok(await page.locator('.lessonrow').count() >= 15);
  await page.click('[data-act=lickcat][data-c=Walk-ups]');
  assert.equal(await page.locator('.lessonrow').count(), 3);
  await page.evaluate(() => window.__gpa.go('practice', { view: 'lick', id: 'walkup' }));
  await page.click('[data-lk=hear]'); await page.waitForTimeout(600);
  // play it back: the expected notes in C at the right moments after the count-in
  const before = await page.evaluate(() => window.__gpa.S().licks.walkup.bpm);
  await page.click('[data-lk=turn]');
  await page.waitForFunction(() => /Play now/.test(document.querySelector('#lkinfo').textContent), null, { timeout: 15000 });
  await page.evaluate(async () => {
    const g = window.__gpa, L = Gospel.LICKS.find(l => l.id === 'walkup'), spb = 60 / g.S().licks.walkup.bpm, w = ms => new Promise(r => setTimeout(r, ms));
    const ev = Gospel.lickEvents(L, 'C').sort((a, b) => a.t - b.t); let last = 0;
    for (const t of [...new Set(ev.map(e => e.t))]) { await w((t - last) * spb * 1000); last = t; const ms = ev.filter(e => e.t === t).reduce((a, e) => a.concat(e.notes), []); ms.forEach(m => g.Input.noteOn(m, 'midi', 0.8)); await w(40); ms.forEach(m => g.Input.noteOff(m, 'midi')); }
  });
  await page.waitForFunction(() => /% right/.test(document.querySelector('#lkinfo').textContent), null, { timeout: 20000 });
  assert.match(await page.textContent('#lkinfo'), /100% right\. Clean! Tempo up/);
  assert.equal(await page.evaluate(() => window.__gpa.S().licks.walkup.bpm), before + 4);
  // a vocal run, sung into the (fake) microphone: the app listens and scores it
  await page.evaluate(() => window.__gpa.go('practice', { view: 'lick', id: 'v54321' }));
  await page.click('[data-lk=turn]');
  await page.waitForFunction(() => /% right|No clear notes/.test(document.querySelector('#lkinfo').textContent), null, { timeout: 30000 });
  assert.deepEqual(errors, []);
});

test('song package: save a song with its recording and loop, then open it again (also after re-zipping)', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => {
    const g = window.__gpa; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'Package Test'; P.bpm = 120; P.beat = 'none';
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
    P.form = [{ s: 'Chorus' }]; P.structure = ['Chorus']; P.info = { writers: 'Minister Kemamah' };
    g.go('song', { pid: P.id });
  });
  await page.click('#guiderec');
  await page.waitForFunction(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return P.guide && P.guide.takes && P.guide.takes.length === 1; }, null, { timeout: 40000 });
  await page.evaluate(async () => {   // a small loop stored like an imported one
    const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], c = g.Snd.ensure(), b = c.createBuffer(1, 22050, 22050);
    const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = 0.3 * Math.sin(i / 5);
    P.loops = [{ id: 'lt1', name: 'Keys', kind: 'loop', role: 'music', bpm: 120, beats: 2, tr: 0, gain: 1, mute: false, secs: ['Chorus'], offset: 0 }];
    await GuideStore.put('loop:' + P.id + ':lt1', new Blob([encodeWav(b, 16)], { type: 'audio/wav' })); touch(); g.render();
  });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('[data-act=ppkg]')]);
  assert.match(dl.suggestedFilename(), /\.gmasong$/);
  const pkg = fs.readFileSync(await dl.path());
  await page.waitForFunction(() => { const e = document.querySelector('#expinfo'); return e && /2 recordings and loops/.test(e.textContent); }, null, { timeout: 10000 }).catch(async e => { console.log('DEBUG', await page.evaluate(() => [location.hash, document.querySelector('h1') && document.querySelector('h1').textContent, !!document.querySelector('[data-act=ppkg]')])); throw e; });
  // open it from the song list: the same song is here, so it comes in as a copy with its own recordings
  const orig = await page.evaluate(() => { const g = window.__gpa; return g.S().songs[g.S().songs.length - 1].id; });
  for (const [name, buf] of [['Package Test.gmasong', pkg], ['rezipped.gmasong', (() => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gma-pkg-')), a = path.join(dir, 'a.zip'), b = path.join(dir, 'b.zip'); fs.writeFileSync(a, pkg); execFileSync('python3', ['-c', 'import zipfile,sys\nzi=zipfile.ZipFile(sys.argv[1]);zo=zipfile.ZipFile(sys.argv[2],"w",zipfile.ZIP_DEFLATED)\nfor n in zi.namelist(): zo.writestr(n, zi.read(n))\nzo.close()', a, b]); return fs.readFileSync(b); })()]]) {
    await page.evaluate(() => window.__gpa.go('song', {}));
    await page.waitForSelector('#pkgfile', { state: 'attached' });
    await page.setInputFiles('#pkgfile', { name, mimeType: 'application/zip', buffer: buf });
    await page.waitForFunction(o => { const g = window.__gpa, last = g.S().songs[g.S().songs.length - 1]; return last && last.id !== o && document.querySelector('#guiderec') && /Package Test \(copy\)/.test(document.querySelector('#ptitle') ? document.querySelector('#ptitle').value : document.body.textContent); }, orig, { timeout: 20000 });   // the app opens the new song
    const r = await page.evaluate(async () => {
      const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1], t = await GuideStore.trackBuffer(P, guideOf(P), { raw: true }), l = await loopSource(P, P.loops[0]);
      return { id: P.id, title: P.title, writers: P.info.writers, take: P.guide.takes[0].k, takeSecs: t && t.duration, loopSecs: l && l.duration };
    });
    assert.notEqual(r.id, orig); assert.match(r.title, /Package Test \(copy\)/); assert.equal(r.writers, 'Minister Kemamah');
    assert.ok(r.take.startsWith(r.id + ':'), 'the take belongs to the new copy');
    assert.ok(r.takeSecs > 3 && Math.abs(r.loopSecs - 1) < 0.01, JSON.stringify(r));
  }
  // not a package
  await page.evaluate(() => window.__gpa.go('song', {}));
  await page.waitForSelector('#pkgfile', { state: 'attached' });
  await page.setInputFiles('#pkgfile', { name: 'x.gmasong', mimeType: 'application/zip', buffer: Buffer.from('hello') });
  await page.waitForFunction(() => { const e = document.querySelector('#pkginfo'); return e && /could not be opened/.test(e.textContent); }, null, { timeout: 10000 });
  assert.deepEqual(errors, []);
});
