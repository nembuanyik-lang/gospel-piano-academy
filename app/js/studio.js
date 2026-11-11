'use strict';
/* ---------------------------------------------------------------- Song Lab studio
   One arrangement engine turns a song project into notes. Playback, the MIDI file, the audio (WAV)
   export and the chord chart all use it, so they always match.
   A project has: a key, a meter (4/4, 3/4 or 6/8), a tempo, chords for each section type, a melody per
   section (with up to three takes), lyrics, a song structure, a comping style, a bass style, drums,
   and optionally a recorded guide track (voice or instrument) kept in this computer's audio store. */
const SECTION_TYPES = ['Intro', 'Verse', 'Pre-chorus', 'Chorus', 'Bridge', 'Outro'];
const ENERGY = { Intro: 0.62, Verse: 0.74, 'Pre-chorus': 0.84, Chorus: 1, Bridge: 0.8, Outro: 0.62 };
const ENERGY_SET = { soft: 0.58, normal: null, full: 1 };
const METERS = { 4: { label: '4/4', bar: 4, hint: 'Four beats in a bar' }, 3: { label: '3/4', bar: 3, hint: 'Waltz: three beats' }, 6: { label: '6/8', bar: 3, compound: true, hint: 'Two swaying beats of three' } };
const BASS_STYLES = { root: 'Root, held', rootfifth: 'Root and fifth', octaves: 'Octaves', walking: 'Walking (4/4 only)', gospel: 'Gospel (approach notes into each chord)', pump: 'Octave pump (shout and praise)', makossa: 'Makossa (syncopated)',
  worship: 'Slow worship (long notes, soft fifth)', reggae: 'Reggae (one-drop, space on beat 1)', highlife: 'Highlife (bouncy)', funk: 'Funk (short, busy)',
  motown: 'Motown (steady eighths)', tumbao: 'Latin tumbao', bikutsi: 'Bikutsi / Assiko (driving)' };
/* the bass sound: the number is the General MIDI program in the sound library (without a library the bass is played by the piano sound as before) */
const BASS_SOUNDS = { finger: ['Finger bass (the usual)', 33], pick: ['Pick bass (brighter)', 34], upright: ['Upright bass (acoustic)', 32], fretless: ['Fretless (smooth)', 35], slap: ['Slap bass (funk)', 36], synth: ['Synth bass', 38], sub: ['Deep sub bass (modern)', 39] };
/* patterns for one bar of four beats: [where in the bar, how long, which note] - note: 0 root, a number of semitones above the root, 'n' = a step into the next chord, 'th' = the chord's third */
const BASS_PATTERNS = {
  reggae: [[1.5, 0.4, 0], [2, 1.2, 0], [3.5, 0.4, 7]],
  highlife: [[0, 0.75, 0], [1, 0.5, 7], [1.5, 0.5, 0], [2, 0.75, 12], [3, 0.5, 7], [3.5, 0.5, 'n']],
  funk: [[0, 0.3, 0], [0.75, 0.2, 0], [1.5, 0.3, 12], [2, 0.3, 0], [2.5, 0.2, 10], [3, 0.3, 7], [3.5, 0.2, 'n']],
  motown: [[0, 0.45, 0], [0.5, 0.45, 0], [1, 0.45, 12], [1.5, 0.45, 0], [2, 0.45, 7], [2.5, 0.45, 0], [3, 0.45, 5], [3.5, 0.45, 'n']],
  tumbao: [[0, 0.45, 0], [1.5, 0.45, 7], [2, 0.9, 0], [3.5, 0.4, 'n']],
  bikutsi: [[0, 0.4, 0], [0.5, 0.4, 0], [1, 0.4, 12], [1.5, 0.4, 0], [2, 0.4, 0], [2.5, 0.4, 7], [3, 0.4, 12], [3.5, 0.4, 'n']]
};
const CHORD_LENS = [[1, 'One bar each'], [2, 'Two bars each'], [0.5, 'Half a bar each']];
const LEN_CHOICES = [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16];
const MAX_SECTION_CHORDS = 32;
const MAX_FORM = 30;
const SC = Songcraft;

/* bring an older project up to the current format, keeping everything:
   v1 one four-chord progression -> v2 sections with chord numbers -> v3 full chords, the song form, words, choir */
function migrateProject(P) {
  if (!P) return P;
  if (!P.ts || !METERS[P.ts]) P.ts = 4;
  if (P.bassSound && !BASS_SOUNDS[P.bassSound]) P.bassSound = 'finger';
  if (!P.bassStyle || !BASS_STYLES[P.bassStyle]) P.bassStyle = P.style === 'groove' ? 'rootfifth' : 'root';
  const bar = METERS[P.ts].bar;
  P.sections = P.sections || {};
  SECTION_TYPES.forEach(t => {
    let s = P.sections[t];
    if (!s || ((!Array.isArray(s.degs) || !s.degs.length) && (!Array.isArray(s.chords) || !s.chords.length))) s = P.sections[t] = { degs: (P.degs && P.degs.length ? P.degs : [1, 5, 6, 4]).slice(), len: 1 };
    if (![0.5, 1, 2].includes(s.len)) s.len = 1;
    if (!Array.isArray(s.chords) || !s.chords.length) s.chords = SC.fromDegrees(s.degs && s.degs.length ? s.degs : [1], P.sev, s.len * bar);
  });
  P.melodies = P.melodies || {};
  if (P.melody && P.melody.notes && P.melody.notes.length && !P.melodies.Chorus) P.melodies.Chorus = { notes: P.melody.notes.map(n => Object.assign({}, n)) };
  P.takes = P.takes || {};
  // the form follows `structure` when something else changed the plain list of section names (older code, older backups)
  const names = (P.structure || []).filter(x => SECTION_TYPES.includes(x));
  if (!Array.isArray(P.form) || P.form.map(i => i && i.s).join() !== names.join() && names.length) P.form = names.map((x, i) => Object.assign({}, Array.isArray(P.form) && P.form[i] && P.form[i].s === x ? P.form[i] : {}, { s: x }));
  P.form = P.form.filter(i => i && SECTION_TYPES.includes(i.s)).map(formItem);
  P.words = P.words || {};
  P.choir = P.choir || { on: false };
  if (!P.v || P.v < 3) P.v = 3;
  return P;
}
/* volume changes through the song: a level in dB for a part in one part of the form (-60 or less = silent) */
const cleanLevels = lv => {
  if (!lv || typeof lv !== 'object') return null;
  const o = {}; Object.keys(lv).slice(0, 20).forEach(k => { if (/^(chords|bass|drums|melody|choir|loops|tk[A-Za-z0-9_-]{0,20})$/.test(k) && Number.isFinite(+lv[k]) && Math.round(+lv[k]) !== 0) o[k] = Math.max(-60, Math.min(9, Math.round(+lv[k]))); });
  return Object.keys(o).length ? o : null;
};
const levelGain = db => (db <= -59 ? 0 : Math.pow(10, db / 20));
function formItem(i) {
  const o = { s: i.s, up: Math.max(-6, Math.min(11, Math.round(+i.up || 0))), x: Math.max(1, Math.min(8, Math.round(+i.x || 1))), tag: Math.max(0, Math.min(8, Math.round(+i.tag || 0))),
    stop: i.stop === true, vamp: i.vamp === true, en: ['soft', 'full'].includes(i.en) ? i.en : '', lead: i.lead !== false, fill: i.fill === true, fk: FILL_KINDS[i.fk] ? i.fk : '', swell: i.swell === true };
  const lv = cleanLevels(i.lv); if (lv) o.lv = lv;
  return o;
}
/* keep the older fields in step (lessons, the Songbook lead sheet and older backups read them) */
function syncLegacy(P) {
  const bar = meterOf(P).bar;
  SECTION_TYPES.forEach(t => {
    const s = P.sections[t]; if (!s || !s.chords) return;
    const d = SC.toDegrees(s.chords); s.degs = (d.length ? d : [1]).slice(0, 8);
    const b = s.chords[0] ? s.chords[0].beats : bar; s.len = s.chords.every(c => c.beats === b) && [0.5, 1, 2].includes(b / bar) ? b / bar : 1;
  });
  P.degs = P.sections.Chorus.degs.slice(0, 8);
  P.structure = (P.form || []).map(i => i.s);
  const m = P.melodies.Chorus; P.melody = m && m.notes.length ? { notes: m.notes.map(n => Object.assign({}, n)) } : null;
}
/* the Songbook can play a chorus written with plain chords of the key, one bar each */
const sectionIsSimple = (P, t) => SC.isSimple(P.sections[t].chords, P.sev, meterOf(P).bar);

const meterOf = P => METERS[P.ts] || METERS[4];
const sectionOf = (P, type) => P.sections[type] || P.sections.Chorus;
/* chords of a section with their times: `at` is where the chord is written, `on` where it sounds (a push comes
   half a beat early), `off` where the next one takes over */
function chordTimes(chords) {
  let at = 0;
  const out = chords.map((c, i) => { const r = { c, at, on: at - (c.push && i > 0 ? 0.5 : 0) }; at += c.beats; return r; });
  out.forEach((r, i) => { r.off = i + 1 < out.length ? out[i + 1].on : at; });
  return { list: out, beats: at };
}
function sectionChords(P, type, o) {
  o = o || {};
  const s = sectionOf(P, type), chords = o.chords || s.chords, shift = o.shift || 0, key = shift ? SC.keyAfter(P.key, shift) : P.key;
  const ct = chordTimes(chords), voiced = SC.voice(P.key, chords, shift);
  const chs = chords.map((c, i) => Object.assign({ spec: c, t: ct.list[i].on, at: ct.list[i].at, d: ct.list[i].off - ct.list[i].on }, SC.describe(P.key, c, shift)));
  return { s, chords, chs, voiced, beats: ct.beats, key, shift, chordBeats: chords.length ? ct.beats / chords.length : meterOf(P).bar };
}
const chordAtBeat = (sc, t) => { let k = 0; sc.chs.forEach((c, i) => { if (t >= c.t - 1e-6) k = i; }); return k; };

/* ---- the right hand: patterns on the bar grid; each hit plays the chord sounding at that moment ---- */
function compHits(style, meter, beats) {
  const bar = meter.bar, hits = [];
  for (let b = 0; b < beats - 1e-6; b += bar) {
    const add = (o, d, acc) => { if (b + o < beats - 1e-6) hits.push({ t: b + o, d, acc: acc || 1 }); };
    if (style === 'pulse') { const st = meter.compound ? 1.5 : 1; for (let o = 0; o < bar; o += st) add(o, st * 0.9); }
    else if (style === 'arp') { for (let o = 0; o < bar; o += 0.5) add(o, 0.9, 'arp'); }
    else if (style === 'groove') { (meter.compound ? [0.5, 1, 2, 2.5] : bar === 3 ? [1, 2] : [0.5, 1.5, 2.5, 3.5]).forEach(o => add(o, meter.compound ? 0.4 : bar === 3 ? 0.8 : 0.4)); }
    else if (style === 'triplets') { const st = meter.compound ? 0.5 : 1 / 3, per = meter.compound ? 3 : 3; for (let k = 0; k * st < bar - 1e-6; k++) add(k * st, st * 0.85, k % per === 0 ? 1 : 0.7); }
    else if (style === 'sunday') { (bar === 3 ? [[0, 1.4], [1.5, 0.4], [2, 0.9]] : [[0, 1.4], [1.5, 0.4], [2, 1.4], [3.5, 0.4]]).forEach(([o, d]) => add(o, d, o % 1 ? 0.75 : 1)); }
    else if (style === 'stabs') { add(0, 0.35, 1); for (let o = 0.5; o < bar; o += 1) add(o, 0.2, 0.85); }
  }
  return hits;
}
function compEvents(sc, style, meter, vel) {
  const out = [];
  if (!style || style === 'whole' || !E.STYLES[style]) {
    sc.chs.forEach((ch, i) => out.push({ t: ch.t, d: ch.d * 0.97, notes: sc.voiced[i].rh, vel, ci: i }));
    return out;
  }
  const hits = compHits(style, meter, sc.beats), starts = new Set();
  hits.forEach((h, n) => {
    const i = chordAtBeat(sc, h.t), ch = sc.chs[i], v = sc.voiced[i];
    if (Math.abs(h.t - ch.t) < 0.01) starts.add(i);
    const d = Math.min(h.d, ch.t + ch.d - h.t);
    if (d <= 0.02) return;
    if (h.acc === 'arp') { const seq = v.rh.concat(v.rh.slice(1, -1).reverse()), k = Math.round((h.t - ch.t) * 2); out.push({ t: h.t, d: 0.9, notes: [seq[((k % seq.length) + seq.length) % seq.length]], vel, ci: i }); }
    else out.push({ t: h.t, d, notes: v.rh, vel: vel * h.acc, ci: i });
  });
  // every chord change (and every push) is played, even between the pattern's hits
  sc.chs.forEach((ch, i) => { if (!starts.has(i)) out.push({ t: ch.t, d: Math.min(style === 'arp' ? 0.9 : 0.6, ch.d), notes: style === 'arp' ? [sc.voiced[i].rh[0]] : sc.voiced[i].rh, vel, ci: i }); });
  return out.sort((a, b) => a.t - b.t);
}
/* ---- the bass ---- */
function fitBass(m) { while (m > 52) m -= 12; while (m < 28) m += 12; return m; }
const octOf = r => (r + 12 <= 55 ? r + 12 : r - 12 >= 28 ? r - 12 : r);   // the same note an octave away, in the bass range
function bassEvents(ch, v, next, t0, dur, style, meter, vel) {
  const root = v.bass, out = [], half = dur / 2, add = (t, d, notes) => { if (d > 0.02) out.push({ t, d, notes, vel: vel * 1.05 }); };
  const nextRoot = next ? next.bass : root;
  if (style === 'walking' && meter.bar === 4 && dur >= 4) {
    const third = ch.pcs[1], thirdUp = ((third - (root % 12)) + 12) % 12;
    for (let b = 0; b + 4 <= dur + 1e-6; b += 4) {
      const last = b + 4 >= dur - 1e-6;
      const line = [root, root + (thirdUp === 3 || thirdUp === 4 ? thirdUp : 2), root + 7, last ? nextRoot + (nextRoot > root ? -1 : 1) : root + 5];
      line.forEach((m, k) => add(t0 + b + k, 0.92, [fitBass(m)]));
    }
  } else if (style === 'gospel') {
    // the root, an octave lift in long chords, and a chromatic step into the next chord's bass
    const appr = dur >= 1.5 && next && next.bass !== root;
    add(t0, (appr ? dur - 0.5 : dur) * (dur >= 3 ? 0.5 : 0.95), [root]);
    if (dur >= 3) add(t0 + dur / 2, (appr ? dur / 2 - 0.5 : dur / 2) * 0.95, [octOf(root)]);
    if (appr) add(t0 + dur - 0.5, 0.45, [fitBass(nextRoot + (nextRoot > root ? -1 : 1))]);
  } else if (BASS_PATTERNS[style] && meter.bar === 4) {
    const th = ch.pcs[1], thUp = ((th - (root % 12)) + 12) % 12;
    for (let b = 0; b < dur - 1e-6; b += 4) BASS_PATTERNS[style].forEach(([o, d, iv]) => {
      if (b + o >= dur - 1e-6) return;
      const last = b + 4 >= dur - 1e-6 && next && next.bass !== root;
      const m = iv === 'n' ? (last ? fitBass(nextRoot + (nextRoot > root ? -1 : 1)) : root + 7 > 52 ? root - 5 : root + 7) : iv === 'th' ? root + thUp : root + iv > 52 ? root + iv - 12 : root + iv;
      add(t0 + b + o, Math.min(d, dur - b - o), [fitBass(m)]);
    });
  } else if (style === 'worship' && dur >= 2) {
    add(t0, dur * 0.97, [root]);
    if (dur >= 4) add(t0 + 2, Math.min(dur - 2, 1.8), [fitBass(root + 7)]);
  } else if (style === 'pump') {
    for (let b = 0; b < dur - 1e-6; b += 0.5) add(t0 + b, Math.min(0.42, dur - b), [Math.round(b * 2) % 2 ? octOf(root) : root]);
  } else if (style === 'makossa') {
    const pat = [[0, 0.7, 0], [0.75, 0.25, 12], [1.5, 0.45, 7], [2, 0.7, 0], [2.75, 0.25, 12], [3.5, 0.45, 'n']];
    for (let b = 0; b < dur - 1e-6; b += 4) pat.forEach(([o, d, iv]) => { if (b + o < dur - 1e-6) { const m = iv === 'n' ? fitBass(nextRoot + (nextRoot > root ? -2 : 2)) : root + iv > 52 ? root + iv - 12 : root + iv; add(t0 + b + o, Math.min(d, dur - b - o), [fitBass(m)]); } });
  } else if ((style === 'rootfifth' || style === 'walking') && dur >= 2) { add(t0, half * 0.95, [root]); add(t0 + half, half * 0.95, [fitBass(root + 7)]); }
  else if (style === 'octaves') { add(t0, half * 0.9, [root - 12 >= 28 ? root - 12 : root, root - 12 >= 28 ? root : root + 12]); if (dur >= 2) add(t0 + half, half * 0.9, [root - 12 >= 28 ? root - 12 : root, root - 12 >= 28 ? root : root + 12]); }
  else add(t0, dur * 0.97, [root]);
  return out;
}
/* a human feel for the keys and the bass (the same every time it plays, so a mix and its export match; the MIDI file stays exact):
   chords are rolled a few milliseconds from the bottom note up, every note lands a little early or late, and the touch varies.
   level 1 = light, 2 = loose. The melody and the choir are left exactly as written. */
