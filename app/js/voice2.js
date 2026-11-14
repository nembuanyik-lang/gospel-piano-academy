'use strict';
/* ---------------------------------------------------------------- Vocal Studio, part 2: levels, checkpoints, Songbook singing, examples
   voice.js has the microphone exercises; vocalgrade.js has the marking rules (pure, tested). This file is the course around them:
   a starting test, six levels with pass marks, a recorded checkpoint for each level, teacher sign-off, singing Songbook pieces,
   and the example notes that go with the lessons. */

const VX_LEVEL_NAMES = VocalGrade.VLEVELS.map(l => l.name);
const vxLevel = n => VocalGrade.VLEVELS.find(l => l.n === n);

/* the level the singer is working on now: the first that is not done */
function vxCurrent(v) {
  const st = VocalGrade.levelStates(v), cur = st.find(x => x.state !== 'done' && x.state !== 'locked');
  return cur || null;
}
const vxHave = (v, id) => (v.best && v.best[id]) != null ? v.best[id] : null;

/* one requirement row of a level */
function vxRowHtml(r) {
  if (r.ex) {
    const x = vexById(r.ex), runnable = r.ex !== 'song';
    return '<li class="' + (r.done ? 'ok' : '') + '"><span>' + (r.done ? '✓ ' : '○ ') + esc(x ? x.title : r.ex) + ' <span class="tiny">pass mark ' + r.min + (r.have ? ' · best ' + esc(r.have) : '') + '</span></span>' +
      (runnable ? '<button class="btn soft sm" type="button" data-act="vxgo" data-tab="levels" data-run="' + esc(r.ex) + '">' + icon('play') + (r.done ? 'Again' : 'Start') + '</button>' : '<button class="btn soft sm" type="button" data-act="vxgo" data-tab="sing">Choose a piece</button>') + '</li>';
  }
  return '<li class="' + (r.done ? 'ok' : '') + '"><span>' + (r.done ? '✓ ' : '○ ') + esc(r.text) + (r.have ? ' <span class="tiny">· best ' + esc(r.have) + '</span>' : '') + '</span>' +
    (r.text === 'Find your range' ? '<button class="btn soft sm" type="button" data-act="vxgo" data-tab="levels" data-range="1" data-next="test">' + icon('mic') + (r.done ? 'Again' : 'Start') + '</button>' : /Hold one note/.test(r.text) ? '<button class="btn soft sm" type="button" data-act="vxgo" data-tab="levels" data-run="sustain">' + icon('play') + 'Start</button>' : '') + '</li>';
}
function vxLevelsHtml(v) {
  const st = VocalGrade.levelStates(v), cur = vxCurrent(v);
  const intro = !v.range ? '<section class="card"><h3>Start here</h3><p class="muted">First the app finds your range (one minute). Then a short starting test (about three minutes) decides which level to begin at. You can always do any level, and the test is only a guide.</p><button class="btn primary" type="button" data-act="vxgo" data-tab="levels" data-range="1" data-next="test">' + icon('mic') + 'Find my range and start</button></section>' :
    !v.start ? '<section class="card"><h3>Starting test</h3><p class="muted">Two short exercises, about three minutes. They show where to begin, so you do not repeat what you already do well.</p><button class="btn primary" type="button" data-act="vxgo" data-tab="levels" data-test="1">' + icon('play') + 'Take the starting test</button></section>' :
    '<section class="card"><p>You are working on <b>Level ' + (cur ? cur.n + ': ' + esc(VX_LEVEL_NAMES[cur.n - 1]) : '6 and beyond') + '</b>. ' + (cur ? 'Pass every exercise below, then record the checkpoint.' : 'All six levels are done. Keep your voice in shape with the warm-up and the Songbook.') + '</p><button class="btn ghost sm" type="button" data-act="vxgo" data-tab="levels" data-test="1">Take the starting test again</button></section>';
  return intro + st.map(s => {
    const lv = vxLevel(s.n), so = (S.signoffs || {})['vx-L' + s.n];
    const tag = s.state === 'done' ? '<span class="tag ok">Done</span>' : s.state === 'check' ? '<span class="tag">Record the checkpoint</span>' : s.state === 'locked' ? '<span class="tag">Locked: finish level ' + (s.n - 1) + '</span>' : '';
    return '<section class="card vx-level' + (s.state === 'locked' ? ' locked' : '') + '"><p class="eyebrow">Level ' + s.n + ' ' + tag + '</p><h3>' + esc(lv.name) + '</h3><p class="muted">' + esc(lv.about) + '</p>' +
      (s.state === 'locked' ? '<p class="tiny">Complete level ' + (s.n - 1) + ' (or take the starting test) to open this one. You can still try its exercises from the Exercises tab.</p>' :
        '<ul class="vx-reqs">' + s.progress.rows.map(vxRowHtml).join('') + '</ul>' +
        (s.progress.passed ? '<div class="row wrap"><button class="btn ' + (s.recorded ? 'ghost' : 'primary') + '" type="button" data-act="vxgo" data-tab="levels" data-check="' + s.n + '">' + icon('mic') + (s.recorded ? 'Open the checkpoint' : 'Record the checkpoint') + '</button>' + (so ? '<span class="tiny">Signed off by ' + esc(so.by) + '</span>' : s.recorded ? '<span class="tiny">Ask your teacher to sign it off.</span>' : '') + '</div>' : '<p class="tiny">Checkpoint: ' + esc(lv.check) + ' It opens when the exercises are passed.</p>')) + '</section>';
  }).join('');
}

