// Browser tests: `npm run e2e` (needs the playwright package and its Chromium: `npx playwright install chromium`).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { chromium } = require('playwright');
const serve = require('./serve');

const ROOT = path.join(__dirname, '..', '..', 'app');
const PORT = 8790;
let srv, browser;
test.before(async () => { srv = serve(ROOT, PORT); browser = await chromium.launch(); });
test.after(async () => { await browser.close(); srv.close(); });

async function open(opts) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 800 } }, opts));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:' + PORT + '/');
  return { page, errors, ctx };
}
const onboard = page => page.evaluate(() => { const g = window.__gpa; g.S().profile.onboarded = true; g.S().profile.name = 'Tester'; g.go('home'); });

test('every screen, lesson step and guitar lesson opens without errors', async () => {
  const { page, errors } = await open();
  await onboard(page);
  for (const v of ['home', 'course', 'lab', 'practice', 'song', 'progress', 'profile']) await page.evaluate(v => window.__gpa.go(v), v);
  for (const tab of ['settings', 'data', 'about']) await page.evaluate(t => window.__gpa.go('profile', { tab: t }), tab);
  const n = await page.evaluate(() => { const g = window.__gpa; let c = 0; for (const L of window.Curriculum.LESSONS) { g.ACTIONS.openlesson({ dataset: { id: L.id } }); for (let i = 0; i < 12; i++) g.ACTIONS.lnext(); c++; } return c; });
  assert.ok(n >= 125);
  await page.evaluate(() => { window.__gpa.ui.courseTab = 'guitar'; window.__gpa.go('course'); });
  const gids = await page.evaluate(() => Array.from(document.querySelectorAll('[data-act=gopen]')).map(e => e.dataset.id));
  assert.ok(gids.length >= 50);
  for (const id of gids) await page.evaluate(id => window.__gpa.go('guitar', { lid: id }), id);
  for (const pv of [{ view: 'ear', type: 'note' }, { view: 'sight' }, { view: 'songbook' }, { view: 'metro' }, { view: 'sprint', kind: 'note' }, { view: 'review' }]) await page.evaluate(pv => window.__gpa.go('practice', pv), pv);
  assert.deepEqual(errors, []);
});

test('a hostile backup cannot run code, and the import can be undone', async () => {
  const { page, errors } = await open();
  await onboard(page);
  await page.evaluate(() => { window.__gpa.S().xp = 777; window.__gpa.go('profile', { tab: 'data' }); });
  await page.setInputFiles('#pimportfile', path.join(__dirname, '..', 'fixtures', 'hostile-backup.json'));
  await page.click('[data-act=pimportapply]');
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__gpa.go('song'));
  await page.waitForTimeout(200);
  assert.notEqual(await page.title(), 'PWNED');
  assert.equal(await page.evaluate(() => window.__gpa.S().xp), 10);
  await page.evaluate(() => window.__gpa.go('home'));
  await page.click('[data-act=undoimport]');
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__gpa.S().xp), 777, 'undo brings back the progress from before the import');
  assert.deepEqual(errors, []);
});

test('back navigation returns to the previous screen', async () => {
  const { page } = await open();
  await onboard(page);
  await page.evaluate(() => window.__gpa.go('practice'));
  await page.evaluate(() => window.__gpa.go('lab'));
  await page.goBack();
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => window.__gpa.route().name), 'practice');
});

test('a failed save shows the warning banner', async () => {
  const { page } = await open();
  await onboard(page);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); }; window.__gpa.S().xp += 1; });
  await page.evaluate(() => window.__gpa.Store && window.__gpa.Store.ok);
  await page.evaluate(() => { const g = window.__gpa; g.render(); });
  await page.evaluate(() => new Promise(r => setTimeout(r, 50)));
  await page.evaluate(() => window.saveNow ? window.saveNow() : null);
  await page.waitForTimeout(100);
  assert.equal(await page.isVisible('#savebanner'), true);
});

test('settings change the theme and text size, and survive a reload', async () => {
  const { page, errors } = await open();
  await onboard(page);
  await page.evaluate(() => window.__gpa.go('profile', { tab: 'settings' }));
  await page.click('[data-act=ptheme][data-v=dark]');
  await page.click('[data-act=ptext][data-v="130"]');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  assert.equal(await page.evaluate(() => document.documentElement.style.zoom), '1.3');
  await page.waitForTimeout(700);
  await page.reload();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  assert.deepEqual(errors, []);
});

