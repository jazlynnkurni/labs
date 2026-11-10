/* ============================================================================
 * THE SPEC. One file, read by the web prototype and printed as SwiftUI, the
 * same way the Card Into Island lab does it, so the two cannot drift.
 *
 * THE MOMENT: a purchase paid with Apple Pay lands in Ramp. Apple Pay stays
 * familiar and quiet. Ramp gets the expressive part: a spark at the bottom
 * edge, a narrow lime highlight that runs up both sides of the rounded screen
 * in 700ms, and at the top the rim lets go into a small lime card glyph beside
 * the Dynamic Island while "Covered by Team Meals" arrives under the amount.
 * ========================================================================= */
export const SPEC = {
  // iPhone 18 Pro, in points. Island numbers are Apple's.
  screen: { w: 402, h: 874, r: 55 },
  island: { w: 125, h: 37, r: 18.5, top: 11 },
  bud: { size: 37, gap: 6 },          // the Live Activity's minimal presentation, detached right

  // Ramp's own tokens, read off ramp.com's stylesheets on 2026-11-09.
  ramp: {
    solar: '#e4f222',                 // --solar, the lime
    solarLight: '#f5ff78',            // --solarLight
    ink: '#0c0a08',                   // --text-primary
    hushed: 'rgba(12,10,8,.6)',       // --text-hushed
    black: '#1a1919',                 // --black
    wash: '#f4f2f0',                  // --grayLight
    line: '#d2cecb',                  // --grayMedium, --border-primary
    gray: '#6e6a68',                  // --grayDark
    font: '"Lausanne", Arial, sans-serif'   // --font-sans
  },

  txn: { merchant: 'Greenleaf Kitchen', amount: '$84.20', card: '··4021', when: 'Just now', budget: 'Team Meals' },

  // Milliseconds from the start of the sequence. [start, end] pairs.
  t: {
    payIn:  [0, 380],
    payDone: 950,
    payOut: [1500, 1850],
    rowIn:  [1900, 2260],
    spark:  [2360, 2500],
    travel: [2500, 3200],             // the 700ms run around the rim
    fade:   [3200, 3560],             // the rim lets go as it reaches the top
    glyph:  [3200, 3480],             // same moment: the glyph buds out of the Island
    reveal: [3200, 3460],             // same moment: the budget line arrives
    end: 4700
  },

  glow: {
    inset: 1.5,                       // px in from the screen edge
    head: 110,                        // px, the length of the travelling highlight
    core: 2.5, mid: 6, soft: 22,      // stroke widths: crisp core, then falloff
    midBlur: 3, softBlur: 12, trailBlur: 4,
    trail: 0.42,                      // the rim the highlight leaves lit behind it: a hairline, not a wash
    travelEase: [0.45, 0.05, 0.25, 1] // gathers, runs, eases into the top
  },

  ease: {
    out: [0.22, 1, 0.36, 1],          // enters and the glyph: ease-out, no bounce
    in:  [0.55, 0, 0.75, 0.06]        // the Apple Pay sheet leaving
  },

  // isolate windows for the slow-motion replay: [start, end] in ms
  windows: {
    all: [0, 4700],
    glow: [2060, 4060],
    glyph: [2900, 4180],
    reveal: [2900, 4160]
  }
};

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const bez = (p, t) => {
  // cubic-bezier y for a given x, Newton steps, as in the card lab
  const [x1, y1, x2, y2] = p;
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = ((ax * u + bx) * u + cx) * u - t;
    const d = (3 * ax * u + 2 * bx) * u + cx;
    if (Math.abs(d) < 1e-6) break;
    u -= x / d;
  }
  return ((ay * u + by) * u + cy) * u;
};
