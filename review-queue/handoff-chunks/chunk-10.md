Handoff chunk 10 of 11: food delivery review queue (Vite, React 19, plain CSS).
Same rules: "Create" writes the file exactly as given, "Append" adds to the end of that file on a new line. Do not run anything yet.

Create src/intro/faces.js:

```js
// What shows through each capsule's front window, one painter per direction.
// Every painter draws all three faces into one atlas canvas, in face space
// (FACE_W x FACE_H, y down), on a clear background: the shader lays the near
// white plate and the marshmallow veil around it.

import { FACE_W, FACE_H, FACE_PAD, PERIOD } from "./shader.js";
import { cases, TOTAL_TODAY } from "../data.js";

const W = FACE_W;
const H = FACE_H;

// Colours copied from the app's role tokens (src/index.css), not new ones.
const INK = "#141414";
const INK_2 = "#5c5c5c";
const STATE = {
  approval: { ink: "#1e6b3b", tint: "#e3efe0", glow: "#c6e4bf", word: "Approve" },
  input: { ink: "#8a5100", tint: "#f7e9d1", glow: "#f6d9a6", word: "Answer" },
  failed: { ink: "#b0291f", tint: "#f8dfdb", glow: "#f6c2ba", word: "Fix" },
};
const ORDER = ["approval", "input", "failed"];

// The app's own glyphs (src/components/Icons.jsx) on its 16 unit grid, plus a person.
const GLYPH = {
  approval: ["M4.8 8.4l2.2 2.2 4.2-4.5"],
  input: ["M6.2 6.3a1.8 1.8 0 1 1 2.6 1.6c-.5.3-.8.7-.8 1.2", "M8 11.2h.01"],
  failed: ["M8 4.7v3.9", "M8 11.2h.01"],
  sparkle: [
    "M8 2.8v3.4M8 9.8v3.4M2.8 8h3.4M9.8 8h3.4M4.4 4.4l2.2 2.2M9.4 9.4l2.2 2.2M11.6 4.4L9.4 6.6M6.6 9.4l-2.2 2.2",
    "M7.3 6.9h1.4a.4 .4 0 0 1 .4.4v1.4a.4 .4 0 0 1-.4.4H7.3a.4 .4 0 0 1-.4-.4V7.3a.4 .4 0 0 1 .4-.4z",
  ],
};
const PATHS = {};
const path = (name) => (PATHS[name] ||= GLYPH[name].map((d) => new Path2D(d)));

const SANS = '"DM Sans", system-ui, sans-serif';

// Her ease-out, cubic-bezier(0.2, 0.8, 0.1, 1), solved for x.
export function easeOut(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const p1x = 0.2, p1y = 0.8, p2x = 0.1, p2y = 1;
  const bx = (t) => 3 * (1 - t) * (1 - t) * t * p1x + 3 * (1 - t) * t * t * p2x + t * t * t;
  const by = (t) => 3 * (1 - t) * (1 - t) * t * p1y + 3 * (1 - t) * t * t * p2y + t * t * t;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 24; i++) {
    t = (lo + hi) / 2;
    if (bx(t) < x) lo = t;
    else hi = t;
  }
  return by(t);
}
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function glyph(ctx, name, cx, cy, size, color, stroke) {
  const k = size / 16;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(k, k);
  ctx.strokeStyle = color;
  ctx.lineWidth = stroke / k;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const p of path(name)) ctx.stroke(p);
  ctx.restore();
}

// The app's frosted state mark: a tinted glow body under a crisp glyph.
function mark(ctx, state, cx, cy, d) {
  const s = STATE[state];
  const g = ctx.createRadialGradient(cx - d * 0.15, cy - d * 0.2, d * 0.05, cx, cy, d * 0.55);
  g.addColorStop(0, s.tint);
  g.addColorStop(1, s.glow);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
  ctx.fill();
  glyph(ctx, state, cx, cy, d * 0.62, s.ink, Math.max(3, d * 0.06));
}

function fitText(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s.trimEnd() + "…";
}

const firstOf = (state) => cases.filter((c) => c.state === state);
const countOf = (state) => cases.filter((c) => c.state === state).length;
const NEED = cases.length;

// ---------------------------------------------------------------- 1. Stream
// The day's tasks pass through as tiny cards. A few carry a state colour; in the
// middle capsule, under the person tile, they lift out of the stream toward it.
// Past the middle, the rest wear a small check: handled by an agent.
function stream(ctx, t) {
  const speed = W / 2.4;
  const gap = 100;
  const cw = 72;
  const ch = 42;
  const rows = [H * 0.24, H * 0.5, H * 0.76];
  const total = 3 * W;
  const n = Math.ceil(total / gap);
  for (let r = 0; r < rows.length; r++) {
    const off = r * 41;
    for (let k = 0; k < n; k++) {
      const raw = k * gap + t * speed + off;
      const loop = Math.floor(raw / total);
      const gx = raw - loop * total;
      const id = loop * 997 + k * 7 + r * 131;
      const face = Math.floor(gx / W);
      const lx = gx - face * W;
      const flagged = hash(id) < 0.1;
      const state = ORDER[Math.floor(hash(id + 3) * 3)];
      let y = rows[r];
      let alpha = 1;
      let scale = 1;
      if (flagged) {
        const lift = face === 1 ? clamp01((lx - W * 0.3) / (W * 0.42)) : face === 2 ? 1 : 0;
        if (lift >= 1) continue;
        const e = easeOut(lift);
        y -= e * H * 0.95;
        scale = 1 + e * 0.18;
        alpha = 1 - clamp01((e - 0.6) / 0.4);
      }
      const x0 = face * (W + FACE_PAD);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, 0, W, H);
      ctx.clip();
      ctx.globalAlpha = alpha;
      ctx.translate(x0 + lx, y);
      ctx.scale(scale, scale);
      rr(ctx, -cw / 2, -ch / 2, cw, ch, 10);
      if (flagged) {
        const s = STATE[state];
        ctx.fillStyle = s.glow;
        ctx.fill();
        ctx.fillStyle = s.ink;
        ctx.beginPath();
        ctx.arc(-cw / 2 + 15, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha * 0.55;
        rr(ctx, -cw / 2 + 28, -3.5, 30, 7, 3.5);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(20,20,20,0.06)";
        ctx.fill();
        ctx.fillStyle = "rgba(20,20,20,0.22)";
        rr(ctx, -cw / 2 + 12, -9, 32, 6, 3);
        ctx.fill();
        rr(ctx, -cw / 2 + 12, 3, 22, 6, 3);
        ctx.fill();
        if (face === 2) glyph(ctx, "approval", cw / 2 - 14, 0, 22, STATE.approval.ink, 2.6);
      }
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------- 2. Three states
// One capsule per kind of exception, named the way the app's filters name them.
function states(ctx) {
  ORDER.forEach((state, i) => {
    const x0 = i * (W + FACE_PAD);
    const s = STATE[state];
    const d = 104;
    ctx.font = `500 46px ${SANS}`;
    const word = s.word;
    const count = String(countOf(state));
    const ww = ctx.measureText(word).width;
    ctx.font = `400 46px ${SANS}`;
    const cw = ctx.measureText(count).width;
    const gapA = 28;
    const gapB = 16;
    const total = d + gapA + ww + gapB + cw;
    let x = x0 + (W - total) / 2;
    mark(ctx, state, x + d / 2, H / 2, d);
    x += d + gapA;
    ctx.textBaseline = "middle";
    ctx.font = `500 46px ${SANS}`;
    ctx.fillStyle = INK;
    ctx.fillText(word, x, H / 2 + 2);
    x += ww + gapB;
    ctx.font = `400 46px ${SANS}`;
    ctx.fillStyle = INK_2;
    ctx.fillText(count, x, H / 2 + 2);
  });
}

// ---------------------------------------------------------------- 3. Funnel
// Dots stream right and thin out: the day's tasks on the left, most finished by
// agents in the middle, the few left gather as the cases that need you.
const DOTS = Array.from({ length: 240 }, (_, j) => ({
  y: 0.14 + 0.72 * hash(j + 0.5),
  x0: hash(j + 9.1),
  v: 0.85 + 0.3 * hash(j + 4.2),
  die: hash(j + 2.7),
  keep: j % 20 === 0,
  state: ORDER[j % 3],
}));
function funnel(ctx, t) {
  const labelW = W * 0.34;
  const gridX = 2 * (W + FACE_PAD) + 40;
  const path = 2 * W + 40;
  const speed = W / 3.2;
  // labels
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = `500 52px ${SANS}`;
  ctx.fillText(TOTAL_TODAY.toLocaleString("en-US"), 40, H / 2 + 8);
  ctx.fillStyle = INK_2;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText("tasks today", 40, H / 2 + 50);
  const x2 = 2 * (W + FACE_PAD);
  ctx.textAlign = "right";
  ctx.fillStyle = INK;
  ctx.font = `500 52px ${SANS}`;
  ctx.fillText(String(NEED), x2 + W - 40, H / 2 + 8);
  ctx.fillStyle = INK_2;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText("need you", x2 + W - 40, H / 2 + 50);
  ctx.textAlign = "left";

  // the twelve, settled
  const cols = 4;
  const rows = 3;
  const cell = 46;
  const gy = (H - (rows - 1) * cell) / 2;
  for (let k = 0; k < NEED; k++) {
    const c = k % cols;
    const r = Math.floor(k / cols);
    const st = STATE[cases[k]?.state || ORDER[k % 3]];
    ctx.fillStyle = st.glow;
    ctx.beginPath();
    ctx.arc(gridX + 20 + c * cell, gy + r * cell, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = st.ink;
    ctx.beginPath();
    ctx.arc(gridX + 20 + c * cell, gy + r * cell, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // the flow
  for (const d of DOTS) {
    const gx = (d.x0 * path + t * speed * d.v) % path; // 0 .. 2W+40 in flow space
    const face = gx < W ? 0 : gx < 2 * W ? 1 : 2;
    const lx = gx - face * W;
    if (face === 0 && lx < labelW) continue;
    let a = 0.42;
    let r = 4.5;
    let col = INK;
    if (d.keep) {
      // survivors take their state colour as the others fall away
      const k = face === 0 ? 0 : face === 1 ? clamp01(lx / (W * 0.6)) : 1;
      col = k > 0.5 ? STATE[d.state].ink : INK;
      a = 0.42 + 0.5 * k;
      r = 4.5 + 2.5 * k;
      if (face === 2) a *= 1 - clamp01(lx / 40);
    } else if (face >= 1) {
      const dieAt = W * (0.1 + 0.8 * d.die);
      if (face === 2) continue;
      a *= 1 - clamp01((lx - dieAt + 40) / 40);
    }
    if (a <= 0.01) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(face * (W + FACE_PAD) + lx, H * d.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- 4. One case
// One case at a time in the middle: approve, answer, fix. Each time the pink band
// sweeps through, the case is done and slides right into the resolved capsule with a
// check, and the next one slides in from the incoming capsule on the left.
const SEQ = [firstOf("approval")[0], firstOf("input")[0], firstOf("failed")[0], firstOf("approval")[1], firstOf("input")[1], firstOf("failed")[1]].filter(Boolean);

function caseCard(ctx, c, x, y, alpha, done) {
  if (!c) return;
  const s = STATE[c.state];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  const pad = 36;
  if (done) {
    mark(ctx, "approval", pad + 30, 58, 60);
  } else {
    mark(ctx, c.state, pad + 30, 58, 60);
  }
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK;
  ctx.font = `500 34px ${SANS}`;
  ctx.fillText(fitText(ctx, c.title, W - pad * 2 - 84), pad + 84, 58);
  ctx.fillStyle = INK_2;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText(fitText(ctx, c.decision, W - pad * 2), pad, 132);
  // pill with the action the case needs
  ctx.font = `500 26px ${SANS}`;
  const word = done ? "Done" : s.word;
  const pw = ctx.measureText(word).width + 40;
  rr(ctx, pad, 180, pw, 48, 24);
  ctx.fillStyle = done ? STATE.approval.tint : s.tint;
  ctx.fill();
  ctx.fillStyle = done ? STATE.approval.ink : s.ink;
  ctx.fillText(word, pad + 20, 205);
  ctx.restore();
}

function oneCase(ctx, t) {
  // the band is over the middle window at phase 0.08 of each cycle at x = 0
  const beatT = (t - 0.08 * PERIOD + PERIOD * 10) % PERIOD;
  const beat = Math.floor((t - 0.08 * PERIOD + PERIOD * 10) / PERIOD) - 10;
  const p = easeOut(clamp01(beatT / 0.7));
  const n = SEQ.length;
  const at = (k) => SEQ[((k % n) + n) % n];
  const slide = W * 0.4;
  for (let face = 0; face < 3; face++) {
    const x0 = face * (W + FACE_PAD);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, 0, W, H);
    ctx.clip();
    // what was on this face leaves right, what is next arrives from the left
    const incoming = at(beat + 1 - face);
    const outgoing = at(beat - face);
    const dim = face === 1 ? 1 : 0.38;
    caseCard(ctx, outgoing, x0 + slide * p, 0, dim * (1 - p), face === 2);
    caseCard(ctx, incoming, x0 - slide * (1 - p), 0, dim * p, face === 2);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- 5. Handoff
// Left, the agents clear tasks fast; middle, the one that needs a person is handed
// across; right, it lands on your pile, under the person tile.
function handoff(ctx, t) {
  // agents: rows tick off as they climb
  const x0 = 0;
  const rowH = 56;
  const speed = 90;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, 0, W, H);
  ctx.clip();
  // the agent mark
  ctx.fillStyle = "rgba(20,20,20,0.06)";
  ctx.beginPath();
  ctx.arc(x0 + 86, H / 2, 50, 0, Math.PI * 2);
  ctx.fill();
  glyph(ctx, "sparkle", x0 + 86, H / 2, 58, INK, 3.4);
  const scroll = (t * speed) % rowH;
  for (let k = -1; k < 7; k++) {
    const y = H + rowH - k * rowH - scroll - rowH / 2 - 20;
    if (y < -rowH || y > H + rowH) continue;
    const done = y < H * 0.62;
    ctx.fillStyle = "rgba(20,20,20,0.18)";
    rr(ctx, x0 + 176, y - 4, 230 - (k % 3) * 40, 8, 4);
    ctx.fill();
    if (done) {
      const a = clamp01((H * 0.62 - y) / 30);
      ctx.globalAlpha = a;
      ctx.fillStyle = STATE.approval.tint;
      ctx.beginPath();
      ctx.arc(x0 + W - 70, y, 16, 0, Math.PI * 2);
      ctx.fill();
      glyph(ctx, "approval", x0 + W - 70, y, 22, STATE.approval.ink, 2.6);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();

  // the handoff: one card crosses the middle with the band, one per cycle
  const beatT = (t + PERIOD * 10) % PERIOD;
  const beat = Math.floor((t + PERIOD * 10) / PERIOD) - 10;
  const at = (k) => cases[((k % cases.length) + cases.length) % cases.length];
  const x1 = W + FACE_PAD;
  const cw = 250;
  const chh = 120;
  const card = (cs, x, y, scale, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + cw / 2, y + chh / 2);
    ctx.scale(scale, scale);
    rr(ctx, -cw / 2, -chh / 2, cw, chh, 22);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 2;
    ctx.stroke();
    mark(ctx, cs.state, -cw / 2 + 50, 0, 56);
    ctx.fillStyle = "rgba(20,20,20,0.22)";
    rr(ctx, -cw / 2 + 96, -16, 120, 9, 4.5);
    ctx.fill();
    rr(ctx, -cw / 2 + 96, 6, 80, 9, 4.5);
    ctx.fill();
    ctx.restore();
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(x1, 0, W, H);
  ctx.clip();
  card(at(beat), x1 - cw + (beatT / PERIOD) * (W + cw), (H - chh) / 2, 1, 1);
  ctx.restore();

  // your pile: the card that just crossed lands on top, the stack keeps three
  const x2 = 2 * (W + FACE_PAD);
  const e = easeOut(clamp01(beatT / 0.6));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x2, 0, W, H);
  ctx.clip();
  for (let k = 3; k >= 0; k--) {
    const kk = k - 1 + e; // each card steps back one slot as the new one lands
    let a = kk > 2 ? 1 - clamp01(kk - 2) : 1;
    if (k === 0) a = e;
    if (a <= 0.01) continue;
    const back = Math.max(kk, 0);
    card(at(beat - 1 - k), x2 + 60, (H - chh) / 2 + 12 - kk * 18, 1 - back * 0.06, a * (1 - back * 0.25));
  }
  ctx.fillStyle = INK;
  ctx.font = `500 52px ${SANS}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(NEED), x2 + W - 40, H / 2 + 8);
  ctx.fillStyle = INK_2;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText("need you", x2 + W - 40, H / 2 + 50);
  ctx.textAlign = "left";
  ctx.restore();
}

