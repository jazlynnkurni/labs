/* paper-wall-lab: her word wall as paper. The page is the sheet; newsprint is what is under it or torn
   from it. Shared: the words, a seeded random, a newsprint texture, a torn edge. */
export const WORDS = ['JAZLYNN','DESIGNER','PASSIONATE','CURIOUS','CHARMING','PLAYFUL','INTERACTION','COGNITION'];
export const PAPER = '#FAF9F7';
export function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* newsprint: columns of grey text lines, a headline bar now and then, a halftone photo patch, all on a
   slightly yellowed sheet. Abstract on purpose: it reads as a newspaper without quoting one. */
export function newsprint(w, h, seed = 1, { tone = '#ebe7dd', ink = 'rgba(30,28,24,.42)', photo = true, heads = true } = {}) {
  const R = rng(seed), c = document.createElement('canvas'), d = Math.min(2, devicePixelRatio || 1);
  c.width = w * d; c.height = h * d; const x = c.getContext('2d'); x.scale(d, d);
  x.fillStyle = tone; x.fillRect(0, 0, w, h);
  const cols = Math.max(2, Math.round(w / 120)), gut = 10, cw = (w - gut * (cols + 1)) / cols;
  for (let k = 0; k < cols; k++) {
    const x0 = gut + k * (cw + gut); let y = 6 + R() * 10;
    while (y < h) {
      if (heads && R() < .06) { x.fillStyle = 'rgba(20,18,16,.78)'; x.fillRect(x0, y, cw * (.5 + R() * .5), 7); y += 13; continue; }
      if (photo && R() < .025) { const ph = 30 + R() * 40; for (let yy = 0; yy < ph; yy += 3) for (let xx = 0; xx < cw; xx += 3) { const v = .5 + .5 * Math.sin(xx * .05 + yy * .07 + k); x.fillStyle = `rgba(20,18,16,${.15 + .5 * v * R()})`; x.beginPath(); x.arc(x0 + xx, y + yy, .9 * v + .2, 0, 6.3); x.fill(); } y += ph + 6; continue; }
      x.fillStyle = ink; const L = R() < .14 ? cw * (.3 + R() * .5) : cw; x.fillRect(x0, y, L, 1.3); y += 3.6;
      if (R() < .05) y += 4;
    }
  }
  for (let i = 0; i < w * h / 40; i++) { x.fillStyle = `rgba(0,0,0,${R() * .05})`; x.fillRect(R() * w, R() * h, 1, 1); }
  return c;
}
/* a torn edge: points every few px, each pushed in by a random amount, with the odd deeper bite */
export function torn(w, h, seed = 1, { amp = 3.2, step = 4, sides = 'trbl' } = {}) {
  const R = rng(seed), P = [], j = () => R() * amp * (R() < .08 ? 2.2 : 1);
  const top = sides.includes('t'), rt = sides.includes('r'), bot = sides.includes('b'), lf = sides.includes('l');
  for (let x = 0; x <= w; x += step) P.push([x, top ? j() : 0]);
  for (let y = 0; y <= h; y += step) P.push([rt ? w - j() : w, y]);
  for (let x = w; x >= 0; x -= step) P.push([x, bot ? h - j() : h]);
  for (let y = h; y >= 0; y -= step) P.push([lf ? j() : 0, y]);
  return `polygon(${P.map(([a, b]) => `${a.toFixed(1)}px ${b.toFixed(1)}px`).join(',')})`;
}
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
