"""Draw the chalk horse frames from the traced Muybridge silhouettes.

source/cNN.png: Sallie Gardner, frames 1 to 11 of "The Horse in Motion" (Muybridge, 1878, public
domain), lifted from the Wikimedia Commons high-res scan, the jockey cut away along the back and
the track shadow removed. One stride is these 11 photographs: 11 x 27 inches is a stride.

Each frame becomes the same drawing done again by hand: an uneven chalk outline that skips, a
translucent rubbed body, a few faint interior strokes, a soft halo. Mirrored to face left, aligned
on the chest (x) and the first track line (y), so the body stays put and only the legs, head,
tail and the bob change. Output: frames/hNN.png, RGBA, 3 px per pixel of the 736 reference.
Run: python3 tools/draw_frames.py   (from the lab folder)
"""
from PIL import Image, ImageFilter, ImageDraw
import numpy as np

TRACK = {1: 655.5, 2: 654, 3: 653, 4: 662, 5: 660, 6: 671, 7: 671, 8: 665, 9: 667, 10: 672, 11: 672}
STRETCH = 1.25                 # the reference's drawn horses are deeper and longer-legged than Muybridge's racing mare
K = 0.6                        # sprite px per panel px: a 1000 px Muybridge horse is 200 px of the reference, at 3x
CHALK_LINE = np.array([214, 236, 255.]); CHALK_FILL = np.array([200, 228, 255.]); HALO = np.array([170, 210, 255.])   # off the reference's brightest chalk

