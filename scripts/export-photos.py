"""Export the site photographs from design/photos-src into public/images.

The page does any colouring itself (the footer prints the stones in ember and the ice in cold blue),
so here they are only cropped to their slots, except the hero's sauna and its ice, which are printed here:
a gradient map is finer than any blend the page can do. Sources are Unsplash; the id is in each file name.

    python -I scripts/export-photos.py               every photo
    python -I scripts/export-photos.py window-ice    just the photos named
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'design' / 'photos-src'
OUT = ROOT / 'public' / 'images'

# name: (source, pre-crop box in source pixels or None, exact size, crop focus[, grade])
PHOTOS = {
    'hero-hot-wide': ('1749561532113-80b8e0f918bd.jpg', None, (2000, 1250), (.5, .55)),   # steam over the stove stones (the footer's hot side)
    # the hero: an empty sauna, benches either side and the stove in the middle (HUUM on Unsplash)
    # the view through the hero's window: crushed ice, printed in the page's cold blue
    'window-ice':    ('1505009258427-29298f4dc5f6.jpg', None, (1170, 780), (.5, .5), 'ice'),
    'sauna-wide':    ('huum-BDUbpKMK2UI.jpg', None, (2400, 1600), (.5, .5), 'ember'),
    'sauna-tall':    ('huum-BDUbpKMK2UI.jpg', None, (1440, 2560), (.5, .5), 'ember'),
}

# the ember print: shadows to near-black oxblood, the wood's middle tones to ember, the hidden lights
# under the backrests to a hot cream
# the cold print, for the ice: shadows to deep navy, the ice itself to the page's ice blue and white
ICE = [(0, (3, 10, 20)), (.25, (14, 44, 70)), (.55, (86, 150, 190)), (.8, (191, 224, 242)), (1, (246, 252, 255))]
EMBER = [(0, (9, 2, 1)), (.16, (42, 7, 2)), (.42, (150, 32, 8)), (.68, (236, 78, 24)), (.88, (255, 160, 100)), (1, (255, 236, 220))]


def print_in(im, inks):
    y = np.asarray(ImageOps.grayscale(im), dtype=np.float32) / 255
    y = np.clip((y - .03) / .9, 0, 1) ** 1.15
    at = [a for a, _ in inks]
    rgb = np.stack([np.interp(y, at, [c[i] for _, c in inks]) for i in range(3)], -1)
    # a little film grain so the flat ember fields do not band
    rgb += np.random.default_rng(3).normal(0, 3.2, rgb.shape[:2])[..., None]
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))


def export(name, spec):
    src, box, size, focus, *grade = spec
    im = Image.open(SRC / src).convert('RGB')
    if box:
        im = im.crop(box)
    im = ImageOps.fit(im, size, Image.LANCZOS, centering=focus)
    if grade:
        im = print_in(im, {'ember': EMBER, 'ice': ICE}[grade[0]])
    path = OUT / f'{name}.webp'
    im.save(path, 'WEBP', quality=80, method=6)
    return path, im.size


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    only = sys.argv[1:]
    for name, spec in PHOTOS.items():
        if only and name not in only:
            continue
        path, size = export(name, spec)
        print(f'{path.relative_to(ROOT)}  {size[0]}x{size[1]}  {path.stat().st_size // 1024} KB')
