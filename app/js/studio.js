'use strict';
/* ---------------------------------------------------------------- Song Lab studio
   One arrangement engine turns a song project into notes. Playback, the MIDI file, the audio (WAV)
   export and the chord chart all use it, so they always match.
   A project has: a key, a meter (4/4, 3/4 or 6/8), a tempo, chords for each section type, a melody per
   section (with up to three takes), lyrics, a song structure, a comping style, a bass style, drums,
   and optionally a recorded guide track (voice or instrument) kept in this computer's audio store. */
const SECTION_TYPES = ['Intro', 'Verse', 'Pre-chorus', 'Chorus', 'Bridge', 'Outro'];
const ENERGY = { Intro: 0.62, Verse: 0.74, 'Pre-chorus': 0.84, Chorus: 1, Bridge: 0.8, Outro: 0.62 };
const METERS = { 4: { label: '4/4', bar: 4, hint: 'Four beats in a bar' }, 3: { label: '3/4', bar: 3, hint: 'Waltz: three beats' }, 6: { label: '6/8', bar: 3, compound: true, hint: 'Two swaying beats of three' } };
const BASS_STYLES = { root: 'Root, held', rootfifth: 'Root and fifth', octaves: 'Octaves', walking: 'Walking (4/4 only)' };
const CHORD_LENS = [[1, 'One bar each'], [2, 'Two bars each'], [0.5, 'Half a bar each']];
const MAX_SECTION_CHORDS = 8;

/* bring an older project (one four-chord progression, one melody) up to the studio format, keeping everything */
function migrateProject(P) {
  if (!P) return P;
  if (!P.ts || !METERS[P.ts]) P.ts = 4;
  if (!P.bassStyle || !BASS_STYLES[P.bassStyle]) P.bassStyle = P.style === 'groove' ? 'rootfifth' : 'root';
  P.sections = P.sections || {};
  SECTION_TYPES.forEach(t => { const s = P.sections[t]; if (!s || !Array.isArray(s.degs) || !s.degs.length) P.sections[t] = { degs: (P.degs && P.degs.length ? P.degs : [1, 5, 6, 4]).slice(), len: 1 }; else if (![0.5, 1, 2].includes(s.len)) s.len = 1; });
  P.melodies = P.melodies || {};
  if (P.melody && P.melody.notes && P.melody.notes.length && !P.melodies.Chorus) P.melodies.Chorus = { notes: P.melody.notes.map(n => Object.assign({}, n)) };
  P.takes = P.takes || {};
  if (!P.v || P.v < 2) P.v = 2;
  return P;
}
/* keep the older fields in step (lessons, the Songbook lead sheet and older backups read them) */
function syncLegacy(P) {
  P.degs = P.sections.Chorus.degs.slice(0, 8);
  const m = P.melodies.Chorus; P.melody = m && m.notes.length ? { notes: m.notes.map(n => Object.assign({}, n)) } : null;
}

const meterOf = P => METERS[P.ts] || METERS[4];
const sectionOf = (P, type) => P.sections[type] || P.sections.Chorus;
function sectionChords(P, type) {
  const s = sectionOf(P, type), chs = E.progressionChords(P.key, s.degs, P.sev);
  return { s, chs, voiced: E.voiceProgression(chs), chordBeats: s.len * meterOf(P).bar, beats: s.degs.length * s.len * meterOf(P).bar };
}

