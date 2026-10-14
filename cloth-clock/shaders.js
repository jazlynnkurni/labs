// All GLSL lives here. Strictly ES 3.00. Every varying is declared with the
// same name and type on both sides, and no derivative is taken inside
// non uniform control flow.

export const CLOTH_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;
layout(location = 3) in vec2 aFold;

uniform mat4 uViewProj;

out vec3 vWorld;
out vec3 vNormal;
out vec2 vUV;
out vec2 vFold;

void main() {
  vWorld = aPos;
  vNormal = aNormal;
  vUV = aUV;
  vFold = aFold;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}
`;

export const CLOTH_FS = `#version 300 es
precision highp float;

in vec3 vWorld;
in vec3 vNormal;
in vec2 vUV;
in vec2 vFold;

out vec4 outColor;

uniform vec3 uCam;
uniform vec3 uLightDir;
uniform vec3 uBeige;
uniform vec3 uInk;
uniform vec3 uWallCol;
uniform sampler2D uFace;
uniform vec3 uDial;
uniform float uTexAspect;
uniform vec3 uHands;
uniform float uFaceMix;
uniform vec2 uWeave;
uniform float uWeaveBump;
uniform float uCrease;
uniform float uAO;
uniform float uSheen;
uniform int uDebug;

const float TAU = 6.28318531;

vec3 srgb2lin(vec3 c) { return pow(max(c, vec3(0.0)), vec3(2.2)); }

float sdSeg(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-9), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// The hands, drawn in dial space. No early out and no branching, because the
// coverage below needs screen space derivatives.
float handsInk(vec2 uv) {
  vec2 q = vec2(uv.x - uDial.x, (uv.y - uDial.y) * uTexAspect);
  float R = uDial.z;

  vec2 dh = vec2(sin(uHands.x), cos(uHands.x));
  vec2 dm = vec2(sin(uHands.y), cos(uHands.y));
  vec2 ds = vec2(sin(uHands.z), cos(uHands.z));

  float d = sdSeg(q, dh * (-0.06 * R), dh * (0.52 * R), 0.030 * R);
  d = min(d, sdSeg(q, dm * (-0.08 * R), dm * (0.78 * R), 0.019 * R));
  d = min(d, sdSeg(q, ds * (-0.17 * R), ds * (0.90 * R), 0.0080 * R));
  d = min(d, length(q - ds * (-0.13 * R)) - 0.028 * R);
  d = min(d, length(q) - 0.044 * R);

  // The tab mesh carries a single UV, so its derivatives are exactly zero.
  // smoothstep with a zero wide edge is undefined and the NaN would survive
  // the multiply by uFaceMix, so the filter width has a floor.
  float w = max(fwidth(d), 1e-6);
  float ink = 1.0 - smoothstep(-w, w, d);

  // Unprinted pin at the very centre.
  float dp = length(q) - 0.013 * R;
  float wp = max(fwidth(dp), 1e-6);
  float pin = 1.0 - smoothstep(-wp, wp, dp);
  return clamp(ink - pin, 0.0, 1.0);
}

