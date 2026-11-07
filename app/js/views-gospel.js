'use strict';
/* ---------------------------------------------------------------- Practice: gospel ear training and the licks library */
const gearState = () => (S.gear = S.gear || { level: 1, total: 0, correct: 0, best: 1, hist: [], last: '' });
const lickState = id => { S.licks = S.licks || {}; return S.licks[id] || (S.licks[id] = { bpm: 0, keys: [], best: 0, n: 0 }); };
const lickDone = (L, st) => st.keys.length >= 12 && st.bpm >= L.bpm;

/* the Practice tab */
function gospelPanel() {
  const g = gearState(), acc = g.total ? Math.round(g.correct / g.total * 100) : null;
  const done = Gospel.LICKS.filter(L => S.licks && S.licks[L.id] && lickDone(L, S.licks[L.id])).length, started = Gospel.LICKS.filter(L => S.licks && S.licks[L.id] && S.licks[L.id].n).length;
  return '<section class="card"><p class="eyebrow">Gospel ear training</p><div class="split"><div><h3>Name the progression by number</h3><p class="muted">The app sets the key with a short cadence, then plays a real gospel progression in a random key. You name it in numbers: 1 – 4 – 5, 2m7 – 5⁷ – 1, 4 – 4m – 1… This is how gospel musicians learn to hear a song once and play it.</p>' +
    '<p class="tiny">Level ' + g.level + ' of ' + (Gospel.PROGS.length - 1) + ': ' + esc(Gospel.PROGS[g.level].label.replace(/^Level \d: /, '')) + (acc !== null ? ' · ' + acc + '% of ' + g.total : '') + '</p></div><button class="btn primary" type="button" data-act="pview" data-view="gear">Start</button></div></section>' +
    '<section class="card"><p class="eyebrow">Licks and runs</p><div class="split"><div><h3>The gospel vocabulary, in every key</h3><p class="muted">Turnarounds, walk-ups, fills, church endings and vocal runs. Hear each one, see it on the keys, then play or sing it back: the app listens, raises the tempo as you get it, and moves you round all twelve keys.</p>' +
    '<p class="tiny">' + Gospel.LICKS.length + ' licks and runs · ' + started + ' started · ' + done + ' mastered in all 12 keys</p></div><button class="btn primary" type="button" data-act="pview" data-view="licks">Open</button></div></section>';
}

/* ---- gospel ear training ---- */
function viewGospelEar(back) {
  return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>Gospel ear training</h1><p class="muted">Listen to the cadence (it tells you where home is), then the progression. Name it by number. Wrong answers show you the chords so your ear learns them.</p></div>' +
    howTo('gear', 'How to practise', ['Press Play. You hear 1 – 4 – 5 – 1 to set the key, a short gap, then the progression.', 'Hum the key note (1) and follow the bass: does it rise, fall, or stay while the chord changes?', 'Listen for colour: a 7th chord pulls to the next chord; a minor four sounds like a sigh; a diminished chord creeps up.', 'Eight right out of the last ten moves you up a level; too many wrong moves you back.']) +
    '<div class="card"><div id="gear"></div></div></div>', mount(root) { return mountGospelEar($('#gear', root)); } };
}
function mountGospelEar(host) {
  const g = gearState();
  let q = null, answered = false, playing = null;
  const play = (only) => {
    if (!q) return;
    if (playing) { try { playing.stop(); } catch (e) { /* ignore */ } }
    const ev = only ? q.events.filter(e => e.t >= q.start).map(e => Object.assign({}, e, { t: e.t - q.start })) : q.events;
    playing = Snd.play({ events: ev, bpm: 84, total: ev.reduce((a, e) => Math.max(a, e.t + e.d), 0) }, { inst: 'piano' });
  };
  function next() {
    q = Gospel.earQuestion(g.level); answered = false; host.dataset.answer = q.answer;
    host.innerHTML = '<p class="tiny">Level ' + g.level + ': ' + esc(Gospel.PROGS[g.level].label.replace(/^Level \d: /, '')) + '. ' + esc(Gospel.PROGS[g.level].hint) + '</p>' +
      '<div class="row wrap"><button class="btn primary" type="button" data-g="play">' + icon('play') + 'Play</button><button class="btn ghost" type="button" data-g="only">Only the progression</button></div>' +
      '<div class="options" role="group" aria-label="Which progression?">' + q.options.map((o, i) => '<button type="button" class="btn opt mono" data-g="ans" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div><div id="gfb" aria-live="polite"></div>';
    setTimeout(() => play(false), 250);
  }
  function answer(i) {
    if (answered) return; answered = true;
    const ok = i === q.answer;
    g.total++; if (ok) g.correct++; g.hist = (g.hist || []).concat([ok ? 1 : 0]).slice(-20);
    const lv = Gospel.nextLevel(g), moved = lv !== g.level;
    if (moved) { g.level = lv; g.hist = []; g.best = Math.max(g.best || 1, lv); }
    const today = E.dateStr(); if (g.last !== today && typeof award === 'function') { g.last = today; award(10, 'gospel ear training'); }
    touch();
    host.querySelectorAll('[data-g=ans]').forEach((b, k) => { b.disabled = true; b.classList.toggle('ok', k === q.answer); b.classList.toggle('bad', k === i && !ok); });
    $('#gfb', host).innerHTML = '<div class="callout ' + (ok ? 'ok' : '') + '"><p><b>' + (ok ? 'Yes!' : 'It was ' + esc(q.name) + '.') + '</b> ' + esc(q.why[0].toUpperCase() + q.why.slice(1)) + '. In ' + esc(fmt(q.key)) + ': <span class="mono">' + esc(q.names.join(' – ')) + '</span>.</p>' +
      (moved ? '<p><b>' + (lv > (g.best && lv) - 1 && ok ? 'Level up!' : 'New level:') + '</b> level ' + lv + ', ' + esc(Gospel.PROGS[lv].label.replace(/^Level \d: /, '')) + '.</p>' : '') +
      '<div class="row wrap"><button class="btn ghost" type="button" data-g="only">' + icon('play') + 'Hear it again</button><button class="btn primary" type="button" data-g="next">Next</button></div></div>';
  }
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    const k = b.dataset.g;
    if (k === 'play') play(false); else if (k === 'only') play(true); else if (k === 'ans') answer(+b.dataset.i); else if (k === 'next') next();
  });
  next();
  return () => { if (playing) { try { playing.stop(); } catch (e) { /* ignore */ } } };
}

