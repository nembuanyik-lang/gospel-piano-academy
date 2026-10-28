'use strict';
/* ===================== Gospel Music Academy — app core ===================== */
const E = window.Engine, C = window.Curriculum;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = E.fmt;
const pcOf = m => ((m % 12) + 12) % 12;
const App = window.GPA = { E, C };

/* ---------------------------------------------------------------- state */
const LS_KEY = 'gpa.state.v1';
function defaults() {
  return {
    v: 1, updated: 0,
    profile: { name: '', goals: [], onboarded: false, diag: null },
    lessons: {}, cats: {}, xp: 0,
    practice: { total: 0, days: {} },
    ear: {}, ach: {}, songs: [],
    prefs: { names: true, sound: true, speed: 'normal', dailyMin: 10 },
    testouts: {}, scores: [], today: { date: '', items: {}, goalMet: false },
    sprint: { note: 0, chord: 0 }, recommend: {}, events: {},
    review: {}, songbook: {}, sight: { level: 1, sessions: 0, notes: 0, correct: 0, best: 0 }
  };
}
function mergeState(base, src) {
  const out = base;
  if (!src || typeof src !== 'object') return out;
  Object.keys(src).forEach(k => {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      if (['lessons', 'cats', 'ear', 'ach', 'testouts', 'recommend', 'events', 'review'].includes(k)) out[k] = src[k];
      else out[k] = Object.assign(base[k], src[k]);
    } else out[k] = src[k];
  });
  return out;
}
/* Everything read from storage or a backup file passes through the sanitiser first (js/sanitize.js). */
const Desk = window.gpaDesktop || null;   // the desktop bridge from preload.js; null in a plain browser
function sanCtx() { return { keys: E.ROOT_NAMES, styles: Object.keys(E.STYLES), beats: Object.keys(E.BEATS), earTypes: Object.keys(E.EAR_TYPES) }; }
function hydrate(obj) { return mergeState(defaults(), Sanitize.cleanState(obj, sanCtx())); }
function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return hydrate(JSON.parse(raw));
  } catch (e) { /* storage unavailable or damaged: start fresh, the file copy (desktop) may still restore it */ }
  return defaults();
}
let S = loadLocal();
App.S = () => S;
let saveTimer = null;
function touch() { S.updated = Date.now(); clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 500); }

/* Saving. On the desktop every save goes to two places: this window's local storage and a file in the
   app's data folder (written atomically by the main process, with daily snapshots). If a save fails the
   learner is told straight away, with a way to export a backup. */
const Store = {
  local: true, file: true, error: '', lastSaved: 0,
  get ok() { return this.local && this.file; },
  set(localOk, fileOk, err) {
    const was = this.ok;
    this.local = localOk; this.file = fileOk; if (err) this.error = String(err).slice(0, 200);
    if (this.ok) this.lastSaved = Date.now();
    if (was !== this.ok && App.onSaveHealth) App.onSaveHealth();
  },
  async init() {
    if (!Desk) return;
    try {
      const r = await Desk.loadState();
      if (r && r.ok && r.json) {
        const f = hydrate(JSON.parse(r.json));
        // the file wins when it is newer, or when local storage was wiped
        if ((f.updated || 0) > (S.updated || 0)) { S = f; writeLocal(); if (App.onRemote) App.onRemote(); }
        else if ((S.updated || 0) > (f.updated || 0)) saveNow();
      } else if (S.updated > 0) saveNow();          // first run with file storage: copy existing progress across
      else if (r && !r.ok) this.set(this.local, false, r.error);
    } catch (e) { this.set(this.local, false, e && e.message); }
  }
};
function writeLocal(json) {
  try { localStorage.setItem(LS_KEY, json || JSON.stringify(S)); return { ok: true }; }
  catch (e) { return { ok: false, error: (e && e.name) || 'storage error' }; }
}
function saveNow() {
  clearTimeout(saveTimer);
  const json = JSON.stringify(S);
  const loc = writeLocal(json);
  if (!Desk) { Store.set(loc.ok, true, loc.error); return; }
  Desk.saveState(json).then(r => Store.set(loc.ok, !!(r && r.ok), loc.error || (r && r.error)))
    .catch(e => Store.set(loc.ok, false, loc.error || (e && e.message)));
}
window.addEventListener('pagehide', () => {
  const json = JSON.stringify(S);
  writeLocal(json);
  if (Desk && Desk.saveStateNow) { try { Desk.saveStateNow(json); } catch (e) { /* closing anyway */ } }
});

/* Snapshots: copies of the whole progress taken automatically (daily, before an import, a restore or a reset).
   Desktop: files in the app's data folder (the main process keeps the last 10 of each kind).
   Browser: the last 3 kept in local storage. */
const SNAP_PREFIX = 'gpa.snap.';
const Snap = {
  async create(reason) {
    const json = JSON.stringify(S);
    if (Desk) { try { const r = await Desk.snapshot(reason, json); return !!(r && r.ok); } catch (e) { return false; } }
    try {
      localStorage.setItem(SNAP_PREFIX + Date.now() + '.' + reason, json);
      const keys = Object.keys(localStorage).filter(k => k.indexOf(SNAP_PREFIX) === 0).sort();
      keys.slice(0, Math.max(0, keys.length - 3)).forEach(k => localStorage.removeItem(k));
      return true;
    } catch (e) { return false; }
  },
  async list() {
    if (Desk) { try { const r = await Desk.listSnapshots(); return (r && r.ok && r.items) || []; } catch (e) { return []; } }
    try {
      return Object.keys(localStorage).filter(k => k.indexOf(SNAP_PREFIX) === 0).map(k => {
        const m = /^gpa\.snap\.(\d+)\.([a-z-]+)$/.exec(k); return m ? { id: k, at: +m[1], reason: m[2] } : null;
      }).filter(Boolean).sort((a, b) => b.at - a.at);
    } catch (e) { return []; }
  },
  async read(id) {
    if (Desk) { const r = await Desk.readSnapshot(id); if (!r || !r.ok) throw new Error((r && r.error) || 'Could not read the snapshot.'); return r.json; }
    const j = localStorage.getItem(id); if (!j) throw new Error('That snapshot is no longer available.'); return j;
  }
};
App.Store = Store; App.Snap = Snap;
/* the measured delay between a click being scheduled and the learner's tap landing (see Practice > Timing calibration) */
const latSec = () => (S.prefs.latencyMs || 0) / 1000;

/* ---------------------------------------------------------------- toast */
let toastTimer = null;
function toast(msg, kind) {
  let el = $('#toast');
  if (!el) return;
  el.textContent = msg; el.className = 'toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 2600);
}
App.toast = toast;
