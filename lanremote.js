'use strict';
/* Gospel Music Academy: the phone remote.
   A tiny web server that runs only while you switch it on. A phone on the same Wi-Fi (or on the computer's own
   hotspot) opens its address, types nothing but the 6-number code in the link, and sees the song's chords and words
   as it plays, with Play, Stop and Record buttons. It needs no internet: the page is built into the app and nothing
   leaves your own network. Only a short list of commands is accepted. */
const http = require('http');
const os = require('os');
const crypto = require('crypto');

const SIMPLE = ['play', 'stop', 'record', 'restart', 'next', 'prev', 'undo', 'unsolo'];
const COMMANDS = new Set(SIMPLE.concat(['part', 'song', 'key', 'mix', 'mute', 'solo', 'countin']));
const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const idOk = v => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,64}$/.test(v);
const intIn = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
/* every command is checked here before it goes to the app: only these names, only these argument shapes */
function cleanCommand(c) {
  if (typeof c === 'string') c = { cmd: c };
  if (!c || typeof c !== 'object' || !COMMANDS.has(c.cmd)) return null;
  const n = c.cmd;
  if (SIMPLE.includes(n)) return { cmd: n };
  if (n === 'part') return intIn(c.i, 0, 63) ? { cmd: n, i: c.i } : null;
  if (n === 'song') return idOk(c.id) ? { cmd: n, id: c.id } : null;
  if (n === 'key') { if (c.d === 1 || c.d === -1) return { cmd: n, d: c.d }; return KEYS.includes(c.key) ? { cmd: n, key: c.key } : null; }
  if (n === 'countin') return typeof c.on === 'boolean' ? { cmd: n, on: c.on } : null;
  if ((n === 'mix' || n === 'mute' || n === 'solo') && (c.kind === 'part' || c.kind === 'track') && idOk(c.k)) {
    if (n === 'mix') return intIn(c.v, 0, 150) ? { cmd: n, kind: c.kind, k: c.k, v: c.v } : null;
    return { cmd: n, kind: c.kind, k: c.k };
  }
  return null;
}
const MAX_BODY = 2048, MAX_STATE = 96 * 1024;

function lanAddresses() {
  const out = [], nets = os.networkInterfaces();
  Object.keys(nets).forEach(n => (nets[n] || []).forEach(a => { if ((a.family === 'IPv4' || a.family === 4) && !a.internal) out.push(a.address); }));
  return out;
}