/* ---- the right hand: comping patterns that fit the meter ---- */
function compEvents(v, t0, dur, style, meter, vel) {
  const out = [], bar = meter.bar, push = (t, d, notes) => { if (t < t0 + dur - 0.001) out.push({ t, d: Math.min(d, t0 + dur - t), notes, vel }); };
  if (style === 'pulse') { const step = meter.compound ? 1.5 : 1; for (let t = t0; t < t0 + dur - 0.001; t += step) push(t, step * 0.9, v.rh); }
  else if (style === 'arp') { const seq = v.rh.concat(v.rh.slice(1, -1).reverse()); let k = 0; for (let t = t0; t < t0 + dur - 0.001; t += 0.5, k++) push(t, 0.9, [seq[k % seq.length]]); }
  else if (style === 'groove') {
    const offs = meter.compound ? [0.5, 1, 2, 2.5] : bar === 3 ? [1, 2] : [0.5, 1.5, 2.5, 3.5];
    for (let b = t0; b < t0 + dur - 0.001; b += bar) offs.forEach(o => push(b + o, meter.compound ? 0.4 : bar === 3 ? 0.8 : 0.4, v.rh));
    if (dur < bar) push(t0, dur * 0.9, v.rh);
  } else push(t0, dur * 0.97, v.rh);
  return out;
}
/* ---- the bass ---- */
function fitBass(m) { while (m > 52) m -= 12; while (m < 28) m += 12; return m; }
function bassEvents(ch, v, next, t0, dur, style, meter, vel) {
  const root = v.bass, out = [], half = dur / 2, add = (t, d, notes) => out.push({ t, d, notes, vel: vel * 1.05 });
  if (style === 'walking' && meter.bar === 4 && dur >= 4) {
    const pcs = E.chordPcs(ch.root, ch.quality), third = pcs[1], thirdUp = ((third - (root % 12)) + 12) % 12;
    const nextRoot = next ? next.bass : root;
    for (let b = 0; b < dur; b += 4) {
      const last = b + 4 >= dur;
      const line = [root, root + (thirdUp === 3 || thirdUp === 4 ? thirdUp : 2), root + 7, last ? nextRoot + (nextRoot > root ? -1 : 1) : root + 5];
      line.forEach((m, k) => add(t0 + b + k, 0.92, [fitBass(m)]));
    }
  } else if ((style === 'rootfifth' || style === 'walking') && dur >= 2) { add(t0, half * 0.95, [root]); add(t0 + half, half * 0.95, [fitBass(root + 7)]); }
  else if (style === 'octaves') { add(t0, half * 0.9, [root - 12 >= 28 ? root - 12 : root, root - 12 >= 28 ? root : root + 12]); if (dur >= 2) add(t0 + half, half * 0.9, [root - 12 >= 28 ? root - 12 : root, root - 12 >= 28 ? root : root + 12]); }
  else add(t0, dur * 0.97, [root]);
  return out;
}
/* ---- the drums: the 4/4 grooves from the engine, and patterns for 3/4 and 6/8 ---- */
const METER_DRUMS = {
  3: { label: 'Waltz', k: [0], s: [1, 2], h: [0, 1, 2], sv: 0.45 },
  6: { label: '6/8 groove', k: [0], s: [1.5], h: [0, 0.5, 1, 1.5, 2, 2.5], sv: 0.8 }
};
function drumEvents(P, beats, energy) {
  if (!P.beat || P.beat === 'none') return [];
  const light = energy < 0.7;
  let ev;
  if (P.ts === 4) ev = E.beatEvents({ beat: P.beat, swing: P.swing, grid: P.grid }, Math.ceil(beats / 4));
  else {
    const pat = METER_DRUMS[P.ts], bar = meterOf(P).bar; ev = [];
    for (let b = 0; b < beats; b += bar) {
      pat.k.forEach(o => ev.push({ t: b + o, d: 0.1, drum: 'k', vel: 0.9 }));
      pat.s.forEach(o => ev.push({ t: b + o, d: 0.1, drum: 's', vel: pat.sv }));
      pat.h.forEach(o => ev.push({ t: b + o, d: 0.1, drum: 'h', vel: o % 1 ? 0.32 : 0.45 }));
    }
  }
  return ev.filter(e => e.t < beats - 0.001 && !(light && e.drum === 's')).map(e => Object.assign({}, e, { vel: (e.vel || 0.6) * (0.55 + 0.45 * energy) }));
}
/* ---- one section, starting at beat 0 ---- */
function arrangeSection(P, type, o) {
  o = o || {};
  const meter = meterOf(P), energy = ENERGY[type] || 0.8, sc = sectionChords(P, type), vel = 0.5 + 0.3 * energy;
  const events = [], parts = { chords: [], bass: [], melody: [], drums: [] }, changes = [];
  sc.chs.forEach((ch, i) => {
    const v = sc.voiced[i], t0 = i * sc.chordBeats, dur = sc.chordBeats;
    changes.push(t0);
    compEvents(v, t0, dur, P.style || 'whole', meter, vel).forEach(e => { events.push(e); e.notes.forEach(m => parts.chords.push({ t: e.t, d: e.d, m, v: Math.round(e.vel * 110) })); });
    bassEvents(ch, v, sc.voiced[i + 1] || sc.voiced[0], t0, dur, P.bassStyle || 'root', meter, vel).forEach(e => { events.push(e); e.notes.forEach(m => parts.bass.push({ t: e.t, d: e.d, m, v: Math.round(Math.min(1, e.vel) * 110) })); });
  });
  drumEvents(P, sc.beats, energy).forEach(e => { events.push(e); parts.drums.push({ t: e.t, d: 0.25, m: { k: 36, s: 38, h: 42, o: 46, r: 37 }[e.drum], v: Math.round(40 + e.vel * 80) }); });
  const mel = o.melody !== false && P.melodies[type];
  if (mel && mel.notes) mel.notes.forEach(n => { if (n.t < sc.beats) { const d = Math.min(n.d, sc.beats - n.t); events.push({ t: n.t, d, notes: [n.m], inst: o.melInst, vel: 0.8, mel: true }); parts.melody.push({ t: n.t, d, m: n.m, v: 100 }); } });
  return { type, beats: sc.beats, chs: sc.chs, voiced: sc.voiced, changes, chordBeats: sc.chordBeats, events, parts };
}
/* ---- the whole song in order ---- */
function songStructure(P) { return P.structure && P.structure.length ? P.structure.slice() : ['Chorus']; }
function arrangeSong(P, o) {
  migrateProject(P);
  const events = [], parts = { chords: [], bass: [], melody: [], drums: [] }, timeline = [], markers = [];
  let at = 0;
  songStructure(P).forEach(type => {
    const a = arrangeSection(P, type, o);
    timeline.push({ type, start: at, beats: a.beats, chs: a.chs, voiced: a.voiced, changes: a.changes.map(c => c + at), chordBeats: a.chordBeats });
    markers.push({ t: at, text: type });
    a.events.forEach(e => events.push(Object.assign({}, e, { t: e.t + at })));
    Object.keys(parts).forEach(k => a.parts[k].forEach(n => parts[k].push(Object.assign({}, n, { t: n.t + at }))));
    at += a.beats;
  });
  return { events, parts, timeline, markers, total: at, bpm: P.bpm, script: { events, bpm: P.bpm, total: at } };
}

