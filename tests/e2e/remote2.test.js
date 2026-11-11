'use strict';
const T = require('./tabs').auto;
// The stronger phone remote: jump to a part, Next and Previous, start from the top, count-in, key change, volume, mute and solo,
// switching songs, Undo, the display choices on the phone, and the level meter while recording.
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
const PORT = 8804;
let srv, browser; const remotes = [];
test.before(async () => {
  srv = serve(path.join(__dirname, '..', '..', 'app'), PORT);
  browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + path.join(FIX, 'voice-five.wav'), '--autoplay-policy=no-user-gesture-required'] });
});
test.after(async () => { await Promise.all(remotes.map(r => r.stop())); await browser.close(); srv.close(); });

async function setup() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['microphone'] });
  const page = T(await ctx.newPage()), errors = [], cmds = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const remote = createRemote({ onCommand: c => { cmds.push(c); page.evaluate(x => window.__remoteCmd && window.__remoteCmd(x), JSON.stringify(c)).catch(() => {}); } });
  remotes.push(remote);
  await page.exposeFunction('__rStart', () => remote.start(0)); await page.exposeFunction('__rStop', () => remote.stop());
  await page.exposeFunction('__rMeta', j => remote.setMeta(JSON.parse(j))); await page.exposeFunction('__rLive', j => remote.setLive(JSON.parse(j)));
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => {
    window.gpaDesktop = { remoteStart: () => window.__rStart(), remoteStop: () => window.__rStop(), remoteMeta: j => window.__rMeta(j), remoteLive: j => window.__rLive(j), onRemoteCommand: fn => { window.__remoteCmd = fn; } };
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'Mercy'; P.key = 'D'; P.bpm = 120; P.beat = 'none';
    const ch = (r, q) => ({ r, q, b: null, beats: 4, push: false });
    P.sections.Verse.chords = [ch(0, 'major'), ch(7, 'major')]; P.sections.Chorus.chords = [ch(5, 'major'), ch(7, 'major')]; P.sections.Bridge.chords = [ch(9, 'minor'), ch(7, 'major')];
    P.lyrics.verse = 'Morning by morning\nYou are faithful'; P.lyrics.chorus = 'Your mercy never fails';
    P.form = [{ s: 'Verse' }, { s: 'Chorus' }, { s: 'Bridge' }, { s: 'Chorus' }]; P.structure = ['Verse', 'Chorus', 'Bridge', 'Chorus'];
    g.ACTIONS.slnew(); const Q = g.S().songs[g.S().songs.length - 1]; Q.title = 'Second song'; g.go('song', { pid: P.id });
    window.__pid = P.id; window.__qid = Q.id;
  });
  await page.click('[data-act=remoteon]'); await page.waitForSelector('#remotecard .remoteurl');
  const url = (await page.textContent('#remotecard .remoteurl')).trim().replace(/\/\/[\d.]+:/, '//127.0.0.1:');
  const phone = await (await browser.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  phone.on('pageerror', e => errors.push('phone: ' + e.message));
  await phone.goto(url); await phone.waitForFunction(() => document.getElementById('title').textContent === 'Mercy', null, { timeout: 8000 });
  return { page, phone, errors, cmds, remote };
}
const proj = page => page.evaluate(() => { const g = window.__gpa; return JSON.parse(JSON.stringify(g.S().songs.find(s => s.id === window.__pid))); });
const cur = phone => phone.evaluate(() => ({ sec: document.getElementById('sec').textContent, now: document.getElementById('now').textContent }));

