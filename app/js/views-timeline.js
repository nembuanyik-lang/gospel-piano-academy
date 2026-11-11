'use strict';
/* ---------------------------------------------------------------- the song's timeline, fixing recordings, and the stage screen
   - Timeline: every recorded track drawn as a waveform along the song, with the parts of the song above it and a moving cursor.
   - Fixing: choose a part (drag on a waveform, or pick a part of the song) and silence it, or sing just that part again
     (punch-in: the band counts you in, only that part is kept and joined to the take). The recording itself is never changed.
   - Stage screen: the words and chords in big letters, following the song while you play or record.
   - Undo and redo, and the reminder to keep a copy of the recordings in a song package. */

SongHistory.setSource(() => { try { return curProj(); } catch (e) { return null; } });   // touch() asks which song is open
const TL_MIN_PART = 0.3;     // the shortest part that can be selected (seconds)
const TL_MAX_PUNCH = 90;     // the longest part that can be sung again at once
const tlState = () => { const p = pst(), id = (typeof curProj === 'function' && curProj() || {}).id; if (!p.tl || p.tlPid !== id) { p.tl = { zoom: 1, sel: null }; p.tlPid = id; } return p.tl; };   // the chosen part belongs to the song it was chosen in
const tlTrackId = P => { const s = tlState().sel; return s ? s.id : (pst().trk || ''); };
const tlNudge = (P, id) => { const T = trackOf(P, id); return T ? (T.nudgeMs || 0) / 1000 : 0; };
const tlFmt = s => { s = Math.max(0, s); const m = Math.floor(s / 60); return m + ':' + (s - m * 60).toFixed(1).padStart(4, '0'); };

/* ---- undo and redo, and the reminder to keep a copy ---- */
function undoRowHtml() {
  const h = SongHistory;
  return '<div class="row wrap undorow" role="group" aria-label="Undo and redo">' +
    '<button type="button" class="btn ghost sm" data-act="hundo"' + (h.canUndo() ? '' : ' disabled') + ' title="Undo the last change (Ctrl+Z)">Undo</button>' +
    '<button type="button" class="btn ghost sm" data-act="hredo"' + (h.canRedo() ? '' : ' disabled') + ' title="Redo (Ctrl+Y)">Redo</button>' +
    '<span class="tiny muted">Ctrl+Z to undo, Ctrl+Y to redo</span></div>';
}
const hasUnkeptRecordings = P => !!(P.recAt && (!P.pkgAt || P.pkgAt < P.recAt)) && recordedTracks(P).length > 0;
function safetyHtml(P) {
  if (!hasUnkeptRecordings(P) || ui.safetyLater === P.id) return '';
  return '<div class="callout warn" role="status"><p><b>Your recordings are only on this computer.</b> If this laptop is lost, stolen or breaks, they cannot be brought back. ' +
    'Save a song package now: one file with the song and every recording. Keep it on a flash drive or in Google Drive.</p>' +
    '<div class="row wrap"><button class="btn primary sm" type="button" data-act="ppkg">Save a song package now</button><button class="btn ghost sm" type="button" data-act="hsafelater">Remind me later</button></div>' +
    '<p class="tiny" id="expinfo" aria-live="polite"></p></div>';
}
/* the list of songs: which ones have recordings that are not in a package */
function safetyListHtml() {
  const list = S.songs.filter(p => { try { return hasUnkeptRecordings(p); } catch (e) { return false; } });
  if (!list.length) return '';
  return '<div class="callout warn" role="status"><p><b>' + list.length + (list.length === 1 ? ' song has' : ' songs have') + ' recordings that are only on this computer:</b> ' + list.slice(0, 5).map(p => esc(p.title || 'My song')).join(', ') + (list.length > 5 ? ' and more' : '') +
    '. Open each one and save a song package, so nothing is lost if the laptop is lost or breaks.</p></div>';
}

