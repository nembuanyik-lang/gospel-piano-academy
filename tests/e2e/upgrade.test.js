// Upgrading: backups made by earlier versions (2.0 one-progression songs, 2.7 sections and a guide track kept under
// the song id, older prefs) restored through Profile > Your data, then every song opened, played and exported. And a
// round trip: a 2.9 backup with all the new song fields comes back exactly.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const serve = require('./serve');

const PORT = 8811;
let srv, browser;
test.before(async () => { srv = serve(path.join(__dirname, '..', '..', 'app'), PORT); browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); });
test.after(async () => { await browser.close(); srv.close(); });
async function open() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:' + PORT + '/');
  return { page, errors };
}
const OLD = {
  app: 'gospel-piano-academy', format: 1, exportedAt: '2026-08-01T10:00:00Z',
  state: {
    v: 1, updated: 1754000000000, xp: 1240,
    profile: { name: 'Minister Kemamah', goals: ['worship'], onboarded: true },
    lessons: { 'k-setup': { status: 'done', best: 92 } },
    prefs: { names: true, sound: true, instrument: 'organ', latencyMs: 35, midiSound: 'both' },
    practice: { total: 7200, days: { '2026-07-30': 1800 } },
    songs: [
      // 2.0: one progression, one melody
      { id: 'pold1', title: 'Old hymn', key: 'G', degs: [1, 5, 6, 4], sev: false, style: 'groove', bpm: 90, beat: 'ballad', swing: 0,
        melody: { notes: [{ m: 67, t: 0, d: 2 }, { m: 71, t: 2, d: 2 }] }, lyrics: { chorus: 'Great is Thy faithfulness', verse: '', bridge: '' }, steps: { prog: true } },
      // 2.7: sections with chord numbers, a structure list, a guide track stored under the song id, 3/4 time
      { id: 'pv27', v: 2, title: 'Waltz of praise', key: 'Eb', ts: 3, sev: true, style: 'pulse', bassStyle: 'rootfifth', bpm: 120, beat: 'meter', degs: [1, 4],
        sections: { Intro: { degs: [1], len: 1 }, Verse: { degs: [1, 4, 5, 1], len: 1 }, Chorus: { degs: [4, 5, 3, 6], len: 2 }, Bridge: { degs: [2, 5], len: 1 }, Outro: { degs: [1], len: 2 }, 'Pre-chorus': { degs: [4], len: 1 } },
        structure: ['Intro', 'Verse', 'Chorus', 'Chorus'], melodies: { Chorus: { notes: [{ m: 70, t: 0, d: 3 }] } }, lyrics: { chorus: 'Praise Him', verse: 'In the morning', bridge: '' },
        guide: { at: 1753000000000, dur: 4, gain: 0.9, nudgeMs: 20 }, steps: { prog: true, mel: true } }
    ]
  }
};

