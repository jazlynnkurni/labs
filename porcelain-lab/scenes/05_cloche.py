"""05 the cloche. A frosted dome over a cake on a footed stand, the dome
lifted and floating like the reference's lid. The dome is the purest test
of the material: one thin shell, nothing but what glows through it.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from porcelain import *

reset(); world(); floor()
wall = frosted(frost=0.5)
plate_m = frosted("plate", frost=0.65)
cake = soft("cake", (0.95, 0.82, 0.62, 1), 0.35)
jam = soft("jam", (0.78, 0.3, 0.3, 1), 0.6)
cream = soft("cream", (0.99, 0.96, 0.9, 1), 0.3)
black = black_ceramic()

# the stand: a foot, a stem, a plate
lathe("stand", [(0.0, 0.0), (0.9, 0.0), (0.35, 0.3), (0.25, 1.2), (1.9, 1.35), (1.95, 1.5), (0.0, 1.5)], material=plate_m)
# the cake: two layers with jam between, a cream top
lathe("layer1", [(0.0, 1.5), (1.25, 1.5), (1.25, 2.1), (0.0, 2.1)], material=cake)
lathe("jam", [(0.0, 2.08), (1.3, 2.08), (1.3, 2.22), (0.0, 2.22)], material=jam)
lathe("layer2", [(0.0, 2.2), (1.25, 2.2), (1.25, 2.8), (0.0, 2.8)], material=cake)
lathe("cream", [(0.0, 2.78), (1.3, 2.78), (1.35, 2.95), (1.0, 3.05), (0.0, 3.1)], material=cream)
# the dome, lifted and tilted, with a black knob
dome = lathe("dome", [(1.85, 0.0), (1.85, 1.3), (1.6, 2.1), (1.0, 2.7), (0.0, 2.9), (0.0, 2.78), (0.95, 2.6), (1.5, 2.0), (1.73, 1.3), (1.73, 0.0)], material=wall)
dome.location = (0.2, 0.2, 2.9)
dome.rotation_euler = (math.radians(-7), math.radians(5), 0)
knob = lathe("knob", [(0.0, 0.0), (0.3, 0.0), (0.32, 0.25), (0.18, 0.45), (0.0, 0.5)], material=black)
knob.location = (0.2, 0.2, 5.75); knob.rotation_euler = dome.rotation_euler

lights(scale=1.9)
camera(loc=(0.4, -19, 4.2), target=(0.2, 0, 3.0), lens=70, fstop=9.0)
bloom(0.55, 8)
render("05-cloche")
