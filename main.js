const { app, BrowserWindow, protocol, net, shell, session, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const APP_DIR = path.join(__dirname, 'app');
const ORIGIN = 'app://gospel-piano-academy';

// A real (secure, standard) origin instead of file:// gives stable localStorage and enables Web MIDI.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win;
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');
function loadState() {
  try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch { return {}; }
}
function saveState() {
  if (!win || win.isDestroyed()) return;
  try {
    const b = win.getNormalBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...b, maximized: win.isMaximized() }));
  } catch { /* ignore */ }
}

function createWindow() {
  const st = loadState();
  win = new BrowserWindow({
    width: st.width || 1200,
    height: st.height || 800,
    x: st.x, y: st.y,
    minWidth: 420, minHeight: 600,
    backgroundColor: '#ECECE8',
    title: 'Gospel Piano Academy',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false,
      backgroundThrottling: false,            // keep music timers running when the window is behind another or minimised
      autoplayPolicy: 'no-user-gesture-required' },
  });
  if (st.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.on('close', saveState);
  win.loadURL(`${ORIGIN}/index.html`);

  // Keep the app window for the app only; open real web links in the user's browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(ORIGIN)) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); }
  });
}

/* Automatic updates: the installed app checks the project's GitHub Releases when it starts (and every few hours)
   while you are online, downloads a newer version quietly, then asks before restarting. Progress is kept. */
function setupUpdates() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try { ({ autoUpdater } = require('electron-updater')); } catch { return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('error', () => { /* offline or no release yet: stay quiet */ });
  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox(win && !win.isDestroyed() ? win : undefined, {
      type: 'info', buttons: ['Restart now', 'Later'], defaultId: 0, cancelId: 1,
      title: 'Update ready', message: 'Version ' + info.version + ' is ready.',
      detail: 'Restart to finish updating. Your progress is kept. If you choose Later, it installs the next time you close the app.',
    }).then((r) => { if (r.response === 0) autoUpdater.quitAndInstall(); }).catch(() => {});
  });
  const check = () => { try { autoUpdater.checkForUpdates().catch(() => {}); } catch { /* ignore */ } };
  setTimeout(check, 8000);
  setInterval(check, 6 * 60 * 60 * 1000);
}

app.whenReady().then(() => {
  // Serve ./app over app:// with path-traversal protection.
  protocol.handle('app', (req) => {
    const u = new URL(req.url);
    let rel; try { rel = decodeURIComponent(u.pathname); } catch { return new Response('Bad request', { status: 400 }); }
    if (rel === '/' || rel === '') rel = '/index.html';
    const file = path.normalize(path.join(APP_DIR, rel));
    if (!file.startsWith(APP_DIR + path.sep)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString()).catch(() => new Response('Not found', { status: 404 }));
  });

  // Allow MIDI keyboards only; deny everything else.
  const allowed = new Set(['midi', 'midiSysex']);
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(allowed.has(permission)));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowed.has(permission));

  if (process.platform !== 'darwin') Menu.setApplicationMenu(null); // keep the standard menu on macOS (Cmd+Q, copy/paste)
  createWindow();
  setupUpdates();

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
