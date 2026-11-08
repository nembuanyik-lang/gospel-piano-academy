'use strict';
/* ---------------------------------------------------------------- undo and redo for the song you have open
   Every time the song is saved (touch), the song's own settings (chords, words, form, mixer, takes, edits) are
   compared with the last picture. If they changed, a new picture is kept. Undo and Redo go back and forward
   through the pictures. Recordings themselves are never copied: a picture only points to them, and a recording
   that is deleted is really removed only when you leave the song (see GuideStore.purge), so Undo can bring it back.
   Changes made by a slider or a text box within 0.7 seconds of each other count as one step; every button press is its own step. */
const SongHistory = (() => {
  const MAX = 60, MERGE_MS = 700;
  let pid = null, stack = [], idx = -1, last = 0, source = null, liveNow = false, lastLive = false;
  const snap = P => JSON.stringify(P, (k, v) => (k === 'recAt' || k === 'pkgAt' ? undefined : v));   // the keep-a-copy marks are not part of Undo
  function begin(P) { pid = P.id; stack = [snap(P)]; idx = 0; last = 0; lastLive = false; }
  function end() { pid = null; stack = []; idx = -1; last = 0; }
  /* called after the song changed (from touch): keeps a picture if something is different */
  function note(P, now) {
    P = P || (source && source());
    if (!P || P.id !== pid) return false;
    const s = snap(P); if (s === stack[idx]) return false;
    const t = now === undefined ? Date.now() : now;
    if (idx < stack.length - 1) stack.length = idx + 1;   // a new change drops the "redo" pictures
    if (idx > 0 && liveNow && lastLive && t - last < MERGE_MS) stack[idx] = s;
    else { stack.push(s); idx++; if (stack.length > MAX) { stack.shift(); idx--; } }
    last = t; lastLive = liveNow; return true;
  }
  /* put a picture back into the same song object (the rest of the app keeps pointing at it) */
  function restore(P, s) { const o = JSON.parse(s), keep = { recAt: P.recAt, pkgAt: P.pkgAt }; Object.keys(P).forEach(k => { delete P[k]; }); Object.assign(P, o); Object.keys(keep).forEach(k => { if (keep[k] !== undefined) P[k] = keep[k]; }); }
  function undo(P) { if (!P || P.id !== pid || idx <= 0) return false; note(P, 0); if (idx <= 0) return false; idx--; restore(P, stack[idx]); last = 0; return true; }
  function redo(P) { if (!P || P.id !== pid || idx >= stack.length - 1) return false; idx++; restore(P, stack[idx]); last = 0; return true; }
  return {
    begin, end, note, undo, redo,
    id: () => pid,
    canUndo: () => idx > 0, canRedo: () => idx >= 0 && idx < stack.length - 1,
    steps: () => ({ back: Math.max(0, idx), forward: Math.max(0, stack.length - 1 - idx) }),
    setSource: fn => { source = fn; },
    setLive: v => { liveNow = !!v; }
  };
})();
if (typeof module !== 'undefined') module.exports = SongHistory;
