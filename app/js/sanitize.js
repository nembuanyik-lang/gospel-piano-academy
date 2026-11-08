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
  'scores', 'today', 'sprint', 'recommend', 'events', 'review', 'songbook', 'sight', 'guitar', 'perf', 'signoffs', 'byear', 'routines', 'voice', 'gear', 'licks', 'learn', 'progs'];

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
    human: Math.round(num(p.human, 0, 0, 2)),
    beatWas: ctx.beats && ctx.beats.indexOf(p.beatWas) >= 0 && p.beatWas !== 'none' ? p.beatWas : undefined,
    grid,
    melody,
    lyrics: { chorus: String(lyr.chorus || '').slice(0, 5000), verse: String(lyr.verse || '').slice(0, 5000), bridge: String(lyr.bridge || '').slice(0, 5000) },
    structure: Array.isArray(p.structure) ? p.structure.filter(s => SECTIONS.indexOf(s) >= 0).slice(0, 30) : [],
    steps: { prog: steps.prog === true, melody: steps.melody === true, chorus: steps.chorus === true, song: steps.song === true },
    done: p.done === true,
    recAt: Number.isFinite(p.recAt) && p.recAt > 0 ? p.recAt : undefined,
    pkgAt: Number.isFinite(p.pkgAt) && p.pkgAt > 0 ? p.pkgAt : undefined,
    created: num(p.created, Date.now(), 0),
    v: p.v === 2 || p.v === 3 ? p.v : undefined,
    ts: [3, 4, 6].indexOf(p.ts) >= 0 ? p.ts : 4,
    bassStyle: pick(p.bassStyle, ['root', 'rootfifth', 'octaves', 'walking'], undefined),
    sections: cleanSections(p.sections),
    melodies: cleanMelodies(p.melodies),
    takes: cleanTakes(p.takes),
    form: cleanForm(p.form),
    loops: cleanLoops(p.loops),
    tracks: cleanTracks(p.tracks, id),
    mixer: cleanMixer(p.mixer),
    master: isObj(p.master) && ['stream', 'gentle', 'loud', 'off'].indexOf(p.master.target) >= 0 ? { target: p.master.target } : undefined,
    ending: ['none', 'hold', 'ritard', 'ritardhold', 'bigfinish', 'fade'].indexOf(p.ending) >= 0 ? p.ending : undefined,
    info: cleanInfo(p.info),
    mix: isObj(p.mix) ? ['chords', 'bass', 'drums', 'melody'].reduce((o, k) => { if (p.mix[k] === false) o[k] = false; return o; }, {}) : undefined,
    words: cleanWords(p.words),
    choir: isObj(p.choir) ? { on: p.choir.on === true } : undefined,
    guide: isObj(p.guide) ? cleanGuide(p.guide, id) : null
  };
}
const cleanNotes = list => (Array.isArray(list) ? list : []).filter(isObj).slice(0, 2000).map(n => ({ t: num(n.t, 0, 0, 10000), d: num(n.d, 0.5, 0.1, 64), m: Math.round(num(n.m, 60, 21, 108)) }));
const CHORD_QS = ['major', 'minor', 'dim', 'aug', 'sus2', 'sus4', 'maj7', '7', 'm7', 'm7b5', 'dim7', 'mmaj7', '7sus4', '6', 'm6', '69', 'add9', 'madd9', 'maj9', '9', 'm9', '9sus4',
  '7b9', '7#9', '7#5', '7b5', 'm11', 'maj7#11', '13', 'maj13', 'm13', '13sus4', '7#9b13', '7b9b13'];
