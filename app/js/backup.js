/* Gospel Music Academy — reading backup files (pure, no DOM).
   parse() turns the text of a backup file into clean state, or explains in plain words why it cannot. */
(function (root) {
'use strict';
const Sanitize = root.Sanitize || (typeof require === 'function' ? require('./sanitize.js') : null);
const APP = 'gospel-music-academy';
const APPS = ['gospel-music-academy', 'gospel-piano-academy'];   // older backups used the old name
const MAX_BYTES = 5 * 1024 * 1024;
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function summary(st) {
  const lessons = st.lessons && typeof st.lessons === 'object' ? Object.values(st.lessons) : [];
  return {
    name: (st.profile && st.profile.name) || '',
    xp: Number(st.xp) || 0,
    done: lessons.filter(r => r && (r.status === 'done' || r.status === 'mastered')).length,
    mastered: lessons.filter(r => r && r.status === 'mastered').length,
    minutes: Math.round(((st.practice && st.practice.total) || 0) / 60),
    songs: Array.isArray(st.songs) ? st.songs.length : 0,
    updated: st.updated || 0
  };
}
function parse(text, ctx) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, msg: 'That file is empty.' };
  let obj;
  try { obj = JSON.parse(text, (k, v) => (DANGEROUS_KEYS.has(k) ? undefined : v)); }
  catch (e) { return { ok: false, msg: 'That is not a valid backup file (it could not be read as JSON).' }; }
  const st = obj && APPS.indexOf(obj.app) >= 0 && obj.state ? obj.state : (obj && obj.lessons && obj.profile ? obj : null);
  if (!st || typeof st !== 'object' || Array.isArray(st)) return { ok: false, msg: 'This file is not a Gospel Music Academy backup.' };
  if (typeof st.v === 'number' && st.v > 1) return { ok: false, msg: 'This backup was made by a newer version of the app. Update the app first.' };
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  for (const k of ['lessons', 'cats', 'ear', 'ach', 'testouts', 'recommend', 'events', 'profile', 'practice', 'prefs', 'today', 'sprint', 'review', 'sight', 'songbook', 'guitar']) {
    if (st[k] !== undefined && !isObj(st[k])) return { ok: false, msg: 'The backup is damaged (“' + k + '” has the wrong shape).' };
  }
  for (const k of ['songs', 'scores']) { if (st[k] !== undefined && !Array.isArray(st[k])) return { ok: false, msg: 'The backup is damaged (“' + k + '” has the wrong shape).' }; }
  if (st.xp !== undefined && !(Number.isFinite(st.xp) && st.xp >= 0)) return { ok: false, msg: 'The backup is damaged (XP is not a valid number).' };
  if (st.practice && st.practice.days !== undefined && !isObj(st.practice.days)) return { ok: false, msg: 'The backup is damaged (practice history).' };
  if (st.songs) for (const p of st.songs) { if (!p || typeof p !== 'object' || Array.isArray(p)) return { ok: false, msg: 'The backup is damaged (a song project has the wrong shape).' }; }
  const clean = Sanitize.cleanState(st, ctx);   // drops anything unexpected, rebuilds song projects, regenerates bad ids
  return { ok: true, state: clean, summary: summary(clean), exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt.slice(0, 40) : '' };
}

const Backup = { APP, APPS, MAX_BYTES, summary, parse };
if (typeof module !== 'undefined' && module.exports) module.exports = Backup;
else root.Backup = Backup;
})(typeof window !== 'undefined' ? window : globalThis);
