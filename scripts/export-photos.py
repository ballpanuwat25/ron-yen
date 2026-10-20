"""Export the site photographs from design/photos-src into public/images.

The page does any colouring itself (the footer prints the stones in ember and the ice in cold blue),
so here they are only cropped to their slots. Sources are Unsplash; the id is in each file name. The
hero's sauna wall is generated, and built by scripts/build-hero-wall.py.

    python -I scripts/export-photos.py               every photo
    python -I scripts/export-photos.py window-floes  just the photos named
"""
import sys
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'design' / 'photos-src'
OUT = ROOT / 'public' / 'images'

# name: (source, pre-crop box in source pixels or None, exact size, crop focus)
PHOTOS = {
    'hero-hot-wide': ('1749561532113-80b8e0f918bd.jpg', None, (2000, 1250), (.5, .55)),   # steam over the stove stones (the footer's hot side)
    'window-floes':  ('1771508784012-60d2b3b0cc92.jpg', None, (1600, 1000), (.5, .5)),    # ice floes on dark water
}


def export(name, spec):
    src, box, size, focus = spec
    im = Image.open(SRC / src).convert('RGB')
    if box:
        im = im.crop(box)
    im = ImageOps.fit(im, size, Image.LANCZOS, centering=focus)
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
