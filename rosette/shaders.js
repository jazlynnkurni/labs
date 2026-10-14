// Shader sources for the rosette study.
//
// Two stages, kept strictly apart:
//   1. a scalar DENSITY field, built from physics (diffraction spikes, a precessing
//      orbit family, veiling glare)
//   2. a PAPER AND PIGMENT model that turns density into luminance, once, at the end
//
// Stage 1 knows nothing about paper. Stage 2 knows nothing about what drew the marks.

export const VERT = `#version 300 es
// One oversized triangle. No attributes, no buffers.
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uRes;          // drawing buffer size in device pixels
uniform float uT;            // art time in seconds, pausable and scalable
uniform float uRot;          // accumulated rosette rotation in radians
uniform float uExposure;
uniform vec2  uPan;          // drag offset, in plate units. Nothing else moves the drawing.

// rosette
uniform float uPetals;
uniform float uLoopLen;
uniform float uLoopWidth;
uniform float uStroke;
uniform float uBreathe;
uniform float uSpread;
uniform float uShadow;

// star
uniform float uRayLen;
uniform float uHaze;
uniform float uHazeH;

// paper
uniform float uGrain;
uniform float uTooth;

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

// Portrait plate. The drawing lives in x in [-A/2, A/2], y in [-0.5, 0.5].
const float FRAME_A = 0.68;

const vec2 STAR = vec2(0.0,  0.252);   // the point source, about a quarter down
const vec2 ROSE = vec2(0.0, -0.198);   // the rosette centre, low in the frame

const int MAXPET = 24;   // compile time bound on the petal loop
const int CS     = 14;   // samples along the canonical half petal

// ---------------------------------------------------------------- noise

float hash11(float n) { return fract(sin(n * 91.3458) * 47453.5453); }

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 19.7; a *= 0.5; }
  return s * 1.0667;
}

// ---------------------------------------------------------------- geometry helpers

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-9), 0.0, 1.0);
  return length(pa - ba * h);
}

// Intensity along a diffraction spike. A straight aperture edge of length L throws a
// line of light perpendicular to itself whose profile is sinc squared, so the spike
// carries fine fringes on a one over u squared envelope. That is the striation.
float sinc2(float x) {
  if (abs(x) < 1e-4) return 1.0;
  float s = sin(x) / x;
  return s * s;
}

// ---------------------------------------------------------------- the star

// Eight rays from an eight sided iris. An n bladed aperture gives n spikes when n is
// even, because the spikes from opposite blades land on top of each other, and each
// spike runs perpendicular to the edge that threw it. Here the iris is a square with
// cut corners: four long edges give the four long cardinal rays, four short chamfers
// give the four shorter diagonals.
float starRays(vec2 v) {
  float d = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float a  = fi * (PI * 0.25);
    vec2 dir = vec2(cos(a), sin(a));
    float u  = dot(v, dir);
    if (u <= 0.0) continue;
    float s  = dot(v, vec2(-dir.y, dir.x));

    bool  isLong = (i - (i / 2) * 2) == 0;
    float len   = isLong ? uRayLen        : uRayLen * 0.42;
    float amp   = isLong ? 1.0            : 0.46;
    float w0    = isLong ? 0.0020         : 0.0031;
    float flare = isLong ? 0.019          : 0.040;
    float fringe= isLong ? 235.0          : 330.0;

    // the ray flares slowly, and thins in amplitude as it spreads
    float w = w0 + flare * u;
    float across = exp(-(s * s) / (w * w)) * pow(w0 / w, 0.30);

    // sinc squared: a one over u squared envelope carrying faint fringes
    float k   = u / max(len * 0.30, 1e-4);
    float env = 1.0 / (1.0 + k * k);
    float str = 0.70 + 0.30 * sinc2(u * fringe);
    float cut = 1.0 - smoothstep(len * 0.62, len * 1.06, u);

    // a barely there shimmer, period over two minutes so no cycle reads
    float shim = 1.0 + 0.07 * sin(uT / (96.0 + 37.0 * hash11(fi + 3.1)) * TAU + fi * 2.4);

    d += amp * across * env * str * cut * shim;
  }
  return d;
}

// Veiling glare. A broad horizontal band lit from behind, brightest just under the
// point, falling off faster upward than downward.
float starHaze(vec2 q) {
  float drift = 0.055 * sin(uT / 214.0 * TAU) + 0.03 * sin(uT / 137.0 * TAU + 1.1);
  float dy  = q.y - (STAR.y - uHazeH * 0.42);
  float sig = dy > 0.0 ? uHazeH * 0.90 : uHazeH * 2.10;
  float band = exp(-(dy * dy) / (sig * sig));
  band *= band * 0.55 + 0.45;      // softer shoulders, no plateau in the middle

  // mist structure, drifting laterally, so the band is never a flat slab
  float mist = 0.58 + 0.72 * fbm(vec2(q.x * 1.7 + drift * 3.0, q.y * 2.6 + 5.0));
  band *= mist;
  band *= 1.0 - 0.30 * smoothstep(0.14, 0.44, abs(q.x));
  return band * uHaze;
}

// ---------------------------------------------------------------- the rosette

// A rosette orbit. One petal is one radial period of a precessing, very eccentric
// orbit: out from the centre, over at apoapsis, back in. The apse line advances a
// little each pass, so the loops fan out and overlap their neighbours. This is what a
// rotary harmonograph draws and what a perturbed two body orbit traces.
//
// The half petal is canonical, so the trigonometry is hoisted out of the petal loop
// and each petal is only a scale of the same polyline.
float rosette(vec2 q, out float hot) {
  vec2 v = q - ROSE;
  hot = 0.0;

  // nothing to do outside the rosette's reach, and that is most of the sheet
  float rGuard = uLoopLen * 1.62 + 9.0 * uStroke;
  float r0 = length(v);
  if (r0 > rGuard) return 0.0;

  vec2 C[CS];
  for (int i = 0; i < CS; i++) {
    float s = PI * float(i) / float(CS - 1);
    float y = 0.5 - 0.5 * cos(s);                 // 0 at the centre, 1 at apoapsis
    float x = sin(s) * pow(max(y, 0.0), 0.42);    // pinched at the centre, full at the turn
    C[i] = vec2(x * 0.9107, y);                   // 0.9107 puts max x at 0.5
  }

  int N = int(uPetals + 0.5);
  float dens = 0.0;

  for (int k = 0; k < MAXPET; k++) {
    if (k >= N) break;
    float fk = float(k);
    float j1 = hash11(fk * 7.13 + 1.7);
    float j2 = hash11(fk * 3.77 + 11.3);
    float j3 = hash11(fk * 5.21 + 23.9);

    // the apse line: even fan plus a slow reorganisation, so petals bunch and part
    float base = TAU * fk / float(N);
    float ang  = uRot + base
               + uSpread * sin(base * 2.0 + uT / 190.0 * TAU)
               + uSpread * 0.6 * sin(base * 3.0 - uT / 260.0 * TAU);

    // breathing, out of phase petal to petal, one and a half to three minutes each
    float per = 88.0 + 92.0 * j1;
    float br  = sin(uT / per * TAU + j2 * TAU);

    // births and deaths at the outer edge, three to four minutes
    float lper = 195.0 + 105.0 * j3;
    float life = 0.62 + 0.38 * sin(uT / lper * TAU + j1 * TAU);

    float L  = uLoopLen   * (0.88 + 0.20 * j2) * (1.0 + uBreathe * br) * (0.90 + 0.14 * life);
    float W  = uLoopWidth * (0.86 + 0.28 * j1);
    float sg = uStroke    * (0.82 + 0.42 * j3) * (1.0 + 0.30 * (1.0 - life));
    float amp = (0.40 + 0.16 * j2) * (0.70 + 0.30 * life);

    float ca = cos(ang), sa = sin(ang);
    vec2 lp = vec2(v.x * sa - v.y * ca, v.x * ca + v.y * sa);
    lp.x = abs(lp.x);                            // the petal is symmetric about its axis

    float pad = 5.0 * sg;
    if (lp.y < -pad || lp.y > L + pad || lp.x > W * 0.55 + pad) continue;

    float best = 1e9;
    float bestU = 0.0;              // where along the loop the nearest point sits
    vec2 prev = vec2(C[0].x * W, C[0].y * L);
    for (int i = 1; i < CS; i++) {
      vec2 cur = vec2(C[i].x * W, C[i].y * L);
      vec2 pa = lp - prev, ba = cur - prev;
      float hh = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-9), 0.0, 1.0);
      float d = length(pa - ba * hh);
      if (d < best) { best = d; bestU = mix(C[i - 1].y, C[i].y, hh); }
      prev = cur;
    }

    // A long exposure records one over the speed. An eccentric orbit is quickest at
    // periapsis and slowest at the turn, so the trace is thin and faint near the
    // centre and pools at the far end. This is what keeps the middle from filling in.
    float dwell = 0.16 + 0.84 * pow(clamp(bestU, 0.0, 1.0), 0.60);
    // the trace is never even end to end
    dwell *= 0.76 + 0.48 * vnoise(vec2(bestU * 6.3, fk * 4.7 + 2.0));

    // two widths: the mark itself, and the halo of loose dust around it, so no
    // edge in the whole drawing is ever a hard one
    float w2 = sg * 2.9;
    dens += amp * dwell * (exp(-(best * best) / (sg * sg)) + 0.34 * exp(-(best * best) / (w2 * w2)));
  }

  float r = r0;

  // the drawing lets go at the rim
  dens *= 1.0 - smoothstep(uLoopLen * 1.16, uLoopLen * 1.56, r);

  // lower left and lower right fall into shadow
  vec2 n = r > 1e-5 ? v / r : vec2(0.0, 1.0);
  float shade = 1.0 - uShadow * smoothstep(0.00, 0.80, -n.y) * smoothstep(0.06, 0.58, abs(n.x));
  dens *= shade;

  // the second point of light, with a small warm halo
  float pulse = 1.0 + 0.05 * sin(uT / 71.0 * TAU);
  hot = exp(-(r * r) / (0.0014 * 0.0014)) * pulse
      + 0.42 * exp(-(r * r) / (0.0065 * 0.0065)) * pulse;

  return dens;
}

// ---------------------------------------------------------------- main

void main() {
  // contain the portrait plate inside the viewport, letterbox rather than stretch
  float scale = min(uRes.x / FRAME_A, uRes.y);
  vec2 q = (gl_FragCoord.xy - uRes * 0.5) / scale - uPan;
  q.y = q.y;                      // gl_FragCoord already has y up

  bool outside = abs(q.x) > FRAME_A * 0.5 || abs(q.y) > 0.5;

  // ------------------------------------------------ stage 1: density
  vec2 sv = q - STAR;
  float rs = length(sv);

  float dRays = starRays(sv);
  float dHaze = starHaze(q);

  float hotRose = 0.0;
  float dRose = rosette(q, hotRose);

  float starPulse = 1.0 + 0.045 * sin(uT / 53.0 * TAU) + 0.02 * sin(uT / 89.0 * TAU + 2.0);
  float hotStar = exp(-(rs * rs) / (0.0013 * 0.0013)) * starPulse
                + 0.40 * exp(-(rs * rs) / (0.0060 * 0.0060)) * starPulse;

  // charcoal in the paper
  float densPig = dRose * 1.00 + dRays * 0.50 + 0.0055;
  // glare falling on the paper, which the tooth only half catches
  float densLit = dHaze * 0.30;
  float density = densPig + densLit;

  // ------------------------------------------------ stage 2: paper and pigment
  // Paper coordinates. Locked to the plate, never to time and never to the viewport,
  // so the tooth belongs to the sheet.
  vec2 pp = q * uTooth;

  float tooth = 0.56 * vnoise(pp)
              + 0.32 * vnoise(pp * 2.11 + 17.0)
              + 0.12 * vnoise(pp * 4.31 + 53.0);
  // a faint fibre direction in the sheet
  tooth = mix(tooth, 0.80 * tooth + 0.20 * vnoise(pp * vec2(0.37, 3.10) + 91.0), 0.30);
  tooth = clamp((tooth - 0.5) * 1.55 + 0.5, 0.0, 1.0);

  float mottle = fbm(q * 3.1 + 71.0);

  float g = clamp(uGrain, 0.0, 1.0);

  // The tooth stands proud of the valleys, so a peak collects several times the
  // pigment a valley does. Making that a multiplier on the load rather than a
  // threshold on the result is what keeps the grain inside the gradient: it fades
  // out in the deep blacks, peaks through the midtones, and compresses away again
  // once a passage is fully loaded.
  float bite = g * (0.56 + 0.44 * smoothstep(0.010, 0.90, densPig));
  float reachPig = mix(1.0, 0.30 + 1.40 * tooth, bite);
  float reachLit = mix(1.0, 0.74 + 0.52 * tooth, g);

  // two loads on the same sheet, combined the way two passes of a medium combine
  float covPig = 1.0 - exp(-densPig * 1.30 * reachPig);
  float covLit = 1.0 - exp(-densLit * 1.30 * reachLit);
  float cov = 1.0 - (1.0 - covPig) * (1.0 - covLit);

  // the coarsest grade of the tooth, the grains you can count
  float speck = vnoise(pp * 0.73 + 311.0) - 0.5;
  cov = clamp(cov + speck * 0.46 * bite * covPig * (1.0 - covPig), 0.0, 1.0);

  // tone. Desaturated green grey through the body of the drawing, cooling toward
  // white only where the pigment is really piled up.
  vec3 pigLow  = vec3(0.096, 0.124, 0.098);
  vec3 pigMid  = vec3(0.296, 0.360, 0.302);
  vec3 pigHigh = vec3(0.775, 0.822, 0.840);
  float cm = smoothstep(0.0, 0.52, cov);
  float ch = smoothstep(0.44, 0.97, cov);
  vec3 pig = mix(mix(pigLow, pigMid, cm), pigHigh, ch);

  vec3 paper = vec3(0.0074, 0.0086, 0.0078) * (0.30 + 1.35 * mottle);

  vec3 col = paper + cov * pig;

  // the two hot points: light, not pigment, so it sits above the grain
  float rr0 = length(q - ROSE);
  float hot = hotStar + hotRose;
  vec3 warm = vec3(1.00, 0.845, 0.520);
  col += hot * mix(vec3(0.92, 0.96, 1.00), warm, clamp(hot * 0.80, 0.0, 1.0)) * 1.30;
  // the warm sit right at the two cores
  float wh = exp(-(rs * rs) / (0.0090 * 0.0090)) + exp(-(rr0 * rr0) / (0.0092 * 0.0092));
  col += wh * vec3(0.34, 0.22, 0.075);

  // a very slight bloom, around the hot points only
  float rr = rr0;
  float bloom = 0.17 * exp(-(rs * rs) / (0.032 * 0.032))
              + 0.13 * exp(-(rr * rr) / (0.028 * 0.028));
  col += bloom * vec3(0.60, 0.65, 0.62);

  // the two lower corners of the sheet go down into shadow
  float lowL = smoothstep(0.62, 0.05, length((q - vec2(-0.30, -0.44)) * vec2(1.0, 1.25)));
  float lowR = smoothstep(0.62, 0.05, length((q - vec2( 0.30, -0.44)) * vec2(1.0, 1.25)));
  col *= 1.0 - 0.55 * uShadow * max(lowL, lowR);

  // vignette, heavy into the corners
  vec2 vg = q * vec2(1.0 / (FRAME_A * 0.5), 1.0 / 0.5);
  float vr = length(vg * vec2(0.88, 0.94));
  col *= 1.0 - 0.97 * smoothstep(0.52, 1.26, vr);

  col *= uExposure;

  // tonemap and gamma, once
  col = col / (1.0 + col);
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));

  // a whisper of grain in the black, so the paper never goes dead flat
  col += (tooth - 0.5) * 0.009 * g;

  if (outside) col = vec3(0.0);

  fragColor = vec4(max(col, 0.0), 1.0);
}
`;
