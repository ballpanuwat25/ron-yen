"""Grade the mockup photos into one set: a shared base grade, then a warm or a cool split.

    python -I grade.py
"""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps

HERE = Path(__file__).resolve().parent
SRC, OUT = HERE / 'src', HERE / 'img'

HERO = {'wide': (2000, 1250), 'tall': (1000, 1600)}
ROOM = {'room': (1400, 1050)}

# name: (source, pre-crop box in source pixels or None, crop focus, 'hot' | 'cold', sizes)
PHOTOS = {
    'hero-hot':   ('1749561532113-80b8e0f918bd.jpg', None, (.5, .55), 'hot', HERO),
    # the barrel shot has bystanders' legs along the top edge, so it is cut below them first
    'hero-cold':  ('1681980016810-454f1c0c8fcc.jpg', (120, 330, 2280, 1603), (.5, .45), 'cold', HERO),
    'room-sauna': ('1743286159555-ea765c1bc5e6.jpg', None, (.5, .5), 'hot', ROOM),
    'room-bath':  ('1724406040547-ec56fe9f1958.jpg', None, (.5, .5), 'cold', ROOM),
}


def curve(gamma, gain, lift):
    return [min(255, round(255 * ((i / 255) ** gamma) * gain * .94 + lift)) for i in range(256)]


# both sides share the lifted, slightly flat blacks; only the colour of the light differs
LUTS = {
    'hot': curve(.94, 1.07, 8) + curve(1.0, .95, 5) + curve(1.12, .80, 4),
    'cold': curve(1.18, .80, 5) + curve(1.06, .90, 7) + curve(.98, 1.0, 11),
}


def base(im):
    im = ImageEnhance.Color(im).enhance(.62)
    return ImageEnhance.Contrast(im).enhance(1.06)


for name, (src, box, focus, side, sizes) in PHOTOS.items():
    im = Image.open(SRC / src).convert('RGB')
    if box:
        im = im.crop(box)
    im = base(im).point(LUTS[side])
    for size_name, size in sizes.items():
        out = OUT / f'{name}-{size_name}.webp'
        ImageOps.fit(im, size, Image.LANCZOS, centering=focus).save(out, 'WEBP', quality=80, method=6)
        print(out.name, out.stat().st_size // 1024, 'KB')
