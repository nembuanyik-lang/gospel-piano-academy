'use strict';
/* The phone remote, as the page sees it (the small web server itself lives in lanremote.js, in the desktop app).
   While the remote is on: the page tells the server about the open song (title, chords, words) and what is happening
   now (the chord and line being sung), and it does what the phone asks (Play, Stop, Record). */
const RemoteLink = (() => {
  const D = () => (typeof window !== 'undefined' && window.gpaDesktop && window.gpaDesktop.remoteStart ? window.gpaDesktop : null);
  let on = false, timer = null, lastMeta = '', lastLiveAt = 0, hasLive = false, wired = false;
  const openSong = () => (route.name === 'song' && route.params && route.params.pid ? S.songs.find(s => s.id === route.params.pid) : null);
  const status = () => (hasLive ? (ui.recording ? 'recording' : 'playing') : 'idle');
  function chartOf(P) {
    try {
      return arrangeSong(P).timeline.map(t => ({ label: t.label, chords: t.chs.map(c => c.name), nums: t.chs.map(c => c.number), lines: stageLyrics(P, t.type) }));
    } catch (e) { return []; }
  }
  const cache = { key: '', chart: [] };
  let lastSi = -1, lastLevel = 0;
  const nParts = () => cache.chart.length;
  const KEYS = () => E.ROOT_NAMES;
  const mixList = P => {
    const m = mixerOf(P), out = [], names = { chords: 'Keys', bass: 'Bass', drums: 'Drums', melody: 'Melody', choir: 'Choir', loops: 'Loops' };
    try {
      const A = arrangeSong(Object.assign({}, P, { mixer: undefined }), { melInst: Snd.inst() });
      Object.keys(MIX_PARTS).forEach(k => { const has = k === 'loops' ? (P.loops || []).length > 0 : k === 'choir' ? !!(P.choir && P.choir.on) : A.events.some(e => Snd.partOf(e) === k); if (has) out.push({ kind: 'part', k, name: names[k], v: Math.round((m[k].v == null ? 1 : m[k].v) * 100), mute: !!m[k].mute, solo: !!m[k].solo }); });
    } catch (e) { /* no parts */ }
    recordedTracks(P).forEach(r => out.push({ kind: 'track', k: r.id || 'guide', name: r.id ? r.name : 'Lead vocal', v: Math.round((r.T.gain == null ? 1 : r.T.gain) * 100), mute: !!r.T.mute, solo: !!r.T.solo }));
    return out;
  };
  const startPart = P => { if (ui.startFor !== P.id) { ui.startFor = P.id; ui.startPart = 0; } return Math.min(ui.startPart || 0, Math.max(0, nParts() - 1)); };
  function meta() {
    const P = openSong();
    if (!P) return { nosong: true, status: 'idle', songs: S.songs.slice(0, 60).map(s => ({ id: s.id, title: s.title || 'My song' })) };
    const key = JSON.stringify([P.id, P.title, P.key, P.bpm, P.ts, P.form, P.sections, P.lyrics, P.words]);
    if (key !== cache.key) { cache.key = key; cache.chart = chartOf(P); }
    const h = typeof SongHistory !== 'undefined' ? SongHistory : null;
    return { id: P.id, title: P.title || 'My song', key: fmt(P.key), keyName: P.key, bpm: P.bpm, status: status(), chart: cache.chart, songs: S.songs.slice(0, 60).map(s => ({ id: s.id, title: s.title || 'My song' })), mix: mixList(P), startPart: startPart(P), countin: !!ui.countin, canUndo: !!(h && h.canUndo && h.canUndo()) };
  }
  function refresh() {
    const d = D(); if (!d || !on) return;
    const m = JSON.stringify(meta());
    if (m !== lastMeta) { lastMeta = m; try { d.remoteMeta(m); } catch (e) { /* ignore */ } }
  }
  /* the chord and line being sung right now; sent at most 6 times a second */
  function live(v) {
    hasLive = !!v;
    if (v) lastSi = typeof v.si === 'number' ? v.si : lastSi; else lastSi = -1;
    const d = D(); if (!d || !on) return;
    const now = Date.now();
    if (v && now - lastLiveAt < 160) return;
    lastLiveAt = now;
    try { d.remoteLive(JSON.stringify(v ? { sec: v.sec, now: v.now, next: v.next, nn: v.nownum || '', nx: v.nextnum || '', lines: v.lines, li: v.li, si: v.si, lv: Math.round(lastLevel * 100) / 100 } : null)); } catch (e) { /* ignore */ }
    if (!v || status() !== JSON.parse(lastMeta || '{}').status) refresh();
  }
  const level = peak => { lastLevel = Math.min(1, Math.sqrt(Math.max(0, peak || 0))); };
  /* what the phone asked for. Arguments were checked by the server; they are checked again here. */
  function command(raw) {
    let c; try { c = raw && typeof raw === 'object' ? raw : typeof raw === 'string' && raw.charAt(0) === '{' ? JSON.parse(raw) : { cmd: String(raw) }; } catch (e) { return; }
    if (!c || typeof c.cmd !== 'string') return;
    const P = openSong(), ctl = (typeof PROJ_CTL !== 'undefined') ? PROJ_CTL : null;
    const recording = !!ui.recording, playing = !recording && hasLive;
    const play = document.getElementById('songplay'), rec = document.getElementById('guiderec');
    const bar = P ? 1 : 0;
    const restartHere = () => { if (playing && ctl && lastSi >= 0) ctl.play(lastSi, 0); };
    const num = (v, a, b) => (typeof v === 'number' && v >= a && v <= b);
    const done = () => setTimeout(refresh, 250);
    if (c.cmd === 'song') {
      if (recording || typeof c.id !== 'string') return; const t = S.songs.find(s => s.id === c.id); if (!t) return;
      if (ctl) ctl.stop(); ui.startFor = ''; go('song', { pid: t.id }); done(); return;
    }
    if (!P) return;
    if (c.cmd === 'play') { if (!recording && !playing && ctl) ctl.play(startPart(P), ui.countin ? bar : 0); }
    else if (c.cmd === 'record') { if (!recording && !playing && rec) rec.click(); }
    else if (c.cmd === 'stop') { if (recording && rec) rec.click(); else if (playing && ctl) { if (lastSi >= 0) { ui.startFor = P.id; ui.startPart = lastSi; } ctl.stop(); } }
    else if (c.cmd === 'restart') { if (!recording && ctl) { ui.startPart = 0; ctl.play(0, ui.countin ? bar : 0); } }
    else if (c.cmd === 'part') { if (!recording && ctl && Number.isInteger(c.i) && c.i >= 0 && c.i < nParts()) { ui.startFor = P.id; ui.startPart = c.i; lastSi = c.i; ctl.play(c.i, 0); } }
    else if (c.cmd === 'next' || c.cmd === 'prev') {
      if (recording) return; const d = c.cmd === 'next' ? 1 : -1;
      if (playing && ctl && lastSi >= 0) { lastSi = Math.max(0, Math.min(nParts() - 1, lastSi + d)); ctl.play(lastSi, 0); }
      else { ui.startFor = P.id; ui.startPart = Math.max(0, Math.min(nParts() - 1, startPart(P) + d)); }
    }
    else if (c.cmd === 'countin') { ui.countin = !!c.on; }
    else if (c.cmd === 'undo') { if (!recording && !playing && ACTIONS.hundo) ACTIONS.hundo(); }
    else if (c.cmd === 'key') {
      if (recording) return; let k = null;
      if (c.d === 1 || c.d === -1) k = KEYS()[(E.pcOfName(P.key) + c.d + 12) % 12]; else if (KEYS().includes(c.key)) k = c.key;
      if (!k || k === P.key) return;
      P.key = k; touch(); if (playing) restartHere(); else render();
    }
    else if (c.cmd === 'mix' || c.cmd === 'mute' || c.cmd === 'solo') {
      if (recording || (c.kind !== 'part' && c.kind !== 'track') || typeof c.k !== 'string') return;
      const ch = c.kind === 'part' ? (Object.prototype.hasOwnProperty.call(MIX_PARTS, c.k) ? mixerOf(P)[c.k] : null) : trackOf(P, c.k === 'guide' ? '' : c.k);
      if (!ch) return;
      if (c.cmd === 'mix') { if (!num(c.v, 0, 150)) return; if (c.kind === 'track') ch.gain = c.v / 100; else ch.v = c.v / 100; }
      else if (c.cmd === 'mute') ch.mute = !ch.mute; else ch.solo = !ch.solo;
      touch(); if (playing) restartHere(); else render();
    }
    else if (c.cmd === 'unsolo') { if (recording) return; const m = mixerOf(P); Object.keys(m).forEach(k => { m[k].solo = false; }); recordedTracks(P).forEach(r => { r.T.solo = false; }); touch(); if (playing) restartHere(); else render(); }
    done();
  }
  function wire() {
    const d = D(); if (!d || wired) return; wired = true;
    if (d.onRemoteCommand) d.onRemoteCommand(command);
  }
  function setOn(v, info) {
    on = !!v; ui.remote = on ? info : null; clearInterval(timer); timer = null; lastMeta = '';
    if (on) { wire(); refresh(); timer = setInterval(refresh, 700); }
  }
  async function start() {
    const d = D(); if (!d) return { ok: false, error: 'not the desktop app' };
    const r = await d.remoteStart(); if (r && r.ok && r.on) setOn(true, r); return r;
  }
  async function stop() {
    const d = D(); if (!d) return { ok: true };
    const r = await d.remoteStop(); setOn(false); return r;
  }
  return { start, stop, live, level, refresh, command, available: () => !!D(), isOn: () => on, meta, _setOn: setOn };
})();

