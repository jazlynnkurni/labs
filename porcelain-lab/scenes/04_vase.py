"""04 the vase. A gourd of frosted porcelain holding water you can half
see, a black branch coming out of it (the handle's grammar, grown), and
soft blossoms. Two sharp black lines against everything soft.
"""
import sys, os, random
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from porcelain import *

reset(); world(); floor()
wall = frosted(frost=0.5)
water = soft("water", (0.93, 0.86, 0.74, 1), 0.3)
black = black_ceramic()
bloss = soft("blossom", BLUSH, 0.12)
bud = soft("bud", (0.9, 0.55, 0.55, 1), 0.15)

# the gourd: two bellies and a lip
g = [(0.0, 0.0), (0.8, 0.0), (1.35, 0.4), (1.5, 1.1), (1.2, 1.9), (0.75, 2.3), (0.95, 2.9), (0.8, 3.5), (0.5, 3.9), (0.55, 4.05)]
gIn = [(0.42, 4.05), (0.38, 3.9), (0.66, 3.5), (0.8, 2.9), (0.62, 2.3), (1.05, 1.9), (1.36, 1.1), (1.22, 0.45), (0.0, 0.15)]
lathe("vase", g + gIn, material=wall)
lathe("water", [(0.0, 0.16), (1.2, 0.46), (1.34, 1.1), (1.1, 1.75), (0.0, 1.75)], material=water)

import bpy, math
def tube(name, pts, thick):
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = thick; cu.bevel_resolution = 8; cu.fill_mode = "FULL"
    sp = cu.splines.new("NURBS"); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts): sp.points[i].co = (*p, 1.0)
    sp.use_endpoint_u = True; sp.order_u = 4
    ob = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(ob); ob.data.materials.append(black); return ob
tube("branch", [(0.1, 0, 2.0), (0.2, 0.1, 4.2), (0.9, 0.2, 5.4), (2.0, 0.1, 6.0), (2.9, 0.0, 6.9)], 0.07)
tube("twig", [(0.6, 0.15, 4.9), (-0.4, 0.3, 5.7), (-1.1, 0.2, 6.5)], 0.045)
tube("twig2", [(2.0, 0.1, 6.0), (2.3, -0.1, 7.0)], 0.04)

random.seed(11)
for (x, y, z) in [(1.3, 0.2, 5.75), (2.5, 0.05, 6.55), (2.9, 0.0, 6.95), (-0.7, 0.28, 6.1), (-1.1, 0.2, 6.55), (2.3, -0.1, 7.05), (0.5, 0.2, 4.9)]:
    for k in range(4):
        a = k * 1.57 + random.uniform(-0.2, 0.2)
        blob(f"petal{x}{k}", (x + 0.22 * math.cos(a), y + 0.1 * math.sin(a * 2), z + 0.22 * math.sin(a)), 0.2, bloss, squash=(1, 0.6, 1))
    blob(f"bud{x}", (x, y, z), 0.14, bud)

lights(scale=2.0)
camera(loc=(0.6, -22, 5.0), target=(0.7, 0, 3.8), lens=70, fstop=9.0)
bloom(0.5, 8)
render("04-vase")
