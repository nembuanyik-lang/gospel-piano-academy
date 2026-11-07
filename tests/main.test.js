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

test('MIDI keyboards are allowed under both permission names (recent Chromium asks for midiSysex)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
  assert.match(src, /setPermissionRequestHandler[\s\S]*permission === 'midi' \|\| permission === 'midiSysex'\) return cb\(true\)/);
  assert.match(src, /setPermissionCheckHandler[\s\S]*permission === 'midi' \|\| permission === 'midiSysex'\) return true/);
});

test('the release build downloads the recorded piano (retries, skips missing files, writes the manifest)', async () => {
  const http = require('http');
  const { download, haveSamples, NAMES } = require('../scripts/get-piano-samples.js');
  let hits = 0;
  const srv = http.createServer((req, res) => {
    hits++;
    if (req.url.includes('C8')) { res.statusCode = 404; return res.end(); }               // one note missing
    if (req.url.includes('A0') && hits < 3) { res.statusCode = 503; return res.end(); }    // a flaky first try
    res.end(Buffer.alloc(4000, 7));
  });
  await new Promise(r => srv.listen(0, r));
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'gma-smp-'));
  try {
    assert.equal(haveSamples(dest), false);
    const n = await download({ base: 'http://localhost:' + srv.address().port + '/', dest, quiet: true });
    assert.equal(n, NAMES.length - 1);
    const man = JSON.parse(fs.readFileSync(path.join(dest, 'manifest.json'), 'utf8'));
    assert.ok(man.notes.A0 && !man.notes.C8 && /Salamander/.test(man.credit));
    assert.equal(haveSamples(dest), true);
  } finally { srv.close(); }
});

test('the release build downloads the instrument library (skips a mirror that returns a web page, checks the file)', async () => {
  const http = require('http');
  const { download, haveSounds, isSoundFont, FILE } = require('../scripts/get-sounds.js');
  const sf = require('./fixtures/make-sf2.js').build();
  assert.ok(isSoundFont(sf) && !isSoundFont(Buffer.from('<html>not found</html>')));
  const srv = http.createServer((req, res) => {
    if (req.url === '/a.sf2') { res.setHeader('content-type', 'text/html'); return res.end('<!doctype html><title>Moved</title>'); } // a web page, not the file
    if (req.url === '/b.sf2') { res.statusCode = 404; return res.end(); }
    res.end(sf);
  });
  await new Promise(r => srv.listen(0, r));
  const base = 'http://localhost:' + srv.address().port;
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'gma-snd-'));
  try {
    assert.equal(haveSounds(dest), false);
    const ok = await download({ urls: [base + '/a.sf2', base + '/b.sf2', base + '/c.sf2'], dest, minBytes: 1000, tries: 1, quiet: true });
    assert.equal(ok, true);
    const man = JSON.parse(fs.readFileSync(path.join(dest, 'manifest.json'), 'utf8'));
    assert.equal(man.file, FILE); assert.match(man.credit, /GeneralUser GS/);
    assert.equal(fs.readFileSync(path.join(dest, FILE)).length, sf.length);
    // a file that is too small is refused (a truncated download)
    const dest2 = fs.mkdtempSync(path.join(os.tmpdir(), 'gma-snd-'));
    assert.equal(await download({ urls: [base + '/c.sf2'], dest: dest2, minBytes: sf.length + 1, tries: 1, quiet: true }), false);
    assert.equal(fs.existsSync(path.join(dest2, 'manifest.json')), false);
  } finally { srv.close(); }
});

test('the app loads the SoundFont player before the sound engine, and the build fetches the library', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'app', 'index.html'), 'utf8');
  assert.ok(html.indexOf('js/sf2.js') > 0 && html.indexOf('js/sf2.js') < html.indexOf('js/audio.js'));
  const prep = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'prepare.js'), 'utf8');
  assert.match(prep, /get-sounds\.js[\s\S]*GITHUB_ACTIONS/);
});
