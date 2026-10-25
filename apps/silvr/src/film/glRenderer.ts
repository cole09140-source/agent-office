import { seedHash } from './random';
import { FRAG, MAX_LEAKS, VERT } from './shader';
import type { ResolvedLook } from './types';

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RenderOpts {
  crop: CropRect;
  mirror: boolean;
  /** Overrides the look seed (live preview animates grain per frame). */
  seed?: number;
}

type Canvas = HTMLCanvasElement | OffscreenCanvas;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return sh;
}

export class GlFilmRenderer {
  readonly gl: WebGL2RenderingContext;
  readonly maxTexture: number;
  private prog: WebGLProgram;
  private srcTex: WebGLTexture;
  private lutTex: WebGLTexture;
  private uniforms = new Map<string, WebGLUniformLocation | null>();
  private look: ResolvedLook | null = null;
  private srcW = 0;
  private srcH = 0;
  private lost = false;

  static create(canvas: Canvas): GlFilmRenderer | null {
    try {
      const gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      }) as WebGL2RenderingContext | null;
      if (!gl) return null;
      return new GlFilmRenderer(gl, canvas);
    } catch (err) {
      console.warn('[silvr] WebGL2 unavailable', err);
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext, canvas: Canvas) {
    this.gl = gl;
    this.maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    if ('addEventListener' in canvas) {
      (canvas as HTMLCanvasElement).addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        this.lost = true;
      });
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(prog, 0, 'aPos');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`Program link failed: ${gl.getProgramInfoLog(prog)}`);
    }
    this.prog = prog;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.srcTex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.lutTex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(this.u('uSrc'), 0);
    gl.uniform1i(this.u('uLut'), 1);
  }

  get isLost(): boolean {
    return this.lost || this.gl.isContextLost();
  }

  private u(name: string): WebGLUniformLocation | null {
    if (!this.uniforms.has(name)) this.uniforms.set(name, this.gl.getUniformLocation(this.prog, name));
    return this.uniforms.get(name)!;
  }

  setLook(look: ResolvedLook): void {
    if (this.look === look) return;
    const gl = this.gl;
    this.look = look;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, look.lut);

    // GLSL mat3 is column-major; our matrix is row-major.
    const m = look.matrix;
    gl.uniformMatrix3fv(this.u('uMatrix'), false, [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
    gl.uniform1f(this.u('uSaturation'), look.saturation);
    gl.uniform1i(this.u('uMono'), look.mono ? 1 : 0);
    gl.uniform3fv(this.u('uMonoW'), look.mono ?? [0.2126, 0.7152, 0.0722]);
    gl.uniform3fv(this.u('uShadowTint'), look.shadowTint);
    gl.uniform3fv(this.u('uHighlightTint'), look.highlightTint);
    gl.uniform1f(this.u('uGrain'), look.grain);
    gl.uniform1f(this.u('uGrainChroma'), look.grainChroma);
    gl.uniform1f(this.u('uHalation'), look.halation);
    gl.uniform3fv(this.u('uHalationColor'), look.halationColor);
    gl.uniform1f(this.u('uBloom'), look.bloom);
    gl.uniform1f(this.u('uVignette'), look.vignette);
    gl.uniform1f(this.u('uFlash'), look.flash);
    const n = Math.min(MAX_LEAKS, look.leaks.length);
    gl.uniform1i(this.u('uLeakCount'), n);
    if (n > 0) {
      const pos = new Float32Array(MAX_LEAKS * 4);
      const col = new Float32Array(MAX_LEAKS * 3);
      look.leaks.slice(0, n).forEach((L, i) => {
        pos.set([L.x, L.y, L.radius, L.intensity], i * 4);
        col.set(L.color, i * 3);
      });
      gl.uniform4fv(this.u('uLeakPos'), pos);
      gl.uniform3fv(this.u('uLeakColor'), col);
    }
  }

  /** Upload a new source frame (video, bitmap, image or canvas). */
  setSource(source: TexImageSource, width: number, height: number): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.srcW = width;
    this.srcH = height;
  }

  render(outW: number, outH: number, opts: RenderOpts): void {
    const look = this.look;
    if (!look || !this.srcW) return;
    const gl = this.gl;
    const canvas = gl.canvas as Canvas;
    if (canvas.width !== outW) canvas.width = outW;
    if (canvas.height !== outH) canvas.height = outH;
    gl.viewport(0, 0, outW, outH);

    const shortOut = Math.min(outW, outH);
    // Halation radius ≈ 2.5% of the short side, expressed as a mip level of the source.
    const srcShortInCrop = Math.min(this.srcW * opts.crop.w, this.srcH * opts.crop.h);
    const blurLod = Math.max(0, Math.log2(Math.max(1, srcShortInCrop * 0.025)));

    gl.uniform4f(this.u('uCrop'), opts.crop.x, opts.crop.y, opts.crop.w, opts.crop.h);
    gl.uniform1i(this.u('uMirror'), opts.mirror ? 1 : 0);
    gl.uniform1i(this.u('uFlipY'), 0);
    gl.uniform2f(this.u('uOutSize'), outW, outH);
    gl.uniform1f(this.u('uBlurLod'), blurLod);
    gl.uniform1f(this.u('uGrainPx'), Math.max(0.5, look.grainSize * (shortOut / 1200)));
    gl.uniform1f(this.u('uChromaPx'), look.chroma * (shortOut / 1200));
    gl.uniform1ui(this.u('uSeedHash'), seedHash(opts.seed ?? look.seed));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteTexture(this.srcTex);
    gl.deleteTexture(this.lutTex);
    gl.deleteProgram(this.prog);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
