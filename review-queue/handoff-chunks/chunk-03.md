Handoff chunk 3 of 11: food delivery review queue (Vite, React 19, plain CSS).
Same rules: "Create" writes the file exactly as given, "Append" adds to the end of that file on a new line. Do not run anything yet.

Create src/index.css:

```css
:root {
  /* Ground and ink */
  --ground: #f6f6f4;
  --surface: #fff;
  --ink: #141414;
  --ink-2: #5c5c5c;
  --ink-3: #696969;
  --line: rgba(0, 0, 0, 0.08);
  --fill: rgba(0, 0, 0, 0.05);
  --fill-hover: rgba(0, 0, 0, 0.08);
  --slab: rgba(0, 0, 0, 0.05);

  /* The signature colour: a soft, feathery pastel blue. The primary action, the toggle thumbs, focus and chosen states. Ink on it is 12:1 or better. */
  --accent: #cfe3ff;
  --accent-hover: #b8d3fb;
  /* Deeper blue for the check inside a chosen answer: white check at 4.9:1 */
  --accent-ring: #3f6fc2;
  --accent-ring-fade: #4a78c9;
  /* Focus and chosen states: a feathered pastel blue, never a black outline */
  --focus-ring: 0 0 6px 1px rgba(207, 227, 255, 0.5), 0 0 18px 3px rgba(184, 211, 251, 0.9);
  --on-accent: #141414;

  /* States: ink for glyphs and text (5.2:1 or better on their tint), tint for fills, glow for the soft body */
  --approve-ink: #1e6b3b;
  --approve-tint: #e3efe0;
  --approve-glow: #c6e4bf;
  --input-ink: #8a5100;
  --input-tint: #f7e9d1;
  --input-glow: #f6d9a6;
  --failed-ink: #b0291f;
  --failed-tint: #f8dfdb;
  --failed-glow: #f6c2ba;

  /* The agent's own words: a quiet purple to blue to rose line, every stop 5.2:1 or better on white */
  --agent-1: #5a4ba0;
  --agent-2: #3d62b5;
  --agent-3: #a44f7e;

  /* Avatars: soft tints that only tell people apart, ink initials at 14:1 or better */
  --avatar-0: #e3ebe1;
  --avatar-1: #f4e2e6;
  --avatar-2: #eae3f0;
  --avatar-3: #e0e8f4;
  --avatar-4: #f7e5d5;
  --avatar-5: #ecebd6;

  /* Colour fades, after Ramp's charts: full tint at the top, near white at the base. Matte. */
  --thumb-top: var(--accent);
  --thumb-bottom: #f5f9ff;
  --accent-top: var(--accent);
  --accent-bottom: #f5f9ff;
  --accent-hover-top: var(--accent-hover);
  --approve-fade: #f6faf5;
  --input-fade: #fdf8ef;
  --failed-fade: #fdf5f3;
  --neutral-top: #fff;
  --neutral-bottom: #f1f1ef;

  --shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06),
    0 2px 4px 0 rgba(0, 0, 0, 0.04);
  --shadow-lift: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.08),
    0 4px 8px 0 rgba(0, 0, 0, 0.05);

  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -1.2 1.1'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");

  /* Type: nothing is ever heavier than medium. Hierarchy comes from size, ink and space. */
  --w-regular: 400;
  --w-medium: 500;

  /* Joined slabs: outer corners round, inner joints nearly square, a hairline gap between */
  --r-outer: 16px;
  --r-joint: 4px;
  --joint: 4px;
  /* The toggle thumb sits --inset inside its slab, so its corners are concentric with the slab's */
  --r-slab: var(--r-outer);
  --inset: 4px;
  --r-thumb: calc(var(--r-slab) - var(--inset));
  /* Every card's inner padding, all four sides */
  --card-pad: 20px;
  /* Scroll edges feather instead of cutting */
  --feather: 20px;

  /* Motion, one set. JS reads these too (src/motion.js). */
  --ease-out: cubic-bezier(0.2, 0.8, 0.1, 1); /* every enter, exit, state change and slide */
  --ease-move: cubic-bezier(0.77, 0, 0.175, 1); /* rows travelling to close a gap */
  --dur-state: 250ms; /* state changes, the pane, the toast, the toggle glass */
  --dur-menu: 180ms; /* menus and popovers, none in this build yet */
  --dur-fast: 160ms; /* icon swaps, hover in */
  --dur-exit: 150ms; /* exits are shorter than enters */
  --dur-close: 320ms; /* the focus sheet closing: one unhurried fade, everything together */
  --dur-open: 320ms; /* the focus sheet opening: the same, everything arrives as one */
  --dur-delight: 400ms; /* the last ending bit: queue clear */
  --t: var(--dur-state) var(--ease-out);
}

* {
  box-sizing: border-box;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  line-height: 20px;
  font-weight: var(--w-regular);
}

h1,
h2 {
  font-family: "Plus Jakarta Sans", "DM Sans", system-ui, sans-serif;
  font-weight: var(--w-medium);
}

h3,
h4,
b,
strong,
dt,
th {
  font-weight: var(--w-medium);
}

h1,
h2,
h3,
h4,
p,
dl,
dd,
ul,
ol {
  margin: 0;
  padding: 0;
}

ul,
ol {
  list-style: none;
}

button,
input,
textarea {
  font: inherit;
  color: inherit;
}

button {
  cursor: pointer;
  border: 0;
  background: none;
  padding: 0;
}

:focus-visible {
  outline: 0;
  box-shadow: var(--focus-ring);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.num {
  font-variant-numeric: tabular-nums;
}

.late {
  color: var(--failed-ink);
}

.strong {
  font-weight: var(--w-medium);
}

/* Icon family: frosted marks. A glow body, a glass highlight, static grain, a crisp glyph. */

.mark {
  position: relative;
  display: inline-grid;
  place-items: center;
  flex: none;
  border-radius: 50%;
  color: var(--mark-ink);
  background: linear-gradient(to bottom, var(--mark-glow), var(--mark-fade));
  box-shadow: inset 0 0 0 1px var(--mark-rim), 0 0 6px 0 var(--mark-halo);
}

.mark::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: var(--grain);
  background-size: 70px;
  opacity: 0.22;
  mix-blend-mode: multiply;
  pointer-events: none;
}

.mark .glyph {
  position: relative;
  z-index: 1;
}

.glyph path {
  vector-effect: non-scaling-stroke;
  stroke-width: 1.4px;
}

.tone-approval {
  --mark-ink: var(--approve-ink);
  --mark-glow: var(--approve-glow);
  --mark-tint: var(--approve-tint);
  --mark-rim: color-mix(in srgb, var(--approve-ink) 16%, transparent);
  --mark-halo: color-mix(in srgb, var(--approve-glow) 60%, transparent);
  --mark-fade: var(--approve-fade);
}

.tone-input {
  --mark-ink: var(--input-ink);
  --mark-glow: var(--input-glow);
  --mark-tint: var(--input-tint);
  --mark-rim: color-mix(in srgb, var(--input-ink) 16%, transparent);
  --mark-halo: color-mix(in srgb, var(--input-glow) 60%, transparent);
  --mark-fade: var(--input-fade);
}

.tone-failed {
  --mark-ink: var(--failed-ink);
  --mark-glow: var(--failed-glow);
  --mark-tint: var(--failed-tint);
  --mark-rim: color-mix(in srgb, var(--failed-ink) 16%, transparent);
  --mark-halo: color-mix(in srgb, var(--failed-glow) 60%, transparent);
  --mark-fade: var(--failed-fade);
}

/* Clear glass: icon buttons and an empty radio. No grey tile, the glyph colour is the feedback. */
.tone-neutral {
  --mark-ink: currentColor;
  --mark-glow: var(--neutral-top);
  --mark-fade: var(--neutral-bottom);
  --mark-rim: var(--line);
  --mark-halo: transparent;
}

/* Grey: a chosen radio, white check at 4.3:1 */
.tone-ink {
  --mark-ink: #fff;
  --mark-glow: #7a7a7a;
  --mark-fade: #8a8a8a;
  --mark-rim: transparent;
  --mark-halo: rgba(0, 0, 0, 0.12);
}

.avatar {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 11px;
  line-height: 1;
  font-weight: var(--w-medium);
  color: var(--ink);
}

.avatar[data-tone="0"] {
  background: var(--avatar-0);
}
.avatar[data-tone="1"] {
  background: var(--avatar-1);
}
.avatar[data-tone="2"] {
  background: var(--avatar-2);
}
.avatar[data-tone="3"] {
  background: var(--avatar-3);
}
.avatar[data-tone="4"] {
  background: var(--avatar-4);
}
.avatar[data-tone="5"] {
  background: var(--avatar-5);
}

/* Layout */

.app {
  height: 100dvh;
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  column-gap: 24px;
  padding: 24px;
}

/* The title sits on the queue column's edge, the same line as the slabs */
.top {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 40px;
  padding: 0 0 16px;
}

.brand {
  flex: none;
  font-size: 20px;
  line-height: 28px;
  letter-spacing: -0.02em;
}

.stats {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;
  font-size: 14px;
  color: var(--ink-2);
}

.stat {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.stat-n {
  color: var(--ink);
  font-weight: var(--w-medium);
}

.reset,
.back,
.step {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--ink-3);
  transition: color var(--dur-fast) var(--ease-out);
}

.reset {
  margin: -8px -8px -8px 0;
}

.step:disabled {
  opacity: 0.4;
  cursor: default;
}

@media (hover: hover) {
  .reset:hover,
  .back:hover,
  .step:not(:disabled):hover {
    color: var(--ink);
  }
}

/* Queue */

.queue {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.slabs {
  display: grid;
  gap: var(--joint);
  margin-bottom: 16px;
}

.slab {
  position: relative;
  padding: var(--inset);
  background: var(--slab);
  border-radius: var(--r-joint);
}

.slab:first-child {
  border-top-left-radius: var(--r-outer);
  border-top-right-radius: var(--r-outer);
}

.slab:last-child {
  border-bottom-left-radius: var(--r-outer);
  border-bottom-right-radius: var(--r-outer);
}

/* Segmented: one glass pill glides under the labels (src/components/Segmented.jsx) */

/* Equal cells that fill the slab, label and count centred together as one unit */
.seg {
  position: relative;
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: 4px;
}

/* The thumb: pastel blue fading to near white, one soft shadow that hugs it */
.seg-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  filter: drop-shadow(0 0 0.5px rgba(0, 0, 0, 0.18)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.08));
}

.seg-pill {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, var(--thumb-top), var(--thumb-bottom));
  transition: clip-path var(--dur-state) var(--ease-out);
}

.seg-opt {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  min-height: 40px;
  padding: 0 8px;
  border-radius: var(--r-thumb);
  font-size: 13px;
  font-weight: var(--w-medium);
  white-space: nowrap;
  color: var(--ink-2);
  transition: color var(--t);
}

.seg-opt[aria-checked="true"] {
  color: var(--ink);
}

@media (hover: hover) {
  .seg-opt[aria-checked="false"]:hover {
    color: var(--ink);
  }
}

.seg-count {
  display: inline-flex;
  color: var(--ink-3);
  font-weight: var(--w-regular);
  transition: color var(--t);
}

/* Odometer digits: a fixed box each, the roll is clipped inside it */
.digit {
  position: relative;
  display: inline-block;
  overflow: hidden;
  height: 20px;
}

.digit .d {
  display: block;
}

.digit .ghost {
  position: absolute;
  inset: 0;
}

.seg-opt[aria-checked="true"] .seg-count {
  color: var(--ink-2);
}

/* Feathered scroll edges, set by App only when an edge has content beyond it */
[data-fade="top"] {
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 var(--feather));
  mask-image: linear-gradient(to bottom, transparent, #000 var(--feather));
}

[data-fade="bottom"] {
  -webkit-mask-image: linear-gradient(to top, transparent, #000 var(--feather));
  mask-image: linear-gradient(to top, transparent, #000 var(--feather));
}

[data-fade="both"] {
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent,
    #000 var(--feather),
    #000 calc(100% - var(--feather)),
    transparent
  );
  mask-image: linear-gradient(
    to bottom,
    transparent,
    #000 var(--feather),
    #000 calc(100% - var(--feather)),
    transparent
  );
}

.rows {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* A hairline scrollbar: 4px, faint thumb, no track (WebKit below, Firefox falls back to thin) */
  margin: 0 -8px;
  padding: 0 8px 8px;
}

.rows li + li {
  margin-top: 4px;
}

/* Selection is instant: rows are moved through with j and k many times a day */
.row {
  width: 100%;
  min-height: 64px;
  display: grid;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 12px;
  text-align: left;
}

.row[aria-current="true"] {
  background: var(--surface);
  box-shadow: var(--shadow);
}

@media (hover: hover) {
  .row[aria-current="false"]:hover {
    background: var(--surface);
    box-shadow: var(--shadow);
    transition: box-shadow var(--dur-fast) var(--ease-out),
      background-color var(--dur-fast) var(--ease-out);
  }
  .row[aria-current="true"]:hover {
    box-shadow: var(--shadow-lift);
  }
}

.row.ghost {
  position: absolute;
  pointer-events: none;
}

.row-title {
  font-weight: var(--w-medium);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  line-height: 16px;
  color: var(--ink-2);
}

.row-status {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.row-status span:not(.mark) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Empty and old panes share the white card */

.detail {
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: 20px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.detail.empty {
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 24px;
  font-weight: var(--w-medium);
}

.detail-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* A hairline scrollbar: 4px, faint thumb, no track (WebKit below, Firefox falls back to thin) */
  container-type: inline-size;
  padding: 48px 56px 56px;
}

.detail-inner {
  max-width: 880px;
}

/* After a resolve the next case arrives from the right, after an undo from the left */
.enter-forward .detail-inner {
  animation: pane-forward var(--dur-state) var(--ease-out) backwards;
}

.enter-back .detail-inner {
  animation: pane-back var(--dur-state) var(--ease-out) backwards;
}

@keyframes pane-forward {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
}

@keyframes pane-back {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
}

.back {
  display: none;
  margin: -8px 0 8px -8px;
}

/* Case pane: structured like a review page. Header, key facts with the reason docked under
   them, the agent's recommendation card with its action bar, then evidence modules. */

.detail.case {
  background: none;
  box-shadow: none;
  border-radius: 0;
  overflow: visible;
}

.detail.case .detail-scroll {
  margin: -4px -8px 0;
  padding: 4px 8px 48px;
}

.detail.case .detail-inner {
  max-width: 1040px;
}

/* The headline's left edge and every card's outer edge share one line; card content is
   indented by --card-pad on all four sides. */
.case-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  column-gap: 24px;
  padding: 0;
}

.case-head .decision {
  grid-column: 1;
}

.case-tools {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
}

.case-sub {
  grid-column: 1 / -1;
  max-width: 720px;
  margin-top: 8px;
  font-size: 15px;
  line-height: 22px;
  color: var(--ink-2);
  text-wrap: pretty;
}

.decision {
  font-size: 28px;
  line-height: 36px;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.pill-state,
.pill-time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: var(--w-medium);
  white-space: nowrap;
}

.pill-state.tone-approval {
  background: linear-gradient(to bottom, var(--approve-tint), var(--approve-fade));
  color: var(--approve-ink);
}
.pill-state.tone-input {
  background: linear-gradient(to bottom, var(--input-tint), var(--input-fade));
  color: var(--input-ink);
}
.pill-state.tone-failed {
  background: linear-gradient(to bottom, var(--failed-tint), var(--failed-fade));
  color: var(--failed-ink);
}

.pill-time {
  background: var(--slab);
  color: var(--ink-2);
}

.steps {
  display: flex;
  margin-right: -8px;
}

.case-stack {
  display: grid;
  gap: var(--joint);
  margin-top: 24px;
}

/* Key facts: one card cut into cells by hairlines, never two lines in a row */
.facts-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1px;
  overflow: hidden;
  border-radius: var(--r-outer) var(--r-outer) var(--r-joint) var(--r-joint);
  background: var(--line);
  box-shadow: var(--shadow);
}

.cell {
  display: grid;
  align-content: start;
  gap: 4px;
  min-width: 0;
  padding: 12px var(--card-pad);
  background: var(--surface);
}

.cell-label {
  font-size: 12px;
  line-height: 16px;
  color: var(--ink-2);
}

.cell-value {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  white-space: nowrap;
}

.cell-value > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* The mark sits inline at the start, so the callout text block keeps the pane's one text edge */
.callout {
  display: block;
  padding: 12px var(--card-pad);
  border-radius: var(--r-joint) var(--r-joint) var(--r-outer) var(--r-outer);
  box-shadow: var(--shadow);
  font-size: 15px;
  line-height: 22px;
  font-weight: var(--w-medium);
  text-wrap: pretty;
}

.callout .mark {
  margin-right: 8px;
  vertical-align: -4px;
}

.callout.tone-approval {
  background: linear-gradient(to bottom, var(--approve-tint), var(--approve-fade));
}
.callout.tone-input {
  background: linear-gradient(to bottom, var(--input-tint), var(--input-fade));
}
.callout.tone-failed {
  background: linear-gradient(to bottom, var(--failed-tint), var(--failed-fade));
}

.case-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  margin-top: 16px;
}

.case-col {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.card {
  min-width: 0;
  padding: var(--card-pad);
  border-radius: var(--r-outer);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.card-title {
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 16px;
  color: var(--ink-2);
}

/* The recommendation card and its docked action bar */
.rec {
  display: grid;
  gap: var(--joint);
}

.rec > .card {
  border-radius: var(--r-outer) var(--r-outer) var(--r-joint) var(--r-joint);
}

.rec-title {
  font-size: 17px;
  line-height: 24px;
  font-weight: var(--w-medium);
}

.rec-note {
  margin-top: 4px;
  color: var(--ink-2);
  text-wrap: pretty;
}

.agent-voice {
  width: fit-content;
  background: linear-gradient(90deg, var(--agent-1), var(--agent-2) 55%, var(--agent-3));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--joint);
  padding: var(--card-pad);
  border-radius: var(--r-joint) var(--r-joint) var(--r-outer) var(--r-outer);
  background: var(--surface);
  box-shadow: var(--shadow);
}

/* The bar is a card: its first button's edge sits on the card text edge */
.bar .btn {
  border-radius: var(--r-joint);
}

.bar .btn:first-child {
  border-radius: 12px var(--r-joint) var(--r-joint) 12px;
}

.bar .btn:last-child {
  border-radius: var(--r-joint) 12px 12px var(--r-joint);
}

.bar .btn:only-child {
  border-radius: 12px;
}

/* Key and value list inside a module: lines only between rows */
.kv > div {
  display: grid;
  grid-template-columns: minmax(96px, 0.8fr) minmax(0, 1.4fr);
  gap: 12px;
  padding: 8px 0;
}

.kv > div + div {
  border-top: 1px solid var(--line);
}

.kv > div:first-child {
  padding-top: 0;
}

.kv > div:last-child {
  padding-bottom: 0;
}

.kv dt {
  font-weight: var(--w-regular);
  color: var(--ink-2);
}

/* Fields */

.proposal {
  font-size: 16px;
  line-height: 24px;
```
