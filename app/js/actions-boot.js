'use strict';
/* ---------------------------------------------------------------- actions (click) and bindings (change/input) */
const ACTIONS = {
  skipmain: () => { const m = mainEl(); if (m) { m.focus(); m.scrollIntoView(); } },
  go: el => go(el.dataset.to),
  gopen: el => go('guitar', { lid: el.dataset.id }),
  ctab: el => { ui.courseTab = el.dataset.t; go('course'); },
  gback: () => { ui.courseTab = 'guitar'; go('course'); },
  gpick: el => { const f = GCH[el.dataset.c], ev = []; f.forEach((fr, i) => { if (fr >= 0) ev.push({ t: ev.length * 0.55, d: 1.2, notes: [GSTR[i] + fr] }); }); Snd.play({ events: ev, bpm: 100, total: ev.length * 0.55 + 1 }, { force: true, inst: 'guitar' }); },
  gearopen: () => { gEar.cur = null; go('guitar', { ear: true }); },
  gtunopen: () => go('guitar', { tuner: true }),
  gearmode: el => { gEar.mode = el.dataset.m; gEar.cur = null; render(); },
  gearplay: () => Snd.play({ events: gStrumEvents(gEar.cur, 0, 0.06, true), bpm: 80, total: 3 }, { force: true, inst: 'guitar' }),
  gearans: el => { if (gEar.ans) return; const c = gEar.cur, isMin = GEAR_MIN.indexOf(c) >= 0, o = el.dataset.o, ok = gEar.mode === 'qual' ? (o === 'Minor') === isMin : o === c, e = (gst().ear = gst().ear || { n: 0, ok: 0 }); e.n++; if (ok) e.ok++; gEar.ans = ok ? 'ok' : 'no'; touch(); render(); },
  gearnext: () => { gEar.cur = null; render(); },
  gtunstart: () => { if (gTun) { gTunStop(); $('#gtunbtn').textContent = 'Start the tuner'; return; } const msg = $('#gtunmsg'); if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = 'This device does not allow microphone access.'; return; } navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(stream => { const AC = window.AudioContext || window.webkitAudioContext, ac = new AC(), an = ac.createAnalyser(); an.fftSize = 4096; ac.createMediaStreamSource(stream).connect(an); const buf = new Float32Array(4096); gTun = { stream, ac, iv: setInterval(() => { an.getFloatTimeDomainData(buf); const hz = gPitch(buf, ac.sampleRate), nt = $('#gtunnote'), nd = $('#gtunneedle'); if (!nt || hz < 0) return; let bi = 0; GTARGET.forEach((t, i) => { if (Math.abs(Math.log2(hz / t)) < Math.abs(Math.log2(hz / GTARGET[bi]))) bi = i; }); const cents = Math.round(1200 * Math.log2(hz / GTARGET[bi])); nt.textContent = GSN[bi] + ' · ' + hz.toFixed(1) + ' Hz'; nd.style.left = (50 + Math.max(-50, Math.min(50, cents / 2))) + '%'; msg.textContent = Math.abs(cents) <= 5 ? 'In tune.' : cents < 0 ? 'Flat by ' + (-cents) + ' cents. Tune up.' : 'Sharp by ' + cents + ' cents. Tune down.'; }, 120) }; $('#gtunbtn').textContent = 'Stop the tuner'; msg.textContent = 'Listening. Pluck one string.'; }).catch(() => { msg.textContent = 'Could not open the microphone. Check Windows Settings > Privacy > Microphone.'; }); },
  gtest: el => { const i = +el.dataset.m, m = GMODS[i], pool = []; m[1].forEach(id => gFind(id).quiz.forEach(q => pool.push(q))); GTESTS['T' + i] = { id: 'T' + i, title: 'Module test: ' + m[0].replace(/^\d+\.\s*/, ''), mins: 10, why: 'Pass at 80% to finish every lesson in this module.', body: ['Ten mixed questions from every lesson in this module. Take your time.'], quiz: gShuf(pool).slice(0, 10), mod: i }; go('guitar', { lid: 'T' + i }); },
  gnotes: el => { const L = gFind(el.dataset.id), m = L.notes || GSTR; Snd.play({ events: m.map((n, i) => ({ t: i * 0.5, d: 0.9, notes: [n] })), bpm: 90, total: m.length * 0.5 + 1 }, { force: true, inst: 'guitar' }); },
  gchk: el => { const st = gst(), r = st[el.dataset.id] = st[el.dataset.id] || {}; (r.chk = r.chk || {})[el.dataset.i] = el.checked ? 1 : 0; touch(); },
  gans: el => { const L = gFind(el.dataset.id), qi = +el.dataset.qi, oi = +el.dataset.oi, qq = L.quiz[qi], box = el.closest('.gqq'), sc = gScore[L.id] = gScore[L.id] || {}; if (qi in sc) return; const ok = oi === qq.a; sc[qi] = ok ? 1 : 0; box.querySelector('.gfb').textContent = (ok ? 'Correct. ' : 'Not quite. ') + qq.why; box.querySelectorAll('button').forEach((b, k) => { b.disabled = true; if (k === qq.a) b.classList.add('primary'); }); const n = Object.keys(sc).length; if (n === L.quiz.length) { const pts = Object.values(sc).reduce((x, y) => x + y, 0), pct = Math.round(100 * pts / n), st = gst(), r = st[L.id] = st[L.id] || {}; r.best = Math.max(r.best || 0, pct); touch(); $('#gsum').textContent = 'Score: ' + pts + '/' + n + ' (' + pct + '%). ' + (pct >= 80 ? 'Passed. You can finish the lesson.' : 'Below 80%. Reread the theory, then retry.'); if (pct >= 80) { const d = $('#gdonebtn'); d.disabled = false; } else $('#gretry').hidden = false; } },
  gdone: el => { if (el.disabled) return; const st = gst(), id = el.dataset.id; if (id[0] === 'T') { let n = 0; GMODS[GTESTS[id].mod][1].forEach(lid => { const q = st[lid] = st[lid] || {}; if (!q.done) { q.done = true; n++; } }); award(20 * n, 'module test passed'); if (!n) toast('Module passed'); checkAch(); go('guitar'); return; } const r = st[id] = st[id] || {}; if (!r.done) { r.done = true; award(20, 'guitar lesson finished'); checkAch(); } go('guitar'); },
  gtick: () => { if (!gT) return; gT.n++; const c = $('.gcount'); if (c) c.textContent = gT.n; },
  gdrill: el => { const box = el.closest('.gdr'), btn = el.closest('button'), L = gFind(el.dataset.id); if (gT) { gStop(); btn.textContent = 'Start 60 seconds'; box.querySelector('[data-act=gtick]').disabled = true; return; } let left = 60; gT = { n: 0, iv: null }; box.querySelector('.gcount').textContent = '0'; box.querySelector('.gres').textContent = ''; box.querySelector('[data-act=gtick]').disabled = false; btn.textContent = 'Stop'; Snd.play({ events: Array.from({ length: 60 }, (_, i) => ({ t: i, d: 0.05, click: i % 4 === 0 ? 2 : 1 })), bpm: 60, total: 60 }, { force: true }); if (ui.gDrillMic && MicChords.supported) { let want = L.drill.a; MicChords.start(chordWatcher(() => [want], () => { if (!gT) return; gT.n++; const c = $('.gcount'); if (c) c.textContent = gT.n; want = want === L.drill.a ? L.drill.b : L.drill.a; })).catch(() => toast('The microphone could not be opened. Use the I changed button instead.', 'warn')); } gT.iv = setInterval(() => { left--; box.querySelector('.gtime').textContent = left; if (left <= 0) { const n = gT.n; gStop(); btn.textContent = 'Start 60 seconds'; box.querySelector('[data-act=gtick]').disabled = true; const r = (gst()[L.id] = gst()[L.id] || {}); r.drill = Math.max(r.drill || 0, n); touch(); box.querySelector('.gres').textContent = n + ' clean changes. ' + (n >= L.drill.target ? 'Target reached!' : 'Target is ' + L.drill.target + '. Try again tomorrow.'); box.querySelector('.gtime').textContent = '60'; } }, 1000); },
  gchord: el => { const c = el.dataset.c; Snd.play({ events: gStrumEvents(c, 0, 0.06, true), bpm: 80, total: 3 }, { force: true, inst: 'guitar' }); },
  gopenstr: () => Snd.play({ events: GSTR.map((m, i) => ({ t: i * 0.8, d: 1.2, notes: [m] })), bpm: 60, total: 7 }, { force: true, inst: 'guitar' }),
  gjam: el => { const b = el.closest('button'), wrap = b.parentNode, reset = () => wrap.querySelectorAll('button').forEach(x => { x.innerHTML = icon('play') + x.dataset.label; }); if (gJam) { gJam = null; Snd.stopAll(); reset(); return; } const L = gFind(el.dataset.id), sc = gJamScript(L.jam); sc.bpm = Math.round(L.jam.bpm * (+el.dataset.f || 1)); gJam = L.id; b.innerHTML = icon('stop') + 'Stop'; Snd.play(sc, { force: true, inst: 'guitar', loop: () => !!gJam, onEnd: () => { gJam = null; reset(); } }); },
  ptab: el => { ui.practiceTab = el.dataset.t; render(); },
  techstep: el => { ui.techStep = +el.dataset.i; render(); },
  bylisten: () => playByEar(),
  byreveal: () => revealByEar(),
  signoff: el => doSignoff(el.dataset.id),
  cclear: () => { ui.courseQ = ''; ui.courseUnfinished = false; render(); },
  pexport: () => exportProgress(),
  saveretry: () => saveNow(),
  copyerr: () => { const t = lastError ? (lastError.stack || lastError.message) : ''; try { navigator.clipboard.writeText('Gospel Music Academy\n' + navigator.userAgent + '\n' + t).then(() => toast('Details copied.'), () => toast('Could not copy.', 'warn')); } catch (e) { toast('Could not copy.', 'warn'); } },
  undoimport: () => undoImport(),
  snaprestore: el => restoreSnapshot(el.dataset.id),
  pimportpick: () => { const f = $('#pimportfile'); if (f) f.click(); },
  pimportapply: () => applyImport(),
  pimportcancel: () => { ui.importPending = null; ui.importMsg = ''; render(); },
  midiconnect: () => { Midi.connect().then(ok => { if (ok && Midi.status === 'ready') toast('MIDI keyboard connected'); }); },
  mididisc: () => Midi.disconnect(),
  lstep: el => { Snd.stopAll(); ui.lesson.step = +el.dataset.i; ui.lesson.pi = 0; render(); window.scrollTo(0, 0); },
  lprev: () => { Snd.stopAll(); ui.lesson.step = Math.max(0, ui.lesson.step - 1); ui.lesson.pi = 0; render(); window.scrollTo(0, 0); },
  lnext: () => { Snd.stopAll(); const n = lessonSteps(C.byId[ui.lesson.id]).length; ui.lesson.step = Math.min(n - 1, ui.lesson.step + 1); ui.lesson.pi = 0; render(); window.scrollTo(0, 0); },
  lpi: el => { Snd.stopAll(); ui.lesson.pi = +el.dataset.i; render(); },
  lgo: el => { Snd.stopAll(); const steps = lessonSteps(C.byId[ui.lesson.id]); ui.lesson.step = Math.max(0, steps.indexOf(el.dataset.step)); ui.lesson.pi = 0; render(); window.scrollTo(0, 0); },
  openlesson: el => openLesson(el.dataset.id),
  songpreset: el => { sl.pid = el.dataset.id; sl.key = el.dataset.key; sl.sev = el.dataset.sev === '1'; sl.degs = E.PROGRESSIONS.find(x => x.id === sl.pid).degs.slice(); sl.autoplay = false; go('song'); },
  toglevel: el => { const id = el.dataset.id; const cur = ui.courseOpen[id]; const nl = nextLesson(); const dflt = id === (nl ? C.byId[nl].level : 'G'); ui.courseOpen[id] = cur === undefined ? !dflt : !cur; render(); },
  testout: el => openTestout(el.dataset.id),
  toplay: () => { ui.testout.stage = 'play'; ui.testout.ex = 0; render(); },
  pview: el => go('practice', { view: el.dataset.view, type: el.dataset.type, kind: el.dataset.kind, sid: el.dataset.sid, proj: el.dataset.proj }),
  /* onboarding */
  obnext: () => {
    const ob = ui.onboarding;
    if (ob.step === 1) { ob.name = ($('#ob-name') || {}).value || ob.name; }
    if (ob.step === 3) { if (!ob.result) return; ob.step = 4; render(); return; }
    ob.step++; render(); window.scrollTo(0, 0);
  },
  obback: () => { const ob = ui.onboarding; if (ob.step === 1) { ob.name = ($('#ob-name') || {}).value || ob.name; } ob.step--; render(); },
  obskip: () => { S.profile.onboarded = true; touch(); ui.onboarding = null; go('home'); },
  obgoal: el => { const ob = ui.onboarding; ob.name = ($('#ob-name') || {}).value || ob.name; const g = el.dataset.g; ob.goals = ob.goals.includes(g) ? ob.goals.filter(x => x !== g) : ob.goals.concat([g]); render(); },
  obinst: el => { const ob = ui.onboarding; ob.name = ($('#ob-name') || {}).value || ob.name; ob.instrument = el.dataset.v; render(); },
  obself: el => { ui.onboarding.self[el.dataset.r] = el.dataset.v; render(); },
  obfinish: () => {
    const ob = ui.onboarding;
    if (ob.step === 1) ob.name = ($('#ob-name') || {}).value || ob.name;
    S.profile.name = (ob.name || '').trim(); S.profile.goals = ob.goals; S.profile.onboarded = true; S.profile.instrument = ob.instrument || 'piano';
    ui.courseTab = S.profile.instrument === 'guitar' ? 'guitar' : 'piano';
    S.profile.diag = { pct: ob.diag ? ob.diag.pct : 0, per: ob.diag ? ob.diag.per : {}, self: ob.self, at: Date.now() };
    if (ob.diag) { Object.keys(ob.diag.per).forEach(k => { if (ob.diag.per[k] >= 75) S.recommend[k] = true; else delete S.recommend[k]; }); S.scores.push({ kind: 'testout', id: 'placement', title: 'Placement check', pct: ob.diag.pct, at: Date.now() }); }
    touch(); ui.onboarding = null; go('home');
  },
  /* lab */
  labtab: el => { lab.tab = el.dataset.v; render(); },
  labroot: el => { lab.root = el.dataset.v; render(); labPlay('block'); },
  labq: el => { lab.quality = el.dataset.v; lab.inv = 0; render(); labPlay('block'); },
  labinv: el => { lab.inv = +el.dataset.v; render(); labPlay('block'); },
  labplay: el => labPlay(el.dataset.mode),
  sustaintoggle: () => { Snd.ensure(); Snd.pedal(!Snd.pedalSrcHas('latch'), 'latch'); },
  labclear: () => { if (lab.clear) lab.clear(); },
  sroot: el => { lab.sroot = el.dataset.v; render(); },
  stype: el => { lab.stype = el.dataset.v; render(); },
  splay: el => scalePlay(el.dataset.mode),
  /* song lab */
  slplay: () => { if (sl.toggle) sl.toggle(); },
  slgrid: el => { const r = el.dataset.r, i = +el.dataset.i, g = sl.grid; g[r][i] = g[r][i] ? 0 : 1; el.classList.toggle('on', !!g[r][i]); },
  sladd: el => { if (sl.degs.length >= 8) { toast('Eight chords is the maximum.'); return; } if (sl.pid !== 'custom') { sl.pid = 'custom'; sl.degs = []; } sl.degs.push(+el.dataset.d); render(); },
  slundo: () => { sl.pid = 'custom'; sl.degs.pop(); if (!sl.degs.length) sl.degs = [1]; render(); },
  slclear: () => { sl.pid = 'custom'; sl.degs = [1]; render(); },
  slnew: () => newProject(),
  openproj: el => go('song', { pid: el.dataset.id }),
  padd: el => { const P = curProj(); if (P.degs.length >= 4) { toast('A four-chord progression has four chords. Remove one to change it.'); return; } P.degs.push(+el.dataset.d); P.steps.prog = false; touch(); render(); },
  pundo: () => { const P = curProj(); P.degs.pop(); P.steps.prog = false; touch(); render(); },
  pmidi: () => {
    const P = curProj(); if (!P) return;
    if (!P.degs.length) { toast('Add at least one chord first.'); return; }
    const sel = $('#expmel'), r = exportMidi(P, sel ? sel.value : 'chorus');
    toast(r.L.hasMel ? 'MIDI file ready: chords, bass and melody.' : 'MIDI file ready: chords and bass. Record a melody to add it.');
  },
  pchart: () => {
    const P = curProj(); if (!P) return;
    if (!P.degs.length) { toast('Add at least one chord first.'); return; }
    exportChart(P); toast('Chord chart ready. Open it and print or save as PDF.');
  },
  pplay: () => { const P = curProj(), ps = progScript(P.key, P.degs, P.sev, P.style, P.bpm, P); Snd.play(ps.script, { force: true, inst: () => Snd.inst() }); },
  pstep: el => { const P = curProj(), k = el.dataset.k; if (P.steps[k]) return; P.steps[k] = true; award(25, 'song step'); if (Object.values(P.steps).every(Boolean) && !P.done) { P.done = true; award(100, 'song finished'); } touch(); checkAch(); render(); },
  padds: el => { const P = curProj(); if (P.structure.length >= 14) return; P.structure.push(el.dataset.s); P.steps.song = false; touch(); render(); },
  prems: el => { const P = curProj(); P.structure.splice(+el.dataset.i, 1); P.steps.song = false; touch(); render(); },
  pdel: el => { if (ui.confirmDel === el.dataset.id) { S.songs = S.songs.filter(s => s.id !== el.dataset.id); ui.confirmDel = null; touch(); go('song'); } else { ui.confirmDel = el.dataset.id; render(); } },
  /* profile */
  pgoal: el => { const g = el.dataset.g; S.profile.goals = S.profile.goals.includes(g) ? S.profile.goals.filter(x => x !== g) : S.profile.goals.concat([g]); touch(); render(); },
  pgoalmin: el => { S.prefs.dailyMin = +el.dataset.v; touch(); render(); },
  retake: () => { ui.onboarding = { step: 3, self: (S.profile.diag && S.profile.diag.self) || {}, goals: S.profile.goals.slice(), name: S.profile.name }; S.profile.onboarded = true; go('onboarding'); },
  reset: async () => {
    if ((ui.resetText || '').trim().toUpperCase() !== 'RESET') return;
    await Snap.create('before-reset');
    ui.resetText = ''; App.resetState(); ui.onboarding = null; ui.lesson = null; ui.undoImport = 0;
    saveNow(); toast('Progress erased. A snapshot was kept under Your data.'); go('onboarding');
  },
  proftab: el => go('profile', { tab: el.dataset.t }),
  pinst: el => { S.profile.instrument = el.dataset.v; ui.courseTab = el.dataset.v === 'guitar' ? 'guitar' : 'piano'; touch(); render(); },
  ptheme: el => { S.prefs.theme = el.dataset.v; touch(); applyDisplay(); render(); },
  ptext: el => { S.prefs.textSize = +el.dataset.v; touch(); applyDisplay(); render(); },
  opendata: () => { if (Desk) Desk.openDataFolder(); },
  preport: () => exportReport(),
  classpick: () => { const f = $('#classfiles'); if (f) f.click(); },
  classsave: () => exportClass(),
  classclear: () => { ui.classRows = []; render(); },
  updcheck: () => { if (Desk) Desk.checkForUpdates().then(r => { if (r && r.update) { AppInfo.update = r.update; const el = $('#updstate'); if (el) el.innerHTML = updateText(); } }); },
  wndismiss: () => { markVersionSeen(); render(); },
};
const curProj = () => S.songs.find(s => s.id === (route.params || {}).pid);
const BINDS = {
  resettext: el => { ui.resetText = el.value; const b = $('#resetbtn'); if (b) b.disabled = el.value.trim().toUpperCase() !== 'RESET'; },
  classfiles: el => { const f = el.files; readClassFiles(f); el.value = ''; },
  csearch: el => { ui.courseQ = el.value; const box = $('#cresults'); if (box) box.innerHTML = el.dataset.kind === 'guitar' ? guitarCourseBody() : pianoCourseBody(); },
  cunfin: el => { ui.courseUnfinished = el.checked; const box = $('#cresults'); if (box) box.innerHTML = ui.courseTab === 'guitar' ? guitarCourseBody() : pianoCourseBody(); },
  slkey: el => { sl.key = el.value; render(); },
  slprog: el => { sl.pid = el.value; if (el.value !== 'custom') { const p = E.PROGRESSIONS.find(x => x.id === el.value); sl.degs = p.degs.slice(); sl.sev = p.sev; } render(); },
  slstyle: el => { sl.style = el.value; render(); },
  slbeat: el => { sl.beat = el.value; render(); },
  slswing: el => { sl.swing = +el.value; },
  slbpm: el => { sl.bpm = +el.value; const v = $('#slbpmv'); if (v) v.textContent = sl.bpm; },
  slsev: el => { sl.sev = el.checked; render(); },
  pkey: el => { const P = curProj(); P.key = el.value; touch(); render(); },
  pbeat: el => { const P = curProj(); P.beat = el.value; touch(); render(); },
  pstyle: el => { const P = curProj(); P.style = el.value; touch(); render(); },
  psev: el => { const P = curProj(); P.sev = el.checked; touch(); render(); },
  ptitle: el => { const P = curProj(); P.title = el.value; touch(); },
  lchorus: el => { const P = curProj(); P.lyrics.chorus = el.value; P.steps.chorus = P.steps.chorus && el.value.trim().length > 0; touch(); },
  lverse: el => { const P = curProj(); P.lyrics.verse = el.value; touch(); },
  lbridge: el => { const P = curProj(); P.lyrics.bridge = el.value; touch(); },
  labkey: el => { lab.key = el.value; render(); },
  obname: el => { ui.onboarding.name = el.value; },
  pname: el => { S.profile.name = el.value; touch(); chrome(); },
  pimport: el => { const f = el.files && el.files[0]; el.value = ''; readBackupFile(f); },
  pnames: el => { S.prefs.names = el.checked; touch(); },
  instpick: el => { S.prefs.instrument = Snd.hasInst(el.value) ? el.value : 'piano'; touch(); Snd.releaseAll(); Snd.preview(); },
  psound: el => { S.prefs.sound = el.checked; touch(); },
  pslow: el => { S.prefs.speed = el.checked ? 'slow' : 'normal'; touch(); }
};
const LIVE = new Set(['pbpm', 'pswing', 'pguidegain', 'pguidenudge', 'resettext', 'csearch', 'slbpm', 'ptitle', 'lchorus', 'lverse', 'lbridge', 'obname', 'pname']);
/* the song project studio brings its own actions and bindings (views-project.js) */
Object.assign(ACTIONS, PROJECT_ACTIONS);
Object.assign(BINDS, PROJECT_BINDS);
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e => { const b = e.target.dataset && e.target.dataset.bind; if (b && BINDS[b] && !LIVE.has(b)) BINDS[b](e.target); else if (b && LIVE.has(b)) BINDS[b](e.target); });
document.addEventListener('input', e => { const b = e.target.dataset && e.target.dataset.bind; if (b && LIVE.has(b)) BINDS[b](e.target); });

