'use strict';
/* ---------------------------------------------------------------- the daily routine
   Technique in the key of the day (scale, arpeggio, ii – V – I, each a timed test whose tempo
   rises as you pass, remembered per key) and "Play it back", an adaptive play-by-ear drill.
   Expert skill comes from daily repetition, so this keeps adding practice after the lessons end. */
const DAY_KEYS = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G'];
const keyOfDay = () => DAY_KEYS[Math.floor(Date.now() / 864e5) % 12];
const DAILY_251 = [{ name: 'Dm9', notes: ['D3', 'F4', 'A4', 'C5', 'E5'], low: true }, { name: 'G13', notes: ['G2', 'F4', 'A4', 'B4', 'E5'], low: true }, { name: 'Cmaj9', notes: ['C3', 'E4', 'G4', 'B4', 'D5'], low: true }];
const single = (tok, label) => ({ name: label || tok.replace(/-?\d+$/, ''), notes: [tok], low: false });

function techniqueSpecs(key) {
  const sharp = SHARP_KEYS.has(key);
  let up = E.scaleTokens(key, 'major', 4);
  if (E.midiOf(up[up.length - 1]) > 79) up = E.scaleTokens(key, 'major', 3);   // keep high keys in a comfortable range
  const names = E.scaleNotes(key, 'major'), lab = i => names[i % 7];   // spelled the way the key is written (G♭ has C♭)
  const scale = up.map((t, i) => single(t, lab(i))).concat(up.slice(0, -1).reverse().map((t, i) => single(t, lab(6 - i))));
  const arpM = E.chordMidi(key, 'maj7', E.midiOf(up[0]) < 60 ? 3 : 4, 0), arp = arpM.concat([arpM[0] + 12], arpM.slice().reverse()).map(m => E.midiName(m, sharp));
  const nm = fmt(key);
  return [
    { label: 'Scale', ex: { type: 'perf', id: 'tech-scale-' + key, title: nm + ' major scale', prog: scale, beats: 0.5, ladder: [60, 80, 100, 120], range: [48, 84], hints: true, prompt: nm + ' major, up and down one octave in eighth notes. Even and relaxed; the tempo rises each time you pass.' } },
    { label: 'Arpeggio', ex: { type: 'perf', id: 'tech-arp-' + key, title: nm + 'maj7 arpeggio', prog: arp.map(t => single(t)), beats: 0.5, ladder: [60, 80, 100], range: [48, 84], hints: true, prompt: nm + 'maj7 arpeggio, up to the octave and back, in eighth notes.' } },
    { label: 'ii – V – I', ex: { type: 'perf', id: 'tech-251-' + key, title: 'ii – V – I in ' + nm, prog: DAILY_251, base: 'C', keys: [key], beats: 4, ladder: [60, 80, 100], hints: true, prompt: 'The rootless ii – V – I in ' + nm + ' with the roots in your left hand, one chord per bar.' } }
  ];
}
function viewTechnique(back) {
  const key = keyOfDay(), specs = techniqueSpecs(key), i = clamp(ui.techStep || 0, 0, specs.length - 1);
  const t = ensureToday(), doneSet = t.tech || {};
  const tabs = '<div class="seg ptabs" role="tablist" aria-label="Technique steps">' + specs.map((s, k) => '<button type="button" role="tab" class="' + (k === i ? 'on' : '') + '" aria-selected="' + (k === i) + '" data-act="techstep" data-i="' + k + '">' + (doneSet[k] ? '✓ ' : '') + esc(s.label) + '</button>').join('') + '</div>';
  return {
    html: '<div class="screen"><div class="pagehead">' + back + '<h1>Technique: key of the day, ' + esc(fmt(key)) + ' major</h1><p class="muted">Ten minutes, every day, a new key round the circle. Each test remembers your tempo in each key.</p></div>' + tabs + '<div class="card"><div id="techex"></div></div></div>',
    mount(root) {
      const h = mountExercise($('#techex', root), specs[i].ex, { onDone: () => {
        const tt = ensureToday(); tt.tech = tt.tech || {}; tt.tech[i] = true;
        if (Object.keys(tt.tech).length >= specs.length && !tt.items.tech) { markToday('tech'); award(15, 'daily technique'); } else touch();
        if (i < specs.length - 1) setTimeout(() => { if (route.name === 'practice' && (route.params || {}).view === 'technique' && ui.techStep === i) { ui.techStep = i + 1; render(); } }, 1400);
      } });
      return () => h.destroy();
    }
  };
}

