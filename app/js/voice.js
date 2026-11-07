'use strict';
/* ---------------------------------------------------------------- Vocal Studio
   Voice training with the microphone. Pitch comes from Pitch.track (YIN). Every exercise is pitched to
   the singer's measured range. Most exercises are call and response: the app plays, then you sing while
   the app is silent, so the piano does not leak into the microphone. Each sung note is graded by how
   many cents it is from the target (a man may sing a line an octave below and still score). Timed
   exercises (runs) grade each note inside its moment of the beat.

   Saved in S.voice: { range: {lo, hi, at}, sessions: [{d, ex, score, inTune, cents, n}], best: {ex: score},
   sustain: best seconds, warm: {n, last}, lessons: {id: true} } */

/* draw canvases at the size they are shown, so labels stay readable on a phone */
function fitCanvas(cv) {
  const dpr = window.devicePixelRatio || 1, w = Math.round((cv.clientWidth || 900) * dpr), h = Math.round((cv.clientHeight || 220) * dpr);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { W: cv.clientWidth || 900, H: cv.clientHeight || 220 };
}

/* ---- grading ---- */
const VOX_TOL = 25;                     // within 25 cents counts as in tune
function voxNoteScore(c) { return c == null ? 0 : Math.max(0, Math.min(100, Math.round(100 - Math.max(0, Math.abs(c) - 10) * 2.2))); }
function voxWord(c) { if (c == null) return 'missed'; const a = Math.abs(c); return a <= 10 ? 'spot on' : a <= VOX_TOL ? 'in tune' : (c > 0 ? 'sharp (too high)' : 'flat (too low)'); }
const voxName = m => fmt(E.midiName(Math.round(m)));
const centsStr = c => c == null ? '' : (c > 0 ? '+' : c < 0 ? '−' : '±') + Math.abs(Math.round(c)) + '¢';

/* ---- the singer's range ---- */
const VOICE_TYPES = [
  { id: 'bass', name: 'Bass', lo: 40, hi: 64 }, { id: 'baritone', name: 'Baritone', lo: 43, hi: 67 },
  { id: 'tenor', name: 'Tenor', lo: 48, hi: 72 }, { id: 'alto', name: 'Alto', lo: 53, hi: 77 },
  { id: 'mezzo', name: 'Mezzo-soprano', lo: 57, hi: 81 }, { id: 'soprano', name: 'Soprano', lo: 60, hi: 84 }
];
function voiceType(r) {
  if (!r) return null;
  // the type whose comfortable range has the nearest middle (a guide only)
  const mid = (r.lo + r.hi) / 2;
  return VOICE_TYPES.reduce((best, v) => Math.abs((v.lo + v.hi) / 2 - mid) < Math.abs((best.lo + best.hi) / 2 - mid) ? v : best);
}
function voxState() { if (!S.voice) S.voice = {}; const v = S.voice; v.sessions = v.sessions || []; v.best = v.best || {}; v.lessons = v.lessons || {}; return v; }
function voxRange() { const v = voxState(); return v.range || (v.guess === 'high' ? { lo: 57, hi: 76, guess: true } : { lo: 45, hi: 64, guess: true }); }
/* the middle of the range, where exercises start: two semitones in from each end */
const voxZone = () => { const r = voxRange(); return { lo: r.lo + 2, hi: r.hi - 2 }; };

/* ---- exercise library ---- */
const VEX = [
  { id: 'match', title: 'Match the note', kind: 'match', mins: 3, about: 'The app plays a note; you sing it and hold it steady. The foundation of singing in tune.', tip: 'Listen to the whole note first, then hum it inside before you sing.' },
  { id: 'five', title: 'Five-note scale', kind: 'pattern', pattern: [0, 2, 4, 5, 7, 5, 4, 2, 0], rounds: 5, mins: 4, about: 'Do re mi fa so fa mi re do, rising a half step each round. The classic warm-up.', tip: 'Sing on "ah" or "oo". Keep the vowel the same on every note.' },
  { id: 'arp', title: 'Arpeggio and octave', kind: 'pattern', pattern: [0, 4, 7, 12, 7, 4, 0], rounds: 4, mins: 4, about: '1 – 3 – 5 – 8 and back. Stretches your range smoothly into the upper voice.', tip: 'Let the top note feel light. Do not push it.' },
  { id: 'scale', title: 'Major scale', kind: 'pattern', pattern: [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0], rounds: 3, mins: 5, about: 'A full octave up and down. Watch the half steps (mi–fa and ti–do): they are often sung too wide.', tip: 'Think of the half steps as small; many singers sing them sharp.' },
  { id: 'minor', title: 'Minor five-note scale', kind: 'pattern', pattern: [0, 2, 3, 5, 7, 5, 3, 2, 0], rounds: 4, mins: 4, about: 'The minor sound: the third is one half step lower.', tip: 'Hear the darker third before you sing it.' },
  { id: 'interval', title: 'Sing the interval', kind: 'interval', mins: 4, about: 'The app plays a starting note and names an interval; you find the note above without hearing it.', tip: 'Use song openings: a 4th is "Here comes the bride", a 5th is "Twinkle, twinkle".' },
  { id: 'sustain', title: 'Long, steady note', kind: 'sustain', mins: 3, about: 'Breath and support: hold one note, steady in pitch, for as long as you can.', tip: 'Breathe low into your belly and ribs. Let the air out slowly, as if through a straw.' },
  { id: 'echo', title: 'Echo the phrase', kind: 'echo', mins: 4, about: 'The app plays a short phrase; you sing it back. Builds your ear and musical memory, like learning a song by ear.', tip: 'Listen for the shape first: does it go up, down, or turn?' },
  { id: 'runs', title: 'Gospel runs', kind: 'runs', mins: 5, about: 'Pentatonic runs sung in time with the beat. Each round that is clean gets a little faster.', tip: 'Accuracy before speed. Every note of a run should be a real note.' },
  { id: 'harmony', title: 'Harmony: a third below', kind: 'harmony', mins: 5, about: 'The app plays the melody note by note; you sing the harmony a third below, the way altos and tenors often sing.', tip: 'Hold your own line. Listen to the melody, then find the note a third under it.' }
];
const vexById = id => VEX.find(x => x.id === id);

/* the warm-up: about 10 minutes, unscored steps first, then graded ones */
const VOX_WARMUP = [
  { kind: 'self', title: 'Breath', mins: 1, text: 'Stand tall, shoulders down. Breathe in low for 4 counts (belly and ribs widen), hiss out on "sss" for 8 counts. Then 12, then 16. Three times.' },
  { kind: 'self', title: 'Lip trills and sirens', mins: 1, text: 'Lip trill ("brrr") or hum, sliding gently from low to high and back like a siren. Five times, never forcing.' },
  { kind: 'ex', id: 'five', rounds: 3 },
  { kind: 'ex', id: 'arp', rounds: 2 },
  { kind: 'ex', id: 'match', count: 4 },
  { kind: 'ex', id: 'sustain' },
  { kind: 'ex', id: 'echo', count: 3 }
];

