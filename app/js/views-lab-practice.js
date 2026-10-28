'use strict';
/* ---------------------------------------------------------------- PIANO LAB */
const lab = { tab: 'play', root: 'C', quality: 'major', inv: 0, key: 'C', sroot: 'C', stype: 'major', last: null, detected: null };
const QGROUPS = [['Triads', ['major', 'minor', 'dim', 'aug', 'sus2', 'sus4']], ['Seventh chords', ['maj7', 'm7', '7', 'm7b5', 'dim7', '7sus4']], ['Colour chords', ['6', 'm6', 'add9', '9', 'maj9', 'm9', 'm11', '13']]];
const CHROMA_ROMAN = { 1: '♭II', 3: '♭III', 6: '♭V', 8: '♭VI', 10: '♭VII' };
function romanInKey(rootName, quality, keyName) {
  const d = (E.pcOfName(rootName) - E.pcOfName(keyName) + 12) % 12;
  const diat = [0, 2, 4, 5, 7, 9, 11].indexOf(d);
  if (diat >= 0) return { roman: E.romanFor(diat, quality), number: E.numberFor(diat, quality), diatonic: E.DIA_TRIAD[diat] === quality || E.DIA_SEVENTH[diat] === quality };
  const base = CHROMA_ROMAN[d]; const lower = ['minor', 'dim', 'm7', 'm7b5', 'm6', 'm9', 'm11', 'dim7'].includes(quality);
  const r = lower ? base.slice(0, 1) + base.slice(1).toLowerCase() : base;
  const n = '♭' + ({ 1: 2, 3: 3, 6: 5, 8: 6, 10: 7 }[d]) + (({ minor: 'm' }[quality]) || '');
  return { roman: r, number: n, diatonic: false };
}
function labStaffHtml(kind) {
  try {
    if (kind === 'chord') {
      const cm = labChord().midis, pcs = E.chordPcs(lab.root, lab.quality), names = E.chordNames(lab.root, lab.quality);
      const toks = Staff.tokens(cm.map(m => names[pcs.indexOf(((m % 12) + 12) % 12)]), cm);
      return Staff.render({ clef: 'grand', cols: [{ notes: toks, dur: 'w' }], label: 'Staff notation: ' + toks.join(', ') });
    }
    const mids = E.scaleMidis(lab.sroot, lab.stype, 4, true), nm = E.scaleNotes(lab.sroot, lab.stype), n = nm.length;
    const toks = Staff.tokens(mids.map((m, i) => nm[i % n]), mids);
    return Staff.render({ clef: 'treble', cols: toks.map(t => ({ notes: [t], dur: 'q' })), colW: 36, label: 'Staff notation: ' + toks.join(', ') });
  } catch (e) { return ''; }
}
function labChord() {
  let oct = 4, m = E.chordMidi(lab.root, lab.quality, oct, lab.inv);
  if (Math.max.apply(null, m) > 84) { oct = 3; m = E.chordMidi(lab.root, lab.quality, oct, lab.inv); }
  return { midis: m, oct };
}
function viewLab() {
  const notesN = E.QUALITIES[lab.quality].iv.length;
  if (lab.inv >= notesN) lab.inv = 0;
  const tabs = [['play', 'Free play'], ['chords', 'Chord explorer'], ['scales', 'Scale explorer']];
  let panel = '';
  if (lab.tab === 'play') {
    panel = '<div class="card"><div class="vstaff" id="labstaff" aria-live="off"><p class="tiny vhint">Play a note and it appears on the staff here.</p></div></div><div class="card"><div class="detect" aria-live="polite"><p class="eyebrow">Chord detector</p><div class="dchord" id="dchord">Play three or more notes</div><div class="dnotes tiny" id="dnotes"></div></div><p class="muted">Press keys on the screen or use the middle row of your computer keyboard: the keys where A S D F G H J K sit on an English keyboard play C D E F G A B C, and the row above (W E T Y U) plays the black keys. Notes you play within about three seconds are read together as a chord. Hold <b>Shift</b> (or use the Sustain pedal button, or a MIDI foot pedal) to sustain notes like a piano pedal.</p><div class="row wrap"><button class="btn ghost sm" data-act="labclear">Clear</button><button class="btn ghost sm" id="sustainbtn" type="button" data-act="sustaintoggle" aria-pressed="' + Snd.pedalState() + '">Sustain pedal</button>' + (Midi.supported ? (Midi.status === 'ready' ? '<span class="tiny">MIDI: ' + esc(Midi.names.join(', ')) + '</span>' : '<button class="btn ghost sm" data-act="midiconnect">Connect MIDI keyboard</button>') : '') + '</div></div>';
  } else if (lab.tab === 'chords') {
    const cm = labChord().midis, sym = E.chordSymbol(lab.root, lab.quality), names = E.chordNames(lab.root, lab.quality), riK = romanInKey(lab.root, lab.quality, lab.key);
    const iv = E.QUALITIES[lab.quality].iv.map(([s]) => s);
    panel = '<div class="card"><p class="eyebrow">Root</p><div class="chips">' + KEY_NAMES.map(r => '<button type="button" class="chip' + (r === lab.root ? ' on' : '') + '" data-act="labroot" data-v="' + r + '">' + fmt(r) + '</button>').join('') + '</div>' +
      QGROUPS.map(g => '<p class="eyebrow">' + g[0] + '</p><div class="chips">' + g[1].map(q => '<button type="button" class="chip' + (q === lab.quality ? ' on' : '') + '" data-act="labq" data-v="' + q + '">' + esc(E.QUALITIES[q].sym || 'major') + '</button>').join('') + '</div>').join('') +
      '<p class="eyebrow">Inversion</p><div class="seg">' + Array.from({ length: Math.min(notesN, 4) }, (_, i) => '<button type="button" class="' + (i === lab.inv ? 'on' : '') + '" data-act="labinv" data-v="' + i + '">' + ['Root', '1st', '2nd', '3rd'][i] + '</button>').join('') + '</div></div>' +
      '<div class="card"><div class="vstaff" id="labstaff">' + labStaffHtml('chord') + '</div></div>' +
      '<div class="card"><div class="chordout"><span class="csym mono">' + esc(sym) + (lab.inv ? '<small>/' + esc(fmt(names[lab.inv])) + '</small>' : '') + '</span><span class="muted">' + esc(E.QUALITIES[lab.quality].label) + '</span></div>' +
      '<p><b>Notes:</b> <span class="mono">' + names.map(fmt).join(' – ') + '</span></p><p class="tiny">Tone labels on the keys: R root, 3 third, 5 fifth, 7 seventh, 9 ninth. Distances from the root in half steps: ' + iv.join(', ') + '.</p>' +
      '<div class="row wrap"><button class="btn primary" data-act="labplay" data-mode="block">' + icon('play') + 'Play chord</button><button class="btn ghost" data-act="labplay" data-mode="arp">Arpeggio</button></div>' +
      '<div class="keyrow"><label for="labkey">In the key of</label>' + selectHtml('labkey', keyOptions, lab.key, 'labkey') + '</div>' +
      '<p><b>' + esc(sym) + '</b> is ' + (riK.diatonic ? 'the <b class="mono">' + esc(riK.roman) + '</b> chord' : 'the <b class="mono">' + esc(riK.roman) + '</b> chord, borrowed from outside the key,') + ' in ' + esc(fmt(lab.key)) + ' major. Number system: <b class="mono">' + esc(riK.number) + '</b>.</p></div>';
  } else {
    const sc = E.SCALES[lab.stype], notes = E.scaleNotes(lab.sroot, lab.stype);
    panel = '<div class="card"><p class="eyebrow">Key note</p><div class="chips">' + KEY_NAMES.map(r => '<button type="button" class="chip' + (r === lab.sroot ? ' on' : '') + '" data-act="sroot" data-v="' + r + '">' + fmt(r) + '</button>').join('') + '</div>' +
      '<p class="eyebrow">Scale</p><div class="chips">' + Object.keys(E.SCALES).map(k => '<button type="button" class="chip' + (k === lab.stype ? ' on' : '') + '" data-act="stype" data-v="' + k + '">' + esc(E.SCALES[k].label) + '</button>').join('') + '</div></div>' +
      '<div class="card"><div class="vstaff" id="labstaff">' + labStaffHtml('scale') + '</div></div>' +
      '<div class="card"><h3>' + esc(fmt(lab.sroot)) + ' ' + esc(sc.label.toLowerCase()) + '</h3><div class="degs">' + notes.map((n, i) => '<span class="deg"><b class="mono">' + fmt(n) + '</b><small>' + (i + 1) + '</small></span>').join('') + '<span class="deg"><b class="mono">' + fmt(notes[0]) + '</b><small>8</small></span></div>' +
      (lab.sroot === 'C' && lab.stype === 'major' ? '<p class="tiny">Right-hand fingering: 1 2 3 1 2 3 4 5. Left hand: 5 4 3 2 1 3 2 1.</p>' : '') +
      '<div class="row wrap"><button class="btn primary" data-act="splay" data-mode="up">' + icon('play') + 'Play up</button><button class="btn ghost" data-act="splay" data-mode="updown">Up and down</button></div></div>';
  }
  return {
    html: '<div class="screen"><div class="pagehead"><h1>Piano Lab</h1></div><div class="card kbcard"><div id="labkb"></div>' + soundPicker() + '</div><div class="seg wide" role="tablist">' + tabs.map(t => '<button type="button" role="tab" aria-selected="' + (lab.tab === t[0]) + '" class="' + (lab.tab === t[0] ? 'on' : '') + '" data-act="labtab" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' + panel + '</div>',
    mount(root) {
      let focus = 60, hint = null;
      if (lab.tab === 'chords') { const cm = labChord().midis; focus = cm[0]; hint = chordHint({ root: lab.root, quality: lab.quality, inv: lab.inv }, 48, true); hint.midis = cm; const lbl = {}; const rp = E.pcOfName(lab.root); cm.forEach(m => { lbl[m] = E.toneLabel(pcOf(m), rp, lab.quality) || ''; }); hint.labels = lbl; }
      if (lab.tab === 'scales') {
        const mids = E.scaleMidis(lab.sroot, lab.stype, 4, true), lbl = {}; const n = E.SCALES[lab.stype].iv.length;
        mids.forEach((m, i) => { lbl[m] = String(i === n ? 1 : i + 1); }); hint = { midis: mids, labels: lbl }; focus = mids[0];
      }
      const piano = Piano($('#labkb', root), { lo: 48, hi: 84, names: S.prefs.names, minKey: 38, height: 190, focus });
      if (hint) piano.hint(hint);
      const cl = [];
      if (lab.tab === 'play') {
        let buf = [];
        const dEl = $('#dchord', root), nEl = $('#dnotes', root);
        const unlisten = Input.listen(ev => {
          const now = performance.now(); buf = buf.filter(b => now - b.t < 3000 && b.m !== ev.midi); buf.push({ m: ev.midi, t: now });
          const midis = buf.map(b => b.m), id = E.identifyChord(midis);
          nEl.textContent = 'Notes: ' + midis.slice().sort((a, b) => a - b).map(m => fmt(E.midiName(m))).join('  ');
          if (id) { dEl.textContent = id.name; dEl.classList.add('hit'); }
          else { dEl.textContent = midis.length < 3 ? 'Play three or more notes' : 'No standard chord found'; dEl.classList.remove('hit'); }
          lab.last = buf;
          const ls = $('#labstaff', root); if (ls) ls.innerHTML = midis.length ? Staff.render({ clef: 'grand', cols: [{ notes: midis.slice().sort((a, b) => a - b).map(m => E.midiName(m)), dur: 'w' }] }) : '';
        });
        lab.clear = () => { buf = []; dEl.textContent = 'Play three or more notes'; dEl.classList.remove('hit'); nEl.textContent = ''; };
        cl.push(unlisten);
      }
      return () => { cl.forEach(f => f()); piano.destroy(); };
    }
  };
}
function labPlay(mode) {
  const cm = labChord().midis;
  Snd.play(mode === 'arp' ? { events: E.arpEvents(cm, 0.5).concat([E.blockEvent(cm, cm.length * 0.5 + 0.2, 2.5)]), bpm: 90, total: cm.length * 0.5 + 2.7 } : { events: [E.blockEvent(cm, 0, 2.6)], bpm: 90, total: 2.6 }, { speed: S.prefs.speed === 'slow' ? 0.7 : 1, inst: () => Snd.inst() });
}
function scalePlay(mode) {
  const up = E.scaleMidis(lab.sroot, lab.stype, 4, true), seq = mode === 'updown' ? up.concat(up.slice(0, -1).reverse()) : up;
  const sc = { events: E.seqEvents(seq, 0.5), bpm: 100 }; sc.total = seq.length * 0.5;
  const piano = [...Input.pianos][0];
  Snd.play(sc, { speed: S.prefs.speed === 'slow' ? 0.7 : 1, inst: () => Snd.inst(), onStep: (e, on) => e.notes.forEach(m => piano && piano.mark(m, on)) });
}

/* ---------------------------------------------------------------- PRACTICE */
/* the technique row appears once the learner has reached the gospel turnaround (it uses seventh-chord voicings) */
const techReady = () => isDone('g-turnaround') || isDone('two-five-one');
function techRow(t) {
  if (!techReady() || S.profile.instrument === 'guitar') return '';
  const k = keyOfDay();
  return '<li class="' + (t.items.tech ? 'done' : '') + '"><span class="tick">' + (t.items.tech ? icon('check') : '') + '</span><div><b>Technique: ' + esc(fmt(k)) + ' major, the key of the day</b><span class="tiny">Scale, arpeggio and ii – V – I, about ten minutes</span></div><button class="btn ' + (t.items.tech ? 'ghost' : 'primary') + ' sm" type="button" data-act="pview" data-view="technique">' + (t.items.tech ? 'Again' : 'Start') + '</button></li>';
}
function viewPractice() {
  const p = route.params || {}, view = p.view || 'hub';
  const back = '<button class="btn ghost sm" type="button" data-act="pview" data-view="hub">' + icon('back') + 'Practice</button>';
  if (view === 'warm') {
    const plan = warmupPlan();
    return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>Warm-up: ' + esc(plan.title) + '</h1></div><div class="card"><div id="exh"></div></div></div>', mount(root) {
      return mountExercise($('#exh', root), plan.ex, { onDone: () => { if (!ensureToday().items.warm) { markToday('warm'); award(10, 'warm-up'); } } }).destroy;
    } };
  }
  if (view === 'ear') {
    const T = E.EAR_TYPES[p.type];
    return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>Ear training: ' + esc(T.label) + '</h1><p class="muted">' + esc(T.hint) + '</p></div><div class="card"><div id="ear"></div></div></div>', mount(root) { return mountEar($('#ear', root), p.type); } };
  }
  if (view === 'sprint') {
    return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>' + (p.kind === 'note' ? 'Note finder' : 'Chord sprint') + '</h1><p class="muted">' + (p.kind === 'note' ? '60 seconds. Find as many notes as you can, any octave.' : '90 seconds. Play the chord shown, any octave. Notes you play within a few seconds count together.') + '</p></div><div class="card"><div id="spr"></div></div></div>', mount(root) { return mountSprint($('#spr', root), p.kind); } };
  }
  if (view === 'review') {
    const due = reviewDue();
    if (!due.length) {
      const nx = reviewNext();
      return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>Review</h1></div><div class="card"><h3>Nothing is due right now</h3><p class="muted">' + (nx ? 'Your next review is ' + esc(new Date(nx + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })) + '.' : 'Finish a lesson and it will come back here for review.') + '</p></div></div>' };
    }
    return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>Review</h1><p class="muted">A few quick questions on lessons you have finished. Strong answers push the next review further away.</p></div><div class="card"><div id="rv"></div></div></div>', mount(root) {
      const answers = []; let applied = false, weak = [];
      const qz = Quiz($('#rv', root), [], {
        noRetry: true,
        getQuestions: () => { answers.length = 0; applied = false; return buildReview(); },
        onAnswer: (qq, ok) => { answers.push({ lid: qq.lid, ok }); QG.markSeen(qq.lid, qq.k); recordAnswer(C.byId[qq.lid].cat, ok); },
        resultExtra: () => {
          if (!applied) { applied = true; weak = applyReview(answers); if (!ensureToday().items.review) award(10, 'review'); markToday('review'); }
          return weak.length ? '<div class="callout"><p><b>Worth another look</b></p><div class="row wrap">' + weak.map(id => '<button type="button" class="btn ghost sm" data-act="openlesson" data-id="' + id + '">' + esc(C.byId[id].title) + '</button>').join('') + '</div></div>' : '<p class="tiny">Everything you reviewed is solid. These skills will come back later.</p>';
        },
        nextHtml: () => '<button class="btn primary" type="button" data-act="pview" data-view="hub">Done</button>'
      });
      return () => qz.destroy();
    } };
  }
  if (view === 'songbook') return viewSongbook();
  if (view === 'songplay') return viewSongPlay(p);
  if (view === 'sight') {
    return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>Sight-reading</h1><p class="muted">New phrases every time. Read ahead, keep the beat, do not stop to fix mistakes.</p></div><div class="card"><div id="sgh"></div></div></div>', mount(root) { const m = mountSight($('#sgh', root)); return m.destroy; } };
  }
  if (view === 'technique') return viewTechnique(back);
  if (view === 'byear') return viewByEar(back);
  if (view === 'calib') {
    return { html: '<div class="screen narrow"><div class="pagehead">' + back + '<h1>Timing calibration</h1><p class="muted">Every computer, speaker and keyboard adds a small delay. Tap along to twelve clicks and the app measures it, so play-along and tap-along scores are fair.</p></div><div class="card"><div id="cal"></div></div></div>', mount(root) { return mountCalib($('#cal', root)); } };
  }
  if (view === 'metro') {
    return { html: '<div class="screen"><div class="pagehead">' + back + '<h1>Metronome</h1></div><div class="card"><div id="mt"></div></div></div>', mount(root) { return mountMetro($('#mt', root)); } };
  }
  const warm = warmupPlan(), t = ensureToday();
  const earCards = Object.keys(E.EAR_TYPES).map(k => {
    const r = S.ear[k], T = E.EAR_TYPES[k], acc = r && r.total ? pct(r.correct, r.total) : null;
    return '<button type="button" class="tile" data-act="pview" data-view="ear" data-type="' + k + '"><b>' + esc(T.label) + '</b><span class="tiny">' + esc(T.hint) + '</span><span class="meta">Level ' + ((r && r.level) || 1) + (acc !== null ? ' · ' + acc + '% correct' : ' · new') + '</span></button>';
  }).join('');
  const dueN = reviewDue().length, nextRev = reviewNext();
  const nextTxt = nextRev ? 'Next review: ' + new Date(nextRev + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' }) + '.' : 'Finish a lesson and it will come back here for review.';
  /* one "Today" card with the two daily jobs, then the drills grouped under tabs */
  const today = '<section class="card hero-card"><p class="eyebrow">Today</p><ul class="todo">' +
    '<li class="' + (t.items.warm ? 'done' : '') + '"><span class="tick">' + (t.items.warm ? icon('check') : '') + '</span><div><b>Daily exercise: ' + esc(warm.title) + '</b><span class="tiny">' + esc(warm.sub) + '</span></div><button class="btn ' + (t.items.warm ? 'ghost' : 'primary') + ' sm" type="button" data-act="pview" data-view="warm">' + (t.items.warm ? 'Again' : 'Start') + '</button></li>' +
    '<li class="' + (t.items.review ? 'done' : '') + '"><span class="tick">' + (t.items.review ? icon('check') : '') + '</span><div><b>' + (dueN ? 'Review: ' + dueN + ' skill' + (dueN === 1 ? '' : 's') + ' due' : 'Review: nothing due') + '</b><span class="tiny">' + esc(dueN ? 'A few quick questions keep earlier lessons fresh.' : nextTxt) + '</span></div>' + (dueN ? '<button class="btn primary sm" type="button" data-act="pview" data-view="review">Start</button>' : '') + '</li>' + techRow(t) + '</ul></section>';
  const tab = ui.practiceTab || 'ear';
  const tabs = '<div class="seg ptabs" role="tablist" aria-label="Practice areas">' + [['ear', 'Ear training'], ['read', 'Reading and songs'], ['more', 'Challenges and tools']].map(x => '<button type="button" role="tab" class="' + (tab === x[0] ? 'on' : '') + '" aria-selected="' + (tab === x[0]) + '" data-act="ptab" data-t="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
  let panel;
  if (tab === 'read') panel =
    '<section class="card"><p class="eyebrow">Songbook</p><div class="split"><div><h3>Play along</h3><p class="muted">Original pieces with a chord chart, notation and a backing track. ' + Object.keys(S.songbook || {}).length + ' of ' + SONGBOOK.length + ' tried.</p></div><button class="btn primary" data-act="pview" data-view="songbook">Open</button></div></section>' +
    '<section class="card"><p class="eyebrow">Reading music</p><div class="split"><div><h3>Sight-reading</h3><p class="muted">Short phrases on the staff that get harder as you improve.' + (S.sight.sessions ? ' Level ' + (S.sight.level || 1) + ' · ' + S.sight.sessions + ' round' + (S.sight.sessions === 1 ? '' : 's') + ' played.' : '') + '</p></div><button class="btn primary" data-act="pview" data-view="sight">Start</button></div></section>';
  else if (tab === 'more') panel =
    '<section class="card"><p class="eyebrow">Challenges</p><div class="tiles two"><button type="button" class="tile" data-act="pview" data-view="sprint" data-kind="note"><b>Note finder</b><span class="tiny">60 seconds, any octave</span><span class="meta">Best ' + S.sprint.note + '</span></button><button type="button" class="tile" data-act="pview" data-view="sprint" data-kind="chord"><b>Chord sprint</b><span class="tiny">90 seconds, major and minor</span><span class="meta">Best ' + S.sprint.chord + '</span></button></div></section>' +
    '<section class="card"><p class="eyebrow">Tools</p><div class="split"><div><h3>Metronome</h3><p class="muted">Steady clicks at any tempo and time signature.</p></div><button class="btn ghost" data-act="pview" data-view="metro">Open</button></div>' +
    '<div class="split" style="margin-top:1rem"><div><h3>Timing calibration</h3><p class="muted">Makes play-along and tap-along scores fair on this computer. ' + (S.prefs.latencyMs ? 'Current setting: ' + S.prefs.latencyMs + ' ms.' : 'Not calibrated yet.') + '</p></div><button class="btn ghost" data-act="pview" data-view="calib">Calibrate</button></div></section>';
  else panel = '<section class="card"><p class="eyebrow">Play by ear</p><div class="split"><div><h3>Play it back</h3><p class="muted">Hear a chord progression, then play it back without hints. Level ' + byState().level + ' of ' + BYEAR_LEVELS.length + '.</p></div><button class="btn primary" data-act="pview" data-view="byear">Start</button></div></section><section class="card"><p class="muted">Eight questions per round. Difficulty rises when you score well and eases when you do not.</p><div class="tiles">' + earCards + '</div></section>';
  return { html: '<div class="screen"><div class="pagehead"><h1>Practice</h1><p class="muted">Short, focused work. A few minutes a day beats one long session.</p></div>' + today + tabs + panel + '</div>' };
}

/* ---------------------------------------------------------------- sight-reading drill */
const SIGHT_LEVELS = [
  null,
  { label: 'Treble clef, five notes', clef: 'treble', key: 0, pool: ['C4', 'D4', 'E4', 'F4', 'G4'], range: [60, 72], phrase: 4, walk: 2 },
  { label: 'Bass clef, five notes', clef: 'bass', key: 0, pool: ['C3', 'D3', 'E3', 'F3', 'G3'], range: [48, 60], phrase: 4, walk: 2 },
  { label: 'Both clefs around middle C', clef: 'grand', key: 0, pool: ['E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'], range: [48, 72], phrase: 4, walk: 2 },
  { label: 'Treble clef in G major', clef: 'treble', key: 1, pool: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5'], range: [65, 79], phrase: 4, walk: 3 },
  { label: 'Both clefs in F major', clef: 'grand', key: -1, pool: ['F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4'], range: [48, 72], phrase: 5, walk: 3 },
  { label: 'Both clefs in D major', clef: 'grand', key: 2, pool: ['D3', 'E3', 'F#3', 'G3', 'A3', 'B3', 'C#4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4'], range: [48, 72], phrase: 5, walk: 4 }
];
function mountSight(host) {
  const sg = S.sight, cleanups = [];
  let mount = null;
  function round() {
    if (mount) { mount.destroy(); mount = null; }
    const lv = clamp(sg.level || 1, 1, SIGHT_LEVELS.length - 1), spec = SIGHT_LEVELS[lv];
    host.innerHTML = '<p class="tiny">Level ' + lv + ' of ' + (SIGHT_LEVELS.length - 1) + ': ' + esc(spec.label) + '. Keep going even if you slip. Strong rounds move you up a level.</p><div id="sgx"></div>';
    const count = 3;
    mount = mountExercise($('#sgx', host), Object.assign({ type: 'read', count, prompt: 'Read each phrase and play it from left to right.' }, spec), {
      hints: false, height: 130,
      onDone: r => {
        const notes = count * spec.phrase, acc = Math.max(0, (notes - r.miss) / notes);
        sg.sessions = (sg.sessions || 0) + 1; sg.notes = (sg.notes || 0) + notes; sg.correct = (sg.correct || 0) + Math.max(0, notes - r.miss);
        let msg;
        if (acc >= 0.9 && lv < SIGHT_LEVELS.length - 1) { sg.level = lv + 1; msg = 'Strong round. Moving up to level ' + sg.level + '.'; }
        else if (acc < 0.6 && lv > 1) { sg.level = lv - 1; msg = 'That was tough. Going back to level ' + sg.level + ' to build speed.'; }
        else msg = acc >= 0.9 ? 'You have reached the top level. Keep the habit going.' : 'Good work. Same level again.';
        sg.best = Math.max(sg.best || 0, lv);
        const today = E.dateStr();
        if (sg.last !== today) { sg.last = today; award(10, 'sight-reading'); }
        touch();
        const box = $('#sgx', host); if (box) box.insertAdjacentHTML('beforeend', '<div class="callout"><p><b>' + Math.round(acc * 100) + '% accurate.</b> ' + esc(msg) + '</p><button class="btn primary" type="button" data-sg="again">Next round</button></div>');
      }
    });
    mount.restart();
  }
  host.addEventListener('click', e => { if (e.target.closest('[data-sg="again"]')) round(); });
  round();
  return { destroy() { if (mount) mount.destroy(); cleanups.forEach(f => f()); } };
}

function mountEar(host, type) {
  const T = E.EAR_TYPES[type], rec = S.ear[type] || (S.ear[type] = { correct: 0, total: 0, level: 1, sessions: 0 });
  const N = 8; let i = 0, ok = 0, q = null, answered = false, piano = null, slow = false, eidx = 0, emiss = 0, picked = -1, edone = false;
  const cleanups = [];
  function stopPiano() { if (piano) { piano.destroy(); piano = null; } }
  function playQ() { if (!q) return; Snd.play({ events: q.events, bpm: q.bpm, total: q.events.reduce((a, e) => Math.max(a, e.t + e.d), 0) }, { speed: slow ? 0.65 : 1 }); }
  function nextQ() {
    q = E.earQuestion(type, rec.level); answered = false; picked = -1; eidx = 0; emiss = 0; edone = false;
    drawQ(); setTimeout(playQ, 150);
  }
  function drawQ() {
    stopPiano();
    const top = '<div class="quiz-top"><span class="tiny">Question ' + (i + 1) + ' of ' + N + ' · Level ' + rec.level + '</span>' + bar(Math.round(i / N * 100)) + '</div>';
    const ctl = '<div class="row wrap"><button class="btn soft" type="button" data-e="play">' + icon('replay') + 'Play again</button><label class="switch"><input type="checkbox" data-e="slow"' + (slow ? ' checked' : '') + '><span>Slow</span></label></div>';
    if (type === 'echo') {
      host.innerHTML = '<div class="quiz">' + top + '<h3 class="qtext">' + esc(q.prompt) + '</h3>' + ctl + '<div class="ex-dots">' + q.echo.map((n, k) => '<span class="pill' + (k < eidx ? ' done' : k === eidx && !edone ? ' cur' : '') + '"></span>').join('') + '</div><div id="ep"></div><p class="ex-fb' + (answered ? '' : '') + '" role="status" aria-live="polite" id="efb"></p></div>';
      piano = Piano($('#ep', host), { lo: 60, hi: 84, names: S.prefs.names, height: 140 });
      return;
    }
    host.innerHTML = '<div class="quiz">' + top + '<h3 class="qtext">' + esc(q.prompt) + '</h3>' + ctl + (q.show ? '<div class="qpiano" id="ep"></div>' : '') +
      '<div class="opts">' + q.options.map((o, n) => '<button type="button" class="opt' + (answered ? (n === q.answer ? ' right' : n === picked ? ' wrong' : '') : '') + '" data-e="pick" data-n="' + n + '"' + (answered ? ' disabled' : '') + '>' + esc(o) + '</button>').join('') + '</div>' +
      (answered ? '<div class="why ' + (picked === q.answer ? 'ok' : 'bad') + '"><b>' + (picked === q.answer ? 'Correct. ' : 'Not quite. ') + '</b>' + esc(q.explain) + '</div><button class="btn primary" type="button" data-e="next">' + (i + 1 >= N ? 'See result' : 'Next question') + '</button>' : '') + '</div>';
    if (answered && q.show) { piano = Piano($('#ep', host), { lo: 60, hi: 84, names: true, readonly: true, height: 100, base: false }); piano.hint({ midis: q.show }); }
  }
  function answer(correct) {
    answered = true; rec.total++; if (correct) { rec.correct++; ok++; }
    touch();
  }
  function end() {
    stopPiano(); Snd.stopAll();
    const acc = ok / N; let note = '';
    if (acc >= 0.85 && rec.level < T.levels) { rec.level++; note = 'Level up. Next round is level ' + rec.level + '.'; }
    else if (acc < 0.5 && rec.level > 1) { rec.level--; note = 'Next round eases back to level ' + rec.level + ' so you can build confidence.'; }
    else note = 'Staying at level ' + rec.level + '.';
    rec.sessions++; markToday('ear'); award(ok * 2, 'ear training'); touch(); checkAch();
    host.innerHTML = '<div class="quiz result"><div class="score">' + Math.round(acc * 100) + '<small>%</small></div><p><b>' + ok + ' of ' + N + ' correct.</b> ' + esc(note) + '</p><div class="row wrap"><button class="btn primary" type="button" data-e="again">Another round</button><button class="btn ghost" type="button" data-act="pview" data-view="hub">Done</button></div></div>';
  }
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-e]'); if (!b) return;
    const a = b.dataset.e;
    if (a === 'play') playQ();
    if (a === 'pick' && !answered) { picked = +b.dataset.n; answer(picked === q.answer); drawQ(); }
    if (a === 'next') { i++; if (i >= N) end(); else nextQ(); }
    if (a === 'again') { i = 0; ok = 0; nextQ(); }
  });
  host.addEventListener('change', e => { if (e.target.dataset.e === 'slow') slow = e.target.checked; });
  cleanups.push(Input.listen(ev => {
    if (type !== 'echo' || !q || edone) return;
    const want = pcOf(q.echo[eidx]), efb = $('#efb', host);
    if (pcOf(ev.midi) === want) {
      eidx++; piano && piano.ok(ev.midi);
      if (eidx >= q.echo.length) {
        edone = true; const good = emiss <= 1; answer(good);
        $$('.pill', host).forEach(p => p.classList.add('done'));
        if (efb) { efb.className = 'ex-fb ' + (good ? 'ok' : 'bad'); efb.textContent = (good ? 'Correct. ' : 'Completed with several misses. ') + q.explain; }
        host.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary" type="button" data-e="next">' + (i + 1 >= N ? 'See result' : 'Next question') + '</button></div>');
      } else { $$('.pill', host).forEach((p, k) => { p.classList.toggle('done', k < eidx); p.classList.toggle('cur', k === eidx); }); }
    } else {
      emiss++; piano && piano.bad(ev.midi);
      if (efb) { efb.className = 'ex-fb bad'; efb.textContent = emiss >= 3 ? 'Listen again. ' : 'Not that one.'; }
      if (emiss === 3) playQ();
    }
  }));
  nextQ();
  return () => { stopPiano(); Snd.stopAll(); cleanups.forEach(f => f()); };
}

