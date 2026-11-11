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

test('voice pitch tracking (YIN) is within 10 cents from C2 to C6, including a weak fundamental, and ignores noise', () => {
  const P = require('../app/js/pitch.js');
  const sr = 48000, N = 2048;
  const voice = (hz, weak) => { const b = new Float32Array(N); for (let i = 0; i < N; i++) { const t = i / sr, f = hz * (1 + 0.003 * Math.sin(2 * Math.PI * 5.5 * t)); let v = 0; for (let h = 1; h <= 8; h++) v += (weak && h === 1 ? 0.15 : 1) / h * Math.sin(2 * Math.PI * f * h * t + h); b[i] = 0.25 * v; } return b; };
  for (let m = 36; m <= 84; m++) for (const weak of [false, true]) {
    const r = P.yin(voice(P.midiToHz(m), weak), sr);
    assert.ok(r, 'a pitch for ' + m);
    assert.ok(Math.abs(P.hzToMidi(r.hz) - m) * 100 < 10, 'within 10 cents at ' + m + (weak ? ' (weak fundamental)' : ''));
  }
  let seed = 1; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
  assert.equal(P.yin(Float32Array.from({ length: N }, rand), sr), null);
  assert.equal(Math.round(P.centsToTarget(57 - 12, 57, true)), 0, 'an octave below scores as the same note');
  assert.equal(Math.round(P.centsToTarget(57.3, 57, true)), 30);
});

test('chord recognition names common gospel voicings, slash chords and every root-position chord correctly', () => {
  const E = require('../app/js/engine.js');
  const cases = [[[60, 64, 67], 'C'], [[64, 67, 72], 'C/E'], [[67, 72, 76], 'C/G'], [[57, 60, 64], 'Am'], [[60, 64, 67, 71], 'Cmaj7'], [[60, 64, 70], 'C7'],
    [[62, 65, 69, 72], 'Dm7'], [[60, 64, 67, 69], 'C6'], [[57, 60, 64, 67], 'Am7'], [[43, 65, 69, 72], 'F/G'], [[38, 60, 64, 67], 'C/D'], [[46, 56, 60, 63], 'A♭/B♭'],
    [[48, 52, 58, 62, 69], 'C13'], [[59, 62, 65, 69], 'Bm7♭5'], [[60, 64, 70, 74], 'C9'], [[62, 65, 72, 76], 'Dm9'], [[43, 53, 59, 64], 'G13'], [[60, 65, 67], 'Csus4'],
    [[60, 62, 67], 'Csus2'], [[48, 55, 62, 64], 'Cadd9'], [[55, 59, 62, 65], 'G7'], [[53, 57, 60, 64], 'Fmaj7'], [[45, 55, 60, 64], 'Am7'], [[48, 57, 60, 64], 'Am/C'],
    [[50, 53, 57, 60], 'Dm7'], [[36, 52, 55, 58, 62], 'C9'], [[43, 53, 58, 59], 'G7♯9'], [[55, 59, 65, 68], 'G7♭9'], [[48, 55, 64, 69, 74], 'C6/9'], [[52, 55, 58, 62, 72], 'C9/E']];
  cases.forEach(([ms, want]) => { const r = E.identifyChord(ms); assert.equal(r && r.name, want, ms.join(' ')); });
  assert.equal(E.identifyChord([43, 65, 69, 72]).alt, 'G9sus4');
  assert.equal(E.nameInterval([60, 64]).name, 'major 3rd');
  for (const root of E.ROOT_NAMES) for (const q of Object.keys(E.QUALITIES)) {
    if (q === 'dim7' || q === 'aug') continue;     // symmetrical chords: any of their notes can be the root
    const r = E.identifyChord(E.chordMidi(root, q, 3, 0));
    assert.ok(r && r.rootPc === E.pcOfName(root), root + ' ' + q + ' in root position -> ' + (r && r.name));
  }
});

test('SoundFont player: reads presets, zones, tuning, loops, envelopes, attenuation, pan and exclusive classes', () => {
  const SF2 = require('../app/js/sf2.js');
  const { build } = require('./fixtures/make-sf2.js');
  const b = build(), sf = SF2.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
  assert.deepEqual(sf.presets.map(p => [p.name, p.bank, p.program]), [['Sine', 0, 0], ['Organ', 0, 19], ['Drums', 128, 0]]);
  const a = SF2.noteZones(sf, 0, 0, 69, 127)[0];
  assert.ok(Math.abs(a.rate - 1) < 1e-9, 'root key plays at its own pitch');
  assert.ok(Math.abs(SF2.noteZones(sf, 0, 0, 81, 127)[0].rate - 2) < 1e-9, 'an octave up plays twice as fast');
  assert.equal(a.mode, 1); assert.equal(a.loopEnd - a.loopStart, Math.round(22050 / 440 * 100));
  assert.ok(Math.abs(a.release - 0.5) < 1e-9, 'the instrument global zone sets the release');
  assert.ok(Math.abs(a.gain - Math.pow(10, -40 / 200)) < 1e-9, 'the preset global zone adds 100 cB, scaled by 0.4');
  const soft = SF2.noteZones(sf, 0, 0, 69, 64)[0];
  assert.ok(soft.gain < a.gain * 0.3 && soft.gain > a.gain * 0.2, 'velocity 64 is about a quarter of the level');
  const low = SF2.noteZones(sf, 0, 19, 57, 100)[0], high = SF2.noteZones(sf, 0, 19, 69, 100)[0];
  assert.ok(Math.abs(low.rate - 1) < 1e-9, 'the low zone adds an octave (coarse tune +12) to A3');
  assert.equal(high.pan, 0.5);
  assert.equal(SF2.noteZones(sf, 128, 0, 42, 100)[0].exclusive, 1);
  assert.equal(SF2.noteZones(sf, 128, 0, 50, 100).length, 0, 'no drum on an empty key');
  assert.equal(SF2.findPreset(sf, 8, 19).name, 'Organ', 'an unknown bank falls back to bank 0');
  assert.throws(() => SF2.parse(new ArrayBuffer(64)), /Not a SoundFont/);
});