function humanizeKeys(ev, level, bpm) {
  level = Math.max(0, Math.min(2, Math.round(+level || 0))); if (!level || !ev.length) return ev;
  const ms = level === 1 ? 7 : 14, vv = level === 1 ? 0.07 : 0.14, rollMs = level === 1 ? 14 : 28, beat = 60000 / (bpm || 100);
  const h = (a, b) => { let x = (Math.round(a * 1000) * 2654435761 + b * 40503) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return (x >>> 0) / 4294967295 * 2 - 1; };
  const out = [];
  ev.forEach(e => {
    if (!e.notes || e.drum || e.click || e.loop || e.mel || e.choir) { out.push(e); return; }
    const bass = e.part === 'bass', code = bass ? 11 : 3, dt = h(e.t, code) * ms / beat, vel = Math.max(0.05, Math.min(1, (e.vel || 0.7) * (1 + h(e.t + 0.37, code + 7) * vv)));
    const notes = e.notes.slice().sort((a, b) => a - b);
    if (bass || notes.length < 2) { out.push(Object.assign({}, e, { t: Math.max(0, e.t + dt), vel })); return; }
    const gap = rollMs / beat / (notes.length - 1);
    notes.forEach((m, j) => out.push(Object.assign({}, e, { notes: [m], t: Math.max(0, e.t + dt + j * gap), vel: Math.max(0.05, Math.min(1, vel * (1 + h(e.t + j, code + 13) * vv * 0.5))) })));
  });
  return out;
}
/* ---- the drums: the 4/4 grooves from the engine, and patterns for 3/4 and 6/8 ---- */
const METER_DRUMS = {
  3: { label: 'Waltz', k: [0], s: [1, 2], h: [0, 1, 2], sv: 0.45 },
  6: { label: '6/8 groove', k: [0], s: [1.5], h: [0, 0.5, 1, 1.5, 2, 2.5], sv: 0.8 }
};
/* the drummer's busyness: -1 calmer (hi-hats on the beat only, no ghost notes), 0 as written, 1 busier (every sixteenth or triplet on the hi-hat, soft ghost snares before the backbeat) */
function busyDrums(ev, P) {
  const busy = P.busy | 0; if (!busy || !ev.length) return ev;
  if (busy < 0) return ev.filter(e => !(e.drum === 'h' && Math.abs(e.t - Math.round(e.t)) > 0.01) && !(e.drum === 's' && e.vel < 0.3));
  const b = P.ts === 4 ? E.BEATS[P.beat] : null, n = b && b.n, step = n === 12 ? 1 / 3 : 0.25, out = ev.slice(), has = (t, d) => ev.some(e => e.drum === d && Math.abs(e.t - t) < 0.02);
  const end = Math.max(0, ...ev.map(e => e.t)) + 0.01;
  if (P.ts === 4 && (n === 16 || n === 12) && ev.some(e => e.drum === 'h')) for (let t = 0; t < end; t += step) if (!has(t, 'h') && !has(t, 'o')) out.push({ t, d: 0.1, drum: 'h', vel: 0.2 });
  ev.filter(e => e.drum === 's' && e.vel >= 0.5).forEach(e => { const t = e.t - step; if (t >= 0 && !has(t, 's') && !has(t, 'k') && (e.t * 2) % 2 === 0) out.push({ t, d: 0.1, drum: 's', vel: 0.2 }); });
  return out;
}
/* a percussion layer on top of the beat: a shaker, a tambourine and/or congas (they also play when the song has no drums) */
function percEvents(P, beats, energy) {
  const kind = P.perc || 'off'; if (kind === 'off') return [];
  const ev = [], bar = meterOf(P).bar, third = P.ts === 4 && E.BEATS[P.beat] && E.BEATS[P.beat].n === 12;
  const shaker = /shaker/.test(kind), tamb = kind === 'tambourine', cong = /congas/.test(kind) && P.ts === 4;
  for (let b0 = 0; b0 < beats - 1e-6; b0 += bar) {
    if (shaker) { const st = P.ts === 4 ? (third ? 1 / 3 : 0.25) : 0.5; for (let t = 0; t < bar - 1e-6; t += st) ev.push({ t: b0 + t, d: 0.08, drum: 'sh', vel: Math.abs(t - Math.round(t)) < 0.01 ? 0.34 : 0.2 }); }
    if (tamb) { for (let t = 0; t < bar - 1e-6; t += 0.5) { const on = P.ts === 4 ? (t === 1 || t === 3) : Math.abs(t - Math.round(t)) < 0.01; ev.push({ t: b0 + t, d: 0.1, drum: 'tb', vel: on ? 0.55 : 0.2 }); } }
    if (cong) [[0.5, 'cd', 0.45], [1.5, 'cg', 0.5], [2, 'cg', 0.55], [2.5, 'cg', 0.45], [3.5, 'cd', 0.5]].forEach(x => ev.push({ t: b0 + x[0], d: 0.15, drum: x[1], vel: x[2] }));
  }
  return E.humanizeDrums(ev, P.human, P.bpm).filter(e => e.t < beats - 0.001).map(e => Object.assign({}, e, { vel: e.vel * (0.6 + 0.4 * energy) }));
}
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
  ev = busyDrums(ev, P);
  ev = E.humanizeDrums(ev, P.human, P.bpm);
  return ev.filter(e => e.t < beats - 0.001 && !(light && (e.drum === 's' || e.drum === 'cl'))).map(e => Object.assign({}, e, { vel: (e.vel || 0.6) * (0.55 + 0.45 * energy) }));
}
const DRUM_MIDI = { k: 36, s: 38, h: 42, o: 46, r: 37, cl: 39, c: 49, th: 50, tm: 47, tl: 43, sw: 52, sh: 82, tb: 54, cg: 63, cd: 64 };

/* the automatic version of one part of a section, as notes you can edit by hand (the key of the song, no key change) */
function autoPart(P, type, part) {
  const Q = Object.assign({}, P, { edits: undefined, perc: 'off', mixer: undefined }), a = arrangeSection(Q, type, { melody: false, choir: false, melInst: 'piano' });
  if (part === 'bass') return a.events.filter(e => e.part === 'bass' && e.notes).map(e => ({ t: Math.round(e.t * 4) / 4, d: Math.max(0.25, Math.round(e.d * 4) / 4), m: e.notes[0], v: Math.round(Math.min(1, e.vel) * 100) / 100 }));
  return a.events.filter(e => e.drum && ['k', 's', 'h', 'o', 'cl', 'r', 'tm', 'c'].indexOf(e.drum) >= 0).map(e => ({ t: Math.round(e.t * 4) / 4, d: 0.1, drum: e.drum, v: Math.round(Math.min(1, e.vel || 0.8) * 100) / 100 }));
}
/* ---- one pass of a section, starting at beat 0 ----
   o: { shift (key change in semitones), energy, stop (the band stops on beat 1 of the last bar), chords and notes
        (overrides, for tags and lead-ins), melody: false, melInst, choir: true, focus ('soprano'|'alto'|'tenor') } */
