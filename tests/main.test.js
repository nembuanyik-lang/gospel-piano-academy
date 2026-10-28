// Tests for the desktop main process (main.js) with a stand-in for Electron, so they run in plain Node.
// They cover the progress files: atomic saves, recovery, snapshots, pruning and the IPC sender check.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gma-main-'));
const handlers = {}, syncHandlers = {};
const fakeElectron = {
  app: {
    setPath: (k, v) => { fakeElectron.app._paths[k] = v; }, getPath: k => (k === 'appData' ? tmp : fakeElectron.app._paths[k]), _paths: {},
    setName() {}, requestSingleInstanceLock: () => false, quit() {}, on() {}, whenReady: () => new Promise(() => {}),
    isPackaged: false, getVersion: () => '2.0.0',
  },
  protocol: { registerSchemesAsPrivileged() {}, handle() {} },
  ipcMain: { handle: (ch, fn) => { handlers[ch] = fn; }, on: (ch, fn) => { syncHandlers[ch] = fn; } },
  BrowserWindow: function () {}, net: {}, shell: { openExternal() {}, openPath: async () => '' }, session: {}, Menu: {}, dialog: {}, screen: {},
};
const origLoad = Module._load;
Module._load = function (req, ...rest) { return req === 'electron' ? fakeElectron : origLoad.call(this, req, ...rest); };
require('../main.js');
Module._load = origLoad;

const ours = { senderFrame: { url: 'app://gospel-piano-academy/index.html' } };
const stranger = { senderFrame: { url: 'https://example.com/' } };
const call = (ch, ...a) => handlers[ch](ours, ...a);
const dataDir = path.join(tmp, 'Gospel Piano Academy', 'progress');

test('progress keeps the original data folder after the rename', () => {
  assert.equal(fakeElectron.app._paths.userData, path.join(tmp, 'Gospel Piano Academy'));
});

test('save then load returns the same progress, and a daily snapshot is made', async () => {
  const json = JSON.stringify({ v: 1, xp: 5, updated: 1 });
  assert.deepEqual(await call('state:save', json), { ok: true });
  const r = await call('state:load');
  assert.equal(r.json, json);
  const list = await call('snap:list');
  assert.equal(list.items.filter(x => x.reason === 'auto').length, 1);
});

test('invalid data is refused and the saved file is untouched', async () => {
  const before = fs.readFileSync(path.join(dataDir, 'state.json'), 'utf8');
  assert.equal((await call('state:save', 'not json')).ok, false);
  assert.equal((await call('state:save', '[1,2]')).ok, false);
  assert.equal(fs.readFileSync(path.join(dataDir, 'state.json'), 'utf8'), before);
});

test('a damaged state file falls back to the previous copy', async () => {
  await call('state:save', JSON.stringify({ v: 1, xp: 6 }));
  await call('state:save', JSON.stringify({ v: 1, xp: 7 }));
  fs.writeFileSync(path.join(dataDir, 'state.json'), '{"broken');
  const r = await call('state:load');
  assert.equal(JSON.parse(r.json).xp, 6);
  assert.equal(r.recovered, true);
});

test('snapshots can be created, listed and read; only ten of each kind are kept', async () => {
  for (let i = 0; i < 12; i++) { assert.equal((await call('snap:create', 'before-import', JSON.stringify({ v: 1, xp: i }))).ok, true); await new Promise(r => setTimeout(r, 2)); }
  const list = await call('snap:list');
  const imports = list.items.filter(x => x.reason === 'before-import');
  assert.equal(imports.length, 10);
  const r = await call('snap:read', imports[0].id);
  assert.equal(r.ok, true);
  assert.ok(JSON.parse(r.json).xp >= 2);
});

test('snapshot names and reasons are validated', async () => {
  assert.equal((await call('snap:read', '../state.json')).ok, false);
  assert.equal((await call('snap:read', 'auto-2020-01-01.json/../../x')).ok, false);
  assert.equal((await call('snap:create', 'auto', '{}')).ok, false);
  assert.equal((await call('snap:create', 'whatever', '{}')).ok, false);
});

test('calls from any page other than the app are refused', async () => {
  assert.deepEqual(await handlers['state:load'](stranger), { ok: false, error: 'refused' });
  const e = { senderFrame: stranger.senderFrame }; syncHandlers['state:save-sync'](e, '{}');
  assert.equal(e.returnValue.ok, false);
});

test('the closing save works synchronously', () => {
  const e = { senderFrame: ours.senderFrame }; syncHandlers['state:save-sync'](e, JSON.stringify({ v: 1, xp: 99 }));
  assert.equal(e.returnValue.ok, true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir, 'state.json'), 'utf8')).xp, 99);
});

test('app version in the page matches package.json', () => {
  const pkg = require('../package.json');
  const about = fs.readFileSync(path.join(__dirname, '..', 'app', 'js', 'about.js'), 'utf8');
  assert.equal(/const APP_VERSION = '([^']+)'/.exec(about)[1], pkg.version);
});

test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