// Which capsule the person tile stands over, and how strongly the pink band veils
// the windows (the clip covers its footage fully; the cases stay readable here).
export const DIRECTIONS = {
  1: { name: "Stream", paint: stream, tileOver: 1, veil: 0.55 },
  2: { name: "Three states", paint: states, tileOver: 1, veil: 0.45 },
  3: { name: "Funnel", paint: funnel, tileOver: 2, veil: 0.5 },
  4: { name: "One case", paint: oneCase, tileOver: 1, veil: 0.8 },
  5: { name: "Handoff", paint: handoff, tileOver: 2, veil: 0.5 },
};
```

Create src/intro/intro.css:

```css
/* Intro: pure white, three marshmallow capsules, one line of copy and one CTA. Scoped under .rq-intro so nothing leaks into the app. */

.rq-intro {
  --rq-ink: #141414;
  --rq-ink-2: #5c5c5c;
  --rq-accent-top: var(--accent);
  --rq-accent-bottom: var(--accent-bottom);
  --rq-accent-hover: var(--accent-hover);
  --rq-ease: cubic-bezier(0.2, 0.8, 0.1, 1);
  --rq-stroke: 1.5px;

  position: fixed;
  inset: 0;
  z-index: 1000;
  overflow: hidden;
  background: #ffffff;
  color: var(--rq-ink);
  font-family: "DM Sans", system-ui, sans-serif;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
}