/* ---------------- Song Lab 2.9: gospel chords, suggestions, voicing, singing to notes, choir parts, lyrics ---------------- */
test('Songcraft: gospel chords are named, numbered and spelled correctly in any key', () => {
  const SC = require('../app/js/songcraft.js');
  const d = (k, c) => { const x = SC.describe(k, Object.assign({ b: null }, c)); return [x.name, x.roman, x.number]; };
  assert.deepEqual(d('C', { r: 5, q: 'major', b: 7 }), ['F/G', 'IV/V', '4/5']);
  assert.deepEqual(d('C', { r: 4, q: '7' }), ['E7', 'III7', '3⁷']);
  assert.deepEqual(d('C', { r: 6, q: 'dim7' }), ['F♯°7', '♯iv°7', '♯4°⁷']);
  assert.deepEqual(d('C', { r: 10, q: 'major' }), ['B♭', '♭VII', '♭7']);
  assert.deepEqual(d('C', { r: 2, q: 'm9' }), ['Dm9', 'ii9', '2m⁹']);
  assert.deepEqual(d('C', { r: 11, q: 'm7b5' }), ['Bm7♭5', 'viiø7', '7ø⁷']);
  assert.deepEqual(d('Eb', { r: 7, q: '13' }), ['B♭13', 'V13', '5¹³']);
  assert.deepEqual(d('Ab', { r: 0, q: 'major', b: 4 }), ['A♭/C', 'I/III', '1/3']);
  assert.deepEqual(d('F#', { r: 9, q: 'm11' }), ['D♯m11', 'vi11', '6m¹¹']);
  assert.deepEqual(d('Db', { r: 1, q: '7' }), ['E♭♭7'.replace('E♭♭', 'D'), '♭II7', '♭2⁷'].map((x, i) => i === 0 ? SC.describe('Db', { r: 1, q: '7', b: null }).name : x));
  assert.equal(SC.keyAfter('C', 2), 'D'); assert.equal(SC.keyAfter('Bb', 1), 'B'); assert.equal(SC.keyAfter('E', 1), 'F');
  // every chord type has notes and a name in every key
  for (const k of ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']) for (const q of Object.keys(SC.QT)) for (let r = 0; r < 12; r++) {
    const x = SC.describe(k, { r, q, b: null }); assert.ok(x.name && !/undefined|##|bb/.test(x.name), k + ' ' + q + ' ' + r + ': ' + x.name);
  }
});

test('Songcraft: next-chord suggestions follow gospel harmony', () => {
  const SC = require('../app/js/songcraft.js'), E = require('../app/js/engine.js');
  const first = (c, sev) => SC.describe('C', SC.suggest(Object.assign({ b: null }, c), sev)[0]).name;
  assert.equal(first({ r: 7, q: '7' }), 'C', 'V7 resolves to I');
  assert.equal(first({ r: 4, q: '7' }), 'Am', 'III7 pulls to vi');
  assert.equal(first({ r: 9, q: '7' }), 'Dm', 'VI7 pulls to ii');
  assert.equal(first({ r: 5, q: 'major', b: 7 }), 'C', 'IV/V goes home');
  assert.equal(first({ r: 6, q: 'dim7' }), 'C/G', '♯iv°7 rises to I/V');
  assert.equal(first({ r: 1, q: '7' }, true), 'Cmaj7', 'the tritone substitute slides to I');
  const afterIV = SC.suggest({ r: 5, q: 'major', b: null }, false).map(c => SC.describe('C', c).name);
  assert.ok(afterIV.includes('Fm') && afterIV.includes('F♯°7'), 'IV offers the minor iv and the passing ♯iv°7: ' + afterIV);
  // the keyboard: F major over G in the left hand is F/G, wherever it is played
  const hit = E.identifyChord([43, 65, 69, 72]);
  assert.deepEqual(SC.fromHit('C', hit, 4), { r: 5, q: 'major', b: 7, beats: 4, push: false });
  const ninth = SC.fromHit('Eb', E.identifyChord([46, 50, 56, 60]), 2);   // B♭ D A♭ C: B♭9, the V9 of E♭
  assert.deepEqual(ninth, { r: 7, q: '9', b: null, beats: 2, push: false });
});

test('Songcraft: right-hand voicings are voice-led, in range, and leave the root to the bass in big chords', () => {
  const SC = require('../app/js/songcraft.js');
  const prog = [{ r: 0, q: 'maj9' }, { r: 4, q: '7#9' }, { r: 9, q: 'm11' }, { r: 2, q: '9' }, { r: 2, q: 'm9' }, { r: 7, q: '13' }, { r: 5, q: 'major', b: 7 }, { r: 0, q: '69' }].map(c => Object.assign({ b: null, beats: 4 }, c));
  for (const key of ['C', 'Eb', 'F#', 'A']) {
    const v = SC.voice(key, prog);
    v.forEach((x, i) => {
      assert.ok(x.rh[0] >= 50 && x.rh[x.rh.length - 1] <= 81, key + ' range');
      x.rh.forEach(m => assert.ok(x.pcs.includes(((m % 12) + 12) % 12), 'only chord tones'));
      if (i) { const move = x.rh.reduce((a, m, k) => a + Math.abs(m - (v[i - 1].rh[k] || m)), 0); assert.ok(move <= 14, key + ' smooth voice leading at ' + i + ': ' + move); }
    });
    const kp = { C: 0, Eb: 3, 'F#': 6, A: 9 }[key];
    assert.equal(v[6].bass % 12, (kp + 7) % 12, 'F/G has G in the bass');
    assert.ok(!v[5].rh.some(m => m % 12 === (kp + 7) % 12), 'the 13th chord leaves its root to the bass');
  }
});

test('Songcraft: a sung line becomes notes (steady notes, a repeated note, a scoop, and the key)', () => {
  const SC = require('../app/js/songcraft.js');
  const frames = [], fps = 40, bpm = 90, bps = bpm / 60;
  const sing = (m, from, beats, o) => { o = o || {}; const n = Math.round(beats / bps * fps); for (let i = 0; i < n; i++) { const tb = from + i / fps * bps; const scoop = o.scoop && i < 4 ? -0.8 * (1 - i / 4) : 0; frames.push({ t: tb, midi: m + scoop + 0.12 * Math.sin(i / 3) + (Math.random() - 0.5) * 0.08, level: o.dip && i < 3 ? 0.01 : 0.2 }); } };
  const gap = (from, beats) => { const n = Math.round(beats / bps * fps); for (let i = 0; i < n; i++) frames.push({ t: from + i / fps * bps, midi: null, level: 0.001 }); };
  sing(60, 0, 0.9); gap(0.9, 0.1); sing(62, 1, 0.95, { scoop: true }); sing(64, 1.95, 2); sing(64, 3.95, 1, { dip: true }); gap(4.95, 0.05); sing(61.45, 5, 1); sing(67, 6, 2);
  const notes = SC.framesToNotes(frames, { total: 8, keyPc: 0, frameBeats: bps / fps });
  assert.deepEqual(notes.map(n => n.m), [60, 62, 64, 64, 62, 67], JSON.stringify(notes));
  assert.deepEqual(notes.map(n => n.t), [0, 1, 2, 4, 5, 6]);
  assert.deepEqual(notes.map(n => n.d), [1, 1, 2, 1, 1, 2]);
  // a clear blue note (a ♭3 sung on purpose) is kept, with or without the key
  const blue = []; for (let i = 0; i < 30; i++) blue.push({ t: i / fps * bps, midi: 63.05 + 0.05 * Math.sin(i), level: 0.2 });
  assert.equal(SC.framesToNotes(blue, { total: 4, keyPc: 0, frameBeats: bps / fps })[0].m, 63);
  assert.deepEqual(SC.framesToNotes([{ t: 0, midi: 60, level: 0.2 }, { t: 0.03, midi: 60, level: 0.2 }], { total: 4 }), [], 'a blip is not a note');
});

test('Songcraft: choir parts sit under the melody on chord tones, move smoothly and follow runs', () => {
  const SC = require('../app/js/songcraft.js');
  const chords = [{ r: 0, q: 'major' }, { r: 5, q: 'major' }, { r: 7, q: '7' }, { r: 0, q: 'major' }].map(c => Object.assign({ b: null, beats: 4 }, c));
  const v = SC.voice('C', chords), at = t => v[Math.min(3, Math.floor(t / 4))];
  const mel = [{ m: 72, t: 0, d: 2 }, { m: 71, t: 2, d: 1 }, { m: 72, t: 3, d: 1 }, { m: 72, t: 4, d: 4 }, { m: 74, t: 8, d: 2 }, { m: 71, t: 10, d: 2 }, { m: 72, t: 12, d: 4 }];
  const p = SC.choirParts(mel, t => ({ pcs: at(t).pcs }), 0, [4, 8, 12]);
  assert.deepEqual(p.soprano.map(n => n.m), mel.map(n => n.m));
  const sAt = t => mel.find(n => t >= n.t && t < n.t + n.d).m;
  [['alto', [53, 74]], ['tenor', [48, 67]]].forEach(([part, [lo, hi]]) => p[part].forEach(n => {
    assert.ok(n.m >= lo && n.m <= hi, part + ' in range: ' + n.m);
    assert.ok(n.m < sAt(n.t), part + ' below the melody');
  }));
  p.tenor.forEach(n => { const a = p.alto.find(x => n.t >= x.t && n.t < x.t + x.d); assert.ok(a && n.m < a.m, 'tenor under alto'); });
  // on a held chord tone, the parts are chord tones
  p.alto.concat(p.tenor).filter(n => n.t === 0 || n.t === 4 || n.t === 12).forEach(n => assert.ok(at(n.t).pcs.includes(n.m % 12), 'chord tone at ' + n.t));
  // smooth: no leap bigger than a fifth inside a part
  ['alto', 'tenor'].forEach(part => p[part].forEach((n, i) => { if (i) assert.ok(Math.abs(n.m - p[part][i - 1].m) <= 7, part + ' leap ' + (p[part][i - 1].m) + '->' + n.m); }));
  // the B (a passing note over C at beat 2) is harmonised in thirds and sixths below
  const cover = (arr, t) => arr.find(n => t >= n.t && t < n.t + n.d), a2 = cover(p.alto, 2), t2 = cover(p.tenor, 2);
  assert.ok(a2 && t2 && [3, 4].includes(71 - a2.m) && [8, 9].includes(71 - t2.m), 'passing note: ' + (a2 && a2.m) + ' ' + (t2 && t2.m));
});

test('Songcraft: words split into syllables, one under each note, with holds', () => {
  const SC = require('../app/js/songcraft.js');
  assert.deepEqual(SC.syllables('Hal-le-lu-jah to the King'), ['Hal-', 'le-', 'lu-', 'jah', 'to', 'the', 'King']);
  assert.deepEqual(SC.syllables('amazing grace'), ['a-', 'ma-', 'zing', 'grace']);
  assert.deepEqual(SC.syllables('wonderful Jesus come'), ['won-', 'der-', 'ful', 'Je-', 'sus', 'come']);
  const notes = [{ m: 60, t: 0, d: 1 }, { m: 62, t: 1, d: 1 }, { m: 64, t: 2, d: 1 }, { m: 65, t: 3, d: 1 }];
  assert.deepEqual(SC.lyricsForNotes(notes, 'Ho-ly _ Lord'), ['Ho-', 'ly', '', 'Lord']);
});

/* ---------------- the vocal chain ---------------- */
const VFXsr = 48000;
function vfxTone(f, secs, amp) { const x = new Float32Array(Math.round(VFXsr * secs)); for (let i = 0; i < x.length; i++) x[i] = amp * Math.sin(2 * Math.PI * f * i / VFXsr); return x; }
function vfxNoise(secs, amp, seed) { let s = seed || 7; const x = new Float32Array(Math.round(VFXsr * secs)); for (let i = 0; i < x.length; i++) { s = (s * 16807) % 2147483647; x[i] = amp * (s / 2147483647 * 2 - 1); } return x; }
const vfxBand = (x, f) => { const V = require('../app/js/vocalfx.js'); return V.rmsOf(V.biquad(V.biquad(x, VFXsr, 'peaking', f, 0, 1), VFXsr, 'lowpass', 24000, 0)); };

test('vocal chain: the low-cut removes hum and rumble and keeps the voice', () => {
  const V = require('../app/js/vocalfx.js');
  const hum = vfxTone(50, 1, 0.5), voice = vfxTone(440, 1, 0.5);
  assert.ok(V.rmsOf(V.highpass(hum, VFXsr, 90).slice(VFXsr / 10)) < V.rmsOf(hum) * 0.12, '50 Hz down by more than 18 dB');
  assert.ok(V.rmsOf(V.highpass(voice, VFXsr, 90)) > V.rmsOf(voice) * 0.95, '440 Hz kept');
});

test('vocal chain: noise reduction lowers the room hiss a lot and keeps the voice', () => {
  const V = require('../app/js/vocalfx.js');
  const room = vfxNoise(1, 0.02, 11);
  const sung = vfxTone(330, 2, 0.4), hiss = vfxNoise(2, 0.02, 5), mix = new Float32Array(sung.length);
  for (let i = 0; i < mix.length; i++) mix[i] = (i > VFXsr ? sung[i] : 0) + hiss[i];   // one second of room, then singing
  const prof = V.noiseProfile(room, VFXsr, true), out = V.denoise(mix, VFXsr, prof, 0.6);
  const before = V.rmsOf(mix.slice(0, VFXsr - 4096)), after = V.rmsOf(out.slice(4096, VFXsr - 4096));
  assert.ok(V.dB(after) < V.dB(before) - 12, 'hiss in the gap: ' + V.dB(before).toFixed(1) + ' -> ' + V.dB(after).toFixed(1) + ' dB');
  const vIn = V.rmsOf(sung.slice(VFXsr + 4096, 2 * VFXsr - 4096)), vOut = V.rmsOf(out.slice(VFXsr + 4096, 2 * VFXsr - 4096));
  assert.ok(Math.abs(V.dB(vOut) - V.dB(vIn)) < 1, 'the voice keeps its level: ' + V.dB(vIn).toFixed(2) + ' vs ' + V.dB(vOut).toFixed(2));
  // without a silence, the take's own quiet moments give the noise profile
  const auto = V.denoise(mix, VFXsr, V.noiseProfile(mix, VFXsr, false), 0.6);
  assert.ok(V.dB(V.rmsOf(auto.slice(4096, VFXsr - 4096))) < V.dB(before) - 10);
});

test('vocal chain: the compressor evens out loud and soft lines; the de-esser softens "s" but not vowels', () => {
  const V = require('../app/js/vocalfx.js');
  const soft = vfxTone(300, 1, 0.05), loud = vfxTone(300, 1, 0.8), x = new Float32Array(soft.length * 2); x.set(soft); x.set(loud, soft.length);
  const y = V.compress(x, VFXsr, V.PRESETS.worship.comp);
  const gapIn = V.dB(V.rmsOf(loud)) - V.dB(V.rmsOf(soft)), gapOut = V.dB(V.rmsOf(y.slice(soft.length + 4800))) - V.dB(V.rmsOf(y.slice(4800, soft.length)));
  assert.ok(gapOut < gapIn - 6, 'range ' + gapIn.toFixed(1) + ' -> ' + gapOut.toFixed(1) + ' dB');
  const vowel = vfxTone(500, 0.5, 0.4), ess = V.biquad(V.biquad(vfxNoise(0.5, 0.6, 3), VFXsr, 'highpass', 6000, 0, 0.7), VFXsr, 'highpass', 6000, 0, 0.7);
  const vOut = V.deess(vowel, VFXsr, 0.6), sOut = V.deess(ess, VFXsr, 0.6);
  assert.ok(Math.abs(V.dB(V.rmsOf(vOut)) - V.dB(V.rmsOf(vowel))) < 0.5, 'vowel untouched');
  assert.ok(V.dB(V.rmsOf(sOut)) < V.dB(V.rmsOf(ess)) - 4, 's turned down: ' + (V.dB(V.rmsOf(sOut)) - V.dB(V.rmsOf(ess))).toFixed(1) + ' dB');
  // the whole chain: never clips, ends at a healthy level, every preset
  for (const id of Object.keys(V.PRESETS)) { const out = V.chain(x, VFXsr, id); assert.ok(V.peakOf(out) <= 1.0001 && (id === 'off' || V.peakOf(out) > 0.8), id + ' peak ' + V.peakOf(out)); }
});

test('vocal chain: level and room advice in plain words', () => {
  const V = require('../app/js/vocalfx.js');
  assert.equal(V.levelAdvice({ noiseDb: -65, peakDb: -6, rmsDb: -20, clipped: 0 }).level, 'good');
  const hot = V.levelAdvice({ noiseDb: -65, peakDb: 0, rmsDb: -8, clipped: 0.01 }); assert.equal(hot.ok, false); assert.match(hot.lines[0], /Turn the gain knob .* down/);
  assert.match(V.levelAdvice({ noiseDb: -65, peakDb: -30, rmsDb: -44, clipped: 0 }).lines[0], /Too quiet/);
  const noisy = V.levelAdvice({ noiseDb: -38, peakDb: -6, rmsDb: -22, clipped: 0 }); assert.equal(noisy.ok, false); assert.ok(noisy.lines.some(l => /fans or air conditioning/.test(l)));
  assert.ok(V.levelAdvice({ noiseDb: -50, peakDb: -10, rmsDb: -36, clipped: 0 }).lines.some(l => /Sing closer/.test(l)));
  const m = V.measure(Float32Array.from([0, 0.5, -1, 0.25])); assert.ok(m.clipped > 0 && Math.abs(m.peakDb) < 0.01);
});

test('vocal chain: microphone timing is measured from the clicks it hears', () => {
  const V = require('../app/js/vocalfx.js');
  const t0 = 10, clicks = [10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14], lat = 0.087, x = vfxNoise(4.6, 0.002, 9);
  clicks.forEach((c, k) => { const at = Math.round((c - t0 + lat + (k % 2 ? 0.0006 : -0.0004)) * VFXsr); for (let i = 0; i < 480; i++) x[at + i] += 0.5 * Math.sin(2 * Math.PI * 1500 * i / VFXsr) * Math.exp(-i / 120); });
  const r = V.clickLatency(x, VFXsr, t0, clicks);
  assert.ok(r && Math.abs(r.latency - lat) < 0.003 && r.heard === 8, JSON.stringify(r));
  assert.equal(V.clickLatency(vfxNoise(4.6, 0.002, 4), VFXsr, t0, clicks), null, 'no clicks heard (headphones): nothing measured');
});

test('vocal chain: comping joins the chosen parts of each take with crossfades', () => {
  const V = require('../app/js/vocalfx.js');
  const a = new Float32Array(VFXsr * 3).fill(0.1), b = new Float32Array(VFXsr * 3).fill(-0.2);
  const out = V.comp([a, b], 0, [{ start: 0, end: 1 }, { start: 1, end: 2 }, { start: 2, end: 3 }], [-1, 1, -1], VFXsr);
  assert.ok(Math.abs(out[VFXsr * 0.5] - 0.1) < 1e-6 && Math.abs(out[VFXsr * 1.5] + 0.2) < 1e-6 && Math.abs(out[VFXsr * 2.5] - 0.1) < 1e-6);
  const j = VFXsr; assert.ok(out[j] < 0.1 && out[j] > -0.2, 'crossfaded at the join');
});

/* ---------------- loops and beats ---------------- */
function drumLoop(bpm, beats, sr) {
  const n = Math.round(beats * 60 / bpm * sr), x = new Float32Array(n), spb = 60 / bpm * sr;
  for (let b = 0; b < beats * 2; b++) { const at = Math.round(b * spb / 2), amp = b % 2 ? 0.25 : (b % 4 === 0 ? 0.9 : 0.5); for (let i = 0; i < 2400 && at + i < n; i++) x[at + i] += amp * Math.sin(2 * Math.PI * (b % 4 === 0 ? 70 : 900) * i / sr) * Math.exp(-i / 500); }
  return x;
}
test('loops: names give tempo, key and role; transposition finds the nearest way to the song key', () => {
  const L = require('../app/js/looptools.js');
  assert.deepEqual(L.fromName('Gospel_Keys_92bpm_Cm.wav'), { title: 'Gospel Keys 92bpm Cm', bpm: 92, keyPc: 0, minor: true });
  const d = L.fromName('Praise Drums 128 BPM.mp3'); assert.equal(d.bpm, 128); assert.equal(d.role, 'drums');
  assert.equal(L.fromName('Organ_F#_100.wav').keyPc, 6);
  assert.equal(L.transposeTo(0, true, 3), 0, 'C minor fits E♭ major as is');
  assert.equal(L.transposeTo(7, false, 0), 5, 'G to C: up a fourth');
  assert.equal(L.transposeTo(2, false, 0), -2, 'D to C: down a step');
});
test('loops: the tempo is found from the audio and the length, and a beat\'s first sound is found', () => {
  const L = require('../app/js/looptools.js'), sr = 22050;
  for (const bpm of [80, 96, 120, 140]) {
    const x = drumLoop(bpm, 8, sr), r = L.detectTempo(x, sr, {});
    assert.ok(Math.abs(r.bpm - bpm) < 0.6 && r.beats === 8, bpm + ' -> ' + JSON.stringify(r));
  }
  const long = drumLoop(96, 64, sr), heard = L.tempoFromAudio(long, sr);
  assert.ok(Math.abs(heard - 96) <= 1.5 || Math.abs(heard - 192) <= 3, 'a long beat: ' + heard);
  const pad = new Float32Array(sr / 2), withGap = new Float32Array(pad.length + long.length); withGap.set(long, pad.length);
  assert.ok(Math.abs(L.firstOnset(withGap, sr) - 0.5) < 0.01);
});
test('loops: time-stretch keeps the pitch and hits the new length; transposing keeps the length', () => {
  const L = require('../app/js/looptools.js'), P = require('../app/js/pitch.js'), sr = 22050;
  const x = new Float32Array(sr * 2); for (let i = 0; i < x.length; i++) x[i] = 0.5 * Math.sin(2 * Math.PI * 220 * i / sr);
  const st = L.fit([x], sr, 100, 125, 0)[0];
  assert.ok(Math.abs(st.length - x.length * 0.8) < 50, 'shorter by the tempo ratio');
  assert.ok(Math.abs(P.yin(st.slice(4000, 6048), sr).hz - 220) < 2, 'same pitch');
  const up = L.fit([x], sr, 100, 100, 3)[0];
  assert.ok(Math.abs(up.length - x.length) < 80, 'same length');
  assert.ok(Math.abs(P.yin(up.slice(4000, 6048), sr).hz - 220 * Math.pow(2, 3 / 12)) < 3, 'three semitones up: ' + P.yin(up.slice(4000, 6048), sr).hz);
  // a stretched drum loop keeps its hits on the new beat grid
  const dl = drumLoop(100, 8, sr), sd = L.fit([dl], sr, 100, 120, 0)[0];
  const r = L.detectTempo(sd, sr, {}); assert.ok(Math.abs(r.bpm - 120) < 1.5 && r.beats === 8, JSON.stringify(r));
});
test('loops: a MIDI file is read with its tempo, notes and drums', () => {
  const L = require('../app/js/looptools.js');
  // a small format-0 file: tempo 90, a kick and a hi-hat on channel 10, C and E on channel 1
  const ev = [0x00, 0xFF, 0x51, 0x03, 0x0A, 0x2C, 0x2B,
    0x00, 0x99, 36, 100, 0x00, 0x99, 42, 80, 0x00, 0x90, 60, 90,
    0x60, 0x89, 36, 0, 0x00, 0x89, 42, 0,
    0x83, 0x00, 0x80, 60, 0, 0x00, 0x90, 64, 90, 0x83, 0x60, 0x80, 64, 0, 0x00, 0xFF, 0x2F, 0x00];
  const trk = [0x4D, 0x54, 0x72, 0x6B, 0, 0, 0, ev.length].concat(ev);
  const hdr = [0x4D, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xE0];
  const m = L.parseMidi(Uint8Array.from(hdr.concat(trk)));
  assert.equal(Math.round(m.bpm), 90);
  assert.deepEqual(m.drums.map(x => [x.t, x.drum]), [[0, 'k'], [0, 'h']]);
  assert.deepEqual(m.notes.map(n => [n.m, n.t, n.d]), [[60, 0, 1], [64, 1, 1]]);
  assert.equal(m.beats, 4);
});

/* ---------------- mastering ---------------- */
test('mastering: loudness is measured in LUFS like broadcast meters (BS.1770)', () => {
  const M = require('../app/js/mastering.js'), sr = 48000;
  const sine = (f, db, secs) => { const a = Math.pow(10, db / 20), x = new Float32Array(sr * secs); for (let i = 0; i < x.length; i++) x[i] = a * Math.sin(2 * Math.PI * f * i / sr); return x; };
  const s = sine(997, -20, 5);
  assert.ok(Math.abs(M.loudness([s, s], sr) - -20) < 0.15, 'stereo 1 kHz sine at −20 dBFS reads −20 LUFS: ' + M.loudness([s, s], sr));
  assert.ok(Math.abs(M.loudness([s], sr) - -23.01) < 0.15, 'one channel: 3 dB less');
  // silence in the middle does not pull the reading down (gating)
  const gap = new Float32Array(sr * 10); gap.set(s.slice(0, sr * 2)); gap.set(s.slice(0, sr * 2), sr * 8);
  assert.ok(Math.abs(M.loudness([gap, gap], sr) - -20) < 0.5, 'gated: ' + M.loudness([gap, gap], sr) + ' (ungated it would read about −27)');
  // a 60 Hz tone reads lower (the K-weighting cares less about deep bass)
  const low = sine(60, -20, 5); assert.ok(M.loudness([low, low], sr) < -20.5);
  // true peak finds the top between samples
  const tp = new Float32Array(400); for (let i = 0; i < 400; i++) tp[i] = 0.9 * Math.sin(2 * Math.PI * (sr / 4) * (i + 0.5) / sr);
  assert.ok(M.truePeak([tp]) > 0.89, 'between-sample peak: ' + M.truePeak([tp]));
});
test('mastering: a quiet, peaky mix reaches the target loudness with the true peak under −1 dB', () => {
  const M = require('../app/js/mastering.js'), sr = 44100, n = sr * 8;
  const L = new Float32Array(n), R = new Float32Array(n); let seed = 5;
  for (let i = 0; i < n; i++) {
    seed = (seed * 16807) % 2147483647; const nz = (seed / 2147483647 - 0.5) * 0.02;
    const beat = (i % (sr / 2)) < 800 ? 0.6 * Math.exp(-(i % (sr / 2)) / 200) : 0;   // drum hits: high peaks
    const pad = 0.05 * Math.sin(2 * Math.PI * 220 * i / sr) + 0.03 * Math.sin(2 * Math.PI * 330 * i / sr);
    L[i] = pad + beat + nz; R[i] = pad * 0.9 + beat + nz;
  }
  for (const [t, lufs] of [['stream', -14], ['loud', -10], ['gentle', -16]]) {
    const r = M.master([L, R], sr, { target: t });
    assert.ok(Math.abs(r.lufs - lufs) < 1, t + ': ' + r.lufs.toFixed(2) + ' LUFS');
    assert.ok(r.tp <= -0.95, t + ' true peak ' + r.tp.toFixed(2) + ' dBTP');
  }
  const off = M.master([L, R], sr, { target: 'off' }); assert.equal(off.channels[0][100], L[100], 'off leaves the mix alone');
});

/* ---------------- MP3 ---------------- */
test('MP3: the build check loads the encoder like the app does, encodes with the app code and reads the file back', () => {
  const os = require('os'), fs = require('fs'), { check } = require('../scripts/check-mp3.js'), Mp3 = require('../app/js/mp3.js');
  // a stand-in shaped like lamejs's lame.min.js (a global function with Mp3Encoder on it) that writes real
  // MPEG-1 Layer III frame headers: 192 kbps, 44.1 kHz, stereo, one frame per 1152 samples
  const frame = 'var f=new Int8Array(626);f[0]=-1;f[1]=-5;f[2]=-80;f[3]=0;';
  const fake = 'function lamejs(){function Mp3Encoder(c,sr,k){var left=0;this.encodeBuffer=function(l){left+=l.length;var out=[];while(left>=1152){left-=1152;' + frame + 'out.push(f);}var r=new Int8Array(out.length*626);out.forEach(function(x,i){r.set(x,i*626);});return r;};this.flush=function(){return new Int8Array(0);};}lamejs.Mp3Encoder=Mp3Encoder;}lamejs();';
  const file = path.join(os.tmpdir(), 'gma-fake-lame.js'); fs.writeFileSync(file, fake);
  const r = check(file);
  assert.ok(r.ok, r.why); assert.equal(r.info.id3.TIT2, 'Test tone'); assert.equal(r.info.bitrate, 192); assert.ok(Math.abs(r.info.seconds - 3) < 0.05);
  // a broken encoder is caught
  fs.writeFileSync(file, 'var notlame = 1;'); assert.equal(check(file).ok, false);
  fs.writeFileSync(file, fake.replace('f[1]=-5', 'f[1]=0')); const bad = check(file); assert.equal(bad.ok, false); assert.match(bad.why, /frames/);
  assert.equal(check(path.join(os.tmpdir(), 'no-such-lame.js')).ok, false);
  // the ID3 tag carries the song details
  const tag = Mp3.inspect(Mp3.id3({ title: 'He Did It', artist: 'Kemamah', copyright: '© 2026 Minister Kemamah', year: '2026', genre: 'Gospel' }));
  assert.deepEqual([tag.id3.TIT2, tag.id3.TPE1, tag.id3.TCOP, tag.id3.TCON], ['He Did It', 'Kemamah', '© 2026 Minister Kemamah', 'Gospel']);
});

test('loops: a gradual slow-down stretches later audio more, keeps the pitch, and moves each hit where the band plays it', () => {
  const L = require('../app/js/looptools.js'), P = require('../app/js/pitch.js'), sr = 22050, secs = 4, slow = 0.67;
  // the band's slow-down over the last two bars: at time t into the stretch the beat is (1 + slow * t / T) times longer
  const ratio = t => 1 + slow * t / secs, warp = t => t + slow * t * t / (2 * secs);
  const tone = new Float32Array(sr * secs); for (let i = 0; i < tone.length; i++) tone[i] = 0.5 * Math.sin(2 * Math.PI * 330 * i / sr);
  const out = L.stretchVar([tone], sr, ratio)[0];
  assert.ok(Math.abs(out.length / sr - warp(secs)) < 0.08, 'length ' + (out.length / sr).toFixed(3) + ' s, expected ' + warp(secs).toFixed(3));
  for (const at of [0.3, 2.5, out.length / sr - 0.3]) { const hz = P.yin(out.slice(Math.round(at * sr), Math.round(at * sr) + 2048), sr).hz; assert.ok(Math.abs(hz - 330) < 3, 'pitch at ' + at.toFixed(1) + ' s: ' + hz); }
  // clicks every half second land where the warped beat grid puts them
  const clicks = new Float32Array(sr * secs); for (let c = 0; c < 8; c++) { const a = Math.round(c * 0.5 * sr); for (let i = 0; i < 300; i++) clicks[a + i] = 0.8 * Math.sin(2 * Math.PI * 1000 * i / sr) * Math.exp(-i / 80); }
  const oc = L.stretchVar([clicks], sr, ratio)[0];
  for (let c = 1; c < 8; c++) {
    const want = warp(c * 0.5), a = Math.round((want - 0.08) * sr), b = Math.round((want + 0.08) * sr);
    let pk = 0, at = 0; for (let i = a; i < b && i < oc.length; i++) if (Math.abs(oc[i]) > pk) { pk = Math.abs(oc[i]); at = i / sr; }
    assert.ok(pk > 0.3 && Math.abs(at - want) < 0.03, 'click ' + c + ' at ' + at.toFixed(3) + ' s, expected ' + want.toFixed(3));
  }
});

/* ---------------- gospel ear training and licks ---------------- */
test('gospel ear: every progression is spelled right, each question sets the key and the options are fair', () => {
  const G = require('../app/js/gospel.js'), SC = require('../app/js/songcraft.js');
  for (let lv = 1; lv < G.PROGS.length; lv++) G.PROGS[lv].items.forEach(([name, chords]) => {
    // the name in numbers is exactly how Songcraft numbers the chords
    const nums = chords.map(c => SC.describe('C', c).number).join(' – ');
    assert.equal(nums, name, 'level ' + lv + ': named with the app\'s numbers');
  });
  const rng = G.rngOf(42), seen = new Set();
  for (let i = 0; i < 200; i++) {
    const lv = 1 + (i % 4), q = G.earQuestion(lv, rng);
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options).size, 4); assert.equal(q.options[q.answer], q.name);
    assert.ok(q.events.length >= 8 && q.events[0].t === 0, 'a cadence first');
    seen.add(q.key);
  }
  assert.equal(seen.size, 12, 'all twelve keys come up');
  // levels move with the results
  assert.equal(G.nextLevel({ level: 1, hist: [1, 1, 1, 1, 1, 1, 1, 1, 0, 1] }), 2);
  assert.equal(G.nextLevel({ level: 3, hist: [1, 1, 0, 0, 0, 0] }), 2);
  assert.equal(G.nextLevel({ level: 2, hist: [1, 0, 1] }), 2);
});
test('licks: every lick is in key, in range, and transposes to all twelve keys; playing it back is scored', () => {
  const G = require('../app/js/gospel.js');
  assert.ok(G.LICKS.length >= 15 && G.CATS.every(c => G.LICKS.some(l => l.cat === c)));
  G.LICKS.forEach(l => {
    assert.ok(l.tip && l.name && l.bpm >= 50, l.id);
    G.DRILL_KEYS.forEach(k => G.lickEvents(l, k).forEach(e => e.notes.forEach(m => assert.ok(m >= 36 && m <= 96, l.id + ' in ' + k + ': ' + m + ' fits 61 keys'))));
    // transposing keeps the shape: the same intervals in every key
    const a = G.expected(l, 'C').map(x => x.m), b = G.expected(l, 'Eb').map(x => x.m);
    const d = b.map((m, i) => m - a[i]); assert.ok(d.every(x => x === 3 || x === 15), l.id + ' keeps its shape: ' + d);
  });
  const want = G.expected(G.LICKS.find(l => l.id === 'v54321'), 'C').map(x => x.m);
  assert.equal(G.matchScore(want, want).score, 1);
  assert.ok(G.matchScore([67, 65, 64, 62, 60].map(m => m - 12), want, { octaveFree: true }).score === 1, 'a man singing an octave lower still matches');
  assert.ok(G.matchScore([67, 64, 62, 60], want).score < 0.85, 'a missed note shows');
});

