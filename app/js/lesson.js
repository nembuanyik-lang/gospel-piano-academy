'use strict';
/* ---------------------------------------------------------------- exercise runner */
function noteWord(m) { return fmt(E.midiName(m)); }
/* ---- performance-test helpers: expand a progression across keys ---- */
const SHARP_KEYS = new Set(['G', 'D', 'A', 'E', 'B', 'F#', 'C#']);
function perfShift(base, key) { let d = (E.pcOfName(key) - E.pcOfName(base) + 12) % 12; if (d > 6) d -= 12; return d; }
function perfTranspose(t, off, key, range) {
  const sharp = SHARP_KEYS.has(key), rn = r => E.pcName((E.pcOfName(r) + off + 120) % 12, sharp);
  if (t.notes) {
    let ms = t.notes.map(tk => E.midiOf(tk) + off);
    if (range) { while (Math.min.apply(null, ms) < range[0]) ms = ms.map(m => m + 12); while (Math.max.apply(null, ms) > range[1]) ms = ms.map(m => m - 12); }
    return Object.assign({}, t, { notes: ms.map(m => E.midiName(m, sharp)), name: t.name.replace(/(^|\/)([A-G][#b]?)/g, (all, pre, r) => pre + rn(r)) });
  }
  return Object.assign({}, t, { root: rn(t.root) });
}
function perfRange(ex) { return ex.range || (ex.prog.some(t => t.notes) ? [36, 84] : [48, 72]); }
function perfSequence(ex) {
  const base = ex.base || 'C', range = perfRange(ex);
  return (ex.keys || [base]).reduce((all, k) => all.concat(ex.prog.map(t => perfTranspose(t, perfShift(base, k), k, range))), []);
}
function mountExercise(host, ex, opt) {
  opt = opt || {};
  if (ex.type === 'perf' && !ex.range) ex = Object.assign({}, ex, { range: perfRange(ex) });
  const lo = ex.range ? ex.range[0] : 60, hi = ex.range ? ex.range[1] : 72;
  const isTap = ex.type === 'tap';
  let hints = opt.hints !== undefined ? opt.hints : ex.hints === true;
  const locked = opt.hints === false;
  host.innerHTML =
    '<div class="ex">' +
    '<p class="ex-prompt">' + esc(ex.prompt || '') + '</p>' +
    '<div class="ex-board"></div><div class="ex-dots" aria-hidden="true"></div>' +
    (isTap ? '' : '<div class="ex-piano"></div>') +
    '<p class="ex-fb" role="status" aria-live="polite"></p>' +
    '<div class="ex-bar">' +
    (isTap ? '' : (locked ? '<span class="tiny">Hints are off for this one.</span><button class="btn ghost sm" type="button" data-x="peek">Peek (counts as a miss)</button>' :
      '<label class="switch"><input type="checkbox" data-x="hints"' + (hints ? ' checked' : '') + '><span>Show hints</span></label><button class="btn ghost sm" type="button" data-x="peek">Peek</button>')) +
    '<button class="btn ghost sm" type="button" data-x="restart">' + icon('replay') + 'Restart</button></div></div>';
  const box = $('.ex', host), board = $('.ex-board', host), dots = $('.ex-dots', host), fbEl = $('.ex-fb', host);
  const piano = isTap ? null : Piano($('.ex-piano', host), { lo, hi, names: S.prefs.names, height: opt.height || 150 });
  const cleanups = [];
  let miss = 0, done = false, peekTimer = null;
  function fb(msg, kind) { fbEl.textContent = msg || ''; fbEl.className = 'ex-fb' + (kind ? ' ' + kind : ''); }
  function finishOk(info) {
    if (done) return; done = true; box.classList.add('done');
    const acc = info && info.accuracy !== undefined ? info.accuracy : Math.round(100 * (info && info.total ? info.total / (info.total + miss) : 1));
    fb((info && info.message) || 'Well done.' + (miss ? ' ' + miss + ' slip' + (miss > 1 ? 's' : '') + '.' : ' No slips.'), 'ok');
    if (piano) piano.clear();
    if (opt.onDone) opt.onDone({ success: true, miss, accuracy: acc });
  }
  const api = {
    destroy() { cleanups.forEach(f => { try { f(); } catch (e) { /* ignore */ } }); clearTimeout(peekTimer); if (piano) piano.destroy(); },
    restart() { start(); }
  };
  host.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.x === 'hints') { hints = e.target.checked; refresh(); } });
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'restart') { start(); }
    if (b.dataset.x === 'peek') { miss++; const was = hints; hints = true; refresh(); clearTimeout(peekTimer); peekTimer = setTimeout(() => { hints = was; refresh(); }, 1600); }
  });
  let refresh = () => {};
  let start = () => {};

  /* ---- sequence of notes ---- */
  if (ex.type === 'seq') {
    const toks = ex.notes.map(E.parseToken);
    let idx = 0, times = [], metro = null;
    refresh = () => {
      const t = toks[idx];
      dots.innerHTML = ex.notes.map((n, i) => '<span class="pill' + (i < idx ? ' done' : i === idx && !done ? ' cur' : '') + '">' + (hints || i < idx ? fmt(String(n).replace(/-?\d+$/, '')) : '') + '</span>').join('');
      board.innerHTML = '<div class="count">' + idx + ' / ' + toks.length + '</div>' + (ex.metro ? '<div class="tiny">Metronome: ' + ex.metro + ' BPM</div>' : '');
      if (hints && idx < toks.length) {
        const fingers = {};
        if (ex.fingers && t.midi !== undefined) fingers[t.midi] = ex.fingers[idx];
        const lab = {}; if (t.midi !== undefined) lab[t.midi] = fmt(String(ex.notes[idx]).replace(/-?\d+$/, ''));
        piano.hint(t.midi !== undefined ? { midis: [t.midi], fingers, labels: lab } : { pcs: [t.pc], fingers });
      } else piano.clear();
    };
    start = () => {
      idx = 0; miss = 0; times = []; done = false; box.classList.remove('done'); fb('');
      if (metro) { metro.stop(); metro = null; }
      refresh();
    };
    cleanups.push(Input.listen(ev => {
      if (done) return;
      const t = toks[idx];
      const ok = t.midi !== undefined ? ev.midi === t.midi : pcOf(ev.midi) === t.pc;
      if (ok) {
        if (ex.metro && idx === 0) metro = Snd.metro({ bpm: ex.metro, bpb: 4, limit: ex.notes.length + 4 });
        times.push(ev.t / 1000); idx++; piano.ok(ev.midi); fb('');
        if (idx >= toks.length) {
          if (metro) { metro.stop(); metro = null; }
          refresh();
          const st = ex.metro ? E.steadiness(times) : null;
          finishOk({ total: toks.length, message: 'Complete.' + (miss ? ' ' + miss + ' slip' + (miss > 1 ? 's' : '') + '.' : ' No slips.') + (st !== null ? ' Steadiness ' + st + ' out of 100.' : '') });
        } else refresh();
      } else {
        miss++; piano.bad(ev.midi);
        if (t.midi !== undefined && pcOf(ev.midi) === t.pc) fb('Right note, wrong octave. Look for ' + noteWord(t.midi) + '.', 'bad');
        else fb(hints ? 'That was ' + noteWord(ev.midi) + '. Next is ' + fmt(String(ex.notes[idx]).replace(/-?\d+$/, '')) + '.' : 'Not that one. Try again, or press Peek.', 'bad');
        if (ex.maxMiss !== undefined && miss > ex.maxMiss) {
          fb('More than ' + ex.maxMiss + ' slips. Starting again from the top.', 'bad');
          setTimeout(() => { if (!done) start(); }, 1200);
        }
      }
    }));
    cleanups.push(() => { if (metro) metro.stop(); });
  }

  /* ---- find named keys ---- */
  if (ex.type === 'find') {
    let list = [], idx = 0;
    const build = () => {
      list = []; let last = null;
      for (let i = 0; i < ex.count; i++) { let n; let guard = 0; do { n = E.pick(ex.names); guard++; } while (n === last && ex.names.length > 1 && guard < 20); list.push(n); last = n; }
    };
    refresh = () => {
      const nm = list[idx];
      const black = nm && /[#b]/.test(nm);
      board.innerHTML = nm ? '<div class="find"><span class="sym">' + fmt(nm) + '</span>' + (black ? '<span class="tiny">Either name works for this black key.</span>' : '<span class="tiny">Any octave counts.</span>') + '</div>' : '';
      dots.innerHTML = list.map((n, i) => '<span class="pill' + (i < idx ? ' done' : i === idx && !done ? ' cur' : '') + '"></span>').join('');
      if (hints && nm) piano.hint({ pcs: [E.pcOfName(nm)] }); else piano.clear();
    };
    start = () => { build(); idx = 0; miss = 0; done = false; box.classList.remove('done'); fb(''); refresh(); };
    cleanups.push(Input.listen(ev => {
      if (done) return;
      const want = E.pcOfName(list[idx]);
      if (pcOf(ev.midi) === want) {
        piano.ok(ev.midi); idx++; fb('');
        if (idx >= list.length) { refresh(); finishOk({ total: list.length }); } else refresh();
      } else {
        miss++; piano.bad(ev.midi);
        fb('That was ' + fmt(E.pcName(pcOf(ev.midi))) + '. Look for ' + fmt(list[idx]) + '.', 'bad');
        if (ex.maxMiss !== undefined && miss > ex.maxMiss) { fb('More than ' + ex.maxMiss + ' slips. Starting again.', 'bad'); setTimeout(() => { if (!done) start(); }, 1200); }
      }
    }));
  }

  /* ---- reading notes from a staff ---- */
  if (ex.type === 'read') {
    let items = [], idx = 0, pos = 0, buf = [];
    const norm = it => { let clef = ex.clef || 'treble', ns = it; if (it && it.notes) { clef = it.clef || clef; ns = it.notes; } return { clef, notes: Array.isArray(ns) ? ns : [ns] }; };
    const build = () => {
      items = []; let last = null;
      for (let i = 0; i < ex.count; i++) {
        if (ex.phrase) {
          const flat = ex.pool.map(norm), cols = []; let k = Math.floor(Math.random() * flat.length); const walk = ex.walk || 3;
          for (let j = 0; j < ex.phrase; j++) {
            if (j) { let nk, g = 0; do { nk = clamp(k + Math.floor(Math.random() * (2 * walk + 1)) - walk, 0, flat.length - 1); g++; } while (nk === k && flat.length > 1 && g < 20); k = nk; }
            cols.push(flat[k].notes);
          }
          items.push({ clef: ex.clef || flat[0].clef, cols });
        } else {
          let it, g = 0; do { it = norm(E.pick(ex.pool)); g++; } while (last && JSON.stringify(it) === last && ex.pool.length > 1 && g < 20);
          last = JSON.stringify(it); items.push({ clef: it.clef, cols: [it.notes] });
        }
      }
    };
    const need = () => items[idx].cols[pos].map(t => E.midiOf(t));
    refresh = () => {
      const it = items[idx];
      if (!it) { board.innerHTML = ''; return; }
      const cols = it.cols.map((c, i) => ({ notes: c, dur: it.cols.length === 1 ? 'w' : 'q', state: done ? 'ok' : i < pos ? 'ok' : i === pos ? 'cur' : '' }));
      board.innerHTML = '<div class="exstaff">' + Staff.render({ clef: it.clef, key: ex.key || 0, cols, colW: it.cols.length > 1 || it.cols[0].length > 1 ? 46 : 60, label: 'Staff notation: ' + it.cols.map(c => c.join(' and ')).join(', then ') + '.' }) + '</div>';
      dots.innerHTML = items.map((x, i) => '<span class="pill' + (i < idx ? ' done' : i === idx && !done ? ' cur' : '') + '"></span>').join('');
      if (hints && !done) { const ms = need(), labels = {}; it.cols[pos].forEach((t, i) => { labels[ms[i]] = tokLabel(t); }); piano.hint({ midis: ms, labels }); } else piano.clear();
    };
    start = () => { build(); idx = 0; pos = 0; buf = []; miss = 0; done = false; box.classList.remove('done'); fb(''); refresh(); };
    cleanups.push(Input.listen(ev => {
      if (done || !items[idx]) return;
      const want = need();
      if (want.includes(ev.midi)) {
        if (!buf.includes(ev.midi)) buf.push(ev.midi);
        piano.ok(ev.midi);
        if (want.every(m => buf.includes(m))) {
          buf = []; pos++; fb('');
          if (pos >= items[idx].cols.length) { idx++; pos = 0; }
          if (idx >= items.length) { done = false; refresh(); finishOk({ total: items.length }); } else refresh();
        }
      } else {
        miss++; buf = []; piano.bad(ev.midi);
        const wp = want.map(m => ((m % 12) + 12) % 12);
        fb('That was ' + fmt(E.midiName(ev.midi).replace(/-?\d+$/, '')) + (wp.includes(pcOf(ev.midi)) ? ': right note, wrong octave. Check where it sits on the staff.' : '. Look at the staff again.'), 'bad');
        if (ex.maxMiss !== undefined && miss > ex.maxMiss) { fb('More than ' + ex.maxMiss + ' slips. Starting again.', 'bad'); setTimeout(() => { if (!done) start(); }, 1200); }
      }
    }));
  }

  /* ---- chords ---- */
  if (ex.type === 'chord') {
    const targets = ex.targets;
    let idx = 0, buf = [], timer = null, settle = null;
    const optsFor = t => {
      const o = {};
      if (t.inv) { o.lowestPc = E.chordPcs(t.root, t.quality)[t.inv]; o.lowestIdx = t.inv; }
      if (t.bass) o.bassBelow = 59;
      return o;
    };
    const voicingMidis = t => t.notes.map(tk => E.midiOf(tk));
    refresh = () => {
      const t = targets[idx];
      dots.innerHTML = targets.map((x, i) => '<span class="pill chord' + (i < idx ? ' done' : i === idx && !done ? ' cur' : '') + '">' + esc(x.notes ? (x.short || x.name) : fmt(x.root) + E.QUALITIES[x.quality].sym) + '</span>').join('');
      if (t && t.notes) {
        const ms = voicingMidis(t), labels = {};
        t.notes.forEach((tk, i) => { labels[ms[i]] = tokLabel(tk); });
        board.innerHTML = '<div class="find"><span class="sym mono">' + esc(t.name) + '</span>' + (t.label ? '<span class="num">' + esc(t.label) + '</span>' : '') +
          '<span class="tiny">' + (hints ? esc(t.notes.map(tk => tokLabel(tk)).join(' ')) + (t.low ? ' · lowest note ' + esc(tokLabel(t.notes[ms.indexOf(Math.min.apply(null, ms))])) : '') + (t.span ? ' · spread wide' : '') : 'Hints are off.') + '</span></div>';
        if (hints) piano.hint({ midis: ms, labels }); else piano.clear();
      } else if (t) {
        const names = E.chordNames(t.root, t.quality).map(fmt).join(' ');
        board.innerHTML = '<div class="find"><span class="sym mono">' + esc(E.chordSymbol(t.root, t.quality)) + (t.inv ? '<small>' + esc('/' + fmt(E.chordNames(t.root, t.quality)[t.inv])) + '</small>' : '') + '</span>' +
          (t.label ? '<span class="num">' + esc(t.label) + '</span>' : '') +
          '<span class="tiny">' + (hints ? esc(names) + (t.bass ? ' · low ' + esc(fmt(t.root)) + ' in the left hand' : '') + (t.inv ? ' · ' + ['', 'first', 'second', 'third'][t.inv] + ' inversion' : '') : (t.bass ? 'Low root first, then the chord.' : 'Hints are off.')) + '</span></div>';
        if (hints) piano.hint(chordHint(t, lo, true)); else piano.clear();
      } else board.innerHTML = '';
    };
    start = () => { clearTimeout(settle); idx = 0; miss = 0; buf = []; done = false; box.classList.remove('done'); fb(''); clearTimeout(timer); refresh(); };
    function evaluate(final) {
      const t = targets[idx]; if (!t || done) return;
      const now = performance.now(); buf = buf.filter(b => now - b.t < 3500);
      if (!buf.length) return;
      const r = t.notes ? E.compareToVoicing(buf.map(b => b.m), voicingMidis(t), t.name, { low: !!t.low, span: t.span }) : E.compareToChord(buf.map(b => b.m), t.root, t.quality, optsFor(t));
      if (r.status === 'correct' && t.notes && !final) {
        /* a voicing can repeat a pitch class in another octave: wait for every exact note, or a short settle, so a late note is not left over for the next chord */
        const have = new Set(buf.map(b => b.m));
        if (!voicingMidis(t).every(m => have.has(m))) { clearTimeout(settle); settle = setTimeout(() => evaluate(true), 350); return; }
      }
      if (r.status === 'correct') {
        clearTimeout(settle); clearTimeout(timer); fb(r.message, 'ok'); buf = []; idx++;
        if (idx >= targets.length) { refresh(); finishOk({ total: targets.length }); } else { refresh(); }
      } else if (final) {
        miss++;
        fb(r.message, r.status === 'missing' ? 'info' : 'bad');
        if (r.status !== 'missing') buf = [];
      }
    }
    cleanups.push(Input.listen(ev => {
      if (done) return;
      buf.push({ m: ev.midi, t: ev.t });
      evaluate(false);
      clearTimeout(timer);
      timer = setTimeout(() => evaluate(true), 1300);
    }));
    cleanups.push(() => { clearTimeout(timer); clearTimeout(settle); });
  }

  /* ---- timed performance: play a progression in time with the click, through a tempo ladder ----
     ex: { type: 'perf', id, prog: [chord symbols or voicings written in ex.base], keys: [...], base: 'C',
           beats: beats per chord, ladder: [BPMs], pass: share of chords that must land (default 0.85) }
     Each chord is judged from the notes struck between half a beat early and three quarters of a beat late. */
  if (ex.type === 'perf') {
    const ladder = ex.ladder || [ex.bpm || 70], beats = ex.beats || 4, passAt = ex.pass || 0.85, base = ex.base || 'C';
    const keys = ex.keys || [base], seq = perfSequence(ex);
    let stage = 0, state = 'idle', metro = null, iv = null, plan = [], heard = [], rec = [], spb = 1, lastRun = null;
    const rec0 = (S.perf || {})[ex.id];
    if (rec0 && rec0.stage !== undefined) stage = Math.min(ladder.length - 1, rec0.stage);   // carry on from the last tempo reached
    const label = t => fmt(t.notes ? t.name : E.chordSymbol(t.root, t.quality));
    const notesOnly = seq.every(t => t.notes && t.notes.length === 1);
    const hintFor = t => { if (!t) return; if (t.notes) { const ms = t.notes.map(E.midiOf), lab = {}; t.notes.forEach((tk, i) => { lab[ms[i]] = tokLabel(tk); }); piano.hint({ midis: ms, labels: lab }); } else piano.hint(chordHint(t, lo, true)); };
    refresh = () => {
      const cur = state === 'run' ? plan.findIndex(p => p.ok === null) : 0;
      dots.innerHTML = '<div class="perf-row">' + seq.map((t, i) => {
        const p = plan[i], cls = p && p.ok === true ? ' done' : p && p.ok === false ? ' miss' : i === cur && state === 'run' ? ' cur' : '';
        return '<span class="pill chord' + cls + '">' + esc(label(t)) + '</span>';
      }).join('') + '</div>';
      const bpm = ladder[stage];
      board.innerHTML = '<div class="perf-head"><span class="sym mono">' + (state === 'run' && seq[cur] ? esc(label(seq[cur])) : bpm + ' BPM') + '</span>' +
        '<span class="tiny">Tempo ' + (stage + 1) + ' of ' + ladder.length + ' · ' + bpm + ' BPM · ' + seq.length + (notesOnly ? ' notes' : ' chords') + (keys.length > 1 ? ' in ' + keys.length + ' keys' : '') + ' · ' + (beats === 0.5 ? 'half a beat' : beats === 1 ? 'one beat' : beats + ' beats') + ' each</span>' +
        '<span class="tiny" id="perfcount" aria-live="polite">' + (state === 'run' ? '' : notesOnly ? 'One bar of clicks first, then play each note exactly in time.' : 'One bar of clicks first, then play each chord on its first beat.') + '</span>' +
        (state === 'run' ? '' : '<div class="row wrap"><button class="btn primary" type="button" data-perf="go">' + icon('play') + (lastRun ? 'Play again' : 'Start') + '</button>' +
          (lastRun && rec.length ? '<button class="btn ghost sm" type="button" data-perf="midi">Save this take as MIDI</button>' : '') +
          (stage > 0 ? '<button class="btn ghost sm" type="button" data-perf="down">Slower tempo</button>' : '') + '</div>') + '</div>';
      if (hints) hintFor(state === 'run' ? seq[cur] : seq[0]); else piano.clear();
    };
    function stop() { if (iv) { clearInterval(iv); iv = null; } if (metro) { metro.stop(); metro = null; } }
    function begin() {
      Snd.ensure(); stop();
      const bpm = ladder[stage]; spb = 60 / bpm;
      metro = Snd.metro({ bpm, bpb: 4, limit: Math.ceil(4 + seq.length * beats + 1) });
      if (!metro) { fb('Sound is not available, so the performance test cannot run.', 'bad'); return; }
      plan = seq.map((t, i) => ({ t, at: metro.t0 + (4 + i * beats) * spb, ok: null }));
      heard = []; rec = []; state = 'run'; fb(''); refresh();
      iv = setInterval(tick, 30);
    }
    const early = () => Math.min(0.5, beats * 0.45) * spb, late = () => Math.min(0.75, beats * 0.6) * spb;
    function judge(p) {
      const win = heard.filter(n => n.t >= p.at - early() && n.t <= p.at + late()).map(n => n.m);
      const t = p.t;
      const r = !win.length ? { status: 'none' } : t.notes ? E.compareToVoicing(win, t.notes.map(E.midiOf), t.name, { low: !!t.low }) : E.compareToChord(win, t.root, t.quality, t.bass ? { bassBelow: 59 } : {});
      p.ok = r.status === 'correct';
      if (!p.ok) p.why = r.status === 'none' ? 'nothing played on time' : r.status;
    }
    function tick() {
      const now = Snd.now();
      plan.forEach(p => { if (p.ok === null && now > p.at + late() + 0.02) judge(p); });
      const beat = (now - metro.t0) / spb, el = $('#perfcount', board);
      if (el) el.textContent = beat < 4 ? 'Count-in ' + (Math.floor(Math.max(0, beat)) + 1) : '';
      const cur = plan.findIndex(p => p.ok === null);
      const symEl = $('.perf-head .sym', board);
      if (symEl && cur >= 0) symEl.textContent = label(seq[cur]);
      const pills = $$('.perf-row .pill', dots);
      plan.forEach((p, i) => { if (pills[i]) pills[i].className = 'pill chord' + (p.ok === true ? ' done' : p.ok === false ? ' miss' : i === cur ? ' cur' : ''); });
      if (hints && cur >= 0 && cur !== tick.last) { hintFor(seq[cur]); tick.last = cur; }
      if (cur < 0) finish();
    }
    function finish() {
      stop(); state = 'idle'; tick.last = -1;
      const hits = plan.filter(p => p.ok).length, total = plan.length, acc = Math.round(100 * hits / total), bpm = ladder[stage];
      lastRun = { hits, total, acc, bpm };
      const passed = hits / total >= passAt - 1e-9;
      const log = S.perf || (S.perf = {}), r = log[ex.id] || (log[ex.id] = { title: ex.title || ex.prompt || ex.id, best: 0, acc: 0, stage: 0, of: ladder.length, top: ladder[ladder.length - 1] });
      r.title = ex.title || r.title; r.last = Date.now(); r.of = ladder.length; r.top = ladder[ladder.length - 1];
      if (passed) { if (bpm > (r.best || 0) || (bpm === r.best && acc > r.acc)) { r.best = bpm; r.acc = acc; } r.stage = Math.max(r.stage || 0, Math.min(ladder.length - 1, stage + 1)); }
      if (passed && stage === ladder.length - 1) { r.passedAll = true; r.at = Date.now(); }
      touch();
      const misses = plan.filter(p => !p.ok).slice(0, 3).map(p => label(p.t) + ' (' + (p.why === 'nothing played on time' ? 'late or missing' : 'wrong notes') + ')');
      refresh();
      if (passed && stage === ladder.length - 1) finishOk({ accuracy: acc, message: 'Mastered at ' + bpm + ' BPM: ' + hits + ' of ' + total + ' chords on time.' });
      else if (passed) { fb('Passed at ' + bpm + ' BPM (' + hits + ' of ' + total + '). Next tempo: ' + ladder[stage + 1] + ' BPM.', 'ok'); stage++; refresh(); }
      else { miss++; fb(hits + ' of ' + total + ' on time; you need ' + Math.ceil(total * passAt) + '. ' + (misses.length ? 'Check: ' + misses.join(', ') + '.' : ''), 'bad'); }
    }
    function saveTake() {
      const t0 = plan.length ? plan[0].at : 0, spbR = spb;
      const notes = rec.map(n => ({ t: Math.max(0, (n.t - t0) / spbR + 4), d: Math.max(0.1, ((n.off || n.t + spbR) - n.t) / spbR), m: n.m, v: Math.round(clamp((n.v || 0.8) * 127, 20, 127)) }));
      const data = buildMidi({ title: (ex.title || 'Performance') + ' ' + ladder[stage] + ' BPM', bpm: lastRun ? lastRun.bpm : ladder[stage], ts: [4, 4], markers: [], tracks: [{ name: 'Piano', ch: 0, notes }] });
      saveFile(((ex.title || 'performance').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'performance') + '_' + (lastRun ? lastRun.bpm : '') + 'bpm.mid', 'audio/midi', data);
      toast('Take saved as a MIDI file. Send it to your teacher or open it in a DAW.');
    }
    board.addEventListener('click', e => {
      const b = e.target.closest('[data-perf]'); if (!b) return;
      if (b.dataset.perf === 'go') begin();
      else if (b.dataset.perf === 'midi') saveTake();
      else if (b.dataset.perf === 'down') { stage = Math.max(0, stage - 1); refresh(); }
    });
    cleanups.push(Input.listen(ev => {
      const t = ev.ctx - latSec();
      if (state === 'run') { heard.push({ m: ev.midi, t }); rec.push({ m: ev.midi, t, v: ev.vel }); }
    }));
    cleanups.push(Input.listenOff(ev => { const t = ev.ctx - latSec(); for (let i = rec.length - 1; i >= 0; i--) if (rec[i].m === ev.midi && !rec[i].off) { rec[i].off = t; break; } }));
    start = () => { stop(); state = 'idle'; plan = []; done = false; box.classList.remove('done'); fb(''); refresh(); };
    cleanups.push(stop);
  }

  /* ---- tap along ---- */
  if (isTap) {
    const bpb = ex.bpb || 4, spb = 60 / ex.bpm, tol = ex.tol || 0.18;
    let state = 'idle', taps = [], expected = [], endT = 0, iv = null, metro = null;
    board.innerHTML = '<div class="tapwrap"><div class="tap-pad" role="button" tabindex="0" aria-label="Tap pad. Press space or tap to play along."><span class="tap-main">Start</span><span class="tap-sub">then tap with each click</span></div><div class="tap-count" aria-live="polite"></div></div>';
    const pad = $('.tap-pad', board), main = $('.tap-main', board), sub = $('.tap-sub', board), counter = $('.tap-count', board);
    const drawDots = matched => {
      dots.innerHTML = ex.pattern.map((d, i) => '<span class="pill tap' + (matched ? (matched[i] ? ' done' : ' miss') : '') + '"></span>').join('');
    };
    start = () => {
      stop(); state = 'idle'; miss = 0; done = false; box.classList.remove('done'); fb('');
      main.textContent = 'Start'; sub.textContent = 'then tap with each click'; counter.textContent = '';
      drawDots(null);
    };
    function stop() { if (iv) { clearInterval(iv); iv = null; } if (metro) { metro.stop(); metro = null; } }
    function begin() {
      const total = Math.ceil(bpb + ex.pattern.reduce((a, b) => a + b, 0) + 1);
      metro = Snd.metro({ bpm: ex.bpm, bpb, limit: total });
      if (!metro) { fb('Sound is not available in this browser, so the tap exercise cannot run.', 'bad'); return; }
      state = 'run'; taps = []; fb('');
      const first = metro.t0 + bpb * spb; let pos = 0;
      expected = ex.pattern.map(d => { const t = first + pos * spb; pos += d; return t; });
      endT = first + pos * spb + spb * 0.5;
      main.textContent = 'Tap'; sub.textContent = 'count-in…';
      iv = setInterval(() => {
        const now = Snd.now();
        if (now > endT) { finish(); return; }
        const cur = (now - metro.t0) / spb;
        if (cur < bpb) { counter.textContent = 'Count-in ' + (Math.floor(Math.max(0, cur)) + 1); sub.textContent = 'get ready'; }
        else { counter.textContent = 'Go'; sub.textContent = 'tap with the click'; }
      }, 50);
    }
    function tap() {
      Act.last = Date.now();
      if (state === 'idle') { Snd.ensure(); begin(); return; }
      if (state !== 'run') return;
      taps.push(Snd.now() - latSec());
      pad.classList.add('hit'); setTimeout(() => pad.classList.remove('hit'), 90);
    }
    function finish() {
      stop(); state = 'result';
      const r = E.scoreTaps(taps, expected, tol);
      drawDots(r.matched);
      counter.textContent = r.hits + ' of ' + r.total + ' on time' + (r.avgErrMs !== null ? ' · average ' + r.avgErrMs + ' ms off' : '');
      main.textContent = 'Again'; sub.textContent = 'tap to retry'; state = 'idle';
      if (r.pass) finishOk({ accuracy: Math.round(100 * r.hits / r.total), message: 'Steady. ' + r.hits + ' of ' + r.total + ' beats on time.' });
      else { miss++; fb('Not quite. Aim for at least ' + Math.ceil(r.total * 0.75) + ' of ' + r.total + ' on the click. Listen first, then tap.', 'bad'); }
    }
    pad.addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
    pad.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) tap(); } });
    const onKey = e => {
      if (e.code !== 'Space' || e.repeat) return;
      const t = e.target; if (t && (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName) || t === pad)) return;
      e.preventDefault(); tap();
    };
    window.addEventListener('keydown', onKey); cleanups.push(() => window.removeEventListener('keydown', onKey));
    cleanups.push(stop);
  }
  start();
  return api;
}
App.mountExercise = mountExercise;

