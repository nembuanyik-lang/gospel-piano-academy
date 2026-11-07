'use strict';
/* ---------------------------------------------------------------- input bus
   Every note, whether from a screen key, a computer key or (later) a MIDI keyboard,
   goes through Input.noteOn. Screens subscribe with Input.listen. */
const Act = { last: Date.now() };
document.addEventListener('pointerdown', () => { Act.last = Date.now(); }, true);
document.addEventListener('keydown', () => { Act.last = Date.now(); }, true);
const Input = {
  listeners: new Set(), offListeners: new Set(), pianos: new Set(), base: 60,
  /* app-wide listeners that survive screen redraws (screens use listen(), which is cleared on every redraw) */
  always: new Set(), alwaysOff: new Set(),
  listen(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  listenOff(fn) { this.offListeners.add(fn); return () => this.offListeners.delete(fn); },
  noteOn(m, src, vel) {
    Act.last = Date.now();
    if (!(src === 'midi' && S.prefs.midiSound === 'keyboard')) Snd.noteOn(m, vel);   // the keyboard makes its own sound
    this.pianos.forEach(p => p.visual(m, true));
    if (!S.events.firstNote) { S.events.firstNote = Date.now(); touch(); }
    const ev = { midi: m, t: performance.now(), ctx: Snd.now(), src: src || 'ui', vel: vel };
    this.always.forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } });
    this.listeners.forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } });
  },
  noteOff(m) {
    Snd.noteOff(m); this.pianos.forEach(p => p.visual(m, false));
    const ev = { midi: m, ctx: Snd.now() };
    this.alwaysOff.forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } });
    this.offListeners.forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } });
  }
};
App.Input = Input;

/* ---- MIDI keyboard (Web MIDI). Everything a MIDI key does goes through Input, the same path as the screen keys. ---- */
/* General MIDI sound families by program number (0-127). Drum kits use bank 127. */
const GM_FAMILIES = [[0, 3, 'piano'], [4, 5, 'electric piano'], [6, 7, 'piano'], [8, 15, 'bells'], [16, 23, 'organ'], [24, 31, 'guitar'], [32, 39, 'bass'],
  [40, 47, 'strings'], [48, 51, 'strings'], [52, 54, 'choir'], [55, 55, 'hit'], [56, 63, 'brass'], [64, 71, 'reed'], [72, 79, 'flute'],
  [80, 87, 'synth lead'], [88, 95, 'pad'], [96, 103, 'synth effect'], [104, 111, 'ethnic'], [112, 119, 'percussion'], [120, 127, 'sound effect']];
