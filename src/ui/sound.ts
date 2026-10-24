// Sound effects made in code with Web Audio: no files to load.

let ctx: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => { muted = m; };

/** Browsers only allow sound after a tap, so the context starts on the first one. */
function audio(): AudioContext | null {
  if (muted) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq: number, to: number, dur: number, type: OscillatorType, vol = 0.2, delay = 0) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur);
}

export const sfx = {
  pop: () => tone(500, 1100, 0.09, 'sine'),
  nope: () => tone(220, 140, 0.18, 'square', 0.06),
  sparkle: () => [660, 880, 1320].forEach((f, i) => tone(f, f * 1.01, 0.15, 'triangle', 0.18, i * 0.07)),
  woof: () => { tone(320, 150, 0.11, 'sawtooth', 0.12); tone(300, 140, 0.13, 'sawtooth', 0.12, 0.14); },
  cheer: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.2, i * 0.12)),
  buzzer: () => tone(180, 90, 0.6, 'sawtooth', 0.08),
};
