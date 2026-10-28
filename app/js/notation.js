'use strict';
/* ===================== progress rules, exercises, quiz, lesson player ===================== */

/* ---------------------------------------------------------------- icons */
const IC = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  course: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',
  piano: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 12v7M15 12v7"/><path d="M7.5 5v7M12 5v7M16.5 5v7" stroke-width="3"/>',
  practice: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><path d="M4 15h3v5H5a1 1 0 0 1-1-1zM20 15h-3v5h2a1 1 0 0 0 1-1z"/>',
  guitar: '<circle cx="8" cy="16" r="5"/><path d="M12 12l7-7M17 3l4 4"/>',
  song: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  progress: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/>',
  replay: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  flame: '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>'
};
const icon = (n, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>';

/* ---------------------------------------------------------------- progress rules */
function ensureToday() {
  const d = E.dateStr();
  if (S.today.date !== d) S.today = { date: d, items: {}, goalMet: false };
  return S.today;
}
function lessonRec(id) { return S.lessons[id] || (S.lessons[id] = {}); }
function lessonStatus(id) {
  const r = S.lessons[id];
  if (!r) return 'new';
  if (r.status) return r.status;
  if (r.play || r.challenge || r.quiz || (r.pdone && r.pdone.some(Boolean))) return 'progress';
  return 'new';
}
const isDone = id => { const s = lessonStatus(id); return s === 'done' || s === 'mastered'; };
const isUnlocked = id => C.byId[id].req.every(isDone);
function award(n, why) {
  if (!n) return;
  S.xp += n; touch();
  toast('+' + n + ' XP' + (why ? ' · ' + why : ''), 'xp');
}
function markToday(key) { ensureToday().items[key] = true; touch(); }
function recordAnswer(cat, ok) {
  const c = S.cats[cat] || (S.cats[cat] = { c: 0, t: 0 });
  c.t++; if (ok) c.c++;
}
function evalLesson(id) {
  const L = C.byId[id], r = lessonRec(id);
  if (r.src === 'testout') return;
  const best = r.quiz ? r.quiz.best : 0;
  const pdone = (L.practice || []).length === 0 || (r.pdone && L.practice.every((_, i) => r.pdone[i]));
  const done = !!r.play && best >= 70;
  const mastered = done && pdone && !!r.challenge && best >= 80;
  const next = mastered ? 'mastered' : done ? 'done' : undefined;
  if (next && next !== r.status) {
    const prev = r.status;
    r.status = next; r.at = Date.now();
    scheduleReview(id, 0);
    if (!prev) award(40, 'lesson complete');
    if (next === 'mastered') award(30, 'mastered');
  }
  touch(); checkAch();
}
/* ====================================================================================
   Question generators, quiz selection (no repeats) and spaced review
   ==================================================================================== */
/* ====================================================================================
   Staff notation (SVG): treble, bass and grand staff, key signatures, accidentals,
   chords, note values and rests. Notes are written as tokens such as 'C4', 'F#4', 'Bb3'.
   ==================================================================================== */
const Staff = (function () {
  const STEP = 4, SP = 8;                       // half a space, one space (px)
  const SHARP_POS = { treble: [38, 35, 39, 36, 33, 37, 34], bass: [24, 21, 25, 22, 19, 23, 20] };
  const FLAT_POS = { treble: [34, 37, 33, 36, 32, 35, 31], bass: [20, 23, 19, 22, 18, 21, 24] };
  const SHARP_L = ['F', 'C', 'G', 'D', 'A', 'E', 'B'], FLAT_L = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
  const LINES = { treble: [30, 32, 34, 36, 38], bass: [18, 20, 22, 24, 26] };
  const num = n => Math.round(n * 10) / 10;

  function parse(tok) {
    const p = E.parseName(tok); if (!p || p.oct === null) return null;
    const midi = 12 * (p.oct + 1) + [0, 2, 4, 5, 7, 9, 11][p.letter] + p.acc;
    return { d: p.oct * 7 + p.letter, acc: p.acc, letter: E.LETTERS[p.letter], oct: p.oct, midi, tok };
  }
  function keyAccidentals(n) {
    const m = {};
    if (n > 0) SHARP_L.slice(0, n).forEach(l => { m[l] = 1; });
    if (n < 0) FLAT_L.slice(0, -n).forEach(l => { m[l] = -1; });
    return m;
  }
  const clefOf = (mode, midi) => mode === 'grand' ? (midi >= 60 ? 'treble' : 'bass') : mode;

  /* ---- glyphs, drawn relative to a reference point (see render) ---- */
  function trebleClef(x, yG) {   // yG = y of the G line (second line from the bottom)
    return '<path class="st-clef" transform="translate(' + num(x) + ',' + num(yG) + ')" d="' +
      'M -1.5 8 C -7 11 -3 18 2 15.5 C 6 13 4 7 0 5.5 ' +            // bottom curl (tail)
      'M 0 5.5 C 3 -2 6 -12 5.5 -22 C 5 -30 0 -33 -2.5 -28 C -5 -23 -2 -16 4 -9 C 10 -2 11 8 5 11 ' +
      'C 0 13 -6 9 -5 3 C -4 -2 2 -4 4 -0.5 C 5.5 3 2 6 0 4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function bassClef(x, yF) {      // yF = y of the F line (second line from the top)
    return '<g class="st-clef" transform="translate(' + num(x) + ',' + num(yF) + ')">' +
      '<circle cx="-5" cy="0" r="3.4" fill="currentColor"/>' +
      '<path d="M -5 -3.2 C 5 -4.5 11 1 8 9 C 6 15 -1 19.5 -9 23" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="12" cy="-4" r="1.7" fill="currentColor"/><circle cx="12" cy="4" r="1.7" fill="currentColor"/></g>';
  }
  function accGlyph(kind, x, y) {
    const t = 'transform="translate(' + num(x) + ',' + num(y) + ')"';
    if (kind === 1) return '<g class="st-acc" ' + t + ' stroke="currentColor" fill="none"><path d="M -2 -9 V 9 M 2 -8 V 10" stroke-width="1"/><path d="M -4.5 -2 L 4.5 -4.4 M -4.5 4 L 4.5 1.6" stroke-width="2.4"/></g>';
    if (kind === -1) return '<g class="st-acc" ' + t + ' stroke="currentColor" fill="none"><path d="M -2.5 -11 V 5" stroke-width="1.1"/><path d="M -2.5 5 C 5 2 6 -4 0 -4 C -2 -4 -2.5 -2 -2.5 0" stroke-width="1.6"/></g>';
    if (kind === 0) return '<g class="st-acc" ' + t + ' stroke="currentColor" fill="none"><path d="M -2.5 -9 V 3.5 L 3 2 M 2.5 9 V -3.5 L -3 -2" stroke-width="1.2"/></g>';
    if (kind >= 2) return '<g class="st-acc" ' + t + ' stroke="currentColor" fill="none"><path d="M -3.5 -3.5 L 3.5 3.5 M 3.5 -3.5 L -3.5 3.5" stroke-width="2.2"/></g>';
    return '<g class="st-acc" ' + t + ' stroke="currentColor" fill="none"><path d="M -2.5 -11 V 5 M -2.5 5 C 5 2 6 -4 0 -4 C -2 -4 -2.5 -2 -2.5 0 M 3 -11 V 5" stroke-width="1.3"/></g>';
  }
  function restGlyph(dur, x, yMid) {
    const c = 'stroke="currentColor" fill="currentColor"';
    if (dur === 'w') return '<rect class="st-rest" x="' + num(x - 5) + '" y="' + num(yMid - SP) + '" width="10" height="4.5" ' + c + '/>';
    if (dur === 'h') return '<rect class="st-rest" x="' + num(x - 5) + '" y="' + num(yMid - 4.5) + '" width="10" height="4.5" ' + c + '/>';
    if (dur === 'e') return '<g class="st-rest" ' + c + '><circle cx="' + num(x - 2) + '" cy="' + num(yMid - 3) + '" r="2"/><path d="M ' + num(x - 1) + ' ' + num(yMid - 3) + ' L ' + num(x + 3) + ' ' + num(yMid - 8) + ' L ' + num(x - 2) + ' ' + num(yMid + 9) + '" fill="none" stroke-width="1.6"/></g>';
    return '<path class="st-rest" d="M ' + num(x - 2) + ' ' + num(yMid - 11) + ' L ' + num(x + 3) + ' ' + num(yMid - 5) + ' L ' + num(x - 2) + ' ' + num(yMid + 1) + ' C ' + num(x + 4) + ' ' + num(yMid + 1) + ' ' + num(x + 3) + ' ' + num(yMid + 8) + ' ' + num(x - 2) + ' ' + num(yMid + 9) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
  }

  /* Draw a staff. opts: { clef:'treble'|'bass'|'grand', key:0, time:[4,4], cols:[{ notes:['C4'], dur:'q', rest:false, state:'cur|ok|bad' }], label } */
  function render(opts) {
    const mode = opts.clef || 'treble', kn = opts.key || 0, cols = opts.cols || [];
    const T = 100;                                   // y of E4 (bottom treble line)
    const y = d => T - (d - 30) * STEP;
    const staves = mode === 'grand' ? ['treble', 'bass'] : [mode];
    const keyAcc = keyAccidentals(kn);
    let x = 6; const parts = [];
    // clefs
    const clefX = x + 12; x += 34;
    // key signature
    const ksX = x; x += Math.abs(kn) * 9 + (kn ? 6 : 0);
    // time signature
    let timeX = null; if (opts.time) { timeX = x + 8; x += 24; }
    x += 14;
    const colW = opts.colW || 42;
    const xStart = x, xEnd = xStart + Math.max(1, cols.length) * colW;
    let top = Infinity, bot = -Infinity;
    staves.forEach(c => { LINES[c].forEach(d => { top = Math.min(top, y(d)); bot = Math.max(bot, y(d)); }); });
    const body = [], ledgers = [], stems = [], labels = [], barXs = [];
    const pitchAcc = {};                              // letter+octave -> accidental currently in effect
    cols.forEach((col, ci) => {
      const cx = xStart + ci * colW + colW / 2;
      const st = col.state ? ' ' + col.state : '';
      if (col.label) labels.push([cx, col.label]);
      if (col.bar && ci < cols.length - 1) barXs.push(xStart + (ci + 1) * colW);
      if (col.rest || !col.notes || !col.notes.length) {
        const c = staves[0]; const mid = y(LINES[c][2]);
        body.push('<g class="st-col' + st + '">' + restGlyph(col.dur || 'q', cx, mid) + '</g>');
        return;
      }
      const ns = col.notes.map(parse).filter(Boolean).sort((a, b) => a.d - b.d);
      if (!ns.length) return;
      ns.forEach(n => { n.staff = clefOf(mode, n.midi); n.y = y(n.d); top = Math.min(top, n.y - 6); bot = Math.max(bot, n.y + 6); });
      // stem direction from the average position relative to the middle line of the staff they belong to
      const avgMid = ns.reduce((a, n) => a + (n.d - (n.staff === 'treble' ? 34 : 22)), 0) / ns.length;
      const up = avgMid < 0;
      // heads: neighbours a step apart sit on opposite sides of the stem
      const flip = new Array(ns.length).fill(false);
      for (let i = 1; i < ns.length; i++) if (ns[i].d - ns[i - 1].d === 1 && !flip[i - 1]) flip[i] = true;
      const dur0 = col.dur || 'q', dotted = /d$/.test(dur0), dur = dur0.replace(/d$/, '');
      let g = '';
      ns.forEach((n, i) => {
        const hx = cx + (flip[i] ? (up ? 9.4 : -9.4) : 0);
        // ledger lines
        const lines = LINES[n.staff], lo = lines[0], hi = lines[4];
        if (n.d < lo) for (let d = lo - 2; d >= n.d - (n.d % 2 === lo % 2 ? 0 : 1); d -= 2) ledgers.push([hx, y(d)]);
        if (n.d > hi) for (let d = hi + 2; d <= n.d + (n.d % 2 === hi % 2 ? 0 : -1); d += 2) ledgers.push([hx, y(d)]);
        if (mode === 'grand' && n.d === 28) ledgers.push([hx, y(28)]);
        const filled = dur === 'q' || dur === 'e';
        g += '<ellipse class="st-head" cx="' + num(hx) + '" cy="' + num(n.y) + '" rx="5.4" ry="3.9" transform="rotate(-20 ' + num(hx) + ' ' + num(n.y) + ')" ' +
          (filled ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="' + (dur === 'w' ? 2.2 : 1.6) + '"') + '/>';
        if (dotted) g += '<circle class="st-dot" cx="' + num(hx + 10) + '" cy="' + num(n.d % 2 === 0 ? n.y - 4 : n.y) + '" r="1.7" fill="currentColor"/>';
      });
      // accidentals (columns to the left, staggered)
      const accCols = [];
      ns.slice().reverse().forEach(n => {
        const key = n.letter + n.oct, inEffect = pitchAcc[key] !== undefined ? pitchAcc[key] : (keyAcc[n.letter] || 0);
        if (n.acc !== inEffect) {
          let c = 0; while (accCols[c] !== undefined && accCols[c] - n.d < 6) c++;
          accCols[c] = n.d;
          g += accGlyph(n.acc, cx - 12 - c * 10, n.y);
        }
        pitchAcc[key] = n.acc;
      });
      // stem and flag
      if (dur !== 'w') {
        const sx = up ? cx + 5 : cx - 5, hiN = ns[ns.length - 1], loN = ns[0];
        const y1 = up ? loN.y : hiN.y, y2 = up ? hiN.y - 26 : loN.y + 26;
        const y2c = up ? Math.min(y2, hiN.y - 26) : Math.max(y2, loN.y + 26);
        stems.push('<line class="st-stem" x1="' + num(sx) + '" y1="' + num(y1) + '" x2="' + num(sx) + '" y2="' + num(y2c) + '" stroke="currentColor" stroke-width="1.4"/>');
        top = Math.min(top, y2c - 2); bot = Math.max(bot, y2c + 2);
        if (dur === 'e') g += '<path class="st-flag" d="M ' + num(sx) + ' ' + num(y2c) + ' C ' + num(sx + 1) + ' ' + num(y2c + (up ? 8 : -8)) + ' ' + num(sx + 10) + ' ' + num(y2c + (up ? 10 : -10)) + ' ' + num(sx + 7) + ' ' + num(y2c + (up ? 20 : -20)) + '" fill="none" stroke="currentColor" stroke-width="1.8"/>';
      }
      body.push('<g class="st-col' + st + '">' + g + '</g>');
    });
    // draw: staff lines
    let svg = '';
    staves.forEach(c => { LINES[c].forEach(d => { svg += '<line class="st-line" x1="' + num(6) + '" y1="' + num(y(d)) + '" x2="' + num(xEnd + 8) + '" y2="' + num(y(d)) + '" stroke="currentColor" stroke-width="1" opacity=".75"/>'; }); });
    // system bar line (and brace for grand staff)
    const sTop = y(LINES[staves[0]][4]), sBot = y(LINES[staves[staves.length - 1]][0]);
    svg += '<line x1="6" y1="' + num(sTop) + '" x2="6" y2="' + num(sBot) + '" stroke="currentColor" stroke-width="1.6"/>';
    svg += '<line x1="' + num(xEnd + 8) + '" y1="' + num(sTop) + '" x2="' + num(xEnd + 8) + '" y2="' + num(sBot) + '" stroke="currentColor" stroke-width="2.4"/>';
    if (mode === 'grand') svg += '<path d="M 5 ' + num(sTop) + ' C -6 ' + num(sTop + 12) + ' -2 ' + num((sTop + sBot) / 2 - 3) + ' -8 ' + num((sTop + sBot) / 2) + ' C -2 ' + num((sTop + sBot) / 2 + 3) + ' -6 ' + num(sBot - 12) + ' 5 ' + num(sBot) + '" fill="none" stroke="currentColor" stroke-width="2"/>';
    // clefs and key signatures
    staves.forEach(c => {
      svg += c === 'treble' ? trebleClef(clefX, y(32)) : bassClef(clefX, y(24));
      if (kn) {
        const pos = (kn > 0 ? SHARP_POS : FLAT_POS)[c];
        for (let i = 0; i < Math.abs(kn); i++) svg += accGlyph(kn > 0 ? 1 : -1, ksX + 6 + i * 9, y(pos[i]));
      }
      if (opts.time) {
        const mid = y(LINES[c][2]);
        svg += '<text class="st-time" x="' + num(timeX) + '" y="' + num(mid - 3) + '" text-anchor="middle" font-size="19" font-weight="800" fill="currentColor" font-family="Georgia, serif">' + opts.time[0] + '</text>' +
          '<text class="st-time" x="' + num(timeX) + '" y="' + num(mid + 15) + '" text-anchor="middle" font-size="19" font-weight="800" fill="currentColor" font-family="Georgia, serif">' + opts.time[1] + '</text>';
      }
    });
    ledgers.forEach(([lx, ly]) => { svg += '<line class="st-ledger" x1="' + num(lx - 9) + '" y1="' + num(ly) + '" x2="' + num(lx + 9) + '" y2="' + num(ly) + '" stroke="currentColor" stroke-width="1.2"/>'; });
    svg += stems.join('') + body.join('');
    barXs.forEach(bx => { svg += '<line class="st-bar" x1="' + num(bx) + '" y1="' + num(sTop) + '" x2="' + num(bx) + '" y2="' + num(sBot) + '" stroke="currentColor" stroke-width="1.3"/>'; });
    if (labels.length) {
      const labY = Math.min(sTop - 16, top - 8);
      labels.forEach(l => { svg += '<text class="st-chord" x="' + num(l[0]) + '" y="' + num(labY) + '" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor" font-family="ui-monospace, Menlo, Consolas, monospace">' + esc(l[1]) + '</text>'; });
      top = Math.min(top, labY - 16);
    }
    const padT = 8, padB = 8, minY = Math.min(top, sTop) - padT, maxY = Math.max(bot, sBot) + padB;
    const W = xEnd + 18, H = maxY - minY;
    const label = opts.label || ('Staff notation. ' + (cols.map(c => (c.notes || []).join(' + ') || 'rest').join(', ') || 'empty'));
    return '<svg class="staff" viewBox="-12 ' + num(minY) + ' ' + num(W + 12) + ' ' + num(H) + '" width="' + num((W + 12) * (opts.scale || 1.5)) + '" role="img" aria-label="' + esc(label) + '" xmlns="http://www.w3.org/2000/svg">' + svg + '</svg>';
  }
  /* turn spelled note names and MIDI numbers into tokens with the right octave, e.g. (['E♭'...]) */
  function tokens(names, midis) {
    return names.map((nm, i) => {
      const p = E.parseName(nm); const natural = [0, 2, 4, 5, 7, 9, 11][p.letter] + p.acc;
      return nm + (Math.round((midis[i] - natural) / 12) - 1);
    });
  }
  return { render, parse, tokens, keyAccidentals };
})();


App.Staff = Staff;

const QG = (function () {
  const MAJ_ALL = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];
  const SIG = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6 };
  const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
  const NATURALS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const ROOTS12 = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'], SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
  const INT_STEPS = { 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 5, 9: 5, 10: 6, 11: 6, 12: 7 };
  const f = E.fmt, pick = E.pick;
  const sigText = n => n === 0 ? 'no sharps or flats' : Math.abs(n) + (n > 0 ? ' sharp' : ' flat') + (Math.abs(n) > 1 ? 's' : '');
  const minorOf = k => E.spell(k, 9, 5), majorOfMinor = m => E.spell(m, 3, 2);
  const labelOf = q => E.QUALITIES[q].label;
  function mc(correct, pool, rng, n) {
    const uniq = [...new Set(pool.filter(x => x !== correct))];
    const wrong = E.shuffle(uniq, rng).slice(0, (n || 4) - 1);
    const o = E.shuffle([correct].concat(wrong), rng);
    return { o, a: o.indexOf(correct) };
  }
  function mk(k, text, correct, pool, why, rng, extra, n) {
    const m = mc(correct, pool, rng, n);
    if (m.o.length < 2) return null;
    return Object.assign({ k, q: text, o: m.o, a: m.a, why }, extra || {});
  }
  const combos = p => p.combos ? pick(p.combos) : [pick(p.roots || ROOTS12), pick(p.quals || ['major', 'minor'])];
  const beatsText = b => b === 0.5 ? 'Half a beat' : b === 1 ? '1 beat' : b === 1.5 ? '1½ beats' : b + ' beats';
  const NOTE_FACTS = [['whole note', 4], ['dotted half note', 3], ['half note', 2], ['dotted quarter note', 1.5], ['quarter note', 1], ['eighth note', 0.5]];
  const NOTE_FOR = { 4: 'a whole note', 3: 'a dotted half note', 2: 'a half note', 1.5: 'a dotted quarter note', 1: 'a quarter note', 0.5: 'an eighth note' };

  const GEN = {
    readNote(p, rng) {
      const clef = p.clef || 'treble', tok = pick(p.pool, rng), pn = E.parseName(tok);
      const L = E.LETTERS[pn.letter], lab = L + (pn.acc > 0 ? '#' : pn.acc < 0 ? 'b' : '');
      const li = pn.letter, nb = [E.LETTERS[(li + 1) % 7], E.LETTERS[(li + 6) % 7]];
      const pool = pn.acc ? [L, L + (pn.acc > 0 ? 'b' : '#')].concat(nb) : NATURALS;
      return mk('rn:' + clef + tok, 'Which note is written on the staff?', f(lab), pool.map(f), 'This is ' + f(lab) + (pn.acc ? ' (' + (pn.acc > 0 ? 'the sharp sign raises' : 'the flat sign lowers') + ' ' + L + ' by a half step).' : '. Count from a landmark: middle C, G on the treble clef, F on the bass clef.'), rng,
        { staff: { clef, key: 0, cols: [{ notes: [tok], dur: 'w' }] } });
    },
    readKey(p, rng) {
      const n = pick(p.keys || [1, 2, 3, -1, -2, -3], rng);
      const key = Object.keys(SIG).find(k => SIG[k] === n);
      return mk('rk:' + n, 'Which major key has this key signature?', f(key), MAJ_ALL.map(f), 'It has ' + sigText(n) + ', so the key is ' + f(key) + ' major.', rng, { staff: { clef: pick(['treble', 'bass'], rng), key: n, cols: [] } });
    },
    readChord(p, rng) {
      const c = combos(p), midis = E.chordMidi(c[0], c[1], 4, 0), names = E.chordNames(c[0], c[1]);
      const toks = Staff.tokens(midis.map(m => names[E.chordPcs(c[0], c[1]).indexOf(((m % 12) + 12) % 12)]), midis);
      const pool = (p.combos || []).map(x => E.chordSymbol(x[0], x[1]));
      return mk('rc:' + c[0] + c[1], 'Which chord is written on the staff?', E.chordSymbol(c[0], c[1]), pool.length > 3 ? pool : ROOTS12.map(r => E.chordSymbol(r, c[1])), 'The notes are ' + names.map(f).join(' – ') + ', which spell ' + E.chordSymbol(c[0], c[1]) + '.', rng, { staff: { clef: 'treble', key: 0, cols: [{ notes: toks, dur: 'w' }] } });
    },
    noteOnKeys(p, rng) {
      const n = pick(p.names || NATURALS, rng);
      return mk('nok:' + n, 'Which note is highlighted on the keyboard?', f(n), NATURALS.map(f), 'The highlighted keys are all ' + f(n) + '.', rng, { show: { range: [48, 72], hi: [n] } });
    },
    halfStep(p, rng) {
      const root = pick(p.names || NATURALS, rng), up = rng() < 0.5;
      const ans = up ? ({ E: 'F', B: 'C' }[root] || root + '#') : ({ F: 'E', C: 'B' }[root] || root + 'b');
      const ansPc = E.pcOfName(ans);
      const pool = NATURALS.concat(NATURALS.map(n => n + '#')).concat(NATURALS.map(n => n + 'b')).filter(n => E.pcOfName(n) !== ansPc && !/^(E#|B#|Fb|Cb)$/.test(n)).map(f);
      return mk('hs:' + root + (up ? 'u' : 'd'), 'What note is a half step ' + (up ? 'above ' : 'below ') + f(root) + '?', f(ans), pool,
        'A half step is the very next key, ' + (up ? 'up' : 'down') + ' from ' + f(root) + ': ' + f(ans) + '.', rng);
    },
    intervalName(p, rng) {
      const root = pick(p.roots || ROOTS12, rng), semis = pick(p.ints || [2, 3, 4, 5, 7, 8, 9, 10, 11, 12], rng);
      const top = E.spell(root, semis, INT_STEPS[semis]);
      const m0 = E.midiOf(root + '4');
      const near = [semis - 2, semis - 1, semis + 1, semis + 2].filter(x => x >= 2 && x <= 12 && x !== 6 || x === 6 && semis === 6).map(x => E.INTERVALS[x]);
      const pool = near.concat(Object.keys(E.INTERVALS).filter(k => +k >= 2).map(k => E.INTERVALS[k]));
      return mk('int:' + root + ':' + semis, 'What is the interval from ' + f(root) + ' up to ' + f(top) + '?', E.INTERVALS[semis], near.length >= 3 ? near : pool,
        f(root) + ' to ' + f(top) + ' spans ' + semis + ' half steps: a ' + E.INTERVALS[semis] + '.', rng,
        { listen: { kind: 'notes', notes: [E.midiName(m0), E.midiName(m0 + semis)], d: 1.1 } });
    },
    scaleDegree(p, rng) {
      const key = pick(p.keys || MAJ_ALL, rng), type = pick(p.types || ['major'], rng), deg = pick(p.degs || [2, 3, 4, 5, 6, 7], rng);
      const notes = E.scaleNotes(key, type), label = E.SCALES[type].label.toLowerCase();
      return mk('sd:' + key + ':' + type + ':' + deg, 'In ' + f(key) + ' ' + label + ', which note is the ' + ORD[deg] + ' note of the scale?', f(notes[deg - 1]), notes.map(f),
        f(key) + ' ' + label + ': ' + notes.map(f).join(' – ') + '.', rng);
    },
    keySig(p, rng) {
      const key = pick(p.keys || MAJ_ALL, rng), n = SIG[key];
      const list = n > 0 ? SHARP_ORDER.slice(0, n).map(x => x + '♯') : FLAT_ORDER.slice(0, -n).map(x => x + '♭');
      const why = f(key) + ' major has ' + sigText(n) + (list.length ? ': ' + list.join(', ') + '.' : '.');
      if (rng() < 0.5) {
        const pool = [-3, -2, -1, 0, 1, 2, 3, 4, 5].map(x => x + n).filter(x => x >= -6 && x <= 6).map(sigText);
        return mk('ks:' + key + ':f', 'How many sharps or flats does ' + f(key) + ' major have?', sigText(n), pool, why, rng);
      }
      const pool = MAJ_ALL.filter(k => SIG[k] !== n).map(f);
      return mk('ks:' + key + ':r', 'Which major key has ' + sigText(n) + '?', f(key), pool.filter(x => true), why, rng);
    },
    relMinor(p, rng) {
      const key = pick(p.keys || MAJ_ALL, rng), min = minorOf(key);
      if (rng() < 0.5) {
        return mk('rm:' + key + ':f', 'What is the relative minor of ' + f(key) + ' major?', f(min) + ' minor',
          MAJ_ALL.filter(k => k !== key).map(k => f(minorOf(k)) + ' minor').concat([f(key) + ' minor']), f(min) + ' minor shares the key signature of ' + f(key) + ' major. It starts on the 6th note of the major scale.', rng);
      }
      return mk('rm:' + key + ':r', f(min) + ' minor is the relative minor of which major key?', f(key) + ' major',
        MAJ_ALL.filter(k => k !== key).map(k => f(k) + ' major'), 'Count up three half steps from ' + f(min) + ' to reach ' + f(key) + '. They share a key signature.', rng);
    },
    triadSpelling(p, rng) {
      const [root, qual] = combos(p), names = E.chordNames(root, qual), label = f(root) + ' ' + labelOf(qual);
      const quals = p.quals || [...new Set((p.combos || []).map(c => c[1]))].concat(['major', 'minor', 'dim', 'aug']);
      const correct = names.map(f).join(' – ');
      const pool = quals.filter(q => q !== qual).map(q => E.chordNames(root, q).map(f).join(' – '));
      const others = (p.roots || ROOTS12).filter(r => r !== root).map(r => E.chordNames(r, qual).map(f).join(' – '));
      return mk('ts:' + root + ':' + qual, 'Which notes make ' + label + '?', correct, pool.concat(E.shuffle(others, rng).slice(0, 3)), label + (E.chordSymbol(root, qual) !== f(root) ? ' (' + E.chordSymbol(root, qual) + ')' : '') + ' is ' + correct + '.', rng);
    },
    chordQuality(p, rng) {
      const [root, qual] = combos(p), names = E.chordNames(root, qual);
      const quals = p.quals || [...new Set((p.combos || []).map(c => c[1]))];
      return mk('cq:' + root + ':' + qual, 'Which type of chord is ' + names.map(f).join(' – ') + ' (built on ' + f(root) + ')?', labelOf(qual), quals.map(labelOf),
        names.map(f).join(' – ') + ' is ' + f(root) + ' ' + labelOf(qual) + ', written ' + E.chordSymbol(root, qual) + '.', rng);
    },
    romanToChord(p, rng) {
      const key = pick(p.keys || MAJ_ALL, rng), deg = pick(p.degs || [2, 3, 4, 5, 6, 7], rng), d = E.diatonic(key, !!p.sev);
      return mk('rc:' + key + ':' + deg + (p.sev ? 's' : ''), 'In the key of ' + f(key) + ', which chord is ' + d[deg - 1].roman + '?', d[deg - 1].name, d.map(x => x.name),
        d[deg - 1].roman + ' is chord number ' + deg + ' of the ' + f(key) + ' major scale: ' + d[deg - 1].name + '.', rng);
    },
    chordToRoman(p, rng) {
      const key = pick(p.keys || MAJ_ALL, rng), deg = pick(p.degs || [2, 3, 4, 5, 6, 7], rng), d = E.diatonic(key, !!p.sev);
      return mk('cr:' + key + ':' + deg + (p.sev ? 's' : ''), 'In the key of ' + f(key) + ', the chord ' + d[deg - 1].name + ' is the…', d[deg - 1].roman, d.map(x => x.roman),
        d[deg - 1].name + ' sits on note ' + deg + ' of the ' + f(key) + ' scale, so it is ' + d[deg - 1].roman + '.', rng);
    },
    inversion(p, rng) {
      const [root, qual] = combos(p), names = E.chordNames(root, qual);
      const labels = ['Root position', 'First inversion', 'Second inversion', 'Third inversion'].slice(0, names.length);
      const inv = Math.floor(rng() * names.length), role = ['root', '3rd', '5th', '7th'][inv];
      return mk('inv:' + root + ':' + qual + ':' + inv, 'The ' + f(root) + ' ' + labelOf(qual) + ' chord has ' + f(names[inv]) + ' as its lowest note. Which position is it in?', labels[inv], labels,
        f(names[inv]) + ' is the ' + role + ' of the chord, so this is ' + labels[inv].toLowerCase() + '.', rng, null, labels.length);
    },
    noteValues(p, rng) {
      const [name, b] = pick(NOTE_FACTS, rng);
      return mk('nv:' + name, 'How many beats does ' + NOTE_FOR[b] + ' get in 4/4 time?', beatsText(b), NOTE_FACTS.map(x => beatsText(x[1])), NOTE_FOR[b].replace(/^a/, 'A') + ' lasts ' + beatsText(b).toLowerCase() + '.', rng);
    },
    barFill(p, rng) {
      const ts = pick(p.ts || [3, 4], rng);
      for (let tries = 0; tries < 30; tries++) {
        const parts = [pick([1, 2, 0.5, 1.5], rng)]; if (rng() < 0.6) parts.push(pick([1, 2], rng));
        const sum = parts.reduce((a, x) => a + x, 0), rem = ts - sum;
        if (rem <= 0 || !NOTE_FOR[rem] || parts.some(x => !NOTE_FOR[x])) continue;
        return mk('bf:' + ts + ':' + parts.join('+'), 'A bar of ' + ts + '/4 already has ' + parts.map(x => NOTE_FOR[x]).join(' and ') + '. Which note completes the bar?', NOTE_FOR[rem].replace(/^an? /, '').replace(/^./, c => c.toUpperCase()),
          Object.values(NOTE_FOR).map(x => x.replace(/^an? /, '').replace(/^./, c => c.toUpperCase())), ts + ' beats − ' + sum + ' beats = ' + rem + ' beat' + (rem === 1 ? '' : 's') + ', which is ' + NOTE_FOR[rem] + '.', rng);
      }
      return null;
    },
    transposeChart(p, rng) {
      const keys = p.keys || ['C', 'G', 'D', 'A', 'F', 'Bb', 'Eb', 'E'];
      const progs = p.progs || [[1, 4, 5], [1, 5, 6, 4], [2, 5, 1], [1, 6, 4, 5], [1, 4, 1, 5]];
      const prog = pick(progs, rng), from = pick(keys, rng);
      let to = pick(keys, rng); let g = 0; while (to === from && g++ < 20) to = pick(keys, rng);
      if (to === from) return null;
      const chords = (k, shift) => { const d = E.diatonic(k, !!p.sev); return prog.map(x => d[(x - 1 + (shift || 0)) % 7].name).join(' – '); };
      const correct = chords(to), pool = [chords(from), chords(to, 1), chords(to, 3)].concat(keys.filter(k => k !== to && k !== from).slice(0, 3).map(k => chords(k)));
      return mk('tc:' + prog.join('') + ':' + from + ':' + to, 'This progression is in ' + f(from) + ': ' + chords(from) + '. Which is the same progression in ' + f(to) + '?', correct, pool,
        'Keep the same scale degrees (' + prog.join(' – ') + ') and move them to the key of ' + f(to) + ': ' + correct + '.', rng);
    },
    dominantResolve(p, rng) {
      const key = pick(p.keys || MAJ_ALL, rng), d7 = E.diatonic(key, true)[4], tri = E.diatonic(key, false);
      return mk('dr:' + key, 'In the key of ' + f(key) + ', the chord ' + d7.name + ' (V7) most strongly resolves to…', tri[0].name, tri.map(x => x.name),
        'The dominant 7th pulls home: ' + d7.name + ' resolves to ' + tri[0].name + '.', rng);
    },
    twoFiveOne(p, rng) {
      const key = pick(p.keys || MAJ_ALL, rng), s = E.diatonic(key, true), t = E.diatonic(key, false);
      const correct = [s[1], s[4], s[0]].map(x => x.name).join(' – ');
      const up = E.diatonic(E.spell(key, 7, 4), true);
      const pool = [[t[1], t[4], t[0]].map(x => x.name).join(' – '), [s[3], s[4], s[0]].map(x => x.name).join(' – '), [s[1], s[4], s[3]].map(x => x.name).join(' – '), [up[1], up[4], up[0]].map(x => x.name).join(' – ')];
      return mk('251:' + key, 'Which is the ii – V – I with seventh chords in the key of ' + f(key) + '?', correct, pool,
        'In ' + f(key) + ': ii7 = ' + s[1].name + ', V7 = ' + s[4].name + ', Imaj7 = ' + s[0].name + '.', rng);
    }
  };

  const SEV = ['maj7', 'm7', '7', 'm7b5', 'dim7'];
  const LESSON_GENS = {
    'white-notes': [{ g: 'noteOnKeys', p: {} }],
    'sharps-flats': [{ g: 'halfStep', p: {} }],
    'note-values': [{ g: 'noteValues', p: {} }, { g: 'barFill', p: { ts: [4] } }],
    'time-signatures': [{ g: 'barFill', p: {} }],
    'c-major-scale': [{ g: 'scaleDegree', p: { keys: ['C'] } }, { g: 'halfStep', p: {} }],
    'major-scale-formula': [{ g: 'scaleDegree', p: { keys: ['C', 'G', 'F', 'D', 'Bb'] } }],
    'triad-major': [{ g: 'triadSpelling', p: { combos: [['C', 'major'], ['F', 'major'], ['G', 'major']], quals: ['major', 'minor'] } }],
    'triad-minor': [{ g: 'triadSpelling', p: { combos: [['A', 'minor'], ['D', 'minor'], ['E', 'minor'], ['C', 'major'], ['G', 'major'], ['F', 'major']], quals: ['major', 'minor'] } }],
    'chords-in-key': [{ g: 'romanToChord', p: { keys: ['C'] } }, { g: 'chordToRoman', p: { keys: ['C'] } }],
    'intervals': [{ g: 'intervalName', p: { roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], ints: [2, 3, 4, 5, 7, 8, 9, 10, 11, 12] } }],
    'dim-aug': [{ g: 'triadSpelling', p: { roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], quals: ['dim', 'aug', 'major', 'minor'] } }, { g: 'chordQuality', p: { roots: ['C', 'D', 'E', 'F', 'G', 'A'], quals: ['major', 'minor', 'dim', 'aug'] } }],
    'inversions': [{ g: 'inversion', p: { roots: ['C', 'F', 'G', 'D', 'A', 'Bb'], quals: ['major', 'minor'] } }],
    'circle-fifths': [{ g: 'keySig', p: {} }, { g: 'relMinor', p: {} }],
    'natural-minor': [{ g: 'scaleDegree', p: { keys: ['A', 'E', 'D', 'G', 'C'], types: ['minor'] } }],
    'harmonic-melodic': [{ g: 'scaleDegree', p: { keys: ['A', 'E', 'D'], types: ['harmonic', 'melodic'], degs: [3, 6, 7] } }],
    'sharp-keys': [{ g: 'keySig', p: { keys: ['C', 'G', 'D', 'A', 'E', 'B'] } }, { g: 'scaleDegree', p: { keys: ['G', 'D', 'A', 'E', 'B'] } }],
    'flat-keys': [{ g: 'keySig', p: { keys: ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db'] } }, { g: 'scaleDegree', p: { keys: ['F', 'Bb', 'Eb', 'Ab', 'Db'] } }],
    'minor-keys': [{ g: 'scaleDegree', p: { keys: ['A', 'E', 'B', 'F#', 'C', 'G', 'D', 'F'], types: ['minor'] } }, { g: 'relMinor', p: {} }],
    'progs-keys': [{ g: 'romanToChord', p: {} }, { g: 'transposeChart', p: {} }],
    'chord-charts': [{ g: 'chordToRoman', p: {} }],
    'transpose-basic': [{ g: 'transposeChart', p: {} }],
    'sevenths-deep': [{ g: 'triadSpelling', p: { roots: ['C', 'D', 'F', 'G', 'A', 'Bb'], quals: ['m7b5', 'dim7', '7', 'maj7', 'm7'] } }, { g: 'chordQuality', p: { roots: ['C', 'D', 'F', 'G', 'A'], quals: SEV } }],
    'sevenths-in-key': [{ g: 'romanToChord', p: { sev: true, keys: ['C', 'G', 'F', 'D', 'Bb', 'A', 'Eb'] } }, { g: 'chordToRoman', p: { sev: true, keys: ['C', 'G', 'F', 'D', 'Bb'] } }],
    'dominant-resolution': [{ g: 'dominantResolve', p: {} }],
    'seventh-inversions': [{ g: 'inversion', p: { roots: ['C', 'F', 'G', 'D'], quals: ['maj7', 'm7', '7'] } }],
    'sus-chords': [{ g: 'triadSpelling', p: { roots: ['C', 'D', 'F', 'G', 'A'], quals: ['sus2', 'sus4', '7sus4', 'major'] } }],
    'sixth-chords': [{ g: 'triadSpelling', p: { roots: ['C', 'F', 'G', 'D', 'A'], quals: ['6', 'm6', 'major', 'minor'] } }],
    'ninth-chords': [{ g: 'triadSpelling', p: { roots: ['C', 'F', 'G', 'D'], quals: ['add9', '9', 'maj9', 'm9'] } }],
    'extended-chords': [{ g: 'triadSpelling', p: { roots: ['C', 'G', 'D'], quals: ['9', '13', 'm11', 'm9'] } }],
    'roman-numerals': [{ g: 'romanToChord', p: {} }, { g: 'chordToRoman', p: {} }],
    'two-five-one': [{ g: 'twoFiveOne', p: {} }],
    'transpose-sevenths': [{ g: 'twoFiveOne', p: {} }, { g: 'transposeChart', p: { sev: true } }],
    'g-sevenths': [{ g: 'triadSpelling', p: { roots: ['C', 'F', 'G'], quals: ['maj7', 'm7', '7'] } }],
    'g-passing-dim': [{ g: 'triadSpelling', p: { roots: ['C', 'D', 'E', 'F', 'G', 'A'], quals: ['dim7', 'm7', '7'] } }],
    'staff-clefs': [{ g: 'readNote', p: { clef: 'treble', pool: ['C4', 'D4', 'E4', 'F4', 'G4'] } }, { g: 'readNote', p: { clef: 'bass', pool: ['C3', 'D3', 'E3', 'F3', 'G3'] } }],
    'treble-notes': [{ g: 'readNote', p: { clef: 'treble', pool: ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'] } }],
    'bass-notes': [{ g: 'readNote', p: { clef: 'bass', pool: ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3'] } }],
    'ledger-middle-c': [{ g: 'readNote', p: { clef: 'grand', pool: ['F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'] } }],
    'staff-accidentals': [{ g: 'readNote', p: { clef: 'treble', pool: ['F#4', 'Bb4', 'C#5', 'Eb4', 'G#4', 'Ab4', 'Eb5', 'F#5', 'Bb5'] } }],
    'key-signatures-staff': [{ g: 'readKey', p: { keys: [1, 2, 3, -1, -2, -3] } }],
    'rhythm-notation': [{ g: 'noteValues', p: {} }, { g: 'barFill', p: { ts: [3, 4] } }],
    'chord-symbols-reading': [{ g: 'readChord', p: { combos: [['C', 'major'], ['F', 'major'], ['G', 'major'], ['D', 'major'], ['A', 'minor'], ['D', 'minor'], ['E', 'minor']] } }],
    'first-sight-reading': [{ g: 'readNote', p: { clef: 'grand', pool: ['E3', 'G3', 'B3', 'C4', 'D4', 'F4', 'A4'] } }, { g: 'readNote', p: { clef: 'treble', pool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'] } }]
  };

  function make(spec, rng, seenKeys) {
    for (let i = 0; i < 14; i++) {
      let q = null;
      try { q = GEN[spec.g](spec.p || {}, rng); } catch (e) { q = null; }
      if (q && !seenKeys.has(q.k)) { seenKeys.add(q.k); return q; }
    }
    return null;
  }
  /* Choose n questions for a lesson: new variants first, then the least-seen fixed questions. */
  function buildQuiz(L, n, rng) {
    rng = rng || Math.random;
    const rec = S.lessons[L.id] || {}, seen = rec.seen || {};
    const stat = L.quiz.map((q, i) => Object.assign({}, q, { k: 's:' + L.id + ':' + i, lid: L.id }));
    const specs = LESSON_GENS[L.id];
    if (!specs || !specs.length) return n && n < stat.length ? E.shuffle(stat, rng).slice(0, n) : stat;
    const want = n || 5, keys = new Set(), gens = [];
    for (let i = 0; i < want * 3 && gens.length < want * 2; i++) { const q = make(specs[i % specs.length], rng, keys); if (q) { q.lid = L.id; gens.push(q); } }
    const bySeen = arr => E.shuffle(arr, rng).sort((a, b) => (seen[a.k] || 0) - (seen[b.k] || 0));
    const g = bySeen(gens), s = bySeen(stat);
    const nGen = Math.min(g.length, Math.ceil(want * 0.6));
    let out = g.slice(0, nGen).concat(s.slice(0, Math.max(0, want - nGen)));
    if (out.length < want) out = out.concat(g.slice(nGen, nGen + want - out.length));
    return E.shuffle(out.slice(0, want), rng);
  }
  function markSeen(lid, k) {
    if (!k || !lid) return;
    const r = lessonRec(lid); r.seen = r.seen || {};
    r.seen[k] = (r.seen[k] || 0) + 1;
    const ks = Object.keys(r.seen);
    if (ks.length > 150) ks.slice(0, ks.length - 150).forEach(x => { delete r.seen[x]; });
    touch();
  }
  function variantCount(L) { return (LESSON_GENS[L.id] || []).length; }
  return { GEN, LESSON_GENS, buildQuiz, markSeen, variantCount };
})();
App.QG = QG;