/* ---------------------------------------------------------------- boot */
function buildChrome() {
  $('#app').innerHTML =
    '<button type="button" class="skip-link" data-act="skipmain">Skip to main content</button>' +
    '<header class="top"><div class="top-in"><button class="brand" type="button" data-act="go" data-to="home" aria-label="Gospel Music Academy, home"><svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><rect x="1" y="3" width="26" height="22" rx="5" class="bm-a"/><path d="M8 3v22M14 3v22M20 3v22" class="bm-b"/><rect x="6" y="3" width="4" height="12" rx="1" class="bm-c"/><rect x="12" y="3" width="4" height="12" rx="1" class="bm-c"/><rect x="18" y="3" width="4" height="12" rx="1" class="bm-c"/></svg><span>Gospel Music Academy</span></button>' +
    '<nav class="topnav" aria-label="Main">' + NAV.map(n => '<button type="button" data-act="go" data-to="' + n[0] + '" data-nav="' + n[0] + '">' + n[1] + '</button>').join('') + '</nav>' +
    '<div class="top-r"><button id="hxp" class="chip-xp" type="button" data-act="go" data-to="progress" aria-label="Progress"></button><button id="hav" class="avatar" type="button" data-act="go" data-to="profile" aria-label="Profile"></button></div></div></header>' +
    '<div id="savebanner" class="savebanner" role="alert" hidden></div>' +
    '<main id="main" tabindex="-1"></main>' +
    '<nav class="tabbar" aria-label="Main">' + NAV.map(n => '<button type="button" data-act="go" data-to="' + n[0] + '" data-nav="' + n[0] + '">' + icon(n[2]) + '<span>' + n[1] + '</span></button>').join('') + '</nav>' +
    '<div id="toast" class="toast" role="status" aria-live="polite"></div>';
}
function boot() {
  buildChrome();
  ensureToday();
  applyDisplay();
  loadAppInfo();
  if (!S.profile.onboarded && !S.updated) markVersionSeen();   // a fresh install has nothing new to announce
  if (S.profile.instrument === 'guitar') ui.courseTab = 'guitar';
  route = S.profile.onboarded ? { name: 'home', params: {} } : { name: 'onboarding', params: {} };
  try { history.replaceState({ gpa: 1, name: route.name, params: route.params }, ''); } catch (e) { /* ignore */ }
  render();
  checkAch();
  Store.init();
  Midi.onChange = () => { if (route && (route.name === 'profile' || route.name === 'lab')) render(); };
  if (S.prefs.midi && Midi.supported) Midi.connect();
  if (Desk) Desk.onNavigate(where => { if (where === 'about' || where === 'settings') go('profile', { tab: where }); });
  // test and debugging hook: only in the browser build, never in the desktop app
  if (!Desk) window.__gpa = { Store, Snap, restoreSnapshot, Midi, S: () => S, go, ui, lab, sl, E, C, Input, Snd, Piano, mountExercise, lessonStatus, isUnlocked, evalLesson, route: () => route, ACTIONS, render };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
