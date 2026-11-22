/* gallop.js: one horse, facing right, in units of its withers height (H = 1), y up, ground at y = 0.
   A transverse gallop after Muybridge: left hind, right hind, left fore, right fore, then a moment
   with all four hooves in the air, gathered under the body. Facing right we see the horse's left
   side, so the left legs are near and the right legs are far.
   A planted hoof travels back under the body at exactly the ground speed, so it never skates.   */
export const STRIDE = 0.56;                         // seconds per stride
const STANCE = 0.30;                                // share of the stride each hoof is down
const SWEEP = 0.47;                                 // how far a planted hoof travels under the body, in H
export const SPEED = SWEEP / (STANCE * STRIDE);     // H per second

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
function keys(K, u) {
  for (let i = 0; i < K.length - 1; i++) { const [u0, v0] = K[i], [u1, v1] = K[i + 1]; if (u <= u1) return lerp(v0, v1, smooth((u - u0) / (u1 - u0))); }
  return K[K.length - 1][1];
}
function ik(A, T, a, b, sign) {                     // two-bone: where the knee or hock sits
  const dx = T[0] - A[0], dy = T[1] - A[1], d = clamp(Math.hypot(dx, dy), Math.abs(a - b) + 1e-3, a + b - 1e-3);
  const th = Math.atan2(dy, dx), al = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  return [A[0] + a * Math.cos(th + sign * al), A[1] + a * Math.sin(th + sign * al)];
}
function along(P, t) {
  const f = t * (P.length - 1), i = Math.min(P.length - 2, f | 0), u = f - i;
  return [lerp(P[i][0], P[i + 1][0], u), lerp(P[i][1], P[i + 1][1], u)];
}

/* the drawing: smooth closed curves through these points */
const TORSO = [
  [0.30, 1.00], [0.08, 0.95], [-0.18, 0.95], [-0.38, 0.99], [-0.53, 0.93], [-0.60, 0.80], [-0.57, 0.66],
  [-0.46, 0.58], [-0.30, 0.58], [-0.12, 0.60], [0.10, 0.565], [0.28, 0.57], [0.42, 0.62], [0.52, 0.76],
  [0.50, 0.92], [0.40, 1.00]
];
const NECK = [
  [0.28, 1.02], [0.40, 1.13], [0.52, 1.27], [0.61, 1.38], [0.67, 1.40], [0.76, 1.33], [0.86, 1.20],
  [0.93, 1.10], [0.92, 1.05], [0.85, 1.04], [0.76, 1.10], [0.68, 1.14], [0.62, 1.12], [0.58, 1.02],
  [0.54, 0.90], [0.44, 0.86], [0.34, 0.92]
];
const EARS = [[[0.60, 1.37], [0.565, 1.50], [0.655, 1.40]], [[0.625, 1.38], [0.60, 1.49], [0.675, 1.40]]];
const CREST = [[0.30, 1.03], [0.40, 1.14], [0.52, 1.28], [0.61, 1.38]];
const DOCK = [-0.53, 0.93];
const PIV = [0, 0.78], NPIV = [0.40, 0.92], PASTERN = 0.10;

/* legs: anchor where the visible leg leaves the body, two bones, widths from the top down to the hoof */
const FORE = { anchor: [0.34, 0.62], a: 0.31, b: 0.29, reach: 0.24, lift: 0.30, bend: 1,
  w: [0.125, 0.075, 0.05, 0.062, 0.07], swing: [[0, -1.4], [0.35, -2.25], [0.75, -0.7], [1, -1.13]] };
const HIND = { anchor: [-0.44, 0.64], a: 0.33, b: 0.29, reach: 0.26, lift: 0.22, bend: -1,
  w: [0.15, 0.08, 0.05, 0.062, 0.07], swing: [[0, -1.4], [0.4, -1.95], [0.8, -0.85], [1, -1.13]] };
const LEGS = [
  { D: HIND, far: false, c: 0.00 },                 // left hind
  { D: HIND, far: true,  c: 0.10 },                 // right hind
  { D: FORE, far: false, c: 0.30 },                 // left fore
  { D: FORE, far: true,  c: 0.42 },                 // right fore, then suspension
];