function arrangeSection(P, type, o) {
  o = o || {};
  const meter = meterOf(P), energy = o.energy || ENERGY[type] || 0.8, vel = 0.5 + 0.3 * energy, shift = o.shift || 0;
  const sc = sectionChords(P, type, o), beats = sc.beats;
  const events = [], parts = { chords: [], bass: [], melody: [], drums: [], alto: [], tenor: [] };
  const lastBar = beats - meter.bar;
  const keep = e => !o.stop || e.t < lastBar - 1e-6 || Math.abs(e.t - lastBar) < 1e-6;
  const trim = e => { if (o.stop) { if (e.t < lastBar - 1e-6 && e.t + e.d > lastBar) e.d = lastBar - e.t; if (Math.abs(e.t - lastBar) < 1e-6) e.d = Math.min(e.d, 0.6); } return e; };
  const bk = o.focus ? 0.55 : 1;
  compEvents(sc, P.style || 'whole', meter, vel * bk).filter(keep).map(trim).forEach(e => { events.push(e); e.notes.forEach(m => parts.chords.push({ t: e.t, d: e.d, m, v: Math.round(Math.min(1, e.vel) * 110) })); });
  const hand = (!o.chords || o.chords === sectionOf(P, type).chords) && !o.tagPass && P.edits ? P.edits : null, edB = hand && hand.bass && hand.bass[type], edD = hand && hand.drums && hand.drums[type];
  if (edB) edB.filter(n => n.t < beats - 1e-6).forEach(n => {   // a bass line drawn by hand plays exactly as drawn (moved with the key change)
    let m = n.m + shift; while (m > 55) m -= 12; while (m < 24) m += 12;
    const e = { t: n.t, d: Math.min(n.d, beats - n.t), notes: [m], vel: (n.v || 0.8) * bk };
    if (!keep(e)) return; trim(e); e.part = 'bass'; if (P.bassSound && P.bassSound !== 'finger' && BASS_SOUNDS[P.bassSound]) e.bassIns = 'bass_' + P.bassSound;
    events.push(e); parts.bass.push({ t: e.t, d: e.d, m, v: Math.round(Math.min(1, e.vel) * 110) });
  });
  if (!edB) sc.chs.forEach((ch, i) => {
    bassEvents(sc.voiced[i], sc.voiced[i], sc.voiced[i + 1] || null, ch.t, ch.d, P.bassStyle || 'root', meter, vel * bk).filter(keep).map(trim).forEach(e => { e.part = 'bass'; if (P.bassSound && P.bassSound !== 'finger' && BASS_SOUNDS[P.bassSound]) e.bassIns = 'bass_' + P.bassSound; events.push(e); e.notes.forEach(m => parts.bass.push({ t: e.t, d: e.d, m, v: Math.round(Math.min(1, e.vel) * 110) })); });
  });
  if (o.stop && !sc.chs.some(ch => Math.abs(ch.t - lastBar) < 1e-6)) {   // the band hits beat 1 of the last bar together
    const i = chordAtBeat(sc, lastBar), v = sc.voiced[i];
    events.push({ t: lastBar, d: 0.6, notes: v.rh, vel }); events.push({ t: lastBar, d: 0.6, notes: [v.bass], vel, part: 'bass' });
    v.rh.forEach(m => parts.chords.push({ t: lastBar, d: 0.6, m, v: 90 })); parts.bass.push({ t: lastBar, d: 0.6, m: v.bass, v: 90 });
  }
  let dr = edD ? edD.filter(e => e.t < beats - 1e-6).map(e => ({ t: e.t, d: 0.1, drum: e.drum, vel: e.v || 0.8 })) : drumEvents(P, beats, energy);
  if (dr.length) {
    if (!edD && energy >= 0.9 && !o.tagPass) dr.push({ t: 0, d: 0.1, drum: 'c', vel: 0.7 });
    if (!edD) sc.chs.forEach((ch, i) => { if (ch.spec.push && i > 0) { dr = dr.filter(e => Math.abs(e.t - ch.t) > 0.01 || e.drum === 'h'); dr.push({ t: ch.t, d: 0.1, drum: 'k', vel: 0.85 }); if (energy >= 0.8) dr.push({ t: ch.t, d: 0.1, drum: 'c', vel: 0.6 }); } });
    if (o.stop) { dr = dr.filter(e => e.t < lastBar - 1e-6); dr.push({ t: lastBar, d: 0.1, drum: 'k', vel: 0.95 }, { t: lastBar, d: 0.1, drum: 'c', vel: 0.8 }); }
    else if (o.fill && !edD) { const f = fillEvents(beats, meter.bar, energy, o.fk); dr = dr.filter(e => e.t < f.from - 1e-6 || e.drum === 'h' && false).concat(f.ev); }
    if (o.crashIn && !edD && !dr.some(e => e.drum === 'c' && e.t < 0.01)) dr.push({ t: 0, d: 0.1, drum: 'c', vel: 0.75 });
    dr.forEach(e => { e.vel *= bk; events.push(e); parts.drums.push({ t: e.t, d: 0.25, m: DRUM_MIDI[e.drum] || 38, v: Math.round(40 + Math.min(1, e.vel) * 80) }); });
  }
  let pc = percEvents(P, beats, energy);
  if (pc.length) {
    if (o.stop) pc = pc.filter(e => e.t < lastBar - 1e-6);
    else if (o.fill) { const f = fillEvents(beats, meter.bar, energy, o.fk); pc = pc.filter(e => e.t < f.from - 1e-6); }
    pc.forEach(e => { e.vel *= bk; events.push(e); parts.drums.push({ t: e.t, d: 0.25, m: DRUM_MIDI[e.drum] || 54, v: Math.round(40 + Math.min(1, e.vel) * 80) }); });
  }
  if (o.swell && !o.stop) { const len = Math.min(beats, meter.bar === 4 ? 2 : meter.bar); events.push({ t: beats - len, d: len, drum: 'sw', vel: 0.8 * bk }); parts.drums.push({ t: beats - len, d: len, m: 52, v: 70 }); }
  const mel = o.notes || (P.melodies[type] && P.melodies[type].notes) || [];
  const notes = mel.filter(n => n.t < beats).map(n => ({ m: n.m + shift, t: n.t, d: Math.min(n.d, beats - n.t) }));
  if (o.melody !== false) {
    const lead = o.focus && o.focus !== 'soprano' ? 0.45 : o.focus === 'soprano' ? 1 : 0.8;
    notes.forEach(n => { events.push({ t: n.t, d: n.d, notes: [n.m], inst: o.choirLead ? 'choir' : o.melInst, vel: lead, mel: true }); parts.melody.push({ t: n.t, d: n.d, m: n.m, v: 100 }); });
    if (o.choir && notes.length) {
      const kp = SC.mod(E.pcOfName(P.key) + shift);
      const ch = SC.choirParts(notes, t => ({ pcs: sc.voiced[chordAtBeat(sc, t)].pcs }), kp, sc.chs.map(c => c.t));
      ['alto', 'tenor'].forEach(part => ch[part].forEach(n => {
        events.push({ t: n.t, d: n.d, notes: [n.m], inst: 'choir', vel: o.focus === part ? 1 : o.focus ? 0.4 : 0.6, choir: part });
        parts[part].push({ t: n.t, d: n.d, m: n.m, v: o.focus === part ? 110 : 80 });
      }));
    }
  }
  return { type, beats, chs: sc.chs, voiced: sc.voiced, key: sc.key, chordBeats: sc.chordBeats, events, parts, notes };
}
/* the last two bars of a section (for a tag) */
function sliceEnd(P, type, chords, notes, bars) {
  const ct = chordTimes(chords), from = Math.max(0, ct.beats - bars * meterOf(P).bar), out = [];
  ct.list.forEach(r => { const s = Math.max(r.at, from), e = r.at + r.c.beats; if (e > s + 1e-6) out.push(Object.assign({}, r.c, { beats: e - s, push: r.at >= from ? r.c.push && out.length > 0 : false })); });
  return { chords: out, notes: (notes || []).filter(n => n.t >= from - 1e-6).map(n => Object.assign({}, n, { t: n.t - from })) };
}
/* a key change is prepared by the new key's V7 on the last two beats before it */
function withLeadIn(chords, r) {
  const out = chords.map(c => Object.assign({}, c)), last = out[out.length - 1], li = { r, q: '7', b: null, beats: 2, push: false };
  if (last.beats > 2) { last.beats -= 2; out.push(li); } else out[out.length - 1] = Object.assign(li, { beats: last.beats });
  return out;
}
/* ---- the whole song in order ---- */
function songStructure(P) { return P.form && P.form.length ? P.form.map(i => i.s) : P.structure && P.structure.length ? P.structure.slice() : ['Chorus']; }
const formOf = P => (P.form && P.form.length ? P.form : [formItem({ s: 'Chorus' })]);
function itemLabel(it, P) {
  return it.s + (it.vamp ? ' (vamp ×' + it.x + ')' : it.x > 1 ? ' ×' + it.x : '') + (it.tag ? ' + tag ×' + it.tag : '') + (it.up ? ' · key ' + E.fmt(SC.keyAfter(P.key, it.up)) : '') + (it.stop ? ' · stop' : '');
}
function arrangeSong(P, o) {
  migrateProject(P);
  o = o || {};
  const events = [], parts = { chords: [], bass: [], melody: [], drums: [], alto: [], tenor: [] }, timeline = [], markers = [];
  const form = formOf(P), bar = meterOf(P).bar;
  let at = 0;
  const place = (a, label, item, idx) => {
    timeline.push({ type: item.s, label, start: at, beats: a.beats, chs: a.chs.map(c => Object.assign({}, c, { t: c.t + at })), key: a.key, idx });
    a.events.forEach(e => { const o2 = Object.assign({}, e, { t: e.t + at }); const db = item.lv ? item.lv[Snd.partOf(e)] : 0; if (db) o2.gx = levelGain(db); events.push(o2); });
    Object.keys(parts).forEach(k => a.parts[k].forEach(n => parts[k].push(Object.assign({}, n, { t: n.t + at }))));
    at += a.beats;
  };
  let crashIn = false;
  form.forEach((it, idx) => {
    const next = form[idx + 1], sec = P.sections[it.s], energy = ENERGY_SET[it.en] || ENERGY[it.s] || 0.8;
    const base = { shift: it.up, energy, melody: o.melody, melInst: o.melInst, choir: o.choir !== undefined ? o.choir : !!(P.choir && P.choir.on), focus: o.focus };
    const autoF = !!P.autoFill && !!next && next.s !== it.s && !it.stop, anyFill = !!it.fill || autoF;
    const touches = last => ({ fill: last && anyFill && !it.stop, fk: it.fk, swell: last && it.swell && !it.stop });
    const lead = next && next.up !== it.up && next.lead !== false ? SC.mod(next.up + 7 - it.up) : null;
    markers.push({ t: at, text: itemLabel(it, P) });
    for (let k = 0; k < it.x; k++) {
      const lastPass = k === it.x - 1, chords = lastPass && lead !== null && !it.tag ? withLeadIn(sec.chords, lead) : sec.chords;
      place(arrangeSection(P, it.s, Object.assign({}, base, { chords, stop: lastPass && !it.tag && it.stop, crashIn: k === 0 && crashIn }, touches(lastPass && !it.tag))), it.vamp ? it.s + ' (vamp ' + (k + 1) + ' of ' + it.x + ')' : it.x > 1 ? it.s + ' ' + (k + 1) + ' of ' + it.x : it.s, it, idx);
    }
    for (let k = 0; k < it.tag; k++) {
      const last = k === it.tag - 1, sl = sliceEnd(P, it.s, sec.chords, P.melodies[it.s] && P.melodies[it.s].notes, 2);
      const chords = last && lead !== null ? withLeadIn(sl.chords, lead) : sl.chords;
      place(arrangeSection(P, it.s, Object.assign({}, base, { chords, notes: sl.notes, stop: last && it.stop, tagPass: true }, touches(last))), it.s + ' tag ' + (k + 1), it, idx);
    }
    crashIn = anyFill;
  });
  // the ending
  const endKind = ENDINGS[P.ending] ? P.ending : 'none', bars = meterOf(P).bar;
  let fade = null, rit = null;
  if ((endKind === 'ritard' || endKind === 'ritardhold') && at > bars * 2) {
    // the last two bars slow to about 60% of the tempo: every beat after the start of the slowdown is moved later
    const T0 = at - bars * 2, span = bars * 2, slow = 0.67;
    rit = { from: T0, to: at, span, slow };
    const warp = t => (t <= T0 ? t : T0 + (t - T0) + slow * Math.pow(Math.min(t, at) - T0, 2) / (2 * span) + (t > at ? (t - at) * (1 + slow) : 0));
    events.forEach(e => { const a = warp(e.t), b = warp(e.t + (e.d || 0)); e.t = a; if (e.d) e.d = b - a; });
    Object.keys(parts).forEach(k => parts[k].forEach(n => { const a = warp(n.t), b = warp(n.t + n.d); n.t = a; n.d = b - a; }));
    timeline.forEach(sg => { const a = warp(sg.start), b = warp(sg.start + sg.beats); sg.chs.forEach(c => { const ca = warp(c.t), cb = warp(c.t + c.d); c.t = ca; c.d = cb - ca; }); sg.start = a; sg.beats = b - a; });
    at = warp(at); markers.push({ t: warp(T0), text: 'Slowing down' });
  } else if (endKind === 'fade' && at > bars) fade = { from: at - Math.min(bars * 4, at / 2), to: at };   // four bars, or the second half of a very short song
  if (['hold', 'ritardhold', 'bigfinish'].includes(endKind) && timeline.length) {
    const big = endKind === 'bigfinish', lastSeg = timeline[timeline.length - 1], ch = lastSeg.chs[lastSeg.chs.length - 1], v = SC.voice(P.key, [ch.spec], form[lastSeg.idx] ? form[lastSeg.idx].up : 0)[0], len = bars * 2;
    events.push({ t: at, d: len, notes: v.rh, vel: 0.7 }, { t: at, d: len, notes: [v.bass], vel: 0.7, part: 'bass' });
    if (P.beat && P.beat !== 'none') events.push({ t: at, d: 0.1, drum: 'c', vel: big ? 0.95 : 0.8 }, { t: at, d: 0.1, drum: 'k', vel: 0.9 });
    if (big) {   // a snare roll through the last bar, building up, and toms with the final hit
      const from = Math.max(0, at - bars), n = Math.round(bars * 4); const roll = [];
      for (let q = 0; q < n; q++) roll.push({ t: from + q * 0.25 * (bars / (n / 4)), d: 0.1, drum: 's', vel: 0.4 + 0.55 * (q / n) });
      roll.forEach(r => { if (r.t < at) { events.push(r); parts.drums.push({ t: r.t, d: 0.25, m: 38, v: Math.round(40 + r.vel * 80) }); } });
      events.push({ t: at, d: 0.1, drum: 'tl', vel: 0.9 }, { t: at, d: 0.1, drum: 's', vel: 0.9 });
      parts.drums.push({ t: at, d: 0.25, m: 49, v: 115 }, { t: at, d: 0.25, m: 36, v: 110 });
    }
    v.rh.forEach(m => parts.chords.push({ t: at, d: len, m, v: 80 })); parts.bass.push({ t: at, d: len, m: v.bass, v: 80 });
    timeline.push({ type: lastSeg.type, label: 'Ending (hold)', start: at, beats: len, chs: [Object.assign({}, ch, { t: at, d: len })], key: lastSeg.key, idx: lastSeg.idx });
    markers.push({ t: at, text: 'Ending' });
    at += len;
  }
  void bar;
  const segs = timeline.map(t => ({ type: t.type, start: t.start, beats: t.beats, up: form[t.idx] ? form[t.idx].up : 0 }));
  midiLoopEvents(P, segs).forEach(e => { events.push(e); if (e.drum) parts.drums.push({ t: e.t, d: 0.25, m: DRUM_MIDI[e.drum] || 38, v: Math.round(40 + e.vel * 80) }); else (parts.loops = parts.loops || []).push({ t: e.t, d: e.d, m: e.notes[0], v: Math.round(e.vel * 110) }); });
  const evs = mixFilter(P, humanizeKeys(events, P.humanKeys, P.bpm)), mix = partsMix(P);
  // a slowdown: loops and beats play up to it as they are; from there each one's last two bars are stretched more and
  // more (pitch kept), in step with the band (see loopAudio)
  let places = loopPlacements(P, segs);
  if (rit) {
    const tails = {};
    places.forEach(p => { if (p.at + p.dur > rit.from + 1e-6) (tails[p.L.id] = tails[p.L.id] || []).push(p); });
    places = places.filter(p => p.at < rit.from - 1e-6).map(p => (p.at + p.dur > rit.from ? Object.assign({}, p, { dur: rit.from - p.at }) : p));
    Object.keys(tails).forEach(id => places.push({ L: tails[id][0].L, tail: true, src: tails[id], rit, at: rit.from, dur: rit.span * (1 + rit.slow / 2) + 0.5, shift: 0, offset: 0 }));
  }
  const lv = mix.loops.v; places.forEach(p => { p.mixGain = lv; p.pan = mix.loops.pan; });
  return { events: evs, parts, timeline, markers, total: at, bpm: P.bpm, places, ritard: rit, script: { events: evs, bpm: P.bpm, total: at, mix, fade, kit: P.kit || 0 } };
}

/* ---- loops and beats ----
   P.loops: [{ id, name, kind: 'loop' | 'beat' | 'midi', role: 'drums' | 'music', bpm (the file's tempo), beats (its
   length), keyPc/minor (from the name), tr (semitones), gain, mute, secs (sections a loop plays in), offset (seconds
   into a beat where bar 1 starts), inst (instrument for a MIDI loop's notes), midi ({ notes, drums }) }].
   Audio files are kept on this computer with the guide takes; loops are stretched to the song's tempo (keeping
   their pitch) and moved with key changes. */
const MAX_LOOPS = 16;
const loopKey = (P, L) => 'loop:' + P.id + ':' + L.id;
const LoopCache = new Map();
function forgetLoops(pid) { [...LoopCache.keys()].filter(k => k.indexOf('loop:' + pid + ':') === 0).forEach(k => LoopCache.delete(k)); }
/* ---- the memory saver ----
   A recorded track kept ready to play takes about 8 MB a minute (stereo, after the vocal sound); its takes, loops and
   the export take more. When a song would need more than about 15% of the computer's memory (600 MB on a 4 GB
   laptop), the memory saver plays tracks with a light, live version of the vocal sound (no copies kept) and exports
   process one track at a time. Profile > Settings can set it to always or never. */
