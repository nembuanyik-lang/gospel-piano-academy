'use strict';
/* ---------------------------------------------------------------- Song Lab: the song project studio
   Chords for each section, melodies with takes and a note editor, the whole-song player, a guide track
   recorded in sync, and exports (MIDI, chord chart, audio). The arrangement itself is in studio.js. */
const pst = () => ui.proj || (ui.proj = { sec: 'Chorus', sel: -1, take: null, withGuide: true });
const fmtTime = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
const songSeconds = P => Math.round(arrangeSong(P).total * 60 / P.bpm);

function secTabs(P, act) {
  const cur = pst().sec;
  return '<div class="chips sectabs" role="tablist" aria-label="Section">' + SECTION_TYPES.map(t => {
    const n = P.sections[t].degs.length, used = songStructure(P).includes(t), mel = P.melodies[t] && P.melodies[t].notes.length;
    return '<button type="button" role="tab" class="chip' + (t === cur ? ' on' : '') + '" aria-selected="' + (t === cur) + '" data-act="' + act + '" data-s="' + esc(t) + '">' + esc(t) + ' <small>' + n + (act === 'psecm' ? (mel ? ' · ♪' : '') : '') + (used ? '' : ' · not in song') + '</small></button>';
  }).join('') + '</div>';
}
function arrangeCard(P) {
  const beatOpts = P.ts === 4 ? Object.keys(E.BEATS).filter(k => k !== 'custom' || P.grid).map(k => [k, E.BEATS[k].label]) : [['none', 'No drums'], ['meter', METER_DRUMS[P.ts].label]];
  const beatVal = P.ts === 4 ? (P.beat || 'none') : (P.beat && P.beat !== 'none' ? 'meter' : 'none');
  return '<section class="card"><p class="eyebrow">Sound and feel</p><h3>Arrangement</h3>' +
    '<div class="grid2"><label class="field"><span>Key</span>' + selectHtml('pkey', keyOptions, P.key, 'pkey') + '</label>' +
    '<div class="field"><span>Time signature</span><div class="seg" role="group" aria-label="Time signature">' + [4, 3, 6].map(m => '<button type="button" class="' + (P.ts === m ? 'on' : '') + '" aria-pressed="' + (P.ts === m) + '" data-act="pts" data-v="' + m + '" title="' + esc(METERS[m].hint) + '">' + METERS[m].label + '</button>').join('') + '</div></div>' +
    '<label class="field"><span>Tempo <b id="pbpmv" class="mono">' + P.bpm + '</b> BPM</span><input type="range" min="40" max="200" value="' + P.bpm + '" data-bind="pbpm" aria-label="Tempo"></label>' +
    '<label class="field"><span>Keyboard rhythm</span>' + selectHtml('pstyle', Object.keys(E.STYLES).map(k => [k, E.STYLES[k].label]), P.style, 'pstyle') + '</label>' +
    '<label class="field"><span>Bass</span>' + selectHtml('pbass', Object.keys(BASS_STYLES).map(k => [k, BASS_STYLES[k]]), P.bassStyle, 'pbass') + '</label>' +
    '<label class="field"><span>Drums</span>' + selectHtml('pbeat', beatOpts, beatVal, 'pbeat') + '</label>' +
    (P.ts === 4 ? '<label class="field"><span>Swing</span><input type="range" min="0" max="60" value="' + (P.swing || 0) + '" data-bind="pswing" aria-label="Swing"></label>' : '') + '</div>' +
    '<label class="switch"><input type="checkbox" data-bind="psev"' + (P.sev ? ' checked' : '') + '><span>Use 7th chords</span></label>' + soundPicker() +
    '<p class="tiny">Sections play with their own energy: the intro and outro are gentle, the chorus is fullest.</p></section>';
}
function chordsCard(P) {
  const st = P.steps, sec = pst().sec, s = P.sections[sec], sc = sectionChords(P, sec);
  const others = SECTION_TYPES.filter(t => t !== sec);
  return '<section class="card"><p class="eyebrow">Step 1 ' + (st.prog ? '<span class="tag ok">Done</span>' : '') + '</p><h3>Chords for each section</h3><p class="muted">Give the verse, chorus and bridge their own progressions, up to eight chords each. Most songs start by writing the chorus.</p>' +
    secTabs(P, 'psec') + chordCards(sc.chs, -1) +
    '<div class="chips">' + E.diatonic(P.key, P.sev).map(c => '<button type="button" class="chip-btn" data-act="padd" data-d="' + c.deg + '"><b class="mono">' + esc(c.name) + '</b><span>' + esc(c.roman) + '</span></button>').join('') + '</div>' +
    '<div class="grid2"><label class="field"><span>Chord length</span>' + selectHtml('plen', CHORD_LENS.map(x => [x[0], x[1]]), s.len, 'plen') + '</label>' +
    '<label class="field"><span>Copy chords from</span><select data-bind="pcopy"><option value="">Choose a section…</option>' + others.map(t => '<option value="' + esc(t) + '">' + esc(t) + ' (' + P.sections[t].degs.length + ' chords)</option>').join('') + '</select></label></div>' +
    '<div class="row wrap"><button class="btn ghost sm" type="button" data-act="pundo">Remove last</button><button class="btn ghost sm" type="button" data-act="psecplay">' + icon('play') + 'Loop ' + esc(sec) + '</button>' +
    '<button class="btn ' + (st.prog ? 'ghost' : 'primary') + ' sm" type="button" data-act="pstep" data-k="prog"' + (P.sections.Chorus.degs.length >= 2 ? '' : ' disabled') + '>' + (st.prog ? 'Marked done' : 'Mark step done') + '</button></div>' +
    '<p class="tiny">' + esc(sec) + ': ' + sc.chs.length + ' chords, ' + sc.beats / meterOf(P).bar + ' bars.</p></section>';
}
function melodyCard(P) {
  const st = P.steps, sec = pst().sec, mel = P.melodies[sec], take = pst().take && pst().take.sec === sec ? pst().take : null, takes = P.takes[sec] || [];
  const any = SECTION_TYPES.some(t => P.melodies[t] && P.melodies[t].notes.length >= 4);
  return '<section class="card"><p class="eyebrow">Step 2 ' + (st.melody ? '<span class="tag ok">Done</span>' : '') + '</p><h3>Write a melody</h3>' +
    '<p class="muted">Choose a section and press Record. One bar of clicks, then that section\'s chords play while you play the melody on a MIDI keyboard, the screen keys or the computer keys. Hold each note as long as you want it to last.</p>' +
    secTabs(P, 'psecm') + '<div class="vpiano" id="melpiano"></div>' +
    '<div class="row wrap"><button class="btn primary" type="button" id="melrec">' + icon('mic') + 'Record ' + esc(sec) + '</button><button class="btn ghost" type="button" data-act="pmelplay">' + icon('play') + 'Play with chords</button>' +
    (mel && mel.notes.length ? '<button class="btn ghost" type="button" data-act="pmelclear">Clear melody</button>' : '') + '</div>' +
    '<p class="tiny" id="melinfo" aria-live="polite">' + (mel && mel.notes.length ? mel.notes.length + ' notes in the ' + esc(sec) + ' melody.' : 'No ' + esc(sec) + ' melody yet.') + '</p>' +
    (take ? '<div class="callout"><p><b>New take: ' + take.notes.length + ' notes.</b> Listen, then keep it or try again.</p><div class="row wrap"><button class="btn ghost sm" type="button" data-act="ptakeplay">' + icon('play') + 'Hear the new take</button><button class="btn primary sm" type="button" data-act="ptakekeep">Keep this take</button><button class="btn ghost sm" type="button" data-act="ptakedrop">Discard</button></div></div>' : '') +
    (takes.length ? '<p class="tiny">Earlier takes: ' + takes.map((t, i) => '<button type="button" class="btn ghost sm" data-act="ptakeuse" data-i="' + i + '">Take ' + (i + 1) + ' (' + t.notes.length + ' notes)</button>').join(' ') + '</p>' : '') +
    '<div class="roll-wrap"><div class="split"><b>Note editor</b><span class="tiny" id="rollsel" aria-live="polite">Click the grid to add a note, click a note to select it.</span></div><div class="roll" id="roll"></div>' +
    '<div class="row wrap roll-tools" role="group" aria-label="Edit the selected note">' + [['left', '◀ Earlier'], ['right', 'Later ▶'], ['up', '▲ Higher'], ['down', '▼ Lower'], ['short', 'Shorter'], ['long', 'Longer'], ['del', 'Delete']].map(b => '<button type="button" class="btn ghost sm" data-roll="' + b[0] + '">' + b[1] + '</button>').join('') + '</div>' +
    '<p class="tiny">Keys: arrows move the selected note, Shift + left or right changes its length, Delete removes it.</p></div>' +
    '<div class="row wrap"><button class="btn ' + (st.melody ? 'ghost' : 'primary') + ' sm" data-act="pstep" data-k="melody"' + (any ? '' : ' disabled') + '>' + (st.melody ? 'Marked done' : any ? 'Mark step done' : 'Record at least 4 notes in a section first') + '</button></div></section>';
}
function guideCard(P) {
  const g = P.guide;
  return '<section class="card"><p class="eyebrow">Guide track</p><h3>Record your voice or instrument with the song</h3>' +
    '<p class="muted">Sing or play along with the whole song while the app records through the microphone. Use headphones so the backing does not bleed into the recording. Run Timing calibration first for the best timing.</p>' +
    '<div class="row wrap"><button class="btn primary" type="button" id="guiderec">' + icon('mic') + (g ? 'Record again' : 'Record a guide track') + '</button>' +
    (g ? '<button class="btn ghost" type="button" data-act="pguidesave">Save the guide as a file</button><button class="btn ghost" type="button" data-act="pguidedel">Delete it</button>' : '') + '</div>' +
    '<p class="tiny" id="guideinfo" aria-live="polite">' + (g ? 'Guide track recorded (' + fmtTime(g.dur) + '). It plays with the song and can be included in the audio export. It is kept on this computer only, not in backups.' : 'No guide track yet.') + '</p>' +
    (g ? '<div class="grid2"><label class="field"><span>Guide volume</span><input type="range" min="0" max="150" value="' + Math.round((g.gain == null ? 1 : g.gain) * 100) + '" data-bind="pguidegain" aria-label="Guide volume"></label>' +
      '<label class="field"><span>Line up the timing <b class="mono" id="nudgev">' + (g.nudgeMs || 0) + '</b> ms</span><input type="range" min="-250" max="250" step="5" value="' + (g.nudgeMs || 0) + '" data-bind="pguidenudge" aria-label="Guide timing"></label></div>' : '') + '</section>';
}
function exportCard(P) {
  return '<section class="card"><p class="eyebrow">Take it further</p><h3>Share and produce</h3>' +
    '<p class="muted"><b>Audio (WAV)</b> plays anywhere: rehearse with your team, sing over the backing, or send it. <b>MIDI</b> opens in any music program (Reaper, BandLab, FL Studio, Logic) with chords, bass, melody and drums on separate tracks, your sections as markers and the tempo set. <b>Chord chart</b> prints for singers and band.</p>' +
    '<div class="row wrap"><button class="btn primary sm" type="button" data-act="pwav" data-mix="full">Save audio: full song</button><button class="btn ghost sm" type="button" data-act="pwav" data-mix="backing">Save audio: backing only</button>' +
    (P.guide ? '<button class="btn ghost sm" type="button" data-act="pwav" data-mix="guide">Save audio: with guide track</button>' : '') + '</div>' +
    '<div class="row wrap"><button class="btn ghost sm" type="button" data-act="pmidi">Save MIDI file</button><button class="btn ghost sm" type="button" data-act="pchart">Save chord chart</button></div>' +
    '<p class="tiny" id="expinfo" aria-live="polite"></p></section>';
}
function viewProject(pid) {
  const P = S.songs.find(s => s.id === pid); if (!P) return viewSong.call(null);
  migrateProject(P);
  if (!SECTION_TYPES.includes(pst().sec)) pst().sec = 'Chorus';
  const st = P.steps, nDone = Object.values(st).filter(Boolean).length, secs = songSeconds(P);
  const html = '<div class="screen"><div class="pagehead"><button class="btn ghost sm" type="button" data-act="go" data-to="song">' + icon('back') + 'Song Lab</button><label class="field"><span>Song title</span><input id="ptitle" type="text" maxlength="60" value="' + esc(P.title) + '" data-bind="ptitle"></label>' +
    '<p class="muted">' + nDone + ' of 4 steps done' + (P.done ? ' · finished' : '') + ' · ' + esc(fmt(P.key)) + ' · ' + METERS[P.ts].label + ' · ' + P.bpm + ' BPM · ' + fmtTime(secs) + ' long</p>' + bar(nDone * 25) + '</div>' +
    '<section class="card player"><div class="split"><div><p class="eyebrow">The whole song</p><h3 id="songpos">' + esc(songStructure(P).join(' · ')) + '</h3></div>' +
    '<div class="row wrap"><button class="btn primary" type="button" id="songplay">' + icon('play') + 'Play the song</button>' + (P.guide ? '<label class="switch"><input type="checkbox" data-bind="pwithguide"' + (pst().withGuide ? ' checked' : '') + '><span>With guide track</span></label>' : '') + '</div></div>' +
    '<div class="songbar" id="songbar">' + (() => { const A = arrangeSong(P); return A.timeline.map(t => '<span style="flex:' + t.beats + '" title="' + esc(t.type) + '">' + esc(t.type) + '</span>').join(''); })() + '<i id="songcur"></i></div></section>' +
    arrangeCard(P) + chordsCard(P) + melodyCard(P) +
    '<section class="card"><p class="eyebrow">Step 3 ' + (st.chorus ? '<span class="tag ok">Done</span>' : '') + '</p><h3>Make it a chorus</h3><p class="muted">A chorus carries the main message and repeats. Write 2 to 4 short lines that someone could sing back after hearing them once.</p><label class="field"><span>Chorus lyrics</span><textarea id="lchorus" rows="4" data-bind="lchorus">' + esc(P.lyrics.chorus) + '</textarea></label>' +
    '<div class="row wrap"><button class="btn ' + (st.chorus ? 'ghost' : 'primary') + ' sm" data-act="pstep" data-k="chorus">' + (st.chorus ? 'Marked done' : 'Mark step done') + '</button></div></section>' +
    '<section class="card"><p class="eyebrow">Step 4 ' + (st.song ? '<span class="tag ok">Done</span>' : '') + '</p><h3>Build the complete song</h3><p class="muted">Put the sections in order. Each section plays its own chords and melody.</p><div class="chips">' + SECTION_TYPES.map(s => '<button type="button" class="chip-btn" data-act="padds" data-s="' + esc(s) + '">' + icon('plus') + esc(s) + '</button>').join('') + '</div>' +
    '<ol class="struct">' + (P.structure.length ? P.structure.map((s, i) => '<li><span>' + esc(s) + '</span><button class="btn ghost sm" type="button" data-act="prems" data-i="' + i + '" aria-label="Remove ' + esc(s) + '">' + icon('x') + '</button></li>').join('') : '<li class="muted">Add sections above, for example Intro, Verse, Chorus, Verse, Chorus, Bridge, Chorus, Outro. Until then the song is one chorus.</li>') + '</ol>' +
    '<label class="field"><span>Verse lyrics</span><textarea id="lverse" rows="5" data-bind="lverse">' + esc(P.lyrics.verse) + '</textarea></label><label class="field"><span>Bridge lyrics (optional)</span><textarea id="lbridge" rows="3" data-bind="lbridge">' + esc(P.lyrics.bridge) + '</textarea></label>' +
    '<div class="row wrap"><button class="btn ' + (st.song ? 'ghost' : 'primary') + ' sm" data-act="pstep" data-k="song">' + (st.song ? 'Marked done' : 'Mark step done') + '</button></div><p class="tiny">Steps 3 and 4 are self-checked. Play it through and sing it.</p></section>' +
    guideCard(P) + exportCard(P) +
    '<div class="row wrap"><button class="btn ghost" data-act="pdel" data-id="' + esc(P.id) + '">' + (ui.confirmDel === P.id ? 'Tap again to delete this project' : 'Delete project') + '</button></div></div>';
  return { html, mount(root) { return mountProject(root, P); } };
}

