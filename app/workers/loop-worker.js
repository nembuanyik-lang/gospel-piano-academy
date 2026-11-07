'use strict';
/* time-stretching and transposing loops away from the screen */
importScripts('../js/looptools.js');
self.onmessage = e => {
  const { id, channels, sr, from, to, semis } = e.data;
  try { const out = LoopTools.fit(channels, sr, from, to, semis); self.postMessage({ id, out }, out.map(c => c.buffer)); }
  catch (err) { self.postMessage({ id, error: String(err && err.message || err) }); }
};
