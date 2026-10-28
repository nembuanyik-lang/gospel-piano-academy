'use strict';
/* ---------------------------------------------------------------- piano */
function tokLabel(t) { const m = /^([A-G][#b]*)/.exec(String(t)); return m ? fmt(m[1]) : ''; }
function Piano(host, o) {
  o = Object.assign({ lo: 60, hi: 72, names: true, readonly: false, minKey: 38, height: 150, focus: 60 }, o);
  const whites = [];
  for (let m = o.lo; m <= o.hi; m++) if (!E.isBlack(m)) whites.push(m);
  const n = whites.length, wi = {}; whites.forEach((m, i) => { wi[m] = i; });
  let html = '<div class="kb-scroll"><div class="kb' + (o.readonly ? ' ro' : '') + '" style="--n:' + n + ';--minkey:' + o.minKey + 'px;height:' + o.height + 'px" role="group" aria-label="Piano keyboard">';
  whites.forEach(m => { html += '<div class="wk" data-m="' + m + '" role="button" aria-label="' + E.midiName(m) + '"><i class="fin"></i><span class="lab"></span></div>'; });
  const bw = 0.62 / n * 100;
  for (let m = o.lo; m <= o.hi; m++) {
    if (E.isBlack(m) && wi[m - 1] !== undefined) {
      const left = (wi[m - 1] + 1) / n * 100 - bw / 2;
      html += '<div class="bk" data-m="' + m + '" style="left:' + left + '%;width:' + bw + '%" role="button" aria-label="' + E.midiName(m) + '"><i class="fin"></i><span class="lab"></span></div>';
    }
  }
  html += '</div></div>';
  host.innerHTML = html;
  const els = {};
  $$('.wk,.bk', host).forEach(el => { els[el.dataset.m] = el; });
  const scroller = $('.kb-scroll', host);
  let hintState = null;
  const timers = [];

  function baseLabel(m) {
    if (!o.names || E.isBlack(m)) return '';
    const nm = E.ROOT_NAMES[pcOf(m)];
    return pcOf(m) === 0 ? nm + (Math.floor(m / 12) - 1) : nm;
  }
  function paint() {
    Object.keys(els).forEach(k => {
      const m = +k, el = els[k], lab = $('.lab', el), fin = $('.fin', el);
      const isHint = hintState && ((hintState.midis && hintState.midis.has(m)) || (hintState.pcs && hintState.pcs.has(pcOf(m))));
      el.classList.toggle('hint', !!isHint);
      let text = baseLabel(m), finger = '';
      if (isHint) {
        const custom = hintState.labels && hintState.labels[m];
        text = custom !== undefined ? custom : (hintState.names && hintState.names[pcOf(m)]) || (E.isBlack(m) ? fmt(E.ROOT_NAMES[pcOf(m)]) : baseLabel(m) || fmt(E.ROOT_NAMES[pcOf(m)]));
        if (hintState.fingers && hintState.fingers[m]) finger = hintState.fingers[m];
      }
      lab.textContent = text; fin.textContent = finger; fin.style.display = finger ? '' : 'none';
    });
  }
  paint();

  /* keep highlighted keys on screen on narrow phones: centre them if they fit, otherwise start at the lowest */
  function reveal(ms) {
    const sw = scroller.scrollWidth, cw = scroller.clientWidth;
    if (sw <= cw + 2) return;
    const xs = ms.map(m => (wi[m] !== undefined ? wi[m] : (wi[m - 1] !== undefined ? wi[m - 1] + 0.5 : null))).filter(v => v !== null);
    if (!xs.length) return;
    const lo = Math.min.apply(null, xs) / n * sw, hi = (Math.max.apply(null, xs) + 1) / n * sw;
    let sl = scroller.scrollLeft;
    if (lo < sl + 8 || hi > sl + cw - 8) sl = (hi - lo <= cw - 24) ? (lo + hi) / 2 - cw / 2 : lo - 12;
    scroller.scrollLeft = Math.max(0, sl);
  }
  const api = {
    lo: o.lo, hi: o.hi, host,
    hint(h) {
      if (!h) { hintState = null; paint(); return; }
      hintState = { midis: new Set(h.midis || []), pcs: new Set(h.pcs || []), labels: h.labels, fingers: h.fingers, names: h.names };
      paint();
      if (h.midis && h.midis.length) requestAnimationFrame(() => reveal(h.midis));
    },
    clear() { hintState = null; paint(); },
    visual(m, on) { const el = els[m]; if (el) { el.classList.toggle('on', on); if (!o.readonly) el.setAttribute('aria-pressed', String(!!on)); } },
    mark(m, on) { const el = els[m]; if (el) el.classList.toggle('on', on); },
    markAll(on) { Object.values(els).forEach(el => el.classList.toggle('on', on)); },
    flash(m, cls) {
      const el = els[m]; if (!el) return;
      el.classList.add(cls);
      timers.push(setTimeout(() => el.classList.remove(cls), 380));
    },
    ok(m) { api.flash(m, 'ok'); }, bad(m) { api.flash(m, 'bad'); },
    setNames(v) { o.names = v; paint(); },
    destroy() { Input.pianos.delete(api); timers.forEach(clearTimeout); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); }
  };
  Input.pianos.add(api);
  if (o.base !== false) {
    const b = o.focus >= o.lo && o.focus <= o.hi ? 60 : (o.lo % 12 === 0 ? o.lo : o.lo - pcOf(o.lo));
    Input.base = b;
  }
  requestAnimationFrame(() => {
    if (scroller.scrollWidth > scroller.clientWidth + 2 && wi[o.focus] !== undefined) {
      scroller.scrollLeft = Math.max(0, wi[o.focus] / n * scroller.scrollWidth - 12);
    } else if (scroller.scrollWidth > scroller.clientWidth + 2) {
      const mid = whites[Math.floor(n / 2)];
      scroller.scrollLeft = Math.max(0, wi[mid] / n * scroller.scrollWidth - scroller.clientWidth / 2);
    }
  });

  const keyList = Object.keys(els).map(Number).sort((a, b) => a - b);
  if (o.readonly) {
    host.querySelector('.kb').setAttribute('role', 'img');
    Object.values(els).forEach(el => { el.removeAttribute('role'); el.removeAttribute('aria-label'); el.setAttribute('aria-hidden', 'true'); });
  } else if (keyList.length) {
    // one tab stop for the whole keyboard; arrow keys move between keys, Enter or Space plays
    let cur = els[o.focus] ? o.focus : keyList[0];
    keyList.forEach(m => { els[m].setAttribute('tabindex', m === cur ? '0' : '-1'); els[m].setAttribute('aria-pressed', 'false'); });
    const kbdDown = new Set();
    const focusKey = m => { if (!els[m]) return; els[cur].setAttribute('tabindex', '-1'); cur = m; els[m].setAttribute('tabindex', '0'); els[m].focus(); };
    host.addEventListener('keydown', e => {
      const k = e.target.closest && e.target.closest('.wk,.bk'); if (!k || !host.contains(k) || e.ctrlKey || e.metaKey || e.altKey) return;
      const m = +k.dataset.m, idx = keyList.indexOf(m);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); focusKey(keyList[Math.min(keyList.length - 1, idx + 1)]); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); focusKey(keyList[Math.max(0, idx - 1)]); }
      else if (e.key === 'Home') { e.preventDefault(); focusKey(keyList[0]); }
      else if (e.key === 'End') { e.preventDefault(); focusKey(keyList[keyList.length - 1]); }
      else if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); const t = m + (e.key === 'PageUp' ? 12 : -12); focusKey(els[t] ? t : (e.key === 'PageUp' ? keyList[keyList.length - 1] : keyList[0])); }
      else if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); if (!kbdDown.has(m)) { kbdDown.add(m); Input.noteOn(m, 'kbd', 0.72); } }
    });
    host.addEventListener('keyup', e => {
      const k = e.target.closest && e.target.closest('.wk,.bk'); if (!k) return;
      if (e.key === 'Enter' || e.key === ' ') { const m = +k.dataset.m; if (kbdDown.delete(m)) Input.noteOff(m); }
    });
    host.addEventListener('focusout', e => { const k = e.target.closest && e.target.closest('.wk,.bk'); if (k && kbdDown.delete(+k.dataset.m)) Input.noteOff(+k.dataset.m); });
  }

  const down = new Map();
  function press(k, id, e) {
    const m = +k.dataset.m; down.set(id, m);
    let vel = 0.7;
    if (e && e.clientY !== undefined) { const r = k.getBoundingClientRect(); if (r.height > 0) vel = clamp(0.42 + 0.5 * ((e.clientY - r.top) / r.height), 0.4, 0.95); }
    Input.noteOn(m, 'ptr', vel);
  }
  function release(id) { if (down.has(id)) { Input.noteOff(down.get(id)); down.delete(id); } }
  function up(e) { release(e.pointerId); }
  if (!o.readonly) {
    host.addEventListener('pointerdown', e => {
      const k = e.target.closest('.wk,.bk'); if (!k || !host.contains(k)) return;
      e.preventDefault(); press(k, e.pointerId, e);
    });
    host.addEventListener('pointermove', e => {
      if (!down.has(e.pointerId) || e.pointerType === 'touch') return;
      const k = document.elementFromPoint(e.clientX, e.clientY);
      const kk = k && k.closest ? k.closest('.wk,.bk') : null;
      if (kk && host.contains(kk) && +kk.dataset.m !== down.get(e.pointerId)) { release(e.pointerId); press(kk, e.pointerId, e); }
    });
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }
  return api;
}
App.Piano = Piano;

