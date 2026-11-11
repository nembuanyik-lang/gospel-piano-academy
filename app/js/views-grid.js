'use strict';
/* ---------------------------------------------------------------- Edit by hand: a grid for the bass and the drums of one section
   The automatic notes are shown as a grid (a column is a sixteenth of a bar's beat). Click an empty square to add a note, click a
   note to take it away. Once you change a section it plays exactly as drawn (P.edits); "Back to automatic" gives it back. */
const GRID = { col: 16, row: 18, step: 0.25 };
const DRUM_LANES = [['c', 'Crash'], ['tm', 'Tom'], ['o', 'Open hat'], ['h', 'Hi-hat'], ['cl', 'Clap'], ['r', 'Side stick'], ['s', 'Snare'], ['k', 'Kick']];
const BASS_LO = 28, BASS_HI = 55;
function gridState(P) {
  const st = pst(), types = songStructure(P).filter((t, i, a) => a.indexOf(t) === i);
  const sec = types.includes(st.edSec) ? st.edSec : types[0] || 'Chorus', part = st.edPart === 'drums' ? 'drums' : 'bass';
  return { st, types, sec, part, len: st.edLen || 0.5 };
}
function gridNotes(P, part, sec) {
  const hand = P.edits && P.edits[part] && P.edits[part][sec];
  return { hand: !!hand, notes: hand || autoPart(P, sec, part) };
}
function editCard(P) {
  const g = gridState(P), sc = sectionChords(P, g.sec), beats = sc.beats, bar = meterOf(P).bar, G = gridNotes(P, g.part, g.sec);
  const rows = g.part === 'bass' ? Array.from({ length: BASS_HI - BASS_LO + 1 }, (_, i) => BASS_HI - i) : DRUM_LANES;
  const sharps = Songcraft.keySig(P.key) > 0, W = Math.round(beats / GRID.step) * GRID.col, H = rows.length * GRID.row;
  const label = r => g.part === 'bass' ? E.midiName(r, sharps) : r[1];
  const rowOf = n => g.part === 'bass' ? BASS_HI - n.m : DRUM_LANES.findIndex(l => l[0] === n.drum);
  const blocks = G.notes.filter(n => n.t < beats && rowOf(n) >= 0 && rowOf(n) < rows.length).map(n => '<i class="edn ' + (g.part === 'bass' ? 'b' : 'd') + (G.hand ? '' : ' auto') + '" style="left:' + (n.t / GRID.step * GRID.col) + 'px;top:' + rowOf(n) * GRID.row + 'px;width:' + (g.part === 'bass' ? Math.max(GRID.col - 2, n.d / GRID.step * GRID.col - 2) : GRID.col - 2) + 'px"></i>').join('');
  const labels = rows.map((r, i) => '<span class="edl' + (g.part === 'bass' && [1, 3, 6, 8, 10].includes(((r % 12) + 12) % 12) ? ' blk' : '') + '" style="height:' + GRID.row + 'px">' + esc(label(r)) + '</span>').join('');
  return '<section class="card" id="edcard"><h3>Edit by hand</h3>' +
    '<p class="muted">Change the bass or the drums note by note for one part of the song. Click an empty square to add a note, click a note to take it away. A part you change plays exactly as you drew it; "Back to automatic" gives it up.</p>' +
    '<div class="grid3"><label class="field"><span>Which part</span><select data-bind="pedpart"><option value="bass"' + (g.part === 'bass' ? ' selected' : '') + '>Bass</option><option value="drums"' + (g.part === 'drums' ? ' selected' : '') + '>Drums</option></select></label>' +
    '<label class="field"><span>Which section</span><select data-bind="pedsec">' + g.types.map(t => '<option' + (t === g.sec ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>' +
    (g.part === 'bass' ? '<label class="field"><span>New note length</span><select data-bind="pedlen">' + [[0.25, 'A sixteenth of a beat'], [0.5, 'Half a beat'], [1, 'One beat'], [2, 'Two beats'], [4, 'A whole bar']].map(o => '<option value="' + o[0] + '"' + (o[0] === g.len ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label>' : '') + '</div>' +
    '<p class="tiny">' + (G.hand ? '<b>Drawn by hand.</b> This section plays exactly as shown.' : 'This is the <b>automatic</b> version (shown paler). Click anywhere to start changing it.') + '</p>' +
    '<div class="edwrap"><div class="edlabels" style="padding-top:0">' + labels + '</div><div class="edscroll"><div class="edgrid" data-part="' + g.part + '" data-sec="' + esc(g.sec) + '" style="width:' + W + 'px;height:' + H + 'px;--col:' + GRID.col + 'px;--row:' + GRID.row + 'px;--beat:' + GRID.col * 4 + 'px;--bar:' + GRID.col * 4 * bar + 'px">' + blocks + '</div></div></div>' +
    '<div class="row wrap"><button class="btn ghost sm" type="button" data-act="pedhear">' + icon('play') + 'Hear this section</button>' +
    (G.hand ? '<button class="btn ghost sm" type="button" data-act="pedclear">Clear every note</button><button class="btn ghost sm" type="button" data-act="pedreset">Back to automatic</button>' : '') + '</div></section>';
}
function gridEdit(P, part, sec, nodeX, nodeY) {
  P.edits = P.edits || {}; P.edits[part] = P.edits[part] || {};
  let list = P.edits[part][sec]; if (!list) list = P.edits[part][sec] = autoPart(P, sec, part).map(n => Object.assign({}, n));
  const beats = sectionChords(P, sec).beats, col = Math.floor(nodeX / GRID.col), row = Math.floor(nodeY / GRID.row), t = col * GRID.step;
  if (t >= beats - 1e-6) return;
  if (part === 'bass') {
    const m = BASS_HI - row; if (m < BASS_LO || m > BASS_HI) return;
    const hit = list.findIndex(n => n.m === m && t >= n.t - 1e-6 && t < n.t + n.d - 1e-6);
    if (hit >= 0) list.splice(hit, 1); else list.push({ t, d: Math.min(gridState(P).len, beats - t), m, v: 0.8 });
  } else {
    const lane = DRUM_LANES[row]; if (!lane) return;
    const hit = list.findIndex(n => n.drum === lane[0] && Math.abs(n.t - t) < 1e-6);
    if (hit >= 0) list.splice(hit, 1); else list.push({ t, d: 0.1, drum: lane[0], v: lane[0] === 'h' || lane[0] === 'o' ? 0.5 : 0.85 });
  }
  list.sort((a, b) => a.t - b.t);
}
document.addEventListener('click', ev => {
  const grid = ev.target.closest && ev.target.closest('.edgrid'); if (!grid) return;
  const P = curProj(); if (!P) return;
  const r = grid.getBoundingClientRect(), zoom = r.width ? grid.offsetWidth / r.width : 1;
  const wrap = grid.closest('.edwrap'), keepL = wrap.scrollLeft, keepT = wrap.scrollTop;
  gridEdit(P, grid.dataset.part, grid.dataset.sec, (ev.clientX - r.left) * zoom, (ev.clientY - r.top) * zoom);
  touch(); render();
  const sc = document.querySelector('.edwrap'); if (sc) { sc.scrollLeft = keepL; sc.scrollTop = keepT; }
});

/* ---------------------------------------------------------------- Levels through the song: louder or softer for a part in one part of the form */
const LV_CHOICES = [[-60, 'Silent'], [-6, 'Much softer'], [-3, 'Softer'], [0, 'As mixed'], [3, 'Louder'], [6, 'Much louder']];
function levelsCard(P) {
  const form = formOf(P); if (form.length < 2 && !form.some(i => i.lv)) return '';
  const A = arrangeSong(Object.assign({}, P, { mixer: undefined }), { melInst: Snd.inst() }), SHORT = { chords: 'Keys', bass: 'Bass', drums: 'Drums', melody: 'Melody', choir: 'Choir', loops: 'Loops' };
  const has = k => k === 'loops' ? (P.loops || []).length > 0 : k === 'choir' ? !!(P.choir && P.choir.on) : A.events.some(e => Snd.partOf(e) === k);
  const cols = Object.keys(MIX_PARTS).filter(has).map(k => [k, SHORT[k]]).concat(recordedTracks(P).map(r => ['tk' + (r.id || ''), r.id ? r.name : 'Lead vocal']));
  if (!cols.length) return '';
  const used = form.some(i => i.lv);
  return '<section class="card"><p class="eyebrow">Levels through the song</p><h3>Louder or softer in each part</h3>' +
    '<p class="muted">Pull a part down in the verse and up in the last chorus, or leave the keys out of the bridge. Pick a level for a part in one part of the song. "As mixed" keeps the mixer setting.</p>' +
    '<div class="tw"><table class="lvtable"><thead><tr><th scope="col">Part of the song</th>' + cols.map(c => '<th scope="col">' + esc(c[1]) + '</th>').join('') + '</tr></thead><tbody>' +
    form.map((it, i) => '<tr><th scope="row">' + (i + 1) + '. ' + esc(itemLabel(it, P)) + '</th>' + cols.map(c => {
      const v = it.lv && it.lv[c[0]] ? it.lv[c[0]] : 0;
      return '<td><select data-bind="plv" data-i="' + i + '" data-k="' + esc(c[0]) + '" aria-label="' + esc(c[1] + ' in ' + itemLabel(it, P)) + '"' + (v ? ' class="on"' : '') + '>' + LV_CHOICES.map(o => '<option value="' + o[0] + '"' + (o[0] === v ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></td>';
    }).join('') + '</tr>').join('') + '</tbody></table></div>' +
    (used ? '<div class="row wrap"><button class="btn ghost sm" type="button" data-act="plvreset">Back to the mixer setting everywhere</button></div>' : '') + '</section>';
}