/* ---- building the targets for an exercise from the singer's range ---- */
function vexRounds(def, o) {
  const z = voxZone(), span = Math.max.apply(null, def.pattern), want = (o && o.rounds) || def.rounds || 4;
  const out = [];
  for (let s = z.lo; s + span <= z.hi + 2 && out.length < want; s++) out.push(def.pattern.map(p => s + p));
  if (!out.length) out.push(def.pattern.map(p => z.lo + p));   // a narrow range: one round at the bottom
  return out;
}
function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function vexMatch(n) { const z = voxZone(), out = []; let last = null; while (out.length < n) { const m = rnd(z.lo, z.hi); if (m !== last) { out.push([m]); last = m; } } return out; }
const INTERVALS = [[4, 'a major 3rd'], [7, 'a perfect 5th'], [5, 'a perfect 4th'], [12, 'an octave'], [2, 'a major 2nd'], [9, 'a major 6th'], [3, 'a minor 3rd']];
function vexIntervals(n) {
  const z = voxZone(), out = [];
  for (let i = 0; i < n; i++) { const [st, name] = INTERVALS[i % INTERVALS.length]; const root = rnd(z.lo, Math.max(z.lo, z.hi - st)); out.push({ root, target: root + st, name }); }
  return out;
}
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
function vexEcho(n) {
  const z = voxZone(), out = [];
  for (let i = 0; i < n; i++) {
    const len = 3 + Math.min(2, Math.floor(i / 2)), top = Math.max(z.lo, z.hi - 9), base = rnd(z.lo, top);
    let idx = rnd(0, 3); const ph = [base + PENTA[idx]];
    while (ph.length < len) { idx = Math.max(0, Math.min(5, idx + [-2, -1, 1, 2][rnd(0, 3)])); const m = base + PENTA[idx]; if (m !== ph[ph.length - 1] && m <= voxRange().hi) ph.push(m); }
    out.push(ph);
  }
  return out;
}
const RUNS = [[12, 9, 7, 4, 2, 0], [0, 2, 4, 7, 9, 7, 4, 2, 0], [7, 9, 12, 9, 7, 4, 2, 0], [4, 2, 0, 2, 4, 7, 4, 2, 0]];
const HARM_MELODIES = [[3, 4, 5, 4, 3], [5, 4, 3, 2, 3], [3, 5, 6, 5, 3], [5, 6, 5, 4, 3, 2, 3]];
/* melody degrees in a major key, and the harmony a diatonic third below */
function vexHarmony(n) {
  const z = voxZone(), out = [], MAJ = [0, 2, 4, 5, 7, 9, 11];
  const deg = (tonic, d) => tonic + 12 * Math.floor((d - 1) / 7) + MAJ[((d - 1) % 7 + 7) % 7];
  for (let i = 0; i < n; i++) {
    const mel = HARM_MELODIES[i % HARM_MELODIES.length];
    // choose the key so the harmony line sits low in the zone and the melody stays within the range
    let tonic = z.lo; while (deg(tonic, Math.min.apply(null, mel) - 2) < z.lo) tonic++;
    while (deg(tonic, Math.max.apply(null, mel)) > voxRange().hi + 2 && tonic > z.lo - 12) tonic--;
    out.push({ melody: mel.map(d => deg(tonic, d)), harmony: mel.map(d => deg(tonic, d - 2)), key: tonic });
  }
  return out;
}

/* ---- playing reference notes ---- */
function voxPlay(notes, o) {
  o = o || {};
  const bpm = o.bpm || 100, d = o.d || 1, ev = [];
  notes.forEach((m, i) => ev.push({ t: i * d, d: d * 0.92, notes: [m], vel: 0.75 }));
  if (o.clicks) for (let i = 0; i < o.clicks; i++) ev.push({ t: notes.length * d + i, d: 0.1, click: i === 0 ? 2 : 1 });
  const total = notes.length * d + (o.clicks || 0);
  return Snd.play({ events: ev, bpm, total }, { force: true, inst: () => 'piano', onEnd: o.onEnd, onStart: o.onStart });
}

/* ---- clear directions for every exercise ---- */
const VEX_STEPS = {
  match: ['Listen: the app plays one note.', 'When the banner turns green and says YOUR TURN, sing that note on "ah".', 'Hold it steady until its box turns green (about half a second).', 'Watch the line: above the target means sharp (relax down a little); below means flat (lift a little).', 'Missed it? Press Hear it again.'],
  pattern: ['Listen to the pattern once.', 'At YOUR TURN, sing the notes in order. Hold each one until its box turns green, then go to the next.', 'Take your time: the app waits for each note.', 'Each round starts a half step higher. Keep the same vowel ("ah" or "oo") all the way.'],
  echo: ['Listen to the short phrase.', 'At YOUR TURN, sing it back, holding each note until its box turns green.', 'If you forget it, press Hear it again.'],
  interval: ['The app plays a starting note and names an interval (for example "a perfect 5th").', 'At YOUR TURN, sing the note that interval above the starting note, without hearing it first.', 'Hold it until it turns green. Then the app plays the right note so you can compare.'],
  sustain: ['Listen to the note and take a low, full breath (belly and ribs widen).', 'At YOUR TURN, sing it on "ah" and hold it as long and as steady as you can.', 'Keep the line flat and green. The timer shows how long you hold it.', 'Stop when you run out of breath: the app scores the length and the steadiness.'],
  runs: ['Listen to the run, then four clicks count you in.', 'Straight after the clicks, sing the run at the same speed without stopping.', 'This one is timed: do not wait for green boxes. Each note is scored at its moment.', 'A clean run makes the next one a little faster.'],
  harmony: ['The app plays one melody note at a time. Its name is under each box.', 'After each melody note, sing the harmony note in the box: a third below the melody.', 'Hold it until it turns green; then the next melody note plays.', 'Headphones help most here.']
};
const VEX_BEFORE = ['Wear headphones if you have them. If not, keep the speakers at a medium volume: the app waits for the piano to fade before it listens.', 'Sit or stand tall, about a hand-width from the microphone.', 'When you press Start, stay quiet for one second while the app measures the room.'];

/* ---- the exercise runner ----
   kinds: match, pattern, echo, interval (wait for each note), sustain (hold), runs (timed), harmony (wait, melody prompts) */
