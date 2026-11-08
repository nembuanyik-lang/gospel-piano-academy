'use strict';
/* Learn from a recording: pick any audio file (a song from the internet, a tape from church), the app finds the chords,
   and you can play it slowly, loop a hard part, and see the chord that is coming. The file stays on your computer;
   only the chords you checked are remembered (open the same file again and they are back). */
const LEARN_MAX_MB = 25, LEARN_KEEP = 12, LEARN_SPEEDS = [50, 70, 85, 100];
const learnMem = { audio: null, url: null, file: null, ch: null, seg: [], raf: 0, loopA: null, loopB: null };   // not saved: the file itself and its working data
const learnUi = () => ui.learn || (ui.learn = { id: null, name: '', size: 0, seconds: 0, key: null, simple: true, segs: [], up: 0, speed: 100, sel: -1, busy: '', needFile: false });
const learnFlats = L => ChordFinder.flatsFor(L.key || { r: 0, minor: false });
const learnName = (g, L) => ChordFinder.chordName(g.r, g.q, learnFlats(L), L.up);
const learnId = f => f.name + '|' + f.size;
const learnClock = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

function learnStopAudio() {
  if (learnMem.raf) { cancelAnimationFrame(learnMem.raf); learnMem.raf = 0; }
  if (learnMem.audio) { try { learnMem.audio.pause(); } catch (e) { /* ignore */ } }
}
function learnRelease() {
  learnStopAudio();
  if (learnMem.audio) { learnMem.audio.removeAttribute('src'); try { learnMem.audio.load(); } catch (e) { /* ignore */ } learnMem.audio = null; }
  if (learnMem.url) { URL.revokeObjectURL(learnMem.url); learnMem.url = null; }
  learnMem.file = null; learnMem.ch = null; learnMem.loopA = learnMem.loopB = null;
}
function learnSave(L) {
  if (!L.id || !L.segs.length) return;
  S.learn = (S.learn || []).filter(x => x.fid !== L.id);
  S.learn.unshift({ fid: L.id, name: L.name, size: L.size, seconds: Math.round(L.seconds), key: L.key, simple: !!L.simple, segs: L.segs.map(g => [g.t, g.dur, g.r, g.q]), at: Date.now() });
  S.learn.length = Math.min(S.learn.length, LEARN_KEEP);
  touch();
}
const learnFromSaved = x => ({ id: x.fid, name: x.name, size: x.size, seconds: x.seconds, key: x.key, simple: x.simple !== false, segs: x.segs.map(a => ({ t: a[0], dur: a[1], r: a[2], q: a[3] })) });

/* read the file at a low sample rate (the chords do not need more) and mix it down to one channel */
async function learnDecode(file) {
  const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!Off) throw new Error('this computer cannot read audio files here');
  const sr = 11025, c = new Off(1, sr, sr);
  const buf = await c.decodeAudioData(await file.arrayBuffer());
  const n = buf.length, x = new Float32Array(n), chn = buf.numberOfChannels;
  for (let k = 0; k < chn; k++) { const d = buf.getChannelData(k); for (let i = 0; i < n; i++) x[i] += d[i] / chn; }
  return { x, sr: buf.sampleRate };
}
const tick = () => new Promise(r => setTimeout(r, 0));

