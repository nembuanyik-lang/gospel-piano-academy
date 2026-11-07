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

test('every chord, performance and note exercise fits on the drawn keyboard, and every lesson diagram shows all its keys', async () => {
  const { page, errors } = await open();
  await onboard(page);
  const bad = await page.evaluate(() => {
    const g = window.__gpa, out = [];
    const host = document.createElement('div'); document.body.appendChild(host);
    for (const L of window.Curriculum.LESSONS) {
      const exs = [].concat(L.practice || [], L.challenge ? [L.challenge] : []).map(x => x.ex || x).filter(x => x && ['chord', 'perf', 'seq', 'kbd'].includes(x.type));
      for (const ex of exs) {
        const api = g.mountExercise(host, ex, { hints: true });
        const keys = new Set([...host.querySelectorAll('.ex-piano [data-m]')].map(k => +k.dataset.m));
        const lo0 = ex.range ? ex.range[0] : 60;
        const need = exerciseMidis(ex, Math.min(lo0, Math.min.apply(null, [...keys])));
        const miss = need.filter(m => !keys.has(m));
        if (miss.length) out.push(L.id + ' ' + ex.type + ' misses ' + miss.join(','));
        const lit = host.querySelectorAll('.ex-piano .hint').length;
        if (ex.type === 'chord' && !lit) out.push(L.id + ' chord shows no hint');
        api.destroy();
      }
      if (L.visual && L.visual.steps) {
        const api = mountVisual(host, L);
        const keys = new Set([...host.querySelectorAll('.vpiano [data-m]')].map(k => +k.dataset.m));
        L.visual.steps.forEach((st, i) => {
          const ms = st.chord ? chordHint({ root: st.chord.root, quality: st.chord.quality, inv: st.chord.inv || 0 }, Math.min.apply(null, [...keys])).midis : (st.hi || []).map(t => E.parseToken(t).midi).filter(m => m !== undefined);
          const miss = ms.filter(m => !keys.has(m)); if (miss.length) out.push(L.id + ' diagram step ' + (i + 1) + ' misses ' + miss.join(','));
        });
        if (api && api.destroy) api.destroy();
      }
    }
    host.remove(); return out;
  });
  assert.deepEqual(bad, []);
  assert.deepEqual(errors, []);
});

test('every piano lesson has a 20-minute routine at the piano, and finishing it is saved and shown on Home', async () => {
  const { page, errors } = await open();
  await onboard(page);
  const info = await page.evaluate(() => {
    const ids = window.Curriculum.LESSONS.map(L => L.id);
    return { missing: ids.filter(id => !pianoRoutine(id)), wrong: ids.filter(id => routineMinutes(window.__gpa.C.byId[id]) !== 20) };
  });
  assert.deepEqual(info.missing, []); assert.deepEqual(info.wrong, []);
  const first = await page.evaluate(() => nextLesson());
  await page.waitForSelector('[data-act=openroutine]');
  await page.click('[data-act=openroutine]');
  await page.waitForSelector('.routine #rtgo');
  assert.match(await page.textContent('.steplabel'), /At your piano/);
  assert.equal(await page.$$eval('.rt-blocks li', l => l.length), 6);
  await page.click('#rtgo');
  assert.match(await page.textContent('#rtstate'), /Block 1 of 6/);
  for (let i = 0; i < 5; i++) await page.click('#rtnext');
  assert.match(await page.textContent('#rtstate'), /Block 6 of 6/);
  // the last block ends: fast-forward its clock
  await page.evaluate(() => { RT.endAt = Date.now() - 1; });
  await page.waitForFunction(id => window.__gpa.S().routines[id] && window.__gpa.S().routines[id].n === 1, first, { timeout: 5000 });
  assert.equal(await page.evaluate(() => window.__gpa.S().today.items.piano), true);
  await page.waitForSelector('.routine .tag.ok');
  // logging by hand counts too, and survives the backup cleaner
  await page.click('#rtlog');
  const kept = await page.evaluate(id => { const st = JSON.parse(JSON.stringify(window.__gpa.S())); st.routines['<bad>'] = { n: 5 }; st.routines[id].n = 'x'; return window.Sanitize.cleanState(st, {}).routines; }, first);
  assert.equal(kept['<bad>'], undefined); assert.equal(kept[first].n, 0);
  assert.deepEqual(errors, []);
});

