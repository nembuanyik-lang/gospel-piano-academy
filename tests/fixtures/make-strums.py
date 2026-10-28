# Writes synthetic guitar strums (plucked strings with decaying harmonics) used to test microphone chord recognition.
# Usage: python3 make-strums.py <out-dir>
import math, struct, sys, wave, random
SR = 48000
E2 = 40
STR = [40, 45, 50, 55, 59, 64]
SHAPES = {'G': [3, 2, 0, 0, 0, 3], 'Em': [0, 2, 2, 0, 0, 0], 'C': [-1, 3, 2, 0, 1, 0], 'D': [-1, -1, 0, 2, 3, 2], 'Am': [-1, 0, 2, 2, 1, 0]}
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def strum(shape, secs=2.0):
    n = int(SR * secs); out = [0.0] * n
    notes = [STR[i] + f for i, f in enumerate(shape) if f >= 0]
    for k, m in enumerate(notes):
        start = int(k * 0.012 * SR); f = hz(m)
        for h in range(1, 7):
            amp = 0.5 / h ** 1.3; ph = random.random() * 6.28; dec = 1.5 + h * 0.8
            for i in range(start, n):
                t = (i - start) / SR
                out[i] += amp * math.exp(-dec * t) * math.sin(2 * math.pi * f * h * t + ph)
    return out
def write(name, chords, reps=6):
    data = []
    for _ in range(reps):
        for c in chords: data += strum(SHAPES[c])
    peak = max(abs(x) for x in data) or 1
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(x / peak * 26000)) for x in data))
out = sys.argv[1]
random.seed(1)
write(out + '/strum-G.wav', ['G'])
write(out + '/strum-Em.wav', ['Em'])
write(out + '/strum-G-C.wav', ['G', 'C'])
