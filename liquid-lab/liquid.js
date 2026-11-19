/* liquid-lab engine. A cluster of drops in her eight swatches, centred on the page. Each drop is a
   source in a field; the field is summed on a coarse grid with a short-range kernel (1 - d²/R²)³,
   R = 1.4 r, and a lone drop's surface sits exactly at r (threshold T). Close drops run together.
   Drag a drop and it follows on a spring, trailing a chain of slower drops of itself, so it stretches
   and necks. Each page only decides how the field is painted (and may move the drops itself). */
export const SW = ['#dfddc8','#c7c7c7','#827a85','#9ba69c','#c4c1c8','#dfddc8','#c2beb3','#dfdac8'];
export const T = (1 - 1 / 1.96) ** 3;
const CLUSTER = [[-.30,-.16,.165,6],[.04,-.30,.15,0],[.30,-.07,.16,2],[.18,.24,.15,4],[-.12,.22,.17,3],[-.34,.15,.12,1],[.02,.0,.13,7]];
export const rgbOf = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mount(cv, { Q = 3, chain = 3, render, update, grabbable = true } = {}) {
  const ctx = cv.getContext('2d'), low = document.createElement('canvas'), lx = low.getContext('2d');
  const S = { W: 0, H: 0, dpr: 1, w: 0, h: 0, Q, F: null, R: null, G: null, B: null, img: null, t: 0, ctx, low, lx, cv };
  const drops = CLUSTER.map(([x, y, r, ink], i) => ({ i, fx: x, fy: y, fr: r, col: SW[ink], rgb: rgbOf(SW[ink]), x: 0, y: 0, vx: 0, vy: 0, r: 0, hx: 0, hy: 0, tail: [] }));
  S.drops = drops;
  const fit = () => {
    S.dpr = Math.min(2, devicePixelRatio || 1); S.W = cv.clientWidth; S.H = cv.clientHeight;
    cv.width = S.W * S.dpr; cv.height = S.H * S.dpr; ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    S.w = Math.ceil(S.W / Q); S.h = Math.ceil(S.H / Q); low.width = S.w; low.height = S.h; S.img = lx.createImageData(S.w, S.h);
    const n = S.w * S.h; S.F = new Float32Array(n); S.R = new Float32Array(n); S.G = new Float32Array(n); S.B = new Float32Array(n);
    const m = Math.min(S.W, S.H) * .82, cx = S.W / 2, cy = S.H / 2;
    for (const d of drops) { d.hx = cx + d.fx * m; d.hy = cy + d.fy * m; d.r = d.fr * m;
      if (!d.x) { d.x = d.hx; d.y = d.hy; d.tail = Array.from({ length: chain }, () => ({ x: d.hx, y: d.hy, vx: 0, vy: 0 })); } }
  };
  fit(); addEventListener('resize', fit);

  const P = { x: -1e4, y: -1e4, in: false }; let drag = null, off = [0, 0];
  const at = e => { const r = cv.getBoundingClientRect(); P.x = e.clientX - r.left; P.y = e.clientY - r.top; P.in = true; };
  const pick = () => { let best = null, bd = 1e9; for (const d of drops) { const q = Math.hypot(P.x - d.x, P.y - d.y) / d.r; if (q < 1.05 && q < bd) { bd = q; best = d; } } return best; };
  cv.addEventListener('pointermove', e => { at(e); if (!drag) cv.style.cursor = grabbable && pick() ? 'grab' : 'default'; });
  cv.addEventListener('pointerleave', () => { if (!drag) P.in = false; });
  cv.addEventListener('pointerdown', e => { at(e); if (!grabbable) return; const d = pick(); if (!d) return; drag = d; off = [d.x - P.x, d.y - P.y]; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
  addEventListener('pointerup', () => { drag = null; cv.style.cursor = 'default'; });
  S.P = P; S.dragging = () => drag;

  function field(srcs) {
    const { F, R, G, B, w, h } = S; F.fill(0); R.fill(0); G.fill(0); B.fill(0);
    for (const s of srcs) {
      const cx = s.x / Q, cy = s.y / Q, RR = s.r * 1.4 / Q, R2 = RR * RR;
      const x0 = Math.max(0, cx - RR | 0), x1 = Math.min(w - 1, cx + RR + 1 | 0), y0 = Math.max(0, cy - RR | 0), y1 = Math.min(h - 1, cy + RR + 1 | 0);
      for (let y = y0; y <= y1; y++) { const dy = (y - cy) ** 2; for (let x = x0; x <= x1; x++) {
        const u = 1 - ((x - cx) ** 2 + dy) / R2; if (u <= 0) continue; const q = u * u * u * (s.w ?? 1), i = y * w + x;
        F[i] += q; R[i] += s.rgb[0] * q; G[i] += s.rgb[1] * q; B[i] += s.rgb[2] * q; } }
    }
  }
  const t0 = performance.now();
  (function frame(now) {
    S.t = (now - t0) / 1000;
    for (const d of drops) {
      let tx = d.hx, ty = d.hy;
      if (d === drag) { tx = P.x + off[0]; ty = P.y + off[1]; }
      if (update) [tx, ty] = update(d, tx, ty, S) || [tx, ty];
      const k = d === drag ? .3 : .07;
      d.vx = (d.vx + (tx - d.x) * k) * .8; d.vy = (d.vy + (ty - d.y) * k) * .8; d.x += d.vx; d.y += d.vy;
      if (reduced && d !== drag && !update) { d.x = tx; d.y = ty; }
      let lead = d; for (const c of d.tail) { c.vx = (c.vx + (lead.x - c.x) * (S.tailK ?? .035)) * (S.tailD ?? .86); c.vy = (c.vy + (lead.y - c.y) * (S.tailK ?? .035)) * (S.tailD ?? .86); c.x += c.vx; c.y += c.vy; lead = c; }
    }
    const srcs = [];
    for (const d of drops) { srcs.push({ x: d.x, y: d.y, r: d.r, rgb: d.rgb }); d.tail.forEach((c, k) => srcs.push({ x: c.x, y: c.y, r: d.r * (S.tailR ?? .62) * Math.pow(S.tailFall ?? .8, k), rgb: d.rgb })); }
    field(srcs); render(S);
    requestAnimationFrame(frame);
  })(performance.now());
  return S;
}

/* the paper's grain, for laying over painted liquid */
let pat = null;
export function grain(ctx, a = 46) {
  if (pat) return pat; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), im = g.createImageData(256, 256);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() < .5 ? 0 : 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = Math.random() * a; }
  g.putImageData(im, 0, 0); return (pat = ctx.createPattern(c, 'repeat'));
}
export function present(S, { grainOn = true } = {}) {
  const { ctx, low, lx, img, W, H } = S; lx.putImageData(img, 0, 0);
  ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(low, 0, 0, W, H);
  if (grainOn) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = grain(ctx); ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