test('progress report and class summary are produced', async () => {
  const { page, errors } = await open({ acceptDownloads: true });
  await onboard(page);
  await page.evaluate(() => window.__gpa.go('profile', { tab: 'data' }));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=preport]')]);
  assert.match(dl.suggestedFilename(), /^progress-report-tester-\d{4}-\d{2}-\d{2}\.html$/);
  const html = require('fs').readFileSync(await dl.path(), 'utf8');
  assert.match(html, /Progress report: Tester/);
  await page.setInputFiles('#classfiles', [path.join(__dirname, '..', 'fixtures', 'hostile-backup.json')]);
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.dtable tr').count(), 2, 'header row plus one learner');
  assert.notEqual(await page.title(), 'PWNED');
  assert.deepEqual(errors, []);
});

test('timing calibration and the guitar course lock open without errors', async () => {
  const { page, errors } = await open();
  await onboard(page);
  await page.evaluate(() => window.__gpa.go('practice', { view: 'calib' }));
  assert.equal(await page.isVisible('.tap-pad'), true);
  await page.evaluate(() => { window.__gpa.ui.courseTab = 'guitar'; window.__gpa.go('course'); });
  const locked = await page.locator('[data-act=gopen][disabled]').count();
  assert.ok(locked > 40, 'later guitar lessons start locked');
  await page.fill('#csearch', 'barre');
  const shown = await page.locator('#cresults [data-act=gopen]').count();
  assert.ok(shown >= 1 && shown < 10, 'search narrows the list');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'csearch', 'typing keeps focus in the search box');
  assert.deepEqual(errors, []);
});

test('a timed performance test scores chords played on the beat, in every key', async () => {
  const { page, errors } = await open();
  await onboard(page);
  const result = await page.evaluate(async () => {
    const g = window.__gpa;
    g.go('practice');                                     // any screen; mount the exercise into a test box
    const host = document.createElement('div'); document.getElementById('main').appendChild(host);
    let doneInfo = null, meta = null;
    const realMetro = g.Snd.metro;
    g.Snd.metro = o => { meta = realMetro(o); return meta; };
    const prog = [{ name: 'Dm9', notes: ['D3', 'F4', 'A4', 'C5', 'E5'], low: true }, { name: 'G13', notes: ['G2', 'F4', 'A4', 'B4', 'E5'], low: true }, { name: 'Cmaj9', notes: ['C3', 'E4', 'G4', 'B4', 'D5'], low: true }];
    const ex = { type: 'perf', id: 'test-251', title: 'Test', prog, base: 'C', keys: ['C', 'F'], beats: 1, ladder: [120], hints: true, prompt: 'test' };
    g.mountExercise(host, ex, { onDone: info => { doneInfo = info; } });
    const seq = window.perfSequence(ex);                  // the same transposition the test uses
    host.querySelector('[data-perf=go]').click();
    const spb = 0.5;
    for (let i = 0; i < seq.length; i++) {
      const at = meta.t0 + (4 + i) * spb;
      while (g.Snd.now() < at - 0.02) await new Promise(r => setTimeout(r, 5));
      const ms = seq[i].notes.map(n => window.Engine.midiOf(n));
      ms.forEach(m => g.Input.noteOn(m, 'test', 0.8));
      await new Promise(r => setTimeout(r, 60));
      ms.forEach(m => g.Input.noteOff(m));
    }
    const t0 = Date.now(); while (!doneInfo && Date.now() - t0 < 3000) await new Promise(r => setTimeout(r, 50));
    g.Snd.metro = realMetro;
    return { done: !!doneInfo, acc: doneInfo && doneInfo.accuracy, names: seq.map(s => s.name), rec: g.S().perf && g.S().perf['test-251'] };
  });
  assert.deepEqual(result.names, ['Dm9', 'G13', 'Cmaj9', 'Gm9', 'C13', 'Fmaj9'], 'chord names follow the key');
  assert.equal(result.done, true, 'all chords on the beat passes the test');
  assert.equal(result.acc, 100);
  assert.equal(result.rec.passedAll, true);
  assert.equal(result.rec.best, 120);
  assert.deepEqual(errors, []);
});