function remoteCard() {
  if (!RemoteLink.available()) return '';
  const r = ui.remote;
  return '<section class="card" id="remotecard"><p class="eyebrow">Phone remote</p><h3>Use your phone as a remote and a chord screen</h3>' +
    '<p class="muted">Your phone shows the chords and words while the song plays or records. It can play, stop and record, jump to any part, change the key, set the volume, mute or solo a part, switch songs and undo. It works on your own Wi-Fi, with no internet. The band can follow on their phones too.</p>' +
    (r ? '<div class="callout"><p><strong>On the phone, open this address in the browser:</strong></p>' +
      (r.urls && r.urls.length ? r.urls.map(u => '<p class="remoteurl">' + esc(u) + '</p>').join('') : '<p class="muted">No Wi-Fi was found. Connect this computer to the Wi-Fi, or switch on the phone\'s hotspot and connect the computer to it, then turn this off and on again.</p>') +
      '<p class="tiny muted">The phone and this computer must be on the same Wi-Fi (or the computer connected to the phone\'s hotspot). The first time, Windows may ask to allow the Academy on your network: choose Private networks. The code in the address changes every time you turn this on. Only people who have the address can use it.</p></div>' +
      '<div class="row wrap"><button class="btn ghost sm" type="button" data-act="remoteoff">Turn the phone remote off</button></div>'
      : '<div class="row wrap"><button class="btn primary sm" type="button" data-act="remoteon">Turn the phone remote on</button></div>') +
    '</section>';
}

Object.assign(PROJECT_ACTIONS, {
  remoteon: async () => { const r = await RemoteLink.start(); if (!r || !r.ok) toast('The phone remote could not start' + (r && r.error ? ' (' + r.error + ')' : '') + '.'); render(); },
  remoteoff: async () => { await RemoteLink.stop(); render(); }
});
