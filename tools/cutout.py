"""businessman_character.jpeg -> transparent cutout PNG.

Flood-fills the flat grey studio background from the borders, keeps only the
largest remaining blob (drops the stray sparkle + floor shadow), crops to it.
Run once; the character is fixed across every video.
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else "businessman_character.jpeg"
DST = sys.argv[2] if len(sys.argv) > 2 else "video/public/character.png"
TOL = 34  # per-channel distance that still counts as "background"

im = Image.open(SRC).convert("RGB")
px = np.asarray(im).astype(np.int16)
h, w, _ = px.shape

bg = px[2, 2]
near_bg = (np.abs(px - bg).max(axis=2) <= TOL)


def flood(seed_mask, passable):
    """4-way BFS from every True in seed_mask, walking only where passable."""
    out = np.zeros((h, w), bool)
    q = deque(zip(*np.nonzero(seed_mask & passable)))
    for y, x in q:
        out[y, x] = True
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and passable[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True
                q.append((ny, nx))
    return out


border = np.zeros((h, w), bool)
border[0, :] = border[-1, :] = True
border[:, 0] = border[:, -1] = True

outside = flood(border, near_bg)
subject = ~outside

# Seed the character: first non-background pixel down the centre column.
cx = w // 2
ys = np.nonzero(subject[:, cx])[0]
if len(ys) == 0:
    raise SystemExit("no subject found on the centre column")
seed = np.zeros((h, w), bool)
seed[ys[0], cx] = True
subject = flood(seed, subject)

alpha = Image.fromarray((subject * 255).astype(np.uint8)).filter(
    ImageFilter.GaussianBlur(0.6)
)
rgba = im.convert("RGBA")
rgba.putalpha(alpha)

ys, xs = np.nonzero(subject)
pad = 6
box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0),
       min(xs.max() + pad, w), min(ys.max() + pad, h))
rgba.crop(box).save(DST)
print(f"{DST}  {box[2]-box[0]}x{box[3]-box[1]}  ({subject.sum()} px kept)")
