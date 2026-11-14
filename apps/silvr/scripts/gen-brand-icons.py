"""Film Camela brand icons: every platform icon / splash / store icon from the owner's logo.

Source art: design/brand/logo-source.webp (1254x1254, vintage rangefinder + film strips inside a gold ring,
on an aged olive card with a pale worn border and rounded corners).

The aged outer border + rounded corners are cropped away: once iOS / Android / Play apply their own mask they
would read as a "box inside a box". Instead the gold ring (and everything inside it) is cut out along its own
outer edge and placed on a re-synthesised olive field that runs to every edge, so the OS mask only ever cuts
plain olive.

Masters written to design/brand/:
  icon-full-1024.png        opaque full-bleed square, ring = 88% of the width  (iOS, Play, apple-touch, PWA)
  icon-maskable-1024.png    same, ring = 78% (inside the PWA maskable 80% safe circle)
  adaptive-fg-1024.png      108dp Android foreground layer: ring + camera + film on transparent, ring = 63dp (66dp safe zone)
  adaptive-bg-1024.png      108dp Android background layer: olive field
  monochrome-1024.png       108dp Android 13+ themed-icon silhouette (same geometry as the foreground)
  monochrome.svg            the same silhouette as a vector (also copied to public/icons/icon-mono.svg)

Usage:  python scripts/gen-brand-icons.py [all|icons|splash|masters]   (npm run icons runs both)
Needs Pillow + numpy.
"""
import base64
import io
import math
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / 'design' / 'brand'
SRC = BRAND / 'logo-source.webp'
OUT_STORE = Path(os.environ.get('FC_STORE_DIR', str(Path.home() / 'Desktop' / '클로드코드' / '_결과물' / 'FilmCamela_스토어_스크린샷' / 'play')))

OLIVE = (50, 50, 17)            # median of the logo's green field (#323211)
OLIVE_HEX = '#323211'
APP_BG = (14, 13, 12)           # app background #0e0d0c
CREAM = (243, 239, 232)         # #f3efe8
ORANGE = (255, 138, 43)         # #ff8a2b (app accent, kept for the wordmark)

RING_C = (622.5, 620.0)         # gold ring centre in source pixels
RING_R = 605.5                  # nominal outer radius (the drawn ring is slightly squarish: 595..608)
M = 1024                        # master size


# ---------------------------------------------------------------- source cut-out
def load_source():
    return Image.open(SRC).convert('RGB')


def ring_profile(a):
    """Outer edge radius of the gold ring for every degree (median-filtered)."""
    cx, cy = RING_C
    prof = []
    for deg in range(360):
        t = math.radians(deg)
        best = None
        for r in np.arange(560, 618, 0.5):
            x = int(round(cx + r * math.cos(t)))
            y = int(round(cy + r * math.sin(t)))
            if not (0 <= x < a.shape[1] and 0 <= y < a.shape[0]):
                continue
            p = a[y, x]
            if p[0] > 120 and p[0] - p[2] > 55:
                best = r
        prof.append(best if best is not None else RING_R)
    prof = np.array(prof)
    k = 9
    pad = np.concatenate([prof[-k:], prof, prof[:k]])
    med = np.array([np.median(pad[i:i + 2 * k + 1]) for i in range(360)])
    return np.clip(med, 590, 610)


