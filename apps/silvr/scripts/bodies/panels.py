"""
Full-body "wrap" art for the landscape camera screen, shown as a 3-slice (src/cameras/BodyWrap.tsx).

  PYTHONIOENCODING=utf-8 python -X utf8 scripts/bodies/panels.py [--src <folder>] [--q 75] [--skip id,id] [--no-legacy]

GPT draws three cameras per PORTRAIT sheet (<src>/sheet_<idA>_<idB>_<idC>.png, ids also in prompts2.json `cams`,
top to bottom): ~2.1:1 landscape panels stacked with white gutters. For every sheet that exists:
  1. cut it into panels by the white gutters, trim the white margins → <src>/panels/<id>.png (panels already
     there from other sheets are kept),
then for every panel:
  2. find the black window (crop.find_window),
  3. find a STRAIGHT vertical strip of plain body (2–5% of the width) between the window's bevel and the
     right-hand details, plain in EVERY row (the top plate included: no screw, letter or dial edge inside it).
     The app draws LEFT [0, s0) with the window, MIDDLE [s0, s1) mirrored-tiled to fill any screen width, and
     RIGHT [s1, W) with the right-hand dials anchored to the screen's right edge,
  4. find where the plain body starts right of the window (`top`: the top plate, its dials and any corner
     bracket end above it): the app's controls start below it,
  5. write public/bodies/wrap/<id>.webp (native width, ~1024) and the BODY_WRAP block of
     src/cameras/bodyWrapData.ts: { src, w, h, win, slice: { l: s0/W, r: (W-s1)/W }, top }.
Cameras with no panel yet keep their previous wrap image (wrap.py, 2.6:1), kept in <src>/legacy_wrap/<id>.webp
with its window in legacy_wrap/legacy.json: it is copied to public and the same slice / top search runs on it
(--no-legacy drops them; they then fall back to the cropped body art). --skip leaves panels out (art that must be redrawn: wrong printed
name, cut top plate, misplaced window): those cameras keep their legacy wrap if there is one.

Also writes <src>/panels_all.jpg: a labelled contact sheet (window = magenta, slice = cyan, top = yellow,
NEW = from a panel, old = legacy wrap).
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
DEFAULT_SRC = Path(r"C:\Users\cole0\Desktop\클로드코드\_결과물\FilmCamela_풀바디_테스트3")
OUT = APP / "public" / "bodies" / "wrap"
TS = APP / "src" / "cameras" / "bodyWrapData.ts"
# Panels to leave out until they are redrawn (see the report of the last run): they keep the legacy wrap.
# 2026-11-21: twin66 (the body does not fill the panel: a TLR face on a dark backdrop, its top cut), spy8 and
# webcam02 (drawn ~1.35:1 with a near-square window, not ~2.1:1).
SKIP: set[str] = set()
STRIP_MIN, STRIP_MAX = 0.02, 0.05  # strip width, fraction of the panel width
WIN_SHARE = 0.66  # the window takes at most this share of the art's height (= of the screen's height)
WIN_BELOW = 0.04  # least body kept under the window (fraction of the panel height)


# ----------------------------------------------------------------------------------------------- sheets → panels
def is_white_row(img: np.ndarray) -> np.ndarray:
    """Rows of a gutter / margin: almost every pixel near pure white (cream plastic is not: its blue is lower)."""
    lo = img.min(axis=2)
    return (lo >= 236).mean(axis=1) >= 0.985


def runs(mask: np.ndarray) -> list[tuple[int, int]]:
    idx = np.flatnonzero(mask)
    if not len(idx):
        return []
    parts = np.split(idx, np.flatnonzero(np.diff(idx) > 1) + 1)
    return [(int(p[0]), int(p[-1]) + 1) for p in parts]


def cut_sheet(img: np.ndarray, n: int) -> list[np.ndarray]:
    """The n panels of a sheet, top to bottom, white margins trimmed."""
    h = img.shape[0]
    segs = [r for r in runs(~is_white_row(img)) if r[1] - r[0] >= 24]
    # stray non-white specks in a gutter split a panel: merge across the smallest gaps until n remain
    while len(segs) > n:
        gaps = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]
        i = int(np.argmin(gaps))
        segs[i : i + 2] = [(segs[i][0], segs[i + 1][1])]
    if len(segs) != n:
        raise ValueError(f"found {len(segs)} panels, expected {n}")
    out = []
    for y0, y1 in segs:
        p = img[y0:y1]
        lo = p.min(axis=2)
        cols = (lo >= 236).mean(axis=0) < 0.985
        xs = np.flatnonzero(cols)
        p = p[:, xs[0] : xs[-1] + 1]
        # a thin anti-aliased white line can remain at the cut: drop rows / cols that are mostly white
        lo = p.min(axis=2)
        rows = np.flatnonzero((lo >= 230).mean(axis=1) < 0.6)
        cols = np.flatnonzero((lo >= 230).mean(axis=0) < 0.6)
        p = p[rows[0] : rows[-1] + 1, cols[0] : cols[-1] + 1]
        if p.shape[0] < h * 0.12:
            raise ValueError(f"panel too short ({p.shape[0]} px)")
        out.append(np.ascontiguousarray(p))
    return out


# ------------------------------------------------------------------------------------------------ slice + top
def detail_map(img: np.ndarray) -> np.ndarray:
    """Low-frequency detail: fine texture (leather grain, brushed metal, wood grain) is blurred away, so screws,
    letters, dial edges and plate edges score high. Vertical edges count more (a horizontal plate edge runs
    straight through a vertical strip and repeats seamlessly; a screw or a letter does not)."""
    g = img.astype(np.float32).mean(axis=2)
    g = ndimage.gaussian_filter(g, 2.2)
    gx = ndimage.sobel(g, axis=1)
    gy = ndimage.sobel(g, axis=0)
    d = np.hypot(gx * 1.5, gy * 0.35)
    return ndimage.gaussian_filter(d, 1.5)


def find_slice(img: np.ndarray, win: tuple) -> tuple[int, int, float]:
    """(s0, s1, cost): the plainest straight strip right of the window bevel, in px."""
    h, w = img.shape[:2]
    d = detail_map(img)
    win_r = (win[0] + win[2]) * w
    x_lo = int(win_r + 0.035 * w)  # clear of the window's bevel / frame
    x_hi = int(w * 0.92)
    body = d[int((win[1] + 0.05) * h) : int((win[1] + win[3] - 0.05) * h), x_lo:x_hi]
    ref = float(np.median(body)) + 1e-3
    # the strip's colour must not drift across it either (a highlight, a vignette: mirrored tiles would zigzag)
    lum = ndimage.gaussian_filter(img.astype(np.float32).mean(axis=2), (3, 6))
    best = None
    for frac in np.linspace(STRIP_MAX, STRIP_MIN, 7):
        sw = max(8, int(round(frac * w)))
        dmax = ndimage.maximum_filter1d(d, sw, axis=1, origin=-(sw // 2))  # max over [x, x+sw)
        for x in range(x_lo, x_hi - sw, 2):
            col = dmax[:, x]
            # every row counts: the worst rows (the top plate) decide
            c = float(np.percentile(col, 99.5)) / ref
            drift = float(np.percentile(np.abs(lum[:, x + sw - 1] - lum[:, x]), 98)) / 12.0
            # a little preference for wider strips and for strips in the middle of the free body
            mid = abs((x + sw / 2) - (x_lo + x_hi) / 2) / (x_hi - x_lo)
            cost = c + drift + 0.15 * mid - 1.6 * frac / STRIP_MAX
            if best is None or cost < best[2]:
                best = (x, x + sw, cost)
    return best


def find_top(img: np.ndarray, win: tuple, s0: int) -> float:
    """Where the plain body starts right of the window (fraction of the height): the lowest row above the window's
    top (+5%) that still has a feature (plate edge, dial, bracket, name) between the strip and the right edge
    (the outermost 4.5% left out: corner screws)."""
    h, w = img.shape[:2]
    d = detail_map(img)
    x0, x1 = s0, int(w * 0.955)
    wy = win[1] * h
    body = d[int(wy + 0.08 * h) : int((win[1] + win[3] - 0.05) * h), x0:x1]
    thr = float(np.percentile(body, 99)) * 1.6 + 1e-3
    lim = int(min(h - 1, wy + 0.05 * h))
    feat = d[:lim, x0:x1].max(axis=1) > thr
    ys = np.flatnonzero(feat)
    if not len(ys):
        return round(max(0.0, win[1] - 0.04), 4)
    y = ys[-1] + 0.01 * h
    # never much above the window's top (a body with no separate plate: its printing runs down the right side)
    return round(float(min(max(y, wy - 0.02 * h), wy + 0.05 * h)) / h, 4)


def find_keep(img: np.ndarray, win: tuple, s1: int, top: float) -> float:
    """How much of RIGHT must always show (fraction of the width, from the right edge): from the leftmost feature
    of the top plate right of the strip (a dial, a screw, the end of the name). Plain body between the strip and
    that may slide under LEFT's window bevel on a narrow screen."""
    h, w = img.shape[:2]
    d = detail_map(img)
    wy = win[1] * h
    body = d[int(wy + 0.08 * h) : int((win[1] + win[3] - 0.05) * h), s1:int(w * 0.955)]
    thr = float(np.percentile(body, 99)) * 1.6 + 1e-3
    rows = d[: max(2, int(top * h)), s1:]
    xs = np.flatnonzero(rows.max(axis=0) > thr)
    xk = s1 + (int(xs[0]) if len(xs) else int(0.85 * (w - s1)))
    return round(min((w - s1) / w, (w - xk) / w + 0.012), 4)


