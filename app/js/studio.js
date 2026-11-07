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
const BASS_STYLES = { root: 'Root, held', rootfifth: 'Root and fifth', octaves: 'Octaves', walking: 'Walking (4/4 only)', gospel: 'Gospel (approach notes into each chord)', pump: 'Octave pump (shout and praise)', makossa: 'Makossa (syncopated)' };
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
function formItem(i) {
  return { s: i.s, up: Math.max(-6, Math.min(11, Math.round(+i.up || 0))), x: Math.max(1, Math.min(8, Math.round(+i.x || 1))), tag: Math.max(0, Math.min(8, Math.round(+i.tag || 0))),
    stop: i.stop === true, vamp: i.vamp === true, en: ['soft', 'full'].includes(i.en) ? i.en : '', lead: i.lead !== false, fill: i.fill === true, swell: i.swell === true };
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
  return ev.filter(e => e.t < beats - 0.001 && !(light && (e.drum === 's' || e.drum === 'cl'))).map(e => Object.assign({}, e, { vel: (e.vel || 0.6) * (0.55 + 0.45 * energy) }));
}
const DRUM_MIDI = { k: 36, s: 38, h: 42, o: 46, r: 37, cl: 39, c: 49, th: 50, tm: 47, tl: 43, sw: 52 };

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
  sc.chs.forEach((ch, i) => {
    bassEvents(sc.voiced[i], sc.voiced[i], sc.voiced[i + 1] || null, ch.t, ch.d, P.bassStyle || 'root', meter, vel * bk).filter(keep).map(trim).forEach(e => { e.part = 'bass'; events.push(e); e.notes.forEach(m => parts.bass.push({ t: e.t, d: e.d, m, v: Math.round(Math.min(1, e.vel) * 110) })); });
  });
  if (o.stop && !sc.chs.some(ch => Math.abs(ch.t - lastBar) < 1e-6)) {   // the band hits beat 1 of the last bar together
    const i = chordAtBeat(sc, lastBar), v = sc.voiced[i];
    events.push({ t: lastBar, d: 0.6, notes: v.rh, vel }); events.push({ t: lastBar, d: 0.6, notes: [v.bass], vel, part: 'bass' });
    v.rh.forEach(m => parts.chords.push({ t: lastBar, d: 0.6, m, v: 90 })); parts.bass.push({ t: lastBar, d: 0.6, m: v.bass, v: 90 });
  }
  let dr = drumEvents(P, beats, energy);
  if (dr.length) {
    if (energy >= 0.9 && !o.tagPass) dr.push({ t: 0, d: 0.1, drum: 'c', vel: 0.7 });
    sc.chs.forEach((ch, i) => { if (ch.spec.push && i > 0) { dr = dr.filter(e => Math.abs(e.t - ch.t) > 0.01 || e.drum === 'h'); dr.push({ t: ch.t, d: 0.1, drum: 'k', vel: 0.85 }); if (energy >= 0.8) dr.push({ t: ch.t, d: 0.1, drum: 'c', vel: 0.6 }); } });
    if (o.stop) { dr = dr.filter(e => e.t < lastBar - 1e-6); dr.push({ t: lastBar, d: 0.1, drum: 'k', vel: 0.95 }, { t: lastBar, d: 0.1, drum: 'c', vel: 0.8 }); }
    else if (o.fill) { const f = fillEvents(beats, meter.bar, energy); dr = dr.filter(e => e.t < f.from - 1e-6 || e.drum === 'h' && false).concat(f.ev); }
    if (o.crashIn && !dr.some(e => e.drum === 'c' && e.t < 0.01)) dr.push({ t: 0, d: 0.1, drum: 'c', vel: 0.75 });
    dr.forEach(e => { e.vel *= bk; events.push(e); parts.drums.push({ t: e.t, d: 0.25, m: DRUM_MIDI[e.drum] || 38, v: Math.round(40 + Math.min(1, e.vel) * 80) }); });
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
    a.events.forEach(e => events.push(Object.assign({}, e, { t: e.t + at })));
    Object.keys(parts).forEach(k => a.parts[k].forEach(n => parts[k].push(Object.assign({}, n, { t: n.t + at }))));
    at += a.beats;
  };
  let crashIn = false;
  form.forEach((it, idx) => {
    const next = form[idx + 1], sec = P.sections[it.s], energy = ENERGY_SET[it.en] || ENERGY[it.s] || 0.8;
    const base = { shift: it.up, energy, melody: o.melody, melInst: o.melInst, choir: o.choir !== undefined ? o.choir : !!(P.choir && P.choir.on), focus: o.focus };
    const touches = last => ({ fill: last && it.fill && !it.stop, swell: last && it.swell && !it.stop });
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
    crashIn = !!it.fill;
  });
  // the ending
  const endKind = ENDINGS[P.ending] ? P.ending : 'none', bars = meterOf(P).bar;
  let fade = null, rit = null;
  if (endKind === 'hold' && timeline.length) {
    const lastSeg = timeline[timeline.length - 1], ch = lastSeg.chs[lastSeg.chs.length - 1], v = SC.voice(P.key, [ch.spec], form[lastSeg.idx] ? form[lastSeg.idx].up : 0)[0], len = bars * 2;
    events.push({ t: at, d: len, notes: v.rh, vel: 0.7 }, { t: at, d: len, notes: [v.bass], vel: 0.7, part: 'bass' });
    if (P.beat && P.beat !== 'none') events.push({ t: at, d: 0.1, drum: 'c', vel: 0.8 }, { t: at, d: 0.1, drum: 'k', vel: 0.9 });
    v.rh.forEach(m => parts.chords.push({ t: at, d: len, m, v: 80 })); parts.bass.push({ t: at, d: len, m: v.bass, v: 80 });
    timeline.push({ type: lastSeg.type, label: 'Ending (hold)', start: at, beats: len, chs: [Object.assign({}, ch, { t: at, d: len })], key: lastSeg.key, idx: lastSeg.idx });
    markers.push({ t: at, text: 'Ending' });
    at += len;
  } else if (endKind === 'ritard' && at > bars * 2) {
    // the last two bars slow to about 60% of the tempo: every beat after the start of the slowdown is moved later
    const T0 = at - bars * 2, span = bars * 2, slow = 0.67;
    rit = { from: T0, to: at, span, slow };
    const warp = t => (t <= T0 ? t : T0 + (t - T0) + slow * Math.pow(Math.min(t, at) - T0, 2) / (2 * span) + (t > at ? (t - at) * (1 + slow) : 0));
    events.forEach(e => { const a = warp(e.t), b = warp(e.t + (e.d || 0)); e.t = a; if (e.d) e.d = b - a; });
    Object.keys(parts).forEach(k => parts[k].forEach(n => { const a = warp(n.t), b = warp(n.t + n.d); n.t = a; n.d = b - a; }));
    timeline.forEach(sg => { const a = warp(sg.start), b = warp(sg.start + sg.beats); sg.chs.forEach(c => { const ca = warp(c.t), cb = warp(c.t + c.d); c.t = ca; c.d = cb - ca; }); sg.start = a; sg.beats = b - a; });
    at = warp(at); markers.push({ t: warp(T0), text: 'Slowing down' });
  } else if (endKind === 'fade' && at > bars) fade = { from: at - Math.min(bars * 4, at / 2), to: at };   // four bars, or the second half of a very short song
  void bar;
  const segs = timeline.map(t => ({ type: t.type, start: t.start, beats: t.beats, up: form[t.idx] ? form[t.idx].up : 0 }));
  midiLoopEvents(P, segs).forEach(e => { events.push(e); if (e.drum) parts.drums.push({ t: e.t, d: 0.25, m: DRUM_MIDI[e.drum] || 38, v: Math.round(40 + e.vel * 80) }); else (parts.loops = parts.loops || []).push({ t: e.t, d: e.d, m: e.notes[0], v: Math.round(e.vel * 110) }); });
  const evs = mixFilter(P, events), mix = partsMix(P);
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
  return { events: evs, parts, timeline, markers, total: at, bpm: P.bpm, places, ritard: rit, script: { events: evs, bpm: P.bpm, total: at, mix, fade } };
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
async function loopAudio(P, places) {
  const out = [];
  for (const p of places) {
    if (p.tail) { const tb = await ritardTail(P, p).catch(() => null); if (tb) out.push({ buf: tb, at: p.at, dur: tb.duration / (60 / P.bpm), offset: 0, gain: (p.L.gain == null ? 1 : p.L.gain) * (p.mixGain == null ? 1 : p.mixGain), pan: p.pan || 0, loop: p.L.id }); continue; }
    const buf = await loopAt(P, p.L, p.shift).catch(() => null); if (buf) out.push({ buf, at: p.at, dur: p.dur, offset: p.offset, gain: (p.L.gain == null ? 1 : p.L.gain) * (p.mixGain == null ? 1 : p.mixGain), pan: p.pan || 0, loop: p.L.id }); }
  return out;
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
  Object.keys(MIX_PARTS).forEach(k => { const c = m[k] = m[k] || {}; if (c.v == null) c.v = 1; if (!c.pan) c.pan = 0; });
  return m;
}
const anySolo = P => { const m = mixerOf(P); return Object.keys(MIX_PARTS).some(k => m[k].solo) || recordedTracks(P).some(r => r.T.solo); };
const audible = (P, ch) => !ch.mute && (!anySolo(P) || !!ch.solo);
function partsMix(P) { const m = mixerOf(P), out = {}; Object.keys(MIX_PARTS).forEach(k => { out[k] = { v: audible(P, m[k]) ? m[k].v : 0, pan: m[k].pan }; }); return out; }
function mixFilter(P, events) {   // muted parts are not played at all (and not written to the MIDI file)
  const m = mixerOf(P), off = k => !audible(P, m[k]);
  return events.filter(e => { if (e.click) return true; const k = Snd.partOf ? Snd.partOf(e) : 'chords'; return k === 'click' || !off(k); });
}
/* the recorded tracks as audio clips for a script: [{ buf, at, dur, offset, gain, pan }] */
async function recordedAudio(P, o) {
  o = o || {};
  const spb = 60 / P.bpm, out = [], light = o.live && lowMem(P);
  for (const r of recordedTracks(P)) {
    if (o.exclude && r.T === o.exclude) continue;
    if (o.only !== undefined && o.only !== r.id) continue;
    if (o.only === undefined && !audible(P, r.T)) continue;
    const buf = await GuideStore.trackBuffer(P, r.T, { light, noCache: o.noCache }).catch(() => null); if (!buf) continue;
    const nudge = (r.T.nudgeMs || 0) / 1000;
    out.push({ buf, at: nudge > 0 ? nudge / spb : 0, offset: nudge < 0 ? -nudge : 0, dur: buf.duration / spb + 1, gain: r.T.gain == null ? 1 : r.T.gain, pan: r.T.pan || 0, track: r.id,
      chain: light && r.T.fx.preset !== 'off' ? r.T.fx.preset : null, room: r.T.fx.reverb !== false });
  }
  return out;
}

