/* Gospel Music Academy — Electron main process.
   Serves ./app over a private app:// origin, keeps progress in files with daily snapshots,
   checks GitHub Releases for updates, and exposes a small, validated API to the page through preload.js. */
const { app, BrowserWindow, protocol, net, shell, session, Menu, dialog, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const APP_NAME = 'Gospel Music Academy';
const APP_DIR = path.join(__dirname, 'app');
// The origin and the data folder keep their original names: local storage is tied to the origin and the
// data folder holds every learner's progress, so renaming either would make existing progress disappear.
const ORIGIN = 'app://gospel-piano-academy';
app.setPath('userData', path.join(app.getPath('appData'), 'Gospel Piano Academy'));
app.setName(APP_NAME);

const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; " +
  "media-src 'self' blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
// Web pages the app may open in the user's browser. Everything else is refused.
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
const EXTERNAL_HOSTS = new Set(['github.com', 'creativecommons.org', 'tonejs.github.io']);

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

/* ---------------------------------------------------------------- small log file for support */
const logFile = () => path.join(app.getPath('userData'), 'logs', 'main.log');
function log(...parts) {
  try {
    const f = logFile();
    fs.mkdirSync(path.dirname(f), { recursive: true });
    try { if (fs.statSync(f).size > 1024 * 1024) fs.renameSync(f, f + '.old'); } catch { /* no log yet */ }
    fs.appendFileSync(f, new Date().toISOString() + ' ' + parts.map(p => (p instanceof Error ? p.stack || p.message : String(p))).join(' ') + '\n');
  } catch { /* logging must never break the app */ }
}
process.on('uncaughtException', (e) => log('uncaught', e));

/* ---------------------------------------------------------------- progress files */
const dataDir = () => path.join(app.getPath('userData'), 'progress');
const snapDir = () => path.join(dataDir(), 'snapshots');
const stateFile = () => path.join(dataDir(), 'state.json');
const MAX_STATE_BYTES = 20 * 1024 * 1024;
const SNAP_REASONS = new Set(['auto', 'before-import', 'before-restore', 'before-reset', 'manual']);
const SNAP_RE = /^(auto|before-import|before-restore|before-reset|manual)-(\d{4}-\d{2}-\d{2}|\d{13})\.json$/;
const KEEP_PER_KIND = 10;

function validJson(json) {
  if (typeof json !== 'string' || json.length > MAX_STATE_BYTES) return false;
  try { const o = JSON.parse(json); return !!o && typeof o === 'object' && !Array.isArray(o); } catch { return false; }
}
/* write to a temporary file, flush it to disk, then rename over the old file: a crash never leaves half a file */
function atomicWrite(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  const fd = fs.openSync(tmp, 'w');
  try { fs.writeSync(fd, text); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(tmp, file);
}
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function prune() {
  const byKind = {};
  for (const f of fs.readdirSync(snapDir())) { const m = SNAP_RE.exec(f); if (m) (byKind[m[1]] = byKind[m[1]] || []).push(f); }
  for (const list of Object.values(byKind)) list.sort().slice(0, Math.max(0, list.length - KEEP_PER_KIND)).forEach(f => { try { fs.unlinkSync(path.join(snapDir(), f)); } catch { /* ignore */ } });
}
function writeSnapshot(reason, json) {
  const name = reason === 'auto' ? 'auto-' + today() + '.json' : reason + '-' + Date.now() + '.json';
  atomicWrite(path.join(snapDir(), name), json);
  prune();
}
function saveState(json) {
  if (!validJson(json)) return { ok: false, error: 'The progress data was not valid.' };
  try {
    // keep the last good copy, so a damaged file can be recovered (never copy a damaged file over it)
    try { const cur = fs.readFileSync(stateFile(), 'utf8'); if (validJson(cur)) atomicWrite(path.join(dataDir(), 'state.prev.json'), cur); } catch { /* first save */ }
    atomicWrite(stateFile(), json);
    if (!fs.existsSync(path.join(snapDir(), 'auto-' + today() + '.json'))) writeSnapshot('auto', json);
    return { ok: true };
  } catch (e) { log('saveState', e); return { ok: false, error: e.code || e.message }; }
}
function loadState() {
  for (const f of [stateFile(), path.join(dataDir(), 'state.prev.json')]) {
    try { const json = fs.readFileSync(f, 'utf8'); if (validJson(json)) return { ok: true, json, recovered: f !== stateFile() }; }
    catch (e) { if (e.code !== 'ENOENT') log('loadState', f, e); }
  }
  return { ok: true, json: null };
}

/* ---------------------------------------------------------------- IPC: only our own page may call */
function fromApp(e) { const u = (e.senderFrame && e.senderFrame.url) || ''; return u.startsWith(ORIGIN + '/'); }
function handle(channel, fn) {
  ipcMain.handle(channel, async (e, ...args) => {
    if (!fromApp(e)) return { ok: false, error: 'refused' };
    try { return await fn(...args); } catch (err) { log(channel, err); return { ok: false, error: err.message }; }
  });
}
handle('state:load', () => loadState());
handle('state:save', (json) => saveState(json));
ipcMain.on('state:save-sync', (e, json) => { e.returnValue = fromApp(e) ? saveState(json) : { ok: false }; });
handle('snap:create', (reason, json) => {
  if (!SNAP_REASONS.has(reason) || reason === 'auto' || !validJson(json)) return { ok: false, error: 'invalid snapshot' };
  writeSnapshot(reason, json); return { ok: true };
});
handle('snap:list', () => {
  let files = []; try { files = fs.readdirSync(snapDir()); } catch { return { ok: true, items: [] }; }
  const items = files.map(f => {
    const m = SNAP_RE.exec(f); if (!m) return null;
    let at; try { at = fs.statSync(path.join(snapDir(), f)).mtimeMs; } catch { at = 0; }
    return { id: f, reason: m[1], at: Math.round(at) };
  }).filter(Boolean).sort((a, b) => b.at - a.at);
  return { ok: true, items };
});
handle('snap:read', (id) => {
  if (typeof id !== 'string' || !SNAP_RE.test(id)) return { ok: false, error: 'invalid snapshot name' };
  return { ok: true, json: fs.readFileSync(path.join(snapDir(), id), 'utf8') };
});
handle('app:info', () => ({
  ok: true, version: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome,
  platform: process.platform, packaged: app.isPackaged, update: updateState,
}));
handle('app:open-data-folder', async () => { fs.mkdirSync(dataDir(), { recursive: true }); const err = await shell.openPath(dataDir()); return { ok: !err, error: err }; });
handle('app:open-external', (url) => { if (!openExternalSafe(url)) return { ok: false, error: 'not allowed' }; return { ok: true }; });
handle('updates:check', () => { checkForUpdates(true); return { ok: true, update: updateState }; });

function openExternalSafe(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || !EXTERNAL_HOSTS.has(u.hostname)) { log('blocked external link', url); return false; }
    shell.openExternal(u.toString()); return true;
  } catch { return false; }
}

