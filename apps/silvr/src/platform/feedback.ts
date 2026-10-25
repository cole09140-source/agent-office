let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const AC = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
    | typeof AudioContext
    | undefined;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

/** Mechanical shutter "ka-chunk", synthesized so we ship no audio assets. */
export function shutterSound(): void {
  const ac = audio();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
  const t0 = ac.currentTime;
  const burst = (at: number, dur: number, gain: number, freq: number) => {
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 0.9;
    const g = ac.createGain();
    g.gain.value = gain;
    src.connect(bp).connect(g).connect(ac.destination);
    src.start(t0 + at);
  };
  burst(0, 0.045, 0.9, 2400);
  burst(0.07, 0.08, 0.7, 1200);
}

/** Film-advance ratchet after each shot. */
export function windSound(): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.18;
  for (let i = 0; i < 5; i++) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'square';
    o.frequency.value = 180 + i * 12;
    g.gain.setValueAtTime(0.0001, t0 + i * 0.035);
    g.gain.exponentialRampToValueAtTime(0.06, t0 + i * 0.035 + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.035 + 0.02);
    o.connect(g).connect(ac.destination);
    o.start(t0 + i * 0.035);
    o.stop(t0 + i * 0.035 + 0.03);
  }
}

export function haptic(pattern: number | number[] = 12): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
