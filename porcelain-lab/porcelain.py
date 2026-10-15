"""porcelain.py: the look, shared by every scene.

The reference (seethis.JPG, a May calendar from rednote) is not glass and
not clay. It reads as FROSTED PORCELAIN: a thin translucent wall that lets
warm contents glow through as a blur, no hard specular hits, no cast
shadows to speak of, a high key cream world, and one black glossy ceramic
accent (the handle) that gives the eye something sharp. The lid floats, so
the object is an illustration of a pot rather than a photograph of one.

What makes it in Cycles:
  * the wall: Principled BSDF with high Transmission and HIGH roughness, so
    light passes through but every refraction is diffused. That is the
    frost. IOR low (1.3) so edges do not bend the view much. A touch of
    Subsurface so the rim glows where it thins.
  * the contents: soft warm shapes with a little Emission, so they bloom
    through the wall instead of going grey behind it.
  * light: three huge area lights, no sun. Key above-right, fill from the
    camera, rim from behind so translucent edges light up. Shadows die at
    that size, which is the point.
  * colour: AgX, exposure up, contrast down. Bloom in the compositor, a
    little, so the warm core breathes into the frost.

Usage from a scene file:
    import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from porcelain import *
"""

import bpy
import math
import os
import sys
from mathutils import Vector

CREAM = (0.984, 0.965, 0.930, 1.0)          # #FBF6ED, the paper of the reference
PORCELAIN = (0.90, 0.89, 0.885, 1.0)       # a shade cooler and greyer than the paper, so the wall separates from it
CARAMEL = (0.72, 0.42, 0.18, 1.0)
CHESTNUT = (0.42, 0.22, 0.10, 1.0)
BLACK = (0.012, 0.010, 0.010, 1.0)
BLUSH = (0.95, 0.72, 0.66, 1.0)
AMBER = (0.86, 0.55, 0.22, 1.0)

QUICK = "--quick" in sys.argv


def reset():
    """an empty scene"""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        sc.cycles.device = "GPU"
    except Exception:
        sc.cycles.device = "CPU"
    sc.cycles.samples = 48 if QUICK else 256
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 12
    sc.cycles.transmission_bounces = 12
    sc.cycles.transparent_max_bounces = 12
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.cycles.blur_glossy = 1.0           # softens the frost further, cheap
    sc.render.resolution_x = 600 if QUICK else 1200
    sc.render.resolution_y = 900 if QUICK else 1800
    sc.render.film_transparent = False
    # colour: AgX, lifted, soft
    vs = sc.view_settings
    vs.view_transform = "AgX"
    try:
        vs.look = "AgX - Base Contrast"
    except Exception:
        pass
    vs.exposure = 0.0
    vs.gamma = 1.0
    return sc


# ---------- materials ----------

def _principled(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    return m, nt, bsdf


def frosted(name="frosted porcelain", tint=PORCELAIN, frost=0.55, glow=0.0):
    """the wall. frost is the transmission roughness: 0.3 is milky glass,
    0.55 is the reference, 0.8 is nearly opaque bone china"""
    m, nt, b = _principled(name)
    b.inputs["Base Color"].default_value = tint
    b.inputs["Roughness"].default_value = max(0.25, frost * 0.9)
    b.inputs["IOR"].default_value = 1.32
    b.inputs["Transmission Weight"].default_value = 0.92
    b.inputs["Subsurface Weight"].default_value = 0.25
    b.inputs["Subsurface Radius"].default_value = (0.9, 0.6, 0.4)
    b.inputs["Subsurface Scale"].default_value = 0.08
    b.inputs["Coat Weight"].default_value = 0.0
    b.inputs["Specular IOR Level"].default_value = 0.35
    if glow > 0:
        b.inputs["Emission Color"].default_value = tint
        b.inputs["Emission Strength"].default_value = glow
    try:
        m.blend_method = "BLEND"          # only EEVEE cares; Cycles ignores it
    except Exception:
        pass
    return m


def soft(name, color, glow=0.35):
    """the contents: a soft matte body that glows a little, so it reads
    through the frost as a warm blur rather than a grey one"""
    m, nt, b = _principled(name)
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = 0.85
    b.inputs["Subsurface Weight"].default_value = 0.6
    b.inputs["Subsurface Radius"].default_value = (1.0, 0.5, 0.25)
    b.inputs["Subsurface Scale"].default_value = 0.15
    b.inputs["Emission Color"].default_value = color
    b.inputs["Emission Strength"].default_value = glow * 1.6
    return m


def black_ceramic(name="black ceramic"):
    """the one sharp thing: a glossy black glaze"""
    m, nt, b = _principled(name)
    b.inputs["Base Color"].default_value = BLACK
    b.inputs["Roughness"].default_value = 0.18
    b.inputs["Coat Weight"].default_value = 0.6
    b.inputs["Coat Roughness"].default_value = 0.08
    b.inputs["Specular IOR Level"].default_value = 0.6
    return m


def paper(name="paper"):
    m, nt, b = _principled(name)
    b.inputs["Base Color"].default_value = CREAM
    b.inputs["Roughness"].default_value = 1.0
    b.inputs["Specular IOR Level"].default_value = 0.0
    return m


# ---------- world, light, camera ----------

def world():
    w = bpy.data.worlds.new("cream")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = CREAM
    bg.inputs["Strength"].default_value = 2.2
    return w


def area(name, loc, target, size, power, color=(1, 1, 1)):
    bpy.ops.object.light_add(type="AREA", location=loc)
    L = bpy.context.object
    L.name = name
    L.data.size = size
    L.data.energy = power
    L.data.color = color
    aim(L, target)
    return L


def lights(scale=1.0):
    """three big soft lights. scale with the object size"""
    s = scale
    area("key", (3 * s, -2.5 * s, 4.5 * s), (0, 0, 0.8 * s), 5 * s, 420 * s * s, (1.0, 0.96, 0.9))
    area("fill", (-1.5 * s, -5 * s, 1.8 * s), (0, 0, 0.8 * s), 6 * s, 160 * s * s, (0.96, 0.97, 1.0))
    area("rim", (-2.5 * s, 3.5 * s, 2.5 * s), (0, 0, 0.9 * s), 4 * s, 380 * s * s, (1.0, 0.93, 0.85))


def aim(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def camera(loc=(0, -7.5, 2.0), target=(0, 0, 0.9), lens=90, fstop=3.2):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    cam.data.lens = lens
    cam.data.sensor_width = 36
    cam.data.dof.use_dof = True
    cam.data.dof.focus_distance = (Vector(target) - cam.location).length
    cam.data.dof.aperture_fstop = fstop
    aim(cam, target)
    bpy.context.scene.camera = cam
    return cam


def floor():
    """the ground is the same cream as the world and emits it, so there is no
    horizon and no cast shadow: the object floats on paper, as in the picture"""
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, 0))
    p = bpy.context.object
    p.name = "floor"
    m = bpy.data.materials.new("cream light")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = CREAM
    em.inputs["Strength"].default_value = 2.2
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    p.data.materials.append(m)
    return p