def crop_bottom(img: np.ndarray, win: tuple) -> tuple[np.ndarray, tuple]:
    """Drop spare body rows under the window (the art is scaled to the screen's height: every row there makes
    the preview smaller): keep WIN_BELOW of the height under it, or more if the window would take over
    WIN_SHARE of the height. The top plate is never cropped."""
    h = img.shape[0]
    wy, wh = win[1] * h, win[3] * h
    keep = int(round(max(wy + wh + WIN_BELOW * h, wh / WIN_SHARE)))
    if keep >= h - 2:
        return img, win
    # only plain body may go: anything drawn under the window (a keyboard, a grille, a label) stays, and so
    # does everything (the body's bottom edge with it)
    d = detail_map(img)
    x0, x1 = int(win[0] * img.shape[1]), int((win[0] + win[2]) * img.shape[1])
    below = d[int(wy + wh + 0.03 * h) : int(h * 0.93), x0:x1]
    ref = float(np.median(d[int(wy + 0.1 * h) : int(wy + wh - 0.1 * h), int(x1 + 0.05 * img.shape[1]) :])) + 1e-3
    if below.size and float(np.percentile(below.max(axis=1), 90)) > 6 * ref:
        return img, win
    img = np.ascontiguousarray(img[:keep])
    return img, find_window(img)


