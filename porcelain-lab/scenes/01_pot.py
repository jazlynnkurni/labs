"""01 the pot. The reference itself: a wide frosted bowl of chestnuts, the
lid floating above it, one black curled handle. Run:
  blender -b -P scenes/01_pot.py -- [--quick]
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from porcelain import *

reset(); world(); floor()
wall = frosted(frost=0.55)
lid_m = frosted("lid", frost=0.5)
chest = soft("chestnut", (0.55, 0.3, 0.14, 1), glow=0.35)
glaze = soft("glaze", (0.85, 0.5, 0.2, 1), glow=0.6)
black = black_ceramic()

# the bowl: a lathe, wide, thick lip, thin wall. profile is (radius, z)
outer = [(0.0, 0.0), (0.9, 0.0), (1.55, 0.25), (1.85, 0.9), (1.92, 1.5), (1.95, 1.75)]
inner = [(1.82, 1.75), (1.8, 1.5), (1.72, 0.95), (1.4, 0.4), (0.0, 0.3)]
lathe("bowl", outer + inner, material=wall)

# the contents: a heap of chestnuts, some glazed, piled to the rim
import random
random.seed(5)
for i in range(26):
    a = random.uniform(0, 6.283); r = random.uniform(0, 1.35) ** 0.7 * 1.35
    z = 0.55 + random.uniform(0, 0.9) * (1 - r / 1.9) + 0.35
    m = glaze if random.random() < 0.45 else chest
    blob(f"chestnut{i}", (r * math.cos(a), r * math.sin(a), z), random.uniform(0.28, 0.42), m, squash=(1, 0.9, 0.78))

# the lid: a shallow dome with a knob, floating, tilted a little, as in the picture
lid = lathe("lid", [(0.0, 0.0), (1.2, 0.0), (1.98, -0.1), (1.98, 0.02), (1.3, 0.14), (0.55, 0.42), (0.0, 0.5)], material=lid_m)
lid.location = (0.25, 0.3, 3.1)
lid.rotation_euler = (math.radians(-9), math.radians(6), 0)
knob = lathe("knob", [(0.0, 0.0), (0.42, 0.0), (0.45, 0.2), (0.3, 0.45), (0.0, 0.5)], material=lid_m)
knob.location = (0.25, 0.3, 3.55); knob.rotation_euler = lid.rotation_euler

# the black handle: a curl leaving the rim on the left
curl("handle", black, start=(-1.85, 0.0, 1.6), radius=0.7, turns=1.5, thickness=0.11, rot=(0, 0, math.radians(90)))

lights(scale=1.6)
camera(loc=(0.3, -16, 3.4), target=(0, 0, 2.0), lens=70, fstop=9.0)
bloom(0.55, 8)
render("01-pot")