test('wrong or late chords fail the performance test', async () => {
  const { page } = await open();
  await onboard(page);
  const r = await page.evaluate(async () => {
    const g = window.__gpa; g.go('practice');
    const host = document.createElement('div'); document.getElementById('main').appendChild(host);
    let doneInfo = null, meta = null; const realMetro = g.Snd.metro; g.Snd.metro = o => { meta = realMetro(o); return meta; };
    const ex = { type: 'perf', id: 'test-fail', prog: [{ root: 'C', quality: 'major' }, { root: 'F', quality: 'major' }, { root: 'G', quality: 'major' }, { root: 'C', quality: 'major' }], beats: 1, ladder: [120], prompt: 't' };
    g.mountExercise(host, ex, { onDone: info => { doneInfo = info; } });
    host.querySelector('[data-perf=go]').click();
    const plays = [[60, 64, 67], [60, 63, 67], null, [60, 64, 67]];   // right, wrong (C minor), nothing, right
    for (let i = 0; i < 4; i++) {
      const at = meta.t0 + (4 + i) * 0.5;
      while (g.Snd.now() < at - 0.02) await new Promise(res => setTimeout(res, 5));
      if (plays[i]) plays[i].forEach(m => g.Input.noteOn(m, 'test', 0.8));
      await new Promise(res => setTimeout(res, 60));
      if (plays[i]) plays[i].forEach(m => g.Input.noteOff(m));
    }
    await new Promise(res => setTimeout(res, 1200));
    g.Snd.metro = realMetro;
    return { done: !!doneInfo, fb: host.querySelector('.ex-fb').textContent };
  });
  assert.equal(r.done, false);
  assert.match(r.fb, /2 of 4 on time/);
});

test('daily technique and play it back open and run', async () => {
  const { page, errors } = await open();
  await onboard(page);
  await page.evaluate(() => { const s = window.__gpa.S(); s.lessons['g-turnaround'] = { status: 'done' }; window.__gpa.go('practice'); });
  assert.equal(await page.locator('[data-view=technique]').count() > 0, true, 'technique appears once the learner is ready');
  await page.evaluate(() => window.__gpa.go('practice', { view: 'technique' }));
  assert.equal(await page.isVisible('[data-perf=go]'), true);
  for (const i of [1, 2]) { await page.click('[data-act=techstep][data-i="' + i + '"]'); assert.equal(await page.isVisible('[data-perf=go]'), true); }
  await page.evaluate(() => window.__gpa.go('practice', { view: 'byear' }));
  await page.click('[data-act=byreveal]');
  assert.match(await page.textContent('.callout'), /It was:/);
  assert.deepEqual(errors, []);
});

