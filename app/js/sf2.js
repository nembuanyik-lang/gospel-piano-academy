'use strict';
/* ---------------------------------------------------------------- SoundFont 2 player
   Reads a SoundFont (.sf2: recorded instrument samples with their playing rules) and plays its notes with
   Web Audio. Supported: presets and instruments with global and local zones, key and velocity ranges,
   sample offsets, loops (continuous and until-release), root key, coarse/fine/scale tuning and pitch
   correction, attenuation, the volume envelope (delay, attack, hold, decay with key scaling, sustain,
   release), low-pass filter cutoff and resonance, pan, and exclusive classes (an open hi-hat is cut by a
   closed one). Velocity follows the standard SoundFont curve. Modulation envelopes, LFOs, chorus and
   reverb sends are not used (the app adds its own room sound). Pure parsing is exported for Node tests. */
const SF2 = (() => {
  const G = { startAddrsOffset: 0, endAddrsOffset: 1, startloopAddrsOffset: 2, endloopAddrsOffset: 3, startAddrsCoarseOffset: 4,
    initialFilterFc: 8, initialFilterQ: 9, endAddrsCoarseOffset: 12, pan: 17, delayVolEnv: 33, attackVolEnv: 34, holdVolEnv: 35,
    decayVolEnv: 36, sustainVolEnv: 37, releaseVolEnv: 38, keynumToVolEnvHold: 39, keynumToVolEnvDecay: 40, instrument: 41,
    keyRange: 43, velRange: 44, startloopAddrsCoarseOffset: 45, keynum: 46, velocity: 47, initialAttenuation: 48,
    endloopAddrsCoarseOffset: 50, coarseTune: 51, fineTune: 52, sampleID: 53, sampleModes: 54, scaleTuning: 56,
    exclusiveClass: 57, overridingRootKey: 58 };
  const DEFAULTS = { [G.initialFilterFc]: 13500, [G.delayVolEnv]: -12000, [G.attackVolEnv]: -12000, [G.holdVolEnv]: -12000,
    [G.decayVolEnv]: -12000, [G.releaseVolEnv]: -12000, [G.scaleTuning]: 100, [G.overridingRootKey]: -1, [G.keynum]: -1, [G.velocity]: -1 };
  // generators that a preset may not add to an instrument (ranges, links and sample settings)
  const NOT_ADDITIVE = new Set([G.startAddrsOffset, G.endAddrsOffset, G.startloopAddrsOffset, G.endloopAddrsOffset, G.startAddrsCoarseOffset,
    G.endAddrsCoarseOffset, G.startloopAddrsCoarseOffset, G.endloopAddrsCoarseOffset, G.instrument, G.keyRange, G.velRange, G.keynum,
    G.velocity, G.sampleID, G.sampleModes, G.exclusiveClass, G.overridingRootKey]);
  const str = (dv, off, n) => { let s = ''; for (let i = 0; i < n; i++) { const c = dv.getUint8(off + i); if (!c) break; s += String.fromCharCode(c); } return s.trim(); };
  const id4 = (dv, off) => String.fromCharCode(dv.getUint8(off), dv.getUint8(off + 1), dv.getUint8(off + 2), dv.getUint8(off + 3));

  function chunks(dv, off, end) {
    const out = {};
    while (off + 8 <= end) {
      const id = id4(dv, off), size = dv.getUint32(off + 4, true), data = off + 8;
      if (id === 'LIST') out[id4(dv, data)] = { off: data + 4, end: data + size };
      else out[id] = { off: data, size };
      off = data + size + (size & 1);
    }
    return out;
  }
  function parse(buf) {
    const dv = new DataView(buf);
    if (id4(dv, 0) !== 'RIFF' || id4(dv, 8) !== 'sfbk') throw new Error('Not a SoundFont file');
    const top = chunks(dv, 12, Math.min(buf.byteLength, 8 + dv.getUint32(4, true)));
    if (!top.sdta || !top.pdta) throw new Error('SoundFont is missing its data');
    const sd = chunks(dv, top.sdta.off, top.sdta.end), pd = chunks(dv, top.pdta.off, top.pdta.end);
    if (!sd.smpl) throw new Error('SoundFont has no samples');
    const rec = (name, size, fn) => { const c = pd[name]; if (!c) throw new Error('SoundFont is missing ' + name); const n = Math.floor(c.size / size), a = []; for (let i = 0; i < n; i++) a.push(fn(c.off + i * size)); return a; };
    const phdr = rec('phdr', 38, o => ({ name: str(dv, o, 20), program: dv.getUint16(o + 20, true), bank: dv.getUint16(o + 22, true), bag: dv.getUint16(o + 24, true) }));
    const bag = n => rec(n, 4, o => dv.getUint16(o, true));
    const gen = n => rec(n, 4, o => ({ op: dv.getUint16(o, true), amt: dv.getInt16(o + 2, true), lo: dv.getUint8(o + 2), hi: dv.getUint8(o + 3) }));
    const pbag = bag('pbag'), pgen = gen('pgen'), ibag = bag('ibag'), igen = gen('igen');
    const inst = rec('inst', 22, o => ({ name: str(dv, o, 20), bag: dv.getUint16(o + 20, true) }));
    const shdr = rec('shdr', 46, o => ({ name: str(dv, o, 20), start: dv.getUint32(o + 20, true), end: dv.getUint32(o + 24, true),
      loopStart: dv.getUint32(o + 28, true), loopEnd: dv.getUint32(o + 32, true), rate: dv.getUint32(o + 36, true),
      root: dv.getUint8(o + 40), corr: dv.getInt8(o + 41), type: dv.getUint16(o + 44, true) }));
    // zones: a list of generator maps; a first zone without its terminal generator is the global zone
    function zones(bags, gens, from, to, terminal) {
      const zs = [];
      for (let b = from; b < to; b++) {
        const z = { g: {}, key: [0, 127], vel: [0, 127] };
        for (let k = bags[b]; k < (bags[b + 1] !== undefined ? bags[b + 1] : gens.length); k++) {
          const x = gens[k]; if (!x) continue;
          if (x.op === G.keyRange) z.key = [x.lo, x.hi]; else if (x.op === G.velRange) z.vel = [x.lo, x.hi]; else z.g[x.op] = x.amt;
        }
        zs.push(z);
      }
      let global = null;
      if (zs.length && zs[0].g[terminal] === undefined) global = zs.shift();
      return { global, zones: zs.filter(z => z.g[terminal] !== undefined) };
    }
    const instruments = inst.slice(0, -1).map((x, i) => Object.assign({ name: x.name }, zones(ibag, igen, x.bag, inst[i + 1].bag, G.sampleID)));
    const presets = phdr.slice(0, -1).map((x, i) => Object.assign({ name: x.name, bank: x.bank, program: x.program }, zones(pbag, pgen, x.bag, phdr[i + 1].bag, G.instrument)));
    const samples = shdr.slice(0, -1);
    return { presets, instruments, samples, buf, smplOff: sd.smpl.off, smplLen: sd.smpl.size >> 1, name: '' };
  }

  function findPreset(sf, bank, program) {
    return sf.presets.find(p => p.bank === bank && p.program === program) ||
      (bank === 128 ? sf.presets.find(p => p.bank === 128 && p.program === 0) : sf.presets.find(p => p.bank === 0 && p.program === program)) || null;
  }
  const inRange = (r, x) => x >= r[0] && x <= r[1];
  /* every sample that sounds for this key and velocity, with its final playing rules */
  function noteZones(sf, bank, program, key, vel) {
    const p = findPreset(sf, bank, program); if (!p) return [];
    const out = [];
    const pg = p.global ? p.global.g : {}, pKey = p.global ? p.global.key : [0, 127], pVel = p.global ? p.global.vel : [0, 127];
    for (const pz of p.zones) {
      if (!inRange(pz.key, key) || !inRange(pz.vel, vel) || !inRange(pKey, key) || !inRange(pVel, vel)) continue;
      const ins = sf.instruments[pz.g[G.instrument]]; if (!ins) continue;
      const presetGen = Object.assign({}, pg, pz.g);
      const ig = ins.global ? ins.global.g : {}, iKey = ins.global ? ins.global.key : [0, 127], iVel = ins.global ? ins.global.vel : [0, 127];
      for (const iz of ins.zones) {
        if (!inRange(iz.key, key) || !inRange(iz.vel, vel) || !inRange(iKey, key) || !inRange(iVel, vel)) continue;
        const g = Object.assign({}, DEFAULTS, ig, iz.g);
        for (const op in presetGen) { const n = +op; if (!NOT_ADDITIVE.has(n)) g[n] = (g[n] || 0) + presetGen[op]; }
        const s = sf.samples[g[G.sampleID]]; if (!s || s.end <= s.start) continue;
        out.push(resolve(g, s, key, vel));
      }
    }
    return out;
  }
  const tc = x => Math.pow(2, x / 1200);           // timecents to seconds
  function resolve(g, s, key, vel) {
    const v = g[G.velocity] >= 0 ? g[G.velocity] : vel, k = g[G.keynum] >= 0 ? g[G.keynum] : key;
    const start = s.start + (g[G.startAddrsOffset] || 0) + 32768 * (g[G.startAddrsCoarseOffset] || 0);
    const end = s.end + (g[G.endAddrsOffset] || 0) + 32768 * (g[G.endAddrsCoarseOffset] || 0);
    const ls = s.loopStart + (g[G.startloopAddrsOffset] || 0) + 32768 * (g[G.startloopAddrsCoarseOffset] || 0);
    const le = s.loopEnd + (g[G.endloopAddrsOffset] || 0) + 32768 * (g[G.endloopAddrsCoarseOffset] || 0);
    const root = g[G.overridingRootKey] >= 0 ? g[G.overridingRootKey] : (s.root <= 127 ? s.root : 60);
    const semis = (k - root) * (g[G.scaleTuning] / 100) + (g[G.coarseTune] || 0) + ((g[G.fineTune] || 0) + s.corr) / 100;
    // velocity: the standard concave curve, which makes loudness follow the square of the velocity (at most 96 dB down);
    // the attenuation generator is scaled by 0.4, as E-mu hardware and most SoundFont players do
    const velAtt = Math.min(960, -400 * Math.log10(Math.max(1, v) / 127));
    const att = (g[G.initialAttenuation] || 0) * 0.4 + velAtt;
    return {
      sample: s, start, end, loopStart: ls, loopEnd: le, mode: g[G.sampleModes] & 3, rate: Math.pow(2, semis / 12), root,
      gain: Math.pow(10, -att / 200),
      delay: tc(g[G.delayVolEnv]), attack: tc(g[G.attackVolEnv]), hold: tc(g[G.holdVolEnv] + (60 - k) * (g[G.keynumToVolEnvHold] || 0)),
      decay: tc(g[G.decayVolEnv] + (60 - k) * (g[G.keynumToVolEnvDecay] || 0)), sustain: Math.pow(10, -Math.max(0, Math.min(1440, g[G.sustainVolEnv] || 0)) / 200),
      release: Math.min(8, tc(g[G.releaseVolEnv])), pan: Math.max(-1, Math.min(1, (g[G.pan] || 0) / 500)),
      cutoff: g[G.initialFilterFc] < 13500 ? 8.176 * Math.pow(2, g[G.initialFilterFc] / 1200) : 0, q: Math.pow(10, (g[G.initialFilterQ] || 0) / 200),
      exclusive: g[G.exclusiveClass] || 0
    };
  }

  /* audio buffers are made per sample on first use, once per audio context */
  const cache = new WeakMap();
  function bufferFor(ctx, sf, s) {
    let m = cache.get(ctx); if (!m) { m = new Map(); cache.set(ctx, m); }
    const key = sf.id + ':' + s.start;
    let b = m.get(key); if (b) return b;
    const n = Math.max(1, Math.min(s.end, sf.smplLen) - s.start), rate = Math.max(3000, Math.min(192000, s.rate || 44100));
    b = ctx.createBuffer(1, n, rate);
    const out = b.getChannelData(0), src = new Int16Array(sf.buf, sf.smplOff + s.start * 2, n);
    for (let i = 0; i < n; i++) out[i] = src[i] / 32768;
    // a looped sound jumps from the end of its loop back to the start; blend the end of the loop into the sound just before
    // the start, so the jump cannot be heard (a bad loop is what makes a held pad or voice pulse: "whoa, whoa")
    const ls = s.loopStart - s.start, le = s.loopEnd - s.start;
    if (ls > 0 && le > ls + 64 && le <= n) {
      const X = Math.min((le - ls) >> 2, ls, Math.round(b.sampleRate * 0.03));
      for (let i = 0; i < X; i++) { const w = (i + 1) / X, idx = le - X + i; out[idx] = out[idx] * (1 - w) + out[ls - X + i] * w; }
    }
    m.set(key, b); return b;
  }
  let nextId = 1;
  function prepare(sf) { sf.id = sf.id || ('sf' + nextId++); return sf; }
  /* play one note into `dest`; returns the nodes and the longest release */
  function voice(ctx, dest, sf, bank, program, key, vel, when, level, exclusiveMap) {
    const zs = noteZones(sf, bank, program, key, Math.max(1, Math.min(127, Math.round(vel))));
    const nodes = [], loops = []; let rel = 0.05;
    zs.forEach(z => {
      const b = bufferFor(ctx, sf, z.sample), sr = b.sampleRate;
      const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = z.rate;
      const loopOk = (z.mode === 1 || z.mode === 3) && z.loopEnd > z.loopStart + 8 && z.loopEnd <= z.sample.end;
      if (loopOk) { src.loop = true; src.loopStart = (z.loopStart - z.sample.start) / sr; src.loopEnd = (z.loopEnd - z.sample.start) / sr; if (z.mode === 3) loops.push(src); }
      let node = src;
      if (z.cutoff && z.cutoff < 18000) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = Math.max(30, z.cutoff); f.Q.value = Math.max(0.3, Math.min(20, z.q * 0.707)); node.connect(f); node = f; }
      const e = ctx.createGain(), peak = z.gain * level, t0 = when + z.delay;
      e.gain.setValueAtTime(0, when); e.gain.setValueAtTime(0, t0);
      e.gain.linearRampToValueAtTime(peak, t0 + Math.max(0.001, z.attack));
      const td = t0 + z.attack + z.hold;
      e.gain.setValueAtTime(peak, td);
      if (z.sustain < 0.999) e.gain.setTargetAtTime(peak * z.sustain, td, Math.max(0.005, z.decay / 5));
      node.connect(e);
      let out = e;
      if (z.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = z.pan; e.connect(p); out = p; }
      out.connect(dest);
      src.start(when, Math.max(0, (z.start - z.sample.start) / sr));
      if (!loopOk) src.stop(when + (z.end - z.start) / sr / z.rate + 0.05);
      nodes.push(src); rel = Math.max(rel, z.release);
      if (z.exclusive && exclusiveMap) {
        const prev = exclusiveMap.get(z.exclusive);
        if (prev) prev.forEach(n => { try { n.stop(when + 0.01); } catch (x) { /* ignore */ } });
        exclusiveMap.set(z.exclusive, [src]);
      }
    });
    return { nodes, rel, loops, count: zs.length };
  }
  return { parse, noteZones, findPreset, voice, prepare, G };
})();
if (typeof module !== 'undefined') module.exports = SF2;