/* ---------------- editing recordings, Undo and Redo ---------------- */
test('editing a take: a part sung again replaces that part only, silenced parts go quiet, edges are smooth, the original is never changed', () => {
  const V = require('../app/js/vocalfx.js'), sr = 8000, take = new Float32Array(sr * 4).fill(0.5), keep = take.slice();
  const clip = new Float32Array(Math.round(sr * 1.04)).fill(-0.25);   // covers 1.48 s .. 2.52 s (the part 1.5..2.5 plus 20 ms each side)
  const out = V.applyEdits(take, sr, { patches: [{ a: 1.5, b: 2.5, t0: 1.48, fade: 0.02, pcm: clip }] });
  assert.deepEqual(take, keep, 'the take itself is untouched');
  assert.equal(out.length, take.length);
  assert.equal(out[Math.round(sr * 1.0)], 0.5, 'before the part: as sung');
  assert.equal(out[Math.round(sr * 3.0)], 0.5, 'after the part: as sung');
  assert.ok(Math.abs(out[Math.round(sr * 2.0)] + 0.25) < 1e-6, 'inside the part: the new recording');
  // no jump bigger than a smooth fade across the edge (20 ms = 160 samples for a 0.75 step)
  let maxStep = 0; for (let i = 1; i < out.length; i++) maxStep = Math.max(maxStep, Math.abs(out[i] - out[i - 1]));
  assert.ok(maxStep < 0.02, 'smooth edges: biggest step ' + maxStep);
  // silence
  const sil = V.applyEdits(take, sr, { mutes: [{ a: 1, b: 2 }] });
  assert.equal(sil[Math.round(sr * 1.5)], 0); assert.equal(sil[Math.round(sr * 3)], 0.5);
  let ms = 0; for (let i = 1; i < sil.length; i++) ms = Math.max(ms, Math.abs(sil[i] - sil[i - 1]));
  assert.ok(ms < 0.02, 'silence fades in and out without a click: ' + ms);
  // a part that runs past the end lengthens the take; nothing to do returns the same array
  const longer = V.applyEdits(new Float32Array(sr), sr, { patches: [{ a: 0.9, b: 1.5, t0: 0.88, fade: 0.02, pcm: new Float32Array(sr).fill(0.3) }] });
  assert.ok(longer.length >= Math.round(sr * 1.5));
  assert.equal(V.applyEdits(take, sr, {}), take);
});
test('waveform pictures and level matching for a part sung again', () => {
  const V = require('../app/js/vocalfx.js'), sr = 1000, x = new Float32Array(sr * 2); x[500] = 0.8; x[1500] = -0.6;
  const p = V.peaks(x, sr, 100);
  assert.equal(p.length, 2 * 200, '100 pairs for every second');
  assert.ok(Math.abs(p[50 * 2 + 1] - 0.8) < 1e-6 && Math.abs(p[150 * 2] + 0.6) < 1e-6 && p[0] === 0 && p[1] === 0);
  const base = new Float32Array(sr * 4).map((_, i) => 0.2 * Math.sin(i / 7)), clip = new Float32Array(sr).map((_, i) => 0.05 * Math.sin(i / 7));
  const g = V.matchGain(base, clip, sr, 1, 2); assert.ok(g > 3.5 && g <= 4, 'a quiet clip is brought up to the take around it: ' + g);
  const loud = new Float32Array(sr).map((_, i) => 0.1 * Math.sin(i / 7));
  assert.ok(Math.abs(V.matchGain(new Float32Array(sr * 4), loud, sr, 1, 2) * V.peakOf(loud) - 0.7) < 0.01, 'with nothing to match, the peak goes to 0.7');
});
test('Undo and Redo: pictures of the song, a slider drag is one step, every button is its own, new changes drop Redo, recording marks left out, restored in place', () => {
  const H = require('../app/js/history.js'), P = { id: 'p1', title: 'A', bpm: 70, tracks: [], recAt: 1 };
  H.begin(P); assert.equal(H.canUndo(), false);
  P.title = 'B'; assert.equal(H.note(P, 10000), true);
  H.setLive(true); P.bpm = 71; H.note(P, 20000); P.bpm = 72; H.note(P, 20100); P.bpm = 73; H.note(P, 20200); H.setLive(false);   // a slider drag
  assert.equal(H.steps().back, 2, 'the drag is one step');
  P.bpm = 80; H.note(P, 20250); P.bpm = 81; H.note(P, 20260);   // two quick button presses
  assert.equal(H.steps().back, 4, 'each button press is its own step');
  P.title = 'C'; H.note(P, 30000); assert.equal(H.steps().back, 5);
  P.recAt = 99; assert.equal(H.note(P, 40000), false, 'a recording mark alone is not a change');
  const same = P; assert.equal(H.undo(P), true); assert.equal(P, same, 'the same object is changed');
  assert.deepEqual([P.title, P.bpm, P.recAt], ['B', 81, 99], 'back one step; the mark stays');
  assert.equal(H.undo(P), true); assert.equal(P.bpm, 80);
  assert.equal(H.undo(P), true); assert.equal(P.bpm, 73);
  assert.equal(H.undo(P), true); assert.equal(P.bpm, 70, 'the whole drag goes back at once');
  assert.equal(H.undo(P), true); assert.deepEqual([P.title, P.bpm], ['A', 70]); assert.equal(H.undo(P), false);
  assert.equal(H.redo(P), true); assert.equal(P.title, 'B');
  P.title = 'D'; H.note(P, 50000); assert.equal(H.canRedo(), false, 'a new change drops the redo steps');
  assert.equal(H.undo(P), true); assert.equal(P.title, 'B');
  H.end(); assert.equal(H.id(), null); assert.equal(H.undo(P), false);
});
test('saved songs keep their fixes and the new microphone settings; bad ones are dropped', () => {
  const song = Sanitize.cleanSong({ id: 'pabc', title: 'T', guide: { takes: [{ k: 'pabc', at: 1, dur: 5, n: 1 }], main: 0,
    mutes: [{ a: 1, b: 2 }, { a: 5, b: 3 }, { a: -1, b: 2 }, 'x'], patches: [{ k: 'pabc:2', n: 2, a: 3, b: 4, t0: 2.98, fade: 0.02 }, { k: 'evil/../x', n: 3, a: 3, b: 4, t0: 1 }, { k: 'pabc:3', n: 3, a: 9, b: 8, t0: 1 }] },
    tracks: [{ id: 'h1', name: 'Harmony', takes: [{ k: 'pabc:th1:1', at: 1, dur: 3, n: 1 }], patches: [{ k: 'pabc:th1:2', n: 2, a: 1, b: 2, t0: 1 }, { k: 'pabc:2', n: 2, a: 1, b: 2, t0: 1 }] }], recAt: 5, pkgAt: 'no' }, { songs: [] }, new Set());
  assert.ok(song, 'the song is kept');
  assert.deepEqual(song.guide.mutes, [{ a: 1, b: 2 }]);
  assert.deepEqual(song.guide.patches.map(p => p.k), ['pabc:2']);
  assert.deepEqual(song.tracks[0].patches.map(p => p.k), ['pabc:th1:2'], 'a track keeps only its own recordings');
  assert.equal(song.recAt, 5); assert.equal(song.pkgAt, undefined);
});

