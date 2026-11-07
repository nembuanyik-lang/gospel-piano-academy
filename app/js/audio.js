'use strict';
/* ---------------------------------------------------------------- sound */
const Snd = (function () {
  /* A piano voice built from inharmonic partials (stiff-string model), a hammer-strike spectrum and
     comb, detuned unison strings, a hammer noise burst, velocity-dependent brightness, pitch-dependent
     decay and a damper release. If recorded samples are installed (see samples/manifest.json) they are
     used instead and the synthesised voice is the fallback. */
  let ctx = null, master = null, outBus = null, noiseBuf = null, current = null, meterNode = null;
  const sample = { state: 'idle', notes: [], credit: '' };
  const live = new Map();        // midi -> voice held by a key
  const sustained = new Set();   // voices whose key is up but the pedal holds them
  let pedalDown = false;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- the room: a modelled stereo impulse response (not a recording of a real building) ----------
     Early reflections from the walls (discrete echoes in the first 90 ms, different on each side), then a
     dense tail that dies away over the room's reverberation time (RT60) and loses its highs as it decays,
     as sound does in a real hall (air and soft surfaces absorb high frequencies first). */
  const ROOMS = {
    off: { label: 'Dry (no room)', wet: 0 },
    room: { label: 'Studio room', wet: 0.13, rt: 0.85, pre: 0.006, er: 0.5, damp: 5200, dampEnd: 2600, width: 0.6 },
    church: { label: 'Church', wet: 0.24, rt: 2.6, pre: 0.024, er: 0.65, damp: 6000, dampEnd: 1500, width: 0.9 },
    hall: { label: 'Large hall', wet: 0.2, rt: 1.9, pre: 0.018, er: 0.55, damp: 7000, dampEnd: 2200, width: 0.85 }
  };
  const roomId = () => (S.prefs && ROOMS[S.prefs.room] ? S.prefs.room : 'church');
  function rng(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function makeImpulse(c, kind) {
    const R = ROOMS[kind] || ROOMS.room, sr = c.sampleRate;
    if (!R.rt) return null;
    const len = Math.floor(sr * (R.pre + R.rt * 1.15)), buf = c.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch), rnd = rng(1234 + ch * 777), pre = Math.floor(R.pre * sr);
      // early reflections: 14 echoes between 7 and 90 ms, quieter the later they come
      for (let k = 0; k < 14; k++) {
        const t = 0.007 + Math.pow(rnd(), 1.4) * 0.083, i = pre + Math.floor(t * sr);
        if (i < len) d[i] += (rnd() < 0.5 ? -1 : 1) * R.er * Math.pow(10, -t * 12) * (0.6 + 0.4 * rnd());
      }
      // late tail: noise shaped by the decay (60 dB over RT60) and filtered more and more as it decays
      const k60 = 6.9078 / R.rt; let lp = 0;
      const fade = Math.floor(0.03 * sr);
      for (let i = pre; i < len; i++) {
        const t = (i - pre) / sr, fc = R.dampEnd + (R.damp - R.dampEnd) * Math.exp(-t * 2.2);
        const a = 1 - Math.exp(-2 * Math.PI * fc / sr);
        lp += a * ((rnd() * 2 - 1) - lp);
        const onset = Math.min(1, (i - pre) / fade);
        d[i] += lp * Math.exp(-k60 * t) * onset * 0.9;
      }
    }
    // narrow the stereo image for small rooms (mix a little of each side into the other)
    const L = buf.getChannelData(0), Rr = buf.getChannelData(1), w = R.width;
    for (let i = 0; i < len; i++) { const m = (L[i] + Rr[i]) / 2, sd = (L[i] - Rr[i]) / 2 * w; L[i] = m + sd; Rr[i] = m - sd; }
    // normalise the energy so every room sits at a similar level
    let e = 0; for (let i = 0; i < len; i++) e += L[i] * L[i] + Rr[i] * Rr[i];
    const nrm = 1 / Math.sqrt(Math.max(1e-9, e / 2)) * 2.2;
    for (let i = 0; i < len; i++) { L[i] *= nrm; Rr[i] *= nrm; }
    return buf;
  }
  let roomConv = null, roomWet = null;
  function roomBus(c, from, to) {   // master -> convolver -> wet -> output; returns the nodes so the room can change
    const kind = roomId(), R = ROOMS[kind];
    try {
      const conv = c.createConvolver(), wet = c.createGain();
      const ir = makeImpulse(c, kind); if (ir) conv.buffer = ir;
      wet.gain.value = ir ? R.wet : 0;
      from.connect(conv); conv.connect(wet); wet.connect(to);
      return { conv, wet };
    } catch (e) { return null; }
  }
  function setRoom(kind) {
    if (!ROOMS[kind]) return;
    S.prefs.room = kind;
    if (!ctx || !roomConv) return;
    const ir = makeImpulse(ctx, kind);
    try {
      roomWet.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      setTimeout(() => { try { if (ir) roomConv.buffer = ir; roomWet.gain.setTargetAtTime(ir ? ROOMS[kind].wet : 0, ctx.currentTime, 0.05); } catch (e) { /* ignore */ } }, 90);
    } catch (e) { /* ignore */ }
  }
  function resetContext() {   // throw the audio context away; the next sound builds a fresh one (fixes a stuck audio device)
    const old = ctx; ctx = null; master = null; outBus = null; noiseBuf = null; current = null; roomConv = null; roomWet = null;
    live.clear(); sustained.clear();
    if (old) { try { old.onstatechange = null; old.close(); } catch (e) { /* ignore */ } }
  }
  function wake() { if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') { try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } } }
  ['pointerdown', 'keydown', 'touchstart'].forEach(t => document.addEventListener(t, wake, true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  window.addEventListener('focus', wake);
  function ensure() {
    if (ctx && ctx.state === 'closed') resetContext();
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { ctx = new AC(); } catch (e2) { return null; } }
      master = ctx.createGain(); master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
      outBus = comp; comp.connect(ctx.destination);
      meterNode = ctx.createAnalyser(); meterNode.fftSize = 1024; comp.connect(meterNode);   // the master meter
      master.connect(comp);
      const rb = roomBus(ctx, master, comp);   // the room (church by default; see Profile > Sound)
      if (rb) { roomConv = rb.conv; roomWet = rb.wet; }
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      ctx.onstatechange = () => { if (ctx && ctx.state !== 'running' && !document.hidden) wake(); };
      loadSamples(); loadBank();
    }
    wake();
    return ctx;
  }

  /* ---------- optional recorded samples ---------- */
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function noteNumber(name) {
    const r = /^([A-Ga-g])(s|#|b)?(-?\d+)$/.exec(String(name)); if (!r) return null;
    return (parseInt(r[3], 10) + 1) * 12 + PC[r[1].toUpperCase()] + (r[2] === 'b' ? -1 : r[2] ? 1 : 0);
  }
  async function loadSamples() {
    if (sample.state !== 'idle') return;
    sample.state = 'loading';
    try {
      const res = await fetch('samples/manifest.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('no samples');
      const man = await res.json();
      const entries = Object.entries(man.notes || {}).filter(([n, f]) => noteNumber(n) !== null && typeof f === 'string' && !/[\\/]|\.\./.test(f));
      const out = [];
      await Promise.all(entries.map(async ([name, file]) => {
        try {
          const r = await fetch('samples/' + file); if (!r.ok) return;
          const audio = await ctx.decodeAudioData(await r.arrayBuffer());
          out.push({ m: noteNumber(name), buf: audio });
        } catch (e) { /* skip a bad file */ }
      }));
      if (out.length >= 8) { out.sort((a, b) => a.m - b.m); sample.notes = out; sample.credit = String(man.credit || ''); sample.state = 'ready'; }
      else sample.state = 'none';
    } catch (e) { sample.state = 'none'; }
    if (App.onSoundChange) App.onSoundChange();
  }
  function pickSample(m) {
    if (sample.state !== 'ready') return null;
    let best = null, bd = 99;
    for (const s of sample.notes) { const d = Math.abs(s.m - m); if (d < bd) { bd = d; best = s; } }
    return best;
  }

  /* ---------- the instrument library (a General MIDI SoundFont, see sounds/manifest.json) ----------
     When it is installed, the electric piano, guitar, strings, brass, choir, flute, church organ, the Song Lab
     bass and the drums play recorded instruments from it. The grand piano keeps its own recorded samples
     (with the library's piano as the next choice), and the gospel organ is the app's own tonewheel model. */
  const bank = { state: 'idle', sf: null, credit: '' };
  async function loadBank() {
    if (bank.state !== 'idle' || typeof SF2 === 'undefined') return;
    bank.state = 'loading';
    try {
      const res = await fetch('sounds/manifest.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('no library');
      const man = await res.json(), file = String(man.file || '');
      if (!/^[\w.-]+\.sf2$/i.test(file)) throw new Error('bad name');
      const r = await fetch('sounds/' + file); if (!r.ok) throw new Error('missing');
      bank.sf = SF2.prepare(SF2.parse(await r.arrayBuffer()));
      bank.credit = String(man.credit || ''); bank.state = 'ready';
    } catch (e) { bank.state = 'none'; bank.sf = null; }
    if (App.onSoundChange) App.onSoundChange();
  }
  const bankReady = () => bank.state === 'ready' && !!bank.sf;
  const exclusive = new WeakMap();   // per audio context: an open hi-hat is cut by the closed one
  const exclFor = c => { let m = exclusive.get(c); if (!m) { m = new Map(); exclusive.set(c, m); } return m; };
  const BANK_GAIN = 2.0;   // matches the recorded piano at the same velocity
  function bankVoice(c, v, bankNo, prog, m, when, vel, level) {
    if (!bankReady()) return false;
    let r;
    try { r = SF2.voice(c, v.vg, bank.sf, bankNo, prog, m, Math.round(vel * 127), when, level * BANK_GAIN, exclFor(c)); } catch (e) { return false; }
    if (!r.count) return false;
    r.nodes.forEach(n => v.nodes.push(n));
    v.rel = clamp(r.rel / 6, 0.03, 1.4);   // SoundFont release time is to silence; the release below uses a time constant
    return true;
  }
  /* drums from the library: the Song Lab's kick, snare, hi-hats and rim on the standard kit */
  const DRUM_KEYS = { k: 36, s: 38, h: 42, o: 46, r: 37, cl: 39, c: 49, th: 50, tm: 47, tl: 43 };
  function bankDrum(c, when, type, vel, dest) {
    if (!bankReady() || !DRUM_KEYS[type]) return false;
    try {
      const g = c.createGain(); g.connect(dest);
      const r = SF2.voice(c, g, bank.sf, 128, 0, DRUM_KEYS[type], Math.round(clamp(vel || 0.7, 0.05, 1) * 127), when, 0.9 * BANK_GAIN, exclFor(c));
      if (!r.count) { g.disconnect(); return false; }
      r.nodes.forEach(n => { try { n.stop(when + 4); } catch (e) { /* ignore */ } });
      g.gain.setValueAtTime(1, when + 3.5); g.gain.linearRampToValueAtTime(0, when + 3.95);
      return true;
    } catch (e) { return false; }
  }

  /* ---------- the gospel organ: a tonewheel model with a rotating (Leslie) speaker ----------
     Nine drawbars (16', 5⅓', 8', 4', 2⅔', 2', 1⅗', 1⅓', 1') set the classic gospel registration 88 8800 000,
     a second-harmonic percussion "ping" on the first key of a phrase, a key click, a little valve overdrive,
     and the Leslie: the treble horn and bass drum spin at their own speeds (Doppler pitch wobble, tremolo and
     stereo movement), slowly (chorale) or fast (tremolo), and speed up or slow down with real inertia.
     Hold the sustain pedal (or Shift) to spin it fast, as organists do with the half-moon switch. */
  const DRAWBARS = [0.5, 1.5, 1, 2, 3, 4, 5, 6, 8];
  const REG = [8, 8, 8, 8, 0, 0, 0, 0, 0];
  let percArmed = true, leslieFast = false;
  const leslies = new WeakMap(), leslieList = [];
  function curve(k) { const n = 1024, a = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; a[i] = Math.tanh(k * x) / Math.tanh(k); } return a; }
  function leslieFor(c, dest) {
    let L = leslies.get(dest); if (L) return L;
    const input = c.createGain(); input.gain.value = 1;
    const drive = c.createWaveShaper(); drive.curve = curve(1.6); drive.oversample = '2x';
    const pre = c.createGain(); pre.gain.value = 0.85; input.connect(pre); pre.connect(drive);
    const out = c.createGain(); out.gain.value = 1.15; out.connect(dest);
    const rotor = (type, freq, depth, delayBase, delayDepth, panDepth) => {
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = 800; f.Q.value = 0.6; drive.connect(f);
      const dl = c.createDelay(0.05); dl.delayTime.value = delayBase; f.connect(dl);
      const am = c.createGain(); am.gain.value = 1 - depth / 2; dl.connect(am);
      const pan = c.createStereoPanner ? c.createStereoPanner() : null;
      if (pan) { am.connect(pan); pan.connect(out); } else am.connect(out);
      const lfo = c.createOscillator(); lfo.frequency.value = freq;
      const gD = c.createGain(); gD.gain.value = delayDepth; lfo.connect(gD); gD.connect(dl.delayTime);
      const gA = c.createGain(); gA.gain.value = depth / 2; lfo.connect(gA); gA.connect(am.gain);
      if (pan) { const lq = c.createOscillator(), gP = c.createGain(); lq.frequency.value = freq; gP.gain.value = panDepth; lq.connect(gP); gP.connect(pan.pan); lq.start(); lfo.start(); return { lfo: [lfo, lq] }; }
      lfo.start(); return { lfo: [lfo] };
    };
    const horn = rotor('highpass', 0.83, 0.42, 0.0012, 0.00045, 0.65);
    const drum = rotor('lowpass', 0.67, 0.24, 0.0009, 0.00022, 0.3);
    L = { input, horn, drum, c };
    leslies.set(dest, L); leslieList.push(L); if (leslieList.length > 12) leslieList.shift();
    setSpeed(L, leslieFast, true);
    return L;
  }
  function setSpeed(L, fast, now) {
    const t = L.c.currentTime;
    const go = (r, hz, tc) => r.lfo.forEach(o => { try { o.frequency.cancelScheduledValues(t); if (now) o.frequency.setValueAtTime(hz, t); else o.frequency.setTargetAtTime(hz, t, tc); } catch (e) { /* ignore */ } });
    go(L.horn, fast ? 6.8 : 0.83, fast ? 0.35 : 0.7);    // the light horn speeds up quickly
    go(L.drum, fast ? 5.9 : 0.67, fast ? 1.4 : 1.9);     // the heavy drum takes longer
  }
  function leslie(fast) {
    fast = !!fast; if (fast === leslieFast) return; leslieFast = fast;
    leslieList.forEach(L => { if (L.c.state !== 'closed') setSpeed(L, fast); });
    if (App.onLeslie) App.onLeslie(fast);
  }
  function organVoice(c, v, m, when, vel, amp, f, light, dest) {
    const L = leslieFor(c, dest);
    try { v.vg.disconnect(); } catch (e) { /* ignore */ }
    v.vg.connect(L.input);
    const e = c.createGain(); e.connect(v.vg); v.rel = 0.012;          // tonewheels start and stop almost at once
    e.gain.setValueAtTime(0, when); e.gain.linearRampToValueAtTime(1, when + 0.004);
    const sum = REG.reduce((a, b) => a + b, 0) || 1;
    DRAWBARS.forEach((r, i) => {
      if (!REG[i] || (light && i > 3)) return;
      let fr = f * r; while (fr > 6000) fr /= 2;                       // the top tonewheels fold back, as on the real organ
      const g = c.createGain(); g.gain.value = amp * 0.42 * Math.pow(10, (REG[i] - 8) * 3 / 20) * REG[i] / sum;
      g.connect(e); osc(c, 'sine', fr, g, when, v, (i % 3 - 1) * 0.8);
    });
    if (percArmed && !light) {                                         // percussion: second harmonic, fast decay
      const g = c.createGain(); g.gain.setValueAtTime(amp * 0.17, when); g.gain.setTargetAtTime(0, when + 0.004, 0.16);
      g.connect(e); osc(c, 'sine', Math.min(f * 2, 7000), g, when, v);
    }
    if (!light && noiseBuf) {                                          // key click
      const ns = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
      ns.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = clamp(f * 8, 2000, 7000); bp.Q.value = 1.1;
      ng.gain.setValueAtTime(amp * 0.08 * (0.6 + 0.4 * Math.random()), when); ng.gain.setTargetAtTime(0, when, 0.004);
      ns.connect(bp); bp.connect(ng); ng.connect(v.vg); ns.start(when, Math.random() * 0.15); ns.stop(when + 0.04); v.nodes.push(ns);
    }
  }

  /* ---------- other instruments (synthesised; used when the library is not installed) ---------- */
  const lfos = new WeakMap();
  function lfoFor(c) {   // shared vibrato oscillators, one set per audio context
    let l = lfos.get(c);
    if (!l) {
      const mk = (hz, cents) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = hz; g.gain.value = cents; o.connect(g); o.start(); return g; };
      l = { slow: mk(5.3, 9), fast: mk(6.8, 4) }; lfos.set(c, l);
    }
    return l;
  }
  function env(c, v, when, peak, attack, rel) {   // per-voice envelope into the voice's output gain
    const e = c.createGain(); e.gain.setValueAtTime(0, when); e.gain.linearRampToValueAtTime(peak, when + attack);
    e.connect(v.vg); v.rel = rel; return e;
  }
  function osc(c, type, freq, dest, when, v, cents, vib) {
    const o = c.createOscillator(); o.type = type; o.frequency.value = freq; if (cents) o.detune.value = cents;
    if (vib) vib.connect(o.detune);
    o.connect(dest); o.start(when); o.stop(when + 120); v.nodes.push(o); return o;
  }
  const INSTR = {
    piano: { label: 'Grand piano', hint: 'The default teaching sound.', chordy: true, gm: 0 },
    epiano: { label: 'Electric piano', hint: 'Soft, bell-like keys.', chordy: true, gm: 4, build(c, v, m, when, vel, amp, f, light) {
      const pk = amp * 0.85, e = c.createGain(); e.connect(v.vg); v.rel = 0.16;
      e.gain.setValueAtTime(0, when); e.gain.linearRampToValueAtTime(pk, when + 0.004);
      e.gain.setTargetAtTime(pk * 0.38, when + 0.004, 0.8); e.gain.setTargetAtTime(0, when + 3, 4);
      const car = c.createOscillator(); car.type = 'sine'; car.frequency.value = f; car.connect(e); car.start(when); car.stop(when + 22);
      const mod = c.createOscillator(), mg = c.createGain(); mod.type = 'sine'; mod.frequency.value = f;
      mg.gain.setValueAtTime(f * (0.9 + 2.0 * vel), when); mg.gain.setTargetAtTime(f * 0.25, when, 0.55);
      mod.connect(mg); mg.connect(car.frequency); mod.start(when); mod.stop(when + 22);
      v.nodes.push(car, mod);
      if (!light && f * 14 < 9000) {     // the "tine" bark at the start of each note
        const t = c.createOscillator(), tg = c.createGain(); t.type = 'sine'; t.frequency.value = f * 14;
        tg.gain.setValueAtTime(f * (0.5 + 1.2 * vel), when); tg.gain.setTargetAtTime(0, when, 0.035);
        t.connect(tg); tg.connect(car.frequency); t.start(when); t.stop(when + 0.4); v.nodes.push(t);
      }
    } },
    guitar: { label: 'Acoustic guitar', hint: 'A plucked-string sound, used in the Guitar course.', chordy: true, gm: 25, build(c, v, m, when, vel, amp, f, light) {
      const e = c.createGain(), lp = c.createBiquadFilter(); v.rel = 0.14;
      lp.type = 'lowpass'; lp.Q.value = 0.7; lp.frequency.setValueAtTime(clamp(f * 10, 1800, 9000), when); lp.frequency.setTargetAtTime(clamp(f * 2.2, 500, 2600), when, 0.16);
      e.gain.setValueAtTime(0, when); e.gain.linearRampToValueAtTime(amp * 1.1, when + 0.003); e.gain.setTargetAtTime(0, when + 0.012, clamp(2.0 - (m - 40) * 0.022, 0.55, 2.0));
      e.connect(lp); lp.connect(v.vg);
      [['sawtooth', 0, 0.34], ['triangle', 6, 0.5], ['square', -5, 0.1]].forEach(a => { const o = c.createOscillator(), g = c.createGain(); o.type = a[0]; o.frequency.value = f; o.detune.value = a[1]; g.gain.value = a[2]; o.connect(g); g.connect(e); o.start(when); o.stop(when + 9); v.nodes.push(o); });
      if (!light && noiseBuf) { const ns = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain(); ns.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = clamp(f * 5, 1200, 5000); bp.Q.value = 0.9; ng.gain.setValueAtTime(amp * 0.22, when); ng.gain.setTargetAtTime(0, when, 0.012); ns.connect(bp); bp.connect(ng); ng.connect(v.vg); ns.start(when); ns.stop(when + 0.08); v.nodes.push(ns); }
    } },
    organ: { label: 'Gospel organ (B3 style)', hint: 'Tonewheel organ with a rotating speaker. Hold the sustain pedal or Shift to spin it fast.', chordy: true, model: true },
    strings: { label: 'Strings', hint: 'A warm string section that swells in.', chordy: true, gm: 48, build(c, v, m, when, vel, amp, f, light) {
      const e = env(c, v, when, 1, 0.2 + 0.12 * (1 - vel), 0.32), lp = c.createBiquadFilter(), vb = lfoFor(c).slow;
      lp.type = 'lowpass'; lp.Q.value = 0.5; lp.frequency.value = clamp(f * 3 + 1400, 1800, 6500); lp.connect(e);
      const det = light ? [-8, 8] : [-12, -4, 5, 13], g = c.createGain(); g.gain.value = amp * (light ? 0.34 : 0.25); g.connect(lp);
      det.forEach(d => osc(c, 'sawtooth', f, g, when, v, d, vb));
    } },
    brass: { label: 'Trumpet', hint: 'A bright brass lead.', chordy: false, gm: 56, build(c, v, m, when, vel, amp, f, light) {
      const e = env(c, v, when, 1, 0.035, 0.09), lp = c.createBiquadFilter(), vb = lfoFor(c).slow;
      const top = clamp(f * (4 + 6 * vel), 1500, 9000);
      lp.type = 'lowpass'; lp.Q.value = 1.1; lp.frequency.setValueAtTime(clamp(f * 1.6, 500, 3000), when); lp.frequency.setTargetAtTime(top, when, 0.045);
      const fm = c.createBiquadFilter(); fm.type = 'peaking'; fm.frequency.value = 1300; fm.Q.value = 0.9; fm.gain.value = 5;
      lp.connect(fm); fm.connect(e);
      const g = c.createGain(); g.gain.value = amp * 0.4; g.connect(lp);
      [-4, 4].slice(0, light ? 1 : 2).forEach(d => osc(c, 'sawtooth', f, g, when, v, d, vb));
      if (!light && noiseBuf) {   // breath at the attack
        const ns = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
        ns.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = 2800; bp.Q.value = 0.8;
        ng.gain.setValueAtTime(amp * 0.12, when); ng.gain.setTargetAtTime(0, when, 0.03);
        ns.connect(bp); bp.connect(ng); ng.connect(v.vg); ns.start(when); ns.stop(when + 0.2); v.nodes.push(ns);
      }
    } },
    choir: { label: 'Choir (aah)', hint: 'Soft sung voices.', chordy: true, gm: 52, build(c, v, m, when, vel, amp, f, light) {
      const e = env(c, v, when, 1, 0.16, 0.34), vb = lfoFor(c).slow, src = c.createGain(); src.gain.value = 1;
      [[800, 7, 1], [1150, 8, 0.55], [2900, 10, 0.3]].forEach(([hz, q, gn]) => {
        const bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = hz; bp.Q.value = q; g.gain.value = amp * 1.15 * gn;
        src.connect(bp); bp.connect(g); g.connect(e);
      });
      const sg = c.createGain(); sg.gain.value = 0.5; sg.connect(src);
      [-7, 7].slice(0, light ? 1 : 2).forEach(d => osc(c, 'sawtooth', f, sg, when, v, d, vb));
    } },
    flute: { label: 'Flute', hint: 'A breathy, singing melody sound.', chordy: false, gm: 73, build(c, v, m, when, vel, amp, f, light) {
      const e = env(c, v, when, 1, 0.06, 0.12), vb = lfoFor(c).slow;
      [[1, 1], [2, 0.28], [3, 0.09]].forEach(([r, lv]) => { if (f * r > 9000) return; const g = c.createGain(); g.gain.value = amp * 0.85 * lv; g.connect(e); osc(c, 'sine', f * r, g, when, v, 0, vb); });
      if (noiseBuf && !light) {
        const ns = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
        ns.buffer = noiseBuf; ns.loop = true; bp.type = 'bandpass'; bp.frequency.value = clamp(f * 3, 800, 6000); bp.Q.value = 1.6;
        ng.gain.setValueAtTime(amp * 0.07, when); ns.connect(bp); bp.connect(ng); ng.connect(e); ns.start(when); ns.stop(when + 120); v.nodes.push(ns);
      }
    } }
  };
  // instruments that only exist in the library fall back to the nearest built-in sound
  INSTR.pipe = { label: 'Church pipe organ', hint: 'A full pipe organ for hymns.', chordy: true, gm: 19, needsBank: true, build: (...a) => INSTR.strings.build(...a) };
  INSTR.brasssec = { label: 'Brass section', hint: 'Trumpets, trombones and horns together, for hits and pads.', chordy: true, gm: 61, needsBank: true, build: (...a) => INSTR.brass.build(...a) };
  INSTR.pad = { label: 'Warm pad', hint: 'A soft synth pad for worship moments.', chordy: true, gm: 89, needsBank: true, build: (...a) => INSTR.strings.build(...a) };
  INSTR.bass = { label: 'Bass guitar', hint: 'Fingered electric bass (used by the Song Lab).', chordy: false, gm: 33, needsBank: true, hidden: true, build: (...a) => INSTR.guitar.build(...a) };
  const TRIM = { pipe: [0.67, 1.10], brasssec: [0.49, 1.08], pad: [0.67, 1.10], bass: [0.9, 0.9], epiano: [0.395, 0.62], organ: [0.74, 0.79], strings: [0.67, 1.10], brass: [0.49, 1.08], choir: [1.29, 2.85], flute: [0.26, 0.26] };   // loudness match to the piano (full voice, light voice)
  const instId = () => (S.prefs && INSTR[S.prefs.instrument] ? S.prefs.instrument : 'piano');
  const instList = () => Object.keys(INSTR).filter(id => !INSTR[id].hidden && (!INSTR[id].needsBank || bankReady() || (S.prefs && S.prefs.instrument === id)))
    .map(id => ({ id, label: INSTR[id].label, hint: INSTR[id].hint }));
  const backingInst = () => (INSTR[instId()].chordy ? instId() : 'piano');

  /* ---------- voice ---------- */
  function buildVoice(c, dest, m, when, vel, level, light, inst) {   // light = fewer partials, used for scripted playback so long backings stay smooth
    vel = clamp(vel == null ? 0.7 : vel, 0.05, 1);
    const f = hz(m);
    const v = { m, c, vg: c.createGain(), nodes: [], released: false, keyDown: false };
    let tail = dest;
    if (c.createStereoPanner) { const pan = c.createStereoPanner(); pan.pan.value = clamp((m - 60) / 70, -0.5, 0.5); pan.connect(dest); tail = pan; }
    v.vg.connect(tail); v.out = tail;
    const amp = level * (0.07 + 0.93 * Math.pow(vel, 1.5));
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4;
    lp.connect(v.vg);
    const I = inst && INSTR[inst];
    if (I && I.model) { organVoice(c, v, m, when, vel, amp * TRIM.organ[light ? 1 : 0], f, light, dest); return v; }
    if (inst && inst !== 'piano' && I && I.gm != null && bankVoice(c, v, 0, I.gm, m, when, vel, level)) return v;
    if (inst && inst !== 'piano' && I && I.build) { I.build(c, v, m, when, vel, amp * (TRIM[inst] ? TRIM[inst][light ? 1 : 0] : 1), f, light); return v; }
    const smp = pickSample(m);
    if (!smp && bankVoice(c, v, 0, 0, m, when, vel, level)) return v;
    if (smp) {
      lp.frequency.value = clamp(f * (5 + 22 * vel), 2500, 18000);
      const src = c.createBufferSource(), g = c.createGain(), rate = Math.pow(2, (m - smp.m) / 12);
      src.buffer = smp.buf; src.playbackRate.value = rate; g.gain.value = amp * 1.7;
      src.connect(g); g.connect(lp); src.start(when);
      v.nodes.push(src);
      return v;
    }
    lp.frequency.value = clamp(f * (3 + 15 * vel), 1400, 15000);
    const B = 0.00022 * Math.pow(2, (60 - m) / 18);              // string stiffness: partials run sharp
    const tilt = 1.75 - 0.95 * vel;                               // harder = brighter
    const tau1 = clamp(7.2 - (m - 30) * 0.095, 0.9, 7.2);        // low notes ring longer
    const parts = []; let norm = 0;
    for (let n = 1; n <= (light ? 8 : 22); n++) {
      const fn = n * f * Math.sqrt(1 + B * n * n);
      if (fn > 9500) break;
      const comb = 0.55 + 0.45 * Math.abs(Math.sin(Math.PI * n * 0.115));  // hammer strikes ~1/9 along the string
      const a = Math.pow(n, -tilt) * comb;
      parts.push({ n, fn, a, tau: tau1 / (1 + 0.5 * (n - 1)) }); norm += a;
    }
    parts.forEach(p => {
      const strings = p.n <= 3 && m >= 36 && !light ? [[0, 0.8], [1.1 + 0.3 * p.n, 0.2]] : [[0, 1]];   // slightly out-of-tune unison strings
      strings.forEach(([cents, w]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = p.fn;
        if (cents) o.detune.value = cents;
        const peak = (p.a / norm) * amp * w;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(peak, when + 0.004);
        g.gain.setTargetAtTime(peak * 0.0, when + 0.004, p.tau);
        o.connect(g); g.connect(lp);
        o.start(when); o.stop(when + Math.min(14, p.tau * 5.5) + 0.1);
        v.nodes.push(o);
      });
    });
    if (noiseBuf && !light) { // hammer thump
      const ns = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
      ns.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = clamp(f * 2.5, 500, 5000); bp.Q.value = 0.9;
      ng.gain.setValueAtTime(0.32 * amp * vel, when); ng.gain.setTargetAtTime(0, when, 0.011);
      ns.connect(bp); bp.connect(ng); ng.connect(lp);
      ns.start(when, Math.random() * 0.1); ns.stop(when + 0.12);
      v.nodes.push(ns);
    }
    return v;
  }
  function release(v, t, fast) {
    if (v.released) return; v.released = true;
    const c = v.c, at = Math.max(t, c.currentTime);
    const tau = fast ? 0.025 : (v.rel || clamp(0.2 - (v.m - 36) * 0.0022, 0.05, 0.2));   // damper falls faster on high strings
    try { v.vg.gain.cancelScheduledValues(at); v.vg.gain.setTargetAtTime(0, at, tau); } catch (e) { /* ignore */ }
    const end = at + tau * 7 + 0.05;
    v.end = end;
    v.nodes.forEach(n => { try { n.stop(end); } catch (e) { /* ignore */ } });
    if (c instanceof OfflineAudioContext) return;   // an export clears finished notes itself (see render)
    const sweep = () => {   // follow the audio clock, not the wall clock, so a paused or lagging context never cuts a note short
      if (c.state === 'closed' || c.currentTime >= end) { try { v.vg.disconnect(); } catch (e) { /* ignore */ } }
      else setTimeout(sweep, Math.max(60, (end - c.currentTime) * 1000) + 150);
    };
    setTimeout(sweep, Math.max(0, (end - c.currentTime) * 1000) + 150);
  }

  /* ---------- playing live (keys, MIDI, pointer) ---------- */
  function noteOn(m, vel) {
    if (!S.prefs.sound) return null;
    const c = ensure(); if (!c) return null;
    const old = live.get(m); if (old) { release(old, c.currentTime, true); live.delete(m); }
    sustained.forEach(sv => { if (sv.m === m) { release(sv, c.currentTime, true); sustained.delete(sv); } });
    // many notes at once (chords, the pedal held): the synthesised piano uses fewer partials so the computer keeps up
    if (sustained.size > 24) { const first = sustained.values().next().value; release(first, c.currentTime, true); sustained.delete(first); }
    const busy = live.size + sustained.size >= 4;
    percArmed = live.size === 0;   // organ percussion sounds only on the first key of a phrase (single trigger)
    const v = buildVoice(c, master, m, c.currentTime + 0.002, vel, 0.7, busy, instId());
    v.keyDown = true; live.set(m, v);
    return v;
  }
  function noteOff(m) {
    const v = live.get(m); if (!v || !ctx) return;
    live.delete(m); v.keyDown = false;
    if (pedalDown) sustained.add(v); else release(v, ctx.currentTime);
  }
  const pedalSrc = new Set();  // 'midi' foot pedal, 'key' (Shift held), 'latch' (on-screen toggle)
  function pedal(down, src) {
    if (down) pedalSrc.add(src || 'midi'); else pedalSrc.delete(src || 'midi');
    const nd = pedalSrc.size > 0;
    if (instId() === 'organ') {   // on the organ the pedal works the Leslie (fast while held), it does not sustain
      leslie(nd);
      if (pedalDown && ctx) { sustained.forEach(v => release(v, ctx.currentTime)); sustained.clear(); pedalDown = false; }
      if (App.onPedal) App.onPedal(nd);
      return;
    }
    if (nd === pedalDown) return;
    pedalDown = nd;
    if (!nd && ctx) { sustained.forEach(v => release(v, ctx.currentTime)); sustained.clear(); }
    if (App.onPedal) App.onPedal(nd);
  }
  function note(m) { // one-shot with a fixed length (used by simple callers)
    if (!S.prefs.sound) return;
    const c = ensure(); if (!c) return;
    const v = buildVoice(c, master, m, c.currentTime, 0.7, 0.62);
    release(v, c.currentTime + 2);
  }

  /* ---------- scripted playback (lessons, examples) ---------- */
  function click(when, accent, dest, cx) {
    const c0 = cx || ctx, o = c0.createOscillator(), g = c0.createGain();
    o.type = 'sine'; o.frequency.value = accent ? 1250 : 850;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.32, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
    o.connect(g); g.connect(dest); o.start(when); o.stop(when + 0.08);
  }
  function drumHit(when, type, vel, dest, cx, span) {
    const c = cx || ctx, v = (vel || 0.7) * 0.6;
    if (!c) return;
    if (type === 'sw') {   // a swell into the next section: noise rising in pitch and level (a cymbal roll and riser)
      if (!noiseBuf) return;
      const len = Math.max(0.5, span || 2), ns = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      ns.buffer = noiseBuf; ns.loop = true; f.type = 'bandpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(900, when); f.frequency.exponentialRampToValueAtTime(7500, when + len);
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.5 * v + 0.05, when + len * 0.97); g.gain.linearRampToValueAtTime(0.0001, when + len + 0.03);
      ns.connect(f); f.connect(g); g.connect(dest); ns.start(when); ns.stop(when + len + 0.05);
      return;
    }
    if (bankDrum(c, when, type, vel, dest)) return;
    if (type === 'th' || type === 'tm' || type === 'tl') {   // toms: a pitched drop
      const f0 = { th: 210, tm: 150, tl: 105 }[type], o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(f0, when); o.frequency.exponentialRampToValueAtTime(f0 * 0.62, when + 0.25);
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.9 * v, when + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.45);
      o.connect(g); g.connect(dest); o.start(when); o.stop(when + 0.5);
      return;
    }
    if (type === 'k') {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(150, when); o.frequency.exponentialRampToValueAtTime(42, when + 0.12);
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(1.1 * v, when + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.34);
      o.connect(g); g.connect(dest); o.start(when); o.stop(when + 0.38);
      return;
    }
    if (type === 'r') {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = 1750;
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.7 * v, when + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
      o.connect(g); g.connect(dest); o.start(when); o.stop(when + 0.07);
      return;
    }
    if (!noiseBuf) return;
    const ns = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    ns.buffer = noiseBuf; let dur = 0.12, lvl = 0.5 * v;
    if (type === 's') {
      f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8; dur = 0.18; lvl = 1.0 * v;
      const o = c.createOscillator(), og = c.createGain();
      o.type = 'triangle'; o.frequency.value = 190;
      og.gain.setValueAtTime(0.0001, when); og.gain.exponentialRampToValueAtTime(0.5 * v, when + 0.003); og.gain.exponentialRampToValueAtTime(0.0001, when + 0.1);
      o.connect(og); og.connect(dest); o.start(when); o.stop(when + 0.12);
    } else if (type === 'o') { f.type = 'highpass'; f.frequency.value = 6500; dur = 0.22; lvl = 0.45 * v; }
    else if (type === 'c') { f.type = 'highpass'; f.frequency.value = 4200; dur = 1.4; lvl = 0.5 * v; }
    else if (type === 'cl') {   // a hand clap: three quick bursts and a short tail
      f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 1.1; dur = 0.13; lvl = 0.9 * v;
      [0, 0.011, 0.022].forEach(o => { const s2 = c.createBufferSource(), g2 = c.createGain(), f2 = c.createBiquadFilter(); s2.buffer = noiseBuf; f2.type = 'bandpass'; f2.frequency.value = 1200; f2.Q.value = 1.1; g2.gain.setValueAtTime(0.7 * v, when + o); g2.gain.exponentialRampToValueAtTime(0.001, when + o + 0.01); s2.connect(f2); f2.connect(g2); g2.connect(dest); s2.start(when + o, 0, 0.02); });
    }
    else { f.type = 'highpass'; f.frequency.value = 7000; dur = 0.05; lvl = 0.5 * v; }
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(Math.max(0.001, lvl), when + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    ns.connect(f); f.connect(g); g.connect(dest); ns.start(when, 0, dur + 0.02);
  }
  function stopAll() { if (current) { const h = current; current = null; h.stop(); } }
  /* the mixer: each part of the backing gets its own volume and place left-right. mix = { chords: { v, pan }, bass,
     drums, melody, choir, loops } (v already includes mute and solo) */
  const partOf = e => (e.click ? 'click' : e.loop ? 'loops' : e.drum ? 'drums' : e.choir ? 'choir' : e.mel ? 'melody' : e.part === 'bass' ? 'bass' : 'chords');
  function mixRouter(c, base, mix) {
    if (!mix) return () => base;
    const nodes = {};
    return e => {
      const k = partOf(e), m = mix[k]; if (!m) return base;
      if (!nodes[k]) {
        const g = c.createGain(); g.gain.value = m.v == null ? 1 : m.v; let n = g;
        if (m.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, m.pan)); g.connect(p); n = p; }
        n.connect(base); nodes[k] = g;
      }
      return nodes[k];
    };
  }
  function audioOut(c, a, dest) {   // one recorded clip: its volume and place left-right (and, with the memory saver, its vocal sound live)
    const g = c.createGain(); g.gain.value = a.gain == null ? 1 : a.gain;
    if (a.chain && typeof VocalFX !== 'undefined') { const ch = VocalFX.liveChain(c, a.chain, { room: a.room }); ch.output.connect(g); const pre = c.createGain(); pre.connect(ch.input); return audioTail(c, a, g, dest, pre); }
    return audioTail(c, a, g, dest, g);
  }
  function audioTail(c, a, g, dest, entry) {
    if (a.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, a.pan)); g.connect(p); p.connect(dest); } else g.connect(dest);
    return entry;
  }
  function play(script, o) {
    o = o || {};
    stopAll();
    if (!S.prefs.sound && !o.force) { if (App.toast) App.toast('Sound is off. Turn it on in Profile.'); if (o.onEnd) o.onEnd(); return { stop() {}, silent: true }; }
    const c = ensure();
    if (!c) { if (App.toast) App.toast('Sound is not available on this device.'); if (o.onEnd) o.onEnd(); return { stop() {}, silent: true }; }
    const speed = o.speed || 1, spb = 60 / script.bpm / speed;
    const bus = c.createGain(); bus.connect(master);
    const dbus = c.createGain(); dbus.connect(outBus);   // recorded loops and beats: already mixed, so no extra room
    const timers = new Set(); let stopped = false, ended = false, pumpId = null;
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, Math.max(0, ms)); timers.add(id); };
    const loopBeats = Math.max(1, Math.ceil(script.total));
    const evs = script.events.slice().sort((x, y) => x.t - y.t);
    const AHEAD = 1.5;                       // seconds of music kept scheduled in advance
    let passStart = c.currentTime + 0.08, idx = 0, lastPass = false, endAt = 0;
    if (o.onStart) { try { o.onStart(passStart, c, bus); } catch (e) { console.error(e); } }
    /* recorded audio (loops, beats) placed on the beat grid, each pass: [{ buf, at (beats), dur (beats), offset (s), gain }] */
    const placeAudio = t => (script.audio || []).forEach(a => {
      if (!a.buf) return;
      try { const src = c.createBufferSource(); src.buffer = a.buf; src.connect(audioOut(c, a, dbus)); const at = t + a.at * spb; src.start(Math.max(at, c.currentTime), Math.max(0, (a.offset || 0) + Math.max(0, c.currentTime - at)), Math.max(0.01, a.dur * spb)); } catch (e) { /* ignore */ }
    });
    placeAudio(passStart);
    const route = mixRouter(c, bus, script.mix);
    if (script.fade && !o.loop) [bus, dbus].forEach(b => { const a = passStart + script.fade.from * spb, z = passStart + script.fade.to * spb; b.gain.setValueAtTime(1, Math.max(a, c.currentTime)); b.gain.linearRampToValueAtTime(0.0001, Math.max(z, c.currentTime + 0.05)); });
    function end() { if (ended) return; ended = true; if (o.onEnd) o.onEnd(); }
    function schedule(e, t) {
      const d = Math.max(0.12, e.d * spb);
      if (e.drum) drumHit(t, e.drum, e.vel, route(e), c, e.d * spb);
      else if (e.click) click(t, e.click === 2, bus);
      else if (e.notes && e.notes.length) {
        const lvl = 0.62 / Math.sqrt(Math.max(1, e.notes.length * 0.8));
        const ins = e.part === 'bass' && bankReady() ? 'bass' : e.inst || (typeof o.inst === 'function' ? o.inst() : o.inst) || 'piano';
        const dst = route(e); e.notes.forEach(m => { const v = buildVoice(c, dst, m, t, e.vel || 0.68, lvl, true, ins); release(v, t + d); });
      }
      if (o.onStep && !e.drum) {
        const delay = (t - c.currentTime) * 1000;
        later(() => { if (!stopped) o.onStep(e, true); }, delay);
        later(() => { if (!stopped) o.onStep(e, false); }, delay + d * 1000);
      }
    }
    function pump() {
      if (stopped || ended) return;
      const horizon = c.currentTime + AHEAD;
      while (!lastPass) {
        if (idx >= evs.length) {             // this pass is fully scheduled; decide about another one near its end
          const boundary = passStart + loopBeats * spb;
          if (boundary > horizon) break;
          if (typeof o.loop === 'function' ? o.loop() : !!o.loop) { passStart = boundary; idx = 0; placeAudio(passStart); continue; }
          lastPass = true; endAt = boundary; break;
        }
        const t = passStart + evs[idx].t * spb;
        if (t > horizon) break;
        schedule(evs[idx], t); idx++;
      }
      if (lastPass && c.currentTime >= endAt + 0.3) { h.stop(); }
    }
    const h = {
      stop() {
        if (stopped) return; stopped = true;
        if (pumpId) { clearInterval(pumpId); pumpId = null; }
        timers.forEach(clearTimeout); timers.clear();
        [bus, dbus].forEach(b => { try { b.gain.cancelScheduledValues(c.currentTime); b.gain.setTargetAtTime(0, c.currentTime, 0.03); } catch (e) { /* ignore */ } });
        setTimeout(() => { try { bus.disconnect(); dbus.disconnect(); } catch (e) { /* ignore */ } }, 500);
        if (current === h) current = null;
        end();
      }
    };
    current = h;
    pump(); pumpId = setInterval(pump, 40);
    /* watchdog: if the audio clock is not moving the device is stuck. Say so honestly instead of showing "playing" in silence. */
    const t0 = c.currentTime;
    later(() => {
      if (stopped || c.currentTime > t0 + 0.02) return;
      wake();
      later(() => {
        if (stopped || c.currentTime > t0 + 0.02) return;
        resetContext(); h.stop();
        if (App.toast) App.toast('The sound device did not respond. Press play again.', 'bad');
      }, 900);
    }, 800);
    return h;
  }
  function metro(o) {
    const c = ensure(); if (!c) return null;
    const spb = 60 / o.bpm; let n = 0; const t0 = c.currentTime + 0.3; let next = t0, id = null;
    function pump() {
      while (next < c.currentTime + 0.15 && (o.limit === undefined || n < o.limit)) {
        click(next, n % o.bpb === 0, outBus);
        if (o.onBeat) { const i = n; setTimeout(() => o.onBeat(i), Math.max(0, (next - c.currentTime) * 1000)); }
        n++; next = t0 + n * spb;
      }
      if (o.limit !== undefined && n >= o.limit && id) { clearInterval(id); id = null; }
    }
    pump(); id = setInterval(pump, 25);
    return { t0, spb, stop() { if (id) { clearInterval(id); id = null; } } };
  }
  function releaseAll() {
    if (!ctx) return;
    live.forEach(v => release(v, ctx.currentTime, true)); live.clear();
    sustained.forEach(v => release(v, ctx.currentTime, true)); sustained.clear();
  }
  window.addEventListener('blur', () => { pedal(false, 'key'); releaseAll(); });
  return {
    ensure, now: () => (ctx ? ctx.currentTime : 0), note, noteOn, noteOff, pedal, pedalState: () => pedalDown, pedalSrcHas: s => pedalSrc.has(s),
    play, stopAll, metro, tone: (m, d) => { const c = ensure(); if (c) { const v = buildVoice(c, master, m, c.currentTime, 0.7, 0.62); release(v, c.currentTime + (d || 1)); } },
    info: () => ({ mode: sample.state === 'ready' ? 'recorded' : 'synth', credit: sample.credit, loading: sample.state === 'loading', state: sample.state,
      bank: bank.state, bankCredit: bank.credit, room: roomId() }),
    rooms: () => Object.keys(ROOMS).map(id => ({ id, label: ROOMS[id].label })), room: roomId, setRoom,
    leslie, leslieFast: () => leslieFast, _bank: () => bank, _loadBank: f => { bank.state = 'ready'; bank.sf = f ? SF2.prepare(f) : null; if (!f) bank.state = 'none'; },
    _buildVoice: buildVoice, _ctx: () => ctx, reset: resetContext, releaseAll, _release: release, held: () => live.size + sustained.size,
    inst: instId, instruments: instList, backingInst, hasInst: id => !!INSTR[id],
    /* play a recorded AudioBuffer (a guide vocal) at an exact audio-clock time, through a given bus */
    /* recorded clips (loops, beats, tracks) at a given audio-clock time, for when the notes play on a MIDI keyboard */
    playClips(clips, t0, bpm) {
      const c = ensure(); if (!c) return { stop() {} };
      const spb = 60 / bpm, bus = c.createGain(); bus.connect(outBus); const srcs = [];
      (clips || []).forEach(a => { if (!a.buf) return; try { const src = c.createBufferSource(); src.buffer = a.buf; src.connect(audioOut(c, a, bus)); const at = t0 + a.at * spb; src.start(Math.max(at, c.currentTime), Math.max(0, (a.offset || 0) + Math.max(0, c.currentTime - at)), Math.max(0.01, a.dur * spb)); srcs.push(src); } catch (e) { /* ignore */ } });
      return { stop() { try { bus.gain.setTargetAtTime(0, c.currentTime, 0.03); } catch (e) { /* ignore */ } setTimeout(() => { srcs.forEach(x => { try { x.stop(); } catch (e) { /* ignore */ } }); try { bus.disconnect(); } catch (e) { /* ignore */ } }, 300); } };
    },
    impulse: (c, kind) => makeImpulse(c, kind), meter: () => { ensure(); return meterNode; }, partOf, dryBus: () => { ensure(); return outBus; },
    playBuffer(buf, when, gain, dest) {
      const c = ensure(); if (!c || !buf) return null;
      const src = c.createBufferSource(), g = c.createGain(); src.buffer = buf; g.gain.value = gain == null ? 1 : gain;
      src.connect(g); g.connect(dest || master); src.start(Math.max(when, c.currentTime)); return src;
    },
    /* render a script to an AudioBuffer offline (faster than real time), with the same voices, drums and room
       as live playback. extra: [{ buffer, at (seconds), gain }] is mixed in (for example a guide vocal). */
    async render(script, o) {
      o = o || {};
      const live = ensure(); if (!live) throw new Error('Sound is not available on this device.');
      for (let i = 0; i < 100 && (sample.state === 'loading' || bank.state === 'loading'); i++) await new Promise(r => setTimeout(r, 100));
      const SR = 44100, spb = 60 / script.bpm, len = Math.ceil((script.total * spb + 3) * SR);
      const c = new OfflineAudioContext(2, len, SR);
      const mst = c.createGain(); mst.gain.value = 0.9;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
      const fin = c.createGain(); fin.connect(c.destination); comp.connect(fin); mst.connect(comp);
      roomBus(c, mst, comp);
      const t0 = 0.05, route = mixRouter(c, mst, script.mix);
      // finished notes and drum hits are taken out of the sound graph every two seconds of audio, so a long song
      // costs the same per second as a short one (otherwise every note ever played keeps being processed)
      let used = [];
      const retire = (node, end, also) => used.push({ node, end, also });
      if (script.fade) { fin.gain.setValueAtTime(1, t0 + script.fade.from * spb); fin.gain.linearRampToValueAtTime(0.0001, t0 + script.fade.to * spb); }
      // notes are added to the graph just before they are needed (two seconds at a time) and taken out when they have
      // finished: the browser processes every connected node on every slice of audio, even ones that start later,
      // so adding a whole song at once makes the export slower and slower as the song gets longer
      const evs = script.events.map(e => ({ e, t: t0 + e.t * spb })).sort((x, y) => x.t - y.t);
      let ix = 0;
      const place = ({ e, t }) => {
        const d = Math.max(0.12, e.d * spb);
        if (e.drum) { const hb = c.createGain(); hb.connect(route(e)); drumHit(t, e.drum, e.vel, hb, c, e.d * spb); retire(hb, t + Math.max(0, e.d * spb) + (e.drum === 'c' || e.drum === 'o' ? 4 : 2.5)); }
        else if (e.click) click(t, e.click === 2, mst, c);
        else if (e.notes && e.notes.length) {
          const lvl = 0.62 / Math.sqrt(Math.max(1, e.notes.length * 0.8));
          const ins = e.part === 'bass' && bankReady() ? 'bass' : e.inst || (typeof o.inst === 'function' ? o.inst() : o.inst) || 'piano';
          const dst = route(e); e.notes.forEach(m => { const v = buildVoice(c, dst, m, t, e.vel || 0.68, lvl, false, ins); release(v, t + d); retire(v.vg, (v.end || t + d + 2) + 0.05, v.out !== dst ? v.out : null); });
        }
      };
      const schedule = until => { while (ix < evs.length && evs[ix].t < until) place(evs[ix++]); };
      const STEP = 1;
      schedule(STEP);
      for (let s = STEP; s < len / SR - 0.05; s += STEP) {
        c.suspend(s).then(() => {
          const keep = [];
          used.forEach(u => { if (u.end <= s) { try { u.node.disconnect(); if (u.also) u.also.disconnect(); } catch (e) { /* ignore */ } } else keep.push(u); });
          used = keep;
          schedule(s + STEP);
          c.resume();
        }).catch(() => { /* a suspend time past the end */ });
      }
      (o.extra || []).forEach(x => { if (!x.buffer) return; const src = c.createBufferSource(), g = c.createGain(); src.buffer = x.buffer; g.gain.value = x.gain == null ? 1 : x.gain; src.connect(g); g.connect(comp); if (x.dur) src.start(t0 + Math.max(0, x.at || 0), x.offset || 0, x.dur); else src.start(t0 + Math.max(0, x.at || 0), x.offset || 0); });
      (script.audio || []).forEach(a => { if (!a.buf) return; const src = c.createBufferSource(); src.buffer = a.buf; src.connect(audioOut(c, a, comp)); src.start(t0 + a.at * spb, a.offset || 0, Math.max(0.01, a.dur * spb)); });
      return c.startRendering();
    },
    preview() { const c = ensure(); if (!c) return; [60, 64, 67].forEach(m => { const v = buildVoice(c, master, m, c.currentTime + 0.01, 0.7, 0.5, true, instId()); release(v, c.currentTime + 1.1); }); }
  };
})();
App.Snd = Snd;