/* ---- the licks library ---- */
function viewLicks(back) {
  const cat = ui.lickCat || 'all';
  const list = Gospel.LICKS.filter(L => cat === 'all' || L.cat === cat);
  const row = L => {
    const st = S.licks && S.licks[L.id], keys = st ? st.keys.length : 0, ok = st && lickDone(L, st);
    return '<li><button type="button" class="lessonrow" data-act="pview" data-view="lick" data-id="' + L.id + '"><span><b>' + esc(L.name) + '</b><span class="tiny"> · ' + esc(L.cat) + ' · level ' + L.level + (L.voice ? ' · sung' : '') + '</span></span>' +
      '<span class="tiny">' + (ok ? '<span class="tag ok">Mastered</span>' : st && st.n ? keys + ' of 12 keys · ' + st.bpm + ' of ' + L.bpm + ' BPM' : 'New') + '</span></button></li>';
  };
  return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>Licks and runs</h1><p class="muted">The things gospel players and singers reach for: learn each one by ear and by hand, then in all twelve keys.</p></div>' +
    '<div class="seg" role="tablist" aria-label="Kinds">' + [['all', 'All']].concat(Gospel.CATS.map(c => [c, c])).map(([k, l]) => '<button type="button" role="tab" class="' + (cat === k ? 'on' : '') + '" aria-selected="' + (cat === k) + '" data-act="lickcat" data-c="' + esc(k) + '">' + esc(l) + '</button>').join('') + '</div>' +
    '<section class="card"><ul class="lessons">' + list.map(row).join('') + '</ul></section></div>' };
}
function viewLick(back, id) {
  const L = Gospel.LICKS.find(x => x.id === id); if (!L) return viewLicks(back);
  const st = lickState(L.id); if (!st.bpm) st.bpm = Math.max(50, Math.round(L.bpm * 0.6));
  const key = ui.lickKey && ui.lickKey[id] || Gospel.DRILL_KEYS.find(k => !st.keys.includes(k)) || 'C';
  const back2 = '<button class="btn ghost sm" type="button" data-act="pview" data-view="licks">' + icon('back') + 'Licks and runs</button>';
  return { html: '<div class="screen"><div class="pagehead">' + back2 + '<h1>' + esc(L.name) + '</h1><p class="muted">' + esc(L.cat) + ' · level ' + L.level + (L.voice ? ' · a vocal run' : L.hands === 'right' ? ' · right hand' : ' · both hands') + '</p></div>' +
    '<section class="card"><p>' + esc(L.tip) + '</p>' +
    '<div class="grid3"><label class="field"><span>Key</span><select data-bind="lickkey" data-id="' + L.id + '">' + Gospel.DRILL_KEYS.map(k => '<option value="' + k + '"' + (k === key ? ' selected' : '') + '>' + esc(fmt(k)) + (st.keys.includes(k) ? ' ✓' : '') + '</option>').join('') + '</select></label>' +
    '<label class="field"><span>Tempo <b class="mono" id="lkbpm">' + st.bpm + '</b> BPM (goal ' + L.bpm + ')</span><input type="range" min="40" max="' + Math.round(L.bpm * 1.3) + '" value="' + st.bpm + '" data-bind="lickbpm" data-id="' + L.id + '"></label>' +
    (L.voice ? '<label class="switch"><input type="checkbox" data-bind="licklow"' + (S.prefs.lickLow ? ' checked' : '') + '><span>Sing it an octave lower (men\'s voice)</span></label>' : '<div></div>') + '</div>' +
    '<div id="lkpiano"></div>' +
    '<div class="row wrap"><button class="btn primary" type="button" data-lk="hear">' + icon('play') + 'Hear it</button><button class="btn ghost" type="button" data-lk="loop">Loop it</button>' +
    '<button class="btn primary" type="button" data-lk="turn">' + (L.voice ? icon('mic') + 'Sing it back' : icon('piano') + 'Your turn: play it back') + '</button>' +
    (L.voice ? '' : '<button class="btn ghost" type="button" data-lk="self">I played it cleanly</button>') + '</div>' +
    '<p class="tiny" id="lkinfo" aria-live="polite">' + (L.voice ? 'Hear it, then press Sing it back: after the count-in, sing it (on "oh" or a word). The app listens and checks each note.' : 'Hear it, then press Your turn: after the count-in, play it on your keyboard (or the keys above). The app listens and checks each note. No MIDI keyboard? Play along and press I played it cleanly.') + '</p>' +
    '<p class="tiny">Keys done: ' + (st.keys.length ? st.keys.map(k => esc(fmt(k))).join(', ') : 'none yet') + ' · ' + st.keys.length + ' of 12.' + (lickDone(L, st) ? ' <span class="tag ok">Mastered</span>' : '') + '</p></section></div>',
  mount(root) { return mountLick(root, L, key); } };
}
function mountLick(root, L, key) {
  const st = lickState(L.id), info = $('#lkinfo', root), low = !!(L.voice && S.prefs.lickLow);
  const ev = () => Gospel.lickEvents(L, key, { low });
  const all = ev().reduce((a, e) => a.concat(e.notes), []), lo = Math.max(36, Math.min(...all) - 2), hi = Math.min(96, Math.max(...all) + 2);
  const piano = Piano($('#lkpiano', root), { lo: Math.min(lo, 48), hi: Math.max(hi, 84), minKey: 24, names: S.prefs.names, height: 120 });
  let handle = null, timers = [], listening = null, trk = null;
  const clearT = () => { timers.forEach(clearTimeout); timers = []; piano.markAll(false); };
  const stop = () => { clearT(); if (handle) { try { handle.stop(); } catch (e) { /* ignore */ } handle = null; } if (listening) { listening(); listening = null; } if (trk) { try { trk.stop(); } catch (e) { /* ignore */ } trk = null; } };
  const len = Gospel.lickLength(L);
  function hear(loop) {
    stop();
    const spb = 60 / st.bpm;
    handle = Snd.play({ events: ev(), bpm: st.bpm, total: len + 0.5 }, { loop: !!loop, inst: L.voice ? 'choir' : 'piano', onStart: () => {
      const pass = () => ev().forEach(e => { timers.push(setTimeout(() => e.notes.forEach(m => piano.mark(m, true)), e.t * spb * 1000 + 50)); timers.push(setTimeout(() => e.notes.forEach(m => piano.mark(m, false)), (e.t + e.d) * spb * 1000)); });
      pass(); if (loop) { const per = (len + 0.5) * spb * 1000; for (let k = 1; k < 30; k++) timers.push(setTimeout(pass, per * k)); }
    } });
  }
  function result(score) {
    const pct = Math.round(score * 100), ok = score >= 0.85;
    st.n++; st.best = Math.max(st.best || 0, pct);
    let msg;
    if (ok) {
      if (!st.keys.includes(key) && st.bpm >= Math.round(L.bpm * 0.8)) st.keys.push(key);
      const before = st.bpm; st.bpm = Math.min(Math.round(L.bpm * 1.15), st.bpm + 4);
      msg = pct + '% right. Clean! Tempo up to ' + st.bpm + ' BPM' + (st.bpm === before ? ' (the top)' : '') + '.' + (st.keys.includes(key) ? ' ' + fmt(key) + ' is done; try the next key round the circle.' : ' Reach ' + Math.round(L.bpm * 0.8) + ' BPM to tick this key.');
    } else msg = pct + '% right. Listen again (Loop it helps), then try at this tempo. Accuracy first, speed later.';
    if (typeof award === 'function' && ok) award(5, 'lick');
    touch();
    info.innerHTML = '<b>' + (ok ? 'Good.' : 'Again.') + '</b> ' + esc(msg) + (ok && lickDone(L, st) ? ' <b>Mastered in all 12 keys.</b>' : '');
    const t = $('#lkbpm', root); if (t) t.textContent = st.bpm;
  }
  function turn() {
    stop();
    const spb = 60 / st.bpm, want = Gospel.expected(L, key, { low }).map(x => x.m), clicks = [];
    for (let b = 0; b < 4; b++) clicks.push({ t: b, d: 0.2, click: b === 0 ? 2 : 1 });
    const windowBeats = 4 + len + 1.5;
    if (L.voice) {
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { info.textContent = 'The microphone is not available on this device.'; return; }
      let start = null; const frames = [];
      trk = Pitch.track(f => { if (start === null) return; const beat = (f.t - 0.023 - micLat() - start) / spb; if (beat >= -0.3 && beat < len + 1.5) frames.push({ t: beat, midi: f.midi, level: f.level }); }, { deviceId: S.prefs.micId || null, onError: () => { stop(); info.textContent = 'The microphone could not be opened. ' + MIC_HELP; } });
      info.textContent = 'Count-in… then sing.';
      handle = Snd.play({ events: clicks, bpm: st.bpm, total: windowBeats }, { onStart: t => { start = t + 4 * spb; }, onEnd: () => {
        const tr = trk; trk = null; if (tr) tr.stop();
        const sung = Songcraft.framesToNotes(frames, { total: len + 1.5, grid: 0.25, minBeats: 0.12, frameBeats: 0.025 / spb }).map(n => n.m);
        if (!sung.length) { info.textContent = 'No clear notes were heard. Sing closer to the microphone and a little louder.'; return; }
        result(Gospel.matchScore(sung, want, { octaveFree: true }).score);
      } });
      return;
    }
    const played = []; let open = false;
    info.textContent = 'Count-in… then play.';
    handle = Snd.play({ events: clicks, bpm: st.bpm, total: windowBeats }, { onStart: () => { timers.push(setTimeout(() => { open = true; info.textContent = 'Play now…'; }, 3.5 * spb * 1000)); }, onEnd: () => {
      open = false; if (listening) { listening(); listening = null; }
      if (!played.length) { info.textContent = 'Nothing was played. Play on your keyboard or the keys above after the count-in.'; return; }
      // chords played together: within 60 ms count as one moment, lowest note first
      const sorted = played.sort((a, b) => a.t - b.t), groups = []; sorted.forEach(p => { const g = groups[groups.length - 1]; if (g && p.t - g.t < 60) g.ms.push(p.m); else groups.push({ t: p.t, ms: [p.m] }); });
      result(Gospel.matchScore(groups.reduce((a, g) => a.concat(g.ms.sort((x, y) => x - y)), []), want).score);
    } });
    listening = Input.listen(e => { if (open) played.push({ m: e.midi, t: e.t }); });
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-lk]'); if (!b) return;
    const k = b.dataset.lk;
    if (k === 'hear') hear(false); else if (k === 'loop') hear(true); else if (k === 'turn') turn(); else if (k === 'self') result(1);
  });
  return () => { stop(); piano.destroy(); };
}
const GOSPEL_ACTIONS = {
  lickcat: el => { ui.lickCat = el.dataset.c; render(); }
};
const GOSPEL_BINDS = {
  lickkey: el => { ui.lickKey = Object.assign({}, ui.lickKey || {}, { [el.dataset.id]: el.value }); render(); },
  lickbpm: el => { const st = lickState(el.dataset.id); st.bpm = Math.round(+el.value); const t = $('#lkbpm'); if (t) t.textContent = st.bpm; touch(); },
  licklow: el => { S.prefs.lickLow = el.checked; touch(); render(); }
};