function memEstimateMB(P) {
  let mb = 0;
  recordedTracks(P).forEach(r => { const secs = r.T.dur || (r.T.takes[r.T.main] || {}).dur || 0; mb += secs * 48000 * 4 * ((r.T.fx.preset !== 'off' ? 2 : 1) + 1) / 1048576; });
  (P.loops || []).forEach(L => { mb += (L.kind === 'beat' ? (L.dur || 200) : 10) * 44100 * 2 * 4 * 2 / 1048576; });
  return Math.round(mb);
}
function memBudgetMB() {
  const pref = S.prefs.memSaver || 'auto';
  if (pref === 'on') return 0; if (pref === 'off') return Infinity;
  const gb = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 4;
  return Math.round(gb * 1024 * 0.15);
}
const lowMem = P => memEstimateMB(P) > memBudgetMB();
let loopWorker = null, loopSeq = 0, loopIdle = 0; const loopWaiting = new Map();
function loopWorkerIdle() { clearTimeout(loopIdle); loopIdle = setTimeout(() => { if (loopWorker && !loopWaiting.size) { loopWorker.terminate(); loopWorker = null; } }, 3000); }   // let go after use, like the vocal worker
function fitAsync(channels, sr, from, to, semis) {
  if (typeof Worker === 'undefined' || loopWorker === false) return Promise.resolve(LoopTools.fit(channels, sr, from, to, semis));
  try {
    if (!loopWorker) {
      loopWorker = new Worker('workers/loop-worker.js');
      loopWorker.onmessage = e => { const w = loopWaiting.get(e.data.id); if (!w) return; loopWaiting.delete(e.data.id); loopWorkerIdle(); if (e.data.error) w.fail(); else w.ok(e.data.out); };
      loopWorker.onerror = () => { loopWorker = false; loopWaiting.forEach(w => w.fail()); loopWaiting.clear(); };
    }
    const id = ++loopSeq, copies = channels.map(c => c.slice());
    return new Promise(res => { loopWaiting.set(id, { ok: res, fail: () => res(LoopTools.fit(channels, sr, from, to, semis)) }); loopWorker.postMessage({ id, channels: copies, sr, from, to, semis }, copies.map(c => c.buffer)); });
  } catch (e) { loopWorker = false; return Promise.resolve(LoopTools.fit(channels, sr, from, to, semis)); }
}
async function loopSource(P, L) {
  const k = loopKey(P, L);
  if (LoopCache.has(k)) return LoopCache.get(k);
  const blob = await GuideStore.get(k); if (!blob) return null;
  const c = Snd.ensure(); if (!c) return null;
  const b = await c.decodeAudioData(await blob.arrayBuffer()); LoopCache.set(k, b); return b;
}
/* the loop at the song's tempo and in the key of a section (shift = key change in semitones) */
async function loopAt(P, L, shift) {
  const semis = L.role === 'drums' ? 0 : (L.tr || 0) + (shift || 0), k = loopKey(P, L) + '@' + P.bpm + ':' + semis + ':' + L.bpm;
  if (LoopCache.has(k)) return LoopCache.get(k);
  const src = await loopSource(P, L); if (!src) return null;
  const ch = []; for (let i = 0; i < src.numberOfChannels; i++) ch.push(src.getChannelData(i));
  const out = await fitAsync(ch, src.sampleRate, L.bpm, P.bpm, semis);
  const c = Snd.ensure(), b = c.createBuffer(out.length, out[0].length, src.sampleRate); out.forEach((d, i) => b.getChannelData(i).set(d));
  LoopCache.set(k, b); return b;
}
/* where each loop plays: a loop repeats from the start of every section it is chosen for; a beat runs under the whole
   song from bar 1. segs: the arrangement's timeline ([{ type, start, beats, up }]). */
function loopPlacements(P, segs, o) {
  o = o || {};
  const out = [], spb = 60 / P.bpm, any = (P.loops || []).filter(L => !L.mute);
  any.forEach(L => {
    if (L.kind === 'beat') {
      if (o.section) { const first = o.firstStart || 0; out.push({ L, shift: 0, at: 0, dur: segs[0].beats, offset: (L.offset || 0) + first * 60 / L.bpm }); return; }
      const total = segs.reduce((a, sg) => Math.max(a, sg.start + sg.beats), 0);
      out.push({ L, shift: 0, at: 0, dur: total, offset: (L.offset || 0) });
      return;
    }
    if (L.kind === 'midi') return;
    segs.forEach(sg => {
      if (!(L.secs || []).includes(sg.type)) return;
      for (let b = 0; b < sg.beats - 1e-6; b += L.beats) out.push({ L, shift: sg.up || 0, at: sg.start + b, dur: Math.min(L.beats, sg.beats - b), offset: 0 });
    });
  });
  void spb;
  return out;
}
/* MIDI loops become note and drum events of the arrangement */
function midiLoopEvents(P, segs) {
  const ev = [];
  (P.loops || []).filter(L => L.kind === 'midi' && !L.mute && L.midi).forEach(L => segs.forEach(sg => {
    if (!(L.secs || []).includes(sg.type)) return;
    const g = L.gain == null ? 1 : L.gain;
    for (let b = 0; b < sg.beats - 1e-6; b += L.beats) {
      L.midi.drums.forEach(d => { if (b + d.t < sg.beats - 1e-6) ev.push({ t: sg.start + b + d.t, d: 0.1, drum: d.drum, vel: Math.min(1, d.vel * g), loop: L.id }); });
      L.midi.notes.forEach(n => { if (b + n.t < sg.beats - 1e-6) ev.push({ t: sg.start + b + n.t, d: Math.min(n.d, sg.beats - b - n.t), notes: [n.m + (L.tr || 0) + (sg.up || 0)], vel: Math.min(1, n.vel * g), inst: L.inst || 'piano', loop: L.id }); });
    }
  }));
  return ev;
}
/* resolve the audio of every placement (stretching what is needed), for a script */
/* the parts of the form with their level changes (null when the song has none) */
function levelSegments(P) {
  if (!formOf(P).some(i => i.lv)) return null;
  const form = formOf(P), A = arrangeSong(P, { melody: false, choir: false }), segs = A.timeline.map(t => ({ s0: t.start, s1: t.start + t.beats, lv: (form[t.idx] || {}).lv || null }));
  if (segs.length) { segs[0].s0 = -Infinity; segs[segs.length - 1].s1 = Infinity; }
  return segs;
}
/* one recorded clip cut at the parts of the form, each piece with its own gain (they share the same audio) */
function splitByLevels(clip, key, segs, spb) {
  if (!segs || !segs.some(s => s.lv && s.lv[key])) return [clip];
  const out = [], end = clip.at + clip.dur;
  segs.forEach(s => {
    const a = Math.max(clip.at, s.s0), b = Math.min(end, s.s1); if (b - a <= 0.01) return;
    const db = s.lv && s.lv[key] ? s.lv[key] : 0;
    out.push(Object.assign({}, clip, { at: a, offset: (clip.offset || 0) + (a - clip.at) * spb, dur: b - a, gain: (clip.gain == null ? 1 : clip.gain) * (db ? levelGain(db) : 1) }));
  });
  return out.length ? out : [clip];
}
async function loopAudio(P, places) {
  const out = [];
  for (const p of places) {
    if (p.tail) { const tb = await ritardTail(P, p).catch(() => null); if (tb) out.push({ buf: tb, at: p.at, dur: tb.duration / (60 / P.bpm), offset: 0, gain: (p.L.gain == null ? 1 : p.L.gain) * (p.mixGain == null ? 1 : p.mixGain), pan: p.pan || 0, loop: p.L.id }); continue; }
    const buf = await loopAt(P, p.L, p.shift).catch(() => null); if (buf) out.push({ buf, at: p.at, dur: p.dur, offset: p.offset, gain: (p.L.gain == null ? 1 : p.L.gain) * (p.mixGain == null ? 1 : p.mixGain), pan: p.pan || 0, loop: p.L.id }); }
  const segs = levelSegments(P), spb = 60 / P.bpm;
  return segs ? out.reduce((acc, c) => acc.concat(splitByLevels(c, 'loops', segs, spb)), []) : out;
}
/* the last two bars of a loop or beat, slowing down with the band: what it would have played there, put together from
   its placements, then stretched more and more (the same curve as the band: each beat up to 1.67 times longer) */
async function ritardTail(P, p) {
  const spb = 60 / P.bpm, r = p.rit, len = r.span * spb;
  let sr = 44100, chans = null;
  for (const q of p.src) {
    const buf = q.L.kind === 'beat' ? await loopAt(P, q.L, 0) : await loopAt(P, q.L, q.shift); if (!buf) continue;
    sr = buf.sampleRate; if (!chans) chans = [0, 1].map(() => new Float32Array(Math.round(len * sr)));
    const from = Math.max(q.at, r.from), to = Math.min(q.at + q.dur, r.to); if (to <= from) continue;
    const srcAt = Math.round(((from - q.at) * spb + (q.offset || 0)) * sr), dstAt = Math.round((from - r.from) * spb * sr), n = Math.round((to - from) * spb * sr);
    for (let c = 0; c < 2; c++) { const s = buf.getChannelData(Math.min(c, buf.numberOfChannels - 1)), d = chans[c]; for (let i = 0; i < n && dstAt + i < d.length && srcAt + i < s.length; i++) d[dstAt + i] = s[srcAt + i]; }
  }
  if (!chans) return null;
  const out = LoopTools.stretchVar(chans, sr, t => 1 + r.slow * t / len);
  const c = Snd.ensure(), b = c.createBuffer(2, out[0].length, sr); out.forEach((d, i) => b.getChannelData(i).set(d));
  return b;
}
const hasAudioLoops = P => (P.loops || []).some(L => !L.mute && L.kind !== 'midi');
/* ---- the mixer: the app's parts (chords, bass, drums, melody, choir, loops) and every recorded track have a volume,
   a place left-right, mute and solo. Solo anything and only the soloed channels play. */
const MIX_PARTS = { chords: 'Keyboard chords', bass: 'Bass', drums: 'Drums', melody: 'Melody', choir: 'Choir parts', loops: 'Loops and beats' };
function mixerOf(P) {
  const m = P.mixer = P.mixer && typeof P.mixer === 'object' ? P.mixer : {};
  if (P.mix) { Object.keys(P.mix).forEach(k => { if (P.mix[k] === false) (m[k] = m[k] || {}).mute = true; }); delete P.mix; }   // the 2.9 on/off switches
  Object.keys(MIX_PARTS).forEach(k => { const c = m[k] = m[k] || {}; if (c.v == null) c.v = 1; if (!c.pan) c.pan = 0; ['tone', 'comp', 'room', 'lc', 'el', 'em', 'eh', 'duck'].forEach(f => { if (typeof c[f] !== 'number') c[f] = 0; }); if (typeof c.ef !== 'number') c.ef = 1000; });
  return m;
}
const anySolo = P => { const m = mixerOf(P); return Object.keys(MIX_PARTS).some(k => m[k].solo) || recordedTracks(P).some(r => r.T.solo); };
const audible = (P, ch) => !ch.mute && (!anySolo(P) || !!ch.solo);
/* the sound of one part for the audio engine: volume, place, and (only when used) tone, evening-out and extra room */
const partFx = (c, v) => { const o = { v, pan: c.pan }; if (c.tone) o.tone = c.tone; if (c.comp) o.comp = c.comp; if (c.room) o.room = c.room; if (c.lc) o.lc = c.lc; if (c.el) o.el = c.el; if (c.em) { o.em = c.em; o.ef = c.ef || 1000; } if (c.eh) o.eh = c.eh; if (c.duck) o.duck = c.duck; return o; };
function partsMix(P) { const m = mixerOf(P), out = {}; Object.keys(MIX_PARTS).forEach(k => { out[k] = partFx(m[k], audible(P, m[k]) ? m[k].v : 0); }); return out; }
function mixFilter(P, events) {   // muted parts are not played at all (and not written to the MIDI file)
  const m = mixerOf(P), off = k => !audible(P, m[k]);
  return events.filter(e => { if (e.click) return true; const k = Snd.partOf ? Snd.partOf(e) : 'chords'; return k === 'click' || !off(k); });
}
/* the recorded tracks as audio clips for a script: [{ buf, at, dur, offset, gain, pan }] */
async function recordedAudio(P, o) {
  o = o || {};
  const spb = 60 / P.bpm, out = [], light = o.live && lowMem(P), segs = levelSegments(P);
  for (const r of recordedTracks(P)) {
    if (o.exclude && r.T === o.exclude) continue;
    if (o.only !== undefined && o.only !== r.id) continue;
    if (o.only === undefined && !audible(P, r.T)) continue;
    const buf = await GuideStore.trackBuffer(P, r.T, { light, noCache: o.noCache }).catch(() => null); if (!buf) continue;
    const nudge = (r.T.nudgeMs || 0) / 1000;
    const clip = { buf, at: nudge > 0 ? nudge / spb : 0, offset: nudge < 0 ? -nudge : 0, dur: buf.duration / spb + 1, gain: r.T.gain == null ? 1 : r.T.gain, pan: r.T.pan || 0, track: r.id,
      chain: light && r.T.fx.preset !== 'off' ? r.T.fx.preset : null, room: r.T.fx.reverb !== false };
    splitByLevels(clip, 'tk' + (r.id || ''), segs, spb).forEach(c => out.push(c));
  }
  return out;
}

/* ---- arrangement touches: drum fills, swells, endings ---- */
const ENDINGS = { none: 'Stop at the end', hold: 'Hold the last chord (a fermata)', ritard: 'Slow down over the last two bars', ritardhold: 'Slow down, then hold the last chord', bigfinish: 'Big finish: drum roll, then a full final hit that rings', fade: 'Fade out over the last four bars' };
const FILL_KINDS = { snare: 'Snare roll (builds up)', toms: 'Toms rolling down', half: 'Quick fill (last beat only)', crash: 'No fill: just a crash into the next part' };
/* a drum fill on the last beats of a section: snare and toms rolling down, louder as it goes. kind: '' (the usual one for the section's energy),
   'snare', 'toms', 'half' or 'crash' */
function fillEvents(beats, bar, energy, kind) {
  const ev = [], long = energy >= 0.85 && bar === 4;
  if (kind === 'crash') return { from: beats - 0.25, ev: [{ t: beats - 0.25, d: 0.1, drum: 'k', vel: 0.8 }] };
  if (kind === 'snare') {   // two beats of snare: eighths, then sixteenths, getting louder
    const start = beats - (bar === 4 ? 2 : 1), n = bar === 4 ? 12 : 6; let t = start;
    for (let i = 0; i < n; i++) { ev.push({ t, d: 0.1, drum: 's', vel: 0.45 + 0.5 * (i / n) }); t += i < n / 3 ? 0.5 * (bar === 4 ? 1 : 0.5) : 0.25 * (bar === 4 ? 1 : 0.5); if (t >= beats - 0.01) break; }
    ev.push({ t: start, d: 0.1, drum: 'k', vel: 0.8 });
    return { from: start, ev };
  }
  if (kind === 'toms' || kind === 'half') {
    const len = kind === 'half' ? 1 : (bar === 4 ? 2 : 1), start = beats - len, step = len / (kind === 'half' ? 4 : bar === 4 ? 8 : 4), kit = kind === 'half' ? ['s', 'th', 'tm', 'tl'] : ['th', 'th', 'tm', 'tm', 'tl', 'tl', 'k', 's'];
    kit.slice(0, Math.round(len / step)).forEach((d, i, a) => ev.push({ t: start + i * step, d: 0.1, drum: d, vel: 0.55 + 0.4 * (i / a.length) }));
    return { from: start, ev };
  }
  const start = beats - (long ? 2 : 1), step = bar === 4 ? 0.25 : 0.5;
  const kit = long ? ['s', 's', 'th', 'th', 'tm', 'tm', 'tl', 'tl'] : bar === 4 ? ['s', 's', 'th', 'tl'] : ['s', 'th', 'tl'];
  kit.forEach((d, i) => ev.push({ t: start + i * step, d: 0.1, drum: d, vel: 0.55 + 0.4 * (i / kit.length) }));
  ev.push({ t: start, d: 0.1, drum: 'k', vel: 0.8 });
  return { from: start, ev };
}