# -------------------------------------------------------------------------------------------------------- data
HEADER = '''/**
 * Full-body "wrap" art per camera for the landscape camera screen (GPT-drawn camera backs, ~2.1:1, by
 * scripts/bodies/panels.py): the whole screen is the camera back, the live preview sits in its black window and
 * the controls are mounted on the plain body to the right. The art is drawn as a 3-slice, scaled to the screen's
 * height: LEFT (the window) anchored at the left edge, RIGHT (the right-hand dials and the end of the top plate)
 * anchored at the right edge, MIDDLE (a straight strip of plain body) mirrored-tiled in between.
 *   win    the black window as fractions of the image (x, y = top-left corner; r = corner radius, fraction of the width)
 *   slice  l = s0 / w (LEFT's width), r = (w - s1) / w (RIGHT's width); the MIDDLE strip is [s0, s1);
 *          k = the part of RIGHT that always shows (the top plate's right-hand details; k <= r): on a narrow screen
 *          the plain body left of it may slide under LEFT's window bevel
 *   top    where the plain body starts right of the window (fraction of the height): the controls start below it
 * A camera without an entry keeps the cropped body art (bodyArtData.ts) in landscape. Portrait always uses the
 * cropped art.
 */
export interface BodyWrapEntry {
  src: string;
  /** Natural size of the image in px. */
  w: number;
  h: number;
  win: { x: number; y: number; w: number; h: number; r: number };
  slice: { l: number; r: number; k: number };
  top: number;
}

'''
FOOTER = '''

export function bodyWrapFor(cameraId: string): BodyWrapEntry | undefined {
  return BODY_WRAP[cameraId];
}
'''


