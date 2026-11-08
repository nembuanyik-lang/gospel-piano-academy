'use strict';
const T = require('./tabs').auto;
// Learn from a recording: choose an audio file, the chords are found, play it slowly, repeat a part, fix a chord, and it is remembered.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { chromium } = require('playwright');
const serve = require('./serve');

const PORT = 8800;
let srv, browser, wav;
function makeWav() {
  const sr = 22050, note = m => 440 * Math.pow(2, (m - 69) / 12);
  const prog = [[50, 54, 57], [55, 59, 62], [57, 61, 64], [50, 54, 57], [53, 57, 60], [55, 59, 62], [57, 61, 64], [50, 54, 57]];   // D G A D F G A D
  const per = Math.floor(2.5 * sr), x = new Int16Array(per * prog.length);
  prog.forEach((ms, c) => ms.forEach(m => { for (let h = 1; h <= 4; h++) for (let i = 0; i < per; i++) x[c * per + i] += Math.round(Math.sin(2 * Math.PI * note(m) * h * i / sr) / h * 3000 / ms.length * 3); }));
  const buf = Buffer.alloc(44 + x.length * 2); buf.write('RIFF', 0); buf.writeUInt32LE(36 + x.length * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(x.length * 2, 40);
  Buffer.from(x.buffer).copy(buf, 44); return buf;
}
test.before(async () => {
  srv = serve(path.join(__dirname, '..', '..', 'app'), PORT);
  browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  wav = path.join(os.tmpdir(), 'learn-test-song.wav'); fs.writeFileSync(wav, makeWav());
});
test.after(async () => { await browser.close(); srv.close(); });

test('the chords of a recording are found, it can be played slowly and repeated, chords can be moved to another key and fixed, and they are remembered', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = T(await ctx.newPage()), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => { window.__gpa.S().profile.onboarded = true; window.__gpa.go('song'); });
  await page.click('[data-act=go][data-to=learn]');
  await page.waitForSelector('#learnfile');
  await page.setInputFiles('#learnfile', wav);
  await page.waitForSelector('.learnrow', { timeout: 30000 });
  const names = () => page.$$eval('.learnrow b', es => es.map(e => e.textContent));
  assert.deepEqual(await names(), ['D', 'G', 'A', 'D', 'F', 'G', 'A', 'D']);
  assert.match(await page.textContent('.learnplayer h3'), /Looks like D/);

  // play it at half speed; the chord on screen follows
  await page.click('[data-act=learnspeed][data-v="50"]');
  assert.equal(await page.evaluate(() => learnMem.audio.playbackRate), 0.5);
  assert.equal(await page.evaluate(() => learnMem.audio.preservesPitch), true, 'slower, but the same pitch');
  await page.click('#learnplay');
  await page.waitForFunction(() => !learnMem.audio.paused && learnMem.audio.currentTime > 0.5, null, { timeout: 8000 });
  assert.equal(await page.textContent('#lnow'), 'D');
  assert.match(await page.textContent('#lnext'), /Next: G/);
  // jump to the third chord by tapping it: the screen shows A
  await page.click('#lseg2');
  await page.waitForFunction(() => document.querySelector('#lnow').textContent === 'A', null, { timeout: 8000 });
  // repeat a part
  await page.evaluate(() => { learnMem.audio.currentTime = 5.1; }); await page.click('[data-act=learnA]');
  await page.evaluate(() => { learnMem.audio.currentTime = 7.6; }); await page.click('[data-act=learnB]');
  assert.match(await page.textContent('#learnloop'), /Repeating 0:05 to 0:08/);
  await page.evaluate(() => { learnMem.audio.currentTime = 7.58; learnMem.audio.play(); });
  await page.waitForFunction(() => learnMem.audio.currentTime < 7.5 && learnMem.audio.currentTime > 4.9, null, { timeout: 8000 });
  await page.click('[data-act=learnclear]');
  await page.click('#learnplay');   // pause

  // show the chords two steps higher
  await page.selectOption('[data-bind=learnup]', '2');
  assert.deepEqual(await names(), ['E', 'A', 'B', 'E', 'G', 'A', 'B', 'E']);
  await page.selectOption('[data-bind=learnup]', '0');

  // fix the F: it is really an Fm
  await page.click('#lseg4');
  await page.selectOption('[data-bind=learnq]', 'm');
  assert.equal((await names())[4], 'Fm');
  const saved = await page.evaluate(() => JSON.parse(JSON.stringify(window.__gpa.S().learn)));
  assert.equal(saved.length, 1); assert.equal(saved[0].segs.length, 8); assert.equal(saved[0].segs[4][3], 'm');
  // the first and last chords stay as they were
  assert.deepEqual(await names(), ['D', 'G', 'A', 'D', 'Fm', 'G', 'A', 'D']);

  // leave, come back, choose the same file: the fixed chords are back (not found again)
  await page.click('[data-act=go][data-to=song]');
  await page.waitForFunction(() => learnMem.audio === null && learnMem.url === null, null, { timeout: 5000 });   // leaving lets go of the file
  await page.click('[data-act=go][data-to=learn]');
  await page.waitForSelector('.learnrow');
  assert.match(await page.textContent('.learnplayer'), /choose the same file again/i);   // the chords are still there, only the sound needs the file
  await page.setInputFiles('#learnfile', wav);
  await page.waitForFunction(() => document.querySelector('#learnplay'), null, { timeout: 30000 });
  assert.deepEqual(await names(), ['D', 'G', 'A', 'D', 'Fm', 'G', 'A', 'D'], 'your fix is kept');

  // a file that is not audio is refused politely
  fs.writeFileSync(path.join(os.tmpdir(), 'not-audio.mp3'), 'this is not music');
  await page.setInputFiles('#learnfile', path.join(os.tmpdir(), 'not-audio.mp3'));
  await page.waitForFunction(() => /could not be read/.test(document.body.textContent), null, { timeout: 15000 });
  assert.equal(errors.filter(e => !/decode|EncodingError|audio data/i.test(e)).length, 0, errors.join('\n'));
});