def ring_disc(src):
    """RGBA crop (1220x1220) of the source: everything inside the ring's outer edge, transparent outside."""
    a = np.asarray(src).astype(np.float32)
    prof = ring_profile(a.astype(int))
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx, dy = xx - RING_C[0], yy - RING_C[1]
    r = np.hypot(dx, dy)
    ang = (np.degrees(np.arctan2(dy, dx)) + 360) % 360
    i0 = np.floor(ang).astype(int) % 360
    f = ang - np.floor(ang)
    edge = prof[i0] * (1 - f) + prof[(i0 + 1) % 360] * f + 1.0
    alpha = np.clip((edge - r) / 2.0 + 0.5, 0, 1)
    rgba = np.dstack([a, alpha * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    half = 610
    box = (int(RING_C[0] - half), int(RING_C[1] - half), int(RING_C[0] - half) + 2 * half, int(RING_C[1] - half) + 2 * half)
    return im.crop(box), half  # crop centre == ring centre


def resize_rgba(im, size):
    return im.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')


# ---------------------------------------------------------------- olive field
def olive_field(n, seed=7, vignette=10.0):
    """Olive card texture matched to the logo's field: base #323211, additive near-grey mottling + grain
    (the logo's light specks are less saturated than the base, so noise is added on all channels, a bit more on blue)."""
    rng = np.random.default_rng(seed)

    def blotch(cells, std):
        g = rng.normal(0, 1, (cells, cells)).astype(np.float32)
        im = Image.fromarray(((g / 6 + 0.5) * 255).clip(0, 255).astype(np.uint8), 'L').resize((n, n), Image.BICUBIC)
        v = np.asarray(im).astype(np.float32) / 255 - 0.5
        return v / (v.std() + 1e-6) * std

    k = n / 1024
    lum = blotch(5, 1.6) + blotch(20, 1.8) + blotch(90, 1.6)
    grain = rng.normal(0, 1, (n, n)).astype(np.float32)
    grain = np.asarray(Image.fromarray(((grain / 6 + 0.5) * 255).clip(0, 255).astype(np.uint8), 'L')
                       .filter(ImageFilter.GaussianBlur(0.6 * k))).astype(np.float32) / 255 - 0.5
    lum += grain / (grain.std() + 1e-6) * 3.2
    # sparse light specks, like the worn card
    specks = (rng.random((n, n)) > 0.9965).astype(np.float32)
    specks = np.asarray(Image.fromarray((specks * 255).astype(np.uint8), 'L')
                        .filter(ImageFilter.GaussianBlur(0.7 * k))).astype(np.float32) / 255
    lum += specks / (specks.max() + 1e-6) * 18
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
    rr = np.hypot(xx - n / 2, yy - n / 2) / (n / 2 * math.sqrt(2))
    lum += 4 - vignette * rr ** 2
    base = np.array(OLIVE, np.float32)
    rgb = base[None, None, :] + lum[..., None] * np.array([1, 1, 1.25], np.float32)
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), 'RGB')


def place_disc(canvas, disc, half, ring_frac):
    n = canvas.size[0]
    scale = ring_frac * n / (2 * RING_R)
    s = int(round(2 * half * scale))
    d = resize_rgba(disc, (s, s))
    off = (n - s) // 2
    base = canvas.convert('RGBA')
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    layer.paste(d, (off, off))
    return Image.alpha_composite(base, layer)


# ---------------------------------------------------------------- monochrome silhouette
# Geometry traced from the source (source pixel space). ('add'|'cut', kind, params)
MONO_SHAPES = [
    ('add', 'ring', (RING_C[0], RING_C[1], 603, 44)),            # cx, cy, outer r, width
    ('add', 'rrect', (165, 445, 1072, 882, 22)),                   # body
    ('add', 'rrect', (608, 383, 1040, 470, 22)),                   # raised rangefinder plate
    ('add', 'rrect', (212, 385, 368, 452, 10)),                    # rewind dial
    ('add', 'rrect', (380, 398, 445, 452, 8)),                     # knob
    ('add', 'rrect', (460, 387, 590, 452, 10)),                    # shutter-speed dial
    ('add', 'rrect', (128, 532, 182, 602, 22)),                    # strap lugs
    ('add', 'rrect', (1056, 532, 1110, 602, 22)),
    ('cut', 'rrect', (150, 524, 1090, 546, 0)),                    # top plate / leatherette seam
    ('cut', 'rrect', (150, 834, 1090, 852, 0)),                    # bottom plate seam
    ('cut', 'rrect', (755, 407, 845, 490, 10)),                    # rangefinder windows
    ('cut', 'rrect', (865, 402, 997, 505, 10)),
    ('cut', 'rrect', (473, 450, 545, 500, 8)),
    ('cut', 'circle', (667, 668, 218)),                            # lens surround gap
    ('add', 'circle', (667, 668, 192)),                            # lens barrel
    ('cut', 'circle', (667, 668, 136)),                            # glass
    ('add', 'circle', (667, 668, 78)),                             # inner element
    ('cut', 'circle', (636, 637, 22)),                             # glint
]


