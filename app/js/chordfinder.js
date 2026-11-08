'use strict';
/* Chord finder: listens to a recording (a downloaded song, a tape from church) and works out which chords are played.
   How it works, in plain words: the sound is cut into short pieces; for each piece we measure how much of each of the
   twelve notes (C, C#, D …) is sounding, whatever the octave. That "note colour" is compared with the shape of each
   chord (a major chord is root + third + fifth, and so on). A smoothing step then keeps a chord until the evidence clearly
   changes, so you get a few steady chords instead of a flicker. It is a good guide, not a perfect answer: it works best on
   a clear piano or guitar, and is weaker when the recording is noisy, out of tune, drums-heavy, or only voices. */
const ChordFinder = (() => {
  const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'], SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const TYPES = [
    { q: '', iv: [[0, 1], [4, 0.85], [7, 0.8]], simple: true },
    { q: 'm', iv: [[0, 1], [3, 0.85], [7, 0.8]], simple: true },
    { q: '7', iv: [[0, 1], [4, 0.8], [7, 0.75], [10, 0.6]] },
    { q: 'm7', iv: [[0, 1], [3, 0.8], [7, 0.75], [10, 0.6]] },
    { q: 'maj7', iv: [[0, 1], [4, 0.8], [7, 0.75], [11, 0.6]] }
  ];
  const BIAS = { '': 1, m: 1, '7': 0.92, m7: 0.92, maj7: 0.91 };   // a 7th chord must clearly beat the plain chord
  const MAJ_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], MIN_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
          const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
  }

  /* x: mono samples, sr: sample rate (about 11025 is plenty). Returns the "note colour" of each short piece. */
  function chroma(x, sr, o) {
    o = o || {};
    const N = o.size || 4096, hop = o.hop || 2048, lo = o.lo || 70, hi = o.hi || 2000;
    const win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
    const re = new Float64Array(N), im = new Float64Array(N);
    const b0 = Math.max(1, Math.ceil(lo * N / sr)), b1 = Math.min(N / 2 - 1, Math.floor(hi * N / sr));
    const frames = [], fine = new Float64Array(36), semi = new Float64Array(b1 + 1), sub = new Float64Array(b1 + 1);
    for (let k = b0; k <= b1; k++) { const m = 12 * Math.log2((k * sr / N) / 440) + 69; semi[k] = m; }
    const mags = [];
    for (let s = 0; s + N <= x.length; s += hop) {
      for (let i = 0; i < N; i++) { re[i] = x[s + i] * win[i]; im[i] = 0; }
      fft(re, im);
      const mg = new Float32Array(b1 + 1); let e = 0;
      for (let k = b0; k <= b1; k++) { const m = Math.sqrt(re[k] * re[k] + im[k] * im[k]); mg[k] = Math.sqrt(m) / (1 + (k * sr / N) / 600); e += m * m; }   // high partials count for less   // square root: stops one loud partial from ruling
      mags.push({ t: (s + N / 2) / sr, mg, e });
    }
    // the recording may be a little out of tune (tapes often are): find how far, in thirds of a semitone
    for (const f of mags) for (let k = b0; k <= b1; k++) { const m = semi[k], pcf = ((m % 12) + 12) % 12, idx = Math.round(pcf * 3) % 36; fine[idx] += f.mg[k] * f.mg[k]; }
    const off = [0, 0, 0]; for (let i = 0; i < 36; i++) off[i % 3] += fine[i];
    let best = 0; for (let i = 1; i < 3; i++) if (off[i] > off[best]) best = i;
    const shift = best === 0 ? 0 : best === 1 ? -1 / 3 : 1 / 3;   // semitones to add so the notes line up with the piano
    for (const f of mags) {
      const c = new Float64Array(12);
      for (let k = b0; k <= b1; k++) { const pc = ((Math.round(semi[k] + shift) % 12) + 12) % 12; c[pc] += f.mg[k]; }
      let n = 0; for (let i = 0; i < 12; i++) n += c[i] * c[i]; n = Math.sqrt(n) || 1;
      for (let i = 0; i < 12; i++) c[i] /= n;
      frames.push({ t: f.t, c: Array.from(c), e: f.e });
    }
    // very quiet pieces carry no chord
    const es = frames.map(f => f.e).sort((a, b) => a - b), floor = (es[Math.floor(es.length * 0.5)] || 0) * 0.02;
    frames.forEach(f => { f.quiet = f.e < floor; });
    return { frames, tuning: shift, hop: hop / sr };
  }

  const cosine = (a, b) => { let d = 0, na = 0, nb = 0; for (let i = 0; i < 12; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return d / (Math.sqrt(na * nb) || 1); };
  function templates(simple) {
    const out = [];
    TYPES.filter(t => !simple || t.simple).forEach(t => { for (let r = 0; r < 12; r++) { const v = new Array(12).fill(0); t.iv.forEach(([i, w]) => { v[(r + i) % 12] = w; }); out.push({ r, q: t.q, v }); } });
    return out;
  }

  /* chords over time. opts.simple: only major and minor. Returns [{t, dur, r, q}] */
  function detect(ch, opts) {
    opts = opts || {};
    const F = ch.frames, T = templates(opts.simple), S = T.length, n = F.length;
    if (!n) return [];
    // blend each piece with its neighbours a little
    const sm = F.map((f, i) => { const c = new Array(12).fill(0), a = F[i - 1], b = F[i + 1]; for (let k = 0; k < 12; k++) c[k] = f.c[k] * 0.6 + (a ? a.c[k] : f.c[k]) * 0.2 + (b ? b.c[k] : f.c[k]) * 0.2; return c; });
    const stay = Math.log(opts.stay || 0.93), move = Math.log((1 - (opts.stay || 0.93)) / (S - 1)), beta = 14;
    let prev = new Float64Array(S), cur = new Float64Array(S); const back = new Array(n);
    for (let i = 0; i < n; i++) {
      const bp = new Uint8Array(S), c = sm[i];
      let bestPrev = 0; for (let s = 1; s < S; s++) if (prev[s] > prev[bestPrev]) bestPrev = s;
      for (let s = 0; s < S; s++) {
        const em = beta * cosine(c, T[s].v) * BIAS[T[s].q] * (F[i].quiet ? 0.2 : 1);
        if (i === 0) { cur[s] = em; continue; }
        const a = prev[s] + stay, b = prev[bestPrev] + move;
        if (a >= b) { cur[s] = a + em; bp[s] = s; } else { cur[s] = b + em; bp[s] = bestPrev; }
      }
      back[i] = bp; const t = prev; prev = cur; cur = t;
    }
    let s = 0; for (let k = 1; k < S; k++) if (prev[k] > prev[s]) s = k;
    const path = new Array(n); for (let i = n - 1; i >= 0; i--) { path[i] = s; if (i > 0) s = back[i][s]; }
    // runs of the same chord → segments
    let segs = [];
    for (let i = 0; i < n; i++) {
      const t = T[path[i]], start = i === 0 ? 0 : (F[i - 1].t + F[i].t) / 2;
      if (segs.length && segs[segs.length - 1].r === t.r && segs[segs.length - 1].q === t.q) continue;
      segs.push({ t: start, r: t.r, q: t.q });
    }
    const end = F[n - 1].t + ch.hop / 2;
    segs.forEach((g, i) => { g.dur = (segs[i + 1] ? segs[i + 1].t : end) - g.t; });
    // a chord shorter than about half a second is noise: give it to the chord before it
    const minDur = opts.minDur || 0.55; let changed = true;
    while (changed && segs.length > 1) {
      changed = false;
      for (let i = 0; i < segs.length; i++) {
        if (segs[i].dur < minDur && segs.length > 1) {
          const j = i > 0 ? i - 1 : 1; segs[j].dur += segs[i].dur; if (j > i) segs[j].t = segs[i].t;
          segs.splice(i, 1); changed = true; break;
        }
      }
      const m = []; segs.forEach(g => { const l = m[m.length - 1]; if (l && l.r === g.r && l.q === g.q) l.dur += g.dur; else m.push(g); }); if (m.length !== segs.length) { segs = m; changed = true; }
    }
    return segs.map(g => ({ t: Math.round(g.t * 100) / 100, dur: Math.round(g.dur * 100) / 100, r: g.r, q: g.q }));
  }

  /* the key of the whole recording, e.g. { r: 2, minor: false } for D major.
     Chords that belong to a key (and a start or finish on its home chord) vote for it; the note colours break ties. */
  function estimateKey(ch, segs) {
    const tot = new Array(12).fill(0); ch.frames.forEach(f => { if (!f.quiet) for (let i = 0; i < 12; i++) tot[i] += f.c[i]; });
    const corr = (p, r) => { const a = tot.map((_, i) => tot[(i + r) % 12]); const ma = a.reduce((x, y) => x + y, 0) / 12, mp = p.reduce((x, y) => x + y, 0) / 12; let d = 0, sa = 0, sp = 0; for (let i = 0; i < 12; i++) { d += (a[i] - ma) * (p[i] - mp); sa += (a[i] - ma) ** 2; sp += (p[i] - mp) ** 2; } return d / (Math.sqrt(sa * sp) || 1); };
    const cands = [];
    for (let r = 0; r < 12; r++) { cands.push({ r, minor: false, c: corr(MAJ_PROFILE, r) }); cands.push({ r, minor: true, c: corr(MIN_PROFILE, r) }); }
    if (segs && segs.length) {
      const IN = [[0, ['', 'maj7', '7']], [2, ['m', 'm7']], [4, ['m', 'm7']], [5, ['', 'maj7', '7']], [7, ['', '7']], [9, ['m', 'm7']]];   // chords of a major key, counted from its home note
      const fit = (g, home) => IN.some(([d, qs]) => (home + d) % 12 === g.r && qs.includes(g.q)) ? 1 : 0;
      const total = segs.reduce((a, g) => a + g.dur, 0) || 1, first = segs[0], last = segs[segs.length - 1];
      cands.forEach(k => {
        const home = k.minor ? (k.r + 3) % 12 : k.r;   // a minor key uses the chords of its relative major
        let s = segs.reduce((a, g) => a + g.dur * fit(g, home), 0) / total;
        const tonic = g => g.r === k.r && (k.minor ? g.q === 'm' || g.q === 'm7' : g.q === '' || g.q === 'maj7' || g.q === '7');
        if (tonic(last)) s += 0.25; if (tonic(first)) s += 0.15;
        k.c = s * 2 + k.c * 0.3;
      });
    }
    let best = cands[0]; cands.forEach(k => { if (k.c > best.c) best = k; });
    return { r: best.r, minor: best.minor };
  }

  const FLAT_KEYS = new Set([5, 10, 3, 8, 1, 6]);   // F Bb Eb Ab Db Gb
  const flatsFor = key => (key.minor ? FLAT_KEYS.has((key.r + 3) % 12) || [2, 7, 0, 5].includes(key.r) : FLAT_KEYS.has(key.r));
  const rootName = (r, flats) => (flats ? FLAT : SHARP)[((r % 12) + 12) % 12];
  const chordName = (r, q, flats, up) => rootName(r + (up || 0), flats) + q;
  const keyName = (k, flats) => rootName(k.r, flats) + (k.minor ? ' minor' : '');

  /* the whole job in one go, from mono samples */
  function analyse(x, sr, opts) {
    opts = opts || {};
    const ch = chroma(x, sr, opts), segs = detect(ch, opts), key = estimateKey(ch, segs);
    return { key, segs, tuning: ch.tuning, seconds: x.length / sr };
  }
  return { chroma, detect, estimateKey, analyse, chordName, rootName, keyName, flatsFor, fft, FLAT, SHARP, TYPES };
})();
if (typeof module !== 'undefined') module.exports = ChordFinder;
