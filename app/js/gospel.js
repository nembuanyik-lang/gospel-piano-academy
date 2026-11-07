'use strict';
/* ---------------------------------------------------------------- gospel ear training and the licks library (pure)
   Ear: real gospel progressions played in a random key after a short cadence that sets the key; the player names
   them by number (Nashville numbers), from simple moves up to the colours of gospel harmony.
   Licks: piano turnarounds, walk-ups, fills and endings, and vocal runs, written relative to the key (semitones from
   the key note, 0 = the key note at middle C) so each one can be played and practised in all twelve keys. */
const Gospel = (() => {
  const SC = (typeof Songcraft !== 'undefined') ? Songcraft : require('./songcraft.js');
  const E = (typeof Engine !== 'undefined') ? Engine : require('./engine.js');
  const C = (r, q, b) => ({ r, q, b: b === undefined ? null : b, beats: 2, push: false });
  /* progressions by level: name, chords (in C, relative), and what to listen for */
  const PROGS = [
    null,
    { label: 'Level 1: home, four and five', hint: 'Two-chord moves. Listen to the bass: does it rise a fourth, fall a fifth, or step?', items: [
      ['1 – 4', [C(0, 'major'), C(5, 'major')], 'the lift'], ['1 – 5', [C(0, 'major'), C(7, 'major')], 'up to five'], ['4 – 1', [C(5, 'major'), C(0, 'major')], 'the Amen'],
      ['5 – 1', [C(7, 'major'), C(0, 'major')], 'home'], ['1 – 6m', [C(0, 'major'), C(9, 'minor')], 'to the relative minor'], ['6m – 4', [C(9, 'minor'), C(5, 'major')], 'minor to four']] },
    { label: 'Level 2: the everyday progressions', hint: 'Four chords. Count the chords, then find where it goes home.', items: [
      ['1 – 4 – 5 – 1', [C(0, 'major'), C(5, 'major'), C(7, 'major'), C(0, 'major')], 'the hymn'], ['1 – 6m – 4 – 5', [C(0, 'major'), C(9, 'minor'), C(5, 'major'), C(7, 'major')], 'the fifties'],
      ['6m – 4 – 1 – 5', [C(9, 'minor'), C(5, 'major'), C(0, 'major'), C(7, 'major')], 'modern worship'], ['1 – 5 – 6m – 4', [C(0, 'major'), C(7, 'major'), C(9, 'minor'), C(5, 'major')], 'pop worship'],
      ['2m – 5 – 1', [C(2, 'minor'), C(7, 'major'), C(0, 'major')], 'the two-five-one'], ['4 – 5 – 3m – 6m', [C(5, 'major'), C(7, 'major'), C(4, 'minor'), C(9, 'minor')], 'climbing to six']] },
    { label: 'Level 3: gospel colours', hint: 'Sevenths, ninths and chords borrowed from outside the key. Listen for the chord that pulls.', items: [
      ['2m7 – 5⁷ – 1maj7', [C(2, 'm7'), C(7, '7'), C(0, 'maj7')], 'two-five-one with sevenths'], ['3⁷ – 6m', [C(4, '7'), C(9, 'minor')], 'the III7 pull'],
      ['6⁷ – 2m', [C(9, '7'), C(2, 'minor')], 'the VI7 pull'], ['1⁷ – 4', [C(0, '7'), C(5, 'major')], 'I7 into four'],
      ['4 – 4m – 1', [C(5, 'major'), C(5, 'minor'), C(0, 'major')], 'the gospel Amen (minor four)'], ['1 – 1/3 – 4', [C(0, 'major'), C(0, 'major', 4), C(5, 'major')], 'the walk-up'],
      ['4/5 – 1', [C(5, 'major', 7), C(0, 'major')], 'the gospel sus'], ['4 – ♯4°⁷ – 1/5', [C(5, 'major'), C(6, 'dim7'), C(0, 'major', 7)], 'passing diminished']] },
    { label: 'Level 4: the full vocabulary', hint: 'Longer moves, the circle of fifths, substitutions and church endings.', items: [
      ['3⁷ – 6⁷ – 2m7 – 5⁷ – 1', [C(4, '7'), C(9, '7'), C(2, 'm7'), C(7, '7'), C(0, 'maj7')], 'round the circle'], ['2m9 – ♭2⁹ – 1maj9', [C(2, 'm9'), C(1, '9'), C(0, 'maj9')], 'the tritone slide'],
      ['4m7 – ♭7⁹ – 1', [C(5, 'm7'), C(10, '9'), C(0, 'maj7')], 'the backdoor'], ['♭6 – ♭7 – 1', [C(8, 'major'), C(10, 'major'), C(0, 'major')], 'the church ending'],
      ['1 – ♯1°⁷ – 2m7 – 5⁷', [C(0, 'major'), C(1, 'dim7'), C(2, 'm7'), C(7, '7')], 'creeping up to two'], ['1 – 5/7 – 6m – 1/5', [C(0, 'major'), C(7, 'major', 11), C(9, 'minor'), C(0, 'major', 7)], 'the bass walks down'],
      ['6m9 – 2m9 – 5¹³ – 1maj9', [C(9, 'm9'), C(2, 'm9'), C(7, '13'), C(0, 'maj9')], 'neo-soul turnaround'], ['1 – 3⁷ – 4 – 4m', [C(0, 'major'), C(4, '7'), C(5, 'major'), C(5, 'minor')], 'the ballad sigh']] }
  ];
  // every progression's name is written by the app's own Nashville numbering, so the answers match the charts
  PROGS.forEach(L => { if (L) L.items.forEach(it => { it[0] = it[1].map(c => SC.describe('C', c).number).join(' – '); }); });
  const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  function rngOf(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  /* the cadence that sets the key, then the progression; options are four progressions of the level */
  function earQuestion(level, rng, o) {
    rng = rng || Math.random; o = o || {};
    const L = PROGS[Math.max(1, Math.min(PROGS.length - 1, level || 1))], idx = Math.floor(rng() * L.items.length), item = L.items[idx];
    const key = o.key || KEYS[Math.floor(rng() * 12)];
    const others = L.items.map((x, i) => i).filter(i => i !== idx).sort(() => rng() - 0.5).slice(0, 3), order = others.concat([idx]).sort(() => rng() - 0.5);
    const cad = [C(0, 'major'), C(5, 'major'), C(7, 'major'), C(0, 'major')].map(c => Object.assign({}, c, { beats: 1 }));
    const all = cad.concat([Object.assign(C(0, 'major'), { beats: 0, rest: true })]).concat(item[1]);
    const v = SC.voice(key, cad).concat(SC.voice(key, item[1]));
    const events = []; let t = 0;
    cad.forEach((c, i) => { events.push({ t, d: 0.95, notes: v[i].rh, vel: 0.55 }, { t, d: 0.95, notes: [v[i].bass], vel: 0.55, part: 'bass' }); t += 1; });
    t += 1;   // a beat of silence before the question
    item[1].forEach((c, i) => { const w = v[cad.length + i]; events.push({ t, d: c.beats * 0.97, notes: w.rh, vel: 0.68 }, { t, d: c.beats * 0.97, notes: [w.bass], vel: 0.68, part: 'bass' }); t += c.beats; });
    void all;
    return { level, key, name: item[0], why: item[2], options: order.map(i => L.items[i][0]), answer: order.indexOf(idx), chords: item[1],
      names: item[1].map(c => SC.describe(key, c).name), events, total: t, start: cad.length + 1 };
  }
  /* level up after 8 right of the last 10 at this level; down after 4 wrong of the last 6 */
  function nextLevel(st) {
    const h = (st.hist || []).slice(-10), lv = st.level || 1;
    if (h.length >= 10 && h.filter(Boolean).length >= 8 && lv < PROGS.length - 1) return lv + 1;
    const s = h.slice(-6); if (s.length >= 6 && s.filter(x => !x).length >= 4 && lv > 1) return lv - 1;
    return lv;
  }

  /* ---- licks: notes relative to the key note (0 = the key note at middle C); t and d in beats ---- */
  const ch = (t, d, notes, bass) => ({ t, d, notes, bass });
  const run = (start, step, list, d) => list.map((m, i) => ({ t: start + i * step, d: d || step * 0.95, notes: [m] }));
  const LICKS = [
    { id: 'tt251', cat: 'Turnarounds', name: '2–5–1 with ninths and thirteenths', level: 2, bpm: 72, hands: 'both',
      tip: 'The most used turnaround in gospel. Left hand plays the roots (2, 5, 1); the right hand moves as little as possible: F A C E, then B E F A, then B D E G.',
      ev: [ch(0, 2, [5, 9, 12, 16], -10), ch(2, 2, [-1, 4, 5, 9], -17), ch(4, 4, [-1, 2, 4, 7], -12)] },
    { id: 'circle', cat: 'Turnarounds', name: '3–6–2–5–1 round the circle', level: 3, bpm: 76, hands: 'both',
      tip: 'Every chord is the five of the next. Hear how each 7th pulls: E7 to A7 to Dm7 to G7 to C.',
      ev: [ch(0, 2, [2, 8, 11, 14], -20), ch(2, 2, [1, 7, 9, 13], -15), ch(4, 2, [0, 5, 9, 14], -22), ch(6, 2, [-1, 5, 7, 11], -17), ch(8, 4, [-1, 4, 7, 12], -12)] },
    { id: 'tritone', cat: 'Turnarounds', name: 'Tritone slide: 2m9 – ♭2⁹ – 1', level: 4, bpm: 70, hands: 'both',
      tip: 'Instead of the five chord, slide down a half step from two to the flat two, then home. The bass walks D, D♭, C.',
      ev: [ch(0, 2, [5, 9, 12, 16], -10), ch(2, 2, [5, 8, 11, 15], -11), ch(4, 4, [4, 7, 11, 14], -12)] },
    { id: 'walkup', cat: 'Walk-ups', name: 'The walk-up: 1 – 1/3 – 4', level: 1, bpm: 80, hands: 'both',
      tip: 'The bass climbs C, D, E, F while the right hand holds C and moves to F. Use it to lift into the four chord, like a congregation standing up.',
      ev: [ch(0, 1, [4, 7, 12], -12), ch(1, 1, [4, 7, 12], -10), ch(2, 1, [4, 7, 12], -8), ch(3, 3, [5, 9, 12], -7)] },
    { id: 'walkdown', cat: 'Walk-ups', name: 'The walk-down: 1 – 5/7 – 6m – 1/5', level: 2, bpm: 76, hands: 'both',
      tip: 'The bass steps down C, B, A, G under the chords. Hear it under "Amazing Grace"-style ballads.',
      ev: [ch(0, 2, [4, 7, 12], -12), ch(2, 2, [2, 7, 11], -13), ch(4, 2, [0, 4, 9], -15), ch(6, 2, [0, 4, 7], -17)] },
    { id: 'creep', cat: 'Walk-ups', name: 'Creep up with ♯1°⁷', level: 3, bpm: 72, hands: 'both',
      tip: 'Between one and two, a diminished chord on the sharp one: the bass climbs C, C♯, D. Very churchy.',
      ev: [ch(0, 2, [4, 7, 12], -12), ch(2, 2, [4, 7, 10, 13], -11), ch(4, 2, [5, 9, 12, 14], -10), ch(6, 2, [5, 7, 11, 14], -17)] },
    { id: 'blue', cat: 'Fills', name: 'The blue-note fill (♭3 to 3)', level: 1, bpm: 84, hands: 'right',
      tip: 'Slide from the flat three to the three, then up the pentatonic. Play it between the singer\'s lines, never over the words.',
      ev: run(0, 0.25, [15, 16, 19, 21, 24], 0.24).concat([{ t: 1.25, d: 0.75, notes: [16, 19, 24] }]) },
    { id: 'pentadown', cat: 'Fills', name: 'Pentatonic run down', level: 2, bpm: 76, hands: 'right',
      tip: 'Down the major pentatonic from the top, with a quick flat-three grace near the bottom. Keep the wrist loose; fingers 3-2-1, cross, 3-2-1.',
      ev: run(0, 0.25, [24, 21, 19, 16, 14, 12, 9, 7, 3, 4], 0.24).concat([{ t: 2.5, d: 1.5, notes: [0, 4, 7] }]) },
    { id: 'gospel6', cat: 'Fills', name: 'The 6th-chord shimmer', level: 2, bpm: 90, hands: 'right',
      tip: 'Rock between the 6 and the 5 over the one chord in quick sixteenths. A classic "answer" after the choir sings.',
      ev: run(0, 0.25, [9, 7, 9, 7, 12, 9, 7, 4], 0.24).concat([{ t: 2, d: 2, notes: [4, 7, 9, 12] }]) },
    { id: 'amen', cat: 'Endings', name: 'The Amen ending: 4 – 4m – 1', level: 1, bpm: 66, hands: 'both',
      tip: 'Four, then four minor (the A drops to A♭), then home. The sigh at the end of a hymn.',
      ev: [ch(0, 2, [5, 9, 12], -7), ch(2, 2, [5, 8, 12, 14], -7), ch(4, 4, [4, 7, 12], -12)] },
    { id: 'church', cat: 'Endings', name: 'Church ending: ♭6 – ♭7 – 1', level: 2, bpm: 70, hands: 'both',
      tip: 'Two big major chords from outside the key, rising by whole steps, then home with everything held. Add a roll on the last chord.',
      ev: [ch(0, 2, [3, 8, 12], -16), ch(2, 2, [5, 10, 14], -14), ch(4, 4, [4, 7, 12, 16], -12)] },
    { id: 'backdoor', cat: 'Endings', name: 'The backdoor: 4m7 – ♭7⁹ – 1', level: 3, bpm: 68, hands: 'both',
      tip: 'Arrive home through the back door: four minor seven, flat seven nine, then a major seven. Soft and soulful.',
      ev: [ch(0, 2, [3, 8, 12, 15], -7), ch(2, 2, [2, 8, 12, 14], -14), ch(4, 4, [4, 7, 11, 14], -12)] },
    { id: 'v54321', cat: 'Vocal runs', name: 'Down the scale: 5–4–3–2–1', level: 1, bpm: 70, voice: true,
      tip: 'Light and even, like a stone skipping down steps. Land firmly on 1. Sing on "oh" first, then on a word.',
      ev: run(0, 0.25, [7, 5, 4, 2], 0.24).concat([{ t: 1, d: 2, notes: [0] }]) },
    { id: 'vpenta', cat: 'Vocal runs', name: 'Pentatonic run: 8–6–5–3–2–1', level: 2, bpm: 66, voice: true,
      tip: 'Skips the 4 and the 7, which is what makes it sound like gospel. Keep each note clear: no sliding.',
      ev: run(0, 0.25, [12, 9, 7, 4, 2], 0.24).concat([{ t: 1.25, d: 2, notes: [0] }]) },
    { id: 'vblue', cat: 'Vocal runs', name: 'Blue turn: 3–♭3–2–1', level: 2, bpm: 66, voice: true,
      tip: 'The flat three is the "cry" in the voice. Touch it lightly on the way down.',
      ev: run(0, 1 / 3, [4, 3, 2], 0.32).concat([{ t: 1, d: 2, notes: [0] }]) },
    { id: 'vyes', cat: 'Vocal runs', name: 'The "Yes, Lord" run: 8–7–6–5–6–5–3–2–1', level: 3, bpm: 60, voice: true,
      tip: 'A long run with a turn around the 5. Practise it slowly in two halves, then join them. Breathe before it, not in the middle.',
      ev: run(0, 0.25, [12, 11, 9, 7, 9, 7, 4, 2], 0.24).concat([{ t: 2, d: 2, notes: [0] }]) },
    { id: 'vturn', cat: 'Vocal runs', name: 'Neighbour turn: 5–6–5–3–5', level: 1, bpm: 72, voice: true,
      tip: 'Step up and back to the 5, dip to the 3 and return. Good for the end of a line.',
      ev: run(0, 0.25, [7, 9, 7, 4], 0.24).concat([{ t: 1, d: 2, notes: [7] }]) }
  ];
  const CATS = ['Turnarounds', 'Walk-ups', 'Fills', 'Endings', 'Vocal runs'];
  /* the lick in a key: absolute MIDI events; the voice sits an octave lower for men's range when asked */
  function lickEvents(lick, keyName, o) {
    o = o || {};
    let kp = E.pcOfName(keyName); if (kp > 6) kp -= 12;   // keep keys near middle C
    const base = 60 + kp + (lick.voice && o.low ? -12 : 0), ev = [];
    lick.ev.forEach(e => {
      ev.push({ t: e.t, d: e.d, notes: e.notes.map(m => base + m), vel: 0.7 });
      if (e.bass !== undefined && e.bass !== null) { let b = base + e.bass; while (b < 36) b += 12; ev.push({ t: e.t, d: e.d, notes: [b], vel: 0.68, part: 'bass' }); }   // the bass stays on a 61-key keyboard
    });
    return ev;
  }
  const lickLength = lick => lick.ev.reduce((a, e) => Math.max(a, e.t + e.d), 0);
  /* the notes a player should play, in order (chords: lowest to highest at the same moment) */
  function expected(lick, keyName, o) {
    return lickEvents(lick, keyName, o).sort((a, b) => a.t - b.t || a.notes[0] - b.notes[0]).reduce((a, e) => a.concat(e.notes.slice().sort((x, y) => x - y).map(m => ({ m, t: e.t }))), []);
  }
  /* how well a played or sung line matches: notes in order (octave-free for the voice), as a fraction */
  function matchScore(played, want, o) {
    o = o || {};
    const eq = (a, b) => (o.octaveFree ? ((a - b) % 12 + 12) % 12 === 0 : a === b);
    // longest common subsequence of pitches
    const n = played.length, m = want.length, dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) dp[i][j] = eq(played[i - 1], want[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    const common = dp[n][m];
    return { score: m ? common / Math.max(m, n) : 0, common, extra: Math.max(0, n - common), missing: m - common };
  }
  /* the twelve keys in the order a teacher drills them: round the circle of fourths (the way gospel progressions move) */
  const DRILL_KEYS = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'F#', 'B', 'E', 'A', 'D', 'G'];
  return { PROGS, KEYS, earQuestion, nextLevel, rngOf, LICKS, CATS, lickEvents, lickLength, expected, matchScore, DRILL_KEYS };
})();
if (typeof module !== 'undefined') module.exports = Gospel;
