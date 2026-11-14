/** All sound is made in the browser: a slow ambient pad, far-off notes, and short effects. No audio files. */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let noteTimer: number | undefined;

const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];   // A minor pentatonic-ish

export function startAudio() {
  if (ctx) { void ctx.resume(); return; }
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
  } catch { return; }
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);

  // pad: two detuned low voices through a slowly opening filter
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = 0.6;
  const pad = ctx.createGain(); pad.gain.value = 0.11;
  filter.connect(pad); pad.connect(master);
  for (const [freq, det] of [[55, -6], [82.4, 5], [110, 9]] as const) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = det;
    o.connect(filter); o.start();
  }
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045;
  const depth = ctx.createGain(); depth.gain.value = 190;
  lfo.connect(depth); depth.connect(filter.frequency); lfo.start();

  const farNote = () => {
    if (ctx && !muted) pluck(SCALE[Math.floor(Math.random() * SCALE.length)] * (Math.random() < 0.3 ? 2 : 1), 0.05, 2.6, 'triangle');
    noteTimer = window.setTimeout(farNote, 3500 + Math.random() * 6500);
  };
  noteTimer = window.setTimeout(farNote, 2500);
}

function pluck(freq: number, vol: number, len: number, type: OscillatorType, slideTo?: number) {
  if (!ctx || !master || muted) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + len);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + len + 0.05);
}

function noise(vol: number, len: number, cutoff: number) {
  if (!ctx || !master || muted) return;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(master); src.start();
}

export const sfx = {
  swing: () => noise(0.16, 0.09, 1800),
  hit: () => { noise(0.3, 0.12, 900); pluck(140, 0.12, 0.12, 'square', 70); },
  bolt: () => pluck(880, 0.08, 0.16, 'sawtooth', 300),
  hurt: () => { noise(0.35, 0.2, 500); pluck(110, 0.16, 0.25, 'square', 55); },
  pickup: () => pluck(660, 0.07, 0.12, 'triangle', 990),
  item: () => { pluck(523, 0.08, 0.1, 'triangle'); window.setTimeout(() => pluck(784, 0.08, 0.16, 'triangle'), 80); },
  dash: () => noise(0.14, 0.14, 3000),
  down: () => pluck(330, 0.1, 0.5, 'triangle', 60),
  level: () => [392, 523, 659, 784].forEach((f, i) => window.setTimeout(() => pluck(f, 0.1, 0.35, 'triangle'), i * 110)),
  shutdown: () => pluck(440, 0.16, 1.4, 'sawtooth', 40),
  talk: () => pluck(300 + Math.random() * 120, 0.04, 0.06, 'square'),
  shrine: () => [220, 330, 440, 660].forEach((f, i) => window.setTimeout(() => pluck(f, 0.09, 1.2, 'sine'), i * 160)),
};

export function toggleMute(): boolean {
  muted = !muted;
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.05);
  return muted;
}
export const isMuted = () => muted;
