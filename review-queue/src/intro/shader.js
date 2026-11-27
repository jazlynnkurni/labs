// Three marshmallow capsules, ray marched in one WebGL2 context.
// Read from the Twelve Labs brand clip, frame by frame at 10fps: the capsules hold
// still in a row (seen head on here, the clip shows them on a diagonal) and a pastel band (pink, peach, orange, gold, lime, mint,
// lilac) flows through them left to right, one capsule length every 1.2s, so the
// colour snakes from tile to tile. The rim takes a later colour of the same band, and
// each front face is a soft window that the pink band veils as it passes.

export const BOX = [1.0, 0.5, 0.5]; // half extents: length, height, depth
export const RADIUS = 0.24;
export const STEP = 2.2; // centre to centre: equal small gaps head on
export const PERIOD = 4.8; // one full colour cycle at a point, seconds
export const SLIDE = 1.2; // how far each capsule trails in along the chain
export const WIN = [0.87, 0.37]; // front window half size, world units
export const WIN_R = 0.12;

export const FACE_W = 640;
export const FACE_H = Math.round((FACE_W * WIN[1]) / WIN[0]);
export const FACE_PAD = 8;
export const ATLAS_W = FACE_W * 3 + FACE_PAD * 2;

// Sampled from the clip, lifted a touch toward the softer still.
export const PALETTE = [
  "#F4A9BD", // pink
  "#F5BC9C", // peach
  "#EDB073", // orange
  "#EBC35E", // gold
  "#AEE97A", // lime
  "#D8EACB", // mint
  "#E6C6E6", // lilac
];

const fract = (x) => x - Math.floor(x);

// Same formula as the shader, so the faces can time things to the band.
export function flowPhase(x, y, t) {
  return fract(t / PERIOD - x / (4 * STEP) - y * 0.28);
}
export function veilBand(phase) {
  const d = Math.abs(fract(phase - 0.08 + 0.5) - 0.5);
  const s = Math.min(Math.max((d - 0.03) / 0.06, 0), 1);
  return 1 - s * s * (3 - 2 * s);
}
export const faceX = (i) => (i - 1) * STEP;

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uEye;
uniform vec3 uR;
uniform vec3 uU;
uniform vec3 uF;
uniform float uFocal;
uniform vec2 uOff;
uniform vec3 uEnter;
uniform float uVeil;
uniform sampler2D uFaces;
uniform vec4 uAtlas;
uniform vec3 uPal[7];
uniform vec3 uLift;      // hover lift per capsule, world y
uniform vec3 uGlow;      // hover glow per capsule, 0..1
uniform mat3 uRotInv;    // pointer lean, shared, inverse rotation
uniform vec3 uStretch[3]; // pull: where the grabbed end has moved, world
uniform vec3 uExit[3];   // CTA exit: travel per capsule, world
uniform vec3 uFade;      // CTA exit: opacity per capsule

const vec3 B = vec3(${BOX.map((v) => v.toFixed(3)).join(", ")});
const float RAD = ${RADIUS.toFixed(3)};
const float STEP = ${STEP.toFixed(3)};
const float PERIOD = ${PERIOD.toFixed(3)};
const float SLIDE = ${SLIDE.toFixed(3)};
const vec2 WIN = vec2(${WIN.map((v) => v.toFixed(3)).join(", ")});
const float WIN_R = ${WIN_R.toFixed(3)};

float sdBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}
float sdRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float pick(vec3 v, int i) { return i == 0 ? v.x : (i == 1 ? v.y : v.z); }
float enterOf(int i) { return pick(uEnter, i); }
float alphaOf(int i) { return pick(uEnter, i) * pick(uFade, i); }
vec3 centre(int i) {
  // grows from the centre: the outer capsules slide out from the middle one
  float e = 1.0 - enterOf(i);
  float side = float(i - 1);
  return vec3(side * (STEP - e * SLIDE * 0.6), -e * 0.18 + pick(uLift, i), 0.0) + uExit[i];
}
// World point to capsule space: moved, stretched along the pull, then leaned.
vec3 toLocal(vec3 p, int i) {
  vec3 l = p - centre(i);
  vec3 s = uStretch[i];
  float m = length(s);
  if (m > 1e-4) {
    vec3 d = s / m;
    float ext = 2.0 * (abs(d.x) * B.x + abs(d.y) * B.y + abs(d.z) * B.z);
    float f = (ext + m) / ext;
    l -= s * 0.5;
    float along = dot(l, d);
    l += d * (along / f - along);
  }
  return uRotInv * l;
}
vec2 map(vec3 p) {
  float d = 1e5;
  float id = -1.0;
  for (int i = 0; i < 3; i++) {
    if (alphaOf(i) <= 0.001) continue;
    float di = sdBox(toLocal(p, i), B, RAD);
    if (di < d) { d = di; id = float(i); }
  }
  return vec2(d, id);
}
vec3 nrm(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  const float h = 0.004;
  return normalize(k.xyy * map(p + k.xyy * h).x + k.yyx * map(p + k.yyx * h).x +
                   k.yxy * map(p + k.yxy * h).x + k.xxx * map(p + k.xxx * h).x);
}
vec3 pal(float ph) {
  ph = fract(ph) * 7.0;
  int i = int(floor(ph));
  float f = ph - floor(ph);
  f = f * f * (3.0 - 2.0 * f);
  return mix(uPal[i], uPal[(i + 1) % 7], f);
}
float phaseAt(vec3 p) { return uTime / PERIOD - p.x / (4.0 * STEP) - p.y * 0.28; }
float veilBand(float ph) {
  float d = abs(fract(ph - 0.08 + 0.5) - 0.5);
  return 1.0 - smoothstep(0.03, 0.09, d);
}