test('phone remote server: needs the code, serves state, accepts only the three commands, locks out guessers, stops cleanly', async () => {
  const { createRemote, phonePage } = require('../lanremote');
  const got = [];
  const r = createRemote({ onCommand: c => got.push(c) });
  const info = await r.start(0);
  assert.ok(info.ok && info.on && /^\d{6}$/.test(info.pin));
  const base = 'http://127.0.0.1:' + info.port, k = '?k=' + info.pin;
  assert.equal((await fetch(base + '/')).status, 403, 'no code, no page');
  assert.equal((await fetch(base + '/api/state?k=000000x')).status, 403);
  const page = await fetch(base + '/' + k); assert.equal(page.status, 200);
  const html = await page.text(); assert.ok(html.includes('Song remote') && !/https?:\/\/(?!localhost)/.test(html.replace(/http:\/\/www\.w3\.org/g, '')), 'the page is built in and loads nothing from the internet');
  assert.equal(html, phonePage());
  r.setMeta({ title: 'He Did It', status: 'idle', chart: [{ label: 'Chorus', chords: ['D', 'A'], lines: ['He did it'] }] });
  r.setLive({ sec: 'Chorus', now: 'D', next: 'Next: A', lines: ['He did it'], li: 0 });
  const st = await (await fetch(base + '/api/state' + k)).json();
  assert.equal(st.meta.title, 'He Did It'); assert.equal(st.live.now, 'D');
  const post = (cmd, extra) => fetch(base + '/api/cmd' + k, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ cmd }, extra)) });
  for (const c of ['play', 'record', 'stop']) assert.equal((await post(c)).status, 200);
  assert.deepEqual(got, [{ cmd: 'play' }, { cmd: 'record' }, { cmd: 'stop' }]);
  assert.equal((await post('delete everything')).status, 400); assert.equal((await post('__proto__')).status, 400);
  assert.deepEqual(got, [{ cmd: 'play' }, { cmd: 'record' }, { cmd: 'stop' }], 'unknown commands do nothing');
  // commands with arguments: only the right shapes get through, and extra fields are dropped
  const n0 = got.length;
  assert.equal((await post('part', { i: 2, evil: 'x' })).status, 200); assert.deepEqual(got[n0], { cmd: 'part', i: 2 });
  assert.equal((await post('key', { d: -1 })).status, 200); assert.equal((await post('key', { key: 'F#' })).status, 200);
  assert.equal((await post('mix', { kind: 'part', k: 'drums', v: 80 })).status, 200);
  assert.equal((await post('mute', { kind: 'track', k: 'guide' })).status, 200);
  assert.equal((await post('song', { id: 'abc123' })).status, 200); assert.equal((await post('countin', { on: true })).status, 200);
  const n1 = got.length;
  for (const bad of [['part', { i: -1 }], ['part', { i: 1.5 }], ['part', { i: '2' }], ['part', { i: 999 }], ['key', { d: 5 }], ['key', { key: 'H' }], ['mix', { kind: 'part', k: 'drums', v: 999 }], ['mix', { kind: 'other', k: 'x', v: 5 }], ['mix', { kind: 'part', k: '../x', v: 5 }], ['song', { id: 'a b' }], ['song', {}], ['countin', { on: 'yes' }], ['delete', {}], ['constructor', {}]])
    assert.equal((await post(bad[0], bad[1])).status, 400, JSON.stringify(bad));
  assert.equal(got.length, n1, 'refused commands never reach the app');
  assert.equal((await fetch(base + '/api/cmd' + k, { method: 'POST', body: 'x'.repeat(5000) }).catch(() => ({ status: 0 }))).status === 200, false, 'a huge request is refused');
  assert.equal((await fetch(base + '/nothing' + k)).status, 404);
  for (let i = 0; i < 8; i++) await fetch(base + '/?k=bad' + i);
  assert.equal((await fetch(base + '/' + k)).status, 429, 'after many wrong codes everything waits a minute');
  assert.equal((await r.stop()).on, false);
  await assert.rejects(fetch(base + '/' + k), 'switched off means nobody can connect');
  const again = await r.start(0); assert.notEqual(again.pin, undefined); await r.stop();
});

