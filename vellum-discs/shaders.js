// shader sources for the vellum discs piece.
// two passes: scene (layered sheets, linear light) and post (defocus, vignette, grain, tonemap).

export const MAX_DISCS = 24;

export const VERT = `#version 300 es
// full screen triangle, no attributes
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

// ---------------------------------------------------------------- scene pass

export const FRAG_SCENE = `#version 300 es
precision highp float;

#define MAXD ${MAX_DISCS}

out vec4 outColor;

uniform vec4  uFrame;        // cx, cy, halfW, halfH in device pixels
uniform int   uCount;
uniform vec4  uD0[MAXD];     // centre.xy, radius, rotation
uniform vec4  uD1[MAXD];     // tint.rgb (linear), per sheet opacity scale
uniform vec4  uD2[MAXD];     // seed, emphasis, alive, spare

uniform float uOpacity;      // optical depth of one sheet
uniform float uTintSpread;
uniform float uFibre;
uniform float uEdge;
uniform float uSheen;
uniform vec2  uLight;        // pointer position in composition space
uniform float uEncode;       // 1.0 when the target is 8 bit and needs a sqrt encode

const mat2 M2 = mat2(0.8, 0.6, -0.6, 0.8);

float h11(float n) {
  n = fract(n * 0.1031);
  n *= n + 33.33;
  return fract(n * (n + n));
}

float h21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = h21(i);
  float b = h21(i + vec2(1.0, 0.0));
  float c = h21(i + vec2(0.0, 1.0));
  float d = h21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm2(vec2 p) {
  float s = vnoise(p) * 0.62;
  s += vnoise(M2 * p * 2.07 + 5.3) * 0.31;
  return s / 0.93;
}

float fbm3(vec2 p) {
  float s = vnoise(p) * 0.52;
  p = M2 * p * 2.03 + 7.1;
  s += vnoise(p) * 0.28;
  p = M2 * p * 2.11 + 3.7;
  s += vnoise(p) * 0.14;
  return s / 0.94;
}

// one thin scratch in sheet local space. lv is the light direction, also local.
float scratchLine(vec2 q, float r, float sd0, vec2 lv) {
  float a = h11(sd0) * 3.14159265;
  vec2 dir = vec2(cos(a), sin(a));
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 o = (vec2(h11(sd0 + 1.7), h11(sd0 + 3.3)) - 0.5) * r * 1.45;
  vec2 w = q - o;
  float t = dot(w, dir);
  float u = dot(w, nrm);
  float hw = 0.0010 + 0.0017 * h11(sd0 + 5.1);
  float len = r * (0.32 + 0.62 * h11(sd0 + 7.9));
  float core = exp(-(u * u) / (hw * hw));
  float along = smoothstep(len, len * 0.22, abs(t));
  float lit = 0.28 + 0.72 * abs(dot(nrm, lv));
  return core * along * lit;
}