/* ---- exports ---- */
const songSlug = P => (P.title || 'song').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'song';
function exportSongMidi(P) {
  const A = arrangeSong(P), tracks = [{ name: 'Chords', ch: 0, notes: A.parts.chords }, { name: 'Bass', ch: 1, notes: A.parts.bass }];
  if (A.parts.melody.length) tracks.push({ name: P.choir && P.choir.on ? 'Soprano (melody)' : 'Melody', ch: 2, notes: A.parts.melody });
  if (A.parts.alto.length) tracks.push({ name: 'Alto', ch: 3, notes: A.parts.alto });
  if (A.parts.tenor.length) tracks.push({ name: 'Tenor', ch: 4, notes: A.parts.tenor });
  if (A.parts.drums.length && !(P.mix && P.mix.drums === false && !(P.loops || []).some(L => L.kind === 'midi'))) tracks.push({ name: 'Drums', ch: 9, notes: A.parts.drums });
  if (A.parts.loops && A.parts.loops.length) tracks.push({ name: 'MIDI loops', ch: 5, notes: A.parts.loops });
  const ts = P.ts === 6 ? [6, 8] : P.ts === 3 ? [3, 4] : [4, 4];
  const data = buildMidi({ title: P.title || 'My song', bpm: P.bpm, ts, markers: A.markers, tracks });
  const name = songSlug(P) + '_' + P.key.replace('#', 'sharp') + '_' + P.bpm + 'bpm.mid';
  saveFile(name, 'audio/midi', data);
  return { name, A };
}
/* PCM WAV from an AudioBuffer (stereo or mono): 16-bit for sharing, 24-bit (studio quality) for recorded voices.
   meta ({ title, artist, copyright, year, comment, genre }) is written as a RIFF INFO list, which players show. */
function encodeWav(buf, bits, meta) {
  const B = bits === 24 ? 3 : 2, ch = Math.min(2, buf.numberOfChannels), n = buf.length, sr = buf.sampleRate;
  const info = [];
  if (meta) [['INAM', meta.title], ['IART', meta.artist], ['ICOP', meta.copyright], ['ICRD', meta.year], ['ICMT', meta.comment], ['IGNR', meta.genre], ['ISFT', 'Gospel Music Academy']].forEach(([id, v]) => {
    if (!v) return; const t = unescape(encodeURIComponent(String(v).slice(0, 250))) + '\0', pad = t.length & 1; info.push({ id, t, size: t.length, pad });
  });
  const listSize = info.length ? 4 + info.reduce((a, x) => a + 8 + x.size + x.pad, 0) : 0, dataBytes = n * ch * B;
  const out = new DataView(new ArrayBuffer(44 + dataBytes + (listSize ? 8 + listSize : 0)));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i) & 255); };
  str(0, 'RIFF'); out.setUint32(4, 36 + dataBytes + (listSize ? 8 + listSize : 0), true); str(8, 'WAVE'); str(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
  out.setUint16(22, ch, true); out.setUint32(24, sr, true); out.setUint32(28, sr * ch * B, true); out.setUint16(32, ch * B, true); out.setUint16(34, B * 8, true);
  str(36, 'data'); out.setUint32(40, dataBytes, true);
  const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    const v = Math.max(-1, Math.min(1, data[c][i]));
    if (B === 2) { out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7FFF, true); o += 2; }
    else { let x = Math.round(v < 0 ? v * 0x800000 : v * 0x7FFFFF); if (x < 0) x += 0x1000000; out.setUint8(o, x & 255); out.setUint8(o + 1, (x >> 8) & 255); out.setUint8(o + 2, (x >> 16) & 255); o += 3; }
  }
  if (listSize) { str(o, 'LIST'); out.setUint32(o + 4, listSize, true); str(o + 8, 'INFO'); o += 12; info.forEach(x => { str(o, x.id); out.setUint32(o + 4, x.size, true); str(o + 8, x.t); o += 8 + x.size + x.pad; }); }
  return new Uint8Array(out.buffer);
}
/* ---- MP3: the LAME encoder (lamejs, LGPL) is added to the app by the release build (vendor/lame.min.js) and loaded
   only when an MP3 is made. The song details are written as an ID3 tag. ---- */
let lameP = null;
function loadLame() {
  if (typeof window !== 'undefined' && window.lamejs) return Promise.resolve(window.lamejs);
  if (lameP) return lameP;
  lameP = new Promise(res => { const sc = document.createElement('script'); sc.src = 'vendor/lame.min.js'; sc.onload = () => res(window.lamejs || null); sc.onerror = () => { lameP = null; res(null); }; document.head.appendChild(sc); });
  return lameP;
}
async function encodeMp3(buf, kbps, meta) {
  const lame = await loadLame(); if (!lame) return null;
  const ch = []; for (let i = 0; i < Math.min(2, buf.numberOfChannels); i++) ch.push(buf.getChannelData(i));
  return Mp3.encode(lame, ch, buf.sampleRate, kbps || 192, meta);
}
/* is the MP3 maker in this copy of the app? (shown in Profile > About) */
async function mp3Ready() { const l = await loadLame(); return !!(l && l.Mp3Encoder); }
/* ---- a ZIP file (stored, no compression: audio does not compress), for the stems ---- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(d) { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
/* files: [{ name, data: Uint8Array, or { blob, size, crc } }]; with asBlob the ZIP is returned as a Blob made of
   the pieces (no second copy in memory: large stems stay in the browser's file storage) */
function makeZip(files, asBlob) {
  const enc = s => new TextEncoder().encode(s), local = [], central = []; let off = 0;
  const now = new Date(), dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)), dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate());
  files.forEach(f => {
    const name = enc(f.name), data = f.blob || f.data, size = f.blob ? f.size : data.length, crc = f.blob ? f.crc : crc32(data), h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
    h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    local.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
    c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), name);
    off += 30 + name.length + size;
  });
  const cs = central.reduce((a, x) => a + x.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
  const parts = local.concat(central, [new Uint8Array(e.buffer)]);
  if (asBlob) return new Blob(parts, { type: 'application/zip' });
  const out = new Uint8Array(parts.reduce((a, x) => a + x.length, 0)); let o = 0; parts.forEach(x => { out.set(x, o); o += x.length; });
  return out;
}
/* ---- big saves written piece by piece ----
   In the desktop app, stems and song packages go straight into the file on disk as each part is ready (you choose
   where first), so a long song's files never sit in memory together. In a browser they are gathered as a download. */
const SAVE_CHUNK = 8 * 1048576;
async function openSaveSink(name, mime) {
  const D = typeof window !== 'undefined' && window.gpaDesktop;
  if (D && typeof D.saveOpen === 'function') {
    const r = await D.saveOpen(name).catch(() => null);
    if (r && r.ok && r.canceled) return null;
    if (r && r.ok && r.id) {
      let bytes = 0;
      const send = async u8 => {
        for (let i = 0; i < u8.length; i += SAVE_CHUNK) { const w = await D.saveWrite(r.id, u8.slice(i, i + SAVE_CHUNK)); if (!w || !w.ok) throw new Error('the file could not be written (is the disk full?)'); }
        bytes += u8.length;
      };
      return { disk: true, name: r.name || name,
        async write(d) { if (typeof Blob !== 'undefined' && d instanceof Blob) { for (let i = 0; i < d.size; i += SAVE_CHUNK) await send(new Uint8Array(await d.slice(i, i + SAVE_CHUNK).arrayBuffer())); } else await send(d); },
        async close(ok) { const c = await D.saveClose(r.id, ok !== false).catch(() => null); if (ok !== false && !(c && c.ok)) throw new Error('the file could not be finished'); return { name: (c && c.name) || r.name || name, bytes }; } };
    }
    // the desktop save is not available (an older desktop shell): fall back to a download
  }
  const parts = []; let bytes = 0;
  return { disk: false, name,
    async write(d) { const isBlob = typeof Blob !== 'undefined' && d instanceof Blob; parts.push(isBlob ? d : new Blob([d])); bytes += isBlob ? d.size : d.length; },
    async close(ok) { if (ok !== false) saveFile(name, mime, new Blob(parts, { type: mime })); parts.length = 0; return { name, bytes }; } };
}
/* a stored ZIP written entry by entry into a save sink; data is a Uint8Array or a Blob (with its crc given) */
function zipWriter(sink) {
  const enc = s => new TextEncoder().encode(s), central = []; let off = 0, count = 0;
  const now = new Date(), dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)), dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate());
  return {
    async add(fileName, data, crc) {
      const name = enc(fileName), isBlob = typeof Blob !== 'undefined' && data instanceof Blob, size = isBlob ? data.size : data.length;
      if (crc === undefined) crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
      h.setUint32(14, crc, true); h.setUint32(18, size, true); h.setUint32(22, size, true); h.setUint16(26, name.length, true);
      const head = new Uint8Array(30 + name.length); head.set(new Uint8Array(h.buffer)); head.set(name, 30);
      await sink.write(head); await sink.write(data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
      c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      const ce = new Uint8Array(46 + name.length); ce.set(new Uint8Array(c.buffer)); ce.set(name, 46); central.push(ce);
      off += 30 + name.length + size; count++;
    },
    async finish() {
      const cs = central.reduce((a, x) => a + x.length, 0), dir = new Uint8Array(cs + 22); let o = 0; central.forEach(x => { dir.set(x, o); o += x.length; });
      const e = new DataView(dir.buffer, cs, 22);
      e.setUint32(0, 0x06054b50, true); e.setUint16(8, count, true); e.setUint16(10, count, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
      await sink.write(dir);
      return off + dir.length;
    }
  };
}
/* ---- reading a ZIP (stored, or deflated by another program, through the browser's own decompressor) ---- */
async function readZip(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), dv = new DataView(b.buffer, b.byteOffset, b.byteLength), out = {};
  let e = -1; for (let i = b.length - 22; i >= Math.max(0, b.length - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('not a song package (no ZIP directory)');
  const count = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  for (let k = 0; k < count; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('the package is damaged');
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nlen));
    const lo = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), raw = b.subarray(lo, lo + csize);
    if (method === 0) out[name] = raw.slice();
    else if (method === 8 && typeof DecompressionStream !== 'undefined') out[name] = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    else throw new Error('the package uses a compression this app cannot read');
    p += 46 + nlen + xlen + clen;
  }
  return out;
}
/* ---- the song package: one .gmasong file with the song and every recording and loop it uses ----
   Backups of the app keep songs, chords and words but not audio (that stays on this computer). A package carries
   everything, to keep safe on a flash drive, Google Drive or WhatsApp, and opens on any computer. */
const PKG_FORMAT = 'gospel-music-academy/song';
async function exportPackage(P) {
  const name = songSlug(P) + '.gmasong', sink = await openSaveSink(name, 'application/zip');
  if (!sink) return { canceled: true };
  try {
    const zw = zipWriter(sink), audio = [], missing = [];
    const add = async (key, path) => {
      const blob = await GuideStore.get(key).catch(() => null); if (!blob) { missing.push(key); return; }
      const crc = crc32(new Uint8Array(await blob.arrayBuffer()));   // read once for the checksum, then written straight out
      await zw.add(path, blob, crc); audio.push({ key, file: path, type: blob.type || '' });
    };
    for (const r of recordedTracks(P)) for (const t of r.T.takes.concat(r.T.patches || [])) await add(t.k, 'audio/' + t.k.replace(/[^A-Za-z0-9]+/g, '_') + '.wav');
    for (const L of (P.loops || [])) if (L.kind !== 'midi') await add(loopKey(P, L), 'loops/' + L.id + '_' + String(L.name || 'loop').replace(/[^A-Za-z0-9]+/g, '-').slice(0, 30));
    const manifest = { format: PKG_FORMAT, version: 1, app: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '', created: new Date().toISOString(), title: P.title || '', id: P.id, audio, missing };
    const te = new TextEncoder();
    await zw.add('manifest.json', te.encode(JSON.stringify(manifest, null, 1)));
    await zw.add('song.json', te.encode(JSON.stringify(P)));
    await zw.add('README.txt', te.encode('This is a Gospel Music Academy song package: "' + (P.title || 'My song') + '".\r\nOpen it in the app: Song Lab > My song projects > Open a song package.\r\nIt holds the song (chords, melody, words, settings) and ' + audio.length + ' recordings and loops.\r\n' + (copyrightLine(P) || '')));
    await zw.finish();
    const done = await sink.close(true);
    if (!missing.length) { P.pkgAt = Date.now(); touch(); }   // everything is in the package: the reminder can rest
    return { name: done.name, bytes: done.bytes, count: audio.length, missing: missing.length, disk: sink.disk };
  } catch (e) { await sink.close(false).catch(() => {}); throw e; }
}
/* open a package: the song gets its own id (a copy if the same song is already here) and its audio is stored */
async function importPackage(bytes) {
  const z = await readZip(bytes);
  if (!z['manifest.json'] || !z['song.json']) throw new Error('this is not a Gospel Music Academy song package');
  const man = JSON.parse(new TextDecoder().decode(z['manifest.json']));
  if (man.format !== PKG_FORMAT) throw new Error('this is not a Gospel Music Academy song package');
  const raw = JSON.parse(new TextDecoder().decode(z['song.json'])), oldId = String(raw.id || ''), taken = new Set(S.songs.map(x => x.id));
  let id = oldId;
  if (!Sanitize.SONG_ID_RE.test(id) || taken.has(id)) {
    id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    const fix = k => (typeof k === 'string' && k.indexOf(oldId) === 0 ? id + k.slice(oldId.length) : k);
    if (raw.guide && Array.isArray(raw.guide.takes)) raw.guide.takes.forEach(t => { t.k = fix(t.k); });
    if (raw.guide && Array.isArray(raw.guide.patches)) raw.guide.patches.forEach(t => { t.k = fix(t.k); });
    (raw.tracks || []).forEach(T => { (T.takes || []).forEach(t => { t.k = fix(t.k); }); (T.patches || []).forEach(t => { t.k = fix(t.k); }); });
    if (taken.has(oldId) && S.songs.some(x => x.title === raw.title)) raw.title = String(raw.title || 'My song').slice(0, 70) + ' (copy)';
  }
  raw.id = id;
  const P = Sanitize.cleanSong(raw, sanCtx(), taken);
  if (!P) throw new Error('the song in the package could not be read');
  migrateProject(P);
  let stored = 0;
  for (const a of man.audio || []) {
    const data = z[a.file]; if (!data || typeof a.key !== 'string') continue;
    const key = a.key.indexOf(oldId) === 0 ? id + a.key.slice(oldId.length) : a.key.replace('loop:' + oldId + ':', 'loop:' + id + ':');
    if (key.indexOf(id) !== 0 && key.indexOf('loop:' + id + ':') !== 0) continue;   // only this song's own audio
    await GuideStore.put(key, new Blob([data], { type: a.type || (/\.wav$/.test(a.file) ? 'audio/wav' : '') })); stored++;
  }
  if (stored) P.pkgAt = Date.now();   // its recordings came from a package, so they are already kept in one
  S.songs.push(P); touch();
  return { P, stored, total: (man.audio || []).length };
}

