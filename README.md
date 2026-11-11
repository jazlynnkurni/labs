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