async function learnOpenFile(file) {
  const L = learnUi();
  if (!file) return;
  if (file.size > LEARN_MAX_MB * 1048576) { toast('That file is larger than ' + LEARN_MAX_MB + ' MB. Cut it shorter (for example to one song) and try again.', 'warn'); return; }
  learnRelease(); L.busy = 'Reading ' + file.name + '…'; L.sel = -1; L.up = 0; L.speed = 100; L.needFile = false; render(); await tick();
  try {
    const id = learnId(file), saved = (S.learn || []).find(x => x.fid === id);
    const { x, sr } = await learnDecode(file);
    L.busy = 'Listening for the chords…'; render(); await tick();
    const ch = ChordFinder.chroma(x, sr);
    learnMem.ch = ch; learnMem.file = file; learnMem.url = URL.createObjectURL(file);
    Object.assign(L, { id, name: file.name, size: file.size, seconds: x.length / sr });
    if (saved) { Object.assign(L, learnFromSaved(saved)); toast('Found your earlier chords for this file.'); }
    else { L.segs = ChordFinder.detect(ch, { simple: L.simple }); L.key = ChordFinder.estimateKey(ch, L.segs); learnSave(L); }
    if (!L.segs.length) toast('No clear chords were heard in this file.', 'warn');
  } catch (e) { L.id = null; L.segs = []; toast('That file could not be read: ' + (e && e.message ? e.message : 'unknown audio type') + '.', 'warn'); }
  L.busy = ''; render();
}
function learnRedetect() {
  const L = learnUi(); if (!learnMem.ch) { toast('Choose the file again first.'); return; }
  L.segs = ChordFinder.detect(learnMem.ch, { simple: L.simple }); L.sel = -1; learnSave(L);
}

function learnHtml() {
  const L = learnUi(), have = L.segs.length > 0, A = learnMem.audio;
  const list = (S.learn || []).filter(x => x.fid !== L.id);
  const up = L.up || 0;
  const strip = have ? '<ol class="learnlist" id="learnlist">' + L.segs.map((g, i) => '<li><button type="button" class="learnrow' + (i === L.sel ? ' sel' : '') + '" data-act="learnseg" data-i="' + i + '" id="lseg' + i + '"><span class="mono tiny">' + learnClock(g.t) + '</span><b>' + esc(fmt(learnName(g, L))) + '</b></button></li>').join('') + '</ol>' : '';
  const sel = L.segs[L.sel];
  const edit = sel ? '<div class="callout"><p><strong>Fix this chord</strong> (' + learnClock(sel.t) + ')</p><div class="row wrap"><label class="field"><span>Chord</span>' + selectHtml('learnroot', ChordFinder.FLAT.map((_, r) => [String(r), fmt(ChordFinder.rootName(r + up, learnFlats(L)))]), String(sel.r), 'learnroot') + '</label><label class="field"><span>Type</span>' + selectHtml('learnq', ChordFinder.TYPES.map(t => [t.q || 'major', t.q === '' ? 'major' : t.q === 'm' ? 'minor' : t.q]), sel.q || 'major', 'learnq') + '</label><button class="btn ghost sm" type="button" data-act="learnmerge">Join with the chord before</button></div></div>' : '';
  return '<div class="screen"><div class="pagehead"><button class="btn ghost sm" type="button" data-act="go" data-to="song">' + icon('back') + 'Song Lab</button><h1>Learn from a recording</h1>' +
    '<p class="muted">Choose a song or a tape from your computer. The app listens, shows the chords, and lets you play it slowly and repeat a hard part. The file stays on your computer.</p></div>' +
    '<section class="card"><label class="field"><span>Choose an audio file (MP3, WAV, M4A…)</span><input type="file" id="learnfile" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" data-bind="learnfile"></label>' +
    (L.busy ? '<p class="callout" role="status" aria-live="polite">' + esc(L.busy) + ' This takes a few seconds.</p>' : '') +
    (list.length ? '<p class="tiny muted">Chords kept for: ' + list.map(x => esc(x.name)).join(', ') + '. Choose the same file again to bring them back.</p>' : '') + '</section>' +
    (have ? '<section class="card learnplayer"><p class="eyebrow">' + esc(L.name) + ' · ' + learnClock(L.seconds) + '</p><h3>Looks like ' + esc(fmt(ChordFinder.keyName(L.key, learnFlats(L)))) + '</h3>' +
      (learnMem.file ? '<div class="stage-chords learnnow"><span class="stage-now" id="lnow"></span><span class="stage-next" id="lnext"></span></div>' +
        '<div class="row wrap"><button class="btn primary" type="button" id="learnplay">' + icon('play') + 'Play</button><button class="btn ghost sm" type="button" data-act="learnback">Back 5 s</button><button class="btn ghost sm" type="button" data-act="learnfwd">Forward 5 s</button></div>' +
        '<div class="row wrap tl-tools"><span class="tiny">Speed</span>' + LEARN_SPEEDS.map(v => '<button type="button" class="btn sm ' + (L.speed === v ? 'primary' : 'ghost') + '" data-act="learnspeed" data-v="' + v + '">' + v + '%</button>').join('') + '</div>' +
        '<div class="row wrap tl-tools"><button class="btn ghost sm" type="button" data-act="learnA">Repeat from here</button><button class="btn ghost sm" type="button" data-act="learnB">to here</button><button class="btn ghost sm" type="button" data-act="learnclear">Stop repeating</button><span class="tiny" id="learnloop">' + (learnMem.loopA !== null ? 'Repeating ' + learnClock(learnMem.loopA) + (learnMem.loopB !== null ? ' to ' + learnClock(learnMem.loopB) : ' (choose where it ends)') : '') + '</span></div>'
        : '<p class="callout">To play it, choose the same file again above. Your chords are kept.</p>') +
      '<div class="grid2"><label class="field"><span>Show the chords in the key of</span>' + selectHtml('learnup', Array.from({ length: 13 }, (_, i) => i - 6).map(v => [String(v), v === 0 ? 'the recording\'s key' : (v > 0 ? 'up ' : 'down ') + Math.abs(v) + (Math.abs(v) === 1 ? ' step' : ' steps')]), String(up), 'learnup') + '</label>' +
      '<label class="switch"><input type="checkbox" data-bind="learnsimple"' + (L.simple ? '' : ' checked') + (learnMem.ch ? '' : ' disabled') + '><span>Look for 7th chords too (less sure)</span></label></div>' +
      '<p class="tiny muted">These chords are a good guide, not a perfect answer. They are best on clear piano or guitar. Tap a chord to fix it.</p></section>' +
      '<section class="card"><div class="split"><h3>The chords</h3><button class="btn ghost sm" type="button" data-act="learncopy">Copy as text</button></div>' + strip + edit + '</section>' : '') + '</div>';
}

