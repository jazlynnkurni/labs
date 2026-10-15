"""02 the teapot. A round frosted pot with amber tea glowing through the
wall at its level, a black spout and loop handle, a cup beside it already
poured. The tea line is the whole picture: a warm horizon inside the frost.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from porcelain import *

reset(); world(); floor()
wall = frosted(frost=0.5)
tea = soft("tea", AMBER, glow=0.7)
black = black_ceramic()

# the body: a squat sphere lathe with a short neck
body = [(0.0, 0.0), (0.8, 0.0), (1.4, 0.25), (1.75, 0.9), (1.7, 1.6), (1.3, 2.15), (0.75, 2.4), (0.75, 2.55), (0.0, 2.55)]
bodyIn = [(0.0, 2.45), (0.65, 2.45), (0.65, 2.32), (1.18, 2.05), (1.58, 1.55), (1.62, 0.9), (1.3, 0.35), (0.0, 0.14)]
lathe("teapot", body + bodyIn, material=wall)
# the tea: a lathe that fills the body to two thirds
lathe("tea", [(0.0, 0.15), (1.28, 0.36), (1.6, 0.9), (1.6, 1.45), (0.0, 1.45)], material=tea)
# the lid, sitting this time
lathe("lid", [(0.0, 2.5), (0.85, 2.5), (0.6, 2.75), (0.22, 2.9), (0.0, 2.95)], material=frosted("lid", frost=0.5))
# black spout and handle: curves
import bpy, math
def tube(name, pts, thick):
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = thick; cu.bevel_resolution = 8; cu.fill_mode = "FULL"
    sp = cu.splines.new("NURBS"); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts): sp.points[i].co = (*p, 1.0)
    sp.use_endpoint_u = True; sp.order_u = 4
    ob = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(ob); ob.data.materials.append(black); return ob
tube("spout", [(1.5, 0, 1.0), (2.2, 0, 1.3), (2.7, 0, 1.9), (2.95, 0, 2.4)], 0.17)
tube("handle", [(-1.55, 0, 1.9), (-2.4, 0, 2.1), (-2.75, 0, 1.4), (-2.4, 0, 0.7), (-1.6, 0, 0.6)], 0.12)

# the cup, poured, to the front right
cup = lathe("cup", [(0.0, 0.0), (0.55, 0.0), (0.78, 0.5), (0.85, 1.0), (0.74, 1.0), (0.68, 0.5), (0.48, 0.12), (0.0, 0.1)], material=wall)
cup.location = (2.6, -1.9, 0)
tc = lathe("cuptea", [(0.0, 0.12), (0.5, 0.14), (0.7, 0.55), (0.7, 0.75), (0.0, 0.75)], material=tea)
tc.location = cup.location

lights(scale=1.6)
camera(loc=(0.6, -15, 3.0), target=(0.3, 0, 1.5), lens=70, fstop=9.0)
bloom(0.6, 8)
render("02-teapot")
