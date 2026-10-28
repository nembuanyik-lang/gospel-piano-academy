'use strict';
const NAV = [['home', 'Home', 'home'], ['course', 'Course', 'course'], ['lab', 'Piano Lab', 'piano'], ['practice', 'Practice', 'practice'], ['song', 'Song Lab', 'song']];
const NAV_ACTIVE = { lesson: 'course', testout: 'course', guitar: 'course' };

/* Navigation. go() moves to a screen (stops sound, scrolls to the top, adds a history entry so the
   mouse back button and Alt+Left work). render() redraws the current screen in place: sound keeps
   playing, the scroll position stays and keyboard focus returns to the same control. */
const VIEWS = () => ({ home: viewHome, course: viewCourse, lesson: viewLesson, lab: viewLab, practice: viewPractice, song: viewSong, guitar: viewGuitar, progress: viewProgress, profile: viewProfile, testout: viewTestout, onboarding: viewOnboarding });
let lastError = null;
function go(name, params, opt) {
  const next = { name, params: params || {} };
  const same = route && route.name === next.name && JSON.stringify(route.params || {}) === JSON.stringify(next.params);
  route = next;
  try {
    if (!(opt && opt.fromHistory)) history[same ? 'replaceState' : 'pushState']({ gpa: 1, name: next.name, params: next.params }, '');
  } catch (e) { /* history unavailable */ }
  Snd.stopAll(); Snd.releaseAll();
  render({ nav: true });
  window.scrollTo(0, 0);
  const m = mainEl(); if (m && m.focus) { try { m.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
}
window.addEventListener('popstate', e => {
  const st = e.state;
  if (st && st.gpa && VIEWS()[st.name]) go(st.name, st.params || {}, { fromHistory: true });
});
window.addEventListener('keydown', e => {
  if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    const t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    e.preventDefault(); if (e.key === 'ArrowLeft') history.back(); else history.forward();
  }
});
window.addEventListener('mouseup', e => { if (e.button === 3) { e.preventDefault(); history.back(); } else if (e.button === 4) { e.preventDefault(); history.forward(); } });

/* remember which control had focus so a redraw can put it back */
const FOCUS_ATTRS = ['act', 'bind', 'id', 'i', 'v', 'd', 'k', 'to', 't', 'm', 'g', 's', 'r', 'mode', 'view', 'step', 'qi', 'oi', 'c', 'o', 'tab'];
function focusSelector(el) {
  if (!el || el === document.body || !el.closest || !el.closest('#main')) return null;
  if (el.id) return '#' + CSS.escape(el.id);
  if (!el.dataset) return null;
  const parts = FOCUS_ATTRS.filter(k => el.dataset[k] !== undefined).map(k => '[data-' + k + '="' + CSS.escape(el.dataset[k]) + '"]');
  return parts.length ? el.tagName.toLowerCase() + parts.join('') : null;
}
function render(opt) {
  const nav = !!(opt && opt.nav);
  const focusSel = nav ? null : focusSelector(document.activeElement);
  const scrollY = window.scrollY;
  if (cleanupView) { try { cleanupView(); } catch (e) { console.error(e); } cleanupView = null; }
  Input.listeners.clear(); Input.offListeners.clear(); Input.pianos.clear();
  const views = VIEWS();
  if (!S.profile.onboarded && route.name !== 'onboarding' && !ui.skipOnboarding) route = { name: 'onboarding', params: {} };
  let v;
  try { v = (views[route.name] || viewHome)(); lastError = null; }
  catch (e) { console.error(e); lastError = e; v = { html: errorScreen(e) }; }
  const m = mainEl();
  m.innerHTML = v.html;
  if (v.mount) { try { cleanupView = v.mount(m); } catch (e) { console.error(e); } }
  chrome();
  if (!nav) {
    if (Math.abs(window.scrollY - scrollY) > 2) window.scrollTo(0, scrollY);
    if (focusSel) { const f = m.querySelector(focusSel); if (f && f.focus) { try { f.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } }
  }
}
function errorScreen(e) {
  return '<div class="screen"><div class="card"><p class="eyebrow">Something went wrong</p><h2>This screen could not be shown</h2>' +
    '<p>Your progress is safe. Go back to Home and try again. If it keeps happening, export a backup and send the details below to whoever supports your copy of the app.</p>' +
    '<details><summary>Technical details</summary><pre class="errdetail">' + esc((e && (e.stack || e.message)) || String(e)) + '</pre></details>' +
    '<div class="row wrap"><button class="btn primary" type="button" data-act="go" data-to="home">Back to Home</button>' +
    '<button class="btn ghost" type="button" data-act="copyerr">Copy details</button>' +
    '<button class="btn ghost" type="button" data-act="pexport">Export backup</button></div></div></div>';
}
function chrome() {
  const rk = E.rankFor(S.xp);
  const hn = $('#hxp'); if (hn) { hn.innerHTML = icon('star') + '<span>' + S.xp + ' XP</span><small>' + esc(rk.name) + '</small>'; hn.setAttribute('aria-label', 'Progress: level ' + rk.level + ', ' + rk.name + ', ' + S.xp + ' XP'); }
  const av = $('#hav'); if (av) av.textContent = (S.profile.name || 'Y').trim().charAt(0).toUpperCase() || 'Y';
  const act = NAV_ACTIVE[route.name] || route.name;
  $$('[data-nav]').forEach(b => { b.classList.toggle('on', b.dataset.nav === act); b.setAttribute('aria-current', b.dataset.nav === act ? 'page' : 'false'); });
  $('#hxp').classList.toggle('on', route.name === 'progress'); $('#hav').classList.toggle('on', route.name === 'profile');
  document.body.classList.toggle('focus', route.name === 'onboarding');
}
App.onRemote = () => { render(); };
App.onPedal = on => { const b = $('#sustainbtn'); if (b) { b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); } };
App.onSoundChange = () => { if (route && route.name === 'profile') render(); };
/* A banner under the header whenever a save fails. It stays until a save works again. */
App.onSaveHealth = () => {
  const el = $('#savebanner'); if (!el) return;
  if (Store.ok) { el.hidden = true; el.innerHTML = ''; return; }
  const what = !Store.local && !Store.file ? 'Your latest progress could not be saved.'
    : !Store.file ? 'The copy of your progress on this computer could not be saved.'
    : 'Your progress could not be saved in this window\'s storage.';
  el.innerHTML = '<p><b>' + esc(what) + '</b> Export a backup now so nothing is lost.' + (Store.error ? ' <span class="tiny">(' + esc(Store.error) + ')</span>' : '') + '</p>' +
    '<div class="row wrap"><button class="btn primary sm" type="button" data-act="pexport">Export backup</button><button class="btn ghost sm" type="button" data-act="saveretry">Try again</button></div>';
  el.hidden = false;
};
const storageText = () => Desk
  ? 'Your progress is saved on this computer, with an automatic snapshot every day.'
  : 'Your progress is saved in this browser only.';

/* ---------------------------------------------------------------- backup: export and import progress */
const BACKUP_APP = Backup.APP;
const BACKUP_MAX_BYTES = Backup.MAX_BYTES;
const backupSummary = Backup.summary;
function exportProgress() {
  saveNow();
  const payload = { app: BACKUP_APP, format: 1, exportedAt: new Date().toISOString(), state: S };
  const day = E.dateStr();
  const who = (S.profile.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fileName = 'gospel-music-academy-progress' + (who ? '-' + who : '') + '-' + day + '.json';
  try {
    const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    S.events.lastBackup = Date.now(); touch();
    toast('Backup saved: ' + fileName);
    if (route && (route.name === 'profile' || route.name === 'home')) render();
  } catch (e) { toast('Could not create the backup file.', 'warn'); }
}
function parseBackup(text) { return Backup.parse(text, sanCtx()); }
function readBackupFile(file) {
  if (!file) return;
  if (file.size > BACKUP_MAX_BYTES) { ui.importMsg = 'That file is too large to be a backup.'; ui.importPending = null; render(); return; }
  const fr = new FileReader();
  fr.onload = () => {
    const r = parseBackup(String(fr.result || ''));
    if (r.ok) { ui.importPending = r; ui.importMsg = ''; } else { ui.importPending = null; ui.importMsg = r.msg; }
    render();
  };
  fr.onerror = () => { ui.importPending = null; ui.importMsg = 'The file could not be read.'; render(); };
  fr.readAsText(file);
}
async function applyImport() {
  const pend = ui.importPending; if (!pend || !pend.ok) return;
  ui.importPending = null;
  const snapped = await Snap.create('before-import');
  S = hydrate(pend.state);
  S.updated = Date.now();
  S.events = Object.assign({}, S.events, { lastBackup: Date.now() });
  ui.importMsg = ''; ui.onboarding = null; ui.lesson = null; ui.testout = null;
  ui.undoImport = snapped ? Date.now() : 0;
  ensureToday(); saveNow(); chrome(); checkAch();
  toast(snapped ? 'Progress restored. You can undo this from Home or Your data.' : 'Progress restored.');
  go('home');
}
/* Put back a snapshot (also used by "Undo import"). The current progress is snapshotted first. */
async function restoreSnapshot(id) {
  let json;
  try { json = await Snap.read(id); } catch (e) { toast(e.message, 'warn'); return; }
  let obj; try { obj = JSON.parse(json); } catch (e) { toast('That snapshot is damaged.', 'warn'); return; }
  await Snap.create('before-restore');
  S = hydrate(obj); S.updated = Date.now();
  ui.undoImport = 0; ui.lesson = null; ui.testout = null;
  ensureToday(); saveNow(); chrome(); checkAch();
  toast('Snapshot restored.');
  go('home');
}
async function undoImport() {
  const items = await Snap.list();
  const snap = items.find(x => x.reason === 'before-import');
  if (!snap) { toast('There is no import to undo.', 'warn'); ui.undoImport = 0; render(); return; }
  await restoreSnapshot(snap.id);
}
const backupDue = () => (S.xp > 0 || Object.keys(S.lessons).length > 0) && (!S.events.lastBackup || Date.now() - S.events.lastBackup > 14 * 864e5);
function soundCard() {
  const i = Snd.info();
  const mode = i.loading ? 'Loading recorded piano…' : i.mode === 'recorded' ? 'Recorded grand piano' : 'Built-in piano (synthesised)';
  return '<section class="card"><h3>Piano sound</h3><p><b>' + esc(mode) + '</b></p>' +
    '<p class="tiny">Touch is supported: a MIDI keyboard sends its key speed, and on screen the lower part of a key plays louder. Notes ring until you release the key. Hold Shift or press the sustain pedal on a MIDI keyboard to sustain.</p>' +
    (i.mode === 'recorded' ? (i.credit ? '<p class="tiny">' + esc(i.credit) + '</p>' : '') : '<p class="tiny">To use a recorded piano, add samples to the app (see the README).</p>') + '</section>';
}
function backupCard() {
  const last = S.events.lastBackup;
  const when = last ? 'Last backup: ' + new Date(last).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + '.' : 'You have not made a backup yet.';
  let html = '<section class="card"><h3>Backup and restore</h3>' +
    '<p>' + esc(storageText()) + ' Save a backup file now and then, and keep a copy somewhere safe (a flash drive, email or cloud storage). You can restore it on this or another computer.</p>' +
    '<p class="tiny">' + esc(when) + '</p>' +
    '<div class="row wrap"><button class="btn primary" type="button" data-act="pexport">Export progress</button>' +
    '<button class="btn ghost" type="button" data-act="pimportpick">Import progress…</button></div>' +
    '<input id="pimportfile" type="file" accept=".json,application/json" data-bind="pimport" hidden aria-label="Choose a backup file to import">';
  if (ui.importMsg) html += '<p class="tag warn" role="alert">' + esc(ui.importMsg) + '</p>';
  const pend = ui.importPending;
  if (pend && pend.ok) {
    const a = pend.summary, b = backupSummary(S);
    const line = x => (x.name ? esc(x.name) + ' · ' : '') + x.xp + ' XP · ' + x.done + (x.done === 1 ? ' lesson' : ' lessons') + ' done · ' + x.minutes + ' min practised · ' + x.songs + ' songs';
    html += '<div class="callout" role="alert"><p><b>Backup file</b>' + (pend.exportedAt ? ' (saved ' + esc(new Date(pend.exportedAt).toLocaleString()) + ')' : '') + '<br>' + line(a) + '</p>' +
      '<p><b>On this device now</b><br>' + line(b) + '</p>' +
      '<p>Importing replaces the progress on this device. If you want to keep what is here, press Cancel and export it first.</p>' +
      '<div class="row wrap"><button class="btn primary" type="button" data-act="pimportapply">Replace with backup</button><button class="btn ghost" type="button" data-act="pimportcancel">Cancel</button></div></div>';
  }
  return html + '</section>';
}

/* ---------------------------------------------------------------- small helpers */
const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);
const fmtDur = sec => { const m = Math.floor(sec / 60); return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min'; };
const bar = (p, cls) => '<div class="bar' + (cls ? ' ' + cls : '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><i style="width:' + p + '%"></i></div>';
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
function selectHtml(id, options, value, bind) {
  return '<select id="' + id + '" data-bind="' + bind + '">' + options.map(o => '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
}
function soundPicker() {
  return '<label class="field soundpick"><span>Sound</span>' + selectHtml('instpick', Snd.instruments().map(i => [i.id, i.label]), Snd.inst(), 'instpick') + '</label>';
}
const keyOptions = KEY_NAMES.map(k => [k, fmt(k) + ' major']);

/* ---------------------------------------------------------------- warm-up and ear suggestions */
function warmupPlan() {
  const day = Math.floor(Date.now() / 86400000);
  if (isDone('major-scale-formula')) {
    const k = ['C', 'G', 'F', 'D'][day % 4];
    return { title: fmt(k) + ' major scale', sub: 'Up one octave, then check your fingering.', ex: { type: 'seq', notes: E.scaleTokens(k, 'major', 4), hints: true, range: [60, 84], prompt: 'Play the ' + fmt(k) + ' major scale up one octave: ' + E.scaleNotes(k, 'major').map(fmt).join(' ') + '.' } };
  }
  if (isDone('c-major-scale')) return { title: 'C major scale', sub: 'Up and down, evenly.', ex: { type: 'seq', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'], hints: true, prompt: 'Play the C major scale up and back down.' } };
  if (isDone('posture-fingers')) return { title: 'Five-finger position', sub: 'Right hand, C to G and back.', ex: { type: 'seq', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4'], fingers: [1, 2, 3, 4, 5, 4, 3, 2, 1], hints: true, prompt: 'Right hand, fingers 1 to 5, up and back.' } };
  return { title: 'Find C and F', sub: 'Use the black-key groups.', ex: { type: 'find', names: ['C', 'F'], count: 6, range: [48, 72], prompt: 'Play the note shown. Use the black-key groups to find it.' } };
}
function suggestEar() {
  const tried = Object.keys(S.ear).filter(t => (S.ear[t].total || 0) >= 4);
  if (tried.length) return tried.sort((a, b) => S.ear[a].correct / S.ear[a].total - S.ear[b].correct / S.ear[b].total)[0];
  return isDone('triad-minor') ? 'chord' : 'note';
}