export function pose(p) {
  const pitch = 0.06 * Math.cos(TAU * (p - 0.18));  // the rocking: front up as the hinds drive, down onto the fores
  const bob = 0.03 * Math.cos(TAU * (p - 0.86));    // highest in the gathered suspension
  const neck = -0.22 + 0.09 * Math.cos(TAU * (p - 0.95));
  const cP = Math.cos(pitch), sP = Math.sin(pitch), cN = Math.cos(neck), sN = Math.sin(neck);
  const B = ([x, y]) => { const dx = x - PIV[0], dy = y - PIV[1]; return [PIV[0] + dx * cP - dy * sP, PIV[1] + dx * sP + dy * cP + bob]; };
  const NL = ([x, y]) => { const dx = x - NPIV[0], dy = y - NPIV[1]; return [NPIV[0] + dx * cN - dy * sN, NPIV[1] + dx * sN + dy * cN]; };
  const N = q => B(NL(q));
  const near = [], far = [], strokes = [];

  near.push({ smooth: true, pts: TORSO.map(B) });
  near.push({ smooth: true, pts: NECK.map(N) });
  for (const e of EARS) near.push({ pts: e.map(N) });

  // mane: tufts flicked back off the crest, with streaks in them
  for (let i = 0; i < 9; i++) {
    const t = 0.06 + 0.9 * i / 8, c = along(CREST, t), c0 = along(CREST, Math.max(0, t - 0.06)), c1 = along(CREST, Math.min(1, t + 0.06));
    const th = 2.5 + 0.22 * Math.sin(TAU * p - i * 0.9) + (i % 2) * 0.15, L = 0.09 + 0.05 * Math.sin(i * 2.3 + 1) ** 2;
    const tip = [c[0] + Math.cos(th) * L, c[1] + Math.sin(th) * L];
    near.push({ pts: [c0, tip, c1].map(N) });
    strokes.push({ pts: [c, [lerp(c[0], tip[0], 0.55) + 0.01, lerp(c[1], tip[1], 0.55) + 0.012], tip].map(N), w: 0.9, a: 0.5 });
  }

  // tail: streaming back from the dock, a wave running down it
  const dock = B(DOCK), C = [dock], Wt = [0.07, 0.09, 0.11, 0.12, 0.115, 0.09, 0.05, 0.004], ang = [];
  for (let i = 0; i < 7; i++) {
    const a = Math.PI - 0.25 + pitch + i * 0.13 + 0.12 * Math.sin(TAU * p - i * 0.85); ang.push(a);
    C.push([C[i][0] + 0.085 * Math.cos(a), C[i][1] + 0.085 * Math.sin(a)]);
  }
  const nrm = i => { const a = ang[Math.min(i, 6)] + Math.PI / 2; return [Math.cos(a), Math.sin(a)]; };
  const left = C.map((q, i) => [q[0] + nrm(i)[0] * Wt[i] / 2, q[1] + nrm(i)[1] * Wt[i] / 2]);
  const right = C.map((q, i) => [q[0] - nrm(i)[0] * Wt[i] / 2, q[1] - nrm(i)[1] * Wt[i] / 2]);
  near.push({ smooth: true, pts: [...left, ...right.reverse()] });
  for (let j = 0; j < 7; j++) {
    const f = -0.8 + 1.6 * j / 6;
    strokes.push({ pts: C.slice(1, 7 + (j % 2)).map((q, i) => [q[0] + nrm(i + 1)[0] * Wt[i + 1] * 0.45 * f, q[1] + nrm(i + 1)[1] * Wt[i + 1] * 0.45 * f]), w: 0.9, a: 0.5 });
  }

  // legs
  for (const { D, far: isFar, c } of LEGS) {
    const ax = D.anchor[0] + (isFar ? 0.03 : 0), A = B([ax, D.anchor[1]]), push = SWEEP - D.reach;
    const q = ((p - c) % 1 + 1) % 1;
    let tx, ty, an;
    if (q < STANCE) { const u = q / STANCE; tx = ax + D.reach - SWEEP * u; ty = 0; an = lerp(-1.13, -1.4, u); }
    else {
      const u = (q - STANCE) / (1 - STANCE);
      tx = ax - push + SWEEP * smooth(u ** 1.25);
      ty = D.lift * Math.sin(Math.PI * u ** 0.8) ** 1.2;
      an = keys(D.swing, u);
    }
    const toe = [tx, ty], F = [tx - PASTERN * Math.cos(an), ty - PASTERN * Math.sin(an)];
    const J = ik(A, F, D.a, D.b, D.bend);
    (isFar ? far : near).push({ chain: [A, J, F, toe], w: D.w });
  }

  // the chalk marks on the ground under it, as in the photo
  strokes.push({ pts: [[0.30, -0.015], [0.0, -0.03], [-0.35, -0.02], [-0.62, -0.035]], w: 1.3, a: 0.55, ground: true });
  strokes.push({ pts: [[-0.84, -0.04], [-0.79, 0.05], [-0.74, -0.03]], w: 1.2, a: 0.5, ground: true });
  return { near, far, strokes };
}
