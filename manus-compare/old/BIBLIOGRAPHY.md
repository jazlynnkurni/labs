# Research used across the Clover work

Compiled 12 October 2026. Split by **how well I can vouch for it**, which matters more than the
topic grouping: anything in Tier 1 I fetched and read myself in this session.

---

## Tier 1 — verified in this session, primary source fetched

| Paper | Venue | Link |
|---|---|---|
| **Laput, G. & Harrison, C.** *Sensing Fine-Grained Hand Activity with Smartwatches* | CHI 2019 | [PDF](https://chrisharrison.net/projects/handactivities/HandActivities.pdf) · `10.1145/3290605.3300568` |
| **Mark, G., Gonzalez, V. & Harris, J.** *No Task Left Behind? Examining the Nature of Fragmented Work* | CHI 2005 | [PDF](https://www.interruptions.net/literature/Mark-CHI05-p321-mark.pdf) · `10.1145/1054972.1055017` |
| **Rzayev, R., Woźniak, P., Dingler, T. & Henze, N.** *Reading on Smart Glasses* | CHI 2018 | `10.1145/3173574.3173619` |
| **Hsiao, C-Y., Liu, D-C., Chang, C-C. & Liu, M-H.** *Evaluating typeface, letter spacing and line spacing on text legibility in optical see-through HMDs while walking* | Applied Ergonomics 2026 | `10.1016/j.apergo.2025.104683` |
| **Emsenhuber, G., Langlotz, T., Kalkofen, D., Sutton, J. & Tatzgern, M.** *Eye-Perspective View Management for Optical See-Through HMDs* | CHI 2023 | `10.1145/3544548.3581059` |
| **Lee, H., Bang, S. & Woo, W.** *Effects of coordinate system and position of AR notification while walking* | Virtual Reality 2022 | `10.1007/s10055-022-00693-9` |
| **Lu, Y. et al.** *Proactive Agent: Shifting LLM Agents from Reactive Responses to Active Assistance* | arXiv 2024 (preprint, not peer reviewed) | [arXiv:2410.12361](https://arxiv.org/abs/2410.12361) |

**Key numbers from Tier 1**

- **Laput & Harrison:** 95.2% across 25 hand activities, 50 participants, ~1,000 worn hours. Contains
  the one-paragraph proposal to gate notifications on hand state that nobody then built.
- **Mark et al.:** **11 min 4 sec** in a working sphere before switching. Interrupted segments lasted
  **longer** (12:40) than uninterrupted ones (8:58). **2.26** intervening spheres before resuming.
- **Lu et al.:** ProactiveBench, 6,790 events, 233-event test split. Best model **66.47% F1** at
  deciding when to offer help unprompted.

---

## Tier 2 — used in the work, sourced by research passes, not personally re-verified

### HUD text and reading
- **Öquist & Lundin 2007** — paging read faster than scrolling and RSVP, lowest NASA-TLX
- **Gannon 2016** — smartwatch RSVP: 40 WPM faster, same comprehension, workload 77 vs 53
- **Huang, IJHCI 2023** — "display a few lines at a time and let users advance manually"
- ***Keep it Short*, CHI 2022** — keyword-style assistant replies read as more efficient
- **CHI 2023** — extra inter-line spacing on an optical HMD: +11.9% reading speed, +106.8% comfort

### Interruption and attention
- **Horvitz, CHI 1999** — *Principles of Mixed-Initiative User Interfaces*. The threshold framework
- **Fogarty et al., TOCHI 2005** — sensors predicted interruptibility **82.4%** vs human observers **76.9%**
- **Monk & Trafton 2008** — goal decay, roughly a one-minute curve
- **Pizza et al., CHI 2016** and **Visuri et al., CHI 2017** — median wearable glance session ~5s

### Gesture, haptics and input
- **Brown et al., MobileHCI 2006** — 27 vibration patterns 47.8% correct, 18 patterns 80.6%.
  Rhythm 96.7%, location 95.5%, **intensity 50.2%**
- **Nacenta, Kamber, Qiang & Kristensson, CHI 2013** — gesture memorability. Next-day recall
  user-defined 92-97%, expert-designed 71-89%. Failures are **association**, not form
- **Annett et al., Graphics Interface 2014** — latency discrimination **59ms** when the hand is
  visible, **97ms** when it is not
- **Kaifosh, Reardon et al., Nature 2025** — Meta sEMG wristband, handwriting at 20.9 WPM

### Ring and wrist sensing
TextureSight (IMWUT 2023) · IRIS (UIST 2024) · Ring-a-Pose (IMWUT 2024) · Wrist2Finger (UIST 2025) ·
Grab-n-Go (IMWUT 2025) · HIPPO (IMWUT 2022) · Z-Ring / Z-Band (IMWUT) · OmniRing (IoTDI 2023) ·
LaserShoes (CHI 2023) · ViObject (IMWUT 2024) · HandSAW (IMWUT 2025) · EI-Lite (UIST 2025) ·
picoRing dual (ISWC 2026) · *Computing with Smart Rings* systematic review (arXiv 2502.02459)

### Speech and privacy
- **Koenecke et al., PNAS 2020** — ASR word error 0.35 for Black speakers vs 0.19 for white speakers
- **Farhadipour, Asadi & Dellwo 2024** (arXiv 2407.21211) — whispered speech 18.8% WER vs 16.69% normal
- **Dubois et al., PETS 2020** — smart speakers misactivating up to **19 times a day**

---

## Numbers to refuse

Verified fabricated, misattributed, or vendor marketing. These circulate widely and several of them
top the search results for their topic.

- **"23 minutes 15 seconds to refocus after an interruption."** Attributed to Gloria Mark constantly.
  Appears in **no paper of hers**, including CHI 2005
- **"Kern & Schiele: 46% increase in notification response rate."** The string "46" is not in that
  paper. The real figure is 94.6%
- **"146 notifications a day"**, **"a third abandon wearables"**, the **6-word and 12-word**
  glanceable-text rules — all unsourced
- **"2.7x higher 30-day retention from Live Activities."** Traces to a push vendor's claim about
  something else
- **"85% of active iPhones run iOS 16+."** A misread of Apple's "86% of devices introduced in the
  last four years"
- **Any battery percentage attributed to Live Activities.** No credible measurement exists
- **Solid-state ring battery projections.** Battery-vendor marketing
- **A "5.5ms haptic latency threshold."** Untraceable to any primary study