function gmFamily(program, msb) {
  if (msb === 127 || msb === 126) return 'drums';
  const f = GM_FAMILIES.find(r => program >= r[0] && program <= r[1]); return f ? f[2] : 'other';
}
const Midi = {
  supported: typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function',
  access: null, status: 'idle', names: [], onChange: null, last: 0,
  emit() { if (this.onChange) { try { this.onChange(); } catch (e) { console.error(e); } } },
  async connect() {
    if (!this.supported) { this.status = 'unsupported'; this.emit(); return false; }
    try {
      this.status = 'asking'; this.emit();
      if (!this.access) this.access = await navigator.requestMIDIAccess({ sysex: false });
      this.access.onstatechange = () => this.scan();
      S.prefs.midi = true; touch();
      this.scan();
      return true;
    } catch (e) {
      this.error = (e && (e.name || e.message)) || '';
      this.status = 'denied'; this.emit(); return false;
    }
  },
  scan() {
    const names = [];
    this.access.inputs.forEach(inp => { names.push(inp.name || 'MIDI keyboard'); inp.onmidimessage = m => this.handle(m); });
    this.names = names;
    this.status = names.length ? 'ready' : 'nodevice';
    this.emit();
  },
  /* Besides keys, a keyboard sends its buttons: voice changes (program change), the sustain pedal,
     style start/stop and a timing clock. Screens that teach the keyboard itself listen with Midi.on(). */
  evListeners: new Set(), bank: [0, 0], clocks: [], pedalDown: false, lastProgram: null,
  on(fn) { this.evListeners.add(fn); return () => this.evListeners.delete(fn); },
  fire(ev) { ev.t = performance.now(); this.evListeners.forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } }); },
  /* tempo from the keyboard's MIDI clock (24 ticks per beat), or null if no steady clock arrived in the last 2 seconds */
  clockBpm() {
    const now = performance.now(), c = this.clocks.filter(t => now - t < 2000);
    if (c.length < 25) return null;
    const span = c[c.length - 1] - c[0], per = span / (c.length - 1);
    return per > 0 ? Math.round(60000 / (per * 24)) : null;
  },
  handle(m) {
    const d = m.data; if (!d || !d.length) return;
    const b0 = d[0];
    if (b0 >= 0xF8) {                               // system real-time: one byte
      if (b0 === 0xF8) { this.clocks.push(performance.now()); if (this.clocks.length > 96) this.clocks.splice(0, this.clocks.length - 96); }
      else if (b0 === 0xFA || b0 === 0xFB) { this.clocks = []; this.fire({ type: 'start' }); }
      else if (b0 === 0xFC) this.fire({ type: 'stop' });
      return;
    }
    if (d.length < 2) return;
    const st = b0 & 0xf0, note = d[1], vel = d.length > 2 ? d[2] : 0;
    if (st === 0xC0) { this.lastProgram = { program: note, msb: this.bank[0], lsb: this.bank[1] }; this.fire(Object.assign({ type: 'program', family: gmFamily(note, this.bank[0]) }, this.lastProgram)); return; }
    if (st === 0xB0 && note === 0) this.bank[0] = vel;
    else if (st === 0xB0 && note === 32) this.bank[1] = vel;
    if (st === 0xB0 && note === 64) { const down = vel >= 64; Snd.pedal(down, 'midi'); if (down !== this.pedalDown) { this.pedalDown = down; this.fire({ type: 'pedal', down }); } }
    else if (st === 0xB0 && (note === 123 || note === 120)) { Snd.pedal(false, 'midi'); }
    else if (st === 0x90 && vel > 0) { this.last = Date.now(); Input.noteOn(note, 'midi', vel / 127); }
    else if (st === 0x80 || (st === 0x90 && vel === 0)) Input.noteOff(note);
  },
  disconnect() {
    if (this.access) this.access.inputs.forEach(inp => { inp.onmidimessage = null; });
    this.names = []; this.status = 'idle'; S.prefs.midi = false; touch(); this.emit();
  },
  text() {
    if (!this.supported) return Desk ? 'MIDI is not available on this computer.' : 'This browser cannot read MIDI keyboards. Chrome or Edge on a computer or Android can.';
    return ({ idle: 'Not connected.', asking: 'Waiting for your permission…', denied: Desk ? 'The app could not open MIDI' + (this.error ? ' (' + this.error + ')' : '') + '. Update the app (Profile > About > Check for updates), close other music programs such as FL Studio, then press Connect again.' : 'Permission was declined. Allow MIDI in the browser site settings and try again.', nodevice: 'Allowed, but no keyboard found. Plug it in and switch it on.', ready: 'Connected: ' + this.names.join(', ') })[this.status];
  }
};
App.Midi = Midi;
/* Keys are matched by their position on the keyboard (e.code), so the layout works the same on QWERTY and AZERTY
   keyboards and a key released while Shift is held still lets the note go. */
const KEYMAP = { KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16 };
const heldKeys = new Map();
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  const t = e.target;
  if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
  const k = e.code;
  if (!(k in KEYMAP) || heldKeys.has(k)) return;
  const m = Input.base + KEYMAP[k];
  heldKeys.set(k, m);
  Input.noteOn(m, 'key');
});
window.addEventListener('keydown', e => {
  if (e.key === 'Shift' && !e.repeat) { const t = e.target; if (!(t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable))) Snd.pedal(true, 'key'); }
});
window.addEventListener('keyup', e => { if (e.key === 'Shift') Snd.pedal(false, 'key'); });
window.addEventListener('keyup', e => {
  const k = e.code;
  if (heldKeys.has(k)) { Input.noteOff(heldKeys.get(k)); heldKeys.delete(k); }
});
window.addEventListener('blur', () => { heldKeys.forEach(m => Input.noteOff(m)); heldKeys.clear(); });


/* ---------------------------------------------------------------- sending music to the keyboard (MIDI out)
   The YPT-240 (like most keyboards) plays notes it receives over USB, on 16 channels, with General MIDI
   sounds. The Song Lab sends its backing this way: chords on channel 2, bass on 3, melody on 4, drums on 10,
   so the keyboard's own panel voice on channel 1 is left alone. Notes are scheduled a little ahead with
   timestamps, so timing stays steady; Stop silences every channel. */