def read_ts() -> dict:
    """Current entries (old format without slice/top too): id → {w, h, win}."""
    if not TS.exists():
        return {}
    out = {}
    pat = r"  (\w+): \{ src: '[^']+', w: (\d+), h: (\d+), win: \{ x: ([\d.]+), y: ([\d.]+), w: ([\d.]+), h: ([\d.]+), r: ([\d.]+) \}"
    for m in re.finditer(pat, TS.read_text(encoding="utf-8")):
        out[m[1]] = {"w": int(m[2]), "h": int(m[3]), "win": [float(m[i]) for i in range(4, 9)]}
    return out


def write_ts(entries: dict) -> None:
    lines = []
    for cam, e in entries.items():
        x, y, w, h, r = e["win"]
        lines.append(
            f"  {cam}: {{ src: './bodies/wrap/{cam}.webp', w: {e['w']}, h: {e['h']}, win: {{ x: {x}, y: {y}, w: {w}, h: {h}, r: {r} }}, "
            f"slice: {{ l: {e['slice'][0]}, r: {e['slice'][1]}, k: {e['slice'][2]} }}, top: {e['top']} }},"
        )
    body = "export const BODY_WRAP: Record<string, BodyWrapEntry> = {\n  // GENERATED by scripts/bodies/panels.py — do not edit by hand\n" + "\n".join(lines) + "\n};"
    TS.write_text(HEADER + body + FOOTER, encoding="utf-8")


