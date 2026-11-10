/* ============================================================================
 * THE SPEC. One file, read by the web prototype and printed as SwiftUI, the
 * same way the Card Into Island lab does it, so the two cannot drift.
 *
 * THE MOMENT: Apple Pay says Done, the phone returns to Ramp, the purchase
 * lands in the list, a lime light traces the inside edge of the screen once
 * and settles into a miniature of the same card in the Dynamic Island. The Island says
 * which purchase it was and which budget paid for it: compact first, and a
 * press and hold opens the expanded panel, which reads as a single
 * transaction row. A tap opens the transaction in Ramp.
 * ========================================================================= */
export const SPEC = {
  // iPhone 18 Pro, in points. Island numbers are Apple's (HIG, Live Activities).
  screen: { w: 393, h: 852, r: 55 },
  mini: [32, 20],                     // the miniature card at its expanded size; compact shows it at 3/4 (24 x 15)
  island: {
    rest:     { w: 125, h: 37, r: 18.5 },
    compact:  { w: 230, h: 37, r: 18.5, side: 52.33 },   // leading and trailing regions, each side of the camera
    expanded: { w: 371, h: 90, hReceipt: 134, r: 40 },   // Apple's 371 for a 393pt phone, inside its 84-160 range
    /* Apple's expanded layout: an enlarged compact. The card (leading) and the amount (trailing) stay
       beside the camera and grow; the merchant and fund wrap below the card. */
    layout: {
      compact:  { cardX: 14, cardScale: 3 / 4, amountR: 9, amountSize: 13, lineY: 18.5 },
      expanded: { cardX: 22, cardScale: 1,     amountR: 20, amountSize: 20, lineY: 25 },
      textTop: 42                    // merchant 15/18 bold, fund 12/15 below
    },
    // the leading and trailing content keeps to the camera's row; it rides out with the edges
    top: 11
  },

  // Ramp's own tokens, read off ramp.com's stylesheets on 2026-11-09.
  ramp: {
    solar: '#e4f222',                 // --solar, the lime: the rim, and the outline it hands to the card
    ink: '#0c0a08',                   // --text-primary
    hushed: 'rgba(12,10,8,.6)',       // --text-hushed
    black: '#1a1919',                 // --black
    wash: '#f4f2f0',                  // --grayLight
    line: '#d2cecb',                  // --grayMedium, --border-primary
    font: '"Lausanne", Arial, sans-serif'   // --font-sans
  },

  txn: { merchant: 'Greenleaf Kitchen', amount: '$84.20', budget: 'Team Meals', card: '1673', date: 'Nov 9', when: 'Nov 9 at 9:41 AM' },

  // Milliseconds from the start of the sequence. [start, end] pairs.
  t: {
    payIn:   [0, 380],
    payDone: 950,                     // Apple Pay's own checkmark
    payOut:  [1500, 1850],            // then back to Ramp
    rowIn:   [1900, 2260],            // the purchase appears
    spark:   [2360, 2500],
    travel:  [2500, 3200],            // the light traces the inside edge once
    fade:    [3200, 3560],            // and lets go
    compact: [3200, 3620],            // as it settles into the card: compact first
    trace:   [3300, 3720],            // the lime runs once round the miniature card's outline
    traceOut: [3720, 3980],           // and lets go, leaving it charcoal
    hold:    [4700, 5160],            // the demo's press and hold: expanded, ending on the budget
    end: 6400
  },

  glow: {
    inset: 1.5, head: 110,
    core: 2.5, mid: 6, soft: 22,
    midBlur: 3, softBlur: 12, trailBlur: 4,
    trail: 0.42,
    travelEase: [0.45, 0.05, 0.25, 1]
  },

  ease: {
    out: [0.22, 1, 0.36, 1],          // enters: ease-out, no bounce
    in:  [0.55, 0, 0.75, 0.06],       // the Apple Pay sheet leaving
    morph: [0.32, 0.72, 0, 1]         // the Island's shape: quick out of the gate, long gentle settle
  },

  gesture: { holdMs: 450 },           // press and hold, as the system reads it

  // isolate windows for the slow-motion replay: [start, end] in ms
  windows: {
    all: [0, 6400],
    glow: [2060, 4060],
    compact: [2900, 4300],
    expanded: [4300, 5900]
  }
};

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const bez = (p, t) => {
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
