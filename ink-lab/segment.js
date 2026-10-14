// ink lab, layer segmentation.
// one pass over the pixels of whatever image was dropped in, producing the two
// packed mask sets the motion stage reads:
//   A = foliage, flowers, ocean, sky
//   B = cliffs, road and sand, figure, canopy height
// the classifier is written generically and tuned by the sliders in the panel,
// because auto segmentation on an arbitrary image will always need correcting.

const SEG = (() => {

const DEFAULTS = {
  skyLine: 0.42,    // how far down the frame sky is still possible
  darkLevel: 0.22,  // what counts as near black
  greenHue: 110,    // hue centre for bush
  greenSpan: 62,
  flowerHue: 262,   // hue centre for the blue violet shrubs
  flowerSpan: 48,
  roadLum: 0.52,    // how bright sand and road have to be
  roadSat: 0.32,
  streak: 0.045,    // how streaky a band has to be to read as breaking water
  texture: 0.010    // local variance floor for foliage
};

function smooth(a, b, x) {
  if (a === b) return x >= b ? 1 : 0;
  let t = (x - a) / (b - a);
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return t * t * (3 - 2 * t);
}
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function hueDist(h, c, span) {
  let d = Math.abs(h - c);
  if (d > 180) d = 360 - d;
  return smooth(span, span * 0.45, d);
}

// separable box blur over a float plane, used for local statistics and for
// feathering mask edges so layers do not tear where they meet.
function box(src, w, h, r) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const n = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    const row = y * w;
    for (let i = -r; i <= r; i++) acc += src[row + Math.min(w - 1, Math.max(0, i))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / n;
      const add = src[row + Math.min(w - 1, x + r + 1)];
      const sub = src[row + Math.max(0, x - r)];
      acc += add - sub;
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let i = -r; i <= r; i++) acc += tmp[Math.min(h - 1, Math.max(0, i)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / n;
      const add = tmp[Math.min(h - 1, y + r + 1) * w + x];
      const sub = tmp[Math.max(0, y - r) * w + x];
      acc += add - sub;
    }
  }
  return out;
}

function segment(source, opts) {
  const o = Object.assign({}, DEFAULTS, opts || {});
  const sw = source.width || source.videoWidth || 1;
  const sh = source.height || source.videoHeight || 1;
  const w = Math.max(64, Math.min(400, Math.round(sw > sh ? 400 : 400 * sw / sh)));
  const h = Math.max(64, Math.round(w * sh / sw));

  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;

  const N = w * h;
  const L = new Float32Array(N);
  const V = new Float32Array(N);
  const S = new Float32Array(N);
  const H = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const r = px[i * 4] / 255, g = px[i * 4 + 1] / 255, b = px[i * 4 + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const d = mx - mn;
    let hue = 0;
    if (d > 1e-5) {
      if (mx === r) hue = 60 * (((g - b) / d) % 6);
      else if (mx === g) hue = 60 * ((b - r) / d + 2);
      else hue = 60 * ((r - g) / d + 4);
      if (hue < 0) hue += 360;
    }
    L[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    V[i] = mx;
    S[i] = mx > 1e-4 ? d / mx : 0;
    H[i] = hue;
  }

  // local statistics: variance picks out foliage from flat water or sky, and the
  // difference between vertical and horizontal change picks out the horizontal
  // streaking of a line of breaking surf.
  const Lm = box(L, w, h, 2);
  const L2 = new Float32Array(N);
  for (let i = 0; i < N; i++) L2[i] = L[i] * L[i];
  const L2m = box(L2, w, h, 2);
  const varr = new Float32Array(N);
  for (let i = 0; i < N; i++) varr[i] = Math.max(0, L2m[i] - Lm[i] * Lm[i]);

  const streak = new Float32Array(N);
  const vgrad = new Float32Array(N);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const xm = y * w + Math.max(0, x - 1), xp = y * w + Math.min(w - 1, x + 1);
      const ym = Math.max(0, y - 1) * w + x, yp = Math.min(h - 1, y + 1) * w + x;
      const dh = Math.abs(L[xp] - L[xm]);
      const dv = Math.abs(L[yp] - L[ym]);
      streak[i] = dv - dh;
      vgrad[i] = dv;
    }
  }
  const streakM = box(streak, w, h, 3);
  const vgradM = box(vgrad, w, h, 2);

  const sky = new Float32Array(N);
  const ocean = new Float32Array(N);
  const cliff = new Float32Array(N);
  const fol = new Float32Array(N);
  const flw = new Float32Array(N);
  const road = new Float32Array(N);
  const fig = new Float32Array(N);
  const darkP = new Float32Array(N);

  for (let y = 0; y < h; y++) {
    const yy = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const v = V[i], s = S[i], hu = H[i], lm = L[i];

      const blueish = Math.max(hueDist(hu, 225, 70), 1 - smooth(0.10, 0.30, s));
      const high = smooth(o.skyLine + 0.08, o.skyLine - 0.08, yy);
      const dark = smooth(o.darkLevel + 0.32, o.darkLevel + 0.02, v);
      sky[i] = high * dark * (0.35 + 0.65 * blueish);

      const band = smooth(0.12, 0.22, yy) * (1 - smooth(0.60, 0.76, yy));
      const streaky = smooth(o.streak * 0.4, o.streak * 1.6, streakM[i]);
      const wet = Math.max(hueDist(hu, 205, 80), smooth(0.45, 0.75, lm));
      ocean[i] = band * streaky * (0.30 + 0.70 * wet);

      const green = hueDist(hu, o.greenHue, o.greenSpan);
      const textured = smooth(o.texture * 0.35, o.texture * 1.8, varr[i]);
      fol[i] = green * smooth(0.20, 0.34, yy) * (0.35 + 0.65 * textured) * (1 - smooth(0.55, 0.80, v));

      const violet = hueDist(hu, o.flowerHue, o.flowerSpan);
      flw[i] = violet * smooth(0.10, 0.24, s) * smooth(0.28, 0.42, yy);

      road[i] = smooth(o.roadLum - 0.10, o.roadLum + 0.10, lm) *
                (1 - smooth(o.roadSat - 0.10, o.roadSat + 0.10, s)) *
                smooth(0.22, 0.36, yy);

      const nearBlack = smooth(o.darkLevel + 0.10, o.darkLevel - 0.06, v);
      cliff[i] = nearBlack * (1 - green) * smooth(0.10, 0.22, yy) *
                 (0.45 + 0.55 * smooth(0.02, 0.14, vgradM[i]));
      darkP[i] = nearBlack;
    }
  }

  // the figure: a small dark blob sitting on the pale road, not a dark mass.
  const roadNear = box(road, w, h, 7);
  const darkNear = box(darkP, w, h, 7);
  for (let i = 0; i < N; i++) {
    fig[i] = darkP[i] * smooth(0.10, 0.35, roadNear[i]) * (1 - smooth(0.30, 0.55, darkNear[i]));
  }

  // resolve overlaps by priority, highest first, so a pixel belongs to one layer
  const order = [fig, road, flw, fol, ocean, cliff, sky];
  const taken = new Float32Array(N);
  for (let k = 0; k < order.length; k++) {
    const m = order[k];
    for (let i = 0; i < N; i++) {
      const v = clamp01(m[i]) * (1 - taken[i]);
      m[i] = v;
      taken[i] = clamp01(taken[i] + v);
    }
  }

  // canopy height: for every foliage pixel, how far it sits above the base of
  // the foliage run it belongs to. displacement is anchored to that base.
  const canopy = new Float32Array(N);
  for (let x = 0; x < w; x++) {
    let y = h - 1;
    while (y >= 0) {
      if (fol[y * w + x] > 0.4) {
        const base = y;
        let top = y;
        while (top >= 0 && fol[top * w + x] > 0.4) top--;
        top++;
        const span = Math.max(1, base - top);
        for (let k = top; k <= base; k++) canopy[k * w + x] = (base - k) / span;
        y = top - 1;
      } else {
        y--;
      }
    }
  }

  const fe = 2;
  const F = box(fol, w, h, fe);
  const W = box(flw, w, h, fe);
  const O = box(ocean, w, h, fe);
  const K = box(sky, w, h, fe);
  const C = box(cliff, w, h, fe);
  const R = box(road, w, h, fe);
  const G = box(fig, w, h, 1);
  const CH = box(canopy, w, h, fe);

  const A = new ImageData(w, h);
  const B = new ImageData(w, h);
  for (let i = 0; i < N; i++) {
    A.data[i * 4] = clamp01(F[i]) * 255;
    A.data[i * 4 + 1] = clamp01(W[i]) * 255;
    A.data[i * 4 + 2] = clamp01(O[i]) * 255;
    A.data[i * 4 + 3] = clamp01(K[i]) * 255;
    B.data[i * 4] = clamp01(C[i]) * 255;
    B.data[i * 4 + 1] = clamp01(R[i]) * 255;
    B.data[i * 4 + 2] = clamp01(Math.min(1, G[i] * 1.6)) * 255;
    B.data[i * 4 + 3] = clamp01(CH[i]) * 255;
  }

  // where the water sits in the frame, so the wave sets know which way is shore
  let top = 1, bot = 0;
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = 0; x < w; x++) sum += O[y * w + x];
    if (sum / w > 0.12) {
      const yy = y / (h - 1);
      if (yy < top) top = yy;
      if (yy > bot) bot = yy;
    }
  }
  if (bot - top < 0.02) { top = 0.30; bot = 0.445; }

  return { a: A, b: B, w, h, oceanBand: [top, bot] };
}

return { segment, DEFAULTS };
})();
