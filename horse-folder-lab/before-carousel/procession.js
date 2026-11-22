/* procession.js: four horses across the front folder, one gallop cycle at different offsets,
   discrete frames at 9 fps. finish adds the analog layer: screen-blended chalk, a faint cyan
   bloom on the brightest strokes, the paper's tooth breaking the chalk, a slight per-frame
   luminance and exposure flicker, and fixed hairline scratches over the print.
   prefers-reduced-motion: one chosen frame, held, no flicker.                                   */
import { mountFolder, FRONT_D } from './folder.js';
import { N, loadFrames, overlay, drawHorse } from './horses.js';
import { rng } from './texture.js';

/* placed on the reference's horse boxes; start frames chosen so the opening pose in each slot
   matches the reference (2 gathered mid-leap, 3 extended, 4 bunched, 1 stretched out)        */
export const HORSES = [
  { start: 8, x: -14, ground: 386, scale: 0.92 },
  { start: 3, x: 188, ground: 402, scale: 0.96 },
  { start: 5, x: 356, ground: 397, scale: 1.0 },
  { start: 1, x: 572, ground: 390, scale: 0.88 },
];
const STILL = 0;                                    // the held frame for reduced motion: every horse at its start pose

export async function mountProcession(el, { finish = false, fps = 9 } = {}) {
  mountFolder(el);
  const o = overlay(el), frames = await loadFrames();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  // the paper's tooth: chalk skips where the sheet dips; fixed to the sheet, made once
  const tooth = finish ? makeTooth() : null, scratches = finish ? makeScratches() : null;
  const layer = document.createElement('canvas'), lx = layer.getContext('2d');
  const flick = document.createElement('div');
  flick.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:#fff;opacity:0;clip-path:path("' + '")';
  if (finish) { el.appendChild(flick); }
  let n = 0, acc = 0, last = performance.now(), hold = 1000 / fps;
  const R = rng(5);

  function draw() {
    const k = o.cv.width / 736;
    if (layer.width !== o.cv.width) { layer.width = layer.height = o.cv.width; }
    lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, layer.width, layer.height); lx.setTransform(k, 0, 0, k, 0, 0);
    HORSES.forEach((h, j) => {
      const f = frames[(h.start + n) % N];
      // the hand never registers a drawing in quite the same place, by a fraction of a pixel
      const jx = finish ? (hash(n * 7 + j) - 0.5) * 0.8 : 0, jy = finish ? (hash(n * 13 + j) - 0.5) * 0.5 : 0;
      lx.globalAlpha = finish ? 0.9 + 0.1 * hash(n * 31 + j * 3) : 1;          // luminance varies a little, drawing to drawing
      drawHorse(lx, f, { x: h.x + jx, ground: h.ground + jy, scale: h.scale });
    });
    lx.globalAlpha = 1; ground(lx, k);
    lx.globalAlpha = 1;
    if (finish) {
      lx.setTransform(1, 0, 0, 1, 0, 0);
      lx.globalCompositeOperation = 'destination-in'; lx.drawImage(tooth, 0, 0, layer.width, layer.height);
      lx.globalCompositeOperation = 'source-over';
    }
    o.begin(); o.ctx.setTransform(1, 0, 0, 1, 0, 0); o.ctx.save(); o.ctx.setTransform(k, 0, 0, k, 0, 0); o.ctx.clip(new Path2D(FRONT_D)); o.ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (finish) {                                    // bloom: only the brightest strokes, soft and faint, a little cyan
      o.ctx.globalAlpha = 0.16; o.ctx.filter = `blur(${2.2 * k}px)`; o.ctx.drawImage(layer, 0, 0); o.ctx.filter = 'none'; o.ctx.globalAlpha = 1;
    }
    o.ctx.drawImage(layer, 0, 0);
    if (finish) o.ctx.drawImage(scratches, 0, 0, layer.width, layer.height);
    o.ctx.restore(); o.end();
    if (finish) flick.style.opacity = (hash(n * 97) * 0.014).toFixed(4);        // exposure breathes, barely
  }
  function tick(now) {
    acc += now - last; last = now;
    if (acc >= hold) { acc = 0; n = (n + 1) % (N * 7); hold = 1000 / fps * (finish ? 0.9 + 0.2 * hash(n * 3) : 1); draw(); }
    requestAnimationFrame(tick);
  }
  draw();
  addEventListener('resize', draw);
  if (!reduce.matches) requestAnimationFrame(tick);
  reduce.addEventListener?.('change', () => location.reload());
  return { draw };
}

/* the chalk marks on the ground, as in the reference: a long wavering line trailing behind each
   horse and a couple of short flicks under the hooves. Drawn once per horse, they never move. */
const MARKS = HORSES.map((h, j) => {
  const R = rng(300 + j), s = h.scale, g = h.ground + 2, x0 = h.x + 70 * s, out = [];
  out.push([[x0, g + 1], [x0 + 40 * s, g - 1], [x0 + 90 * s, g + 2], [x0 + 140 * s, g - 2]]);
  for (let i = 0; i < 2; i++) {                       // a hook or a flick, each different
    const fx = h.x + (40 + R() * 110) * s, fy = g - R() * 5, L = 8 + R() * 10, up = 4 + R() * 8;
    out.push(R() < 0.5 ? [[fx, fy], [fx + L * 0.4, fy - up], [fx + L, fy - up * 0.3]] : [[fx, fy - up], [fx + L * 0.3, fy], [fx + L, fy + 1]]);
  }
  return out;
});
function ground(c, k) {
  c.save(); c.setTransform(k, 0, 0, k, 0, 0); c.lineCap = c.lineJoin = 'round'; c.strokeStyle = 'rgb(210,232,255)';
  for (const m of MARKS) for (const p of m) {
    c.globalAlpha = 0.55; c.lineWidth = 1.3; c.beginPath(); c.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) c.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
    c.lineTo(p[p.length - 1][0], p[p.length - 1][1]); c.stroke();
  }
  c.restore();
}
function hash(a) { a = (a ^ 61) ^ (a >>> 16); a = a + (a << 3); a ^= a >>> 4; a = Math.imul(a, 0x27d4eb2d); a ^= a >>> 15; return (a >>> 0) / 4294967296; }

/* the tooth: mostly solid, with the paper's fine pits where the chalk does not reach */
function makeTooth() {
  const S = 1472, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d'), img = x.createImageData(S, S), D = img.data, R = rng(41);
  for (let i = 0; i < S * S; i++) { const v = R() + R(); D[i * 4] = D[i * 4 + 1] = D[i * 4 + 2] = 255; D[i * 4 + 3] = v < 0.32 ? 90 : v < 0.5 ? 200 : 255; }
  x.putImageData(img, 0, 0); return c;
}
/* a few fine scratches and motes on the print, over everything, never moving */
function makeScratches() {
  const S = 1472, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d'), R = rng(77); x.scale(2, 2); x.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const sx = 60 + R() * 620, sy = 210 + R() * 420, L = 20 + R() * 90, t = -Math.PI / 2 + (R() - 0.5) * 0.5;
    x.strokeStyle = `rgba(235,238,240,${0.10 + R() * 0.10})`; x.lineWidth = 0.35;
    x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(t) * L, sy + Math.sin(t) * L); x.stroke();
  }
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(240,240,236,${0.12 + R() * 0.2})`; x.beginPath(); x.arc(60 + R() * 620, 210 + R() * 430, 0.3 + R() * 0.4, 0, Math.PI * 2); x.fill(); }
  return c;
}