test('backups from 2.0 and 2.7 restore, and every old song opens, plays and exports in 2.9', async () => {
  const { page, errors } = await open();
  // the 2.7 guide recording, where 2.7 kept it: in IndexedDB under the song id
  await page.evaluate(async () => {
    const c = window.__gpa.Snd.ensure(), b = c.createBuffer(1, 44100 * 4, 44100), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = 0.4 * Math.sin(2 * Math.PI * 311 * i / 44100);
    await GuideStore.put('pv27', new Blob([encodeWav(b, 16)], { type: 'audio/wav' }));
  });
  // a fresh install: the welcome screen offers the restore
  await page.click('[data-act=obrestore]');
  await page.setInputFiles('#pimportfile', { name: 'old-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(OLD)) });
  await page.click('[data-act=pimportapply]');
  await page.waitForFunction(() => window.__gpa.S().songs.length === 2);
  const st = await page.evaluate(() => { const S = window.__gpa.S(); return { name: S.profile.name, xp: S.xp, lesson: S.lessons['k-setup'] && S.lessons['k-setup'].status, inst: S.prefs.instrument }; });
  assert.deepEqual(st, { name: 'Minister Kemamah', xp: 1240, lesson: 'done', inst: 'organ' });
  for (const pid of ['pold1', 'pv27']) {
    await page.evaluate(id => window.__gpa.go('song', { pid: id }), pid);
    await page.waitForSelector('.cstrip');
    const r = await page.evaluate(async id => {
      const P = window.__gpa.S().songs.find(x => x.id === id), A = arrangeSong(P);
      return { chorus: P.sections.Chorus.chords.map(c => Songcraft.describe(P.key, c).name + ':' + c.beats), form: A.timeline.map(t => t.label), notes: P.melodies.Chorus ? P.melodies.Chorus.notes.length : 0,
        guide: P.guide ? (await GuideStore.buffer(P, { raw: true })).duration : null, tracks: recordedTracks(P).map(r => r.name), lead: leadSheetHtml(P).length > 1000, chart: /KEY|%|–/.test(chartHtml(P, 'numbers')) };
    }, pid);
    if (pid === 'pold1') { assert.deepEqual(r.chorus, ['G:4', 'D:4', 'Em:4', 'C:4']); assert.deepEqual(r.form, ['Chorus']); assert.equal(r.notes, 2); assert.equal(r.guide, null); }
    else {
      assert.deepEqual(r.chorus, ['A♭maj7:6', 'B♭7:6', 'Gm7:6', 'Cm7:6'], 'two bars of 3/4 each, sevenths as in 2.7');
      assert.deepEqual(r.form, ['Intro', 'Verse', 'Chorus', 'Chorus']);
      assert.ok(Math.abs(r.guide - 4) < 0.05, 'the 2.7 guide recording still plays: ' + r.guide); assert.deepEqual(r.tracks, ['Lead vocal (guide)']);
    }
    assert.ok(r.lead && r.chart);
    await page.click('#songplay'); await page.waitForTimeout(800); await page.click('#songplay');
    const [m] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=pmidi]')]);
    assert.equal(fs.readFileSync(await m.path()).toString('latin1', 0, 4), 'MThd');
  }
  assert.deepEqual(errors, []);
});

test('a 2.9 backup with the new song fields comes back exactly', async () => {
  const { page, errors } = await open();
  const before = await page.evaluate(() => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1];
    Object.assign(P, { title: 'New song', ending: 'ritard', master: { target: 'loud' }, info: { writers: 'Minister Kemamah', year: '2026', ccli: '1234567' }, choir: { on: true },
      mixer: { chords: { v: 0.7, pan: -0.2, mute: false, solo: false }, drums: { v: 1, pan: 0, mute: true, solo: false } }, words: { Chorus: 'Ho-ly' } });
    P.sections.Chorus.chords = [{ r: 5, q: 'major', b: 7, beats: 4, push: true }, { r: 4, q: '7#9', b: null, beats: 2, push: false }];
    P.form = [{ s: 'Chorus', x: 2, up: 2, tag: 1, stop: true, fill: true, swell: true, en: 'full', vamp: false, lead: true }]; P.structure = ['Chorus'];
    P.tracks = [{ id: 'abc1', name: 'Alto', kind: 'vocal', takes: [{ k: P.id + ':tabc1:1', at: 1, dur: 30, n: 1 }], main: 0, comp: { 0: 0 }, fx: { preset: 'choir', nr: 'light', reverb: true }, gain: 0.8, pan: -0.4, mute: false, solo: false, nudgeMs: 10 }];
    P.loops = [{ id: 'lab1', name: 'Keys', kind: 'loop', role: 'music', bpm: 92, beats: 8, dur: 5, tr: 3, gain: 0.9, mute: false, secs: ['Chorus'], offset: 0, keyPc: 7, minor: false }];
    window.__gpa.S().gear = { level: 3, total: 40, correct: 33, best: 3, hist: [1, 0, 1], last: '2026-11-07' }; window.__gpa.S().licks = { tt251: { bpm: 64, keys: ['C', 'F'], best: 100, n: 5 } };
    return JSON.stringify({ P, gear: window.__gpa.S().gear, licks: window.__gpa.S().licks });
  });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => exportProgress())]);
  const text = fs.readFileSync(await dl.path(), 'utf8');
  await page.evaluate(() => window.__gpa.go('profile', { tab: 'data' }));
  await page.setInputFiles('#pimportfile', { name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await page.click('[data-act=pimportapply]');
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => { const S = window.__gpa.S(); return JSON.stringify({ P: S.songs[S.songs.length - 1], gear: S.gear, licks: S.licks }); });
  const b = JSON.parse(before), a = JSON.parse(after);
  for (const k of ['title', 'ending', 'master', 'info', 'choir', 'words', 'form', 'loops']) assert.deepEqual(a.P[k], b.P[k], k);
  assert.deepEqual(a.P.sections.Chorus.chords, b.P.sections.Chorus.chords);
  assert.deepEqual(a.P.tracks[0].takes, b.P.tracks[0].takes); assert.equal(a.P.tracks[0].pan, -0.4); assert.equal(a.P.tracks[0].fx.preset, 'choir');
  assert.equal(a.P.mixer.chords.v, 0.7); assert.equal(a.P.mixer.drums.mute, true);
  assert.deepEqual(a.gear, b.gear); assert.deepEqual(a.licks, b.licks);
  assert.deepEqual(errors, []);
});
