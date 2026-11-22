"""
Full-body "wrap" art for the landscape camera screen: the GPT camera backs (1536x1024, one pure-black window on
the left, plain body surface on the right) made wider for phone landscape screens.

  PYTHONIOENCODING=utf-8 python -X utf8 scripts/bodies/wrap.py [--src <folder>] [--out-w 1600] [--q 68] [--skip id,id]

For each <src>/<id>.png:
  1. find the black window (crop.find_window: max channel <= 6, shrunk ~1.5% inward, corner radius),
  2. keep only the rows that can show (the window takes WIN_SHARE of the screen height; most spare rows above it,
     for the top plate), then find a top-to-bottom seam right of the window through the plainest body (around a
     printed name, a dial, a screw), and insert a band of plain body along it until the image is RATIO (2.6:1). The band is built
     row strip by row strip from same-height patches of the plain body on the right (so a top plate, a chrome
     strip or a base plate keeps its height and runs straight through), patches picked at random among the
     plainest and crossfaded, so the repetition does not read as a pattern,
  3. write public/bodies/wrap/<id>.webp and the BODY_WRAP block of src/cameras/bodyWrapData.ts.
Also writes <src>/wrap_all.jpg: a labelled contact sheet of the composites with the window outlined.

Images that are not drawn yet are skipped (re-run as more arrive). --skip leaves ids out of the data (art that
must be redrawn: wrong name, window misplaced, buttons on the right…); those cameras keep the cropped layout.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
from crop import find_window, font  # noqa: E402

APP = Path(__file__).resolve().parents[2]
DEFAULT_SRC = Path(r"C:\Users\cole0\Desktop\클로드코드\_결과물\FilmCamela_풀바디_38")
RATIO = 2.6  # composite width / height: wider than any phone in landscape (863x360 = 2.4, notch shifts included)
# The app shows the art cover-fit by height (src/cameras/BodyWrap.tsx): the window takes WIN_SHARE of the screen
# height. Only the rows that can ever show are kept: the window plus (1 / WIN_SHARE - 1) of its height around it,
# TOP_SHARE of that above (the top plate with its printed name), the rest below.
WIN_SHARE = 0.66
TOP_SHARE = 0.8
STRIP = 40  # row strip height of the inserted band (px, source scale)
STRIP_OV = 14  # vertical feather between strips
SEAM = 28  # crossfade where the band meets the original image
# Images to leave out of the app data until they are redrawn (see the report of the last run).
# floppy98 (2026-11-21): the window was drawn wide and short (~2.4:1, 6-64% x 30-68%) with a disk slot under it;
# the preview would be small and the window too wide for the controls. Redraw it, then take it out of here.
SKIP: set[str] = set()


def detail_map(img: np.ndarray) -> np.ndarray:
    """Low-frequency detail: texture (leather grain, brushed metal) is blurred away first, so only printed
    names, dials, screws and edges score high."""
    g = img.astype(np.float32).mean(axis=2)
    g = ndimage.gaussian_filter(g, 4.5)
    gx = ndimage.sobel(g, axis=1)
    gy = ndimage.sobel(g, axis=0)
    # vertical edges (a name, a screw, a dial's side) matter more than horizontal ones (a plate edge runs
    # straight through the band and is fine)
    d = np.hypot(gx * 1.6, gy * 0.6)
    return ndimage.gaussian_filter(d, 6.0)


def feature_energy(d: np.ndarray, d_plain: float) -> np.ndarray:
    """Where the inserted band must not cut: edges (detail above the plain level), with the inside of every
    outlined thing filled (a button, a badge, a printed word), grown ~14 px; plus the raw detail as a tie-break."""
    edge = d > d_plain
    blobs = ndimage.binary_fill_holes(ndimage.binary_closing(edge, structure=np.ones((9, 9))))
    blobs = ndimage.binary_dilation(blobs, structure=np.ones((29, 29)))
    return blobs * 20.0 + d / d_plain


def insertion_seam(e: np.ndarray, x_lo: int, x_hi: int) -> np.ndarray:
    """A top-to-bottom path x0(y) through [x_lo, x_hi) of least energy (moves at most 1 px per row): the band is
    inserted along it, so it can slip between a dial and a screw on the top plate and still run down through
    plain body."""
    sub = e[:, x_lo:x_hi]
    h, w = sub.shape
    m = sub.copy()
    back = np.zeros((h, w), np.int8)
    for y in range(1, h):
        prev = m[y - 1]
        left = np.r_[np.inf, prev[:-1]]
        right = np.r_[prev[1:], np.inf]
        stack = np.vstack([left, prev, right])
        k = stack.argmin(axis=0)
        back[y] = k - 1
        m[y] += stack[k, np.arange(w)]
    xs = np.zeros(h, np.int64)
    xs[-1] = int(m[-1].argmin())
    for y in range(h - 1, 0, -1):
        xs[y - 1] = xs[y] + back[y, xs[y]]
    return xs + x_lo


def runs(mask: np.ndarray) -> list[tuple[int, int]]:
    idx = np.flatnonzero(mask)
    if not len(idx):
        return []
    parts = np.split(idx, np.flatnonzero(np.diff(idx) > 1) + 1)
    return [(int(p[0]), int(p[-1]) + 1) for p in parts]


def fill_strip(img: np.ndarray, d: np.ndarray, prof: np.ndarray, seam: np.ndarray, y0: int, y1: int, width: int, x_lo: int, x_hi: int, d_plain: float, rng: np.random.Generator) -> np.ndarray:
    """A (y1-y0) x width strip of plain body for rows y0..y1, from patches of the same rows in [x_lo, x_hi).

    A column may be used when it is plain (low detail) AND looks like the body at the insertion column x0 in
    these rows (its low-frequency colour profile matches), so a stripe, a plate edge or a dial further right
    is never copied in: structured rows end up repeating what is around x0, plain texture rows (leather,
    paper, plastic) draw from the whole right side for variety."""
    rows = img[y0:y1].astype(np.float32)
    ref = prof[np.arange(y0, y1), seam[y0:y1]]  # (rows, 3): the body along the seam
    x0 = int(np.median(seam[y0:y1]))
    diff = np.abs(prof[y0:y1, x_lo:x_hi] - ref[:, None, :]).mean(axis=2)  # (rows, cols)
    # a column passes when its profile matches on average and nowhere far off, and it has no feature
    # (the max over the strip's rows: a screw covering a few rows must not be averaged away)
    cost = np.maximum.reduce([diff.mean(axis=0) / 9.0, diff.max(axis=0) / 22.0, d[y0:y1, x_lo:x_hi].max(axis=0) / d_plain])
    ok = cost <= 1.0
    # the widest patch that fits in a passing run (big patches for texture, narrow ones between details)
    plain = [(a + x_lo, b + x_lo) for a, b in runs(ok)]
    longest = max((b - a for a, b in plain), default=0)
    if longest < 12:
        # nothing passes: stretch the few columns right at x0
        plain = [(max(x_lo, x0 - 6), min(x_hi, x0 + 6))]
        longest = plain[0][1] - plain[0][0]
    p = int(min(170, longest))
    ov = max(4, p // 3)  # horizontal crossfade
    cands = np.array([x for a, b in plain if b - a >= p for x in range(a, b - p + 1, 3)] or [plain[0][0]])
    out = np.zeros((y1 - y0, width + p, 3), np.float32)
    wsum = np.zeros((1, width + p, 1), np.float32)
    x = 0
    last = -10_000
    while x < width:
        choices = cands[np.abs(cands - last) > p] if len(cands) > 1 else cands
        if not len(choices):
            choices = cands
        sx = int(rng.choice(choices))
        last = sx
        patch = rows[:, sx:sx + p]
        w = np.ones(p, np.float32)
        ramp = np.linspace(0, 1, ov + 2)[1:-1]
        if x > 0:
            w[:ov] = ramp
        w[-ov:] = np.minimum(w[-ov:], ramp[::-1])
        out[:, x:x + p] += patch * w[None, :, None]
        wsum[:, x:x + p] += w[None, :, None]
        x += p - ov
    out = out / np.maximum(wsum, 1e-6)
    return out[:, :width]


def widen(img: np.ndarray, win: tuple, seed: int) -> tuple[np.ndarray, np.ndarray]:
    """img widened to RATIO by a plain band inserted right of the window along a seam; returns (image, seam x per row)."""
    h, w = img.shape[:2]
    target = int(round(h * RATIO))
    n = target - w
    if n <= 0:
        return img, np.full(h, w)
    d = detail_map(img)
    win_r = int((win[0] + win[2]) * w)
    x_lo = min(w - 80, win_r + int(0.05 * w))  # clear of the window's bevel
    x_hi = max(x_lo + 60, int(w * 0.94))
    # low-frequency colour (blurred mostly sideways): what a row looks like, without its texture
    prof = ndimage.gaussian_filter(img.astype(np.float32), sigma=(6, 24, 0))
    d_plain = float(np.percentile(d[:, x_lo:x_hi], 50)) * 3.0
    seam = insertion_seam(feature_energy(d, d_plain), x_lo, int(w * 0.9))
    rng = np.random.default_rng(seed)
    band_w = n + 2 * SEAM
    band = np.zeros((h, band_w, 3), np.float32)
    wsum = np.zeros((h, 1, 1), np.float32)
    y = 0
    step = STRIP - STRIP_OV
    while y < h:
        y0 = max(0, y - STRIP_OV)
        y1 = min(h, y + STRIP)
        s = fill_strip(img, d, prof, seam, y0, y1, band_w, x_lo, x_hi, d_plain, rng)
        wv = np.ones(y1 - y0, np.float32)
        if y0 > 0:
            wv[:STRIP_OV] = np.linspace(0, 1, STRIP_OV + 2)[1:-1]
        band[y0:y1] += s * wv[:, None, None]
        wsum[y0:y1] += wv[:, None, None]
        y += step
    band /= np.maximum(wsum, 1e-6)
    # each row: original left of the seam, the band, the original from the seam on; the band crossfades in
    # over SEAM px on both sides
    a = np.ones(band_w, np.float32)
    ramp = np.linspace(0, 1, SEAM + 2)[1:-1]
    a[:SEAM] = ramp
    a[-SEAM:] = ramp[::-1]
    out = np.zeros((h, target, 3), np.float32)
    src = img.astype(np.float32)
    for y in range(h):
        x0 = int(seam[y])
        out[y, :x0] = src[y, :x0]
        out[y, x0 + n:] = src[y, x0:]
        lo = x0 - SEAM
        out[y, lo:lo + band_w] = out[y, lo:lo + band_w] * (1 - a)[:, None] + band[y] * a[:, None]
    return np.clip(out, 0, 255).astype(np.uint8), seam


def visible_rows(img: np.ndarray, wy: float, wh: float) -> tuple[int, int]:
    """[top, bottom) rows kept around a window at wy (height wh): wh / WIN_SHARE rows, TOP_SHARE of the spare
    rows above the window (the top plate with the printed name and dials), the rest below; at least 2% of the
    image on each side of the window."""
    h = img.shape[0]
    v = min(h, wh / WIN_SHARE)
    margin = 0.02 * h
    extra = v - wh
    above = min(wy, max(margin, extra * TOP_SHARE))
    below = extra - above
    room_below = h - (wy + wh)
    if below > room_below:  # window drawn low: take the rest from above
        above = min(wy, above + below - room_below)
        below = room_below
    if below < margin and room_below >= margin:
        above -= margin - below
        below = margin
    return int(round(wy - above)), int(round(min(h, wy + wh + below)))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC)
    ap.add_argument("--out-w", type=int, default=1600)
    ap.add_argument("--q", type=int, default=68)
    ap.add_argument("--skip", default="")
    ap.add_argument("--only", default="", help="comma list: process just these ids (the data keeps the others)")
    ap.add_argument("--win-share", type=float, default=None, help="window share of the visible height (default WIN_SHARE)")
    args = ap.parse_args()
    global WIN_SHARE
    if args.win_share:
        WIN_SHARE = args.win_share
    skip = SKIP | {s for s in args.skip.split(",") if s}
    only = {s for s in args.only.split(",") if s}

    prompts = json.loads((args.src / "prompts.json").read_text(encoding="utf-8"))
    ids = [it["id"] for it in prompts["items"]]
    out_dir = APP / "public" / "bodies" / "wrap"
    out_dir.mkdir(parents=True, exist_ok=True)
    entries = read_ts() if only else {}
    thumbs = []
    missing = []
    for i, cam in enumerate(ids):
        src = args.src / f"{cam}.png"
        if not src.exists():
            missing.append(cam)
            continue
        if only and cam not in only:
            continue
        im = np.asarray(Image.open(src).convert("RGB"))
        try:
            win = find_window(im)
        except Exception as err:  # no black window
            print(f"{cam}: NO WINDOW ({err})")
            entries.pop(cam, None)
            continue
        h0, w0 = im.shape[:2]
        wx, wy, ww, wh, wr = win[0] * w0, win[1] * h0, win[2] * w0, win[3] * h0, win[4] * w0
        # rows that can show: crop them first (less to widen, less to ship)
        top, bottom = visible_rows(im, wy, wh)
        im = np.ascontiguousarray(im[top:bottom])
        wy -= top
        hc = bottom - top
        wide, seam = widen(im, (win[0], wy / hc, win[2], wh / hc), seed=1000 + i)
        H, W = wide.shape[:2]
        # window in px (unchanged by the insertion: it is left of the seam), as fractions of the composite
        pil = Image.fromarray(wide)
        if W > args.out_w:
            pil = pil.resize((args.out_w, round(H * args.out_w / W)), Image.LANCZOS)
        frac = [round(v, 4) for v in (wx / W, wy / H, ww / W, wh / H, wr / W)]
        thumbs.append((cam, pil, frac, seam / W))
        if cam in skip:
            print(f"{cam}: skipped (--skip)")
            entries.pop(cam, None)
            continue
        pil.save(out_dir / f"{cam}.webp", "WEBP", quality=args.q, method=6)
        entries[cam] = {"w": pil.width, "h": pil.height, "win": frac}
        kb = (out_dir / f"{cam}.webp").stat().st_size / 1024
        print(f"{cam:10s} {pil.width}x{pil.height} seam@{int(seam.min())}-{int(seam.max())}px win x={frac[0]:.3f} y={frac[1]:.3f} w={frac[2]:.3f} h={frac[3]:.3f} r={frac[4]:.4f} {kb:.0f} KB")

    # stale files of cameras left out
    for f in out_dir.glob("*.webp"):
        if f.stem not in entries:
            f.unlink()
    # --only updates a few cameras in place: keep every other entry (and the existing order).
    ordered = dict(entries) if only else {c: entries[c] for c in ids if c in entries}
    write_ts(ordered)
    if thumbs:
        contact(thumbs, args.src / "wrap_all.jpg")
    total = sum(f.stat().st_size for f in out_dir.glob("*.webp"))
    print(f"{len(ordered)} wrap images, public/bodies/wrap = {total / 1024:.0f} KB")
    if missing:
        print("not drawn yet:", ",".join(missing))
    return 0


TS = APP / "src" / "cameras" / "bodyWrapData.ts"
HEADER = '''/**
 * Full-body "wrap" art per camera for the landscape camera screen (GPT-drawn camera backs, widened to 2.6:1 and cropped to the rows that
 * show by scripts/bodies/wrap.py): the whole screen is the camera back, the live preview sits in its black window and
 * the controls are mounted on the plain body to the right. `win` is the black window as fractions of the image
 * (x, y = top-left corner; r = corner radius as a fraction of the image width). A camera without an entry keeps
 * the cropped body art (bodyArtData.ts) in landscape. Portrait always uses the cropped art.
 */
export interface BodyWrapEntry {
  src: string;
  /** Natural size of the image in px. */
  w: number;
  h: number;
  win: { x: number; y: number; w: number; h: number; r: number };
}

'''
FOOTER = '''

export function bodyWrapFor(cameraId: string): BodyWrapEntry | undefined {
  return BODY_WRAP[cameraId];
}
'''


def read_ts() -> dict:
    if not TS.exists():
        return {}
    out = {}
    for m in re.finditer(r"  (\w+): \{ src: '[^']+', w: (\d+), h: (\d+), win: \{ x: ([\d.]+), y: ([\d.]+), w: ([\d.]+), h: ([\d.]+), r: ([\d.]+) \} \},", TS.read_text(encoding="utf-8")):
        out[m[1]] = {"w": int(m[2]), "h": int(m[3]), "win": [float(m[i]) for i in range(4, 9)]}
    return out


def write_ts(entries: dict) -> None:
    lines = []
    for cam, e in entries.items():
        x, y, w, h, r = e["win"]
        lines.append(f"  {cam}: {{ src: './bodies/wrap/{cam}.webp', w: {e['w']}, h: {e['h']}, win: {{ x: {x}, y: {y}, w: {w}, h: {h}, r: {r} }} }},")
    body = "export const BODY_WRAP: Record<string, BodyWrapEntry> = {\n  // GENERATED by scripts/bodies/wrap.py — do not edit by hand\n" + "\n".join(lines) + "\n};"
    TS.write_text(HEADER + body + FOOTER, encoding="utf-8")


def contact(thumbs, path: Path) -> None:
    tw, cols = 600, 4
    th = 250
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 30)), (24, 24, 24))
    d = ImageDraw.Draw(sheet)
    f = font(22)
    for i, (cam, pil, win, ins) in enumerate(thumbs):
        t = pil.copy()
        t.thumbnail((tw - 10, th - 8))
        ox = (i % cols) * tw + (tw - t.width) // 2
        oy = (i // cols) * (th + 30) + (th - t.height) // 2
        sheet.paste(t, (ox, oy))
        x, y, w, h, r = win
        d.rounded_rectangle([ox + x * t.width, oy + y * t.height, ox + (x + w) * t.width, oy + (y + h) * t.height], radius=r * t.width, outline=(255, 40, 160), width=2)
        ys = np.linspace(0, len(ins) - 1, 24).astype(int)
        d.line([(ox + ins[y] * t.width, oy + y / len(ins) * t.height) for y in ys], fill=(80, 220, 255), width=1)
        d.text(((i % cols) * tw + 8, (i // cols) * (th + 30) + th + 2), cam, fill=(255, 255, 255), font=f)
    sheet.save(path, quality=86)


if __name__ == "__main__":
    sys.exit(main())
