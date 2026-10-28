'use strict';
/* ---------------------------------------------------------------- SONG LAB */
const sl = { key: 'C', degs: [1, 5, 6, 4], pid: 'I-V-vi-IV', sev: false, style: 'groove', bpm: 80, beat: 'none', swing: 0, grid: defGrid() };
function defGrid() { const z = () => new Array(16).fill(0), g = { k: z(), s: z(), h: z(), o: z() }; [0, 8].forEach(i => { g.k[i] = 1; }); [4, 12].forEach(i => { g.s[i] = 1; }); for (let i = 0; i < 16; i += 2) g.h[i] = 1; return g; }
function progScript(key, degs, sev, style, bpm, bt) {
  const chs = E.progressionChords(key, degs, sev), voiced = E.voiceProgression(chs);
  const events = E.progEvents(voiced, style, 4).concat(E.beatEvents(bt, degs.length));
  return { chs, voiced, script: { events, bpm, total: degs.length * 4 } };
}
function gridCard() {
  const rows = [['k', 'Kick'], ['s', 'Snare'], ['h', 'Hi-hat'], ['o', 'Open hat']];
  return '<section class="card"><h3>My own beat</h3><p class="muted">One bar, 16 steps. Tap a square to add or remove a drum hit. Press Play loop again to hear your change.</p>' + rows.map(r => '<div class="gridrow"><b>' + r[1] + '</b><div class="gcells">' + sl.grid[r[0]].map((x, i) => '<button type="button" class="gcell' + (i % 4 === 0 ? ' q' : '') + (x ? ' on' : '') + '" data-act="slgrid" data-r="' + r[0] + '" data-i="' + i + '" aria-label="' + r[1] + ' step ' + (i + 1) + '"></button>').join('') + '</div></div>').join('') + '</section>';
}
function chordCards(chs, active) {
  return '<div class="ccards">' + chs.map((c, i) => '<div class="ccard' + (i === active ? ' on' : '') + '" data-i="' + i + '"><b class="mono">' + esc(c.name) + '</b><span>' + esc(c.roman) + '</span><small class="mono">' + esc(c.number) + '</small></div>').join('') + '</div>';
}
/* ---------------------------------------------------------------- SONGBOOK: lead sheet, backing track, play-along */
/* Original practice pieces. Melodies are written as [scale degree, beats]; degree 0 is a rest, 8 is the tonic an octave up. */
const SONGBOOK = [
  { id: 'sb-morning', title: 'Morning Light', level: 1, key: 'C', bpm: 80, ts: 4, style: 'whole', sev: false, degs: [1, 1, 4, 1, 1, 4, 5, 1], about: 'Three chords and a simple tune. Slow and steady.',
    mel: [[3, 2], [5, 2], [5, 1], [4, 1], [3, 2], [6, 2], [4, 2], [3, 2], [2, 1], [1, 1], [3, 2], [5, 2], [6, 2], [8, 2], [7, 2], [5, 2], [1, 4]] },
  { id: 'sb-rest', title: 'Rest and Play', level: 1, key: 'C', bpm: 72, ts: 4, style: 'pulse', sev: false, degs: [1, 5, 6, 4, 1, 5, 4, 1], about: 'Rests are part of the music. Wait for the beat, then play.',
    mel: [[3, 1], [0, 1], [5, 2], [5, 1], [0, 1], [7, 2], [6, 1], [0, 1], [8, 2], [6, 1], [0, 1], [4, 2], [5, 1], [0, 1], [3, 2], [2, 1], [0, 1], [5, 2], [4, 1], [6, 1], [8, 2], [1, 4]] },
  { id: 'sb-gentle', title: 'Gentle Hands', level: 2, key: 'G', bpm: 72, ts: 4, style: 'pulse', sev: false, degs: [1, 5, 6, 4, 1, 5, 4, 1], about: 'The worship progression 1 – 5 – 6m – 4, with a melody over it.',
    mel: [[5, 2], [3, 2], [2, 1], [3, 1], [2, 2], [3, 2], [1, 2], [6, 2], [4, 2], [5, 2], [3, 1], [1, 1], [2, 3], [3, 1], [4, 2], [6, 1], [5, 1], [1, 4]] },
  { id: 'sb-walk', title: 'Walk With Me', level: 2, key: 'F', bpm: 76, ts: 4, style: 'groove', sev: true, degs: [1, 6, 2, 5, 1, 4, 5, 1], about: 'Seventh chords and a flowing line: 1 – 6m – 2m – 5 – 1 – 4 – 5 – 1.',
    mel: [[5, 2], [3, 1], [5, 1], [6, 2], [5, 1], [3, 1], [4, 2], [2, 2], [2, 2], [7, 1], [5, 1], [3, 2], [5, 2], [6, 2], [4, 1], [6, 1], [5, 2], [7, 2], [8, 4]] },
  { id: 'sb-waltz', title: 'Waltz of Grace', level: 2, key: 'G', bpm: 84, ts: 3, style: 'pulse', sev: false, degs: [1, 4, 1, 5, 1, 4, 5, 1], about: 'Three beats in every bar. Feel ONE two three.',
    mel: [[3, 2], [5, 1], [6, 2], [4, 1], [5, 2], [3, 1], [2, 2], [7, 1], [3, 1], [5, 1], [8, 1], [6, 2], [4, 1], [7, 1], [5, 1], [2, 1], [1, 3]] },
  { id: 'sb-celebrate', title: 'Celebrate', level: 3, key: 'D', bpm: 92, ts: 4, style: 'groove', sev: false, degs: [1, 4, 1, 5, 1, 4, 5, 1], about: 'Lively eighth notes over a gospel groove.',
    mel: [[1, 1], [3, 0.5], [5, 0.5], [8, 1], [5, 1], [6, 1], [4, 0.5], [6, 0.5], [8, 2], [5, 1], [3, 0.5], [5, 0.5], [3, 1], [1, 1], [5, 1], [7, 0.5], [5, 0.5], [2, 2],
      [1, 1], [3, 0.5], [5, 0.5], [8, 1], [5, 1], [8, 1], [6, 0.5], [4, 0.5], [6, 2], [7, 1], [5, 0.5], [7, 0.5], [9, 2], [8, 4]] }
];
const SB_SIG = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6 };
const SB_MAJ = [0, 2, 4, 5, 7, 9, 11], SB_DUR = { 4: 'w', 3: 'hd', 2: 'h', 1.5: 'qd', 1: 'q', 0.5: 'e' }, SB_ALLOWED = [4, 3, 2, 1.5, 1, 0.5], SB_REST = [4, 2, 1, 0.5];
const sbState = () => S.songbook || (S.songbook = {});

