'use strict';
/* Gospel Music Academy: the phone remote.
   A tiny web server that runs only while you switch it on. A phone on the same Wi-Fi (or on the computer's own
   hotspot) opens its address, types nothing but the 6-number code in the link, and sees the song's chords and words
   as it plays, with Play, Stop and Record buttons. It needs no internet: the page is built into the app and nothing
   leaves your own network. Only a short list of commands is accepted. */
const http = require('http');
const os = require('os');
const crypto = require('crypto');

const COMMANDS = new Set(['play', 'stop', 'record']);
const MAX_BODY = 1024, MAX_STATE = 96 * 1024;

function lanAddresses() {
  const out = [], nets = os.networkInterfaces();
  Object.keys(nets).forEach(n => (nets[n] || []).forEach(a => { if ((a.family === 'IPv4' || a.family === 4) && !a.internal) out.push(a.address); }));
  return out;
}

function phonePage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#17181C"><title>Song remote</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#17181C;color:#F4F4F0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;min-height:100vh;display:flex;flex-direction:column}
header{padding:12px 16px;border-bottom:1px solid #33353C}h1{margin:0;font-size:1.1rem}#meta{color:#A9ABB5;font-size:.85rem;margin-top:2px}
#chip{display:inline-block;margin-top:6px;padding:2px 10px;border-radius:99px;background:#33353C;font-size:.8rem}#chip.rec{background:#9B1C3C}#chip.play{background:#1E6B45}
main{flex:1;padding:16px;display:flex;flex-direction:column;gap:12px}
#sec{color:#A9ABB5;font-size:1rem}#now{font-size:5.5rem;font-weight:800;line-height:1;word-break:break-word}#next{color:#E9B949;font-size:1.5rem;min-height:1.8rem}
#lines p{margin:.3rem 0;font-size:1.5rem;color:#8A8C96}#lines p.on{color:#fff;font-weight:700;font-size:1.9rem}#lines p.past{opacity:.45}
.btns{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid #33353C;position:sticky;bottom:0;background:#17181C}
button{border:0;border-radius:14px;padding:18px 6px;font-size:1.1rem;font-weight:700;color:#fff;background:#3A3D47}button.p{background:#1E6B45}button.r{background:#9B1C3C}button:disabled{opacity:.4}
details{background:#202229;border-radius:12px;padding:10px 14px}summary{font-weight:700}.sec{margin:.6rem 0 .1rem;color:#E9B949;font-weight:700}.ch{font-size:1.1rem}.ly{color:#A9ABB5;font-size:.95rem}
#lost{display:none;background:#9B1C3C;padding:8px 16px;text-align:center}
</style></head><body><div id="lost">Lost the computer. Check that the Academy is open and on the same Wi-Fi.</div>
<header><h1 id="title">Song remote</h1><div id="meta"></div><span id="chip">connecting…</span></header>
<main><div id="sec"></div><div id="now"></div><div id="next"></div><div id="lines"></div><details id="chart"><summary>The whole song</summary><div id="chartbody"></div></details></main>
<div class="btns"><button class="p" id="bplay">Play</button><button id="bstop">Stop</button><button class="r" id="brec">Record</button></div>
<script>
var K=new URLSearchParams(location.search).get('k')||'',$=function(i){return document.getElementById(i)};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var chartKey='';
function show(s){
  $('lost').style.display='none';
  var m=s.meta||{},l=s.live;
  $('title').textContent=m.title||'Song remote';
  $('meta').textContent=m.title?(m.key||'')+' · '+(m.bpm||'')+' BPM':'';
  var chip=$('chip'),st=m.status||'idle';
  chip.className=st==='recording'?'rec':st==='playing'?'play':'';
  chip.textContent=m.nosong?'Open a song on the computer':st==='recording'?'Recording':st==='playing'?'Playing':'Ready';
  $('bplay').disabled=$('brec').disabled=!!m.nosong;
  if(l&&st!=='idle'){$('sec').textContent=l.sec||'';$('now').textContent=l.now||'';$('next').textContent=l.next||'';
    $('lines').innerHTML=(l.lines||[]).map(function(t,i){return'<p class="'+(i===l.li?'on':i<l.li?'past':'')+'">'+esc(t)+'</p>'}).join('')}
  else{$('sec').textContent=m.nosong?'':'Press Play or Record';$('now').textContent='';$('next').textContent='';$('lines').innerHTML=''}
  var ck=JSON.stringify(m.chart||[]);
  if(ck!==chartKey){chartKey=ck;$('chartbody').innerHTML=(m.chart||[]).map(function(c){return'<div class="sec">'+esc(c.label)+'</div><div class="ch">'+esc((c.chords||[]).join('  '))+'</div>'+(c.lines||[]).map(function(t){return'<div class="ly">'+esc(t)+'</div>'}).join('')}).join('')}
}
function poll(){fetch('/api/state?k='+encodeURIComponent(K),{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(show).catch(function(){$('lost').style.display='block'}).then(function(){setTimeout(poll,300)})}
function cmd(c){fetch('/api/cmd?k='+encodeURIComponent(K),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cmd:c})}).catch(function(){})}
$('bplay').onclick=function(){cmd('play')};$('bstop').onclick=function(){cmd('stop')};$('brec').onclick=function(){cmd('record')};
poll();
</script></body></html>`;
}

function createRemote(opts) {
  opts = opts || {};
  const onCommand = typeof opts.onCommand === 'function' ? opts.onCommand : () => {};
  const log = opts.log || (() => {});
  let server = null, pin = '', port = 0, meta = '{}', live = 'null', fails = [], lockedUntil = 0;

  const newPin = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  function pinOk(given) {
    const a = Buffer.from(String(given || '')), b = Buffer.from(pin);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  function handler(req, res) {
    const send = (code, body, type) => { res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'" }); res.end(body); };
    let u; try { u = new URL(req.url, 'http://x'); } catch { return send(400, 'bad request'); }
    const now = Date.now();
    if (now < lockedUntil) return send(429, 'Too many wrong codes. Wait a minute.');
    if (!pinOk(u.searchParams.get('k'))) {
      fails = fails.filter(t => now - t < 60000); fails.push(now);
      if (fails.length >= 8) { lockedUntil = now + 60000; fails = []; }
      return send(403, 'Wrong or missing code. Open the address shown in the Academy.');
    }
    if (req.method === 'GET' && u.pathname === '/') return send(200, phonePage(), 'text/html; charset=utf-8');
    if (req.method === 'GET' && u.pathname === '/api/state') {
      let m = {}, l = null; try { m = JSON.parse(meta); l = JSON.parse(live); } catch { /* keep empty */ }
      return send(200, JSON.stringify({ meta: m, live: l }), 'application/json');
    }
    if (req.method === 'POST' && u.pathname === '/api/cmd') {
      let body = '', over = false;
      req.on('data', c => { body += c; if (body.length > MAX_BODY) { over = true; req.destroy(); } });
      req.on('end', () => {
        if (over) return;
        let c; try { c = JSON.parse(body).cmd; } catch { return send(400, 'bad request'); }
        if (!COMMANDS.has(c)) return send(400, 'unknown command');
        try { onCommand(c); } catch (e) { log('remote command', e); }
        send(200, '{"ok":true}', 'application/json');
      });
      return;
    }
    send(404, 'not found');
  }

  function start(wantPort) {
    return new Promise(resolve => {
      if (server) return resolve(info());
      pin = newPin(); fails = []; lockedUntil = 0; meta = '{}'; live = 'null';
      const first = wantPort === undefined ? 8787 : wantPort; let tries = 0;
      const attempt = p => {
        const s = http.createServer(handler);
        s.on('error', e => { if (e.code === 'EADDRINUSE' && tries++ < 20 && wantPort !== 0) attempt(p + 1); else { log('remote listen', e); resolve({ ok: false, error: e.code || e.message }); } });
        s.listen(p, '0.0.0.0', () => { server = s; port = s.address().port; resolve(info()); });
      };
      attempt(first);
    });
  }
  function info() {
    if (!server) return { ok: true, on: false };
    return { ok: true, on: true, port, pin, urls: lanAddresses().map(a => 'http://' + a + ':' + port + '/?k=' + pin) };
  }
  function stop() { return new Promise(resolve => { if (!server) return resolve({ ok: true, on: false }); const s = server; server = null; pin = ''; s.close(() => resolve({ ok: true, on: false })); if (s.closeAllConnections) s.closeAllConnections(); }); }
  const keep = (v, max) => { const t = JSON.stringify(v === undefined ? null : v); return t.length <= max ? t : null; };
  function setMeta(v) { const t = keep(v, MAX_STATE); if (t) meta = t; }
  function setLive(v) { const t = keep(v, 8192); if (t) live = t; }
  return { start, stop, info, setMeta, setLive, COMMANDS };
}

module.exports = { createRemote, lanAddresses, phonePage, COMMANDS };
