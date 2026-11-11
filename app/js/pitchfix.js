'use strict';
/* ---------------------------------------------------------------- gentle pitch correction for a recorded voice
   1. follow the voice's pitch every 10 ms (YIN, on a lighter copy of the sound so a long song stays quick);
   2. find the CENTRE of each note (an average over about one vibrato, so natural vibrato is kept);
   3. pull that centre towards the nearest note of the song's key, by "amount" (0 to 1), only when the singer is
      within half a semitone of it (slides, blue notes and deliberate bends are left alone);
   4. move only the stretches that really need it (more than about 3 cents), with short cross-fades, so every
      other part of the recording stays exactly as sung. The length never changes, so the voice stays on the beat.
   Pure functions, also used from the worker and from Node tests. */
const PitchFix = (() => {
  const HOP_MS = 10, LOW_HZ = 12000;
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const NOTE_PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const Y = () => (typeof Pitch !== 'undefined' ? Pitch : require('./pitch.js'));
  const L = () => (typeof LoopTools !== 'undefined' ? LoopTools : require('./looptools.js'));

  /* the notes of a key as pitch classes: a major key and its relative minor use the same seven notes */
  function scalePcs(rootName, minor) {
    const r = NOTE_PC[String(rootName || 'C').replace(/m$/, '')];
    if (r === undefined) return null;
    const base = (r + (minor ? 3 : 0)) % 12;
    return MAJOR.map(i => (base + i) % 12);
  }
  function nearestTarget(m, pcs) {
    if (!pcs || !pcs.length) return Math.round(m);
    let best = null, bd = 99;
    const c = Math.round(m);
    for (let n = c - 2; n <= c + 2; n++) { if (pcs.includes(((n % 12) + 12) % 12)) { const d = Math.abs(n - m); if (d < bd) { bd = d; best = n; } } }
    return best;
  }

  /* ---- the pitch of the voice every 10 ms, in semitones (MIDI numbers); NaN where there is no clear note ---- */
  function track(x, sr) {
    const f = Math.max(1, Math.floor(sr / LOW_HZ)), lsr = sr / f, n = Math.floor(x.length / f), lo = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < f; j++) s += x[i * f + j]; lo[i] = s / f; }
    const win = Math.round(lsr * 0.043), hop = Math.round(lsr * HOP_MS / 1000), frames = Math.max(0, Math.floor((n - win) / hop));
    let peakRms = 0; const lv = new Float32Array(frames);
    for (let k = 0; k < frames; k++) { let s = 0; const o = k * hop; for (let i = 0; i < win; i += 2) s += lo[o + i] * lo[o + i]; lv[k] = Math.sqrt(s / (win / 2)); if (lv[k] > peakRms) peakRms = lv[k]; }
    const gate = Math.max(0.003, peakRms * 0.06), raw = new Float32Array(frames).fill(NaN), P = Y();
    for (let k = 0; k < frames; k++) {
      if (lv[k] < gate) continue;
      const r = P.yin(lo.subarray(k * hop, k * hop + win), lsr, 0.15);
      if (r && r.clarity > 0.8) raw[k] = P.hzToMidi(r.hz);
    }
    // remove single-frame octave slips: a frame far from its neighbours' median is dropped
    const m = raw.slice();
    for (let k = 0; k < frames; k++) {
      if (isNaN(raw[k])) continue;
      const nb = []; for (let j = -3; j <= 3; j++) { const v = raw[k + j]; if (j && v === v) nb.push(v); }
      if (nb.length < 2) { m[k] = NaN; continue; }
      nb.sort((a, b) => a - b); const med = nb[nb.length >> 1];
      if (Math.abs(raw[k] - med) > 0.8) m[k] = NaN;
    }
    return { midi: m, hopSec: hop / lsr };
  }

  /* ---- how far to move each frame, in semitones ---- */
  function shifts(midi, o) {
    const n = midi.length, amount = Math.max(0, Math.min(1, o.amount === undefined ? 0.6 : o.amount));
    const pcs = o.pcs === undefined ? null : o.pcs, dead = 0.07, reach = o.reach || 0.5, R = 10;
    // bridge tiny gaps (a few unclear frames inside a note), then work note by note
    const v = midi.slice();
    for (let k = 1; k < n - 1; k++) if (isNaN(v[k])) { let a = k - 1, b = k + 1; while (b < n && b - k <= 4 && isNaN(v[b])) b++; if (b < n && b - k <= 4 && !isNaN(v[a]) && Math.abs(v[a] - v[b]) < 0.6) { for (let j = k; j < b; j++) v[j] = v[a] + (v[b] - v[a]) * (j - a) / (b - a); k = b; } }
    const s = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      if (isNaN(v[k])) continue;
      let sum = 0, c = 0;
      for (let j = Math.max(0, k - R); j <= Math.min(n - 1, k + R); j++) {
        if (isNaN(v[j])) continue;
        // stop at a big jump: that is the next note
        if (Math.abs(v[j] - v[k]) > 0.9) continue;
        sum += v[j]; c++;
      }
      if (c < 5) continue;
      const centre = sum / c, tgt = nearestTarget(centre, pcs), dev = tgt - centre, ad = Math.abs(dev);
      if (ad > reach || ad < dead) continue;
      const knee = Math.min(1, (ad - dead) / 0.08);
      s[k] = dev * amount * knee;
    }
    // soften the changes (about 30 ms) so nothing jumps
    const out = new Float32Array(n);
    for (let k = 0; k < n; k++) { let t = 0, c = 0; for (let j = -2; j <= 2; j++) { const i = k + j; if (i >= 0 && i < n) { t += s[i]; c++; } } out[k] = t / c; }
    return out;
  }

  /* ---- apply the shifts to the audio ---- */
  function apply(x, sr, s, hopSec) {
    const out = x.slice(), n = s.length, minShift = 0.03, margin = Math.round(sr * 0.06), fade = Math.round(sr * 0.02);
    // active stretches
    const runs = []; let a = -1;
    for (let k = 0; k <= n; k++) {
      const on = k < n && Math.abs(s[k]) > minShift / 2;
      if (on && a < 0) a = k; else if (!on && a >= 0) { runs.push([a, k]); a = -1; }
    }
    // merge stretches closer than 150 ms
    const merged = [];
    runs.forEach(r => { const l = merged[merged.length - 1]; if (l && (r[0] - l[1]) * hopSec < 0.15) l[1] = r[1]; else merged.push(r.slice()); });
    const LT = L();
    merged.forEach(([k0, k1]) => {
      if ((k1 - k0) * hopSec < 0.12) return;
      const i0 = Math.max(0, Math.round(k0 * hopSec * sr) - margin), i1 = Math.min(x.length, Math.round(k1 * hopSec * sr) + margin), len = i1 - i0;
      if (len < sr * 0.15) return;
      const sAt = t => { const f = (i0 / sr + t) / hopSec, k = Math.floor(f), w = f - k; const a0 = k >= 0 && k < n ? s[k] : 0, a1 = k + 1 >= 0 && k + 1 < n ? s[k + 1] : 0; return a0 * (1 - w) + a1 * w; };
      const ratio = t => Math.pow(2, sAt(t) / 12);
      const seg = x.slice(i0, i1), st = LT.stretchVar([seg], sr, ratio)[0];
      // read the stretched sound at a rate that follows the wanted pitch; the output keeps the original length
      let p = 0; const y = new Float32Array(len);
      for (let u = 0; u < len; u++) {
        const q = Math.floor(p), f = p - q;
        y[u] = q + 1 < st.length ? st[q] * (1 - f) + st[q + 1] * f : (st[q] || 0);
        p += ratio(u / sr);
      }
      for (let u = 0; u < len; u++) {
        const w = Math.min(1, u / fade, (len - 1 - u) / fade);
        out[i0 + u] = x[i0 + u] * (1 - w) + y[u] * w;
      }
    });
    return out;
  }

  /* x: Float32Array (mono voice); o: { amount 0..1, pcs: scale pitch classes or null for any semitone } */
  function tune(x, sr, o) {
    o = o || {};
    if (!(o.amount > 0) || x.length < sr * 0.3) return x.slice();
    const t = track(x, sr), s = shifts(t.midi, o);
    return apply(x, sr, s, t.hopSec);
  }

  /* for tests and the screen: the average cents each note sits from its nearest target, before correction */
  function report(x, sr, pcs) {
    const t = track(x, sr), n = t.midi.length; let sum = 0, c = 0;
    for (let k = 0; k < n; k++) { const v = t.midi[k]; if (isNaN(v)) continue; const g = nearestTarget(v, pcs); sum += Math.abs(g - v) * 100; c++; }
    return { frames: c, meanCents: c ? sum / c : 0 };
  }

  return { tune, track, shifts, apply, scalePcs, nearestTarget, report };
})();
if (typeof module !== 'undefined') module.exports = PitchFix;
