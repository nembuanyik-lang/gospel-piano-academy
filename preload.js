/* Gospel Music Academy — the bridge between the page and the main process.
   The page gets a small, fixed API (window.gpaDesktop); it never sees Node or Electron itself. */
const { contextBridge, ipcRenderer } = require('electron');

const listeners = { updates: new Set(), nav: new Set(), remote: new Set() };
ipcRenderer.on('remote:cmd', (_e, c) => listeners.remote.forEach(fn => { try { fn(String(c)); } catch { /* ignore */ } }));
ipcRenderer.on('updates:status', (_e, s) => listeners.updates.forEach(fn => { try { fn(s); } catch { /* ignore */ } }));
ipcRenderer.on('nav', (_e, where) => listeners.nav.forEach(fn => { try { fn(String(where)); } catch { /* ignore */ } }));

contextBridge.exposeInMainWorld('gpaDesktop', {
  isDesktop: true,
  loadState: () => ipcRenderer.invoke('state:load'),
  saveState: (json) => ipcRenderer.invoke('state:save', String(json)),
  saveStateNow: (json) => ipcRenderer.sendSync('state:save-sync', String(json)),
  snapshot: (reason, json) => ipcRenderer.invoke('snap:create', String(reason), String(json)),
  listSnapshots: () => ipcRenderer.invoke('snap:list'),
  readSnapshot: (id) => ipcRenderer.invoke('snap:read', String(id)),
  info: () => ipcRenderer.invoke('app:info'),
  openDataFolder: () => ipcRenderer.invoke('app:open-data-folder'),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', String(url)),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  // big saves (stems, song packages), written to disk piece by piece
  saveOpen: (name) => ipcRenderer.invoke('file:save-open', String(name)),
  saveWrite: (id, data) => ipcRenderer.invoke('file:save-write', Number(id), data instanceof Uint8Array ? data : new Uint8Array(0)),
  saveClose: (id, keep) => ipcRenderer.invoke('file:save-close', Number(id), !!keep),
  onUpdateStatus: (fn) => { if (typeof fn === 'function') listeners.updates.add(fn); },
  // the phone remote
  remoteStart: () => ipcRenderer.invoke('remote:start'),
  remoteStop: () => ipcRenderer.invoke('remote:stop'),
  remoteInfo: () => ipcRenderer.invoke('remote:info'),
  remoteMeta: (json) => ipcRenderer.send('remote:meta', String(json)),
  remoteLive: (json) => ipcRenderer.send('remote:live', String(json)),
  onRemoteCommand: (fn) => { if (typeof fn === 'function') listeners.remote.add(fn); },
  onNavigate: (fn) => { if (typeof fn === 'function') listeners.nav.add(fn); },
});
