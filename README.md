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
