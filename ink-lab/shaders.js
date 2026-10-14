// ink lab, shader sources.
// every fragment shader is composed as: version line, defines, head, noise library, body.
// glsl es 3.00 only. varyings are named vUv everywhere so the stages always match.

const SH = (() => {

const VERT = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const HEAD = `precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
`;

// value noise, fbm and a curl field. the curl field is what makes leaf motion
// swirl around itself instead of sliding the whole mass sideways.
const NOISE = `
float hash21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
vec2 hash22(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p, int oct) {
  float a = 0.5;
  float s = 0.0;
  float n = 0.0;
  for (int i = 0; i < 5; i++) {
    if (i >= oct) break;
    s += a * vnoise(p);
    n += a;
    p = p * 2.03 + vec2(17.13, 9.37);
    a *= 0.5;
  }
  return s / max(n, 0.0001);
}
vec2 curlN(vec2 p, int oct) {
  float e = 0.08;
  float n1 = fbm(p + vec2(0.0, e), oct);
  float n2 = fbm(p - vec2(0.0, e), oct);
  float n3 = fbm(p + vec2(e, 0.0), oct);
  float n4 = fbm(p - vec2(e, 0.0), oct);
  return vec2(n1 - n2, n4 - n3) / (2.0 * e);
}
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 toLinear(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }
`;

function frag(body, defines) {
  return '#version 300 es\n' + (defines || '') + HEAD + NOISE + body;
}

// ---------------------------------------------------------------------------
// stage 0, the source plate.
// draws either the uploaded image or the procedural coastal painting, and can
// emit the same scene as two packed mask sets instead of colour.
// ---------------------------------------------------------------------------
const SCENE = frag(`
uniform vec4 uRect;        // painting rectangle inside the canvas, canvas uv, y up
uniform vec3 uPaperCol;    // the cream sheet the print sits on
uniform int  uMode;        // 0 colour, 1 mask set A, 2 mask set B
uniform float uPaintSpace; // 1 when drawing straight into painting space (mask targets)
uniform float uHasImage;
uniform sampler2D uImage;
uniform vec2 uSeed;
uniform float uWaveCount;
uniform float uWaveComp;

float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.000001), 0.0, 1.0);
  return length(pa - ba * h);
}
// the sand road snakes out of the beach and leaves the bottom of the frame
float roadX(float v) {
  float k = clamp((v - 0.50) / 0.50, 0.0, 1.0);
  return 0.505 + 0.085 * sin(k * 3.4 + 0.2) - 0.10 * k * k;
}
float roadW(float v) {
  float k = clamp((v - 0.50) / 0.50, 0.0, 1.0);
  return mix(0.009, 0.052, k * k * 0.8 + k * 0.2);
}

void scene(vec2 p, out vec3 col, out vec4 mA, out vec4 mB) {
  float sky = 0.0, ocean = 0.0, cliff = 0.0, road = 0.0;
  float fol = 0.0, flw = 0.0, fig = 0.0, canopyH = 0.0;

  // night sky, navy lifting toward the horizon, salted with stars
  vec3 c = mix(vec3(0.060, 0.075, 0.170), vec3(0.140, 0.175, 0.295), smoothstep(0.0, 0.31, p.y));
  vec2 sg = p * vec2(80.0, 128.0);
  vec2 si = floor(sg);
  vec2 sf = fract(sg) - hash22(si + 4.1);
  float star = (1.0 - smoothstep(0.0, 0.30, length(sf))) * step(0.90, hash21(si * 1.37 + 0.5));
  c += vec3(0.90, 0.92, 1.00) * star * 0.35 * (1.0 - smoothstep(0.18, 0.31, p.y));
  sky = 1.0 - smoothstep(0.275, 0.315, p.y);

  // the ocean band, sets of breaking waves lit gold along their crests
  float ob = smoothstep(0.292, 0.316, p.y) * (1.0 - smoothstep(0.430, 0.452, p.y));
  float ot = clamp((p.y - 0.30) / 0.145, 0.0, 1.0);
  float f = ot + uWaveComp * ot * ot;
  float wave = sin(6.2831853 * (uWaveCount * f) + p.x * 1.1 + (vnoise(vec2(p.x * 3.0, f * 5.0)) - 0.5) * 1.1);
  // The crests pack tighter as the water shoals, so near the beach a whole wave
  // can fall inside a pixel. Widen the edge by however fast the wave is moving
  // across the screen, and fade the contrast out entirely once a crest is too
  // fine to draw, which is what distance does to real surf anyway.
  float fw = fwidth(wave);
  float aa = clamp(fw * 0.9, 0.012, 0.50);
  float fine = 1.0 - smoothstep(0.30, 0.95, fw);
  float crest = smoothstep(0.74 - aa, 0.97 + aa, wave) * (0.25 + 0.75 * ot) * fine;
  vec3 sea = mix(vec3(0.050, 0.090, 0.160), vec3(0.075, 0.135, 0.205), ot);
  sea = mix(sea, vec3(0.88, 0.74, 0.46), crest);
  sea = mix(sea, vec3(0.97, 0.94, 0.86), smoothstep(0.92 - aa, 1.0 + aa, wave) * 0.45 * ot * fine);
  c = mix(c, sea, ob);
  ocean = ob;
  sky *= 1.0 - ob;

  // white sand beach, wet and darker where the water has just been
  float bb = smoothstep(0.428, 0.452, p.y) * (1.0 - smoothstep(0.512, 0.548, p.y));
  vec3 sand = mix(vec3(0.74, 0.70, 0.63), vec3(0.66, 0.63, 0.56), smoothstep(0.45, 0.53, p.y));
  sand = mix(sand, vec3(0.62, 0.62, 0.58), (1.0 - smoothstep(0.440, 0.466, p.y)) * 0.5);
  c = mix(c, sand, bb);
  road = bb;
  ocean *= 1.0 - bb;

  // two near black headlands framing the gap the ocean shows through
  float rough = (vnoise(vec2(p.x * 26.0, p.y * 12.0)) - 0.5) * 0.024;
  float lTop = 0.225 + 1.05 * p.x + rough;
  float rTop = 0.215 + 1.15 * (1.0 - p.x) + rough;
  float lm = smoothstep(lTop - 0.005, lTop + 0.009, p.y) * (1.0 - smoothstep(0.452, 0.492, p.y));
  float rm = smoothstep(rTop - 0.005, rTop + 0.009, p.y) * (1.0 - smoothstep(0.452, 0.492, p.y));
  float cl = clamp(lm + rm, 0.0, 1.0);
  vec3 rock = mix(vec3(0.045, 0.055, 0.055), vec3(0.085, 0.100, 0.090), vnoise(p * vec2(30.0, 60.0)));
  c = mix(c, rock, cl);
  cliff = cl;
  ocean *= 1.0 - cl;
  sky *= 1.0 - cl;
  road *= 1.0 - cl;

  // the valley floor, dense dark bush
  float vb = smoothstep(0.505, 0.548, p.y);
  float mott = fbm(p * vec2(14.0, 22.0), 3);
  vec3 bushc = mix(vec3(0.085, 0.140, 0.080), vec3(0.150, 0.215, 0.105), mott);
  bushc = mix(bushc, vec3(0.185, 0.245, 0.120), smoothstep(0.75, 1.0, p.y) * 0.40);
  c = mix(c, bushc, vb);
  fol = vb;
  road *= 1.0 - vb;
  canopyH = vb * 0.22;

  // the pale road, laid over the bush before anything grows beside it
  float rx = roadX(p.y);
  float rw = roadW(p.y);
  float wig = (vnoise(vec2(p.y * 60.0, 3.0)) - 0.5) * rw * 0.5;
  float rmk = (1.0 - smoothstep(rw * 0.62, rw, abs(p.x - rx) + wig)) * smoothstep(0.500, 0.548, p.y);
  vec3 roadc = mix(vec3(0.78, 0.74, 0.66), vec3(0.70, 0.66, 0.58), vnoise(p * vec2(40.0, 90.0)));
  c = mix(c, roadc, rmk);
  road = max(road * (1.0 - rmk), rmk);
  fol *= 1.0 - rmk;
  canopyH *= 1.0 - rmk;

  // stylised flat topped trees, pale branching trunks under umbrella canopies.
  // index order runs back to front so nearer trees simply paint over further ones.
  for (int i = 0; i < 18; i++) {
    float fi = float(i);
    vec2 h = hash22(vec2(fi * 1.7, 5.3) + uSeed);
    float row = floor(fi / 3.0);
    float cix = mod(fi, 3.0);
    float ty = 0.575 + row * 0.075 + (h.y - 0.5) * 0.055;
    float tx = 0.10 + cix * 0.340 + (h.x - 0.5) * 0.230;
    float rxx = roadX(ty);
    float clear = roadW(ty) * 2.2 + 0.045;
    float dd = tx - rxx;
    if (abs(dd) < clear) tx = rxx + sign(dd + 0.0001) * clear;
    tx = clamp(tx, 0.05, 0.95);
    float s = (0.080 + h.x * 0.090) * (0.60 + (ty - 0.55) * 1.8);
    float baseV = ty + s * 0.50;
    float topV = ty - s * 0.60;

    float tw = s * 0.045;
    float dtr = min(sdSeg(p, vec2(tx, baseV), vec2(tx + s * 0.02, ty - s * 0.12)),
                min(sdSeg(p, vec2(tx + s * 0.01, ty), vec2(tx - s * 0.26, ty - s * 0.34)),
                    sdSeg(p, vec2(tx + s * 0.01, ty), vec2(tx + s * 0.28, ty - s * 0.32))));
    float trunk = 1.0 - smoothstep(tw * 0.6, tw * 1.5, dtr);

    vec2 q = (p - vec2(tx, ty - s * 0.34)) / vec2(s * 0.80, s * 0.40);
    float de = length(q) - 1.0;
    float wob = (vnoise(p * 60.0 + fi) - 0.5) * 0.22;
    float cap = 1.0 - smoothstep(-0.06, 0.12, de + wob);
    cap *= smoothstep(topV - 0.004, topV + 0.010, p.y);

    vec3 leafc = mix(vec3(0.050, 0.100, 0.058), vec3(0.095, 0.155, 0.078), h.y);
    vec3 barkc = mix(vec3(0.42, 0.36, 0.28), vec3(0.55, 0.47, 0.36), h.x);
    float a = clamp(trunk + cap, 0.0, 1.0) * vb;
    c = mix(c, mix(barkc, leafc, cap), a);
    fol = max(fol, a);
    float hh = clamp((baseV - p.y) / max(baseV - topV, 0.001), 0.0, 1.0);
    canopyH = mix(canopyH, hh, a);
    road *= 1.0 - a;
  }

  // clusters of blue violet flowering shrub, low and loose
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    vec2 h = hash22(vec2(fi * 3.1, 9.7) + uSeed + 2.0);
    float sy = 0.60 + h.y * 0.38;
    float sx = 0.05 + h.x * 0.90;
    float ss = 0.011 + h.x * 0.012 + (sy - 0.60) * 0.016;
    float d = length((p - vec2(sx, sy)) / vec2(ss * 1.5, ss)) - 1.0;
    float blob = 1.0 - smoothstep(-0.15, 0.40, d + (vnoise(p * 90.0 + fi) - 0.5) * 0.5);
    vec3 fc = mix(vec3(0.26, 0.24, 0.52), vec3(0.42, 0.36, 0.68), hash21(vec2(fi, 1.0)));
    float aa = blob * vb * (1.0 - rmk);
    c = mix(c, fc, aa * 0.72);
    flw = max(flw, aa);
    fol *= 1.0 - aa * 0.5;
  }

  // one small figure standing on the road, the only thing that must not move
  float figY = 0.792;
  float figX = roadX(figY);
  vec2 fq = (p - vec2(figX, figY)) / vec2(0.0105, 0.030);
  float fm = 1.0 - smoothstep(0.85, 1.15, length(fq));
  c = mix(c, vec3(0.042, 0.042, 0.052), fm);
  fig = fm;
  road *= 1.0 - fm;
  fol *= 1.0 - fm;
  canopyH *= 1.0 - fm;

  col = toLinear(c);
  mA = vec4(clamp(fol, 0.0, 1.0), clamp(flw, 0.0, 1.0), clamp(ocean, 0.0, 1.0), clamp(sky, 0.0, 1.0));
  mB = vec4(clamp(cliff, 0.0, 1.0), clamp(road, 0.0, 1.0), clamp(fig, 0.0, 1.0), clamp(canopyH, 0.0, 1.0));
}

void main() {
  vec2 t = (vUv - uRect.xy) / max(uRect.zw - uRect.xy, vec2(0.0001));
  float inside = step(0.0, t.x) * step(t.x, 1.0) * step(0.0, t.y) * step(t.y, 1.0);
  vec2 pv = mix(vec2(t.x, 1.0 - t.y), vec2(vUv.x, 1.0 - vUv.y), uPaintSpace);
  pv = clamp(pv, 0.0, 1.0);
  float on = max(inside, uPaintSpace);

  vec3 col;
  vec4 mA;
  vec4 mB;
  scene(pv, col, mA, mB);
  vec3 img = texture(uImage, vec2(pv.x, 1.0 - pv.y)).rgb;
  col = mix(col, img, uHasImage);

  if (uMode == 1) { fragColor = mA * on; return; }
  if (uMode == 2) { fragColor = mB * on; return; }
  fragColor = vec4(mix(toLinear(uPaperCol), col, on), 1.0);
}
`);

// ---------------------------------------------------------------------------
// the gust field.
// one slow scalar plus a wind vector, advected by itself so a gust travels
// across the valley instead of every leaf wobbling in place. the pointer
// injects wind, the field relaxes back to the ambient breeze over a few seconds.
// ---------------------------------------------------------------------------
const GUST = frag(`
uniform sampler2D uPrev;
uniform float uTime;
uniform float uDt;
uniform float uAmbient;
uniform float uRelax;
uniform float uPush;
uniform float uAspect;
uniform vec2 uPointer;
uniform vec2 uPointerVel;
uniform float uPointerActive;

void main() {
  vec3 p = texture(uPrev, vUv).rgb;
  // carried by its own wind
  vec2 back = clamp(vUv - p.rg * uDt * 0.05, vec2(0.0), vec2(1.0));
  vec3 s = texture(uPrev, back).rgb;

  // the ambient breeze, a low frequency field drifting in off the sea
  float amb = fbm(vec2(vUv.x * 1.7 - uTime * 0.035, vUv.y * 2.3 - uTime * 0.012), 3);
  vec2 ambW = vec2(0.55 + 0.45 * sin(uTime * 0.07), 0.12 * sin(uTime * 0.041)) * uAmbient;
  float ambG = max((amb - 0.34) * 1.7, 0.0) * uAmbient;

  // a drag across the canvas pushes air in that direction
  vec2 dp = (vUv - uPointer) * vec2(uAspect, 1.0);
  float brush = exp(-dot(dp, dp) / 0.010) * uPointerActive;
  s.rg += uPointerVel * brush * uPush;
  s.b += length(uPointerVel) * brush * uPush * 1.6;

  float k = 1.0 - exp(-uRelax * max(uDt, 0.0001));
  s.rg = mix(s.rg, ambW, k);
  s.b = mix(s.b, ambG, k);
  fragColor = vec4(clamp(s, vec3(-4.0), vec3(4.0)), 1.0);
}
`);

// ---------------------------------------------------------------------------
// stage 1, wind through the painting.
// every layer displaces its own sample point. displacement is in pixels and is
// multiplied by its own mask, so nothing tears at a layer boundary.
// ---------------------------------------------------------------------------
const MOTION = frag(`
uniform sampler2D uSrc;
uniform sampler2D uMaskA;   // foliage, flowers, ocean, sky
uniform sampler2D uMaskB;   // cliff, road, figure, canopy height
uniform sampler2D uGust;
uniform vec4 uRect;
uniform vec2 uTexel;
uniform vec2 uOceanBand;
uniform float uTime;
uniform float uGustGain;
uniform float uFoliageAmp;
uniform float uFlutterAmp;
uniform float uTrunkLag;
uniform float uFlowerAmp;
uniform float uFlowerTwinkle;
uniform float uWaveAmp;
uniform float uWavePeriod;
uniform float uWaveCount;
uniform float uWaveComp;
uniform float uShimmer;
uniform float uSkyDrift;
uniform float uTwinkle;

void main() {
  vec2 t = (vUv - uRect.xy) / max(uRect.zw - uRect.xy, vec2(0.0001));
  float inside = step(0.0, t.x) * step(t.x, 1.0) * step(0.0, t.y) * step(t.y, 1.0);
  vec2 pv = vec2(t.x, 1.0 - t.y);
  vec4 mA = texture(uMaskA, t);
  vec4 mB = texture(uMaskB, t);

  vec3 g = texture(uGust, vUv).rgb;
  vec2 W = g.rg;
  float G = clamp(g.b, 0.0, 3.0) * uGustGain;
  float tt = uTime;

  // canopy. the crown answers the gust first and the trunk follows a moment
  // later, so the mass bends from its own base rather than sliding whole.
  float canopy = mB.a;
  float amp = pow(canopy, 1.4);
  float swayTrunk = sin((tt - uTrunkLag) * 0.85 + pv.x * 3.1 + W.x * 1.2);
  float swayCrown = sin(tt * 0.85 + pv.x * 3.1 + W.x * 1.2);
  float lean = mix(swayTrunk, swayCrown, canopy);
  vec2 cn = curlN(pv * 6.0 + vec2(tt * 0.055, -tt * 0.03) + W * 0.5, 3);
  vec2 flut = curlN(pv * 30.0 + vec2(tt * 0.85, tt * 0.5), 2);
  vec2 dFol = vec2(lean, lean * 0.18) * uFoliageAmp * amp * (0.30 + G)
            + cn * uFoliageAmp * 0.35 * amp * (0.25 + G)
            + flut * uFlutterAmp * amp * (0.45 + 0.55 * G);
  dFol *= mA.r;

  // flowering shrubs shiver faster and travel less than the canopies above them
  float fl = mA.g;
  vec2 dFlw = (curlN(pv * 17.0 + vec2(tt * 0.22, 0.0) + W * 0.35, 2) * 0.8
            + vec2(sin(tt * 2.2 + pv.x * 22.0), 0.0) * 0.6) * uFlowerAmp * (0.30 + G) * fl;
  float twFlw = (vnoise(pv * 40.0 + vec2(tt * 0.7, 0.0)) - 0.5) * uFlowerTwinkle * fl;

  // ocean. crest lines run down screen toward the beach and pack closer as the
  // water shoals, the set repeating on a calm six to nine second cycle.
  float ocean = mA.b;
  float ot = clamp((pv.y - uOceanBand.x) / max(uOceanBand.y - uOceanBand.x, 0.001), 0.0, 1.0);
  float f = ot + uWaveComp * ot * ot;
  float phase = 6.2831853 * (uWaveCount * f - tt / max(uWavePeriod, 0.5)) + pv.x * 1.1;
  vec2 nrm = normalize(vec2(0.08, 1.0));
  float swell = sin(phase) * (0.35 + 0.65 * ot);
  vec2 dOce = nrm * swell * uWaveAmp * ocean;
  float sw = sin(phase);
  float fwo = fwidth(sw);
  float crest = smoothstep(0.45 - clamp(fwo, 0.0, 0.4), 0.98, sw) * (1.0 - smoothstep(0.30, 0.95, fwo));
  float sparkle = crest * smoothstep(0.35, 0.85, vnoise(vec2(pv.x * 42.0 - tt * 0.9, f * 13.0)));

  // sky. almost nothing, a parallax creep and a faint twinkle on the star grain.
  vec2 dSky = (W * 0.30 + vec2(sin(tt * 0.05), 0.0) * 0.4) * uSkyDrift * mA.a;

  // the road holds and the figure is nailed down
  float lock = (1.0 - 0.85 * mB.g) * (1.0 - mB.b);
  vec2 disp = (dFol + dFlw + dOce + dSky) * lock * inside;

  vec3 col = texture(uSrc, vUv + disp * uTexel).rgb;

  // A star twinkles. The empty sky between stars does not, so the twinkle
  // rides on what is actually bright there instead of salting the whole band.
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float twSky = (vnoise(pv * 90.0 + floor(tt * 3.0) * 0.37) - 0.5)
              * uTwinkle * mA.a * smoothstep(0.10, 0.30, lum);

  col += vec3(1.00, 0.80, 0.46) * sparkle * uShimmer * ocean * inside;
  col += vec3(0.90, 0.95, 1.00) * twSky * inside;
  col += vec3(0.55, 0.50, 0.90) * twFlw * inside;
  fragColor = vec4(max(col, vec3(0.0)), 1.0);
}
`);

// ---------------------------------------------------------------------------
// stage 2 step 1, the tonal wash.
// pigment loses most of its chroma soaking into the sheet, blacks lift because
// paper reflects light back through the ink, and whites never reach white.
// alpha carries the ink density field that every later step works on.
// ---------------------------------------------------------------------------
const WASH = frag(`
uniform sampler2D uLive;
uniform sampler2D uWordTex;
uniform vec2 uTexel;
uniform vec4 uBlockRect;
uniform vec4 uWordRect;
uniform vec3 uPaperCol;
uniform vec3 uInkCol;
uniform vec3 uSalmonCol;
uniform float uInkMix;
uniform float uChroma;
uniform float uBlackLift;
uniform float uWhiteCrush;
uniform float uDuotone;
uniform float uBlockShow;
uniform float uBlockReg;
uniform float uWordShow;

float rectIn(vec2 p, vec4 r, float soft) {
  vec2 a = smoothstep(r.xy - soft, r.xy + soft, p);
  vec2 b = 1.0 - smoothstep(r.zw - soft, r.zw + soft, p);
  return a.x * a.y * b.x * b.y;
}

void main() {
  // ink and paper are named where the eye reads them, so the tonal work is done
  // in that space and only the finished wash goes back to linear light
  vec3 c = texture(uLive, vUv).rgb;
  vec3 cp = pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
  float lp = luma(cp);

  vec3 wash = mix(vec3(lp), cp, uChroma);

  // a print has a short range. the darkest mark is the ink and a wash lifts it
  // further off the floor, and the brightest is the sheet, never white.
  vec3 lo = mix(uInkCol, uPaperCol, uBlackLift * 0.55);
  wash = lo + wash * (uPaperCol - lo);
  wash = mix(wash, uPaperCol, smoothstep(0.58, 1.0, lp) * uWhiteCrush);

  // two ink duotone, the sheet through a salmon mid to a soft black
  vec3 midc = mix(uSalmonCol, uPaperCol, 0.10);
  vec3 duo = lp < 0.5 ? mix(lo, midc, lp * 2.0) : mix(midc, uPaperCol, (lp - 0.5) * 2.0);
  wash = mix(wash, duo, uDuotone);

  vec3 outc = mix(cp, wash, uInkMix);

  // the salmon plate is printed under the black one, so it tints the open sheet
  // and leaves anything already dense with ink alone
  vec2 bq = vUv - vec2(uBlockReg, -uBlockReg * 0.6) * uTexel;
  float blk = rectIn(bq, uBlockRect, 0.004) * uBlockShow;
  outc *= mix(vec3(1.0), uSalmonCol / max(uPaperCol, vec3(0.001)), blk);

  // the wordmark joins the ink field here so it bleeds with everything else
  vec2 wq = (vUv - uWordRect.xy) / max(uWordRect.zw - uWordRect.xy, vec2(0.0001));
  float inw = step(0.0, wq.x) * step(wq.x, 1.0) * step(0.0, wq.y) * step(wq.y, 1.0);
  float wm = texture(uWordTex, clamp(wq, 0.0, 1.0)).a * uWordShow * inw;
  outc = mix(outc, uInkCol * 0.90, wm * 0.94);

  float dens = clamp(1.0 - luma(outc) * 1.06, 0.0, 1.0);
  dens = max(dens, wm);
  fragColor = vec4(pow(max(outc, vec3(0.0)), vec3(2.2)), dens);
}
`);

// ---------------------------------------------------------------------------
// stage 2 step 2, separable spread.
// one axis per draw. MODE_HALO reads brightness above and below a threshold so
// the halation pass gets a light bloom and a dark bloom out of one blur.
// ---------------------------------------------------------------------------
const BLUR = `
uniform sampler2D uTex;
uniform vec2 uDir;
uniform vec2 uTexel;
uniform float uRadius;
uniform float uHaloLo;
uniform float uHaloHi;

vec2 fetch(vec2 uv) {
#if defined(MODE_HALO) && defined(PASS_FIRST)
  vec3 c = texture(uTex, uv).rgb;
  float l = luma(c);
  return vec2(max(l - uHaloHi, 0.0), max(uHaloLo - l, 0.0));
#elif defined(MODE_HALO)
  return texture(uTex, uv).rg;
#elif defined(PASS_FIRST)
  return vec2(texture(uTex, uv).a, 0.0);
#else
  return vec2(texture(uTex, uv).r, 0.0);
#endif
}

void main() {
  vec2 st = uDir * uTexel * uRadius;
  vec2 s = fetch(vUv) * 0.2270270270;
  s += (fetch(vUv + st * 1.3846153846) + fetch(vUv - st * 1.3846153846)) * 0.3162162162;
  s += (fetch(vUv + st * 3.2307692308) + fetch(vUv - st * 3.2307692308)) * 0.0702702703;
  fragColor = vec4(s, 0.0, 1.0);
}
`;

// ---------------------------------------------------------------------------
// stage 2 steps 3 to 8, the sheet itself.
// bleed front, edge pigment rim, granulation, halation, paper, registration,
// grain. the paper texture is a function of screen position only, so it stays
// put: grain that changes every frame reads as video noise, not as paper.
// ---------------------------------------------------------------------------
const PRINT = frag(`
uniform sampler2D uWash;
uniform sampler2D uBleed;
uniform sampler2D uHalo;
uniform sampler2D uMaskA;
uniform sampler2D uMaskB;
uniform vec4 uRect;
uniform vec2 uTexel;
uniform vec2 uBleedTexel;
uniform vec3 uPaperCol;
uniform vec3 uInkCol;
uniform float uTime;
uniform float uReg;
uniform float uBleedAmount;
uniform float uBleedThresh;
uniform float uBleedSoft;
uniform float uRagged;
uniform float uCreep;
uniform float uRim;
uniform float uRimWidth;
uniform float uGranulation;
uniform float uHalation;
uniform float uDarkHalo;
uniform float uHaloHi;
uniform float uHaloLo;
uniform float uPaperFibre;
uniform float uDust;
uniform float uVignette;
uniform float uGrain;
uniform float uExposure;
uniform float uDebug;

void main() {
  vec2 t = (vUv - uRect.xy) / max(uRect.zw - uRect.xy, vec2(0.0001));
  float inside = step(0.0, t.x) * step(t.x, 1.0) * step(0.0, t.y) * step(t.y, 1.0);

  if (uDebug > 0.5) {
    vec4 mA = texture(uMaskA, t);
    vec4 mB = texture(uMaskB, t);
    vec3 d = vec3(0.0);
    d += vec3(0.20, 0.72, 0.30) * mA.r;
    d += vec3(0.60, 0.35, 0.95) * mA.g;
    d += vec3(0.15, 0.55, 0.95) * mA.b;
    d += vec3(0.12, 0.16, 0.50) * mA.a;
    d += vec3(0.95, 0.45, 0.18) * mB.r;
    d += vec3(0.95, 0.88, 0.50) * mB.g;
    d += vec3(1.00, 0.10, 0.32) * mB.b;
    d += vec3(0.16) * mB.a * mA.r;
    d *= inside;
    fragColor = vec4(pow(clamp(d, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);
    return;
  }

  vec3 paper = toLinear(uPaperCol);
  vec3 ink = toLinear(uInkCol);

  // registration: the plates land a hair apart, so the channels do not line up
  vec2 off = vec2(uReg, uReg * 0.35) * uTexel;
  vec3 c;
  c.r = texture(uWash, vUv + off).r;
  c.g = texture(uWash, vUv).g;
  c.b = texture(uWash, vUv - off * 0.6).b;
  float dens = texture(uWash, vUv).a;

  // paper fibre, long and thin and lying mostly across the sheet
  float fibA = fbm(vec2(vUv.x * 420.0, vUv.y * 38.0), 3);
  float fibB = fbm(vec2(vUv.x * 31.0, vUv.y * 380.0), 2);
  float fibre = mix(fibA, fibB, 0.42);

  // the wet front. ink travels along the fibre, so the edge is ragged rather
  // than round, and it creeps outward by a fraction of a pixel as it sits.
  float bleed = texture(uBleed, vUv).r;
  float creep = uCreep * (0.5 + 0.5 * sin(uTime * 0.11));
  float e0 = uBleedThresh - uBleedSoft + (fibre - 0.5) * uRagged - creep;
  float e1 = uBleedThresh + uBleedSoft + (fibre - 0.5) * uRagged - creep;
  float front = smoothstep(e0, e1, bleed);
  // only the ink that actually arrived from next door darkens this spot, so a
  // flat area stays flat and the spreading happens at the edges of a stroke
  float arrive = max(bleed - dens, 0.0);
  float wet = clamp(arrive * (0.30 + 0.70 * front) * 2.2, 0.0, 1.0);
  c = mix(c, ink, wet * uBleedAmount * 0.8);

  // edge pigment. where the wet front stopped, pigment piled up and dried
  // darker than the middle of the stroke. this is the ring round every mark.
  float bx = texture(uBleed, vUv + vec2(uBleedTexel.x, 0.0)).r - texture(uBleed, vUv - vec2(uBleedTexel.x, 0.0)).r;
  float by = texture(uBleed, vUv + vec2(0.0, uBleedTexel.y)).r - texture(uBleed, vUv - vec2(0.0, uBleedTexel.y)).r;
  float grad = length(vec2(bx, by));
  float rim = smoothstep(uRimWidth * 0.20, uRimWidth, grad) * uRim;
  c = mix(c, ink * 0.70, clamp(rim, 0.0, 1.0));

  // granulation. pigment settles into the tooth of the paper in the midtones,
  // never in the untouched white.
  float lum = luma(c);
  float mid = smoothstep(0.02, 0.16, lum) * (1.0 - smoothstep(0.42, 0.82, lum));
  float gran = vnoise(gl_FragCoord.xy * 0.30) * 0.55 + vnoise(gl_FragCoord.xy * 0.85) * 0.45;
  c *= 1.0 - (gran - 0.5) * uGranulation * mid;

  // halation. light spills outward into the dark at one radius, and the dark
  // creeps back into the light at another.
  vec2 h = texture(uHalo, vUv).rg;
  float l0 = luma(c);
  float spill = max(h.x - max(l0 - uHaloHi, 0.0), 0.0);
  float creepIn = max(h.y - max(uHaloLo - l0, 0.0), 0.0);
  c += vec3(1.00, 0.86, 0.74) * spill * uHalation;
  c = mix(c, ink, clamp(creepIn * uDarkHalo, 0.0, 1.0));

  // the sheet. fibre shading, a deckled edge, and dust that was on the paper
  // before it went through the press.
  c *= mix(1.0, 0.86 + fibre * 0.30, uPaperFibre);
  vec2 dv = abs(vUv - 0.5) * 2.0;
  float edge = max(dv.x, dv.y);
  float deckle = 1.0 - smoothstep(0.84, 1.04 + (fibre - 0.5) * 0.10, edge) * uVignette;
  c *= deckle;
  vec2 dcell = floor(gl_FragCoord.xy / 26.0);
  float dsp = (1.0 - smoothstep(0.0, 0.10, length(fract(gl_FragCoord.xy / 26.0) - hash22(dcell)))) * step(0.88, hash21(dcell * 3.13));
  c = mix(c, ink * 0.55, dsp * uDust);

  // final grain, fixed to the sheet
  float gr = hash21(gl_FragCoord.xy + 0.5);
  c *= 1.0 + (gr - 0.5) * uGrain;

  // one tonemap and one gamma encode, at the very end
  c *= uExposure;
  c = c / (1.0 + c * 0.38);
  c = max(c, paper * 0.012);
  fragColor = vec4(pow(max(c, vec3(0.0)), vec3(1.0 / 2.2)), 1.0);
}
`);

return { VERT, SCENE, GUST, MOTION, WASH, BLUR, PRINT, frag };
})();
