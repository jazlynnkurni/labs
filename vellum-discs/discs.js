// the sheets, as data. positions live in composition space:
// x runs -0.5 to 0.5 across the frame width, y follows the frame aspect.

import { MAX_DISCS } from './shaders.js';

export const CAP = MAX_DISCS;

// pale, desaturated, warm off whites. nothing you could name confidently.
// nothing here is a colour you could name with any confidence
const SWATCHES = [
  '#dfdcc4', // pale olive yellow
  '#d7d3dc', // dusty lilac grey
  '#ece5d3', // warm cream
  '#cdcfcb', // cool grey
  '#e1d7c7', // warm taupe
  '#d5dacb', // faint green grey
  '#ebe1d4', // shell
  '#e5e0cd'  // second cream, so the set leans warm the way the reference does
];

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export const PALETTE = SWATCHES.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [
    srgbToLinear(((n >> 16) & 255) / 255),
    srgbToLinear(((n >> 8) & 255) / 255),
    srgbToLinear((n & 255) / 255)
  ];
});

export function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// three loose rows that fill the frame, heavy overlap between neighbours
export function layout(count, rnd, aspectH) {
  const rowCount = 3;
  const base = Math.floor(count / rowCount);
  const extra = count - base * rowCount;
  const sizes = [base, base, base];
  for (let i = 0; i < extra; i++) sizes[[0, 2, 1][i % 3]]++;

  // rows sit closer than one diameter apart, so the bands run into each other
  const rowY = [-0.292, 0.004, 0.298];
  const rowShift = [-0.052, 0.061, -0.028];   // hand laid, not stacked on a grid
  const rowTilt = [0.055, -0.040, 0.048];     // each row sits a little off level

  const flat = [];
  for (let r = 0; r < rowCount; r++) {
    const n = sizes[r];
    if (n <= 0) continue;
    const step = 0.158;                        // well inside one diameter
    const span = (n - 1) * step;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      flat.push({
        x: (i * step - span * 0.5) + rowShift[r] + (rnd() - 0.5) * 0.088,
        y: rowY[r] * (aspectH / 0.6667) + t * rowTilt[r] + (rnd() - 0.5) * 0.105
      });
    }
  }

  const out = [];
  for (let i = 0; i < flat.length; i++) {
    // keep the sheets on the paper, allowing a little bleed past the edge
    out.push({
      x: Math.max(-0.56, Math.min(0.56, flat[i].x)),
      y: Math.max(-aspectH - 0.06, Math.min(aspectH + 0.06, flat[i].y)),
      r: 0.199 + (rnd() - 0.5) * 0.050,
      rot: rnd() * Math.PI * 2,
      tint: PALETTE[Math.floor(rnd() * PALETTE.length)],
      op: 0.84 + rnd() * 0.38,
      seed: rnd() * 100
    });
  }
  // shuffle the stacking order so the rows interleave in depth
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = out[i]; out[i] = out[j]; out[j] = t;
  }
  return out;
}

let nextId = 1;

export function makeDisc(spec, rnd) {
  return {
    id: nextId++,
    x: spec.x, y: spec.y,           // current
    hx: spec.x, hy: spec.y,         // home, what drift orbits and returns to
    tx: spec.x, ty: spec.y,         // spring target
    vx: 0, vy: 0,
    r: spec.r, tr: spec.r,
    rot: spec.rot, rotV: (rnd() - 0.5) * 0.010,
    tint: spec.tint.slice(),
    tintFrom: spec.tint.slice(),
    tintTo: spec.tint.slice(),
    op: spec.op,
    seed: spec.seed,
    emph: 0, emphT: 0,
    alive: 0, aliveT: 1,
    driftAng: rnd() * Math.PI * 2,
    dead: false
  };
}

// topmost sheet under a point. ids stay valid while the array shifts underneath.
export function pick(discs, x, y) {
  for (let i = discs.length - 1; i >= 0; i--) {
    const d = discs[i];
    if (d.aliveT <= 0) continue;
    const dx = x - d.x, dy = y - d.y;
    if (dx * dx + dy * dy <= d.r * d.r) return d;
  }
  return null;
}

export function liveCount(discs) {
  let n = 0;
  for (const d of discs) if (!d.dead) n++;
  return n;
}
