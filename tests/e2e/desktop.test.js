// The app as the desktop app serves it: the exact Content-Security-Policy, file types and nosniff header of main.js
// (read from main.js itself), so a script, worker or file the desktop app would block fails here too. Then a walk
// through every screen at desktop and narrow widths, collecting errors, blocked content, missing files and layout
// overflow; the background workers (vocal chain, mastering, loops) must load under the policy.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..', 'app');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'main.js'), 'utf8');
const CSP = eval(/const CSP = ([\s\S]*?);\n/.exec(src)[1]);
const MIME = eval('(' + /const MIME = (\{[\s\S]*?\});\n/.exec(src)[1] + ')');
const PORT = 8810;
const misses = [];
function desktopServer() {
  return http.createServer((q, r) => {
    let rel = decodeURIComponent(q.url.split('?')[0]); if (rel === '/' || rel === '') rel = '/index.html';
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT + path.sep)) { r.writeHead(403); r.end(); return; }
    fs.readFile(file, (e, d) => {
      if (e) { misses.push(rel); r.writeHead(404); r.end('Not found'); return; }
      const h = { 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff' }, type = MIME[path.extname(file).toLowerCase()];
      if (type) h['Content-Type'] = type;   // like the desktop app: unknown types get no Content-Type
      r.writeHead(200, h); r.end(d);
    });
  }).listen(PORT);
}
let srv, browser;
test.before(async () => { srv = desktopServer(); browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); });
test.after(async () => { await browser.close(); srv.close(); });

