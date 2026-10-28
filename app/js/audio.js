'use strict';
/* ---------------------------------------------------------------- sound */
const Snd = (function () {
  /* A piano voice built from inharmonic partials (stiff-string model), a hammer-strike spectrum and
     comb, detuned unison strings, a hammer noise burst, velocity-dependent brightness, pitch-dependent
     decay and a damper release. If recorded samples are installed (see samples/manifest.json) they are
     used instead and the synthesised voice is the fallback. */
  let ctx = null, master = null, outBus = null, noiseBuf = null, current = null;
  const sample = { state: 'idle', notes: [], credit: '' };
  const live = new Map();        // midi -> voice held by a key
  const sustained = new Set();   // voices whose key is up but the pedal holds them
  let pedalDown = false;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function makeImpulse(c) {
    const len = Math.floor(c.sampleRate * 1.6), buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.33));
    }
    return buf;
  }
  function resetContext() {   // throw the audio context away; the next sound builds a fresh one (fixes a stuck audio device)
    const old = ctx; ctx = null; master = null; outBus = null; noiseBuf = null; current = null;
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
      master.connect(comp);
      try { // light room ambience
        const conv = ctx.createConvolver(); conv.buffer = makeImpulse(ctx);
        const wet = ctx.createGain(); wet.gain.value = 0.11;
        master.connect(conv); conv.connect(wet); wet.connect(comp);
      } catch (e) { /* no reverb */ }
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      ctx.onstatechange = () => { if (ctx && ctx.state !== 'running' && !document.hidden) wake(); };
      loadSamples();
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

  /* ---------- other instruments (all synthesised, no sample files needed) ---------- */
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
    piano: { label: 'Grand piano', hint: 'The default teaching sound.', chordy: true },
    epiano: { label: 'Electric piano', hint: 'Soft, bell-like keys.', chordy: true, build(c, v, m, when, vel, amp, f, light) {
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
    guitar: { label: 'Acoustic guitar (synth)', hint: 'A plucked-string sound, used in the Guitar course.', chordy: true, build(c, v, m, when, vel, amp, f, light) {
      const e = c.createGain(), lp = c.createBiquadFilter(); v.rel = 0.14;
      lp.type = 'lowpass'; lp.Q.value = 0.7; lp.frequency.setValueAtTime(clamp(f * 10, 1800, 9000), when); lp.frequency.setTargetAtTime(clamp(f * 2.2, 500, 2600), when, 0.16);
      e.gain.setValueAtTime(0, when); e.gain.linearRampToValueAtTime(amp * 1.1, when + 0.003); e.gain.setTargetAtTime(0, when + 0.012, clamp(2.0 - (m - 40) * 0.022, 0.55, 2.0));
      e.connect(lp); lp.connect(v.vg);
      [['sawtooth', 0, 0.34], ['triangle', 6, 0.5], ['square', -5, 0.1]].forEach(a => { const o = c.createOscillator(), g = c.createGain(); o.type = a[0]; o.frequency.value = f; o.detune.value = a[1]; g.gain.value = a[2]; o.connect(g); g.connect(e); o.start(when); o.stop(when + 9); v.nodes.push(o); });
      if (!light && noiseBuf) { const ns = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain(); ns.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = clamp(f * 5, 1200, 5000); bp.Q.value = 0.9; ng.gain.setValueAtTime(amp * 0.22, when); ng.gain.setTargetAtTime(0, when, 0.012); ns.connect(bp); bp.connect(ng); ng.connect(v.vg); ns.start(when); ns.stop(when + 0.08); v.nodes.push(ns); }
    } },
    organ: { label: 'Organ', hint: 'Full drawbar organ with a gentle vibrato.', chordy: true, build(c, v, m, when, vel, amp, f, light) {
      const bars = light ? [[1, 8], [2, 8], [3, 4], [0.5, 6]] : [[0.5, 6], [1.5, 5], [1, 8], [2, 7], [3, 4], [4, 5], [5, 2], [6, 2], [8, 3]];
      const sum = bars.reduce((a, b) => a + b[1], 0), e = env(c, v, when, 1, 0.01, 0.05), vb = lfoFor(c).fast;
      bars.forEach(([r, lv]) => { if (f * r > 10000) return; const g = c.createGain(); g.gain.value = amp * 0.9 * lv / sum; g.connect(e); osc(c, 'sine', f * r, g, when, v, 0, vb); });
      if (!light && noiseBuf) {   // key click
        const ns = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
        ns.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = clamp(f * 6, 1500, 6000); bp.Q.value = 1.2;
        ng.gain.setValueAtTime(amp * 0.16, when); ng.gain.setTargetAtTime(0, when, 0.008);
        ns.connect(bp); bp.connect(ng); ng.connect(v.vg); ns.start(when); ns.stop(when + 0.06); v.nodes.push(ns);
      }
    } },
    strings: { label: 'Strings', hint: 'A warm string section that swells in.', chordy: true, build(c, v, m, when, vel, amp, f, light) {
      const e = env(c, v, when, 1, 0.2 + 0.12 * (1 - vel), 0.32), lp = c.createBiquadFilter(), vb = lfoFor(c).slow;
      lp.type = 'lowpass'; lp.Q.value = 0.5; lp.frequency.value = clamp(f * 3 + 1400, 1800, 6500); lp.connect(e);
      const det = light ? [-8, 8] : [-12, -4, 5, 13], g = c.createGain(); g.gain.value = amp * (light ? 0.34 : 0.25); g.connect(lp);
      det.forEach(d => osc(c, 'sawtooth', f, g, when, v, d, vb));
    } },
    brass: { label: 'Trumpet', hint: 'A bright brass lead.', chordy: false, build(c, v, m, when, vel, amp, f, light) {
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
    choir: { label: 'Choir (aah)', hint: 'Soft sung voices.', chordy: true, build(c, v, m, when, vel, amp, f, light) {
      const e = env(c, v, when, 1, 0.16, 0.34), vb = lfoFor(c).slow, src = c.createGain(); src.gain.value = 1;
      [[800, 7, 1], [1150, 8, 0.55], [2900, 10, 0.3]].forEach(([hz, q, gn]) => {
        const bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = hz; bp.Q.value = q; g.gain.value = amp * 1.15 * gn;
        src.connect(bp); bp.connect(g); g.connect(e);
      });
      const sg = c.createGain(); sg.gain.value = 0.5; sg.connect(src);
      [-7, 7].slice(0, light ? 1 : 2).forEach(d => osc(c, 'sawtooth', f, sg, when, v, d, vb));
    } },
    flute: { label: 'Flute', hint: 'A breathy, singing melody sound.', chordy: false, build(c, v, m, when, vel, amp, f, light) {
      const e = env(c, v, when, 1, 0.06, 0.12), vb = lfoFor(c).slow;
      [[1, 1], [2, 0.28], [3, 0.09]].forEach(([r, lv]) => { if (f * r > 9000) return; const g = c.createGain(); g.gain.value = amp * 0.85 * lv; g.connect(e); osc(c, 'sine', f * r, g, when, v, 0, vb); });
      if (noiseBuf && !light) {
        const ns = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
        ns.buffer = noiseBuf; ns.loop = true; bp.type = 'bandpass'; bp.frequency.value = clamp(f * 3, 800, 6000); bp.Q.value = 1.6;
        ng.gain.setValueAtTime(amp * 0.07, when); ns.connect(bp); bp.connect(ng); ng.connect(e); ns.start(when); ns.stop(when + 120); v.nodes.push(ns);
      }
    } }
  };
  const TRIM = { epiano: [0.395, 0.62], organ: [0.74, 0.79], strings: [0.67, 1.10], brass: [0.49, 1.08], choir: [1.29, 2.85], flute: [0.26, 0.26] };   // loudness match to the piano (full voice, light voice)
  const instId = () => (S.prefs && INSTR[S.prefs.instrument] ? S.prefs.instrument : 'piano');
  const instList = () => Object.keys(INSTR).map(id => ({ id, label: INSTR[id].label, hint: INSTR[id].hint }));
  const backingInst = () => (INSTR[instId()].chordy ? instId() : 'piano');

  /* ---------- voice ---------- */
  function buildVoice(c, dest, m, when, vel, level, light, inst) {   // light = fewer partials, used for scripted playback so long backings stay smooth
    vel = clamp(vel == null ? 0.7 : vel, 0.05, 1);
    const f = hz(m);
    const v = { m, c, vg: c.createGain(), nodes: [], released: false, keyDown: false };
    let tail = dest;
    if (c.createStereoPanner) { const pan = c.createStereoPanner(); pan.pan.value = clamp((m - 60) / 70, -0.5, 0.5); pan.connect(dest); tail = pan; }
    v.vg.connect(tail);
    const amp = level * (0.07 + 0.93 * Math.pow(vel, 1.5));
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4;
    lp.connect(v.vg);
    if (inst && inst !== 'piano' && INSTR[inst] && INSTR[inst].build) { INSTR[inst].build(c, v, m, when, vel, amp * (TRIM[inst] ? TRIM[inst][light ? 1 : 0] : 1), f, light); return v; }
    const smp = pickSample(m);
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
    v.nodes.forEach(n => { try { n.stop(end); } catch (e) { /* ignore */ } });
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
    const v = buildVoice(c, master, m, c.currentTime + 0.002, vel, 0.7, false, instId());
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
  function drumHit(when, type, vel, dest, cx) {
    const c = cx || ctx, v = (vel || 0.7) * 0.6;
    if (!c) return;
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
    else { f.type = 'highpass'; f.frequency.value = 7000; dur = 0.05; lvl = 0.5 * v; }
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(Math.max(0.001, lvl), when + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    ns.connect(f); f.connect(g); g.connect(dest); ns.start(when, 0, dur + 0.02);
  }
  function stopAll() { if (current) { const h = current; current = null; h.stop(); } }
  function play(script, o) {
    o = o || {};
    stopAll();
    if (!S.prefs.sound && !o.force) { if (App.toast) App.toast('Sound is off. Turn it on in Profile.'); if (o.onEnd) o.onEnd(); return { stop() {}, silent: true }; }
    const c = ensure();
    if (!c) { if (App.toast) App.toast('Sound is not available on this device.'); if (o.onEnd) o.onEnd(); return { stop() {}, silent: true }; }
    const speed = o.speed || 1, spb = 60 / script.bpm / speed;
    const bus = c.createGain(); bus.connect(master);
    const timers = new Set(); let stopped = false, ended = false, pumpId = null;
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, Math.max(0, ms)); timers.add(id); };
    const loopBeats = Math.max(1, Math.ceil(script.total));
    const evs = script.events.slice().sort((x, y) => x.t - y.t);
    const AHEAD = 1.5;                       // seconds of music kept scheduled in advance
    let passStart = c.currentTime + 0.08, idx = 0, lastPass = false, endAt = 0;
    if (o.onStart) { try { o.onStart(passStart, c, bus); } catch (e) { console.error(e); } }
    function end() { if (ended) return; ended = true; if (o.onEnd) o.onEnd(); }
    function schedule(e, t) {
      const d = Math.max(0.12, e.d * spb);
      if (e.drum) drumHit(t, e.drum, e.vel, bus);
      else if (e.click) click(t, e.click === 2, bus);
      else if (e.notes && e.notes.length) {
        const lvl = 0.62 / Math.sqrt(Math.max(1, e.notes.length * 0.8));
        const ins = e.inst || (typeof o.inst === 'function' ? o.inst() : o.inst) || 'piano';
        e.notes.forEach(m => { const v = buildVoice(c, bus, m, t, e.vel || 0.68, lvl, true, ins); release(v, t + d); });
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
          if (typeof o.loop === 'function' ? o.loop() : !!o.loop) { passStart = boundary; idx = 0; continue; }
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
        try { bus.gain.cancelScheduledValues(c.currentTime); bus.gain.setTargetAtTime(0, c.currentTime, 0.03); } catch (e) { /* ignore */ }
        setTimeout(() => { try { bus.disconnect(); } catch (e) { /* ignore */ } }, 500);
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
    info: () => ({ mode: sample.state === 'ready' ? 'recorded' : 'synth', credit: sample.credit, loading: sample.state === 'loading' }),
    _buildVoice: buildVoice, _ctx: () => ctx, reset: resetContext, releaseAll, _release: release, held: () => live.size + sustained.size,
    inst: instId, instruments: instList, backingInst, hasInst: id => !!INSTR[id],
    /* play a recorded AudioBuffer (a guide vocal) at an exact audio-clock time, through a given bus */
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
      if (sample.state === 'loading') { for (let i = 0; i < 50 && sample.state === 'loading'; i++) await new Promise(r => setTimeout(r, 100)); }
      const SR = 44100, spb = 60 / script.bpm, len = Math.ceil((script.total * spb + 3) * SR);
      const c = new OfflineAudioContext(2, len, SR);
      const mst = c.createGain(); mst.gain.value = 0.9;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
      comp.connect(c.destination); mst.connect(comp);
      try { const conv = c.createConvolver(); conv.buffer = makeImpulse(c); const wet = c.createGain(); wet.gain.value = 0.11; mst.connect(conv); conv.connect(wet); wet.connect(comp); } catch (e) { /* no reverb */ }
      const t0 = 0.05;
      script.events.forEach(e => {
        const t = t0 + e.t * spb, d = Math.max(0.12, e.d * spb);
        if (e.drum) drumHit(t, e.drum, e.vel, mst, c);
        else if (e.click) click(t, e.click === 2, mst, c);
        else if (e.notes && e.notes.length) {
          const lvl = 0.62 / Math.sqrt(Math.max(1, e.notes.length * 0.8));
          const ins = e.inst || (typeof o.inst === 'function' ? o.inst() : o.inst) || 'piano';
          e.notes.forEach(m => { const v = buildVoice(c, mst, m, t, e.vel || 0.68, lvl, false, ins); release(v, t + d); });
        }
      });
      (o.extra || []).forEach(x => { if (!x.buffer) return; const src = c.createBufferSource(), g = c.createGain(); src.buffer = x.buffer; g.gain.value = x.gain == null ? 1 : x.gain; src.connect(g); g.connect(comp); src.start(t0 + Math.max(0, x.at || 0)); });
      return c.startRendering();
    },
    preview() { const c = ensure(); if (!c) return; [60, 64, 67].forEach(m => { const v = buildVoice(c, master, m, c.currentTime + 0.01, 0.7, 0.5, true, instId()); release(v, c.currentTime + 1.1); }); }
  };
})();
App.Snd = Snd;