/* ---------------------------------------------------------------- quiz */
function Quiz(host, questions, cfg) {
  cfg = cfg || {};
  let qs = [], i = 0, picked = null, correct = 0, answers = [], piano = null, handle = null, moveFocus = false;
  const cleanups = [];
  function begin() {
    const src = cfg.getQuestions ? cfg.getQuestions() : questions;
    qs = (cfg.shuffleQuestions ? E.shuffle(src) : src).map(q => {
      const opts = q.o.map((t, k) => ({ t, k }));
      return Object.assign({}, q, { opts: q.o.length > 2 ? E.shuffle(opts) : opts });
    });
    i = 0; picked = null; correct = 0; answers = []; moveFocus = false; draw();
  }
  function stopAudio() { Snd.stopAll(); }
  function draw() {
    if (piano) { piano.destroy(); piano = null; }
    stopAudio();
    const q = qs[i];
    if (!q) { result(); return; }
    const answered = picked !== null;
    host.innerHTML =
      '<div class="quiz"><div class="quiz-top"><span class="tiny">Question ' + (i + 1) + ' of ' + qs.length + '</span><div class="bar"><i style="width:' + Math.round(i / qs.length * 100) + '%"></i></div></div>' +
      '<h3 class="qtext">' + esc(q.q) + '</h3>' +
      (q.listen ? '<button class="btn soft" type="button" data-q="listen">' + icon('play') + 'Play sound</button>' : '') +
      (q.staff ? '<div class="qstaff">' + Staff.render(q.staff) + '</div>' : '') +
      (q.show ? '<div class="qpiano"></div>' : '') +
      '<div class="opts" role="group" aria-label="Answers">' +
      q.opts.map((o, n) => '<button type="button" class="opt' + (answered ? (o.k === q.a ? ' right' : n === picked ? ' wrong' : '') : '') + '" data-pick="' + n + '"' + (answered ? ' disabled' : '') + '>' + esc(o.t) + (answered ? (o.k === q.a ? '<span class="sr-only"> (correct answer)</span>' : n === picked ? '<span class="sr-only"> (your answer, not correct)</span>' : '') : '') + '</button>').join('') +
      '</div>' +
      (answered ? '<div class="why ' + (q.opts[picked].k === q.a ? 'ok' : 'bad') + '" role="status" tabindex="-1"><b>' + (q.opts[picked].k === q.a ? 'Correct. ' : 'Not quite. ') + '</b>' + esc(q.why) + '</div><button class="btn primary" type="button" data-q="next">' + (i + 1 >= qs.length ? 'See result' : 'Next question') + '</button>' : '') +
      '</div>';
    if (q.show) { piano = Piano($('.qpiano', host), { lo: q.show.range[0], hi: q.show.range[1], names: true, readonly: true, height: 110, base: false }); piano.hint({ pcs: q.show.hi.map(t => E.parseToken(t).pc) }); }
    if (moveFocus) {
      const tgt = answered ? $('.why', host) : $('.qtext', host);
      if (tgt) { if (!tgt.hasAttribute('tabindex')) tgt.setAttribute('tabindex', '-1'); try { tgt.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    }
    moveFocus = true;
  }
  function result() {
    const pct = Math.round(100 * correct / qs.length);
    host.innerHTML = '<div class="quiz result"><div class="score">' + pct + '<small>%</small></div><p><b>' + correct + ' of ' + qs.length + ' correct.</b> ' +
      (cfg.passMark ? (pct >= cfg.passMark ? 'You passed.' : 'You need ' + cfg.passMark + '% to pass. Review the lesson and try again.') : '') + '</p>' +
      (cfg.resultExtra ? cfg.resultExtra(pct) : '') +
      '<div class="row">' + (cfg.noRetry ? '' : '<button class="btn ghost" type="button" data-q="retry">Try again</button>') + (cfg.nextHtml ? cfg.nextHtml(pct) : '') + '</div></div>';
    if (cfg.onFinish) cfg.onFinish({ pct, correct, total: qs.length, answers });
  }
  host.addEventListener('click', ev => {
    const b = ev.target.closest('[data-pick],[data-q]'); if (!b || !host.contains(b)) return;
    const q = qs[i];
    if (b.dataset.pick !== undefined && picked === null) {
      picked = +b.dataset.pick;
      const ok = q.opts[picked].k === q.a;
      if (ok) correct++;
      answers.push({ ok, q: q.q });
      if (cfg.onAnswer) cfg.onAnswer(q, ok);
      draw();
    } else if (b.dataset.q === 'next') { i++; picked = null; draw(); }
    else if (b.dataset.q === 'retry') { begin(); }
    else if (b.dataset.q === 'listen' && q.listen) {
      const sc = E.toEvents(q.listen);
      handle = Snd.play(sc, { speed: 1 });
    }
  });
  begin();
  return { destroy() { if (piano) piano.destroy(); stopAudio(); cleanups.forEach(f => f()); } };
}
App.Quiz = Quiz;

/* ---------------------------------------------------------------- listen list */
function ListenList(host, items, opt) {
  opt = opt || {};
  const range = opt.range || [48, 72];
  let slow = S.prefs.speed === 'slow', loop = false, playing = -1, handle = null;
  host.innerHTML =
    '<div class="listen"><div class="qpiano"></div>' +
    '<div class="row wrap"><label class="switch"><input type="checkbox" data-l="slow"' + (slow ? ' checked' : '') + '><span>Slow</span></label>' +
    '<label class="switch"><input type="checkbox" data-l="loop"><span>Loop</span></label></div>' +
    '<ul class="lst">' + items.map((it, n) => '<li><button type="button" class="play-btn" data-l="play" data-n="' + n + '" aria-label="Play: ' + esc(it.label) + '">' + icon('play') + '</button><span>' + esc(it.label) + '</span></li>').join('') + '</ul></div>';
  const piano = Piano($('.qpiano', host), { lo: range[0], hi: range[1], names: true, readonly: true, height: 120, base: false });
  function setBtn(n, on) {
    $$('.play-btn', host).forEach((b, k) => { const act = on && k === n; b.classList.toggle('active', act); b.innerHTML = icon(act ? 'stop' : 'play'); });
  }
  function stop() { if (handle) { const h = handle; handle = null; h.stop(); } piano.markAll(false); setBtn(-1, false); playing = -1; }
  host.addEventListener('change', e => {
    if (e.target.dataset.l === 'slow') { slow = e.target.checked; S.prefs.speed = slow ? 'slow' : 'normal'; touch(); }
    if (e.target.dataset.l === 'loop') loop = e.target.checked;
  });
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-l="play"]'); if (!b) return;
    const n = +b.dataset.n;
    if (playing === n) { stop(); return; }
    stop();
    const script = E.toEvents(items[n].spec);
    playing = n; setBtn(n, true);
    handle = Snd.play(script, {
      speed: slow ? 0.65 : 1, loop: () => loop,
      onStep: (ev, on) => { (ev.notes || []).forEach(m => piano.mark(m, on)); },
      onEnd: () => { if (playing === n) { piano.markAll(false); setBtn(-1, false); playing = -1; handle = null; } }
    });
    if (!S.prefs.sound) { toast('Sound is off. Turn it on in Profile.'); }
  });
  return { destroy() { stop(); piano.destroy(); } };
}

