// Unit tests: run with `npm test` (Node 20+, no extra packages needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const js = f => path.join(__dirname, '..', 'app', 'js', f);

const Engine = require(js('engine.js'));
globalThis.Engine = Engine;                      // the curriculum reads the engine from the global object
const Curriculum = require(js('curriculum.js'));
const Sanitize = require(js('sanitize.js'));
globalThis.Sanitize = Sanitize;
const Backup = require(js('backup.js'));
const ctx = { keys: Engine.ROOT_NAMES, styles: Object.keys(Engine.STYLES), beats: Object.keys(Engine.BEATS), earTypes: Object.keys(Engine.EAR_TYPES) };

test('engine: note names and midi numbers', () => {
  assert.equal(Engine.midiOf('C4'), 60);
  assert.equal(Engine.midiOf('A4'), 69);
  assert.equal(Engine.midiName(61), 'Db4');
  assert.equal(Engine.midiName(61, true), 'C#4');
  assert.equal(Engine.isBlack(61), true);
  assert.equal(Engine.isBlack(60), false);
});

test('engine: spelling and scales', () => {
  assert.deepEqual(Engine.scaleNotes('C', 'major'), ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  assert.deepEqual(Engine.scaleNotes('F', 'major'), ['F', 'G', 'A', 'Bb', 'C', 'D', 'E']);
  assert.deepEqual(Engine.scaleNotes('D', 'major'), ['D', 'E', 'F#', 'G', 'A', 'B', 'C#']);
});

test('engine: chord recognition', () => {
  const c = Engine.identifyChord([60, 64, 67]);
  assert.ok(c && /^C/.test(c.name), 'C E G is a C chord');
  const am = Engine.identifyChord([57, 60, 64]);
  assert.ok(am && /^Am/.test(am.name), 'A C E is A minor');
  const inv = Engine.identifyChord([64, 67, 72]);
  assert.ok(inv && inv.inversion > 0, 'E G C is an inversion');
});

test('engine: diatonic chords of C', () => {
  const names = Engine.diatonic('C', false).map(c => c.name);
  assert.deepEqual(names.slice(0, 6), ['C', 'Dm', 'Em', 'F', 'G', 'Am']);
});

test('engine: ranks grow with XP', () => {
  const a = Engine.rankFor(0), b = Engine.rankFor(100000);
  assert.equal(a.level, 1);
  assert.ok(b.level > a.level);
});

test('curriculum: built-in content check passes', () => {
  const problems = Curriculum.validate(Engine);
  assert.deepEqual(problems, []);
});

test('curriculum: every prerequisite exists and comes earlier', () => {
  const ids = new Set(Curriculum.LESSONS.map(l => l.id));
  assert.equal(ids.size, Curriculum.LESSONS.length, 'lesson ids are unique');
  for (const L of Curriculum.LESSONS) for (const r of (L.req || [])) assert.ok(ids.has(r), L.id + ' requires missing ' + r);
});

test('sanitize: markup in a song id is replaced with a safe id', () => {
  const st = Sanitize.cleanState({ songs: [{ id: 'x"><img src=z onerror=alert(1)>', title: 'Hi', key: 'C', degs: [1, 5, 6, 4] }] }, ctx);
  assert.equal(st.songs.length, 1);
  assert.match(st.songs[0].id, Sanitize.SONG_ID_RE);
  assert.ok(!/[<>"]/.test(st.songs[0].id));
});

test('sanitize: song fields are forced to valid values', () => {
  const [p] = Sanitize.cleanState({ songs: [{ id: 'pabc', key: '<b>', bpm: '<i>9000</i>', style: 'nope', beat: 1, degs: [1, 9, 'x', 4], structure: ['Verse', '<script>'], steps: { prog: 'yes' }, melody: { notes: [{ t: 0, d: 1, m: 999 }] } }] }, ctx).songs;
  assert.equal(p.id, 'pabc');
  assert.equal(p.key, 'C');
  assert.equal(p.bpm, 80);
  assert.ok(ctx.styles.includes(p.style));
  assert.equal(p.beat, 'none');
  assert.deepEqual(p.degs, [1, 4]);
  assert.deepEqual(p.structure, ['Verse']);
  assert.equal(p.steps.prog, false);
  assert.equal(p.melody.notes[0].m, 108);
});

test('sanitize: duplicate song ids are made unique', () => {
  const st = Sanitize.cleanState({ songs: [{ id: 'pa' }, { id: 'pa' }] }, ctx);
  assert.notEqual(st.songs[0].id, st.songs[1].id);
});

test('sanitize: bad keys, prototype keys and unknown top-level keys are dropped', () => {
  const raw = JSON.parse('{"lessons":{"ok-id":{"status":"done"},"<img>":{"status":"done"},"__proto__":{"x":1}},"evil":{"a":1},"xp":"100"}');
  const st = Sanitize.cleanState(raw, ctx);
  assert.deepEqual(Object.keys(st.lessons), ['ok-id']);
  assert.equal(st.evil, undefined);
  assert.equal(st.xp, 0, 'a string XP is not accepted');
  assert.equal(({}).x, undefined, 'no prototype pollution');
});

test('sanitize: unknown ear-training types are dropped and preferences checked', () => {
  const st = Sanitize.cleanState({ ear: { note: { correct: 3, total: 4 }, '<x>': { total: 9 }, madeup: { total: 9 } }, prefs: { dailyMin: 7, theme: 'neon', textSize: 400, speed: 'slow' } }, ctx);
  assert.deepEqual(Object.keys(st.ear), Object.keys(Engine.EAR_TYPES).includes('note') ? ['note'] : []);
  assert.equal(st.prefs.dailyMin, undefined);
  assert.equal(st.prefs.theme, undefined);
  assert.equal(st.prefs.textSize, 150);
  assert.equal(st.prefs.speed, 'slow');
});

test('backup: rejects files that are not backups', () => {
  assert.equal(Backup.parse('', ctx).ok, false);
  assert.equal(Backup.parse('not json', ctx).ok, false);
  assert.equal(Backup.parse('{"hello":1}', ctx).ok, false);
  assert.equal(Backup.parse(JSON.stringify({ app: 'gospel-music-academy', state: { v: 9, lessons: {}, profile: {} } }), ctx).ok, false);
  assert.equal(Backup.parse(JSON.stringify({ app: 'gospel-music-academy', state: { lessons: [], profile: {} } }), ctx).ok, false);
});

test('backup: accepts old and new app names and cleans the state', () => {
  for (const app of ['gospel-piano-academy', 'gospel-music-academy']) {
    const r = Backup.parse(JSON.stringify({ app, format: 1, state: { v: 1, xp: 120, profile: { name: 'Ama', goals: [] }, lessons: { a: { status: 'done' } }, songs: [{ id: 'x"><b>', title: 'Song' }] } }), ctx);
    assert.equal(r.ok, true);
    assert.equal(r.summary.xp, 120);
    assert.equal(r.summary.done, 1);
    assert.match(r.state.songs[0].id, Sanitize.SONG_ID_RE);
  }
});

test('backup: the hostile fixture is neutralised', () => {
  const text = require('fs').readFileSync(path.join(__dirname, 'fixtures', 'hostile-backup.json'), 'utf8');
  const r = Backup.parse(text, ctx);
  assert.equal(r.ok, true);
  const out = JSON.stringify(r.state);
  assert.ok(!/<img|<script|onerror/i.test(out.replace(/"title":"[^"]*"|"name":"[^"]*"|"(chorus|verse|bridge)":"[^"]*"/g, '')), 'markup only survives in free-text fields, which are always escaped');
});

test('engine: spelled scales always rise, including C♭ and B♯', () => {
  for (const k of ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']) {
    const m = Engine.scaleTokens(k, 'major', 4).map(Engine.midiOf);
    assert.ok(m.every((x, i) => i === 0 || x > m[i - 1]), k + ' major rises');
  }
  assert.deepEqual(Engine.scaleTokens('Gb', 'major', 4).slice(3, 4), ['Cb5']);
});

test('curriculum: Level 4 and Level 5 exist, in order, and every challenge there is a timed performance test', () => {
  const ids = Curriculum.LEVELS.map(l => l.id);
  assert.ok(ids.indexOf('A') > ids.indexOf('H') && ids.indexOf('M') === ids.length - 1);
  const adv = Curriculum.LESSONS.filter(l => l.level === 'A' || l.level === 'M');
  assert.ok(adv.length >= 25);
  adv.forEach(l => assert.equal(l.challenge.type, 'perf', l.id + ' challenge should be a performance test'));
});