/* ---- the timeline card ---- */
function timelineCard(P) {
  const rec = recordedTracks(P); if (!rec.length) return '';
  const tl = tlState(), parts = guideParts(P), sel = tl.sel, T = trackOf(P, tlTrackId(P)) || rec[0].T, id = T.id || '';
  const nudge = (T.nudgeMs || 0) / 1000;
  const tracks = rec.map(r => '<div class="tl-row' + (r.id === id ? ' on' : '') + '" data-tid="' + esc(r.id) + '"><div class="tl-label"><button type="button" class="chip' + (r.id === id ? ' on' : '') + '" data-act="htltrack" data-id="' + esc(r.id) + '" aria-pressed="' + (r.id === id) + '">' + esc(r.name) + '</button></div>' +
    '<canvas class="tl-wave" data-tid="' + esc(r.id) + '" height="72" role="img" aria-label="Waveform of ' + esc(r.name) + '. Drag across it to choose a part."></canvas></div>').join('');
  const edits = (T.mutes || []).map((m, i) => '<li><span>Silenced ' + tlFmt(m.a + nudge) + ' to ' + tlFmt(m.b + nudge) + '</span><button type="button" class="btn ghost sm" data-act="htledel" data-t="mute" data-i="' + i + '">Remove</button></li>').join('') +
    (T.patches || []).map((p, i) => '<li><span>Sung again ' + tlFmt(p.a + nudge) + ' to ' + tlFmt(p.b + nudge) + '</span><button type="button" class="btn ghost sm" data-act="htledel" data-t="patch" data-i="' + i + '">Remove</button></li>').join('');
  return '<section class="card timeline" id="tlcard"><p class="eyebrow">Timeline</p><h3>See your recordings and fix a part</h3>' +
    '<p class="muted">Each recorded track is drawn along the song. <b>Drag across a track</b> to choose a part, or pick a part of the song below. Then silence it, hear it with the band, or <b>sing just that part again</b>: the band counts you in, and only that part is kept. Nothing is ever cut out of your recording, and Undo brings every change back.</p>' +
    '<div class="row wrap tl-tools"><button type="button" class="btn ghost sm" data-act="htlzoom" data-d="-1" aria-label="Zoom out">Zoom out</button><button type="button" class="btn ghost sm" data-act="htlzoom" data-d="0">Fit the song</button><button type="button" class="btn ghost sm" data-act="htlzoom" data-d="1" aria-label="Zoom in">Zoom in</button>' +
    '<span class="tiny muted" id="tlzoomv">' + Math.round(tl.zoom * 100) + '%</span></div>' +
    '<div class="tl-scroll" id="tlscroll"><div class="tl-inner" id="tlinner"><canvas class="tl-ruler" id="tlruler" height="34" aria-hidden="true"></canvas>' + tracks + '<div class="tl-head" id="tlhead" aria-hidden="true"></div></div></div>' +
    '<div class="grid3 tl-pick"><label class="field"><span>Choose a part of the song</span><select data-bind="htlpart"><option value="">Choose…</option>' + parts.map((p, i) => '<option value="' + i + '">' + esc(p.label) + ' (' + tlFmt(p.start) + ')</option>').join('') + '</select></label>' +
    '<label class="field"><span>From (seconds)</span><input type="number" min="0" step="0.05" inputmode="decimal" id="tlfrom" data-bind="htlfrom" value="' + (sel ? sel.a.toFixed(2) : '') + '"></label>' +
    '<label class="field"><span>To (seconds)</span><input type="number" min="0" step="0.05" inputmode="decimal" id="tlto" data-bind="htlto" value="' + (sel ? sel.b.toFixed(2) : '') + '"></label></div>' +
    '<p class="tiny" id="tlinfo" aria-live="polite">' + (sel ? 'Chosen: ' + esc(tlFmt(sel.a)) + ' to ' + esc(tlFmt(sel.b)) + ' on ' + esc(trackName(P, trackOf(P, sel.id))) + '.' : 'No part chosen yet.') + '</p>' +
    '<div class="row wrap"><button type="button" class="btn ghost sm" data-act="htlhear" id="tlhear">' + icon('play') + 'Hear this part with the band</button>' +
    '<button type="button" class="btn ghost sm" data-act="htlsilence">Silence this part</button>' +
    '<button type="button" class="btn primary sm" data-act="htlpunch" id="tlpunch">' + icon('mic') + 'Sing this part again</button>' +
    '<button type="button" class="btn ghost sm" data-act="htlclear">Clear the choice</button></div>' +
    '<h4>Fixes on ' + esc(trackName(P, T)) + '</h4>' + (edits ? '<ul class="tl-edits">' + edits + '</ul><button type="button" class="btn ghost sm" data-act="htledelall">Remove all fixes on this track</button>' : '<p class="tiny muted">None yet. The recording is exactly as it was sung.</p>') + '</section>';
}