/* ---- behaviour: player, melody recorder, note editor, guide recorder ---- */
let projPlay = null;
function stopProjPlay() { if (projPlay) { const h = projPlay; projPlay = null; h.stop(); } }
function playScript(script, o) {
  stopProjPlay();
  projPlay = Snd.play(script, Object.assign({ force: true, inst: () => Snd.backingInst() }, o || {}));
  return projPlay;
}
function mountProject(root, P) {
  const cl = [];
  /* whole-song player with a moving cursor and the current section and chord */
  const btn = $('#songplay', root), cur = $('#songcur', root), pos = $('#songpos', root);
  let tick = null, playing = false;
  const reset = () => { playing = false; clearInterval(tick); tick = null; if (btn) btn.innerHTML = icon('play') + 'Play the song'; if (cur) cur.style.left = '0'; if (pos) pos.textContent = songStructure(P).join(' · '); };
  if (btn) btn.addEventListener('click', async () => {
    if (playing) { stopProjPlay(); reset(); return; }
    const A = arrangeSong(P, { melInst: Snd.inst() }), spb = 60 / P.bpm;
    const guide = P.guide && pst().withGuide ? await GuideStore.buffer(P).catch(() => null) : null;
    let start = 0; playing = true; btn.innerHTML = icon('stop') + 'Stop';
    playScript(A.script, {
      onStart: (t, c, bus) => { start = t; if (guide) Snd.playBuffer(guide, t + (P.guide.nudgeMs || 0) / 1000, P.guide.gain == null ? 1 : P.guide.gain, bus); },
      onEnd: () => reset()
    });
    tick = setInterval(() => {
      const beat = (Snd.now() - start) / spb; if (beat < 0) return;
      if (cur) cur.style.left = Math.min(100, 100 * beat / A.total) + '%';
      const seg = A.timeline.find(t => beat >= t.start && beat < t.start + t.beats);
      if (seg && pos) { const k = Math.min(seg.chs.length - 1, Math.floor((beat - seg.start) / seg.chordBeats)); pos.textContent = seg.type + ' · ' + fmt(seg.chs[k].name); }
    }, 80);
  });
  cl.push(() => { stopProjPlay(); clearInterval(tick); });

  /* melody recorder for the chosen section */
  const piano = Piano($('#melpiano', root), { lo: 55, hi: 84, names: S.prefs.names, minKey: 34, height: 120 });
  cl.push(() => piano.destroy());
  const recBtn = $('#melrec', root), info = $('#melinfo', root);
  let rec = null;
  if (recBtn) recBtn.addEventListener('click', () => {
    if (rec) { stopProjPlay(); return; }
    const sec = pst().sec, A = arrangeSection(P, sec, { melody: false }), bar = meterOf(P).bar, spb = 60 / P.bpm;
    const clicks = Array.from({ length: bar }, (_, i) => ({ t: i, d: 0.2, click: i === 0 ? 2 : 1 }));
    const events = clicks.concat(A.events.map(e => Object.assign({}, e, { t: e.t + bar })));
    rec = { start: null, open: {}, notes: [] };
    recBtn.innerHTML = icon('stop') + 'Stop'; info.textContent = 'Count-in… then play.';
    const q = b => Math.round(b * 2) / 2;
    playScript({ events, bpm: P.bpm, total: bar + A.beats }, {
      onStart: t => { rec.start = t + bar * spb; },
      onEnd: () => {
        const r = rec; rec = null; recBtn.innerHTML = icon('mic') + 'Record ' + esc(sec);
        if (!r) return;
        Object.values(r.open).forEach(o => { o.d = Math.max(0.5, Math.min(A.beats - o.t, 1)); r.notes.push(o); });
        const notes = r.notes.filter(n => n.t >= 0 && n.t < A.beats).map(n => ({ m: n.m, t: q(n.t), d: Math.max(0.5, Math.min(A.beats - q(n.t), q(n.d) || 0.5)) })).sort((a, b) => a.t - b.t);
        if (!notes.length) { info.textContent = 'No notes were captured. Play after the count-in.'; return; }
        pst().take = { sec, notes }; render();
      }
    });
  });
  const beatOf = ev => rec && rec.start !== null ? (ev.ctx - latSec() - rec.start) / (60 / P.bpm) : null;
  cl.push(Input.listen(ev => { const b = beatOf(ev); if (b === null || b < -0.3) return; rec.open[ev.midi] = { m: ev.midi, t: Math.max(0, b) }; if (info) info.textContent = 'Recording… ' + fmt(E.midiName(ev.midi)); }));
  cl.push(Input.listenOff(ev => { if (!rec) return; const o = rec.open[ev.midi]; if (!o) return; const b = beatOf(ev); o.d = Math.max(0.25, (b === null ? o.t + 1 : b) - o.t); rec.notes.push(o); delete rec.open[ev.midi]; }));
  cl.push(() => { rec = null; });

  /* note editor */
  mountRoll(root, P);

  /* guide track recorder */
  const gBtn = $('#guiderec', root), gInfo = $('#guideinfo', root);
  let g = null;
  if (gBtn) gBtn.addEventListener('click', () => {
    if (g) { g.stop(); return; }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { gInfo.textContent = 'Recording is not available on this device.'; return; }
    stopProjPlay();
    gBtn.innerHTML = icon('stop') + 'Stop recording';
    g = startGuideRecording(P, s => {
      if (s.state === 'recording') gInfo.textContent = 'One bar of clicks, then the song plays. Recording…';
      else if (s.state === 'saved') { g = null; toast('Guide track saved (' + fmtTime(s.seconds) + ').'); render(); }
      else { g = null; gBtn.innerHTML = icon('mic') + 'Record a guide track'; gInfo.textContent = s.msg || 'Nothing was recorded.'; }
    });
  });
  cl.push(() => { if (g) g.stop(); });
  return () => cl.forEach(f => { try { f(); } catch (e) { /* ignore */ } });
}