test('Level 0 (Yamaha YPT-240): the app hears voice changes, left-hand chords, style start and stop, the pedal and tempo', async () => {
  const { page, errors } = await open();
  await onboard(page);
  const r = await page.evaluate(async () => {
    const g = window.__gpa, C = g.C, out = {};
    out.first = C.order[0]; out.next = nextLesson(); out.level1Open = isUnlocked('keyboard-layout');
    out.levels = C.LEVELS.map(l => l.id).slice(0, 2);
    Midi.status = 'ready';
    const send = (...b) => Midi.handle({ data: b });
    const host = document.createElement('div'); document.body.appendChild(host);
    const wait = ms => new Promise(res => setTimeout(res, ms));
    const run = (ex) => new Promise(res => { const api = g.mountExercise(host, ex, { hints: true, onDone: r2 => res({ api, r: r2 }) }); out.api = api; });
    const clickSelf = () => { const b = host.querySelector('[data-kbd=self]'); if (b) b.click(); };
    const chord = async (...ms) => { ms.forEach(m => send(0x90, m, 100)); await wait(30); ms.forEach(m => send(0x80, m, 0)); await wait(30); };

    // 1. voice families: a wrong family is explained, the right ones pass
    let p = run(C.byId['k-voices'].challenge);
    send(0xB0, 0, 0); send(0xB0, 32, 0); send(0xC0, 24); await wait(20);
    out.wrongFamilyMsg = host.querySelector('.ex-fb').textContent;
    send(0xC0, 19); send(0xC0, 48); send(0xC0, 52); send(0xC0, 0);
    let res = await p; out.voices = res.r; res.api.destroy();

    // 2. ACMP: self step, left-hand chord starts the style (start arrives with the chord), changes, stop
    p = run(C.byId['k-acmp'].play);
    clickSelf(); await wait(10);
    send(0x90, 36, 100); send(0x90, 40, 100); send(0x90, 43, 100); send(0xFA); await wait(40); [36, 40, 43].forEach(m => send(0x80, m, 0));
    await wait(40);
    out.acmpAfterStart = host.querySelectorAll('.kbd-tasks li.ok').length;
    await chord(41, 45, 48); await chord(43, 47, 50); await chord(36, 40, 43);
    send(0xFC);
    res = await p; out.acmp = res.r; res.api.destroy();

    // 3. legato pedalling: chord, then pedal up and down shortly after
    p = run(C.byId['k-pedal'].challenge);
    for (let i = 0; i < 6; i++) { send(0x90, 60 + i, 100); await wait(60); send(0xB0, 64, 0); await wait(80); send(0xB0, 64, 127); await wait(60); send(0x80, 60 + i, 0); }
    res = await p; out.legato = res.r; res.api.destroy();
    p = run({ type: 'kbd', prompt: 'l', tasks: [{ k: 'legato', text: 'two changes', n: 2 }] });
    send(0xB0, 64, 0); await wait(20);                                                                         // start with the pedal up
    send(0x90, 60, 100); await wait(50); send(0xB0, 64, 127); await wait(50); send(0x80, 60, 0);            // first catch
    send(0xB0, 64, 0); await wait(50); send(0x90, 65, 100); await wait(50); send(0xB0, 64, 127); await wait(30); // lifted too early
    out.earlyLiftMsg = host.querySelector('.ex-fb').textContent;
    send(0x90, 67, 100); await wait(50); send(0xB0, 64, 0); await wait(60); send(0xB0, 64, 127);              // clean
    res = await p; out.legato2 = res.r; res.api.destroy();

    // 4. tempo from the keyboard's clock (24 ticks per beat at 72 BPM)
    const ex4 = { type: 'kbd', prompt: 't', tasks: [{ k: 'tempo', text: 'Play on each click', bpm: 72, tol: 2 }] };
    p = run(ex4);
    const per = 60000 / 72 / 24, now = performance.now(); Midi.clocks = []; for (let i = 0; i < 40; i++) Midi.clocks.push(now - (39 - i) * per);
    res = await p; out.clockTempo = res.r; out.clockBpm = Midi.clockBpm(); res.api.destroy();

    // 5. with no keyboard connected, a listening step can be ticked by hand and is reported as not checked
    Midi.status = 'idle';
    p = run({ type: 'kbd', prompt: 'x', tasks: [{ k: 'voice', text: 'Change voice' }] });
    await wait(10); out.connectBtn = !!host.querySelector('[data-act=midiconnect]'); clickSelf();
    res = await p; out.offline = res.r; out.offlineMsg = host.querySelector('.ex-fb').textContent; res.api.destroy();
    host.remove();
    return out;
  });
  assert.equal(r.first, 'k-setup'); assert.equal(r.next, 'k-setup'); assert.equal(r.level1Open, true);
  assert.deepEqual(r.levels, ['0', '1']);
  assert.match(r.wrongFamilyMsg, /guitar sound/);
  assert.equal(r.voices.success, true); assert.equal(r.voices.accuracy, 100);
  assert.ok(r.acmpAfterStart >= 3, 'the chord and the style start that came with it are both ticked');
  assert.equal(r.acmp.success, true);
  assert.equal(r.legato.success, true);
  assert.match(r.earlyLiftMsg, /came up before the new chord/); assert.equal(r.legato2.success, true);
  assert.equal(r.clockBpm, 72); assert.equal(r.clockTempo.success, true);
  assert.equal(r.connectBtn, true); assert.equal(r.offline.accuracy, 0); assert.match(r.offlineMsg, /ticked by you/);
  assert.deepEqual(errors, []);
});