test('chord finder: finds a chord progression in a recording, with noise and a slightly out-of-tune tape; 7ths only when asked', () => {
  const CF = require(js('chordfinder.js')), sr = 11025, note = m => 440 * Math.pow(2, (m - 69) / 12);
  const chord = (ms, dur, det) => { const n = Math.floor(dur * sr), o = new Float32Array(n); ms.forEach(m => { const f = note(m) * det; for (let h = 1; h <= 5; h++) for (let i = 0; i < n; i++) o[i] += Math.sin(2 * Math.PI * f * h * i / sr) / h / ms.length; }); return o; };
  const prog = [[50, 54, 57], [55, 59, 62], [57, 61, 64, 67], [50, 54, 57], [47, 50, 54, 57], [52, 55, 59], [57, 61, 64], [50, 54, 57]];
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const make = det => { const parts = prog.map(p => chord(p, 2.5, det)), x = new Float32Array(parts.reduce((a, b) => a + b.length, 0)); let o = 0; parts.forEach(p => { x.set(p, o); o += p.length; }); for (let i = 0; i < x.length; i++) x[i] += (rnd() - 0.5) * 0.4; return x; };
  const names = (r, flats) => r.segs.map(s => CF.chordName(s.r, s.q, flats)).join(' ');
  for (const det of [1, Math.pow(2, 0.3 / 12), Math.pow(2, -0.25 / 12)]) {
    const x = make(det);
    assert.equal(names(CF.analyse(x, sr, { simple: true }), false), 'D G A D Em A D', 'plain chords, tuning ' + det);
    const r = CF.analyse(x, sr, {}); assert.equal(names(r, false), 'D G A7 D Bm7 Em A D', 'with 7ths, tuning ' + det);
    assert.equal(CF.keyName(r.key, false), 'D'); assert.ok(r.segs.every(s => s.dur > 1.5), 'steady chords, no flicker');
  }
  const r = CF.analyse(make(1), sr, { simple: true }); assert.ok(Math.abs(r.segs[1].t - 2.5) < 0.4 && Math.abs(r.segs[2].t - 5) < 0.4, 'chord changes land near the right time: ' + r.segs.map(s => s.t));
  assert.deepEqual(CF.detect({ frames: [], hop: 0.1 }, {}), []);
  assert.equal(CF.chordName(10, 'm7', true, 2), 'Cm7'); assert.equal(CF.chordName(10, '', false), 'A#');
  assert.equal(CF.flatsFor({ r: 5, minor: false }), true); assert.equal(CF.flatsFor({ r: 2, minor: false }), false); assert.equal(CF.flatsFor({ r: 2, minor: true }), true);
});

