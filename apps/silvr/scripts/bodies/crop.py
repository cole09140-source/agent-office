"""
Cut the GPT camera-body sheets (2x2 panels, white gutters) into one image per camera and find the black
viewfinder window inside each.

  PYTHONIOENCODING=utf-8 python -X utf8 scripts/bodies/crop.py [--src <sheet folder>] [--max-w 720] [--q 80]

Writes
  public/bodies/<id>.webp                 app art (alternates *_alt are skipped)
  <src>/crops/<id>.png                    every crop, alternates included, full size
  <src>/crops/_all.jpg                    labelled contact sheet with the detected window outlined
  src/cameras/bodyArtData.ts                  BODY_ART entries (the block between the GENERATED markers)

Sheets that do not exist yet are skipped, so it can be re-run as more sheets arrive.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

APP = Path(__file__).resolve().parents[2]
DEFAULT_SRC = Path(r"C:\Users\cole0\Desktop\클로드코드\_결과물\FilmCamela_카메라몸체_38")

# If a sheet's panels do not match prompts.json (the model name printed on each body wins), list the ids
# here in panel order: top-left, top-right, bottom-left, bottom-right.
OVERRIDE: dict[str, list[str]] = {}

WHITE = 238  # mean brightness of a gutter / margin line
BLACK = 6  # max channel of a window pixel (the window is drawn #000; dark bezels such as a phone glass sit at 10+)


def gutter(profile: np.ndarray, lo: float, hi: float) -> tuple[int, int]:
    """[start, end) of the white run nearest the middle of a brightness profile, searched within [lo, hi)."""
    n = len(profile)
    a, b = int(n * lo), int(n * hi)
    white = profile[a:b] >= WHITE
    if not white.any():
        mid = n // 2
        return mid, mid
    idx = np.flatnonzero(white) + a
    # group consecutive indices, pick the run closest to the centre
    runs = np.split(idx, np.flatnonzero(np.diff(idx) > 1) + 1)
    run = min(runs, key=lambda r: abs((r[0] + r[-1]) / 2 - n / 2))
    return int(run[0]), int(run[-1]) + 1


def trim_white(img: np.ndarray) -> tuple[int, int, int, int]:
    """Bounding box (x0, y0, x1, y1) after dropping near-white rows/cols at the edges."""
    g = img.mean(axis=2)
    rows = g.mean(axis=1) < WHITE
    cols = g.mean(axis=0) < WHITE
    ys, xs = np.flatnonzero(rows), np.flatnonzero(cols)
    return int(xs[0]), int(ys[0]), int(xs[-1]) + 1, int(ys[-1]) + 1


def find_window(img: np.ndarray) -> tuple[float, float, float, float, float]:
    """Black window rect as fractions (x, y, w, h) plus its corner radius r, all as fractions of the image
    (r of the image width)."""
    h, w = img.shape[:2]
    black = img.max(axis=2) <= BLACK
    # drop texture speckle (black leatherette) so it cannot bridge into the window
    k = max(3, min(h, w) // 60)
    solid = ndimage.binary_opening(black, structure=np.ones((k, k)))
    lab, n = ndimage.label(solid)
    if n == 0:
        raise ValueError("no black region")
    # the component covering the most of the central area (middle 30% x 30%)
    cy0, cy1, cx0, cx1 = int(h * 0.35), int(h * 0.65), int(w * 0.35), int(w * 0.65)
    centre = lab[cy0:cy1, cx0:cx1]
    counts = np.bincount(centre.ravel(), minlength=n + 1)
    counts[0] = 0
    comp = lab == int(counts.argmax())
    ys, xs = np.nonzero(comp)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    # tight rect: rows / cols that are almost fully black across the component's span (drops rounded corners
    # and any stray bulge of the mask)
    sub = black[y0:y1, x0:x1]
    rows = np.flatnonzero(sub.mean(axis=1) >= 0.92)
    cols = np.flatnonzero(sub.mean(axis=0) >= 0.92)
    ry0, ry1 = y0 + rows[0], y0 + rows[-1] + 1
    rx0, rx1 = x0 + cols[0], x0 + cols[-1] + 1
    # shrink inward ~1.5% of the window so no grey bevel shows at the edge
    sx = round((rx1 - rx0) * 0.015) + 1
    sy = round((ry1 - ry0) * 0.015) + 1
    rx0, rx1, ry0, ry1 = rx0 + sx, rx1 - sx, ry0 + sy, ry1 - sy
    # corner radius: for an arc tangent to both edges, the diagonal gap from the bbox corner to the arc is
    # r(sqrt2 - 1); measured at all four corners, then made concentric with the shrunk rect
    gaps = []
    for cx, cy, dx, dy in ((x0, y0, 1, 1), (x1 - 1, y0, -1, 1), (x0, y1 - 1, 1, -1), (x1 - 1, y1 - 1, -1, -1)):
        t = 0
        while t < min(x1 - x0, y1 - y0) // 4 and not comp[cy + dy * t, cx + dx * t]:
            t += 1
        gaps.append(t)
    radius = float(np.median(gaps)) * np.sqrt(2) / (np.sqrt(2) - 1)
    inset = ((rx0 - x0) + (x1 - rx1) + (ry0 - y0) + (y1 - ry1)) / 4
    r_eff = max(0.0, radius - inset)
    return rx0 / w, ry0 / h, (rx1 - rx0) / w, (ry1 - ry0) / h, r_eff / w


def font(size: int):
    for f in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC)
    ap.add_argument("--max-w", type=int, default=720)
    ap.add_argument("--q", type=int, default=80)
    args = ap.parse_args()

    prompts = json.loads((args.src / "prompts.json").read_text(encoding="utf-8"))
    crops_dir = args.src / "crops"
    crops_dir.mkdir(exist_ok=True)
    out_dir = APP / "public" / "bodies"
    out_dir.mkdir(parents=True, exist_ok=True)

    entries: dict[str, dict] = {}
    thumbs: list[tuple[str, Image.Image, tuple]] = []
    for item in prompts["items"]:
        sheet = args.src / f"{item['id']}.png"
        if not sheet.exists():
            print(f"{item['id']}: not there yet")
            continue
        ids = OVERRIDE.get(item["id"], item["cams"])
        im = np.asarray(Image.open(sheet).convert("RGB"))
        H, W = im.shape[:2]
        g = im.mean(axis=2)
        gx0, gx1 = gutter(g.mean(axis=0), 0.4, 0.6)
        gy0, gy1 = gutter(g.mean(axis=1), 0.4, 0.6)
        boxes = [(0, 0, gx0, gy0), (gx1, 0, W, gy0), (0, gy1, gx0, H), (gx1, gy1, W, H)]
        for cam, (bx0, by0, bx1, by1) in zip(ids, boxes):
            panel = im[by0:by1, bx0:bx1]
            tx0, ty0, tx1, ty1 = trim_white(panel)
            panel = panel[ty0:ty1, tx0:tx1]
            win = find_window(panel)
            pil = Image.fromarray(panel)
            pil.save(crops_dir / f"{cam}.png")
            thumbs.append((cam, pil, win))
            if cam.endswith("_alt"):
                continue
            ph, pw = panel.shape[:2]
            if pw > args.max_w:
                pil = pil.resize((args.max_w, round(ph * args.max_w / pw)), Image.LANCZOS)
            pil.save(out_dir / f"{cam}.webp", "WEBP", quality=args.q, method=6)
            entries[cam] = {"w": pil.width, "h": pil.height, "win": [round(v, 4) for v in win]}
            print(f"{item['id']} {cam:10s} {pil.width}x{pil.height} win x={win[0]:.3f} y={win[1]:.3f} w={win[2]:.3f} h={win[3]:.3f} r={win[4] * pil.width:.1f}px")

    write_ts(entries)
    contact(thumbs, crops_dir / "_all.jpg")
    total = sum(f.stat().st_size for f in out_dir.glob("*.webp"))
    print(f"{len(entries)} app images, public/bodies = {total / 1024:.0f} KB")
    return 0


def write_ts(entries: dict[str, dict]) -> None:
    ts = APP / "src" / "cameras" / "bodyArtData.ts"
    text = ts.read_text(encoding="utf-8")
    lines = []
    for cam, e in entries.items():
        x, y, w, h, r = e["win"]
        lines.append(f"  {cam}: {{ src: './bodies/{cam}.webp', w: {e['w']}, h: {e['h']}, win: {{ x: {x}, y: {y}, w: {w}, h: {h}, r: {r} }} }},")
    block = "export const BODY_ART: Record<string, BodyArtEntry> = {\n  // GENERATED by scripts/bodies/crop.py — do not edit by hand\n" + "\n".join(lines) + "\n};"
    new, n = re.subn(r"export const BODY_ART: Record<string, BodyArtEntry> = \{.*?\n?\};", lambda _: block, text, count=1, flags=re.S)
    if n != 1:
        raise SystemExit("BODY_ART block not found in bodyArtData.ts")
    ts.write_text(new, encoding="utf-8")


def contact(thumbs, path: Path) -> None:
    if not thumbs:
        return
    tw, cols = 360, 6
    th = 270
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 28)), (24, 24, 24))
    d = ImageDraw.Draw(sheet)
    f = font(20)
    for i, (cam, pil, win) in enumerate(thumbs):
        t = pil.copy()
        t.thumbnail((tw - 8, th - 8))
        ox = (i % cols) * tw + (tw - t.width) // 2
        oy = (i // cols) * (th + 28) + (th - t.height) // 2
        sheet.paste(t, (ox, oy))
        x, y, w, h, r = win
        d.rounded_rectangle([ox + x * t.width, oy + y * t.height, ox + (x + w) * t.width, oy + (y + h) * t.height], radius=r * t.width, outline=(255, 40, 160), width=2)
        d.text(((i % cols) * tw + 8, (i // cols) * (th + 28) + th), cam, fill=(255, 255, 255), font=f)
    sheet.save(path, quality=86)


if __name__ == "__main__":
    sys.exit(main())
