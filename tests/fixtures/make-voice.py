#!/usr/bin/env python3
"""Synthetic singing for the Vocal Studio tests: a voice-like tone (harmonics, gentle vibrato, breath noise)
that sings a list of notes, one second each, then repeats. Written as 48 kHz mono 16-bit WAV files.
  voice-five.wav       the five-note scale from D3 (D E F# G A G F# E D), in tune
  voice-five-flat.wav  the same, 40 cents flat
  voice-a3.wav         a long A3 (for the tuner and the long-note exercise)"""
import math, random, struct, sys, wave, os
SR = 48000
def tone(midi, secs, cents=0.0):
    f0 = 440.0 * 2 ** ((midi - 69 + cents / 100.0) / 12.0)
    out, ph = [], [random.random() * 6 for _ in range(9)]
    n, phase = int(SR * secs), 0.0
    for i in range(n):
        t = i / SR
        f = f0 * (1 + 0.003 * math.sin(2 * math.pi * 5.2 * t))     # gentle vibrato, about 5 cents
        phase += 2 * math.pi * f / SR                                # integrate the frequency: steady pitch
        env = min(1.0, t / 0.04, (secs - t) / 0.06) if secs - t > 0 else 0.0
        v = sum((1.0 / h) * math.sin(phase * h + ph[h]) for h in range(1, 9))
        out.append(0.22 * env * v + random.uniform(-0.004, 0.004))
    return out
def write(path, samples):
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s)) * 32000)) for s in samples))
def sing(notes, cents=0.0, secs=1.0, gap=0.12):
    s = []
    for m in notes: s += tone(m, secs - gap, cents) + [0.0] * int(SR * gap)
    return s
if __name__ == '__main__':
    d = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
    random.seed(7)
    five = [50, 52, 54, 55, 57, 55, 54, 52, 50]
    write(os.path.join(d, 'voice-five.wav'), sing(five))
    write(os.path.join(d, 'voice-five-flat.wav'), sing(five, cents=-40))
    write(os.path.join(d, 'voice-a3.wav'), tone(57, 6.0) + [0.0] * int(SR * 0.3))