/* split a length into legal note lengths that do not cross a bar line */
function sbFit(len, room, set) {
  set = set || SB_ALLOWED;
  const out = []; let left = len;
  while (left > 0.0001) {
    const m = Math.min(left, room);
    const d = set.find(x => x <= m + 0.0001);
    if (!d) break;
    out.push(d); left -= d; room -= d; if (room <= 0.0001) room = Infinity;
  }
  return out;
}
/* Build the notated model: bars of columns, a flat list of melody notes and the backing events */
function sbBuild(song) {
  const bpb = song.ts || 4, nBars = song.degs.length, total = nBars * bpb;
  const key = song.key, sharps = (SB_SIG[key] || 0) > 0;
  const names = E.scaleNotes(key, 'major');
  const base = 60 + E.pcOfName(key);
  let raw = [];
  if (song.mel) {
    let t = 0;
    song.mel.forEach(([deg, beats]) => {
      if (deg > 0) {
        const idx = (deg - 1) % 7, midi = base + SB_MAJ[idx] + 12 * Math.floor((deg - 1) / 7);
        raw.push({ midi, tok: Staff.tokens([names[idx]], [midi])[0], t, d: beats });
      }
      t += beats;
    });
  } else if (song.notes) {
    let cur = 0;
    song.notes.slice().sort((a, b) => a.t - b.t).forEach(n => {
      if (n.t < cur - 0.0001 || n.t >= total) return;
      const d = SB_ALLOWED.reduce((best, x) => Math.abs(x - n.d) < Math.abs(best - n.d) ? x : best, 1);
      raw.push({ midi: n.m, tok: E.midiName(n.m, sharps), t: n.t, d });
      cur = n.t + d;
    });
  }
  /* columns per bar, with rests filling the gaps */
  const bars = Array.from({ length: nBars }, () => ({ cols: [] })), notes = [];
  let cursor = 0;
  const addRests = (upTo) => {
    while (upTo - cursor > 0.0001) {
      const b = Math.floor(cursor / bpb + 0.0001), room = (b + 1) * bpb - cursor, len = Math.min(upTo - cursor, room);
      sbFit(len, room, SB_REST).forEach(d => { bars[b].cols.push({ rest: true, dur: SB_DUR[d] }); cursor += d; });
      if (len > 0 && !SB_REST.find(x => x <= len + 0.0001)) break;
    }
  };
  raw.forEach(n => {
    if (n.t >= total) return;
    addRests(n.t);
    const b = Math.floor(n.t / bpb + 0.0001), room = (b + 1) * bpb - n.t, d = SB_ALLOWED.find(x => x <= Math.min(n.d, room) + 0.0001) || 0.5;
    if (b >= nBars) return;
    const col = { notes: [n.tok], dur: SB_DUR[d] };
    notes.push({ i: notes.length, midi: n.midi, tok: n.tok, t: n.t, d, b, ci: bars[b].cols.length });
    bars[b].cols.push(col); cursor = n.t + d;
  });
  addRests(total);
  const chs = E.progressionChords(key, song.degs, !!song.sev), voiced = E.voiceProgression(chs);
  const backing = E.progEvents(voiced, song.style || 'pulse', bpb);
  bars.forEach((b, i) => { if (b.cols.length) { b.cols[0].label = fmt(chs[i].name); b.cols[b.cols.length - 1].bar = true; } });
  /* global column index (the staff draws columns in order, line by line) */
  let g = 0; bars.forEach(b => { b.cols.forEach((c, k) => { c.g = g++; }); });
  notes.forEach(n => { n.col = bars[n.b].cols[n.ci].g; });
  return { song, bpb, nBars, total, bars, notes, chs, backing, sig: SB_SIG[key] || 0 };
}
function sbSheetHtml(M) {
  const per = M.bpb === 3 ? 3 : 2, lines = [];
  for (let i = 0; i < M.nBars; i += per) {
    const cols = [].concat(...M.bars.slice(i, i + per).map(b => b.cols.map(c => Object.assign({}, c))));
    const label = 'Bars ' + (i + 1) + ' to ' + Math.min(M.nBars, i + per) + ': ' + cols.map(c => c.label ? c.label + ' ' : '').join('') + cols.map(c => c.rest ? 'rest' : (c.notes || []).join('')).join(', ');
    lines.push(Staff.render({ clef: 'treble', key: M.sig, time: i === 0 ? [M.bpb, 4] : null, cols, colW: 40, label }));
  }
  return lines.map(l => '<div class="sb-line">' + l + '</div>').join('');
}
function sbStars(acc) { return acc >= 90 ? 3 : acc >= 70 ? 2 : acc >= 40 ? 1 : 0; }
const sbStarText = n => '★'.repeat(n) + '☆'.repeat(3 - n);
function sbSongFor(p) {
  if (p.sid) return SONGBOOK.find(s => s.id === p.sid) || null;
  if (p.proj) {
    const P = S.songs.find(s => s.id === p.proj);
    if (P) migrateProject(P);
    const ch = P && P.sections && P.sections.Chorus, mel = P && P.melodies && P.melodies.Chorus;
    // the lead sheet shows one chord per bar in 4/4 or 3/4, so it is offered for choruses written that way
    if (ch && mel && mel.notes.length && ch.len === 1 && P.ts !== 6) return { id: 'proj:' + P.id, title: P.title || 'My song', level: 0, key: P.key, bpm: P.bpm, ts: P.ts === 3 ? 3 : 4, style: P.style, sev: P.sev, degs: ch.degs, notes: mel.notes, mine: true };
  }
  return null;
}
function viewSongbook() {
  const back = '<button class="btn ghost sm" type="button" data-act="pview" data-view="hub">' + icon('back') + 'Practice</button>';
  const st = sbState();
  const rows = SONGBOOK.map(s => {
    const r = st[s.id] || {};
    return '<li class="sb-item"><div><b>' + esc(s.title) + '</b><p class="muted">' + esc(s.about) + '</p><p class="tiny">Level ' + s.level + ' · key of ' + esc(fmt(s.key)) + ' · ' + s.ts + '/4 · ' + s.bpm + ' BPM' + (r.plays ? ' · best ' + (r.best || 0) + '% <span aria-label="' + (r.stars || 0) + ' of 3 stars">' + sbStarText(r.stars || 0) + '</span>' : '') + '</p></div><button class="btn primary sm" type="button" data-act="pview" data-view="songplay" data-sid="' + esc(s.id) + '">' + (r.plays ? 'Play again' : 'Open') + '</button></li>';
  }).join('');
  const mine = S.songs.filter(s => { const v = sbSongFor({ proj: s.id }); return v && v.notes.length >= 4; });
  const mineHtml = mine.length ? '<section class="card"><h3>From your Song Lab</h3><p class="muted">Songs where you recorded a melody can be notated and played along with too.</p><ul class="lessons">' +
    mine.map(s => '<li class="sb-item"><div><b>' + esc(s.title || 'My song') + '</b><p class="tiny">Key of ' + esc(fmt(s.key)) + ' · ' + s.bpm + ' BPM</p></div><button class="btn ghost sm" type="button" data-act="pview" data-view="songplay" data-proj="' + esc(s.id) + '">Open</button></li>').join('') + '</ul></section>' : '';
  return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>Songbook</h1><p class="muted">Short original pieces with a chord chart, notation and a backing track. Learn the notes, then play along.</p></div><section class="card"><ul class="lessons">' + rows + '</ul></section>' + mineHtml + '</div>' };
}
function viewSongPlay(p) {
  const song = sbSongFor(p);
  const back = '<button class="btn ghost sm" type="button" data-act="pview" data-view="songbook">' + icon('back') + 'Songbook</button>';
  if (!song) return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>Song not found</h1></div></div>' };
  const M = sbBuild(song);
  return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>' + esc(song.title) + '</h1><p class="muted">' + esc(song.about || 'Your own melody over your own chords.') + '</p></div><div class="card"><div id="sbp"></div></div></div>',
    mount(root) { return mountSongPlay($('#sbp', root), M).destroy; } };
}
function mountSongPlay(host, M) {
  const song = M.song, spbBase = 60 / song.bpm;
  let mode = 'learn', speed = 1, running = false, hints = true, handle = null, raf = 0, idx = 0, miss = 0;
  const cleanups = [];
  host.innerHTML =
    '<div class="row wrap"><span class="tag">Key of ' + esc(fmt(song.key)) + '</span><span class="tag">' + M.bpb + '/4</span><span class="tag mono" id="sbbpm"></span></div>' +
    '<div class="seg" role="group" aria-label="Mode" style="margin:.6rem 0"><button type="button" data-sb="mode" data-v="listen">Listen</button><button type="button" data-sb="mode" data-v="learn">Learn</button><button type="button" data-sb="mode" data-v="along">Play along</button></div>' +
    '<p class="tiny" id="sbhelp"></p>' +
    '<div class="vstaff sb-sheet">' + sbSheetHtml(M) + '</div><div class="vpiano"></div>' +
    '<p class="ex-fb" id="sbfb" role="status" aria-live="polite"></p>' +
    soundPicker() + '<div class="row wrap"><div class="seg" role="group" aria-label="Speed"><button type="button" data-sb="speed" data-v="0.6">Slow</button><button type="button" data-sb="speed" data-v="0.8">Medium</button><button type="button" data-sb="speed" data-v="1">Full</button></div>' +
    '<label class="switch"><input type="checkbox" data-sb="hints" checked><span>Show next note</span></label>' +
    '<button class="btn primary lg" type="button" data-sb="go" id="sbgo"></button></div><div id="sbres"></div>';
  const piano = Piano($('.vpiano', host), { lo: 55, hi: 84, names: S.prefs.names, minKey: 38, height: 120 });
  const cols = () => $$('.st-col', host), fbEl = $('#sbfb', host), res = $('#sbres', host), goBtn = $('#sbgo', host);
  const fb = (m, k) => { fbEl.textContent = m || ''; fbEl.className = 'ex-fb' + (k ? ' ' + k : ''); };
  const setCls = (g, c) => { const el = cols()[g]; if (!el) return; el.classList.remove('cur', 'ok', 'bad'); if (c) el.classList.add(c); };
  const clearCls = () => cols().forEach(el => el.classList.remove('cur', 'ok', 'bad'));
  const HELP = { listen: 'Hear the whole piece with its chords. The notes light up as they play.', learn: 'Play each note when it lights up. The piece waits for you, so there is no rush.', along: 'You hear four clicks, then the backing track starts. Play the melody in time. Score and timing appear at the end.' };
  function sync() {
    $$('[data-sb=mode]', host).forEach(b => b.classList.toggle('on', b.dataset.v === mode));
    $$('[data-sb=speed]', host).forEach(b => b.classList.toggle('on', +b.dataset.v === speed));
    $('#sbhelp', host).textContent = HELP[mode];
    $('#sbbpm', host).textContent = Math.round(song.bpm * speed) + ' BPM';
    goBtn.innerHTML = running ? icon('stop') + 'Stop' : icon('play') + (mode === 'listen' ? 'Listen' : mode === 'learn' ? 'Start learning' : 'Play along');
    goBtn.setAttribute('aria-pressed', running ? 'true' : 'false');
  }
  function halt() {
    running = false; cancelAnimationFrame(raf);
    if (handle) { const h = handle; handle = null; try { h.stop(); } catch (e) { /* ignore */ } }
    piano.clear(); sync();
  }
  const noteHint = n => { if (hints && n) piano.hint({ midis: [n.midi], labels: { [n.midi]: tokLabel(n.tok) } }); else piano.clear(); };
  /* ---- listen ---- */
  function runListen() {
    const bpm = Math.round(song.bpm * speed);
    const mel = M.notes.map(n => ({ t: n.t, d: n.d * 0.95, notes: [n.midi], mi: n.i, vel: 0.8, inst: Snd.inst() }));
    running = true; sync(); clearCls(); fb('');
    handle = Snd.play({ events: M.backing.concat(mel), bpm, total: M.total }, { force: true, inst: () => Snd.backingInst(),
      onStep: (e, on) => { if (e.mi === undefined) return; const n = M.notes[e.mi]; setCls(n.col, on ? 'cur' : 'ok'); piano.mark(n.midi, on); },
      onEnd: () => { if (running) { handle = null; running = false; piano.clear(); sync(); fb('Listen once more, then try Learn.'); } } });
  }
  /* ---- learn (waits for you) ---- */
  function runLearn() {
    running = true; idx = 0; miss = 0; clearCls(); res.innerHTML = ''; sync(); fb('');
    setCls(M.notes[0].col, 'cur'); noteHint(M.notes[0]);
  }
  /* ---- play along (scored) ---- */
  let startCtx = 0, judged = [], hits = [], extras = 0, spb = 0, tol = 0.45;
  function runAlong() {
    const bpm = Math.round(song.bpm * speed); spb = 60 / bpm;
    const minGap = M.notes.reduce((m, n, i) => i ? Math.min(m, n.t - M.notes[i - 1].t) : m, 9);
    tol = Math.min(0.45, Math.max(0.25, minGap * 0.45));
    judged = M.notes.map(() => false); hits = []; extras = 0;
    const cin = M.bpb;
    const clicks = Array.from({ length: cin }, (_, i) => ({ t: i, d: 0.2, click: i === 0 ? 2 : 1 }));
    const ev = clicks.concat(M.backing.map(x => Object.assign({}, x, { t: x.t + cin })));
    running = true; sync(); clearCls(); res.innerHTML = ''; fb('Count-in…');
    startCtx = Snd.now() + 0.08;
    handle = Snd.play({ events: ev, bpm, total: M.total + cin }, { force: true, inst: () => Snd.backingInst(), onEnd: () => { if (running && mode === 'along') finishAlong(); } });
    const loop = () => {
      if (!running || mode !== 'along') return;
      const beat = (Snd.now() - startCtx) / spb - cin;
      if (beat >= -0.2) fb('');
      let next = null;
      M.notes.forEach(n => {
        if (!judged[n.i] && beat > n.t + tol) { judged[n.i] = true; setCls(n.col, 'bad'); }
        if (!judged[n.i] && !next && beat >= n.t - 1.2) next = n;
      });
      if (next) { if (!cols()[next.col].classList.contains('cur')) { setCls(next.col, 'cur'); noteHint(next); } } else piano.clear();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  function finishAlong() {
    running = false; cancelAnimationFrame(raf); handle = null; piano.clear();
    M.notes.forEach(n => { if (!judged[n.i]) { judged[n.i] = true; setCls(n.col, 'bad'); } });
    const total = M.notes.length, ok = hits.length, acc = total ? Math.round(100 * ok / total) : 0;
    const mean = ok ? hits.reduce((a, h) => a + h, 0) / ok : 0, ms = Math.round(mean * spb * 1000);
    const stars = sbStars(acc);
    let timing = ok < 3 ? '' : Math.abs(ms) < 60 ? 'Your timing was right on the beat.' : 'You tended to play ' + Math.abs(ms) + ' ms ' + (ms < 0 ? 'early' : 'late') + '.';
    let xp = '';
    if (!song.mine) {
      const r = sbState()[song.id] || (sbState()[song.id] = { plays: 0, best: 0, stars: 0 });
      r.plays++; r.best = Math.max(r.best, acc); r.stars = Math.max(r.stars, stars); r.last = E.dateStr();
      if (acc >= 70 && !r.xp) { r.xp = true; award(15, 'songbook'); xp = ' +15 points for your first strong play-through.'; }
      touch();
    }
    sync();
    res.innerHTML = '<div class="callout"><p><b>' + acc + '% of notes in time</b> <span aria-label="' + stars + ' of 3 stars">' + sbStarText(stars) + '</span> (' + ok + ' of ' + total + ').' + (extras ? ' ' + extras + ' extra or wrong note' + (extras === 1 ? '' : 's') + '.' : '') + '</p>' +
      (timing ? '<p class="muted">' + esc(timing) + '</p>' : '') + '<p class="muted">' + (acc >= 90 ? 'Excellent. Try a faster speed.' : acc >= 70 ? 'Good. One more pass at this speed, then go faster.' : 'Use Learn mode on the notes that turned red, or slow the speed down.') + esc(xp) + '</p></div>';
    fb('');
  }
  /* ---- input ---- */
  cleanups.push(Input.listen(ev => {
    if (!running) return;
    if (mode === 'learn') {
      const n = M.notes[idx]; if (!n) return;
      if (ev.midi === n.midi) {
        piano.ok(ev.midi); setCls(n.col, 'ok'); idx++; fb('');
        if (idx >= M.notes.length) {
          running = false; piano.clear(); sync();
          fb('You played the whole melody' + (miss ? ' with ' + miss + ' slip' + (miss === 1 ? '' : 's') : ' without a slip') + '. Now try Play along.', 'ok');
        } else { setCls(M.notes[idx].col, 'cur'); noteHint(M.notes[idx]); }
      } else {
        miss++; piano.bad(ev.midi);
        const same = ((ev.midi % 12) + 12) % 12 === ((n.midi % 12) + 12) % 12;
        fb('That was ' + fmt(E.midiName(ev.midi).replace(/-?\d+$/, '')) + (same ? ': right note, wrong octave.' : '. Look at the lit note on the staff.'), 'bad');
      }
    } else if (mode === 'along') {
      const beat = (ev.ctx - latSec() - startCtx) / spb - M.bpb;
      if (beat < -0.6) return;
      let best = null;
      M.notes.forEach(n => { if (!judged[n.i] && n.midi === ev.midi && Math.abs(n.t - beat) <= tol && (!best || Math.abs(n.t - beat) < Math.abs(best.t - beat))) best = n; });
      if (best) { judged[best.i] = true; hits.push(beat - best.t); setCls(best.col, 'ok'); piano.ok(ev.midi); }
      else { extras++; piano.bad(ev.midi); }
    }
  }));
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-sb]'); if (!b) return; const a = b.dataset.sb;
    if (a === 'mode') { halt(); mode = b.dataset.v; clearCls(); res.innerHTML = ''; fb(''); sync(); }
    if (a === 'speed') { const was = running; halt(); speed = +b.dataset.v; sync(); if (was && mode === 'listen') runListen(); }
    if (a === 'go') { if (running) { halt(); clearCls(); fb(''); return; } if (mode === 'listen') runListen(); else if (mode === 'learn') runLearn(); else runAlong(); }
  });
  host.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.sb === 'hints') { hints = e.target.checked; if (!hints) piano.clear(); } });
  sync();
  return { destroy() { halt(); Snd.stopAll(); cleanups.forEach(f => f()); piano.destroy(); } };
}

