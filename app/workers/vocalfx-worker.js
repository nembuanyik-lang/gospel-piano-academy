'use strict';
/* runs the vocal chain and the mastering away from the screen, so the app stays responsive while long audio is processed */
importScripts('../js/vocalfx.js', '../js/mastering.js', '../js/pitch.js', '../js/looptools.js', '../js/pitchfix.js');
self.onmessage = e => {
  const { id, op } = e.data;
  try {
    if (op === 'master') {
      const r = Mastering.master(e.data.channels, e.data.sr, Object.assign({}, e.data.o || {}, { owned: true }));   // the copies sent here are the worker's own
      self.postMessage({ id, r: { lufs: r.lufs, before: r.before, tp: r.tp, gainDb: r.gainDb, target: r.target }, channels: r.channels }, r.channels.map(c => c.buffer));
      return;
    }
    const { pcm, sr, preset, o } = e.data;
    if (o && o.profile) o.profile = { sr: o.profile.sr, bins: Float32Array.from(o.profile.bins) };
    const y = VocalFX.chain(pcm, sr, preset, o || {});
    self.postMessage({ id, y }, [y.buffer]);
  } catch (err) { self.postMessage({ id, error: String(err && err.message || err) }); }
};
