"""03 the candy jar. A tall frosted cylinder with a domed lid, full of soft
pastel sweets that blur into colour fields through the wall. The frost
turns a pile of spheres into a watercolour; that is the test.
"""
import sys, os, random
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from porcelain import *

reset(); world(); floor()
wall = frosted(frost=0.45)
sweets = [soft("blush", BLUSH, 0.45), soft("amber", AMBER, 0.45), soft("cream", (0.98, 0.9, 0.78, 1), 0.3), soft("rose", (0.9, 0.5, 0.5, 1), 0.45)]

# the jar: straight wall, rounded foot, a flared lip
lathe("jar", [(0.0, 0.0), (1.1, 0.0), (1.35, 0.15), (1.4, 3.1), (1.5, 3.3), (1.38, 3.3), (1.28, 3.1), (1.28, 0.3), (1.0, 0.14), (0.0, 0.12)], material=wall)
# the lid: a dome with a ball
lid = lathe("lid", [(0.0, 3.32), (1.5, 3.32), (1.5, 3.5), (1.2, 3.7), (0.6, 3.95), (0.0, 4.02)], material=frosted("lid", frost=0.45))
blob("knob", (0, 0, 4.2), 0.22, frosted("knob", frost=0.45))

random.seed(3)
for i in range(70):
    a = random.uniform(0, 6.283); r = random.uniform(0, 1) ** 0.6 * 1.0
    z = 0.4 + random.uniform(0, 2.4)
    blob(f"sweet{i}", (r * math.cos(a), r * math.sin(a), z), random.uniform(0.2, 0.3), random.choice(sweets), squash=(1, 1, 0.8))

# one sweet escaped, on the floor, sharp
blob("loose", (2.0, -1.4, 0.24), 0.26, sweets[0], squash=(1, 1, 0.85))

lights(scale=1.7)
camera(loc=(0.4, -16, 3.6), target=(0.2, 0, 2.2), lens=70, fstop=9.0)
bloom(0.5, 8)
render("03-jar")
