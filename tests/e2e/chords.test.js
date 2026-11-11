const T = require('./tabs').auto;
// Chord editing: replace the chosen chord (starts fresh, keeps place and length), add before or after, change the root,
// any chord outside the key, and drag and drop with the mouse and by touch (hold, then drag).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { chromium } = require('playwright');
const serve = require('./serve');
const PORT = 8803;
let srv, browser;
test.before(async () => { srv = serve(path.join(__dirname, '..', '..', 'app'), PORT); browser = await chromium.launch(); });
test.after(async () => { await browser.close(); srv.close(); });

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 2600 } });
  const page = T(await ctx.newPage()), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => {
    const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew();
    const P = g.S().songs[g.S().songs.length - 1]; P.title = 'Chords'; P.key = 'C'; P.bpm = 100; P.beat = 'none';
    P.sections.Chorus.chords = [{ r: 0, q: 'major', b: null, beats: 4, push: false }, { r: 7, q: 'dom7', b: null, beats: 2, push: true }, { r: 9, q: 'minor', b: null, beats: 4, push: false }, { r: 5, q: 'major', b: null, beats: 4, push: false }];
    g.go('song', { pid: P.id });
  });
  return { page, errors };
}
const chords = page => page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; return P.sections.Chorus.chords.map(c => [c.r, c.q, c.b, c.beats, c.push].join('|')); });
const names = page => page.$$eval('.cstrip .cchord b', els => els.map(e => e.textContent));
const chip = (page, text) => page.locator('.ptab.on .chip-btn[data-act="pcadd"]').filter({ has: page.locator('b', { hasText: new RegExp('^' + text + '$') }) }).first();

test('replace: the chosen chord is swapped for a plain chord and keeps its length', async () => {
  const { page, errors } = await open();
  await page.click('.cchord >> nth=1');
  await page.click('[data-act=pcmode][data-m=replace]');
  await chip(page, 'Am').click();
  const c = await chords(page);
  assert.equal(c.length, 4);
  assert.equal(c[1], '9|minor||2|false', 'fresh chord, same 2 beats, no push');
  assert.deepEqual(errors, []); await page.close();
});

test('add before and add after, and the new chord becomes the chosen one', async () => {
  const { page, errors } = await open();
  await page.click('.cchord >> nth=2');
  await page.click('[data-act=pcmode][data-m=before]');
  await chip(page, 'Dm').click();
  let c = await chords(page); assert.equal(c.length, 5); assert.equal(c[2].split('|')[0], '2'); assert.equal(c[3].split('|')[0], '9');
  await page.click('[data-act=pcmode][data-m=after]');
  await chip(page, 'Em').click();
  c = await chords(page); assert.equal(c.length, 6); assert.equal(c[3].split('|')[0], '4');
  assert.deepEqual(errors, []); await page.close();
});

test('first chord: adding before it keeps no push on the new first chord', async () => {
  const { page } = await open();
  await page.click('.cchord >> nth=0'); await page.click('[data-act=pcmode][data-m=before]'); await chip(page, 'F').click();
  const c = await chords(page); assert.equal(c[0].split('|')[4], 'false'); assert.equal(c.length, 5); await page.close();
});

test('change the root of a chord (C to A) and keep its type', async () => {
  const { page } = await open();
  await page.click('.cchord >> nth=0');
  await page.selectOption('[data-bind=pcr]', '9');
  const c = await chords(page); assert.equal(c[0], '9|major||4|false'); assert.deepEqual((await names(page))[0], 'A'); await page.close();
});

test('any chord outside the key: F sharp half-diminished, replacing a chord', async () => {
  const { page, errors } = await open();
  await page.click('.cchord >> nth=2'); await page.click('[data-act=pcmode][data-m=replace]');
  await page.click('#anycard summary');
  await page.selectOption('[data-bind=panyr]', '6');
  const q = await page.$$eval('[data-bind=panyq] option', os => os.map(o => o.value).filter(v => /m7b5|hdim|half/i.test(v)));
  assert.ok(q.length, 'a half-diminished type exists: ' + q);
  await page.selectOption('[data-bind=panyq]', q[0]);
  assert.match(await page.textContent('#anyname'), /F#|F♯|G♭|Gb/);
  await page.click('[data-act=panyuse]');
  const c = await chords(page); assert.equal(c.length, 4); assert.equal(c[2].split('|')[0], '6'); assert.equal(c[2].split('|')[1], q[0]);
  assert.equal(await page.locator('#anycard').getAttribute('open') !== null, true, 'the picker stays open');
  assert.deepEqual(errors, []); await page.close();
});

test('mouse drag: a chip dropped on the left edge of a chord goes before it, in the middle replaces it', async () => {
  const { page, errors } = await open();
  const drag = async (from, to, fx) => { const a = await from.boundingBox(), b = await to.boundingBox(); await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down(); await page.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 + 20, { steps: 3 }); await page.mouse.move(b.x + b.width * fx, b.y + b.height / 2, { steps: 6 }); await page.mouse.up(); };
  await drag(chip(page, 'Em'), page.locator('.cchord').nth(3), 0.1);
  let c = await chords(page); assert.equal(c.length, 5); assert.equal(c[3].split('|')[0], '4'); assert.equal(c[4].split('|')[0], '5');
  await drag(chip(page, 'Dm'), page.locator('.cchord').nth(0), 0.5);
  c = await chords(page); assert.equal(c.length, 5); assert.equal(c[0].split('|')[0], '2'); assert.equal(c[0].split('|')[3], '4');
  assert.deepEqual(errors, []); await page.close();
});

