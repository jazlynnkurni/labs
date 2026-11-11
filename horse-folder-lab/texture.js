/* texture.js: the folder sheets as aged photographic paper / weathered archival board.
   Generated once per sheet at device resolution and pinned to it (never animated, never tiled).
   Four layers, as the brief asks, each tuned to what was measured on the reference:
   1 base: a desaturated cool grey per sheet, warmer and darker toward the bottom of the front,
     with uneven pigment (two broad noise scales and a faint warm/cool drift)
   2 grain: monochrome photographic grain, per device pixel plus a slightly larger clump, on two
     rotated lattices so no grid or repeat shows. Strength follows the reference: the front is
     smooth at the top (fine 3.2, mid 4.3) and coarse low down (6.9, 12.2); the back sheets 2.8, 4.2
   3 imperfections: dust, a few long faint scratches, thin white fibres, irregular dark specks,
     soft directional scuffs, faint warm discoloration
   4 aging: broad exposure drift, a worn lighter rim with a darker band just inside it, and a
     faded print response (blacks lifted, contrast eased)                                      */
const TAU = Math.PI * 2;
export function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function lattice(w, h, lam, rand) { const gw = Math.ceil(w / lam) + 3, gh = Math.ceil(h / lam) + 3, L = new Float32Array(gw * gh); for (let i = 0; i < L.length; i++) L[i] = rand() * 2 - 1; return { L, gw, lam }; }
function at(o, x, y) {
  x /= o.lam; y /= o.lam; const xi = x | 0, yi = y | 0; let fx = x - xi, fy = y - yi;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const i = yi * o.gw + xi, L = o.L, a = L[i], b = L[i + 1], c = L[i + o.gw], d = L[i + o.gw + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const sdRR = (x, y, w, h, r) => { const qx = Math.abs(x - w / 2) - w / 2 + r, qy = Math.abs(y - h / 2) - h / 2 + r; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r; };

/* one sheet. w, h, r: its box and corner in reference px; s: device px per reference px;
   tone(ty, out): base colour down the sheet; grain(ty): grain strength multiplier down the sheet */
export function makeSheet({ w, h, r, s, seed, tone, grain, fine, mid, lines = [] }) {
  const W = Math.round(w * s), H = Math.round(h * s), R = rng(seed), big = Math.max(w, h) * 1.8 + 20;
  const B1 = lattice(w, h, 140, R), B2 = lattice(w, h, 48, R), C1 = lattice(w, h, 110, R), E1 = lattice(w, h, 220, R);
  const M1 = lattice(w, h, 4, R), M2 = lattice(big, big, 4, R), M3 = lattice(w, h, 13, R), F1 = lattice(w, h, 1.4, R), F2 = lattice(big, big, 1.4, R);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'), img = c.createImageData(W, H), D = img.data, rgb = [0, 0, 0];
  for (let py = 0; py < H; py++) {
    const y = py / s, ty = y / h, g = grain(ty);
    tone(ty, rgb);
    for (let px = 0; px < W; px++) {
      const x = px / s, i = (py * W + px) * 4;
      const qx = x * 0.8 + y * 0.6 + 7, qy = y * 0.8 - x * 0.6 + w * 0.6 + 7;
      // 1 base and pigment
      const pig = at(B1, x, y) * 8 + at(B2, x, y) * 7, warm = at(C1, x, y) * 2.2;
      // 2 grain: clump and per-pixel, monochrome
      const clump = ((at(M1, x, y) + at(M2, qx, qy)) * 0.45 + at(M3, x, y) * 0.75) * mid * g;
      const px1 = ((at(F1, x, y) + at(F2, qx, qy)) * 0.36 + (R() + R() - 1)) * fine * g;
      // 4 aging: exposure drift, worn rim, darker band inside it
      const e = -sdRR(x, y, w, h, r), rim = Math.exp(-e / 1.6) * 16 - Math.exp(-((e - 7) ** 2) / 30) * 4;
      let v = pig + clump + px1 + at(E1, x, y) * 4 + rim;
      let R0 = rgb[0] + v + warm, G0 = rgb[1] + v, B0 = rgb[2] + v - warm;
      // faded print: lift the darks, ease the contrast round the sheet's own mid
      R0 = 128 + (R0 - 128) * 0.94 + 4; G0 = 128 + (G0 - 128) * 0.94 + 4; B0 = 128 + (B0 - 128) * 0.94 + 4;
      D[i] = R0; D[i + 1] = G0; D[i + 2] = B0; D[i + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  c.setTransform(s, 0, 0, s, 0, 0); c.lineCap = 'round';
  const area = w * h;
  // 3 imperfections
  for (let n = area / 2600; n-- > 0;) {                       // discoloration: faint warm stains
    const x = R() * w, y = R() * h, rr = 10 + R() * 40, gr = c.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, `rgba(120,96,70,${0.03 + R() * 0.04})`); gr.addColorStop(1, 'rgba(120,96,70,0)'); c.fillStyle = gr; c.fillRect(x - rr, y - rr, 2 * rr, 2 * rr);
  }
  for (let n = area / 9000; n-- > 0;) {                       // scuffs: soft lighter smears, dragged one way
    const x = R() * w, y = R() * h, L = 14 + R() * 40, t = (R() - 0.5) * 0.7;
    c.strokeStyle = `rgba(230,228,222,${0.025 + R() * 0.03})`; c.lineWidth = 3 + R() * 7;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(t) * L, y + Math.sin(t) * L); c.stroke();
  }
  for (let n = area / 240; n-- > 0;) {                        // dark specks and pits, irregular, mostly tiny
    const x = R() * w, y = R() * h, rr = 0.25 + R() ** 6 * 2.4, k = 4 + (R() * 3 | 0);
    c.fillStyle = `rgba(44,40,36,${0.2 + R() ** 2 * 0.55})`; c.beginPath();
    for (let j = 0; j < k; j++) { const t = j / k * TAU, q = rr * (0.55 + R() * 0.6); c.lineTo(x + Math.cos(t) * q, y + Math.sin(t) * q); }
    c.fill();
  }
  for (let n = area / 16000; n-- > 0;) {                      // grit: a few small dark chips
    const x = R() * w, y = R() * h, rr = 1 + R() * 1.6, k = 5 + (R() * 3 | 0);
    c.fillStyle = `rgba(60,56,52,${0.5 + R() * 0.3})`; c.beginPath();
    for (let j = 0; j < k; j++) { const t = j / k * TAU, q = rr * (0.5 + R() * 0.6); c.lineTo(x + Math.cos(t) * q, y + Math.sin(t) * q); }
    c.fill();
  }
  for (let n = area / 240; n-- > 0;) {                        // dust: tiny pale motes
    const x = R() * w, y = R() * h; c.fillStyle = `rgba(236,234,228,${0.10 + R() * 0.25})`;
    c.beginPath(); c.arc(x, y, 0.2 + R() * 0.45, 0, TAU); c.fill();
  }
  for (let n = area / 6500; n-- > 0;) {                       // thin pale fibres, short and curled, some straw-tinted
    const x = R() * w, y = R() * h, L = 4 + R() ** 2 * 30, t = R() * TAU, b = (R() - 0.5) * 6, straw = R() < 0.5;
    c.strokeStyle = straw ? `rgba(206,194,170,${0.4 + R() * 0.35})` : `rgba(238,236,230,${0.35 + R() * 0.35})`; c.lineWidth = 0.45 + R() * 0.45;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(t) * L / 2 - Math.sin(t) * b, y + Math.sin(t) * L / 2 + Math.cos(t) * b, x + Math.cos(t) * L, y + Math.sin(t) * L); c.stroke();
  }
  for (let n = Math.max(2, area / 45000); n-- > 0;) {        // sparse scratches: long, faint, slightly bowed
    const x = R() * w, y = R() * h, L = 30 + R() * 120, t = (R() - 0.5) * 1.2, b = (R() - 0.5) * 10;
    c.strokeStyle = `rgba(228,228,224,${0.10 + R() * 0.12})`; c.lineWidth = 0.4 + R() * 0.3;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(t) * L / 2 - Math.sin(t) * b, y + Math.sin(t) * L / 2 + Math.cos(t) * b, x + Math.cos(t) * L, y + Math.sin(t) * L); c.stroke();
  }
  for (const ly of lines) {                                   // the three faint scored lines near the bottom
    for (let x = 0; x < w; x += 4) {
      const a = 0.38 + 0.2 * (at(B2, x * 3, ly * 2) + 1) / 2, y0 = ly + Math.sin(x * 0.01 + ly) * 0.6;
      c.strokeStyle = `rgba(48,44,40,${a + 0.18})`; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y0); c.lineTo(x + 4, y0); c.stroke();
    }
  }
  return cv;
}

