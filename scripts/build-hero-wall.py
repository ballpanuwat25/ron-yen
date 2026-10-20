"""Build the hero's sauna wall from the generated pictures in scripts/assets/hero.

Gemini drew the sauna with the window glass in flat green (#00FF00). Here the green is painted over with
the wood beside it, the room is graded darker and warmer to sit with the rest of the site, and the glass
is measured as four straight edges and written to src/content/hero-wall.ts. The page cuts the glass out
along those edges and shows the fogged view of the ice through it.

    python -I scripts/build-hero-wall.py
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'scripts' / 'assets' / 'hero'
OUT = ROOT / 'public' / 'images'
TS = ROOT / 'src' / 'content' / 'hero-wall.ts'

WALLS = {
    'wide': 'hero-desktop.jpg',
    'tall': 'hero-mobile.jpg',
}


def key(rgb):
    """How much of each pixel is the green glass (0 wall, 1 glass), and the wall's colour round it."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    greenness = g - np.maximum(r, b)
    glass = np.clip((greenness - .12) / .5, 0, 1)
    # Gemini drew a pale grey strip round the inside of the glass. It is not the frame: the wood is warm
    # (much more red than blue) and the strip is pale with no colour, so the pale colourless pixels just
    # beside the glass go with it; the hole opens one pixel more and is softened by one, for a clean edge.
    strip = (grow(glass > .5, 6) > 0) & (r - b < .12) & ((r + g + b) / 3 > .4)
    glass = blur(grow(np.maximum(glass, strip), 1), 1)
    # Where a pixel is part glass, its colour is mostly green and taking the green back out leaves it
    # pink; so it takes the colour of the solid wood just beside it, spread out over the edge.
    solid = (greenness < .04).astype(np.float64)
    wall = rgb.copy()
    edge = (glass > 0) | (greenness >= .04)
    spread = blur(rgb * solid[..., None], 4) / np.maximum(blur(solid, 4), 1e-6)[..., None]
    wall[edge] = spread[edge]
    return glass, np.clip(wall, 0, 1)


def shifted(x, r):
    """Every copy of x moved by up to r pixels each way, the picture's own edge repeated beyond it."""
    pad = np.pad(x, [(r, r), (r, r)] + [(0, 0)] * (x.ndim - 2), mode='edge')
    h, w = x.shape[:2]
    for dy in range(2 * r + 1):
        for dx in range(2 * r + 1):
            yield pad[dy:dy + h, dx:dx + w]


def grow(x, r):
    """Each pixel takes the largest value within r pixels of it (a square, so corners stay square)."""
    x = x.astype(np.float64)
    out = x.copy()
    for v in shifted(x, r):
        out = np.maximum(out, v)
    return out


def blur(x, r):
    """A box blur r pixels each way."""
    return sum(shifted(x, r)) / (2 * r + 1) ** 2


def grade(rgb):
    """Darker and warmer, as the room in the reference photo: the mids pulled down, a little more
    contrast, the light warmed toward amber."""
    x = rgb ** 1.45
    x = x * np.array([1.06, .93, .78])
    x = np.clip((x - .5) * 1.12 + .5, 0, 1)
    return x


def fit(us, vs):
    """A straight line v = a·u + b through the points, refitted without any that stray from it."""
    a, b = np.polyfit(us, vs, 1)
    keep = np.abs(vs - (a * us + b)) < 1.5
    return np.polyfit(us[keep], vs[keep], 1)


