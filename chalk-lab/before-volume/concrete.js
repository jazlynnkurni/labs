/* concrete.js: the sidewalk the chalk sits on, generated to the numbers measured off ref.png.
   All sizes are in reference pixels (the 736px photo, where the folder is 630 wide); s converts
   them to device pixels.

   What the photo is made of, front panel:
   · a lighting gradient, cool and light at the top (176,180,183) falling to a warmer grey (131,128,122) at the bottom
   · three grain bands of about equal strength: a broad mottle (~120 and ~26px), a sand grain (~4px), a pixel grain
   · dark pits (about 4% of the surface, 0.3% deep), lighter sand flecks, a few aggregate chips
   · dried grass strands and hairline debris, and near the bottom three scored lines from a finishing broom
   It also returns a grain mask: chalk only takes on the high points, so wherever the
   fine grain is low or a pit sits, the chalk drops out.                                       */
export function rng(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function octave(w, h, lam, rand) {
  const gw = Math.ceil(w / lam) + 3, gh = Math.ceil(h / lam) + 3, L = new Float32Array(gw * gh);
  for (let i = 0; i < L.length; i++) L[i] = rand() * 2 - 1;
  return { L, gw, lam };
}
function at(o, x, y) {
  x /= o.lam; y /= o.lam;
  const xi = x | 0, yi = y | 0; let fx = x - xi, fy = y - yi;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const i = yi * o.gw + xi, L = o.L, a = L[i], b = L[i + 1], c = L[i + o.gw], d = L[i + o.gw + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

export function makeConcrete({ w, h, s, seed, tone, amp, pits = 1, debris = 1, lines = [] }) {
  const W = Math.round(w * s), H = Math.round(h * s), rand = rng(seed);
  const O1 = octave(w, h, 120, rand), O2 = octave(w, h, 26, rand), O3 = octave(w, h, 4, rand), O4 = octave(w, h, 1.15, rand), OC = octave(w, h, 90, rand);
  const cv = canvas(W, H), c = cv.getContext('2d'), img = c.createImageData(W, H), D = img.data;
  const gc = canvas(W, H), g = gc.getContext('2d'), gimg = g.createImageData(W, H), GD = gimg.data;
  const fineStd = 0.42 * Math.hypot(amp.grain, amp.fine), rgb = [0, 0, 0];
  for (let py = 0; py < H; py++) {
    const ry = py / s;
    for (let px = 0; px < W; px++) {
      const rx = px / s, i = (py * W + px) * 4;
      tone(rx / w, ry / h, rgb);
      const f = at(O3, rx, ry) * amp.grain + at(O4, rx, ry) * amp.fine;
      const v = (at(O1, rx, ry) * amp.macro + at(O2, rx, ry) * amp.mottle + f) * (1 + (amp.rise || 0) * ry / h);
      const ch = at(OC, rx, ry) * amp.chroma;
      D[i] = rgb[0] + v + ch; D[i + 1] = rgb[1] + v; D[i + 2] = rgb[2] + v - ch; D[i + 3] = 255;
      let u = (f / fineStd + 1.7) / 1.2; u = u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u);
      GD[i] = GD[i + 1] = GD[i + 2] = 255; GD[i + 3] = u * 255;
    }
  }
  c.putImageData(img, 0, 0); g.putImageData(gimg, 0, 0);
  c.setTransform(s, 0, 0, s, 0, 0); g.setTransform(s, 0, 0, s, 0, 0);
  g.globalCompositeOperation = 'destination-out';
  const area = w * h, TAU = Math.PI * 2;

  // dark pits: the chalk cannot reach into them either
  for (let n = area / 120 * pits; n-- > 0;) {
    const x = rand() * w, y = rand() * h, r = 0.35 + rand() ** 2 * 1.0, a = 0.18 + rand() * 0.35;
    c.fillStyle = `rgba(48,46,44,${a})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    g.fillStyle = `rgba(0,0,0,${Math.min(1, a * 1.8)})`; g.beginPath(); g.arc(x, y, r * 1.1, 0, TAU); g.fill();
  }
  // sand flecks
  for (let n = area / 260; n-- > 0;) {
    const x = rand() * w, y = rand() * h, r = 0.3 + rand() * 0.6;
    c.fillStyle = `rgba(225,224,218,${0.12 + rand() * 0.25})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  // aggregate chips, small and irregular
  for (let n = area / 14000 * pits; n-- > 0;) {
    const x = rand() * w, y = rand() * h, r = 1 + rand() * 1.4, k = 5 + (rand() * 3 | 0);
    c.fillStyle = `rgba(70,67,62,${0.45 + rand() * 0.35})`; c.beginPath();
    for (let j = 0; j < k; j++) { const t = j / k * TAU, q = r * (0.6 + rand() * 0.5); c.lineTo(x + Math.cos(t) * q, y + Math.sin(t) * q); }
    c.fill();
    g.fillStyle = '#000'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  c.lineCap = 'round';
  // dried grass strands, and darker hairlines
  for (let n = area / 17000 * debris; n-- > 0;) {
    const x = rand() * w, y = rand() * h, L = 5 + rand() * 19, t = rand() * TAU, b = (rand() - 0.5) * 4;
    c.strokeStyle = `rgba(200,190,168,${0.35 + rand() * 0.3})`; c.lineWidth = 0.6 + rand() * 0.4;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(t) * L / 2 - Math.sin(t) * b, y + Math.sin(t) * L / 2 + Math.cos(t) * b, x + Math.cos(t) * L, y + Math.sin(t) * L); c.stroke();
  }
  for (let n = area / 30000 * debris; n-- > 0;) {
    const x = rand() * w, y = rand() * h, L = 6 + rand() * 10, t = rand() * TAU;
    c.strokeStyle = 'rgba(60,58,55,.4)'; c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(t) * L, y + Math.sin(t) * L); c.stroke();
  }
  // the broom's scored lines: a dark groove with a faint lit lip under it, broken where the concrete is worn
  for (const ly of lines) {
    const ph = rand() * 10;
    for (let x = 0; x < w; x += 5) {
      const y0 = ly + Math.sin(x * 0.011 + ph) * 0.8, y1 = ly + Math.sin((x + 5) * 0.011 + ph) * 0.8;
      const a = 0.42 * (0.55 + 0.45 * at(O2, x * 2.3, ly * 3));
      c.strokeStyle = `rgba(62,60,56,${a})`; c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x + 5, y1); c.stroke();
      c.strokeStyle = `rgba(205,203,196,${a * 0.4})`; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(x, y0 + 1.2); c.lineTo(x + 5, y1 + 1.2); c.stroke();
    }
  }
  return { canvas: cv, grain: gc };
}