const pc12 = v => (Number.isInteger(v) && v >= 0 && v <= 11 ? v : null);
function cleanChords(list) {
  return (Array.isArray(list) ? list : []).filter(c => isObj(c) && pc12(c.r) !== null && CHORD_QS.indexOf(c.q) >= 0).slice(0, 32)
    .map(c => ({ r: c.r, q: c.q, b: pc12(c.b), beats: Math.round(num(c.beats, 4, 0.5, 16) * 2) / 2, push: c.push === true }));
}
function cleanSections(x) {
  if (!isObj(x)) return undefined;
  const out = {};
  SECTIONS.forEach(t => {
    const s = x[t]; if (!isObj(s)) return;
    const degs = Array.isArray(s.degs) ? s.degs.filter(d => Number.isInteger(d) && d >= 1 && d <= 7).slice(0, 8) : [], chords = cleanChords(s.chords);
    if (degs.length || chords.length) { out[t] = { degs: degs.length ? degs : [1], len: [0.5, 1, 2].indexOf(s.len) >= 0 ? s.len : 1 }; if (chords.length) out[t].chords = chords; }
  });
  return out;
}
function cleanForm(list) {
  if (!Array.isArray(list)) return undefined;
  const int = (v, lo, hi, d) => Math.round(num(v, d, lo, hi));
  return list.filter(i => isObj(i) && SECTIONS.indexOf(i.s) >= 0).slice(0, 30).map(i => ({ s: i.s, up: int(i.up, -6, 11, 0), x: int(i.x, 1, 8, 1), tag: int(i.tag, 0, 8, 0),
    stop: i.stop === true, vamp: i.vamp === true, en: ['soft', 'full'].indexOf(i.en) >= 0 ? i.en : '', lead: i.lead !== false, fill: i.fill === true, fk: ['snare', 'toms', 'half', 'crash'].indexOf(i.fk) >= 0 ? i.fk : '', swell: i.swell === true }));
}
const FX_PRESETS = ['off', 'natural', 'worship', 'ballad', 'choir', 'speech'], NR_SET = ['preset', 'off', 'light', 'medium', 'strong'];
function cleanGuide(g, id) {
  const out = { at: num(g.at, 0, 0), dur: num(g.dur, 0, 0, 3600), gain: num(g.gain, 1, 0, 2), nudgeMs: num(g.nudgeMs, 0, -500, 500) };
  const keyRe = new RegExp('^' + id + '(:t[a-z0-9]{1,12})?(:[0-9]{1,4})?$');
  if (Array.isArray(g.takes)) out.takes = g.takes.filter(t => isObj(t) && typeof t.k === 'string' && keyRe.test(t.k)).slice(0, 6).map(t => ({ k: t.k, at: num(t.at, 0, 0), dur: num(t.dur, 0, 0, 3600), n: Math.round(num(t.n, 1, 1, 9999)) }));
  if (out.takes) out.main = Math.round(num(g.main, out.takes.length - 1, 0, Math.max(0, out.takes.length - 1)));
  if (isObj(g.comp)) { out.comp = {}; Object.keys(g.comp).slice(0, 200).forEach(k => { if (/^[0-9]{1,3}$/.test(k) && Number.isInteger(g.comp[k]) && g.comp[k] >= 0 && g.comp[k] < 6) out.comp[k] = g.comp[k]; }); }
  if (isObj(g.fx) && FX_PRESETS.indexOf(g.fx.preset) >= 0) out.fx = { preset: g.fx.preset, nr: NR_SET.indexOf(g.fx.nr) >= 0 ? g.fx.nr : 'preset', reverb: g.fx.reverb !== false };
  const range = r => isObj(r) && Number.isFinite(r.a) && Number.isFinite(r.b) && r.a >= 0 && r.b > r.a && r.b <= 7200;
  if (Array.isArray(g.mutes)) out.mutes = g.mutes.filter(range).slice(0, 60).map(r => ({ a: r.a, b: r.b }));
  if (Array.isArray(g.patches)) out.patches = g.patches.filter(r => range(r) && typeof r.k === 'string' && keyRe.test(r.k) && Number.isFinite(r.t0)).slice(0, 24).map(r => ({ k: r.k, n: Math.round(num(r.n, 1, 1, 9999)), a: r.a, b: r.b, t0: Math.max(0, r.t0), fade: num(r.fade, 0.02, 0.001, 0.1) }));
  out.pan = num(g.pan, 0, -1, 1); out.mute = g.mute === true; out.solo = g.solo === true;
  return out;
}
function cleanTracks(list, id) {
  if (!Array.isArray(list)) return undefined;
  const seen = new Set();
  return list.filter(t => isObj(t) && typeof t.id === 'string' && /^[a-z0-9]{1,12}$/.test(t.id) && !seen.has(t.id) && seen.add(t.id)).slice(0, 8).map(t => {
    const o = cleanGuide(t, id); o.id = t.id; o.name = typeof t.name === 'string' && t.name.trim() ? t.name.slice(0, 40) : 'Track'; o.kind = t.kind === 'instrument' ? 'instrument' : 'vocal';
    o.takes = (o.takes || []).filter(k => k.k.indexOf(id + ':t' + t.id + ':') === 0); if (o.patches) o.patches = o.patches.filter(k => k.k.indexOf(id + ':t' + t.id + ':') === 0); return o;
  });
}
function cleanMixer(m) {
  if (!isObj(m)) return undefined;
  const out = {}; ['chords', 'bass', 'drums', 'melody', 'choir', 'loops'].forEach(k => { const c = m[k]; if (isObj(c)) out[k] = { v: num(c.v, 1, 0, 1.5), pan: num(c.pan, 0, -1, 1), mute: c.mute === true, solo: c.solo === true }; });
  return out;
}
const INFO_KEYS = ['writers', 'artist', 'publisher', 'year', 'ccli', 'theme', 'notes'];
function cleanInfo(i) {
  if (!isObj(i)) return undefined;
  const out = {}; INFO_KEYS.forEach(k => { if (typeof i[k] === 'string') out[k] = i[k].slice(0, k === 'notes' ? 1000 : 120); }); return out;
}
const DRUM_IDS = ['k', 's', 'h', 'o', 'r', 'cl', 'c'];
function cleanLoops(list) {
  if (!Array.isArray(list)) return undefined;
  const seen = new Set();
  return list.filter(L => isObj(L) && typeof L.id === 'string' && /^l[a-z0-9]{1,16}$/.test(L.id) && !seen.has(L.id) && seen.add(L.id) && ['loop', 'beat', 'midi'].indexOf(L.kind) >= 0).slice(0, 16).map(L => {
    const o = { id: L.id, name: typeof L.name === 'string' ? L.name.slice(0, 60) : 'Loop', kind: L.kind, role: L.role === 'drums' ? 'drums' : 'music', bpm: num(L.bpm, 100, 40, 240),
      beats: Math.round(num(L.beats, 4, 1, 1024) * 2) / 2, tr: Math.round(num(L.tr, 0, -12, 12)), gain: num(L.gain, 1, 0, 1.5), mute: L.mute === true,
      secs: Array.isArray(L.secs) ? L.secs.filter(s => SECTIONS.indexOf(s) >= 0) : [], offset: num(L.offset, 0, 0, 30), dur: num(L.dur, 0, 0, 3600) };
    if (Number.isInteger(L.keyPc) && L.keyPc >= 0 && L.keyPc < 12) { o.keyPc = L.keyPc; o.minor = L.minor === true; }
    if (typeof L.inst === 'string' && /^[a-z]{2,12}$/.test(L.inst)) o.inst = L.inst;
    if (L.kind === 'midi' && isObj(L.midi)) o.midi = {
      notes: (Array.isArray(L.midi.notes) ? L.midi.notes : []).filter(isObj).slice(0, 4000).map(n => ({ t: num(n.t, 0, 0, 4096), d: num(n.d, 0.25, 0.01, 64), m: Math.round(num(n.m, 60, 0, 127)), vel: num(n.vel, 0.7, 0, 1) })),
      drums: (Array.isArray(L.midi.drums) ? L.midi.drums : []).filter(d => isObj(d) && DRUM_IDS.indexOf(d.drum) >= 0).slice(0, 4000).map(d => ({ t: num(d.t, 0, 0, 4096), drum: d.drum, vel: num(d.vel, 0.7, 0, 1) }))
    };
    return o;
  }).filter(L => L.kind !== 'midi' || L.midi);
}
function cleanWords(x) {
  if (!isObj(x)) return undefined;
  const out = {}; SECTIONS.forEach(t => { if (typeof x[t] === 'string') out[t] = x[t].slice(0, 3000); }); return out;
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

  const objKeys = ['profile', 'lessons', 'cats', 'practice', 'ear', 'ach', 'prefs', 'testouts', 'today', 'sprint', 'recommend', 'events', 'review', 'songbook', 'sight', 'guitar', 'perf', 'signoffs', 'byear', 'routines', 'voice', 'gear', 'licks'];
  objKeys.forEach(k => { if (out[k] !== undefined && !isObj(out[k])) delete out[k]; });
  ['songs', 'scores', 'learn', 'progs'].forEach(k => { if (out[k] !== undefined && !Array.isArray(out[k])) delete out[k]; });

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
    if (p.micId !== undefined && (typeof p.micId !== 'string' || p.micId.length > 200)) delete p.micId;
    if (p.keyboard !== undefined && !['ypt240', 'touch'].includes(p.keyboard)) delete p.keyboard;
    if (p.howClosed !== undefined) { if (!isObj(p.howClosed)) delete p.howClosed; else { const h = {}; Object.keys(p.howClosed).slice(0, 100).forEach(k => { if (/^[a-z0-9-]{1,40}$/.test(k) && p.howClosed[k] === true) h[k] = true; }); p.howClosed = h; } }
    if (p.room !== undefined && !['off', 'room', 'church', 'hall'].includes(p.room)) delete p.room;
    if (p.memSaver !== undefined && !['auto', 'on', 'off'].includes(p.memSaver)) delete p.memSaver;
    if (p.micLatencyMs !== undefined) p.micLatencyMs = Math.round(num(p.micLatencyMs, 0, -100, 600));
    if (p.micChannel !== undefined && ['auto', '1', '2', 'mix'].indexOf(p.micChannel) < 0) delete p.micChannel;
    if (p.outId !== undefined && (typeof p.outId !== 'string' || p.outId.length > 200)) delete p.outId;
    if (p.micLatencyById !== undefined) { if (!isObj(p.micLatencyById)) delete p.micLatencyById; else { const m = {}; Object.keys(p.micLatencyById).slice(0, 40).forEach(k => { if (k.length <= 420) m[k] = Math.round(num(p.micLatencyById[k], 0, -100, 600)); }); p.micLatencyById = m; } }
    if (p.micCheck !== undefined) { const c = p.micCheck; p.micCheck = isObj(c) ? { at: num(c.at, 0, 0), noiseDb: Math.round(num(c.noiseDb, -60, -140, 0)), peakDb: num(c.peakDb, -6, -140, 0), level: ['good', 'too loud', 'too quiet', 'a little quiet', 'a little hot'].indexOf(c.level) >= 0 ? c.level : 'good', ok: c.ok === true } : undefined; if (!p.micCheck) delete p.micCheck; }
    if (p.midiSound !== undefined && !['both', 'keyboard'].includes(p.midiSound)) delete p.midiSound;
    if (p.kbdOut !== undefined) { if (!isObj(p.kbdOut)) delete p.kbdOut; else p.kbdOut = { on: p.kbdOut.on === true, prog: [0, 4, 19, 48, 52, 88].includes(p.kbdOut.prog) ? p.kbdOut.prog : 0 }; }
  }
  if (out.gear) {   // gospel ear training
    const g = out.gear; out.gear = { level: Math.round(num(g.level, 1, 1, 4)), total: Math.round(num(g.total, 0, 0)), correct: Math.round(num(g.correct, 0, 0)), best: Math.round(num(g.best, 1, 1, 4)),
      hist: Array.isArray(g.hist) ? g.hist.slice(-20).map(x => (x ? 1 : 0)) : [], last: typeof g.last === 'string' ? g.last.slice(0, 10) : '' };
  }
  if (out.licks) {   // the licks library: tempo reached and keys done for each lick
    const c = {};
    Object.keys(out.licks).slice(0, 200).forEach(k => { const r = out.licks[k]; if (!/^[a-z0-9]{2,20}$/.test(k) || !isObj(r)) return;
      c[k] = { bpm: Math.round(num(r.bpm, 60, 30, 240)), keys: Array.isArray(r.keys) ? r.keys.filter(x => typeof x === 'string' && KEY_RE.test(x)).slice(0, 12) : [], best: Math.round(num(r.best, 0, 0, 100)), n: Math.round(num(r.n, 0, 0, 100000)) }; });
    out.licks = c;
  }
  if (out.voice) {
    const v = out.voice, c = {};
    const midi = x => Math.round(num(x, 60, 24, 100));
    if (isObj(v.range)) c.range = { lo: midi(v.range.lo), hi: midi(v.range.hi), at: typeof v.range.at === 'string' ? v.range.at.slice(0, 10) : '' };
    if (c.range && c.range.hi <= c.range.lo) delete c.range;
    if (v.guess === 'low' || v.guess === 'high') c.guess = v.guess;
    const ids = ['match', 'five', 'arp', 'scale', 'minor', 'interval', 'sustain', 'echo', 'runs', 'harmony'];
    c.sessions = Array.isArray(v.sessions) ? v.sessions.filter(x => isObj(x) && ids.includes(x.ex)).slice(-300).map(x => ({ d: typeof x.d === 'string' ? x.d.slice(0, 10) : '', ex: x.ex, score: Math.round(num(x.score, 0, 0, 100)), inTune: Math.round(num(x.inTune, 0, 0, 100)), cents: Math.round(num(x.cents, 0, -600, 600)), n: Math.round(num(x.n, 0, 0, 1000)) })) : [];
    c.best = {}; if (isObj(v.best)) ids.forEach(k => { if (v.best[k] !== undefined) c.best[k] = Math.round(num(v.best[k], 0, 0, 100)); });
    if (v.sustain !== undefined) c.sustain = Math.round(num(v.sustain, 0, 0, 600) * 10) / 10;
    if (isObj(v.warm)) c.warm = { n: Math.round(num(v.warm.n, 0, 0, 100000)), last: typeof v.warm.last === 'string' ? v.warm.last.slice(0, 10) : '' };
    c.lessons = {}; if (isObj(v.lessons)) Object.keys(v.lessons).forEach(k => { if (/^v-[a-z]{2,20}$/.test(k) && v.lessons[k] === true) c.lessons[k] = true; });
    out.voice = c;
  }
  if (out.routines) {
    Object.keys(out.routines).forEach(k => {
      const r = out.routines[k];
      if (!/^[a-z0-9-]{1,40}$/.test(k) || !isObj(r)) { delete out.routines[k]; return; }
      const c = { n: Math.round(num(r.n, 0, 0, 100000)), mins: Math.round(num(r.mins, 0, 0, 10000000)), last: typeof r.last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.last) ? r.last : '' };
      if (r.played !== undefined) c.played = Math.round(num(r.played, 0, 0, 10000000));
      if (r.lastPlayed !== undefined) c.lastPlayed = Math.round(num(r.lastPlayed, 0, 0, 1000));
      if (r.lastTiming !== undefined) c.lastTiming = Math.round(num(r.lastTiming, 0, 0, 100));
      out.routines[k] = c;
    });
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
  if (out.progs) {
    const QS = ['major', 'minor', 'sus2', 'sus4', 'dim', 'aug', 'maj7', '7', 'm7', 'm7b5', 'dim7', '7sus4', 'mmaj7', '6', 'm6', '69', 'add9', 'madd9', 'maj9', '9', 'm9', '9sus4', 'm11', 'maj7#11', '13', 'maj13', 'm13', '13sus4', '7b9', '7#9', '7#5', '7b5', '7#9b13', '7b9b13'];
    const seenP = new Set();
    out.progs = out.progs.filter(isObj).filter(x => typeof x.fid === 'string' && /^[a-z0-9]{3,20}$/.test(x.fid) && !seenP.has(x.fid) && seenP.add(x.fid)).slice(0, 40).map(x => ({
      fid: x.fid, name: typeof x.name === 'string' && x.name.trim() ? x.name.trim().slice(0, 60) : 'My progression', at: Math.round(num(x.at, 0, 0, 1e14)),
      chords: (Array.isArray(x.chords) ? x.chords : []).filter(isObj).slice(0, 32).map(c => ({ r: Math.round(num(c.r, 0, 0, 11)), q: QS.indexOf(c.q) >= 0 ? c.q : 'major', b: c.b === null || c.b === undefined ? null : Math.round(num(c.b, 0, 0, 11)), beats: num(c.beats, 4, 0.5, 32), push: c.push === true }))
    })).filter(x => x.chords.length);
  }
  if (out.learn) {
    const seen = new Set(), fin = (v, lo, hi, d) => num(v, d, lo, hi);
    out.learn = out.learn.filter(isObj).filter(x => typeof x.fid === 'string' && x.fid && !seen.has(x.fid) && seen.add(x.fid)).slice(0, 12).map(x => ({
      fid: x.fid.slice(0, 240), name: typeof x.name === 'string' ? x.name.slice(0, 120) : 'Recording', size: Math.round(fin(x.size, 0, 1e10, 0)), seconds: Math.round(fin(x.seconds, 0, 36000, 0)),
      key: isObj(x.key) ? { r: Math.round(fin(x.key.r, 0, 11, 0)), minor: !!x.key.minor } : { r: 0, minor: false }, simple: x.simple !== false, at: Math.round(fin(x.at, 0, 1e14, 0)),
      segs: (Array.isArray(x.segs) ? x.segs : []).slice(0, 2000).filter(a => Array.isArray(a) && a.length === 4).map(a => [fin(a[0], 0, 36000, 0), fin(a[1], 0, 36000, 0), Math.round(fin(a[2], 0, 11, 0)), ['', 'm', '7', 'm7', 'maj7'].includes(a[3]) ? a[3] : ''])
    }));
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