/* rhythm bars: relative lengths in a 4/4 bar */
function rhythmBarsHtml() {
  const rows = [['Whole note', 4, 1], ['Half notes', 2, 2], ['Quarter notes', 1, 4], ['Eighth notes', 0.5, 8]];
  return '<div class="rbars">' + rows.map(r => '<div class="rbar"><div class="rname"><b>' + r[0] + '</b><span class="tiny">' + r[1] + (r[1] === 1 ? ' beat' : ' beats') + ' each</span></div><div class="rrow">' +
    Array.from({ length: r[2] }, () => '<i style="flex:' + r[1] + '"></i>').join('') + '</div></div>').join('') + '</div><p class="tiny">One bar of 4/4. Each block is one note; longer blocks last longer.</p>';
}

/* ---------------------------------------------------------------- lesson player */
const ui = { lesson: null, testout: null, onboarding: null };
const STEP_LABELS = { objective: 'Objective', theory: 'Theory', visual: 'Visual', listen: 'Listen', play: 'Play', practice: 'Practice', apply: 'Apply', challenge: 'Challenge', quiz: 'Assessment', mastery: 'Mastery' };
function lessonSteps(L) {
  const s = ['objective', 'theory'];
  if (L.visual) s.push('visual');
  if (L.listen && L.listen.length) s.push('listen');
  s.push('play');
  if (L.practice && L.practice.length) s.push('practice');
  s.push('apply', 'challenge', 'quiz', 'mastery');
  return s;
}
function stepDone(L, step) {
  const r = S.lessons[L.id] || {};
  if (step === 'play') return !!r.play;
  if (step === 'practice') return (L.practice || []).every((_, i) => r.pdone && r.pdone[i]);
  if (step === 'challenge') return !!r.challenge;
  if (step === 'quiz') return !!(r.quiz && r.quiz.best >= 70);
  if (step === 'mastery') return r.status === 'mastered';
  return false;
}
const GOSPEL_LINK = { 'g-what': ['I-IV-V-I', 'C', false], 'g-amen': ['IV-I', 'C', false], 'g-worship': ['I-V-vi-IV', 'C', false], 'g-sevenths': ['I-IV-V-I', 'C', true], 'g-turnaround': ['I-vi-ii-V', 'C', true], 'chords-in-key': ['I-V-vi-IV', 'C', false], 'bass-and-chords': ['I-vi-IV-V', 'C', false] };