/* ---- song details (writers, copyright…) for exports and the lyrics sheet ---- */
function songMeta(P) {
  const i = P.info || {}, year = i.year || String(new Date().getFullYear());
  return { title: P.title || 'My song', artist: i.artist || i.writers || '', copyright: '© ' + year + ' ' + (i.publisher || i.writers || i.artist || ''), year, genre: 'Gospel',
    comment: [i.writers ? 'Written by ' + i.writers : '', i.theme || '', i.ccli ? 'CCLI ' + i.ccli : ''].filter(Boolean).join(' · ') };
}
const copyrightLine = P => { const m = songMeta(P); return m.copyright.trim() !== '© ' + m.year ? m.copyright + (P.info && P.info.writers ? ' · Words and music: ' + P.info.writers : '') + (P.info && P.info.ccli ? ' · CCLI ' + P.info.ccli : '') : ''; };

/* the song as audio (not yet mastered). opts: melody (false = backing), tracks (recorded tracks, default with the
   melody), loops, focus (choir rehearsal), only ({ part } | { track } | { loop }: one stem) */
async function renderSong(P, opts) {
  opts = opts || {};
  const only = opts.only;
  const A = arrangeSong(P, { melody: opts.melody !== false, melInst: Snd.inst(), focus: opts.focus, choir: opts.focus ? true : undefined });
  const script = A.script;
  if (only) {
    // one stem: just that part (with its volume and place in the mix), every stem the same length
    const mix = mixerOf(P), keep = e => !e.click && (only.part ? Snd.partOf(e) === only.part && !(only.part === 'loops' && false) : only.loop ? e.loop === only.loop : false);
    const all = arrangeSong(Object.assign({}, P, { mixer: Object.assign({}, mix, Object.keys(MIX_PARTS).reduce((o, k) => { o[k] = Object.assign({}, mix[k], { mute: false, solo: false }); return o; }, {})) }), { melody: true, melInst: Snd.inst() });
    script.events = all.events.filter(keep);
    script.mix = Object.keys(MIX_PARTS).reduce((o, k) => { o[k] = partFx(mix[k], mix[k].v); return o; }, {});
    script.audio = [];
    if (only.part === 'loops' || only.loop) script.audio = (await loopAudio(P, all.places)).filter(a => !only.loop || a.loop === only.loop);
    if (only.track !== undefined) script.audio = await recordedAudio(P, { only: only.track, noCache: lowMem(P) });
    script.total = all.total;
  } else {
    script.audio = [];
    if (opts.loops !== false) script.audio = script.audio.concat(await loopAudio(P, A.places));
    if (opts.tracks !== false && opts.melody !== false && !lowMem(P)) script.audio = script.audio.concat(await recordedAudio(P));
  }
  const out = await Snd.render(script, { inst: () => Snd.backingInst() });
  if (!only && opts.tracks !== false && opts.melody !== false && lowMem(P)) await mixTracksInto(P, out);
  return out;
}
/* memory saver: each recorded track is processed, mixed into the song and let go before the next one */
async function mixTracksInto(P, out) {
  const spb = 60 / P.bpm, t0 = 0.05;
  for (const r of recordedTracks(P)) {
    if (!audible(P, r.T)) continue;
    let one = await recordedAudio(P, { only: r.id, noCache: true }).catch(() => []);
    if (!one.length) continue;
    const a = one[0], c = new OfflineAudioContext(2, out.length, out.sampleRate), src = c.createBufferSource(), g = c.createGain();
    src.buffer = a.buf; g.gain.value = a.gain == null ? 1 : a.gain; src.connect(g);
    if (a.pan && c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.value = a.pan; g.connect(pn); pn.connect(c.destination); } else g.connect(c.destination);
    src.start(t0 + a.at * spb, a.offset || 0); one = null;
    const mixed = await c.startRendering();
    for (let ch = 0; ch < 2; ch++) { const d = out.getChannelData(ch), m = mixed.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] += m[i]; }
  }
}
/* mastering of a rendered song (in the background worker). src is { buf }: the rendered song is let go as soon as
   it has been copied to the worker, and the master comes back as plain channels (no second copy of the song). */
