'use strict';
/* ---------------------------------------------------------------- At your piano: the 20-minute routine screen
   Shown as a lesson step. A timer walks through the blocks (warm-up, the lesson's four blocks, close)
   with a chime between them; a small metronome sits beside it. The timer keeps running if you look at
   another screen, and while it runs the time counts as practice even though you are away from the
   computer. Finishing (or logging by hand) records the session in S.routines[lessonId]. */
const RT = { id: null, i: 0, endAt: 0, left: 0, running: false, paused: false, tick: null, met: null, metBpm: 70, blocks: [], win: [], ladderAt: 0 };

/* ---- listening: with a keyboard connected, every block counts notes, playing time, chords and timing ----
   Timing is measured against the routine's metronome (on the beat or halfway between beats). */
const rtHeld = new Set();
function rtBlank() { return { notes: 0, secs: new Set(), timed: 0, onTime: 0, chords: {}, last: '' }; }
function rtCur() { if (!RT.blocks[RT.i]) RT.blocks[RT.i] = rtBlank(); return RT.blocks[RT.i]; }
function rtTimingOf(st) { return st.timed >= 8 ? Math.round(100 * st.onTime / st.timed) : null; }
function rtHear(ev) {
  if (!RT.running || RT.paused || !RT.id) return;
  const st = rtCur();
  st.notes++; st.secs.add(Math.floor(ev.t / 1000));
  rtHeld.add(ev.midi);
  if (rtHeld.size >= 3) { const c = E.identifyChord([...rtHeld]); if (c) { st.last = c.name; st.chords[c.symbol] = (st.chords[c.symbol] || 0) + (st.lastSym === c.symbol ? 0 : 1); st.lastSym = c.symbol; } }
  if (RT.met && RT.met.spb) {
    const t = ev.ctx - (typeof latSec === 'function' ? latSec() : 0), grid = RT.met.spb / 2;
    if (t > RT.met.t0 - 0.05) {
      const ph = ((t - RT.met.t0) % grid + grid) % grid, off = Math.min(ph, grid - ph) * 1000;
      const ok = off <= Math.min(70, grid * 1000 * 0.22);
      st.timed++; if (ok) st.onTime++;
      RT.win.push(ok); if (RT.win.length > 32) RT.win.shift();
    }
  }
}
Input.always.add(ev => rtHear(ev));
Input.alwaysOff.add(ev => { rtHeld.delete(ev.midi); });
/* a block that names a tempo ("metronome 60", "at 80", "100 BPM") sets the metronome for you */
function blockBpm(text) {
  const pats = [/metronome[^.0-9]{0,12}(\d{2,3})/i, /(\d{2,3})\s*BPM/i, /tempo (?:to |at |of )?(\d{2,3})/i, /\bat (\d{2,3})\b/i];
  for (const r of pats) { const m = r.exec(text); if (m) { const n = +m[1]; if (n >= 30 && n <= 240) return n; } }
  return null;
}
/* on a keyboard without touch-sensitive keys, explain how to practise soft and loud */
const DYN_RE = /\b(soft|softly|softer|loud|louder|loudly|dynamics?|accents?|accented|crescendo|diminuendo|swells?|velocity)\b/i;
function adaptForKeyboard(text) {
  if (S.prefs.keyboard !== 'ypt240' || !DYN_RE.test(text)) return text;
  return text + ' On your YPT-240 every key plays at the same loudness: practise this for timing and evenness, and make soft and loud with [MASTER VOLUME], fewer or more notes, or a softer voice (strings or pad).';
}

function routineWarmup(L) {
  if (L.level === '0') return 'Switch on, [MASTER VOLUME] to half, [PORTABLE GRAND]. Five-finger pattern C D E F G and back, right hand then left hand, with the keyboard\'s metronome at 60 ([METRONOME], then [TEMPO/TAP] 0 6 0).';
  if (L.level === '1' && ['Keyboard', 'Rhythm'].includes(L.cat)) return 'Sit well, shoulders loose. Five-finger pattern C D E F G and back, right hand then left hand, metronome 60. Then the same starting on G. Shake your hands out.';
  if (L.level === '1') return 'Five-finger patterns in C and G, hands separately then together, metronome 60. Then the C major scale one octave, hands separately.';
  return 'Scale and arpeggio of the key of the day (' + fmt(keyOfDay()) + ' major), two octaves, hands separately then together, at a comfortable tempo. Then play today\'s chords slowly once.';
}
function routineBlocks(L) {
  const R = pianoRoutine(L.id); if (!R) return [];
  return [[3, 'Warm-up', routineWarmup(L)]].concat(R.b, [[2, 'Close: play it as music', 'Play the main thing from today once, at your best tempo, as if people were listening. Do not stop for mistakes. Then write in a notebook: the date, the tempo you reached, and one thing to fix tomorrow.']]).map(b => [b[0], b[1], adaptForKeyboard(b[2])]);
}
const routineMinutes = L => routineBlocks(L).reduce((a, b) => a + b[0], 0);
function routineLog(id) { return (S.routines && S.routines[id]) || null; }