const KBD_SOUNDS = [[0, 'Piano'], [4, 'Electric piano'], [19, 'Organ'], [48, 'Strings'], [52, 'Choir'], [88, 'Pad']];
const MidiOut = {
  CH: { chords: 1, bass: 2, melody: 3, drums: 9, click: 9 },
  port() {
    if (typeof Midi === 'undefined' || !Midi.access || !Midi.access.outputs) return null;
    let best = null; Midi.access.outputs.forEach(o => { if (!best || (Midi.names[0] && o.name === Midi.names[0])) best = o; });
    return best;
  },
  ready() { return !!this.port(); },
  name() { const p = this.port(); return p ? (p.name || 'your keyboard') : ''; },
  send(data, at) { const p = this.port(); if (!p) return false; try { at ? p.send(data, at) : p.send(data); return true; } catch (e) { return false; } },
  silence() { [1, 2, 3, 9].forEach(c => { this.send([0xB0 | c, 64, 0]); this.send([0xB0 | c, 123, 0]); }); },
  setup(o) {
    o = o || {};
    this.send([0xC0 | this.CH.chords, o.chordProg == null ? 0 : o.chordProg]);
    this.send([0xC0 | this.CH.bass, 33]);
    this.send([0xC0 | this.CH.melody, o.melProg == null ? 0 : o.melProg]);
    [[1, 96], [2, 110], [3, 112], [9, 100]].forEach(([c, v]) => this.send([0xB0 | c, 7, v]));
  },
  /* the part an arranged event belongs to */
  partOf(e) { return e.click ? 'click' : e.drum ? 'drums' : e.mel || e.choir ? 'melody' : e.part === 'bass' ? 'bass' : 'chords'; },
  /* play a Song Lab script ({ events, bpm, total }) through the keyboard; same callbacks as Snd.play */
  play(script, o) {
    o = o || {};
    if (!this.ready()) return null;
    const spb = 60000 / script.bpm, DR = { k: 36, s: 38, h: 42, o: 46, r: 37, cl: 39, c: 49, th: 50, tm: 47, tl: 43, sw: 52 };
    const evs = [];
    script.events.forEach(e => {
      const part = this.partOf(e), ch = this.CH[part], vel = Math.max(1, Math.min(127, Math.round((e.vel == null ? 0.7 : e.vel) * (part === 'drums' ? 110 : 120))));
      const notes = part === 'drums' ? [DR[e.drum] || 38] : part === 'click' ? [e.click === 2 ? 76 : 77] : (e.notes || []);
      notes.forEach(m => { evs.push({ at: e.t, on: true, ch, m, vel }); evs.push({ at: e.t + Math.max(0.05, (part === 'drums' || part === 'click' ? 0.2 : e.d || 0.5) * 0.98), on: false, ch, m }); });
    });
    evs.sort((a, b) => a.at - b.at || (a.on ? 1 : -1));
    this.setup(o);
    const sounding = new Map();
    let start = performance.now() + 250, i = 0, timer = null, stopped = false, pass = 0;
    const self = this;
    function pump() {
      if (stopped) return;
      const horizon = performance.now() + 300;
      while (i < evs.length) {
        const ev = evs[i], at = start + ev.at * spb; if (at > horizon) break;
        const key = ev.ch * 128 + ev.m;
        if (ev.on) { self.send([0x90 | ev.ch, ev.m, ev.vel], at); sounding.set(key, ev); }
        else { self.send([0x80 | ev.ch, ev.m, 0], at); sounding.delete(key); }
        i++;
      }
      if (i >= evs.length) {
        const endAt = start + script.total * spb;
        if (o.loop && !stopped) { start = endAt; i = 0; pass++; return; }
        if (performance.now() >= endAt) { clearInterval(timer); timer = null; if (o.onEnd) o.onEnd(); }
      }
    }
    if (o.onStart) { const ctxStart = Snd.now() + (start - performance.now()) / 1000; try { o.onStart(ctxStart, Snd.ensure ? Snd.ensure() : null, undefined); } catch (e) { console.error(e); } }
    pump(); timer = setInterval(pump, 40);
    return {
      stop() { stopped = true; if (timer) clearInterval(timer); timer = null; sounding.forEach(ev => self.send([0x80 | ev.ch, ev.m, 0])); sounding.clear(); self.silence(); },
      get pass() { return pass; }
    };
  },
  /* a short test: a C major chord and a bass C, so you can hear that the keyboard answers */
  test(prog) {
    if (!this.ready()) return false;
    this.setup({ chordProg: prog });
    const t = performance.now() + 50;
    [60, 64, 67].forEach(m => { this.send([0x90 | this.CH.chords, m, 100], t); this.send([0x80 | this.CH.chords, m, 0], t + 1200); });
    this.send([0x90 | this.CH.bass, 36, 110], t); this.send([0x80 | this.CH.bass, 36, 0], t + 1200);
    return true;
  }
};