/* ---- exports ---- */
const songSlug = P => (P.title || 'song').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'song';
function exportSongMidi(P) {
  const A = arrangeSong(P), tracks = [{ name: 'Chords', ch: 0, notes: A.parts.chords }, { name: 'Bass', ch: 1, notes: A.parts.bass }];
  if (A.parts.melody.length) tracks.push({ name: 'Melody', ch: 2, notes: A.parts.melody });
  if (A.parts.drums.length) tracks.push({ name: 'Drums', ch: 9, notes: A.parts.drums });
  const ts = P.ts === 6 ? [6, 8] : P.ts === 3 ? [3, 4] : [4, 4];
  const data = buildMidi({ title: P.title || 'My song', bpm: P.bpm, ts, markers: A.markers, tracks });
  const name = songSlug(P) + '_' + P.key.replace('#', 'sharp') + '_' + P.bpm + 'bpm.mid';
  saveFile(name, 'audio/midi', data);
  return { name, A };
}
/* 16-bit PCM WAV from an AudioBuffer (stereo or mono) */
function encodeWav(buf) {
  const ch = Math.min(2, buf.numberOfChannels), n = buf.length, sr = buf.sampleRate, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
  out.setUint16(22, ch, true); out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  str(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
  let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][i])); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7FFF, true); o += 2; }
  return new Uint8Array(out.buffer);
}
async function renderSong(P, opts) {
  opts = opts || {};
  const A = arrangeSong(P, { melody: opts.melody !== false, melInst: Snd.inst() });
  const extra = [];
  if (opts.guide && P.guide) { const g = await GuideStore.buffer(P); if (g) extra.push({ buffer: g, at: (P.guide.nudgeMs || 0) / 1000, gain: P.guide.gain == null ? 1 : P.guide.gain }); }
  return Snd.render(A.script, { inst: () => Snd.backingInst(), extra });
}
async function exportSongWav(P, opts) {
  const buf = await renderSong(P, opts);
  const data = encodeWav(buf);
  const name = songSlug(P) + (opts && opts.melody === false ? '_backing' : '') + (opts && opts.guide ? '_with-guide' : '') + '_' + P.bpm + 'bpm.wav';
  saveFile(name, 'audio/wav', data);
  return { name, seconds: Math.round(buf.duration), bytes: data.length };
}