function routineHtml(L) {
  const R = pianoRoutine(L.id); if (!R) return '<div class="card"><p class="eyebrow">At your piano</p><p class="muted">No routine for this lesson yet.</p></div>';
  const blocks = routineBlocks(L), log = routineLog(L.id), mins = routineMinutes(L);
  const when = log && log.last ? new Date(log.last + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
  return '<div class="card routine"><p class="eyebrow">At your piano · ' + mins + ' minutes ' + (log ? '<span class="tag ok">Done ' + log.n + (log.n === 1 ? ' time' : ' times') + ' · last ' + esc(when) + '</span>' : '<span class="tag">Optional, and the best way to make it stick</span>') + '</p>' +
    '<h2>' + esc(R.f) + '</h2>' +
    howTo('routine', 'How the routine works', ['Put the computer where you can see it from your keyboard, and connect the keyboard by USB if you can.', 'Press Start the routine. Follow the blocks from top to bottom; the current block is highlighted and a chime tells you when to move on.', 'Start the metronome for blocks that name a tempo; the app sets that tempo for you. With the keyboard connected, the app counts your notes, playing time and timing, and offers +5 BPM when you are steady.', 'Next block skips ahead; Pause stops the clock. If you practised without the timer, press I did this routine today.']) +
    '<div class="rt-panel"><div class="rt-now"><span class="tiny" id="rtstate">Ready</span><b id="rtname">' + esc(blocks[0][1]) + '</b><span class="rt-clock mono" id="rtclock">' + mins + ':00</span></div>' +
    '<div class="row wrap"><button class="btn primary" type="button" id="rtgo">' + icon('play') + 'Start the routine</button><button class="btn ghost" type="button" id="rtnext">Next block' + icon('chev') + '</button><button class="btn ghost" type="button" id="rtreset">' + icon('replay') + 'Reset</button></div>' +
    '<div class="row wrap rt-met"><label class="field"><span>Metronome BPM</span><input type="number" id="rtbpm" min="30" max="240" step="1" value="' + RT.metBpm + '"></label><button class="btn ghost" type="button" id="rtmet">' + icon('play') + 'Metronome</button><button class="btn soft sm" type="button" id="rtup" hidden></button></div>' +
    '<p class="rt-listen tiny" id="rtlisten" aria-live="polite"></p></div>' +
    (log && log.lastPlayed != null ? '<p class="tiny muted">Last session: ' + log.lastPlayed + ' min of playing heard' + (log.lastTiming != null ? ', ' + log.lastTiming + '% in time with the metronome' : '') + '. All sessions: ' + (log.played || 0) + ' min heard.</p>' : '') +
    '<ol class="rt-blocks">' + blocks.map((b, i) => { const bp = blockBpm(b[2]); return '<li data-i="' + i + '"><span class="rt-min mono">' + b[0] + ' min' + (bp ? '<br><span class="tiny">' + bp + ' BPM</span>' : '') + '</span><div><b>' + esc(b[1]) + '</b><p>' + esc(b[2]) + '</p><p class="tiny rt-heard" data-heard="' + i + '"></p></div></li>'; }).join('') + '</ol>' +
    '<p class="rt-ready"><b>You are ready to move on when:</b> ' + esc(R.r) + '</p>' +
    '<div class="row wrap"><button class="btn soft" type="button" id="rtlog">' + icon('check') + 'I did this routine today</button><span class="tiny">Use this if you practised without the timer.</span></div></div>';
}

function routineFinish(L, how) {
  S.routines = S.routines || {};
  const d = E.dateStr(), prev = S.routines[L.id] || { n: 0, mins: 0 };
  const heard = RT.id === L.id ? RT.blocks.filter(Boolean) : [];
  const secs = heard.reduce((a, b) => a + b.secs.size, 0), timed = heard.reduce((a, b) => a + b.timed, 0), on = heard.reduce((a, b) => a + b.onTime, 0);
  const rec = { n: prev.n + 1, last: d, mins: (prev.mins || 0) + routineMinutes(L), played: (prev.played || 0) };
  if (heard.length && secs) { rec.lastPlayed = Math.round(secs / 60); rec.played += rec.lastPlayed; rec.lastTiming = timed >= 16 ? Math.round(100 * on / timed) : null; if (rec.lastTiming == null) delete rec.lastTiming; }
  S.routines[L.id] = rec;
  const t = ensureToday(), first = !t.items.piano;
  markToday('piano');
  if (first) award(15, 'piano routine'); else touch();
  toast(how === 'timer' ? 'Routine complete. Well done.' : 'Routine logged for today.');
}
function routineStop() { clearInterval(RT.tick); RT.tick = null; RT.running = false; RT.paused = false; }
function routineMetStop() { if (RT.met) { RT.met.stop(); RT.met = null; } }

function mountRoutine(host, L) {
  const blocks = routineBlocks(L); if (!blocks.length) return { destroy() {} };
  const $q = s => $(s, host);
  const go = $q('#rtgo'), next = $q('#rtnext'), reset = $q('#rtreset'), clock = $q('#rtclock'), name = $q('#rtname'), state = $q('#rtstate');
  const met = $q('#rtmet'), bpm = $q('#rtbpm'), items = $$('.rt-blocks li', host);
  const mine = () => RT.id === L.id;
  const fmtT = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const remainingTotal = () => {
    if (!mine()) return routineMinutes(L) * 60000;
    const cur = RT.paused ? RT.left : Math.max(0, RT.endAt - Date.now());
    return cur + blocks.slice(RT.i + 1).reduce((a, b) => a + b[0] * 60000, 0);
  };
  const listen = $q('#rtlisten'), up = $q('#rtup');
  function setBpm(n) {
    RT.metBpm = clamp(Math.round(n), 30, 240); if (bpm) bpm.value = RT.metBpm; RT.win = [];
    if (RT.met) { routineMetStop(); RT.met = Snd.metro({ bpm: RT.metBpm, bpb: 4 }); }
  }
  function blockTempo() { const b = blocks[RT.i] && blockBpm(blocks[RT.i][2]); if (b) setBpm(b); }
  function paintHeard() {
    const conn = typeof Midi !== 'undefined' && Midi.status === 'ready', on = mine() && (RT.running || RT.paused);
    if (listen) {
      if (!conn) listen.innerHTML = 'Connect your keyboard and the app will listen to your practice: notes, playing time, chords and timing. <button class="btn ghost sm" type="button" data-act="midiconnect">Connect</button>';
      else if (!on) listen.textContent = 'Keyboard connected: the app will listen as you practise.';
      else {
        const st = rtCur(), tm = rtTimingOf(st);
        listen.textContent = 'Listening · ' + st.notes + ' notes · ' + Math.floor(st.secs.size / 60) + ':' + String(st.secs.size % 60).padStart(2, '0') + ' playing' + (st.last ? ' · last chord ' + fmt(st.last) : '') + (RT.met ? (tm != null ? ' · ' + tm + '% in time at ' + RT.metBpm + ' BPM' : ' · timing: keep playing with the metronome') : ' · start the metronome to measure timing');
      }
    }
    $$('[data-heard]', host).forEach(el => {
      const k = +el.dataset.heard, st = mine() ? RT.blocks[k] : null;
      if (!st || !st.notes || (k === RT.i && on)) { el.textContent = ''; return; }
      const tm = rtTimingOf(st), ch = Object.keys(st.chords);
      el.textContent = 'Heard: ' + st.notes + ' notes, ' + Math.max(1, Math.round(st.secs.size / 60)) + ' min playing' + (tm != null ? ', ' + tm + '% in time' : '') + (ch.length ? ', chords ' + ch.slice(0, 6).map(fmt).join(' ') : '') + '.';
    });
    if (up) {
      const steady = RT.met && RT.win.length >= 24 && RT.win.filter(Boolean).length / RT.win.length >= 0.9 && on && !RT.paused;
      up.hidden = !steady; if (steady) up.textContent = 'Steady at ' + RT.metBpm + '. Try ' + Math.min(240, RT.metBpm + 5) + ' BPM';
    }
  }
  function paint() {
    paintHeard();
    const i = mine() ? RT.i : 0, on = mine() && (RT.running || RT.paused);
    items.forEach((li, k) => { li.classList.toggle('cur', on && k === i); li.classList.toggle('done', on && k < i); });
    if (name) name.textContent = blocks[i] ? blocks[i][1] : 'Finished';
    if (state) state.textContent = !on ? 'Ready · ' + routineMinutes(L) + ' minutes' : (RT.paused ? 'Paused · ' : 'Block ' + (i + 1) + ' of ' + blocks.length + ' · ') + 'this block ' + fmtT(RT.paused ? RT.left : RT.endAt - Date.now()) + ' left';
    if (clock) clock.textContent = fmtT(remainingTotal());
    if (go) go.innerHTML = !on ? icon('play') + 'Start the routine' : RT.paused ? icon('play') + 'Resume' : icon('stop') + 'Pause';
  }
  function chime(last) { try { Snd.tone(last ? 72 : 79, 0.5); setTimeout(() => Snd.tone(last ? 79 : 84, 0.7), 220); if (last) setTimeout(() => Snd.tone(84, 1.2), 440); } catch (e) { /* ignore */ } }
  function advance(manual) {
    if (RT.i >= blocks.length - 1) { routineStop(); chime(true); routineFinish(L, 'timer'); RT.id = null; render(); return; }
    RT.i++; RT.endAt = Date.now() + blocks[RT.i][0] * 60000; RT.win = [];
    if (RT.paused) RT.left = blocks[RT.i][0] * 60000;
    blockTempo();
    if (!manual) chime(false);
    toast('Next: ' + blocks[RT.i][1] + ' (' + blocks[RT.i][0] + ' min)');
    const li = items[RT.i]; if (li && li.scrollIntoView) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    paint();
  }
  function startTick() {
    clearInterval(RT.tick);
    RT.tick = setInterval(() => {
      if (!RT.running || RT.paused) return;
      Act.last = Date.now();                       // you are practising at the piano: count it, even with no clicks
      if (Date.now() >= RT.endAt) { if (RT.id === L.id && document.body.contains(host)) advance(false); else { const Lr = C.byId[RT.id]; if (Lr) { const bl = routineBlocks(Lr); if (RT.i >= bl.length - 1) { routineStop(); routineFinish(Lr, 'timer'); RT.id = null; } else { RT.i++; RT.endAt = Date.now() + bl[RT.i][0] * 60000; chime(false); toast('Routine: ' + bl[RT.i][1]); } } } return; }
      if (document.body.contains(host)) paint();
    }, 250);
  }
  if (go) go.addEventListener('click', () => {
    if (!mine() || (!RT.running && !RT.paused)) {
      if (RT.running && !mine()) { const other = C.byId[RT.id]; toast('Stopped the routine for ' + (other ? other.title : 'another lesson') + '.'); }
      Snd.ensure && Snd.ensure();
      Object.assign(RT, { id: L.id, i: 0, endAt: Date.now() + blocks[0][0] * 60000, left: 0, running: true, paused: false, blocks: [], win: [] });
      blockTempo(); startTick(); chime(false);
    } else if (RT.paused) { RT.paused = false; RT.endAt = Date.now() + RT.left; }
    else { RT.paused = true; RT.left = Math.max(0, RT.endAt - Date.now()); }
    paint();
  });
  if (next) next.addEventListener('click', () => {
    if (!mine() || (!RT.running && !RT.paused)) { Object.assign(RT, { id: L.id, i: 0, endAt: Date.now() + blocks[0][0] * 60000, running: true, paused: false, blocks: [], win: [] }); startTick(); }
    advance(true);
  });
  if (reset) reset.addEventListener('click', () => { if (mine()) { routineStop(); RT.id = null; RT.blocks = []; RT.win = []; } paint(); });
  if (up) up.addEventListener('click', () => { setBpm(RT.metBpm + 5); toast('Metronome now ' + RT.metBpm + ' BPM.'); paint(); });
  if (met) met.addEventListener('click', () => {
    if (RT.met) { routineMetStop(); met.innerHTML = icon('play') + 'Metronome'; return; }
    RT.metBpm = clamp(Math.round(+bpm.value || 70), 30, 240); bpm.value = RT.metBpm;
    RT.met = Snd.metro({ bpm: RT.metBpm, bpb: 4 }); RT.win = [];
    if (RT.met) met.innerHTML = icon('stop') + 'Stop metronome';
  });
  if (bpm) bpm.addEventListener('change', () => {
    RT.metBpm = clamp(Math.round(+bpm.value || 70), 30, 240); bpm.value = RT.metBpm;
    if (RT.met) { routineMetStop(); RT.met = Snd.metro({ bpm: RT.metBpm, bpb: 4 }); } RT.win = [];
  });
  const prevMC = typeof Midi !== 'undefined' ? Midi.onChange : null, myMC = () => { if (prevMC) prevMC(); paintHeard(); };
  if (typeof Midi !== 'undefined') Midi.onChange = myMC;
  const logBtn = $q('#rtlog');
  if (logBtn) logBtn.addEventListener('click', () => { routineFinish(L, 'log'); render(); });
  if (mine() && RT.running) startTick();
  if (RT.met && met) met.innerHTML = icon('stop') + 'Stop metronome';
  paint();
  // a redraw rebuilds this screen at once: keep the metronome; leaving the routine screen stops it
  return { destroy() { if (typeof Midi !== 'undefined' && Midi.onChange === myMC) Midi.onChange = prevMC; setTimeout(() => { if (!document.querySelector('.routine #rtmet')) routineMetStop(); }, 0); } };
}
