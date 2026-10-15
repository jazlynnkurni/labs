"""post.py render.png [strength] [size]: the bloom. Highlights above a
threshold are blurred wide and added back, so the warm core breathes into
the frost. In place."""
import sys
from PIL import Image, ImageFilter, ImageChops, ImageEnhance

path = sys.argv[1]
strength = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
size = float(sys.argv[3]) if len(sys.argv) > 3 else 8
im = Image.open(path).convert("RGB")
w, h = im.size
# highlights: everything above the paper's own brightness
thr = 215
hi = im.point(lambda v: max(0, v - thr) * 255 // (255 - thr))
glow = hi.filter(ImageFilter.GaussianBlur(radius=size * w / 600))
glow = ImageEnhance.Brightness(glow).enhance(strength)
out = ImageChops.add(im, glow)
# a whisper of overall softness, the reference has no hard pixels anywhere
out = Image.blend(out, out.filter(ImageFilter.GaussianBlur(radius=w / 900)), 0.15)
out.save(path)
print("bloomed", path)
