/* Gospel Music Academy — music engine (pure functions, no DOM).
   Notes, spelling, chords, scales, chord recognition, progressions,
   voice leading, event builders, ear-training generators, scoring, streaks.
   Everything the UI needs from "music theory" lives here so the same logic can
   later be fed by MIDI input. */
(function (root) {
'use strict';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NAT = [0, 2, 4, 5, 7, 9, 11];
const ROOT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/* ---------- note names ---------- */
function accStr(n) { return n === 0 ? '' : (n > 0 ? '#'.repeat(n) : 'b'.repeat(-n)); }
function parseName(s) {
  const m = /^([A-G])([#b]*)(-?\d+)?$/.exec(String(s));
  if (!m) return null;
  const letter = LETTERS.indexOf(m[1]);
  let acc = 0;
  for (const ch of m[2]) acc += ch === '#' ? 1 : -1;
  return { letter, acc, oct: m[3] === undefined ? null : parseInt(m[3], 10) };
}
function pcOfName(s) {
  const p = parseName(s);
  if (!p) return null;
  return (((NAT[p.letter] + p.acc) % 12) + 12) % 12;
}
/* 'C4' -> {midi:60}; 'C' -> {pc:0}; numbers are midi */
function parseToken(t) {
  if (typeof t === 'number') return { midi: t, pc: ((t % 12) + 12) % 12 };
  const p = parseName(t);
  if (!p) return null;
  const pc = (((NAT[p.letter] + p.acc) % 12) + 12) % 12;
  if (p.oct === null) return { pc };
  return { midi: 12 * (p.oct + 1) + NAT[p.letter] + p.acc, pc };
}
function midiOf(t) { const p = parseToken(t); return p && p.midi !== undefined ? p.midi : null; }
function fmt(name) { return name ? name[0] + name.slice(1).replace(/#/g, '♯').replace(/b/g, '♭') : ''; }
function midiName(m, sharps) {
  const pc = ((m % 12) + 12) % 12;
  return (sharps ? SHARP_NAMES : ROOT_NAMES)[pc] + (Math.floor(m / 12) - 1);
}
function pcName(pc, sharps) { return (sharps ? SHARP_NAMES : ROOT_NAMES)[((pc % 12) + 12) % 12]; }
function isBlack(m) { return [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12); }

/* spell a note a given number of semitones/letter-steps above a root */
function spell(rootName, semis, steps) {
  const r = parseName(rootName);
  const rootPc = (NAT[r.letter] + r.acc + 120) % 12;
  const letter = (r.letter + steps) % 7;
  const pc = (rootPc + semis) % 12;
  const diff = ((pc - NAT[letter] + 18) % 12) - 6;
  return LETTERS[letter] + accStr(diff);
}

/* ---------- chords ---------- */
const QUALITIES = {
  major:  { sym: '',     label: 'major',            iv: [[0,0],[4,2],[7,4]] },
  minor:  { sym: 'm',    label: 'minor',            iv: [[0,0],[3,2],[7,4]] },
  dim:    { sym: 'dim',  label: 'diminished',       iv: [[0,0],[3,2],[6,4]] },
  aug:    { sym: 'aug',  label: 'augmented',        iv: [[0,0],[4,2],[8,4]] },
  sus2:   { sym: 'sus2', label: 'suspended 2nd',    iv: [[0,0],[2,1],[7,4]] },
  sus4:   { sym: 'sus4', label: 'suspended 4th',    iv: [[0,0],[5,3],[7,4]] },
  '6':    { sym: '6',    label: 'major 6th',        iv: [[0,0],[4,2],[7,4],[9,5]] },
  m6:     { sym: 'm6',   label: 'minor 6th',        iv: [[0,0],[3,2],[7,4],[9,5]] },
  maj7:   { sym: 'maj7', label: 'major 7th',        iv: [[0,0],[4,2],[7,4],[11,6]] },
  m7:     { sym: 'm7',   label: 'minor 7th',        iv: [[0,0],[3,2],[7,4],[10,6]] },
  '7':    { sym: '7',    label: 'dominant 7th',     iv: [[0,0],[4,2],[7,4],[10,6]] },
  m7b5:   { sym: 'm7♭5', label: 'half-diminished',  iv: [[0,0],[3,2],[6,4],[10,6]] },
  dim7:   { sym: 'dim7', label: 'diminished 7th',   iv: [[0,0],[3,2],[6,4],[9,6]] },
  '7sus4':{ sym: '7sus4',label: 'dominant 7 sus4',  iv: [[0,0],[5,3],[7,4],[10,6]] },
  add9:   { sym: 'add9', label: 'add 9',            iv: [[0,0],[4,2],[7,4],[14,1]] },
  '9':    { sym: '9',    label: 'dominant 9th',     iv: [[0,0],[4,2],[7,4],[10,6],[14,1]] },
  maj9:   { sym: 'maj9', label: 'major 9th',        iv: [[0,0],[4,2],[7,4],[11,6],[14,1]] },
  m9:     { sym: 'm9',   label: 'minor 9th',        iv: [[0,0],[3,2],[7,4],[10,6],[14,1]] },
  m11:    { sym: 'm11',  label: 'minor 11th',       iv: [[0,0],[3,2],[7,4],[10,6],[14,1],[17,3]] },
  '13':   { sym: '13',   label: 'dominant 13th',    iv: [[0,0],[4,2],[7,4],[10,6],[14,1],[21,5]] }
};
const CHORD_TONE_LABELS = {
  0: 'R', 2: '9', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♯5', 9: '6', 10: '♭7', 11: '7'
};
/* double accidentals read badly (C♯dim7 would list B𝄫); respell those to the plain enharmonic note */
function plainName(n, preferSharp) {
  const m = /^([A-G])(##|bb)$/.exec(n);
  if (!m) return n;
  return (preferSharp ? SHARP_NAMES : ROOT_NAMES)[pcOfName(n)];
}
function chordNames(rootName, quality) {
  const sharp = /#/.test(rootName);
  return QUALITIES[quality].iv.map(([s, st]) => plainName(spell(rootName, s, st), sharp));
}
function chordPcs(rootName, quality) {
  const r = pcOfName(rootName);
  return QUALITIES[quality].iv.map(([s]) => (r + s) % 12);
}
function chordSymbol(rootName, quality) { return fmt(rootName) + QUALITIES[quality].sym; }
/* ascending voicing from root at given octave, with inversion k */
function chordMidi(rootName, quality, oct, inv) {
  const base = 12 * ((oct === undefined ? 4 : oct) + 1) + pcOfName(rootName);
  const m = QUALITIES[quality].iv.map(([s]) => base + s);
  const k = inv || 0;
  for (let i = 0; i < k && i < m.length; i++) m[i] += 12;
  return m.sort((a, b) => a - b);
}
/* tone label for a pitch class relative to a root (R,3,5,7...) */
function toneLabel(pc, rootPc, quality) {
  const semis = (pc - rootPc + 12) % 12;
  return CHORD_TONE_LABELS[semis] || '';
}

/* ---------- chord recognition ---------- */
const DETECT_ORDER = ['major', 'minor', 'dim', 'aug', 'sus2', 'sus4', 'maj7', 'm7', '7', 'm7b5', 'dim7', '6', 'm6', '7sus4', 'add9', '9', 'maj9', 'm9', 'm11', '13'];
const TEMPLATE_SETS = {};
DETECT_ORDER.forEach(q => {
  TEMPLATE_SETS[q] = QUALITIES[q].iv.map(([s]) => s % 12).sort((a, b) => a - b).join(',');
});
function identifyChord(midis) {
  if (!midis || !midis.length) return null;
  const sorted = [...midis].sort((a, b) => a - b);
  const bassPc = ((sorted[0] % 12) + 12) % 12;
  const pcs = [...new Set(sorted.map(m => ((m % 12) + 12) % 12))];
  if (pcs.length < 3) return null;
  const cands = [];
  for (const r of pcs) {
    const key = pcs.map(p => (p - r + 12) % 12).sort((a, b) => a - b).join(',');
    for (let qi = 0; qi < DETECT_ORDER.length; qi++) {
      if (TEMPLATE_SETS[DETECT_ORDER[qi]] === key) cands.push({ r, q: DETECT_ORDER[qi], rank: (r === bassPc ? 0 : 100) + qi });
    }
  }
  if (!cands.length) return null;
  cands.sort((a, b) => a.rank - b.rank);
  const c = cands[0];
  const rootName = ROOT_NAMES[c.r];
  const names = chordNames(rootName, c.q);
  const ivs = QUALITIES[c.q].iv.map(([s]) => s % 12);
  const bassIdx = ivs.indexOf((bassPc - c.r + 12) % 12);
  const inversion = bassIdx < 0 ? 0 : bassIdx;
  const sym = chordSymbol(rootName, c.q);
  return {
    rootPc: c.r, rootName, quality: c.q, inversion,
    name: inversion > 0 ? sym + '/' + fmt(names[bassIdx]) : sym,
    symbol: sym, bassName: names[bassIdx]
  };
}
/* feedback for "expected X, played Y" */
function compareToChord(playedMidis, rootName, quality, opts) {
  opts = opts || {};
  const targetPcs = chordPcs(rootName, quality);
  const names = chordNames(rootName, quality);
  const played = [...new Set(playedMidis.map(m => ((m % 12) + 12) % 12))];
  const missing = []; const extra = [];
  targetPcs.forEach((p, i) => { if (!played.includes(p)) missing.push(names[i]); });
  played.forEach(p => { if (!targetPcs.includes(p)) extra.push(pcName(p)); });
  let status = 'correct';
  if (missing.length || extra.length) status = missing.length && !extra.length ? 'missing' : (extra.length && !missing.length ? 'extra' : 'wrong');
  const sorted = [...playedMidis].sort((a, b) => a - b);
  if (status === 'correct' && opts.lowestPc !== undefined && opts.lowestPc !== null) {
    if (((sorted[0] % 12) + 12) % 12 !== opts.lowestPc) status = 'inversion';
  }
  if (status === 'correct' && opts.bassBelow !== undefined && opts.bassBelow !== null) {
    if (sorted[0] >= opts.bassBelow || ((sorted[0] % 12) + 12) % 12 !== pcOfName(rootName)) status = 'bass';
  }
  const sym = chordSymbol(rootName, quality);
  let message;
  if (status === 'correct') message = 'Correct! That is ' + sym + '.';
  else if (status === 'missing') message = 'Almost! Add ' + missing.map(fmt).join(' and ') + ' to complete ' + sym + '.';
  else if (status === 'extra') message = 'Close. ' + extra.map(fmt).join(' and ') + (extra.length > 1 ? ' do' : ' does') + ' not belong in ' + sym + '.';
  else if (status === 'inversion') message = 'Right notes. For this exercise the lowest note should be ' + fmt(names[opts.lowestIdx || 0]) + '.';
  else if (status === 'bass') message = 'Right notes. Play the bass note ' + fmt(rootName) + ' low in the left hand, below the chord.';
  else message = 'Not yet. ' + sym + ' is ' + names.map(fmt).join(' – ') + '.';
  return { status, missing, extra, message, symbol: sym };
}

/* compare what was played with an exact voicing (a list of MIDI notes). Pitch classes must match; optionally the lowest note and a minimum spread. */
function compareToVoicing(playedMidis, targetMidis, name, opts) {
  opts = opts || {};
  const targetPcs = [...new Set(targetMidis.map(m => ((m % 12) + 12) % 12))];
  const played = [...new Set(playedMidis.map(m => ((m % 12) + 12) % 12))];
  const missing = targetPcs.filter(p => !played.includes(p)).map(pcName);
  const extra = played.filter(p => !targetPcs.includes(p)).map(pcName);
  const sorted = [...playedMidis].sort((a, b) => a - b);
  const lowTarget = Math.min.apply(null, targetMidis);
  let status = 'correct';
  if (missing.length || extra.length) status = missing.length && !extra.length ? 'missing' : (extra.length && !missing.length ? 'extra' : 'wrong');
  else if (opts.low && ((sorted[0] % 12) + 12) % 12 !== ((lowTarget % 12) + 12) % 12) status = 'low';
  else if (opts.span && sorted[sorted.length - 1] - sorted[0] < opts.span) status = 'span';
  let message;
  if (status === 'correct') message = 'Correct! That is ' + name + '.';
  else if (status === 'missing') message = 'Almost! Add ' + missing.map(fmt).join(' and ') + ' to complete ' + name + '.';
  else if (status === 'extra') message = 'Close. ' + extra.map(fmt).join(' and ') + (extra.length > 1 ? ' do' : ' does') + ' not belong in ' + name + '.';
  else if (status === 'low') message = 'Right notes. The lowest note should be ' + fmt(pcName(lowTarget)) + '.';
  else if (status === 'span') message = 'Right notes, but spread them out: put the lowest note well below the rest, as shown.';
  else message = 'Not yet. ' + name + ' is ' + targetPcs.map(pcName).map(fmt).join(' – ') + '.';
  return { status, missing, extra, message, symbol: name };
}

/* ---------- scales ---------- */
const SCALES = {
  major:      { label: 'Major',            iv: [[0,0],[2,1],[4,2],[5,3],[7,4],[9,5],[11,6]] },
  minor:      { label: 'Natural minor',    iv: [[0,0],[2,1],[3,2],[5,3],[7,4],[8,5],[10,6]] },
  harmonic:   { label: 'Harmonic minor',   iv: [[0,0],[2,1],[3,2],[5,3],[7,4],[8,5],[11,6]] },
  melodic:    { label: 'Melodic minor (up)', iv: [[0,0],[2,1],[3,2],[5,3],[7,4],[9,5],[11,6]] },
  dorian:     { label: 'Dorian',           iv: [[0,0],[2,1],[3,2],[5,3],[7,4],[9,5],[10,6]] },
  mixolydian: { label: 'Mixolydian',       iv: [[0,0],[2,1],[4,2],[5,3],[7,4],[9,5],[10,6]] },
  majpent:    { label: 'Major pentatonic', iv: [[0,0],[2,1],[4,2],[7,4],[9,5]] },
  minpent:    { label: 'Minor pentatonic', iv: [[0,0],[3,2],[5,3],[7,4],[10,6]] },
  blues:      { label: 'Blues',            iv: [[0,0],[3,2],[5,3],[6,4],[7,4],[10,6]] }
};
function scaleNotes(rootName, type) { return SCALES[type].iv.map(([s, st]) => spell(rootName, s, st)); }
function scaleMidis(rootName, type, oct, withOctave) {
  const base = 12 * (oct + 1) + pcOfName(rootName);
  const m = SCALES[type].iv.map(([s]) => base + s);
  if (withOctave !== false) m.push(base + 12);
  return m;
}
/* 'C4' style tokens for a scale (exact octave) */
function scaleTokens(rootName, type, oct) {
  const names = scaleNotes(rootName, type);
  const base = 12 * (oct + 1) + pcOfName(rootName);
  const out = [];
  SCALES[type].iv.forEach(([s], i) => {
    const m = base + s;
    /* the octave number belongs to the letter, not the sound: C♭5 sounds as B4, B♯3 sounds as C4 */
    const acc = (names[i].match(/#/g) || []).length - (names[i].slice(1).match(/b/g) || []).length;
    out.push(names[i] + (Math.floor((m - acc) / 12) - 1));
  });
  out.push(names[0] + (parseInt(out[0].match(/-?\d+$/)[0], 10) + 1));
  return out;
}

/* ---------- harmony in a key ---------- */
const DIA_TRIAD = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'];
const DIA_SEVENTH = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];
const ROMAN_BASE = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const LOWER_Q = new Set(['minor', 'dim', 'm7', 'm7b5', 'm6', 'm9', 'm11', 'dim7']);
const ROMAN_SUF = { major: '', minor: '', dim: '°', aug: '+', maj7: 'maj7', m7: '7', '7': '7', m7b5: 'ø7', dim7: '°7', sus2: 'sus2', sus4: 'sus4', add9: 'add9', '6': '6', m6: '6', '9': '9', maj9: 'maj9', m9: '9', m11: '11', '13': '13', '7sus4': '7sus4' };
const NUM_SUF = { major: '', minor: 'm', dim: '°', aug: '+', maj7: 'maj7', m7: 'm7', '7': '⁷', m7b5: 'm7♭5', dim7: '°7', sus2: 'sus2', sus4: 'sus4', add9: 'add9', '6': '6', m6: 'm6', '9': '⁹', maj9: 'maj9', m9: 'm9', m11: 'm11', '13': '¹³', '7sus4': '⁷sus4' };
function romanFor(degIdx, quality) {
  const b = ROMAN_BASE[degIdx];
  return (LOWER_Q.has(quality) ? b.toLowerCase() : b) + (ROMAN_SUF[quality] || '');
}
function numberFor(degIdx, quality) { return String(degIdx + 1) + (NUM_SUF[quality] || ''); }
function diatonic(keyRoot, sevenths) {
  const notes = scaleNotes(keyRoot, 'major');
  return notes.map((n, i) => {
    const q = sevenths ? DIA_SEVENTH[i] : DIA_TRIAD[i];
    return { deg: i + 1, root: n, quality: q, name: chordSymbol(n, q), roman: romanFor(i, q), number: numberFor(i, q) };
  });
}
const PROGRESSIONS = [
  { id: 'I-IV-V-I',  name: 'I – IV – V – I',   degs: [1,4,5,1], sev: false, tag: 'Classic', note: 'The backbone of hymns, praise songs and early gospel. Home, step away, tension, home.' },
  { id: 'I-V-vi-IV', name: 'I – V – vi – IV',  degs: [1,5,6,4], sev: false, tag: 'Worship', note: 'The most common worship progression. Open, lifting and easy to sing over.' },
  { id: 'vi-IV-I-V', name: 'vi – IV – I – V',  degs: [6,4,1,5], sev: false, tag: 'Worship', note: 'Same four chords as I–V–vi–IV, started from the minor chord for a more reflective mood.' },
  { id: 'I-vi-IV-V', name: 'I – vi – IV – V',  degs: [1,6,4,5], sev: false, tag: 'Classic', note: 'The "50s progression". Warm and familiar, common in slower gospel ballads.' },
  { id: 'IV-I',      name: 'IV – I (Amen)',    degs: [4,1],     sev: false, tag: 'Gospel',  note: 'The plagal or "Amen" cadence. Used to end songs and prayers.' },
  { id: 'I-iii-IV-V',name: 'I – iii – IV – V', degs: [1,3,4,5], sev: false, tag: 'Gospel',  note: 'A climbing progression. The bass walks up C–E–F–G, very common in gospel.' },
  { id: 'ii-V-I',    name: 'ii – V – I',       degs: [2,5,1],   sev: true,  tag: 'Gospel',  note: 'The strongest resolution in harmony. Played with 7th chords it sounds rich and gospel-ready.' },
  { id: 'ii-V-I-vi', name: 'ii – V – I – vi',  degs: [2,5,1,6], sev: true,  tag: 'Gospel',  note: 'Resolves home, then slides to the relative minor so the phrase can keep going.' },
  { id: 'I-vi-ii-V', name: 'I – vi – ii – V',  degs: [1,6,2,5], sev: true,  tag: 'Gospel',  note: 'The classic turnaround. Four chords that circle back to the start.' }
];
function progressionChords(keyRoot, degs, sevenths) {
  const d = diatonic(keyRoot, !!sevenths);
  return degs.map(n => d[n - 1]);
}
/* voice-led right-hand voicings (close position, each chord near the last) + bass */
function voiceProgression(chords) {
  const out = [];
  let prev = null;
  chords.forEach(ch => {
    const base = chordMidi(ch.root, ch.quality, 4, 0);
    const n = base.length;
    const cands = [];
    for (let inv = 0; inv < n; inv++) {
      const v = base.slice();
      for (let i = 0; i < inv; i++) v[i] += 12;
      v.sort((a, b) => a - b);
      for (const sh of [-12, 0, 12]) {
        const w = v.map(x => x + sh);
        if (w[0] < 52 || w[w.length - 1] > 79) continue;
        let cost;
        if (prev) {
          cost = 0;
          const L = Math.min(prev.length, w.length);
          for (let i = 0; i < L; i++) cost += Math.abs(prev[i] - w[i]);
          cost += Math.abs(prev.length - w.length) * 4;
        } else {
          const mean = w.reduce((a, b) => a + b, 0) / w.length;
          cost = Math.abs(mean - 64) + (inv === 0 ? 0 : 3);
        }
        cands.push({ w, cost });
      }
    }
    cands.sort((a, b) => a.cost - b.cost);
    prev = cands[0].w;
    out.push({ rh: prev, bass: 36 + pcOfName(ch.root) });
  });
  return out;
}

/* ---------- events (beats-based) ---------- */
function seqEvents(midis, d) { d = d || 1; return midis.map((m, i) => ({ t: i * d, d: d * 0.95, notes: [m] })); }
function arpEvents(midis, d) { return seqEvents(midis, d || 0.5); }
function blockEvent(midis, t, d) { return { t: t || 0, d: d || 2, notes: midis }; }
const STYLES = {
  whole:  { label: 'Whole notes' },
  pulse:  { label: 'Quarter pulse' },
  arp:    { label: 'Arpeggio' },
  groove: { label: 'Gospel groove' }
};
function progEvents(voiced, style, beatsPerChord) {
  const bpc = beatsPerChord || 4;
  const ev = [];
  voiced.forEach((v, i) => {
    const t0 = i * bpc;
    if (style === 'pulse') {
      for (let b = 0; b < bpc; b++) ev.push({ t: t0 + b, d: 0.9, notes: b === 0 ? v.rh.concat([v.bass]) : v.rh });
    } else if (style === 'arp') {
      const seq = [v.bass].concat(v.rh, v.rh.slice().reverse().slice(1));
      const step = bpc / Math.max(8, seq.length);
      const stepUse = 0.5;
      for (let k = 0; k < bpc / stepUse; k++) ev.push({ t: t0 + k * stepUse, d: 0.9, notes: [seq[k % seq.length]] });
      void step;
    } else if (style === 'groove') {
      ev.push({ t: t0, d: 1.9, notes: [v.bass] });
      if (bpc >= 3) ev.push({ t: t0 + 2, d: 1.9, notes: [v.bass + (v.bass < 48 ? 7 : 0)] });
      for (let k = 0; k < bpc; k++) ev.push({ t: t0 + k + 0.5, d: 0.4, notes: v.rh });
    } else {
      ev.push({ t: t0, d: bpc * 0.97, notes: v.rh.concat([v.bass]) });
    }
  });
  return ev;
}
/* compact spec -> {events,bpm,total} for the audio player */
function toEvents(spec) {
  const bpm = spec.bpm || 90;
  let events = [];
  if (spec.kind === 'notes') {
    const m = spec.notes.map(midiOf);
    if (spec.mode === 'block') events = [blockEvent(m, 0, spec.d || 2)];
    else events = seqEvents(m, spec.d || 1);
  } else if (spec.kind === 'chord') {
    const m = chordMidi(spec.root, spec.quality, spec.oct || 4, spec.inv || 0);
    if (spec.bass) m.unshift(12 * 3 + pcOfName(spec.root));
    if (spec.mode === 'arp') events = arpEvents(m, 0.5);
    else if (spec.mode === 'both') {
      events = arpEvents(m.filter(x => x >= 48), 0.5);
      events.push(blockEvent(m, events.length * 0.5 + 0.25, 2.5));
    } else events = [blockEvent(m, 0, spec.d || 2.5)];
  } else if (spec.kind === 'chords') {
    spec.list.forEach((c, i) => {
      const m = chordMidi(c.root, c.quality, c.oct || 4, c.inv || 0);
      if (c.bass) m.unshift(12 * 3 + pcOfName(c.root));
      events.push(blockEvent(m, i * (spec.d || 2), (spec.d || 2) * 0.95));
    });
  } else if (spec.kind === 'prog') {
    const chs = progressionChords(spec.key || 'C', spec.degs, spec.sevenths);
    events = progEvents(voiceProgression(chs), spec.style || 'whole', spec.bpc || 4);
  } else if (spec.kind === 'voicings') {
    spec.list.forEach((v, i) => events.push(blockEvent(v.notes.map(midiOf), i * (spec.d || 2), (spec.d || 2) * 0.95)));
  } else if (spec.kind === 'metro') {
    const bars = spec.bars || 2; const bpb = spec.bpb || 4;
    for (let i = 0; i < bars * bpb; i++) events.push({ t: i, d: 0.2, click: i % bpb === 0 ? 2 : 1 });
  } else if (spec.kind === 'rhythm') {
    let t = 0;
    spec.pattern.forEach(d => { events.push({ t, d: d * 0.9, notes: [spec.note || 67] }); t += d; });
  }
  const total = events.reduce((a, e) => Math.max(a, e.t + e.d), 0);
  return { events, bpm, total };
}

/* ---------- scoring ---------- */
function scoreTaps(taps, beats, tol) {
  tol = tol === undefined ? 0.18 : tol;
  const used = new Set();
  let hits = 0; let errSum = 0;
  const matched = [];
  beats.forEach(b => {
    let best = -1; let bestD = Infinity;
    taps.forEach((t, i) => {
      if (used.has(i)) return;
      const dd = Math.abs(t - b);
      if (dd < bestD) { bestD = dd; best = i; }
    });
    if (best >= 0 && bestD <= tol) { used.add(best); hits++; errSum += bestD; matched.push(true); } else matched.push(false);
  });
  const total = beats.length;
  return { matched, hits, total, avgErrMs: hits ? Math.round((errSum / hits) * 1000) : null, pass: total > 0 && hits / total >= 0.75, extra: taps.length - hits };
}
/* steadiness of a played run: 0..100 from the spread of the gaps between notes */
function steadiness(times) {
  if (times.length < 3) return null;
  const gaps = [];
  for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const sd = Math.sqrt(gaps.reduce((a, g) => a + (g - mean) * (g - mean), 0) / gaps.length);
  return Math.max(0, Math.round(100 - (sd / mean) * 100));
}

/* ---------- dates, streaks, ranks ---------- */
function dateStr(d) {
  d = d || new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function addDays(str, n) {
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return dateStr(dt);
}
function streak(days, today, minSec) {
  minSec = minSec || 60;
  let cur = today;
  if (!((days[cur] || 0) >= minSec)) cur = addDays(today, -1);
  let n = 0;
  while ((days[cur] || 0) >= minSec) { n++; cur = addDays(cur, -1); }
  return n;
}
const RANKS = [
  { min: 0, name: 'Listener' }, { min: 150, name: 'Learner' }, { min: 400, name: 'Player' },
  { min: 800, name: 'Accompanist' }, { min: 1500, name: 'Arranger' }, { min: 3000, name: 'Minister of Music' }
];
function rankFor(xp) {
  let i = 0;
  RANKS.forEach((r, k) => { if (xp >= r.min) i = k; });
  const next = RANKS[i + 1];
  return { index: i, level: i + 1, name: RANKS[i].name, min: RANKS[i].min, next: next ? next.min : null, nextName: next ? next.name : null,
    pct: next ? Math.round(((xp - RANKS[i].min) / (next.min - RANKS[i].min)) * 100) : 100 };
}

/* ---------- ear training ---------- */
const INTERVALS = { 1: 'minor 2nd', 2: 'major 2nd', 3: 'minor 3rd', 4: 'major 3rd', 5: 'perfect 4th', 6: 'tritone', 7: 'perfect 5th', 8: 'minor 6th', 9: 'major 6th', 10: 'minor 7th', 11: 'major 7th', 12: 'octave' };
const MELODIES = [
  { name: 'Joyful, Joyful (Ode to Joy)', notes: ['E4','E4','F4','G4','G4','F4','E4','D4','C4','C4','D4','E4','E4','D4','D4'] },
  { name: 'Twinkle, Twinkle, Little Star', notes: ['C4','C4','G4','G4','A4','A4','G4','F4','F4','E4','E4','D4','D4','C4'] },
  { name: 'Mary Had a Little Lamb', notes: ['E4','D4','C4','D4','E4','E4','E4','D4','D4','D4','E4','G4','G4'] },
  { name: 'Row, Row, Row Your Boat', notes: ['C4','C4','C4','D4','E4','E4','D4','E4','F4','G4'] }
];
const EAR_TYPES = {
  note:        { label: 'Higher or lower', hint: 'Two notes. Is the second higher or lower?', levels: 3 },
  interval:    { label: 'Intervals', hint: 'Name the distance between two notes.', levels: 3 },
  chord:       { label: 'Chord quality', hint: 'Major, minor, diminished, 7th…', levels: 4 },
  bass:        { label: 'Bass note', hint: 'Which note is lowest in the chord?', levels: 2 },
  progression: { label: 'Progressions', hint: 'Which chord progression is it?', levels: 3 },
  degree:      { label: 'Key centre', hint: 'Hear the key, then name the scale degree.', levels: 3 },
  melody:      { label: 'Name the melody', hint: 'Which tune is it?', levels: 1 },
  echo:        { label: 'Echo on keys', hint: 'Listen, then play it back on the keyboard.', levels: 3 }
};
function mulberry(seed) {
  let a = seed >>> 0;
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pick(arr, rng) { return arr[Math.floor((rng || Math.random)() * arr.length)]; }
function shuffle(arr, rng) {
  const a = arr.slice(); rng = rng || Math.random;
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function earQuestion(type, level, rng) {
  rng = rng || Math.random; level = Math.max(1, level || 1);
  const q = { type, level };
  if (type === 'note') {
    const lo = 55 + Math.floor(rng() * 10);
    const gaps = level === 1 ? [7, 9, 12] : level === 2 ? [3, 4, 5] : [1, 2, 3];
    const g = pick(gaps, rng); const up = rng() < 0.5;
    const a = lo; const b = up ? lo + g : lo - g;
    q.prompt = 'Is the second note higher or lower than the first?';
    q.options = ['Higher', 'Lower']; q.answer = up ? 0 : 1;
    q.events = seqEvents([a, b], 1.2); q.bpm = 70;
    q.explain = 'The second note was ' + (up ? 'higher' : 'lower') + ' by ' + g + ' semitone' + (g > 1 ? 's' : '') + '.';
  } else if (type === 'interval') {
    const sets = [[4, 7, 12], [3, 4, 5, 7, 12], [2, 3, 4, 5, 7, 9, 12]];
    const pool = sets[Math.min(level, 3) - 1];
    const s = pick(pool, rng); const lo = 55 + Math.floor(rng() * 8);
    q.prompt = 'What interval did you hear?';
    const opts = shuffle(pool, rng).slice(0, Math.min(pool.length, 4));
    if (!opts.includes(s)) opts[0] = s;
    q.options = shuffle(opts, rng).map(x => INTERVALS[x]);
    q.answer = q.options.indexOf(INTERVALS[s]);
    q.events = seqEvents([lo, lo + s], 1.2); q.bpm = 70;
    q.explain = 'That was a ' + INTERVALS[s] + ' (' + s + ' semitones).';
  } else if (type === 'chord') {
    const sets = [['major', 'minor'], ['major', 'minor', 'dim', 'aug'], ['major', 'minor', 'maj7', 'm7', '7'], ['major', 'minor', 'dim', 'maj7', 'm7', '7', 'm7b5']];
    const pool = sets[Math.min(level, 4) - 1];
    const quality = pick(pool, rng); const rootName = pick(ROOT_NAMES, rng);
    q.prompt = 'What kind of chord is this?';
    q.options = pool.map(x => QUALITIES[x].label); q.answer = pool.indexOf(quality);
    q.events = [blockEvent(chordMidi(rootName, quality, 4, 0), 0, 2.6)]; q.bpm = 70;
    q.explain = chordSymbol(rootName, quality) + ' is a ' + QUALITIES[quality].label + ' chord: ' + chordNames(rootName, quality).map(fmt).join(' – ') + '.';
    q.show = chordMidi(rootName, quality, 4, 0);
  } else if (type === 'bass') {
    const quality = pick(level === 1 ? ['major', 'minor'] : ['major', 'minor', '7', 'maj7'], rng);
    const rootName = pick(ROOT_NAMES, rng);
    const rootPc = pcOfName(rootName);
    const decoys = shuffle(ROOT_NAMES.filter(n => pcOfName(n) !== rootPc), rng).slice(0, 3);
    const opts = shuffle([rootName].concat(decoys), rng);
    q.prompt = 'Which note is the bass (lowest note)?';
    q.options = opts.map(fmt); q.answer = opts.indexOf(rootName);
    q.events = [blockEvent([36 + rootPc].concat(chordMidi(rootName, quality, 4, 0)), 0, 2.8)]; q.bpm = 70;
    q.explain = 'The bass note was ' + fmt(rootName) + ', the root of ' + chordSymbol(rootName, quality) + '.';
  } else if (type === 'progression') {
    const ids = level === 1 ? ['I-IV-V-I', 'I-V-vi-IV', 'IV-I'] : level === 2 ? ['I-IV-V-I', 'I-V-vi-IV', 'vi-IV-I-V', 'I-vi-IV-V'] : ['I-V-vi-IV', 'vi-IV-I-V', 'I-vi-ii-V', 'ii-V-I-vi', 'I-iii-IV-V'];
    const id = pick(ids, rng); const p = PROGRESSIONS.find(x => x.id === id);
    const key = pick(['C', 'G', 'F', 'D', 'Bb', 'A', 'Eb'], rng);
    q.prompt = 'Which progression is this? (numbers are scale degrees)';
    q.options = ids.map(i => PROGRESSIONS.find(x => x.id === i).name); q.answer = ids.indexOf(id);
    q.events = progEvents(voiceProgression(progressionChords(key, p.degs, p.sev)), 'whole', 2); q.bpm = 90;
    q.explain = 'In ' + fmt(key) + ' that was ' + progressionChords(key, p.degs, p.sev).map(c => c.name).join(' – ') + '.';
  } else if (type === 'degree') {
    const key = pick(['C', 'G', 'F', 'D', 'Bb'], rng);
    const degs = level === 1 ? [1, 3, 5] : level === 2 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7];
    const d = pick(degs, rng);
    const kPc = pcOfName(key);
    const scale = SCALES.major.iv.map(([s]) => s);
    const note = 60 + ((kPc + scale[d - 1]) % 12);
    const cad = progEvents(voiceProgression(progressionChords(key, [1, 4, 5, 1], false)), 'whole', 1.5);
    const tEnd = cad.reduce((a, e) => Math.max(a, e.t + e.d), 0);
    q.prompt = 'The chords set the key. Which scale degree is the final single note?';
    q.options = degs.map(String); q.answer = degs.indexOf(d);
    q.events = cad.concat([{ t: tEnd + 0.5, d: 2, notes: [note + 12 * (note < 60 ? 1 : 0)] }]); q.bpm = 80;
    q.explain = 'The note was degree ' + d + ' of ' + fmt(key) + ' major (' + fmt(scaleNotes(key, 'major')[d - 1]) + ').';
  } else if (type === 'melody') {
    const m = pick(MELODIES, rng);
    const opts = shuffle(MELODIES, rng);
    q.prompt = 'Which tune is this?';
    q.options = opts.map(x => x.name); q.answer = opts.indexOf(m);
    q.events = seqEvents(m.notes.slice(0, 8).map(midiOf), 0.8); q.bpm = 100;
    q.explain = 'That was ' + m.name + '.';
  } else if (type === 'echo') {
    const len = level + 2;
    const pent = [0, 2, 4, 7, 9]; const base = 60;
    const midis = []; let last = null;
    for (let i = 0; i < len; i++) {
      let m; do { m = base + pick(pent, rng) + (rng() < 0.3 ? 12 : 0); } while (m === last && pent.length > 1);
      midis.push(m); last = m;
    }
    q.prompt = 'Listen, then play it back on the keyboard.';
    q.echo = midis; q.events = seqEvents(midis, 0.9); q.bpm = 70;
    q.explain = 'The notes were ' + midis.map(m => fmt(pcName(m))).join(' – ') + '.';
  }
  return q;
}

const BEATS = {
  none:     { label: 'No drums' },
  ballad:   { label: 'Slow ballad', n: 16, k: [0, 10], s: [4, 12], h: [0, 4, 8, 12] },
  worship:  { label: 'Slow worship (12/8 feel)', n: 12, k: [0, 6], s: [3, 9], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  shuffle:  { label: 'Gospel shuffle', n: 12, k: [0, 6], s: [3, 9], h: [0, 2, 3, 5, 6, 8, 9, 11] },
  rock:     { label: 'Pop / rock', n: 16, k: [0, 8, 10], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] },
  afro:     { label: 'Afrobeat', n: 16, k: [0, 6, 10], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14], r: [3, 9, 15] },
  highlife: { label: 'Highlife', n: 16, k: [0, 8, 10], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14], r: [2, 6, 11, 14] },
  reggae:   { label: 'Reggae one-drop', n: 16, k: [8], r: [8], h: [0, 2, 4, 6, 8, 10, 12, 14] },
  praise:   { label: 'Fast praise', n: 16, k: [0, 4, 8, 12], s: [4, 12], o: [2, 6, 10, 14] },
  custom:   { label: 'My own beat (grid)' }
};
/* drum events for `bars` bars of 4 beats. o = { beat, swing (0-60), grid } */
function beatEvents(o, bars) {
  const id = (o && o.beat) || 'none';
  let b = BEATS[id];
  if (!b || id === 'none') return [];
  if (id === 'custom') {
    const g = (o && o.grid) || {};
    b = { n: 16 };
    ['k', 's', 'h', 'o'].forEach(r => { b[r] = (g[r] || []).map((x, i) => (x ? i : -1)).filter(i => i >= 0); });
  }
  const len = 4 / b.n, sw = Math.min(60, Math.max(0, +(o && o.swing) || 0)) / 100, VEL = { k: 0.9, s: 0.8, h: 0.4, o: 0.45, r: 0.55 };
  const ev = [];
  for (let bar = 0; bar < bars; bar++) {
    ['k', 's', 'h', 'o', 'r'].forEach(r => (b[r] || []).forEach(i => {
      let t = bar * 4 + i * len;
      if (b.n === 16 && i % 2 === 1) t += len * sw;
      ev.push({ t, d: 0.1, drum: r, vel: r === 'h' && i % 4 === 0 ? 0.55 : VEL[r] });
    }));
  }
  return ev;
}

const Engine = {
  LETTERS, NAT, ROOT_NAMES, SHARP_NAMES, QUALITIES, SCALES, PROGRESSIONS, STYLES, EAR_TYPES, MELODIES, INTERVALS, RANKS,
  DIA_TRIAD, DIA_SEVENTH,
  parseName, parseToken, pcOfName, midiOf, fmt, midiName, pcName, isBlack, spell,
  chordNames, chordPcs, chordSymbol, chordMidi, toneLabel, identifyChord, compareToChord, compareToVoicing,
  scaleNotes, scaleMidis, scaleTokens, diatonic, progressionChords, voiceProgression, romanFor, numberFor,
  seqEvents, arpEvents, blockEvent, progEvents, toEvents, BEATS, beatEvents,
  scoreTaps, steadiness, dateStr, addDays, streak, rankFor,
  earQuestion, mulberry, pick, shuffle
};
if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