function runVoiceEx(host, def, opts) {
  opts = opts || {};
  const $q = s => $(s, host);
  const kind = def.kind;
  let items;
  if (kind === 'pattern') items = vexRounds(def, opts).map(r => ({ play: r, sing: r }));
  else if (kind === 'match') items = vexMatch(opts.count || 6).map(r => ({ play: r, sing: r, hold: 1.0 }));
  else if (kind === 'echo') items = vexEcho(opts.count || 5).map(r => ({ play: r, sing: r }));
  else if (kind === 'interval') items = vexIntervals(opts.count || 6).map(q => ({ play: [q.root], sing: [q.target], label: 'Sing ' + q.name + ' above ' + voxName(q.root), reveal: q.target }));
  else if (kind === 'sustain') { const z = voxZone(), m = Math.round((z.lo + z.hi) / 2) - 2; items = [{ play: [m], sing: [m], sustain: true }]; }
  else if (kind === 'runs') { const z = voxZone(); items = []; let step = 0.42; for (let i = 0; i < (opts.rounds || 6); i++) { const pat = RUNS[i % RUNS.length], span = Math.max.apply(null, pat); const base = Math.max(z.lo, Math.min(z.hi - span, z.lo + rnd(0, 3))); items.push({ play: pat.map(p => base + p), sing: pat.map(p => base + p), timed: true, step }); } }
  else if (kind === 'harmony') items = vexHarmony(opts.count || 3).map(h => ({ play: h.melody, sing: h.harmony, melody: h.melody, harmony: true }));
  const results = [];             // one entry per sung note: { target, cents, score, steady }
  let iItem = 0, iNote = 0, phase = 'idle', tracker = null, player = null, seg = [], lastOk = 0, noteStart = 0, timer = null, stopped = false;
  let trace = [], cur = null, holdBest = 0, holdStart = null, lastVoiced = 0, timedFrames = [], timedT0 = 0;

  host.innerHTML = '<div class="vx">' +
    '<div class="vx-phase" id="vxphase" data-p="wait">Get ready</div>' +
    '<div class="vx-head"><div><p class="eyebrow">' + esc(def.title) + '</p><p class="vx-instr" id="vxinstr">Get ready…</p><div class="vx-level" title="Microphone level"><i id="vxlevel"></i></div></div><div class="vx-read"><b class="mono" id="vxnote">–</b><span class="mono" id="vxcents"></span></div></div>' +
    '<div class="vx-needle"><span class="vx-zone"></span><i id="vxneedle"></i></div>' +
    '<canvas class="vx-trace" id="vxtrace" width="900" height="220" aria-label="Your pitch over time against the target notes"></canvas>' +
    '<div class="vx-targets" id="vxtargets"></div>' +
    '<p class="vx-fb" id="vxfb" aria-live="polite"></p>' +
    '<div class="row wrap"><button class="btn ghost sm" type="button" id="vxagain">' + icon('replay') + 'Hear it again</button><button class="btn ghost sm" type="button" id="vxskip">Skip this one</button><button class="btn ghost sm" type="button" id="vxstop">' + icon('stop') + 'Stop</button></div></div>';
  const phaseEl = $q('#vxphase'), levelEl = $q('#vxlevel');
  const setPhase = (p, text) => { if (phaseEl) { phaseEl.dataset.p = p; phaseEl.textContent = text; } };
  let noise = [], quiet = 0.012, settleStart = 0, lastLoud = 0;
  const instr = $q('#vxinstr'), noteEl = $q('#vxnote'), centsEl = $q('#vxcents'), needle = $q('#vxneedle'), cv = $q('#vxtrace'), tg = $q('#vxtargets'), fbEl = $q('#vxfb');
  const g2 = cv.getContext('2d');
  const item = () => items[iItem];
  const target = () => item() && item().sing[iNote];

  function paintTargets() {
    const it = item(); if (!it) { tg.innerHTML = ''; return; }
    tg.innerHTML = it.sing.map((m, k) => {
      const r = results.find(x => x.item === iItem && x.k === k);
      const cls = r ? (r.cents == null ? 'miss' : Math.abs(r.cents) <= VOX_TOL ? 'ok' : 'off') : (phase === 'sing' && k === iNote ? 'cur' : '');
      return '<span class="vx-t ' + cls + '"><b>' + esc(voxName(m)) + '</b>' + (r ? '<small>' + (r.cents == null ? '–' : centsStr(r.cents)) + '</small>' : '') + (it.harmony ? '<small class="mel">over ' + esc(voxName(it.melody[k])) + '</small>' : '') + '</span>';
    }).join('');
  }
  function drawTrace() {
    const { W, H } = fitCanvas(cv), now = Snd.now(), span = 6;
    const it = item(), tgts = it ? it.sing.concat(it.melody || []) : [60];
    let lo = Math.min.apply(null, tgts) - 4, hi = Math.max.apply(null, tgts) + 4;
    const vals = trace.filter(p => p.m != null && now - p.t < span).map(p => p.m);
    if (vals.length) { lo = Math.min(lo, Math.floor(Math.min.apply(null, vals)) - 1); hi = Math.max(hi, Math.ceil(Math.max.apply(null, vals)) + 1); }
    if (hi - lo < 12) { const mid = (hi + lo) / 2; lo = mid - 6; hi = mid + 6; }
    const y = m => H - 8 - (m - lo) / (hi - lo) * (H - 16);
    const css = getComputedStyle(document.documentElement);
    const line = css.getPropertyValue('--line').trim() || '#ccc', muted = css.getPropertyValue('--muted').trim() || '#888', acc = css.getPropertyValue('--accent').trim() || '#a02040', ok = css.getPropertyValue('--ok').trim() || '#2a8', warn = css.getPropertyValue('--warn').trim() || '#d80';
    g2.clearRect(0, 0, W, H);
    g2.font = '12px ' + (css.getPropertyValue('--font-mono') || 'monospace'); g2.textBaseline = 'middle';
    for (let m = Math.ceil(lo); m <= hi; m++) { if ([1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12)) continue; g2.strokeStyle = line; g2.globalAlpha = 0.6; g2.beginPath(); g2.moveTo(40, y(m)); g2.lineTo(W, y(m)); g2.stroke(); g2.globalAlpha = 1; g2.fillStyle = muted; g2.fillText(voxName(m), 4, y(m)); }
    if (it) [...new Set(it.sing)].forEach(m => { g2.strokeStyle = acc; g2.lineWidth = m === target() && phase === 'sing' ? 3 : 1.5; g2.globalAlpha = m === target() && phase === 'sing' ? 1 : 0.45; g2.beginPath(); g2.moveTo(40, y(m)); g2.lineTo(W, y(m)); g2.stroke(); g2.globalAlpha = 1; g2.lineWidth = 1; });
    let prev = null;
    trace.forEach(p => {
      if (now - p.t > span) return;
      const x = 40 + (W - 48) * (1 - (now - p.t) / span);
      if (p.m == null) { prev = null; return; }
      const c = p.c == null ? 999 : Math.abs(p.c);
      g2.strokeStyle = g2.fillStyle = c <= VOX_TOL ? ok : c <= 50 ? warn : acc;
      if (prev) { g2.lineWidth = 3; g2.beginPath(); g2.moveTo(prev.x, prev.y); g2.lineTo(x, y(p.m)); g2.stroke(); g2.lineWidth = 1; }
      prev = { x, y: y(p.m) };
    });
  }
  function readout(f) {
    if (!f || f.midi == null) { noteEl.textContent = '–'; centsEl.textContent = ''; needle.style.left = '50%'; needle.className = ''; return; }
    const tgt = phase === 'sing' ? target() : null;
    const c = tgt != null ? Pitch.centsToTarget(f.midi, tgt, true) : (f.midi - Math.round(f.midi)) * 100;
    noteEl.textContent = voxName(f.midi); centsEl.textContent = centsStr(c);
    needle.style.left = (50 + Math.max(-50, Math.min(50, c))) + '%';
    needle.className = Math.abs(c) <= VOX_TOL ? 'ok' : Math.abs(c) <= 50 ? 'near' : 'far';
  }
  const fb = (t, cls) => { fbEl.textContent = t; fbEl.className = 'vx-fb' + (cls ? ' ' + cls : ''); };

  function record(cents, steady) {
    results.push({ item: iItem, k: iNote, target: target(), cents, steady, score: voxNoteScore(cents) });
    paintTargets();
  }
  function finishNote(cents, steady) {
    record(cents, steady);
    const it = item();
    fb(cents == null ? 'Missed. Listen again on the next one.' : voxName(target()) + ': ' + voxWord(cents) + ' (' + centsStr(cents) + ').', cents != null && Math.abs(cents) <= VOX_TOL ? 'ok' : 'bad');
    iNote++; seg = [];
    if (iNote >= it.sing.length) {
      if (it.reveal) { phase = 'pause'; player = voxPlay([it.reveal], { d: 1 }); }
      nextItem(1100);
    } else if (it.harmony) promptHarmony();
    else { noteStart = Snd.now(); paintTargets(); }
  }
  function nextItem(delay) {
    phase = 'pause'; clearTimeout(timer);
    timer = setTimeout(() => { if (stopped) return; iItem++; iNote = 0; if (iItem >= items.length) finishAll(); else startItem(); }, delay || 700);
  }
  function startItem() {
    setPhase('listen', 'Listen');
    const it = item(); iNote = 0; seg = []; holdBest = 0; holdStart = null; paintTargets();
    if (it.harmony) { instr.textContent = 'The app plays a melody note; sing the note a third below it. Hold each note until it turns green.'; promptHarmony(); return; }
    phase = 'listen';
    instr.textContent = it.label ? it.label + '. Listen to the starting note…' : it.sustain ? 'Listen, then hold this note as long as you can, steady.' : it.timed ? 'Listen to the run, then sing it in time after the clicks.' : 'Listen…';
    const d = it.timed ? it.step * 100 / 60 : kind === 'match' ? 1.6 : kind === 'interval' ? 1.4 : 0.75;
    player = voxPlay(it.play, it.timed ? { bpm: 100, d: it.step * 100 / 60, clicks: 4 } : { bpm: 60, d });
    const len = it.timed ? (it.play.length * it.step * 100 / 60 + 4) * 60 / 100 : it.play.length * d;
    clearTimeout(timer);
    timer = setTimeout(() => { if (stopped) return; settle(beginSing); }, len * 1000 + 120);
  }
  function promptHarmony() {
    const it = item(); phase = 'listen'; setPhase('listen', 'Listen: melody note'); paintTargets();
    player = voxPlay([it.melody[iNote]], { bpm: 60, d: 1.1 });
    clearTimeout(timer);
    timer = setTimeout(() => { if (!stopped) settle(() => { phase = 'sing'; setPhase('sing', 'Your turn: sing'); noteStart = Snd.now(); seg = []; paintTargets(); fb(''); }); }, 1150);
  }
  /* wait for the reference note to fade from the speakers, so the microphone does not mistake it for you */
  let afterSettle = null;
  function settle(fn) { phase = 'settle'; setPhase('wait', 'Wait…'); instr.textContent = 'Wait a moment for the piano to fade…'; settleStart = Snd.now(); lastLoud = settleStart; afterSettle = fn; }
  function beginSing() {
    const it = item();
    setPhase('sing', it.timed ? 'Your turn: sing the run now' : 'Your turn: sing');
    phase = 'sing'; noteStart = Snd.now(); seg = []; paintTargets(); fb('');
    if (it.sustain) { instr.textContent = 'Now: hold ' + voxName(it.sing[0]) + ' as long as you can.'; holdStart = null; return; }
    if (it.timed) { instr.textContent = 'Now: sing the run in time!'; timedT0 = Snd.now(); timedFrames = []; clearTimeout(timer); timer = setTimeout(() => { if (!stopped) gradeTimed(); }, (it.sing.length * it.step + 0.4) * 1000); return; }
    instr.textContent = it.label ? it.label + '. Sing it now.' : 'Your turn: sing ' + (it.sing.length > 1 ? 'each note' : 'the note') + ' and hold it until it turns green.';
  }
  function gradeTimed() {
    const it = item();
    it.sing.forEach((m, k) => {
      const a = timedT0 + k * it.step + it.step * 0.25, b = timedT0 + (k + 1) * it.step - it.step * 0.05;
      const cs = timedFrames.filter(f => f.t >= a && f.t <= b && f.m != null).map(f => Pitch.centsToTarget(f.m, m, true)).filter(c => Math.abs(c) < 150);
      iNote = k; record(cs.length >= 2 ? Pitch.median(cs) : null, null);
    });
    const sc = results.filter(r => r.item === iItem).map(r => r.score), avg = sc.reduce((a, x) => a + x, 0) / sc.length;
    if (avg >= 70 && items[iItem + 1]) { items[iItem + 1].step = Math.max(0.2, it.step * 0.88); fb('Clean run (' + Math.round(avg) + '). The next one is a little faster.', 'ok'); }
    else fb('Run scored ' + Math.round(avg) + '. ' + (avg < 50 ? 'Slow down in your head: every note must be a real note.' : 'Nearly: same speed again.'), avg >= 50 ? '' : 'bad');
    if (avg < 70 && items[iItem + 1]) items[iItem + 1].step = it.step;
    nextItem(1500);
  }
  function onFrame(f) {
    if (stopped) return;
    const tNow = f.t;
    const tgt = phase === 'sing' ? target() : null;
    const c = tgt != null && f.midi != null ? Pitch.centsToTarget(f.midi, tgt, true) : null;
    if (levelEl) levelEl.style.width = Math.min(100, Math.round(Math.sqrt(f.level) * 160)) + '%';
    if (phase === 'calib') { noise.push(f.level); return; }
    if (phase === 'settle') {
      if (f.level > quiet) lastLoud = tNow;
      if ((tNow - lastLoud > 0.18 && tNow - settleStart > 0.2) || tNow - settleStart > 2.5) { const fn = afterSettle; afterSettle = null; fn(); }
      return;
    }
    trace.push({ t: tNow, m: f.midi, c }); if (trace.length > 600) trace.shift();
    readout(f); drawTrace();
    if (phase !== 'sing') return;
    const it = item();
    if (it.timed) { timedFrames.push({ t: tNow, m: f.midi }); return; }
    if (it.sustain) {
      if (f.midi != null && Math.abs(c) <= 40) { if (holdStart == null) holdStart = tNow; lastVoiced = tNow; seg.push(c); }
      else if (holdStart != null && tNow - lastVoiced > 0.25) {
        const secs = lastVoiced - holdStart;
        if (secs >= 1) { const sd = stdev(seg); holdBest = secs; finishSustain(secs, Pitch.median(seg), sd); return; }
        holdStart = null; seg = [];
      }
      if (holdStart != null) instr.textContent = 'Holding ' + voxName(it.sing[0]) + ': ' + (tNow - holdStart).toFixed(1) + ' s';
      if (tNow - noteStart > 60) finishSustain(holdStart != null ? tNow - holdStart : 0, seg.length ? Pitch.median(seg) : null, stdev(seg));
      return;
    }
    const need = it.hold || 0.5;
    if (f.midi != null && Math.abs(c) <= 60) {
      if (!seg.length) seg.start = tNow;
      seg.push(c); lastOk = tNow;
      if (tNow - seg.start >= need) { const use = seg.slice(Math.floor(seg.length * 0.3)); finishNote(Pitch.median(use), stdev(use)); return; }
    } else if (seg.length && tNow - lastOk > 0.15) seg = [];
    if (tNow - noteStart > 8) finishNote(null, null);
  }
  function finishSustain(secs, cents, sd) {
    phase = 'pause';
    results.push({ item: iItem, k: 0, target: item().sing[0], cents, steady: sd, score: voxNoteScore(cents), seconds: Math.round(secs * 10) / 10 });
    paintTargets();
    fb('You held it for ' + secs.toFixed(1) + ' seconds' + (cents != null ? ', ' + voxWord(cents) + ' on average, ' + (sd < 12 ? 'very steady' : sd < 25 ? 'fairly steady' : 'wavering: steadier breath will help') : '') + '.', secs >= 10 ? 'ok' : '');
    nextItem(2200);
  }
  function stdev(a) { if (a.length < 2) return 0; const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / a.length); }
  function finishAll() {
    phase = 'done'; stopAll();
    const sung = results.filter(r => r.cents != null), n = results.length;
    const score = n ? Math.round(results.reduce((a, r) => a + r.score, 0) / n) : 0;
    const inTune = n ? Math.round(100 * results.filter(r => r.cents != null && Math.abs(r.cents) <= VOX_TOL).length / n) : 0;
    const lean = sung.length ? Math.round(sung.reduce((a, r) => a + r.cents, 0) / sung.length) : 0;
    const secs = results.filter(r => r.seconds != null).map(r => r.seconds);
    const summary = { ex: def.id, score, inTune, cents: lean, n, seconds: secs.length ? Math.max.apply(null, secs) : null };
    instr.textContent = 'Finished.';
    host.querySelector('.vx').insertAdjacentHTML('beforeend', '<div class="vx-sum"><h3>' + score + ' / 100</h3><p>' + inTune + '% of notes in tune' + (summary.seconds != null ? ' · held ' + summary.seconds + ' s' : '') + '. ' +
      (sung.length >= 4 && Math.abs(lean) >= 12 ? 'You tend to sing ' + (lean > 0 ? 'sharp (a little high)' : 'flat (a little low)') + ' by about ' + Math.abs(lean) + ' cents: ' + (lean > 0 ? 'relax and let the note settle.' : 'keep the breath flowing and think the note slightly higher.') : sung.length >= 4 ? 'No sharp or flat tendency: well centred.' : '') + '</p></div>');
    if (opts.onDone) opts.onDone(summary, results);
  }
  function stopAll() { clearTimeout(timer); if (player) { try { player.stop(); } catch (e) { /* ignore */ } } }
  $q('#vxagain').addEventListener('click', () => { if (phase === 'done' || !item()) return; stopAll(); results.splice(0, results.length, ...results.filter(r => r.item !== iItem)); if (item().harmony) promptHarmony(); else startItem(); });
  $q('#vxskip').addEventListener('click', () => { if (phase === 'done' || !item()) return; stopAll(); while (item() && iNote < item().sing.length) { record(null, null); iNote++; } nextItem(300); });
  $q('#vxstop').addEventListener('click', () => { stopped = true; stopAll(); if (tracker) tracker.stop(); if (opts.onStop) opts.onStop(); });

  function calibrate() {
    phase = 'calib'; noise = []; setPhase('wait', 'Quiet for a moment'); instr.textContent = 'Stay quiet for a second while the app listens to the room…';
    timer = setTimeout(() => {
      if (stopped) return;
      const n = noise.length ? Pitch.median(noise) : 0.004;
      const gate = Math.max(0.007, Math.min(0.03, n * 2.5)); quiet = Math.max(0.009, Math.min(0.06, n * 2));
      if (tracker.setGate) tracker.setGate(gate);
      if (n > 0.04) fb('The room is noisy. Move somewhere quieter or closer to the microphone for accurate results.', 'bad');
      startItem();
    }, 1000);
  }
  const begin = () => {
    tracker = Pitch.track(onFrame, {
      deviceId: S.prefs.micId || null,
      onError: () => { setPhase('wait', 'Microphone problem'); instr.textContent = 'The microphone could not be opened. ' + MIC_HELP; },
      onReady: () => { if (!stopped) calibrate(); }
    });
  };
  if (opts.skipIntro) begin();
  else {
    // the directions first: what to do, step by step, then Start
    const intro = document.createElement('div'); intro.className = 'vx-intro';
    intro.innerHTML = '<h3>' + esc(def.title) + '</h3><p class="muted">' + esc(def.about || '') + '</p><p class="eyebrow">Before you start</p><ol>' + VEX_BEFORE.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
      '<p class="eyebrow">How this exercise works</p><ol>' + (VEX_STEPS[kind] || []).map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' + (def.tip ? '<p class="tiny">Tip: ' + esc(def.tip) + '</p>' : '') +
      '<button class="btn primary" type="button">' + icon('play') + 'Start</button>';
    const box = host.querySelector('.vx'); box.hidden = true; host.prepend(intro);
    intro.querySelector('button').addEventListener('click', () => { intro.remove(); box.hidden = false; begin(); });
  }
  return { stop() { stopped = true; stopAll(); if (tracker) tracker.stop(); }, results };
}