/* Exit on the CTA press: Intro.jsx drives the capsules, the copy and this field's
   opacity on one timeline, so nothing here animates. */
.rq-intro.is-leaving {
  pointer-events: none;
}

.rq-intro-stage,
.rq-intro-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* the capsules can be pulled with a finger; the browser must not pan or zoom */
.rq-intro-stage {
  touch-action: none;
}

.rq-intro-copy {
  position: absolute;
  left: 0;
  right: 0;
  top: var(--rq-copy-top, 70%);
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
}

.rq-intro-title {
  margin: 0;
  max-width: 22em;
  font-family: "Plus Jakarta Sans", "DM Sans", system-ui, sans-serif;
  font-weight: 500;
  font-size: 28px;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--rq-ink);
  text-wrap: balance;
  font-variant-numeric: tabular-nums;
}

/* Same face as the app's primary action: the signature pastel blue, ink text, a full pill. The label never
   moves in any state, and there is no press scale on a capsule with text. */
/* each sentence keeps its own line when the line has to break */
.rq-intro-title span {
  white-space: nowrap;
}

.rq-intro-cta {
  appearance: none;
  border: 0;
  margin: 0;
  min-height: 48px;
  padding: 0 28px;
  border-radius: 999px;
  background: linear-gradient(to bottom, var(--rq-accent-top), var(--rq-accent-bottom));
  color: var(--rq-ink);
  font: 500 15px/1 "DM Sans", system-ui, sans-serif;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 160ms var(--rq-ease);
}

