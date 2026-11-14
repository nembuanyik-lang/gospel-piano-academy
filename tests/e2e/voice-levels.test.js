const T = require('./tabs').auto;
// Vocal Studio levels: the starting test, levels and checkpoints, sign-off, Songbook singing, the new exercise types.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const serve = require('./serve');
const FIX = path.join(__dirname, '..', 'fixtures');
if (!fs.existsSync(path.join(FIX, 'voice-five.wav'))) execFileSync('python3', [path.join(FIX, 'make-voice.py'), FIX]);

async function withPage(file, port, fn) {
  const srv = serve(path.join(__dirname, '..', '..', 'app'), port);
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + path.join(FIX, file), '--autoplay-policy=no-user-gesture-required'] });
  try {
    const p = T(await (await b.newContext({ permissions: ['microphone'] })).newPage());
    const errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.goto('http://localhost:' + port + '/');
    await p.evaluate(() => { const g = window.__gpa; g.S().profile.onboarded = true; g.S().voice = { range: { lo: 48, hi: 64, at: '2026-11-07' } }; });
    const r = await fn(p);
    return { r, errors };
  } finally { await b.close(); srv.close(); }
}
const text = p => p.evaluate(() => document.querySelector('.screen').textContent);

test('levels: the tab shows the starting test, locked levels, and opens a level when it is passed and recorded', async () => {
  const { r, errors } = await withPage('voice-a3.wav', 8811, async p => {
    const out = {};
    await p.evaluate(() => window.__gpa.go('voice', { tab: 'levels' })); await p.waitForTimeout(200);
    out.first = await text(p);
    out.btns = await p.evaluate(() => [...document.querySelectorAll('[data-act="vxgo"]')].map(b => b.dataset.test || b.dataset.run || '').filter(Boolean));
    await p.evaluate(() => { const v = window.__gpa.S().voice; v.start = 1; v.sustain = 5; v.best = { match: 75 }; });
    await p.evaluate(() => window.__gpa.go('voice', { tab: 'levels', _: 1 })); await p.waitForTimeout(200);
    out.passed = await text(p);
    out.checkBtn = await p.evaluate(() => !!document.querySelector('[data-check="1"]'));
    await p.evaluate(() => window.__gpa.go('voice', { tab: 'levels', check: 1 })); await p.waitForTimeout(200);
    out.check = await text(p); out.rec = await p.evaluate(() => !!document.querySelector('#vxrec .recbox'));
    out.noSign = !/Teacher sign-off/.test(out.check);
    await p.evaluate(() => { window.__gpa.S().voice.check = { L1: { at: '2026-11-08' } }; window.__gpa.go('voice', { tab: 'levels', check: 1, _: 2 }); }); await p.waitForTimeout(200);
    out.sign = await text(p);
    await p.fill('#so-by', 'Pastor Ndi'); await p.fill('#so-note', 'Lovely tone.');
    await p.click('[data-act="vxsignoff"]'); await p.waitForTimeout(300);
    out.signed = await text(p);
    out.stored = await p.evaluate(() => window.__gpa.S().signoffs['vx-L1'] && window.__gpa.S().signoffs['vx-L1'].by);
    await p.evaluate(() => window.__gpa.go('voice', { tab: 'levels', _: 3 })); await p.waitForTimeout(200);
    out.after = await text(p);
    return out;
  });
  assert.match(r.first, /Starting test/); assert.ok(r.btns.includes('1'), 'test button');
  assert.match(r.first, /Locked/);
  assert.match(r.passed, /Record the checkpoint/); assert.ok(r.checkBtn);
  assert.ok(r.rec, 'the recorder is on the checkpoint page'); assert.ok(r.noSign, 'no sign-off before recording');
  assert.match(r.sign, /Teacher sign-off/);
  assert.match(r.signed, /Signed off by Pastor Ndi/); assert.equal(r.stored, 'Pastor Ndi');
  assert.match(r.after, /Done/); assert.doesNotMatch(r.after, /Locked: finish level 1/);
  assert.deepEqual(errors, []);
});