test('every performance test in the course transposes to playable chords in every key', async () => {
  const { page } = await open();
  const bad = await page.evaluate(() => {
    const out = [], E = window.Engine;
    window.Curriculum.LESSONS.forEach(L => [L.play].concat(L.practice || [], [L.challenge]).forEach(ex => {
      if (!ex || ex.type !== 'perf') return;
      const range = window.perfRange(ex), seq = window.perfSequence(ex), per = ex.prog.length;
      seq.forEach((t, i) => {
        const src = ex.prog[i % per];
        if (t.notes) {
          const ms = t.notes.map(n => E.midiOf(n)), sm = src.notes.map(n => E.midiOf(n));
          if (ms.some(m => m === null || m < range[0] || m > range[1])) out.push(L.id + ': ' + t.name + ' out of range ' + t.notes.join(' '));
          const shape = a => a.map(m => m - a[0]).join(',');
          if (shape(ms) !== shape(sm)) out.push(L.id + ': ' + t.name + ' changed shape');
          if (!/^[A-G][#b]?/.test(t.name) && /^[A-G]/.test(src.name)) out.push(L.id + ': bad name ' + t.name);
        } else if (E.pcOfName(t.root) === null || !E.QUALITIES[t.quality]) out.push(L.id + ': bad chord ' + t.root + t.quality);
      });
    }));
    return out;
  });
  assert.deepEqual(bad, []);
});

test('daily technique builds correct, playable exercises in all 12 keys', async () => {
  const { page } = await open();
  const bad = await page.evaluate(() => {
    const out = [], E = window.Engine;
    DAY_KEYS.forEach(k => techniqueSpecs(k).forEach(s => {
      const seq = perfSequence(s.ex), r = perfRange(s.ex);
      seq.forEach(t => { if (typeof t.name !== 'string' || !t.name) out.push(k + ' ' + s.label + ': bad name'); t.notes.forEach(n => { const m = E.midiOf(n); if (m < r[0] || m > r[1]) out.push(k + ' ' + s.label + ': ' + n + ' out of range'); }); });
      if (s.label === 'Scale') { const ms = seq.slice(0, 8).map(t => E.midiOf(t.notes[0])); if (!ms.every((x, i) => i === 0 || x > ms[i - 1])) out.push(k + ' scale does not rise'); }
    }));
    return out;
  });
  assert.deepEqual(bad, []);
});

/* ---------------- Song Lab studio ---------------- */
async function makeSong(page) {
  return page.evaluate(() => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1];
    P.title = 'Studio Test'; P.key = 'G'; P.bpm = 120; P.beat = 'ballad'; P.style = 'groove'; P.bassStyle = 'walking';
    P.sections.Verse = { degs: [6, 4, 1, 5], len: 1 }; P.sections.Chorus = { degs: [1, 5, 6, 4, 1, 5, 4, 1], len: 1 }; P.sections.Bridge = { degs: [4, 5], len: 2 };
    P.structure = ['Verse', 'Chorus', 'Bridge', 'Chorus'];
    P.melodies.Chorus = { notes: [{ m: 67, t: 0, d: 2 }, { m: 71, t: 2, d: 2 }, { m: 74, t: 4, d: 4 }] };
    g.go('song', { pid: P.id }); return P.id;
  });
}
function parseMidi(buf) {
  const d = buf, u32 = o => d.readUInt32BE(o), u16 = o => d.readUInt16BE(o);
  if (d.toString('latin1', 0, 4) !== 'MThd') throw new Error('not midi');
  const n = u16(10), tracks = []; let pos = 14;
  const vlq = i => { let v = 0, c; do { c = d[i++]; v = (v << 7) | (c & 127); } while (c & 128); return [v, i]; };
  for (let k = 0; k < n; k++) {
    const len = u32(pos + 4); let i = pos + 8; const end = i + len; let run = 0, tick = 0; const t = { name: '', notes: 0, markers: [], ts: null };
    while (i < end) {
      let dt; [dt, i] = vlq(i); tick += dt;
      if (d[i] === 0xFF) { const type = d[i + 1]; let l, j; [l, j] = vlq(i + 2); const data = d.slice(j, j + l); i = j + l; if (type === 3) t.name = data.toString(); if (type === 6) t.markers.push(data.toString()); if (type === 0x58) t.ts = data[0] + '/' + (1 << data[1]); continue; }
      if (d[i] & 0x80) run = d[i++];
      const typ = run & 0xF0; if (typ === 0x90 && d[i + 1] > 0) t.notes++; i += (typ === 0xC0 || typ === 0xD0) ? 1 : 2;
    }
    tracks.push(t); pos = end;
  }
  return tracks;
}

test('song lab: sections keep their own chords in the arrangement and the MIDI file', async () => {
  const { page, errors } = await open({ acceptDownloads: true });
  await makeSong(page);
  const tl = await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; const A = arrangeSong(P); return A.timeline.map(t => [t.type, t.beats, t.chs.map(c => c.name).join(' ')]); });
  assert.deepEqual(tl, [['Verse', 16, 'Em C G D'], ['Chorus', 32, 'G D Em C G D C G'], ['Bridge', 16, 'C D'], ['Chorus', 32, 'G D Em C G D C G']]);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=pmidi]')]);
  const tracks = parseMidi(require('fs').readFileSync(await dl.path()));
  assert.deepEqual(tracks.map(t => t.name), ['Studio Test', 'Chords', 'Bass', 'Melody', 'Drums']);
  assert.deepEqual(tracks[0].markers, ['Verse', 'Chorus', 'Bridge', 'Chorus']);
  assert.equal(tracks[3].notes, 6, 'the chorus melody appears in both choruses');
  assert.ok(tracks[2].notes >= 80, 'walking bass plays a note on every beat in 4/4');
  assert.deepEqual(errors, []);
});

test('song lab: 3/4 and 6/8 songs export with the right time signature', async () => {
  const { page } = await open({ acceptDownloads: true });
  await makeSong(page);
  for (const [ts, sig] of [[3, '3/4'], [6, '6/8']]) {
    await page.click('[data-act=pts][data-v="' + ts + '"]');
    const beats = await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return arrangeSong(P).timeline[0].beats; });
    assert.equal(beats, 12, 'four bars of three beats');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=pmidi]')]);
    assert.equal(parseMidi(require('fs').readFileSync(await dl.path()))[0].ts, sig);
  }
});

