/* procession.js: four horses across the front folder, one gallop cycle at different offsets,
   discrete frames at 9 fps. finish adds the analog layer: screen-blended chalk, a faint cyan
   bloom on the brightest strokes, the paper's tooth breaking the chalk, a slight per-frame
   luminance and exposure flicker, and fixed hairline scratches over the print.
   prefers-reduced-motion: one chosen frame, held, no flicker.                                   */
import { mountFolder, FRONT_D } from './folder.js';
import { N, loadFrames, overlay, drawHorse } from './horses.js';
import { rng } from './texture.js';

/* a carousel: four horses galloping right to left round a loop, each at its own point in the
   stride. Between drawings a horse moves exactly as far as Sallie Gardner did between Muybridge's
   cameras, 27 inches, which is 188.5 px on the plate and 37.7 reference px at scale 1, so a
   planted hoof stays planted. One shared scale keeps the spacing fixed so they never collide.
   The opening positions follow the reference's horse boxes.                                  */
const SCALE = 0.97, ADVANCE = 37.7 * SCALE, X_MIN = -225, LOOP = 915;     // a horse is 210 px nose to tail
export const HORSES = [
  { start: 8, x: -14, ground: 388 },
  { start: 3, x: 188, ground: 400 },
  { start: 5, x: 356, ground: 397 },
  { start: 1, x: 572, ground: 391 },
].map((h, j) => ({ ...h, scale: SCALE, ring: -20 + j * LOOP / 4 }));
// in the carousel they are spaced evenly round the loop, so no gap ever opens up
const placeX = (h, n) => X_MIN + ((((h.ring - X_MIN - n * ADVANCE) % LOOP) + LOOP) % LOOP);
const STILL = 0;                                    // the held frame for reduced motion: every horse at its start pose

/* controlled: the horses stand still until play(fps); settle(done) lets the current stride finish,
   so they come to rest on their opening poses rather than freezing mid-step; stop() halts at once */
export async function mountProcession(el, { finish = false, fps = 9, travel = false, mirror = null, controlled = false } = {}) {
  const { front } = mountFolder(el);
  // the reflection: the same folder again, and the horses copied into it each frame
  let mx = null;
  if (mirror) { const m = mountFolder(mirror); const mc = document.createElement('canvas'); mc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; m.front.appendChild(mc); mx = mc.getContext('2d'); }
  const o = overlay(front), frames = await loadFrames();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  // the paper's tooth: chalk skips where the sheet dips; fixed to the sheet, made once
  const tooth = finish ? makeTooth() : null, scratches = finish ? makeScratches() : null;
  const layer = document.createElement('canvas'), lx = layer.getContext('2d');
  const flick = document.createElement('div');
  flick.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:#fff;opacity:0;clip-path:path("' + '")';
  if (finish) { front.appendChild(flick); }
  let n = 0, acc = 0, last = performance.now(), hold = 1000 / fps, running = !controlled, settleCb = null;
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
      const x = travel ? placeX(h, n) : h.x;
      drawHorse(lx, f, { x: x + jx, ground: h.ground + jy, scale: h.scale });
      lx.globalAlpha = 1;
    });
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
    el.dataset.frame = n;                           // for checks: which drawing is up
    if (mx) { const mc = mx.canvas; if (mc.width !== o.cv.width) { mc.width = o.cv.width; mc.height = o.cv.height; } mx.clearRect(0, 0, mc.width, mc.height); mx.drawImage(o.cv, 0, 0); }
  }
  function tick(now) {
    acc += now - last; last = now;
    if (running && acc >= hold) {
      acc = 0; n = (n + 1) % (N * 7 * LOOP); hold = 1000 / fps * (finish ? 0.9 + 0.2 * hash(n * 3) : 1); draw();
      if (settleCb && n % N === 0) {               // a whole stride done: rest on the opening poses, light steady
        running = false; flick.style.opacity = 0; const cb = settleCb; settleCb = null; cb();
      }
    }
    requestAnimationFrame(tick);
  }
  draw(); if (controlled) flick.style.opacity = 0;
  addEventListener('resize', draw);
  if (!reduce.matches) requestAnimationFrame(tick);
  reduce.addEventListener?.('change', () => location.reload());
  return {
    draw,
    play(f = fps) {                                 // starts on the very next frame, no wind-up
      if (reduce.matches) return;
      fps = f; settleCb = null;
      if (!running) { running = true; last = performance.now(); acc = hold; }
    },
    settle(done) { if (!running || reduce.matches) { running = false; done(); return; } settleCb = done; },
    stop() { running = false; settleCb = null; flick.style.opacity = 0; },
    get frame() { return n; }
  };
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