/* ---- saving results ---- */
function voxSave(sum) {
  const v = voxState();
  v.sessions.push({ d: E.dateStr(), ex: sum.ex, score: sum.score, inTune: sum.inTune, cents: sum.cents, n: sum.n });
  if (v.sessions.length > 300) v.sessions.splice(0, v.sessions.length - 300);
  if ((v.best[sum.ex] || 0) < sum.score) v.best[sum.ex] = sum.score;
  if (sum.seconds != null && (v.sustain || 0) < sum.seconds) v.sustain = sum.seconds;
  touch();
}

/* ---- range finder ---- */
function runRangeFinder(host, onDone) {
  host.innerHTML = '<div class="vx"><div class="vx-head"><div><p class="eyebrow">Find your range</p><p class="vx-instr" id="rfinstr">Sing your <b>lowest comfortable</b> note on "ah" and hold it for two seconds. Not a growl: a note you could sing in a song.</p></div><div class="vx-read"><b class="mono" id="rfnote">–</b></div></div>' +
    '<div class="vx-range"><span>Lowest <b id="rflo">–</b></span><span>Highest <b id="rfhi">–</b></span></div>' +
    '<div class="row wrap"><button class="btn primary" type="button" id="rfnext" disabled>That is my lowest note</button><button class="btn ghost" type="button" id="rfredo">' + icon('replay') + 'Start again</button></div></div>';
  const $q = s => $(s, host), instr = $q('#rfinstr'), noteEl = $q('#rfnote'), next = $q('#rfnext');
  let step = 'lo', seg = [], segStart = 0, found = { lo: null, hi: null }, held = null;
  const tracker = Pitch.track(f => {
    noteEl.textContent = f.midi == null ? '–' : voxName(f.midi);
    if (f.midi == null) { seg = []; return; }
    if (seg.length && Math.abs(f.midi - Pitch.median(seg)) > 0.6) seg = [];
    if (!seg.length) segStart = f.t; seg.push(f.midi);
    if (f.t - segStart >= 1.2) {
      const m = Math.round(Pitch.median(seg));
      if (step === 'lo' && (held == null || m < held)) { held = m; $q('#rflo').textContent = voxName(m); next.disabled = false; }
      if (step === 'hi' && (held == null || m > held)) { held = m; $q('#rfhi').textContent = voxName(m); next.disabled = false; }
    }
  }, { deviceId: S.prefs.micId || null, onError: () => { instr.textContent = 'The microphone could not be opened. ' + MIC_HELP; } });
  next.addEventListener('click', () => {
    if (step === 'lo') { found.lo = held; held = null; step = 'hi'; next.disabled = true; next.textContent = 'That is my highest note'; instr.innerHTML = 'Now sing your <b>highest comfortable</b> note and hold it: high, but not straining or squeaking.'; return; }
    found.hi = held; tracker.stop();
    if (found.hi - found.lo < 7) { instr.textContent = 'That range is very small. Try again with a lower low note and a higher high note.'; return; }
    onDone({ lo: found.lo, hi: found.hi });
  });
  $q('#rfredo').addEventListener('click', () => { step = 'lo'; held = null; found = { lo: null, hi: null }; $q('#rflo').textContent = '–'; $q('#rfhi').textContent = '–'; next.disabled = true; next.textContent = 'That is my lowest note'; instr.innerHTML = 'Sing your <b>lowest comfortable</b> note on "ah" and hold it for two seconds.'; });
  return { stop() { tracker.stop(); } };
}