function phonePage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#17181C"><title>Song remote</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#17181C;color:#F4F4F0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;min-height:100vh;display:flex;flex-direction:column;-webkit-tap-highlight-color:transparent}
header{padding:10px 16px;border-bottom:1px solid #33353C}h1{margin:0;font-size:1.1rem}#meta{color:#A9ABB5;font-size:.85rem;margin-top:2px}
#chip{display:inline-block;margin-top:6px;padding:2px 10px;border-radius:99px;background:#33353C;font-size:.8rem}#chip.rec{background:#9B1C3C}#chip.play{background:#1E6B45}
#lvl{display:none;height:8px;background:#33353C;border-radius:4px;margin-top:8px;overflow:hidden}#lvl i{display:block;height:100%;width:0;background:#3DBE7A}#lvl i.hot{background:#E5484D}
main{flex:1;padding:14px 16px;display:flex;flex-direction:column;gap:10px}
#sec{color:#A9ABB5;font-size:1rem}#now{font-weight:800;line-height:1;word-break:break-word}#next{color:#E9B949;min-height:1.8rem}
#lines p{margin:.3rem 0;color:#8A8C96}#lines p.on{color:#fff;font-weight:700}#lines p.past{opacity:.45}
.btns{padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid #33353C;position:sticky;bottom:0;background:#17181C;display:grid;gap:8px}
.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
button{border:0;border-radius:14px;padding:16px 6px;font-size:1.05rem;font-weight:700;color:#fff;background:#3A3D47;font-family:inherit}button:active{filter:brightness(1.25)}
button.p{background:#1E6B45}button.r{background:#9B1C3C}button.s{padding:11px 6px;font-size:.95rem}button.on{background:#E9B949;color:#17181C}button:disabled{opacity:.4}
details{background:#202229;border-radius:12px;padding:10px 14px}summary{font-weight:700;cursor:pointer}details>div{margin-top:10px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}.sec{margin:.6rem 0 .1rem;color:#E9B949;font-weight:700}.ch{font-size:1.1rem}.ly{color:#A9ABB5;font-size:.95rem}
.keyrow{display:flex;align-items:center;gap:12px}.keyrow b{font-size:2rem;min-width:3.2rem;text-align:center}.keyrow button{flex:1}
.strip{border-top:1px solid #33353C;padding:8px 0}.strip:first-child{border-top:0}.strip .t{display:flex;justify-content:space-between;gap:8px;align-items:center;font-weight:600}
.strip input[type=range]{width:100%;margin:8px 0 4px;accent-color:#E9B949}.strip .mb{display:flex;gap:6px}.strip.dim{opacity:.55}
.opt{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0}.opt span{color:#A9ABB5}
#lost{display:none;background:#9B1C3C;padding:8px 16px;text-align:center}
</style></head><body><div id="lost">Lost the computer. Check that the Academy is open and on the same Wi-Fi.</div>
<header><h1 id="title">Song remote</h1><div id="meta"></div><span id="chip">connecting…</span><div id="lvl"><i></i></div></header>
<main><div id="sec"></div><div id="now"></div><div id="next"></div><div id="lines"></div>
<details id="dparts"><summary>Parts: jump to one</summary><div id="parts" class="grid"></div></details>
<details id="dkey"><summary>Key</summary><div class="keyrow"><button class="s" id="kdn">Down</button><b id="kname">-</b><button class="s" id="kup">Up</button></div></details>
<details id="dmix"><summary>Volume, mute and solo</summary><div id="mix"></div></details>
<details id="dsongs"><summary>Songs: open another</summary><div id="songs" class="grid"></div></details>
<details id="dopt"><summary>Show, count-in and undo</summary><div>
<div class="opt"><span>Chords as</span><div class="row3" style="grid-template-columns:1fr 1fr;width:62%"><button class="s" id="onames">Names</button><button class="s" id="onums">Numbers</button></div></div>
<div class="opt"><span>Show</span><div class="row3" style="width:62%"><button class="s" id="vch">Chords</button><button class="s" id="vboth">Both</button><button class="s" id="vwd">Words</button></div></div>
<div class="opt"><span>Text size</span><div class="row3" style="grid-template-columns:1fr 1fr;width:62%"><button class="s" id="zdn">Smaller</button><button class="s" id="zup">Bigger</button></div></div>
<div class="opt"><span>Bar of clicks before Play</span><button class="s" id="ocount" style="width:62%">Off</button></div>
<div class="opt"><span>Undo the last change</span><button class="s" id="oundo" style="width:62%">Undo</button></div>
</div></details>
<details id="chart"><summary>The whole song</summary><div id="chartbody"></div></details></main>
<div class="btns"><div class="row3"><button class="p" id="bplay">Play</button><button id="bstop">Stop</button><button class="r" id="brec">Record</button></div>
<div class="row3"><button class="s" id="bprev">Previous part</button><button class="s" id="brestart">From the top</button><button class="s" id="bnext">Next part</button></div></div>
<script>
var K=new URLSearchParams(location.search).get('k')||'',$=function(i){return document.getElementById(i)};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var KEYS=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
var pref={nums:false,view:'both',size:1};
try{var sv=JSON.parse(localStorage.getItem('gma-remote')||'{}');if(sv&&typeof sv==='object'){pref.nums=!!sv.nums;if(['chords','both','words'].indexOf(sv.view)>=0)pref.view=sv.view;if(sv.size>=0.7&&sv.size<=1.6)pref.size=sv.size}}catch(e){}
function savePref(){try{localStorage.setItem('gma-remote',JSON.stringify(pref))}catch(e){}}
var last={meta:{},live:null},sig={};
function applyPref(){
  $('now').style.fontSize=(5.2*pref.size)+'rem';$('next').style.fontSize=(1.5*pref.size)+'rem';$('lines').style.fontSize=(1.5*pref.size)+'rem';
  $('onames').className='s'+(pref.nums?'':' on');$('onums').className='s'+(pref.nums?' on':'');
  ['chords','both','words'].forEach(function(v,i){$(['vch','vboth','vwd'][i]).className='s'+(pref.view===v?' on':'')});
  $('now').style.display=$('next').style.display=pref.view==='words'?'none':'';$('lines').style.display=pref.view==='chords'?'none':'';
  draw();
}
function draw(){
  var m=last.meta||{},l=last.live,st=m.status||'idle';
  if(l&&st!=='idle'){$('sec').textContent=l.sec||'';$('now').textContent=(pref.nums?l.nn:l.now)||l.now||'';$('next').textContent=(pref.nums?l.nx:l.next)||l.next||'';
    $('lines').innerHTML=(l.lines||[]).map(function(t,i){return'<p class="'+(i===l.li?'on':i<l.li?'past':'')+(i===l.li?'':'')+'" style="'+(i===l.li?'font-size:1.25em':'')+'">'+esc(t)+'</p>'}).join('')}
  else{$('sec').textContent=m.nosong?'':'Press Play or Record';$('now').textContent='';$('next').textContent='';$('lines').innerHTML=''}
}
function show(s){
  $('lost').style.display='none';last=s;var m=s.meta||{},l=s.live;
  $('title').textContent=m.title||'Song remote';
  $('meta').textContent=m.title?(m.key||'')+' · '+(m.bpm||'')+' BPM':'';
  var chip=$('chip'),st=m.status||'idle';
  chip.className=st==='recording'?'rec':st==='playing'?'play':'';
  chip.textContent=m.nosong?'Open a song on the computer':st==='recording'?'Recording':st==='playing'?'Playing':'Ready';
  $('bplay').disabled=$('brec').disabled=$('brestart').disabled=$('bprev').disabled=$('bnext').disabled=!!m.nosong;
  var lv=$('lvl');lv.style.display=st==='recording'?'block':'none';if(st==='recording'&&l){var i=lv.firstChild;i.style.width=Math.round(100*(l.lv||0))+'%';i.className=(l.lv||0)>0.97?'hot':''}
  draw();
  // parts
  var parts=(m.chart||[]).map(function(c,i){return{i:i,label:c.label}}),ps=JSON.stringify([parts,l&&st!=='idle'?l.si:-1,m.startPart]);
  if(ps!==sig.parts){sig.parts=ps;$('parts').innerHTML=parts.map(function(p){var on=(l&&st!=='idle'&&l.si===p.i)||((!l||st==='idle')&&m.startPart===p.i);return'<button class="s'+(on?' on':'')+'" data-i="'+p.i+'">'+esc(p.label)+'</button>'}).join('')||'<span class="ly">No parts yet.</span>'}
  $('kname').textContent=m.key||'-';
  // songs
  var ss=JSON.stringify([m.songs,m.id]);if(ss!==sig.songs){sig.songs=ss;$('songs').innerHTML=(m.songs||[]).map(function(x){return'<button class="s'+(x.id===m.id?' on':'')+'" data-id="'+esc(x.id)+'">'+esc(x.title)+'</button>'}).join('')||'<span class="ly">No songs yet.</span>'}
  // mix (not while a slider is being moved)
  var ms=JSON.stringify(m.mix||[]);if(ms!==sig.mix&&!sig.drag){sig.mix=ms;var any=(m.mix||[]).some(function(x){return x.solo});
    $('mix').innerHTML=(m.mix||[]).map(function(x){return'<div class="strip'+(any&&!x.solo?' dim':'')+'"><div class="t"><span>'+esc(x.name)+' <span class="ly">'+x.v+'%</span></span><span class="mb"><button class="s'+(x.mute?' on':'')+'" data-a="mute" data-kind="'+x.kind+'" data-k="'+esc(x.k)+'">M</button><button class="s'+(x.solo?' on':'')+'" data-a="solo" data-kind="'+x.kind+'" data-k="'+esc(x.k)+'">S</button></span></div><input type="range" min="0" max="150" value="'+x.v+'" data-kind="'+x.kind+'" data-k="'+esc(x.k)+'" aria-label="'+esc(x.name)+' volume"></div>'}).join('')+(any?'<button class="s" data-a="unsolo" style="width:100%;margin-top:8px">Clear solo</button>':'')||'<span class="ly">Nothing to mix yet.</span>'}
  $('ocount').className='s'+(m.countin?' on':'');$('ocount').textContent=m.countin?'On':'Off';$('oundo').disabled=!m.canUndo||st!=='idle';
  var ck=JSON.stringify([m.chart||[],pref.nums]);
  if(ck!==sig.chart){sig.chart=ck;$('chartbody').innerHTML=(m.chart||[]).map(function(c){return'<div class="sec">'+esc(c.label)+'</div><div class="ch">'+esc(((pref.nums?c.nums:c.chords)||c.chords||[]).join('  '))+'</div>'+(c.lines||[]).map(function(t){return'<div class="ly">'+esc(t)+'</div>'}).join('')}).join('')}
}
function poll(){fetch('/api/state?k='+encodeURIComponent(K),{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(show).catch(function(){$('lost').style.display='block'}).then(function(){setTimeout(poll,300)})}
function cmd(c){if(typeof c==='string')c={cmd:c};if(navigator.vibrate){try{navigator.vibrate(15)}catch(e){}}fetch('/api/cmd?k='+encodeURIComponent(K),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(c)}).catch(function(){})}
$('bplay').onclick=function(){cmd('play')};$('bstop').onclick=function(){cmd('stop')};$('brec').onclick=function(){cmd('record')};
$('bprev').onclick=function(){cmd('prev')};$('bnext').onclick=function(){cmd('next')};$('brestart').onclick=function(){cmd('restart')};
$('kup').onclick=function(){cmd({cmd:'key',d:1})};$('kdn').onclick=function(){cmd({cmd:'key',d:-1})};
$('oundo').onclick=function(){cmd('undo')};$('ocount').onclick=function(){cmd({cmd:'countin',on:!(last.meta&&last.meta.countin)})};
$('onames').onclick=function(){pref.nums=false;savePref();applyPref();sig.chart=''};$('onums').onclick=function(){pref.nums=true;savePref();applyPref();sig.chart=''};
$('vch').onclick=function(){pref.view='chords';savePref();applyPref()};$('vboth').onclick=function(){pref.view='both';savePref();applyPref()};$('vwd').onclick=function(){pref.view='words';savePref();applyPref()};
$('zup').onclick=function(){pref.size=Math.min(1.6,Math.round((pref.size+0.15)*100)/100);savePref();applyPref()};$('zdn').onclick=function(){pref.size=Math.max(0.7,Math.round((pref.size-0.15)*100)/100);savePref();applyPref()};
$('parts').onclick=function(e){var b=e.target.closest('button[data-i]');if(b)cmd({cmd:'part',i:+b.getAttribute('data-i')})};
$('songs').onclick=function(e){var b=e.target.closest('button[data-id]');if(b)cmd({cmd:'song',id:b.getAttribute('data-id')})};
$('mix').onclick=function(e){var b=e.target.closest('button[data-a]');if(!b)return;var a=b.getAttribute('data-a');if(a==='unsolo')cmd('unsolo');else cmd({cmd:a,kind:b.getAttribute('data-kind'),k:b.getAttribute('data-k')})};
var vt=null;$('mix').addEventListener('input',function(e){var r=e.target;if(r.type!=='range')return;sig.drag=true;clearTimeout(vt);vt=setTimeout(function(){cmd({cmd:'mix',kind:r.getAttribute('data-kind'),k:r.getAttribute('data-k'),v:+r.value});setTimeout(function(){sig.drag=false},700)},250)});
applyPref();poll();
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
        let c; try { c = JSON.parse(body); } catch { return send(400, 'bad request'); }
        c = cleanCommand(c);
        if (!c) return send(400, 'unknown command');
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

module.exports = { createRemote, lanAddresses, phonePage, COMMANDS, cleanCommand };