function mountSprint(host, kind) {
  const secs = kind === 'note' ? 60 : 90; let score = 0, miss = 0, running = false, left = secs, iv = null, target = null, piano = null, buf = [];
  const best = () => S.sprint[kind];
  function newTarget() {
    if (kind === 'note') { let n; do { n = E.pick(KEY_NAMES.concat(['F#', 'C#'])); } while (target && E.pcOfName(n) === E.pcOfName(target)); target = n; }
    else { let r, qq; do { r = E.pick(KEY_NAMES); qq = E.pick(['major', 'minor']); } while (target && target.root === r && target.q === qq); target = { root: r, q: qq }; }
    buf = [];
  }
  function draw() {
    host.innerHTML = '<div class="sprint"><div class="split"><span class="timer mono" id="tm">' + left + 's</span><span class="tiny">Score <b id="sc">' + score + '</b> · Misses ' + miss + ' · Best ' + best() + '</span></div>' +
      (running ? '<div class="find"><span class="sym mono">' + (kind === 'note' ? esc(fmt(target)) : esc(E.chordSymbol(target.root, target.q))) + '</span>' + (kind === 'chord' ? '<span class="tiny">' + esc(E.chordNames(target.root, target.q).map(fmt).join(' ')) + '</span>' : '') + '</div>' : '<div class="find"><span class="tiny">Press Start when you are ready.</span></div>') +
      '<div id="sp"></div><div class="row wrap">' + (running ? '<button class="btn ghost" data-s="skip">Skip</button><button class="btn ghost" data-s="stop">Finish now</button>' : '<button class="btn primary" data-s="start">Start</button>') + '</div></div>';
    if (piano) piano.destroy();
    piano = Piano($('#sp', host), { lo: 60, hi: 84, names: true, minKey: 38, height: 140 });
  }
  function finish() {
    clearInterval(iv); running = false;
    const isBest = score > best(); if (isBest) S.sprint[kind] = score;
    award(Math.min(40, score * 2), 'sprint'); markToday('warm'); touch();
    host.innerHTML = '<div class="quiz result"><div class="score">' + score + '</div><p><b>' + (kind === 'note' ? 'notes found' : 'chords played') + '.</b> ' + (isBest ? 'New personal best.' : 'Your best is ' + best() + '.') + '</p><div class="row wrap"><button class="btn primary" data-s="start">Go again</button><button class="btn ghost" data-act="pview" data-view="hub">Done</button></div></div>';
  }
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    if (b.dataset.s === 'start') { score = 0; miss = 0; left = secs; running = true; newTarget(); draw(); clearInterval(iv); iv = setInterval(() => { left--; const t = $('#tm', host); if (t) t.textContent = left + 's'; if (left <= 0) finish(); }, 1000); }
    if (b.dataset.s === 'skip') { newTarget(); draw(); }
    if (b.dataset.s === 'stop') finish();
  });
  const un = Input.listen(ev => {
    if (!running) return;
    if (kind === 'note') {
      if (pcOf(ev.midi) === E.pcOfName(target)) { score++; newTarget(); draw(); } else { miss++; const el = $('#sc', host); if (el && el.parentElement) el.parentElement.lastChild; }
    } else {
      const now = performance.now(); buf = buf.filter(b => now - b.t < 2500); buf.push({ m: ev.midi, t: now });
      const r = E.compareToChord(buf.map(b => b.m), target.root, target.q);
      if (r.status === 'correct') { score++; newTarget(); draw(); } else if (r.extra.length) { miss++; buf = [ { m: ev.midi, t: now } ]; }
    }
  });
  draw();
  return () => { clearInterval(iv); if (piano) piano.destroy(); un(); };
}

