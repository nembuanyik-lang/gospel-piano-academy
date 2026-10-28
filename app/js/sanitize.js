/* Gospel Music Academy — state sanitiser (pure, no DOM).
   Everything that comes from storage or from a backup file is untrusted. Before the app uses it,
   it passes through cleanState(): unknown or badly shaped values are dropped, identifiers must look
   like identifiers, numbers must be finite, text is length-capped, and song projects are rebuilt
   field by field. The views can then rely on types (a BPM is a number, an id has no markup). */
(function (root) {
'use strict';

const DANGEROUS = new Set(['__proto__', 'constructor', 'prototype']);
const KEY_RE = /^[A-Za-z0-9_.:#-]{1,64}$/;            // object keys (lesson ids, dates, categories)
const TOKEN_RE = /^[A-Za-z0-9_.:#' -]{0,64}$/;         // short identifier-like values
const SONG_ID_RE = /^p[a-z0-9]{1,24}$/;
const TOKEN_FIELDS = new Set(['id', 'key', 'kind', 'status', 'style', 'beat', 'speed', 'instrument', 'date', 'mode',
  'theme', 'lid', 'type', 'cur', 'ans', 'opts', 'structure', 'step', 'tab', 'lastVersion']);
const TEXT_LIMITS = { name: 60, title: 120, chorus: 5000, verse: 5000, bridge: 5000, credit: 300 };
const MAX_DEPTH = 8, MAX_ARRAY = 5000, DEFAULT_TEXT = 1000;
const SECTIONS = ['Intro', 'Verse', 'Pre-chorus', 'Chorus', 'Bridge', 'Outro'];
const DAILY = [5, 10, 15, 20, 30];
const TOP_KEYS = ['v', 'updated', 'profile', 'lessons', 'cats', 'xp', 'practice', 'ear', 'ach', 'songs', 'prefs', 'testouts',
  'scores', 'today', 'sprint', 'recommend', 'events', 'review', 'songbook', 'sight', 'guitar', 'perf', 'signoffs', 'byear'];

const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v, d, lo, hi) => { const n = typeof v === 'number' ? v : NaN; if (!Number.isFinite(n)) return d; return Math.min(hi === undefined ? n : hi, Math.max(lo === undefined ? n : lo, n)); };

/* generic pass: types and shapes only */
function clean(v, depth, field) {
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    if (TOKEN_FIELDS.has(field) && !TOKEN_RE.test(v)) return undefined;
    return v.slice(0, TEXT_LIMITS[field] || DEFAULT_TEXT);
  }
  if (depth > MAX_DEPTH) return undefined;
  if (Array.isArray(v)) return v.slice(0, MAX_ARRAY).map(x => clean(x, depth + 1, field)).filter(x => x !== undefined);
  if (typeof v === 'object') {
    const out = {};
    Object.keys(v).forEach(k => {
      if (DANGEROUS.has(k) || !KEY_RE.test(k)) return;
      const c = clean(v[k], depth + 1, k);
      if (c !== undefined) out[k] = c;
    });
    return out;
  }
  return undefined;
}

function newSongId(taken) {
  let id;
  do { id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); } while (taken.has(id));
  return id;
}

/* a song project, rebuilt field by field */
function cleanSong(p, ctx, taken) {
  if (!isObj(p)) return null;
  const id = typeof p.id === 'string' && SONG_ID_RE.test(p.id) && !taken.has(p.id) ? p.id : newSongId(taken);
  taken.add(id);
  const pick = (v, list, d) => (list && list.indexOf(v) >= 0 ? v : d);
  const degs = Array.isArray(p.degs) ? p.degs.filter(d => Number.isInteger(d) && d >= 1 && d <= 7).slice(0, 8) : [];
  const grid = {};
  ['k', 's', 'h', 'o'].forEach(r => { const row = isObj(p.grid) && Array.isArray(p.grid[r]) ? p.grid[r] : []; grid[r] = Array.from({ length: 16 }, (_, i) => (row[i] ? 1 : 0)); });
  let melody = null;
  if (isObj(p.melody) && Array.isArray(p.melody.notes)) {
    const notes = p.melody.notes.filter(isObj).slice(0, 2000).map(n => ({ t: num(n.t, 0, 0, 10000), d: num(n.d, 0.5, 0, 64), m: Math.round(num(n.m, 60, 21, 108)), v: num(n.v, 96, 1, 127) }));
    melody = Object.assign(clean(p.melody, 1, 'melody') || {}, { notes });
  }
  const lyr = isObj(p.lyrics) ? p.lyrics : {};
  const steps = isObj(p.steps) ? p.steps : {};
  return {
    id,
    title: typeof p.title === 'string' ? p.title.slice(0, 60) : 'My song',
    key: pick(p.key, ctx.keys, 'C'),
    degs: degs.length ? degs : [1, 5, 6, 4],
    sev: p.sev === true,
    style: pick(p.style, ctx.styles, ctx.styles ? ctx.styles[0] : 'groove'),
    bpm: Math.round(num(p.bpm, 80, 40, 240)),
    beat: pick(p.beat, ctx.beats ? ctx.beats.concat(['meter']) : null, 'none'),
    swing: num(p.swing, 0, 0, 100),
    grid,
    melody,
    lyrics: { chorus: String(lyr.chorus || '').slice(0, 5000), verse: String(lyr.verse || '').slice(0, 5000), bridge: String(lyr.bridge || '').slice(0, 5000) },
    structure: Array.isArray(p.structure) ? p.structure.filter(s => SECTIONS.indexOf(s) >= 0).slice(0, 14) : [],
    steps: { prog: steps.prog === true, melody: steps.melody === true, chorus: steps.chorus === true, song: steps.song === true },
    done: p.done === true,
    created: num(p.created, Date.now(), 0),
    v: p.v === 2 ? 2 : undefined,
    ts: [3, 4, 6].indexOf(p.ts) >= 0 ? p.ts : 4,
    bassStyle: pick(p.bassStyle, ['root', 'rootfifth', 'octaves', 'walking'], undefined),
    sections: cleanSections(p.sections),
    melodies: cleanMelodies(p.melodies),
    takes: cleanTakes(p.takes),
    guide: isObj(p.guide) ? { at: num(p.guide.at, 0, 0), dur: num(p.guide.dur, 0, 0, 3600), gain: num(p.guide.gain, 1, 0, 2), nudgeMs: num(p.guide.nudgeMs, 0, -500, 500) } : null
  };
}
const cleanNotes = list => (Array.isArray(list) ? list : []).filter(isObj).slice(0, 2000).map(n => ({ t: num(n.t, 0, 0, 10000), d: num(n.d, 0.5, 0.1, 64), m: Math.round(num(n.m, 60, 21, 108)) }));
function cleanSections(x) {
  if (!isObj(x)) return undefined;
  const out = {};
  SECTIONS.forEach(t => { const s = x[t]; if (!isObj(s)) return; const degs = Array.isArray(s.degs) ? s.degs.filter(d => Number.isInteger(d) && d >= 1 && d <= 7).slice(0, 8) : []; if (degs.length) out[t] = { degs, len: [0.5, 1, 2].indexOf(s.len) >= 0 ? s.len : 1 }; });
  return out;
}
function cleanMelodies(x) {
  if (!isObj(x)) return undefined;
  const out = {}; SECTIONS.forEach(t => { if (isObj(x[t])) out[t] = { notes: cleanNotes(x[t].notes) }; }); return out;
}
function cleanTakes(x) {
  if (!isObj(x)) return undefined;
  const out = {}; SECTIONS.forEach(t => { if (Array.isArray(x[t])) out[t] = x[t].filter(isObj).slice(0, 3).map(k => ({ notes: cleanNotes(k.notes) })); }); return out;
}

/* ctx: { keys, styles, beats, earTypes, instruments } — lists of allowed values (any may be omitted) */
function cleanState(raw, ctx) {
  ctx = ctx || {};
  const src = isObj(raw) ? raw : {};
  const out = {};
  TOP_KEYS.forEach(k => { if (src[k] !== undefined && !DANGEROUS.has(k)) { const c = clean(src[k], 1, k); if (c !== undefined) out[k] = c; } });

  const objKeys = ['profile', 'lessons', 'cats', 'practice', 'ear', 'ach', 'prefs', 'testouts', 'today', 'sprint', 'recommend', 'events', 'review', 'songbook', 'sight', 'guitar', 'perf', 'signoffs', 'byear'];
  objKeys.forEach(k => { if (out[k] !== undefined && !isObj(out[k])) delete out[k]; });
  ['songs', 'scores'].forEach(k => { if (out[k] !== undefined && !Array.isArray(out[k])) delete out[k]; });

  if (out.v !== undefined) out.v = num(out.v, 1, 0);
  if (out.updated !== undefined) out.updated = num(out.updated, 0, 0);
  if (out.xp !== undefined) out.xp = Math.round(num(out.xp, 0, 0, 1e9));

  if (out.profile) {
    const p = out.profile;
    if (p.name !== undefined && typeof p.name !== 'string') delete p.name;
    p.goals = Array.isArray(p.goals) ? p.goals.filter(g => typeof g === 'string' && TOKEN_RE.test(g)).slice(0, 20) : [];
    if (p.onboarded !== undefined) p.onboarded = p.onboarded === true;
    if (p.diag !== undefined && p.diag !== null && !isObj(p.diag)) delete p.diag;
    if (p.instrument !== undefined && ['piano', 'guitar', 'both'].indexOf(p.instrument) < 0) delete p.instrument;
  }
  if (out.prefs) {
    const p = out.prefs;
    ['names', 'sound', 'midi'].forEach(b => { if (p[b] !== undefined && typeof p[b] !== 'boolean') delete p[b]; });
    if (p.speed !== undefined && p.speed !== 'slow' && p.speed !== 'normal') delete p.speed;
    if (p.dailyMin !== undefined && DAILY.indexOf(p.dailyMin) < 0) delete p.dailyMin;
    if (p.instrument !== undefined && ctx.instruments && ctx.instruments.indexOf(p.instrument) < 0) delete p.instrument;
    if (p.theme !== undefined && ['system', 'light', 'dark'].indexOf(p.theme) < 0) delete p.theme;
    if (p.textSize !== undefined) p.textSize = num(p.textSize, 100, 90, 150);
    if (p.latencyMs !== undefined) p.latencyMs = num(p.latencyMs, 0, -300, 300);
  }
  if (out.practice) {
    out.practice.total = num(out.practice.total, 0, 0);
    if (!isObj(out.practice.days)) out.practice.days = {};
    Object.keys(out.practice.days).forEach(d => { if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || typeof out.practice.days[d] !== 'number') delete out.practice.days[d]; });
  }
  if (out.ear) {
    Object.keys(out.ear).forEach(k => {
      const r = out.ear[k];
      if ((ctx.earTypes && ctx.earTypes.indexOf(k) < 0) || !isObj(r)) { delete out.ear[k]; return; }
      ['correct', 'total', 'level', 'sessions'].forEach(f => { if (r[f] !== undefined) r[f] = num(r[f], 0, 0); });
    });
  }
  if (out.cats) Object.keys(out.cats).forEach(k => { const r = out.cats[k]; if (!isObj(r)) delete out.cats[k]; else { r.c = num(r.c, 0, 0); r.t = num(r.t, 0, 0); } });
  if (out.songbook) Object.keys(out.songbook).forEach(k => { const r = out.songbook[k]; if (!isObj(r)) { delete out.songbook[k]; return; } Object.keys(r).forEach(f => { if (typeof r[f] !== 'number' && typeof r[f] !== 'boolean') delete r[f]; }); });
  if (out.perf) Object.keys(out.perf).forEach(k => { const r = out.perf[k]; if (!isObj(r)) { delete out.perf[k]; return; } Object.keys(r).forEach(f => { if (f === 'title') { if (typeof r[f] !== 'string') delete r[f]; } else if (typeof r[f] !== 'number' && typeof r[f] !== 'boolean') delete r[f]; }); });
  if (out.signoffs) Object.keys(out.signoffs).forEach(k => { const r = out.signoffs[k]; if (!isObj(r) || typeof r.by !== 'string') { delete out.signoffs[k]; return; } out.signoffs[k] = { by: r.by.slice(0, 60), note: typeof r.note === 'string' ? r.note.slice(0, 500) : '', at: num(r.at, 0, 0) }; });
  if (out.byear) Object.keys(out.byear).forEach(f => { if (typeof out.byear[f] !== 'number') delete out.byear[f]; });
  if (out.sight) Object.keys(out.sight).forEach(f => { if (typeof out.sight[f] !== 'number') delete out.sight[f]; });
  if (out.sprint) Object.keys(out.sprint).forEach(f => { if (typeof out.sprint[f] !== 'number') delete out.sprint[f]; });
  if (out.scores) {
    out.scores = out.scores.filter(isObj).slice(-60).map(s => ({ kind: s.kind === 'testout' ? 'testout' : 'lesson', id: typeof s.id === 'string' ? s.id : '', title: typeof s.title === 'string' ? s.title.slice(0, 120) : '', pct: Math.round(num(s.pct, 0, 0, 100)), at: num(s.at, 0, 0) }));
  }
  if (out.songs) {
    const taken = new Set();
    out.songs = out.songs.slice(0, 200).map(p => cleanSong(p, ctx, taken)).filter(Boolean);
  }
  return out;
}

const Sanitize = { cleanState, cleanSong, SONG_ID_RE, KEY_RE, SECTIONS };
if (typeof module !== 'undefined' && module.exports) module.exports = Sanitize;
else root.Sanitize = Sanitize;
})(typeof window !== 'undefined' ? window : globalThis);