App.SONGBOOK = SONGBOOK; App.sbBuild = sbBuild;
function viewSong() {
  const p = route.params || {};
  if (p.pid) return viewProject(p.pid);
  const ps = progScript(sl.key, sl.degs, sl.sev, sl.style, sl.bpm, sl);
  const diat = E.diatonic(sl.key, sl.sev);
  const note = (E.PROGRESSIONS.find(x => x.id === sl.pid) || {}).note || 'Your own progression.';
  const html = '<div class="screen"><div class="pagehead"><h1>Song Lab</h1><p class="muted">Pick a key and a progression, hear it loop, then turn it into a song.</p></div>' +
    '<section class="card"><div class="grid2"><label class="field"><span>Key</span>' + selectHtml('slkey', keyOptions, sl.key, 'slkey') + '</label><label class="field"><span>Progression</span>' + selectHtml('slprog', E.PROGRESSIONS.map(x => [x.id, x.name + ' · ' + x.tag]).concat([['custom', 'My own']]), sl.pid, 'slprog') + '</label>' +
    '<label class="field"><span>Rhythm</span>' + selectHtml('slstyle', Object.keys(E.STYLES).map(k => [k, E.STYLES[k].label]), sl.style, 'slstyle') + '</label>' +
    '<label class="field"><span>Tempo <b id="slbpmv" class="mono">' + sl.bpm + '</b> BPM</span><input type="range" id="slbpm" min="50" max="180" value="' + sl.bpm + '" data-bind="slbpm"></label>' +
    '<label class="field"><span>Drum beat</span>' + selectHtml('slbeat', Object.keys(E.BEATS).map(k => [k, E.BEATS[k].label]), sl.beat, 'slbeat') + '</label>' +
    '<label class="field"><span>Swing (looser feel)</span><input type="range" id="slswing" min="0" max="60" value="' + sl.swing + '" data-bind="slswing"></label></div>' +
    '<label class="switch"><input type="checkbox" id="slsev" data-bind="slsev"' + (sl.sev ? ' checked' : '') + '><span>Use 7th chords</span></label>' + soundPicker() +
    '<div id="slcards">' + chordCards(ps.chs, -1) + '</div><div id="slkb"></div><p class="tiny" id="slbass">Bass note under each chord is its root. Right hand moves by the shortest path (voice leading).</p>' +
    '<div class="row wrap"><button class="btn primary lg" type="button" id="slplay" data-act="slplay">' + icon('play') + 'Play loop</button><button class="btn ghost" type="button" data-act="slnew">' + icon('plus') + 'Make this a song project</button></div><p class="muted">' + esc(note) + '</p></section>' +
    (sl.beat === 'custom' ? gridCard() : '') + '<section class="card"><h3>Build your own</h3><p class="muted">Tap the chords of ' + esc(fmt(sl.key)) + ' major in the order you want, up to eight.</p><div class="chips">' + diat.map(c => '<button type="button" class="chip-btn" data-act="sladd" data-d="' + c.deg + '"><b class="mono">' + esc(c.name) + '</b><span>' + esc(c.roman) + '</span></button>').join('') + '</div><div class="row wrap"><button class="btn ghost sm" data-act="slundo">Remove last</button><button class="btn ghost sm" data-act="slclear">Clear</button></div></section>' +
    '<section class="card"><div class="split"><h3>My song projects</h3><button class="btn ghost sm" data-act="slnew">' + icon('plus') + 'New</button></div>' + (S.songs.length ? '<ul class="lessons">' + S.songs.map(s => '<li class="lrow"><span class="lstat">' + (s.done ? icon('star') : icon('song')) + '</span><div class="lmain"><b>' + esc(s.title) + '</b><span class="tiny">' + fmt(s.key) + ' · ' + s.degs.length + ' chords · ' + Object.values(s.steps).filter(Boolean).length + ' of 4 steps' + (s.done ? ' · finished' : '') + '</span></div><button class="btn sm ghost" data-act="openproj" data-id="' + esc(s.id) + '">Open</button></li>').join('') + '</ul>' : '<p class="muted">No projects yet. A project walks you from four chords to a finished song with a chorus.</p>') + '</section></div>';
  return {
    html,
    mount(root) {
      const piano = Piano($('#slkb', root), { lo: 52, hi: 79, names: false, readonly: true, minKey: 18, height: 90, base: false });
      let handle = null, playing = false;
      const btn = $('#slplay', root);
      function setBtn() { btn.innerHTML = playing ? icon('stop') + 'Stop' : icon('play') + 'Play loop'; }
      function stop() { if (handle) { const h = handle; handle = null; h.stop(); } playing = false; piano.clear(); setBtn(); $$('.ccard', root).forEach(c => c.classList.remove('on')); }
      sl.toggle = () => {
        if (playing) { stop(); return; }
        const p2 = progScript(sl.key, sl.degs, sl.sev, sl.style, sl.bpm, sl); playing = true; setBtn();
        handle = Snd.play(p2.script, { force: true, inst: () => Snd.inst(), loop: () => playing, onEnd: () => { if (playing) { playing = false; handle = null; piano.clear(); setBtn(); $$('.ccard', root).forEach(c => c.classList.remove('on')); } }, onStep: (e, on) => {
          if (!on) return;
          const idx = Math.floor((e.t + 0.001) / 4) % sl.degs.length;
          $$('.ccard', root).forEach((c, k) => c.classList.toggle('on', k === idx));
          piano.hint({ midis: p2.voiced[idx].rh });
          const bs = $('#slbass', root); if (bs) bs.textContent = 'Playing ' + p2.chs[idx].name + ' · bass ' + fmt(E.pcName(p2.voiced[idx].bass)) + ' · right hand ' + p2.voiced[idx].rh.map(m => fmt(E.midiName(m))).join(' ');
        } });
      };
      if (sl.autoplay) { sl.autoplay = false; setTimeout(() => sl.toggle && sl.toggle(), 200); }
      return () => { playing = false; stop(); piano.destroy(); sl.toggle = null; };
    }
  };
}
function newProject() {
  const id = 'p' + Date.now().toString(36);
  const n = S.songs.length + 1, degs = sl.degs.slice(0, 8).length >= 2 ? sl.degs.slice(0, 8) : [1, 5, 6, 4];
  const P = { id, title: 'My song ' + n, key: sl.key, degs, sev: sl.sev, style: sl.style, bpm: sl.bpm, beat: sl.beat, swing: sl.swing, grid: JSON.parse(JSON.stringify(sl.grid)), melody: null, lyrics: { chorus: '', verse: '', bridge: '' }, structure: [], steps: { prog: false, melody: false, chorus: false, song: false }, done: false, created: Date.now() };
  migrateProject(P);
  S.songs.push(P);
  touch(); checkAch(); go('song', { pid: id });
}
function saveFile(name, mime, data) {
  const blob = new Blob([data], { type: mime }), url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
}
/* Standard MIDI File, format 1: a conductor track (tempo, time signature, section markers) plus one track per part.
   tracks: [{ name, ch, notes: [{ t, d, m, v }] }] with t and d in beats. */