def hole(mask, rgb, w, h):
    """The glass as four straight edges. Each side is a line fitted along the edge of the pure green,
    well away from the corners (where a sloping neighbour would pull it), then moved out past the pale
    strip and the thin wooden bead Gemini drew round the glass, to where the dark sash begins, so the
    glass meets the sash as in a real window; the corners are where the lines meet. The page cuts the
    glass as this clean shape at any size instead of a stepped pixel edge. A side lying on the picture's
    own edge is pushed just past it."""
    ys, xs = np.nonzero(mask)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    mx, my = int((x1 - x0) * .25), int((y1 - y0) * .25)
    cols, rows = np.arange(x0 + mx, x1 - mx), np.arange(y0 + my, y1 - my)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lit = ((r + g + b) / 3 > .24) & (g - np.maximum(r, b) < .3)

    def strip(points, step):
        """How far the strip and bead run outside the green before the dark sash, stepping out from
        each point (the median, at most 14 pixels where a side has no sash)."""
        runs = []
        for x, y in points:
            n = 0
            while n < 14:
                px, py = int(round(x + step[0] * (n + 1))), int(round(y + step[1] * (n + 1)))
                if not (0 <= px < w and 0 <= py < h) or not lit[py, px]: break
                n += 1
            runs.append(n)
        return float(np.median(runs)) + 1

    top = fit(cols, np.array([np.argmax(mask[:, x]) for x in cols], float))
    bottom = fit(cols, np.array([h - np.argmax(mask[::-1, x]) for x in cols], float))
    left = fit(rows, np.array([np.argmax(mask[y]) for y in rows], float))
    right = fit(rows, np.array([w - np.argmax(mask[y, ::-1]) for y in rows], float))
    top = (top[0], top[1] - strip([(x, top[0] * x + top[1]) for x in cols], (0, -1)))
    bottom = (bottom[0], bottom[1] + strip([(x, bottom[0] * x + bottom[1] - 1) for x in cols], (0, 1)))
    left = (left[0], left[1] - strip([(left[0] * y + left[1], y) for y in rows], (-1, 0)))
    right = (right[0], right[1] + strip([(right[0] * y + right[1] - 1, y) for y in rows], (1, 0)))
    if right[1] + right[0] * h / 2 >= w - 4: right = (0, w + 2)
    if left[1] + left[0] * h / 2 <= 4: left = (0, -2)

    def meet(horiz, vert):
        (a, b), (c, d) = horiz, vert          # y = a·x + b and x = c·y + d
        x = (c * b + d) / (1 - c * a)
        return [round(float(x), 1), round(float(a * x + b), 1)]

    return [meet(top, left), meet(top, right), meet(bottom, right), meet(bottom, left)]


entries = []
for name, src in WALLS.items():
    im = Image.open(SRC / src).convert('RGB')
    w, h = im.size
    rgb = np.asarray(im, dtype=np.float64) / 255
    glass, wall = key(rgb)
    # the picture keeps no hole of its own: the page cuts the glass out along the fitted edges
    Image.fromarray((grade(wall) * 255 + .5).astype(np.uint8), 'RGB').save(OUT / f'hero-wall-{name}.webp', quality=90)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    quad = hole(g - np.maximum(r, b) > .3, rgb, w, h)
    qx, qy = [p[0] for p in quad], [p[1] for p in quad]
    box = [int(min(qx)), int(min(qy)), int(np.ceil(max(qx))), int(np.ceil(max(qy)))]
    entries.append((name, w, h, box, quad))
    print(f'{name}: {w}x{h}, glass corners {quad}, box {box}')

lines = [
    '// Generated by scripts/build-hero-wall.py from the pictures in scripts/assets/hero. Do not edit by hand.',
    '// Each wall: its picture, its size, the window glass as four corners in its own pixels (clockwise',
    '// from the top left), and the box round them.',
    'export const heroWall = {',
]
for name, w, h, box, quad in entries:
    pts = ', '.join(f'[{x}, {y}]' for x, y in quad)
    lines.append(f"  {name}: {{ src: '/images/hero-wall-{name}.webp', width: {w}, height: {h}, hole: [{pts}], glass: [{', '.join(map(str, box))}] }},")
lines += ['} as const;', '']
TS.write_text('\n'.join(lines), encoding='utf-8')
print('wrote', TS.relative_to(ROOT))
