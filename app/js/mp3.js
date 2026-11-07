'use strict';
/* ---------------------------------------------------------------- MP3 files (pure: no DOM)
   - encode: Float32 channels to MP3 with the LAME encoder (lamejs), with an ID3v2.3 tag for the song details
   - inspect: reads an MP3 back (ID3 tag, MPEG frames, bitrate, sample rate, duration), so the release build can
     prove that the real encoder works before an installer is made (scripts/check-mp3.js), and tests can check files */
const Mp3 = (() => {
  function id3(meta) {
    const frames = [];
    const text = (id, v) => { if (!v) return; const b = [1, 0xFF, 0xFE]; String(v).slice(0, 250).split('').forEach(ch => { const c = ch.charCodeAt(0); b.push(c & 255, c >> 8); }); frames.push({ id, b }); };
    text('TIT2', meta.title); text('TPE1', meta.artist); text('TCOP', meta.copyright); text('TYER', meta.year); text('TCON', meta.genre); text('TENC', 'Gospel Music Academy');
    if (meta.comment) { const b = [1, 101, 110, 103, 0xFF, 0xFE, 0, 0, 0xFF, 0xFE]; String(meta.comment).slice(0, 500).split('').forEach(ch => { const c = ch.charCodeAt(0); b.push(c & 255, c >> 8); }); frames.push({ id: 'COMM', b }); }
    const size = frames.reduce((a, f) => a + 10 + f.b.length, 0), out = new Uint8Array(10 + size);
    out.set([73, 68, 51, 3, 0, 0, (size >> 21) & 127, (size >> 14) & 127, (size >> 7) & 127, size & 127]);
    let o = 10; frames.forEach(f => { for (let i = 0; i < 4; i++) out[o + i] = f.id.charCodeAt(i); const n = f.b.length; out.set([(n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255, 0, 0], o + 4); out.set(f.b, o + 10); o += 10 + n; });
    return out;
  }
  /* lame: the lamejs object; channels: [Float32Array] (1 or 2); returns Uint8Array */
  function encode(lame, channels, sr, kbps, meta) {
    const ch = Math.min(2, channels.length), enc = new lame.Mp3Encoder(ch, sr, kbps || 192), parts = [], BL = 1152;
    const toI16 = d => { const r = new Int16Array(d.length); for (let i = 0; i < d.length; i++) { const v = Math.max(-1, Math.min(1, d[i])); r[i] = v < 0 ? v * 0x8000 : v * 0x7FFF; } return r; };
    const L = toI16(channels[0]), R = ch > 1 ? toI16(channels[1]) : null;
    for (let i = 0; i < L.length; i += BL) { const m = R ? enc.encodeBuffer(L.subarray(i, i + BL), R.subarray(i, i + BL)) : enc.encodeBuffer(L.subarray(i, i + BL)); if (m.length) parts.push(new Uint8Array(m.buffer, m.byteOffset, m.length)); }
    const end = enc.flush(); if (end.length) parts.push(new Uint8Array(end.buffer, end.byteOffset, end.length));
    const tag = meta ? id3(meta) : new Uint8Array(0), out = new Uint8Array(tag.length + parts.reduce((a, p) => a + p.length, 0));
    out.set(tag); let o = tag.length; parts.forEach(p => { out.set(p, o); o += p.length; });
    return out;
  }
  /* read an MP3: { id3: { TIT2… } , frames, seconds, sampleRate, bitrate (kbps, average), channels, ok } */
  const BR = { 1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], 2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160] };
  const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  function inspect(b) {
    const out = { id3: {}, frames: 0, seconds: 0, ok: false };
    let o = 0;
    if (b[0] === 73 && b[1] === 68 && b[2] === 51) {
      const size = (b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9]; let p = 10;
      while (p + 10 <= 10 + size) {
        const id = String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]), n = (b[p + 4] << 24) | (b[p + 5] << 16) | (b[p + 6] << 8) | b[p + 7]; if (!/^[A-Z0-9]{4}$/.test(id) || n <= 0) break;
        const body = b.subarray(p + 10, p + 10 + n);
        if (id[0] === 'T' && body[0] === 1) { let s = ''; for (let i = 3; i + 1 < body.length; i += 2) s += String.fromCharCode(body[i] | (body[i + 1] << 8)); out.id3[id] = s; }
        p += 10 + n;
      }
      o = 10 + size;
    }
    let kb = 0;
    while (o + 4 <= b.length) {
      if (b[o] !== 0xFF || (b[o + 1] & 0xE0) !== 0xE0) { o++; continue; }
      const ver = (b[o + 1] >> 3) & 3, layer = (b[o + 1] >> 1) & 3, bri = b[o + 2] >> 4, sri = (b[o + 2] >> 2) & 3, pad = (b[o + 2] >> 1) & 1, mode = b[o + 3] >> 6;
      if (ver === 1 || layer !== 1 || bri === 0 || bri === 15 || sri === 3) { o++; continue; }   // MPEG Layer III only
      const rate = BR[ver === 3 ? 1 : 2][bri] * 1000, sr = SR[ver][sri], spf = ver === 3 ? 1152 : 576, len = Math.floor((ver === 3 ? 144 : 72) * rate / sr) + pad;
      if (len < 24) { o++; continue; }
      out.frames++; out.seconds += spf / sr; out.sampleRate = sr; out.channels = mode === 3 ? 1 : 2; kb += rate / 1000;
      o += len;
    }
    out.bitrate = out.frames ? Math.round(kb / out.frames) : 0;
    out.ok = out.frames > 0;
    return out;
  }
  return { id3, encode, inspect };
})();
if (typeof module !== 'undefined') module.exports = Mp3;