/* ---- the guide-track store: recorded audio stays on this computer (IndexedDB), not in backups ---- */
const GuideStore = (function () {
  const DB = 'gma-audio', STORE = 'guides', cache = new Map();
  function open() { return new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
  async function tx(mode, fn) { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(STORE, mode), st = t.objectStore(STORE), q = fn(st); t.oncomplete = () => { db.close(); res(q && q.result); }; t.onerror = () => { db.close(); rej(t.error); }; }); }
  return {
    async put(id, blob) { cache.delete(id); return tx('readwrite', st => st.put(blob, id)); },
    async get(id) { return tx('readonly', st => st.get(id)); },
    async del(id) { cache.delete(id); return tx('readwrite', st => st.delete(id)); },
    async buffer(P) {
      if (!P.guide) return null;
      if (cache.has(P.id)) return cache.get(P.id);
      const blob = await this.get(P.id); if (!blob) return null;
      const c = Snd.ensure(); if (!c) return null;
      const buf = await c.decodeAudioData(await blob.arrayBuffer());
      cache.set(P.id, buf); return buf;
    }
  };
})();

/* ---- recording a guide track in sync with the song ----
   The microphone is captured inside the same audio clock as the backing, so each block of sound has an
   exact time. Recording starts with the song; the measured delay (Timing calibration) is removed, and a
   nudge slider fixes any remaining offset. */
function startGuideRecording(P, onState) {
  let stream = null, node = null, src = null, chunks = [], firstAt = null, songStart = null, handle = null, stopped = false, sr = 48000;
  const finish = async () => {
    if (stopped) return; stopped = true;
    try { if (node) node.disconnect(); if (src) src.disconnect(); } catch (e) { /* ignore */ }
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (handle) handle.stop();
    if (!chunks.length || songStart === null) { onState({ state: 'empty' }); return; }
    const total = chunks.reduce((a, c) => a + c.length, 0), all = new Float32Array(total); let o = 0; chunks.forEach(c => { all.set(c, o); o += c.length; });
    const shift = Math.round((songStart - firstAt + (S.prefs.latencyMs || 0) / 1000) * sr);
    let pcm;
    if (shift >= 0) pcm = all.subarray(Math.min(shift, all.length));
    else { pcm = new Float32Array(all.length - shift); pcm.set(all, -shift); }   // the microphone started late: pad the start with silence
    const tmp = { length: pcm.length, sampleRate: sr, numberOfChannels: 1, getChannelData: () => pcm };
    const blob = new Blob([encodeWav(tmp)], { type: 'audio/wav' });
    await GuideStore.put(P.id, blob);
    P.guide = { at: Date.now(), dur: Math.round(pcm.length / sr), gain: (P.guide && P.guide.gain) || 1, nudgeMs: 0 };
    touch(); onState({ state: 'saved', seconds: P.guide.dur });
  };
  (async () => {
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true } }); }
    catch (e) { onState({ state: 'error', msg: 'The microphone could not be opened. Check that it is connected and that no other program is using it.' }); return; }
    const c = Snd.ensure(); sr = c.sampleRate;
    src = c.createMediaStreamSource(stream);
    node = c.createScriptProcessor(4096, 1, 1);
    node.onaudioprocess = e => {
      if (stopped) return;
      const at = e.playbackTime - e.inputBuffer.length / sr;
      if (firstAt === null) firstAt = at;
      chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      e.outputBuffer.getChannelData(0).fill(0);
    };
    const silent = c.createGain(); silent.gain.value = 0; src.connect(node); node.connect(silent); silent.connect(c.destination);
    const A = arrangeSong(P, { melInst: Snd.inst() });
    onState({ state: 'recording' });
    handle = Snd.play(A.script, { force: true, inst: () => Snd.backingInst(), onStart: t => { songStart = t; }, onEnd: () => finish() });
  })();
  return { stop: finish };
}