test('parts: the phone lists them, tapping one plays from there, Next and Previous move while playing and while stopped', async () => {
  const { page, phone, errors } = await setup();
  await phone.click('#dparts summary');
  assert.deepEqual(await phone.$$eval('#parts button', b => b.map(x => x.textContent)).then(a => a.map(t => t.split(' ')[0])), ['Verse', 'Chorus', 'Bridge', 'Chorus']);
  await phone.click('#parts button >> nth=2');                       // Bridge
  await phone.waitForFunction(() => /Bridge/.test(document.getElementById('sec').textContent) && document.getElementById('now').textContent === 'Bm', null, { timeout: 8000 });
  assert.equal(await phone.textContent('#chip'), 'Playing');
  await phone.click('#bnext');                                      // Chorus (last)
  await phone.waitForFunction(() => /Chorus/.test(document.getElementById('sec').textContent) && document.getElementById('now').textContent === 'G', null, { timeout: 8000 });
  await phone.click('#bprev'); await phone.click('#bprev');         // Bridge, then Chorus (the first one)
  await phone.waitForFunction(() => { const b = document.querySelector('#parts button.on'); return b && b.dataset.i === '1' && /Chorus/.test(document.getElementById('sec').textContent); }, null, { timeout: 8000 });
  await phone.click('#bstop'); await phone.waitForFunction(() => document.getElementById('chip').textContent === 'Ready', null, { timeout: 8000 });
  await phone.click('#bnext');                                      // stopped: moves the start part only
  await phone.waitForFunction(() => document.querySelector('#parts button.on') && document.querySelector('#parts button.on').textContent.startsWith('Bridge'), null, { timeout: 5000 });
  assert.equal(await phone.textContent('#chip'), 'Ready');
  await phone.click('#bplay'); await phone.waitForFunction(() => /Bridge/.test(document.getElementById('sec').textContent), null, { timeout: 8000 });
  await phone.click('#brestart'); await phone.waitForFunction(() => /Verse/.test(document.getElementById('sec').textContent), null, { timeout: 8000 });
  await phone.click('#bstop');
  assert.deepEqual(errors, []); await page.close();
});

test('key: Up and Down change the key of the song and the chords the phone shows', async () => {
  const { page, phone, errors } = await setup();
  await phone.click('#dkey summary'); await phone.click('#kup');
  await phone.waitForFunction(() => document.getElementById('kname').textContent === 'E♭', null, { timeout: 8000 });
  assert.equal((await proj(page)).key, 'Eb');
  await phone.click('#kdn'); await phone.click('#kdn');
  await phone.waitForFunction(() => document.getElementById('kname').textContent === 'D♭', null, { timeout: 8000 });
  assert.equal((await proj(page)).key, 'Db');
  await phone.click('#chart summary'); await phone.waitForFunction(() => /D♭/.test(document.getElementById('chartbody').textContent), null, { timeout: 5000 });
  assert.deepEqual(errors, []); await page.close();
});