function buildMidi(o) {
  const PPQ = 480, enc = new TextEncoder();
  const u16 = n => [(n >> 8) & 255, n & 255], u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const vlq = n => { n = Math.max(0, Math.round(n)); const b = [n & 127]; while ((n >>= 7) > 0) b.unshift((n & 127) | 128); return b; };
  const meta = (type, data) => [0xFF, type, ...vlq(data.length), ...data];
  const text = (type, str) => meta(type, Array.from(enc.encode(str)));
  const chunk = (id, body) => [...enc.encode(id), ...u32(body.length), ...body];
  const track = evs => {
    evs.sort((a, b) => a.tick - b.tick || a.ord - b.ord);
    const last = evs.length ? evs[evs.length - 1].tick : 0;
    evs.push({ tick: last, ord: 9, bytes: meta(0x2F, []) });
    let prev = 0; const body = [];
    evs.forEach(e => { body.push(...vlq(e.tick - prev), ...e.bytes); prev = e.tick; });
    return chunk('MTrk', body);
  };
  const tk = beats => Math.round(beats * PPQ);
  const tempo = Math.round(60000000 / o.bpm);
  const dd = Math.round(Math.log2(o.ts[1]));
  const cond = [{ tick: 0, ord: 0, bytes: text(0x03, o.title) }, { tick: 0, ord: 1, bytes: meta(0x58, [o.ts[0], dd, 24, 8]) }, { tick: 0, ord: 2, bytes: meta(0x51, [(tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255]) }];
  (o.markers || []).forEach(mk => cond.push({ tick: tk(mk.t), ord: 3, bytes: text(0x06, mk.text) }));
  const parts = [track(cond)];
  o.tracks.forEach(t => {
    const evs = [{ tick: 0, ord: 0, bytes: text(0x03, t.name) }, { tick: 0, ord: 1, bytes: [0xC0 | t.ch, 0] }];
    t.notes.forEach(n => {
      const on = tk(n.t), off = Math.max(on + 1, tk(n.t + n.d));
      evs.push({ tick: on, ord: 5, bytes: [0x90 | t.ch, n.m & 127, n.v] }, { tick: off, ord: 4, bytes: [0x80 | t.ch, n.m & 127, 0] });
    });
    parts.push(track(evs));
  });
  return new Uint8Array([...chunk('MThd', [...u16(1), ...u16(parts.length), ...u16(PPQ)]), ...[].concat(...parts)]);
}
