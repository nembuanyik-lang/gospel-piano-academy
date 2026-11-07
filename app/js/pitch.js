'use strict';
/* ---------------------------------------------------------------- pitch tracking for the voice
   YIN (de Cheveigné and Kawahara, 2002): the cumulative-mean-normalised difference function finds the
   period of a single voice; parabolic interpolation gives sub-sample accuracy (well under 5 cents).
   A loudness gate ignores silence and breath noise, and a short median removes single-frame octave slips.
   Works from about 65 Hz (C2, a low bass) to 1250 Hz (D♯6, a high soprano). Pure functions are also
   exported for Node tests. */
const Pitch = (() => {
  const MIN_HZ = 65, MAX_HZ = 1250;
  /* returns { hz, clarity } or null for one frame of samples */
  function yin(buf, sr, threshold) {
    threshold = threshold || 0.12;
    const tauMin = Math.floor(sr / MAX_HZ), tauMax = Math.min(Math.floor(sr / MIN_HZ), Math.floor(buf.length / 2));
    const W = buf.length - tauMax;
    if (W < 64) return null;
    const d = new Float32Array(tauMax + 1);
    for (let tau = 1; tau <= tauMax; tau++) {
      let sum = 0;
      for (let i = 0; i < W; i++) { const x = buf[i] - buf[i + tau]; sum += x * x; }
      d[tau] = sum;
    }
    // cumulative mean normalised difference
    const c = new Float32Array(tauMax + 1); c[0] = 1; let run = 0;
    for (let tau = 1; tau <= tauMax; tau++) { run += d[tau]; c[tau] = run > 0 ? d[tau] * tau / run : 1; }
    let tau = -1;
    for (let t = Math.max(2, tauMin); t <= tauMax; t++) {
      if (c[t] < threshold) { while (t + 1 <= tauMax && c[t + 1] < c[t]) t++; tau = t; break; }
    }
    if (tau < 0) return null;
    // parabolic interpolation around the minimum
    let better = tau;
    if (tau > 1 && tau < tauMax) {
      const a = c[tau - 1], b = c[tau], e = c[tau + 1], den = a + e - 2 * b;
      if (den !== 0) better = tau + (a - e) / (2 * den);
    }
    const hz = sr / better;
    if (hz < MIN_HZ || hz > MAX_HZ) return null;
    return { hz, clarity: 1 - c[tau] };
  }
  const rms = buf => { let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); };
  const hzToMidi = hz => 69 + 12 * Math.log2(hz / 440);
  const midiToHz = m => 440 * Math.pow(2, (m - 69) / 12);
  /* cents from the nearest octave of a target, so a man singing a woman's line an octave lower still scores */
  function centsToTarget(midiF, target, octaveFree) {
    let c = (midiF - target) * 100;
    if (octaveFree) { while (c > 600) c -= 1200; while (c < -600) c += 1200; }
    return c;
  }
  const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

  /* live tracker on the microphone: calls onFrame({ midi, hz, clarity, level, t }) about 40 times a second
     (midi null when no clear pitch). Uses music settings: no echo cancellation, no automatic gain. */
  function track(onFrame, opts) {
    opts = opts || {};
    let stream = null, src = null, an = null, raf = null, stopped = false, hist = [], gate = opts.gate || 0.008, lastStable = null, jumps = 0;
    const ctx = Snd.ensure();
    const loop = () => {
      if (stopped) return;
      raf = requestAnimationFrame(loop);
      if (!an) return;
      const buf = new Float32Array(an.fftSize); an.getFloatTimeDomainData(buf);
      const lvl = rms(buf), t = ctx.currentTime;
      let midi = null, hz = null, clarity = 0;
      if (lvl > gate) {
        const r = yin(buf, ctx.sampleRate);
        if (r && r.clarity > 0.8) { hz = r.hz; clarity = r.clarity; midi = hzToMidi(hz); }
      }
      hist.push(midi); if (hist.length > 5) hist.shift();
      const valid = hist.filter(x => x !== null);
      // median of the last frames: removes single-frame octave slips; needs 3 of 5 voiced frames
      const sm = valid.length >= 3 && midi !== null ? median(valid) : null;
      if (sm !== null && Math.abs(sm - midi) > 1) midi = sm;
      // a lone octave jump (a common pitch-tracking slip) is replaced by the note just before it
      // (only for a moment: a real leap of an octave, held for three frames or more, is accepted)
      if (midi !== null && lastStable !== null && Math.abs(Math.abs(midi - lastStable) - 12) < 0.6 && jumps < 3) { jumps++; midi = lastStable; }
      else { jumps = 0; lastStable = midi; }
      onFrame({ midi, hz: midi === null ? null : midiToHz(midi), clarity, level: lvl, t });
    };
    (async () => {
      try { stream = await openMic(opts.deviceId); }
      catch (e) { stopped = true; if (opts.onError) opts.onError(e); return; }
      if (stopped) { stream.getTracks().forEach(tr => tr.stop()); return; }
      src = ctx.createMediaStreamSource(stream);
      an = ctx.createAnalyser(); an.fftSize = 2048; src.connect(an);
      if (opts.onReady) opts.onReady((stream.getAudioTracks()[0] || {}).label || '');
    })();
    loop();
    return {
      setGate(g) { gate = g; },
      stop() { stopped = true; cancelAnimationFrame(raf); try { if (src) src.disconnect(); } catch (e) { /* ignore */ } if (stream) stream.getTracks().forEach(tr => tr.stop()); }
    };
  }
  return { yin, rms, hzToMidi, midiToHz, centsToTarget, median, track, MIN_HZ, MAX_HZ };
})();
if (typeof module !== 'undefined') module.exports = Pitch;