void main() {
  vec3 N = normalize(vNormal);
  bool front = gl_FrontFacing;
  if (!front) N = -N;

  // Tangent frame from the deformed surface, so the weave stretches with it.
  vec3 dpx = dFdx(vWorld);
  vec3 dpy = dFdy(vWorld);
  vec2 dux = dFdx(vUV);
  vec2 duy = dFdy(vUV);
  float det = dux.x * duy.y - duy.x * dux.y;
  vec3 T = vec3(1.0, 0.0, 0.0);
  if (abs(det) > 1e-12) {
    vec3 t = (dpx * duy.y - dpy * dux.y) / det;
    if (dot(t, t) > 1e-16) T = normalize(t);
  }
  T = T - N * dot(N, T);
  float tl = length(T);
  T = tl > 1e-5 ? T / tl : normalize(cross(N, vec3(0.0, 0.0, 1.0)) + vec3(1e-4, 0.0, 0.0));
  vec3 B = cross(N, T);

  // Woven micro structure. Fades out once a thread goes below a pixel.
  float sx = vUV.x * uWeave.x * TAU;
  float sy = vUV.y * uWeave.y * TAU;
  float fx = 1.0 - smoothstep(0.30, 1.0, fwidth(vUV.x) * uWeave.x);
  float fy = 1.0 - smoothstep(0.30, 1.0, fwidth(vUV.y) * uWeave.y);
  vec3 Nw = normalize(N + (T * cos(sx) * fx + B * cos(sy) * fy) * uWeaveBump);
  float weaveTone = (sin(sx) * sin(sy)) * 0.5 + 0.5;

  // Printed face. The static ink comes from the texture, the hands are live.
  float printed = texture(uFace, vUV).a;
  float faceInk = max(printed, handsInk(vUV)) * uFaceMix;
  if (!front) faceInk *= 0.20;

  // The dial is cut here, not in the mesh. A grid of square cells cannot have
  // a round edge, so the cloth is simulated wider than it shows.
  float rDial = length(vUV - vec2(0.5));
  float edgeAA = fwidth(rDial) * 1.2;
  float inDial = 1.0 - smoothstep(0.487 - edgeAA, 0.487 + edgeAA, rDial);
  if (inDial <= 0.003) discard;

  vec3 beige = srgb2lin(uBeige);
  vec3 ink = srgb2lin(uInk);
  vec3 alb = mix(beige, ink, clamp(faceInk, 0.0, 1.0) * 0.93);
  alb *= mix(1.0, 0.90 + 0.20 * weaveTone, fx * fy);

  // Fold data. x is crease strength, y is signed, positive is a valley
  // facing the viewer.
  float creaseMag = vFold.x;
  float curv = front ? vFold.y : -vFold.y;
  float valley = clamp(curv * uAO, 0.0, 1.0);
  float ridge = clamp(-curv * uAO, 0.0, 1.0);
  float ao = 1.0 - valley * 0.55;
  float crease = 1.0 - clamp(creaseMag * uCrease, 0.0, 0.62);

  vec3 V = normalize(uCam - vWorld);
  vec3 L = normalize(uLightDir);
  float NdL = dot(Nw, L);

  // Wrapped diffuse, because cloth carries light around the terminator.
  float wrapd = clamp((NdL + 0.16) / 1.16, 0.0, 1.0);
  vec3 key = vec3(1.0, 0.96, 0.90) * 1.55;
  vec3 dif = alb * wrapd * key;

  vec3 wall = srgb2lin(uWallCol);
  float upf = Nw.y * 0.5 + 0.5;
  vec3 amb = alb * mix(wall * 1.15, vec3(0.30, 0.31, 0.34), upf) * 0.58;

  float NdV = clamp(dot(Nw, V), -1.0, 1.0);
  float grazing = pow(1.0 - abs(NdV), 3.2);
  float sheen = grazing * clamp(NdL * 0.6 + 0.4, 0.0, 1.0) * uSheen;
  float retro = pow(clamp(dot(V, L), 0.0, 1.0), 2.5) * clamp(NdL, 0.0, 1.0) * 0.20;

  vec3 col = (dif + amb) * ao * crease;
  col += (sheen + retro) * (0.55 + 0.45 * (1.0 - faceInk))
       * vec3(1.0, 0.95, 0.88) * (0.62 + 0.75 * ridge);

  if (uDebug == 1) col = Nw * 0.5 + 0.5;
  outColor = vec4(col, inDial);
}
`;

// Projects the cloth onto the back wall along the light direction. The result
// is blurred and multiplied into the wall, which is cheaper and steadier than
// a depth map for a single flat receiver.
export const SHADOW_VS = `#version 300 es
layout(location = 0) in vec3 aPos;

uniform mat4 uViewProj;
uniform vec3 uLightTravel;
uniform float uWallZ;