test('2.5.0 with a keyboard: routines listen, My keyboard adapts them, chords are played into the Song Lab, and the song plays through the keyboard', async () => {
  const { page, errors } = await open();
  await onboard(page);
  const r = await page.evaluate(async () => {
    const g = window.__gpa, S = g.S(), out = {}, wait = ms => new Promise(res => setTimeout(res, ms));
    const sent = [];
    const fakeOut = { name: 'Digital Keyboard', send: (d, at) => sent.push({ d: Array.from(d), at: at || 0 }) };
    Midi.access = { outputs: new Map([['o1', fakeOut]]), inputs: new Map() }; Midi.names = ['Digital Keyboard']; Midi.status = 'ready';
    const send = (...b) => Midi.handle({ data: b });

    // 2. My keyboard: the YPT-240 note appears in routines that ask for soft and loud playing; keyboard-only sound
    S.prefs.keyboard = 'ypt240';
    out.adapted = routineBlocks(g.C.byId['first-melody']).some(b => /every key plays at the same loudness/.test(b[2]));
    out.notAdaptedAloud = !routineBlocks(g.C.byId['musical-alphabet']).some(b => /same loudness/.test(b[2]));
    S.prefs.midiSound = 'keyboard';
    let calls = 0; const orig = Snd.noteOn; Snd.noteOn = (...a) => { calls++; return orig.apply(Snd, a); };
    send(0x90, 60, 100); send(0x80, 60, 0); out.keyboardOnlyCalls = calls;
    S.prefs.midiSound = 'both'; send(0x90, 62, 100); send(0x80, 62, 0); out.bothCalls = calls; Snd.noteOn = orig;

    // 1. the routine listens: tempo from the block, timing against the metronome, the +5 ladder, the session log
    g.ACTIONS.openroutine({ dataset: { id: 'keyboard-layout' } }); await wait(50);
    document.querySelector('#rtgo').click(); await wait(20);
    out.warmBpm = +document.querySelector('#rtbpm').value;
    document.querySelector('#rtmet').click(); await wait(20);
    const m = RT.met;
    for (let k = 0; k < 30; k++) rtHear({ midi: 60 + (k % 5), t: performance.now() + k * 10, ctx: m.t0 + k * m.spb + 0.01 });
    for (let k = 0; k < 2; k++) rtHear({ midi: 60, t: performance.now(), ctx: m.t0 + (40 + k) * m.spb + m.spb * 0.25 });
    rtHeld.clear();                         // (real keys are released between notes)
    [60, 64, 67].forEach(n => rtHear({ midi: n, t: performance.now(), ctx: m.t0 + 50 * m.spb }));
    render(); render();                         // redraws must not stop the routine listening
    const n0 = rtCur().notes; send(0x90, 72, 100); send(0x80, 72, 0); out.heardAfterRedraw = rtCur().notes === n0 + 1;
    await wait(400);
    out.listen = document.querySelector('#rtlisten').textContent;
    out.upVisible = !document.querySelector('#rtup').hidden;
    document.querySelector('#rtup').click(); await wait(20);
    out.bpmAfterUp = +document.querySelector('#rtbpm').value;
    for (let i = 0; i < 6; i++) { document.querySelector('#rtnext').click(); await wait(20); }
    const log = S.routines['keyboard-layout'];
    out.log = log ? { n: log.n, lastTiming: log.lastTiming, hasPlayed: log.lastPlayed != null } : null;

    // 3. chords played in from the keyboard go into the Song Lab section as chord numbers
    g.go('song'); g.ACTIONS.slnew(); await wait(50);
    const P = S.songs[0]; P.key = 'C'; g.go('song', { pid: P.id }); await wait(50);
    out.playThrough = !!document.querySelector('[data-bind=pkbdout]');
    const before = P.sections[pst().sec].degs.length;
    document.querySelector('#pkbin').click(); await wait(50);
    const chord = async (...ms) => { ms.forEach(n => send(0x90, n, 100)); await wait(20); ms.forEach(n => send(0x80, n, 0)); await wait(60); };
    await chord(65, 69, 72);                 // F major: chord 4 in C
    await chord(57, 60, 64);                 // A minor: chord 6
    await chord(63, 67, 70);                 // E flat major: not in C
    out.notInKey = document.querySelector('#pkbinfo').textContent;
    out.added = S.songs[0].sections[pst().sec].degs.slice(before);

    // 4. the song plays through the keyboard: program change, chords on channel 2, bass on 3, then silence on stop
    S.prefs.kbdOut = { on: true, prog: 19 };
    g.go('song', { pid: P.id }); await wait(50);
    sent.length = 0;
    document.querySelector('#songplay').click(); await wait(700);
    out.prog = sent.some(x => x.d[0] === 0xC1 && x.d[1] === 19);
    out.chordNotes = sent.filter(x => x.d[0] === 0x91 && x.d[2] > 0).length;
    out.bassNotes = sent.filter(x => x.d[0] === 0x92 && x.d[2] > 0).length;
    out.timestamped = sent.filter(x => x.d[0] === 0x91).every(x => x.at > 0);
    document.querySelector('#songplay').click(); await wait(50);
    out.silenced = [0xB1, 0xB2, 0xB3, 0xB9].every(st => sent.some(x => x.d[0] === st && x.d[1] === 123));
    sent.length = 0; out.test = MidiOut.test(48); out.testNotes = sent.filter(x => (x.d[0] & 0xF0) === 0x90).length;
    return out;
  });
  assert.equal(r.adapted, true); assert.equal(r.notAdaptedAloud, true);
  assert.equal(r.keyboardOnlyCalls, 0); assert.equal(r.bothCalls, 1);
  assert.equal(r.warmBpm, 60);
  assert.match(r.listen, /Listening · \d+ notes/); assert.match(r.listen, /last chord C/); assert.match(r.listen, /% in time at 60 BPM/);
  assert.equal(r.heardAfterRedraw, true);
  assert.equal(r.upVisible, true); assert.equal(r.bpmAfterUp, 65);
  assert.ok(r.log && r.log.n === 1 && r.log.hasPlayed && r.log.lastTiming >= 80, JSON.stringify(r.log));
  assert.equal(r.playThrough, true);
  assert.deepEqual(r.added, [4, 6]); assert.match(r.notInKey, /not one of the seven chords/);
  assert.equal(r.prog, true); assert.ok(r.chordNotes > 0 && r.bassNotes > 0, JSON.stringify(r)); assert.equal(r.timestamped, true);
  assert.equal(r.silenced, true); assert.equal(r.test, true); assert.equal(r.testNotes, 4);
  assert.deepEqual(errors, []);
});