/* ---- drawing ---- */
const tlCss = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';
const TL = { pps: 40, total: 10, peaks: new Map() };
function tlLayout(P, root) {
  const sc = root.querySelector('#tlscroll'); if (!sc) return null;
  const rec = recordedTracks(P); let total = songSeconds(P);
  rec.forEach(r => { total = Math.max(total, (r.T.dur || 0) + (r.T.nudgeMs || 0) / 1000); });
  total = Math.max(5, total);
  const zoom = tlState().zoom, avail = Math.max(240, sc.clientWidth - 2);
  TL.total = total; TL.pps = Math.max(2, avail / total * zoom);
  const W = Math.ceil(total * TL.pps) + 1;
  root.querySelector('#tlinner').style.width = W + 'px';
  root.querySelectorAll('#tlinner canvas').forEach(c => { const dpr = Math.min(2, window.devicePixelRatio || 1); c.style.width = W + 'px'; c.width = Math.round(W * dpr); c._dpr = dpr; c._w = W; });
  return W;
}
function tlDrawRuler(P, root) {
  const c = root.querySelector('#tlruler'); if (!c) return;
  const x = c.getContext('2d'), d = c._dpr || 1, W = c._w, H = 34, parts = guideParts(P), line = tlCss('--line'), fg = tlCss('--fg'), muted = tlCss('--muted'), soft = tlCss('--accent-soft'), gold = tlCss('--gold-soft');
  c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H); x.font = '600 11px system-ui, sans-serif'; x.textBaseline = 'middle';
  parts.forEach((p, i) => {
    const a = p.start * TL.pps, b = p.end * TL.pps; x.fillStyle = i % 2 ? gold : soft; x.fillRect(a, 0, Math.max(1, b - a), 18);
    x.strokeStyle = line; x.beginPath(); x.moveTo(a + .5, 0); x.lineTo(a + .5, H); x.stroke();
    x.save(); x.beginPath(); x.rect(a, 0, Math.max(0, b - a - 2), 18); x.clip(); x.fillStyle = fg; x.fillText(p.label, a + 4, 9); x.restore();
  });
  // bar lines
  const spb = 60 / P.bpm, bar = spb * METERS[P.ts].bar, every = Math.max(1, Math.ceil(46 / (bar * TL.pps)));
  x.fillStyle = muted; x.strokeStyle = line;
  for (let n = 0, t = 0; t < TL.total + bar; n++, t += bar) { const px = t * TL.pps; x.beginPath(); x.moveTo(px + .5, 24); x.lineTo(px + .5, H); x.stroke(); if (n % every === 0) x.fillText(String(n + 1), px + 3, 28); }
}
function tlDrawWave(P, root, canvas, data, T) {
  const x = canvas.getContext('2d'), d = canvas._dpr || 1, W = canvas._w, H = 72, mid = H / 2;
  canvas.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H);
  const line = tlCss('--line'), accent = tlCss('--accent'), muted = tlCss('--muted'), ok = tlCss('--ok'), nudge = (T.nudgeMs || 0) / 1000;
  x.fillStyle = line; x.fillRect(0, mid, W, 1);
  if (!data) { x.fillStyle = muted; x.font = '12px system-ui, sans-serif'; x.textBaseline = 'middle'; x.fillText('Loading…', 8, mid); return; }
  x.fillStyle = accent;
  const pk = data.peaks, per = 100;   // pairs per second
  for (let px = 0; px < W; px++) {
    const t0 = px / TL.pps - nudge, t1 = (px + 1) / TL.pps - nudge; if (t1 < 0 || t0 > data.dur) continue;
    let i0 = Math.max(0, Math.floor(t0 * per)), i1 = Math.min(pk.length / 2 - 1, Math.max(i0, Math.floor(t1 * per))), lo = 0, hi = 0;
    for (let i = i0; i <= i1; i++) { if (pk[i * 2] < lo) lo = pk[i * 2]; if (pk[i * 2 + 1] > hi) hi = pk[i * 2 + 1]; }
    const top = mid - Math.min(1, hi * 1.0) * (mid - 3), bot = mid - Math.max(-1, lo * 1.0) * (mid - 3);
    x.fillRect(px, top, 1, Math.max(1, bot - top));
  }
  // parts sung again (green strip) and parts silenced (hatched grey)
  (T.patches || []).forEach(p => { x.fillStyle = ok; x.globalAlpha = 0.9; x.fillRect((p.a + nudge) * TL.pps, H - 5, Math.max(2, (p.b - p.a) * TL.pps), 5); x.globalAlpha = 1; });
  (T.mutes || []).forEach(m => {
    const a = (m.a + nudge) * TL.pps, w = Math.max(2, (m.b - m.a) * TL.pps); x.fillStyle = muted; x.globalAlpha = 0.28; x.fillRect(a, 0, w, H); x.globalAlpha = 0.5;
    x.strokeStyle = muted; x.beginPath(); for (let k = -H; k < w; k += 8) { x.moveTo(a + k, H); x.lineTo(a + k + H, 0); } x.save(); x.beginPath(); x.rect(a, 0, w, H); x.clip(); x.stroke(); x.restore(); x.globalAlpha = 1;
  });
}
async function tlDrawAll(P, root) {
  const rec = recordedTracks(P);
  for (const r of rec) {
    const c = root.querySelector('.tl-wave[data-tid="' + CSS.escape(r.id) + '"]'); if (!c) continue;
    tlDrawWave(P, root, c, null, r.T);
    const data = await GuideStore.peaks(P, r.T).catch(() => null);
    if (!root.contains(c)) return;
    tlDrawWave(P, root, c, data, r.T);
  }
}
/* the chosen part: a shaded box over the chosen track, and the text under the waveforms */
function tlShowSel(P, root) {
  root.querySelectorAll('.tl-sel').forEach(e => e.remove());
  const s = tlState().sel; if (!s) return;
  const row = root.querySelector('.tl-row[data-tid="' + CSS.escape(s.id) + '"]'); if (!row) return;
  const box = document.createElement('div'); box.className = 'tl-sel'; box.style.left = (s.a * TL.pps) + 'px'; box.style.width = Math.max(2, (s.b - s.a) * TL.pps) + 'px'; row.appendChild(box);
  const info = root.querySelector('#tlinfo'), f = root.querySelector('#tlfrom'), t = root.querySelector('#tlto');
  if (info) info.textContent = 'Chosen: ' + tlFmt(s.a) + ' to ' + tlFmt(s.b) + ' (' + (s.b - s.a).toFixed(1) + ' seconds) on ' + trackName(P, trackOf(P, s.id)) + '.';
  if (f && document.activeElement !== f) f.value = s.a.toFixed(2);
  if (t && document.activeElement !== t) t.value = s.b.toFixed(2);
}
function tlSetHead(root, sec) { const h = root.querySelector('#tlhead'); if (h) { h.style.left = (sec * TL.pps) + 'px'; h.style.display = sec >= 0 ? 'block' : 'none'; } }