/* the checkpoint page: what to sing, the recorder, then the teacher's sign-off */
function vxSignoffHtml(n) {
  const so = (S.signoffs || {})['vx-L' + n];
  if (so) return '<div class="callout signoff"><p><b>Signed off by ' + esc(so.by) + '</b> on ' + esc(new Date(so.at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })) + '.</p>' + (so.note ? '<p class="muted">“' + esc(so.note) + '”</p>' : '') + '</div>';
  return '<div class="callout signoff"><p><b>Teacher sign-off</b></p><p class="muted">For your teacher, pastor or music director: listen to the recording, then sign it off. The app can judge pitch, timing and volume; only a listener can judge tone, feeling and ministry. Your name and note appear on the learner\'s progress report.</p>' +
    '<label class="field"><span>Your name</span><input type="text" id="so-by" maxlength="60" autocomplete="off"></label>' +
    '<label class="field"><span>A note for the singer (optional)</span><textarea id="so-note" maxlength="500" rows="3"></textarea></label>' +
    '<button class="btn primary" type="button" data-act="vxsignoff" data-n="' + n + '">Sign off this checkpoint</button></div>';
}
function vxCheckHtml(n, v) {
  const lv = vxLevel(n); if (!lv) return '<section class="card"><p>That level does not exist.</p></section>';
  const pr = VocalGrade.levelProgress(v, lv), rec = !!(v.check && v.check['L' + n]);
  return '<section class="card"><p class="eyebrow">Checkpoint · Level ' + n + ': ' + esc(lv.name) + '</p><h3>Record yourself</h3>' +
    (pr.passed ? '<p>' + esc(lv.check) + '</p><p class="muted">Sing it, stop, listen back, then press Save the recording. Saving marks the checkpoint as done. Send the file to your teacher, or play it for them.</p><div id="vxrec"></div>' +
      (rec ? '<p class="tag ok">Recorded on ' + esc(v.check['L' + n].at) + '</p>' : '')
      : '<p class="muted">Pass these first: ' + pr.rows.filter(r => !r.done).map(r => r.ex ? (vexById(r.ex) || {}).title : r.text).join(', ') + '.</p>') + '</section>' +
    (pr.passed && rec ? '<section class="card">' + vxSignoffHtml(n) + '</section>' : '');
}

/* the starting test: a few matched notes and one five-note scale; where to begin follows from the marks */
function runStartTest(host, onDone) {
  let cur = null, stopped = false; const scores = [];
  const step = (id, o) => {
    host.innerHTML = '';
    cur = runVoiceEx(host, vexById(id), Object.assign({ skipIntro: o.first ? false : true, onDone: sum => {
      voxSave(sum); scores.push(sum.score);
      if (stopped) return;
      if (o.next) setTimeout(() => { if (!stopped) step(o.next, { rounds: 1 }); }, 2500);
      else onDone({ scores, start: VocalGrade.placeStart(scores) });
    } }, o));
  };
  step('match', { count: 4, first: true, next: 'five' });
  return { stop() { stopped = true; if (cur) cur.stop(); } };
}

/* ---- the Songbook for singers ---- */
function vxSongsHtml(v) {
  const r = voxRange(), best = v.songs || {};
  if (!v.range) return '<section class="card"><p class="muted">Find your range first, so each piece is put in the key that fits your voice.</p><button class="btn primary" type="button" data-act="vxgo" data-tab="sing" data-range="1">' + icon('mic') + 'Find my range</button></section>';
  return '<section class="card"><p class="muted">Pick a Songbook piece. It is put in the key and octave that fit your voice. Four clicks count you in, then the backing track plays and the notes slide towards the line. You are marked on the notes and on the beat. Headphones help.</p></section>' +
    '<div class="vx-grid">' + App.SONGBOOK.map(s => {
      const k = VocalGrade.songKey(s, r), b = best[s.id];
      return '<section class="card"><p class="eyebrow">Level ' + s.level + ' · ' + s.bpm + ' beats a minute' + (b != null ? ' · best ' + b : '') + '</p><h3>' + esc(s.title) + '</h3><p class="muted">' + esc(s.about) + '</p>' +
        '<p class="tiny">Sung in ' + esc(fmt(k.key)) + (k.fits ? '' : ' · a little wider than your range') + '.</p>' +
        '<button class="btn primary sm" type="button" data-act="vxgo" data-tab="sing" data-song="' + esc(s.id) + '">' + icon('play') + 'Sing it</button></section>';
    }).join('') + '</div>';
}

