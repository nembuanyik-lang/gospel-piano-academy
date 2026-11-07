'use strict';
/* ---------------------------------------------------------------- loops and beats (pure, no DOM)
   - tempo: from the file name ("Gospel_Keys_92bpm_Cm.wav"), from the loop's length (a loop is a whole number of
     beats), and from the audio itself (onset strength, autocorrelation), combined
   - key: from the file name; the transposition that brings a loop to the song's key
   - time-stretch that keeps the pitch (WSOLA: overlapping pieces, each placed where it matches best), resampling,
     and pitch shifting (stretch, then resample back to the same length)
   - reading a MIDI file (format 0 or 1): notes in beats, drums from channel 10 mapped to the app's kit */
const LoopTools = (() => {
  const mod = x => ((x % 12) + 12) % 12;
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  /* ---- names ---- */
  function fromName(name) {
    const base = String(name || '').replace(/\.[a-z0-9]{2,4}$/i, ''), out = { title: base.replace(/[_]+/g, ' ').trim() };
    const b = /(?:^|[^0-9])(\d{2,3})\s*-?\s*bpm/i.exec(base) || /bpm\s*-?\s*(\d{2,3})/i.exec(base) || /(?:^|[_\s-])(\d{2,3})(?=[_\s-]|$)/.exec(base);
    if (b) { const v = +b[1]; if (v >= 50 && v <= 220) out.bpm = v; }
    const k = /(?:^|[_\s-])([A-G])(#|b|♯|♭|s(?=[_\s-]?(?:m|min|maj|major|minor)?(?:[_\s-]|$)))?\s*(m|min|minor|maj|major)?(?=[_\s-]|$)/.exec(base);
    if (k) {
      const acc = k[2] === '#' || k[2] === '♯' || k[2] === 's' ? 1 : k[2] === 'b' || k[2] === '♭' ? -1 : 0;
      out.keyPc = mod(PC[k[1]] + acc); out.minor = /^(m|min|minor)$/.test(k[3] || '');
    }
    if (/drum|kick|snare|hi-?hat|perc|break/i.test(base)) out.role = 'drums';   // a 'beat' is a whole backing, not only drums
    return out;
  }
  /* semitones to bring a loop in (keyPc, minor) to the song's key, the smallest way (−6..+5). A minor loop is read
     as its relative major. */
  function transposeTo(loopPc, minor, songPc) {
    const home = minor ? mod(loopPc + 3) : loopPc;
    let d = mod(songPc - home); if (d > 5) d -= 12; return d;
  }

  /* ---- tempo ---- */
  function onsetEnvelope(x, sr) {
    const hop = Math.round(sr / 172), win = hop * 2, env = [];   // about 172 frames a second
    let prev = 0;
    for (let i = 0; i + win < x.length; i += hop) {
      let e = 0; for (let j = 0; j < win; j += 2) { const v = x[i + j]; e += v * v; }
      e = Math.log(1e-6 + e); env.push(Math.max(0, e - prev)); prev = e;
    }
    return { env, rate: sr / hop };
  }
  function tempoFromAudio(x, sr) {
    const { env, rate } = onsetEnvelope(x, sr); if (env.length < rate * 2) return null;
    const mean = env.reduce((a, v) => a + v, 0) / env.length, e = env.map(v => v - mean);
    let best = null;
    for (let bpm = 60; bpm <= 190; bpm += 0.5) {
      const lag = rate * 60 / bpm, L = Math.floor(lag), f = lag - L;
      let s = 0; for (let i = 0; i + L + 1 < e.length; i++) s += e[i] * (e[i + L] * (1 - f) + e[i + L + 1] * f);
      // and the double tempo, which helps choose between 70 and 140
      const w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 110) / 0.9, 2));
      const sc = s * w;
      if (!best || sc > best.sc) best = { bpm, sc };
    }
    return best ? best.bpm : null;
  }
  /* the loop's tempo and length in beats. A loop is a whole number of bars, so its length decides between close
     candidates; the file name, when it has a tempo, wins. */
  function detectTempo(x, sr, o) {
    o = o || {};
    const secs = x.length / sr, bar = o.bar || 4, named = o.nameBpm;
    if (named) return { bpm: named, beats: Math.max(1, Math.round(secs * named / 60)), from: 'name' };
    const heard = tempoFromAudio(x, sr);
    if (o.kind !== 'beat' && secs < 40) {
      // candidates: 1, 2, 4, 8, 16 bars that land between 60 and 190 BPM
      const cands = [1, 2, 4, 8, 16].map(b => ({ beats: b * bar, bpm: b * bar * 60 / secs })).filter(c => c.bpm >= 60 && c.bpm <= 190);
      if (cands.length) {
        const pick = heard ? cands.slice().sort((a, b) => Math.abs(Math.log(a.bpm / heard)) - Math.abs(Math.log(b.bpm / heard)))[0] : cands.slice().sort((a, b) => Math.abs(a.bpm - 105) - Math.abs(b.bpm - 105))[0];
        return { bpm: Math.round(pick.bpm * 100) / 100, beats: pick.beats, from: 'length' };
      }
    }
    const bpm = heard ? Math.round(heard) : 100;
    return { bpm, beats: Math.max(1, Math.round(secs * bpm / 60)), from: heard ? 'audio' : 'guess' };
  }
  /* where the first real sound starts (seconds), for lining a beat up with bar 1 */
  function firstOnset(x, sr) {
    let pk = 0; for (let i = 0; i < x.length; i++) pk = Math.max(pk, Math.abs(x[i]));
    const thr = pk * 0.12; for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > thr) return Math.max(0, i / sr - 0.003);
    return 0;
  }

  /* ---- time-stretch (keeps pitch): ratio = new length / old length ---- */
  function stretch(channels, sr, ratio) {
    if (Math.abs(ratio - 1) < 0.002) return channels.map(c => c.slice());
    const N = Math.round(sr * 0.046) & ~1, Hs = N / 2, Ha = Hs / ratio, tol = Math.round(sr * 0.012), len = channels[0].length;
    const outLen = Math.round(len * ratio), out = channels.map(() => new Float32Array(outLen + N)), norm = new Float32Array(outLen + N);
    const win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
    const mono = channels.length === 1 ? channels[0] : channels[0].map((v, i) => (v + channels[1][i]) / 2);
    let prevEnd = 0;   // where the natural continuation of the last piece would start in the input
    for (let k = 0; k * Hs < outLen; k++) {
      const target = Math.round(k * Ha);
      let pos = target;
      if (k > 0) {
        // search around the target for the piece that best continues what was just written (decimated for speed)
        let best = -Infinity; const st = 4;
        for (let d = -tol; d <= tol; d += 2) {
          const p = target + d; if (p < 0 || p + N >= len) continue;
          let s = 0; for (let j = 0; j < Hs; j += st) s += mono[prevEnd + j] * mono[p + j];
          if (s > best) { best = s; pos = p; }
        }
      }
      if (pos + N >= len) pos = Math.max(0, len - N - 1);
      const o = k * Hs;
      for (let c = 0; c < channels.length; c++) { const src = channels[c], dst = out[c]; for (let j = 0; j < N; j++) dst[o + j] += src[pos + j] * win[j]; }
      for (let j = 0; j < N; j++) norm[o + j] += win[j];
      prevEnd = Math.min(len - Hs - 1, pos + Hs);
    }
    return out.map(d => { const r = new Float32Array(outLen); for (let i = 0; i < outLen; i++) r[i] = norm[i] > 0.05 ? d[i] / norm[i] : d[i]; return r; });
  }
  /* a stretch whose amount changes over time (for slowing down at the end of a song): ratioAt(t) gives how many
     times longer the audio is made at t seconds into the input (1 = as it is, 1.6 = much slower). Pitch is kept. */
  function stretchVar(channels, sr, ratioAt) {
    const N = Math.round(sr * 0.046) & ~1, Hs = N / 2, tol = Math.round(sr * 0.012), len = channels[0].length;
    // output length: the integral of the ratio over the input
    let est = 0; for (let t = 0; t < len; t += Hs) est += Hs * Math.max(0.25, ratioAt(t / sr));
    const outLen = Math.ceil(est) + N, out = channels.map(() => new Float32Array(outLen + N)), norm = new Float32Array(outLen + N);
    const win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
    const mono = channels.length === 1 ? channels[0] : channels[0].map((v, i) => (v + channels[1][i]) / 2);
    let ipos = 0, prevEnd = 0, k = 0, last = 0;
    for (; ipos < len - N && k * Hs < outLen; k++) {
      const target = Math.round(ipos); let pos = target;
      if (k > 0) {
        let best = -Infinity;
        for (let d = -tol; d <= tol; d += 2) { const p = target + d; if (p < 0 || p + N >= len) continue; let sm = 0; for (let j = 0; j < Hs; j += 4) sm += mono[prevEnd + j] * mono[p + j]; if (sm > best) { best = sm; pos = p; } }
      }
      const o = k * Hs;
      for (let c = 0; c < channels.length; c++) { const src = channels[c], dst = out[c]; for (let j = 0; j < N; j++) dst[o + j] += src[pos + j] * win[j]; }
      for (let j = 0; j < N; j++) norm[o + j] += win[j];
      prevEnd = Math.min(len - Hs - 1, pos + Hs); last = o + N;
      ipos += Hs / Math.max(0.25, ratioAt(ipos / sr));
    }
    const n = Math.min(outLen, last);
    return out.map(d => { const r = new Float32Array(n); for (let i = 0; i < n; i++) r[i] = norm[i] > 0.05 ? d[i] / norm[i] : d[i]; return r; });
  }
  /* resample by linear interpolation (factor > 1 = higher and shorter) */
  function resample(x, factor) {
    const n = Math.floor(x.length / factor), y = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = i * factor, a = Math.floor(p), f = p - a; y[i] = (x[a] || 0) * (1 - f) + (x[a + 1] || 0) * f; }
    return y;
  }
  /* the loop at a new tempo and pitch: stretch for both, then resample back for the pitch */
  function fit(channels, sr, fromBpm, toBpm, semis) {
    const pf = Math.pow(2, (semis || 0) / 12), speed = toBpm / fromBpm;
    const st = stretch(channels, sr, pf / speed);
    return pf === 1 ? st : st.map(c => resample(c, pf));
  }

  /* ---- MIDI files ---- */
  const DRUMS = { 35: 'k', 36: 'k', 37: 'r', 38: 's', 40: 's', 39: 'cl', 42: 'h', 44: 'h', 46: 'o', 49: 'c', 57: 'c', 51: 'h', 59: 'h', 41: 'k', 43: 'k', 45: 's', 47: 's', 48: 's', 50: 's' };
  function parseMidi(bytes) {
    const d = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const s4 = o => String.fromCharCode(d[o], d[o + 1], d[o + 2], d[o + 3]), u32 = o => ((d[o] << 24) >>> 0) + (d[o + 1] << 16) + (d[o + 2] << 8) + d[o + 3], u16 = o => (d[o] << 8) + d[o + 1];
    if (s4(0) !== 'MThd') throw new Error('Not a MIDI file');
    const ntr = u16(10), div = u16(12); if (div & 0x8000) throw new Error('This MIDI file uses SMPTE time, which is not supported');
    let pos = 8 + u32(4), bpm = null; const notes = [], names = [];
    for (let t = 0; t < ntr && pos + 8 <= d.length; t++) {
      if (s4(pos) !== 'MTrk') break;
      const len = u32(pos + 4); let i = pos + 8; const end = i + len; let tick = 0, run = 0; const open = {};
      const vlq = () => { let v = 0, c; do { c = d[i++]; v = (v << 7) | (c & 127); } while (c & 128 && i < end); return v; };
      while (i < end) {
        tick += vlq();
        let st = d[i];
        if (st === 0xFF) { const ty = d[i + 1]; i += 2; const l = vlq(); if (ty === 0x51 && l === 3 && bpm === null) bpm = 60000000 / ((d[i] << 16) + (d[i + 1] << 8) + d[i + 2]); if (ty === 3) names.push(String.fromCharCode.apply(null, d.slice(i, i + l))); i += l; continue; }
        if (st === 0xF0 || st === 0xF7) { i++; const l = vlq(); i += l; continue; }
        if (st & 0x80) { run = st; i++; } else st = run;
        const ty = st & 0xF0, ch = st & 15;
        if (ty === 0xC0 || ty === 0xD0) { i += 1; continue; }
        const a = d[i], b = d[i + 1]; i += 2;
        const key = ch + ':' + a;
        if (ty === 0x90 && b > 0) { (open[key] = open[key] || []).push({ tick, vel: b }); }
        else if (ty === 0x80 || (ty === 0x90 && b === 0)) { const o = (open[key] || []).shift(); if (o) notes.push({ t: o.tick / div, d: Math.max(1 / 16, (tick - o.tick) / div), m: a, vel: o.vel / 127, ch }); }
      }
      Object.keys(open).forEach(k => open[k].forEach(o => { const [ch, m] = k.split(':').map(Number); notes.push({ t: o.tick / div, d: 0.25, m, vel: o.vel / 127, ch }); }));
      pos = end;
    }
    notes.sort((a, b) => a.t - b.t || a.m - b.m);
    const last = notes.reduce((a, n) => Math.max(a, n.t + (n.ch === 9 ? 0.25 : n.d)), 0);
    const beats = Math.max(1, Math.ceil(last / 4 - 1e-6) * 4);   // whole bars
    const drums = notes.filter(n => n.ch === 9).map(n => ({ t: n.t, drum: DRUMS[n.m] || (n.m < 41 ? 'k' : n.m < 50 ? 's' : 'h'), vel: n.vel }));
    const tonal = notes.filter(n => n.ch !== 9).map(n => ({ t: n.t, d: n.d, m: n.m, vel: n.vel }));
    return { bpm: bpm ? Math.round(bpm * 100) / 100 : null, beats, drums, notes: tonal, name: names[0] || '' };
  }

  return { fromName, transposeTo, onsetEnvelope, tempoFromAudio, detectTempo, firstOnset, stretch, stretchVar, resample, fit, parseMidi, DRUMS };
})();
if (typeof module !== 'undefined') module.exports = LoopTools;