/* ---- lessons ---- */
const VOX_LESSONS = [
  { id: 'v-breath', title: 'Posture and breathing', ex: ['sustain'], points: [
    'Stand or sit tall: feet apart, knees soft, shoulders down and relaxed, head balanced, not pushed forward.',
    'Breathe low. Your belly and lower ribs widen as you breathe in; your shoulders do not rise.',
    'Singing is breath turned into sound. Let the air out slowly and evenly; that steady flow is called support.',
    'Practise: breathe in for 4, hiss out for 8, then 12, then 16. Then hold one sung note as long and steady as you can.'] },
  { id: 'v-pitch', title: 'Singing in tune', ex: ['match', 'five'], points: [
    'Singing in tune is mostly listening. Hear the note in your head before you sing it.',
    'Start a note in the middle of the pitch, not sliding up into it from below (scooping).',
    'Half steps (mi–fa, ti–do) are small. Many singers make them too wide and drift sharp.',
    'Watch the line on the screen: green is in tune, amber is close, red is far. Aim to land green and stay green.'] },
  { id: 'v-tone', title: 'Vowels and tone', ex: ['five', 'scale'], points: [
    'Your tone is shaped by your vowels. Sing tall, open vowels: "ah", "oh", "oo", with space in the mouth.',
    'Keep the same vowel shape as you go up and down; changing it changes the tone and often the pitch.',
    'Relax the jaw and tongue. Tension in the jaw makes the sound tight and pushes pitch sharp.',
    'Consonants are short and clear; the vowel carries the note.'] },
  { id: 'v-registers', title: 'Chest, mix and head voice', ex: ['arp', 'scale'], points: [
    'Your low notes feel in the chest (chest voice); high notes feel in the head (head voice). In between is the mix.',
    'Do not drag a heavy chest voice higher and higher: it strains the voice. Let it lighten as you rise.',
    'Lip trills and sirens connect the registers smoothly. Arpeggios to the octave train the passage.',
    'Gospel power comes from a strong mix and good breath support, not from shouting.'] },
  { id: 'v-agility', title: 'Agility and gospel runs', ex: ['runs', 'echo'], points: [
    'Runs (riffs) are fast, real notes, often from the pentatonic scale: 1 2 3 5 6.',
    'Learn every run slowly first, note by note, then speed it up only when it is clean.',
    'Keep runs light; heavy runs get muddy. Use them to serve the words, not to show off.',
    'Copy runs from singers you admire: slow them down, sing them note by note, then at speed.'] },
  { id: 'v-harmony', title: 'Singing harmony', ex: ['harmony', 'interval'], points: [
    'Harmony singers often sing a third below the melody (altos and tenors) or a third above (sopranos).',
    'Thirds follow the key: sometimes a major third, sometimes a minor third. Let your ear and the chords guide you.',
    'Hold your own line. Listen to the melody, but do not let it pull you onto its notes.',
    'Practise harmony parts alone until they are secure, then sing them against the melody.'] },
  { id: 'v-lead', title: 'Leading worship with your voice', ex: ['echo', 'match'], points: [
    'As a leader, sing the melody clearly and confidently so the congregation can follow.',
    'Give cues with your voice and body: say the first words of the next line, raise a hand to go up.',
    'When you sing and play, keep the accompaniment simple so you can focus on the voice and the people.',
    'Choose keys for the congregation, not for showing your range: most people sing comfortably between A3 (low A) and D5.'] },
  { id: 'v-health', title: 'Caring for your voice', ex: ['sustain'], points: [
    'Warm up before you sing for long, and cool down gently with humming afterwards.',
    'Drink water through the day. Sleep well. Avoid shouting and constant throat clearing.',
    'If singing hurts, stop and rest. Pain is a warning, not a sign of effort.',
    'Hoarseness that lasts more than two weeks, or loss of voice, needs a doctor (an ear, nose and throat specialist). This app is not medical advice.'] }
];

