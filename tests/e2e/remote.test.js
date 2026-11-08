'use strict';
const T = require('./tabs').auto;
// The phone remote: the page and the Wi-Fi server working together, with a second page standing in for the phone.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const serve = require('./serve');
const { createRemote } = require('../../lanremote');
const FIX = path.join(__dirname, '..', 'fixtures');
if (!fs.existsSync(path.join(FIX, 'voice-five.wav'))) execFileSync('python3', [path.join(FIX, 'make-voice.py'), FIX]);

const PORT = 8799;
let srv, browser;
test.before(async () => {
  srv = serve(path.join(__dirname, '..', '..', 'app'), PORT);
  browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + path.join(FIX, 'voice-five.wav'), '--autoplay-policy=no-user-gesture-required'] });
});
test.after(async () => { await browser.close(); srv.close(); });

test('the phone shows the song, follows the chords while it plays, and Play, Stop and Record from the phone work the computer', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['microphone'] });
  const page = T(await ctx.newPage()), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const remote = createRemote({ onCommand: c => page.evaluate(x => window.__remoteCmd && window.__remoteCmd(x), c).catch(() => {}) });
  await page.exposeFunction('__rStart', () => remote.start(0));
  await page.exposeFunction('__rStop', () => remote.stop());
  await page.exposeFunction('__rMeta', j => remote.setMeta(JSON.parse(j)));
  await page.exposeFunction('__rLive', j => remote.setLive(JSON.parse(j)));
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => {
    window.gpaDesktop = { remoteStart: () => window.__rStart(), remoteStop: () => window.__rStop(), remoteMeta: j => window.__rMeta(j), remoteLive: j => window.__rLive(j), onRemoteCommand: fn => { window.__remoteCmd = fn; } };
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'He Did It'; P.key = 'D'; P.bpm = 120; P.beat = 'none';
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'major', b: null, beats: 4, push: false }];
    P.lyrics.chorus = 'He did it for me\nHe did it for you';
    P.form = [{ s: 'Chorus' }, { s: 'Chorus' }]; P.structure = ['Chorus', 'Chorus'];
    g.go('song', { pid: P.id });
  });
  assert.equal(await page.locator('#remotecard .remoteurl').count(), 0, 'off until switched on');
  await page.click('[data-act=remoteon]');
  await page.waitForSelector('#remotecard .remoteurl');
  const url = (await page.textContent('#remotecard .remoteurl')).trim();
  assert.match(url, /^http:\/\/[\d.]+:\d+\/\?k=\d{6}$/);
  const local = url.replace(/\/\/[\d.]+:/, '//127.0.0.1:');

  const phone = await (await browser.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  const lost = [];
  await phone.goto(local);
  await phone.waitForFunction(() => document.getElementById('title').textContent === 'He Did It', null, { timeout: 8000 });
  assert.match(await phone.textContent('#chip'), /Ready/);
  assert.match(await phone.textContent('#chartbody'), /Chorus[\s\S]*D\s+A/, 'the whole song chart is on the phone');
  assert.match(await phone.textContent('#chartbody'), /He did it for me/);

  // Play from the phone
  await phone.click('#bplay');
  await page.waitForFunction(() => /Stop/.test(document.querySelector('#songplay').textContent), null, { timeout: 8000 });
  await phone.waitForFunction(() => /Playing/.test(document.getElementById('chip').textContent), null, { timeout: 8000 });
  await phone.waitForFunction(() => document.getElementById('now').textContent.length > 0 && document.getElementById('lines').textContent.includes('He did it'), null, { timeout: 8000 });
  const seen = new Set();
  for (let i = 0; i < 12; i++) { seen.add(await phone.textContent('#now')); await phone.waitForTimeout(350); }
  assert.ok(seen.has('D') || seen.has('A'), 'the phone shows the chord being played: ' + [...seen]);
  await phone.click('#bstop');
  await page.waitForFunction(() => /Play the song/.test(document.querySelector('#songplay').textContent), null, { timeout: 8000 });
  await phone.waitForFunction(() => /Ready/.test(document.getElementById('chip').textContent), null, { timeout: 8000 });

  // Record from the phone, stop from the phone
  await phone.click('#brec');
  await page.waitForFunction(() => document.querySelector('#guiderec').textContent.includes('Stop recording'), null, { timeout: 15000 });
  await phone.waitForFunction(() => /Recording/.test(document.getElementById('chip').textContent), null, { timeout: 8000 });
  await phone.waitForTimeout(1500);
  await phone.click('#bstop');
  await page.waitForFunction(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return P.guide && P.guide.takes && P.guide.takes.length === 1; }, null, { timeout: 40000 });

  // a wrong code gets nothing, and switching off closes the door
  assert.equal((await fetch(local.replace(/k=\d{6}/, 'k=111111'))).status, 403);
  await page.click('[data-act=ptab][data-t=record]');
  await page.click('[data-act=remoteoff]');
  await page.waitForSelector('[data-act=remoteon]');
  await phone.waitForSelector('#lost', { state: 'visible', timeout: 8000 });
  assert.deepEqual(errors, []);
});