# ---------- geometry helpers ----------

def smooth(obj, levels=2):
    m = obj.modifiers.new("subd", "SUBSURF")
    m.levels = levels
    m.render_levels = levels + 1
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def lathe(name, profile, segments=96, material=None):
    """revolve a 2D profile [(r, z), ...] around Z into a closed mesh"""
    import bmesh
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    for (r, z) in profile:
        ring = []
        for i in range(segments):
            a = 2 * math.pi * i / segments
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)
    bm.verts.ensure_lookup_table()
    for k in range(len(rings) - 1):
        a, b = rings[k], rings[k + 1]
        for i in range(segments):
            j = (i + 1) % segments
            try:
                bm.faces.new((a[i], a[j], b[j], b[i]))
            except ValueError:
                pass
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    if material:
        ob.data.materials.append(material)
    smooth(ob, 1)
    return ob


def blob(name, loc, radius, material, squash=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=radius, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = squash
    o.data.materials.append(material)
    smooth(o, 1)
    return o


def torus(name, loc, major, minor, material, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(location=loc, major_radius=major, minor_radius=minor, major_segments=64, minor_segments=24)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    o.data.materials.append(material)
    for poly in o.data.polygons:
        poly.use_smooth = True
    return o


def curl(name, material, start=(0, 0, 0), radius=0.5, turns=1.6, thickness=0.09, rot=(0, 0, 0)):
    """the black handle: a spiral tube"""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = thickness
    cu.bevel_resolution = 8
    cu.fill_mode = "FULL"
    sp = cu.splines.new("NURBS")
    n = 48
    sp.points.add(n - 1)
    for i in range(n):
        t = i / (n - 1)
        a = t * turns * 2 * math.pi
        r = radius * (1 - 0.55 * t)
        sp.points[i].co = (r * math.cos(a), 0.0, r * math.sin(a) + 0.3 * t, 1.0)
    sp.use_endpoint_u = True
    sp.order_u = 4
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    ob.location = start
    ob.rotation_euler = rot
    ob.data.materials.append(material)
    return ob


# ---------- finish ----------

def bloom(strength=0.6, size=8):
    """Blender 5 moved the compositor off the scene, so the glow is done after
    the render by post.py (PIL). This only records the numbers for it."""
    sc = bpy.context.scene
    sc["bloom_strength"] = strength
    sc["bloom_size"] = size


def render(name):
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "renders")
    os.makedirs(out, exist_ok=True)
    sc = bpy.context.scene
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath = os.path.join(out, name + ("-quick" if QUICK else "") + ".png")
    bpy.ops.render.render(write_still=True)
    print("rendered", sc.render.filepath)
    # the glow, applied in place
    post = os.path.join(here, "post.py")
    if os.path.exists(post):
        import subprocess
        subprocess.run(["python3", post, sc.render.filepath, str(sc.get("bloom_strength", 0.5)), str(sc.get("bloom_size", 8))])