/* ---- the best key for the singer: move a song's melody so it sits inside the range ---- */
const KEY_SPELL = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
function bestKeyFor(P) {
  const r = voxState().range; if (!r || !P.melodies) return null;
  const ms = [].concat(...Object.values(P.melodies).map(x => (x && x.notes || []).map(n => n.m)));
  if (ms.length < 3) return null;
  const lo = Math.min.apply(null, ms), hi = Math.max.apply(null, ms), span = hi - lo;
  let best = null;
  for (let sh = -11; sh <= 11; sh++) {
    // the melody may be sung an octave lower or higher than written (men often sing an octave below)
    for (const oct of [-12, 0, 12]) {
      const a = lo + sh + oct, b = hi + sh + oct, out = Math.max(0, r.lo + 1 - a) + Math.max(0, b - (r.hi - 1));
      const centre = Math.abs((a + b) / 2 - (r.lo + r.hi) / 2), cost = out * 10 + centre + Math.abs(sh) * 0.15;
      if (!best || cost < best.cost) best = { sh, oct, cost, fits: out === 0, a, b };
    }
  }
  const pc = (E.pcOfName(P.key) + best.sh + 120) % 12;
  return { key: KEY_SPELL[pc], shift: best.sh, octave: best.oct, fits: best.fits, span, lo: best.a, hi: best.b };
}