/* a tiny helper used everywhere: notes of a chord target as keyboard hints */
function bassMidiFor(rootName, lo) {
  const pc = E.pcOfName(rootName);
  for (let m = Math.max(lo, 36); m <= 58; m++) if (pcOf(m) === pc) return m;
  return 36 + pc;
}
function chordHint(t, lo, withNames) {
  const midis = E.chordMidi(t.root, t.quality, 4, t.inv || 0);
  const labels = {};
  const rpc = E.pcOfName(t.root);
  const names = E.chordNames(t.root, t.quality), pcs = E.chordPcs(t.root, t.quality);
  const nameByPc = {};
  pcs.forEach((p, i) => { nameByPc[p] = fmt(names[i]); });
  midis.forEach(m => { labels[m] = E.toneLabel(pcOf(m), rpc, t.quality) || nameByPc[pcOf(m)]; });
  if (t.bass) { const b = bassMidiFor(t.root, lo || 48); midis.unshift(b); labels[b] = 'bass'; }
  return { midis, labels, names: withNames ? nameByPc : undefined };
}
App.chordHint = chordHint; App.bassMidiFor = bassMidiFor; App.tokLabel = tokLabel;
App.fns = { $, $$, esc, clamp, fmt, pcOf, touch, saveNow, toast, Act, Store, Snap };
App.setState = s => { S = mergeState(defaults(), s); };
App.resetState = () => { S = defaults(); touch(); };
App.defaults = defaults;