test('mouse drag: reorder chords in the strip (after, and swap)', async () => {
  const { page } = await open();
  const drag = async (i, j, fx) => { const a = await page.locator('.cchord').nth(i).boundingBox(), b = await page.locator('.cchord').nth(j).boundingBox(); await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down(); await page.mouse.move(a.x + a.width / 2 + 15, a.y + a.height / 2 + 15, { steps: 3 }); await page.mouse.move(b.x + b.width * fx, b.y + b.height / 2, { steps: 6 }); await page.mouse.up(); };
  await drag(0, 2, 0.9);   // C after Am
  assert.deepEqual((await chords(page)).map(x => x.split('|')[0]), ['7', '9', '0', '5']);
  await drag(0, 3, 0.5);   // swap G and F
  assert.deepEqual((await chords(page)).map(x => x.split('|')[0]), ['5', '9', '0', '7']);
  assert.equal((await chords(page))[0].split('|')[4], 'false', 'no push on the first chord'); await page.close();
});

test('a plain tap on a chip still works after dragging was added', async () => {
  const { page } = await open();
  await chip(page, 'Em').click();
  const c = await chords(page); assert.equal(c.length, 5); assert.equal(c[4].split('|')[0], '4'); await page.close();
});

test('touch drag: hold, then drag a chip onto a chord; moving early scrolls instead', async () => {
  const { page, errors } = await open();
  const fire = (sel, type, x, y) => page.evaluate(([s, t, x, y]) => { const el = s === 'doc' ? document.elementFromPoint(x, y) : document.querySelector(s); (el || document).dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, button: 0, isPrimary: true })); }, [sel, type, x, y]);
  const chipEl = chip(page, 'Em'); await chipEl.evaluate(e => e.setAttribute('data-t', 'src'));
  const a = await chipEl.boundingBox(), b = await page.locator('.cchord').nth(1).boundingBox();
  // moves before the hold time: no drag, nothing added
  await fire('[data-t=src]', 'pointerdown', a.x + 10, a.y + 10); await fire('doc', 'pointermove', a.x + 40, a.y + 40); await fire('doc', 'pointerup', b.x + 5, b.y + 10);
  assert.equal((await chords(page)).length, 4);
  // hold, then drag onto the left of chord 2
  await fire('[data-t=src]', 'pointerdown', a.x + 10, a.y + 10); await page.waitForTimeout(400);
  await fire('doc', 'pointermove', b.x + 8, b.y + 10); assert.equal(await page.locator('.dndghost').count(), 1);
  await fire('doc', 'pointerup', b.x + 8, b.y + 10);
  const c = await chords(page); assert.equal(c.length, 5); assert.equal(c[1].split('|')[0], '4');
  assert.equal(await page.locator('.dndghost').count(), 0);
  assert.deepEqual(errors, []); await page.close();
});

test('the section is limited and a replace still works when it is full', async () => {
  const { page } = await open();
  await page.evaluate(() => { const g = window.__gpa, P = g.S().songs[g.S().songs.length - 1]; const s = P.sections.Chorus; while (s.chords.length < 24) s.chords.push({ r: 0, q: 'major', b: null, beats: 1, push: false }); g.go('song', { pid: P.id }); });
  const before = (await chords(page)).length;
  await page.click('.cchord >> nth=0'); await page.click('[data-act=pcmode][data-m=replace]'); await chip(page, 'Am').click();
  assert.equal((await chords(page)).length, before);
  await page.click('[data-act=pcmode][data-m=after]'); await chip(page, 'Dm').click();
  assert.ok((await chords(page)).length <= 32); await page.close();
});

test('dragging near the edge of the screen scrolls the page', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  const page = T(await ctx.newPage());
  await page.goto('http://localhost:' + PORT + '/');
  await page.evaluate(() => { const g = window.__gpa; g.S().profile.onboarded = true; g.go('song'); g.ACTIONS.slnew(); const P = g.S().songs[g.S().songs.length - 1]; g.go('song', { pid: P.id }); });
  const c = page.locator('.ptab.on .chip-btn[data-act="pcadd"]').first(); await c.scrollIntoViewIfNeeded();
  const a = await c.boundingBox(); const y0 = await page.evaluate(() => scrollY);
  await page.mouse.move(a.x + 30, a.y + 20); await page.mouse.down(); await page.mouse.move(a.x + 60, a.y - 10, { steps: 4 }); await page.mouse.move(a.x + 60, 15, { steps: 6 });
  await page.waitForTimeout(500); const y1 = await page.evaluate(() => scrollY); await page.mouse.up();
  assert.ok(y1 < y0 - 40, 'scrolled up while dragging: ' + y0 + ' to ' + y1); await ctx.close();
});
