'use strict';
/* ---------------------------------------------------------------- songwriting music logic (pure, no DOM)
   Used by the Song Lab and tested in Node.
   - A chord in a song is stored relative to the key: { r, q, b, beats, push }
       r: the root, in semitones above the key note (0–11), so a key change moves every chord with it
       q: the chord type (an id of Engine.CHORD_TYPES: major, m7, 9, 13, 7#9, dim7, 7sus4…)
       b: an optional bass note (semitones above the key note) for slash chords such as F/G or C/E
       beats: how long it lasts (half-beat steps); push: it arrives half a beat early (an anticipation)
   - Names, Roman numerals and Nashville numbers are spelled from the key.
   - Palette: the seven chords of the key plus the gospel colours (secondary dominants, borrowed chords,
     passing diminished chords, slash chords, the tritone substitute).
   - Next-chord suggestions follow how gospel harmony moves (falling fifths, the IV–iv–I "sigh", passing
     diminished chords, walk-ups).
   - Right-hand voicings are voice-led; big chords leave the root to the bass, as pianists do.
   - Sung pitch is turned into notes; choir parts (alto and tenor) are written under a melody; lyrics are
     split into syllables, one per note. */
const Songcraft = (() => {
  const E = (typeof Engine !== 'undefined') ? Engine : require('./engine.js');
  const SCALE = [0, 2, 4, 5, 7, 9, 11];
  /* chord types: notes (semitones from the root) and how each is written */
  const QT = {};
  E.CHORD_TYPES.forEach(([q, sym, need, may]) => {
    const ivs = [...new Set(need.concat(may))].sort((a, b) => a - b);
    QT[q] = { sym, ivs };
  });
  QT.major.sym = ''; QT.minor.sym = 'm'; QT.dim.sym = '°'; QT.dim7.sym = '°7'; QT.aug.sym = '+';
  // extensions sit above the octave in a real voicing
  const EXT = { 2: 14, 1: 13, 3: 15, 5: 17, 6: 18, 8: 20, 9: 21 };
  function chordTones(q) {     // full chord in root position, extensions placed above the 7th
    const t = QT[q]; if (!t) return [0, 4, 7];
    const has7 = t.ivs.includes(10) || t.ivs.includes(11) || q === 'dim7';
    return t.ivs.map(i => {
      if (!has7 && !/^(add9|madd9|69|9sus4)$/.test(q)) return i;
      if (i === 2 || i === 1 || i === 3 && /#9/.test(q)) return EXT[i] || i;
      if (i === 5 && /11|sus/.test(q) && !/sus/.test(q)) return 17;
      if (i === 9 && /13/.test(q)) return 21;
      if (i === 6 && /#11/.test(q)) return 18;
      if (i === 8 && /b13|#9b13/.test(q)) return 20;
      return i;
    }).sort((a, b) => a - b);
  }
  const GROUPS = [
    ['Triads', ['major', 'minor', 'sus2', 'sus4', 'dim', 'aug']],
    ['Sevenths and sixths', ['maj7', '7', 'm7', 'm7b5', 'dim7', '7sus4', 'mmaj7', '6', 'm6', '69']],
    ['Extended (gospel colour)', ['add9', 'madd9', 'maj9', '9', 'm9', '9sus4', 'm11', 'maj7#11', '13', 'maj13', 'm13', '13sus4']],
    ['Altered (tension)', ['7b9', '7#9', '7#5', '7b5', '7#9b13', '7b9b13']]
  ];
  const QLABEL = { major: 'major', minor: 'minor', sus2: 'sus2', sus4: 'sus4', dim: 'diminished', aug: 'augmented', maj7: 'major 7', '7': 'dominant 7', m7: 'minor 7',
    m7b5: 'half-diminished (m7♭5)', dim7: 'diminished 7', '7sus4': '7sus4', mmaj7: 'minor-major 7', '6': '6', m6: 'minor 6', '69': '6/9', add9: 'add9', madd9: 'minor add9',
    maj9: 'major 9', '9': 'dominant 9', m9: 'minor 9', '9sus4': '9sus4', m11: 'minor 11', 'maj7#11': 'major 7♯11', '13': 'dominant 13', maj13: 'major 13', m13: 'minor 13',
    '13sus4': '13sus4', '7b9': '7♭9', '7#9': '7♯9', '7#5': '7♯5 (augmented 7)', '7b5': '7♭5', '7#9b13': '7♯5♯9', '7b9b13': '7♭9♭13' };
  const MINORISH = new Set(['minor', 'm7', 'm6', 'm9', 'm11', 'm13', 'madd9', 'mmaj7', 'm7b5', 'dim', 'dim7']);
  const DOMINANT = new Set(['7', '9', '13', '7b9', '7#9', '7#5', '7b5', '7#9b13', '7b9b13', '7sus4', '9sus4', '13sus4']);
  const DIA_TRIAD = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'];
  const DIA_SEV = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];
  const mod = x => ((x % 12) + 12) % 12;
  const diaIndex = r => SCALE.indexOf(mod(r));
  function diaQ(r, sev) { const i = diaIndex(r); return i < 0 ? null : (sev ? DIA_SEV : DIA_TRIAD)[i]; }

  /* scale degree and accidental for a root, e.g. 10 -> ♭7, 6 -> ♯4; diminished chords prefer sharps (♯1°7 to 2) */
  function degreeOf(r, q) {
    r = mod(r);
    const dimish = q === 'dim' || q === 'dim7';
    const T = { 0: [0, 0], 1: dimish ? [0, 1] : [1, -1], 2: [1, 0], 3: dimish ? [1, 1] : [2, -1], 4: [2, 0], 5: [3, 0], 6: [3, 1], 7: [4, 0], 8: dimish ? [4, 1] : [5, -1], 9: [5, 0], 10: [6, -1], 11: [6, 0] };
    return T[r];
  }
  const ACC = a => (a > 0 ? '♯' : a < 0 ? '♭' : '');
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sup = s => s.replace(/[0-9]/g, d => SUP[d]);
  /* note name for (key + semitones) spelled on the given scale step */
  function noteName(keyName, semis, step) {
    let n = E.spell(keyName, mod(semis), step);
    if (/(##|bb)$/.test(n) || /^(Cb|Fb|E#|B#)$/.test(n)) n = (/#/.test(keyName) ? E.SHARP_NAMES : E.ROOT_NAMES)[mod(E.pcOfName(keyName) + semis)];
    return n;
  }
  /* everything a chord is called in a key (shift = semitones of a key change) */
  function describe(keyName, c, shift) {
    const k = shift ? keyAfter(keyName, shift) : keyName;
    const [step, acc] = degreeOf(c.r, c.q), t = QT[c.q] || QT.major;
    const root = noteName(k, c.r, step);
    let bass = null, bassNum = '';
    if (c.b !== null && c.b !== undefined && mod(c.b) !== mod(c.r)) {
      const [bs, ba] = degreeOf(c.b, 'major'); bass = noteName(k, c.b, bs); bassNum = '/' + ACC(ba) + (bs + 1);
    }
    const sym = t.sym, minor = MINORISH.has(c.q) && !/dim/.test(c.q) && c.q !== 'm7b5';
    const name = E.fmt(root) + sym + (bass ? '/' + E.fmt(bass) : '');
    let rn = ROMAN[step]; if (MINORISH.has(c.q)) rn = rn.toLowerCase();
    const rsuf = minor ? sym.replace(/^m/, '') : c.q === 'm7b5' ? 'ø7' : sym;
    const roman = ACC(acc) + rn + rsuf + (bass ? bassNum.replace(/[0-9]+/, d => ROMAN[+d - 1]) : '');
    const number = ACC(acc) + (step + 1) + (minor ? 'm' + sup(sym.replace(/^m/, '')) : c.q === 'm7b5' ? 'ø' + sup('7') : sup(sym)) + bassNum;
    return { root, bass, name, symbol: sym, roman, number, label: QLABEL[c.q] || c.q };
  }
  /* the key a section is in after a key change of `shift` semitones (flat spellings except where sharps are usual) */
  function keyAfter(keyName, shift) {
    const pc = mod(E.pcOfName(keyName) + shift);
    return ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][pc];
  }
  /* key signature: sharps (+) or flats (−) */
  function keySig(keyName) { return { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6 }[keyName] || 0; }

  const mk = (r, q, b, hint) => ({ r, q, b: b === undefined ? null : b, hint: hint || '' });
  function diatonicChords(sev) { return SCALE.map((r, i) => mk(r, (sev ? DIA_SEV : DIA_TRIAD)[i], null)); }
  const COLOURS = [
    ['Pull to the next chord (secondary dominants)', [mk(4, '7', null, 'III7 pulls to vi'), mk(9, '7', null, 'VI7 pulls to ii'), mk(2, '7', null, 'II7 pulls to V'), mk(0, '7', null, 'I7 pulls to IV'), mk(11, '7', null, 'VII7 pulls to iii'), mk(1, '7', null, 'tritone substitute: ♭II7 slides to I')]],
    ['Borrowed (the gospel sigh)', [mk(5, 'minor', null, 'minor iv: IV–iv–I'), mk(5, 'm6', null, 'iv6, very churchy'), mk(10, 'major', null, '♭VII, then I'), mk(8, 'maj7', null, '♭VI, then ♭VII or V'), mk(3, 'major', null, '♭III, a bright surprise')]],
    ['Passing diminished', [mk(1, 'dim7', null, 'from I up to ii'), mk(3, 'dim7', null, 'from ii up to iii'), mk(6, 'dim7', null, 'from IV up to I/V'), mk(8, 'dim7', null, 'from V up to vi')]],
    ['Slash chords', [mk(5, 'major', 7, 'IV/V: the gospel “sus” before I'), mk(2, 'm7', 7, 'ii7/V'), mk(0, 'major', 4, 'I/III: walk up to IV'), mk(0, 'major', 7, 'I/V: ending or after ♯iv°'), mk(7, 'major', 11, 'V/VII: walk to vi or I'), mk(5, 'maj7', 7, 'IVmaj7/V, soft lift')]]
  ];

  /* next-chord suggestions after a chord (with a reason), in the key */
  function suggest(prev, sev) {
    const out = [], seen = new Set();
    const add = (r, q, b, why) => { const k = mod(r) + ':' + q + ':' + (b === null || b === undefined ? '' : mod(b)); if (seen.has(k)) return; seen.add(k); out.push({ r: mod(r), q, b: b === undefined ? null : b, why }); };
    const dia = (r, why, b) => add(r, diaQ(r, sev) || 'major', b === undefined ? null : b, why);
    if (!prev) { dia(0, 'start at home (I)'); dia(9, 'start on the minor vi'); dia(5, 'start on IV'); dia(2, 'start on ii'); return out; }
    const r = mod(prev.r), q = prev.q, b = prev.b === null || prev.b === undefined ? null : mod(prev.b);
    if (b === 7 && (r === 5 || r === 2)) { dia(0, 'resolve the IV/V home'); dia(9, 'surprise: to vi'); }
    if (DOMINANT.has(q)) {
      const t = r === 1 ? 0 : mod(r + 5), tq = diaQ(t, sev) || 'major';
      add(t, tq, null, 'a 7th chord falls a fifth: ' + (r === 1 ? 'tritone to I' : 'resolve'));
      if (r === 7) { dia(9, 'deceptive: V to vi'); add(5, 'major', 7, 'stay hanging: IV/V'); }
    }
    if (q === 'dim7' || q === 'dim') { const t = mod(r + 1); if (t === 7) add(0, sev ? 'maj7' : 'major', 7, '♯iv° rises to I/V'); else dia(t, 'diminished rises a half step'); dia(mod(r - 1), 'or falls back a half step'); }
    if (q === 'minor' || q === 'm6' || q === 'm7') { if (r === 5) { add(0, sev ? 'maj7' : 'major', null, 'iv to I: the Amen sigh'); add(0, 'major', 7, 'iv to I/V'); } }
    const table = {
      0: [[5, 'up to IV'], [9, 'to the minor vi'], [2, 'to ii (start a 2–5–1)'], ['I7', 'I7 to lead into IV'], ['I/3', 'walk up: I/III to IV'], [4, 'to iii']],
      2: [['V7', 'the 2–5: V7 next'], ['IV/V', 'ii to IV/V'], ['bII7', 'tritone substitute ♭II7'], [4, 'climb to iii']],
      4: [[9, 'iii to vi'], ['VI7', 'III to VI7 (circle of fifths)'], [5, 'iii to IV']],
      5: [['iv', 'IV to the minor iv'], ['#4dim', 'IV to ♯iv°7 (passing)'], [7, 'IV to V'], ['I/5', 'IV to I/V'], [0, 'IV back to I (plagal)'], [2, 'IV to ii']],
      7: [[0, 'V home to I'], [9, 'V to vi (deceptive)'], ['V/7', 'V/VII walk down to vi']],
      9: [[2, 'vi to ii'], [5, 'vi to IV'], ['II7', 'vi to II7, then V'], ['III7', 'vi back to III7'], [7, 'vi to V']],
      11: [['III7', 'vii to III7'], [0, 'vii to I']],
      10: [[0, '♭VII home to I'], [5, '♭VII to IV']],
      8: [[10, '♭VI to ♭VII to I'], ['V7', '♭VI to V7']],
      3: [[5, '♭III to IV'], [2, '♭III down to ii']],
      1: [[0, 'down a half step to I']],
      6: [['I/5', 'up to I/V']]
    };
    const named = { I7: [0, '7'], 'I/3': [0, 'major', 4], V7: [7, '7'], 'IV/V': [5, 'major', 7], bII7: [1, '7'], VI7: [9, '7'], iv: [5, sev ? 'm7' : 'minor'], '#4dim': [6, 'dim7'], 'I/5': [0, 'major', 7], 'V/7': [7, 'major', 11], II7: [2, '7'], III7: [4, '7'] };
    if (!(b === 7 && (r === 5 || r === 2))) (table[r] || [[mod(r + 5), 'down a fifth'], [0, 'home to I']]).forEach(([x, why]) => {
      if (typeof x === 'number') dia(x, why); else { const n = named[x]; add(n[0], n[1], n[2] === undefined ? null : n[2], why); }
    });
    return out.filter(s => !(s.r === r && s.q === q && (s.b === b))).slice(0, 6);
  }

  /* ---- voicing: right hand (voice-led, 52–81) and bass, for chords in a key ---- */
  function rhTones(q) {
    const all = chordTones(q).map(x => x % 12);
    let t = [...new Set(all)];
    if (t.length >= 5) t = t.filter(x => x !== 0);                 // the bass has the root
    if (t.length >= 5) t = t.filter(x => x !== 7);                 // and the fifth can go
    if (t.length >= 5) t = t.slice(0, 4).concat(t.slice(-1)).slice(-4);
    return t;
  }
  function voice(keyName, chords, shift) {
    const kp = mod(E.pcOfName(keyName) + (shift || 0));
    let prev = null;
    return chords.map(c => {
      const root = kp + c.r, tones = rhTones(c.q).map(x => mod(root + x));
      const cands = [];
      for (let lo = 50; lo <= 70; lo++) {
        if (!tones.includes(mod(lo))) continue;
        // a close voicing whose lowest note is lo
        const v = [lo]; let cur = lo;
        tones.slice().sort((a, b) => mod(a - lo) - mod(b - lo)).forEach(pc => { if (pc === mod(lo)) return; let m = cur + 1; while (mod(m) !== pc) m++; v.push(m); cur = m; });
        if (v[v.length - 1] > 81) continue;
        let cost;
        if (prev) { cost = 0; const L = Math.min(prev.length, v.length); for (let i = 0; i < L; i++) cost += Math.abs(prev[i] - v[i]); cost += Math.abs(prev.length - v.length) * 3; }
        else { const mean = v.reduce((a, b) => a + b, 0) / v.length; cost = Math.abs(mean - 66); }
        cands.push({ v, cost });
      }
      cands.sort((a, b) => a.cost - b.cost);
      prev = cands.length ? cands[0].v : tones.map(p => 60 + p);
      const bpc = mod(kp + (c.b === null || c.b === undefined ? c.r : c.b));
      return { rh: prev, bass: 36 + bpc, root: mod(root), pcs: chordTones(c.q).map(x => mod(root + x)) };
    });
  }

  /* a chord recognised from the keyboard (Engine.identifyChord) into a song chord in the key */
  function fromHit(keyName, hit, beats) {
    if (!hit || !QT[hit.quality]) return null;
    const kp = E.pcOfName(keyName), r = mod(hit.rootPc - kp);
    const bpc = hit.bassName ? E.pcOfName(hit.bassName) : null;
    const b = bpc !== null && bpc !== hit.rootPc ? mod(bpc - kp) : null;
    return { r, q: hit.quality, b, beats: beats || 4, push: false };
  }
  /* an older project stored chord numbers 1–7 */
  function fromDegrees(degs, sev, beats) { return degs.map(d => ({ r: SCALE[d - 1], q: (sev ? DIA_SEV : DIA_TRIAD)[d - 1], b: null, beats, push: false })); }
  /* and back again (for the lessons and the Songbook, which read chord numbers) */
  function toDegrees(chords) { return chords.map(c => diaIndex(c.r) + 1).filter(d => d > 0); }
  function isSimple(chords, sev, bar) {
    return chords.length > 0 && chords.length <= 8 && chords.every(c => { const i = diaIndex(c.r); return i >= 0 && c.q === (sev ? DIA_SEV : DIA_TRIAD)[i] && (c.b === null || c.b === undefined) && c.beats === bar && !c.push; });
  }

  /* ---- singing to notes ----
     frames: [{ t (beats), midi (float or null), level }], about 40 a second. Returns [{ m, t, d }] on a half-beat
     grid. Steady stretches become notes; a change of more than about 70 cents that lasts, or a dip in loudness
     (a new syllable on the same pitch), starts a new note. Very short blips are dropped. With keyPc, a note
     that falls between two semitones is pulled to the key's scale. */
  function framesToNotes(frames, o) {
    o = o || {};
    const grid = o.grid || 0.5, minBeats = o.minBeats || 0.22, total = o.total || Infinity, kp = o.keyPc;
    const fr = frames.filter(f => f && Number.isFinite(f.t));
    const notes = []; let run = [];
    const close = () => {
      if (run.length < 3) { run = []; return; }
      const t0 = run[0].t, t1 = run[run.length - 1].t + (o.frameBeats || 0.05);
      if (t1 - t0 < minBeats) { run = []; return; }
      const ms = run.map(f => f.midi).sort((a, b) => a - b), med = ms[ms.length >> 1];
      let m = Math.round(med);
      if (kp !== undefined && kp !== null && !SCALE.includes(mod(m - kp))) {
        const up = Math.ceil(med), dn = Math.floor(med);
        const alt = mod(m - kp) === mod(up - kp) ? dn : up;
        if (SCALE.includes(mod(alt - kp)) && Math.abs(alt - med) < 0.62) m = alt;
      }
      notes.push({ m, t: t0, e: t1 }); run = [];
    };
    let peak = 0;
    for (let i = 0; i < fr.length; i++) {
      const f = fr[i];
      if (f.midi === null || f.midi === undefined) { close(); peak = 0; continue; }
      if (run.length) {
        const recent = run.slice(-5).map(x => x.midi).sort((a, b) => a - b), ref = recent[recent.length >> 1];
        const nxt = fr.slice(i, i + 3).filter(x => x.midi !== null && x.midi !== undefined);
        const moved = nxt.length >= 2 && nxt.every(x => Math.abs(x.midi - ref) > 0.7);
        const dip = f.level !== undefined && peak > 0 && f.level < peak * 0.35 && run.length > 4;
        if (moved || dip) { close(); peak = 0; }
      }
      run.push(f); if (f.level !== undefined) peak = Math.max(peak, f.level);
    }
    close();
    const q = x => Math.round(x / grid) * grid;
    const out = [];
    notes.forEach(n => {
      let t = Math.max(0, q(n.t)); const e = Math.max(t + grid, q(n.e));
      if (t >= total) return;
      if (out.length) { const p = out[out.length - 1]; if (t < p.t + p.d) { if (p.m === n.m) { p.d = Math.max(p.d, Math.min(total, e) - p.t); return; } if (t <= p.t) t = p.t + grid; p.d = Math.max(grid, t - p.t); } }
      if (t >= total) return;
      out.push({ m: n.m, t, d: Math.min(e, total) - t });
    });
    return out.filter(n => n.d > 0);
  }

  /* ---- choir parts under a melody (soprano = the melody) ----
     melody: [{ m, t, d }]; chordAt(t) -> { pcs (chord pitch classes, root first), keyPc }.
     Alto (F3–D5) and tenor (C3–G4) take chord tones below the melody, moving as little as possible, covering
     the 3rd and 7th, avoiding unisons and crossings. A melody note outside the chord (a passing note) gets
     the scale notes a third and a sixth below it, which is how a choir follows a run. Notes are split where
     the chord changes under a held melody note. */
  const RANGE = { alto: [53, 74], tenor: [48, 67] };
  function choirParts(melody, chordAt, keyPc, changes) {
    const alto = [], tenor = [];
    let pa = null, pt = null;
    const scaleBelow = (m, steps) => { let x = m, n = 0; while (n < steps) { x--; if (SCALE.includes(mod(x - keyPc))) n++; } return x; };
    const segs = [];
    melody.slice().sort((a, b) => a.t - b.t).forEach(n => {
      const cuts = (changes || []).filter(c => c > n.t + 0.01 && c < n.t + n.d - 0.01);
      let t = n.t; cuts.concat([n.t + n.d]).forEach(c => { segs.push({ m: n.m, t, d: c - t }); t = c; });
    });
    segs.forEach(s => {
      const ch = chordAt(s.t); if (!ch) return;
      const pcs = ch.pcs, core = pcs.slice(0, 4), sp = mod(s.m);
      let a = null, tn = null;
      if (pcs.includes(sp)) {
        let best = null;
        for (let am = RANGE.alto[0]; am <= RANGE.alto[1]; am++) {
          if (!core.includes(mod(am)) || am > s.m - 3 || am < s.m - 10) continue;
          for (let tm = RANGE.tenor[0]; tm <= RANGE.tenor[1]; tm++) {
            if (!core.includes(mod(tm)) || tm > am - 3 || tm < am - 10) continue;
            const set = new Set([sp, mod(am), mod(tm)]);
            const third = core[1], seventh = core[3];
            let cost = (pa === null ? Math.abs(am - (s.m - 5)) : Math.abs(am - pa)) + (pt === null ? Math.abs(tm - (s.m - 10)) : Math.abs(tm - pt));
            cost += (3 - set.size) * 4;
            if (third !== undefined && !set.has(third)) cost += 3;
            if (seventh !== undefined && !set.has(seventh)) cost += 1.5;
            if (mod(am) === pcs[0] && mod(tm) === pcs[0]) cost += 2;
            if (!best || cost < best.cost) best = { cost, am, tm };
          }
        }
        if (best) { a = best.am; tn = best.tm; }
      }
      if (a === null) { a = scaleBelow(s.m, 2); tn = scaleBelow(s.m, 5); }
      while (a > RANGE.alto[1]) a -= 12; while (a < RANGE.alto[0]) a += 12;
      while (tn > RANGE.tenor[1]) tn -= 12; while (tn < RANGE.tenor[0]) tn += 12;
      if (tn >= a) tn -= 12;
      const push = (arr, m) => { const p = arr[arr.length - 1]; if (p && p.m === m && Math.abs(p.t + p.d - s.t) < 0.01) p.d += s.d; else arr.push({ m, t: s.t, d: s.d }); };
      push(alto, a); push(tenor, tn); pa = a; pt = tn;
    });
    return { soprano: melody.map(n => ({ m: n.m, t: n.t, d: n.d })), alto, tenor };
  }

  /* ---- lyrics: one syllable per note ----
     Write words with hyphens between syllables (Hal-le-lu-jah); words without hyphens are split by their
     vowel groups. An underscore "_" holds the previous syllable over the next note (a run). */
  function syllabify(word) {
    if (word.includes('-')) return word.split('-').filter(Boolean).map((s, i, a) => s + (i < a.length - 1 ? '-' : ''));
    const w = word, groups = [];
    const re = /[^aeiouyAEIOUY]*[aeiouyAEIOUY]+(?:[^aeiouyAEIOUY]*$|[^aeiouyAEIOUY](?=[^aeiouyAEIOUY]))?/g;
    let m; while ((m = re.exec(w)) !== null) { if (!m[0]) { re.lastIndex++; continue; } groups.push(m[0]); }
    if (!groups.length) return [w];
    const used = groups.join('').length; if (used < w.length) groups[groups.length - 1] += w.slice(used);
    // a final silent e (come, grace) stays with the syllable before it
    if (groups.length > 1 && /^[^aeiouy]*e[sd]?$/i.test(groups[groups.length - 1]) && !/le$/i.test(w)) { const last = groups.pop(); groups[groups.length - 1] += last; }
    return groups.map((s, i, a) => s + (i < a.length - 1 ? '-' : ''));
  }
  function syllables(text) {
    const out = [];
    String(text || '').split(/\s+/).filter(Boolean).forEach(tok => {
      if (/^_+$/.test(tok)) { for (let i = 0; i < tok.length; i++) out.push('_'); return; }
      syllabify(tok).forEach(s => out.push(s));
    });
    return out;
  }
  /* syllables matched to notes in time order; "_" means the note continues the previous syllable */
  function lyricsForNotes(notes, text) {
    const syl = syllables(text), order = notes.map((n, i) => i).sort((a, b) => notes[a].t - notes[b].t || notes[b].m - notes[a].m), out = new Array(notes.length).fill('');
    order.forEach((ni, k) => { const s = syl[k]; if (s && s !== '_') out[ni] = s; });
    return out;
  }

  return { QT, GROUPS, QLABEL, SCALE, DOMINANT, chordTones, describe, keyAfter, keySig, degreeOf, diatonicChords, COLOURS, suggest, diaQ, voice, rhTones,
    fromHit, fromDegrees, toDegrees, isSimple, framesToNotes, choirParts, syllables, syllabify, lyricsForNotes, mod };
})();
if (typeof module !== 'undefined') module.exports = Songcraft;