test('songs and lessons: every Songbook piece is listed in a fitting key, and the lesson examples play', async () => {
  const { r, errors } = await withPage('voice-a3.wav', 8812, async p => {
    await p.evaluate(() => window.__gpa.go('voice', { tab: 'sing' })); await p.waitForTimeout(200);
    const out = { songs: await p.evaluate(() => document.querySelectorAll('[data-song]').length), txt: await text(p) };
    await p.evaluate(() => window.__gpa.go('voice', { tab: 'learn' })); await p.waitForTimeout(200);
    out.hear = await p.evaluate(() => document.querySelectorAll('[data-act="vxhear"]').length);
    out.lessons = await p.evaluate(() => document.querySelectorAll('.screen section.card h3').length);
    for (let i = 0; i < 4; i++) { await p.evaluate(k => document.querySelectorAll('[data-act="vxhear"]')[k].click(), i); await p.waitForTimeout(150); }
    out.checkNames = await p.evaluate(() => VocalGrade.VLEVELS.length);
    return out;
  });
  assert.ok(r.songs >= 12, 'songs listed: ' + r.songs); assert.match(r.txt, /Sung in/);
  assert.ok(r.hear >= 10, 'examples: ' + r.hear); assert.ok(r.lessons >= 10);
  assert.equal(r.checkNames, 6);
  assert.deepEqual(errors, []);
});

for (const [id, opts, port, wait] of [['cresc', {}, 8813, 8000], ['phrase', { count: 1 }, 8814, 40000], ['harm3m', { count: 1 }, 8815, 6000], ['harm3l', { count: 1 }, 8816, 6000]]) {
  test('exercise ' + id + ': starts, shows its notes, and can be skipped to the end without errors', async () => {
    const { r, errors } = await withPage('voice-five.wav', port, p => p.evaluate(([id, opts, wait]) => new Promise(res => {
      const host = document.createElement('div'); document.body.appendChild(host);
      let sum = null;
      const run = runVoiceEx(host, vexById(id), Object.assign({ skipIntro: true, onDone: s => { sum = s; } }, opts));
      const t0 = Date.now(), tick = setInterval(() => {
        if (sum) { clearInterval(tick); run.stop(); res({ sum, text: host.textContent }); return; }
        if (Date.now() - t0 > wait) { const sk = host.querySelector('#vxskip'); if (sk) sk.click(); }
        if (Date.now() - t0 > 90000) { clearInterval(tick); run.stop(); res({ timeout: true, text: host.textContent }); }
      }, 700);
    }), [id, opts, wait]));
    assert.ok(!r.timeout, 'finished: ' + r.text.slice(0, 300));
    assert.equal(r.sum.ex, id); assert.ok(r.sum.n >= 1);
    assert.deepEqual(errors, []);
  });
}

test('singing a Songbook piece: the song is counted in, graded against the clock, and saved with its mark', async () => {
  const { r, errors } = await withPage('voice-five.wav', 8817, async p => {
    await p.evaluate(() => window.__gpa.go('voice', { tab: 'sing', song: 'sb-morning' }));
    await p.waitForFunction(() => document.querySelector('.vx-sum') || /Level|Wait/.test(document.body.textContent), null, { timeout: 5000 }).catch(() => {});
    // the runner starts at once (the directions come first): press Start if present
    const start = await p.$('.vx-intro button'); if (start) await start.click();
    await p.waitForSelector('.vx-sum', { timeout: 120000 });
    return { txt: await p.textContent('.vx-sum'), saved: await p.evaluate(() => ({ s: window.__gpa.S().voice.songs, ses: window.__gpa.S().voice.sessions.slice(-1)[0] })) };
  });
  assert.match(r.txt, /\/ 100/); assert.ok(r.saved.s && typeof r.saved.s['sb-morning'] === 'number', JSON.stringify(r.saved));
  assert.equal(r.saved.ses.ex, 'song');
  assert.deepEqual(errors, []);
});

test('starting test: the first step runs its directions then listens, and leaving it stops the microphone', async () => {
  const { r, errors } = await withPage('voice-five.wav', 8818, async p => {
    await p.evaluate(() => window.__gpa.go('voice', { tab: 'levels', test: 1 })); await p.waitForTimeout(300);
    const intro = await p.textContent('.vx-intro');
    await p.click('.vx-intro button');
    await p.waitForFunction(() => /Listen|Quiet|Your turn|Wait/.test((document.querySelector('#vxphase') || {}).textContent || ''), null, { timeout: 10000 });
    const phase = await p.textContent('#vxphase');
    await p.evaluate(() => window.__gpa.go('voice', { tab: 'levels', _: 5 })); await p.waitForTimeout(300);
    return { intro, phase, left: await p.evaluate(() => !document.querySelector('#vxphase')) };
  });
  assert.match(r.intro, /Match the note/); assert.ok(r.phase.length); assert.ok(r.left);
  assert.deepEqual(errors, []);
});
