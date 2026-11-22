# labs

Personal prototypes, each its own folder, each served on its own port with
`python3 -m http.server <port>` from inside the folder (walk-lab has its own
`serve.py`).

| folder | what | port |
|---|---|---|
| `bubbles` | soap bubbles, thin-film interference, real pops | 5450 |
| `ink-lab` | a painting brought to life, then printed through an ink-bleed chain | 5460 |
| `cloth-clock` | a retractable clock made of cloth, XPBD with crease memory | 5470 |
| `vellum-discs` | overlapping translucent paper discs | 5480 |
| `rosette` | graphite diffraction star and rosette, very slow | 5490 |
| `walk-lab` | a man with a briefcase walking from gait-lab data, five render styles, the Out of Office footer | 6110 (editor 6120, three-man line 6130) |
| `tp-lab` | paintings printed on embossed toilet paper: one WebGL shader, five embossings, every knob a slider, drop any painting | 6140 |
| `porcelain-lab` | the rednote frosted-porcelain look: Blender scenes (`./render.sh --quick`) and a live three.js version in `web/` with five pastel colourways and a jelly mode | 6150 |
| `menu-lab` | five liquid-glass menus, every motion a spring: bead, pour, orbit, tide, split | 6160 |
| `search-lab` | a universal search for Dia: one bar over docs, mail, meetings, files and tabs, with a reading of what you might mean | 6170 |
| `emboss-seal` | SwiftUI port of the embossed paste texture, Metal shader, gravity-lit | Xcode |
| `tiles-lab` | the cut-sticker tiles from `~/Desktop/tiles.JPG`: one tile that blooms near the cursor, five colourways, a bare tree that comes into leaf as you hover its branches. `python3 serve.py 6450` (no-cache) | 6450 |
| `flower-lab` | one pink calla lily from `~/Desktop/IMG_4600.JPG`, close up, a parametric spathe in WebGL2 with waxy shading, light through the petal and veins. `python3 serve.py 6470` | 6470 |
| `thermal-lab` | a thermal camera from `~/Desktop/thermal.png`: a black page with an unseen figure, hover pours heat in that spreads along the body and shows it through the thermal ramp. `python3 serve.py 6480` | 6480 |
| `boxing-lab` | the boxing GIF in code: two paper-puppet fighters made of clothes and floating fists, ten render styles behind `?all`; locked to Glass, on white through the Out of Office footer's glass (a purple backing silhouette, bloom, split plates, a floor that reflects). `python3 serve.py 6490` | 6490 |
| `ramp-lab` | a Ramp purchase landing in the Card Into Island format, base UI from Ramp's own iPhone screens: quiet Apple Pay, Greenleaf Kitchen lands in Recent expenses, a lime light runs the screen edge once and traces a miniature of the same Ramp Visa in the Dynamic Island; compact card and amount, press and hold for Apple's expanded layout (Spent from Team Meals), tap for the transaction; Receipt required toggle, slow-motion replay, SwiftUI printout. `python3 serve.py 6500` | 6500 |
| `chalk-lab` | the chalk-horse folder from her reference, now worn aluminium: a GLSL fragment shader (brushed streaks, three sizes of scratches, rust gated by noisy edge wear, a few warped spots, the photo's three lines as deep scores) under blue-white chalk horses galloping left to right (Muybridge footfall order, eroded outline, rubbed fill, dust halo). `before-metal/` is the concrete version. `?t=` holds one moment. `python3 serve.py 6510` | 6510 |
| `ascii-horse-lab` | the chalk-lab gallop on its own in ASCII, shot like stop motion: ten frames a second, eight drawings a stride, outline strokes (- _ \| / \\) follow the shape, the dotted fill boils every frame. `?t=` holds a frame. `python3 serve.py 6520` | 6520 |
| `horse-folder-lab` | the archival three-folder icon with chalk horses galloping frame by frame. Horses traced from Muybridge's 1878 Sallie Gardner plate (public domain, jockey cut away), redrawn as chalk by `tools/draw_frames.py`; texture is four canvas layers tuned to the reference's measured grain. Final `index.html`: a React component (`HorseFolder.js`, React from esm.sh) with idle, hover, file drag-over, drop into the pocket (saved in this browser's IndexedDB) and click to open an index-card file list; floor reflection; horses gallop on a loop at all times, travelling right to left at Muybridge's real stride. Review pages per stage: `analysis.html`, `stage1.html` to `stage5.html`. `python3 serve.py 6530` | 6530 |
| `disc-motion-lab` | five ways the portfolio hero's circles could say they move, on her swatches and formation: 1 Albers (lean, drag, overlaps recolour, spring home), 2 Kandinsky (dark, breathing, throw and knock), 3 Matisse paper (hover lifts on a shadow, stays where dropped), 4 common fate (part around the cursor, no clicking), 5 liquid (drops merge and stretch). `python3 serve.py 6550` | 6550 |
| `liquid-lab` | the liquid direction as a component on its own, centred, in her swatches, plus five variations: mercury (lit metal on night), ink in water (watercolour rims and grain), lava lamp (drifts on its own, hand is heat), goo (long strings when pulled), glass lens (clear drops bending her words). Shared field engine in `liquid.js`. `python3 serve.py 6560` | 6560 |
| `paper-wall-lab` | her word wall as paper on a white page: ransom cut-outs, torn strips, accordion fold, torn through the page, peeling flaps, signature peel with easter eggs. Newsprint is drawn, not quoted. `python3 serve.py 6570` | 6570 |
| `wordmark-lab` | JAZLYNN in the manner of the TOSCA lettering: five SVG wordmarks (classic, roofed, tall, swash, heavy) with bulb terminals and shared strokes, PNGs in `png/`. `python3 serve.py 6580` | 6580 |