/* ---- the stage screen and the moving cursor, started together when the song plays or records ---- */
function stageLyrics(P, type) {
  const k = { Verse: 'verse', Chorus: 'chorus', Bridge: 'bridge' }[type];
  const t = (k && P.lyrics && P.lyrics[k] && P.lyrics[k].trim()) || ((P.words || {})[type] || '').replace(/-\s*/g, '').replace(/\s_+/g, '').trim();
  return t ? t.split(/\r?\n/).map(x => x.trim()).filter(Boolean) : [];
}
/* what the singer should see at a moment in the song (also sent to the phone remote) */
function stageAt(P, A, beat) {
  const segs = A.timeline, si = segs.findIndex(t => beat >= t.start && beat < t.start + t.beats);
  if (beat < 0 || (si < 0 && beat < (segs[0] ? segs[0].start : 0))) return { phase: 'ready', sec: 'Get ready', now: String(Math.max(1, Math.ceil(-beat))), next: '', lines: [], li: -1, si: -1 };
  if (si < 0) return { phase: 'end', sec: 'The end', now: '', next: '', lines: [], li: -1, si: -1 };
  const seg = segs[si]; let ci = 0; seg.chs.forEach((c, i) => { if (beat >= c.t - 1e-6) ci = i; });
  const nx = seg.chs[ci + 1] || (segs[si + 1] && segs[si + 1].chs[0]);
  const ly = stageLyrics(P, seg.type), frac = Math.min(0.999, Math.max(0, (beat - seg.start) / seg.beats)), li = ly.length ? Math.floor(frac * ly.length) : -1;
  return { phase: 'song', sec: seg.label + (ly.length ? ' · line ' + (li + 1) + ' of ' + ly.length : ''), now: seg.chs[ci].name, next: nx ? 'Next: ' + nx.name : '', nownum: seg.chs[ci].number, nextnum: nx ? 'Next: ' + nx.number : '', lines: ly, li, si, type: seg.type };
}
/* start: audio-clock time at which the (partial) song begins; from: the beat it begins at */
function liveStart(P, start, from, opts) {
  opts = opts || {};
  const A = arrangeSong(P), spb = 60 / P.bpm, root = document.getElementById('main') || document.body;
  let el = null, timer = null, last = -1;
  const showStage = opts.stage !== false && pst().stage !== false;
  if (showStage) {
    el = document.createElement('div'); el.className = 'stage'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Words and chords for singing');
    el.innerHTML = '<div class="stage-top"><span class="stage-sec" id="stsec"></span><button type="button" class="btn ghost sm" id="stclose">Hide</button></div><div class="stage-chords"><span class="stage-now" id="stnow"></span><span class="stage-next" id="stnext"></span></div><div class="stage-lines" id="stlines"></div>';
    document.body.appendChild(el);
    el.querySelector('#stclose').addEventListener('click', () => { if (el) { el.remove(); el = null; } });
  }
  const tick = () => {
    const beat = (Snd.now() - start) / spb + from;
    tlSetHead(root, Math.max(-1, beat * spb));
    const v = stageAt(P, A, beat);
    if (typeof RemoteLink !== 'undefined') RemoteLink.live(v);
    if (!el) return;
    const secEl = el.querySelector('#stsec'), now = el.querySelector('#stnow'), next = el.querySelector('#stnext'), lines = el.querySelector('#stlines');
    secEl.textContent = v.sec; now.textContent = v.now; next.textContent = v.next;
    if (v.phase !== 'song') { if (v.phase === 'ready') { lines.innerHTML = ''; last = -1; } return; }
    const key = v.si + ':' + v.li;
    if (key !== last) { last = key; lines.innerHTML = v.lines.length ? v.lines.map((t, i) => '<p class="' + (i === v.li ? 'on' : i < v.li ? 'past' : '') + '">' + esc(t) + '</p>').join('') : '<p class="past">' + (v.type === 'Chorus' || v.type === 'Verse' || v.type === 'Bridge' ? 'No words written for this part yet.' : '') + '</p>'; }
  };
  tick(); timer = setInterval(tick, 80);
  return { stop() { clearInterval(timer); timer = null; if (el) { el.remove(); el = null; } tlSetHead(root, -1); if (typeof RemoteLink !== 'undefined') RemoteLink.live(null); } };
}