def contact(thumbs, path: Path) -> None:
    tw, th, cols = 640, 330, 4
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 34)), (24, 24, 24))
    d = ImageDraw.Draw(sheet)
    f = font(22)
    for i, (cam, pil, win, sl, top, tag) in enumerate(thumbs):
        t = pil.copy()
        t.thumbnail((tw - 12, th - 8))
        ox = (i % cols) * tw + (tw - t.width) // 2
        oy = (i // cols) * (th + 34) + (th - t.height) // 2
        sheet.paste(t, (ox, oy))
        x, y, w, h, r = win
        d.rounded_rectangle([ox + x * t.width, oy + y * t.height, ox + (x + w) * t.width, oy + (y + h) * t.height], radius=r * t.width, outline=(255, 40, 160), width=2)
        for fx in (sl[0], 1 - sl[1]):
            d.line([(ox + fx * t.width, oy), (ox + fx * t.width, oy + t.height)], fill=(60, 230, 255), width=2)
        d.line([(ox + sl[0] * t.width, oy + top * t.height), (ox + t.width, oy + top * t.height)], fill=(255, 220, 40), width=1)
        col = (255, 255, 255) if tag == "NEW" else (170, 170, 170)
        d.text(((i % cols) * tw + 8, (i // cols) * (th + 34) + th + 4), f"{cam}  [{tag}]  {pil.width}x{pil.height}", fill=col, font=f)
    sheet.save(path, quality=86)


# -------------------------------------------------------------------------------------------------------- main
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC)
    ap.add_argument("--q", type=int, default=75)
    ap.add_argument("--skip", default="")
    ap.add_argument("--no-legacy", action="store_true")
    args = ap.parse_args()
    skip = SKIP | {s for s in args.skip.split(",") if s}
    pdir = args.src / "panels"
    pdir.mkdir(parents=True, exist_ok=True)

    # 1. sheets → panels
    sheets = {}
    pj = args.src / "prompts2.json"
    if pj.exists():
        for it in json.loads(pj.read_text(encoding="utf-8"))["items"]:
            sheets[it["id"]] = it["cams"]
    for f in sorted(args.src.glob("sheet_*.png")):
        cams = sheets.get(f.stem) or f.stem.split("_")[1:]
        try:
            parts = cut_sheet(np.asarray(Image.open(f).convert("RGB")), len(cams))
        except ValueError as err:
            print(f"{f.name}: NOT CUT ({err})")
            continue
        for cam, p in zip(cams, parts):
            Image.fromarray(p).save(pdir / f"{cam}.png")
        print(f"{f.name}: " + ", ".join(f"{c} {p.shape[1]}x{p.shape[0]}" for c, p in zip(cams, parts)))

    # camera order of the app
    models = (APP / "src" / "cameras" / "models.ts").read_text(encoding="utf-8")
    ids = re.findall(r"^    id: '(\w+)',", models, re.M)
    lj = args.src / "legacy_wrap" / "legacy.json"
    old = json.loads(lj.read_text(encoding="utf-8")) if lj.exists() else {}
    OUT.mkdir(parents=True, exist_ok=True)
    entries, thumbs, legacy, missing = {}, [], [], []
    for cam in ids:
        src = pdir / f"{cam}.png"
        if src.exists() and cam not in skip:
            im = np.asarray(Image.open(src).convert("RGB"))
            try:
                win = find_window(im)
            except Exception as err:
                print(f"{cam}: NO WINDOW ({err})")
                im = None
            if im is not None:
                im, win = crop_bottom(im, win)
                tag = "NEW"
                pil = Image.fromarray(im)
                pil.save(OUT / f"{cam}.webp", "WEBP", quality=args.q, method=6)
        else:
            im = None
        if im is None:
            f = args.src / "legacy_wrap" / f"{cam}.webp"
            if args.no_legacy or cam not in old or not f.exists():
                missing.append(cam)
                continue
            (OUT / f"{cam}.webp").write_bytes(f.read_bytes())
            pil = Image.open(f).convert("RGB")
            im = np.asarray(pil)
            win = tuple(old[cam]["win"])
            tag = "old"
            legacy.append(cam)
        h, w = im.shape[:2]
        s0, s1, cost = find_slice(im, win)
        top = find_top(im, win, s0)
        keep = find_keep(im, win, s1, top)
        frac = [round(float(v), 4) for v in win]
        sl = (round(s0 / w, 4), round((w - s1) / w, 4), keep)
        entries[cam] = {"w": w, "h": h, "win": frac, "slice": sl, "top": top}
        thumbs.append((cam, pil, frac, sl, top, tag))
        kb = (OUT / f"{cam}.webp").stat().st_size / 1024
        print(
            f"{cam:10s} [{tag}] {w}x{h} ({w / h:.2f}:1) win x={frac[0]:.3f}-{frac[0] + frac[2]:.3f} y={frac[1]:.3f}-{frac[1] + frac[3]:.3f} "
            f"strip {s0}-{s1} ({(s1 - s0) / w * 100:.1f}%, cost {cost:.2f}) keep={keep:.3f}/{sl[1]:.3f} top={top:.3f} {kb:.0f} KB"
        )

    for f in OUT.glob("*.webp"):
        if f.stem not in entries:
            f.unlink()
    write_ts(entries)
    if thumbs:
        contact(thumbs, args.src / "panels_all.jpg")
    total = sum(f.stat().st_size for f in OUT.glob("*.webp"))
    print(f"{len(entries)} wrap images ({len(entries) - len(legacy)} new), public/bodies/wrap = {total / 1024:.0f} KB")
    if legacy:
        print("legacy wrap (no new panel yet):", ",".join(legacy))
    if missing:
        print("no wrap (cropped art):", ",".join(missing))
    return 0


if __name__ == "__main__":
    sys.exit(main())