// files the app asks for that a copy built here does not have yet (the release build adds them)
const OPTIONAL = /^\/(sounds\/|samples\/|vendor\/lame\.min\.js|fonts\/)/;
async function open(width) {
  const ctx = await browser.newContext({ viewport: { width: width || 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage(), problems = [];
  page.on('pageerror', e => problems.push('page error: ' + e.message));
  page.on('console', m => { const t = m.text(); if ((m.type() === 'error' || /Content Security Policy|Refused to/.test(t)) && !/Failed to load resource/.test(t)) problems.push('console: ' + t); });
  await page.addInitScript(() => { document.addEventListener('securitypolicyviolation', e => { (window.__csp = window.__csp || []).push(e.violatedDirective + ' ' + e.blockedURI); }); });
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => { window.__gpa.S().profile.onboarded = true; });
  return { page, problems };
}
/* a song with everything in it */
const richSong = () => {
  const g = window.__gpa; g.go('song'); g.ACTIONS.slnew();
  const P = g.S().songs[g.S().songs.length - 1];
  Object.assign(P, { title: 'Walkthrough', key: 'Eb', bpm: 96, beat: 'gospel128', style: 'triplets', bassStyle: 'gospel', ending: 'hold', choir: { on: true }, info: { writers: 'Minister Kemamah', year: '2026' } });
  P.sections.Chorus.chords = [{ r: 0, q: 'maj9', b: null, beats: 4, push: false }, { r: 4, q: '7#9', b: null, beats: 2, push: true }, { r: 9, q: 'm9', b: null, beats: 2, push: false }, { r: 5, q: 'major', b: 7, beats: 4, push: true }];
  P.melodies.Chorus = { notes: [{ m: 70, t: 0, d: 2 }, { m: 72, t: 2, d: 2 }, { m: 74, t: 4, d: 4 }] };
  P.words = { Chorus: 'Ho-ly ho-ly Lord' };
  P.form = [{ s: 'Intro' }, { s: 'Verse', fill: true }, { s: 'Chorus', x: 2, swell: true }, { s: 'Chorus', up: 1, tag: 2 }];
  P.structure = P.form.map(i => i.s);
  P.tracks = [{ id: 'harm1', name: 'Harmony', kind: 'vocal', takes: [], fx: { preset: 'choir', nr: 'preset' }, gain: 0.8, pan: -0.3 }];
  return P.id;
};

test('every screen opens under the desktop app\'s security policy, with no errors, blocked content or overflow', async () => {
  for (const width of [1280, 760]) {
    const { page, problems } = await open(width);
    const pid = await page.evaluate(richSong);
    const routes = [['home'], ['course'], ['lab'], ['practice'], ['song'], ['song', { pid }], ['voice'], ['profile'], ['profile', { tab: 'settings' }], ['profile', { tab: 'data' }], ['profile', { tab: 'about' }], ['guitar'],
      ['practice', { view: 'warm' }], ['practice', { view: 'review' }], ['practice', { view: 'songbook' }], ['practice', { view: 'sight' }], ['practice', { view: 'technique' }], ['practice', { view: 'byear' }],
      ['practice', { view: 'calib' }], ['practice', { view: 'metro' }], ['practice', { view: 'sprint', kind: 'note' }], ['practice', { view: 'gear' }], ['practice', { view: 'licks' }], ['practice', { view: 'lick', id: 'tt251' }], ['practice', { view: 'lick', id: 'vyes' }],
      ['practice', { view: 'ear', type: 'progression' }], ['voice', { tab: 'exercises' }], ['voice', { tab: 'tuner' }], ['voice', { tab: 'learn' }], ['voice', { tab: 'progress' }]];
    const firstLesson = await page.evaluate(() => (typeof LESSONS !== 'undefined' ? LESSONS : []).slice(0, 3).map(l => l.id));
    firstLesson.forEach(id => routes.push(['lesson', { id }]));
    for (const tab of ['ear', 'gospel', 'read', 'more']) routes.push(['practice', { _tab: tab }]);
    const overflow = [];
    for (const [name, params] of routes) {
      await page.evaluate(([n, p]) => { const g = window.__gpa; if (p && p._tab) { g.ui.practiceTab = p._tab; g.go('practice'); } else g.go(n, p || {}); }, [name, params || null]);
      await page.waitForTimeout(150);
      const ow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (ow > 2) overflow.push(name + JSON.stringify(params || {}) + ' +' + ow + 'px');
      const h1 = await page.evaluate(() => !!document.querySelector('main h1, .screen h1'));
      if (!h1) problems.push('no heading on ' + name + JSON.stringify(params || {}));
    }
    const csp = await page.evaluate(() => window.__csp || []);
    assert.deepEqual(csp, [], 'blocked by the security policy at ' + width + 'px');
    assert.deepEqual(problems, [], 'at ' + width + 'px');
    assert.deepEqual(overflow, [], 'sideways scrolling at ' + width + 'px');
  }
  const real = misses.filter(m => !OPTIONAL.test(m));
  assert.deepEqual([...new Set(real)], [], 'files the app asked for that do not exist');
});

test('the background workers and the MP3 loader work under the desktop policy', async () => {
  const { page, problems } = await open();
  const r = await page.evaluate(async () => {
    const sr = 44100, x = new Float32Array(sr * 3); for (let i = 0; i < x.length; i++) x[i] = 0.3 * Math.sin(2 * Math.PI * 220 * i / sr) + 0.01 * Math.sin(i);
    const t0 = performance.now();
    const y = await VocalFX.chainAsync(x, sr, 'worship', {});
    const m = await VocalFX.masterAsync([x, x], sr, { target: 'stream' });
    const f = await fitAsync([x], sr, 100, 120, 2);
    const mp3 = await mp3Ready();
    return { y: y.length, lufs: m.lufs, f: f[0].length, mp3, ms: performance.now() - t0, workers: performance.getEntriesByType('resource').filter(e => /workers\//.test(e.name)).map(e => e.name.replace(/.*\//, '')) };
  });
  assert.equal(r.y, 44100 * 3); assert.ok(Math.abs(r.lufs - -14) < 1); assert.ok(Math.abs(r.f - 44100 * 3 / 1.2) < 600);
  assert.deepEqual(r.workers.sort(), ['loop-worker.js', 'vocalfx-worker.js'], 'both workers loaded (not the fallback)');
  assert.equal(r.mp3, false, 'no encoder in this copy: reported, not crashed');
  assert.deepEqual(await page.evaluate(() => window.__csp || []), []);
  assert.deepEqual(problems, []);
});