/* ---- the timeline's behaviour on the song screen ---- */
let tlHear = null, tlPunch = null;
function tlBusy() { return !!(tlPunch || ui.recording); }
function mountTimeline(root, P) {
  const cl = [];
  cl.push(() => { if (tlPunch) { try { tlPunch.rec.stop(); } catch (e) { /* ignore */ } } if (tlHear) { tlHear.stop(); tlHear = null; } });
  if (!root.querySelector('#tlcard')) return () => cl.forEach(f => f());
  const relayout = () => { if (!tlLayout(P, root)) return; tlDrawRuler(P, root); tlDrawAll(P, root); tlShowSel(P, root); };
  relayout();
  let rz = null; const onResize = () => { clearTimeout(rz); rz = setTimeout(relayout, 150); };
  window.addEventListener('resize', onResize); cl.push(() => { clearTimeout(rz); window.removeEventListener('resize', onResize); });
  // drag across a waveform to choose a part
  root.querySelectorAll('.tl-wave').forEach(c => {
    let drag = null;
    const at = e => { const r = c.getBoundingClientRect(); return Math.max(0, Math.min(TL.total, (e.clientX - r.left) / TL.pps)); };
    c.addEventListener('pointerdown', e => { if (e.button !== 0 && e.pointerType === 'mouse') return; try { c.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } const t = at(e); drag = { id: c.dataset.tid, a: t, b: t }; e.preventDefault(); });
    c.addEventListener('pointermove', e => { if (!drag) return; drag.b = at(e); const s = tlState(); s.sel = { id: drag.id, a: Math.min(drag.a, drag.b), b: Math.max(drag.a, drag.b) }; tlShowSel(P, root); });
    const end = () => {
      if (!drag) return; const s = tlState(), d = drag; drag = null;
      if (Math.abs(d.b - d.a) < TL_MIN_PART) { s.sel = null; pst().trk = d.id; tlShowSel(P, root); const i = root.querySelector('#tlinfo'); if (i) i.textContent = 'Drag across the waveform to choose a part (at least ' + TL_MIN_PART + ' seconds).'; return; }
      s.sel = { id: d.id, a: Math.min(d.a, d.b), b: Math.max(d.a, d.b) }; pst().trk = d.id; render();
    };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', () => { drag = null; });
  });
  return () => cl.forEach(f => { try { f(); } catch (e) { /* ignore */ } });
}

