export type Facing = 'environment' | 'user';

export type CameraError = 'denied' | 'notfound' | 'insecure' | 'unsupported' | 'busy' | 'unknown';

export function classifyError(err: unknown): CameraError {
  const name = (err as { name?: string })?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') return 'notfound';
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'busy';
  return 'unknown';
}

interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

/**
 * Thin wrapper over getUserMedia that owns a <video> element used as the
 * preview texture source.
 */
export class CameraController {
  readonly video: HTMLVideoElement;
  facing: Facing = 'environment';
  private stream: MediaStream | null = null;
  private starting: Promise<boolean> | null = null;
  private generation = 0;

  constructor() {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('muted', '');
    v.autoplay = true;
    this.video = v;
  }

  static supported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  get active(): boolean {
    return !!this.stream && this.stream.getVideoTracks().some((t) => t.readyState === 'live');
  }

  get width(): number {
    return this.video.videoWidth;
  }

  get height(): number {
    return this.video.videoHeight;
  }

  get track(): MediaStreamTrack | undefined {
    return this.stream?.getVideoTracks()[0];
  }

  /**
   * Starts (or switches) the camera. Resolves false when a newer start/stop superseded this
   * request: its late success or failure must not touch the screen's state.
   */
  async start(facing: Facing = this.facing): Promise<boolean> {
    if (typeof window !== 'undefined' && !window.isSecureContext) throw Object.assign(new Error('insecure'), { name: 'InsecureContext' });
    if (!CameraController.supported()) throw Object.assign(new Error('unsupported'), { name: 'Unsupported' });
    const gen = ++this.generation;
    const run = async (): Promise<boolean> => {
      this.stopTracks();
      const base: MediaTrackConstraints = { facingMode: { ideal: facing }, width: { ideal: 2560 }, height: { ideal: 1440 } };
      let stream: MediaStream;
      try {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: base, audio: false });
        } catch (err) {
          if (classifyError(err) !== 'notfound') throw err;
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      } catch (err) {
        // e.g. NotReadableError from an abandoned request while a newer one owns the camera.
        if (gen !== this.generation) return false;
        throw err;
      }
      if (gen !== this.generation) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }
      this.stream = stream;
      this.facing = (stream.getVideoTracks()[0]?.getSettings().facingMode as Facing) ?? facing;
      // Desktop webcams report no facingMode; treat them like a selfie camera only if asked.
      if (!stream.getVideoTracks()[0]?.getSettings().facingMode) this.facing = facing;
      this.video.srcObject = stream;
      await this.video.play().catch(() => undefined);
      if (!this.video.videoWidth) {
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          this.video.addEventListener('loadedmetadata', done, { once: true });
          setTimeout(done, 2500);
        });
      }
      return gen === this.generation;
    };
    this.starting = run();
    try {
      return await this.starting;
    } finally {
      this.starting = null;
    }
  }

  async flip(): Promise<void> {
    await this.start(this.facing === 'environment' ? 'user' : 'environment');
  }

  private stopTracks(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
  }

  stop(): void {
    this.generation++;
    this.stopTracks();
  }

  get hasTorch(): boolean {
    const t = this.track;
    if (!t || typeof t.getCapabilities !== 'function') return false;
    return !!(t.getCapabilities() as TorchCapabilities).torch;
  }

  async setTorch(on: boolean): Promise<void> {
    const t = this.track;
    if (!t || !this.hasTorch) return;
    try {
      await t.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
    } catch (err) {
      console.warn('[silvr] torch failed', err);
    }
  }
}
