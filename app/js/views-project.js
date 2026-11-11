'use strict';
/* ---------------------------------------------------------------- Song Lab: the song project studio
   Chords for each section, melodies with takes and a note editor, the whole-song player, a guide track
   recorded in sync, and exports (MIDI, chord chart, audio). The arrangement itself is in studio.js. */
/* the track shown in the recording studio card: '' = the guide (Lead vocal), or an extra track's id */
const curTrack = P => trackOf(P, pst().trk || '') || (pst().trk ? (pst().trk = '', guideOf(P)) : null);
const pst = () => ui.proj || (ui.proj = { sec: 'Chorus', sel: -1, ci: -1, take: null, withGuide: true, tab: 'write' });
const fmtTime = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
const songSeconds = P => Math.round(arrangeSong(P).total * 60 / P.bpm);

function secTabs(P, act) {
  const cur = pst().sec;
  return '<div class="chips sectabs" role="tablist" aria-label="Section">' + SECTION_TYPES.map(t => {
    const n = P.sections[t].degs.length, used = songStructure(P).includes(t), mel = P.melodies[t] && P.melodies[t].notes.length;
    return '<button type="button" role="tab" class="chip' + (t === cur ? ' on' : '') + '" aria-selected="' + (t === cur) + '" data-act="' + act + '" data-s="' + esc(t) + '">' + esc(t) + ' <small>' + n + (act === 'psecm' ? (mel ? ' · ♪' : '') : '') + (used ? '' : ' · not in song') + '</small></button>';
  }).join('') + '</div>';
}
/* ---- picture cards: a drum beat or an instrument, with a "hear it" button ---- */
function beatDots(b) {
  if (!b || !b.n) return '';
  const row = keys => '<span class="bprow" style="--n:' + b.n + '">' + Array.from({ length: b.n }, (_, i) => '<i' + (keys.some(k => (b[k] || []).indexOf(i) >= 0) ? ' class="on"' : '') + '></i>').join('') + '</span>';
  return '<span class="bpat" aria-hidden="true">' + row(['h', 'o']) + row(['s', 'cl', 'r', 'g']) + row(['k']) + '</span>';
}
function beatCard(k, label, cur) {
  const on = k === cur, name = String(label).replace(/\s*\(.*$/, '');
  return '<div class="pickcard' + (on ? ' on' : '') + '"><button type="button" class="pickmain" data-act="pbeatcard" data-v="' + esc(k) + '" aria-pressed="' + on + '" title="' + esc(label) + '"><b>' + esc(name) + '</b>' + beatDots(E.BEATS[k]) + '</button>' +
    (k === 'none' ? '' : '<button type="button" class="pickhear" data-act="pbeathear" data-v="' + esc(k) + '" aria-label="Hear ' + esc(name) + '" title="Hear it">' + icon('play') + '<span>Hear</span></button>') + '</div>';
}
function instCard(i) {
  const on = i.id === Snd.inst();
  return '<div class="pickcard' + (on ? ' on' : '') + '"><button type="button" class="pickmain" data-act="instcard" data-v="' + esc(i.id) + '" aria-pressed="' + on + '" title="Tap to choose it and hear it"><b>' + esc(i.label) + '</b><span class="tiny">' + esc(i.hint || '') + '</span></button></div>';
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
    '<label class="field"><span>Bass sound</span>' + selectHtml('pbasssound', Object.keys(BASS_SOUNDS).map(k => [k, BASS_SOUNDS[k][0]]), P.bassSound || 'finger', 'pbasssound') + '<small class="tiny">' + (Snd.info && Snd.info().bank === 'ready' ? 'Heard with the sound library.' : 'Needs the sound library to be heard; without it the bass uses the piano sound.') + '</small></label>' +
    (P.ts === 4 ? '<label class="field"><span>Swing</span><input type="range" min="0" max="60" value="' + (P.swing || 0) + '" data-bind="pswing" aria-label="Swing"></label>' : '') +
    '<label class="field"><span>Drummer\'s feel</span>' + selectHtml('phuman', [['0', 'Exact (like a machine)'], ['1', 'Light human feel'], ['2', 'Loose human feel']], String(P.human || 0), 'phuman') + '</label>' +
    '<label class="field"><span>Feel of keys and bass</span>' + selectHtml('phumankeys', [['0', 'Exact (like a machine)'], ['1', 'Light human feel'], ['2', 'Loose human feel']], String(P.humanKeys || 0), 'phumankeys') + '</label>' +
    '<div class="field"><span>Busyness</span><div class="seg" role="group" aria-label="Drummer busyness">' + [[-1, 'Calmer'], [0, 'As written'], [1, 'Busier']].map(o => '<button type="button" class="' + ((P.busy | 0) === o[0] ? 'on' : '') + '" aria-pressed="' + ((P.busy | 0) === o[0]) + '" data-act="pbusy" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div></div>' +
    '<label class="field"><span>Percussion on top</span>' + selectHtml('pperc', [['off', 'None'], ['shaker', 'Shaker'], ['tambourine', 'Tambourine'], ['congas', 'Congas'], ['shakercongas', 'Shaker and congas']], P.perc || 'off', 'pperc') + '</label>' +
    '<label class="field"><span>Drum kit</span>' + selectHtml('pkit', [['0', 'Standard'], ['8', 'Room (big, roomy)'], ['16', 'Power (loud, rock)'], ['32', 'Jazz (soft, tight)'], ['40', 'Brushes (very soft)'], ['24', 'Electronic']], String(P.kit || 0), 'pkit') + '</label>' +
    '<label class="switch fillsw"><input type="checkbox" data-bind="pautofill"' + (P.autoFill ? ' checked' : '') + '><span>Automatic drum fills when the song moves to a new section</span></label></div>' +
    '<p class="tiny">Busyness, percussion and fills change the drums of the whole song; you can still add or change a fill for one section in the Song form. The drum kits need the instrument library (the installed app has it); without it the built-in drums play.</p>' +
    '<div class="row wrap"><button class="btn ghost sm" type="button" data-act="pdrumreal">' + icon('plus') + 'Use a real drum recording…</button>' +
    (P.beatWas ? '<button class="btn ghost sm" type="button" data-act="pdrumback">Go back to the built-in drums (' + esc((E.BEATS[P.beatWas] || {}).label || P.beatWas) + ')</button>' : '') +
    '<span class="tiny">A drum loop or a whole drum beat, WAV or MP3: it follows the song\'s tempo and replaces the built-in drums.</span></div>' +
    '<div class="pickblock"><p class="eyebrow">Drums</p><div class="pickgrid" role="group" aria-label="Drum beat">' + beatOpts.map(o => beatCard(o[0], o[1], beatVal)).join('') + '</div>' +
    '<details class="morelist"><summary>Choose the drums from a list</summary><label class="field"><span>Drums</span>' + selectHtml('pbeat', beatOpts, beatVal, 'pbeat') + '</label></details></div>' +
    '<div class="pickblock"><p class="eyebrow">Sound</p><div class="pickgrid" role="group" aria-label="Instrument">' + Snd.instruments().map(i => instCard(i)).join('') + '</div>' +
    '<details class="morelist"><summary>Choose the sound from a list</summary>' + soundPicker() + '</details></div>' +
    '<p class="tiny">Sections play with their own energy: the intro and outro are gentle, the chorus is fullest.</p></section>';
}
/* ---- loops and beats: import audio loops, whole beats and MIDI files; the app's own parts can be switched off ---- */
function loopsCard(P) {
  const loops = P.loops || [], used = [...new Set(songStructure(P))], mix = mixerOf(P);
  const kindLabel = { loop: 'Loop', beat: 'Beat (whole backing)', midi: 'MIDI' };
  const row = (L, i) => {
    const info = L.kind === 'midi' ? (L.midi ? L.midi.notes.length + ' notes, ' + L.midi.drums.length + ' drum hits' : '') : (Math.round(L.bpm * 10) / 10) + ' BPM' + (Math.abs(L.bpm - P.bpm) > 0.05 ? ' → stretched to ' + P.bpm + ' (pitch kept)' : ' (the song\'s tempo)');
    const keyTxt = L.keyPc !== undefined && L.keyPc !== null ? ' · key ' + E.pcName(L.keyPc) + (L.minor ? 'm' : '') : '';
    return '<li class="looprow' + (L.mute ? ' muted' : '') + '"><div class="split"><span><b>' + esc(L.name) + '</b> <span class="tag">' + kindLabel[L.kind] + '</span> <span class="tiny">' + esc(info) + ' · ' + (L.kind === 'beat' ? fmtTime(L.dur || 0) : L.beats + ' beats') + esc(keyTxt) + '</span></span>' +
      '<span class="row wrap"><button class="btn ghost sm" type="button" data-lp="hear" data-i="' + i + '">' + icon('play') + 'Hear</button><label class="switch"><input type="checkbox" data-bind="plmute" data-i="' + i + '"' + (L.mute ? ' checked' : '') + '><span>Mute</span></label><button class="btn ghost sm" type="button" data-act="pldel" data-i="' + i + '">Delete</button></span></div>' +
      '<div class="grid4">' +
      (L.kind !== 'midi' ? '<label class="field"><span>Its tempo (BPM)</span><span class="row"><input type="number" min="40" max="240" step="0.1" value="' + (Math.round(L.bpm * 100) / 100) + '" data-bind="plbpm" data-i="' + i + '" aria-label="Tempo of ' + esc(L.name) + '"><button class="btn ghost sm" type="button" data-act="plhalf" data-i="' + i + '" title="Half">½</button><button class="btn ghost sm" type="button" data-act="pldouble" data-i="' + i + '" title="Double">×2</button></span></label>' : '') +
      (L.role !== 'drums' ? '<label class="field"><span>Transpose</span><select data-bind="pltr" data-i="' + i + '">' + Array.from({ length: 25 }, (_, k) => k - 12).map(t => '<option value="' + t + '"' + (t === (L.tr || 0) ? ' selected' : '') + '>' + (t > 0 ? '+' : '') + t + (t ? ' semitone' + (Math.abs(t) > 1 ? 's' : '') : ' (as recorded)') + '</option>').join('') + '</select></label>' : '') +
      '<label class="field"><span>Volume</span><input type="range" min="0" max="150" value="' + Math.round((L.gain == null ? 1 : L.gain) * 100) + '" data-bind="plgain" data-i="' + i + '"></label>' +
      '<label class="field"><span>Kind</span><select data-bind="plrole" data-i="' + i + '"><option value="music"' + (L.role !== 'drums' ? ' selected' : '') + '>Music (follows the key)</option><option value="drums"' + (L.role === 'drums' ? ' selected' : '') + '>Drums (never transposed)</option></select></label>' +
      (L.kind === 'midi' && L.midi && L.midi.notes.length ? '<label class="field"><span>Plays on</span><select data-bind="plinst" data-i="' + i + '">' + Snd.instruments().map(x => '<option value="' + x.id + '"' + (x.id === (L.inst || 'piano') ? ' selected' : '') + '>' + esc(x.label) + '</option>').join('') + '</select></label>' : '') + '</div>' +
      (L.kind === 'beat'
        ? '<div class="row wrap"><label class="field"><span>Bar 1 starts at <b class="mono" id="lpoff' + i + '">' + (L.offset || 0).toFixed(2) + '</b> s into the beat</span><input type="range" min="0" max="8" step="0.01" value="' + (L.offset || 0) + '" data-bind="ploff" data-i="' + i + '"></label>' +
          (Math.abs(L.bpm - P.bpm) > 0.05 ? '<button class="btn primary sm" type="button" data-act="plusebpm" data-i="' + i + '">Use the beat\'s tempo for the song (' + Math.round(L.bpm) + ' BPM)</button>' : '') +
          (L.keyPc !== undefined && L.keyPc !== null && L.role !== 'drums' ? '<button class="btn ghost sm" type="button" data-act="plusekey" data-i="' + i + '">Set the song to the beat\'s key (' + E.pcName(L.minor ? (L.keyPc + 3) % 12 : L.keyPc) + ')</button>' : '') + '</div><p class="tiny">A beat runs under the whole song from bar 1. Build your form (Step 4) to match its length; set the app\'s own drums, bass or chords off below if the beat already has them.</p>'
        : '<div class="field"><span>Plays in</span><div class="chips">' + SECTION_TYPES.map(t => '<label class="chip' + ((L.secs || []).includes(t) ? ' on' : '') + '"><input type="checkbox" data-bind="plsec" data-i="' + i + '" data-s="' + esc(t) + '"' + ((L.secs || []).includes(t) ? ' checked' : '') + '> ' + esc(t) + (used.includes(t) ? '' : ' <small>(not in song)</small>') + '</label>').join('') + '</div></div>') + '</li>';
  };
  return '<section class="card"><p class="eyebrow">Loops and beats</p><h3>Import loops, beats and MIDI</h3>' +
    '<p class="muted">Bring in a drum loop, a keys or guitar loop, a whole beat, or a MIDI file. Loops follow your song: they are stretched to its tempo without changing their pitch, moved into its key, and they move with a key change. Tick the sections each loop plays in.</p>' +
    '<div class="row wrap"><button class="btn primary sm" type="button" data-act="plimport">' + icon('plus') + 'Import loops, beats or MIDI…</button><span class="tiny">WAV, MP3, OGG, M4A or MIDI (.mid). Up to ' + MAX_LOOPS + ' per song.</span></div>' +
    '<input id="loopfile" type="file" accept="audio/*,.wav,.mp3,.ogg,.m4a,.flac,.mid,.midi,audio/midi" multiple hidden data-bind="plfiles">' +
    '<p class="tiny" id="loopinfo" aria-live="polite">' + (loops.length ? '' : 'No loops yet. The tempo and key are read from the file name when they are in it (for example Keys_92bpm_Cm.wav), otherwise the tempo is measured.') + '</p>' +
    (loops.length ? '<ol class="looplist">' + loops.map(row).join('') + '</ol>' : '') +
    '<div class="field"><span>The app\'s own parts</span><div class="row wrap">' + ['chords', 'bass', 'drums', 'melody'].map(k => '<label class="switch"><input type="checkbox" data-bind="pmix" data-k="' + k + '"' + (!mix[k].mute ? ' checked' : '') + '><span>' + esc(MIX_PARTS[k]) + '</span></label>').join('') + '</div><p class="tiny">These are the Mute buttons of the Mixer below.</p></div>' +
    '<p class="tiny">Only use loops and beats you have the right to use: your own, royalty-free packs, or a beat you have licensed.' + (kbdOutOn() ? ' Loops play on the computer, not through the keyboard.' : '') + '</p></section>';
}
/* where the Song Lab plays: the computer, or the keyboard's own speakers and sounds (MIDI out) */
const kbdOutOn = () => !!(S.prefs.kbdOut && S.prefs.kbdOut.on) && MidiOut.ready();
function kbdOutRow() {
  const k = S.prefs.kbdOut || {}, conn = typeof Midi !== 'undefined' && Midi.status === 'ready';
  return '<div class="row wrap kbdout"><label class="field"><span>Play through</span><select data-bind="pkbdout"><option value="">Computer speakers</option><option value="1"' + (k.on ? ' selected' : '') + '>My keyboard (its own sounds)</option></select></label>' +
    (k.on ? '<label class="field"><span>Chord sound on the keyboard</span><select data-bind="pkbdprog">' + KBD_SOUNDS.map(x => '<option value="' + x[0] + '"' + ((k.prog || 0) === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>').join('') + '</select></label>' +
      (conn ? '<button class="btn ghost sm" type="button" data-act="pkbdtest">' + icon('play') + 'Test the keyboard sound</button>' : '<button class="btn primary sm" type="button" data-act="midiconnect">Connect your keyboard</button>') : '') +
    (k.on ? '<p class="tiny">' + (conn && MidiOut.ready() ? 'The song plays from ' + esc(MidiOut.name()) + ': chords, bass, melody and drums on their own channels, so your own playing on the keyboard is not changed.' : 'Connect the keyboard by USB, then press Connect. Until then the song plays on the computer.') + '</p>' : '') + '</div>';
}
/* ---- chords: the strip of a section's chords, the editor for the chosen one, the palette and suggestions ---- */
const beatsLabel = (b, bar) => (b === bar ? '1 bar' : b % bar === 0 ? (b / bar) + ' bars' : b === 0.5 ? '½ beat' : (b % 1 ? (Math.floor(b) ? Math.floor(b) : '') + '½' : b) + (b === 1 ? ' beat' : ' beats'));
const chordKey = c => c.r + ':' + c.q + ':' + (c.b === null || c.b === undefined ? '' : c.b);
function chordChip(P, c, act, extra) {
  const d = Songcraft.describe(P.key, c);
  return '<button type="button" class="chip-btn" data-act="' + act + '" data-r="' + c.r + '" data-q="' + esc(c.q) + '" data-b="' + (c.b === null || c.b === undefined ? '' : c.b) + '"' + (c.hint || c.why ? ' title="' + esc(c.hint || c.why) + '"' : '') + (extra || '') + '><b class="mono">' + esc(d.name) + '</b><span>' + esc(d.number) + '</span></button>';
}
/* the chords to choose from, in the flavour you pick: plain, 7th, 9th, add9, sus, 6th or the gospel colours */
const CHORD_FLAVOURS = [
  ['plain', 'Plain', ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'], 'major'],
  ['seventh', '7th', ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'], '7'],
  ['ninth', '9th', ['maj9', 'm9', 'm7', 'maj9', '9', 'm9', 'm7b5'], '9'],
  ['add9', 'Add9', ['add9', 'madd9', 'madd9', 'add9', 'add9', 'madd9', 'dim'], 'add9'],
  ['sus4', 'Sus4', ['sus4', 'sus4', 'sus4', 'sus4', 'sus4', 'sus4', 'sus4'], 'sus4'],
  ['sus2', 'Sus2', ['sus2', 'sus2', 'sus2', 'sus2', 'sus2', 'sus2', 'sus2'], 'sus2'],
  ['sixth', '6th', ['6', 'm7', 'm7', '6', '7', 'm6', 'm7b5'], '6'],
  ['gospel', 'Gospel colour', ['maj9', 'm9', 'm7', 'maj9', '13', 'm9', 'm7b5'], '9']
];
function flavourHtml(P) {
  const id = pst().flav || (P.sev ? 'seventh' : 'plain'), F = CHORD_FLAVOURS.find(f => f[0] === id) || CHORD_FLAVOURS[0];
  const dia = Songcraft.SCALE.map((r, i) => ({ r, q: F[2][i], b: null, hint: '' })), others = Array.from({ length: 12 }, (_, r) => r).filter(r => !Songcraft.SCALE.includes(r)).map(r => ({ r, q: F[3], b: null, hint: 'Not in the key: a colour chord' }));
  return '<div class="field"><span>Chord flavour</span><div class="chips">' + CHORD_FLAVOURS.map(f => '<button type="button" class="chip-btn' + (f[0] === F[0] ? ' on' : '') + '" aria-pressed="' + (f[0] === F[0]) + '" data-act="pflav" data-f="' + f[0] + '">' + esc(f[1]) + '</button>').join('') + '</div></div>' +
    '<div class="field"><span>In the key of ' + esc(fmt(P.key)) + ' (' + esc(F[1].toLowerCase()) + ')</span><div class="chips">' + dia.map(c => chordChip(P, c, 'pcadd')).join('') + '</div></div>' +
    '<details class="colours"><summary>Other notes (colour chords outside the key)</summary><div class="chips">' + others.map(c => chordChip(P, c, 'pcadd')).join('') + '</div></details>';
}
/* progressions you keep: saved as steps from the key, so they fit any song in any key */
function progsHtml(P) {
  const list = S.progs || [], cur = P.sections[pst().sec].chords;
  return '<details class="colours" id="progcard"' + (pst().progsOpen ? ' open' : '') + '><summary>My saved progressions (' + list.length + ')</summary>' +
    '<div class="row wrap"><label class="field"><span>Name for this ' + esc(pst().sec.toLowerCase()) + '\'s chords</span><input type="text" maxlength="60" id="progname" value="' + esc(pst().progName || '') + '" data-bind="pprogname" placeholder="e.g. Sunday opening"></label>' +
    '<button class="btn ghost sm" type="button" data-act="psaveprog"' + (cur.length ? '' : ' disabled') + '>Save these ' + cur.length + ' chords</button></div>' +
    (list.length ? '<ul class="lessons">' + list.map(x => '<li class="lrow"><div class="lmain"><b>' + esc(x.name) + '</b><span class="tiny">' + esc(x.chords.map(c => Songcraft.describe(P.key, c).name).join('  ')) + '</span></div>' +
      '<span class="row wrap"><button class="btn ghost sm" type="button" data-act="pprogreplace" data-id="' + esc(x.fid) + '">Use (replace)</button><button class="btn ghost sm" type="button" data-act="pprogadd" data-id="' + esc(x.fid) + '">Add to the end</button><button class="btn ghost sm" type="button" data-act="pprogdel" data-id="' + esc(x.fid) + '" aria-label="Delete ' + esc(x.name) + '">' + icon('x') + '</button></span></li>').join('') + '</ul>'
      : '<p class="tiny muted">Nothing saved yet. Build a set of chords you like, give it a name and save it: it is shown here in the key of any song you open.</p>') + '</details>';
}
function chordsCard(P) {
  const st = P.steps, sec = pst().sec, s = P.sections[sec], sc = sectionChords(P, sec), bar = meterOf(P).bar, ci = pst().ci;
  const others = SECTION_TYPES.filter(t => t !== sec), sel = s.chords[ci];
  const strip = '<div class="cstrip" role="list" aria-label="Chords of the ' + esc(sec) + '">' + sc.chs.map((c, i) =>
    '<button type="button" role="listitem" class="cchord' + (i === ci ? ' on' : '') + (c.spec.push && i > 0 ? ' push' : '') + '" style="flex-grow:' + c.spec.beats + '" data-act="pcsel" data-i="' + i + '" aria-pressed="' + (i === ci) + '">' +
    (c.spec.push && i > 0 ? '<i class="pushmark" title="Pushed: arrives half a beat early">‹</i>' : '') + '<b>' + esc(c.name) + '</b><span class="mono">' + esc(c.number) + '</span><small>' + esc(beatsLabel(c.spec.beats, bar)) + '</small></button>').join('') + '</div>';
  let editor = '';
  if (sel) {
    const d = Songcraft.describe(P.key, sel), kp = E.pcOfName(P.key);
    const qOpts = Songcraft.GROUPS.map(([g, qs]) => '<optgroup label="' + esc(g) + '">' + qs.map(q => '<option value="' + esc(q) + '"' + (q === sel.q ? ' selected' : '') + '>' + esc(E.fmt(d.root) + Songcraft.QT[q].sym) + ' · ' + esc(Songcraft.QLABEL[q] || q) + '</option>').join('') + '</optgroup>').join('');
    const bOpts = '<option value="">' + esc(E.fmt(d.root)) + ' (the root, no slash)</option>' + Array.from({ length: 12 }, (_, i) => i).filter(i => i !== sel.r).map(i => { const bd = Songcraft.describe(P.key, { r: sel.r, q: sel.q, b: i }); return '<option value="' + i + '"' + (sel.b === i ? ' selected' : '') + '>' + esc(bd.name) + ' · over ' + esc(bd.number.split('/')[1] || '') + '</option>'; }).join('');
    const lOpts = LEN_CHOICES.map(b => '<option value="' + b + '"' + (b === sel.beats ? ' selected' : '') + '>' + esc(beatsLabel(b, bar)) + '</option>').join('');
    void kp;
    editor = '<div class="ceditor"><p class="eyebrow">Chord ' + (ci + 1) + ' of ' + s.chords.length + ': <b>' + esc(d.name) + '</b> · ' + esc(d.roman) + ' · ' + esc(d.label) + '</p>' +
      '<div class="grid3"><label class="field"><span>Root note (the chord itself)</span><select data-bind="pcr">' + Array.from({ length: 12 }, (_, i) => i).map(i => { const rd = Songcraft.describe(P.key, { r: i, q: sel.q, b: null }); return '<option value="' + i + '"' + (i === sel.r ? ' selected' : '') + '>' + esc(rd.name) + ' · ' + esc(rd.number) + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span>Chord type</span><select data-bind="pcq">' + qOpts + '</select></label>' +
      '<label class="field"><span>Bass note (slash chord)</span><select data-bind="pcb">' + bOpts + '</select></label>' +
      '<label class="field"><span>Length</span><select data-bind="pclen">' + lOpts + '</select></label></div>' +
      '<label class="switch"><input type="checkbox" data-bind="pcpush"' + (sel.push ? ' checked' : '') + (ci === 0 ? ' disabled' : '') + '><span>Push: arrive half a beat early (an anticipation)' + (ci === 0 ? ' — not on the first chord' : '') + '</span></label>' +
      '<div class="row wrap"><button class="btn ghost sm" type="button" data-act="pchear">' + icon('play') + 'Hear it</button><button class="btn ghost sm" type="button" data-act="pcmove" data-d="-1"' + (ci ? '' : ' disabled') + '>◀ Move earlier</button><button class="btn ghost sm" type="button" data-act="pcmove" data-d="1"' + (ci < s.chords.length - 1 ? '' : ' disabled') + '>Move later ▶</button><button class="btn ghost sm" type="button" data-act="pcdel"' + (s.chords.length > 1 ? '' : ' disabled') + '>Delete</button><button class="btn ghost sm" type="button" data-act="pcsel" data-i="-1">Done</button></div></div>';
  }
  const after = sel || s.chords[s.chords.length - 1];
  const sugg = Songcraft.suggest(after, P.sev);
  const newLen = pst().newLen || bar;
  return '<section class="card"><p class="eyebrow">Step 1 ' + (st.prog ? '<span class="tag ok">Done</span>' : '') + '</p><h3>Chords for each section</h3>' +
    '<p class="muted">Any chord you play: sevenths, ninths, thirteenths, slash chords, borrowed and passing chords. Give each chord its own length, and push a chord to make it land early. Up to ' + MAX_SECTION_CHORDS + ' chords per section.</p>' +
    secTabs(P, 'psec') + strip + editor +
    '<p class="tiny"><b>Tap a chord</b> above to change its note, type, bass note, length or push. <b>Drag</b> a chord from the lists below onto a chord above (left edge: before it, right edge: after it, middle: replace it), or drag chords above to reorder them. On a touch screen, touch and hold a moment, then drag.</p>' +
    (sel ? '<div class="field"><span>When you tap a chord in the lists below</span><div class="seg" role="group" aria-label="What a tapped chord does">' + CHORD_MODES.map(([m, l]) => '<button type="button" data-act="pcmode" data-m="' + m + '" aria-pressed="' + ((pst().cmode || 'after') === m) + '" class="' + ((pst().cmode || 'after') === m ? 'on' : '') + '">' + esc(l) + '</button>').join('') + '</div></div>' : '<p class="tiny">New chords go at the end. Choose a chord above to replace it or add next to it.</p>') +
    flavourHtml(P) +
    '<label class="switch"><input type="checkbox" data-bind="psev"' + (P.sev ? ' checked' : '') + '><span>Offer the chords of the key as 7th chords</span></label>' +
    '<div class="field"><span>What could come next' + (after ? ' after ' + esc(Songcraft.describe(P.key, after).name) : '') + '</span><div class="chips">' + sugg.map(c => chordChip(P, c, 'pcadd')).join('') + '</div><p class="tiny">' + esc(sugg.slice(0, 3).map(x => Songcraft.describe(P.key, x).name + ': ' + x.why).join(' · ')) + '</p></div>' +
    progsHtml(P) + anyChordHtml(P) +
    '<details class="colours"' + (pst().colours ? ' open' : '') + '><summary>Gospel colours: passing chords, borrowed chords, slash chords</summary>' + Songcraft.COLOURS.map(([g, list]) => '<div class="field"><span>' + esc(g) + '</span><div class="chips">' + list.map(c => chordChip(P, c, 'pcadd')).join('') + '</div></div>').join('') + '</details>' +
    '<div class="grid2"><label class="field"><span>Length of new chords</span><select data-bind="pnewlen">' + LEN_CHOICES.map(b => '<option value="' + b + '"' + (b === newLen ? ' selected' : '') + '>' + esc(beatsLabel(b, bar)) + '</option>').join('') + '</select></label>' +
    '<label class="field"><span>Copy chords from</span><select data-bind="pcopy"><option value="">Choose a section…</option>' + others.map(t => '<option value="' + esc(t) + '">' + esc(t) + ' (' + P.sections[t].chords.length + ' chords)</option>').join('') + '</select></label></div>' +
    '<div class="row wrap kbdin"><button class="btn ' + (pst().kbin ? 'primary' : 'soft') + ' sm" type="button" id="pkbin">' + icon('piano') + (pst().kbin ? 'Stop playing chords in' : 'Play chords in from your keyboard') + '</button><span class="tiny" id="pkbinfo" aria-live="polite">' + (pst().kbin ? 'Play each chord of the ' + esc(sec) + ' and let go. Any chord is accepted, with its bass note: play F with G in the left hand for F/G.' : '') + '</span></div>' +
    '<div class="row wrap"><button class="btn ghost sm" type="button" data-act="pundo">Remove last</button><button class="btn ghost sm" type="button" data-act="psecplay">' + icon('play') + 'Loop ' + esc(sec) + '</button>' +
    '<button class="btn ' + (st.prog ? 'ghost' : 'primary') + ' sm" type="button" data-act="pstep" data-k="prog"' + (P.sections.Chorus.chords.length >= 2 ? '' : ' disabled') + '>' + (st.prog ? 'Marked done' : 'Mark step done') + '</button></div>' +
    '<p class="tiny">' + esc(sec) + ': ' + sc.chords.length + ' chords, ' + (Math.round(sc.beats / bar * 10) / 10) + ' bars.</p></section>';
}
const wordsFrom = (P, sec) => { const k = { Chorus: 'chorus', Verse: 'verse', Bridge: 'bridge' }[sec]; return k && P.lyrics && P.lyrics[k] && P.lyrics[k].trim() ? P.lyrics[k].trim() : ''; };
function melodyCard(P) {
  const st = P.steps, sec = pst().sec, mel = P.melodies[sec], take = pst().take && pst().take.sec === sec ? pst().take : null, takes = P.takes[sec] || [];
  const any = SECTION_TYPES.some(t => P.melodies[t] && P.melodies[t].notes.length >= 4);
  return '<section class="card"><p class="eyebrow">Step 2 ' + (st.melody ? '<span class="tag ok">Done</span>' : '') + '</p><h3>Write a melody</h3>' +
    '<p class="muted">Choose a section. <b>Play it in</b> on your keyboard, the screen keys or the computer keys, or <b>Sing it in</b> through the microphone. One bar of clicks, then that section\'s chords play. Hold each note as long as you want it to last.</p>' +
    secTabs(P, 'psecm') + '<div class="vpiano" id="melpiano"></div>' +
    '<div class="row wrap"><button class="btn primary" type="button" id="melrec">' + icon('piano') + 'Play it in: ' + esc(sec) + '</button><button class="btn primary" type="button" id="melsing">' + icon('mic') + 'Sing it in</button><button class="btn ghost" type="button" data-act="pmelplay">' + icon('play') + 'Play with chords</button>' +
    (mel && mel.notes.length ? '<button class="btn ghost" type="button" data-act="pmelclear">Clear melody</button>' : '') + '</div>' +
    '<div class="grid2"><label class="field"><span>While you sing</span><select data-bind="psingback"><option value="chords"' + (pst().singBack !== 'click' ? ' selected' : '') + '>Hear the chords and the click (wear headphones)</option><option value="click"' + (pst().singBack === 'click' ? ' selected' : '') + '>Hear the click only (no headphones needed)</option></select></label>' +
    '<label class="switch"><input type="checkbox" data-bind="psnap"' + (pst().snap !== false ? ' checked' : '') + '><span>Keep sung notes in the key</span></label></div>' +
    '<p class="tiny">Sing it in: hum or sing on "la" after the count-in, one clear note at a time, close to the microphone. The app writes down your notes on a half-beat grid. Then fix any note in the editor below.</p>' +
    '<p class="tiny" id="melinfo" aria-live="polite">' + (mel && mel.notes.length ? mel.notes.length + ' notes in the ' + esc(sec) + ' melody.' : 'No ' + esc(sec) + ' melody yet.') + '</p>' +
    '<label class="field"><span>Words under the melody (' + esc(sec) + ')</span><textarea rows="3" data-bind="pwords" placeholder="Hal-le-lu-jah, praise the Lord _">' + esc((P.words || {})[sec] || '') + '</textarea></label>' +
    '<p class="tiny">One syllable goes under each note, in order. Put hyphens between syllables (Hal-le-lu-jah) — other words are split for you — and an underscore _ to hold a syllable over the next note (a run). ' + (wordsFrom(P, sec) ? '<button type="button" class="btn ghost sm" data-act="pwordsfrom">Use the ' + esc(sec.toLowerCase()) + ' lyrics from Step 3</button>' : '') + '</p>' +
    (take ? '<div class="callout"><p><b>New take: ' + take.notes.length + ' notes.</b> Listen, then keep it or try again.</p><div class="row wrap"><button class="btn ghost sm" type="button" data-act="ptakeplay">' + icon('play') + 'Hear the new take</button><button class="btn primary sm" type="button" data-act="ptakekeep">Keep this take</button><button class="btn ghost sm" type="button" data-act="ptakedrop">Discard</button></div></div>' : '') +
    (takes.length ? '<p class="tiny">Earlier takes: ' + takes.map((t, i) => '<button type="button" class="btn ghost sm" data-act="ptakeuse" data-i="' + i + '">Take ' + (i + 1) + ' (' + t.notes.length + ' notes)</button>').join(' ') + '</p>' : '') +
    '<div class="roll-wrap"><div class="split"><b>Note editor</b><span class="tiny" id="rollsel" aria-live="polite">Click the grid to add a note, click a note to select it.</span></div><div class="roll" id="roll"></div>' +
    '<div class="row wrap roll-tools" role="group" aria-label="Edit the selected note">' + [['left', '◀ Earlier'], ['right', 'Later ▶'], ['up', '▲ Higher'], ['down', '▼ Lower'], ['short', 'Shorter'], ['long', 'Longer'], ['del', 'Delete']].map(b => '<button type="button" class="btn ghost sm" data-roll="' + b[0] + '">' + b[1] + '</button>').join('') + '</div>' +
    '<p class="tiny">Keys: arrows move the selected note, Shift + left or right changes its length, Delete removes it.</p></div>' +
    '<div class="row wrap"><button class="btn ' + (st.melody ? 'ghost' : 'primary') + ' sm" data-act="pstep" data-k="melody"' + (any ? '' : ' disabled') + '>' + (st.melody ? 'Marked done' : any ? 'Mark step done' : 'Record at least 4 notes in a section first') + '</button></div></section>';
}
const KEY_SHIFTS = [0, 1, 2, 3, 4, 5, -1, -2];
function formCard(P) {
  const st = P.steps, form = P.form;
  const row = (it, i) => {
    const shiftOpts = KEY_SHIFTS.concat(KEY_SHIFTS.includes(it.up) ? [] : [it.up]).map(u => '<option value="' + u + '"' + (u === it.up ? ' selected' : '') + '>' + (u === 0 ? 'Song key (' + esc(fmt(P.key)) + ')' : (u > 0 ? 'Up ' : 'Down ') + Math.abs(u) + (Math.abs(u) === 1 ? ' half step' : ' half steps') + ' (' + esc(fmt(Songcraft.keyAfter(P.key, u))) + ')') + '</option>').join('');
    return '<li class="formrow"><div class="split"><b>' + (i + 1) + '. ' + esc(it.s) + '</b><span class="row">' +
      '<button class="btn ghost sm" type="button" data-act="pfmove" data-i="' + i + '" data-d="-1"' + (i ? '' : ' disabled') + ' aria-label="Move up">▲</button>' +
      '<button class="btn ghost sm" type="button" data-act="pfmove" data-i="' + i + '" data-d="1"' + (i < form.length - 1 ? '' : ' disabled') + ' aria-label="Move down">▼</button>' +
      '<button class="btn ghost sm" type="button" data-act="pfdup" data-i="' + i + '" aria-label="Duplicate">+</button>' +
      '<button class="btn ghost sm" type="button" data-act="prems" data-i="' + i + '" aria-label="Remove ' + esc(it.s) + '">' + icon('x') + '</button></span></div>' +
      '<div class="grid4"><label class="field"><span>Play it</span><select data-bind="pfx" data-i="' + i + '">' + [1, 2, 3, 4, 6, 8].map(n => '<option value="' + n + '"' + (n === it.x ? ' selected' : '') + '>' + (n === 1 ? 'Once' : n + ' times') + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Key</span><select data-bind="pfup" data-i="' + i + '">' + shiftOpts + '</select></label>' +
      '<label class="field"><span>Tag (repeat the last 2 bars)</span><select data-bind="pftag" data-i="' + i + '">' + [0, 1, 2, 3, 4].map(n => '<option value="' + n + '"' + (n === it.tag ? ' selected' : '') + '>' + (n ? n + (n === 1 ? ' time' : ' times') : 'No tag') + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Energy</span><select data-bind="pfen" data-i="' + i + '">' + [['', 'Usual for a ' + it.s.toLowerCase()], ['soft', 'Soft (drop down)'], ['full', 'Full (build up)']].map(o => '<option value="' + o[0] + '"' + (o[0] === it.en ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></label></div>' +
      '<div class="row wrap"><label class="switch"><input type="checkbox" data-bind="pfvamp" data-i="' + i + '"' + (it.vamp ? ' checked' : '') + '><span>Vamp (repeat until the leader cues)</span></label>' +
      '<label class="switch"><input type="checkbox" data-bind="pfstop" data-i="' + i + '"' + (it.stop ? ' checked' : '') + '><span>Band stops on the last bar</span></label>' +
      '<label class="switch"><input type="checkbox" data-bind="pffill" data-i="' + i + '"' + (it.fill ? ' checked' : '') + '><span>Drum fill at the end (and a crash into the next part)</span></label>' +
      (it.fill ? '<label class="field"><span>Kind of fill</span><select data-bind="pffk" data-i="' + i + '"><option value="">The usual fill for this part</option>' + Object.keys(FILL_KINDS).map(k => '<option value="' + k + '"' + (it.fk === k ? ' selected' : '') + '>' + esc(FILL_KINDS[k]) + '</option>').join('') + '</select></label>' : '') +
      '<label class="switch"><input type="checkbox" data-bind="pfswell" data-i="' + i + '"' + (it.swell ? ' checked' : '') + '><span>Swell into the next part</span></label>' +
      (it.up !== (i ? form[i - 1].up : 0) ? '<label class="switch"><input type="checkbox" data-bind="pflead" data-i="' + i + '"' + (it.lead ? ' checked' : '') + '><span>Lead into the new key with its V7</span></label>' : '') + '</div></li>';
  };
  return '<section class="card"><p class="eyebrow">Step 4 ' + (st.song ? '<span class="tag ok">Done</span>' : '') + '</p><h3>Build the complete song</h3>' +
    '<p class="muted">Put the sections in order. For each one choose how many times it plays, a key change (the last chorus up a half or whole step), a tag at the end, a vamp, a band stop, and how strong it is.</p>' +
    '<div class="chips">' + SECTION_TYPES.map(x => '<button type="button" class="chip-btn" data-act="padds" data-s="' + esc(x) + '">' + icon('plus') + esc(x) + '</button>').join('') + '</div>' +
    (form.length ? '<ol class="struct formlist">' + form.map(row).join('') + '</ol>' : '<p class="muted">Add sections above, for example Intro, Verse, Chorus, Verse, Chorus, Bridge, Chorus (up a step, with a tag), Outro. Until then the song is the Chorus once.</p>') +
    '<label class="field"><span>Ending of the song</span><select data-bind="pending">' + Object.keys(ENDINGS).map(k => '<option value="' + k + '"' + (k === (P.ending || 'none') ? ' selected' : '') + '>' + esc(ENDINGS[k]) + '</option>').join('') + '</select></label>' +
    (P.ending === 'ritard' && (hasAudioLoops(P)) ? '<p class="tiny">Your loops and beat slow down with the band over the last two bars (their pitch stays the same).</p>' : '') +
    '<label class="field"><span>Verse lyrics</span><textarea id="lverse" rows="5" data-bind="lverse">' + esc(P.lyrics.verse) + '</textarea></label><label class="field"><span>Bridge lyrics (optional)</span><textarea id="lbridge" rows="3" data-bind="lbridge">' + esc(P.lyrics.bridge) + '</textarea></label>' +
    '<div class="row wrap"><button class="btn ' + (st.song ? 'ghost' : 'primary') + ' sm" data-act="pstep" data-k="song">' + (st.song ? 'Marked done' : 'Mark step done') + '</button></div><p class="tiny">Steps 3 and 4 are self-checked. Play it through and sing it.</p></section>';
}
function choirCard(P) {
  const on = !!(P.choir && P.choir.on), sec = pst().sec, mel = P.melodies[sec] && P.melodies[sec].notes.length;
  return '<section class="card"><p class="eyebrow">Choir</p><h3>Choir parts: soprano, alto and tenor</h3>' +
    '<p class="muted">The melody is the soprano. The app writes an alto and a tenor under it from your chords: chord tones that move as little as possible, cover the 3rd and the 7th, and follow your runs in thirds and sixths. Use them to teach your choir, or as a starting point you change.</p>' +
    '<label class="switch"><input type="checkbox" data-bind="pchoir"' + (on ? ' checked' : '') + '><span>Sing the song with choir parts (in playback and in the exports)</span></label>' +
    (mel ? '<div class="row wrap"><span class="tiny">Hear the ' + esc(sec) + ':</span>' + [['all', 'All three'], ['soprano', 'Soprano'], ['alto', 'Alto'], ['tenor', 'Tenor']].map(x => '<button class="btn ghost sm" type="button" data-act="pchoirhear" data-part="' + x[0] + '">' + icon('play') + esc(x[1]) + '</button>').join('') + '</div>' +
      '<p class="tiny">A single part plays loud with the others soft, the way a choir rehearses.</p>' : '<p class="tiny">Write a melody for the ' + esc(sec) + ' first (Step 2), then its choir parts appear here.</p>') +
    '<div class="row wrap"><span class="tiny">Rehearsal audio for each section of the choir:</span>' + ['soprano', 'alto', 'tenor'].map(x => '<button class="btn ghost sm" type="button" data-act="pwav" data-mix="full" data-focus="' + x + '">Save ' + x + ' rehearsal</button>').join('') + '</div></section>';
}
function guideCard(P) {
  const cur = curTrack(P), g = cur && cur.takes.length ? cur : null, chk = S.prefs.micCheck, lat = S.prefs.micLatencyMs, tid = pst().trk || '';
  const fx = cur ? cur.fx : { preset: 'worship', nr: 'preset' };
  const chip = (id, name, n) => '<button type="button" class="chip' + (id === tid ? ' on' : '') + '" data-act="ptrk" data-id="' + esc(id) + '" aria-pressed="' + (id === tid) + '">' + esc(name) + ' <small>' + n + (n === 1 ? ' take' : ' takes') + '</small></button>';
  let html = '<section class="card studio"><p class="eyebrow">Recording studio · multitrack</p><h3>Record your voice and instruments with the song</h3>' +
    '<p class="muted">Record the lead vocal first, then add tracks: harmonies, ad-libs, a guitar, a sax. While you record a track you hear the song and every track already recorded. <b>Wear headphones</b> so the backing does not go into the recording, and keep the microphone close (a hand-width away). Each recording is a take, kept as a 24-bit studio-quality file on this computer.</p>' +
    '<div class="chips trackbar" role="group" aria-label="Tracks">' + chip('', 'Lead vocal (guide)', (guideOf(P) || { takes: [] }).takes.length) + tracksOf(P).map(T => chip(T.id, T.name, T.takes.length)).join('') +
    (tracksOf(P).length < MAX_TRACKS ? '<button type="button" class="chip-btn" data-act="ptrkadd" data-kind="vocal">' + icon('plus') + 'Vocal track</button><button type="button" class="chip-btn" data-act="ptrkadd" data-kind="instrument">' + icon('plus') + 'Instrument track</button>' : '') + '</div>' +
    (tid ? '<div class="grid3"><label class="field"><span>Track name</span><input type="text" maxlength="40" value="' + esc(cur.name) + '" data-bind="ptrkname"></label><label class="field"><span>Kind</span><select data-bind="ptrkkind">' + Object.keys(TRACK_KINDS).map(k => '<option value="' + k + '"' + (k === cur.kind ? ' selected' : '') + '>' + TRACK_KINDS[k] + '</option>').join('') + '</select></label><div class="field"><span>&nbsp;</span><button class="btn ghost sm" type="button" data-act="ptrkdel">Remove this track</button></div></div>' : '') +
    '<div class="grid2"><label class="field"><span>Microphone</span><select id="guidemic" data-bind="pmic"><option value="">Windows default microphone</option></select></label>' +
    '<div class="field"><span>Level</span><div class="miclevel" aria-hidden="true"><i id="guidelvl"></i></div></div></div>' +
    '<div class="grid2"><label class="field"><span>Input (for an audio interface with more than one socket)</span><select data-bind="pchan">' + Object.keys(MIC_CHANNELS).map(k => '<option value="' + k + '"' + (k === micChannel() ? ' selected' : '') + '>' + esc(MIC_CHANNELS[k]) + '</option>').join('') + '</select></label>' +
    '<label class="field"><span>Headphones or speakers (where the song plays)</span><select id="guideout" data-bind="pout"><option value="">Windows default</option></select></label></div>' +
    '<label class="switch"><input type="checkbox" data-bind="pstage"' + (pst().stage !== false ? ' checked' : '') + '><span>Show the words and chords in big letters while I play or record</span></label>' +
    '<details class="tiny ifacehelp"><summary>Using an audio interface or a better microphone</summary><ol><li>Plug it in and wait a moment. It appears in the Microphone list above (this list updates by itself).</li>' +
    '<li>Choose it as the Microphone. Choose its headphone output under Headphones or speakers, so the song and your voice go through it.</li>' +
    '<li>If you plug the microphone into one socket of the interface, choose Input 1 or Input 2. Leave it on Automatic if you are not sure.</li>' +
    '<li>Set the gain with the interface\'s own knob, then press Check my level and room.</li>' +
    '<li>Measure the timing once for that microphone and those headphones: every pair keeps its own number.</li>' +
    '<li>If the interface can listen to you directly (a Direct Monitor or Mix knob), use that and keep "Hear myself" off here: it is faster and has no delay.</li></ol></details>' +
    // 4. level and room check, 6. timing
    '<div class="studiosteps"><div><b>1. Check your level and room</b><p class="tiny">Stay quiet for 2 seconds, then sing the loudest line of your song for 6 seconds. The app tells you how to set the gain, and learns your room\'s noise for the noise reduction.</p>' +
    '<button class="btn ghost sm" type="button" id="lvlcheck">' + icon('mic') + 'Check my level and room</button>' +
    '<p class="tiny" id="lvlinfo" aria-live="polite">' + (chk ? 'Last check: level ' + esc(chk.level || '') + ' (peak ' + chk.peakDb + ' dB), room ' + chk.noiseDb + ' dB.' : 'Not checked yet.') + '</p></div>' +
    '<div><b>2. Line up the timing</b><p class="tiny">Turn the speakers up and hold the microphone near them: the app plays 8 clicks and measures how late the microphone hears them, so your voice lands exactly on the beat. With headphones on, choose Clap along instead.</p>' +
    '<div class="row wrap"><button class="btn ghost sm" type="button" id="calspk">Measure with the speakers</button><button class="btn ghost sm" type="button" id="calclap">Clap along (headphones)</button></div>' +
    '<p class="tiny" id="calinfo" aria-live="polite">' + (() => { const li = micLatInfo(S.prefs.micId); return li.own ? 'Timing for this microphone and these headphones: ' + li.ms + ' ms (measured).' : li.measured ? 'Not measured for this microphone and these headphones yet. The last measurement (' + li.ms + ' ms) is used: measure again to be exact.' : 'Not measured yet: the keyboard timing (' + li.ms + ' ms) is used.'; })() + '</p></div>' +
    '<div><b>3. Record</b><label class="switch"><input type="checkbox" data-bind="pmonitor"' + (pst().monitor ? ' checked' : '') + '><span>Hear myself in the headphones while recording (with the vocal sound). Only with headphones: with speakers it howls.</span></label>' +
    '<div class="row wrap"><button class="btn ghost" type="button" id="guidetest">' + icon('mic') + 'Test the microphone</button>' +
    '<button class="btn primary" type="button" id="guiderec">' + icon('mic') + (g ? 'Record ' + esc(trackName(P, cur)) + ': take ' + ((g.takes.reduce((a, t) => Math.max(a, t.n || 0), 0) || 0) + 1) : 'Record ' + esc(tid ? cur.name : 'the lead vocal (guide)')) + '</button></div></div></div>' +
    '<p class="tiny" id="guideinfo" aria-live="polite">' + (g ? esc(trackName(P, cur)) + ': ' + g.takes.length + (g.takes.length === 1 ? ' take' : ' takes') + ' kept on this computer (not in backups). Up to ' + MAX_TAKES + ' takes; the oldest goes when you record more.' : 'Nothing recorded on this track yet.') + '</p>';
  if (g) {
    // 5. takes and comping
    const parts = guideParts(P);
    html += '<h4>Takes</h4><ol class="takes">' + g.takes.map((t, i) => '<li class="' + (i === g.main ? 'on' : '') + '"><span><b>Take ' + (t.n || i + 1) + '</b> · ' + fmtTime(t.dur || 0) + (i === g.main ? ' · <span class="tag ok">main take</span>' : '') + '</span><span class="row wrap">' +
      '<button class="btn ghost sm" type="button" data-tk="hear" data-i="' + i + '">' + icon('play') + 'Hear alone</button>' +
      (i === g.main ? '' : '<button class="btn ghost sm" type="button" data-act="ptkmain" data-i="' + i + '">Make main take</button>') +
      '<button class="btn ghost sm" type="button" data-act="ptkdel" data-i="' + i + '">Delete</button></span></li>').join('') + '</ol>';
    if (g.takes.length > 1) {
      html += '<h4>Keep the best parts (comping)</h4><p class="tiny">For each part of the song, choose the take that sang it best. Parts you leave on Main use the main take. The joins are crossfaded so they cannot be heard.</p>' +
        '<div class="compgrid" role="table" aria-label="Choose a take for each part of the song"><div role="row"><span role="columnheader">Part</span>' + ['Main'].concat(g.takes.map(t => 'Take ' + (t.n || ''))).map(x => '<span role="columnheader">' + esc(x) + '</span>').join('') + '</div>' +
        parts.map((p, pi) => '<div role="row"><span role="cell">' + esc(p.label) + ' <small>' + fmtTime(p.start) + '</small></span>' + [-1].concat(g.takes.map((t, i) => i)).map(ti => { const on = (g.comp[pi] === undefined ? -1 : g.comp[pi]) === ti; return '<span role="cell"><button type="button" class="compcell' + (on ? ' on' : '') + '" data-act="pcomp" data-p="' + pi + '" data-t="' + ti + '" aria-pressed="' + on + '">' + (on ? '●' : '○') + '</button></span>'; }).join('') + '</div>').join('') + '</div>' +
        (Object.keys(g.comp).length ? '<button class="btn ghost sm" type="button" data-act="pcompclear">Clear the choices (use the main take everywhere)</button>' : '');
    }
    // 1. vocal chain
    const p = VocalFX.PRESETS[fx.preset] || VocalFX.PRESETS.off;
    html += '<h4>Vocal sound</h4><p class="tiny">Studio processing in this order: low-cut (rumble and hum) → noise reduction (from your room check, or from the quiet moments of the take) → EQ (less mud, more presence and air) → compressor (even level) → de-esser (softer “s”) → limiter → the room. Your recording itself is never changed: switch it off or change it any time.</p>' +
      '<div class="grid3"><label class="field"><span>Preset</span><select data-bind="pfxpreset">' + Object.keys(VocalFX.PRESETS).map(id => '<option value="' + id + '"' + (id === fx.preset ? ' selected' : '') + '>' + esc(VocalFX.PRESETS[id].label) + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Noise reduction</span><select data-bind="pfxnr"' + (fx.preset === 'off' ? ' disabled' : '') + '>' + [['preset', 'As the preset'], ['off', 'Off'], ['light', 'Light'], ['medium', 'Medium'], ['strong', 'Strong']].map(o => '<option value="' + o[0] + '"' + (o[0] === (fx.nr || 'preset') ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label>' +
      '<label class="switch"><input type="checkbox" data-bind="pfxroom"' + (fx.reverb !== false ? ' checked' : '') + (fx.preset === 'off' ? ' disabled' : '') + '><span>Room (' + esc(p.room ? ({ church: 'church', hall: 'hall', room: 'studio room' })[p.room] : 'none') + ')</span></label></div>' +
      '<div class="grid2"><label class="field"><span>Pitch correction</span><select data-bind="pfxtune">' + [['off', 'Off (as sung)'], ['gentle', 'Gentle (halfway)'], ['medium', 'Medium'], ['full', 'Full']].map(o => '<option value="' + o[0] + '"' + (o[0] === (fx.tune || 'off') ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Move notes towards</span><select data-bind="pfxtunescale"' + ((fx.tune || 'off') === 'off' ? ' disabled' : '') + '>' + [['key', 'The notes of the song\'s key'], ['any', 'The nearest note of any kind']].map(o => '<option value="' + o[0] + '"' + (o[0] === (fx.tuneScale || 'key') ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label></div>' +
      '<p class="tiny">Pitch correction only nudges notes that are a little off (less than half a semitone), keeps your vibrato, slides and timing, and leaves everything else exactly as you sang it. Start with Gentle; Off puts the recording back as sung.</p>' +
      (p.hint ? '<p class="tiny">' + esc(p.hint) + '</p>' : '') +
      '<div class="row wrap"><button class="btn ghost sm" type="button" id="guidehear">' + icon('play') + 'Listen: with the vocal sound</button><button class="btn ghost sm" type="button" id="guideraw">' + icon('play') + 'Listen: raw (before)</button>' +
      '<button class="btn ghost sm" type="button" data-act="pguidesave">Save this track (24-bit WAV)</button><button class="btn ghost sm" type="button" data-act="pguidedel">Delete all takes</button></div>' +
      '<div class="grid2"><label class="field"><span>Track volume</span><input type="range" min="0" max="200" value="' + Math.round((g.gain == null ? 1 : g.gain) * 100) + '" data-bind="pguidegain" aria-label="Guide volume"></label>' +
      '<label class="field"><span>Line up this track by hand <b class="mono" id="nudgev">' + (g.nudgeMs || 0) + '</b> ms</span><input type="range" min="-500" max="500" step="5" value="' + (g.nudgeMs || 0) + '" data-bind="pguidenudge" aria-label="Guide timing"></label></div>' +
      '<p class="tiny">Press Play the song with "With the recorded tracks" ticked to hear every track with the backing. Volume, left-right place, mute and solo are in the Mixer.</p>';
  }
  return html + '</section>';
}
/* ---- the song at a glance: every backing part as coloured blocks along the song, a brighter block where it plays more ---- */
function overviewCard(P) {
  const A = arrangeSong(Object.assign({}, P, { mixer: undefined }), { melInst: Snd.inst() }), bar = meterOf(P).bar, nb = Math.max(1, Math.ceil(A.total / bar - 1e-6));
  const m = mixerOf(P), solo = anySolo(P), NAME = { chords: 'Keys', bass: 'Bass', drums: 'Drums', melody: 'Melody', choir: 'Choir', loops: 'Loops' };
  const cnt = {}; Object.keys(NAME).forEach(k => { cnt[k] = new Array(nb).fill(0); });
  A.events.forEach(e => { if (e.click || e.loop) return; const k = Snd.partOf(e); if (!cnt[k]) return; const i = Math.min(nb - 1, Math.floor(e.t / bar + 1e-6)); cnt[k][i]++; });
  (A.places || []).forEach(pl => { for (let i = Math.floor(pl.at / bar + 1e-6); i < Math.ceil((pl.at + pl.dur) / bar - 1e-6) && i < nb; i++) if (i >= 0) cnt.loops[i] = 1; });
  const keys = Object.keys(NAME).filter(k => cnt[k].some(x => x > 0));
  if (!keys.length) return '';
  const head = '<div class="ovrow ovhead"><span></span><div class="ovbar">' + A.timeline.map(t => '<span style="flex:' + t.beats + '" title="' + esc(t.label) + '">' + esc(t.type) + '</span>').join('') + '</div></div>';
  const rows = keys.map(k => {
    const mx = Math.max(1, ...cnt[k]), c = m[k] || {}, off = c.mute || (solo && !c.solo);
    return '<div class="ovrow ch-' + k + (off ? ' off' : '') + '"><span class="ovname">' + NAME[k] + (off ? ' <small>off</small>' : '') + '</span><div class="ovcells" style="--n:' + nb + '">' +
      cnt[k].map((x, i) => '<i' + (x ? ' style="opacity:' + (0.3 + 0.7 * Math.min(1, x / mx)).toFixed(2) + '"' : ' class="empty"') + ' title="Bar ' + (i + 1) + '"></i>').join('') + '</div></div>';
  }).join('');
  return '<section class="card"><p class="eyebrow">Song at a glance</p><h3>Every part, bar by bar</h3>' +
    '<p class="muted">A brighter block means that part plays more in that bar; an empty gap means it is silent. Use it to see where the song builds and where it thins out. Recorded tracks are on the Record tab.</p>' +
    '<div class="overview" id="overview"><div class="ovplay" id="ovcur" aria-hidden="true"></div>' + head + rows + '</div></section>';
}
/* the sound of one backing part: tone, evening-out and extra room (heard the next time the song plays) */
function fxHtml(key, ch) {
  const tone = Math.round((ch.tone || 0) * 100), comp = Math.round((ch.comp || 0) * 100), room = Math.round((ch.room || 0) * 100), used = !!(tone || comp || room || ch.lc || ch.el || ch.em || ch.eh || ch.duck);
  const ef = ch.ef || 1000, efv = Math.round(100 * Math.log(ef / 200) / Math.log(25)), hz = x => (x >= 1000 ? (Math.round(x / 100) / 10) + ' kHz' : Math.round(x) + ' Hz');
  const eq = (f, label, v) => '<label class="field fxfield"><span>' + label + ' <span class="mono" id="mxfx-' + f + '-' + esc(key) + '">' + (v > 0 ? '+' : '') + v + ' dB</span></span><input type="range" min="-12" max="12" step="1" value="' + v + '" data-bind="mxfx" data-f="' + f + '" data-k="' + esc(key) + '" aria-label="' + label + '"></label>';
  const more = '<p class="tiny fxhead">EQ and low cut</p><label class="field fxfield"><span>Low cut</span><select data-bind="mxfx" data-f="lc" data-k="' + esc(key) + '" aria-label="Low cut">' + [[0, 'Off'], [60, '60 Hz (rumble)'], [100, '100 Hz'], [160, '160 Hz (thin)'], [250, '250 Hz (very thin)']].map(o => '<option value="' + o[0] + '"' + (o[0] === (ch.lc || 0) ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label>' +
    eq('el', 'Bass', Math.round(ch.el || 0)) + eq('em', 'Middle', Math.round(ch.em || 0)) +
    '<label class="field fxfield"><span>Middle pitch <span class="mono" id="mxfx-ef-' + esc(key) + '">' + hz(ef) + '</span></span><input type="range" min="0" max="100" step="2" value="' + efv + '" data-bind="mxfx" data-f="ef" data-k="' + esc(key) + '" aria-label="Middle pitch"></label>' + eq('eh', 'Treble', Math.round(ch.eh || 0)) +
    (key === 'drums' ? '' : '<p class="tiny fxhead">Make room for the kick</p><label class="field fxfield"><span>Duck under the kick drum <span class="mono" id="mxfx-duck-' + esc(key) + '">' + Math.round((ch.duck || 0) * 100) + '%</span></span><input type="range" min="0" max="90" step="5" value="' + Math.round((ch.duck || 0) * 100) + '" data-bind="mxfx" data-f="duck" data-k="' + esc(key) + '" aria-label="Duck under the kick drum"></label>');
  const sl = (bind, label, min, val, unit, id) => '<label class="field fxfield"><span>' + label + ' <span class="mono" id="' + id + '">' + val + unit + '</span></span><input type="range" min="' + min + '" max="100" step="5" value="' + val + '" data-bind="' + bind + '" data-k="' + esc(key) + '" aria-label="' + label + '"></label>';
  return '<details class="fxmore"' + (used ? ' open' : '') + '><summary>Sound' + (used ? ' <small>on</small>' : '') + '</summary>' +
    sl('mxtone', 'Warm · bright', -100, tone, '', 'mxtone-' + esc(key)) + sl('mxcomp', 'Even out', 0, comp, '%', 'mxcomp-' + esc(key)) + sl('mxroom', 'Extra room', 0, room, '%', 'mxroom-' + esc(key)) +
    more + '<button type="button" class="btn ghost sm" data-act="mxfxreset" data-k="' + esc(key) + '">Flat</button></details>';
}
/* ---- the mixer: a strip for each part of the backing and each recorded track ---- */
function mixerCard(P) {
  const m = mixerOf(P), solo = anySolo(P);
  const strip = (key, name, ch, kind) => { const vv = ch.v == null ? (ch.gain == null ? 1 : ch.gain) : ch.v, pct = Math.round(vv * 100), id = esc(kind + key);
    return '<div class="strip ch-' + (kind === 'track' ? 'track' : esc(key)) + (ch.mute ? ' muted' : '') + (solo && !ch.solo ? ' dimmed' : '') + '"><b class="chname" title="' + esc(name) + '">' + esc(name) + '</b>' +
    '<div class="faderbox"><span class="vmeter" aria-hidden="true"><i data-meter="' + esc(kind + ':' + key) + '"></i></span>' +
    '<input class="vfader" type="range" min="0" max="150" value="' + pct + '" aria-label="' + esc(name) + ' volume" data-bind="mxvol" data-k="' + esc(key) + '" data-kind="' + kind + '"></div>' +
    '<span class="mono volread" id="mxv-' + id + '">' + pct + '%</span>' +
    '<label class="field panfield"><span>Left · right <span class="mono">' + panLabel(ch.pan || 0) + '</span></span><input type="range" min="-100" max="100" step="5" value="' + Math.round((ch.pan || 0) * 100) + '" data-bind="mxpan" data-k="' + esc(key) + '" data-kind="' + kind + '"></label>' +
    (kind === 'part' ? fxHtml(key, ch) : '') +
    '<div class="row mswrap"><button type="button" class="btn ghost sm mute' + (ch.mute ? ' on' : '') + '" data-act="mxmute" data-k="' + esc(key) + '" data-kind="' + kind + '" aria-pressed="' + !!ch.mute + '" title="Mute">M</button><button type="button" class="btn ghost sm solo' + (ch.solo ? ' on' : '') + '" data-act="mxsolo" data-k="' + esc(key) + '" data-kind="' + kind + '" aria-pressed="' + !!ch.solo + '" title="Solo: hear only this">S</button></div></div>'; };
  const A = arrangeSong(Object.assign({}, P, { mixer: undefined }), { melInst: Snd.inst() }), has = k => k === 'loops' ? (P.loops || []).length > 0 : k === 'choir' ? !!(P.choir && P.choir.on) : A.events.some(e => Snd.partOf(e) === k);
  const SHORT = { chords: 'Keys', bass: 'Bass', drums: 'Drums', melody: 'Melody', choir: 'Choir', loops: 'Loops' };
  const parts = Object.keys(MIX_PARTS).filter(has).map(k => strip(k, SHORT[k], m[k], 'part'));
  const tracks = recordedTracks(P).map(r => strip(r.id || 'guide', r.id ? r.name : 'Lead vocal', r.T, 'track'));
  return '<section class="card"><p class="eyebrow">Mixer</p><h3>Balance the song</h3>' +
    '<p class="muted">Set how loud each part is and where it sits from left to right. <b>M</b> mutes a part; <b>S</b> (solo) plays only the soloed parts, to listen closely. The meter shows the whole song while it plays: keep it out of the red. The mixer is used for playback, the audio files and the stems. Under <b>Sound</b> each part has a tone control (warm to bright), <b>Even out</b> (keeps its volume steady) and <b>Extra room</b>; you hear them the next time you press Play.</p>' +
    '<div class="strips studio">' + parts.concat(tracks).join('') + '</div>' +
    '<div class="field masterbar"><span>Master <span class="mono" id="mastermeterv">—</span></span><div class="miclevel master" aria-hidden="true"><i id="mastermeter"></i></div><span class="tiny">Keep the master out of the red (above −1 dB). The scale runs from −48 dB to 0.</span></div>' +
    (solo ? '<button class="btn ghost sm" type="button" data-act="mxunsolo">Clear solo</button>' : '') + '</section>';
}
const panLabel = p => (Math.abs(p) < 0.05 ? 'centre' : (p < 0 ? 'L ' : 'R ') + Math.round(Math.abs(p) * 100));
/* ---- "Ready to upload?": checks the finished song and the cover picture, and makes the release files ---- */
const NOTE_ICON = { ok: '✔', warn: '!', bad: '✖' };
function notesHtml(notes) {
  return '<ul class="relnotes">' + notes.map(x => '<li class="rel-' + x.level + '"><span class="relmark" aria-hidden="true">' + NOTE_ICON[x.level] + '</span><span><b>' + esc(x.title) + '</b> ' + esc(x.text) + '</span></li>').join('') + '</ul>';
}
function detailNotes(P) {
  const i = P.info || {}, n = [], add = (level, title, text) => n.push({ level, title, text });
  if (!P.title || /^(my song|untitled)/i.test(P.title.trim())) add('warn', 'Give the song a real title', 'It is still called "' + (P.title || 'My song') + '". The title goes into the audio files and shows on Spotify.'); else add('ok', 'Title: ' + P.title, 'It is written into the files.');
  if (!(i.writers || '').trim()) add('warn', 'Who wrote it?', 'Fill in "Written by" under Credits and copyright (Write tab). Distributors ask for the songwriter.'); else add('ok', 'Writer: ' + i.writers, 'Added to the files.');
  if (!(i.artist || '').trim()) add('warn', 'Artist name', 'Fill in the artist or ministry name under Credits and copyright. The writer is used until you do.');
  return n;
}
function releaseCard(P) {
  const ps = pst(), rel = ps.rel, cov = ps.relCover;
  return '<section class="card" id="relcard"><p class="eyebrow">Release</p><h3>Ready to upload?</h3>' +
    '<p class="muted">Before you send a song to YouTube, Spotify or a distributor, check it here. The app mixes and masters the song as it will be saved, then tells you in plain words what is fine and what to fix. It does not change your song.</p>' +
    '<div class="row wrap"><button class="btn primary sm" type="button" data-act="prcheck">Check my song</button>' +
    '<button class="btn ghost sm" type="button" data-act="pcoverpick">Check my cover picture…</button>' +
    '<button class="btn ghost sm" type="button" data-act="prelease">Make my release files (ZIP)</button></div>' +
    '<input type="file" id="coverfile" accept="image/jpeg,image/png" hidden>' +
    '<div id="relresult" aria-live="polite">' + (rel ? '<h4>Your song</h4>' + notesHtml(rel.notes.concat(detailNotes(P))) + '<p class="tiny">Checked ' + esc(rel.at) + '. Check again after any change.</p>' : '') +
    (cov ? '<h4>Cover picture: ' + esc(cov.name) + '</h4>' + notesHtml(cov.notes) : '') + '</div>' +
    '<p class="tiny"><b>The release ZIP</b> holds a 16-bit WAV (upload this one to a distributor such as DistroKid, TuneCore or CD Baby), an MP3 for WhatsApp, and a note of the results. Distributors give each song its ISRC number and send it to Spotify, Apple Music, YouTube Music, Boomplay and others. Check each distributor\'s own rules and fees.</p></section>';
}
function exportCard(P) {
  const ms = P.master || {}, tgt = Mastering.TARGETS[ms.target] ? ms.target : 'stream', last = pst().lastMaster;
  return '<section class="card"><p class="eyebrow">Finish and share</p><h3>Master, export and stems</h3>' +
    '<p class="muted"><b>Mastering</b> is the last polish: it holds the mix together, makes it as loud as songs on the streaming services, and keeps it from distorting. Loudness is measured in LUFS, the standard every service uses.</p>' +
    '<label class="field"><span>Mastering</span><select data-bind="pmaster">' + Object.keys(Mastering.TARGETS).map(k => '<option value="' + k + '"' + (k === tgt ? ' selected' : '') + '>' + esc(Mastering.TARGETS[k].label) + '</option>').join('') + '</select></label>' +
    '<div class="row wrap"><button class="btn primary sm" type="button" data-act="pexp" data-format="mp3">Save the song as MP3 (for WhatsApp and sharing)</button><button class="btn ghost sm" type="button" data-act="pexp" data-format="wav">Save the song as WAV (24-bit, for streaming and CDs)</button>' +
    '<button class="btn ghost sm" type="button" data-act="pwav" data-mix="backing">Save the backing only (WAV)</button></div>' +
    '<div class="row wrap"><button class="btn ghost sm" type="button" data-act="pstems">Save stems (every part as its own file, in a ZIP)</button><button class="btn ghost sm" type="button" data-act="pmidi">Save MIDI file</button></div>' +
    '<div class="row wrap"><button class="btn ghost sm" type="button" data-act="plead">Save lead sheet (melody, chords, words)</button><button class="btn ghost sm" type="button" data-act="pchart" data-mode="names">Save chord chart</button><button class="btn ghost sm" type="button" data-act="pchart" data-mode="numbers">Save number chart for the band (1-4-5)</button><button class="btn ghost sm" type="button" data-act="plyrics">Save lyrics sheet</button></div>' +
    '<p class="tiny"><b>Stems</b> are for a studio engineer or producer: drums, bass, keys, melody, choir, loops and each recorded track as separate 24-bit WAV files that line up at bar 1. <b>MIDI</b> opens in FL Studio, Reaper or BandLab. The song details (title, writers, copyright) are written into the audio files.</p>' +
    '<div class="callout"><p><b>Keep it safe.</b> The app\'s backups keep your songs, chords and words, but not the audio: recordings and loops stay on this computer. A <b>song package</b> holds everything in one file. Save one after each recording session and keep it on a flash drive, Google Drive or WhatsApp; it opens on any computer.</p>' +
    '<button class="btn primary sm" type="button" data-act="ppkg">Save song package (everything, with recordings)</button></div>' +
    '<p class="tiny" id="expinfo" aria-live="polite">' + (last ? 'Last master: ' + last.lufs.toFixed(1) + ' LUFS, peak ' + last.tp.toFixed(1) + ' dBTP.' : '') + '</p></section>';
}
/* ---- song details: for the exports, the charts and the lyrics sheet ---- */
const INFO_FIELDS = [['writers', 'Written by (words and music)', 'Minister Kemamah'], ['artist', 'Artist or ministry (performer)', ''], ['publisher', 'Publisher or copyright owner (optional)', ''], ['year', 'Year', ''], ['ccli', 'CCLI song number (optional)', ''], ['theme', 'Theme or scripture (optional)', 'Psalm 150']];
function infoCard(P) {
  const i = P.info || {};
  return '<section class="card"><p class="eyebrow">Song details</p><h3>Credits and copyright</h3>' +
    '<p class="muted">Who wrote it, who sings it, and the copyright line. These go into the MP3 and WAV files (players show them), and onto the lead sheet, the charts and the lyrics sheet.</p>' +
    '<div class="grid2">' + INFO_FIELDS.map(([k, label, ph]) => '<label class="field"><span>' + esc(label) + '</span><input type="text" maxlength="' + (k === 'year' ? 4 : 120) + '" value="' + esc(i[k] || (k === 'year' ? String(new Date().getFullYear()) : '')) + '" placeholder="' + esc(ph) + '" data-bind="pinfo" data-k="' + k + '"></label>').join('') + '</div>' +
    '<label class="field"><span>Notes (story of the song, dedication…)</span><textarea rows="2" maxlength="1000" data-bind="pinfo" data-k="notes">' + esc(i.notes || '') + '</textarea></label>' +
    '<p class="tiny" id="copyline">' + esc(copyrightLine(P) || 'Fill in the writers to make the copyright line.') + '</p>' +
    '<p class="tiny">Your song is protected by copyright from the moment you write it down or record it. Keep your dated files (this app\'s backup helps). To collect royalties in Cameroon, register your works with SONACAM; churches that report songs use CCLI.</p></section>';
}
/* the lyrics sheet: the words of each section in the order of the song, with the credits */
function lyricsHtml(P) {
  const lyr = { Verse: P.lyrics.verse, Chorus: P.lyrics.chorus, Bridge: P.lyrics.bridge }, seen = new Set(), i = P.info || {};
  const textFor = t => (lyr[t] && lyr[t].trim()) || ((P.words || {})[t] || '').replace(/-\s*/g, '').replace(/\s_+/g, '').trim();
  const body = formOf(P).map(it => {
    const t = textFor(it.s); if (!t) return '';
    if (seen.has(it.s)) return '<p class="rep">(' + esc(it.s) + (it.x > 1 ? ' ×' + it.x : '') + (it.up ? ', key up' : '') + ')</p>';
    seen.add(it.s); return '<section><h2>' + esc(it.s) + (it.x > 1 ? ' <small>×' + it.x + '</small>' : '') + '</h2><pre>' + esc(t) + '</pre>' + (it.tag ? '<p class="rep">(tag: repeat the last line ' + it.tag + '×)</p>' : '') + '</section>';
  }).join('') || '<p>No lyrics written yet. Add them in Step 3, Step 4, or under the melody.</p>';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + esc(P.title || 'My song') + ' - lyrics</title><style>' +
    'body{font:18px/1.6 Georgia,serif;max-width:640px;margin:2.5rem auto;padding:0 1.2rem;color:#17181C}h1{font:700 2rem system-ui,sans-serif;margin:0}.by{color:#555;margin:.2rem 0 1.6rem;font-family:system-ui,sans-serif;font-size:.95rem}' +
    'h2{font:700 .85rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.1em;color:#8a1c2b;margin:1.4rem 0 .3rem}pre{font:inherit;white-space:pre-wrap;margin:0}.rep{color:#666;font-style:italic;margin:.6rem 0}' +
    '.foot{margin-top:2.5rem;border-top:1px solid #ccc;padding-top:.6rem;font:.8rem system-ui,sans-serif;color:#666}@media print{body{margin:0}}</style></head><body>' +
    '<h1>' + esc(P.title || 'My song') + '</h1><p class="by">' + [i.writers ? 'Words and music: ' + esc(i.writers) : '', i.artist ? 'Performed by ' + esc(i.artist) : '', i.theme ? esc(i.theme) : ''].filter(Boolean).join(' · ') + '</p>' + body +
    '<p class="foot">' + esc(copyrightLine(P) || ('© ' + (i.year || new Date().getFullYear()))) + (i.notes ? '<br>' + esc(i.notes) : '') + '<br>Key of ' + esc(fmt(P.key)) + ' · ' + P.bpm + ' BPM · Made in Gospel Music Academy.</p></body></html>';
}

function viewProject(pid) {
  const P = S.songs.find(s => s.id === pid); if (!P) return viewSong.call(null);
  migrateProject(P);
  if (SongHistory.id() !== P.id) SongHistory.begin(P);   // Undo and Redo start from the song as you opened it
  GuideStore.hold = true;                               // recordings you delete are kept until you leave the song
  if (!SECTION_TYPES.includes(pst().sec)) pst().sec = 'Chorus';
  if (!['write', 'arrange', 'record', 'mix', 'share'].includes(pst().tab)) pst().tab = 'write';
  const st = P.steps, nDone = Object.values(st).filter(Boolean).length, secs = songSeconds(P);
  const html = '<div class="screen">' + howTo('project', 'How this song page works', ['Choose a section with the chips (Verse, Chorus…). Its chords and melody are edited below.', 'Chords: play them in from your keyboard, tap them from the key, the suggestions or the Gospel colours. Tap a chord in the strip to change its type (9th, 13th, sus…), give it a bass note (F/G), a length, or a push.', 'Melody: play it in or sing it in after the count-in, then fix notes in the editor. Type the words under it, one syllable per note.', 'Step 4 puts the sections in order: repeats, a key change for the last chorus, tags, vamps and band stops.', 'Choir: switch on soprano, alto and tenor parts and save rehearsal audio for each.', 'Once you have recorded, the Timeline shows every track. Drag across a track to choose a part: silence it, or sing just that part again. Undo and Redo (or Ctrl+Z and Ctrl+Y) bring every change back.', 'At the bottom: the guide track, and the exports: audio, MIDI, lead sheet, chord chart and number chart.']) + '<div class="pagehead"><button class="btn ghost sm" type="button" data-act="go" data-to="song">' + icon('back') + 'Song Lab</button><h1 class="sr-only">Song: ' + esc(P.title || 'My song') + '</h1><label class="field"><span>Song title</span><input id="ptitle" type="text" maxlength="60" value="' + esc(P.title) + '" data-bind="ptitle"></label>' +
    safetyHtml(P) + '<p class="muted">' + nDone + ' of 4 steps done' + (P.done ? ' · finished' : '') + ' · ' + esc(fmt(P.key)) + ' · ' + METERS[P.ts].label + ' · ' + P.bpm + ' BPM · ' + fmtTime(secs) + ' long</p>' + bar(nDone * 25) + '</div>' +
    '<section class="card player"><div class="split"><div><p class="eyebrow">The whole song</p><h3 id="songpos">' + esc(formOf(P).map(i => itemLabel(i, P)).join(' · ')) + '</h3></div>' +
    '<div class="row wrap"><button class="btn primary" type="button" id="songplay">' + icon('play') + 'Play the song</button><button class="btn ghost" type="button" data-act="pperform">Perform (full screen)</button>' + (recordedTracks(P).length ? '<label class="switch"><input type="checkbox" data-bind="pwithguide"' + (pst().withGuide ? ' checked' : '') + '><span>With the recorded tracks</span></label>' : '') + '</div></div>' +
    (lowMem(P) ? '<p class="tiny memnote">' + icon('info') + ' Memory saver is on for this song (about ' + memEstimateMB(P) + ' MB of recordings and loops): tracks play with a light version of their vocal sound, and the saved song uses the full sound, one track at a time. Profile › Settings › Memory saver.</p>' : '') +
    kbdOutRow() + undoRowHtml() +
    '<div class="songbar" id="songbar">' + (() => { const A = arrangeSong(P); return A.timeline.map(t => '<span style="flex:' + t.beats + '" title="' + esc(t.label) + '">' + esc(t.type) + '</span>').join(''); })() + '<i id="songcur"></i></div></section>' +
    projTabsHtml() + '<div class="ptab' + (pst().tab === 'write' ? ' on' : '') + '" data-tab="write">' + chordsCard(P) + melodyCard(P) +
    '<section class="card"><p class="eyebrow">Step 3 ' + (st.chorus ? '<span class="tag ok">Done</span>' : '') + '</p><h3>Make it a chorus</h3><p class="muted">A chorus carries the main message and repeats. Write 2 to 4 short lines that someone could sing back after hearing them once.</p><label class="field"><span>Chorus lyrics</span><textarea id="lchorus" rows="4" data-bind="lchorus">' + esc(P.lyrics.chorus) + '</textarea></label>' +
    '<div class="row wrap"><button class="btn ' + (st.chorus ? 'ghost' : 'primary') + ' sm" data-act="pstep" data-k="chorus">' + (st.chorus ? 'Marked done' : 'Mark step done') + '</button></div></section>' +
    infoCard(P) + '</div>' +
    '<div class="ptab' + (pst().tab === 'arrange' ? ' on' : '') + '" data-tab="arrange">' + arrangeCard(P) + editCard(P) + formCard(P) + loopsCard(P) + choirCard(P) + '</div>' +
    '<div class="ptab' + (pst().tab === 'record' ? ' on' : '') + '" data-tab="record">' + guideCard(P) + timelineCard(P) + remoteCard() + '</div>' +
    '<div class="ptab' + (pst().tab === 'mix' ? ' on' : '') + '" data-tab="mix">' + overviewCard(P) + mixerCard(P) + levelsCard(P) + '</div>' +
    '<div class="ptab' + (pst().tab === 'share' ? ' on' : '') + '" data-tab="share">' + releaseCard(P) + exportCard(P) +
    '<div class="row wrap"><button class="btn ghost" data-act="pdel" data-id="' + esc(P.id) + '">' + (ui.confirmDel === P.id ? 'Tap again to delete this project' : 'Delete project') + '</button></div></div></div>';
  return { html, mount(root) { return mountProject(root, P); } };
}

/* ---- behaviour: player, melody recorder, note editor, guide recorder ---- */
let projPlay = null, PROJ_CTL = null;
function stopProjPlay() { if (projPlay) { const h = projPlay; projPlay = null; h.stop(); } }
function playScript(script, o) {
  stopProjPlay();
  if (kbdOutOn() && !(o && o.computer)) {
    const k = S.prefs.kbdOut || {}, oo = Object.assign({ chordProg: k.prog || 0, melProg: 0 }, o || {});
    // the notes go to the keyboard; recorded tracks, loops and beats play on the computer at the same moment
    let clips = null;
    if (script.audio && script.audio.length) { const on = oo.onStart; oo.onStart = (t, c, bus) => { clips = Snd.playClips(script.audio, t, script.bpm); if (on) on(t, c, bus); }; }
    const h = MidiOut.play(script, oo);
    if (h) { projPlay = { stop() { h.stop(); if (clips) clips.stop(); } }; return projPlay; }
  }
  projPlay = Snd.play(script, Object.assign({ force: true, inst: () => Snd.backingInst() }, o || {}));
  return projPlay;
}
function mountProject(root, P) {
  const cl = [];
  // leaving the song lets go of its audio in memory (a redraw of the same song keeps it)
  cl.push(() => setTimeout(() => { if (!(route.name === 'song' && route.params && route.params.pid === P.id)) { GuideStore.forget(P.id); forgetLoops(P.id); } }, 0));
  /* whole-song player with a moving cursor and the current section and chord */
  const btn = $('#songplay', root), cur = $('#songcur', root), pos = $('#songpos', root);
  let tick = null, playing = false, gsrc = null, live = null;
  const reset = () => { if (live) { live.stop(); live = null; } playing = false; clearInterval(tick); if (gsrc) { try { gsrc.stop(); } catch (e) { /* ignore */ } gsrc = null; } tick = null; if (btn) btn.innerHTML = icon('play') + 'Play the song'; if (cur) cur.style.left = '0'; if (pos) pos.textContent = formOf(P).map(i => itemLabel(i, P)).join(' · '); };
  /* from: the part (0, 1, 2 ...) to begin at; countBars: bars of clicks before it starts (used by the phone remote) */
  const startPlay = async (fromPart, countBars) => {
    const A = arrangeSong(P, { melInst: Snd.inst() }), spb = 60 / P.bpm;
    const fromBeat = fromPart > 0 && A.timeline[fromPart] ? A.timeline[fromPart].start : 0, lead = countBars > 0 ? countBars * METERS[P.ts].bar : 0;
    if (hasAudioLoops(P) && pos) pos.textContent = 'Preparing the loops…';
    A.script.audio = await loopAudio(P, A.places);
    if (recordedTracks(P).length && pst().withGuide && pos) pos.textContent = 'Preparing the recorded tracks…';
    if (pst().withGuide) A.script.audio = A.script.audio.concat(await recordedAudio(P, { live: true }).catch(() => []));
    const guide = null;
    let script = fromBeat > 0 ? scriptFrom(A.script, fromBeat) : A.script;
    if (lead) script = withCountIn(script, lead, METERS[P.ts].bar);
    let start = 0; playing = true; if (btn) btn.innerHTML = icon('stop') + 'Stop';
    playScript(script, {
      // a processed guide already has its room, so it goes straight to the output (no second reverb)
      onStart: (t, c, bus) => { start = t + lead * spb; if (live) live.stop(); live = liveStart(P, t + lead * spb, fromBeat); if (guide) gsrc = Snd.playBuffer(guide, t + (P.guide.nudgeMs || 0) / 1000, P.guide.gain == null ? 1 : P.guide.gain, curTrack(P).fx.preset !== 'off' ? Snd.dryBus() : bus); },
      onEnd: () => reset()
    });
    const meter = Snd.meter(), mbuf = meter ? new Float32Array(meter.fftSize) : null, mEl = $('#mastermeter'), mTxt = $('#mastermeterv');
    tick = setInterval(() => {
      if (meter && mEl) { meter.getFloatTimeDomainData(mbuf); let pk = 0; for (let i = 0; i < mbuf.length; i++) pk = Math.max(pk, Math.abs(mbuf[i])); const d = 20 * Math.log10(Math.max(1e-6, pk)); mEl.style.width = Math.max(0, Math.min(100, (d + 48) / 48 * 100)) + '%'; mEl.classList.toggle('hot', d > -1); if (mTxt) mTxt.textContent = (d < -90 ? '−∞' : d.toFixed(1)) + ' dB'; }
      if (Snd.partLevel) document.querySelectorAll('[data-meter]').forEach(el => { const pk = Snd.partLevel(el.dataset.meter); if (pk < 0) { el.style.height = '0%'; return; } const d = 20 * Math.log10(Math.max(1e-6, pk)); el.style.height = Math.max(0, Math.min(100, (d + 48) / 48 * 100)) + '%'; el.classList.toggle('hot', d > -1); });
      const beat = (Snd.now() - start) / spb + fromBeat; if (beat < fromBeat) return;
      if (cur) cur.style.left = Math.min(100, 100 * beat / A.total) + '%';
      const oc = document.getElementById('ovcur'); if (oc) oc.style.left = 'calc(70px + (100% - 70px) * ' + Math.min(1, Math.max(0, beat / A.total)).toFixed(4) + ')';
      const seg = A.timeline.find(t => beat >= t.start && beat < t.start + t.beats);
      if (seg && pos) { let k = 0; seg.chs.forEach((c, i) => { if (beat >= c.t - 1e-6) k = i; }); const c = seg.chs[k]; pos.textContent = seg.label + ' · ' + c.name + ' (' + c.number + ')' + (seg.key !== P.key ? ' · key of ' + fmt(seg.key) : ''); }
    }, 80);
  };
  const cvf = $('#coverfile');
  if (cvf) cvf.addEventListener('change', () => {
    const f = cvf.files && cvf.files[0]; if (!f) return;
    const url = URL.createObjectURL(f), img = new Image();
    const done = (w, h) => { URL.revokeObjectURL(url); pst().relCover = { name: f.name, notes: Mastering.coverNotes(w, h, f.type, f.size) }; cvf.value = ''; render(); };
    img.onload = () => done(img.naturalWidth, img.naturalHeight); img.onerror = () => done(0, 0); img.src = url;
  });
  if (btn) btn.addEventListener('click', () => { if (playing) { stopProjPlay(); reset(); return; } startPlay(0, 0); });
  /* what the phone remote may ask of the player */
  PROJ_CTL = { pid: P.id, play: (fromPart, countBars) => { stopProjPlay(); reset(); return startPlay(fromPart || 0, countBars || 0); }, stop: () => { stopProjPlay(); reset(); } };
  cl.push(() => { if (PROJ_CTL && PROJ_CTL.pid === P.id) PROJ_CTL = null; stopProjPlay(); clearInterval(tick); });


  /* drag and drop of chords: mouse, pen and touch (touch: hold a moment, then drag).
     A chord chip dropped on a chord: left third = before it, right third = after it, middle = replace it.
     A chord of the strip dropped on another chord: before, after, or swap. */
  const anyCard = $('#anycard', root); if (anyCard) anyCard.addEventListener('toggle', () => { pst().anyOpen = anyCard.open; });
  const strip = $('.cstrip', root);
  if (strip) {
    let st = null, ghost = null, hold = null, blockClick = false, raf = 0;
    const zoneOf = (el, x) => { const r = el.getBoundingClientRect(), f = (x - r.left) / Math.max(1, r.width); return f < 0.3 ? 'before' : f > 0.7 ? 'after' : 'replace'; };
    const clearMarks = () => root.querySelectorAll('.cchord.dz-before,.cchord.dz-after,.cchord.dz-replace,.cstrip.dz-end').forEach(e => e.classList.remove('dz-before', 'dz-after', 'dz-replace', 'dz-end'));
    const cleanup = () => { clearTimeout(hold); hold = null; if (raf) cancelAnimationFrame(raf); raf = 0; if (ghost) ghost.remove(); ghost = null; clearMarks(); document.body.classList.remove('dragging-chord'); st = null; };
    const begin = () => { if (!st || st.on) return; st.on = true; ghost = document.createElement('div'); ghost.className = 'dndghost'; ghost.textContent = st.label; document.body.appendChild(ghost); document.body.classList.add('dragging-chord'); st.cx = st.x0; st.cy = st.y0; raf = requestAnimationFrame(auto); };
    const overAt = (x, y) => { const e = document.elementFromPoint(x, y); return e ? e.closest('.cchord') : null; };
    const move = ev => {
      if (!st || ev.pointerId !== st.id) return;
      const dx = ev.clientX - st.x0, dy = ev.clientY - st.y0, dist = Math.hypot(dx, dy);
      if (!st.on) {
        if (st.touch) { if (dist > 10) cleanup(); return; }
        if (dist < 6) return; begin();
      }
      ev.preventDefault(); st.cx = ev.clientX; st.cy = ev.clientY; track();
    };
    /* show where the chord would land, and scroll the page when the finger or mouse is near the top or bottom edge */
    const track = () => {
      if (!st || !st.on) return; const x = st.cx, y = st.cy;
      ghost.style.left = x + 12 + 'px'; ghost.style.top = y + 12 + 'px';
      clearMarks(); const t = overAt(x, y);
      if (t && !(st.from !== undefined && t === st.src)) t.classList.add('dz-' + zoneOf(t, x));
      else if (!t && st.from === undefined) { const rr = strip.getBoundingClientRect(); if (y > rr.top - 24 && y < rr.bottom + 24) strip.classList.add('dz-end'); }
    };
    const auto = () => {
      raf = 0; if (!st || !st.on) return;
      const h = window.innerHeight, edge = 70, y = st.cy; let dy = 0;
      if (y < edge) dy = -Math.ceil((edge - y) / 5); else if (y > h - edge) dy = Math.ceil((y - (h - edge)) / 5);
      if (dy) { window.scrollBy(0, dy); track(); }
      raf = requestAnimationFrame(auto);
    };
    const up = ev => {
      if (!st || ev.pointerId !== st.id) return;
      const was = st.on, cur = st; let done = false;
      if (was) {
        const t = overAt(ev.clientX, ev.clientY), P = curProj();
        if (t) { const j = +t.dataset.i, mode = zoneOf(t, ev.clientX); if (cur.from !== undefined) { if (cur.from !== j) { done = true; cleanup(); moveChord(P, cur.from, j, mode); } } else { done = true; cleanup(); const c = { r: cur.r, q: cur.q, b: cur.b, beats: pst().newLen || meterOf(P).bar }; previewChord(P, c); placeChord(P, c, mode, j); } }
        else if (cur.from === undefined) { const rr = strip.getBoundingClientRect(); if (ev.clientY > rr.top - 24 && ev.clientY < rr.bottom + 24) { done = true; cleanup(); const c = { r: cur.r, q: cur.q, b: cur.b, beats: pst().newLen || meterOf(P).bar }; previewChord(P, c); placeChord(P, c, 'end', -1); } }
        blockClick = true; setTimeout(() => { blockClick = false; }, 60);
      }
      if (!done) cleanup();
    };
    const down = ev => {
      if (ev.button > 0) return;
      const chip = ev.target.closest('.chip-btn[data-act="pcadd"]'), ch = ev.target.closest('.cchord');
      const src = chip || ch; if (!src || !root.contains(src)) return;
      cleanup();
      st = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, touch: ev.pointerType === 'touch', src, on: false };
      if (chip) { st.r = +chip.dataset.r; st.q = chip.dataset.q; st.b = chip.dataset.b === '' ? null : +chip.dataset.b; st.label = (chip.querySelector('b') || chip).textContent; }
      else { st.from = +ch.dataset.i; st.label = (ch.querySelector('b') || ch).textContent; }
      if (st.touch) hold = setTimeout(() => { begin(); }, 280);
    };
    const touchBlock = ev => { if (st && st.on) ev.preventDefault(); };
    const clickBlock = ev => { if (blockClick) { ev.stopPropagation(); ev.preventDefault(); } };
    root.addEventListener('pointerdown', down);
    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', up);
    const cancel = () => cleanup(); document.addEventListener('pointercancel', cancel);
    document.addEventListener('touchmove', touchBlock, { passive: false });
    document.addEventListener('click', clickBlock, true);
    cl.push(() => { cleanup(); root.removeEventListener('pointerdown', down); document.removeEventListener('pointercancel', cancel); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('touchmove', touchBlock); document.removeEventListener('click', clickBlock, true); });
  }

  /* chords played in from the keyboard: each chord (3+ notes) is added to the section when it is released */
  const kbBtn = $('#pkbin', root), kbInfo = $('#pkbinfo', root);
  if (kbBtn) kbBtn.addEventListener('click', () => { pst().kbin = !pst().kbin; render(); });
  if (pst().kbin) {
    const held = new Set(); let peak = [];
    cl.push(Input.listen(ev => { held.add(ev.midi); if (held.size >= peak.length) peak = [...held]; }));
    cl.push(Input.listenOff(ev => {
      held.delete(ev.midi);
      if (held.size || peak.length < 3) { if (!held.size) peak = []; return; }
      const notes = peak; peak = [];
      const hit = E.identifyChord(notes);
      if (!hit) { if (kbInfo) kbInfo.textContent = 'That was not a chord the app knows. Try again.'; return; }
      const s = P.sections[pst().sec];
      if (s.chords.length >= MAX_SECTION_CHORDS) { if (kbInfo) kbInfo.textContent = MAX_SECTION_CHORDS + ' chords is the most a section can hold.'; return; }
      const c = Songcraft.fromHit(P.key, hit, pst().newLen || meterOf(P).bar);
      if (!c) { if (kbInfo) kbInfo.textContent = 'That chord could not be added. Try again.'; return; }
      insertChord(P, c);
      const d = Songcraft.describe(P.key, c);
      toast('Added ' + d.name + ' (' + d.number + ' in ' + fmt(P.key) + ').');
      render();
    }));
  }

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
      computer: true,
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

  /* singing the melody in: the pitch tracker listens while the section plays, then the sung line becomes notes */
  const singBtn = $('#melsing', root);
  let sing = null;
  const endSing = () => { if (!sing) return; const sg = sing; sing = null; try { sg.trk.stop(); } catch (e) { /* ignore */ } return sg; };
  if (singBtn) singBtn.addEventListener('click', () => {
    if (sing) { stopProjPlay(); return; }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { info.textContent = 'The microphone is not available on this device.'; return; }
    const sec = pst().sec, A = arrangeSection(P, sec, { melody: false }), bar = meterOf(P).bar, spb = 60 / P.bpm;
    const clicks = [];
    for (let b = 0; b < bar + A.beats; b++) clicks.push({ t: b, d: 0.2, click: b % bar === 0 ? 2 : 1 });
    const back = pst().singBack === 'click' ? [] : A.events.map(e => Object.assign({}, e, { t: e.t + bar, vel: (e.vel || 0.6) * 0.7 }));
    sing = { start: null, frames: [], sec, beats: A.beats };
    sing.trk = Pitch.track(f => {
      if (!sing || sing.start === null) return;
      const beat = (f.t - 0.023 - micLat() - sing.start) / spb;
      if (beat >= -0.25 && beat < sing.beats + 0.25) sing.frames.push({ t: beat, midi: f.midi, level: f.level });
      if (f.midi !== null && info && beat >= 0) info.textContent = 'Listening… ' + fmt(E.midiName(Math.round(f.midi)));
    }, { deviceId: S.prefs.micId || null, onError: () => { endSing(); stopProjPlay(); info.textContent = 'The microphone could not be opened. ' + MIC_HELP; } });
    singBtn.innerHTML = icon('stop') + 'Stop'; info.textContent = 'Count-in… then sing.';
    playScript({ events: clicks.concat(back), bpm: P.bpm, total: bar + A.beats }, {
      computer: true,
      onStart: t => { if (sing) sing.start = t + bar * spb; },
      onEnd: () => {
        const sg = endSing(); singBtn.innerHTML = icon('mic') + 'Sing it in';
        if (!sg) return;
        const notes = Songcraft.framesToNotes(sg.frames, { total: sg.beats, keyPc: pst().snap === false ? null : E.pcOfName(P.key), frameBeats: 0.025 / spb });
        if (!notes.length) { info.textContent = 'No clear notes were heard. Sing closer to the microphone, one note at a time, and check the microphone in the Guide track card.'; return; }
        pst().take = { sec: sg.sec, notes, sung: true }; render();
      }
    });
  });
  cl.push(() => { endSing(); });

  /* loops: hear one alone, at the song's tempo and key */
  let lpHear = null;
  root.querySelectorAll('[data-lp=hear]').forEach(b => b.addEventListener('click', async () => {
    if (lpHear) { lpHear.stop(); lpHear = null; return; }
    const L = (P.loops || [])[+b.dataset.i]; if (!L) return;
    stopProjPlay();
    if (L.kind === 'midi') { const segs = [{ type: '_', start: 0, beats: L.beats, up: 0 }], ev = midiLoopEvents(Object.assign({}, P, { loops: [Object.assign({}, L, { secs: ['_'], mute: false })] }), segs); lpHear = playScript({ events: ev, bpm: P.bpm, total: L.beats }, { computer: true }); return; }
    b.textContent = 'Preparing…';
    const buf = await loopAt(P, L, 0).catch(() => null); b.innerHTML = icon('play') + 'Hear';
    if (!buf) { toast('That file was not found on this computer.', 'warn'); return; }
    const beats = L.kind === 'beat' ? Math.min(32, (buf.duration - (L.offset || 0)) * P.bpm / 60) : L.beats;
    lpHear = playScript({ events: [], audio: [{ buf, at: 0, dur: beats, offset: L.offset || 0, gain: L.gain == null ? 1 : L.gain }], bpm: P.bpm, total: beats }, { computer: true });
  }));
  cl.push(() => { if (lpHear) { try { lpHear.stop(); } catch (e) { /* ignore */ } } });

  /* note editor */
  mountRoll(root, P);
  /* the timeline, Undo and Redo keys, and what happens when you leave the song */
  cl.push(mountTimeline(root, P));
  const onUndoKey = e => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const t = e.target; if (t && /^(TEXTAREA|SELECT)$/.test(t.tagName) || (t && t.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes(t.type))) return;   // text fields keep their own undo
    const k = (e.key || '').toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); PROJECT_ACTIONS.hundo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); PROJECT_ACTIONS.hredo(); }
  };
  window.addEventListener('keydown', onUndoKey); cl.push(() => window.removeEventListener('keydown', onUndoKey));
  cl.push(() => setTimeout(() => {
    if (route.name === 'song' && route.params && route.params.pid === P.id) return;   // a redraw of the same song
    ui.safetyLater = null; SongHistory.end(); GuideStore.hold = false; const SP = S.songs.find(x => x.id === P.id); if (SP) GuideStore.purge(SP).catch(() => {});
  }, 0));

  /* guide track: microphone, level, level and room check, timing, recorder with monitoring, listening */
  const gBtn = $('#guiderec', root), gInfo = $('#guideinfo', root), gLvl = $('#guidelvl', root), gMic = $('#guidemic', root), gTest = $('#guidetest', root), gHear = $('#guidehear', root), gRaw = $('#guideraw', root);
  const lBtn = $('#lvlcheck', root), lInfo = $('#lvlinfo', root), cSpk = $('#calspk', root), cClap = $('#calclap', root), cInfo = $('#calinfo', root);
  const showLvl = p => { if (gLvl) { gLvl.style.width = Math.min(100, Math.round(Math.sqrt(Math.max(0, p)) * 110)) + '%'; gLvl.classList.toggle('hot', p > 0.95); } };
  const fillMics = async () => {
    if (!gMic) return;
    const mics = await listMics();
    gMic.innerHTML = '<option value="">Windows default microphone</option>' + mics.filter(m => m.deviceId && m.deviceId !== 'default' && m.deviceId !== 'communications').map((m, i) => '<option value="' + esc(m.deviceId) + '"' + (m.deviceId === S.prefs.micId ? ' selected' : '') + '>' + esc(m.label || ('Microphone ' + (i + 1))) + '</option>').join('');
  };
  const gOut = $('#guideout', root);
  const fillOuts = async () => {
    if (!gOut) return;
    let outs = []; try { outs = (await navigator.mediaDevices.enumerateDevices()).filter(x => x.kind === 'audiooutput'); } catch (e) { /* none */ }
    const can = typeof AudioContext !== 'undefined' && typeof AudioContext.prototype.setSinkId === 'function';
    gOut.innerHTML = '<option value="">Windows default</option>' + (can ? outs.filter(m => m.deviceId && m.deviceId !== 'default' && m.deviceId !== 'communications').map((m, i) => '<option value="' + esc(m.deviceId) + '"' + (m.deviceId === S.prefs.outId ? ' selected' : '') + '>' + esc(m.label || ('Output ' + (i + 1))) + '</option>').join('') : '');
    gOut.disabled = !can;
  };
  fillMics(); fillOuts();
  const onDevices = () => { fillMics(); fillOuts(); };
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) { navigator.mediaDevices.addEventListener('devicechange', onDevices); cl.push(() => navigator.mediaDevices.removeEventListener('devicechange', onDevices)); }
  if (typeof Snd.setOutput === 'function') Snd.setOutput();
  let g = null, tst = null, hear = null, chk = null, cal = null;
  const noMic = () => !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const stopTest = () => { if (tst) { const t = tst; tst = null; t.stop(); } };
  const stopHear = () => { if (hear) { try { hear.stop(); } catch (e) { /* ignore */ } hear = null; } if (gHear) gHear.innerHTML = icon('play') + 'Listen: with the vocal sound'; if (gRaw) gRaw.innerHTML = icon('play') + 'Listen: raw (before)'; };
  const stopAllMic = () => { stopTest(); stopHear(); if (chk) { chk.stop(); chk = null; } if (cal) { cal.stop(); cal = null; } };
  if (gTest) gTest.addEventListener('click', () => {
    if (tst) { stopTest(); return; }
    if (noMic()) { gInfo.textContent = 'Recording is not available on this device.'; return; }
    stopProjPlay(); stopAllMic();
    gTest.innerHTML = icon('stop') + 'Stop the test'; gInfo.textContent = 'Sing or speak now, at the volume you will sing…';
    tst = testMic(S.prefs.micId || null, (p, peak) => {
      if (p === -1) { tst = null; gTest.innerHTML = icon('mic') + 'Test the microphone'; gInfo.textContent = 'The microphone could not be opened. ' + MIC_HELP; return; }
      if (p !== null) { showLvl(p); return; }
      tst = null; showLvl(0); gTest.innerHTML = icon('mic') + 'Test the microphone'; fillMics();
      gInfo.textContent = peak < GUIDE_SILENT ? 'Nothing was heard. Choose another microphone above, or: ' + MIC_HELP
        : peak < 0.05 ? 'The microphone works but is very quiet. Move closer, or raise the gain. Check my level and room tells you exactly.'
        : peak > 0.95 ? 'Very loud: the sound may distort. Move back a little or lower the gain.'
        : 'The microphone sounds good. You can record.';
    }, 6000);
  });
  if (lBtn) lBtn.addEventListener('click', () => {
    if (chk) { chk.stop(); chk = null; lBtn.innerHTML = icon('mic') + 'Check my level and room'; lInfo.textContent = 'Stopped.'; return; }
    if (noMic()) { lInfo.textContent = 'The microphone is not available on this device.'; return; }
    stopProjPlay(); stopAllMic();
    lBtn.innerHTML = icon('stop') + 'Stop';
    chk = levelCheck(S.prefs.micId || null, st => {
      if (st.phase === 'quiet') lInfo.textContent = 'Stay quiet… the app is listening to your room.';
      else if (st.phase === 'sing') lInfo.textContent = 'Now sing the loudest line of your song, at full voice…';
      else if (st.phase === 'level') { showLvl(st.peak); }
      else if (st.phase === 'error') { chk = null; lBtn.innerHTML = icon('mic') + 'Check my level and room'; lInfo.textContent = st.msg; }
      else if (st.phase === 'done') {
        chk = null; showLvl(0); lBtn.innerHTML = icon('mic') + 'Check again';
        lInfo.innerHTML = '<b>' + (st.advice.ok ? 'Ready to record.' : 'Fix this first:') + '</b> ' + st.advice.lines.map(esc).join(' ') + ' <span class="mono">(peak ' + st.peakDb.toFixed(1) + ' dB · room ' + Math.round(st.noiseDb) + ' dB · voice ' + Math.round(st.advice.snr) + ' dB above the room)</span>';
      }
    });
  });
  const runCal = mode => {
    if (cal) { cal.stop(); cal = null; return; }
    if (noMic()) { cInfo.textContent = 'The microphone is not available on this device.'; return; }
    stopProjPlay(); stopAllMic();
    cInfo.textContent = mode === 'clap' ? 'Clap exactly on each of the 8 clicks…' : 'Listening for the 8 clicks… keep quiet.';
    cal = calibrateMic(S.prefs.micId || null, mode, st => {
      if (st.state === 'listening') return;
      cal = null;
      if (st.state === 'done') cInfo.textContent = 'Microphone timing: ' + st.ms + ' ms (' + st.heard + ' of 8 ' + (mode === 'clap' ? 'claps' : 'clicks') + ' heard). Your recordings are now lined up with the beat.';
      else if (st.state === 'unheard') cInfo.textContent = mode === 'clap' ? 'The claps were not heard clearly. Clap louder, close to the microphone, and try again.' : 'The microphone did not hear the clicks. Turn the speakers up and hold the microphone near them, or use Clap along if you wear headphones.';
      else if (st.state === 'unsteady') cInfo.textContent = 'The clicks were heard unevenly (a noisy room?). Try again in a quieter moment.';
      else cInfo.textContent = st.msg || 'The measurement did not work.';
    });
  };
  if (cSpk) cSpk.addEventListener('click', () => runCal('speakers'));
  if (cClap) cClap.addEventListener('click', () => runCal('clap'));
  const listen = async (btn, raw, label) => {
    if (hear) { stopHear(); return; }
    stopProjPlay(); stopAllMic();
    btn.textContent = 'Preparing…';
    const T = curTrack(P), buf = await GuideStore.trackBuffer(P, T, { raw }).catch(() => null);
    if (!buf) { gInfo.textContent = 'The recording was not found on this computer.'; stopHear(); return; }
    const c = Snd.ensure(); if (!c) return;
    hear = Snd.playBuffer(buf, c.currentTime + 0.05, T.gain == null ? 1 : T.gain, Snd.dryBus());
    if (hear) { btn.innerHTML = icon('stop') + 'Stop'; hear.onended = () => { hear = null; btn.innerHTML = icon('play') + label; }; }
  };
  if (gHear) gHear.addEventListener('click', () => listen(gHear, false, 'Listen: with the vocal sound'));
  if (gRaw) gRaw.addEventListener('click', () => listen(gRaw, true, 'Listen: raw (before)'));
  root.querySelectorAll('[data-tk=hear]').forEach(b => b.addEventListener('click', async () => {
    if (hear) { stopHear(); return; }
    const t = curTrack(P).takes[+b.dataset.i]; if (!t) return;
    stopProjPlay(); stopAllMic();
    const buf = await GuideStore.takeBuffer(t.k).catch(() => null); if (!buf) { gInfo.textContent = 'That take was not found on this computer.'; return; }
    const c = Snd.ensure(); hear = Snd.playBuffer(buf, c.currentTime + 0.05, 1, Snd.dryBus());
  }));
  if (gBtn) gBtn.addEventListener('click', async () => {
    if (g) { g.stop(); return; }
    if (noMic()) { gInfo.textContent = 'Recording is not available on this device.'; return; }
    stopProjPlay(); stopAllMic();
    if (typeof tlBusy === 'function' && tlBusy()) { gInfo.textContent = 'Finish the part you are singing again first.'; return; }
    const room = await storageRoomMB(); if (room !== null && room < 150) { gInfo.textContent = 'There is only ' + room + ' MB of room left on this computer, not enough for a recording. Free some space first (delete files you do not need).'; return; }
    gBtn.innerHTML = icon('stop') + 'Stop recording'; ui.recording = true; let liveRec = null;
    g = startGuideRecording(P, st => {
      if (st.state === 'level') { showLvl(st.peak); if (typeof RemoteLink !== 'undefined') RemoteLink.level(st.peak); return; }
      if (st.state === 'recording') { gInfo.textContent = 'Recording' + (st.label ? ' from ' + st.label : '') + (st.settings ? ' (' + Math.round(st.settings.sampleRate / 100) / 10 + ' kHz)' : '') + '. Watch the green bar move as you sing.' + (pst().monitor ? ' You hear yourself with the vocal sound.' : ''); return; }
      if (st.state === 'started') { if (liveRec) liveRec.stop(); liveRec = liveStart(P, st.start, st.fromBeat); return; }
      showLvl(0); ui.recording = false; if (liveRec) { liveRec.stop(); liveRec = null; }
      if (st.state === 'saved') {
        g = null; pst().withGuide = true;
        toast('Take ' + st.take + ' saved (' + fmtTime(st.seconds) + ').' + (st.quiet ? ' It was quiet, so the app boosted it. Move closer next time.' : '') + (st.cleared ? ' The fixes on the old take were put away (Undo brings them back).' : ''));
        render();
      } else { g = null; gBtn.innerHTML = icon('mic') + 'Record again'; gInfo.textContent = st.msg || 'Nothing was recorded.'; }
    }, { deviceId: S.prefs.micId || null, trackId: pst().trk || '', monitor: pst().monitor ? ((curTrack(P) || {}).fx || {}).preset || 'worship' : null });
  });
  cl.push(() => { stopAllMic(); });
  cl.push(() => { if (g) g.stop(); ui.recording = false; });
  return () => cl.forEach(f => { try { f(); } catch (e) { /* ignore */ } });
}

/* the note editor: a small piano roll for the chosen section's melody */
function mountRoll(root, P) {
  const host = $('#roll', root), selEl = $('#rollsel', root); if (!host) return;
  const sec = pst().sec, sc = sectionChords(P, sec), beats = sc.beats, CW = 20, RH = 14;   // sc.chs: names and times
  const mel = () => P.melodies[sec] || (P.melodies[sec] = { notes: [] });
  const notesNow = () => mel().notes;
  function range() { const ms = notesNow().map(n => n.m); let lo = ms.length ? Math.min.apply(null, ms) - 3 : 60, hi = ms.length ? Math.max.apply(null, ms) + 3 : 76; if (hi - lo < 14) { const mid = (hi + lo) >> 1; lo = mid - 7; hi = mid + 7; } return [clamp(lo, 43, 90), clamp(hi, 50, 96)]; }
  function draw() {
    const [lo, hi] = range(), rows = hi - lo + 1, cols = beats * 2, W = cols * CW + 40, H = rows * RH + 18, bar = meterOf(P).bar, sel = pst().sel;
    let svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Melody notes for the ' + esc(sec) + '">';
    for (let r = 0; r < rows; r++) { const m = hi - r, y = 18 + r * RH; svg += '<rect x="40" y="' + y + '" width="' + (cols * CW) + '" height="' + RH + '" class="' + (E.isBlack(m) ? 'rb' : 'rw') + '"/>' + (m % 12 === 0 || r === 0 ? '<text x="36" y="' + (y + RH - 3) + '" text-anchor="end" class="rl">' + esc(fmt(E.midiName(m))) + '</text>' : ''); }
    for (let c = 0; c <= cols; c++) { const x = 40 + c * CW; svg += '<line x1="' + x + '" x2="' + x + '" y1="18" y2="' + H + '" class="' + (c % (bar * 2) === 0 ? 'lb' : c % 2 === 0 ? 'lq' : 'le') + '"/>'; }
    sc.chs.forEach(ch => { const x = 40 + Math.max(0, ch.t) * 2 * CW; svg += '<text x="' + (x + 3) + '" y="12" class="rc">' + esc(ch.name) + '</text>'; });
    const syl = Songcraft.lyricsForNotes(notesNow(), (P.words || {})[sec] || '');
    notesNow().forEach((n, i) => { if (n.m < lo || n.m > hi) return; const x = 40 + n.t * 2 * CW, y = 18 + (hi - n.m) * RH; svg += '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + Math.max(6, n.d * 2 * CW - 2) + '" height="' + (RH - 2) + '" rx="3" class="rn' + (i === sel ? ' on' : '') + '" data-i="' + i + '"/>' + (syl[i] ? '<text x="' + (x + 4) + '" y="' + (y + RH - 3) + '" class="rly">' + esc(syl[i]) + '</text>' : ''); });
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

/* ---- printable pages: chord chart (names), number chart (Nashville numbers), lead sheet (staff, chords, words) ---- */
const PAGE_CSS = 'body{font:16px/1.5 system-ui,Segoe UI,Arial,sans-serif;max-width:900px;margin:2rem auto;padding:0 1.2rem;color:#17181C}h1{margin:0 0 .2rem;font-size:2rem}.meta{color:#555;margin:0 0 1.2rem}' +
  'section{margin:0 0 1.5rem;break-inside:avoid}h2{font-size:1rem;text-transform:uppercase;letter-spacing:.08em;color:#8a1c2b;margin:0 0 .4rem}h2 small{text-transform:none;letter-spacing:0;color:#555;font-weight:500;margin-left:.5rem}' +
  '.bars{display:grid;grid-template-columns:repeat(4,1fr);border-left:2px solid #17181C}.bars div{border-right:2px solid #17181C;padding:.3rem .5rem;min-height:2.4rem;font:700 1.25rem ui-monospace,Consolas,monospace;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}' +
  '.bars small{font:500 .78rem system-ui,sans-serif;color:#666}.bars .cont{color:#999;font-weight:400}.push{color:#8a1c2b}pre{font:inherit;white-space:pre-wrap;margin:.6rem 0 0}.note{font-size:.85rem;color:#555;margin:.3rem 0}' +
  '.legend{font-size:.85rem;color:#555;border-top:1px solid #ccc;padding-top:.6rem;margin-top:1.5rem}.foot{color:#777;font-size:.8rem;margin-top:1.5rem}svg.staff{width:100%;height:auto;color:#17181C}@media print{body{margin:0}}';
function pageHtml(P, body, sub) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + esc(P.title || 'My song') + (sub ? ' - ' + esc(sub) : '') + '</title><style>' + PAGE_CSS + '</style></head><body><h1>' + esc(P.title || 'My song') + '</h1>' +
    '<p class="meta">' + (sub ? esc(sub) + ' · ' : '') + 'Key of ' + esc(fmt(P.key)) + ' · ' + P.bpm + ' BPM · ' + METERS[P.ts].label + ' · ' + esc(E.BEATS[P.beat] && P.beat !== 'none' ? E.BEATS[P.beat].label : 'no drums') + ' · ' + fmtTime(songSeconds(P)) + '</p>' +
    body + '<p class="foot">' + (copyrightLine(P) ? esc(copyrightLine(P)) + '<br>' : '') + 'Made in Gospel Music Academy. Print this page or save it as a PDF from the print dialog.</p></body></html>';
}
/* one section as bars: each bar lists the chords that start in it */
function barsHtml(P, it, mode) {
  const bar = meterOf(P).bar, sc = sectionChords(P, it.s, { shift: it.up }), nBars = Math.ceil(sc.beats / bar - 1e-6), cells = [];
  for (let k = 0; k < nBars; k++) {
    const inBar = sc.chs.filter(c => c.at >= k * bar - 1e-6 && c.at < (k + 1) * bar - 1e-6);
    cells.push('<div>' + (inBar.length ? inBar.map(c => (c.spec.push && c.at > 0 ? '<span class="push" title="pushed">‹</span>' : '') + esc(mode === 'numbers' ? c.number : c.name) + (inBar.length > 1 || c.spec.beats % bar ? '<small>' + esc(beatsLabel(c.spec.beats, bar)) + '</small>' : '')).join(' ') : '<span class="cont">' + (mode === 'numbers' ? '–' : '%') + '</span>') + '</div>');
  }
  return '<div class="bars">' + cells.join('') + '</div>';
}
function formNotes(P, it, i, form) {
  const n = [];
  if (it.up !== (i ? form[i - 1].up : 0)) n.push('KEY CHANGE to ' + fmt(Songcraft.keyAfter(P.key, it.up)) + (it.up > 0 ? ' (up ' : ' (down ') + Math.abs(it.up) + ' half step' + (Math.abs(it.up) > 1 ? 's' : '') + ')');
  if (it.vamp) n.push('VAMP: repeat until the leader cues (' + it.x + '× in the recording)'); else if (it.x > 1) n.push('Play ' + it.x + ' times');
  if (it.tag) n.push('TAG: repeat the last 2 bars ' + it.tag + (it.tag > 1 ? ' times' : ' time'));
  if (it.stop) n.push('STOP: band hits beat 1 of the last bar and holds');
  if (it.en) n.push(it.en === 'soft' ? 'Soft: drop down' : 'Full: build up');
  const next = form[i + 1]; if (next && next.up !== it.up && next.lead) n.push('Last 2 beats: V7 of the new key');
  return n;
}
function chartHtml(P, mode) {
  migrateProject(P);
  const lyr = { Verse: P.lyrics.verse, Chorus: P.lyrics.chorus, Bridge: P.lyrics.bridge }, form = formOf(P), seen = new Set();
  const body = form.map((it, i) => {
    const first = !seen.has(it.s); seen.add(it.s);
    const notes = formNotes(P, it, i, form);
    return '<section><h2>' + esc(it.s) + (it.up ? '<small>key of ' + esc(fmt(Songcraft.keyAfter(P.key, it.up))) + '</small>' : '') + '</h2>' + barsHtml(P, it, mode) +
      notes.map(x => '<p class="note">' + esc(x) + '</p>').join('') + (mode !== 'numbers' && first && lyr[it.s] && lyr[it.s].trim() ? '<pre>' + esc(lyr[it.s].trim()) + '</pre>' : '') + '</section>';
  }).join('');
  const legend = mode === 'numbers'
    ? '<p class="legend">Numbers count up the scale of the key: 1 is the key note. m = minor, ° = diminished, ø = half-diminished, small numbers are the 7th, 9th, 11th or 13th, ♭ and ♯ mark chords outside the key, 4/5 = the 4 chord over the 5 in the bass. ‹ = pushed: play it half a beat early. – = keep playing the chord. One box is one bar.</p>'
    : '<p class="legend">One box is one bar. % = keep playing the chord. ‹ = pushed: play it half a beat early.</p>';
  return pageHtml(P, body + legend, mode === 'numbers' ? 'Number chart' : 'Chord chart');
}
/* melody as staff columns: notes and rests split at bar lines and chord changes (tied), chord symbols above, syllables below */
const DUR_GLYPH = [[4, 'w'], [3, 'hd'], [2, 'h'], [1.5, 'qd'], [1, 'q'], [0.5, 'e']];
const REST_GLYPH = [[4, 'w'], [2, 'h'], [1, 'q'], [0.5, 'e']];
function splitDur(len, table, at, bar) {
  const out = []; let left = Math.round(len * 2) / 2, t = at;
  while (left > 0.24) {
    const pos = t % bar, fit = table.find(([d]) => d <= left + 1e-6 && (d < 4 || pos === 0) && !(d === 4 && bar !== 4) && !(d === 3 && bar === 3 && pos !== 0)) || [0.5, 'e'];
    out.push(fit); left -= fit[0]; t += fit[0];
  }
  return out;
}
function sectionColumns(P, it) {
  const bar = meterOf(P).bar, sc = sectionChords(P, it.s, { shift: it.up }), beats = sc.beats, mel = (P.melodies[it.s] && P.melodies[it.s].notes || []).filter(n => n.t < beats).map(n => ({ m: n.m + it.up, t: n.t, d: Math.min(n.d, beats - n.t) })).sort((a, b) => a.t - b.t);
  const syl = Songcraft.lyricsForNotes(mel, (P.words || {})[it.s] || ''), sharps = Songcraft.keySig(sc.key) > 0;
  const cuts = new Set(); for (let b = bar; b < beats; b += bar) cuts.add(b); sc.chs.forEach(c => { if (c.at > 0 && c.at < beats) cuts.add(c.at); });
  const marks = [...cuts].sort((a, b) => a - b);
  // the timeline as pieces of notes or rests, never crossing a bar line or a chord change
  const pieces = []; let t = 0;
  const addSpan = (t0, t1, m, lyric) => { let s0 = t0; marks.filter(x => x > t0 + 1e-6 && x < t1 - 1e-6).concat([t1]).forEach((x, k) => { pieces.push({ t: s0, d: x - s0, m, lyric: k === 0 ? lyric : '', tieNext: m !== null && x < t1 - 1e-6 }); s0 = x; }); };
  mel.forEach((n, i) => { if (n.t > t + 1e-6) addSpan(t, n.t, null, ''); const st = Math.max(n.t, t); if (n.t + n.d > st + 1e-6) addSpan(st, n.t + n.d, n.m, syl[i]); t = Math.max(t, n.t + n.d); });
  if (t < beats - 1e-6) addSpan(t, beats, null, '');
  const cols = [], labelled = new Set();
  pieces.forEach(pc => {
    const parts = splitDur(pc.d, pc.m === null ? REST_GLYPH : DUR_GLYPH, pc.t, bar); let at = pc.t;
    parts.forEach(([d, g], k) => {
      const ch = sc.chs.find(c => Math.abs(c.at - at) < 1e-6 && !labelled.has(c.at));
      if (ch) labelled.add(ch.at);
      const endBar = Math.abs((at + d) % bar) < 1e-6 && at + d < beats - 1e-6;
      cols.push(pc.m === null ? { rest: true, dur: g, label: ch ? ch.name : '', bar: endBar, beat: at } : { notes: [E.midiName(pc.m, sharps)], dur: g, label: ch ? ch.name : '', lyric: k === 0 ? pc.lyric : '', tie: k < parts.length - 1 || pc.tieNext, bar: endBar, beat: at });
      at += d;
    });
  });
  return { cols, key: sc.key, bar, beats, clef: mel.length && mel.map(n => n.m).sort((a, b) => a - b)[mel.length >> 1] < 57 ? 'bass' : 'treble' };
}
function leadSheetHtml(P) {
  migrateProject(P);
  const form = formOf(P), seen = new Set(), ts = P.ts === 6 ? [6, 8] : P.ts === 3 ? [3, 4] : [4, 4];
  const body = form.map((it, i) => {
    const sig = it.s + ':' + it.up; if (seen.has(sig)) return '<section><h2>' + esc(it.s) + '<small>as before' + (it.up ? ', key of ' + esc(fmt(Songcraft.keyAfter(P.key, it.up))) : '') + '</small></h2>' + formNotes(P, it, i, form).map(x => '<p class="note">' + esc(x) + '</p>').join('') + '</section>'; seen.add(sig);
    const sc = sectionColumns(P, it), BARS = 4, systems = [];
    let cur = [], bars = 0;
    sc.cols.forEach(c => { cur.push(c); if (c.bar) { bars++; if (bars % BARS === 0) { systems.push(cur); cur = []; } } });
    if (cur.length) systems.push(cur);
    const svgs = systems.map((cols, k) => Staff.render({ clef: sc.clef, key: Songcraft.keySig(sc.key), time: k === 0 && i === 0 ? ts : null, cols: cols.map((c, j) => Object.assign({}, c, { bar: c.bar && j < cols.length - 1 })), colW: 34, scale: 1, label: it.s + ', line ' + (k + 1) })).join('');
    const hasMel = P.melodies[it.s] && P.melodies[it.s].notes.length;
    return '<section><h2>' + esc(it.s) + (it.up ? '<small>key of ' + esc(fmt(Songcraft.keyAfter(P.key, it.up))) + '</small>' : '') + '</h2>' + (hasMel ? svgs : barsHtml(P, it, 'names') + '<p class="note">No melody written for this section yet.</p>') + formNotes(P, it, i, form).map(x => '<p class="note">' + esc(x) + '</p>').join('') + '</section>';
  }).join('');
  return pageHtml(P, body, 'Lead sheet');
}
function exportChart(P, mode) { const name = songSlug(P) + (mode === 'numbers' ? '_number-chart' : '_chart') + '.html'; saveFile(name, 'text/html', chartHtml(P, mode)); return name; }
function exportLeadSheet(P) { const name = songSlug(P) + '_lead-sheet.html'; saveFile(name, 'text/html', leadSheetHtml(P)); return name; }
/* a chord goes after the chosen chord, or at the end */
function insertChord(P, c) {
  const sec = pst().sec, s = P.sections[sec], at = s.chords[pst().ci] ? pst().ci + 1 : s.chords.length;
  s.chords.splice(at, 0, c); pst().ci = s.chords[pst().ci] && pst().ci >= 0 ? at : -1;
  if (sec === 'Chorus') P.steps.prog = false; syncLegacy(P); touch(); render();
}

/* put a chord into the chosen section: replace the chosen chord, add before it, add after it, or at the end.
   A replaced chord starts fresh (plain chord as chosen) and keeps only its place and length. */
const CHORD_MODES = [['replace', 'Replace the chosen chord'], ['before', 'Add before it'], ['after', 'Add after it']];
function placeChord(P, c, mode, i) {
  const sec = pst().sec, s = P.sections[sec];
  if (!s.chords[i]) mode = 'end';
  if (mode !== 'replace' && s.chords.length >= MAX_SECTION_CHORDS) { toast(MAX_SECTION_CHORDS + ' chords is the most a section can hold.'); return false; }
  c = { r: c.r, q: c.q, b: c.b === undefined ? null : c.b, beats: c.beats || meterOf(P).bar, push: false };
  if (mode === 'replace') { c.beats = s.chords[i].beats; s.chords[i] = c; pst().ci = i; }
  else if (mode === 'before') { s.chords.splice(i, 0, c); pst().ci = i; }
  else if (mode === 'after') { s.chords.splice(i + 1, 0, c); pst().ci = i + 1; }
  else { s.chords.push(c); pst().ci = -1; }
  if (s.chords[0]) s.chords[0].push = false;
  if (sec === 'Chorus') P.steps.prog = false;
  syncLegacy(P); touch(); render(); return true;
}
/* move chord i of the chosen section before or after chord j, or swap them (used by drag and drop) */
function moveChord(P, i, j, mode) {
  const s = P.sections[pst().sec]; if (!s.chords[i] || !s.chords[j] || i === j) return false;
  if (mode === 'replace') { const t = s.chords[i]; s.chords[i] = s.chords[j]; s.chords[j] = t; pst().ci = j; }
  else { const [c] = s.chords.splice(i, 1), jj = j > i ? j - 1 : j, k = mode === 'after' ? jj + 1 : jj; s.chords.splice(k, 0, c); pst().ci = k; }
  if (s.chords[0]) s.chords[0].push = false;
  if (pst().sec === 'Chorus') P.steps.prog = false;
  syncLegacy(P); touch(); render(); return true;
}
function anyRefresh() { const P = curProj(), ps = pst(), d = Songcraft.describe(P.key, { r: ps.anyR || 0, q: ps.anyQ || 'major', b: ps.anyB === undefined || ps.anyB === '' ? null : +ps.anyB }), n = $('#anyname'), m = $('#anynum'); if (n) n.textContent = d.name; if (m) m.textContent = d.number + (d.label ? ' · ' + d.label : ''); }
const ANY_ROOTS = P => Array.from({ length: 12 }, (_, i) => i).map(i => [i, Songcraft.describe(P.key, { r: i, q: 'major', b: null })]);
function anyChordHtml(P) {
  const ps = pst(), r = ps.anyR || 0, q = ps.anyQ || 'major', b = ps.anyB === undefined || ps.anyB === '' ? null : +ps.anyB, d = Songcraft.describe(P.key, { r, q, b });
  const rOpts = ANY_ROOTS(P).map(([i, x]) => '<option value="' + i + '"' + (i === r ? ' selected' : '') + '>' + esc(E.fmt(x.root)) + (i === 0 ? ' (the key note)' : '') + '</option>').join('');
  const qOpts = Songcraft.GROUPS.map(([g, qs]) => '<optgroup label="' + esc(g) + '">' + qs.map(k => '<option value="' + esc(k) + '"' + (k === q ? ' selected' : '') + '>' + esc(Songcraft.QLABEL[k] || k) + '</option>').join('') + '</optgroup>').join('');
  const bOpts = '<option value="">No slash (the root)</option>' + Array.from({ length: 12 }, (_, i) => i).filter(i => i !== r).map(i => '<option value="' + i + '"' + (b === i ? ' selected' : '') + '>over ' + esc(E.fmt(Songcraft.describe(P.key, { r: i, q: 'major', b: null }).root)) + '</option>').join('');
  return '<details class="colours" id="anycard"' + (ps.anyOpen ? ' open' : '') + '><summary>Any chord, even one outside the key</summary>' +
    '<div class="grid3"><label class="field"><span>Root note</span><select data-bind="panyr">' + rOpts + '</select></label><label class="field"><span>Chord type</span><select data-bind="panyq">' + qOpts + '</select></label><label class="field"><span>Bass note</span><select data-bind="panyb">' + bOpts + '</select></label></div>' +
    '<p class="tiny">This chord: <b class="mono" id="anyname">' + esc(d.name) + '</b> <span id="anynum">' + esc(d.number) + (d.label ? ' · ' + esc(d.label) : '') + '</span></p>' +
    '<div class="row wrap"><button class="btn ghost sm" type="button" data-act="panyhear">' + icon('play') + 'Hear it</button><button class="btn primary sm" type="button" data-act="panyuse">Use this chord</button></div></details>';
}

/* ---- actions and bindings for the project screen (merged into ACTIONS and BINDS at boot) ---- */
const mixChan = (P, el) => (el.dataset.kind === 'track' ? trackOf(P, el.dataset.k === 'guide' ? '' : el.dataset.k) : mixerOf(P)[el.dataset.k]);
async function runExport(fn, label) {
  const info = $('#expinfo'); if (info) info.textContent = label + '… this takes a little while for a long song.';
  try { return await fn(); } catch (e) { if (info) info.textContent = 'That did not work: ' + (e && e.message ? e.message : e); return null; }
}
const PROJECT_ACTIONS = {
  plvreset: () => { const P = curProj(); formOf(P).forEach(it => { delete it.lv; }); touch(); render(); },
  pedhear: () => { const P = curProj(), g = gridState(P); if (!S.prefs.sound) { toast('Sound is off. Turn it on in Profile.'); return; } const a = arrangeSection(P, g.sec, { melody: false, choir: false, melInst: Snd.inst() }); playScript({ events: a.events, bpm: P.bpm, total: a.beats, kit: P.kit || 0 }); },
  pedreset: () => { const P = curProj(), g = gridState(P); if (P.edits && P.edits[g.part]) { delete P.edits[g.part][g.sec]; if (!Object.keys(P.edits[g.part]).length) delete P.edits[g.part]; if (!Object.keys(P.edits).length) delete P.edits; } touch(); render(); },
  pedclear: () => { const P = curProj(), g = gridState(P); P.edits = P.edits || {}; P.edits[g.part] = P.edits[g.part] || {}; P.edits[g.part][g.sec] = []; touch(); render(); },
  ptrk: el => { pst().trk = el.dataset.id || ''; render(); },
  ptrkadd: el => {
    const P = curProj(), list = tracksOf(P); if (list.length >= MAX_TRACKS) return;
    const kind = el.dataset.kind === 'instrument' ? 'instrument' : 'vocal', n = list.filter(t => t.kind === kind).length + 1;
    const id = Date.now().toString(36).slice(-6) + Math.floor(Math.random() * 1296).toString(36);
    list.push(normTrack({ id, name: kind === 'vocal' ? (n === 1 ? 'Harmony' : 'Vocal ' + (n + 1)) : (n === 1 ? 'Guitar' : 'Instrument ' + n), kind, takes: [], fx: { preset: kind === 'vocal' ? 'choir' : 'natural', nr: 'preset' }, gain: kind === 'vocal' ? 0.8 : 0.9, pan: kind === 'vocal' ? (n % 2 ? -0.35 : 0.35) : (n % 2 ? 0.4 : -0.4) }));
    pst().trk = id; touch(); render();
  },
  ptrkdel: async () => {
    const P = curProj(), T = curTrack(P); if (!T || !T.id) return;
    if (ui.confirmTrack !== T.id) { ui.confirmTrack = T.id; toast('Press Remove this track again: its ' + T.takes.length + ' takes will be deleted.'); setTimeout(() => { ui.confirmTrack = null; }, 4000); return; }
    for (const t of T.takes) await GuideStore.del(t.k).catch(() => {});
    P.tracks = tracksOf(P).filter(x => x !== T); pst().trk = ''; GuideStore.invalidate(); touch(); render();
  },
  pbusy: el => { const P = curProj(); P.busy = Math.max(-1, Math.min(1, +el.dataset.v || 0)); touch(); render(); },
  pbeatcard: el => { const P = curProj(); const v = el.dataset.v; P.beat = v === 'meter' ? (P.ts === 4 ? 'ballad' : 'meter') : v; touch(); render(); },
  pbeathear: el => { const P = curProj(); if (!S.prefs.sound) { toast('Sound is off. Turn it on in Profile.'); return; } try {
    const k = el.dataset.v, Q = Object.assign({}, P, { beat: k, loops: [], mixer: undefined }), A = arrangeSong(Q, { melody: false }), bar = meterOf(P).bar;
    const drums = A.events.filter(e => e.drum); if (!drums.length) { toast('This beat has no drum sound yet.'); return; }
    const best = (A.timeline || []).slice().sort((a, b) => drums.filter(e => e.t >= b.start && e.t < b.start + b.beats).length - drums.filter(e => e.t >= a.start && e.t < a.start + a.beats).length)[0];
    let from = best ? best.start + (best.beats > bar * 3 ? bar : 0) : 0, win = drums.filter(e => e.t >= from && e.t < from + bar * 2);
    if (win.length < 4) { from = Math.floor(drums[0].t / bar) * bar; win = drums.filter(e => e.t >= from && e.t < from + bar * 2); }
    const ev = win.map(e => Object.assign({}, e, { t: e.t - from }));
    playScript({ events: ev, bpm: P.bpm, total: bar * 2, swing: A.swing, kit: P.kit || 0 }, { computer: true });
  } catch (e) { toast('Could not play this beat.'); } },
  instcard: el => { const v = el.dataset.v; S.prefs.instrument = Snd.hasInst(v) ? v : 'piano'; touch(); Snd.releaseAll(); Snd.preview(); refreshLeslieBtn();
    document.querySelectorAll('[data-act=instcard]').forEach(b => { const on = b.dataset.v === Snd.inst(); b.setAttribute('aria-pressed', String(on)); b.parentNode.classList.toggle('on', on); });
    document.querySelectorAll('select[data-bind=instpick]').forEach(sel => { sel.value = Snd.inst(); }); },
  prcheck: async () => {
    const P = curProj(), box = $('#relresult'); if (!box) return;
    box.innerHTML = '<p class="muted">Mixing and mastering the song to measure it… this takes a little while for a long song.</p>';
    try { const r = await releaseCheck(P); pst().rel = { notes: r.notes, at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }; render(); }
    catch (e) { box.innerHTML = '<p class="muted">That did not work: ' + esc(e && e.message ? e.message : String(e)) + '</p>'; }
  },
  pcoverpick: () => { const f = $('#coverfile'); if (f) f.click(); },
  prelease: async () => {
    const P = curProj(), box = $('#relresult'); if (!box) return;
    try {
      const r = await exportRelease(P, label => { box.innerHTML = '<p class="muted">' + esc(label) + '… this takes a little while for a long song.</p>'; });
      if (r && r.canceled) { render(); return; }
      pst().rel = { notes: r.notes, at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }; render();
      toast('Release files saved: ' + r.name + (r.mp3 ? '' : ' (without the MP3)'));
    } catch (e) { box.innerHTML = '<p class="muted">That did not work: ' + esc(e && e.message ? e.message : String(e)) + '</p>'; }
  },
  mxfxreset: el => { const P = curProj(), c = mixerOf(P)[el.dataset.k]; if (!c) return; c.tone = 0; c.comp = 0; c.room = 0; c.lc = 0; c.el = 0; c.em = 0; c.eh = 0; c.ef = 1000; c.duck = 0; touch(); render(); },
  mxmute: el => { const P = curProj(), c = mixChan(P, el); if (!c) return; c.mute = !c.mute; touch(); render(); },
  mxsolo: el => { const P = curProj(), c = mixChan(P, el); if (!c) return; c.solo = !c.solo; touch(); render(); },
  mxunsolo: () => { const P = curProj(), m = mixerOf(P); Object.keys(m).forEach(k => { m[k].solo = false; }); recordedTracks(P).forEach(r => { r.T.solo = false; }); touch(); render(); },
  pexp: async el => {
    const P = curProj(), fmtx = el.dataset.format === 'mp3' ? 'mp3' : 'wav';
    const r = await runExport(() => exportSong(P, { format: fmtx }), fmtx === 'mp3' ? 'Mixing, mastering and making the MP3' : 'Mixing and mastering');
    const info = $('#expinfo'); if (!r) return;
    if (r.error === 'mp3') { if (info) info.textContent = 'The MP3 maker is not in this copy of the app (the installed app from GitHub has it). Save as WAV instead: it plays everywhere and WhatsApp accepts it as a document.'; return; }
    if (r.master) pst().lastMaster = r.master;
    if (info) info.textContent = 'Saved ' + r.name + ' (' + fmtTime(r.seconds) + ', ' + (r.bytes / 1048576).toFixed(1) + ' MB)' + (r.master ? '. Master: ' + r.master.lufs.toFixed(1) + ' LUFS, peak ' + r.master.tp.toFixed(1) + ' dBTP.' : '.');
    toast('Song saved.');
  },
  pstems: async () => {
    const P = curProj(), info = $('#expinfo');
    const r = await runExport(() => exportStems(P, (i, n, name) => { if (info) info.textContent = 'Stem ' + (i + 1) + ' of ' + n + ': ' + name + '…'; }), 'Preparing the stems');
    if (r && r.canceled) { if (info) info.textContent = 'Not saved.'; return; }
    if (r && info) { info.textContent = 'Saved ' + r.name + ': ' + r.count + ' stems (' + (r.bytes / 1048576).toFixed(1) + ' MB).'; toast('Stems saved.'); }
  },
  ppkg: async () => {
    const P = curProj(), info = $('#expinfo');
    const r = await runExport(() => exportPackage(P), 'Packing the song and its recordings');
    if (r && r.canceled) { if (info) info.textContent = 'Not saved.'; return; }
    if (r && info) { info.textContent = 'Saved ' + r.name + ' (' + (r.bytes / 1048576).toFixed(1) + ' MB, ' + r.count + ' recordings and loops)' + (r.missing ? '. ' + r.missing + ' recordings were not found on this computer and are not in it.' : '.'); if (!r.missing) setTimeout(render, 1200); toast('Song package saved.'); }
  },
  plyrics: () => { const P = curProj(), name = songSlug(P) + '_lyrics.html'; saveFile(name, 'text/html', lyricsHtml(P)); toast('Lyrics sheet saved. Open it to print or save as PDF.'); },
  psec: el => { pst().sec = el.dataset.s; pst().sel = -1; pst().ci = -1; render(); },
  psecm: el => { pst().sec = el.dataset.s; pst().sel = -1; pst().ci = -1; render(); },
  pflav: el => { const f = el.dataset.f; if (CHORD_FLAVOURS.some(x => x[0] === f)) { pst().flav = f; render(); } },
  psaveprog: () => {
    const P = curProj(), cur = P.sections[pst().sec].chords; if (!cur.length) return;
    const name = (pst().progName || '').trim() || 'My progression', fid = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e3).toString(36);
    S.progs = (S.progs || []).filter(x => x.name !== name); S.progs.unshift({ fid, name: name.slice(0, 60), at: Date.now(), chords: cur.map(c => ({ r: c.r, q: c.q, b: c.b === undefined ? null : c.b, beats: c.beats, push: !!c.push })) });
    S.progs.length = Math.min(S.progs.length, 40); pst().progName = ''; pst().progsOpen = true; touch(); toast('Saved "' + name + '".'); render();
  },
  pprogreplace: el => { const P = curProj(), x = (S.progs || []).find(f => f.fid === el.dataset.id); if (!x) return; P.sections[pst().sec].chords = x.chords.map(c => Object.assign({}, c)); P.sections[pst().sec].chords[0].push = false; pst().ci = -1; pst().progsOpen = true; syncLegacy(P); touch(); previewChord(P, x.chords[0]); render(); },
  pprogadd: el => {
    const P = curProj(), x = (S.progs || []).find(f => f.fid === el.dataset.id), s = P.sections[pst().sec]; if (!x) return;
    if (s.chords.length + x.chords.length > MAX_SECTION_CHORDS) { toast('That would be more than ' + MAX_SECTION_CHORDS + ' chords in one section.'); return; }
    s.chords = s.chords.concat(x.chords.map(c => Object.assign({}, c))); pst().progsOpen = true; syncLegacy(P); touch(); render();
  },
  pprogdel: el => { S.progs = (S.progs || []).filter(f => f.fid !== el.dataset.id); pst().progsOpen = true; touch(); render(); },
  pcadd: el => {
    const P = curProj(), s = P.sections[pst().sec];
    if (s.chords.length >= MAX_SECTION_CHORDS) { toast(MAX_SECTION_CHORDS + ' chords is the most a section can hold.'); return; }
    const c = { r: +el.dataset.r, q: el.dataset.q, b: el.dataset.b === '' ? null : +el.dataset.b, beats: pst().newLen || meterOf(P).bar, push: false };
    previewChord(P, c); placeChord(P, c, pst().ci >= 0 ? (pst().cmode || 'after') : 'end', pst().ci);
  },
  pcmode: el => { if (['replace', 'before', 'after'].includes(el.dataset.m)) { pst().cmode = el.dataset.m; render(); } },
  panyhear: () => { const P = curProj(), ps = pst(); previewChord(P, { r: ps.anyR || 0, q: ps.anyQ || 'major', b: ps.anyB === undefined || ps.anyB === '' ? null : +ps.anyB, beats: meterOf(P).bar }); },
  panyuse: () => { const P = curProj(), ps = pst(), c = { r: ps.anyR || 0, q: ps.anyQ || 'major', b: ps.anyB === undefined || ps.anyB === '' ? null : +ps.anyB, beats: pst().newLen || meterOf(P).bar }; previewChord(P, c); ps.anyOpen = true; placeChord(P, c, ps.ci >= 0 ? (ps.cmode || 'after') : 'end', ps.ci); },
  pcsel: el => { const i = +el.dataset.i; pst().ci = pst().ci === i ? -1 : i; const P = curProj(), c = P.sections[pst().sec].chords[pst().ci]; if (c) previewChord(P, c); render(); },
  pchear: () => { const P = curProj(), c = P.sections[pst().sec].chords[pst().ci]; if (c) previewChord(P, c); },
  pcmove: el => { const P = curProj(), s = P.sections[pst().sec], i = pst().ci, j = i + (+el.dataset.d); if (!s.chords[i] || !s.chords[j]) return; const t = s.chords[i]; s.chords[i] = s.chords[j]; s.chords[j] = t; if (j === 0) s.chords[0].push = false; pst().ci = j; syncLegacy(P); touch(); render(); },
  pcdel: () => { const P = curProj(), s = P.sections[pst().sec], i = pst().ci; if (!s.chords[i] || s.chords.length < 2) return; s.chords.splice(i, 1); if (s.chords[0]) s.chords[0].push = false; pst().ci = -1; syncLegacy(P); touch(); render(); },
  pundo: () => { const P = curProj(), s = P.sections[pst().sec]; if (s.chords.length > 1) s.chords.pop(); pst().ci = -1; syncLegacy(P); touch(); render(); },
  padds: el => { const P = curProj(); if (P.form.length >= MAX_FORM) { toast('A song can have ' + MAX_FORM + ' parts at most.'); return; } const prev = P.form[P.form.length - 1]; P.form.push(formItem({ s: el.dataset.s, up: prev ? prev.up : 0 })); P.steps.song = false; syncLegacy(P); touch(); render(); },
  prems: el => { const P = curProj(); P.form.splice(+el.dataset.i, 1); syncLegacy(P); touch(); render(); },
  pfmove: el => { const P = curProj(), i = +el.dataset.i, j = i + (+el.dataset.d); if (!P.form[i] || !P.form[j]) return; const t = P.form[i]; P.form[i] = P.form[j]; P.form[j] = t; syncLegacy(P); touch(); render(); },
  pfdup: el => { const P = curProj(), i = +el.dataset.i; if (!P.form[i] || P.form.length >= MAX_FORM) return; P.form.splice(i + 1, 0, formItem(P.form[i])); syncLegacy(P); touch(); render(); },
  pwordsfrom: () => { const P = curProj(), sec = pst().sec, w = wordsFrom(P, sec); if (!w) return; P.words[sec] = w; touch(); render(); },
  pchoirhear: el => { const P = curProj(), part = el.dataset.part, A = arrangeSection(P, pst().sec, { choir: true, focus: part === 'all' ? undefined : part, melInst: Snd.inst(), choirLead: true }); playScript({ events: A.events, bpm: P.bpm, total: A.beats }, { computer: true }); },
  plead: () => { const P = curProj(); exportLeadSheet(P); toast('Lead sheet saved. Open it to print or save as PDF.'); },
  psecplay: async () => {
    const P = curProj(), sec = pst().sec, A = arrangeSection(P, sec, { melInst: Snd.inst() }), segs = [{ type: sec, start: 0, beats: A.beats, up: 0 }];
    const tl = arrangeSong(P).timeline.find(t => t.type === sec), places = loopPlacements(P, segs, { section: true, firstStart: tl ? tl.start : 0 });
    const audio = places.length ? await loopAudio(P, places) : [];
    playScript({ events: mixFilter(P, A.events.concat(midiLoopEvents(P, segs))), audio, bpm: P.bpm, total: A.beats }, { loop: true }); toast('Looping the ' + pst().sec + '. Press any other play button, or Stop on the song player, to stop.'); },
  pmelplay: () => { const P = curProj(), A = arrangeSection(P, pst().sec, { melInst: Snd.inst() }); playScript({ events: A.events, bpm: P.bpm, total: A.beats }); },
  pmelclear: () => { const P = curProj(), sec = pst().sec; if (P.melodies[sec] && P.melodies[sec].notes.length) { (P.takes[sec] = P.takes[sec] || []).unshift(P.melodies[sec]); P.takes[sec] = P.takes[sec].slice(0, 3); } P.melodies[sec] = { notes: [] }; pst().sel = -1; syncLegacy(P); touch(); render(); },
  ptakeplay: () => { const P = curProj(), t = pst().take; if (!t) return; const A = arrangeSection(P, t.sec, { melody: false }); playScript({ events: A.events.concat(t.notes.map(n => ({ t: n.t, d: n.d, notes: [n.m], inst: Snd.inst(), vel: 0.8 }))), bpm: P.bpm, total: A.beats }); },
  ptakekeep: () => { const P = curProj(), t = pst().take; if (!t) return; const old = P.melodies[t.sec]; if (old && old.notes.length) { (P.takes[t.sec] = P.takes[t.sec] || []).unshift(old); P.takes[t.sec] = P.takes[t.sec].slice(0, 3); } P.melodies[t.sec] = { notes: t.notes }; pst().take = null; pst().sel = -1; syncLegacy(P); touch(); toast('Take kept.'); render(); },
  ptakedrop: () => { pst().take = null; render(); },
  ptakeuse: el => { const P = curProj(), sec = pst().sec, list = P.takes[sec] || [], i = +el.dataset.i, t = list[i]; if (!t) return; const cur = P.melodies[sec]; list.splice(i, 1); if (cur && cur.notes.length) list.unshift(cur); P.takes[sec] = list.slice(0, 3); P.melodies[sec] = t; syncLegacy(P); touch(); toast('Earlier take restored.'); render(); },
  pts: el => {
    const P = curProj(), from = meterOf(P).bar, to = (METERS[+el.dataset.v] || METERS[4]).bar;
    // a chord a bar long stays a bar long in the new time signature (and two bars stay two bars)
    if (from !== to) SECTION_TYPES.forEach(t => P.sections[t].chords.forEach(c => { c.beats = Math.max(0.5, Math.round(c.beats / from * to * 2) / 2); }));
    P.ts = +el.dataset.v;
    if (P.ts === 4 && P.beat === 'meter') P.beat = 'ballad'; syncLegacy(P); touch(); render(); },
  pmidi: () => { const P = curProj(); const r = exportSongMidi(P); toast('MIDI file saved: ' + r.name); },
  pchart: el => { const P = curProj(), mode = el && el.dataset && el.dataset.mode === 'numbers' ? 'numbers' : 'names'; exportChart(P, mode); toast((mode === 'numbers' ? 'Number chart' : 'Chord chart') + ' saved. Open it to print or save as PDF.'); },
  pperform: () => { const P = curProj(); if (P) Perform.open(P); },
  pplay: () => { const P = curProj(); const A = arrangeSong(P, { melInst: Snd.inst() }); playScript(A.script); },
  pwav: async el => {
    const P = curProj(), mix = el.dataset.mix, info = $('#expinfo');
    if (info) info.textContent = 'Making the audio file… this takes a few seconds.';
    try {
      const r = await exportSongWav(P, { melody: mix !== 'backing', guide: mix === 'guide', focus: el.dataset.focus });
      if (info) info.textContent = 'Saved ' + r.name + ' (' + fmtTime(r.seconds) + ', ' + (r.bytes / 1048576).toFixed(1) + ' MB).';
      toast('Audio file saved.');
    } catch (e) { if (info) info.textContent = 'The audio file could not be made: ' + e.message; }
  },
  pguidesave: async () => { const P = curProj(), T = curTrack(P); toast('Preparing the track…'); const buf = await GuideStore.trackBuffer(P, T).catch(() => null); if (!buf) { toast('The recording was not found on this computer.', 'warn'); return; } saveFile(songSlug(P) + '_' + (T.id ? trackName(P, T).replace(/[^A-Za-z0-9]+/g, '-') : 'guide') + (T.fx.preset !== 'off' ? '_' + T.fx.preset : '') + '.wav', 'audio/wav', encodeWav(buf, 24, Object.assign(songMeta(P), { title: (P.title || 'Song') + ' - ' + trackName(P, T) }))); },
  ptkmain: el => { const P = curProj(), g = curTrack(P), i = +el.dataset.i; if (!g || !g.takes[i]) return; g.main = i; GuideStore.invalidate(); touch(); render(); },
  ptkdel: async el => {
    const P = curProj(), g = curTrack(P), i = +el.dataset.i; if (!g || !g.takes[i]) return;
    if (ui.confirmTake !== i) { ui.confirmTake = i; toast('Press Delete again to remove take ' + (g.takes[i].n || i + 1) + '.'); setTimeout(() => { ui.confirmTake = null; }, 4000); return; }
    ui.confirmTake = null;
    const [t] = g.takes.splice(i, 1); await GuideStore.del(t.k).catch(() => {});
    Object.keys(g.comp).forEach(k => { if (g.comp[k] === i) delete g.comp[k]; else if (g.comp[k] > i) g.comp[k]--; });
    if (!g.takes.length) { if (!g.id) P.guide = null; } else if (g.main >= g.takes.length || g.main === i) g.main = g.takes.length - 1; else if (g.main > i) g.main--;
    GuideStore.invalidate(); touch(); render();
  },
  plimport: () => { ui.drumImport = false; const f = $('#loopfile'); if (f) f.click(); },
  pdrumreal: () => { ui.drumImport = true; const f = $('#loopfile'); if (f) f.click(); },
  pdrumback: () => { const P = curProj(); P.beat = P.beatWas || 'rock'; delete P.beatWas; (P.loops || []).forEach(L => { if (L.role === 'drums') L.mute = true; }); touch(); toast('The built-in drums are back, and your drum recording is muted (it is still in the Loops list).'); render(); },
  pldel: async el => {
    const P = curProj(), i = +el.dataset.i, L = (P.loops || [])[i]; if (!L) return;
    if (ui.confirmLoop !== L.id) { ui.confirmLoop = L.id; toast('Press Delete again to remove ' + L.name + '.'); setTimeout(() => { ui.confirmLoop = null; }, 4000); return; }
    ui.confirmLoop = null; P.loops.splice(i, 1); if (L.kind !== 'midi') await GuideStore.del(loopKey(P, L)).catch(() => {}); touch(); render();
  },
  plhalf: el => loopSet(el, L => { L.bpm = Math.max(40, Math.round(L.bpm / 2 * 100) / 100); L.beats = Math.max(1, Math.round(L.beats / 2)); }),
  pldouble: el => loopSet(el, L => { L.bpm = Math.min(240, Math.round(L.bpm * 2 * 100) / 100); L.beats = L.beats * 2; }),
  plusebpm: el => { const P = curProj(), L = P.loops[+el.dataset.i]; if (!L) return; P.bpm = Math.max(40, Math.min(200, Math.round(L.bpm))); if (Math.abs(L.bpm - P.bpm) < 0.5) L.bpm = Math.round(L.bpm * 100) / 100; touch(); toast('The song is now at ' + P.bpm + ' BPM.'); render(); },
  plusekey: el => { const P = curProj(), L = P.loops[+el.dataset.i]; if (!L || L.keyPc === undefined || L.keyPc === null) return; P.key = E.ROOT_NAMES[L.minor ? (L.keyPc + 3) % 12 : L.keyPc]; L.tr = 0; touch(); toast('The song is now in ' + fmt(P.key) + '.'); render(); },
  pcomp: el => { const P = curProj(), g = curTrack(P), p = +el.dataset.p, t = +el.dataset.t; if (!g) return; if (t < 0) delete g.comp[p]; else g.comp[p] = t; GuideStore.invalidate(); touch(); render(); },
  pcompclear: () => { const P = curProj(), g = curTrack(P); if (!g) return; g.comp = {}; GuideStore.invalidate(); touch(); render(); },
  pguidedel: async () => { const P = curProj(); if (!ui.confirmGuideDel) { ui.confirmGuideDel = true; toast('Press Delete all takes again to remove the guide track.'); setTimeout(() => { ui.confirmGuideDel = false; }, 4000); return; } ui.confirmGuideDel = false; const g = curTrack(P); if (g) for (const t of g.takes) await GuideStore.del(t.k).catch(() => {}); if (g && g.id) { g.takes = []; g.comp = {}; g.main = 0; } else P.guide = null; GuideStore.invalidate(); touch(); render(); }
};
function loopSet(el, fn, quiet) { const P = curProj(), L = (P.loops || [])[+el.dataset.i]; if (!L) return; fn(L); touch(); if (!quiet) render(); }
/* importing: audio files are measured (tempo from the name, the length or the sound; key from the name) and kept
   on this computer; MIDI files are read into notes and drum hits */
async function importLoops(P, files) {
  const info = $('#loopinfo'), say = t => { if (info) info.textContent = t; };
  P.loops = P.loops || [];
  const songPc = E.pcOfName(P.key), used = [...new Set(songStructure(P))], asDrums = !!ui.drumImport, before = P.loops.length; ui.drumImport = false;
  for (const f of files) {
    if (P.loops.length >= MAX_LOOPS) { toast(MAX_LOOPS + ' loops is the most a song can hold.', 'warn'); break; }
    const id = 'l' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), nm = LoopTools.fromName(f.name), name = (nm.title || 'Loop').slice(0, 60);
    say('Reading ' + f.name + '…');
    try {
      if (/\.midi?$/i.test(f.name) || f.type === 'audio/midi') {
        const m = LoopTools.parseMidi(new Uint8Array(await f.arrayBuffer()));
        if (!m.notes.length && !m.drums.length) throw new Error('it has no notes');
        P.loops.push({ id, name, kind: 'midi', role: m.notes.length ? 'music' : 'drums', bpm: m.bpm || P.bpm, beats: m.beats, tr: 0, gain: 1, mute: false, secs: used, inst: 'piano', midi: { notes: m.notes.slice(0, 4000), drums: m.drums.slice(0, 4000) } });
      } else {
        if (f.size > 80 * 1048576) throw new Error('the file is larger than 80 MB');
        const c = Snd.ensure(); if (!c) throw new Error('sound is not available');
        const buf = await c.decodeAudioData(await f.arrayBuffer());
        const x = buf.getChannelData(0), secs = buf.duration, kind = secs > 30 ? 'beat' : 'loop';
        const tp = LoopTools.detectTempo(x, buf.sampleRate, { nameBpm: nm.bpm, kind, bar: meterOf(P).bar });
        const role = asDrums ? 'drums' : (nm.role || 'music'), tr = role !== 'drums' && nm.keyPc !== undefined ? LoopTools.transposeTo(nm.keyPc, nm.minor, songPc) : 0;
        await GuideStore.put('loop:' + P.id + ':' + id, f);
        P.loops.push({ id, name, kind, role, bpm: tp.bpm, beats: tp.beats, dur: Math.round(secs), keyPc: nm.keyPc, minor: !!nm.minor, tr: kind === 'beat' ? 0 : tr, gain: 1, mute: false, secs: kind === 'loop' ? used : [], offset: kind === 'beat' ? Math.round(LoopTools.firstOnset(x, buf.sampleRate) * 100) / 100 : 0, from: tp.from });
        say(name + ': ' + Math.round(tp.bpm * 10) / 10 + ' BPM (' + ({ name: 'from the file name', length: 'from its length', audio: 'measured', guess: 'a guess: please check' })[tp.from] + ')' + (tr ? ', moved ' + (tr > 0 ? 'up ' : 'down ') + Math.abs(tr) + ' to the song key' : '') + '.');
      }
      touch();
    } catch (e) { toast(f.name + ' could not be imported: ' + (e && e.message ? e.message : 'unknown file type') + '.', 'warn'); }
  }
  if (asDrums && P.loops.length > before) {   // a real drum recording replaces the built-in drums (they can be brought back)
    if (P.beat && P.beat !== 'none') { P.beatWas = P.beat; P.beat = 'none'; }
    P.loops.slice(before).forEach(L => { L.role = 'drums'; L.tr = 0; });
    touch(); toast('Your drum recording is in, and the built-in drums are off. If its tempo is different from the song\'s, press "Use the beat\'s tempo for the song" on it.');
  }
  render();
}
function formSet(el, fn) { const P = curProj(), it = P.form[+el.dataset.i]; if (!it) return; fn(it); P.form[+el.dataset.i] = formItem(it); syncLegacy(P); touch(); render(); }
function previewChord(P, c) {
  const v = Songcraft.voice(P.key, [c])[0], ctx = Snd.ensure(); if (!ctx || !S.prefs.sound) return;
  playScript({ events: [{ t: 0, d: 1.6, notes: v.rh, vel: 0.62 }, { t: 0, d: 1.6, notes: [v.bass], vel: 0.62, part: 'bass' }], bpm: 60, total: 2 }, { computer: true });
}
const PROJECT_BINDS = {
  ptrkname: el => { const T = curTrack(curProj()); if (T && T.id) { T.name = (el.value || 'Track').slice(0, 40); touch(); render(); } },
  ptrkkind: el => { const T = curTrack(curProj()); if (T && T.id) { T.kind = TRACK_KINDS[el.value] ? el.value : 'vocal'; touch(); } },
  mxfx: el => {
    const P = curProj(), c = mixerOf(P)[el.dataset.k], f = el.dataset.f; if (!c || !['lc', 'el', 'em', 'ef', 'eh', 'duck'].includes(f)) return;
    const v = +el.value; let txt;
    if (f === 'lc') c.lc = [0, 60, 100, 160, 250].includes(v) ? v : 0;
    else if (f === 'ef') { c.ef = Math.round(200 * Math.pow(25, Math.max(0, Math.min(100, v)) / 100)); txt = c.ef >= 1000 ? (Math.round(c.ef / 100) / 10) + ' kHz' : c.ef + ' Hz'; }
    else if (f === 'duck') { c.duck = Math.max(0, Math.min(0.9, v / 100)); txt = Math.round(c.duck * 100) + '%'; }
    else { c[f] = Math.max(-12, Math.min(12, Math.round(v))); txt = (c[f] > 0 ? '+' : '') + c[f] + ' dB'; }
    const t = $('#mxfx-' + f + '-' + el.dataset.k); if (t && txt !== undefined) t.textContent = txt; touch();
  },
  mxtone: el => { const P = curProj(), c = mixerOf(P)[el.dataset.k]; if (!c) return; c.tone = Math.max(-1, Math.min(1, +el.value / 100)); const t = $('#mxtone-' + el.dataset.k); if (t) t.textContent = el.value; touch(); },
  mxcomp: el => { const P = curProj(), c = mixerOf(P)[el.dataset.k]; if (!c) return; c.comp = Math.max(0, Math.min(1, +el.value / 100)); const t = $('#mxcomp-' + el.dataset.k); if (t) t.textContent = el.value + '%'; touch(); },
  mxroom: el => { const P = curProj(), c = mixerOf(P)[el.dataset.k]; if (!c) return; c.room = Math.max(0, Math.min(1, +el.value / 100)); const t = $('#mxroom-' + el.dataset.k); if (t) t.textContent = el.value + '%'; touch(); },
  mxvol: el => { const P = curProj(), c = mixChan(P, el); if (!c) return; const v = +el.value / 100; if (el.dataset.kind === 'track') c.gain = v; else c.v = v; const t = $('#mxv-' + el.dataset.kind + el.dataset.k); if (t) t.textContent = el.value + '%'; touch(); },
  mxpan: el => { const P = curProj(), c = mixChan(P, el); if (!c) return; c.pan = +el.value / 100; const lab = el.previousElementSibling && el.previousElementSibling.querySelector('.mono'); if (lab) lab.textContent = panLabel(c.pan); touch(); },
  pmaster: el => { const P = curProj(); P.master = { target: Mastering.TARGETS[el.value] ? el.value : 'stream' }; touch(); },
  pinfo: el => { const P = curProj(); P.info = Object.assign({}, P.info || {}, { [el.dataset.k]: String(el.value || '').slice(0, el.dataset.k === 'notes' ? 1000 : 120) }); touch(); const c = $('#copyline'); if (c) c.textContent = copyrightLine(P) || 'Fill in the writers to make the copyright line.'; },
  pending: el => { const P = curProj(); P.ending = ENDINGS[el.value] ? el.value : 'none'; touch(); render(); },
  pffill: el => formSet(el, it => { it.fill = el.checked; }),
  pffk: el => formSet(el, it => { it.fk = el.value; }),
  pprogname: el => { pst().progName = String(el.value || '').slice(0, 60); },
  phuman: el => { const P = curProj(); P.human = Math.max(0, Math.min(2, parseInt(el.value, 10) || 0)); touch(); render(); },
  pfswell: el => formSet(el, it => { it.swell = el.checked; }),
  pbpm: el => { const P = curProj(); P.bpm = +el.value; const v = $('#pbpmv'); if (v) v.textContent = P.bpm; touch(); },
  phumankeys: el => { const P = curProj(); P.humanKeys = Math.max(0, Math.min(2, Math.round(+el.value || 0))); touch(); },
  pperc: el => { const P = curProj(); P.perc = ['off', 'shaker', 'tambourine', 'congas', 'shakercongas'].indexOf(el.value) >= 0 ? el.value : 'off'; touch(); },
  pkit: el => { const P = curProj(); P.kit = +el.value || 0; touch(); },
  pautofill: el => { const P = curProj(); P.autoFill = !!el.checked; touch(); },
  pswing: el => { const P = curProj(); P.swing = +el.value; touch(); },
  plv: el => { const P = curProj(), it = formOf(P)[+el.dataset.i]; if (!it) return; const v = +el.value, k = el.dataset.k; it.lv = Object.assign({}, it.lv || {}); if (v) it.lv[k] = v; else delete it.lv[k]; if (!Object.keys(it.lv).length) delete it.lv; touch(); render(); },
  pedpart: el => { pst().edPart = el.value === 'drums' ? 'drums' : 'bass'; render(); },
  pedsec: el => { pst().edSec = el.value; render(); },
  pedlen: el => { pst().edLen = +el.value || 0.5; },
  pbasssound: el => { const P = curProj(); P.bassSound = BASS_SOUNDS[el.value] ? el.value : 'finger'; touch(); render(); },
  pbass: el => { const P = curProj(); P.bassStyle = BASS_STYLES[el.value] ? el.value : 'root'; touch(); render(); },
  pbeat: el => { const P = curProj(); P.beat = el.value === 'meter' ? (P.ts === 4 ? 'ballad' : 'meter') : el.value; touch(); render(); },
  pcopy: el => { const P = curProj(), from = el.value; if (!from || !P.sections[from]) return; const src = P.sections[from]; P.sections[pst().sec] = { degs: src.degs.slice(), len: src.len, chords: src.chords.map(c => Object.assign({}, c)) }; pst().ci = -1; syncLegacy(P); touch(); toast('Copied the chords from the ' + from + '.'); render(); },
  pcr: el => { const P = curProj(), c = P.sections[pst().sec].chords[pst().ci]; if (!c) return; c.r = +el.value; if (c.b === c.r) c.b = null; previewChord(P, c); if (pst().sec === 'Chorus') P.steps.prog = false; syncLegacy(P); touch(); render(); },
  pcq: el => { const P = curProj(), c = P.sections[pst().sec].chords[pst().ci]; if (!c || !Songcraft.QT[el.value]) return; c.q = el.value; previewChord(P, c); syncLegacy(P); touch(); render(); },
  pcb: el => { const P = curProj(), c = P.sections[pst().sec].chords[pst().ci]; if (!c) return; c.b = el.value === '' ? null : +el.value; previewChord(P, c); syncLegacy(P); touch(); render(); },
  pclen: el => { const P = curProj(), c = P.sections[pst().sec].chords[pst().ci]; if (!c) return; c.beats = +el.value; syncLegacy(P); touch(); render(); },
  pcpush: el => { const P = curProj(), c = P.sections[pst().sec].chords[pst().ci]; if (!c || pst().ci === 0) return; c.push = el.checked; touch(); render(); },
  panyr: el => { pst().anyR = +el.value; if (pst().anyB === +el.value) pst().anyB = ''; pst().anyOpen = true; anyRefresh(); },
  panyq: el => { pst().anyQ = el.value; pst().anyOpen = true; anyRefresh(); },
  panyb: el => { pst().anyB = el.value; pst().anyOpen = true; anyRefresh(); },
  pnewlen: el => { pst().newLen = +el.value; },
  psingback: el => { pst().singBack = el.value === 'click' ? 'click' : 'chords'; },
  psnap: el => { pst().snap = el.checked; },
  pwords: el => { const P = curProj(); P.words[pst().sec] = el.value.slice(0, 3000); touch(); render(); },
  pchoir: el => { const P = curProj(); P.choir = { on: el.checked }; touch(); },
  pfx: el => formSet(el, it => { it.x = +el.value; }),
  pfup: el => formSet(el, it => { it.up = +el.value; }),
  pftag: el => formSet(el, it => { it.tag = +el.value; }),
  pfen: el => formSet(el, it => { it.en = el.value; }),
  pfvamp: el => formSet(el, it => { it.vamp = el.checked; if (it.vamp && it.x < 4) it.x = 4; }),
  pfstop: el => formSet(el, it => { it.stop = el.checked; }),
  pflead: el => formSet(el, it => { it.lead = el.checked; }),
  pwithguide: el => { pst().withGuide = el.checked; },
  pkbdout: el => { S.prefs.kbdOut = Object.assign({}, S.prefs.kbdOut || {}, { on: el.value === '1' }); stopProjPlay(); touch(); render(); },
  kbdmodel: el => { S.prefs.keyboard = el.value || undefined; if (!el.value) delete S.prefs.keyboard; touch(); render(); },
  midisound: el => { S.prefs.midiSound = el.value === 'keyboard' ? 'keyboard' : 'both'; touch(); },
  pkbdprog: el => { S.prefs.kbdOut = Object.assign({}, S.prefs.kbdOut || {}, { prog: +el.value || 0 }); touch(); },
  pmic: el => { S.prefs.micId = el.value || undefined; if (!el.value) delete S.prefs.micId; touch(); },
  pfxpreset: el => { const P = curProj(), g = curTrack(P); if (!g || !VocalFX.PRESETS[el.value]) return; g.fx = Object.assign({}, g.fx, { preset: el.value }); GuideStore.invalidate(); touch(); render(); },
  pfxnr: el => { const P = curProj(), g = curTrack(P); if (!g) return; g.fx = Object.assign({}, g.fx, { nr: el.value in VocalFX.NR_LEVELS ? el.value : 'preset' }); GuideStore.invalidate(); touch(); },
  pfxtune: el => { const P = curProj(), g = curTrack(P); if (!g) return; g.fx = Object.assign({}, g.fx, { tune: ['gentle', 'medium', 'full'].indexOf(el.value) >= 0 ? el.value : 'off' }); GuideStore.invalidate(); touch(); render(); },
  pfxtunescale: el => { const P = curProj(), g = curTrack(P); if (!g) return; g.fx = Object.assign({}, g.fx, { tuneScale: el.value === 'any' ? 'any' : 'key' }); GuideStore.invalidate(); touch(); },
  pfxroom: el => { const P = curProj(), g = curTrack(P); if (!g) return; g.fx = Object.assign({}, g.fx, { reverb: el.checked }); GuideStore.invalidate(); touch(); },
  pmonitor: el => { pst().monitor = el.checked; },
  plfiles: el => { const P = curProj(); importLoops(P, Array.from(el.files || [])); el.value = ''; },
  plmute: el => loopSet(el, L => { L.mute = el.checked; }),
  plbpm: el => loopSet(el, L => { const v = +el.value; if (v >= 40 && v <= 240) { if (L.kind === 'loop') L.beats = Math.max(1, Math.round(L.beats * v / L.bpm)); L.bpm = v; } }),
  pltr: el => loopSet(el, L => { L.tr = +el.value; }),
  plgain: el => loopSet(el, L => { L.gain = +el.value / 100; }, true),
  plrole: el => loopSet(el, L => { L.role = el.value === 'drums' ? 'drums' : 'music'; }),
  plinst: el => loopSet(el, L => { L.inst = Snd.hasInst(el.value) ? el.value : 'piano'; }, true),
  ploff: el => loopSet(el, L => { L.offset = Math.max(0, +el.value); const v = $('#lpoff' + el.dataset.i); if (v) v.textContent = L.offset.toFixed(2); }, true),
  plsec: el => loopSet(el, L => { const set = new Set(L.secs || []); if (el.checked) set.add(el.dataset.s); else set.delete(el.dataset.s); L.secs = SECTION_TYPES.filter(t => set.has(t)); }),
  pmix: el => { const P = curProj(); mixerOf(P)[el.dataset.k].mute = !el.checked; touch(); render(); },
  pguidegain: el => { const T = curTrack(curProj()); if (T) { T.gain = +el.value / 100; touch(); } },
  pguidenudge: el => { const T = curTrack(curProj()); if (T) { T.nudgeMs = +el.value; const v = $('#nudgev'); if (v) v.textContent = el.value; touch(); } }
};
