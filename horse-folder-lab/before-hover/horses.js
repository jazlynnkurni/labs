/* horses.js: the chalk horse frames and how they are drawn onto the front folder.
   frames/h01..h11.png come from tools/draw_frames.py: Muybridge's Sallie Gardner, one full stride
   in 11 photographs, redrawn as chalk, facing left, 3 px per reference px; frames/meta.json has
   their size, where the planted hooves stand and each frame's extent. Positions here are in the reference's 736 grid.                 */
import { FRONT_D } from './folder.js';
export const N = 11, PX = 3;
export const META = await (await fetch(new URL('frames/meta.json', import.meta.url))).json();
const HOOF = META.hoof;
export function loadFrames(base = 'frames/') {
  return Promise.all(Array.from({ length: N }, (_, i) => new Promise((ok, no) => {
    const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = `${base}h${String(i + 1).padStart(2, '0')}.png`;
  })));
}
/* a canvas laid over the folder, in reference px, clipped to the front sheet */
export function overlay(el) {
  const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  el.appendChild(cv);
  const ctx = cv.getContext('2d'), clip = new Path2D(FRONT_D);
  const size = () => { const d = Math.min(2, devicePixelRatio || 1), w = el.clientWidth; cv.width = cv.height = Math.round(w * d); return w * d / 736; };
  let k = size(); addEventListener('resize', () => { k = size(); });
  return {
    cv, ctx,
    begin() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(k, 0, 0, k, 0, 0); ctx.save(); ctx.clip(clip); },
    end() { ctx.restore(); }
  };
}
/* one horse: nose at x, hooves on ground, at scale */
export function drawHorse(ctx, img, { x, ground, scale = 1 }) {
  const w = img.width / PX * scale, h = img.height / PX * scale;
  ctx.drawImage(img, x, ground - HOOF * scale, w, h);
}