const pcmBuffer = (channels, sr) => ({ numberOfChannels: channels.length, length: channels[0].length, sampleRate: sr, duration: channels[0].length / sr, getChannelData: i => channels[i] });
async function masterBuffer(P, src, target) {
  const t = target || (P.master && P.master.target) || 'stream';
  if (t === 'off') return { buf: src.buf, info: null };
  const sr = src.buf.sampleRate, ch = []; for (let i = 0; i < src.buf.numberOfChannels; i++) ch.push(src.buf.getChannelData(i));
  src.buf = null;
  const r = await VocalFX.masterAsync(ch, sr, { target: t, ceiling: -1 });
  ch.length = 0;
  return { buf: pcmBuffer(r.channels, sr), info: { lufs: r.lufs, tp: r.tp, before: r.before, target: t } };
}
/* save the song: format 'wav' (24-bit) or 'mp3'; mix 'full' | 'backing' | 'guide'; mastered unless master: 'off' */
async function exportSong(P, opts) {
  opts = opts || {};
  const m = await masterBuffer(P, { buf: await renderSong(P, { melody: opts.melody !== false, focus: opts.focus, tracks: opts.tracks }) }, opts.focus ? 'off' : opts.master), meta = songMeta(P);
  const fmtx = opts.format === 'mp3' ? 'mp3' : 'wav';
  let data = null;
  if (fmtx === 'mp3') { data = await encodeMp3(m.buf, opts.kbps || 192, meta); if (!data) return { error: 'mp3' }; }
  else data = encodeWav(m.buf, opts.bits === 16 ? 16 : 24, meta);
  const name = songSlug(P) + (opts.melody === false ? '_backing' : '') + (opts.guide ? '_with-guide' : '') + (opts.focus ? '_' + opts.focus + '-rehearsal' : '') + (m.info ? '_master' : '') + '_' + P.bpm + 'bpm.' + fmtx;
  const seconds = Math.round(m.buf.duration); m.buf = null;
  saveFile(name, fmtx === 'mp3' ? 'audio/mpeg' : 'audio/wav', data);
  return { name, seconds, bytes: data.length, master: m.info };
}
/* ---- release: measure the finished song the way a streaming service will, and make the release files ---- */
function measureChannels(chs, sr) {
  const n = chs[0].length, thr = Math.pow(10, -50 / 20); let pk = 0, clipped = 0, first = -1, last = -1;
  for (let c = 0; c < chs.length; c++) { const d = chs[c];
    for (let i = 0; i < n; i++) { const a = d[i] < 0 ? -d[i] : d[i]; if (a > pk) pk = a; if (a >= 0.999) clipped++; if (a > thr) { if (first < 0 || i < first) first = i; if (i > last) last = i; } } }
  return { seconds: n / sr, rawPeakDb: 20 * Math.log10(Math.max(1e-9, pk)), clipped, headSec: first < 0 ? n / sr : first / sr, tailSec: last < 0 ? 0 : (n - 1 - last) / sr };
}
async function releaseMake(P, keep) {
  let raw = await renderSong(P, { melody: true });
  const sr = raw.sampleRate, ch = []; for (let i = 0; i < raw.numberOfChannels; i++) ch.push(raw.getChannelData(i));
  const f = measureChannels(ch, sr); f.sampleRate = sr; ch.length = 0;
  const src = { buf: raw }; raw = null;
  const m = await masterBuffer(P, src);
  if (m.info) Object.assign(f, { before: m.info.before, lufs: m.info.lufs, tp: m.info.tp, target: m.info.target }); else Object.assign(f, { target: 'off', lufs: 0, tp: -99 });
  if (!keep) { m.buf = null; return { facts: f }; }
  return { facts: f, buf: m.buf };
}
async function releaseCheck(P) { const r = await releaseMake(P, false); return { facts: r.facts, notes: Mastering.releaseNotes(r.facts) }; }
/* one ZIP for a distributor: 16-bit WAV (what DistroKid, TuneCore and CD Baby accept), the MP3, and a note of the numbers */
async function exportRelease(P, onProgress) {
  const name = songSlug(P) + '_release_' + P.bpm + 'bpm.zip';
  const sink = await openSaveSink(name, 'application/zip'); if (!sink) return { canceled: true };
  try {
    if (onProgress) onProgress('Mixing and mastering');
    const r = await releaseMake(P, true), meta = songMeta(P), notes = Mastering.releaseNotes(r.facts), base = songSlug(P);
    const zw = zipWriter(sink), files = [];
    if (onProgress) onProgress('Making the WAV');
    let wav = encodeWav(r.buf, 16, meta); const wf = base + '.wav'; await zw.add(wf, sink.disk ? wav : new Blob([wav]), crc32(wav)); files.push(wf); wav = null;
    if (onProgress) onProgress('Making the MP3');
    let mp3 = null; try { mp3 = await encodeMp3(r.buf, 192, meta); } catch (e) { mp3 = null; }
    if (mp3) { const mf = base + '.mp3'; await zw.add(mf, sink.disk ? mp3 : new Blob([mp3]), crc32(mp3)); files.push(mf); }
    const mark = { ok: '[OK]  ', warn: '[CHECK]', bad: '[FIX]  ' };
    const readme = ['Release files for "' + meta.title + '"' + (meta.artist ? ' by ' + meta.artist : ''),
      'Tempo: ' + P.bpm + ' BPM · Key: ' + P.key, '',
      'Files: ' + files.join(', '), 'The WAV is 16-bit, ' + r.facts.sampleRate + ' Hz, stereo: upload this one to your distributor (DistroKid, TuneCore, CD Baby…). The MP3 is for WhatsApp and sharing.',
      mp3 ? '' : 'The MP3 was not made (the MP3 maker is missing in this copy of the app); use the WAV.', '',
      'What the check found:'].concat(notes.map(x => mark[x.level] + ' ' + x.title + ': ' + x.text)).concat(['', copyrightLine(P), 'Made in Gospel Music Academy.']).filter(x => x !== undefined).join('\r\n');
    await zw.add('README.txt', new TextEncoder().encode(readme));
    await zw.finish();
    const done = await sink.close(true);
    return { name: done.name, bytes: done.bytes, facts: r.facts, notes, mp3: !!mp3 };
  } catch (e) { await sink.close(false).catch(() => {}); throw e; }
}
async function exportSongWav(P, opts) { return exportSong(P, Object.assign({ format: 'wav' }, opts || {})); }
/* every part and track on its own, as 24-bit WAVs of the same length, in one ZIP */
function stemList(P) {
  const A = arrangeSong(Object.assign({}, P, { mixer: undefined }), { melody: true, melInst: Snd.inst() }), has = k => A.events.some(e => !e.click && Snd.partOf(e) === k);
  const out = [];
  ['drums', 'bass', 'chords', 'melody', 'choir'].forEach(k => { if (has(k)) out.push({ name: MIX_PARTS[k], only: { part: k } }); });
  (P.loops || []).forEach(L => out.push({ name: 'Loop - ' + L.name, only: { loop: L.id } }));
  recordedTracks(P).forEach(r => out.push({ name: r.name, only: { track: r.id } }));
  return out;
}
async function exportStems(P, onProgress) {
  const list = stemList(P), name = songSlug(P) + '_stems_' + P.bpm + 'bpm.zip';
  const sink = await openSaveSink(name, 'application/zip');
  if (!sink) return { canceled: true };
  try {
    const zw = zipWriter(sink), names = [];
    for (let i = 0; i < list.length; i++) {
      if (onProgress) onProgress(i, list.length, list[i].name);
      let buf = await renderSong(P, { only: list[i].only });
      let wav = encodeWav(buf, 24, Object.assign(songMeta(P), { title: (P.title || 'Song') + ' - ' + list[i].name })); buf = null;
      const file = String(i + 1).padStart(2, '0') + ' ' + list[i].name.replace(/[\\/:*?"<>|]+/g, '-') + '.wav';
      // each stem is written out (to disk in the desktop app) before the next one is made
      await zw.add(file, sink.disk ? wav : new Blob([wav]), crc32(wav)); wav = null; names.push(file);
    }
    const meta = songMeta(P), readme = ['Stems of "' + meta.title + '"' + (meta.artist ? ' by ' + meta.artist : ''), 'Tempo: ' + P.bpm + ' BPM · Key: ' + P.key + ' · Time: ' + METERS[P.ts].label,
      'Every file starts at bar 1 (0.05 s of silence before the first beat) and all files are the same length: line them up at the start.',
      'Format: WAV, 24-bit, 44.1 kHz, stereo. Volumes and left-right places are as in the Song Lab mixer; no mastering.', 'Files: ' + names.join(', '), copyrightLine(P), 'Made in Gospel Music Academy.'].filter(Boolean).join('\r\n');
    await zw.add('README.txt', new TextEncoder().encode(readme));
    await zw.finish();
    const done = await sink.close(true);
    return { name: done.name, count: list.length, bytes: done.bytes, disk: sink.disk };
  } catch (e) { await sink.close(false).catch(() => {}); throw e; }
}

/* ---- the guide-track store: recorded audio stays on this computer (IndexedDB), not in backups ----
   A guide has up to six takes, each a 24-bit WAV under its own key (the first take of older projects is stored
   under the project id). `buffer(P)` gives the finished guide: the chosen take, with the parts picked from other
   takes joined in (comping), through the vocal chain (P.guide.fx). Results are cached until something changes. */
const MAX_TAKES = 6;
function normTrack(g) {
  if (!Array.isArray(g.takes)) g.takes = [];
  if (!(g.main >= 0 && g.main < g.takes.length)) g.main = Math.max(0, g.takes.length - 1);
  g.comp = g.comp && typeof g.comp === 'object' ? g.comp : {};
  g.fx = g.fx && VocalFX.PRESETS[g.fx.preset] ? g.fx : { preset: 'off', nr: 'preset' };
  if (!g.fx.tune) g.fx.tune = 'off';
  if (g.gain == null) g.gain = 1; if (!g.pan) g.pan = 0;
  // edits that never change the recording itself: parts silenced (mutes) and parts sung again (patches), in seconds of the take
  g.mutes = Array.isArray(g.mutes) ? g.mutes : []; g.patches = Array.isArray(g.patches) ? g.patches : [];
  return g;
}
function guideOf(P) {   // older projects: one take stored under the project id
  const g = P.guide; if (!g) return null;
  if (!Array.isArray(g.takes) || !g.takes.length) g.takes = [{ k: P.id, at: g.at || Date.now(), dur: g.dur || 0, n: 1 }];
  return normTrack(g);
}
/* ---- multitrack: the guide is the first track (Lead vocal); P.tracks holds the others (harmonies, ad-libs, guitar…).
   Every track has its own takes, comping, vocal sound, volume, place left-right, mute and solo. */
const MAX_TRACKS = 8;
const TRACK_KINDS = { vocal: 'Vocal', instrument: 'Instrument' };
function tracksOf(P) { P.tracks = Array.isArray(P.tracks) ? P.tracks : []; P.tracks.forEach(normTrack); return P.tracks; }
function trackOf(P, id) { return id ? tracksOf(P).find(t => t.id === id) || null : guideOf(P); }
const trackName = (P, T) => (T && T.id ? T.name || 'Track' : 'Lead vocal (guide)');
const takePrefix = (P, T) => (T && T.id ? P.id + ':t' + T.id : P.id);
/* every recorded track with at least one take: [{ id ('' = the guide), T, name }] */
function recordedTracks(P) { const out = []; const g = guideOf(P); if (g && g.takes.length) out.push({ id: '', T: g, name: trackName(P, g) }); tracksOf(P).forEach(T => { if (T.takes.length) out.push({ id: T.id, T, name: trackName(P, T) }); }); return out; }
/* the song's parts in seconds (the same timeline the arrangement plays), for comping */
function guideParts(P) { const A = arrangeSong(P), spb = 60 / P.bpm; return A.timeline.map(t => ({ label: t.label, start: t.start * spb, end: (t.start + t.beats) * spb })); }
const GuideStore = (function () {
  const DB = 'gma-audio', STORE = 'guides', raw = new Map(), done = new Map();
  function open() { return new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
  async function tx(mode, fn) { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(STORE, mode), st = t.objectStore(STORE), q = fn(st); t.oncomplete = () => { db.close(); res(q && q.result); }; t.onerror = () => { db.close(); rej(t.error); }; }); }
  async function decode(k) {
    if (raw.has(k)) return raw.get(k);
    const blob = await tx('readonly', st => st.get(k)); if (!blob) return null;
    const c = Snd.ensure(); if (!c) return null;
    const b = await c.decodeAudioData(await blob.arrayBuffer()); raw.set(k, b); return b;
  }
  /* gentle pitch correction settings for a track (null = off): how much, and to which notes */
  const TUNE_AMOUNT = { gentle: 0.5, medium: 0.75, full: 1 };
  const tuneOf = (P, g) => { const a = TUNE_AMOUNT[g.fx && g.fx.tune]; if (!a || typeof PitchFix === 'undefined') return null; return { amount: a, pcs: g.fx.tuneScale === 'any' ? null : PitchFix.scalePcs(P.key, false) }; };
  const sig = (P, g) => JSON.stringify([g.takes.map(t => t.k), g.main, g.comp, g.fx, P.bpm, P.ts, (P.form || []).length, GuideStore.profileStamp, g.mutes, g.patches, P.key]);
  const pending = new Map(), pk = new Map();   // pending: recordings to remove when you leave the song; pk: pictures of the sound
  return {
    profileStamp: 0,
    hold: false,   // true while a song is open: deleted recordings are kept until you leave, so Undo can bring them back
    async put(id, blob) { raw.delete(id); done.clear(); pending.delete(id); return tx('readwrite', st => st.put(blob, id)); },
    async get(id) { return tx('readonly', st => st.get(id)); },
    async del(id) { raw.delete(id); done.clear(); if (this.hold) { pending.set(id, 1); return; } return tx('readwrite', st => st.delete(id)); },
    /* when you leave a song: remove the recordings of this song that nothing points to any more (deleted takes, takes
       that Undo took away, patches that were removed). Returns how many were removed. */
    async purge(P) {
      if (!P || !P.id) return 0;
      const keys = (await tx('readonly', st => st.getAllKeys()).catch(() => [])) || [], ref = new Set(projectAudioKeys(P));
      const mine = keys.filter(k => typeof k === 'string' && (k === P.id || k.indexOf(P.id + ':') === 0 || k.indexOf('loop:' + P.id + ':') === 0) && !ref.has(k));
      for (const k of mine) { raw.delete(k); await tx('readwrite', st => st.delete(k)).catch(() => {}); }
      pending.clear(); return mine.length;
    },
    takeBuffer: decode,
    /* the finished guide; opts.raw = the chosen take only, no comping or processing */
    async buffer(P, opts) { return this.trackBuffer(P, guideOf(P), opts); },
    /* the chosen take with the best parts joined (comping), the re-recorded parts put in (patches) and the silenced
       parts removed (mutes): { pcm, sr }, not yet through the vocal chain. The recordings themselves are not changed. */
    async editedPcm(P, g, bufs) {
      // only the takes that are used (the main one and the ones picked in comping) are read: a long take is large in memory
      const need = new Set([g.main].concat(Object.keys(g.comp || {}).map(k => g.comp[k])));
      bufs = bufs || await Promise.all(g.takes.map((t, i) => (need.has(i) ? decode(t.k).catch(() => null) : null)));
      if (!bufs[g.main]) return null;
      const sr = bufs[g.main].sampleRate;
      let pcm = bufs[g.main].getChannelData(0);
      const picks = Object.keys(g.comp).length ? guideParts(P).map((p, i) => (g.comp[i] >= 0 && g.comp[i] < bufs.length && bufs[g.comp[i]] ? g.comp[i] : -1)) : [];
      if (picks.some(x => x >= 0)) pcm = VocalFX.comp(bufs.map(b => (b ? b.getChannelData(0) : new Float32Array(0))), g.main, guideParts(P), picks, sr);
      if ((g.patches && g.patches.length) || (g.mutes && g.mutes.length)) {
        const patches = [];
        for (const p of g.patches || []) { const b = await decode(p.k).catch(() => null); if (b) patches.push({ a: p.a, b: p.b, t0: p.t0, fade: p.fade, pcm: b.getChannelData(0) }); }
        pcm = VocalFX.applyEdits(pcm, sr, { patches, mutes: g.mutes || [] });
      }
      return { pcm, sr };
    },
    /* a picture of the finished-but-unprocessed track for the timeline: { peaks (min,max pairs, 100 per second), dur } */
    async peaks(P, g) {
      if (!g || !g.takes || !g.takes.length) return null;
      const key = P.id + ':' + (g.id || '') + sig(P, g);
      if (pk.has(key)) return pk.get(key);
      const E = await this.editedPcm(P, g); if (!E) return null;
      const r = { peaks: VocalFX.peaks(E.pcm, E.sr, 100), dur: E.pcm.length / E.sr };
      g.takes.forEach(t => raw.delete(t.k)); (g.patches || []).forEach(p => raw.delete(p.k));
      pk.set(key, r); if (pk.size > 40) pk.delete(pk.keys().next().value);
      return r;
    },
    async trackBuffer(P, g, opts) {
      if (!g || !g.takes || !g.takes.length) return null;
      opts = opts || {};
      if (opts.raw) return decode(g.takes[g.main].k);
      const key = P.id + ':' + (g.id || '') + sig(P, g) + (opts.light ? '#light' : '');
      if (done.has(key)) return done.get(key);
      const E = await this.editedPcm(P, g);
      if (!E) return null;
      const sr = E.sr, c = Snd.ensure(), pcm = E.pcm;
      let out;
      // memory saver: the takes joined (comped) but not processed, mono; the vocal sound is added while it plays
      const tune = tuneOf(P, g);
      if (opts.light) { const lp = tune ? await VocalFX.chainAsync(pcm, sr, 'off', { tune }) : pcm; out = c.createBuffer(1, lp.length, sr); out.getChannelData(0).set(lp); g.takes.forEach(t => raw.delete(t.k)); (g.patches || []).forEach(p => raw.delete(p.k)); if (!opts.noCache) done.set(key, out); return out; }
      if (g.fx.preset && g.fx.preset !== 'off') {
        const nr = VocalFX.NR_LEVELS[g.fx.nr], prof = await this.profile().catch(() => null);
        const y = await VocalFX.chainAsync(pcm, sr, g.fx.preset, { nr: nr === null || nr === undefined ? undefined : nr, profile: prof && prof.sr === sr ? prof : null, tune });
        const r = await VocalFX.withRoom(y, sr, g.fx.reverb === false ? 'off' : g.fx.preset);
        out = c.createBuffer(r.channels.length, r.channels[0].length, sr); r.channels.forEach((d, i) => out.getChannelData(i).set(d));
      } else { const y = tune ? await VocalFX.chainAsync(pcm, sr, 'off', { tune }) : pcm; out = c.createBuffer(1, y.length, sr); out.getChannelData(0).set(y); }
      // the unprocessed takes are not needed any more (they are read again from storage if wanted)
      g.takes.forEach(t => raw.delete(t.k)); (g.patches || []).forEach(p => raw.delete(p.k));
      [...done.keys()].filter(k => k.startsWith(P.id + ':' + (g.id || '') + '[')).forEach(k => done.delete(k));
      if (!opts.noCache) done.set(key, out);
      return out;
    },
    /* let go of everything held in memory for a song (when you leave it) */
    forget(pid) { [...raw.keys()].filter(k => k.indexOf(pid) === 0).forEach(k => raw.delete(k)); [...done.keys()].filter(k => k.indexOf(pid + ':') === 0).forEach(k => done.delete(k)); },
    /* what is held in memory now, in MB (for the memory saver and the tests) */
    heldMB() { let b = 0; const add = x => { if (x) b += x.length * x.numberOfChannels * 4; }; raw.forEach(add); done.forEach(add); return Math.round(b / 1048576); },
    /* the room's noise, measured by the level check (kept on this computer) */
    async saveProfile(p) { this.profileStamp = Date.now(); done.clear(); return tx('readwrite', st => st.put({ sr: p.sr, bins: Array.from(p.bins), at: Date.now() }, 'noise-profile')); },
    async profile() { const p = await tx('readonly', st => st.get('noise-profile')); return p && p.bins ? { sr: p.sr, bins: Float32Array.from(p.bins), at: p.at } : null; },
    invalidate() { done.clear(); pk.clear(); }
  };
})();
/* every recording a song still points to (takes, re-recorded parts, loops): the rest can be removed (GuideStore.purge) */
function projectAudioKeys(P) {
  const keys = [], add = T => { if (!T) return; (T.takes || []).forEach(t => keys.push(t.k)); (T.patches || []).forEach(p => keys.push(p.k)); };
  add(P.guide); (P.tracks || []).forEach(add);
  (P.loops || []).forEach(L => { if (L && L.kind !== 'midi') keys.push(loopKey(P, L)); });
  return keys;
}

/* ---- recording from the microphone, sample-exact on the audio clock ----
   Music settings: echo cancellation, noise suppression and automatic gain are OFF. (Echo cancellation treats
   singing over the backing as an echo and chops or mutes the voice.) Headphones keep the backing out of the
   recording. Takes are kept as 24-bit WAV at the sound card's own rate (usually 48 kHz): lossless, nothing thrown
   away before the vocal chain. The microphone's timing (measured with Line up the timing) is removed. */
const GUIDE_SILENT = 0.004;                 // a take quieter than this (peak) means the microphone heard nothing
function guidePeak(pcm) { let p = 0; for (let i = 0; i < pcm.length; i++) { const v = Math.abs(pcm[i]); if (v > p) p = v; } return p; }
/* bring a take up (or down) so its loudest moment sits at 0.9, never boosting more than 12x (to keep hiss low) */
function guideNormalize(pcm) {
  const peak = guidePeak(pcm); if (peak < 1e-6) return { pcm, peak, gain: 1 };
  const gain = Math.min(12, 0.9 / peak); if (Math.abs(gain - 1) > 0.02) for (let i = 0; i < pcm.length; i++) pcm[i] *= gain;
  return { pcm, peak, gain };
}
async function listMics() {
  try { const d = await navigator.mediaDevices.enumerateDevices(); return d.filter(x => x.kind === 'audioinput'); } catch (e) { return []; }
}
function micConstraints(deviceId, stereo) {
  // a stereo request lets us pick input 1 or input 2 of an audio interface ourselves
  const a = { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: stereo ? { ideal: 2 } : 1, sampleRate: { ideal: 48000 }, sampleSize: { ideal: 24 }, latency: { ideal: 0.01 } };
  if (deviceId) a.deviceId = { exact: deviceId };
  return { audio: a };
}
async function openMic(deviceId, stereo) {
  try { return await navigator.mediaDevices.getUserMedia(micConstraints(deviceId, stereo)); }
  catch (e) { if (deviceId) return navigator.mediaDevices.getUserMedia(micConstraints(null, stereo)); throw e; }   // the chosen microphone was unplugged: use the default one
}
/* which input of the device is used: auto (what the device gives), 1, 2, or both mixed. An audio interface with two
   inputs can then be used with the microphone in either socket. */
const MIC_CHANNELS = { auto: 'Automatic (recommended)', '1': 'Input 1 (left)', '2': 'Input 2 (right)', mix: 'Both inputs mixed' };
const micChannel = () => (MIC_CHANNELS[S.prefs.micChannel] ? S.prefs.micChannel : 'auto');
const MIC_HELP = 'Check that the microphone is plugged in and chosen above, and in Windows: Settings > Privacy & security > Microphone, turn on "Let desktop apps access your microphone". Also check Settings > System > Sound > Input that the right microphone is selected and its volume is up.';
/* the microphone's delay (seconds) for this microphone and these headphones or speakers: measured by Line up the timing
   (kept for each pair, so an audio interface has its own number), else the last measurement, else the keyboard timing */
const micPair = deviceId => (deviceId || 'default') + '>' + (S.prefs.outId || 'default');
function micLatInfo(deviceId) {
  const by = S.prefs.micLatencyById && S.prefs.micLatencyById[micPair(deviceId)];
  if (by !== undefined) return { ms: by, measured: true, own: true };
  if (S.prefs.micLatencyMs !== undefined) return { ms: S.prefs.micLatencyMs, measured: true, own: false };
  return { ms: S.prefs.latencyMs || 0, measured: false, own: false };
}
const micLat = deviceId => micLatInfo(deviceId).ms / 1000;
/* capture: calls onBlock(Float32Array, timeOnAudioClock) for each block; optional live monitor chain */
async function captureMic(deviceId, onBlock, opts) {
  opts = opts || {};
  const mode = opts.channel || micChannel(), stereo = mode !== 'auto';
  const stream = await openMic(deviceId, stereo), c = Snd.ensure(), sr = c.sampleRate;
  const src = c.createMediaStreamSource(stream), node = c.createScriptProcessor(2048, stereo ? 2 : 1, 1);
  node.onaudioprocess = e => {
    const nCh = e.inputBuffer.numberOfChannels; let d;
    if (mode === 'mix' && nCh > 1) { const L = e.inputBuffer.getChannelData(0), R = e.inputBuffer.getChannelData(1); d = new Float32Array(L.length); for (let i = 0; i < d.length; i++) d[i] = (L[i] + R[i]) / 2; }
    else d = new Float32Array(e.inputBuffer.getChannelData(mode === '2' ? Math.min(1, nCh - 1) : 0));
    onBlock(d, e.playbackTime - e.inputBuffer.length / sr); e.outputBuffer.getChannelData(0).fill(0);
  };
  const silent = c.createGain(); silent.gain.value = 0; src.connect(node); node.connect(silent); silent.connect(c.destination);
  let mon = null;
  if (opts.monitor) { mon = VocalFX.liveChain(c, opts.monitor); src.connect(mon.input); mon.output.connect(Snd.dryBus()); }
  const track = stream.getAudioTracks()[0] || {}, st = track.getSettings ? track.getSettings() : {};
  return {
    sr, label: track.label || '', settings: { sampleRate: st.sampleRate || sr, channels: st.channelCount || 1, deviceId: st.deviceId || '' },
    stop() { try { node.disconnect(); src.disconnect(); if (mon) mon.output.disconnect(); } catch (e) { /* ignore */ } stream.getTracks().forEach(t => t.stop()); }
  };
}
/* the song from a beat onward (for punch-in and "hear this part"): events and clips move earlier by `from` beats; a
   note or clip that is already sounding at that moment carries on from there. `to` (a beat) ends it early. */
function scriptFrom(script, from, to) {
  const spb = 60 / script.bpm, end = to === undefined ? script.total : Math.min(script.total, to), out = Object.assign({}, script);
  out.events = script.events.filter(e => e.t < end && (e.t >= from || e.t + (e.d || 0) > from)).map(e => {
    const o = Object.assign({}, e), t = Math.max(e.t, from); o.t = t - from;
    if (e.d !== undefined) o.d = Math.max(0.01, Math.min(e.t + e.d, end) - t);
    return o;
  });
  out.audio = (script.audio || []).map(a => {
    let at = a.at - from, offset = a.offset || 0, dur = a.dur;
    if (at < 0) { offset += -at * spb; dur += at; at = 0; }
    if (at + dur > end - from) dur = end - from - at;
    return Object.assign({}, a, { at, offset, dur });
  }).filter(a => a.dur > 0.01);
  out.total = Math.max(0.5, end - from);
  out.fade = script.fade && to === undefined ? { from: script.fade.from - from, to: script.fade.to - from } : null;
  return out;
}
/* put bars of clicks in front of a script: everything moves later and the clicks fill the gap */
function withCountIn(script, beats, bpb) {
  const out = Object.assign({}, script);
  out.events = script.events.map(e => Object.assign({}, e, { t: e.t + beats })).concat(Array.from({ length: beats }, (_, i) => ({ t: i, d: 0.2, click: i % bpb === 0 ? 2 : 1 })));
  out.audio = (script.audio || []).map(a => Object.assign({}, a, { at: a.at + beats }));
  out.total = script.total + beats;
  out.fade = script.fade ? { from: script.fade.from + beats, to: script.fade.to + beats } : null;
  return out;
}
/* take the part a..b (seconds) out of a list of ranges: [{a,b}] */
function subtractRange(list, a, b) {
  const out = []; list.forEach(r => { if (r.b <= a || r.a >= b) { out.push(r); return; } if (r.a < a) out.push(Object.assign({}, r, { b: a })); if (r.b > b) out.push(Object.assign({}, r, { a: b })); });
  return out;
}
/* add a range to a list, joining ranges that touch or overlap */
function addRange(list, a, b) {
  const all = list.concat([{ a, b }]).sort((x, y) => x.a - y.a), out = [];
  all.forEach(r => { const l = out[out.length - 1]; if (l && r.a <= l.b + 0.001) l.b = Math.max(l.b, r.b); else out.push({ a: r.a, b: r.b }); });
  return out;
}
const MAX_PATCHES = 24;
const nextTakeNumber = g => Math.max(0, ...g.takes.map(t => t.n || 0), ...(g.patches || []).map(p => p.n || 0)) + 1;
/* is there room on this computer for another recording? (MB free, or null when the system does not say) */
async function storageRoomMB() {
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); if (e && e.quota) return Math.round((e.quota - (e.usage || 0)) / 1048576); } } catch (e) { /* unknown */ }
  return null;
}
/* ask the system to keep the recordings (it may otherwise clear them when the disk is nearly full) */
function keepStorage() { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* ignore */ } }
function startGuideRecording(P, onState, opts) {
  opts = opts || {};
  const target = opts.trackId ? trackOf(P, opts.trackId) : null, punch = opts.punch || null;
  let cap = null, chunks = [], firstAt = null, songStart = null, handle = null, stopped = false, sr = 48000, maxPeak = 0, fromBeat = 0;
  const finish = async () => {
    if (stopped) return; stopped = true;
    if (cap) cap.stop();
    if (handle) handle.stop();
    if (!chunks.length || songStart === null) { onState({ state: 'empty' }); return; }
    if (maxPeak < GUIDE_SILENT) { onState({ state: 'silent', msg: 'The microphone did not pick up any sound, so nothing was saved' + ((target ? target.takes.length : P.guide) ? ' (your earlier takes are kept)' : '') + '. ' + MIC_HELP }); return; }
    const total = chunks.reduce((a, c) => a + c.length, 0), all = new Float32Array(total); let o = 0; chunks.forEach(c => { all.set(c, o); o += c.length; });
    const shift = Math.round((songStart - firstAt + micLat(opts.deviceId)) * sr);
    let pcm;
    if (shift >= 0) pcm = all.slice(Math.min(shift, all.length));
    else { pcm = new Float32Array(all.length - shift); pcm.set(all, -shift); }   // the microphone started late: pad the start with silence
    const g = target || guideOf(P) || { at: Date.now(), dur: 0, gain: 1, nudgeMs: 0, takes: [], main: 0, comp: {}, fx: { preset: 'worship', nr: 'preset' } };
    normTrack(g);
    if (punch) {
      // punch-in: only the chosen part is kept; it is stored as a patch that is put over the take (the take is not changed)
      if (!g.takes.length) { onState({ state: 'error', msg: 'There is no recording to fix yet.' }); return; }
      const spb = 60 / P.bpm, startSec = fromBeat * spb, nudge = (g.nudgeMs || 0) / 1000, m = 0.02;
      const s0 = Math.max(0, Math.round((punch.a + nudge - m - startSec) * sr)), s1 = Math.min(pcm.length, Math.round((punch.b + nudge + m - startSec) * sr));
      if (s1 - s0 < sr * 0.05) { onState({ state: 'empty' }); return; }
      const clip = pcm.slice(s0, s1), t0 = s0 / sr + startSec - nudge;
      const base = await GuideStore.editedPcm(P, g).catch(() => null), gain = base ? VocalFX.matchGain(base.pcm, clip, sr, punch.a, punch.b) : 1, pk = guidePeak(clip) * gain;
      const k2 = gain * (pk > 0.98 ? 0.98 / pk : 1); for (let i = 0; i < clip.length; i++) clip[i] *= k2;
      const num = nextTakeNumber(g), key = takePrefix(P, g) + ':' + num;
      await GuideStore.put(key, new Blob([encodeWav({ length: clip.length, sampleRate: sr, numberOfChannels: 1, getChannelData: () => clip }, 24)], { type: 'audio/wav' }));
      g.mutes = subtractRange(g.mutes, punch.a, punch.b);   // a part that was silenced is sung again: it is no longer silent
      g.patches.push({ k: key, n: num, a: punch.a, b: punch.b, t0, fade: m });
      if (!target) P.guide = g;
      P.recAt = Date.now(); GuideStore.invalidate(); touch();
      onState({ state: 'saved', punch: true, seconds: Math.round((punch.b - punch.a) * 10) / 10, take: num });
      return;
    }
    const n = guideNormalize(pcm);
    const tmp = { length: pcm.length, sampleRate: sr, numberOfChannels: 1, getChannelData: () => pcm };
    const blob = new Blob([encodeWav(tmp, 24)], { type: 'audio/wav' });
    // the take is stored first; the project only points to it once it is safely saved
    const num = nextTakeNumber(g), k = takePrefix(P, g) + ':' + num;
    await GuideStore.put(k, blob);
    if (!target) P.guide = g;
    g.takes.push({ k, at: Date.now(), dur: Math.round(pcm.length / sr), n: num });
    while (g.takes.length > MAX_TAKES) { const old = g.takes.shift(); GuideStore.del(old.k).catch(() => {}); g.comp = {}; }   // the oldest take goes
    // a new full take starts clean: the parts silenced or sung again on the old take are put away (Undo brings them back)
    const cleared = (g.mutes || []).length + (g.patches || []).length; g.mutes = []; g.patches = [];
    g.main = g.takes.length - 1; g.at = Date.now(); g.dur = Math.round(pcm.length / sr);
    P.recAt = Date.now(); GuideStore.invalidate(); touch();
    onState({ state: 'saved', seconds: g.dur, quiet: n.peak < 0.05, boost: n.gain, take: num, cleared });
  };
  (async () => {
    keepStorage();
    try {
      cap = await captureMic(opts.deviceId, (d, at) => {
        if (stopped) return;
        if (firstAt === null) firstAt = at;
        chunks.push(d);
        const pk = guidePeak(d); if (pk > maxPeak) maxPeak = pk;
        onState({ state: 'level', peak: pk });
      }, { monitor: opts.monitor, channel: opts.channel });
    } catch (e) { stopped = true; onState({ state: 'error', msg: 'The microphone could not be opened. ' + MIC_HELP }); return; }
    sr = cap.sr;
    const A = arrangeSong(P, { melInst: Snd.inst() });
    // overdubbing: the loops and the tracks already recorded play along (all but the one being recorded)
    A.script.audio = (await loopAudio(P, A.places).catch(() => [])).concat(await recordedAudio(P, { exclude: target || guideOf(P), live: true }).catch(() => []));
    if (stopped) return;
    let script = A.script;
    if (punch) {
      // start a bar or two before the part (so the singer hears the groove come in), stop just after it
      const spb = 60 / P.bpm, nudge = ((target || guideOf(P) || {}).nudgeMs || 0) / 1000, bar = METERS[P.ts].bar;
      fromBeat = Math.max(0, Math.floor((punch.a + nudge) / spb / bar) * bar - bar);
      script = scriptFrom(A.script, fromBeat, (punch.b + nudge + 0.4) / spb);
    }
    onState({ state: 'recording', label: cap.label, settings: cap.settings, punch: !!punch });
    handle = Snd.play(script, { force: true, inst: () => Snd.backingInst(), onStart: t => { songStart = t; onState({ state: 'started', start: t, fromBeat }); }, onEnd: () => finish() });
  })();
  return { stop: finish };
}
/* ---- the level and room check: two seconds of quiet (the room's noise, also learned for noise reduction), then
   six seconds of the loudest line of the song. onState({ phase: 'quiet'|'sing'|'done'|'error', level, advice }) */
