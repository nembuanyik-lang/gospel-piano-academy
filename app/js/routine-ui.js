'use strict';
/* ---------------------------------------------------------------- At your piano: the 20-minute routine screen
   Shown as a lesson step. A timer walks through the blocks (warm-up, the lesson's four blocks, close)
   with a chime between them; a small metronome sits beside it. The timer keeps running if you look at
   another screen, and while it runs the time counts as practice even though you are away from the
   computer. Finishing (or logging by hand) records the session in S.routines[lessonId]. */
const RT = { id: null, i: 0, endAt: 0, left: 0, running: false, paused: false, tick: null, met: null, metBpm: 70 };

function routineWarmup(L) {
  if (L.level === '1' && ['Keyboard', 'Rhythm'].includes(L.cat)) return 'Sit well, shoulders loose. Five-finger pattern C D E F G and back, right hand then left hand, metronome 60. Then the same starting on G. Shake your hands out.';
  if (L.level === '1') return 'Five-finger patterns in C and G, hands separately then together, metronome 60. Then the C major scale one octave, hands separately.';
  return 'Scale and arpeggio of the key of the day (' + fmt(keyOfDay()) + ' major), two octaves, hands separately then together, at a comfortable tempo. Then play today\'s chords slowly once.';
}
function routineBlocks(L) {
  const R = pianoRoutine(L.id); if (!R) return [];
  return [[3, 'Warm-up', routineWarmup(L)]].concat(R.b, [[2, 'Close: play it as music', 'Play the main thing from today once, at your best tempo, as if people were listening. Do not stop for mistakes. Then write in a notebook: the date, the tempo you reached, and one thing to fix tomorrow.']]);
}
const routineMinutes = L => routineBlocks(L).reduce((a, b) => a + b[0], 0);
function routineLog(id) { return (S.routines && S.routines[id]) || null; }

function routineHtml(L) {
  const R = pianoRoutine(L.id); if (!R) return '<div class="card"><p class="eyebrow">At your piano</p><p class="muted">No routine for this lesson yet.</p></div>';
  const blocks = routineBlocks(L), log = routineLog(L.id), mins = routineMinutes(L);
  const when = log && log.last ? new Date(log.last + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
  return '<div class="card routine"><p class="eyebrow">At your piano · ' + mins + ' minutes ' + (log ? '<span class="tag ok">Done ' + log.n + (log.n === 1 ? ' time' : ' times') + ' · last ' + esc(when) + '</span>' : '<span class="tag">Optional, and the best way to make it stick</span>') + '</p>' +
    '<h2>' + esc(R.f) + '</h2>' +
    '<p class="muted">Take this to your own piano or keyboard. Start the timer, put the computer where you can see it, and follow the blocks. A chime tells you when to move on.</p>' +
    '<div class="rt-panel"><div class="rt-now"><span class="tiny" id="rtstate">Ready</span><b id="rtname">' + esc(blocks[0][1]) + '</b><span class="rt-clock mono" id="rtclock">' + mins + ':00</span></div>' +
    '<div class="row wrap"><button class="btn primary" type="button" id="rtgo">' + icon('play') + 'Start the routine</button><button class="btn ghost" type="button" id="rtnext">Next block' + icon('chev') + '</button><button class="btn ghost" type="button" id="rtreset">' + icon('replay') + 'Reset</button></div>' +
    '<div class="row wrap rt-met"><label class="field"><span>Metronome BPM</span><input type="number" id="rtbpm" min="30" max="240" step="1" value="' + RT.metBpm + '"></label><button class="btn ghost" type="button" id="rtmet">' + icon('play') + 'Metronome</button></div></div>' +
    '<ol class="rt-blocks">' + blocks.map((b, i) => '<li data-i="' + i + '"><span class="rt-min mono">' + b[0] + ' min</span><div><b>' + esc(b[1]) + '</b><p>' + esc(b[2]) + '</p></div></li>').join('') + '</ol>' +
    '<p class="rt-ready"><b>You are ready to move on when:</b> ' + esc(R.r) + '</p>' +
    '<div class="row wrap"><button class="btn soft" type="button" id="rtlog">' + icon('check') + 'I did this routine today</button><span class="tiny">Use this if you practised without the timer.</span></div></div>';
}

function routineFinish(L, how) {
  S.routines = S.routines || {};
  const d = E.dateStr(), prev = S.routines[L.id] || { n: 0, mins: 0 };
  S.routines[L.id] = { n: prev.n + 1, last: d, mins: (prev.mins || 0) + routineMinutes(L) };
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
  function paint() {
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
    RT.i++; RT.endAt = Date.now() + blocks[RT.i][0] * 60000;
    if (RT.paused) RT.left = blocks[RT.i][0] * 60000;
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
      Object.assign(RT, { id: L.id, i: 0, endAt: Date.now() + blocks[0][0] * 60000, left: 0, running: true, paused: false });
      startTick(); chime(false);
    } else if (RT.paused) { RT.paused = false; RT.endAt = Date.now() + RT.left; }
    else { RT.paused = true; RT.left = Math.max(0, RT.endAt - Date.now()); }
    paint();
  });
  if (next) next.addEventListener('click', () => {
    if (!mine() || (!RT.running && !RT.paused)) { Object.assign(RT, { id: L.id, i: 0, endAt: Date.now() + blocks[0][0] * 60000, running: true, paused: false }); startTick(); }
    advance(true);
  });
  if (reset) reset.addEventListener('click', () => { if (mine()) { routineStop(); RT.id = null; } paint(); });
  if (met) met.addEventListener('click', () => {
    if (RT.met) { routineMetStop(); met.innerHTML = icon('play') + 'Metronome'; return; }
    RT.metBpm = clamp(Math.round(+bpm.value || 70), 30, 240); bpm.value = RT.metBpm;
    RT.met = Snd.metro({ bpm: RT.metBpm, bpb: 4 });
    if (RT.met) met.innerHTML = icon('stop') + 'Stop metronome';
  });
  if (bpm) bpm.addEventListener('change', () => {
    RT.metBpm = clamp(Math.round(+bpm.value || 70), 30, 240); bpm.value = RT.metBpm;
    if (RT.met) { routineMetStop(); RT.met = Snd.metro({ bpm: RT.metBpm, bpb: 4 }); }
  });
  const logBtn = $q('#rtlog');
  if (logBtn) logBtn.addEventListener('click', () => { routineFinish(L, 'log'); render(); });
  if (mine() && RT.running) startTick();
  paint();
  return { destroy() { routineMetStop(); } };
}
