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
      return arrangeSong(P).timeline.map(t => ({ label: t.label, chords: t.chs.map(c => c.name), lines: stageLyrics(P, t.type) }));
    } catch (e) { return []; }
  }
  const cache = { key: '', chart: [] };
  function meta() {
    const P = openSong();
    if (!P) return { nosong: true, status: 'idle' };
    const key = JSON.stringify([P.id, P.title, P.key, P.bpm, P.ts, P.form, P.sections, P.lyrics, P.words]);
    if (key !== cache.key) { cache.key = key; cache.chart = chartOf(P); }
    return { title: P.title || 'My song', key: fmt(P.key), bpm: P.bpm, status: status(), chart: cache.chart };
  }
  function refresh() {
    const d = D(); if (!d || !on) return;
    const m = JSON.stringify(meta());
    if (m !== lastMeta) { lastMeta = m; try { d.remoteMeta(m); } catch (e) { /* ignore */ } }
  }
  /* the chord and line being sung right now; sent at most 6 times a second */
  function live(v) {
    hasLive = !!v;
    const d = D(); if (!d || !on) return;
    const now = Date.now();
    if (v && now - lastLiveAt < 160) return;
    lastLiveAt = now;
    try { d.remoteLive(JSON.stringify(v ? { sec: v.sec, now: v.now, next: v.next, lines: v.lines, li: v.li } : null)); } catch (e) { /* ignore */ }
    if (!v || status() !== JSON.parse(lastMeta || '{}').status) refresh();
  }
  function command(c) {
    if (!openSong()) return;
    const play = document.getElementById('songplay'), rec = document.getElementById('guiderec');
    const recording = !!ui.recording, playing = !recording && !!play && /Stop/.test(play.textContent);
    if (c === 'play') { if (!recording && !playing && play) play.click(); }
    else if (c === 'record') { if (!recording && !playing && rec) rec.click(); }
    else if (c === 'stop') { if (recording && rec) rec.click(); else if (playing && play) play.click(); }
    setTimeout(refresh, 300);
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
  return { start, stop, live, refresh, command, available: () => !!D(), isOn: () => on, meta, _setOn: setOn };
})();

function remoteCard() {
  if (!RemoteLink.available()) return '';
  const r = ui.remote;
  return '<section class="card" id="remotecard"><p class="eyebrow">Phone remote</p><h3>Use your phone as a remote and a chord screen</h3>' +
    '<p class="muted">Your phone shows the chords and words while the song plays or records, and has Play, Stop and Record buttons. It works on your own Wi-Fi, with no internet. The band can follow on their phones too.</p>' +
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