const ramp = stops => (ty, o) => {
  let i = 0; while (i < stops.length - 2 && ty > stops[i + 1][0]) i++;
  const a = stops[i], b = stops[i + 1], u = Math.min(1, Math.max(0, (ty - a[0]) / (b[0] - a[0])));
  o[0] = a[1] + (b[1] - a[1]) * u; o[1] = a[2] + (b[2] - a[2]) * u; o[2] = a[3] + (b[3] - a[3]) * u;
};
/* the three sheets, in the reference's coordinates */
export const SHEETS = {
  backRight: { x: 200, y: 144, w: 471, h: 200, r: 32, seed: 31, tone: ramp([[0, 131, 134, 136], [1, 128, 130, 132]]), grain: () => 1, fine: 4.8, mid: 9 },
  backLeft:  { x: 64,  y: 93,  w: 245, h: 260, r: 30, seed: 17, tone: ramp([[0, 146, 148, 150], [0.3, 141, 145, 148], [1, 134, 137, 139]]), grain: () => 1, fine: 4.8, mid: 9 },
  front:     { x: 53,  y: 201, w: 630, h: 445, r: 39, seed: 7,
               tone: ramp([[0, 176, 180, 183], [0.14, 166, 170, 173], [0.40, 143, 147, 149], [0.50, 128, 129, 127], [0.84, 131, 130, 126], [0.91, 128, 125, 120], [1, 134, 130, 124]]),
               grain: ty => 0.62 + 1.2 * Math.pow(ty, 2.2), fine: 9.2, mid: 15, lines: [398, 406, 414] }
};
