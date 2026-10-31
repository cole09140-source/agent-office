import type { ShutterSound } from './models';

/**
 * Per-camera sound design, synthesized with WebAudio so we ship no audio
 * assets. Each profile mimics the body: SLR mirror slap, quiet leaf shutter,
 * plastic disposable click + thumbwheel, instant camera motor eject, etc.
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }
  const AC = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
    | typeof AudioContext
    | undefined;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

function noise(ac: AudioContext, at: number, dur: number, gain: number, freq: number, q = 0.9): void {
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(bp).connect(g).connect(ac.destination);
  src.start(ac.currentTime + at);
}

function tone(ac: AudioContext, at: number, dur: number, freq: number, gain: number, type: OscillatorType = 'square', endFreq?: number): void {
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function playShutter(profile: ShutterSound): void {
  const ac = audio();
  if (!ac) return;
  switch (profile) {
    case 'slr': // mirror up, curtain, mirror down
      noise(ac, 0, 0.04, 0.9, 2400);
      noise(ac, 0.06, 0.09, 0.8, 1100);
      noise(ac, 0.11, 0.05, 0.35, 600);
      break;
    case 'leaf': // soft, quiet tick
      noise(ac, 0, 0.025, 0.35, 3800, 1.4);
      noise(ac, 0.03, 0.02, 0.2, 2600, 1.4);
      break;
    case 'disposable': // plastic snap
      noise(ac, 0, 0.03, 0.9, 1800, 2);
      tone(ac, 0, 0.03, 420, 0.08);
      break;
    case 'toy':
      noise(ac, 0, 0.05, 0.8, 900, 1.2);
      noise(ac, 0.05, 0.04, 0.4, 500, 1.2);
      break;
    case 'instant': // shutter + motor ejecting the print
      noise(ac, 0, 0.035, 0.8, 2000);
      for (let i = 0; i < 18; i++) tone(ac, 0.12 + i * 0.045, 0.05, 95 + (i % 3) * 6, 0.05, 'sawtooth');
      break;
    case 'quad': // four lenses firing in sequence
      for (let i = 0; i < 4; i++) noise(ac, i * 0.22, 0.03, 0.6, 2200 + i * 150, 1.5);
      break;
    case 'digital': // fake shutter sample + confirmation beep
      noise(ac, 0, 0.03, 0.45, 3000, 1.5);
      tone(ac, 0.05, 0.08, 2093, 0.05, 'sine');
      break;
    case 'pixel': // chiptune blip
      tone(ac, 0, 0.06, 880, 0.06);
      tone(ac, 0.06, 0.09, 1320, 0.06);
      break;
    case 'cine': // claw advance
      for (let i = 0; i < 3; i++) noise(ac, i * 0.05, 0.03, 0.5, 1400, 1.2);
      break;
  }
}

/** Film advance after a shot: lever ratchet, thumbwheel, or nothing for digital/instant bodies. */
export function playAdvance(profile: ShutterSound): void {
  const ac = audio();
  if (!ac) return;
  if (profile === 'digital' || profile === 'pixel' || profile === 'instant' || profile === 'quad') return;
  const clicks = profile === 'disposable' ? 9 : profile === 'toy' ? 7 : 5;
  const step = profile === 'disposable' ? 0.05 : 0.035;
  for (let i = 0; i < clicks; i++) tone(ac, 0.2 + i * step, 0.02, 160 + i * 10, 0.05);
}

/** Rising whine of a disposable's flash capacitor charging (duration in s). */
export function playFlashCharge(duration: number): void {
  const ac = audio();
  if (!ac) return;
  tone(ac, 0, duration, 1200, 0.02, 'sine', 6400);
}

export function playBeep(): void {
  const ac = audio();
  if (!ac) return;
  tone(ac, 0, 0.06, 1760, 0.04, 'sine');
}
