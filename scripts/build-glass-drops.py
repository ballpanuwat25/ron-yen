"""Build the condensation drops on the hero's window, public/images/glass-drops.webp.

Blender renders the drops as water over the ice (scripts/blender/drops.py); here the render is cut to the
drops alone with its mask, so the page lays it over the fog. The intermediate renders go to scripts/.cache.

    python -I scripts/build-glass-drops.py [path to blender.exe]
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BLENDER = sys.argv[1] if len(sys.argv) > 1 else r'D:\blender.exe'
CACHE = ROOT / 'scripts' / '.cache' / 'drops'
OUT = ROOT / 'public' / 'images' / 'glass-drops.webp'

subprocess.run([BLENDER, '-b', '-P', str(ROOT / 'scripts' / 'blender' / 'drops.py'), '--',
                str(ROOT / 'public' / 'images' / 'window-ice.webp'), str(CACHE)], check=True, capture_output=True)

beauty = np.asarray(Image.open(CACHE / 'beauty.png').convert('RGB'), dtype=np.float32)
mask = np.asarray(Image.open(CACHE / 'mask.png').convert('L'), dtype=np.float32) / 255
rgba = np.dstack([beauty, mask * 255]).clip(0, 255).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(OUT, 'WEBP', quality=72, alpha_quality=70, method=6)
print(f'{OUT.relative_to(ROOT)}  {rgba.shape[1]}x{rgba.shape[0]}  {OUT.stat().st_size // 1024} KB')