/* Timing calibration: 4 count-in clicks, then 12 clicks to tap along with (screen pad, Space, a computer key or a MIDI key).
   The median gap between each click and the tap nearest to it becomes S.prefs.latencyMs. */
function mountCalib(host) {
  const BPM = 90, spb = 60 / BPM, COUNT = 4, N = 12;
  let metro = null, taps = [], expected = [], iv = null, state = 'idle', result = null;
  function draw() {
    const cur = S.prefs.latencyMs || 0;
    host.innerHTML = '<div class="tapwrap"><div class="tap-pad" role="button" tabindex="0" aria-label="Tap pad">' +
      '<span class="tap-main">' + (state === 'run' ? 'Tap' : 'Start') + '</span><span class="tap-sub">' + (state === 'run' ? 'with every click' : 'then tap with each click') + '</span></div>' +
      '<div class="tap-count" id="calc" aria-live="polite"></div></div>' +
      '<p class="tiny">Use whatever you play with: tap the pad, press Space, play a computer key or a key on your MIDI keyboard. Current setting: ' + cur + ' ms.</p>' +
      (result ? (result.ok ? '<div class="callout"><p><b>Measured delay: ' + result.ms + ' ms</b> (' + result.n + ' taps, spread ' + result.spread + ' ms).</p>' +
        (result.spread > 80 ? '<p class="tiny">Your taps varied quite a lot. Try once more, keeping a steady pulse.</p>' : '') +
        '<div class="row wrap"><button class="btn primary" type="button" data-c="save">Use this setting</button><button class="btn ghost" type="button" data-c="again">Try again</button></div></div>'
        : '<p class="tag warn" role="alert">' + esc(result.msg) + '</p>') : '') +
      (cur ? '<button class="btn ghost sm" type="button" data-c="zero">Reset to 0 ms</button>' : '');
  }
  function stop() { if (iv) { clearInterval(iv); iv = null; } if (metro) { metro.stop(); metro = null; } }
  function begin() {
    Snd.ensure();
    metro = Snd.metro({ bpm: BPM, bpb: 4, limit: COUNT + N });
    if (!metro) { result = { ok: false, msg: 'Sound is not available, so the calibration cannot run.' }; draw(); return; }
    taps = []; result = null; state = 'run';
    expected = Array.from({ length: N }, (_, i) => metro.t0 + (COUNT + i) * spb);
    draw();
    iv = setInterval(() => {
      const now = Snd.now(), el = $('#calc', host), beat = (now - metro.t0) / spb;
      if (el) el.textContent = beat < COUNT ? 'Count-in ' + (Math.floor(Math.max(0, beat)) + 1) : 'Click ' + Math.min(N, Math.floor(beat - COUNT) + 1) + ' of ' + N;
      if (now > expected[N - 1] + spb) finish();
    }, 50);
  }
  function finish() {
    stop(); state = 'idle';
    const gaps = [];
    expected.forEach(t => { let best = null; taps.forEach(x => { if (best === null || Math.abs(x - t) < Math.abs(best - t)) best = x; }); if (best !== null && Math.abs(best - t) < spb * 0.45) gaps.push((best - t) * 1000); });
    if (gaps.length < 6) { result = { ok: false, msg: 'Not enough taps landed near the clicks. Press Start and tap with each click you hear.' }; draw(); return; }
    gaps.sort((a, b) => a - b);
    const med = gaps[Math.floor(gaps.length / 2)];
    result = { ok: true, ms: Math.round(clamp(med, -300, 300)), n: gaps.length, spread: Math.round(gaps[Math.floor(gaps.length * 0.85)] - gaps[Math.floor(gaps.length * 0.15)]) };
    draw();
  }
  function tap(at) {
    Act.last = Date.now();
    if (state === 'idle') { if (!result || !result.ok) begin(); return; }
    taps.push(at === undefined ? Snd.now() : at);
    const p = $('.tap-pad', host); if (p) { p.classList.add('hit'); setTimeout(() => p.classList.remove('hit'), 90); }
  }
  host.addEventListener('pointerdown', e => { if (e.target.closest('.tap-pad')) { e.preventDefault(); tap(); } });
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    if (b.dataset.c === 'save') { S.prefs.latencyMs = result.ms; touch(); toast('Timing set to ' + result.ms + ' ms.'); result = null; draw(); }
    else if (b.dataset.c === 'again') { result = null; draw(); begin(); }
    else if (b.dataset.c === 'zero') { S.prefs.latencyMs = 0; touch(); draw(); }
  });
  const onKey = e => { if (e.repeat || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)) return; if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); tap(); } };
  window.addEventListener('keydown', onKey);
  const off = Input.listen(ev => tap(ev.ctx));
  draw();
  return () => { stop(); window.removeEventListener('keydown', onKey); off(); };
}
function mountMetro(host) {
  let bpm = S.prefs.bpm || 80, bpb = 4, m = null, beat = -1;
  function draw() {
    host.innerHTML = '<div class="metro"><div class="bpm"><button class="btn ghost" data-m="-5" aria-label="Slower">−5</button><div class="bpmn"><b class="mono" id="bpmv">' + bpm + '</b><span class="tiny">BPM</span></div><button class="btn ghost" data-m="+5" aria-label="Faster">+5</button></div>' +
      '<input type="range" id="bpmr" min="40" max="200" value="' + bpm + '" aria-label="Tempo"><div class="beats" id="beats">' + Array.from({ length: bpb }, (_, i) => '<i class="' + (i === 0 ? 'acc' : '') + '"></i>').join('') + '</div>' +
      '<div class="seg" role="group" aria-label="Beats per bar">' + [2, 3, 4, 6].map(n => '<button type="button" class="' + (n === bpb ? 'on' : '') + '" data-m="b' + n + '">' + n + ' beats</button>').join('') + '</div>' +
      '<div class="row"><button class="btn primary lg" data-m="toggle">' + (m ? icon('stop') + 'Stop' : icon('play') + 'Start') + '</button></div><p class="tiny">Time spent here counts as practice time.</p></div>';
  }
  function start() { m = Snd.metro({ bpm, bpb, onBeat: i => { const b = $$('#beats i', host); b.forEach((el, k) => el.classList.toggle('lit', k === i % bpb)); } }); if (!m) toast('Sound is not available.'); }
  function stop() { if (m) { m.stop(); m = null; } $$('#beats i', host).forEach(el => el.classList.remove('lit')); }
  function restart() { if (m) { stop(); start(); } }
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-m]'); if (!b) return; const v = b.dataset.m;
    if (v === 'toggle') { if (m) stop(); else start(); draw(); return; }
    if (v[0] === 'b') { bpb = +v.slice(1); restart(); draw(); return; }
    bpm = clamp(bpm + (v === '+5' ? 5 : -5), 40, 200); S.prefs.bpm = bpm; touch(); $('#bpmv', host).textContent = bpm; $('#bpmr', host).value = bpm; restart();
  });
  host.addEventListener('input', e => { if (e.target.id === 'bpmr') { bpm = +e.target.value; S.prefs.bpm = bpm; $('#bpmv', host).textContent = bpm; restart(); } });
  draw();
  return () => stop();
}
