export const MAX_LEAKS = 3;

/** Pixel-camera grid: 128 cells on the long side (shared by GPU and CPU paths). */
export function pixelCells(w: number, h: number): [number, number] {
  return w >= h ? [128, Math.max(1, Math.round((128 * h) / w))] : [Math.max(1, Math.round((128 * w) / h)), 128];
}

/** Fisheye: maps normalized output radius (0..1) to source radius (0..1). */
export const FISHEYE_A = 1.2;

export const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

/**
 * Film pipeline. Must stay in sync with cpuRender.ts — the CPU path is the
 * reference implementation that unit tests exercise.
 */
export const FRAG = `#version 300 es
precision highp float;
precision highp int; // the PCG grain hash needs full 32-bit integer math
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uSrc;
uniform sampler2D uLut;
uniform vec4 uCrop;        // x, y, w, h in source uv
uniform bool uMirror;
uniform bool uFlipY;
uniform vec2 uOutSize;     // output px
uniform float uBlurLod;
uniform mat3 uMatrix;
uniform float uSaturation;
uniform bool uMono;
uniform vec3 uMonoW;
uniform vec3 uShadowTint;
uniform vec3 uHighlightTint;
uniform float uGrain;
uniform float uGrainPx;
uniform float uGrainChroma;
uniform float uHalation;
uniform vec3 uHalationColor;
uniform float uBloom;
uniform float uVignette;
uniform float uChromaPx;
uniform float uFlash;
uniform uint uSeedHash; // seedHash(seed) from random.ts, computed on the CPU so both paths agree
uniform float uDistort;
uniform float uFisheye;
uniform float uSoft;
uniform float uSoftLod;
uniform float uStreak;
uniform vec3 uStreakColor;
uniform bool uPixel;
uniform vec2 uPixelCells;
uniform vec3 uPal[4];
uniform int uLeakCount;
uniform vec4 uLeakPos[${MAX_LEAKS}];   // x, y, radius, intensity
uniform vec3 uLeakColor[${MAX_LEAKS}];

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

uint pcg(uint v) {
  uint state = v * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

// Integer lattice hash; mirrors random.ts lattice() (stable on low-precision GPUs).
uint lat(vec2 p, uint hs) {
  uvec2 q = uvec2(ivec2(p) + 32768);
  return pcg(q.x + pcg(q.y + hs));
}

vec4 bytes4(uint h) {
  return vec4(float(h & 255u), float((h >> 8u) & 255u), float((h >> 16u) & 255u), float(h >> 24u)) / 255.0;
}

// Value noise for 4 channels at once: x = luminance grain, yzw = per-channel grain.
vec4 vnoise4(vec2 p, uint hs) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  vec4 a = bytes4(lat(i, hs));
  vec4 b = bytes4(lat(i + vec2(1.0, 0.0), hs));
  vec4 c = bytes4(lat(i + vec2(0.0, 1.0), hs));
  vec4 d = bytes4(lat(i + vec2(1.0, 1.0), hs));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y) - 0.5;
}

vec3 lut(vec3 c) {
  c = clamp(c, 0.0, 1.0) * (255.0 / 256.0) + (0.5 / 256.0);
  return vec3(
    texture(uLut, vec2(c.r, 0.5)).r,
    texture(uLut, vec2(c.g, 0.5)).g,
    texture(uLut, vec2(c.b, 0.5)).b
  );
}

vec2 srcUv(vec2 uv) {
  if (uMirror) uv.x = 1.0 - uv.x;
  vec2 s = uCrop.xy + uv * uCrop.zw;
  if (uFlipY) s.y = 1.0 - s.y;
  return s;
}

vec3 screen(vec3 a, vec3 b) { return 1.0 - (1.0 - a) * (1.0 - b); }

const float BAYER[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);

// Lens projection: barrel/pincushion distortion or circular fisheye. Mirrors cpuRender.ts lensUv().
vec2 lensUv(vec2 uv, vec2 aspect, out float inside) {
  vec2 p = (uv - 0.5) * aspect;
  inside = 1.0;
  if (uFisheye > 0.5) {
    float R = 0.5 * min(aspect.x, aspect.y);
    float r = length(p);
    float rn = r / R;
    inside = 1.0 - smoothstep(0.985, 1.0, rn);
    float rs = tan(min(rn, 1.0) * ${FISHEYE_A.toFixed(3)}) / tan(${FISHEYE_A.toFixed(3)});
    p = r > 0.0 ? p / r * rs * R : p;
  } else if (uDistort != 0.0) {
    float r2 = dot(p, p) / dot(0.5 * aspect, 0.5 * aspect);
    p *= (1.0 + uDistort * r2) / (1.0 + max(uDistort, 0.0));
  }
  return p / aspect + 0.5;
}

void main() {
  vec2 uv0 = vec2(vUv.x, 1.0 - vUv.y); // top-left origin, like the CPU path
  vec2 aspect = uOutSize / max(uOutSize.x, uOutSize.y);
  vec2 centered = (uv0 - 0.5) * aspect;
  float dist = length(centered) / length(0.5 * aspect); // 0 centre, 1 corner
  vec2 uv = uv0;
  if (uPixel) uv = (floor(uv0 * uPixelCells) + 0.5) / uPixelCells;
  float inside;
  uv = lensUv(uv, aspect, inside);

  // Lateral chromatic aberration grows towards the edges.
  vec2 ca = (uv - 0.5) * (uChromaPx / max(uOutSize.x, uOutSize.y)) * 2.0 * dist;
  vec3 c;
  if (uPixel) {
    // Quantized uv has zero derivatives inside a cell: sample LOD 0 explicitly or cell edges pick blurry mips.
    c = textureLod(uSrc, srcUv(uv), 0.0).rgb;
  } else {
    c.r = texture(uSrc, srcUv(uv + ca)).r;
    c.g = texture(uSrc, srcUv(uv)).g;
    c.b = texture(uSrc, srcUv(uv - ca)).b;
  }

  vec2 su = srcUv(uv);
  vec2 bo = 1.5 * exp2(uBlurLod) / vec2(textureSize(uSrc, 0));
  vec3 blur = (textureLod(uSrc, su, uBlurLod).rgb * 2.0
    + textureLod(uSrc, su + vec2(bo.x, 0.0), uBlurLod).rgb
    + textureLod(uSrc, su - vec2(bo.x, 0.0), uBlurLod).rgb
    + textureLod(uSrc, su + vec2(0.0, bo.y), uBlurLod).rgb
    + textureLod(uSrc, su - vec2(0.0, bo.y), uBlurLod).rgb) / 6.0;

  // Lens rendering: soft corners on cheap plastic lenses, crisp micro-contrast on others.
  vec3 sl = textureLod(uSrc, su, uSoftLod).rgb;
  if (uSoft > 0.0) c = mix(c, sl, uSoft * smoothstep(0.2, 1.0, dist));
  else if (uSoft < 0.0) c = clamp(c + (-uSoft) * 1.5 * (c - sl), 0.0, 1.0);

  c = clamp(uMatrix * c, 0.0, 1.0);
  if (uMono) {
    c = vec3(dot(c, uMonoW));
  } else {
    float y = dot(c, LUMA);
    c = clamp(mix(vec3(y), c, uSaturation), 0.0, 1.0);
  }
  c = lut(c);

  if (uPixel) {
    // 2-bit pixel art: ordered dither into a 4-tone palette.
    vec2 cell = floor(uv0 * uPixelCells);
    int idx = (int(cell.y) & 3) * 4 + (int(cell.x) & 3);
    float t = (BAYER[idx] + 0.5) / 16.0 - 0.5;
    float q = clamp(floor(dot(c, LUMA) * 3.0 + 0.5 + t), 0.0, 3.0);
    outColor = vec4(uPal[int(q)], 1.0);
    return;
  }

  float y2 = dot(c, LUMA);
  c += uShadowTint * (1.0 - smoothstep(0.0, 0.5, y2)) + uHighlightTint * smoothstep(0.5, 1.0, y2);

  float hm = smoothstep(0.55, 1.0, dot(blur, LUMA));
  c = screen(clamp(c, 0.0, 1.0), uHalationColor * hm * uHalation);
  if (uStreak > 0.0) {
    // Anamorphic flare: highlights smeared into a horizontal blue line.
    float acc = 0.0;
    for (int i = 1; i <= 6; i++) {
      float o = float(i) * 0.035 * uCrop.z;
      float w = 1.0 - float(i) / 7.0;
      acc += w * smoothstep(0.75, 1.0, dot(textureLod(uSrc, su + vec2(o, 0.0), uBlurLod).rgb, LUMA));
      acc += w * smoothstep(0.75, 1.0, dot(textureLod(uSrc, su - vec2(o, 0.0), uBlurLod).rgb, LUMA));
    }
    c = screen(clamp(c, 0.0, 1.0), uStreakColor * uStreak * 1.5 * acc / 6.0);
  }
  vec3 bl = uMono ? vec3(dot(blur, uMonoW)) : blur;
  c += uBloom * 0.35 * max(bl - c, 0.0);

  c *= 1.0 + uFlash * 0.3 * (1.0 - smoothstep(0.0, 0.7, dist));
  c *= 1.0 - uVignette * smoothstep(0.3, 1.0, dist);

  for (int i = 0; i < ${MAX_LEAKS}; i++) {
    if (i >= uLeakCount) break;
    vec4 L = uLeakPos[i];
    float d = length((uv - L.xy) * aspect) / L.z;
    float a = 1.0 - smoothstep(0.0, 1.0, d);
    c = screen(clamp(c, 0.0, 1.0), uLeakColor[i] * a * a * L.w);
  }

  vec2 px = vec2(uv.x, uv.y) * uOutSize / uGrainPx;
  float yg = clamp(dot(c, LUMA), 0.0, 1.0);
  float amp = uGrain * (0.35 + 0.65 * (1.0 - (2.0 * yg - 1.0) * (2.0 * yg - 1.0)));
  vec4 n = vnoise4(px, uSeedHash);
  c += amp * 1.8 * ((1.0 - uGrainChroma) * vec3(n.x) + uGrainChroma * n.yzw);

  outColor = vec4(clamp(c, 0.0, 1.0) * inside, 1.0);
}`;
