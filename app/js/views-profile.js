'use strict';
/* ---------------------------------------------------------------- PROGRESS */
function viewProgress() {
  const rk = E.rankFor(S.xp), t = ensureToday();
  const done = C.order.filter(isDone).length, mastered = totalMastered();
  const streak = E.streak(S.practice.days, t.date);
  /* 14-day chart */
  const days = Array.from({ length: 14 }, (_, i) => E.addDays(t.date, i - 13));
  const mins = days.map(d => Math.round((S.practice.days[d] || 0) / 60));
  const top = Math.max(S.prefs.dailyMin, ...mins, 10), W = 560, H = 170, pl = 30, pb = 24, bw = (W - pl - 6) / 14;
  const y = v => H - pb - (v / top) * (H - pb - 14);
  const ticks = [0, Math.round(top / 2), top];
  const chart = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="Minutes practised on each of the last 14 days">' +
    ticks.map(v => '<line class="grid" x1="' + pl + '" x2="' + (W - 6) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="axis" x="' + (pl - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>').join('') +
    '<line class="goal" x1="' + pl + '" x2="' + (W - 6) + '" y1="' + y(S.prefs.dailyMin) + '" y2="' + y(S.prefs.dailyMin) + '"/><text class="axis goal-l" x="' + (W - 8) + '" y="' + (y(S.prefs.dailyMin) - 4) + '" text-anchor="end">goal ' + S.prefs.dailyMin + ' min</text>' +
    mins.map((v, i) => '<rect class="barc' + (days[i] === t.date ? ' now' : '') + '" x="' + (pl + i * bw + 3) + '" y="' + y(v) + '" width="' + (bw - 6) + '" height="' + Math.max(0, H - pb - y(v)) + '" rx="2"><title>' + days[i] + ': ' + v + ' min</title></rect>' +
      (i % 2 === 1 || i === 13 ? '<text class="axis" x="' + (pl + i * bw + bw / 2) + '" y="' + (H - 7) + '" text-anchor="middle">' + days[i].slice(8) + '</text>' : '')).join('') + '</svg>';
  /* strengths and weaknesses */
  const cats = Object.keys(S.cats).filter(k => S.cats[k].t >= 3).map(k => ({ k, p: pct(S.cats[k].c, S.cats[k].t), t: S.cats[k].t }));
  Object.keys(S.ear).filter(k => S.ear[k].total >= 5).forEach(k => cats.push({ k: 'Ear · ' + E.EAR_TYPES[k].label, p: pct(S.ear[k].correct, S.ear[k].total), t: S.ear[k].total }));
  cats.sort((a, b) => b.p - a.p);
  const strong = cats.filter(c => c.p >= 85), weak = cats.filter(c => c.p < 70).reverse();
  const skillRows = cats.length ? '<ul class="skills">' + cats.map(c => '<li><span>' + esc(c.k) + '</span>' + bar(c.p, c.p >= 85 ? 'good' : c.p < 70 ? 'warn' : '') + '<b class="tiny">' + c.p + '%</b></li>').join('') + '</ul>' : '<p class="muted">Answer a few assessment or ear-training questions and your strengths and weak spots will appear here.</p>';
  /* skill tree */
  const tree = C.LEVELS.map(L => '<div class="tlevel"><p class="eyebrow">' + esc(L.name) + ' · ' + esc(L.title) + '</p>' + C.MODULES.filter(m => m.level === L.id).map(m =>
    '<div class="station"><div class="snodes">' + m.lessons.map(id => { const st = lessonStatus(id), un = isUnlocked(id); return '<span class="node ' + (un ? st : 'locked') + '" title="' + esc(C.byId[id].title) + ' · ' + (un ? st : 'locked') + '"></span>'; }).join('<s></s>') + '</div><div><b>' + esc(m.title) + '</b><span class="tiny">' + m.lessons.filter(isDone).length + ' of ' + m.lessons.length + ' complete</span></div></div>').join('')).join('') +
    '<div class="tlevel planned"><p class="eyebrow">Planned</p>' + C.ROADMAP.map(r => '<div class="station"><div class="snodes"><span class="node planned"></span></div><div><b>' + esc(r.track) + '</b><span class="tiny">Not playable yet</span></div></div>').join('') + '</div>';
  const ach = ACH.map(a => '<li class="badge' + (S.ach[a.id] ? ' got' : '') + '"><span class="bico">' + icon(S.ach[a.id] ? 'star' : 'lock') + '</span><div><b>' + esc(a.name) + '</b><span class="tiny">' + esc(a.desc) + '</span></div></li>').join('');
  const scores = S.scores.slice(-8).reverse();
  const projDone = S.songs.filter(s => s.done).length;
  const html = '<div class="screen"><div class="pagehead"><h1>Progress</h1></div>' +
    '<section class="card hero-card"><div class="split"><div><p class="eyebrow">Rank ' + rk.level + '</p><h2>' + esc(rk.name) + '</h2></div><div class="bigxp"><b>' + S.xp + '</b><span class="tiny">XP</span></div></div>' + bar(rk.pct) + '<p class="tiny">' + (rk.next ? (rk.next - S.xp) + ' XP to ' + esc(rk.nextName) : 'Top rank reached') + '</p></section>' +
    '<section class="kpis"><div class="kpi"><b>' + done + '<small>/' + C.order.length + '</small></b><span>lessons complete</span></div><div class="kpi"><b>' + mastered + '</b><span>skills mastered</span></div><div class="kpi"><b>' + fmtDur(S.practice.total) + '</b><span>total practice</span></div><div class="kpi"><b>' + streak + '</b><span>day streak</span></div><div class="kpi"><b>' + projDone + '</b><span>songs finished</span></div></section>' +
    '<section class="card"><h3>Practice, last 14 days</h3>' + chart + '</section>' +
    '<section class="card"><h3>Strengths and weak spots</h3>' + (weak.length ? '<p><b>Needs work:</b> ' + weak.map(c => esc(c.k)).join(', ') + '.</p>' : '') + (strong.length ? '<p><b>Strong:</b> ' + strong.slice(0, 4).map(c => esc(c.k)).join(', ') + '.</p>' : '') + skillRows + '</section>' +
    '<section class="card"><h3>Skill tree</h3><p class="muted">Each dot is a lesson. Hollow is not started, filled is complete, starred is mastered, grey is locked.</p><div class="tree">' + tree + '</div></section>' +
    '<section class="card"><h3>Recent assessment scores</h3>' + (scores.length ? '<ul class="lessons">' + scores.map(s => '<li class="lrow"><div class="lmain"><b>' + esc(s.title) + '</b><span class="tiny">' + new Date(s.at).toLocaleDateString() + ' · ' + (s.kind === 'testout' ? 'test-out' : 'lesson') + '</span></div><b class="mono">' + s.pct + '%</b></li>').join('') + '</ul>' : '<p class="muted">No scores yet.</p>') + '</section>' +
    '<section class="card"><h3>Achievements</h3><ul class="badges">' + ach + '</ul></section></div>';
  return { html };
}

/* ---------------------------------------------------------------- PROFILE */
/* Profile is split into four tabs: Profile, Settings, Your data and About. */
const PTABS = [['profile', 'Profile'], ['settings', 'Settings'], ['data', 'Your data'], ['about', 'About']];
function applyDisplay() {
  const root = document.documentElement, th = S.prefs.theme || 'system', size = S.prefs.textSize || 100;
  if (th === 'system') delete root.dataset.theme; else root.dataset.theme = th;
  root.style.zoom = size === 100 ? '' : String(size / 100);
}
function viewProfile() {
  const tab = PTABS.some(t => t[0] === (route.params || {}).tab) ? route.params.tab : 'profile';
  const tabs = '<div class="seg ptabs" role="tablist" aria-label="Profile sections">' + PTABS.map(t => '<button type="button" role="tab" class="' + (t[0] === tab ? 'on' : '') + '" aria-selected="' + (t[0] === tab) + '" data-act="proftab" data-t="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
  let body = '';
  if (tab === 'profile') {
    const d = S.profile.diag, inst = S.profile.instrument || 'piano';
    body = '<section class="card"><label class="field"><span>Your name</span><input id="pname" type="text" maxlength="40" value="' + esc(S.profile.name) + '" data-bind="pname" autocomplete="given-name"></label>' +
      '<p class="eyebrow">Instrument</p><div class="seg" role="group" aria-label="Instrument">' + [['piano', 'Piano or keyboard'], ['guitar', 'Guitar'], ['both', 'Both']].map(o => '<button type="button" class="' + (inst === o[0] ? 'on' : '') + '" aria-pressed="' + (inst === o[0]) + '" data-act="pinst" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div><p class="tiny">This sets what Home suggests. Both courses stay open in Course.</p>' +
      '<p class="eyebrow">Learning goals</p><div class="chips">' + GOALS.map(g => '<button type="button" class="chip' + (S.profile.goals.includes(g) ? ' on' : '') + '" data-act="pgoal" data-g="' + esc(g) + '" aria-pressed="' + S.profile.goals.includes(g) + '">' + esc(g) + '</button>').join('') + '</div></section>' +
      '<section class="card"><h3>Placement check</h3>' + (d && d.at ? '<p>Your last check scored ' + d.pct + '%.</p>' : '<p class="muted">You have not taken the piano placement check.</p>') + '<button class="btn ghost" data-act="retake">' + (d && d.at ? 'Retake the check' : 'Take the check') + '</button></section>';
  } else if (tab === 'settings') {
    const th = S.prefs.theme || 'system', size = S.prefs.textSize || 100;
    body = '<section class="card"><h3>Display</h3><p class="eyebrow">Theme</p><div class="seg" role="group" aria-label="Theme">' + [['system', 'Same as computer'], ['light', 'Light'], ['dark', 'Dark']].map(o => '<button type="button" class="' + (th === o[0] ? 'on' : '') + '" aria-pressed="' + (th === o[0]) + '" data-act="ptheme" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>' +
      '<p class="eyebrow">Text size</p><div class="seg" role="group" aria-label="Text size">' + [90, 100, 115, 130, 150].map(n => '<button type="button" class="' + (size === n ? 'on' : '') + '" aria-pressed="' + (size === n) + '" data-act="ptext" data-v="' + n + '">' + n + '%</button>').join('') + '</div>' +
      (Desk ? '<p class="tiny">You can also press Ctrl and + or Ctrl and − (Cmd on a Mac).</p>' : '') +
      '<label class="switch"><input type="checkbox" data-bind="pnames"' + (S.prefs.names ? ' checked' : '') + '><span>Show note names on the piano</span></label></section>' +
      '<section class="card"><h3>Practice</h3><p class="eyebrow">Daily practice goal</p><div class="seg">' + [5, 10, 15, 20, 30].map(n => '<button type="button" class="' + (S.prefs.dailyMin === n ? 'on' : '') + '" data-act="pgoalmin" data-v="' + n + '">' + n + ' min</button>').join('') + '</div>' +
      '<div class="split" style="margin-top:.8rem"><p class="muted">Timing calibration: ' + (S.prefs.latencyMs ? S.prefs.latencyMs + ' ms' : 'not set') + '</p><button class="btn ghost sm" type="button" data-act="pview" data-view="calib">Calibrate</button></div></section>' +
      '<section class="card"><h3>Sound</h3><label class="switch"><input type="checkbox" data-bind="psound"' + (S.prefs.sound ? ' checked' : '') + '><span>Sound on</span></label>' + soundPicker() +
      '<label class="switch"><input type="checkbox" data-bind="pslow"' + (S.prefs.speed === 'slow' ? ' checked' : '') + '><span>Play examples slowly by default</span></label></section>' +
      soundCard() +
      '<section class="card"><h3>MIDI keyboard</h3><p id="miditext">' + esc(Midi.text()) + '</p>' + (Midi.supported ? (Midi.status === 'ready' ? '<button class="btn ghost" data-act="mididisc">Disconnect</button>' : '<button class="btn primary" data-act="midiconnect">Connect a MIDI keyboard</button>') : '') + '<p class="tiny">A USB or Bluetooth keyboard plays every exercise, chord checker and test in the app, with the same feedback as the on-screen keys.</p></section>';
  } else if (tab === 'data') {
    const resetOk = (ui.resetText || '').trim().toUpperCase() === 'RESET';
    body = backupCard() +
      '<section class="card"><h3>Snapshots</h3><p class="muted">' + (Desk ? 'A copy of your progress is kept automatically every day, and before every import, restore or reset. The last ten of each kind are kept.' : 'A copy is kept before every import, restore or reset (the last three).') + '</p>' +
      (ui.undoImport ? '<div class="callout"><p><b>You imported a backup in this session.</b></p><button class="btn ghost sm" type="button" data-act="undoimport">Undo import</button></div>' : '') +
      '<div id="snaplist"><p class="tiny">Loading…</p></div>' + (Desk ? '<button class="btn ghost sm" type="button" data-act="opendata">Open the progress folder</button>' : '') + '</section>' +
      '<section class="card"><h3>Progress report</h3><p class="muted">A one-page summary of levels, assessments and practice time to print or send to your teacher or music director.</p><button class="btn ghost" type="button" data-act="preport">Save progress report</button></section>' +
      classCard() +
      '<section class="card danger-zone"><h3>Reset all progress</h3><p class="muted">Erases lessons, XP, practice time and song projects on this device. A snapshot is taken first, so you can restore it from the list above.</p>' +
      '<label class="field"><span>Type RESET to confirm</span><input id="resettext" type="text" autocomplete="off" value="' + esc(ui.resetText || '') + '" data-bind="resettext"></label>' +
      '<button class="btn danger" type="button" id="resetbtn" data-act="reset"' + (resetOk ? '' : ' disabled') + '>Erase all progress</button></section>';
  } else {
    body = aboutCard();
  }
  return {
    html: '<div class="screen narrow"><div class="pagehead"><h1>' + (tab === 'about' ? 'About' : tab === 'settings' ? 'Settings' : tab === 'data' ? 'Your data' : 'Profile') + '</h1></div>' + tabs + body + '</div>',
    mount(root) {
      if (tab !== 'data') return;
      let alive = true;
      Snap.list().then(items => {
        const el = $('#snaplist', root); if (!alive || !el) return;
        const label = { auto: 'Daily snapshot', 'before-import': 'Before an import', 'before-restore': 'Before a restore', 'before-reset': 'Before a reset', manual: 'Saved by hand' };
        el.innerHTML = items.length ? '<ul class="lessons">' + items.slice(0, 20).map(x => '<li class="lrow"><div class="lmain"><b>' + esc(label[x.reason] || x.reason) + '</b><span class="tiny">' + esc(new Date(x.at).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })) + '</span></div><button class="btn ghost sm" type="button" data-act="snaprestore" data-id="' + esc(x.id) + '">Restore</button></li>').join('') + '</ul>'
          : '<p class="tiny">' + (Desk ? 'No snapshots yet. The first one is made the next time your progress is saved.' : 'No snapshots yet.') + '</p>';
      });
      return () => { alive = false; };
    }
  };
}