/* ---------------------------------------------------------------- window */
let win;
const winStateFile = () => path.join(app.getPath('userData'), 'window-state.json');
function loadWinState() {
  try {
    const st = JSON.parse(fs.readFileSync(winStateFile(), 'utf8'));
    // only reuse the position if the window would be visible on a connected display
    const visible = Number.isFinite(st.x) && Number.isFinite(st.y) && screen.getAllDisplays().some(d => {
      const a = d.workArea;
      return st.x + 100 > a.x && st.x < a.x + a.width - 100 && st.y >= a.y - 10 && st.y < a.y + a.height - 100;
    });
    if (!visible) { delete st.x; delete st.y; }
    return st;
  } catch { return {}; }
}
let winSaveTimer = null;
function saveWinState() {
  if (!win || win.isDestroyed()) return;
  try { const b = win.getNormalBounds(); fs.writeFileSync(winStateFile(), JSON.stringify({ ...b, maximized: win.isMaximized() })); } catch { /* ignore */ }
}
function createWindow() {
  const st = loadWinState();
  win = new BrowserWindow({
    width: st.width || 1200, height: st.height || 800, x: st.x, y: st.y,
    minWidth: 420, minHeight: 600,
    backgroundColor: '#ECECE8',
    title: APP_NAME,
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false,
      backgroundThrottling: false,            // keep music timers running when the window is behind another or minimised
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  if (st.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());
  const later = () => { clearTimeout(winSaveTimer); winSaveTimer = setTimeout(saveWinState, 800); };
  win.on('resize', later); win.on('move', later);
  win.on('close', saveWinState);
  win.loadURL(`${ORIGIN}/index.html`);
  win.webContents.on('render-process-gone', (_e, d) => log('renderer gone', d.reason));

  // Keep the app window for the app only; allowed web links open in the user's browser.
  win.webContents.setWindowOpenHandler(({ url }) => { openExternalSafe(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(ORIGIN + '/')) { e.preventDefault(); openExternalSafe(url); } });
}
const send = (channel, payload) => { if (win && !win.isDestroyed()) win.webContents.send(channel, payload); };

/* ---------------------------------------------------------------- menu: zoom, full screen, help (Alt shows it on Windows) */
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ label: APP_NAME, submenu: [{ label: 'About ' + APP_NAME, click: () => send('nav', 'about') }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] }] : []),
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [
      { role: 'resetZoom', label: 'Actual size' }, { role: 'zoomIn', label: 'Larger text' },
      { role: 'zoomIn', accelerator: 'CmdOrCtrl+=', visible: false }, { role: 'zoomOut', label: 'Smaller text' },
      { type: 'separator' }, { role: 'togglefullscreen' },
      ...(app.isPackaged ? [] : [{ type: 'separator' }, { role: 'reload' }, { role: 'toggleDevTools' }]),
    ] },
    { label: 'Help', submenu: [
      { label: 'Settings', click: () => send('nav', 'settings') },
      { label: 'Check for updates', click: () => { checkForUpdates(true); send('nav', 'about'); } },
      { label: 'Open progress folder', click: () => { fs.mkdirSync(dataDir(), { recursive: true }); shell.openPath(dataDir()); } },
      ...(isMac ? [] : [{ type: 'separator' }, { label: 'About ' + APP_NAME, click: () => send('nav', 'about') }]),
    ] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ---------------------------------------------------------------- updates (GitHub Releases) */
const updateState = { status: app.isPackaged ? 'idle' : 'dev', version: null, percent: 0, error: '', lastCheck: 0 };
let autoUpdater = null;
function setUpdate(patch) { Object.assign(updateState, patch); send('updates:status', updateState); }
function plainNotes(notes) {
  const text = Array.isArray(notes) ? notes.map(n => n.note || '').join('\n') : String(notes || '');
  return text.replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 700);
}
function setupUpdates() {
  if (!app.isPackaged) return;
  try { ({ autoUpdater } = require('electron-updater')); } catch (e) { log('updater missing', e); return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => setUpdate({ status: 'checking', error: '' }));
  autoUpdater.on('update-not-available', () => setUpdate({ status: 'current', lastCheck: Date.now() }));
  autoUpdater.on('update-available', (i) => setUpdate({ status: 'downloading', version: i.version, percent: 0, lastCheck: Date.now() }));
  autoUpdater.on('download-progress', (p) => setUpdate({ status: 'downloading', percent: Math.round(p.percent || 0) }));
  autoUpdater.on('error', (e) => { log('update error', e); setUpdate({ status: 'error', error: friendlyUpdateError(e), lastCheck: Date.now() }); });
  autoUpdater.on('update-downloaded', (info) => {
    setUpdate({ status: 'ready', version: info.version, percent: 100 });
    const notes = plainNotes(info.releaseNotes);
    dialog.showMessageBox(win && !win.isDestroyed() ? win : undefined, {
      type: 'info', buttons: ['Restart now', 'Later'], defaultId: 0, cancelId: 1,
      title: 'Update ready', message: 'Version ' + info.version + ' is ready.',
      detail: (notes ? 'What is new:\n' + notes + '\n\n' : '') + 'Restart to finish updating. Your progress is kept. If you choose Later, it installs the next time you close the app.',
    }).then((r) => { if (r.response === 0) autoUpdater.quitAndInstall(); }).catch(() => {});
  });
  setTimeout(() => checkForUpdates(false), 8000);
  setInterval(() => checkForUpdates(false), 6 * 60 * 60 * 1000);
}
function friendlyUpdateError(e) {
  const m = String((e && e.message) || e);
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|net::|offline|EAI_AGAIN/i.test(m)) return 'No internet connection, so updates could not be checked.';
  if (/404|latest\.yml|no published/i.test(m)) return 'No published update was found yet.';
  return 'The update check did not work. Details are in the log file.';
}
function checkForUpdates(manual) {
  if (!autoUpdater) { if (manual) setUpdate({ status: app.isPackaged ? 'error' : 'dev', error: app.isPackaged ? 'The updater is not available in this build.' : '' }); return; }
  if (updateState.status === 'downloading' || updateState.status === 'ready') return;
  try { autoUpdater.checkForUpdates().catch(() => {}); } catch (e) { log('check', e); }
}

