'use strict';
/* ---------------------------------------------------------------- mastering (pure, no DOM)
   The last step before a song is shared: it is made as loud as songs on streaming services, evenly, without
   distortion.
   - Loudness is measured the broadcast way (ITU-R BS.1770 / EBU R128): K-weighting, 400 ms blocks, gated, in LUFS.
   - Glue compression: a gentle, slow, stereo-linked compressor that holds the mix together (about 1–3 dB).
   - The level is set to the target loudness, then a look-ahead limiter keeps the true peak (between samples too,
     measured at four times the sample rate) under the ceiling, so it never clips after MP3 encoding.
   Targets: Streaming −14 LUFS (YouTube, Spotify, Boomplay, Audiomack), Gentle −16 (Apple Music, ballads), Loud −10
   (WhatsApp, radio, the church sound system). */
const Mastering = (() => {
  const TARGETS = { stream: { label: 'Streaming (−14 LUFS): YouTube, Spotify, Boomplay', lufs: -14 }, gentle: { label: 'Gentle (−16 LUFS): Apple Music, soft songs', lufs: -16 },
    loud: { label: 'Loud (−10 LUFS): WhatsApp, radio, the church sound system', lufs: -10 }, off: { label: 'Off (no mastering)' } };
  const dB = x => 20 * Math.log10(Math.max(1e-12, x));
  /* a biquad; out may be x itself (filtered in place) */
  function filt(x, b0, b1, b2, a1, a2, out) { const y = out || new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = x[i], o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = o; y[i] = o; } return y; }
  function kWeight(x, sr, out) {
    // stage 1: high shelf (+4 dB above about 1.7 kHz), stage 2: high-pass (about 38 Hz). The design is the one used by
    // libebur128, which gives the exact ITU coefficients at 48 kHz and the same response at any other sample rate.
    let f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196, K = Math.tan(Math.PI * f0 / sr);
    const Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416), a0 = 1 + K / Q + K * K;
    const y = filt(x, (Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0, out);
    f0 = 38.13547087602444; Q = 0.5003270373238773; K = Math.tan(Math.PI * f0 / sr);
    const d = 1 + K / Q + K * K;
    return filt(y, 1, -2, 1, 2 * (K * K - 1) / d, (1 - K / Q + K * K) / d, y);   // the second stage in place
  }
  /* integrated loudness in LUFS (and the short-term blocks, for display) */
  function loudness(channels, sr) {
    // one channel at a time through one working buffer (a long song is never weighted twice over in memory)
    const n = channels[0].length, B = Math.round(sr * 0.4), H = Math.round(sr * 0.1), nb = n >= B ? Math.floor((n - B) / H) + 1 : 0, blocks = new Float64Array(Math.max(1, nb));
    const k = new Float32Array(n);
    channels.forEach(c => {
      kWeight(c, sr, k);
      if (!nb) { let m = 0; for (let i = 0; i < n; i++) m += k[i] * k[i]; blocks[0] += m / Math.max(1, n); return; }
      for (let b = 0; b < nb; b++) { let m = 0; const s0 = b * H; for (let i = s0; i < s0 + B; i++) m += k[i] * k[i]; blocks[b] += m / B; }
    });
    const L = z => -0.691 + 10 * Math.log10(Math.max(1e-12, z));
    const abs = Array.from(blocks).filter(z => L(z) > -70); if (!abs.length) return -Infinity;
    const rel = L(abs.reduce((a, z) => a + z, 0) / abs.length) - 10, gated = abs.filter(z => L(z) > rel);
    return L(gated.reduce((a, z) => a + z, 0) / gated.length);
  }
  /* true peak: the highest point, including between samples (4x oversampled with a windowed-sinc interpolator) */
  const TAPS = 12, KERN = (() => { const k = []; for (let ph = 1; ph < 4; ph++) { const row = []; for (let j = -TAPS; j < TAPS; j++) { const t = j + 1 - ph / 4, x = Math.PI * t, sinc = t === 0 ? 1 : Math.sin(x) / x, w = 0.5 + 0.5 * Math.cos(Math.PI * t / TAPS); row.push(sinc * w); } k.push(row); } return k; })();
  function truePeak(channels) {
    let pk = 0;
    channels.forEach(c => {
      for (let i = 0; i < c.length; i++) {
        const a = Math.abs(c[i]); if (a > pk) pk = a;
        if (a < pk * 0.5) continue;   // only look between samples near the loud ones
        for (let ph = 0; ph < 3; ph++) { let s = 0; const row = KERN[ph]; for (let j = -TAPS; j < TAPS; j++) { const q = i + j; if (q >= 0 && q < c.length) s += c[q] * row[j + TAPS]; } if (Math.abs(s) > pk) pk = Math.abs(s); }
      }
    });
    return pk;
  }
  /* glue: slow, stereo-linked, gentle compression of the whole mix */
  function glue(channels, sr, o) {   // o.inPlace: the channels themselves become the result
    o = o || {};
    const n = channels[0].length, ratio = o.ratio || 2, atk = Math.exp(-1 / (sr * 0.03)), rel = Math.exp(-1 / (sr * 0.25)), rms = Math.exp(-1 / (sr * 0.05));
    // threshold: a little under the loud parts of this mix, so it only touches the peaks of the music
    let p2 = 0; for (let i = 0; i < n; i += 16) { let m = 0; channels.forEach(c => { m = Math.max(m, Math.abs(c[i])); }); p2 += m * m; }
    const thr = dB(Math.sqrt(p2 / Math.max(1, n / 16))) + (o.over || 4);
    let env = 0, gr = 0; const out = o.inPlace ? channels : channels.map(() => new Float32Array(n));
    for (let i = 0; i < n; i++) {
      let m = 0; channels.forEach(c => { m = Math.max(m, c[i] * c[i]); });
      env = rms * env + (1 - rms) * m;
      const over = dB(Math.sqrt(env)) - thr, want = over > 0 ? Math.min(3, over * (1 - 1 / ratio)) : 0;
      gr = want > gr ? atk * gr + (1 - atk) * want : rel * gr + (1 - rel) * want;
      const g = Math.pow(10, -gr / 20); channels.forEach((c, k) => { out[k][i] = c[i] * g; });
    }
    return out;
  }
  /* look-ahead limiter: the gain falls smoothly before a peak arrives and recovers slowly after */
  function limiter(channels, sr, ceilingDb, inPlace) {
    const n = channels[0].length, look = Math.max(1, Math.round(sr * 0.005)), relC = Math.exp(-1 / (sr * 0.12)), ceil = Math.pow(10, ceilingDb / 20);
    const need = new Float32Array(n);
    for (let i = 0; i < n; i++) { let m = 0; channels.forEach(c => { const a = Math.abs(c[i]); if (a > m) m = a; }); need[i] = m > ceil ? ceil / m : 1; }
    // the lowest gain needed anywhere in the next `look` samples (a sliding minimum)
    const minAhead = new Float32Array(n), dq = []; let h = 0;
    for (let i = n - 1; i >= 0; i--) {
      while (dq.length > h && need[dq[dq.length - 1]] >= need[i]) dq.pop();
      dq.push(i); while (dq[h] > i + look) h++;
      minAhead[i] = need[dq[h]];
    }
    const out = inPlace ? channels : channels.map(() => new Float32Array(n)); let g = 1;
    for (let i = 0; i < n; i++) {
      const target = minAhead[i];
      g = target < g ? g - (g - target) / Math.max(1, look / 2) : relC * g + (1 - relC) * target;
      if (g > need[i]) g = need[i];   // never let a sample through above the ceiling
      channels.forEach((c, k) => { out[k][i] = c[i] * g; });
    }
    return out;
  }
  /* the whole master: glue, gain to the target loudness, limiter (looped until the true peak is under the ceiling).
     o.owned: the channels may be used as working space (the mastering worker owns its copies), which keeps a long
     song's master to a few copies of the song in memory. */
  function master(channels, sr, o) {
    o = o || {};
    const T = TARGETS[o.target] || TARGETS.stream, ceiling = o.ceiling === undefined ? -1 : o.ceiling;
    const before = loudness(channels, sr);
    if (!T.lufs || !Number.isFinite(before)) return { channels: o.owned ? channels : channels.map(c => c.slice()), lufs: before, before, tp: dB(truePeak(channels)), gainDb: 0, target: o.target || 'off' };
    const glued = o.glue === false ? (o.owned ? channels : channels.map(c => c.slice())) : glue(channels, sr, { inPlace: !!o.owned });
    let gainDb = Math.max(-24, Math.min(24, T.lufs - loudness(glued, sr))), y = null;
    const z = glued.map(c => new Float32Array(c.length));   // the working copy, filled again for each try
    // the limiter takes a little loudness away from peaky mixes: measure and add it back (a few rounds)
    for (let round = 0; round < 4; round++) {
      const g = Math.pow(10, gainDb / 20);
      let lim = ceiling - 0.3;
      for (let k = 0; k < 4; k++) {
        glued.forEach((c, ch) => { const r = z[ch]; for (let i = 0; i < c.length; i++) r[i] = c[i] * g; });
        limiter(z, sr, lim, true);
        const tp = dB(truePeak(z));
        if (tp <= ceiling + 0.05 || k === 3) break;
        lim -= (tp - ceiling) + 0.1;
      }
      y = z;
      const got = loudness(y, sr);
      if (Math.abs(got - T.lufs) < 0.3 || gainDb >= 24) break;
      gainDb = Math.min(24, gainDb + (T.lufs - got));
    }
    return { channels: y, lufs: loudness(y, sr), before, tp: dB(truePeak(y)), gainDb, target: o.target || 'stream' };
  }
  return { TARGETS, kWeight, loudness, truePeak, glue, limiter, master, dB };
})();
if (typeof module !== 'undefined') module.exports = Mastering;