function levelCheck(deviceId, onState) {
  let cap = null, phase = 'quiet', quiet = [], sung = [], t0 = null, stopped = false;
  const end = async () => {
    if (stopped) return; stopped = true; if (cap) cap.stop();
    const cat = list => { const n = list.reduce((a, c) => a + c.length, 0), o = new Float32Array(n); let k = 0; list.forEach(c => { o.set(c, k); k += c.length; }); return o; };
    const q = cat(quiet), s = cat(sung); if (!s.length || !q.length) { onState({ phase: 'error', msg: 'Nothing was recorded. ' + MIC_HELP }); return; }
    const qq = q.slice(Math.floor(q.length * 0.25));    // skip the first moment (a click from the microphone opening)
    const m = VocalFX.measure(s), noiseDb = VocalFX.dB(VocalFX.rmsOf(qq));
    const advice = VocalFX.levelAdvice({ noiseDb, peakDb: m.peakDb, rmsDb: m.rmsDb, clipped: m.clipped });
    await GuideStore.saveProfile(VocalFX.noiseProfile(qq, cap.sr, true)).catch(() => {});
    S.prefs.micCheck = { at: Date.now(), noiseDb: Math.round(noiseDb), peakDb: Math.round(m.peakDb * 10) / 10, level: advice.level, ok: advice.ok }; touch();
    onState({ phase: 'done', advice, noiseDb, peakDb: m.peakDb, rmsDb: m.rmsDb });
  };
  (async () => {
    try {
      cap = await captureMic(deviceId, (d, at) => {
        if (stopped) return;
        if (t0 === null) t0 = at;
        const el = at - t0;
        if (el < 2.2) { quiet.push(d); if (phase !== 'quiet') { phase = 'quiet'; } }
        else if (el < 8.4) { sung.push(d); if (phase !== 'sing') { phase = 'sing'; onState({ phase: 'sing' }); } }
        else end();
        onState({ phase: 'level', peak: guidePeak(d), left: Math.max(0, Math.ceil((el < 2.2 ? 2.2 : 8.4) - el)) });
      });
      onState({ phase: 'quiet' });
    } catch (e) { stopped = true; onState({ phase: 'error', msg: 'The microphone could not be opened. ' + MIC_HELP }); }
  })();
  return { stop: () => { stopped = true; if (cap) cap.stop(); } };
}
/* ---- line up the timing: eight clicks through the speakers, heard by the microphone. The delay between sending
   a click and hearing it is the whole round trip (the speaker's delay plus the microphone's), which is exactly how
   late a voice recorded over the song arrives. With headphones the microphone cannot hear the clicks, so then the
   singer claps along instead. */
function calibrateMic(deviceId, mode, onState) {
  let cap = null, chunks = [], t0 = null, stopped = false, clicks = [];
  (async () => {
    try { cap = await captureMic(deviceId, (d, at) => { if (stopped) return; if (t0 === null) t0 = at; chunks.push(d); }); }
    catch (e) { onState({ state: 'error', msg: 'The microphone could not be opened. ' + MIC_HELP }); return; }
    const c = Snd.ensure(), start = c.currentTime + 0.6, gap = mode === 'clap' ? 0.75 : 0.5, count = 8;
    for (let i = 0; i < count; i++) {
      const t = start + i * gap; clicks.push(t);
      const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 1500; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.9, t + 0.001); g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      o.connect(g); g.connect(Snd.dryBus()); o.start(t); o.stop(t + 0.05);
    }
    onState({ state: 'listening' });
    setTimeout(() => {
      stopped = true; cap.stop();
      const n = chunks.reduce((a, x) => a + x.length, 0), pcm = new Float32Array(n); let k = 0; chunks.forEach(x => { pcm.set(x, k); k += x.length; });
      const r = VocalFX.clickLatency(pcm, cap.sr, t0, clicks, mode === 'clap' ? { min: -0.25, max: 0.4 } : {});
      if (!r) { onState({ state: 'unheard' }); return; }
      if (mode !== 'clap' && r.spread > 0.004) { onState({ state: 'unsteady' }); return; }
      S.prefs.micLatencyMs = Math.round(r.latency * 1000);
      S.prefs.micLatencyById = S.prefs.micLatencyById || {}; S.prefs.micLatencyById[micPair(deviceId)] = S.prefs.micLatencyMs;   // each microphone and speakers pair keeps its own number
      touch();
      onState({ state: 'done', ms: S.prefs.micLatencyMs, heard: r.heard, mode });
    }, (0.6 + count * gap + 0.8) * 1000);
  })();
  return { stop() { stopped = true; if (cap) cap.stop(); } };
}
/* a short microphone check: shows the level for a few seconds, records nothing */
function testMic(deviceId, onLevel, ms) {
  let cap = null, done = false, peakAll = 0, timer = null;
  const stop = () => { if (done) return; done = true; clearTimeout(timer); if (cap) cap.stop(); onLevel(null, peakAll); };
  (async () => {
    try { cap = await captureMic(deviceId, d => { if (done) return; const p = guidePeak(d); if (p > peakAll) peakAll = p; onLevel(p, peakAll); }); }
    catch (e) { done = true; onLevel(-1, 0); return; }
    if (done) { cap.stop(); return; }
    timer = setTimeout(stop, ms || 5000);
  })();
  return { stop };
}