void main() {
  vec3 p = aPos;
  float dz = uLightTravel.z;
  float t = (uWallZ - p.z) / (abs(dz) < 1e-5 ? -1.0 : dz);
  vec3 s = p + uLightTravel * max(t, 0.0);
  gl_Position = uViewProj * vec4(s, 1.0);
}
`;

export const SHADOW_FS = `#version 300 es
precision mediump float;
out vec4 outColor;
void main() { outColor = vec4(1.0); }
`;

export const WALL_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uViewProj;
out vec3 vWorld;
void main() {
  vWorld = aPos;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}
`;

export const WALL_FS = `#version 300 es
precision highp float;

in vec3 vWorld;
out vec4 outColor;

uniform sampler2D uShadow;
uniform vec2 uRes;
uniform vec3 uWallCol;
uniform vec3 uLightDir;

vec3 srgb2lin(vec3 c) { return pow(max(c, vec3(0.0)), vec3(2.2)); }

void main() {
  float sh = clamp(texture(uShadow, gl_FragCoord.xy / uRes).r, 0.0, 1.0);
  vec3 base = srgb2lin(uWallCol);

  vec2 lp = uLightDir.xy * 1.15;
  float d = length((vWorld.xy - lp) * vec2(0.62, 0.52));
  base *= clamp(1.30 - 0.74 * d, 0.16, 1.35);

  vec3 shadowed = base * 0.30 * vec3(1.0, 0.86, 0.82);
  outColor = vec4(mix(base, shadowed, sh), 1.0);
}
`;

// Shared fullscreen triangle. No attributes, no buffers.
export const FS_VS = `#version 300 es
out vec2 vUV;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUV = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 outColor;
uniform sampler2D uTex;
uniform vec2 uDir;
void main() {
  float s = texture(uTex, vUV).r * 0.2270;
  s += texture(uTex, vUV + uDir * 1.0).r * 0.1946;
  s += texture(uTex, vUV - uDir * 1.0).r * 0.1946;
  s += texture(uTex, vUV + uDir * 2.0).r * 0.1216;
  s += texture(uTex, vUV - uDir * 2.0).r * 0.1216;
  s += texture(uTex, vUV + uDir * 3.0).r * 0.0540;
  s += texture(uTex, vUV - uDir * 3.0).r * 0.0540;
  s += texture(uTex, vUV + uDir * 4.0).r * 0.0162;
  s += texture(uTex, vUV - uDir * 4.0).r * 0.0162;
  outColor = vec4(s, s, s, 1.0);
}
`;

export const POST_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 outColor;

uniform sampler2D uScene;
uniform float uTime;
uniform float uExposure;

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

void main() {
  vec3 c = texture(uScene, vUV).rgb * uExposure;

  vec2 q = vUV - 0.5;
  c *= clamp(1.0 - 0.66 * dot(q, q), 0.0, 1.0);

  // Exponential tonemap. A filmic curve would pull the red toward grey.
  c = 1.0 - exp(-max(c, vec3(0.0)));
  c = pow(c, vec3(1.0 / 2.2));

  float g = hash(gl_FragCoord.xy + vec2(uTime * 61.0, uTime * 37.0));
  c += (g - 0.5) * 0.016;

  outColor = vec4(c, 1.0);
}
`;

export const LINE_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uViewProj;
void main() { gl_Position = uViewProj * vec4(aPos, 1.0); }
`;

export const LINE_FS = `#version 300 es
precision mediump float;
out vec4 outColor;
uniform vec3 uColor;
void main() { outColor = vec4(uColor, 1.0); }
`;

export const PROGRAMS = [
  ['cloth', CLOTH_VS, CLOTH_FS],
  ['shadow', SHADOW_VS, SHADOW_FS],
  ['wall', WALL_VS, WALL_FS],
  ['blur', FS_VS, BLUR_FS],
  ['post', FS_VS, POST_FS],
  ['line', LINE_VS, LINE_FS],
];