/* choose a range: keeps it inside the song, in order, and at least TL_MIN_PART long */
function tlSetSel(P, id, a, b) {
  a = Math.max(0, +a || 0); b = Math.max(0, +b || 0); if (b < a) { const t = a; a = b; b = t; }
  tlState().sel = b - a >= TL_MIN_PART ? { id, a, b } : null;
}
function tlNeedSel() { const s = tlState().sel; if (!s) { toast('First choose a part: drag across a track, or pick a part of the song.'); return null; } return s; }

const PROJ_TABS = [['write', 'Write'], ['arrange', 'Arrange'], ['record', 'Record'], ['mix', 'Mix'], ['share', 'Share']];
function projTabsHtml() {
  return '<div class="ptabs" role="tablist" aria-label="Parts of this song">' + PROJ_TABS.map(t => '<button type="button" role="tab" class="ptabbtn' + (pst().tab === t[0] ? ' on' : '') + '" aria-selected="' + (pst().tab === t[0]) + '" data-act="ptab" data-t="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
}
Object.assign(PROJECT_ACTIONS, {
  ptab: el => { const k = el.dataset.t; if (!PROJ_TABS.some(t => t[0] === k)) return; pst().tab = k; render(); try { window.scrollTo(0, 0); } catch (e) { /* ignore */ } },
  hundo: () => { const P = curProj(); stopProjPlay(); if (SongHistory.undo(P)) { migrateProject(P); GuideStore.invalidate(); tlState().sel = null; touch(); toast('Undone.'); render(); } else toast('Nothing to undo.'); },
  hredo: () => { const P = curProj(); stopProjPlay(); if (SongHistory.redo(P)) { migrateProject(P); GuideStore.invalidate(); tlState().sel = null; touch(); toast('Redone.'); render(); } else toast('Nothing to redo.'); },
  hsafelater: () => { ui.safetyLater = (curProj() || {}).id; render(); },
  htltrack: el => { pst().trk = el.dataset.id || ''; const s = tlState().sel; if (s) s.id = pst().trk; render(); },
  htlzoom: el => { const s = tlState(), d = +el.dataset.d; s.zoom = d === 0 ? 1 : Math.max(1, Math.min(16, d > 0 ? s.zoom * 2 : s.zoom / 2)); render(); },
  htlclear: () => { tlState().sel = null; render(); },
  htlsilence: () => {
    const P = curProj(), s = tlNeedSel(); if (!s) return; const T = trackOf(P, s.id); if (!T) return;
    const n = tlNudge(P, s.id), a = Math.max(0, s.a - n), b = Math.max(a + 0.01, s.b - n);
    T.mutes = addRange(T.mutes || [], a, b); GuideStore.invalidate(); touch(); toast('That part is silent now. Undo brings it back.'); render();
  },
  htledel: el => {
    const P = curProj(), T = trackOf(P, tlTrackId(P)); if (!T) return; const i = +el.dataset.i;
    if (el.dataset.t === 'mute') T.mutes.splice(i, 1); else if (T.patches[i]) { const [p] = T.patches.splice(i, 1); GuideStore.del(p.k).catch(() => {}); }
    GuideStore.invalidate(); touch(); render();
  },
  htledelall: () => {
    const P = curProj(), T = trackOf(P, tlTrackId(P)); if (!T) return;
    (T.patches || []).forEach(p => GuideStore.del(p.k).catch(() => {})); T.mutes = []; T.patches = []; GuideStore.invalidate(); touch(); toast('All fixes removed. Undo brings them back.'); render();
  },
  htlhear: async () => {
    const btn = $('#tlhear'), P = curProj();
    if (tlHear) { tlHear.stop(); tlHear = null; stopProjPlay(); if (btn) btn.innerHTML = icon('play') + 'Hear this part with the band'; return; }
    const s = tlNeedSel(); if (!s) return; if (tlBusy()) { toast('Stop the recording first.'); return; }
    if (btn) btn.textContent = 'Preparing…';
    const A = arrangeSong(P, { melInst: Snd.inst() }), spb = 60 / P.bpm, bar = METERS[P.ts].bar;
    A.script.audio = await loopAudio(P, A.places).catch(() => []); A.script.audio = A.script.audio.concat(await recordedAudio(P, { live: true }).catch(() => []));
    const from = Math.max(0, Math.floor(s.a / spb / bar) * bar - bar), script = scriptFrom(A.script, from, (s.b + 1) / spb);
    let live = null; const done = () => { if (live) { live.stop(); live = null; } tlHear = null; const b = $('#tlhear'); if (b) b.innerHTML = icon('play') + 'Hear this part with the band'; };
    playScript(script, { onStart: t => { live = liveStart(P, t, from); }, onEnd: done });
    tlHear = { stop: () => { if (live) { live.stop(); live = null; } } };
    if (btn) btn.innerHTML = icon('stop') + 'Stop';
  },
  htlpunch: async () => {
    const P = curProj(), btn = $('#tlpunch'), info = $('#tlinfo');
    if (tlPunch) { tlPunch.rec.stop(); return; }
    const s = tlNeedSel(); if (!s) return; const T = trackOf(P, s.id); if (!T || !T.takes.length) { toast('There is no recording on that track yet.'); return; }
    if (ui.recording) { toast('Stop the recording first.'); return; }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { if (info) info.textContent = 'Recording is not available on this device.'; return; }
    if (s.b - s.a > TL_MAX_PUNCH) { if (info) info.textContent = 'Choose a shorter part (up to ' + TL_MAX_PUNCH + ' seconds), or record a whole new take.'; return; }
    if ((T.patches || []).length >= MAX_PATCHES) { if (info) info.textContent = 'This track has ' + MAX_PATCHES + ' fixes already. Remove some, or record a new take.'; return; }
    const room = await storageRoomMB(); if (room !== null && room < 150) { if (info) info.textContent = 'There is only ' + room + ' MB of room left on this computer. Free some space first.'; return; }
    stopProjPlay(); if (tlHear) { tlHear.stop(); tlHear = null; }
    const n = tlNudge(P, s.id), a = Math.max(0, s.a - n), b = Math.max(a + 0.05, s.b - n);
    let live = null;
    if (btn) btn.innerHTML = icon('stop') + 'Stop';
    const finishUi = () => { tlPunch = null; if (live) { live.stop(); live = null; } const l = $('#guidelvl'); if (l) l.style.width = '0'; };
    const rec = startGuideRecording(P, st => {
      if (st.state === 'level') { const l = $('#guidelvl'); if (l) { l.style.width = Math.min(100, Math.round(Math.sqrt(Math.max(0, st.peak)) * 110)) + '%'; l.classList.toggle('hot', st.peak > 0.95); } return; }
      if (st.state === 'recording') { if (info) info.textContent = 'Listen to the count-in, then sing the part. It stops by itself when the part ends.'; return; }
      if (st.state === 'started') { live = liveStart(P, st.start, st.fromBeat); return; }
      finishUi();
      if (st.state === 'saved') { toast('That part was sung again and joined to the take. Listen to it, or press Undo.'); render(); }
      else { if (btn) btn.innerHTML = icon('mic') + 'Sing this part again'; if (info) info.textContent = st.state === 'empty' ? 'Nothing was recorded.' : (st.msg || 'Nothing was recorded.'); }
    }, { deviceId: S.prefs.micId || null, trackId: s.id, punch: { a, b }, monitor: pst().monitor ? (T.fx || {}).preset || 'worship' : null });
    tlPunch = { rec };
  }
});
Object.assign(PROJECT_BINDS, {
  htlpart: el => { const P = curProj(), p = guideParts(P)[+el.value]; if (!p) return; tlSetSel(P, tlTrackId(P), p.start, p.end); render(); },
  htlfrom: el => { const P = curProj(), s = tlState().sel; tlSetSel(P, tlTrackId(P), el.value, s ? s.b : (+el.value + 2)); render(); },
  htlto: el => { const P = curProj(), s = tlState().sel; tlSetSel(P, tlTrackId(P), s ? s.a : Math.max(0, +el.value - 2), el.value); render(); },
  pstage: el => { pst().stage = el.checked; },
  pchan: el => { S.prefs.micChannel = MIC_CHANNELS[el.value] ? el.value : 'auto'; if (S.prefs.micChannel === 'auto') delete S.prefs.micChannel; touch(); render(); },
  pout: el => { S.prefs.outId = el.value || undefined; if (!el.value) delete S.prefs.outId; if (typeof Snd.setOutput === 'function') Snd.setOutput(); touch(); render(); }
});