/* ---------------------------------------------------------------- start */
function start() {
  if (!app.requestSingleInstanceLock()) { app.quit(); return; }

  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

  app.whenReady().then(() => {
    // Serve ./app over app:// with path-traversal protection and a strict Content-Security-Policy.
    protocol.handle('app', async (req) => {
      const u = new URL(req.url);
      if (u.host !== 'gospel-piano-academy') return new Response('Not found', { status: 404 });
      let rel; try { rel = decodeURIComponent(u.pathname); } catch { return new Response('Bad request', { status: 400 }); }
      if (rel === '/' || rel === '') rel = '/index.html';
      const file = path.normalize(path.join(APP_DIR, rel));
      if (!file.startsWith(APP_DIR + path.sep)) return new Response('Forbidden', { status: 403 });
      try {
        const res = await net.fetch(pathToFileURL(file).toString());
        const headers = new Headers(res.headers);
        const type = MIME[path.extname(file).toLowerCase()];
        if (type) headers.set('Content-Type', type);
        headers.set('Content-Security-Policy', CSP);
        headers.set('X-Content-Type-Options', 'nosniff');
        return new Response(res.body, { status: res.status, headers });
      } catch { return new Response('Not found', { status: 404 }); }
    });

    // Allow MIDI keyboards and the microphone (guitar tuner) for our own page only. No camera, no MIDI SysEx.
    const ours = (url) => typeof url === 'string' && url.startsWith(ORIGIN + '/');
    session.defaultSession.setPermissionRequestHandler((wc, permission, cb, details) => {
      const url = (details && details.requestingUrl) || (wc && wc.getURL()) || '';
      if (!ours(url)) return cb(false);
      if (permission === 'midi') return cb(true);
      if (permission === 'media') { const t = (details && details.mediaTypes) || []; return cb(t.length > 0 && t.every(x => x === 'audio')); }
      return cb(false);
    });
    session.defaultSession.setPermissionCheckHandler((_wc, permission, origin, details) => {
      if (!ours(String(origin || '') + '/') && !ours(details && details.requestingUrl)) return false;
      if (permission === 'midi') return true;
      if (permission === 'media') return !details || !details.mediaType || details.mediaType === 'audio';
      return false;
    });

    buildMenu();
    createWindow();
    setupUpdates();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
}
start();
