/* wordmark-lab: JAZLYNN in the manner of the TOSCA lettering she sent. Monoline, heavy and round, every
   free end swelling into a bulb, letters sharing strokes and nesting (TOSCA's T roofs its O, its S leans
   on both neighbours). Glyphs are stroke skeletons on a 100-unit cap height; the bulbs are added where a
   stroke ends, sized off the stroke and turned along it. */
const NS = 'http://www.w3.org/2000/svg';
export const V = {
  /* 1 classic: the Z's foot carries on into the L's, the two Ns share their middle stem */
  1: { name: 'Classic', sw: 14, paths: [
    'M6 4 L36 4', 'M21 4 L21 92 Q21 128 -12 120',                                       // J: capped stem, deep hook
    'M46 100 Q52 46 64 6 Q68 -4 72 6 Q84 46 90 100', 'M56 68 L82 68',                    // A: tall, soft apex, low bar
    'M102 6 L140 6', 'M140 6 C122 36 120 64 104 96', 'M104 96 L150 96', 'M150 0 L150 96 L190 96',   // Z (curved) into L
    'M200 2 Q206 40 222 54', 'M246 2 Q238 40 222 54', 'M222 54 L222 100',                // Y
    'M262 100 L262 4 L300 96 L300 4', 'M300 4 L338 96 L338 4'] },                        // NN, one shared stem
  /* 2 roofed: J's cap stretches over the A like TOSCA's T over its O; the L stands tall with the Y tucked on its foot */
  2: { name: 'Roofed', sw: 14, paths: [
    'M4 4 L96 4', 'M20 4 L20 94 Q20 128 -12 120',
    'M44 100 Q52 54 62 24 Q66 16 70 24 Q80 54 88 100', 'M54 76 L80 76',
    'M104 30 L140 30', 'M140 30 C124 54 122 72 106 96', 'M106 96 L150 96', 'M150 -16 L150 96 L240 96',
    'M170 30 Q176 52 192 62', 'M214 30 Q206 52 192 62', 'M192 62 L192 96',
    'M252 100 L252 4 L288 96 L288 4', 'M288 4 L324 96 L324 4'] },
  /* 3 tall: condensed and high-waisted, the A nearly a spire */
  3: { name: 'Tall', sw: 12, sy: 1.32, sx: .82, paths: [
    'M6 4 L34 4', 'M20 4 L20 94 Q20 124 -8 118',
    'M44 100 Q50 30 62 2 Q66 -4 70 2 Q82 30 88 100', 'M54 80 L78 80',
    'M100 6 L134 6', 'M134 6 C118 36 116 64 102 96', 'M102 96 L144 96', 'M144 0 L144 96 L180 96',
    'M190 2 Q194 46 208 56', 'M228 2 Q222 46 208 56', 'M208 56 L208 100',
    'M244 100 L244 4 L278 96 L278 4', 'M278 4 L312 96 L312 4'] },
  /* 4 swash: the J's hook runs on as one long stroke under the whole word and flicks up past the last N */
  4: { name: 'Swash', sw: 14, paths: [
    'M6 4 L36 4', 'M21 4 L21 92 Q21 130 70 128 L326 128 Q356 128 362 106',
    'M46 100 Q52 46 64 6 Q68 -4 72 6 Q84 46 90 100', 'M56 68 L82 68',
    'M102 6 L140 6', 'M140 6 C122 36 120 64 104 96', 'M104 96 L150 96', 'M150 0 L150 96 L190 96',
    'M198 -2 Q206 40 222 54', 'M250 -6 Q238 40 222 54', 'M222 54 L222 100',
    'M262 100 L262 4 L300 96 L300 4', 'M300 4 L338 96 L338 -4 Q338 -14 348 -16'] },
  /* 5 heavy: fatter strokes pulled tight, so neighbours touch and merge the way TOSCA's S meets its O and C */
  5: { name: 'Heavy', sw: 21, paths: [
    'M4 4 L36 4', 'M20 4 L20 94 Q20 126 -12 118',
    'M40 100 Q48 44 60 6 Q64 -4 68 6 Q78 44 84 100', 'M50 70 L76 70',
    'M90 6 L128 6', 'M128 6 C112 36 108 64 92 96', 'M92 96 L134 96', 'M134 0 L134 96 L168 96',
    'M174 2 Q180 40 196 54', 'M218 2 Q210 40 196 54', 'M196 54 L196 100',
    'M228 100 L228 4 L264 96 L264 4', 'M264 4 L300 96 L300 4'] },
};
export function draw(svg, key, { ink = '#1F1D1B' } = {}) {
  const v = V[key], sw = v.sw, g = document.createElementNS(NS, 'g');
  g.setAttribute('transform', `scale(${v.sx || 1} ${v.sy || 1})`);
  svg.appendChild(g);
  const ends = new Map();                               // count how often each point is an end: shared joins get no bulb
  const keyOf = p => `${Math.round(p.x)},${Math.round(p.y)}`;
  const els = v.paths.map(d => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d);
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', ink); p.setAttribute('stroke-width', sw);
    p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round'); g.appendChild(p); return p; });
  const tips = [];
  for (const p of els) { const L = p.getTotalLength(); for (const [a, b] of [[0, 1.5], [L, L - 1.5]]) {
    const A = p.getPointAtLength(a), B = p.getPointAtLength(Math.max(0, Math.min(L, b))); tips.push({ A, dx: A.x - B.x, dy: A.y - B.y });
    ends.set(keyOf(A), (ends.get(keyOf(A)) || 0) + 1); } }
  /* an end touching another stroke's body is a join, not a terminal */
  const onBody = (pt) => els.some(p => { const L = p.getTotalLength(); for (let s = 3; s < L - 3; s += 2) { const q = p.getPointAtLength(s); if (Math.hypot(q.x - pt.x, q.y - pt.y) < sw * .45) return true; } return false; });
  for (const t of tips) {
    if (ends.get(keyOf(t.A)) > 1 || onBody(t.A)) continue;
    const n = Math.hypot(t.dx, t.dy) || 1, ux = t.dx / n, uy = t.dy / n, ang = Math.atan2(uy, ux) * 180 / Math.PI;
    const e = document.createElementNS(NS, 'ellipse');
    e.setAttribute('cx', t.A.x - ux * sw * .12); e.setAttribute('cy', t.A.y - uy * sw * .12);
    e.setAttribute('rx', sw * .62); e.setAttribute('ry', sw * .74); e.setAttribute('fill', ink);
    e.setAttribute('transform', `rotate(${ang} ${t.A.x - ux * sw * .12} ${t.A.y - uy * sw * .12})`); g.appendChild(e);
  }
  const b = g.getBBox(), pad = sw * 1.6;
  svg.setAttribute('viewBox', `${(b.x - pad) * (v.sx || 1)} ${(b.y - pad) * (v.sy || 1)} ${(b.width + pad * 2) * (v.sx || 1)} ${(b.height + pad * 2) * (v.sy || 1)}`);
}
