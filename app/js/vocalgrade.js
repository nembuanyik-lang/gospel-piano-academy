/* Gospel Music Academy — vocal grading and levels (pure, no DOM, no microphone).
   The Vocal Studio listens through the microphone; this file only turns what it heard into marks.
   Keeping it pure means the marking rules can be tested with made-up singing, without any sound. */
(function (root) {
'use strict';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
/* cents from the target, to the nearest octave (a man singing a woman's line still scores) */
function centsTo(m, target) { let c = (m - target) * 100; while (c > 600) c -= 1200; while (c < -600) c += 1200; return c; }
const pitchScore = c => c == null ? 0 : clamp(Math.round(100 - Math.max(0, Math.abs(c) - 10) * 2.2), 0, 100);
/* timing: within 0.10 s is perfect; every extra 0.1 s costs about 22 points */
const timingScore = err => err == null ? 0 : clamp(Math.round(100 - Math.max(0, Math.abs(err) - 0.10) * 220), 0, 100);

/* Notes sung against a clock.
   notes:  [{ m, s, e }]  target midi note, start and end in seconds from the first beat
   frames: [{ t, m }]     what the microphone heard, t in seconds from the same first beat (m null = no clear pitch)
   Each note gets a pitch mark (how close, in cents), a timing mark (how late or early it began) and one score:
   65% pitch, 35% timing. A repeated note joined to the one before it has no new start to judge, so its timing is not counted. */
function gradeNotes(notes, frames) {
  return notes.map((n, k) => {
    const dur = n.e - n.s, a = n.s + Math.min(0.15, dur * 0.25), b = n.e - 0.05;
    const cs = frames.filter(f => f.m != null && f.t >= a && f.t <= b).map(f => centsTo(f.m, n.m)).filter(c => Math.abs(c) < 150);
    if (cs.length < 2) return { cents: null, onset: null, timing: null, score: 0 };
    const cents = median(cs);
    const near = frames.filter(f => f.m != null && f.t >= n.s - 0.3 && f.t <= n.e && Math.abs(centsTo(f.m, n.m)) <= 100);
    const onset = near.length >= 2 ? near[0].t : null;
    const prev = notes[k - 1], joined = prev && prev.m === n.m && n.s - prev.e < 0.05;
    const err = onset == null ? null : onset - n.s, pS = pitchScore(cents);
    if (joined || err == null) return { cents, onset, timing: null, score: pS };
    return { cents, onset: err, timing: timingScore(err), score: Math.round(0.65 * pS + 0.35 * timingScore(err)) };
  });
}

/* Loudness. frames: [{ t, level }] while the singer is on the note (level = microphone amplitude).
   kind: 'cresc' (get louder), 'dim' (get softer), 'steady' (keep it even).
   Loudness is compared only with itself, so it does not matter how close the microphone is. */
const dB = x => 20 * Math.log10(Math.max(x, 1e-5));
function gradeDyn(frames, kind) {
  if (!frames || frames.length < 12) return { score: 0, rise: null, wobble: null, secs: 0, text: 'The note was too short or too quiet to judge. Hold one note for the whole time.' };
  const secs = frames[frames.length - 1].t - frames[0].t;
  // smooth to about 10 readings per second, so one noisy reading does not decide the mark
  const buckets = [], t0 = frames[0].t, step = 0.1;
  frames.forEach(f => { const i = Math.floor((f.t - t0) / step); (buckets[i] = buckets[i] || []).push(dB(f.level)); });
  const pts = buckets.map((b, i) => b && b.length ? { t: i * step, v: b.reduce((x, y) => x + y, 0) / b.length } : null).filter(Boolean);
  if (pts.length < 6) return { score: 0, rise: null, wobble: null, secs, text: 'The note was too short to judge.' };
  // the straight line through the loudness readings
  const n = pts.length, mt = pts.reduce((x, p) => x + p.t, 0) / n, mv = pts.reduce((x, p) => x + p.v, 0) / n;
  let num = 0, den = 0; pts.forEach(p => { num += (p.t - mt) * (p.v - mv); den += (p.t - mt) * (p.t - mt); });
  const slope = den ? num / den : 0, rise = slope * (pts[n - 1].t - pts[0].t);   // total change over the note, in dB
  const resid = Math.sqrt(pts.reduce((x, p) => x + Math.pow(p.v - (mv + slope * (p.t - mt)), 2), 0) / n);   // wobble around that line
  const wobble = Math.round(resid * 10) / 10;
  let score, text;
  if (kind === 'steady') {
    const sd = Math.sqrt(pts.reduce((x, p) => x + (p.v - mv) * (p.v - mv), 0) / n);
    score = clamp(Math.round(100 - Math.max(0, sd - 1.2) * 18), 0, 100);
    text = sd <= 1.5 ? 'Very even: the volume hardly moved.' : sd <= 3 ? 'Fairly even. A steadier flow of air will smooth it.' : 'The volume moved a lot (' + sd.toFixed(1) + ' dB). Let the breath flow at one speed.';
    return { score, rise: Math.round(rise * 10) / 10, wobble: Math.round(sd * 10) / 10, secs, text };
  }
  const want = kind === 'cresc' ? rise : -rise;
  // 8 dB or more in the right direction is a full swell; none or the wrong way scores nothing
  score = clamp(Math.round(clamp(want, 0, 8) / 8 * 85 + Math.max(0, 15 - wobble * 5)), 0, 100);
  if (want <= 0) score = Math.min(score, 15);
  text = want >= 8 ? 'A clear ' + (kind === 'cresc' ? 'swell: it grew about ' : 'fade: it dropped about ') + Math.round(want) + ' dB.' :
    want > 3 ? 'The right direction (' + Math.round(want) + ' dB), but go further: start softer and end fuller.' :
    want > 0 ? 'Only a small change. Start very softly and add air a little at a time.' : 'It went the other way. ' + (kind === 'cresc' ? 'Begin softly and grow.' : 'Begin firmly and fade away.');
  return { score, rise: Math.round(rise * 10) / 10, wobble, secs, text };
}

/* ---- rhythms for the phrase exercise: lengths in beats; each phrase fits in 4 beats ---- */
const PHRASE_RHYTHMS = [
  [1, 1, 2], [2, 1, 1], [1, 1, 1, 1], [1.5, 0.5, 1, 1], [1, 0.5, 0.5, 2], [2, 2], [0.5, 0.5, 1, 2], [1, 2, 1]
];

/* ---- the levels ----
   Every level has exercises with a pass mark (the best score so far), and a recorded checkpoint.
   need: { ex, min } best score; { sustain } seconds held; { range } the range has been measured. */
const VLEVELS = [
  { n: 1, name: 'First notes', about: 'Find your range and your first steady notes.', need: [{ range: true }, { ex: 'match', min: 60 }, { sustain: 4 }],
    check: 'Sing a hymn verse you know well, slowly, on "ah" or with the words, about one minute.' },
  { n: 2, name: 'In tune', about: 'Hearing the note and landing on it: scales and intervals.', need: [{ ex: 'five', min: 70 }, { ex: 'minor', min: 65 }, { ex: 'interval', min: 60 }],
    check: 'Sing a five-note scale up and down, then one verse of a song, in the key that suits your voice.' },
  { n: 3, name: 'Scales and phrases', about: 'A full scale, arpeggios and remembering short phrases.', need: [{ ex: 'scale', min: 70 }, { ex: 'arp', min: 70 }, { ex: 'echo', min: 70 }],
    check: 'Sing a full octave scale, then a chorus of a song from the Songbook.' },
  { n: 4, name: 'Breath and volume', about: 'Long notes, soft to loud, and even sound.', need: [{ sustain: 8 }, { ex: 'cresc', min: 65 }, { ex: 'steady', min: 65 }, { ex: 'phrase', min: 65 }],
    check: 'Sing one verse starting softly and growing to the last line. Then record it.' },
  { n: 5, name: 'Rhythm and runs', about: 'Singing on the beat, and gospel runs.', need: [{ ex: 'runs', min: 65 }, { ex: 'phrase', min: 75 }, { ex: 'song', min: 65 }],
    check: 'Sing a whole song from the Songbook with the backing track, and one clean gospel run at the end.' },
  { n: 6, name: 'Harmony', about: 'Holding your own part beside others.', need: [{ ex: 'harmony', min: 70 }, { ex: 'harm3m', min: 65 }, { ex: 'harm3l', min: 60 }, { ex: 'song', min: 80 }],
    check: 'Sing a hymn verse as a lead, then record yourself singing a harmony part under a recorded melody.' }
];

/* what the singer has done toward a level: [{ text, done, have }] and whether every exercise is passed */
function levelProgress(v, lv) {
  const best = (v && v.best) || {}, rows = lv.need.map(r => {
    if (r.range) return { text: 'Find your range', done: !!(v && v.range) };
    if (r.sustain) return { text: 'Hold one note for ' + r.sustain + ' seconds', done: ((v && v.sustain) || 0) >= r.sustain, have: v && v.sustain ? v.sustain + ' s' : '' };
    return { ex: r.ex, min: r.min, done: (best[r.ex] || 0) >= r.min, have: best[r.ex] != null ? String(best[r.ex]) : '' };
  });
  return { rows, passed: rows.every(r => r.done) };
}
/* the state of all levels: 'done' (exercises passed and checkpoint recorded), 'check' (passed, record it), 'open', 'locked'.
   A level opens when the one before is done, or when the starting test placed the singer at or past it. */
function levelStates(v) {
  const start = (v && v.start) || 1, out = [];
  let prev = null;
  VLEVELS.forEach(lv => {
    const pr = levelProgress(v, lv), rec = !!(v && v.check && v.check['L' + lv.n]);
    const open = lv.n <= start || prev === 'done';
    const st = !open ? 'locked' : pr.passed && rec ? 'done' : pr.passed ? 'check' : 'open';
    out.push({ n: lv.n, state: st, progress: pr, recorded: rec });
    prev = st;
  });
  return out;
}
/* the starting test: the average of the match and scale scores picks where to begin (a guide, never a limit) */
function placeStart(scores) {
  const a = scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : 0;
  return a >= 88 ? 3 : a >= 75 ? 2 : 1;
}

/* ---- singing a Songbook piece ----
   A song is a melody in scale degrees. This chooses the key and the octave so the whole melody sits in the singer's range,
   and gives the notes in seconds. */
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const pcOf = name => { const m = /^([A-G])([#b]?)$/.exec(name); return m ? (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12 : 0; };
const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MAJ = [0, 2, 4, 5, 7, 9, 11];
function songNotes(song, key, octave) {
  const base = 60 + pcOf(key) + 12 * (octave || 0), out = []; let t = 0;
  song.mel.forEach(pair => {
    const deg = pair[0], beats = pair[1];
    if (deg > 0) out.push({ m: base + MAJ[(deg - 1) % 7] + 12 * Math.floor((deg - 1) / 7), beat: t, beats });
    t += beats;
  });
  return out;
}
/* the key (and octave) that puts the melody nearest the middle of the singer's range; fits = the whole melody is inside */
function songKey(song, range) {
  const mid = (range.lo + range.hi) / 2; let best = null;
  KEYS.forEach(k => [-1, 0, 1].forEach(o => {
    const ms = songNotes(song, k, o).map(n => n.m), lo = Math.min.apply(null, ms), hi = Math.max.apply(null, ms);
    const fits = lo >= range.lo && hi <= range.hi, centre = Math.abs((lo + hi) / 2 - mid) + (song.key === k ? -0.5 : 0);
    const cost = (fits ? 0 : 100 + Math.max(0, range.lo - lo) + Math.max(0, hi - range.hi)) + centre;
    if (!best || cost < best.cost) best = { key: k, octave: o, lo, hi, fits, cost };
  }));
  return best;
}

const VocalGrade = { centsTo, pitchScore, timingScore, gradeNotes, gradeDyn, PHRASE_RHYTHMS, VLEVELS, levelProgress, levelStates, placeStart, songNotes, songKey, pcOf, KEYS };
if (typeof module !== 'undefined' && module.exports) module.exports = VocalGrade;
else root.VocalGrade = VocalGrade;
})(typeof window !== 'undefined' ? window : globalThis);