function viewLearn() {
  const html = learnHtml();
  return { html, mount(root) { return mountLearn(root); } };
}

function mountLearn(root) {
  const L = learnUi(), cl = [];
  const nowEl = root.querySelector('#lnow'), nextEl = root.querySelector('#lnext'), playBtn = root.querySelector('#learnplay');
  const A = learnMem.audio || (learnMem.file && learnMem.url ? (learnMem.audio = Object.assign(new Audio(learnMem.url), { preload: 'auto' })) : null);
  if (A) { A.preservesPitch = true; A.playbackRate = L.speed / 100; }
  const idxAt = t => { let k = 0; L.segs.forEach((g, i) => { if (t >= g.t - 0.05) k = i; }); return k; };
  let lastIdx = -2;
  const paint = () => {
    if (!A) return;
    const t = A.currentTime, i = idxAt(t);
    if (learnMem.loopA !== null && learnMem.loopB !== null && learnMem.loopB > learnMem.loopA && t >= learnMem.loopB) A.currentTime = learnMem.loopA;
    if (i !== lastIdx) {
      lastIdx = i;
      if (nowEl) nowEl.textContent = L.segs[i] ? fmt(learnName(L.segs[i], L)) : '';
      if (nextEl) nextEl.textContent = L.segs[i + 1] ? 'Next: ' + fmt(learnName(L.segs[i + 1], L)) : '';
      root.querySelectorAll('.learnrow.now').forEach(e => e.classList.remove('now'));
      const row = root.querySelector('#lseg' + i); if (row) { row.classList.add('now'); if (!A.paused) { const box = row.closest('.learnlist'); if (box && box.scrollHeight > box.clientHeight) box.scrollTop = Math.max(0, row.offsetTop - box.clientHeight / 3); } }
    }
    if (playBtn) { const h = (A.paused ? icon('play') + 'Play' : icon('stop') + 'Pause') + ' <span class="tiny mono">' + learnClock(t) + '</span>'; if (h !== playBtn._h) { playBtn._h = h; playBtn.innerHTML = h; } }
  };
  const loop = () => { paint(); learnMem.raf = requestAnimationFrame(loop); };
  if (A) { loop(); A.onended = () => { paint(); }; }
  if (playBtn) playBtn.addEventListener('click', () => { if (A.paused) { Snd.stopAll(); A.play().catch(() => toast('The recording could not be played.', 'warn')); } else A.pause(); paint(); });
  cl.push(() => { if (learnMem.raf) { cancelAnimationFrame(learnMem.raf); learnMem.raf = 0; } setTimeout(() => { if (!route || route.name !== 'learn') learnRelease(); }, 0); });   // a redraw keeps playing; leaving the page lets go of the file
  return () => cl.forEach(f => f());
}

