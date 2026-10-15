# porcelain lab

The frosted-porcelain look of the rednote May calendar (seethis.JPG), rebuilt
as Blender scenes. `porcelain.py` is the look (material, lights, colour,
bloom); each file in `scenes/` is one object built from lathes, blobs and
curves, and renders itself to `renders/`.

    ./render.sh --quick        # all five, small and fast
    ./render.sh 03             # one, full size
    BLENDER=/path/to/Blender ./render.sh

1. pot: the reference, a bowl of chestnuts, floating lid, black curled handle
2. teapot: amber tea as a horizon inside the frost, cup poured
3. candy jar: pastel sweets blurred into colour fields
4. vase: a gourd with water, a black branch, blossoms
5. cloche: a dome lifted over a cake

Knobs worth touching: `frosted(frost=…)` 0.3 milky glass to 0.8 bone china;
`soft(…, glow=…)` how much the contents bloom through; `lights(scale)`;
`bloom(strength, size)`; `view_settings.exposure` in `reset()`.