/* ---- arrangement touches: drum fills, swells, endings ---- */
const ENDINGS = { none: 'Stop at the end', hold: 'Hold the last chord (a fermata)', ritard: 'Slow down over the last two bars', fade: 'Fade out over the last four bars' };
/* a drum fill on the last beats of a section: snare and toms rolling down, louder as it goes */
function fillEvents(beats, bar, energy) {
  const ev = [], long = energy >= 0.85 && bar === 4, start = beats - (long ? 2 : 1), step = bar === 4 ? 0.25 : 0.5;
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
    for (const r of recordedTracks(P)) for (const t of r.T.takes) await add(t.k, 'audio/' + t.k.replace(/[^A-Za-z0-9]+/g, '_') + '.wav');
    for (const L of (P.loops || [])) if (L.kind !== 'midi') await add(loopKey(P, L), 'loops/' + L.id + '_' + String(L.name || 'loop').replace(/[^A-Za-z0-9]+/g, '-').slice(0, 30));
    const manifest = { format: PKG_FORMAT, version: 1, app: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '', created: new Date().toISOString(), title: P.title || '', id: P.id, audio, missing };
    const te = new TextEncoder();
    await zw.add('manifest.json', te.encode(JSON.stringify(manifest, null, 1)));
    await zw.add('song.json', te.encode(JSON.stringify(P)));
    await zw.add('README.txt', te.encode('This is a Gospel Music Academy song package: "' + (P.title || 'My song') + '".\r\nOpen it in the app: Song Lab > My song projects > Open a song package.\r\nIt holds the song (chords, melody, words, settings) and ' + audio.length + ' recordings and loops.\r\n' + (copyrightLine(P) || '')));
    await zw.finish();
    const done = await sink.close(true);
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
    (raw.tracks || []).forEach(T => (T.takes || []).forEach(t => { t.k = fix(t.k); }));
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
    script.mix = Object.keys(MIX_PARTS).reduce((o, k) => { o[k] = { v: mix[k].v, pan: mix[k].pan }; return o; }, {});
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
  if (g.gain == null) g.gain = 1; if (!g.pan) g.pan = 0;
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
  const sig = (P, g) => JSON.stringify([g.takes.map(t => t.k), g.main, g.comp, g.fx, P.bpm, P.ts, (P.form || []).length, GuideStore.profileStamp]);
  const done2 = new Map();
  void done2;
  return {
    profileStamp: 0,
    async put(id, blob) { raw.delete(id); done.clear(); return tx('readwrite', st => st.put(blob, id)); },
    async get(id) { return tx('readonly', st => st.get(id)); },
    async del(id) { raw.delete(id); done.clear(); return tx('readwrite', st => st.delete(id)); },
    takeBuffer: decode,
    /* the finished guide; opts.raw = the chosen take only, no comping or processing */
    async buffer(P, opts) { return this.trackBuffer(P, guideOf(P), opts); },
    async trackBuffer(P, g, opts) {
      if (!g || !g.takes || !g.takes.length) return null;
      opts = opts || {};
      if (opts.raw) return decode(g.takes[g.main].k);
      const key = P.id + ':' + (g.id || '') + sig(P, g) + (opts.light ? '#light' : '');
      if (done.has(key)) return done.get(key);
      const bufs = await Promise.all(g.takes.map(t => decode(t.k).catch(() => null)));
      if (!bufs[g.main]) return null;
      const sr = bufs[g.main].sampleRate, c = Snd.ensure();
      let pcm = bufs[g.main].getChannelData(0);
      const picks = Object.keys(g.comp).length ? guideParts(P).map((p, i) => (g.comp[i] >= 0 && g.comp[i] < bufs.length && bufs[g.comp[i]] ? g.comp[i] : -1)) : [];
      if (picks.some(x => x >= 0)) pcm = VocalFX.comp(bufs.map(b => (b ? b.getChannelData(0) : new Float32Array(0))), g.main, guideParts(P), picks, sr);
      let out;
      // memory saver: the takes joined (comped) but not processed, mono; the vocal sound is added while it plays
      if (opts.light) { out = c.createBuffer(1, pcm.length, sr); out.getChannelData(0).set(pcm); g.takes.forEach(t => raw.delete(t.k)); if (!opts.noCache) done.set(key, out); return out; }
      if (g.fx.preset && g.fx.preset !== 'off') {
        const nr = VocalFX.NR_LEVELS[g.fx.nr], prof = await this.profile().catch(() => null);
        const y = await VocalFX.chainAsync(pcm, sr, g.fx.preset, { nr: nr === null || nr === undefined ? undefined : nr, profile: prof && prof.sr === sr ? prof : null });
        const r = await VocalFX.withRoom(y, sr, g.fx.reverb === false ? 'off' : g.fx.preset);
        out = c.createBuffer(r.channels.length, r.channels[0].length, sr); r.channels.forEach((d, i) => out.getChannelData(i).set(d));
      } else { out = c.createBuffer(1, pcm.length, sr); out.getChannelData(0).set(pcm); }
      // the unprocessed takes are not needed any more (they are read again from storage if wanted)
      g.takes.forEach(t => raw.delete(t.k));
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
    invalidate() { done.clear(); }
  };
})();

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
function micConstraints(deviceId) {
  const a = { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1, sampleRate: { ideal: 48000 }, sampleSize: { ideal: 24 } };
  if (deviceId) a.deviceId = { exact: deviceId };
  return { audio: a };
}
async function openMic(deviceId) {
  try { return await navigator.mediaDevices.getUserMedia(micConstraints(deviceId)); }
  catch (e) { if (deviceId) return navigator.mediaDevices.getUserMedia(micConstraints(null)); throw e; }   // the chosen microphone was unplugged: use the default one
}
const MIC_HELP = 'Check that the microphone is plugged in and chosen above, and in Windows: Settings > Privacy & security > Microphone, turn on "Let desktop apps access your microphone". Also check Settings > System > Sound > Input that the right microphone is selected and its volume is up.';
/* the microphone's delay (seconds): measured by Line up the timing, else the keyboard timing calibration */
const micLat = () => (S.prefs.micLatencyMs !== undefined ? S.prefs.micLatencyMs : (S.prefs.latencyMs || 0)) / 1000;
/* capture: calls onBlock(Float32Array, timeOnAudioClock) for each block; optional live monitor chain */
async function captureMic(deviceId, onBlock, opts) {
  opts = opts || {};
  const stream = await openMic(deviceId), c = Snd.ensure(), sr = c.sampleRate;
  const src = c.createMediaStreamSource(stream), node = c.createScriptProcessor(2048, 1, 1);
  node.onaudioprocess = e => { const d = new Float32Array(e.inputBuffer.getChannelData(0)); onBlock(d, e.playbackTime - e.inputBuffer.length / sr); e.outputBuffer.getChannelData(0).fill(0); };
  const silent = c.createGain(); silent.gain.value = 0; src.connect(node); node.connect(silent); silent.connect(c.destination);
  let mon = null;
  if (opts.monitor) { mon = VocalFX.liveChain(c, opts.monitor); src.connect(mon.input); mon.output.connect(Snd.dryBus()); }
  return {
    sr, label: (stream.getAudioTracks()[0] || {}).label || '',
    stop() { try { node.disconnect(); src.disconnect(); if (mon) mon.output.disconnect(); } catch (e) { /* ignore */ } stream.getTracks().forEach(t => t.stop()); }
  };
}
function startGuideRecording(P, onState, opts) {
  opts = opts || {};
  const target = opts.trackId ? trackOf(P, opts.trackId) : null;
  let cap = null, chunks = [], firstAt = null, songStart = null, handle = null, stopped = false, sr = 48000, maxPeak = 0;
  const finish = async () => {
    if (stopped) return; stopped = true;
    if (cap) cap.stop();
    if (handle) handle.stop();
    if (!chunks.length || songStart === null) { onState({ state: 'empty' }); return; }
    if (maxPeak < GUIDE_SILENT) { onState({ state: 'silent', msg: 'The microphone did not pick up any sound, so nothing was saved' + ((target ? target.takes.length : P.guide) ? ' (your earlier takes are kept)' : '') + '. ' + MIC_HELP }); return; }
    const total = chunks.reduce((a, c) => a + c.length, 0), all = new Float32Array(total); let o = 0; chunks.forEach(c => { all.set(c, o); o += c.length; });
    const shift = Math.round((songStart - firstAt + micLat()) * sr);
    let pcm;
    if (shift >= 0) pcm = all.slice(Math.min(shift, all.length));
    else { pcm = new Float32Array(all.length - shift); pcm.set(all, -shift); }   // the microphone started late: pad the start with silence
    const n = guideNormalize(pcm);
    const tmp = { length: pcm.length, sampleRate: sr, numberOfChannels: 1, getChannelData: () => pcm };
    const blob = new Blob([encodeWav(tmp, 24)], { type: 'audio/wav' });
    // the take is stored first; the project only points to it once it is safely saved
    const g = target || guideOf(P) || { at: Date.now(), dur: 0, gain: 1, nudgeMs: 0, takes: [], main: 0, comp: {}, fx: { preset: 'worship', nr: 'preset' } };
    const num = (g.takes.reduce((a, t) => Math.max(a, t.n || 0), 0) || 0) + 1, k = takePrefix(P, g) + ':' + num;
    await GuideStore.put(k, blob);
    if (!target) P.guide = g;
    g.takes.push({ k, at: Date.now(), dur: Math.round(pcm.length / sr), n: num });
    while (g.takes.length > MAX_TAKES) { const old = g.takes.shift(); GuideStore.del(old.k).catch(() => {}); g.comp = {}; }
    g.main = g.takes.length - 1; g.at = Date.now(); g.dur = Math.round(pcm.length / sr);
    GuideStore.invalidate(); touch();
    onState({ state: 'saved', seconds: g.dur, quiet: n.peak < 0.05, boost: n.gain, take: num });
  };
  (async () => {
    try {
      cap = await captureMic(opts.deviceId, (d, at) => {
        if (stopped) return;
        if (firstAt === null) firstAt = at;
        chunks.push(d);
        const pk = guidePeak(d); if (pk > maxPeak) maxPeak = pk;
        onState({ state: 'level', peak: pk });
      }, { monitor: opts.monitor });
    } catch (e) { stopped = true; onState({ state: 'error', msg: 'The microphone could not be opened. ' + MIC_HELP }); return; }
    sr = cap.sr;
    const A = arrangeSong(P, { melInst: Snd.inst() });
    // overdubbing: the loops and the tracks already recorded play along (all but the one being recorded)
    A.script.audio = (await loopAudio(P, A.places).catch(() => [])).concat(await recordedAudio(P, { exclude: target || guideOf(P), live: true }).catch(() => []));
    if (stopped) return;
    onState({ state: 'recording', label: cap.label });
    handle = Snd.play(A.script, { force: true, inst: () => Snd.backingInst(), onStart: t => { songStart = t; }, onEnd: () => finish() });
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
      S.prefs.micLatencyMs = Math.round(r.latency * 1000); touch();
      onState({ state: 'done', ms: S.prefs.micLatencyMs, heard: r.heard, mode });
    }, (0.6 + count * gap + 0.8) * 1000);
  })();
  return { stop() { stopped = true; if (cap) cap.stop(); } };
}
/* a short microphone check: shows the level for a few seconds, records nothing */
function testMic(deviceId, onLevel, ms) {
  let stream = null, raf = null, ctxN = null, done = false, peakAll = 0;
  const stop = () => { if (done) return; done = true; cancelAnimationFrame(raf); try { if (ctxN) ctxN.disconnect(); } catch (e) { /* ignore */ } if (stream) stream.getTracks().forEach(t => t.stop()); onLevel(null, peakAll); };
  (async () => {
    try { stream = await openMic(deviceId); } catch (e) { done = true; onLevel(-1, 0); return; }
    const c = Snd.ensure(); const an = c.createAnalyser(); an.fftSize = 2048; ctxN = c.createMediaStreamSource(stream); ctxN.connect(an);
    const buf = new Float32Array(an.fftSize), t0 = performance.now();
    const loop = () => { if (done) return; an.getFloatTimeDomainData(buf); const p = guidePeak(buf); if (p > peakAll) peakAll = p; onLevel(p, peakAll); if (performance.now() - t0 > (ms || 5000)) stop(); else raf = requestAnimationFrame(loop); };
    loop();
  })();
  return { stop };
}