Object.assign(PROJECT_ACTIONS, {
  learnseg: el => { const L = learnUi(), i = +el.dataset.i, g = L.segs[i]; if (!g) return; L.sel = i; if (learnMem.audio) learnMem.audio.currentTime = g.t; render(); },
  learnback: () => { if (learnMem.audio) learnMem.audio.currentTime = Math.max(0, learnMem.audio.currentTime - 5); },
  learnfwd: () => { if (learnMem.audio) learnMem.audio.currentTime = Math.min(learnMem.audio.duration || 1e9, learnMem.audio.currentTime + 5); },
  learnspeed: el => { const L = learnUi(), v = +el.dataset.v; if (!LEARN_SPEEDS.includes(v)) return; L.speed = v; if (learnMem.audio) learnMem.audio.playbackRate = v / 100; render(); },
  learnA: () => { if (!learnMem.audio) return; learnMem.loopA = Math.round(learnMem.audio.currentTime * 10) / 10; learnMem.loopB = null; render(); },
  learnB: () => { if (!learnMem.audio || learnMem.loopA === null) { toast('First press "Repeat from here" where the part starts.'); return; } const t = Math.round(learnMem.audio.currentTime * 10) / 10; if (t <= learnMem.loopA + 0.5) { toast('Play on a little further, then press "to here".'); return; } learnMem.loopB = t; render(); },
  learnclear: () => { learnMem.loopA = learnMem.loopB = null; render(); },
  learnmerge: () => {
    const L = learnUi(), i = L.sel; if (i < 1 || !L.segs[i]) return;
    L.segs[i - 1].dur = Math.round((L.segs[i - 1].dur + L.segs[i].dur) * 100) / 100; L.segs.splice(i, 1); L.sel = i - 1; learnSave(L); render();
  },
  learncopy: () => {
    const L = learnUi(); if (!L.segs.length) return;
    const txt = L.name + '\nKey: ' + ChordFinder.keyName(L.key, learnFlats(L)) + '\n\n' + L.segs.map(g => learnClock(g.t) + '  ' + learnName(g, L)).join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('The chords are copied.'), () => toast('Your browser did not allow copying.', 'warn'));
  }
});
Object.assign(PROJECT_BINDS, {
  learnfile: el => { const f = el.files && el.files[0]; el.value = ''; learnOpenFile(f); },
  learnup: el => { const L = learnUi(); L.up = Math.max(-6, Math.min(6, parseInt(el.value, 10) || 0)); render(); },
  learnsimple: el => { const L = learnUi(); L.simple = !el.checked; learnRedetect(); render(); },
  learnroot: el => { const L = learnUi(), g = L.segs[L.sel]; if (!g) return; g.r = (((parseInt(el.value, 10) || 0) % 12) + 12) % 12; learnSave(L); render(); },
  learnq: el => { const L = learnUi(), g = L.segs[L.sel]; if (!g) return; const q = el.value === 'major' ? '' : el.value; if (!ChordFinder.TYPES.some(t => t.q === q)) return; g.q = q; learnSave(L); render(); }
});