/* ---- the screen ---- */
let vxRun = null;
function viewVoice() {
  const p = route.params || {}, tab = p.tab || 'today', v = voxState(), r = voxRange(), vt = voiceType(v.range);
  const tabs = [['today', 'Today'], ['exercises', 'Exercises'], ['tuner', 'Free singing'], ['learn', 'Learn'], ['progress', 'My voice']];
  const head = '<div class="pagehead"><h1>Vocal Studio</h1><p class="muted">Train your voice with the microphone: in tune, steady, agile, and in harmony. ' +
    (v.range ? 'Your range: <b>' + esc(voxName(r.lo)) + ' to ' + esc(voxName(r.hi)) + '</b>' + (vt ? ' (close to ' + esc(vt.name) + ')' : '') + '.' : 'Start by finding your range, so every exercise fits your voice.') + '</p>' +
    '<div class="seg ptabs" role="tablist" aria-label="Vocal Studio sections">' + tabs.map(t => '<button type="button" role="tab" class="' + (t[0] === tab ? 'on' : '') + '" aria-selected="' + (t[0] === tab) + '" data-act="vxgo" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div></div>';
  const micRow = '<div class="row wrap vx-mic"><label class="field"><span>Microphone</span><select id="vxmic" data-bind="pmic"><option value="">Windows default microphone</option></select></label><p class="tiny">Wear headphones if you can. Sing about a hand-width from the microphone.</p></div>';
  let body = '';
  if (p.run || p.range || p.warm) body = '<section class="card"><div id="vxhost"></div><div class="row wrap" id="vxafter" hidden><button class="btn primary" type="button" data-act="vxgo" data-tab="' + esc(tab) + '">Done</button>' + (p.run ? '<button class="btn ghost" type="button" data-act="vxagain" data-ex="' + esc(p.run) + '">' + icon('replay') + 'Again</button>' : '') + '</div></section>';
  else if (tab === 'today') {
    const t = ensureToday(), warm = v.warm || {};
    body = howTo('voice', 'How to use the Vocal Studio', ['Choose your microphone at the bottom of this page. Headphones help.', 'Find your range once (one minute). Every exercise is then pitched for your voice.', 'Do the warm-up before you sing for long, then pick exercises from the Exercises tab. Each one explains itself before you start.', 'In each exercise: LISTEN means the app is playing; YOUR TURN means sing. Hold each note until its box turns green.', 'My voice shows your progress, whether you tend to sing sharp or flat, and the best key for your songs.']) + (v.range ? '' : '<section class="card callout"><h3>First: find your range</h3><p>Sing your lowest and highest comfortable notes. It takes one minute, and every exercise will then fit your voice.</p><div class="row wrap"><button class="btn primary" type="button" data-act="vxgo" data-range="1" data-tab="today">' + icon('mic') + 'Find my range</button>' +
      '<button class="btn ghost sm" type="button" data-act="vxguess" data-g="low">I have a lower voice</button><button class="btn ghost sm" type="button" data-act="vxguess" data-g="high">I have a higher voice</button></div></section>') +
      '<section class="card"><p class="eyebrow">Daily warm-up · about 10 minutes ' + (t.items.voice ? '<span class="tag ok">Done today</span>' : '') + '</p><h3>Warm up your voice</h3><p class="muted">Breath, lip trills, then five graded exercises: scale, arpeggio, matching notes, a long note and echo phrases. Do it before every rehearsal and service.</p>' +
      '<ol class="vx-steps">' + VOX_WARMUP.map(s => '<li>' + esc(s.kind === 'self' ? s.title + ': ' + s.text : vexById(s.id).title) + '</li>').join('') + '</ol>' +
      '<div class="row wrap"><button class="btn primary" type="button" data-act="vxgo" data-warm="1" data-tab="today">' + icon('play') + 'Start the warm-up</button><span class="tiny">' + (warm.n ? 'Done ' + warm.n + (warm.n === 1 ? ' time' : ' times') + '.' : '') + '</span></div></section>' + micRow;
  } else if (tab === 'exercises') {
    body = '<div class="vx-grid">' + VEX.map(x => '<section class="card"><p class="eyebrow">' + x.mins + ' min' + (v.best[x.id] ? ' · best ' + v.best[x.id] : '') + '</p><h3>' + esc(x.title) + '</h3><p class="muted">' + esc(x.about) + '</p><p class="tiny">Tip: ' + esc(x.tip) + '</p><button class="btn primary sm" type="button" data-act="vxgo" data-tab="exercises" data-run="' + x.id + '">' + icon('play') + 'Start</button></section>').join('') + '</div>' + micRow;
  } else if (tab === 'tuner') {
    body = '<section class="card"><p class="muted">Sing anything: a song, a scale, a long note. The screen shows the note you are singing and how close you are to it. Use it to check yourself or to tune your voice to the keyboard.</p><div id="vxtuner"></div></section>' + micRow;
  } else if (tab === 'learn') {
    body = VOX_LESSONS.map(l => '<section class="card"><p class="eyebrow">' + (v.lessons[l.id] ? '<span class="tag ok">Read</span>' : 'Lesson') + '</p><h3>' + esc(l.title) + '</h3><ul>' + l.points.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      '<div class="row wrap">' + l.ex.map(id => '<button class="btn soft sm" type="button" data-act="vxgo" data-tab="learn" data-run="' + id + '">' + icon('play') + 'Practise: ' + esc(vexById(id).title) + '</button>').join('') + (v.lessons[l.id] ? '' : '<button class="btn ghost sm" type="button" data-act="vxread" data-id="' + l.id + '">' + icon('check') + 'Mark as read</button>') + '</div></section>').join('');
  } else {
    const ses = v.sessions.slice(-40), last = ses.slice(-14);
    const sung = v.sessions.filter(x => x.n >= 4).slice(-20), lean = sung.length ? Math.round(sung.reduce((a, x) => a + x.cents, 0) / sung.length) : null;
    const avgIn = sung.length ? Math.round(sung.reduce((a, x) => a + x.inTune, 0) / sung.length) : null;
    body = '<section class="card"><h3>Your range</h3>' + (v.range ? '<p><b>' + esc(voxName(r.lo)) + ' to ' + esc(voxName(r.hi)) + '</b> · ' + (r.hi - r.lo) + ' half steps' + (vt ? ' · close to <b>' + esc(vt.name) + '</b> (a guide only: voice type also depends on tone and comfort)' : '') + '.</p>' : '<p class="muted">Not measured yet.</p>') +
      '<button class="btn ghost sm" type="button" data-act="vxgo" data-range="1" data-tab="progress">' + icon('mic') + (v.range ? 'Measure again' : 'Find my range') + '</button></section>' +
      '<section class="card"><h3>How you sing</h3>' + (sung.length ? '<p>' + avgIn + '% of notes in tune over your last ' + sung.length + ' exercises. ' + (Math.abs(lean) >= 10 ? 'You tend to sing ' + (lean > 0 ? 'sharp' : 'flat') + ' by about ' + Math.abs(lean) + ' cents.' : 'No sharp or flat tendency.') + (v.sustain ? ' Longest steady note: ' + v.sustain + ' s.' : '') + '</p>' : '<p class="muted">Do a few exercises and your results appear here.</p>') +
      (last.length ? '<div class="vx-bars" aria-label="Scores of your last ' + last.length + ' exercises">' + last.map(x => '<span style="height:' + Math.max(4, x.score) + '%" title="' + esc((vexById(x.ex) || {}).title || x.ex) + ': ' + x.score + '"></span>').join('') + '</div>' : '') + '</section>' +
      (S.songs && S.songs.length ? '<section class="card"><h3>The best key for your voice</h3>' + (v.range ? '<ul class="vx-best">' + S.songs.map(P => { const k = bestKeyFor(P); return '<li><span>' + esc(P.title || 'Untitled song') + ' <span class="tiny">(written in ' + esc(fmt(P.key)) + ')</span></span><b>' + (k ? esc(fmt(k.key)) + '</b><span class="tiny">' + (k.shift === 0 ? 'as written' : (k.shift > 0 ? 'up ' : 'down ') + Math.abs(k.shift) + ' half step' + (Math.abs(k.shift) > 1 ? 's' : '')) + (k.octave ? ', sung an octave ' + (k.octave < 0 ? 'lower' : 'higher') : '') + (k.fits ? '' : ' · the melody is wider than your range') + ' · Transpose ' + (k.shift < 0 ? '−' : '+') + String(Math.abs(k.shift)).padStart(2, '0') + '</span>' : '–</b><span class="tiny">record a melody in the Song Lab first</span>') + '</li>'; }).join('') + '</ul><p class="tiny">On the YPT-240 you can play in the written key and set Transpose to the number shown.</p>' : '<p class="muted">Find your range first.</p>') + '</section>' : '') +
      '<section class="card"><h3>Best scores</h3><ul class="vx-best">' + VEX.map(x => '<li><span>' + esc(x.title) + '</span><b>' + (v.best[x.id] != null ? v.best[x.id] : '–') + '</b></li>').join('') + '</ul></section>' +
      (ses.length ? '<section class="card"><h3>Recent</h3><ul class="vx-recent">' + ses.slice(-10).reverse().map(x => '<li><span>' + esc(x.d) + '</span><span>' + esc((vexById(x.ex) || {}).title || x.ex) + '</span><b>' + x.score + '</b><span class="tiny">' + x.inTune + '% in tune</span></li>').join('') + '</ul></section>' : '');
  }
  const html = '<div class="screen">' + head + body + '</div>';
  return { html, mount(root) {
    const cl = [];
    const mic = $('#vxmic', root);
    if (mic) listMics().then(ms => { mic.innerHTML = '<option value="">Windows default microphone</option>' + ms.filter(m => m.deviceId && m.deviceId !== 'default' && m.deviceId !== 'communications').map((m, i) => '<option value="' + esc(m.deviceId) + '"' + (m.deviceId === S.prefs.micId ? ' selected' : '') + '>' + esc(m.label || ('Microphone ' + (i + 1))) + '</option>').join(''); });
    const host = $('#vxhost', root), after = $('#vxafter', root);
    if (host && p.range) vxRun = runRangeFinder(host, rg => { voxState().range = { lo: rg.lo, hi: rg.hi, at: E.dateStr() }; delete voxState().guess; touch(); toast('Range saved: ' + voxName(rg.lo) + ' to ' + voxName(rg.hi) + '.'); go('voice', { tab: p.tab || 'today' }); });
    else if (host && p.run) { const def = vexById(p.run); if (def) vxRun = runVoiceEx(host, def, { onDone: sum => { voxSave(sum); award(5, 'voice'); after.hidden = false; }, onStop: () => { after.hidden = false; } }); }
    else if (host && p.warm) vxRun = runWarmup(host, () => { after.hidden = false; });
    const tun = $('#vxtuner', root);
    if (tun) vxRun = runTuner(tun);
    cl.push(() => { if (vxRun) { vxRun.stop(); vxRun = null; } });
    return () => cl.forEach(f => f());
  } };
}
/* free singing: the tuner */
function runTuner(host) {
  host.innerHTML = '<div class="vx"><div class="vx-head"><div><p class="vx-instr">Sing…</p></div><div class="vx-read"><b class="mono" id="tnote">–</b><span class="mono" id="tcents"></span></div></div><div class="vx-needle"><span class="vx-zone"></span><i id="tneedle"></i></div><canvas class="vx-trace" id="ttrace" width="900" height="220"></canvas></div>';
  const cv = $('#ttrace', host), g = cv.getContext('2d'), trace = [];
  const tr = Pitch.track(f => {
    trace.push({ t: f.t, m: f.midi }); if (trace.length > 400) trace.shift();
    const n = $('#tnote', host), c = $('#tcents', host), nd = $('#tneedle', host);
    if (f.midi == null) { n.textContent = '–'; c.textContent = ''; nd.style.left = '50%'; nd.className = ''; }
    else { const cc = (f.midi - Math.round(f.midi)) * 100; n.textContent = voxName(f.midi); c.textContent = centsStr(cc); nd.style.left = (50 + cc) + '%'; nd.className = Math.abs(cc) <= VOX_TOL ? 'ok' : Math.abs(cc) <= 40 ? 'near' : 'far'; }
    const { W, H } = fitCanvas(cv), now = f.t, r = voxRange(), lo = r.lo - 3, hi = r.hi + 3, y = m => H - 8 - (m - lo) / (hi - lo) * (H - 16);
    const css = getComputedStyle(document.documentElement);
    g.clearRect(0, 0, W, H); g.font = '12px monospace'; g.textBaseline = 'middle';
    for (let m = lo; m <= hi; m++) { if ([1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12)) continue; g.strokeStyle = css.getPropertyValue('--line'); g.beginPath(); g.moveTo(40, y(m)); g.lineTo(W, y(m)); g.stroke(); g.fillStyle = css.getPropertyValue('--muted'); g.fillText(voxName(m), 4, y(m)); }
    g.strokeStyle = css.getPropertyValue('--accent'); g.lineWidth = 3; let prev = null;
    trace.forEach(p => { if (now - p.t > 6 || p.m == null) { prev = null; return; } const x = 40 + (W - 48) * (1 - (now - p.t) / 6); if (prev) { g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(x, y(p.m)); g.stroke(); } prev = [x, y(p.m)]; });
    g.lineWidth = 1;
  }, { deviceId: S.prefs.micId || null, onError: () => { host.innerHTML = '<p>The microphone could not be opened. ' + esc(MIC_HELP) + '</p>'; } });
  return { stop() { tr.stop(); } };
}
/* the warm-up: steps in order; graded steps use the exercise runner */
function runWarmup(host, onEnd) {
  let i = 0, cur = null, stopped = false, scores = [];
  function step() {
    if (stopped) return;
    if (i >= VOX_WARMUP.length) {
      const v = voxState(); v.warm = { n: ((v.warm || {}).n || 0) + 1, last: E.dateStr() };
      const t = ensureToday(), first = !t.items.voice; markToday('voice'); if (first) award(10, 'vocal warm-up'); else touch();
      const avg = scores.length ? Math.round(scores.reduce((a, x) => a + x, 0) / scores.length) : null;
      host.innerHTML = '<div class="vx-sum"><h3>Warm-up complete</h3><p>' + (avg != null ? 'Average score ' + avg + '. ' : '') + 'Your voice is ready. Drink some water.</p></div>';
      if (onEnd) onEnd(); return;
    }
    const s = VOX_WARMUP[i];
    if (s.kind === 'self') {
      let left = s.mins * 60;
      host.innerHTML = '<div class="vx"><p class="eyebrow">Warm-up · step ' + (i + 1) + ' of ' + VOX_WARMUP.length + '</p><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p><p class="rt-clock mono" id="wuclock">' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + '</p><button class="btn primary" type="button" id="wunext">Next step' + icon('chev') + '</button></div>';
      const clk = $('#wuclock', host), iv = setInterval(() => { left--; if (clk) clk.textContent = Math.floor(Math.max(0, left) / 60) + ':' + String(Math.max(0, left) % 60).padStart(2, '0'); if (left <= 0) { clearInterval(iv); Act.last = Date.now(); } }, 1000);
      cur = { stop() { clearInterval(iv); } };
      $('#wunext', host).addEventListener('click', () => { cur.stop(); i++; step(); });
      return;
    }
    const def = vexById(s.id), box = document.createElement('div');
    host.innerHTML = '<p class="eyebrow">Warm-up · step ' + (i + 1) + ' of ' + VOX_WARMUP.length + '</p>' + howTo('vx-' + def.kind, 'How ' + def.title.toLowerCase() + ' works', VEX_STEPS[def.kind] || []); host.appendChild(box);
    cur = runVoiceEx(box, def, { skipIntro: i > 2, rounds: s.rounds, count: s.count, onDone: sum => { voxSave(sum); scores.push(sum.score); setTimeout(() => { i++; step(); }, 1800); }, onStop: () => { stopped = true; if (onEnd) onEnd(); } });
  }
  step();
  return { stop() { stopped = true; if (cur) cur.stop(); } };
}

/* actions (merged into ACTIONS by actions-boot.js) */
const VOICE_ACTIONS = {
  vxgo: el => { const d = el.dataset, prm = { tab: d.tab || 'today' }; if (d.run) prm.run = d.run; if (d.range) prm.range = 1; if (d.warm) prm.warm = 1; go('voice', prm); },
  vxguess: el => { const v = voxState(); v.guess = el.dataset.g === 'high' ? 'high' : 'low'; touch(); toast('Exercises will use a ' + (v.guess === 'high' ? 'higher' : 'lower') + ' range until you measure yours.'); render(); },
  vxread: el => { voxState().lessons[el.dataset.id] = true; touch(); render(); },
  vxagain: el => { go('voice', Object.assign({}, route.params, { run: el.dataset.ex, _: Date.now() })); }
};