/* the note editor: a small piano roll for the chosen section's melody */
function mountRoll(root, P) {
  const host = $('#roll', root), selEl = $('#rollsel', root); if (!host) return;
  const sec = pst().sec, sc = sectionChords(P, sec), beats = sc.beats, CW = 20, RH = 14;
  const mel = () => P.melodies[sec] || (P.melodies[sec] = { notes: [] });
  const notesNow = () => mel().notes;
  function range() { const ms = notesNow().map(n => n.m); let lo = ms.length ? Math.min.apply(null, ms) - 3 : 60, hi = ms.length ? Math.max.apply(null, ms) + 3 : 76; if (hi - lo < 14) { const mid = (hi + lo) >> 1; lo = mid - 7; hi = mid + 7; } return [clamp(lo, 43, 90), clamp(hi, 50, 96)]; }
  function draw() {
    const [lo, hi] = range(), rows = hi - lo + 1, cols = beats * 2, W = cols * CW + 40, H = rows * RH + 18, bar = meterOf(P).bar, sel = pst().sel;
    let svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Melody notes for the ' + esc(sec) + '">';
    for (let r = 0; r < rows; r++) { const m = hi - r, y = 18 + r * RH; svg += '<rect x="40" y="' + y + '" width="' + (cols * CW) + '" height="' + RH + '" class="' + (E.isBlack(m) ? 'rb' : 'rw') + '"/>' + (m % 12 === 0 || r === 0 ? '<text x="36" y="' + (y + RH - 3) + '" text-anchor="end" class="rl">' + esc(fmt(E.midiName(m))) + '</text>' : ''); }
    for (let c = 0; c <= cols; c++) { const x = 40 + c * CW; svg += '<line x1="' + x + '" x2="' + x + '" y1="18" y2="' + H + '" class="' + (c % (bar * 2) === 0 ? 'lb' : c % 2 === 0 ? 'lq' : 'le') + '"/>'; }
    sc.chs.forEach((ch, i) => { const x = 40 + i * sc.chordBeats * 2 * CW; svg += '<text x="' + (x + 3) + '" y="12" class="rc">' + esc(fmt(ch.name)) + '</text>'; });
    notesNow().forEach((n, i) => { if (n.m < lo || n.m > hi) return; const x = 40 + n.t * 2 * CW, y = 18 + (hi - n.m) * RH; svg += '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + Math.max(6, n.d * 2 * CW - 2) + '" height="' + (RH - 2) + '" rx="3" class="rn' + (i === sel ? ' on' : '') + '" data-i="' + i + '"/>'; });
    host.innerHTML = svg + '</svg>';
    const s = notesNow()[sel];
    selEl.textContent = s ? 'Selected: ' + fmt(E.midiName(s.m)) + ', beat ' + (s.t + 1) + ', ' + s.d + (s.d === 1 ? ' beat' : ' beats') + ' long.' : 'Click the grid to add a note, click a note to select it.';
  }
  function commit() { notesNow().sort((a, b) => a.t - b.t || a.m - b.m); syncLegacy(P); touch(); }
  host.addEventListener('click', e => {
    const svg = host.querySelector('svg'); if (!svg) return;
    const rect = svg.getBoundingClientRect(), x = (e.clientX - rect.left) * (svg.viewBox.baseVal.width / rect.width), y = (e.clientY - rect.top) * (svg.viewBox.baseVal.height / rect.height);
    const hit = e.target.closest('[data-i]');
    if (hit) { pst().sel = +hit.dataset.i; const n = notesNow()[pst().sel]; Snd.tone(n.m, 0.5); draw(); return; }
    if (x < 40 || y < 18) return;
    const [, hi] = range(), m = hi - Math.floor((y - 18) / RH), t = Math.floor((x - 40) / CW) / 2;
    if (t >= beats) return;
    notesNow().push({ m, t, d: Math.min(1, beats - t) }); commit();
    pst().sel = notesNow().findIndex(n => n.m === m && n.t === t); Snd.tone(m, 0.5); draw();
  });
  function edit(op) {
    const n = notesNow()[pst().sel]; if (!n) return;
    if (op === 'left') n.t = Math.max(0, n.t - 0.5); if (op === 'right') n.t = Math.min(beats - 0.5, n.t + 0.5);
    if (op === 'up') n.m = Math.min(96, n.m + 1); if (op === 'down') n.m = Math.max(36, n.m - 1);
    if (op === 'short') n.d = Math.max(0.5, n.d - 0.5); if (op === 'long') n.d = Math.min(beats - n.t, n.d + 0.5);
    n.d = Math.min(n.d, beats - n.t);
    if (op === 'del') { notesNow().splice(pst().sel, 1); pst().sel = -1; commit(); draw(); return; }
    commit(); pst().sel = notesNow().indexOf(n); if (op === 'up' || op === 'down') Snd.tone(n.m, 0.4); draw();
  }
  root.querySelectorAll('[data-roll]').forEach(b => b.addEventListener('click', () => edit(b.dataset.roll)));
  host.tabIndex = 0;
  host.addEventListener('keydown', e => {
    const map = { ArrowLeft: e.shiftKey ? 'short' : 'left', ArrowRight: e.shiftKey ? 'long' : 'right', ArrowUp: 'up', ArrowDown: 'down', Delete: 'del', Backspace: 'del' };
    if (map[e.key]) { e.preventDefault(); e.stopPropagation(); edit(map[e.key]); }
  });
  draw();
}

/* ---- chord chart from the sections ---- */
function chartHtml(P) {
  migrateProject(P);
  const lyr = { Verse: P.lyrics.verse, Chorus: P.lyrics.chorus, Bridge: P.lyrics.bridge };
  const secs = songStructure(P), seen = new Set();
  const body = secs.map(name => {
    const sc = sectionChords(P, name), first = !seen.has(name); seen.add(name);
    const per = sc.chordBeats / meterOf(P).bar;
    return '<section><h2>' + esc(name) + '</h2><div class="bars">' + sc.chs.map(c => '<span>' + esc(fmt(c.name)) + '</span>').join('') + '</div><div class="nums">' + sc.chs.map(c => '<span>' + esc(c.roman) + '</span>').join('') + '</div>' +
      (per !== 1 ? '<p class="len">' + (per === 2 ? 'Two bars per chord' : 'Half a bar per chord') + '</p>' : '') + (first && lyr[name] && lyr[name].trim() ? '<pre>' + esc(lyr[name].trim()) + '</pre>' : '') + '</section>';
  }).join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + esc(P.title || 'My song') + '</title><style>' +
    'body{font:16px/1.5 system-ui,Segoe UI,Arial,sans-serif;max-width:760px;margin:2rem auto;padding:0 1.2rem;color:#17181C}h1{margin:0 0 .2rem;font-size:2rem}.meta{color:#555;margin:0 0 1.5rem}' +
    'section{margin:0 0 1.6rem;break-inside:avoid}h2{font-size:1rem;text-transform:uppercase;letter-spacing:.08em;color:#8a1c2b;margin:0 0 .4rem}' +
    '.bars,.nums{display:flex;flex-wrap:wrap;gap:0}.bars span,.nums span{flex:1 0 20%;padding:.35rem .6rem;border-left:2px solid #17181C}' +
    '.bars span{font:700 1.4rem ui-monospace,Consolas,monospace}.nums span{font-size:.85rem;color:#666;border-color:transparent}.len{font-size:.85rem;color:#666;margin:.2rem 0}pre{font:inherit;white-space:pre-wrap;margin:.7rem 0 0}' +
    '.foot{color:#777;font-size:.8rem;margin-top:2rem}@media print{body{margin:0}}</style></head><body><h1>' + esc(P.title || 'My song') + '</h1>' +
    '<p class="meta">Key of ' + esc(fmt(P.key)) + ' · ' + P.bpm + ' BPM · ' + METERS[P.ts].label + ' · ' + esc(E.STYLES[P.style] ? E.STYLES[P.style].label : P.style) + (P.sev ? ' · seventh chords' : '') + ' · ' + fmtTime(songSeconds(P)) + '</p>' +
    body + '<p class="foot">Made in Gospel Music Academy. Print this page or save it as a PDF from the print dialog.</p></body></html>';
}
function exportChart(P) { const name = songSlug(P) + '_chart.html'; saveFile(name, 'text/html', chartHtml(P)); return name; }

/* ---- actions and bindings for the project screen (merged into ACTIONS and BINDS at boot) ---- */
const PROJECT_ACTIONS = {
  psec: el => { pst().sec = el.dataset.s; pst().sel = -1; render(); },
  psecm: el => { pst().sec = el.dataset.s; pst().sel = -1; render(); },
  padd: el => { const P = curProj(), s = P.sections[pst().sec]; if (s.degs.length >= MAX_SECTION_CHORDS) { toast('Eight chords is the most a section can hold.'); return; } s.degs.push(+el.dataset.d); if (pst().sec === 'Chorus') P.steps.prog = false; syncLegacy(P); touch(); render(); },
  pundo: () => { const P = curProj(), s = P.sections[pst().sec]; if (s.degs.length > 1) s.degs.pop(); syncLegacy(P); touch(); render(); },
  psecplay: () => { const P = curProj(), A = arrangeSection(P, pst().sec, { melInst: Snd.inst() }); playScript({ events: A.events, bpm: P.bpm, total: A.beats }, { loop: true }); toast('Looping the ' + pst().sec + '. Press any other play button, or Stop on the song player, to stop.'); },
  pmelplay: () => { const P = curProj(), A = arrangeSection(P, pst().sec, { melInst: Snd.inst() }); playScript({ events: A.events, bpm: P.bpm, total: A.beats }); },
  pmelclear: () => { const P = curProj(), sec = pst().sec; if (P.melodies[sec] && P.melodies[sec].notes.length) { (P.takes[sec] = P.takes[sec] || []).unshift(P.melodies[sec]); P.takes[sec] = P.takes[sec].slice(0, 3); } P.melodies[sec] = { notes: [] }; pst().sel = -1; syncLegacy(P); touch(); render(); },
  ptakeplay: () => { const P = curProj(), t = pst().take; if (!t) return; const A = arrangeSection(P, t.sec, { melody: false }); playScript({ events: A.events.concat(t.notes.map(n => ({ t: n.t, d: n.d, notes: [n.m], inst: Snd.inst(), vel: 0.8 }))), bpm: P.bpm, total: A.beats }); },
  ptakekeep: () => { const P = curProj(), t = pst().take; if (!t) return; const old = P.melodies[t.sec]; if (old && old.notes.length) { (P.takes[t.sec] = P.takes[t.sec] || []).unshift(old); P.takes[t.sec] = P.takes[t.sec].slice(0, 3); } P.melodies[t.sec] = { notes: t.notes }; pst().take = null; pst().sel = -1; syncLegacy(P); touch(); toast('Take kept.'); render(); },
  ptakedrop: () => { pst().take = null; render(); },
  ptakeuse: el => { const P = curProj(), sec = pst().sec, list = P.takes[sec] || [], i = +el.dataset.i, t = list[i]; if (!t) return; const cur = P.melodies[sec]; list.splice(i, 1); if (cur && cur.notes.length) list.unshift(cur); P.takes[sec] = list.slice(0, 3); P.melodies[sec] = t; syncLegacy(P); touch(); toast('Earlier take restored.'); render(); },
  pts: el => { const P = curProj(); P.ts = +el.dataset.v; if (P.ts === 4 && P.beat === 'meter') P.beat = 'ballad'; touch(); render(); },
  pmidi: () => { const P = curProj(); const r = exportSongMidi(P); toast('MIDI file saved: ' + r.name); },
  pchart: () => { const P = curProj(); exportChart(P); toast('Chord chart saved. Open it to print or save as PDF.'); },
  pplay: () => { const P = curProj(); const A = arrangeSong(P, { melInst: Snd.inst() }); playScript(A.script); },
  pwav: async el => {
    const P = curProj(), mix = el.dataset.mix, info = $('#expinfo');
    if (info) info.textContent = 'Making the audio file… this takes a few seconds.';
    try {
      const r = await exportSongWav(P, { melody: mix !== 'backing', guide: mix === 'guide' });
      if (info) info.textContent = 'Saved ' + r.name + ' (' + fmtTime(r.seconds) + ', ' + (r.bytes / 1048576).toFixed(1) + ' MB).';
      toast('Audio file saved.');
    } catch (e) { if (info) info.textContent = 'The audio file could not be made: ' + e.message; }
  },
  pguidesave: async () => { const P = curProj(); const blob = await GuideStore.get(P.id); if (!blob) { toast('The guide track was not found on this computer.', 'warn'); return; } saveFile(songSlug(P) + '_guide.wav', 'audio/wav', blob); },
  pguidedel: async () => { const P = curProj(); if (!ui.confirmGuideDel) { ui.confirmGuideDel = true; toast('Press Delete it again to remove the guide track.'); setTimeout(() => { ui.confirmGuideDel = false; }, 4000); return; } ui.confirmGuideDel = false; await GuideStore.del(P.id).catch(() => {}); P.guide = null; touch(); render(); }
};
const PROJECT_BINDS = {
  pbpm: el => { const P = curProj(); P.bpm = +el.value; const v = $('#pbpmv'); if (v) v.textContent = P.bpm; touch(); },
  pswing: el => { const P = curProj(); P.swing = +el.value; touch(); },
  pbass: el => { const P = curProj(); P.bassStyle = BASS_STYLES[el.value] ? el.value : 'root'; touch(); render(); },
  pbeat: el => { const P = curProj(); P.beat = el.value === 'meter' ? (P.ts === 4 ? 'ballad' : 'meter') : el.value; touch(); render(); },
  plen: el => { const P = curProj(); P.sections[pst().sec].len = +el.value; touch(); render(); },
  pcopy: el => { const P = curProj(), from = el.value; if (!from || !P.sections[from]) return; P.sections[pst().sec] = { degs: P.sections[from].degs.slice(), len: P.sections[from].len }; syncLegacy(P); touch(); toast('Copied the chords from the ' + from + '.'); render(); },
  pwithguide: el => { pst().withGuide = el.checked; },
  pguidegain: el => { const P = curProj(); if (P.guide) { P.guide.gain = +el.value / 100; touch(); } },
  pguidenudge: el => { const P = curProj(); if (P.guide) { P.guide.nudgeMs = +el.value; const v = $('#nudgev'); if (v) v.textContent = el.value; touch(); } }
};
