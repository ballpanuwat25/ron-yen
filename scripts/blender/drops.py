# Condensation on the hero's window, rendered as water: drops of every size on a long strip of glass, with
# the ice behind them, lit warm from the sauna side. Each drop is a lens, so it shows the ice upside down,
# a dark rim and a warm glint, as real beads on a cold window do. Run by scripts/build-glass-drops.py.
#   D:\blender.exe -b -P scripts/blender/drops.py -- <ice image> <out dir>
import bpy, math, os, random, sys

ice_path, out = sys.argv[sys.argv.index('--') + 1:][:2]
W, H, PX = 6.0, 1.0, 400          # the strip in Blender units, and pixels per unit (2400 by 400)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- the drops: power-law sizes, larger ones sparse, none overlapping ----------
random.seed(11)
placed, cell = [], .05
grid = {}
def free(x, y, r):
    gx, gy = int(x / cell), int(y / cell)
    for i in range(gx - 2, gx + 3):
        for j in range(gy - 2, gy + 3):
            for (px, py, pr) in grid.get((i, j), ()):
                if (x - px) ** 2 + (y - py) ** 2 < (r + pr + .002) ** 2: return False
    return True
for n, (r0, r1) in [(45, (.03, .055)), (420, (.012, .03)), (5200, (.003, .012))]:
    tries = 0
    while n and tries < n * 40:
        tries += 1
        r = r0 + (r1 - r0) * random.random() ** 2
        x, y = random.uniform(-W / 2, W / 2), random.uniform(-H / 2, H / 2)
        if free(x, y, r):
            placed.append((x, y, r)); grid.setdefault((int(x / cell), int(y / cell)), []).append((x, y, r)); n -= 1

water = bpy.data.materials.new('water'); water.use_nodes = True
nt = water.node_tree; nt.nodes.clear()
glass = nt.nodes.new('ShaderNodeBsdfGlass'); glass.inputs['IOR'].default_value = 1.33; glass.inputs['Roughness'].default_value = .02
outn = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(glass.outputs[0], outn.inputs['Surface'])

bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1)
proto = bpy.context.object; mesh = proto.data; mesh.materials.append(water)
bpy.data.objects.remove(proto)
coll = bpy.data.collections.new('drops'); scene.collection.children.link(coll)
for i, (x, y, r) in enumerate(placed):
    o = bpy.data.objects.new(f'drop{i}', mesh); coll.objects.link(o)
    # a bead on glass is a flattened cap, a little longer downward where its weight pulls
    o.location = (x, y, 0); o.scale = (r, r * (1.04 + random.random() * .08), r * .55); o.pass_index = 1

# ---------- the ice behind the glass ----------
img = bpy.data.images.load(os.path.abspath(ice_path))
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, -.6)); back = bpy.context.object
back.scale = (W * 1.4, W * 1.4 * img.size[1] / img.size[0], 1)
bm = bpy.data.materials.new('ice'); bm.use_nodes = True; t = bm.node_tree; t.nodes.clear()
tex = t.nodes.new('ShaderNodeTexImage'); tex.image = img
em = t.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.1
o2 = t.nodes.new('ShaderNodeOutputMaterial')
t.links.new(tex.outputs['Color'], em.inputs['Color']); t.links.new(em.outputs[0], o2.inputs['Surface'])
back.data.materials.append(bm)

# ---------- the room's light on the camera side: warm, from above and to the left ----------
bpy.ops.object.light_add(type='AREA', location=(-1.5, 1.6, 2.2)); l = bpy.context.object
l.data.size = 2.5; l.data.energy = 900; l.data.color = (1, .55, .3)
l.rotation_euler = (math.radians(-35), math.radians(-30), 0)
world = bpy.data.worlds.new('room'); scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (.25, .06, .02, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = .6

bpy.ops.object.camera_add(location=(0, 0, 3)); cam = bpy.context.object
cam.data.type = 'ORTHO'; cam.data.ortho_scale = W; scene.camera = cam

r = scene.render
r.engine = 'CYCLES'; scene.cycles.samples = 48; scene.cycles.use_denoising = True
r.resolution_x, r.resolution_y = int(W * PX), int(H * PX)
scene.view_settings.view_transform = 'Standard'
scene.view_layers[0].use_pass_object_index = True
os.makedirs(out, exist_ok=True)

# the drops as seen, and then a mask of where they are: the same view with the drops flat white
r.filepath = os.path.join(out, 'beauty.png'); bpy.ops.render.render(write_still=True)
glass_out = glass.outputs[0]
white = nt.nodes.new('ShaderNodeEmission'); white.inputs['Color'].default_value = (1, 1, 1, 1)
nt.links.new(white.outputs[0], outn.inputs['Surface'])
em.inputs['Strength'].default_value = 0
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
l.data.energy = 0
scene.cycles.samples = 8; scene.cycles.use_denoising = False
r.filepath = os.path.join(out, 'mask.png'); bpy.ops.render.render(write_still=True)