def mono_view(n):
    """Map source px -> n-px 108dp canvas so the ring lands exactly where the adaptive foreground puts it."""
    scale = FG_RING_FRAC * n / (2 * RING_R)
    return scale, n / 2 - RING_C[0] * scale, n / 2 - RING_C[1] * scale


def mono_png(n):
    ss = 4
    N = n * ss
    scale, ox, oy = mono_view(N)
    img = Image.new('L', (N, N), 0)
    d = ImageDraw.Draw(img)
    T = lambda x, y: (ox + x * scale, oy + y * scale)
    for op, kind, p in MONO_SHAPES:
        v = 255 if op == 'add' else 0
        if kind == 'ring':
            cx, cy, r, wdt = p
            x, y = T(cx, cy)
            d.ellipse([x - r * scale, y - r * scale, x + r * scale, y + r * scale], fill=v)
            ri = (r - wdt) * scale
            d.ellipse([x - ri, y - ri, x + ri, y + ri], fill=0 if v else 255)
        elif kind == 'rrect':
            x0, y0, x1, y1, rad = p
            a, b = T(x0, y0), T(x1, y1)
            d.rounded_rectangle([a, b], radius=rad * scale, fill=v)
        elif kind == 'circle':
            cx, cy, r = p
            x, y = T(cx, cy)
            d.ellipse([x - r * scale, y - r * scale, x + r * scale, y + r * scale], fill=v)
    img = img.resize((n, n), Image.LANCZOS)
    out = Image.new('RGBA', (n, n), (255, 255, 255, 0))
    out.putalpha(img)
    return out


def mono_svg():
    scale, ox, oy = mono_view(108)
    parts = []
    for op, kind, p in MONO_SHAPES:
        fill = '#fff' if op == 'add' else '#000'
        if kind == 'ring':
            cx, cy, r, wdt = p
            parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r - wdt / 2}" fill="none" stroke="{fill}" stroke-width="{wdt}"/>')
        elif kind == 'rrect':
            x0, y0, x1, y1, rad = p
            parts.append(f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" rx="{rad}" fill="{fill}"/>')
        elif kind == 'circle':
            cx, cy, r = p
            parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"/>')
    vb = f'{-ox / scale:.2f} {-oy / scale:.2f} {108 / scale:.2f} {108 / scale:.2f}'
    body = '\n      '.join(parts)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">\n'
            f'  <!-- Film Camela themed-icon silhouette (Android 13+ monochrome). Generated by scripts/gen-brand-icons.py;\n'
            f'       the viewBox is the 108dp adaptive canvas, so the ring sits where the foreground layer puts it. -->\n'
            f'  <defs><mask id="m" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">\n'
            f'      {body}\n  </mask></defs>\n'
            f'  <rect x="-2000" y="-2000" width="6000" height="6000" fill="#000" mask="url(#m)"/>\n</svg>\n')


# ---------------------------------------------------------------- helpers
FULL_RING_FRAC = 0.88
MASK_RING_FRAC = 0.78
FG_RING_FRAC = 63 / 108


def rounded(im, radius_frac=112 / 512):
    n = im.size[0]
    ss = 4
    m = Image.new('L', (n * ss, n * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, n * ss - 1, n * ss - 1], radius=radius_frac * n * ss, fill=255)
    m = m.resize((n, n), Image.LANCZOS)
    out = im.convert('RGBA')
    out.putalpha(m)
    return out


def circle(im):
    n = im.size[0]
    ss = 4
    m = Image.new('L', (n * ss, n * ss), 0)
    ImageDraw.Draw(m).ellipse([0, 0, n * ss - 1, n * ss - 1], fill=255)
    m = m.resize((n, n), Image.LANCZOS)
    out = im.convert('RGBA')
    out.putalpha(m)
    return out


