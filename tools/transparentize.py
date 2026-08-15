"""Flood-fill chroma-key: opaque cream-background JPG -> transparent PNG.

    python tools/transparentize.py [file-or-dir] [tolerance]

The vox bed plates float over the paper background, so an opaque cream
rectangle around a subject is a render error. Generate on a flat solid cream
field (#F4F1EA-ish), then run this once per batch.

What it does, properly:

  1. BACKGROUND ESTIMATE — samples a ring of border pixels (not just four
     corners) and clusters them; the dominant cluster is the background. A
     subject touching one edge cannot poison the estimate, and a mildly
     textured field still clusters to one mean.
  2. ADAPTIVE TOLERANCE — the flood-fill threshold is derived from the
     background's own variance (3 sigma + 20, clamped 30..70), so a grainy
     field cuts cleanly while a subject with near-cream highlights survives.
  3. FLOOD FILL — BFS from every border pixel; pixels within tolerance are
     removed. Interior pockets of the same colour stay (a paper cutout keeps
     its holes).
  4. FEATHER — the alpha mask gets a 1.2px Gaussian blur so edges are soft,
     never a hard staircase.
  5. DESPILL — for every semi-transparent edge pixel the background colour is
     mathematically removed (unpremultiply against the mask), so no cream
     fringe or halo survives around the subject.

  * file-or-dir: a bed-*.jpg, or the video/public/img directory (default).
  * tolerance: manual override; auto if omitted.

Local only — nothing is fetched or sent anywhere.
"""

import sys
from collections import Counter
from pathlib import Path

from PIL import Image, ImageFilter

IMG = Path(__file__).resolve().parent.parent / "video/public/img"
DEFAULT_TOL = 48


def background_estimate(img: Image.Image) -> tuple[tuple[int, int, int], int]:
    """Dominant border colour + an adaptive tolerance from its spread."""
    w, h = img.size
    px = img.load()
    ring: list[tuple[int, int, int]] = []
    for x in range(0, w, 2):
        for y in (0, 1, h - 2, h - 1):
            ring.append(px[x, y][:3])
    for y in range(0, h, 2):
        for x in (0, 1, w - 2, w - 1):
            ring.append(px[x, y][:3])
    buckets: dict[tuple[int, int, int], list[tuple[int, int, int]]] = {}
    for c in ring:
        key = (c[0] // 16 * 16, c[1] // 16 * 16, c[2] // 16 * 16)
        buckets.setdefault(key, []).append(c)
    dominant, group = max(buckets.items(), key=lambda kv: len(kv[1]))
    n = len(group)
    mean = tuple(sum(c[i] for c in group) // n for i in range(3))
    var = sum(
        (c[i] - mean[i]) ** 2
        for c in group
        for i in range(3)
    ) / (3 * n)
    spread = int(var ** 0.5)
    tol = max(30, min(70, spread * 3 + 20))
    return mean, tol


def flood_fill(img: Image.Image, bg: tuple[int, int, int],
               tol: int) -> Image.Image:
    """BFS from every border pixel; anything within `tol` of `bg` is removed."""
    w, h = img.size
    px = img.load()
    visit = [False] * (w * h)
    stack: list[tuple[int, int]] = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))
    tol2 = 3 * tol * tol
    while stack:
        x, y = stack.pop()
        i = y * w + x
        if visit[i]:
            continue
        visit[i] = True
        r, g, b = px[x, y][:3]
        dr, dg, db = r - bg[0], g - bg[1], b - bg[2]
        if dr * dr + dg * dg + db * db > tol2:
            continue
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visit[ny * w + nx]:
                stack.append((nx, ny))
    alpha = Image.new("L", img.size, 255)
    apx = alpha.load()
    for i, gone in enumerate(visit):
        if gone:
            apx[i % w, i // w] = 0
    return alpha.filter(ImageFilter.GaussianBlur(1.2))


def despill(img: Image.Image, alpha: Image.Image,
            bg: tuple[int, int, int]) -> Image.Image:
    """Remove the background colour from semi-transparent edge pixels."""
    out = img.convert("RGBA")
    opx = out.load()
    apx = alpha.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            a = apx[x, y]
            if 0 < a < 255:
                t = a / 255.0
                r, g, b = opx[x, y][:3]
                opx[x, y] = (
                    max(0, min(255, round((r - (1 - t) * bg[0]) / t))),
                    max(0, min(255, round((g - (1 - t) * bg[1]) / t))),
                    max(0, min(255, round((b - (1 - t) * bg[2]) / t))),
                    a,
                )
    return out


def convert(path: Path, tol: int | None) -> Path:
    img = Image.open(path).convert("RGB")
    bg, auto = background_estimate(img)
    if tol is None:
        tol = auto
    alpha = flood_fill(img, bg, tol)
    out_path = path.with_suffix(".png")
    despill(img, alpha, bg).save(out_path)
    return out_path


def main() -> None:
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else IMG
    tol = int(sys.argv[2]) if len(sys.argv) > 2 else None
    files = sorted(target.rglob("bed-*.jpg")) if target.is_dir() else [target]
    if not files:
        print(f"no bed-*.jpg under {target}")
        return
    for f in files:
        img = Image.open(f).convert("RGB")
        bg, auto = background_estimate(img)
        out = convert(f, tol)
        used = tol if tol is not None else auto
        print(f"{f.name} -> {out.name} (bg rgb{bg}, tol {used})")
    print("done. Re-run `npm run bed` — the manifest prefers the .png.")


if __name__ == "__main__":
    main()