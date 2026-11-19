/* disc-motion-lab: five ways to tell a visitor the hero's circles can be moved.
   Shared: her eight swatches, her formation (2026-11-05), the grain, the word wall. */
export const SW = ['#dfddc8','#c7c7c7','#827a85','#9ba69c','#c4c1c8','#dfddc8','#c2beb3','#dfdac8'];
export const HOME = [
  {x:0.70,y:0.12,r:0.135,ink:6},{x:0.98,y:0.26,r:0.150,ink:0},{x:0.94,y:0.58,r:0.125,ink:2},{x:0.90,y:0.90,r:0.115,ink:4},
  {x:1.02,y:0.80,r:0.100,ink:5},{x:0.76,y:0.43,r:0.120,ink:1},{x:0.85,y:0.10,r:0.110,ink:7},{x:0.72,y:0.77,r:0.140,ink:3}];
export const WORDS = ['JAZLYNN','DESIGNER','PASSIONATE','CURIOUS','CHARMING','PLAYFUL','INTERACTION','COGNITION'];

export function stage(cv) {
  const s = { ctx: cv.getContext('2d'), W: 0, H: 0, dpr: 1 };
  const fit = () => { s.dpr = Math.min(2, devicePixelRatio || 1); s.W = cv.clientWidth; s.H = cv.clientHeight;
    cv.width = s.W * s.dpr; cv.height = s.H * s.dpr; s.ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); };
  fit(); addEventListener('resize', fit); return s;
}
export function discs(s) {
  return HOME.map((h, i) => ({ i, h, col: SW[h.ink], x: h.x * s.W, y: h.y * s.H, r: h.r * s.W, vx: 0, vy: 0, lift: 0, lv: 0, hover: 0 }));
}
export const homeOf = (d, s) => [d.h.x * s.W, d.h.y * s.H];
export const rOf = (d, s) => d.h.r * s.W;

/* the vellum grain: the same fine speckle her sheets carry */
let pat = null;
export function grain(ctx) {
  if (pat) return pat;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), im = g.createImageData(256, 256);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() < .5 ? 0 : 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = Math.random() * 46; }
  g.putImageData(im, 0, 0); return (pat = ctx.createPattern(c, 'repeat'));
}
/* a translucent sheet: multiplied onto the paper, so where two overlap the colour deepens */
export function sheet(ctx, x, y, r, col, { alpha = .86, blend = 'multiply', sx = 1, sy = 1, rot = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, sy);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.globalCompositeOperation = blend; ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.fill();
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clip(); ctx.fillStyle = grain(ctx); ctx.fillRect(-r, -r, 2 * r, 2 * r);
  ctx.restore();
}
export function wall(el) {
  el.innerHTML = WORDS.map(w => `<div class="line">${[...w].map(c => `<span class="cell">${c}</span>`).join('')}</div>`).join('');
}
export function hit(ds, x, y) { for (let i = ds.length - 1; i >= 0; i--) { const d = ds[i]; if (Math.hypot(x - d.x, y - d.y) < d.r) return d; } return null; }
export function pointer(cv) {
  const p = { x: -1e4, y: -1e4, in: false, down: false, vx: 0, vy: 0, t: 0 };
  const at = e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now(), dt = Math.max(8, now - p.t);
    if (p.in) { p.vx = p.vx * .5 + (x - p.x) / dt * 16 * .5; p.vy = p.vy * .5 + (y - p.y) / dt * 16 * .5; } p.x = x; p.y = y; p.t = now; p.in = true; };
  cv.addEventListener('pointermove', at); cv.addEventListener('pointerdown', e => { at(e); p.down = true; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointerup', e => { p.down = false; }); cv.addEventListener('pointerleave', () => { if (!p.down) { p.in = false; p.x = p.y = -1e4; } });
  return p;
}
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
