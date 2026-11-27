Handoff chunk 4 of 11: food delivery review queue (Vite, React 19, plain CSS).
Same rules: "Create" writes the file exactly as given, "Append" adds to the end of that file on a new line. Do not run anything yet.

Append to the end of src/index.css:

```css
  font-weight: var(--w-medium);
}

.label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 16px;
  font-weight: var(--w-medium);
  color: var(--ink-2);
}

.field {
  display: block;
  margin-top: 16px;
}

.field-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 16px;
}

.hint {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 16px;
  color: var(--ink-2);
}

.hint.error {
  color: var(--failed-ink);
}

.control {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--fill);
}

.control.money {
  gap: 4px;
  font-weight: var(--w-medium);
}

.control input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: none;
  padding: 0;
  font-weight: var(--w-medium);
  font-variant-numeric: tabular-nums;
}

.control input:focus-visible {
  outline: 0;
}

.control:focus-within {
  /* Text fields change nothing on focus: the caret is the signal */
  outline: 0;
  box-shadow: none;
}

.control.static {
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  line-height: 40px;
}

.control.area {
  display: block;
  padding: 12px;
  border: 0;
  resize: none;
  line-height: 22px;
  font-size: 15px;
}

.control.area:focus-visible {
  /* Text fields change nothing on focus: the caret is the signal */
  outline: 0;
  box-shadow: none;
}

.options {
  display: grid;
  gap: 8px;
}

.option {
  /* The chosen outline is feathered: a thin blue line, a soft halo, then a wider glow fading out */
  --ring: rgba(63, 111, 194, 0);
  --ring-halo: rgba(207, 227, 255, 0);
  --ring-glow: rgba(184, 211, 251, 0);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 48px;
  padding: 12px 16px;
  border-radius: 12px;
  text-align: left;
  font-size: 15px;
  /* The chosen ring fades in: both states keep the same shadow layers, so the colour interpolates */
  box-shadow: 0 0 0 1px var(--ring), 0 0 6px 1px var(--ring-halo), 0 0 18px 3px var(--ring-glow), var(--shadow);
  transition: box-shadow var(--t);
}

@media (hover: hover) {
  .option:hover {
    box-shadow: 0 0 0 1px var(--ring), 0 0 6px 1px var(--ring-halo), 0 0 18px 3px var(--ring-glow), var(--shadow-lift);
  }
}

.option[aria-checked="true"] {
  /* A thin grey outline, the scrollbar thumb's grey, no glow */
  --ring: rgba(0, 0, 0, 0.18);
  --ring-halo: rgba(207, 227, 255, 0);
  --ring-glow: rgba(184, 211, 251, 0);
  box-shadow: 0 0 0 1px var(--ring), 0 0 6px 1px var(--ring-halo), 0 0 18px 3px var(--ring-glow), var(--shadow);
}

.option > .mark {
  margin-top: 3px;
}

.option-body {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.option-label {
  font-weight: var(--w-medium);
}

.next {
  display: grid;
  gap: 2px;
  font-size: 13px;
  line-height: 18px;
  color: var(--ink-2);
}

/* Buttons. The primary action of a case is the only blue button on screen. */

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--joint);
  margin-top: 32px;
}

.btn {
  min-height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: var(--w-medium);
  white-space: nowrap;
  transition: background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.buttons.joined .btn:not(:only-child):first-child {
  border-radius: 999px var(--r-joint) var(--r-joint) 999px;
}

.buttons.joined .btn:not(:only-child):last-child {
  border-radius: var(--r-joint) 999px 999px var(--r-joint);
}

.buttons.joined .btn:not(:first-child):not(:last-child) {
  border-radius: var(--r-joint);
}

.btn.primary {
  background: linear-gradient(to bottom, var(--accent-top), var(--accent-bottom));
  color: var(--on-accent);
}

.btn.quiet {
  background: var(--fill);
}

/* Disabled reads as off: grey, not a faded blue */
.btn:disabled,
.btn.primary:disabled {
  background: var(--fill);
  color: var(--ink-3);
  cursor: default;
}

@media (hover: hover) {
  .btn.primary:not(:disabled):hover {
    background: linear-gradient(to bottom, var(--accent-hover-top), var(--accent-top));
  }
  .btn.quiet:not(:disabled):hover {
    background: var(--fill-hover);
  }
}

/* Evidence */

.receipt .line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
}

.receipt .line:first-child {
  padding-top: 0;
}

.receipt .line:last-child {
  padding-bottom: 0;
}

.receipt .line + .line {
  border-top: 1px solid var(--line);
}

.line-name {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
}

.line-flag {
  padding: 0 8px;
  border-radius: 999px;
  background: linear-gradient(to bottom, var(--failed-tint), var(--failed-fade));
  color: var(--failed-ink);
  font-size: 12px;
  line-height: 20px;
  font-weight: var(--w-medium);
}

.line.missing,
.line.total {
  font-weight: var(--w-medium);
}

.compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--joint);
}

.compare-side {
  display: grid;
  gap: 4px;
  align-content: start;
  padding: 12px 16px;
  border-radius: var(--r-joint);
  /* No grey fill: a thin translucent outline, unobtrusive */
  background: none;
  box-shadow: inset 0 0 0 1px var(--line);
}

.compare-side:first-child {
  border-radius: 12px var(--r-joint) var(--r-joint) 12px;
}

.compare-side:last-child {
  border-radius: var(--r-joint) 12px 12px var(--r-joint);
}

.compare-label {
  font-size: 12px;
  line-height: 16px;
  color: var(--ink-2);
}

.compare-value {
  font-family: "Plus Jakarta Sans", "DM Sans", system-ui, sans-serif;
  font-size: 20px;
  line-height: 24px;
  font-weight: var(--w-medium);
  letter-spacing: -0.01em;
}

.compare-note {
  font-size: 13px;
  line-height: 18px;
  color: var(--ink-2);
}

.pay {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.pay .label {
  margin: 0;
}

.pay-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: var(--w-medium);
}

/* Timeline: a quiet list, times on a fixed column, no row lines */
.log-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  padding: 4px 0;
  color: var(--ink-2);
}

.log-time {
  color: var(--ink-3);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  vertical-align: bottom;
  font-weight: var(--w-medium);
  color: var(--ink);
  white-space: nowrap;
}

/* The status check answering: new log rows rise in, the text and the glyph swap */
.log-item.arrive {
  animation: arrive var(--dur-state) var(--ease-out) backwards;
}

.arrive-text {
  animation: fade var(--dur-state) var(--ease-out) backwards;
}

.swap-in {
  transform-box: fill-box;
  transform-origin: center;
  animation: swap var(--dur-fast) var(--ease-out) backwards;
}

@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}

@keyframes fade {
  from {
    opacity: 0;
  }
}

@keyframes swap {
  from {
    opacity: 0;
    transform: scale(0.25);
    filter: blur(4px);
  }
}

.sent {
  padding: 16px;
  border-radius: 12px;
  background: var(--fill);
  font-size: 15px;
  line-height: 22px;
  white-space: pre-wrap;
}

/* Old pane, kept at ?pane=old for comparison */

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 24px;
  margin-top: 12px;
  color: var(--ink-2);
}

.meta-strong {
  color: var(--ink);
  font-weight: var(--w-medium);
}

.q {
  margin-top: 24px;
}

.meta + .q {
  margin-top: 32px;
}

.q-act {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.body {
  max-width: 640px;
  font-size: 16px;
  line-height: 24px;
  text-wrap: pretty;
}

.why {
  position: relative;
  font-size: 16px;
  line-height: 24px;
  font-weight: var(--w-medium);
  text-wrap: pretty;
}

.q + .q:not(.q-act) {
  margin-top: 10px;
}

.why .mark {
  position: absolute;
  left: -24px;
  top: 4px;
}

.act {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 56px;
  align-items: start;
}

.evidence > :not(.sr-only) ~ :not(.sr-only) {
  margin-top: 24px;
}

.evidence .receipt {
  padding: 8px 16px;
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.evidence .receipt .line:first-child {
  padding-top: 8px;
}

.evidence .receipt .line:last-child {
  padding-bottom: 8px;
}

.facts .fact {
  padding: 12px 0;
  border-top: 1px solid var(--line);
}

.facts .fact:last-child {
  border-bottom: 1px solid var(--line);
}

.fact dt {
  color: var(--ink-2);
  font-size: 13px;
  line-height: 16px;
  font-weight: var(--w-regular);
}

.fact dd {
  margin-top: 4px;
}

/* Toast: rises 8px on the way in, sinks the same 8px faster on the way out */

.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  translate: -50% 0;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: calc(100vw - 32px);
  padding: 4px 4px 4px 20px;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  box-shadow: var(--shadow-lift);
  transition: opacity var(--dur-state) var(--ease-out),
    transform var(--dur-state) var(--ease-out), visibility 0s;
}

@starting-style {
  .toast[data-open="true"] {
    opacity: 0;
    transform: translateY(8px);
  }
}

.toast[data-open="false"] {
  opacity: 0;
  transform: translateY(8px);
  visibility: hidden;
  pointer-events: none;
  transition-duration: var(--dur-exit), var(--dur-exit), 0s;
  transition-delay: 0s, 0s, var(--dur-exit);
}

.toast-text {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.toast button {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-weight: var(--w-medium);
  transition: background-color var(--dur-fast) var(--ease-out);
}

@media (hover: hover) {
  .toast button:hover {
    background: rgba(255, 255, 255, 0.22);
  }
}

/* Queue clear: frosted glass docked as a disc and a pill, over one soft glow per state */

.detail.clear {
  position: relative;
  overflow: hidden;
  touch-action: none;
}

.clear-stage {
  position: relative;
  display: grid;
  place-items: center;
}

.aura {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 480px;
  height: 280px;
  translate: -50% -50%;
  pointer-events: none;
}

.glow {
  position: absolute;
  width: 168px;
  height: 168px;
}

/* Each glow sits off an edge of the glass, so the centre stays clear and only the rim takes colour */
.glow-approval {
  left: 40px;
  top: 64px;
}

.glow-input {
  right: 56px;
  top: 0;
}

.glow-failed {
  right: 96px;
  bottom: 0;
}

.glow-fill {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  filter: blur(36px);
  opacity: 0.85;
  will-change: transform;
  transition: transform var(--dur-delight) var(--ease-out);
}

.glow-approval .glow-fill {
  background: var(--approve-glow);
}

.glow-input .glow-fill {
  background: var(--input-glow);
}

.glow-failed .glow-fill {
  background: var(--failed-glow);
}

/* Static grain on the glow only, never over the type */
.grain {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  mix-blend-mode: multiply;
  background-image: var(--grain);
  -webkit-mask-image: radial-gradient(closest-side, #000 40%, transparent);
  mask-image: radial-gradient(closest-side, #000 40%, transparent);
}

.glass {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--joint);
}

.glass-disc,
.glass-pill {
  display: flex;
  align-items: center;
  height: 56px;
  background: rgba(255, 255, 255, 0.55);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  backdrop-filter: blur(20px) saturate(1.5);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45), 0 1px 2px -1px rgba(0, 0, 0, 0.06),
    0 4px 12px 0 rgba(0, 0, 0, 0.04);
}

.glass-disc {
  justify-content: center;
  width: 56px;
  border-radius: 999px var(--r-joint) var(--r-joint) 999px;
  color: var(--approve-ink);
}

.glass-pill {
  padding: 0 28px 0 22px;
  border-radius: var(--r-joint) 999px 999px var(--r-joint);
  font-size: 20px;
  line-height: 24px;
  font-weight: var(--w-medium);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* Only when the last case is resolved here: the glow blooms and the glass settles, 400ms, then still */
.clear-stage.play .glow {
  animation: bloom var(--dur-delight) var(--ease-out) backwards;
}

.clear-stage.play .glass-disc,
.clear-stage.play .glass-pill {
  animation: settle var(--dur-delight) var(--ease-out) backwards;
}

@keyframes bloom {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}

@keyframes settle {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
}

/* Narrow pane container */

@container (max-width: 720px) {
  .act,
  .case-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .act {
    gap: 32px;
  }

  .evidence {
    order: -1;
  }

  .q-act {
    padding-top: 0;
    border-top: 0;
  }

  .case-head {
    grid-template-columns: minmax(0, 1fr);
  }

  .case-tools {
    grid-column: 1;
    grid-row: auto;
    order: -1;
    margin-bottom: 12px;
  }

  .case-head .back {
    order: -2;
  }

  .field-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
}

/* Narrow screens: list first, case on top of it */

@media (max-width: 860px) {
  .app {
    grid-template-columns: minmax(0, 1fr);
    padding: 16px;
  }

  .app .detail {
    display: none;
  }

  .app.show-detail .detail {
    display: flex;
  }

  .app.show-detail .queue {
    display: none;
  }

  /* Nothing to list: the empty pane takes the space under the switch */
  .app.is-empty {
    grid-template-rows: auto auto minmax(0, 1fr);
  }

  .app.is-empty .detail {
    display: flex;
  }

  .back {
    display: flex;
  }

  .steps {
    display: none;
  }

  .detail-scroll {
    padding: 24px;
  }

  .detail.case .detail-scroll {
    padding: 4px 8px 32px;
  }

  .case-head {
    padding: 0;
  }

  .decision {
    font-size: 24px;
    line-height: 32px;
  }

  /* No margin to hang the glyph in, so it sits at the start of the line */
  .why .mark {
    position: static;
    display: inline-grid;
    margin-right: 8px;
    vertical-align: -3px;
  }
}

/* Reduced motion: nothing travels, scales or blurs; opacity still carries the change */

@media (prefers-reduced-motion: reduce) {
  .seg-pill {
    transition-property: opacity;
  }

  .glow-fill {
    transition: none;
  }

  .toast,
  .toast[data-open="false"] {
    transform: none;
  }

  @starting-style {
    .toast[data-open="true"] {
      transform: none;
    }
  }

  @keyframes pane-forward {
    from {
      opacity: 0;
    }
  }

  @keyframes pane-back {
    from {
      opacity: 0;
    }
  }

  @keyframes arrive {
    from {
      opacity: 0;
    }
  }

  @keyframes swap {
    from {
      opacity: 0;
    }
  }

  @keyframes bloom {
    from {
      opacity: 0;
    }
  }

  @keyframes settle {
    from {
      opacity: 0;
    }
  }
}

/* Focus sheet. Cast: the sheet leads, the docked cluster supports, the scrim decorates,
   the app behind is still. Open: scrim and sheet start together, 250ms on her ease-out,
   the sheet rising 16px from its trigger, scale 0.96 and blur 8px to rest. The cluster lands
   from 80ms, 40ms apart, the last on the 400ms delight tail. Close: all together, 150ms,
   the way it came. Size: a clip-path. The cluster travels on transform. */

.focus {
  --sheet-y: 72px;
  --sheet-x: max(72px, calc((100vw - 1180px) / 2));
  --dock: 44px;
  --kiss: 3px;
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}

.focus[data-open="true"] {
  pointer-events: auto;
}

.focus-scrim {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 10, 0.6);
  opacity: 0;
  -webkit-backdrop-filter: blur(0);
  backdrop-filter: blur(0);
  /* Feather out mirrors the feather in: same length, the scrim lifts as the sheet goes */
  transition: opacity var(--dur-state) var(--ease-out), backdrop-filter var(--dur-state) var(--ease-out),
    -webkit-backdrop-filter var(--dur-state) var(--ease-out);
}

.focus-sheet {
  position: absolute;
  inset: 0;
  background: var(--ground);
  /* The corner the cluster docks to takes the same joint radius as the pill and buttons, for one cohesive shape */
  clip-path: inset(var(--sheet-y) var(--sheet-x) round 24px var(--r-joint) 24px 24px);
  transform-origin: var(--origin, 50% 50%);
  /* Closed: the intro in reverse, so it feathers out the way it came in */
  opacity: 0;
  transform: translateY(16px) scale(0.96);
  filter: blur(8px);
  transition: opacity var(--dur-state) var(--ease-out), transform var(--dur-state) var(--ease-out),
    filter var(--dur-state) var(--ease-out), clip-path var(--dur-state) var(--ease-out);
}

/* Enter start values, applied for one frame with no transition */
.focus[data-phase="pre"] .focus-sheet {
  transform: translateY(16px) scale(0.96);
  filter: blur(8px);
  transition: none;
}

.focus[data-phase="open"] .focus-scrim {
  opacity: 1;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  transition-duration: var(--dur-open);
}

.focus[data-phase="open"] .focus-sheet {
  opacity: 1;
  transform: none;
  filter: none;
  transition-duration: var(--dur-open), var(--dur-open), var(--dur-open), var(--dur-state);
}

.focus[data-full="true"] .focus-sheet {
  clip-path: inset(0 round 0);
}

/* The content keeps one inset in both sizes, so nothing reflows when the sheet grows */
.focus-sheet .detail.case {
  height: 100%;
}

.focus-sheet .detail.case .detail-scroll {
  margin: 0;
  padding: calc(var(--sheet-y) + 40px) calc(var(--sheet-x) + 40px) calc(var(--sheet-y) + 40px);
}

.focus-sheet .detail.case .detail-inner {
  margin: 0 auto;
}

/* Open in focus: the one control with a spring, at her ask. It rests a touch small, springs up
   with a small overshoot when pointed at or focused, dips on press, then springs back. The glyph
   scales, the 40px hit area does not. */
.focus-open > .mark {
  transform: scale(0.88);
  transition: transform 380ms linear(0, 0.157 7.6%, 0.551 17.5%, 0.94 29.4%, 1.075 38.2%, 1.11 44.3%, 1.096 51.5%, 1.012 68.6%, 0.99 78%, 1);
}

@media (hover: hover) {
  .focus-open:hover > .mark {
    transform: scale(1);
  }
}

.focus-open:focus-visible > .mark {
  transform: scale(1);
}

.focus-open:active > .mark {
  transform: scale(0.9);
  transition-duration: 90ms;
  transition-timing-function: var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .focus-open > .mark,
  .focus-open:active > .mark {
    transform: none;
    transition: none;
  }
}

.focus-sheet .focus-open {
  display: none;
}

/* The docked cluster. Its cross point is the sheet's top right corner: the prompt pill sits
   above the sheet ending on its right edge, close sits right of the pill, expand sits under
   close beside the sheet. Kissing shapes, 3px of scrim between them, square at the joints. */
.focus-dock {
  position: absolute;
  top: var(--sheet-y);
  right: var(--sheet-x);
  width: 0;
  height: 0;
  transition: transform var(--dur-state) var(--ease-out);
}

.focus[data-full="true"] .focus-dock {
  transform: translate(
    calc(var(--sheet-x) - 16px - var(--dock) - var(--kiss)),
    calc(16px + var(--dock) + var(--kiss) - var(--sheet-y))
  );
}

.dock-shape {
  position: absolute;
  display: flex;
  align-items: center;
  height: var(--dock);
  background: linear-gradient(to bottom, var(--neutral-top), var(--neutral-bottom));
  box-shadow: 0 1px 2px -1px rgba(0, 0, 0, 0.12), 0 2px 6px 0 rgba(0, 0, 0, 0.06);
  color: var(--ink-2);
  pointer-events: auto;
  opacity: 0;
  transform: scale(0.9);
  filter: blur(4px);
  transition: opacity var(--dur-state) var(--ease-out), transform var(--dur-state) var(--ease-out),
    filter var(--dur-state) var(--ease-out), color var(--dur-fast) var(--ease-out);
}

/* Leaving, everything goes as one: sheet, cluster and scrim on the same slower, softer fade,
   so no button is left behind */
.focus[data-phase="closed"] .dock-shape,
.focus[data-phase="closed"] .focus-sheet,
.focus[data-phase="closed"] .focus-scrim {
```