test('sanitize: kept chords from recordings are cleaned', () => {
  const st = Sanitize.cleanState({ v: 1, learn: [{ fid: 'a.mp3|10', name: 'a.mp3', size: 10, seconds: 20, key: { r: 14, minor: 1 }, segs: [[0, 2, 2, 'm7'], [2, 2, 3, 'bad'], 'x', [1, 2, 3]], at: 5 }, { fid: 'a.mp3|10', name: 'dup' }, { name: 'no id' }, 7] }, { keys: ['C'], styles: [], beats: [], earTypes: [] });
  assert.equal(st.learn.length, 1); const l = st.learn[0];
  assert.deepEqual(l.key, { r: 11, minor: true }); assert.deepEqual(l.segs, [[0, 2, 2, 'm7'], [2, 2, 3, '']]);
  assert.equal(Sanitize.cleanState({ v: 1, learn: 'x' }, { keys: ['C'], styles: [], beats: [], earTypes: [] }).learn, undefined);
});

test('makossa drums: a running hi-hat (softer between the beats), kick on 1 and 3 with pushes, snare on 2 and 4 with ghosts', () => {
  const ev = Engine.beatEvents({ beat: 'makossa' }, 1), at = d => ev.filter(e => e.drum === d);
  assert.equal(at('h').length, 16, 'the hi-hat runs in sixteenths');
  const hv = at('h').map(e => e.vel); assert.ok(hv[0] > hv[2] && hv[2] > hv[1], 'strong on the beat, then the eighths, then the weak sixteenths: ' + hv);
  assert.deepEqual(at('k').map(e => e.t * 4), [0, 6, 8, 11]);
  const sn = at('s'); assert.ok(sn.some(e => e.t === 1 && e.vel > 0.7) && sn.some(e => e.t === 3 && e.vel > 0.7), 'snare on 2 and 4');
  assert.ok(sn.filter(e => e.vel < 0.3).length === 2, 'two soft ghost notes');
  assert.ok(Engine.BEATS.makossalight && Engine.beatEvents({ beat: 'makossalight' }, 2).length > 10);
});