/* ---- example notes for the lessons: played by the app's piano, never a human voice ---- */
function vxExamples(id) {
  const z = voxZone(), lo = z.lo, MAJ = [0, 2, 4, 5, 7, 9, 11, 12];
  const ex = {
    'v-breath': [{ label: 'Hear one long, even note', play: () => voxPlay([lo + 5], { d: 6 }) }],
    'v-pitch': [{ label: 'Hear a five-note scale', play: () => voxPlay([0, 2, 4, 5, 7].map(x => lo + x), { bpm: 70, d: 1 }) }, { label: 'Hear the half steps (mi–fa)', play: () => voxPlay([lo + 4, lo + 5, lo + 4, lo + 5], { bpm: 60, d: 1 }) }],
    'v-tone': [{ label: 'Hear the same note short, then long', play: () => voxPlay([lo + 7, lo + 7], { bpm: 60, d: 1 }) }],
    'v-registers': [{ label: 'Hear a siren: low to high', play: () => voxPlay(Array.from({ length: 13 }, (_, i) => lo + i), { bpm: 160, d: 1 }) }],
    'v-agility': [{ label: 'Hear a gospel run, slowly', play: () => voxPlay([12, 9, 7, 4, 2, 0].map(x => lo + x), { bpm: 70, d: 1 }) }, { label: 'Hear it at speed', play: () => voxPlay([12, 9, 7, 4, 2, 0].map(x => lo + x), { bpm: 190, d: 1 }) }],
    'v-harmony': [{ label: 'Hear the melody alone', play: () => voxPlay([5, 4, 3, 2, 3].map(d => lo + 4 + MAJ[d - 1]), { bpm: 70, d: 1 }) }, { label: 'Hear the harmony alone', play: () => voxPlay([5, 4, 3, 2, 3].map(d => lo + 4 + (d > 2 ? MAJ[d - 3] : MAJ[d + 4] - 12)), { bpm: 70, d: 1 }) }, { label: 'Hear them together', play: () => { const mel = [5, 4, 3, 2, 3].map(d => lo + 4 + MAJ[d - 1]), har = [5, 4, 3, 2, 3].map(d => lo + 4 + (d > 2 ? MAJ[d - 3] : MAJ[d + 4] - 12)); return Snd.play({ events: mel.map((m, i) => ({ t: i, d: 0.92, notes: [m, har[i]], vel: 0.75 })), bpm: 70, total: mel.length }, { force: true, inst: () => 'piano' }); } }],
    'v-volume': [{ label: 'Hear a note that grows', play: () => Snd.play({ events: [0, 1, 2, 3, 4].map(i => ({ t: i, d: 0.95, notes: [voxZone().lo + 5], vel: 0.25 + i * 0.17 })), bpm: 60, total: 5 }, { force: true, inst: () => 'piano' }) }, { label: 'Hear a note that fades', play: () => Snd.play({ events: [0, 1, 2, 3, 4].map(i => ({ t: i, d: 0.95, notes: [voxZone().lo + 5], vel: 0.95 - i * 0.17 })), bpm: 60, total: 5 }, { force: true, inst: () => 'piano' }) }],
    'v-rhythm': [{ label: 'Hear a rhythm phrase', play: () => { const m = voxZone().lo + 4, times = [0, 1, 2].map((b, i) => ({ s: [0, 1, 2][i] * 0.75, e: [1, 2, 4][i] * 0.75 })); return voxPlayRhythm([m, m + 2, m + 4], times, 80); } }],
    'v-lead': [{ label: 'Hear a phrase that grows (soft to loud)', play: () => Snd.play({ events: [0, 2, 4, 5, 7].map((x, i) => ({ t: i, d: 0.92, notes: [lo + x], vel: 0.3 + i * 0.15 })), bpm: 70, total: 5 }, { force: true, inst: () => 'piano' }) }]
  };
  return ex[id] || [];
}
let vxExPlayer = null;

/* ---- actions ---- */
const VOICE2_ACTIONS = {
  vxsignoff: el => {
    const n = +el.dataset.n, by = (($('#so-by') || {}).value || '').trim(), note = (($('#so-note') || {}).value || '').trim();
    if (!(n >= 1 && n <= 6)) return;
    if (!by) { toast('Please type your name to sign off.', 'warn'); return; }
    (S.signoffs || (S.signoffs = {}))['vx-L' + n] = { by: by.slice(0, 60), note: note.slice(0, 500), at: Date.now() };
    touch(); toast('Signed off. Thank you.'); render();
  },
  vxhear: el => {
    if (vxExPlayer) { try { vxExPlayer.stop(); } catch (e) { /* ignore */ } vxExPlayer = null; }
    const e = vxExamples(el.dataset.id)[+el.dataset.k]; if (e) vxExPlayer = e.play();
  }
};