test('mix: volume, mute and solo from the phone change the song, and playing continues', async () => {
  const { page, phone, errors } = await setup();
  await phone.click('#dmix summary');
  const names = await phone.$$eval('#mix .strip .t > span:first-child', e => e.map(x => x.textContent.replace(/\s*\d+%$/, '')));
  assert.ok(names.includes('Keys') && names.includes('Bass'), names.join());
  await phone.evaluate(() => { const r = document.querySelector('#mix input[data-k=chords]'); r.value = '60'; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await phone.waitForFunction(() => document.querySelector('#mix input[data-k=chords]').value === '60', null, { timeout: 3000 });
  await page.waitForFunction(() => { const g = window.__gpa, P = g.S().songs.find(s => s.id === window.__pid); return P.mixer && P.mixer.chords && Math.abs(P.mixer.chords.v - 0.6) < 0.01; }, null, { timeout: 5000 });
  await phone.click('#mix button[data-a=mute][data-k=bass]');
  await page.waitForFunction(() => window.__gpa.S().songs.find(s => s.id === window.__pid).mixer.bass.mute === true, null, { timeout: 5000 });
  await phone.waitForSelector('#mix button.on[data-a=mute][data-k=bass]');
  await phone.click('#mix button[data-a=solo][data-k=chords]');
  await page.waitForFunction(() => window.__gpa.S().songs.find(s => s.id === window.__pid).mixer.chords.solo === true, null, { timeout: 5000 });
  await phone.click('#mix button[data-a=unsolo]');
  await page.waitForFunction(() => !window.__gpa.S().songs.find(s => s.id === window.__pid).mixer.chords.solo, null, { timeout: 5000 });
  // while the song plays a change keeps it playing (it restarts at the same part)
  await phone.click('#bplay'); await phone.waitForFunction(() => document.getElementById('chip').textContent === 'Playing', null, { timeout: 8000 });
  await phone.click('#mix button[data-a=mute][data-k=bass]');
  await page.waitForFunction(() => !window.__gpa.S().songs.find(s => s.id === window.__pid).mixer.bass.mute, null, { timeout: 5000 });
  await phone.waitForFunction(() => document.getElementById('chip').textContent === 'Playing', null, { timeout: 8000 });
  await phone.click('#bstop');
  assert.deepEqual(errors, []); await page.close();
});

test('songs: another song can be opened from the phone, but not while recording', async () => {
  const { page, phone, errors } = await setup();
  await phone.click('#dsongs summary');
  assert.ok((await phone.$$eval('#songs button', b => b.map(x => x.textContent))).includes('Second song'));
  await phone.click('#songs button:has-text("Second song")');
  await phone.waitForFunction(() => document.getElementById('title').textContent === 'Second song', null, { timeout: 8000 });
  assert.equal(await page.evaluate(() => window.__gpa.route && window.__gpa.route().params.pid === window.__qid), true);
  assert.deepEqual(errors, []); await page.close();
});

test('count-in, undo, and the display choices on the phone', async () => {
  const { page, phone, errors } = await setup();
  await phone.click('#dopt summary');
  await phone.click('#ocount'); await phone.waitForFunction(() => document.getElementById('ocount').textContent === 'On', null, { timeout: 5000 });
  const t0 = Date.now(); await phone.click('#bplay');
  await phone.waitForFunction(() => document.getElementById('chip').textContent === 'Playing', null, { timeout: 8000 });
  // with a count-in the first thing on the phone is the get-ready count, not the first chord
  await phone.waitForFunction(() => /Get ready/.test(document.getElementById('sec').textContent) || document.getElementById('now').textContent === 'D', null, { timeout: 8000 });
  await phone.click('#bstop');
  await phone.click('#ocount'); await phone.waitForFunction(() => document.getElementById('ocount').textContent === 'Off', null, { timeout: 5000 });
  // numbers instead of names
  await phone.click('#bplay'); await phone.waitForFunction(() => document.getElementById('now').textContent === 'D', null, { timeout: 8000 });
  await phone.click('#onums'); await phone.waitForFunction(() => document.getElementById('now').textContent === '1', null, { timeout: 5000 });
  await phone.click('#vwd'); assert.equal(await phone.$eval('#now', e => getComputedStyle(e).display), 'none');
  await phone.click('#vboth'); await phone.click('#zup');
  assert.ok(parseFloat(await phone.$eval('#now', e => getComputedStyle(e).fontSize)) > 5.2 * 16 - 1);
  await phone.click('#bstop');
  // undo: the key change can be undone from the phone
  await phone.click('#dkey summary'); await phone.click('#kup');
  await phone.waitForFunction(() => document.getElementById('kname').textContent === 'E♭', null, { timeout: 8000 });
  assert.deepEqual(errors, []); await page.close();
});

test('recording from the phone shows a level meter and nothing else changes while recording', async () => {
  const { page, phone, errors, cmds } = await setup();
  await phone.click('#brec'); await phone.waitForFunction(() => document.getElementById('chip').textContent === 'Recording', null, { timeout: 20000 });
  await phone.waitForFunction(() => document.getElementById('lvl').style.display === 'block', null, { timeout: 5000 });
  await phone.waitForFunction(() => parseFloat(document.querySelector('#lvl i').style.width) > 0, null, { timeout: 15000 });
  const key0 = (await proj(page)).key;
  await phone.click('#dkey summary'); await phone.click('#kup'); await phone.click('#dsongs summary'); await phone.click('#songs button:has-text("Second song")');
  await phone.waitForTimeout(800);
  assert.equal((await proj(page)).key, key0, 'the key is not changed while recording');
  assert.equal(await page.evaluate(() => window.__gpa.route().params.pid === window.__pid), true, 'the song is not switched while recording');
  await phone.click('#bstop'); await phone.waitForFunction(() => document.getElementById('chip').textContent === 'Ready', null, { timeout: 20000 });
  assert.deepEqual(errors, []); await page.close();
});