void main() {
  vec2 rel = gl_FragCoord.xy - uFrame.xy;
  if (abs(rel.x) > uFrame.z || abs(rel.y) > uFrame.w) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // composition space: x spans -0.5 to 0.5 across the frame, y follows the aspect
  float inv = 0.5 / uFrame.z;
  vec2 p = rel * inv;

  // derivatives taken once, in uniform control flow, so the disc loop stays safe
  vec2 pw = fwidth(p);
  float px = 0.5 * (pw.x + pw.y);

  // pointer light, a soft near field direction
  vec2 toL = uLight - p;
  float ldist = length(toL);
  vec2 lv = toL / max(ldist, 1e-4);
  float lamp = 0.80 + 0.52 / (1.0 + 3.4 * ldist * ldist);

  // ground: warm charcoal, lifted at the centre, black in the corners, faintly mottled
  float rad = length(p * vec2(1.0, 0.80));
  float gfall = 1.0 - smoothstep(0.10, 0.86, rad);
  float gm = fbm2(p * 2.15 + 13.7);
  vec3 ground = vec3(0.0172, 0.0157, 0.0142) * (0.18 + 1.05 * gfall) * (0.55 + 0.95 * gm);

  vec3 L = vec3(0.0);
  vec3 T = vec3(1.0);

  // front to back: each sheet adds its own scatter attenuated by everything already in front
  for (int i = MAXD - 1; i >= 0; i--) {
    if (i >= uCount) { continue; }

    vec4 d0 = uD0[i];
    vec2 v = p - d0.xy;
    float r = d0.z;
    float dist = length(v);
    if (dist > r + 0.006) { continue; }          // bounding circle skip

    float sd = dist - r;
    float aa = max(px * (abs(v.x) + abs(v.y)) / max(dist, 1e-5), px * 0.75);
    float cov = 1.0 - smoothstep(-aa, aa, sd);
    cov *= uD2[i].z;                              // fade in and out
    if (cov <= 0.0012) { continue; }

    // sheet local space, rotated and offset by its own seed
    float rot = d0.w;
    float cs = cos(rot), sn = sin(rot);
    mat2 inr = mat2(cs, sn, -sn, cs);             // inverse rotation
    float seed = uD2[i].x;
    vec2 q = inr * v + vec2(seed * 7.31, seed * 4.17);
    vec2 lloc = inr * lv;

    // fine fibre, stretched along the sheet local x, plus a light slope for the sheen
    vec2 fq = q * vec2(1.0, 0.42) * 520.0;
    float n1 = vnoise(fq);
    float n2 = vnoise(M2 * fq * 2.09 + 11.0);
    float fib = (n1 * 0.66 + n2 * 0.34) - 0.5;
    float n1s = vnoise(fq + lloc * vec2(1.0, 0.42) * 1.55);
    float slope = n1s - n1;

    // slow clouding, and a ridged field for the creases
    float cl = fbm2(q * 5.6 + 3.1);
    float crf = fbm2(q * 4.4 + 21.3);
    float ridge = 1.0 - abs(2.0 * crf - 1.0);
    float crease = pow(clamp(ridge, 0.0, 1.0), 46.0);
    // creases only where the sheet has actually been folded, not everywhere
    crease *= smoothstep(0.46, 0.78, fbm2(q * 1.35 + 61.0));

    // tint, pulled toward its own grey by the spread control
    vec3 traw = uD1[i].rgb;
    float g = dot(traw, vec3(0.2126, 0.7152, 0.0722));
    vec3 tint = mix(vec3(g), traw, uTintSpread);

    // optical depth of this sheet at this pixel
    float tau = uOpacity * uD1[i].w * (0.70 + 0.56 * cl) * (1.0 + uFibre * fib * 0.38);
    tau = max(tau, 0.0);

    // transmission is tinted, since a warm sheet passes warm light through.
    // the scattered part is driven by the grey extinction, so the sheet's own
    // colour comes from its albedo and does not get cancelled by the tinted Tr.
    vec3 ext = vec3(1.0) - 2.0 * (tint - vec3(g));
    vec3 Tr = exp(-tau * ext);
    float Tg = exp(-tau);

    // scatter: what this sheet sends back to the eye
    float shade = lamp * (1.0 + uSheen * (slope * 2.2 + (cl - 0.5) * 0.26));
    vec3 sct = tint * (1.0 - Tg) * 0.85 * shade;

    // creases and scratches catch the light as small bright streaks
    sct += tint * crease * (0.030 + 0.062 * uFibre) * lamp;
    float scr = scratchLine(q, r, seed * 91.7, lloc)
              + scratchLine(q, r, seed * 91.7 + 19.3, lloc);
    sct += tint * scr * (0.028 + 0.058 * uFibre) * lamp;

    // the cut edge, a thin brighter band just inside the boundary
    float lw = max(aa * 1.10, 0.0011);
    float eb = smoothstep(-lw, -lw * 0.10, sd);
    sct += tint * eb * uEdge * (1.0 + 0.65 * uD2[i].y) * lamp;

    L += T * sct * cov;
    T *= vec3(1.0) - cov * (vec3(1.0) - Tr);
  }

  L += T * ground;
  L = max(L, vec3(0.0));

  outColor = vec4(uEncode > 0.5 ? sqrt(L) : L, 1.0);
}
`;

// ----------------------------------------------------------------- post pass

export const FRAG_POST = `#version 300 es
precision highp float;

out vec4 outColor;

uniform sampler2D uTex;
uniform vec2  uRes;
uniform vec4  uFrame;
uniform float uVignette;
uniform float uGrain;
uniform float uDefocus;
uniform float uChroma;
uniform float uEncode;

float h21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

vec3 fetch(vec2 px) {
  vec3 c = texture(uTex, px / uRes).rgb;
  return uEncode > 0.5 ? c * c : c;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 rel = fc - uFrame.xy;
  if (abs(rel.x) > uFrame.z || abs(rel.y) > uFrame.w) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float half_d = length(uFrame.zw);
  float r = length(rel) / half_d;
  vec2 rdir = rel / max(length(rel), 1e-4);

  // defocus grows toward the corners, a small golden angle spiral
  float bl = uDefocus * uFrame.z * 0.030 * smoothstep(0.26, 1.02, r);
  vec3 acc = fetch(fc);
  float wsum = 1.0;
  if (bl > 0.35) {
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      float a = fi * 2.39996323 + r * 3.0;
      float rr = sqrt((fi + 0.5) / 8.0) * bl;
      acc += fetch(fc + vec2(cos(a), sin(a)) * rr);
      wsum += 1.0;
    }
  }
  vec3 col = acc / wsum;

  // tiny chromatic drift, radial, only near the frame edge
  float ca = uChroma * uFrame.z * 0.006 * r * r;
  if (ca > 0.08) {
    col.r = mix(col.r, fetch(fc + rdir * ca).r, 0.85);
    col.b = mix(col.b, fetch(fc - rdir * ca).b, 0.85);
  }

  // vignette, still in linear light
  col *= 1.0 - uVignette * smoothstep(0.22, 1.16, r) * 0.86;

  // print response. a single sheet stays dim, four stacked run up to near white.
  // the sheets accumulate on their own in the scene pass, this only grades them.
  const float EXPO = 62.0;
  const float CURVE = 2.6;
  col = pow(max(col, vec3(0.0)), vec3(CURVE)) * EXPO;

  // tonemap with a high white point, so six sheets deep still has somewhere to go
  const float W = 3.4;
  col = (col * (1.0 + col / (W * W))) / (1.0 + col);

  // the curve pulls everything toward neutral, so give the tints their chroma back
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(lum), col, 1.06);

  col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));

  // static scan grain, fixed to the pixel so it does not crawl
  float n = h21(floor(fc)) - 0.5;
  col += n * uGrain * 0.085;
  col *= 1.0 + n * uGrain * 0.10;

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