.rq-intro-cta:disabled {
  cursor: default;
}

.rq-intro-cta:focus-visible {
  outline: 2px solid var(--rq-ink);
  outline-offset: 3px;
}

@media (hover: hover) {
  .rq-intro-cta:not(:disabled):hover {
    background: linear-gradient(to bottom, var(--rq-accent-hover), var(--rq-accent-top));
  }
}

@media (max-width: 639px) {
  .rq-intro-title {
    font-size: 22px;
  }
  .rq-intro-copy {
    gap: 20px;
  }
  .rq-intro-cta {
    min-height: 44px;
  }
}

/* Entrance after the capsules: the line of copy, then the CTA. */
@keyframes rq-intro-in {
  from {
    opacity: 0;
    transform: translateY(8px);
    filter: blur(8px);
  }
}

/* They arrive while the capsules are still settling, so nothing waits on white. */
.rq-intro-title {
  animation: rq-intro-in 600ms var(--rq-ease) 820ms both;
}

.rq-intro-cta {
  animation: rq-intro-in 600ms var(--rq-ease) 920ms both;
}

/* Reduced motion: the still composition, one fade for the whole screen. */
@keyframes rq-intro-fade {
  from {
    opacity: 0;
  }
}

.rq-intro.is-reduced {
  animation: rq-intro-fade 400ms var(--rq-ease) both;
}

.rq-intro.is-reduced .rq-intro-title,
.rq-intro.is-reduced .rq-intro-cta {
  animation: none;
}

/* Reduced motion exit: one 200ms crossfade to the queue. */
.rq-intro.is-reduced.is-leaving {
  animation: none;
  opacity: 0;
  transition: opacity 200ms var(--rq-ease);
}
```