vec3 shade(vec3 p, int id, vec3 rd) {
  vec3 l = toLocal(p, id);
  vec3 n = nrm(p);
  float ph = phaseAt(p);
  vec3 col = pal(ph);
  // keep the band luminous: a touch more saturation than the raw palette
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = clamp(mix(vec3(lum), col, 1.15), 0.0, 1.0);

  // key light from above and in front, ambient kept high: the front and top stay
  // bright and the shaded sides keep the band's tint instead of going grey
  vec3 L = normalize(vec3(0.25, 0.85, 0.55));
  float dif = clamp(dot(n, L), 0.0, 1.0);
  col = clamp(col * (0.94 + 0.1 * dif), 0.0, 1.0); // no white sheen on the tops

  // front window: a near white plate, the face content on it, veiled by the pink band
  float front = smoothstep(0.55, 0.9, n.z);
  float dW = sdRect(l.xy, WIN, WIN_R);
  float wm = (1.0 - smoothstep(-0.06, 0.015, dW)) * front;
  float k = wm * (1.0 - uVeil * veilBand(ph));
  col = mix(col, vec3(0.992, 0.99, 0.986), k * 0.95);
  vec2 tuv = clamp(l.xy / WIN * 0.5 + 0.5, 0.0, 1.0);
  float u = (float(id) * (uAtlas.x + uAtlas.y) + 0.5 + tuv.x * (uAtlas.x - 1.0)) / uAtlas.z;
  float v = (0.5 + (1.0 - tuv.y) * (uAtlas.w - 1.0)) / uAtlas.w;
  vec4 tx = texture(uFaces, vec2(u, v));
  col = mix(col, tx.rgb, tx.a * k);

  // rim glow takes a later colour of the same band
  // hover brightens the band and its glow
  // Screened on so it only ever brightens.
  float g = pick(uGlow, id);
  float f = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 2.2);
  // The rim glows in a near colour of the band, no white mixed in: a near colour keeps it clean,
  // where the far one went murky
  vec3 rimC = pal(ph + 0.08);
  col = 1.0 - (1.0 - col) * (1.0 - rimC * clamp(f * (0.8 + 0.3 * g), 0.0, 1.0));
  col = mix(col, min(col * 1.05 + 0.03, vec3(1.0)), g);
  return col;
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y - uOff;
  vec3 ro = uEye;
  vec3 rd = normalize(uF * uFocal + uR * uv.x + uU * uv.y);
  vec3 col = vec3(1.0);

  // room for the pull, the lean and the exit travel
  vec3 lo = min(min(uExit[0], uExit[1]), uExit[2]);
  vec3 hi = max(max(uExit[0], uExit[1]), uExit[2]);
  vec3 bmin = vec3(-STEP - B.x - 0.6, -B.y - 0.6, -B.z - 0.5) + min(lo, 0.0);
  vec3 bmax = vec3(STEP + B.x + 0.6, B.y + 0.6, B.z + 0.5) + max(hi, 0.0);
  vec3 inv = 1.0 / rd;
  vec3 t0 = (bmin - ro) * inv;
  vec3 t1 = (bmax - ro) * inv;
  vec3 tmn = min(t0, t1);
  vec3 tmx = max(t0, t1);
  float tn = max(max(tmn.x, tmn.y), tmn.z);
  float tf = min(min(tmx.x, tmx.y), tmx.z);
  if (tf < max(tn, 0.0)) { outColor = vec4(col, 1.0); return; }

  float t = max(tn, 0.0);
  float md = 1e5;
  vec3 mp = ro;
  float mid = -1.0;
  bool hit = false;
  for (int s = 0; s < 80; s++) {
    vec3 p = ro + rd * t;
    vec2 h = map(p);
    if (h.x < md) { md = h.x; mp = p; mid = h.y; }
    if (h.x < 0.0008 * t) { hit = true; break; }
    t += h.x;
    if (t > tf) break;
  }

  if (mid >= 0.0) {
    int id = int(mid + 0.5);
    float e = alphaOf(id);
    // soft edge: one pixel of feather at rest, wide and blurry while trailing in or out
    float px = 2.0 * length(mp - ro) / (uRes.y * uFocal);
    float feather = px * 1.2 + (1.0 - e) * 0.35;
    float a = hit ? 1.0 : 1.0 - smoothstep(0.0, feather, md);
    vec3 body = shade(mp, id, rd);
    // lilac and pink aura around the silhouette
    vec3 auraCol = mix(uPal[6], pal(phaseAt(mp) + 0.42), 0.45);
    float aura = (hit ? 0.0 : exp(-md / 0.09) * (0.5 + 0.25 * pick(uGlow, id)));
    col = mix(col, auraCol, aura * e);
    col = mix(col, body, a * e);
  }
  outColor = vec4(col, 1.0);
}
`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Camera: straight on to the middle capsule and a little above, level, so the outer two
// are mirror images and the tops still read in 3D.
export function makeCamera() {
  const yaw = 0;
  const pitch = (24 * Math.PI) / 180;
  const roll = 0;
  const dist = 18;
  const target = [0, 0, 0];
  const eye = [
    Math.sin(yaw) * Math.cos(pitch) * dist,
    Math.sin(pitch) * dist,
    Math.cos(yaw) * Math.cos(pitch) * dist,
  ];
  const F = norm(sub(target, eye));
  const R0 = norm(cross(F, [0, 1, 0]));
  const U0 = cross(R0, F);
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  const R = [R0[0] * c + U0[0] * s, R0[1] * c + U0[1] * s, R0[2] * c + U0[2] * s];
  const U = [U0[0] * c - R0[0] * s, U0[1] * c - R0[1] * s, U0[2] * c - R0[2] * s];
  return { eye, R, U, F };
}

// Project a world point to raw uv (focal 1, no offset).
export function projectRaw(cam, p) {
  const v = sub(p, cam.eye);
  const z = dot(v, cam.F);
  return [dot(v, cam.R) / z, dot(v, cam.U) / z];
}

// Bounding box of the three capsules at rest, in raw uv.
export function chainBounds(cam) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < 3; i++) {
    const cx = faceX(i);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      // pull corners in by the rounding so the box hugs the visible silhouette
      const p = [
        cx + sx * (BOX[0] - RADIUS * 0.3),
        sy * (BOX[1] - RADIUS * 0.3),
        sz * (BOX[2] - RADIUS * 0.3),
      ];
      const [x, y] = projectRaw(cam, p);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, maxX, minY, maxY };
}

// Every capsule at rest: no lift, glow, lean, pull or exit.
export const REST = {
  lift: [0, 0, 0],
  glow: [0, 0, 0],
  rotInv: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  stretch: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  exit: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  fade: [1, 1, 1],
};

export function createCapsules(canvas, atlas) {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(log);
    }
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const n of ["uRes", "uTime", "uEye", "uR", "uU", "uF", "uFocal", "uOff", "uEnter", "uVeil", "uFaces", "uAtlas", "uPal", "uLift", "uGlow", "uRotInv", "uStretch", "uExit", "uFade"]) {
    U[n] = gl.getUniformLocation(prog, n);
  }

  const cam = makeCamera();
  gl.uniform3fv(U.uEye, cam.eye);
  gl.uniform3fv(U.uR, cam.R);
  gl.uniform3fv(U.uU, cam.U);
  gl.uniform3fv(U.uF, cam.F);
  gl.uniform3fv(U.uPal, PALETTE.flatMap(hex));
  gl.uniform4f(U.uAtlas, FACE_W, FACE_PAD, ATLAS_W, FACE_H);

  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  gl.uniform1i(U.uFaces, 0);

  return {
    cam,
    setView(width, height, focal, off) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(U.uRes, width, height);
      gl.uniform1f(U.uFocal, focal);
      gl.uniform2f(U.uOff, off[0], off[1]);
    },
    // m: { lift[3], glow[3], rotInv[9] column major, stretch[9], exit[9], fade[3] }
    render(time, enter, veil, m = REST) {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      gl.uniform1f(U.uTime, time);
      gl.uniform3f(U.uEnter, enter[0], enter[1], enter[2]);
      gl.uniform1f(U.uVeil, veil);
      gl.uniform3fv(U.uLift, m.lift);
      gl.uniform3fv(U.uGlow, m.glow);
      gl.uniformMatrix3fv(U.uRotInv, false, m.rotInv);
      gl.uniform3fv(U.uStretch, m.stretch);
      gl.uniform3fv(U.uExit, m.exit);
      gl.uniform3fv(U.uFade, m.fade);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      const lose = gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
    },
  };
}