/* ---- Play it back: hear a progression, then play it, without hints. Six levels; three in a row moves you up. ---- */
const BYEAR_LEVELS = [
  { label: 'Two chords: 1, 4 or 5 in C', keys: ['C'], degs: [1, 4, 5], n: 2, sev: false },
  { label: 'Four chords: 1, 4 and 5 in C', keys: ['C'], degs: [1, 4, 5], n: 4, sev: false },
  { label: 'Four chords with 2m and 6m in C', keys: ['C'], degs: [1, 2, 4, 5, 6], n: 4, sev: false },
  { label: 'Four chords in G or F', keys: ['G', 'F'], degs: [1, 2, 4, 5, 6], n: 4, sev: false },
  { label: 'Seventh chords in C, F or G', keys: ['C', 'F', 'G'], degs: [1, 2, 3, 4, 5, 6], n: 4, sev: true },
  { label: 'Seventh chords in the church keys', keys: ['C', 'F', 'Bb', 'Eb', 'Ab'], degs: [1, 2, 3, 4, 5, 6], n: 4, sev: true }
];
const byState = () => S.byear || (S.byear = { level: 1, streak: 0, fails: 0, done: 0 });
function newByEar() {
  const lv = BYEAR_LEVELS[clamp(byState().level, 1, BYEAR_LEVELS.length) - 1];
  const key = lv.keys[Math.floor(Math.random() * lv.keys.length)];
  const degs = [1];
  while (degs.length < lv.n) { const d = lv.degs[Math.floor(Math.random() * lv.degs.length)]; if (d !== degs[degs.length - 1]) degs.push(d); }
  const chs = E.progressionChords(key, degs, lv.sev);
  ui.byear = { key, degs, targets: chs.map(c => ({ root: c.root, quality: c.quality })), names: chs.map(c => fmt(c.name)), revealed: false };
}
function playByEar() {
  const b = ui.byear; if (!b) return;
  Snd.play(E.toEvents({ kind: 'chords', list: b.targets.map(t => ({ root: t.root, quality: t.quality, oct: 4 })), d: 1.6 }), { force: true });
}
function viewByEar(back) {
  if (!ui.byear) newByEar();
  const st = byState(), lv = BYEAR_LEVELS[clamp(st.level, 1, BYEAR_LEVELS.length) - 1], b = ui.byear;
  return {
    html: '<div class="screen"><div class="pagehead">' + back + '<h1>Play it back</h1><p class="muted">Hear a progression, then play it back without hints. This is how church musicians learn songs. Three right in a row moves you up a level.</p></div>' +
      '<div class="card"><div class="split"><div><p class="eyebrow">Level ' + st.level + ' of ' + BYEAR_LEVELS.length + '</p><h3>' + esc(lv.label) + '</h3><p class="tiny">Key: ' + esc(fmt(b.key)) + ' · ' + b.targets.length + ' chords · ' + st.streak + ' in a row · ' + st.done + ' solved in total</p></div>' +
      '<div class="row wrap"><button class="btn primary" type="button" data-act="bylisten">' + icon('play') + 'Listen</button><button class="btn ghost sm" type="button" data-act="byreveal">' + (b.revealed ? 'Next one' : 'Show me') + '</button></div></div>' +
      (b.revealed ? '<p class="callout">It was: <b>' + b.names.map(esc).join(' – ') + '</b> (' + b.degs.join(' – ') + ')</p>' : '') +
      '<div id="byex"></div></div></div>',
    mount(root) {
      const ex = { type: 'chord', range: [48, 72], targets: b.targets, hints: false, prompt: 'Play back the ' + b.targets.length + ' chords you heard, in order. Any voicing counts. Listen again as often as you like.' };
      const h = mountExercise($('#byex', root), ex, { hints: false, onDone: () => {
        const s2 = byState();
        if (!b.revealed) { s2.done++; s2.streak++; s2.fails = 0; if (s2.streak >= 3 && s2.level < BYEAR_LEVELS.length) { s2.level++; s2.streak = 0; toast('Level up: ' + BYEAR_LEVELS[s2.level - 1].label, 'ach'); } if (!ensureToday().items.byear) { markToday('byear'); award(10, 'play it back'); } }
        touch();
        setTimeout(() => { if (route.name === 'practice' && (route.params || {}).view === 'byear') { newByEar(); render(); setTimeout(playByEar, 300); } }, 1500);
      } });
      return () => h.destroy();
    }
  };
}
function revealByEar() {
  const b = ui.byear; if (!b) return;
  if (b.revealed) { newByEar(); render(); setTimeout(playByEar, 300); return; }
  b.revealed = true;
  const s2 = byState(); s2.streak = 0; s2.fails = (s2.fails || 0) + 1;
  if (s2.fails >= 2 && s2.level > 1) { s2.level--; s2.fails = 0; toast('Back to level ' + s2.level + ' for a while.'); }
  touch(); render();
}
