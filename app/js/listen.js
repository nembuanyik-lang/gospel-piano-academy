'use strict';
/* ---------------------------------------------------------------- listening to a real instrument
   MicChords listens through the microphone and recognises which chord is sounding, so a guitar
   (or an acoustic piano) can be checked like the MIDI keyboard. Method: a frequency spectrum every
   tenth of a second is folded into the 12 pitch classes (a "chroma"), then compared with the notes
   of each candidate chord. A chord counts as heard when it is the best match for several frames in a row.
   Works best in a quiet room with the instrument close to the computer. */
const MicChords = (function () {
  let ctx = null, stream = null, an = null, buf = null, iv = null;
  const TRIADS = [];
  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].forEach(r => { TRIADS.push({ name: r, pcs: E.chordPcs(r, 'major') }, { name: r + 'm', pcs: E.chordPcs(r, 'minor') }); });
  const shapePcs = name => [...new Set(GCH[name].map((fr, i) => (fr < 0 ? -1 : (GSTR[i] + fr) % 12)).filter(p => p >= 0))];
  function candidates(extra) {
    const list = TRIADS.slice();
    Object.keys(GCH).forEach(n => { if (!list.some(c => c.name === n)) list.push({ name: n, pcs: shapePcs(n) }); });
    (extra || []).forEach(c => { if (!list.some(x => x.name === c.name)) list.push(c); });
    return list;
  }
  function chroma() {
    an.getFloatFrequencyData(buf);
    const sr = ctx.sampleRate, n = an.fftSize, c = new Array(12).fill(0);
    let energy = 0;
    for (let i = 1; i < buf.length; i++) {
      const f = i * sr / n;
      if (f < 70) continue; if (f > 1400) break;
      const db = buf[i]; if (db < -80) continue;
      const mag = Math.pow(10, db / 20), midi = 69 + 12 * Math.log2(f / 440), near = Math.round(midi);
      const w = Math.max(0, 1 - Math.abs(midi - near) * 2.5);      // only energy close to a real note counts
      c[((near % 12) + 12) % 12] += mag * w; energy += mag;
    }
    const max = Math.max.apply(null, c);
    return { c: max > 0 ? c.map(x => x / max) : c, energy };
  }
  /* cosine similarity between the chroma and a chord's notes; notes outside the chord count against it */
  function score(ch, pcs) {
    let dot = 0, nn = 0, tt = 0;
    for (let p = 0; p < 12; p++) { const t = pcs.indexOf(p) >= 0 ? 1 : 0; dot += ch[p] * t; nn += ch[p] * ch[p]; tt += t; }
    return nn && tt ? dot / Math.sqrt(nn * tt) : 0;
  }
  function rank(frame, list) { return list.map(c => ({ name: c.name, s: score(frame.c, c.pcs) })).sort((a, b) => b.s - a.s); }
  return {
    supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext)),
    get on() { return !!iv; },
    shapePcs, candidates, score, rank,
    async start(onFrame) {
      this.stop();
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC(); const src = ctx.createMediaStreamSource(stream);
      an = ctx.createAnalyser(); an.fftSize = 8192; an.smoothingTimeConstant = 0.5; src.connect(an);
      buf = new Float32Array(an.frequencyBinCount);
      iv = setInterval(() => { try { onFrame(chroma()); } catch (e) { console.error(e); } }, 100);
    },
    stop() {
      if (iv) { clearInterval(iv); iv = null; }
      if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
      if (ctx) { try { ctx.close(); } catch (e) { /* ignore */ } ctx = null; }
    }
  };
})();

/* Watches the microphone for a sequence of chords: calls onHeard(name) when the expected chord has been
   the clear best match for about 0.3 seconds. ENERGY is the quietest strum that counts. */
function chordWatcher(list, onHeard, onLevel) {
  const ENERGY = 0.02, NEED = 3;
  let streak = 0, last = null;
  const cands = MicChords.candidates();
  return frame => {
    if (onLevel) onLevel(frame.energy);
    if (frame.energy < ENERGY) { streak = 0; return; }
    const r = MicChords.rank(frame, cands), best = r[0], want = list();
    if (!best || best.s < 0.72) { streak = 0; return; }
    // accept the expected chord when it is the best match or within a hair of it (shapes can share notes)
    const hit = want.find(w => w === best.name || (r.find(x => x.name === w) || { s: 0 }).s >= best.s - 0.015);
    if (hit) { streak = hit === last ? streak + 1 : 1; last = hit; if (streak >= NEED) { streak = 0; onHeard(hit); } }
    else { streak = 0; last = null; }
  };
}
