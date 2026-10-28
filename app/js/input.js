'use strict';
/* ---------------------------------------------------------------- input bus
   Every note, whether from a screen key, a computer key or (later) a MIDI keyboard,
   goes through Input.noteOn. Screens subscribe with Input.listen. */
const Act = { last: Date.now() };
document.addEventListener('pointerdown', () => { Act.last = Date.now(); }, true);
document.addEventListener('keydown', () => { Act.last = Date.now(); }, true);
const Input = {
  listeners: new Set(), offListeners: new Set(), pianos: new Set(), base: 60,
  listen(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  listenOff(fn) { this.offListeners.add(fn); return () => this.offListeners.delete(fn); },
  noteOn(m, src, vel) {
    Act.last = Date.now();
    Snd.noteOn(m, vel);
    this.pianos.forEach(p => p.visual(m, true));
    if (!S.events.firstNote) { S.events.firstNote = Date.now(); touch(); }
    const ev = { midi: m, t: performance.now(), ctx: Snd.now(), src: src || 'ui', vel: vel };
    this.listeners.forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } });
  },
  noteOff(m) {
    Snd.noteOff(m); this.pianos.forEach(p => p.visual(m, false));
    const ev = { midi: m, ctx: Snd.now() };
    this.offListeners.forEach(fn => { try { fn(ev); } catch (e) { console.error(e); } });
  }
};
App.Input = Input;

/* ---- MIDI keyboard (Web MIDI). Everything a MIDI key does goes through Input, the same path as the screen keys. ---- */
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
  handle(m) {
    const d = m.data; if (!d || d.length < 2) return;
    const st = d[0] & 0xf0, note = d[1], vel = d.length > 2 ? d[2] : 0;
    if (st === 0xB0 && note === 64) Snd.pedal(vel >= 64, 'midi');
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
    return ({ idle: 'Not connected.', asking: 'Waiting for your permission…', denied: Desk ? 'The keyboard could not be opened. Close other music programs that may be using it, then press Connect again.' : 'Permission was declined. Allow MIDI in the browser site settings and try again.', nodevice: 'Allowed, but no keyboard found. Plug it in and switch it on.', ready: 'Connected: ' + this.names.join(', ') })[this.status];
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
