// Builds small SoundFont 2 files for the tests: a looped 440 Hz tone (root key 69), a split instrument,
// global zones, a preset that adds attenuation, and a drum kit whose open hi-hat is cut by the closed one.
const fs = require('fs');
function chunk(id, data) { const h = Buffer.alloc(8); h.write(id, 0, 'ascii'); h.writeUInt32LE(data.length, 4); return Buffer.concat([h, data, data.length & 1 ? Buffer.alloc(1) : Buffer.alloc(0)]); }
function list(type, parts) { return chunk('LIST', Buffer.concat([Buffer.from(type, 'ascii'), ...parts])); }
const name20 = s => { const b = Buffer.alloc(20); b.write(s, 0, 'ascii'); return b; };
function build() {
  const sr = 22050, n = sr, tone = new Int16Array(n), noise = new Int16Array(4000);
  for (let i = 0; i < n; i++) tone[i] = Math.round(12000 * Math.sin(2 * Math.PI * 440 * i / sr));
  let seed = 3; for (let i = 0; i < noise.length; i++) { seed = (seed * 16807) % 2147483647; noise[i] = Math.round((seed / 2147483647 - 0.5) * 20000 * Math.exp(-i / 900)); }
  const pad = new Int16Array(46);
  const smpl = Buffer.concat([Buffer.from(tone.buffer), Buffer.from(pad.buffer), Buffer.from(noise.buffer), Buffer.from(pad.buffer)]);
  const toneStart = 0, toneEnd = n, noiseStart = n + 46, noiseEnd = noiseStart + noise.length;
  const loopLen = Math.round(sr / 440 * 100);   // 100 whole cycles (about 5011 samples)
  const shdr = [];
  const sh = (nm, s, e, ls, le, rate, root, corr, type) => { const b = Buffer.alloc(46); name20(nm).copy(b, 0); b.writeUInt32LE(s, 20); b.writeUInt32LE(e, 24); b.writeUInt32LE(ls, 28); b.writeUInt32LE(le, 32); b.writeUInt32LE(rate, 36); b.writeUInt8(root, 40); b.writeInt8(corr, 41); b.writeUInt16LE(0, 42); b.writeUInt16LE(type, 44); shdr.push(b); };
  sh('Tone', toneStart, toneEnd, 2000, 2000 + loopLen, sr, 69, 0, 1);
  sh('Noise', noiseStart, noiseEnd, noiseStart, noiseStart, sr, 60, 0, 1);
  sh('EOS', 0, 0, 0, 0, 0, 0, 0, 0);
  const gen = (op, amt) => { const b = Buffer.alloc(4); b.writeUInt16LE(op, 0); b.writeInt16LE(amt, 2); return b; };
  const rng = (op, lo, hi) => { const b = Buffer.alloc(4); b.writeUInt16LE(op, 0); b.writeUInt8(lo, 2); b.writeUInt8(hi, 3); return b; };
  // instruments: zones are lists of generators
  const insts = [
    ['Sine', [[gen(38, -1200)], [gen(54, 1), gen(53, 0)]]],                                       // global release 0.5 s; looped tone
    ['Split', [[rng(43, 0, 59), gen(51, 12), gen(53, 0)], [rng(43, 60, 127), gen(53, 0), gen(17, 250)]]], // low half sounds an octave up; high half panned right
    ['Kit', [[rng(43, 42, 42), gen(57, 1), gen(53, 1)], [rng(43, 46, 46), gen(57, 1), gen(53, 1)], [rng(43, 36, 36), gen(53, 1)]]]
  ];
  const ibag = [], igen = [], inst = [];
  insts.forEach(([nm, zones]) => { const b = Buffer.alloc(22); name20(nm).copy(b, 0); b.writeUInt16LE(ibag.length, 20); inst.push(b); zones.forEach(z => { const bb = Buffer.alloc(4); bb.writeUInt16LE(igen.length, 0); ibag.push(bb); z.forEach(g => igen.push(g)); }); });
  { const b = Buffer.alloc(22); name20('EOI').copy(b, 0); b.writeUInt16LE(ibag.length, 20); inst.push(b); const bb = Buffer.alloc(4); bb.writeUInt16LE(igen.length, 0); ibag.push(bb); igen.push(gen(0, 0)); }
  const presets = [
    ['Sine', 0, 0, [[gen(48, 100)], [gen(41, 0)]]],       // global preset zone adds 10 dB attenuation (100 cB, scaled by 0.4)
    ['Organ', 19, 0, [[gen(41, 1)]]],
    ['Drums', 0, 128, [[gen(41, 2)]]]
  ];
  const pbag = [], pgen = [], phdr = [];
  presets.forEach(([nm, prog, bank, zones]) => { const b = Buffer.alloc(38); name20(nm).copy(b, 0); b.writeUInt16LE(prog, 20); b.writeUInt16LE(bank, 22); b.writeUInt16LE(pbag.length, 24); phdr.push(b); zones.forEach(z => { const bb = Buffer.alloc(4); bb.writeUInt16LE(pgen.length, 0); pbag.push(bb); z.forEach(g => pgen.push(g)); }); });
  { const b = Buffer.alloc(38); name20('EOP').copy(b, 0); b.writeUInt16LE(pbag.length, 24); phdr.push(b); const bb = Buffer.alloc(4); bb.writeUInt16LE(pgen.length, 0); pbag.push(bb); pgen.push(gen(0, 0)); }
  const mods = n => Buffer.alloc(10 * n);
  const info = list('INFO', [chunk('ifil', Buffer.from([2, 0, 1, 0])), chunk('INAM', Buffer.from('Test bank\0', 'ascii'))]);
  const sdta = list('sdta', [chunk('smpl', smpl)]);
  const pdta = list('pdta', [chunk('phdr', Buffer.concat(phdr)), chunk('pbag', Buffer.concat(pbag)), chunk('pmod', mods(1)), chunk('pgen', Buffer.concat(pgen)),
    chunk('inst', Buffer.concat(inst)), chunk('ibag', Buffer.concat(ibag)), chunk('imod', mods(1)), chunk('igen', Buffer.concat(igen)), chunk('shdr', Buffer.concat(shdr))]);
  const body = Buffer.concat([Buffer.from('sfbk', 'ascii'), info, sdta, pdta]);
  return chunk('RIFF', body);
}
module.exports = { build };
if (require.main === module) fs.writeFileSync(process.argv[2] || 'test.sf2', build());