function openLesson(id, step) {
  const L = C.byId[id];
  if (!isUnlocked(id)) { toast('Finish the earlier lessons first.'); return; }
  const steps = lessonSteps(L);
  ui.lesson = { id, step: step || 0, pi: 0 };
  go('lesson');
}
function viewLesson() {
  const st = ui.lesson; if (!st) return viewCourse();
  const L = C.byId[st.id], steps = lessonSteps(L), cur = steps[st.step], r = S.lessons[L.id] || {};
  /* compact progress header: 'Step 3 of 10 · Visual' over a segmented bar; every segment is a button */
  const doneCount = steps.filter(s => stepDone(L, s)).length;
  const tabs = '<div class="stepper"><div class="split"><b class="steplabel">Step ' + (st.step + 1) + ' of ' + steps.length + ' · ' + STEP_LABELS[cur] + '</b><span class="tiny">' + doneCount + ' of ' + steps.length + ' steps done</span></div>' +
    '<div class="segs" role="group" aria-label="Lesson steps">' + steps.map((s, i) => '<button type="button" class="seg-i' + (i === st.step ? ' on' : '') + (stepDone(L, s) ? ' ok' : '') + '" data-act="lstep" data-i="' + i + '" title="' + (i + 1) + '. ' + STEP_LABELS[s] + '" aria-label="Step ' + (i + 1) + ': ' + STEP_LABELS[s] + (stepDone(L, s) ? ', done' : '') + '" aria-current="' + (i === st.step ? 'step' : 'false') + '"></button>').join('') + '</div></div>';
  let body = '';
  const needs = { play: 'Play it through to earn credit.', practice: 'Finish every exercise to earn credit.', challenge: 'Complete the challenge for mastery.' };
  if (cur === 'objective') {
    body = '<div class="card hero-card"><p class="eyebrow">Objective</p><h2>' + esc(L.objective) + '</h2><p class="why"><b>Why this matters.</b> ' + esc(L.why) + '</p>' +
      '<p class="tiny">' + steps.length + ' short steps, about ' + L.minutes + ' minutes. To master it: finish the Play step, every Practice exercise, the Challenge, and score 80% on the Assessment.</p></div>';
  } else if (cur === 'theory') {
    body = '<div class="card prose"><p class="eyebrow">Theory</p>' + L.theory.map(p => '<p>' + esc(p) + '</p>').join('') + '</div>';
  } else if (cur === 'visual') {
    body = '<div class="card"><p class="eyebrow">Visual</p><div id="vis"></div></div>';
  } else if (cur === 'listen') {
    body = '<div class="card"><p class="eyebrow">Listen</p><div id="lst"></div></div>';
  } else if (cur === 'play') {
    body = '<div class="card"><p class="eyebrow">Play ' + (r.play ? '<span class="tag ok">Done</span>' : '<span class="tag">' + needs.play + '</span>') + '</p><div id="exh"></div></div>';
  } else if (cur === 'practice') {
    const n = L.practice.length;
    body = '<div class="card"><p class="eyebrow">Practice ' + (stepDone(L, 'practice') ? '<span class="tag ok">Done</span>' : '<span class="tag">' + needs.practice + '</span>') + '</p>' +
      (n > 1 ? '<div class="seg">' + L.practice.map((_, i) => '<button type="button" class="' + (i === st.pi ? 'on' : '') + '" data-act="lpi" data-i="' + i + '">Exercise ' + (i + 1) + (r.pdone && r.pdone[i] ? ' ✓' : '') + '</button>').join('') + '</div>' : '') +
      '<div id="exh"></div></div>';
  } else if (cur === 'apply') {
    const gl = GOSPEL_LINK[L.id];
    body = '<div class="card prose"><p class="eyebrow">Apply it in gospel music</p><p>' + esc(L.apply.text) + '</p>' +
      (gl ? '<button class="btn soft" type="button" data-act="songpreset" data-id="' + esc(gl[0]) + '" data-key="' + gl[1] + '" data-sev="' + (gl[2] ? 1 : 0) + '">' + icon('song') + 'Hear and loop it in the Song Lab</button>' : '') + '</div>' +
      (L.apply.record ? '<div class="card" id="recbox"></div>' : '') + (L.apply.signoff ? '<div class="card">' + signoffHtml(L) + '</div>' : '');
  } else if (cur === 'challenge') {
    body = '<div class="card"><p class="eyebrow">Challenge ' + (r.challenge ? '<span class="tag ok">Done</span>' : '<span class="tag">' + needs.challenge + '</span>') + '</p><div id="exh"></div></div>';
  } else if (cur === 'quiz') {
    body = '<div class="card"><p class="eyebrow">Assessment ' + (r.quiz ? '<span class="tag' + (r.quiz.best >= 80 ? ' ok' : '') + '">Best ' + r.quiz.best + '%</span>' : '') + '</p><div id="qz"></div></div>';
  } else if (cur === 'mastery') {
    const best = r.quiz ? r.quiz.best : 0;
    const rows = [
      ['Play step', !!r.play, 'play'],
      ['Practice exercises', stepDone(L, 'practice'), 'practice'],
      ['Challenge', !!r.challenge, 'challenge'],
      ['Assessment 80% or more', best >= 80, 'quiz']
    ].filter(x => x[2] !== 'practice' || (L.practice && L.practice.length));
    const status = lessonStatus(L.id);
    const nxt = (() => { const i = C.order.indexOf(L.id); for (let k = i + 1; k < C.order.length; k++) if (isUnlocked(C.order[k]) && !isDone(C.order[k])) return C.order[k]; return null; })();
    body = '<div class="card"><p class="eyebrow">Mastery</p><h2>' + (status === 'mastered' ? 'Mastered.' : status === 'done' ? 'Lesson complete. Mastery is within reach.' : 'Not complete yet.') + '</h2>' +
      '<ul class="checks">' + rows.map(x => '<li class="' + (x[1] ? 'ok' : '') + '">' + (x[1] ? icon('check') : '<i class="dot"></i>') + '<span>' + x[0] + '</span>' + (x[1] ? '' : '<button class="btn ghost sm" type="button" data-act="lgo" data-step="' + x[2] + '">Go</button>') + '</li>').join('') + '</ul>' +
      '<p class="tiny">Complete means the Play step plus 70% on the Assessment. Mastered adds every practice exercise, the Challenge, and 80% on the Assessment.</p>' +
      '<div class="row wrap">' + (nxt ? '<button class="btn primary" type="button" data-act="openlesson" data-id="' + nxt + '">Next: ' + esc(C.byId[nxt].title) + '</button>' : '') + '<button class="btn ghost" type="button" data-act="go" data-to="course">Back to course</button></div></div>';
  }
  const html =
    '<div class="screen lesson"><div class="lh"><button class="btn ghost sm" type="button" data-act="go" data-to="course">' + icon('back') + 'Course</button>' +
    '<div class="lt"><span class="eyebrow">' + esc(C.MODULES.find(m => m.id === L.module).title) + '</span><h1>' + esc(L.title) + '</h1></div></div>' +
    tabs + body +
    '<div class="lnav"><button class="btn ghost" type="button" data-act="lprev"' + (st.step === 0 ? ' disabled' : '') + '>' + icon('back') + 'Back</button>' +
    (st.step < steps.length - 1 ? '<button class="btn primary" type="button" data-act="lnext">Continue' + icon('chev') + '</button>' : '') + '</div></div>';
  return {
    html,
    mount(root) {
      const cl = [];
      const rec = () => lessonRec(L.id);
      if (cur === 'visual') cl.push(mountVisual($('#vis', root), L));
      if (cur === 'apply' && L.apply.record) cl.push(mountAudioRecorder($('#recbox', root), { name: L.id }));
      if (cur === 'listen') cl.push(ListenList($('#lst', root), L.listen, { range: (L.visual && L.visual.range) || (L.play && L.play.range) || [48, 72] }));
      if (cur === 'play') {
        const h = mountExercise($('#exh', root), L.play, { onDone: () => { rec().play = true; markToday('lesson'); evalLesson(L.id); refreshTabs(); } });
        cl.push(h);
      }
      if (cur === 'practice') {
        const h = mountExercise($('#exh', root), L.practice[st.pi], { onDone: () => { const r2 = rec(); r2.pdone = r2.pdone || []; r2.pdone[st.pi] = true; markToday('lesson'); evalLesson(L.id); refreshTabs(); } });
        cl.push(h);
      }
      if (cur === 'challenge') {
        const h = mountExercise($('#exh', root), L.challenge, { hints: false, onDone: () => { rec().challenge = true; markToday('lesson'); evalLesson(L.id); refreshTabs(); } });
        cl.push(h);
      }
      if (cur === 'quiz') {
        const q = Quiz($('#qz', root), L.quiz, {
          passMark: 70,
          getQuestions: () => QG.buildQuiz(L),
          onAnswer: (qq, ok) => { recordAnswer(L.cat, ok); QG.markSeen(L.id, qq.k); },
          onFinish: res => {
            const r2 = rec(); const prev = r2.quiz ? r2.quiz.best : 0;
            r2.quiz = { best: Math.max(prev, res.pct), last: res.pct, n: ((r2.quiz && r2.quiz.n) || 0) + 1 };
            S.scores.push({ kind: 'lesson', id: L.id, title: L.title, pct: res.pct, at: Date.now() }); if (S.scores.length > 60) S.scores.shift();
            if (res.pct === 100) S.events.perfectQuiz = true;
            markToday('lesson'); evalLesson(L.id); refreshTabs();
          },
          resultExtra: pct => pct >= 80 ? '' : '<p class="tiny">Tip: reread the Theory step, then retry. Your best score is kept.</p>',
          nextHtml: () => '<button class="btn primary" type="button" data-act="lnext">Continue' + icon('chev') + '</button>'
        });
        cl.push(q);
      }
      function refreshTabs() {
        const segs = $$('.seg-i', root); let n = 0;
        segs.forEach((t, i) => { const ok = stepDone(L, steps[i]); if (ok) n++; t.classList.toggle('ok', ok); });
        const lab = $('.stepper .tiny', root); if (lab) lab.textContent = n + ' of ' + steps.length + ' steps done';
      }
      return () => cl.forEach(c => c && c.destroy && c.destroy());
    }
  };
}
function mountVisual(host, L) {
  const v = L.visual, cl = [];
  if (v.rhythm) { host.innerHTML = rhythmBarsHtml(); return { destroy() {} }; }
  const range = v.range || [48, 72];
  host.innerHTML = (v.staff ? '<div class="vstaff"></div>' : '') + '<div class="vpiano"></div>' + (v.chordsInKey ? '<div class="cik"></div>' : '') + '<p class="caption" aria-live="polite"></p>' +
    (v.steps && v.steps.length > 1 ? '<div class="row"><button class="btn ghost sm" type="button" data-v="prev">' + icon('back') + 'Previous</button><span class="tiny vcount"></span><button class="btn ghost sm" type="button" data-v="next">Next' + icon('chev') + '</button></div>' : '');
  const piano = Piano($('.vpiano', host), { lo: range[0], hi: range[1], names: true, height: 150 });
  const cap = $('.caption', host), cnt = $('.vcount', host);
  let i = 0;
  function show(h, caption) {
    cap.textContent = caption || '';
    piano.hint(h);
  }
  function stepHint(s) {
    if (s.chord) {
      const t = { root: s.chord.root, quality: s.chord.quality, inv: s.chord.inv || 0 };
      return chordHint(t, range[0], true);
    }
    const midis = [], pcs = [], labels = {}, fingers = {};
    (s.hi || []).forEach(tok => {
      const p = E.parseToken(tok);
      if (p.midi !== undefined) { midis.push(p.midi); labels[p.midi] = tokLabel(tok); if (s.fingers && s.fingers[tok]) fingers[p.midi] = s.fingers[tok]; }
      else pcs.push(p.pc);
    });
    return { midis, pcs, labels, fingers };
  }
  function draw() {
    const s = v.steps[i];
    show(stepHint(s), s.caption);
    const vs = $('.vstaff', host); if (vs) vs.innerHTML = s.staff ? Staff.render(s.staff) : '';
    if (cnt) cnt.textContent = (i + 1) + ' of ' + v.steps.length;
  }
  if (v.steps) draw();
  if (v.chordsInKey) {
    const chords = E.diatonic(v.chordsInKey, false);
    const holder = $('.cik', host);
    holder.innerHTML = '<p class="tiny">Tap a chord to see and hear it.</p><div class="chips">' + chords.map((c, n) => '<button type="button" class="chip-btn" data-cik="' + n + '"><b class="mono">' + esc(fmt(c.root) + E.QUALITIES[c.quality].sym) + '</b><span>' + esc(c.roman) + '</span><span class="tiny">' + esc(c.number) + '</span></button>').join('') + '</div>';
    cap.textContent = 'Capital Roman numeral = major, lowercase = minor, ° = diminished.';
    holder.addEventListener('click', e => {
      const b = e.target.closest('[data-cik]'); if (!b) return;
      const c = chords[+b.dataset.cik];
      piano.hint(chordHint({ root: c.root, quality: c.quality }, range[0], true));
      cap.textContent = fmt(c.root) + E.QUALITIES[c.quality].sym + ' is the ' + c.roman + ' chord (number ' + c.number + ') in C major: ' + E.chordNames(c.root, c.quality).map(fmt).join(' – ') + '.';
      Snd.play({ events: [E.blockEvent(E.chordMidi(c.root, c.quality, 4, 0), 0, 2)], bpm: 80, total: 2 });
    });
  }
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b || !v.steps) return;
    i = clamp(i + (b.dataset.v === 'next' ? 1 : -1), 0, v.steps.length - 1); draw();
  });
  return { destroy() { piano.destroy(); } };
}