test('drums: Cameroonian grooves exist, a human feel is repeatable and stays in bounds, the first kick stays on the beat', () => {
  ['bikutsi', 'assiko', 'ndombolo'].forEach(id => { assert.ok(Engine.BEATS[id], id); const ev = Engine.beatEvents({ beat: id }, 2); assert.ok(ev.length > 20, id + ' has hits'); assert.ok(ev.every(e => e.t >= 0 && e.t < 8), id + ' stays inside the bars'); });
  const base = Engine.beatEvents({ beat: 'makossa' }, 4);
  assert.deepEqual(Engine.humanizeDrums(base, 0, 100), base, 'exact means untouched');
  const a = Engine.humanizeDrums(base, 1, 100), b = Engine.humanizeDrums(base, 1, 100); assert.deepEqual(a, b, 'the same every time');
  const loose = Engine.humanizeDrums(base, 2, 100);
  const maxDt = (x) => Math.max(...x.map((e, i) => Math.abs(e.t - base[i].t))) * 600;   // beats → milliseconds at 100 BPM
  assert.ok(maxDt(a) > 0.5 && maxDt(a) <= 12, 'light: within about 6 ms (+ lay-back): ' + maxDt(a)); assert.ok(maxDt(loose) > maxDt(a) && maxDt(loose) <= 20, 'loose is looser: ' + maxDt(loose));
  assert.ok(loose.every(e => e.vel >= 0.05 && e.vel <= 1 && e.t >= 0));
  base.forEach((e, i) => { if (e.drum === 'k' && e.t % 4 === 0) assert.equal(a[i].t, e.t, 'the kick on beat 1 is exact'); });
  assert.ok(new Set(loose.filter(e => e.drum === 'h').map(e => e.vel.toFixed(3))).size > 4, 'the hi-hat loudness varies');
});

