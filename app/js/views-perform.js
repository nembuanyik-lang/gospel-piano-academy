'use strict';
/* ---------------------------------------------------------------- Perform: the song on a full black screen for a stage, a service or a rehearsal
   Big chord now and next, the bars of the section, the words, big Play and Stop, and a button for each part of the song.
   It plays the same arrangement as "Play the song" (backing, loops and recorded tracks). Escape or Close leaves it. */
const Perform = (() => {
  let root = null, state = null;
  const lyricFor = (P, t) => {
    const lyr = { Verse: P.lyrics && P.lyrics.verse, Chorus: P.lyrics && P.lyrics.chorus, Bridge: P.lyrics && P.lyrics.bridge };
    return (lyr[t] && lyr[t].trim()) || (((P.words || {})[t] || '').replace(/-\s*/g, '').replace(/\s_+/g, '').trim());
  };
  function close() {
    if (!state) return;
    const st = state; state = null;
    clearInterval(st.tick); if (st.h) { try { st.h.stop(); } catch (e) { /* ignore */ } }
    if (typeof stopProjPlay === 'function') stopProjPlay();
    if (st.lock) { try { st.lock.release(); } catch (e) { /* ignore */ } }
    document.removeEventListener('keydown', st.key);
    if (root) { root.remove(); root = null; }
    document.documentElement.classList.remove('performing');
  }
  function open(P) {
    close(); migrateProject(P);
    const A = arrangeSong(P, { melInst: Snd.inst() }), spb = 60 / P.bpm, bar = METERS[P.ts].bar;
    state = { P, A, playing: false, start: 0, from: 0, count: true, tick: 0, h: null, lock: null, seg: -1, chord: -1 };
    root = document.createElement('div'); root.id = 'perform'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Perform ' + (P.title || 'song'));
    const parts = A.timeline.map((t, i) => '<button type="button" class="pf-part" data-part="' + i + '">' + esc(t.label) + '</button>').join('');
    root.innerHTML =
      '<div class="pf-top"><div><h1 class="pf-title">' + esc(P.title || 'My song') + '</h1><p class="pf-sub">Key of ' + esc(fmt(P.key)) + ' · ' + P.bpm + ' BPM</p></div>' +
      '<div class="pf-tools"><label class="pf-count"><input type="checkbox" id="pfcount" checked> Count-in</label><button type="button" class="pf-close" id="pfclose">Close</button></div></div>' +
      '<div class="pf-parts" role="group" aria-label="Start from a part">' + parts + '</div>' +
      '<div class="pf-main"><div class="pf-now"><span class="pf-lab">Now</span><b id="pfnow">–</b></div><div class="pf-next"><span class="pf-lab">Next</span><b id="pfnext">–</b></div></div>' +
      '<p class="pf-sec" id="pfsec" aria-live="polite"></p><div class="pf-bars" id="pfbars"></div><div class="pf-words" id="pfwords"></div>' +
      '<div class="pf-bar"><div class="pf-prog"><i id="pfprog"></i></div><button type="button" class="pf-play" id="pfplay">Play</button></div>';
    document.body.appendChild(root); document.documentElement.classList.add('performing');
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { if (state) state.lock = l; else l.release(); }).catch(() => {}); } catch (e) { /* ignore */ }
    state.key = e => { if (e.key === 'Escape') close(); else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); toggle(); } };
    document.addEventListener('keydown', state.key);
    root.querySelector('#pfclose').addEventListener('click', close);
    root.querySelector('#pfplay').addEventListener('click', () => toggle());
    root.querySelector('#pfcount').addEventListener('change', e => { state.count = e.target.checked; });
    root.querySelectorAll('.pf-part').forEach(b => b.addEventListener('click', () => { state.from = +b.dataset.part; show(state.from, 0); if (state.playing) { stopNow(); play(); } else markPart(); }));
    show(0, 0); markPart();
    function markPart() { root.querySelectorAll('.pf-part').forEach(b => b.classList.toggle('on', +b.dataset.part === state.from)); }
    function show(si, ci) {
      const seg = A.timeline[si]; if (!seg) return;
      const c = seg.chs[ci] || seg.chs[0], nx = seg.chs[ci + 1] || (A.timeline[si + 1] && A.timeline[si + 1].chs[0]) || null;
      if (state.seg !== si) {
        state.seg = si; state.chord = -1;
        root.querySelector('#pfsec').textContent = seg.label + (seg.key !== P.key ? ' · key of ' + fmt(seg.key) : '');
        root.querySelector('#pfbars').innerHTML = seg.chs.map((x, i) => '<span class="pf-bx" data-i="' + i + '">' + esc(x.name) + '</span>').join('');
        const w = lyricFor(P, seg.type || seg.label);
        root.querySelector('#pfwords').textContent = w || '';
        markPart();
      }
      if (state.chord !== ci) {
        state.chord = ci;
        root.querySelector('#pfnow').textContent = c ? c.name : '–'; root.querySelector('#pfnext').textContent = nx ? nx.name : 'End';
        root.querySelectorAll('.pf-bx').forEach(x => x.classList.toggle('on', +x.dataset.i === ci));
      }
    }
    function stopNow() { clearInterval(state.tick); if (state.h) { try { state.h.stop(); } catch (e) { /* ignore */ } state.h = null; } if (typeof stopProjPlay === 'function') stopProjPlay(); state.playing = false; const b = root && root.querySelector('#pfplay'); if (b) { b.textContent = 'Play'; b.classList.remove('on'); } }
    function toggle() { if (state.playing) stopNow(); else play(); }
    async function play() {
      const st = state, fromBeat = A.timeline[st.from] ? A.timeline[st.from].start : 0, lead = st.count ? bar : 0;
      if (typeof PROJ_CTL !== 'undefined' && PROJ_CTL && typeof PROJ_CTL.stop === 'function') PROJ_CTL.stop();
      const btn = root.querySelector('#pfplay'); btn.textContent = 'Stop'; btn.classList.add('on'); st.playing = true;
      const AA = arrangeSong(P, { melInst: Snd.inst() });
      AA.script.audio = await loopAudio(P, AA.places).catch(() => []);
      if (typeof recordedTracks === 'function' && recordedTracks(P).length) AA.script.audio = AA.script.audio.concat(await recordedAudio(P, { live: true }).catch(() => []));
      if (state !== st || !st.playing) return;
      let script = fromBeat > 0 ? scriptFrom(AA.script, fromBeat) : AA.script;
      if (lead) script = withCountIn(script, lead, bar);
      st.h = playScript(script, { onStart: (t) => { st.start = t + lead * spb; }, onEnd: () => { if (state === st) { stopNow(); show(0, 0); st.from = 0; markPart(); } } });
      st.tick = setInterval(() => {
        const beat = (Snd.now() - st.start) / spb + fromBeat;
        if (beat < fromBeat) { root.querySelector('#pfnow').textContent = 'Ready'; st.chord = -1; return; }
        const si = A.timeline.findIndex(t => beat >= t.start && beat < t.start + t.beats); if (si < 0) return;
        let k = 0; A.timeline[si].chs.forEach((c, i) => { if (beat >= c.t - 1e-6) k = i; });
        show(si, k); root.querySelector('#pfprog').style.width = Math.min(100, 100 * beat / A.total) + '%';
      }, 60);
    }
  }
  return { open, close, isOpen: () => !!state };
})();