def down(im, n):
    if im.mode == 'RGBA':
        return resize_rgba(im, (n, n))
    return im.resize((n, n), Image.LANCZOS)


def save_png(im, path, rgb=False):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if rgb:
        im = im.convert('RGB')
    im.save(path, optimize=True)


def font(names, size):
    for nm in names:
        p = Path(os.environ.get('WINDIR', 'C:/Windows')) / 'Fonts' / nm
        if p.exists():
            return ImageFont.truetype(str(p), size)
        for d in ('/usr/share/fonts', '/Library/Fonts', '/System/Library/Fonts'):
            for q in Path(d).rglob(nm) if Path(d).exists() else []:
                return ImageFont.truetype(str(q), size)
    return ImageFont.load_default(size)


MONO_FONTS = ['consolab.ttf', 'DejaVuSansMono-Bold.ttf', 'Menlo.ttc']
SANS_FONTS = ['segoeui.ttf', 'DejaVuSans.ttf', 'Helvetica.ttc']


def draw_spaced(d, xy, parts, fnt, spacing):
    """Draw [(text, colour)] with letter-spacing; returns total width when d is None."""
    x, y = xy
    for text, col in parts:
        for ch in text:
            w = fnt.getlength(ch)
            if d is not None and ch != ' ':
                d.text((x, y), ch, font=fnt, fill=col)
            x += w + spacing
    return x - xy[0] - spacing


def radial_bg(w, h, inner, outer, radius, cy=0.46):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    t = np.clip(np.hypot(xx - w / 2, yy - h * cy) / radius, 0, 1)[..., None]
    rgb = np.array(inner, np.float32) * (1 - t) + np.array(outer, np.float32) * t
    return Image.fromarray(rgb.astype(np.uint8), 'RGB')


def svg_wrapper(full):
    """icon.svg: the rounded app icon as an SVG that embeds a 256px WebP (keeps every existing icon.svg link working).
    The corner clip is on clip-path="url(#r)" so scripts that strip it get the full-bleed square."""
    buf = io.BytesIO()
    down(full, 256).save(buf, 'WEBP', quality=86, method=6)
    b64 = base64.b64encode(buf.getvalue()).decode()
    return ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">\n'
            '  <!-- Film Camela app icon (generated by scripts/gen-brand-icons.py from design/brand/logo-source.webp). -->\n'
            '  <defs><clipPath id="r"><rect width="512" height="512" rx="112"/></clipPath></defs>\n'
            f'  <image clip-path="url(#r)" width="512" height="512" href="data:image/webp;base64,{b64}"/>\n</svg>\n')


# ---------------------------------------------------------------- build
def masters():
    src = load_source()
    disc, half = ring_disc(src)
    full = place_disc(olive_field(M), disc, half, FULL_RING_FRAC).convert('RGB')
    mask = place_disc(olive_field(M), disc, half, MASK_RING_FRAC).convert('RGB')
    fg = place_disc(Image.new('RGBA', (M, M), (0, 0, 0, 0)), disc, half, FG_RING_FRAC)
    bg = olive_field(M, vignette=14.0)
    mono = mono_png(M)
    save_png(full, BRAND / 'icon-full-1024.png', rgb=True)
    save_png(mask, BRAND / 'icon-maskable-1024.png', rgb=True)
    save_png(fg, BRAND / 'adaptive-fg-1024.png')
    save_png(bg, BRAND / 'adaptive-bg-1024.png', rgb=True)
    save_png(mono, BRAND / 'monochrome-1024.png')
    (BRAND / 'monochrome.svg').write_text(mono_svg(), encoding='utf-8')
    return dict(full=full, mask=mask, fg=fg, bg=bg, mono=mono)