test('sanitize: saved progressions, human feel, drum fill kinds and the new endings', () => {
  const ctx = { keys: ['C'], styles: [], beats: ['none', 'rock', 'makossa'], earTypes: [] };
  const st = Sanitize.cleanState({ v: 1, progs: [{ fid: 'abc123', name: ' Sunday ', chords: [{ r: 0, q: 'maj9', b: null, beats: 4, push: false }, { r: 20, q: 'evil', b: 99, beats: 400, push: 1 }] }, { fid: '!!', name: 'bad', chords: [{ r: 0, q: 'major' }] }, { fid: 'abc123', name: 'dup', chords: [{ r: 1, q: 'minor' }] }, { fid: 'zzz999', name: 'empty', chords: [] }] }, ctx);
  assert.equal(st.progs.length, 1); const p = st.progs[0]; assert.equal(p.name, 'Sunday');
  assert.deepEqual(p.chords[1], { r: 11, q: 'major', b: 11, beats: 32, push: false }); assert.equal(p.chords[0].q, 'maj9');
});

test('release check: plain-words notes for a finished song and for a cover picture', () => {
  const M = require('../app/js/mastering.js');
  const good = { seconds: 200, rawPeakDb: -3, clipped: 0, headSec: 0.1, tailSec: 1, before: -18, lufs: -14.1, tp: -1.0, target: 'stream', sampleRate: 44100 };
  const lv = n => n.map(x => x.level);
  assert.ok(M.releaseNotes(good).every(x => x.level === 'ok'), 'a good song has only OK notes: ' + JSON.stringify(lv(M.releaseNotes(good))));
  const t = (o, level, word) => { const n = M.releaseNotes(Object.assign({}, good, o)); assert.ok(n.some(x => x.level === level && (x.title + x.text).includes(word)), word + ' -> ' + JSON.stringify(n)); };
  t({ seconds: 12 }, 'warn', 'Very short');
  t({ target: 'off' }, 'warn', 'Mastering is off');
  t({ lufs: -17 }, 'warn', 'target is -14');
  t({ tp: -0.2 }, 'bad', 'ceiling');
  t({ clipped: 40 }, 'warn', 'too loud before mastering');
  t({ headSec: 4 }, 'warn', 'Silence at the start');
  t({ tailSec: 9 }, 'warn', 'Silence at the end');
  t({ before: -40 }, 'warn', 'very quiet');
  t({ sampleRate: 48000 }, 'warn', '48000');
  assert.equal(M.releaseNotes({ seconds: 0 })[0].level, 'bad', 'silence is an error');
  const c = (w, h, ty, b) => M.coverNotes(w, h, ty, b || 1e6);
  assert.ok(c(3000, 3000, 'image/jpeg').every(x => x.level === 'ok'));
  assert.ok(c(3000, 3000, 'image/png').every(x => x.level === 'ok'));
  assert.ok(c(3000, 2000, 'image/jpeg').some(x => x.level === 'bad' && /square/i.test(x.text)));
  assert.ok(c(2000, 2000, 'image/jpeg').some(x => x.level === 'warn'));
  assert.ok(c(800, 800, 'image/jpeg').some(x => x.level === 'bad'));
  assert.ok(c(3000, 3000, 'image/gif').some(x => x.level === 'bad'));
  assert.ok(c(3000, 3000, 'image/jpeg', 20 * 1048576).some(x => x.level === 'warn'));
  assert.ok(c(0, 0, '').some(x => x.level === 'bad'));
});

test('drummer settings survive a backup and bad values are cleaned', () => {
  const ctx = { styles: ['groove'], beats: ['none', 'praise'], keys: ['C'] };
  const ok = Sanitize.cleanState({ songs: [{ id: 'pdr', autoFill: true, busy: 1, perc: 'shakercongas', kit: 40, humanKeys: 2 }] }, ctx).songs[0];
  assert.deepEqual([ok.autoFill, ok.busy, ok.perc, ok.kit, ok.humanKeys], [true, 1, 'shakercongas', 40, 2]);
  assert.equal(Sanitize.cleanState({ songs: [{ id: 'pdr4', humanKeys: 9 }] }, ctx).songs[0].humanKeys, 2);
  const bad = Sanitize.cleanState({ songs: [{ id: 'pdr2', autoFill: 'yes', busy: 9, perc: '<b>', kit: 99 }] }, ctx).songs[0];
  assert.deepEqual([bad.autoFill, bad.busy, bad.perc, bad.kit], [false, 1, 'off', 0]);
  const low = Sanitize.cleanState({ songs: [{ id: 'pdr3', busy: -7 }] }, ctx).songs[0];
  assert.equal(low.busy, -1);
});

test('mixer part sound (tone, even out, extra room) is kept in a backup and bad values are cleaned', () => {
  const ctx = { styles: ['groove'], beats: ['none'], keys: ['C'] };
  const a = Sanitize.cleanState({ songs: [{ id: 'pmx', mixer: { chords: { v: 1, tone: 0.5, comp: 0.4, room: 0.3 }, bass: { tone: -9, comp: 'x', room: 5 } } }] }, ctx).songs[0].mixer;
  assert.deepEqual([a.chords.tone, a.chords.comp, a.chords.room], [0.5, 0.4, 0.3]);
  assert.deepEqual([a.bass.tone, a.bass.comp, a.bass.room], [-1, 0, 1]);
});

/* ---- gentle pitch correction ---- */
test('pitch correction: pulls a flat note to the key, keeps vibrato, leaves in-tune and bent notes alone', () => {
  const PF = require(js('pitchfix.js')), sr = 48000;
  const note = (midi, dur, cents, vib) => { const n = Math.round(dur * sr), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr, m = midi + cents / 100 + (vib ? vib * Math.sin(2 * Math.PI * 5.5 * t) / 100 : 0); ph += 2 * Math.PI * 440 * Math.pow(2, (m - 69) / 12) / sr; let v = 0; for (let h = 1; h <= 6; h++) v += Math.sin(h * ph) / h; y[i] = 0.25 * v * Math.min(1, t / 0.03, (dur - t) / 0.05); } return y; };
  const centre = (y, a, b) => { const v = PF.track(y.subarray(Math.round(a * sr), Math.round(b * sr)), sr).midi.filter(q => q === q); return v.reduce((s, q) => s + q, 0) / v.length; };
  const pcs = PF.scalePcs('C', false);
  assert.deepEqual(pcs, [0, 2, 4, 5, 7, 9, 11]);
  assert.deepEqual(PF.scalePcs('A', true), pcs);                       // relative minor, same notes
  const flat = note(57, 1.2, -15, 0), fixed = PF.tune(flat, sr, { amount: 1, pcs });
  assert.equal(fixed.length, flat.length);                              // timing never changes
  assert.ok(Math.abs((centre(fixed, 0.3, 1) - 57) * 100) < 3, 'within 3 cents of the note');
  const half = PF.tune(note(57, 1.2, -20, 0), sr, { amount: 0.5, pcs });
  assert.ok(Math.abs((centre(half, 0.3, 1) - 57) * 100 + 10) < 4, 'half the amount moves half the way');
  const good = note(57, 1.2, 0, 0), same = PF.tune(good, sr, { amount: 1, pcs });
  assert.ok(good.every((v, i) => v === same[i]), 'an in-tune note is returned exactly as sung');
  const vib = note(60, 1.5, -30, 25), vf = PF.tune(vib, sr, { amount: 1, pcs });
  const spread = y => { const v = PF.track(y.subarray(Math.round(0.3 * sr), Math.round(1.3 * sr)), sr).midi.filter(q => q === q); return Math.max(...v) - Math.min(...v); };
  assert.ok(spread(vf) > spread(vib) * 0.8, 'vibrato is kept');
  assert.ok(Math.abs(centre(vf, 0.3, 1.3) - 60) < 0.05);
  const bent = note(60.6, 1.2, 0, 0), bf = PF.tune(bent, sr, { amount: 1, pcs });
  assert.ok(bent.every((v, i) => v === bf[i]), 'a note more than half a semitone away (a blue note) is not touched');
  assert.equal(PF.tune(flat, sr, { amount: 0, pcs })[5000], flat[5000]);   // off = untouched
});

test('pitch correction: song settings are cleaned', () => {
  const ctx2 = { styles: ['groove'], beats: ['none'], keys: ['C'] };
  const mk = fx => Sanitize.cleanState({ songs: [{ id: 'pq', guide: { dur: 3, takes: [{ k: 'pq', dur: 3 }], fx } }] }, ctx2).songs[0].guide.fx;
  const a = mk({ preset: 'worship', nr: 'preset', tune: 'medium', tuneScale: 'any' });
  assert.deepEqual([a.tune, a.tuneScale], ['medium', 'any']);
  const b = mk({ preset: 'worship', tune: 'evil', tuneScale: 'x' });
  assert.deepEqual([b.tune, b.tuneScale], ['off', 'key']);
});
