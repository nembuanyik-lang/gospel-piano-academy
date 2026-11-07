'use strict';
/* ---------------------------------------------------------------- the vocal chain (studio processing for a recorded voice)
   Applied after recording, so the original take is never changed (switch it off, or change the preset, at any time):
     low-cut (rumble, hum, air conditioning) -> noise reduction (learned from the room's silence) -> EQ (less mud,
     more presence and air) -> compressor (even level) -> de-esser (softer "s" and "sh") -> limiter -> reverb (the
     app's modelled rooms) -> level.
   Also: a level and room check with plain advice, the timing of the microphone measured from clicks, and putting
   the best parts of several takes together (comping). Everything except the reverb is plain JavaScript on sample
   arrays, so it runs the same in tests (Node) and in the app; the reverb uses the browser's audio engine. */
const VocalFX = (() => {
  const dB = x => 20 * Math.log10(Math.max(1e-9, x));
  const fromDb = d => Math.pow(10, d / 20);

  /* ---- presets ---- */
  const PRESETS = {
    off: { label: 'Off (the raw recording)' },
    natural: { label: 'Natural', hint: 'Clean and honest: a light touch of everything.', hpf: 70, nr: 0.3, eq: [['peaking', 250, -1.5, 1]],
      comp: { thr: -18, ratio: 2, atk: 0.012, rel: 0.14 }, deess: 0.3, room: 'room', wet: 0.12 },
    worship: { label: 'Worship lead', hint: 'Forward and clear over a full band, with a church around it.', hpf: 90, nr: 0.5,
      eq: [['peaking', 300, -2.5, 1], ['peaking', 3200, 3, 0.9], ['highshelf', 10000, 2.5, 0.7]], comp: { thr: -22, ratio: 3.5, atk: 0.006, rel: 0.1 }, deess: 0.6, room: 'church', wet: 0.22 },
    ballad: { label: 'Warm ballad', hint: 'Close and warm, for slow songs and soft moments.', hpf: 75, nr: 0.45,
      eq: [['lowshelf', 180, 1.5, 0.7], ['peaking', 450, -1.5, 1.2], ['peaking', 2800, 1.5, 0.9], ['highshelf', 9000, 1, 0.7]], comp: { thr: -24, ratio: 3, atk: 0.01, rel: 0.16 }, deess: 0.5, room: 'hall', wet: 0.25 },
    choir: { label: 'Choir and backing voices', hint: 'Lighter and brighter, set back in the room so it blends.', hpf: 110, nr: 0.45,
      eq: [['peaking', 250, -3, 1], ['peaking', 4000, 1.5, 1], ['highshelf', 8000, 2, 0.7]], comp: { thr: -16, ratio: 2.5, atk: 0.015, rel: 0.18 }, deess: 0.5, room: 'church', wet: 0.3 },
    speech: { label: 'Speaking and preaching', hint: 'Clear words: strong noise reduction and steady level, little room.', hpf: 100, nr: 0.7,
      eq: [['peaking', 250, -2, 1], ['peaking', 2500, 2.5, 1]], comp: { thr: -24, ratio: 4, atk: 0.005, rel: 0.12 }, deess: 0.5, room: 'room', wet: 0.06 }
  };
  const NR_LEVELS = { preset: null, off: 0, light: 0.3, medium: 0.55, strong: 0.8 };

  /* ---- biquad filters (Robert Bristow-Johnson's cookbook), run over a whole array ---- */
  function biquad(x, sr, type, f, gainDb, q) {
    const A = Math.pow(10, (gainDb || 0) / 40), w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, cs = Math.cos(w), sn = Math.sin(w), Q = q || 0.707, al = sn / (2 * Q);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'highpass') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else if (type === 'lowpass') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else if (type === 'peaking') { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }
    else if (type === 'lowshelf' || type === 'highshelf') {
      const s = 2 * Math.sqrt(A) * al, sg = type === 'lowshelf' ? 1 : -1;
      b0 = A * ((A + 1) - sg * (A - 1) * cs + s); b1 = sg * 2 * A * ((A - 1) - sg * (A + 1) * cs); b2 = A * ((A + 1) - sg * (A - 1) * cs - s);
      a0 = (A + 1) + sg * (A - 1) * cs + s; a1 = -sg * 2 * ((A - 1) + sg * (A + 1) * cs); a2 = (A + 1) + sg * (A - 1) * cs - s;
    } else return x.slice();
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const v = x[i], o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = o; y[i] = o; }
    return y;
  }
  const highpass = (x, sr, f) => biquad(biquad(x, sr, 'highpass', f, 0, 0.54), sr, 'highpass', f, 0, 1.31);   // 4th order (24 dB/octave)

  /* ---- FFT (radix 2, in place) ---- */
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
  const N = 2048, HOP = 512;
  const HANN = (() => { const w = new Float32Array(N); for (let i = 0; i < N; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N); return w; })();
  function frames(x, fn) {   // calls fn(mag, re, im, frameIndex) for each windowed frame
    const re = new Float32Array(N), im = new Float32Array(N), mag = new Float32Array(N / 2 + 1);
    let k = 0;
    for (let s = -N + HOP; s < x.length; s += HOP, k++) {
      for (let i = 0; i < N; i++) { const j = s + i; re[i] = j >= 0 && j < x.length ? x[j] * HANN[i] : 0; im[i] = 0; }
      fft(re, im);
      for (let b = 0; b <= N / 2; b++) mag[b] = Math.hypot(re[b], im[b]);
      fn(mag, re, im, k, s);
    }
  }
  /* the room's noise, bin by bin: from a stretch of silence, or (when there is none) estimated from the quietest
     moments of the take itself (the 10th percentile of each frequency over time) */
  function noiseProfile(x, sr, fromSilence) {
    const nb = N / 2 + 1, prof = new Float32Array(nb);
    if (fromSilence) { let n = 0; frames(x, mag => { for (let b = 0; b < nb; b++) prof[b] += mag[b]; n++; }); for (let b = 0; b < nb; b++) prof[b] /= Math.max(1, n); return { sr, bins: prof }; }
    const all = []; frames(x, mag => all.push(mag.slice()));
    if (!all.length) return { sr, bins: prof };
    // frames sorted by loudness; the quietest tenth (at least 4 frames) describe the noise
    const loud = all.map((m, i) => [m.reduce((a, v) => a + v * v, 0), i]).sort((a, b) => a[0] - b[0]);
    const q = loud.slice(0, Math.max(4, Math.floor(loud.length * 0.1))).map(x2 => all[x2[1]]);
    for (let b = 0; b < nb; b++) { let s = 0; q.forEach(m => { s += m[b]; }); prof[b] = s / q.length; }
    return { sr, bins: prof };
  }
  /* spectral noise reduction: each frequency is turned down when it is near the noise, with smoothing over time
     and frequency so it does not "warble" (amount 0..1) */
  function denoise(x, sr, profile, amount) {
    if (!amount || !profile) return x.slice();
    const nb = N / 2 + 1, noise = profile.bins, over = 1.5 + 3 * amount, floor = fromDb(-6 - 20 * amount);
    const out = new Float32Array(x.length + N), norm = new Float32Array(x.length + N), prev = new Float32Array(nb).fill(1), g = new Float32Array(nb), pw = new Float32Array(nb);
    let first = true;
    frames(x, (mag, re, im, k, s) => {
      // the power of each frequency, smoothed over neighbouring bins and over time, so random noise peaks are not mistaken for voice
      for (let b = 0; b < nb; b++) { const a = mag[Math.max(0, b - 1)], c = mag[b], d = mag[Math.min(nb - 1, b + 1)], m = (a * a + 2 * c * c + d * d) / 4; pw[b] = first ? m : 0.4 * pw[b] + 0.6 * m; }
      first = false;
      for (let b = 0; b < nb; b++) {
        const m2 = pw[b], n2 = noise[b] * noise[b] * over;
        let gain = m2 > 1e-20 ? Math.max(0, (m2 - n2) / m2) : 0; gain = Math.max(floor, Math.sqrt(gain));
        // fast to open, slower to close: keeps the ends of notes and avoids flicker
        g[b] = gain > prev[b] ? gain : prev[b] * 0.55 + gain * 0.45;
      }
      for (let b = 0; b < nb; b++) { const sm = (g[Math.max(0, b - 1)] + 2 * g[b] + g[Math.min(nb - 1, b + 1)]) / 4; prev[b] = g[b]; re[b] *= sm; im[b] *= sm; if (b > 0 && b < N / 2) { re[N - b] = re[b]; im[N - b] = -im[b]; } }
      // inverse FFT (conjugate trick)
      for (let i = 0; i < N; i++) im[i] = -im[i];
      fft(re, im);
      for (let i = 0; i < N; i++) { const j = s + i + N; if (j >= N && j - N < x.length) { out[j] += (re[i] / N) * HANN[i]; norm[j] += HANN[i] * HANN[i]; } }
    });
    const y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) { const nn = norm[i + N]; y[i] = nn > 1e-6 ? out[i + N] / nn : 0; }
    return y;
  }
  /* compressor: smooth level detector, soft knee, automatic make-up gain */
  function compress(x, sr, c) {
    const atk = Math.exp(-1 / (sr * c.atk)), rel = Math.exp(-1 / (sr * c.rel)), knee = 6, y = new Float32Array(x.length);
    const makeup = fromDb(-(c.thr * (1 - 1 / c.ratio)) * 0.5);
    let env = 0;
    for (let i = 0; i < x.length; i++) {
      const a = Math.abs(x[i]); env = a > env ? atk * env + (1 - atk) * a : rel * env + (1 - rel) * a;
      const lv = dB(env), over = lv - c.thr;
      let red = 0;
      if (over > knee / 2) red = over * (1 - 1 / c.ratio);
      else if (over > -knee / 2) red = (1 - 1 / c.ratio) * Math.pow(over + knee / 2, 2) / (2 * knee);
      y[i] = x[i] * fromDb(-red) * makeup;
    }
    return y;
  }
  /* de-esser: when the band above 5.5 kHz takes over from the voice (an "s"), that band is turned down */
  function deess(x, sr, amount) {
    if (!amount) return x.slice();
    // zero-phase (forward and backward) so the voice minus this band is exactly the rest of the voice
    const rev = a => { const r = new Float32Array(a.length); for (let i = 0; i < a.length; i++) r[i] = a[a.length - 1 - i]; return r; };
    const hb = rev(biquad(rev(biquad(x, sr, 'highpass', 5500, 0, 0.7)), sr, 'highpass', 5500, 0, 0.7));
    const fa = Math.exp(-1 / (sr * 0.001)), fr = Math.exp(-1 / (sr * 0.06));
    let eh = 0, ef = 0; const y = new Float32Array(x.length), k = 0.55 - 0.3 * amount, most = fromDb(-4 - 10 * amount);
    for (let i = 0; i < x.length; i++) {
      const h = Math.abs(hb[i]), f = Math.abs(x[i]);
      eh = h > eh ? fa * eh + (1 - fa) * h : fr * eh + (1 - fr) * h;
      ef = f > ef ? fa * ef + (1 - fa) * f : fr * ef + (1 - fr) * f;
      let gn = 1; if (eh > k * ef && eh > 1e-4) gn = Math.max(most, (k * ef) / eh);
      y[i] = x[i] - hb[i] * (1 - gn);
    }
    return y;
  }
  /* a look-ahead-free peak limiter, then the take is set to a healthy peak level */
  function limit(x, ceiling) {
    const c = ceiling || fromDb(-1), y = new Float32Array(x.length); let g = 1; const rel = 0.9995;
    for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]) * g; if (a > c) g = c / Math.abs(x[i]); y[i] = x[i] * g; g = Math.min(1, g / rel); }
    return y;
  }
  function peakOf(x) { let p = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > p) p = a; } return p; }
  function rmsOf(x) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, x.length)); }
  function normalize(x, target) { const p = peakOf(x); if (p < 1e-6) return x; const g = (target || fromDb(-1)) / p; for (let i = 0; i < x.length; i++) x[i] *= g; return x; }

  /* the whole chain, without the reverb (pure) */
  function chain(x, sr, presetId, o) {
    o = o || {};
    const p = PRESETS[presetId]; if (!p || presetId === 'off') return x.slice();
    const nr = o.nr !== undefined && o.nr !== null ? o.nr : p.nr;
    let y = highpass(x, sr, p.hpf);
    if (nr > 0) y = denoise(y, sr, o.profile || noiseProfile(y, sr, false), nr);
    (p.eq || []).forEach(([t, f, g, q]) => { y = biquad(y, sr, t, f, g, q); });
    y = compress(y, sr, p.comp);
    y = deess(y, sr, p.deess);
    y = limit(normalize(y, fromDb(-0.5)), fromDb(-1));
    return y;
  }

  /* ---- level and room check: plain advice ---- */
  function levelAdvice(m) {
    // m: { noiseDb (the room, quiet), peakDb and rmsDb (singing the loudest line), clipped (fraction of samples at full scale) }
    const out = { ok: true, lines: [] }, snr = m.rmsDb - m.noiseDb;
    if (m.clipped > 0.0005 || m.peakDb > -0.5) { out.ok = false; out.level = 'too loud'; out.lines.push('Too loud: the sound is distorting (clipping). Turn the gain knob on your audio interface down (or the microphone volume in Windows), or step back a little, then check again.'); }
    else if (m.peakDb < -24) { out.ok = false; out.level = 'too quiet'; out.lines.push('Too quiet. Turn the gain knob on your audio interface up (or the microphone volume in Windows), or come closer: about a hand-width from the microphone.'); }
    else if (m.peakDb < -12) { out.level = 'a little quiet'; out.lines.push('A little quiet. Turn the gain up a bit so your loudest line peaks around the middle of the yellow zone.'); }
    else if (m.peakDb > -3) { out.level = 'a little hot'; out.lines.push('Good, but close to the top. Turn the gain down a touch to leave room for your loudest moments.'); }
    else { out.level = 'good'; out.lines.push('Your level is good: your loudest line peaks between −12 and −3 dB.'); }
    if (m.noiseDb > -45) { out.ok = false; out.lines.push('The room is noisy (' + Math.round(m.noiseDb) + ' dB). Turn off fans or air conditioning, close the window, and keep the computer\'s fan away from the microphone. The noise reduction will help, but a quiet room helps more.'); }
    else if (m.noiseDb > -58) out.lines.push('The room is a little noisy (' + Math.round(m.noiseDb) + ' dB); the noise reduction will clean it.');
    else out.lines.push('The room is quiet (' + Math.round(m.noiseDb) + ' dB). Very good.');
    if (snr < 20 && m.peakDb > -24) { out.ok = false; out.lines.push('Your voice is only ' + Math.round(snr) + ' dB above the room. Sing closer to the microphone.'); }
    out.snr = snr;
    return out;
  }
  function measure(x) { const p = peakOf(x); let clip = 0; for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) >= 0.989) clip++; return { peakDb: dB(p), rmsDb: dB(rmsOf(x)), clipped: clip / Math.max(1, x.length) }; }

  /* ---- timing: where each click was heard in a recording ----
     pcm starts at time t0 (seconds on the audio clock); clicks are the times they were sent. Returns the median delay
     (seconds) and how many clicks were heard, or null. */
  function clickLatency(pcm, sr, t0, clicks, o) {
    o = o || {};
    const win = Math.round(sr * 0.002), hop = Math.round(sr * 0.0005), e = [];
    for (let i = 0; i + win < pcm.length; i += hop) { let s = 0; for (let j = 0; j < win; j++) s += pcm[i + j] * pcm[i + j]; e.push(Math.sqrt(s / win)); }
    const sorted = e.slice().sort((a, b) => a - b), floor = sorted[Math.floor(sorted.length * 0.3)] || 0;
    const delays = [];
    clicks.forEach(ct => {
      const from = Math.max(0, Math.floor(((ct - t0) + (o.min || -0.05)) * sr / hop)), to = Math.min(e.length - 1, Math.floor(((ct - t0) + (o.max || 0.5)) * sr / hop));
      let peak = 0; for (let k = from; k <= to; k++) peak = Math.max(peak, e[k]);
      if (peak < Math.max(floor * 6, 0.004)) return;
      const thr = floor + (peak - floor) * 0.3;
      for (let k = from; k <= to; k++) if (e[k] >= thr) { delays.push(k * hop / sr + t0 - ct); break; }
    });
    if (delays.length < Math.ceil(clicks.length / 2)) return null;
    const d = delays.slice().sort((a, b) => a - b), med = d[d.length >> 1];
    const spread = d.map(v => Math.abs(v - med)).sort((a, b) => a - b)[d.length >> 1];
    return { latency: med, heard: delays.length, spread };
  }

  /* ---- comping: the song's parts each come from the chosen take, joined with short crossfades ----
     takes: [Float32Array]; parts: [{ start, end } in seconds]; pick: index of the take for each part (or -1 = main) */
  function comp(takes, main, parts, pick, sr) {
    const len = Math.max.apply(null, takes.map(t => t.length)), out = new Float32Array(len), fade = Math.round(sr * 0.015);
    const src = new Int16Array(len).fill(main);
    parts.forEach((p, i) => { const k = pick[i]; if (k === undefined || k < 0 || !takes[k]) return; const a = Math.max(0, Math.round(p.start * sr)), b = Math.min(len, Math.round(p.end * sr)); for (let j = a; j < b; j++) src[j] = k; });
    const at = (k, j) => (takes[k] && j < takes[k].length ? takes[k][j] : 0);
    for (let j = 0; j < len; j++) out[j] = at(src[j], j);
    // crossfade at each change of take
    for (let j = 1; j < len; j++) if (src[j] !== src[j - 1]) {
      const A = src[j - 1], B = src[j];
      for (let f = -fade; f < fade; f++) { const q = j + f; if (q < 0 || q >= len) continue; const w = (f + fade) / (2 * fade); out[q] = at(A, q) * Math.cos(w * Math.PI / 2) + at(B, q) * Math.sin(w * Math.PI / 2); }
    }
    return out;
  }

  /* ---- in the browser: the reverb, and the live chain for hearing yourself while recording ---- */
  async function withRoom(y, sr, presetId) {
    const p = PRESETS[presetId];
    if (!p || !p.wet || typeof OfflineAudioContext === 'undefined' || typeof Snd === 'undefined') return { channels: [y], sr };
    const tail = Math.round(sr * 2.5), c = new OfflineAudioContext(2, y.length + tail, sr);
    const b = c.createBuffer(1, y.length, sr); b.getChannelData(0).set(y);
    const s = c.createBufferSource(); s.buffer = b;
    const dry = c.createGain(); dry.gain.value = 1; s.connect(dry); dry.connect(c.destination);
    const ir = Snd.impulse(c, p.room);
    if (ir) { const cv = c.createConvolver(); cv.buffer = ir; const wet = c.createGain(); wet.gain.value = p.wet; s.connect(cv); cv.connect(wet); wet.connect(c.destination); }
    s.start(0);
    const r = await c.startRendering(), L = r.getChannelData(0), R = r.getChannelData(1);
    const pk = Math.max(peakOf(L), peakOf(R)), g = pk > 0.97 ? 0.97 / pk : 1;
    if (g !== 1) for (let i = 0; i < L.length; i++) { L[i] *= g; R[i] *= g; }
    return { channels: [L, R], sr };
  }
  function liveChain(ctx, presetId, o) {
    o = o || {};
    const p = PRESETS[presetId] && presetId !== 'off' ? PRESETS[presetId] : PRESETS.natural;
    const input = ctx.createGain(), output = ctx.createGain(); output.gain.value = 0.9;
    let node = input;
    const add = n => { node.connect(n); node = n; };
    [0.54, 1.31].forEach(q => { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = p.hpf; f.Q.value = q; add(f); });
    (p.eq || []).forEach(([t, f, g, q]) => { const b = ctx.createBiquadFilter(); b.type = t; b.frequency.value = f; b.gain.value = g; if (t === 'peaking') b.Q.value = q; add(b); });
    const cmp = ctx.createDynamicsCompressor(); cmp.threshold.value = p.comp.thr; cmp.ratio.value = p.comp.ratio; cmp.attack.value = p.comp.atk; cmp.release.value = p.comp.rel; cmp.knee.value = 6; add(cmp);
    const mk = ctx.createGain(); mk.gain.value = fromDb(-(p.comp.thr * (1 - 1 / p.comp.ratio)) * 0.4); add(mk);
    node.connect(output);
    if (p.wet && o.room !== false && typeof Snd !== 'undefined') { const ir = Snd.impulse(ctx, p.room); if (ir) { const cv = ctx.createConvolver(), w = ctx.createGain(); cv.buffer = ir; w.gain.value = p.wet; node.connect(cv); cv.connect(w); w.connect(output); } }
    return { input, output };
  }

  /* the chain in a background worker (falls back to running here if workers are not available) */
  let worker = null, seq = 0, idleT = 0; const waiting = new Map();
  /* the worker is let go a few seconds after its last job, so the memory it used goes straight back to the computer
     (a worker keeps its working memory until it is closed); the next job starts a fresh one */
  function idle() { clearTimeout(idleT); idleT = setTimeout(() => { if (worker && !waiting.size) { worker.terminate(); worker = null; } }, 3000); }
  function chainAsync(x, sr, presetId, o) {
    if (typeof Worker === 'undefined' || worker === false) return Promise.resolve(chain(x, sr, presetId, o));
    try {
      if (!worker) {
        worker = new Worker('workers/vocalfx-worker.js');
        worker.onmessage = e => { const w = waiting.get(e.data.id); if (!w) return; waiting.delete(e.data.id); idle(); if (e.data.error) w.fail(); else w.ok(e.data.r ? { r: e.data.r, channels: e.data.channels } : e.data.y); };
        worker.onerror = () => { worker = false; waiting.forEach(w => w.fail()); waiting.clear(); };
      }
      const id = ++seq, copy = x.slice();
      return new Promise(res => {
        waiting.set(id, { ok: res, fail: () => res(chain(x, sr, presetId, o)) });
        const oo = Object.assign({}, o || {}); if (oo.profile) oo.profile = { sr: oo.profile.sr, bins: Array.from(oo.profile.bins) };
        worker.postMessage({ id, pcm: copy, sr, preset: presetId, o: oo }, [copy.buffer]);
      });
    } catch (e) { worker = false; return Promise.resolve(chain(x, sr, presetId, o)); }
  }

  /* mastering in the same worker: resolves { channels, lufs, before, tp, gainDb, target } */
  function masterAsync(channels, sr, o) {
    const local = () => Mastering.master(channels, sr, o);
    if (typeof Worker === 'undefined' || worker === false) return Promise.resolve(local());
    try {
      if (!worker) chainAsync(new Float32Array(1), 8000, 'off');   // starts the worker
      if (!worker) return Promise.resolve(local());
      const id = ++seq, copies = channels.map(c => c.slice());
      return new Promise(res => {
        waiting.set(id, { ok: x => res(Object.assign({ channels: x.channels }, x.r)), fail: () => res(local()) });
        worker.postMessage({ id, op: 'master', channels: copies, sr, o }, copies.map(c => c.buffer));
      });
    } catch (e) { return Promise.resolve(local()); }
  }

  return { chainAsync, masterAsync, PRESETS, NR_LEVELS, biquad, highpass, fft, noiseProfile, denoise, compress, deess, limit, normalize, chain, peakOf, rmsOf, dB, fromDb,
    levelAdvice, measure, clickLatency, comp, withRoom, liveChain, N };
})();
if (typeof module !== 'undefined') module.exports = VocalFX;