test('song lab: the audio export is a real WAV of the right length with sound in it', async () => {
  const { page, errors } = await open({ acceptDownloads: true });
  await makeSong(page);
  await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; P.structure = ['Verse', 'Chorus']; g.render(); });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('[data-act=pwav][data-mix=full]')]);
  const buf = require('fs').readFileSync(await dl.path());
  assert.equal(buf.toString('latin1', 0, 4), 'RIFF'); assert.equal(buf.toString('latin1', 8, 12), 'WAVE');
  const ch = buf.readUInt16LE(22), sr = buf.readUInt32LE(24), bytes = buf.readUInt32LE(40), secs = bytes / (sr * ch * 2);
  assert.equal(ch, 2); assert.equal(sr, 44100);
  assert.ok(secs > 24 && secs < 29, '48 beats at 120 BPM is 24 seconds plus the tail, got ' + secs);
  let sum = 0, n = 0; for (let o = 44; o < buf.length; o += 2 * 400) { const v = buf.readInt16LE(o) / 32768; sum += v * v; n++; }
  assert.ok(Math.sqrt(sum / n) > 0.01, 'the file is not silent');
  assert.deepEqual(errors, []);
});

test('song lab: record a melody take, keep it, and edit it in the note editor', async () => {
  const { page, errors } = await open();
  await makeSong(page);
  await page.click('[data-act=psecm][data-s=Verse]');
  const kept = await page.evaluate(async () => {
    const g = window.__gpa; let meta = null; const real = g.Snd.play;
    g.Snd.play = (s, o) => real(s, Object.assign({}, o, { onStart: (t, c, b) => { meta = t; if (o.onStart) o.onStart(t, c, b); } }));
    document.getElementById('melrec').click();
    while (meta === null) await new Promise(r => setTimeout(r, 10));
    const spb = 0.5, start = meta + 4 * spb, plan = [[67, 0, 1], [69, 1, 1], [71, 2, 2]];
    for (const [m, t, d] of plan) {
      while (g.Snd.now() < start + t * spb) await new Promise(r => setTimeout(r, 5));
      g.Input.noteOn(m, 'test', 0.8);
      while (g.Snd.now() < start + (t + d) * spb - 0.05) await new Promise(r => setTimeout(r, 5));
      g.Input.noteOff(m);
    }
    g.Snd.play = real;
    const P = g.S().songs[g.S().songs.length - 1];
    for (let i = 0; i < 400 && !(g.ui.proj && g.ui.proj.take); i++) await new Promise(r => setTimeout(r, 50));
    return g.ui.proj.take && g.ui.proj.take.notes;
  });
  assert.deepEqual(kept.map(n => [n.m, n.t, n.d]), [[67, 0, 1], [69, 1, 1], [71, 2, 2]], 'pitches, start beats and held lengths are captured');
  await page.click('[data-act=ptakekeep]');
  await page.click('#roll svg rect.rn[data-i="0"]');
  await page.focus('#roll'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Shift+ArrowRight');
  const after = await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return P.melodies.Verse.notes[0]; });
  assert.deepEqual([after.m, after.t, after.d], [68, 0, 1.5]);
  await page.keyboard.press('Delete');
  assert.equal(await page.evaluate(() => { const g = window.__gpa; return g.S().songs[g.S().songs.length - 1].melodies.Verse.notes.length; }), 2);
  assert.deepEqual(errors, []);
});

test('song lab: older projects open unchanged in the studio', async () => {
  const { page, errors } = await open();
  const r = await page.evaluate(() => {
    const g = window.__gpa; g.S().profile.onboarded = true;
    g.S().songs.push({ id: 'pold1', title: 'Old', key: 'C', degs: [1, 5, 6, 4], sev: false, style: 'groove', bpm: 80, beat: 'none', swing: 0, melody: { notes: [{ m: 64, t: 0, d: 1 }] }, lyrics: { chorus: 'x', verse: '', bridge: '' }, structure: ['Verse', 'Chorus'], steps: { prog: true, melody: true, chorus: true, song: false }, done: false, created: 1 });
    g.go('song', { pid: 'pold1' });
    const P = g.S().songs.find(s => s.id === 'pold1');
    return { verse: P.sections.Verse.degs, chorus: P.sections.Chorus.degs, mel: P.melodies.Chorus.notes.length, ts: P.ts, bass: P.bassStyle };
  });
  assert.deepEqual(r, { verse: [1, 5, 6, 4], chorus: [1, 5, 6, 4], mel: 1, ts: 4, bass: 'rootfifth' });
  assert.deepEqual(errors, []);
});