def noise(h, w, cell, rng):
    g = rng.random((h // cell + 3, w // cell + 3)).astype(np.float32)
    return np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((w + 3 * cell, h + 3 * cell), Image.BICUBIC))[:h, :w] / 255.

def steps(mask, n, grow):
    """Chebyshev distance, inside (grow=False) or outside (grow=True), up to n px."""
    im = Image.fromarray((mask * 255).astype(np.uint8)); d = np.zeros(mask.shape, np.float32)
    f = ImageFilter.MaxFilter(3) if grow else ImageFilter.MinFilter(3)
    cur = im
    for i in range(n):
        cur = cur.filter(f); a = np.asarray(cur) > 127
        d += (~a if grow else a)
    return d

# 1. load, align, mirror
masks, place = {}, {}
for n in range(1, 12):
    m = np.asarray(Image.open(f'source/c{n:02d}.png')) > 0
    band = m[430:466]; chest = max(np.where(r)[0].max() for r in band if r.any())
    masks[n] = m; place[n] = (chest, TRACK[n])
W0 = max(m.shape[1] for m in masks.values()); H0 = max(m.shape[0] for m in masks.values())
CX, CY = 1300, 860                                   # a common canvas in panel px: chest at 1000, track line at 700
canvas = {}
for n, m in masks.items():
    c = np.zeros((CY, CX), bool); dx = 1000 - place[n][0]; dy = int(round(700 - place[n][1]))
    ys, xs = np.where(m); ys2, xs2 = ys + dy, xs + dx
    ok = (ys2 >= 0) & (ys2 < CY) & (xs2 >= 0) & (xs2 < CX); c[ys2[ok], xs2[ok]] = True
    canvas[n] = c[:, ::-1]                           # face left
U = np.zeros((CY, CX), bool)
for c in canvas.values(): U |= c
ys, xs = np.where(U); X0, X1, Y0, Y1 = xs.min() - 40, xs.max() + 40, ys.min() - 40, ys.max() + 40
print('union box (panel px)', X0, Y0, X1, Y1)

# 2. draw each frame
for n, c in canvas.items():
    rng = np.random.default_rng(100 + n)
    crop = Image.fromarray((c[Y0:Y1, X0:X1] * 255).astype(np.uint8))
    w, h = int(round((X1 - X0) * K)), int(round((Y1 - Y0) * K * STRETCH))
    a0 = np.asarray(crop.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2.2))).astype(np.float32) / 255.
    a0 = np.clip((a0 - 0.5) * 3 + 0.5, 0, 1)        # rounds the blocky notches the retouched silhouettes have
    hard = a0 > 0.5
    din = np.asarray(Image.fromarray((steps(hard, 16, False) * 15).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 15
    # outline: uneven weight (5 to 9 px here, 1.7 to 3 px of the reference), skipping where the chalk misses
    wmap = 4.0 + 4.0 * noise(h, w, 34, rng) ** 1.5
    line = np.clip((wmap - din) / 1.2, 0, 1) * np.clip(a0 * 1.6, 0, 1)
    # a second, fainter pass of the hand just inside the first, only in places
    off = wmap + 2.5
    line = np.maximum(line, np.clip(1 - np.abs(din - off) / 0.9, 0, 1) * 0.45 * (noise(h, w, 50, rng) > 0.58))
    skip = noise(h, w, 9, rng); grain = rng.random((h, w)).astype(np.float32)
    line *= np.clip(0.72 + 0.5 * skip, 0, 1) * (0.8 + 0.2 * noise(h, w, 70, rng)) * (grain > 0.08)
    # body: rubbed on its side, streaky along the body, a little brighter near the edge
    streak = np.asarray(Image.fromarray((rng.random((h // 3 + 2, w // 24 + 2)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)) / 255.
    blot = noise(h, w, 55, rng)
    fill = a0 * (0.22 + 0.26 * blot + 0.08 * streak + 0.12 * np.exp(-din / 9)) * (0.78 + 0.22 * (grain > 0.3))
    # shading strokes that follow the form, drawn fresh each frame: down a leg, along the tail and mane, along the body
    sm = np.asarray(Image.fromarray((a0 * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7))).astype(np.float32)
    gy, gx = np.gradient(sm)
    sk = Image.new('L', (w, h), 0); d = ImageDraw.Draw(sk)
    pts = np.argwhere(din > 2.5)
    for i in range(300 if len(pts) else 0):
        y, x = pts[rng.integers(len(pts))]
        g = np.hypot(gx[y, x], gy[y, x])
        t = np.arctan2(gx[y, x], -gy[y, x]) if g > 1.5 else np.deg2rad(rng.uniform(-25, 5))   # along the contour
        L = rng.uniform(8, 24) if g > 1.5 else rng.uniform(14, 34)
        d.line([(x - np.cos(t) * L / 2, y - np.sin(t) * L / 2), (x + np.cos(t) * L / 2, y + np.sin(t) * L / 2)], fill=int(rng.uniform(40, 95)), width=int(rng.integers(1, 3)))
    sketch = np.asarray(sk.filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32) / 255. * np.clip(a0 * 1.3, 0, 1) * (grain > 0.2)
    # hair, placed from this frame's own outline (the horse faces left: head left, tail right)
    hr = Image.new('L', (w, h), 0); d = ImageDraw.Draw(hr)
    cols = [x for x in range(w) if hard[:, x].any()]
    topy = {x: int(np.where(hard[:, x])[0][0]) for x in cols}
    cx = int(round((CX - 1 - 1000 - X0) * K))                       # chest column
    belly = int(np.where(hard[:, cx + 110])[0][-1]) if hard[:, cx + 110].any() else int(h * 0.6)
    sway = np.sin(n / 11 * 2 * np.pi)                               # secondary motion through the stride
    for x in range(cx - 70, cx + 100, 3):                           # mane: lifting back off the crest
        if x not in topy: continue
        y = topy[x] + 4; t = np.deg2rad(-12 - 20 * rng.random() + 8 * sway); L = rng.uniform(24, 46)
        m1 = (x + np.cos(t) * L * .5, y + np.sin(t) * L * .5 - 2)
        d.line([(x, y), m1, (x + np.cos(t + .25) * L, y + np.sin(t + .25) * L)], fill=int(rng.uniform(110, 180)), width=int(rng.integers(1, 4)), joint='curve')
    xt = max(x for x in cols if hard[:belly, x].any())              # tail tip, above the belly line
    tail = [(y, x) for x in range(max(0, xt - 95), xt + 1) for y in np.where(hard[:belly, x])[0][::3]]
    for i in range(160 if tail else 0):                              # tail: streaks that run out past the silhouette
        y, x = tail[rng.integers(len(tail))]
        t = np.arctan2(gx[y, x], -gy[y, x]) if np.hypot(gx[y, x], gy[y, x]) > 1.5 else 0.15
        if np.cos(t) < 0: t += np.pi                                # always streaming back
        t += 0.12 * sway; L = rng.uniform(14, 34)
        d.line([(x, y), (x + np.cos(t) * L, y + np.sin(t) * L)], fill=int(rng.uniform(100, 170)), width=int(rng.integers(1, 3)))
    hair = np.asarray(hr.filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255. * (grain > 0.15)
    sketch = np.maximum(sketch, hair)
    # halo: the line's soft glow
    halo = np.asarray(Image.fromarray((line * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255. * 0.28
    # composite, over, premultiplied
    rgb = np.zeros((h, w, 3), np.float32); A = np.zeros((h, w), np.float32)
    for col, a in ((HALO, halo), (CHALK_FILL, fill), (CHALK_FILL, sketch), (CHALK_LINE, line)):
        rgb = col[None, None] / 255. * a[..., None] + rgb * (1 - a[..., None]); A = a + A * (1 - a)
    out = np.dstack([np.where(A[..., None] > 0, rgb / np.maximum(A[..., None], 1e-6), 0), A])
    Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), 'RGBA').save(f'frames/h{n:02d}.png', optimize=True)
import json
meta = {'frames': 11, 'px': 3, 'w': w, 'h': h, 'frame': []}
for n in range(1, 12):
    a = np.asarray(Image.open(f'frames/h{n:02d}.png'))[..., 3] > 50; ys, xs = np.where(a)
    meta['frame'].append({'nose': round(xs.min() / 3, 1), 'tail': round(xs.max() / 3, 1), 'top': round(ys.min() / 3, 1), 'hoof': round(ys.max() / 3, 1)})
meta['hoof'] = max(f['hoof'] for f in meta['frame'])      # the ground the planted hooves stand on
json.dump(meta, open('frames/meta.json', 'w'), indent=1)
print('frame size', w, h, 'px; track line at y', int(round((700 - Y0) * K * STRETCH)), '; chest at x', int(round((CX - 1 - 1000 - X0) * K)))