def icons(m):
    pub = ROOT / 'public'
    ic = pub / 'icons'
    full, rnd = m['full'], rounded(m['full'])
    # PWA / web
    save_png(down(rnd, 192), ic / 'icon-192.png')
    save_png(down(rnd, 512), ic / 'icon-512.png')
    save_png(down(m['mask'], 512), ic / 'maskable-512.png', rgb=True)
    save_png(down(full, 180), ic / 'apple-touch-icon.png', rgb=True)
    save_png(full, ic / 'store-1024.png', rgb=True)
    save_png(down(rnd, 32), ic / 'favicon-32.png')
    down(rnd, 256).save(pub / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    (ic / 'icon.svg').write_text(svg_wrapper(full), encoding='utf-8')
    (ic / 'icon-mono.svg').write_text(mono_svg(), encoding='utf-8')
    og(ic / 'og.png', rnd)
    # iOS: single 1024, opaque
    ios = ROOT / 'ios/App/App/Assets.xcassets/AppIcon.appiconset'
    if ios.exists():
        save_png(full, ios / 'AppIcon-512@2x.png', rgb=True)
    # Android
    res = ROOT / 'android/app/src/main/res'
    if res.exists():
        for dname, k in {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}.items():
            dd = res / f'mipmap-{dname}'
            legacy, layer = round(48 * k), round(108 * k)
            save_png(down(rnd, legacy), dd / 'ic_launcher.png')
            save_png(circle(down(full, legacy)), dd / 'ic_launcher_round.png')
            save_png(down(m['fg'], layer), dd / 'ic_launcher_foreground.png')
            save_png(down(m['bg'], layer), dd / 'ic_launcher_background.png', rgb=True)
            save_png(down(m['mono'], layer), dd / 'ic_launcher_monochrome.png')
    # Store
    try:
        save_png(down(full, 512).convert('RGBA'), OUT_STORE / 'icon-512.png')  # Play: 32-bit PNG, opaque, full-bleed
        save_png(full, OUT_STORE / 'app-store-icon-1024.png', rgb=True)  # App Store: no alpha channel
    except OSError as e:
        print('store icons skipped:', e)
    print('icons generated')


def og(path, rnd):
    w, h = 1200, 630
    im = radial_bg(w, h, (38, 40, 16), APP_BG, 760, cy=0.42).convert('RGBA')
    ic = down(rnd, 300)
    im.alpha_composite(ic, (90, (h - 300) // 2))
    d = ImageDraw.Draw(im)
    fm = font(MONO_FONTS, 76)
    draw_spaced(d, (454, 200), [('FILM ', CREAM), ('CAMELA', ORANGE)], fm, 76 * 0.12)
    fs = font(SANS_FONTS, 38)
    d.text((454, 318), 'Shoot like film.', font=fs, fill=(184, 176, 165))
    d.text((454, 368), 'Develop like a darkroom.', font=fs, fill=(184, 176, 165))
    save_png(im, path, rgb=True)


def splash(m):
    rnd = rounded(m['full'])
    files = []
    for d in ('ios/App/App/Assets.xcassets', 'android/app/src/main/res'):
        p = ROOT / d
        if p.exists():
            files += [f for f in p.rglob('*.png') if f.name.lower().startswith('splash')]
    for f in files:
        w, h = Image.open(f).size
        mn = min(w, h)
        im = radial_bg(w, h, (34, 36, 14), APP_BG, mn * 0.45).convert('RGBA')
        isz = round(mn * 0.26)
        fs = round(mn * 0.3 * 0.15)
        fnt = font(MONO_FONTS, max(fs, 6))
        sp = fs * 0.16
        tw = draw_spaced(None, (0, 0), [('FILM ', CREAM), ('CAMELA', ORANGE)], fnt, sp)
        gap = round(isz * 0.16)
        asc, desc = fnt.getmetrics()
        total = isz + gap + asc
        y0 = round(h / 2 - total / 2)
        im.alpha_composite(down(rnd, isz), (round((w - isz) / 2), y0))
        dr = ImageDraw.Draw(im)
        draw_spaced(dr, (round((w - tw) / 2), y0 + isz + gap), [('FILM ', CREAM), ('CAMELA', ORANGE)], fnt, sp)
        save_png(im, f, rgb=True)
    print(f'splash images: {len(files)}')


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    mm = masters()  # 'masters' mode stops here
    if mode in ('all', 'icons'):
        icons(mm)
    if mode in ('all', 'splash'):
        splash(mm)
