// The desktop app's save-to-disk bridge (preload.js saveOpen/saveWrite/saveClose -> main.js file:save-*), played
// by the test: pieces arrive here and are written to a real file, like the main process does. Installed after the
// page has loaded, so the rest of the app still runs as in a browser.
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = async function useDesktopSave(page, opts) {
  opts = opts || {};
  const dir = opts.dir || fs.mkdtempSync(path.join(os.tmpdir(), 'gma-save-'));
  const open = new Map(), saved = [], log = { pieces: 0, maxPiece: 0, cancelNext: !!opts.cancel };
  let seq = 0;
  await page.exposeFunction('__deskSaveOpen', name => {
    if (log.cancelNext) { log.cancelNext = false; return { ok: true, canceled: true }; }
    const id = ++seq, file = path.join(dir, String(name).replace(/[\\/:*?"<>|]+/g, '-'));
    open.set(id, { fd: fs.openSync(file + '.part', 'w'), file });
    return { ok: true, id, name: path.basename(file) };
  });
  await page.exposeFunction('__deskSaveWrite', (id, b64) => {
    const s = open.get(id); if (!s) return { ok: false };
    const b = Buffer.from(b64, 'base64'); fs.writeSync(s.fd, b); log.pieces++; log.maxPiece = Math.max(log.maxPiece, b.length);
    return { ok: true };
  });
  await page.exposeFunction('__deskSaveClose', (id, keep) => {
    const s = open.get(id); if (!s) return { ok: false }; open.delete(id); fs.closeSync(s.fd);
    if (!keep) { fs.unlinkSync(s.file + '.part'); return { ok: true, canceled: true }; }
    fs.renameSync(s.file + '.part', s.file); saved.push(s.file);
    return { ok: true, name: path.basename(s.file) };
  });
  const install = () => page.evaluate(() => {
    const toB64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); };
    window.gpaDesktop = { saveOpen: n => window.__deskSaveOpen(n), saveWrite: (id, u8) => window.__deskSaveWrite(id, toB64(u8)), saveClose: (id, k) => window.__deskSaveClose(id, !!k) };
  });
  return { dir, saved, log, install, cancelNext: () => { log.cancelNext = true; } };
};
/* the names in a ZIP, read from its own directory */
module.exports.zipNames = function zipNames(z) {
  let e = z.length - 22; while (e > 0 && z.readUInt32LE(e) !== 0x06054b50) e--;
  let o = z.readUInt32LE(e + 16); const count = z.readUInt16LE(e + 10), names = [];
  for (let k = 0; k < count; k++) {
    if (z.readUInt32LE(o) !== 0x02014b50) throw new Error('broken ZIP directory');
    const nl = z.readUInt16LE(o + 28), xl = z.readUInt16LE(o + 30), cl = z.readUInt16LE(o + 32), size = z.readUInt32LE(o + 20), at = z.readUInt32LE(o + 42), crc = z.readUInt32LE(o + 16);
    const name = z.toString('utf8', o + 46, o + 46 + nl);
    if (z.readUInt32LE(at) !== 0x04034b50) throw new Error('broken ZIP entry ' + name);
    names.push({ name, size, at: at + 30 + z.readUInt16LE(at + 26), crc });
    o += 46 + nl + xl + cl;
  }
  return names;
};
