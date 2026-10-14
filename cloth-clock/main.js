// Cloth Clock. A retractable banner with the clock printed on it. Every tick
// hammers the fabric and the crease travels across and stays folded.
//
// Debug hook, because the piece is time driven and a screenshot lands on a
// random instant:
//   ?freeze=0.35   settle deterministically, then advance 0.35 simulated
//                  seconds and stop, so the crease wave can be caught partway
//   ?tick          fire one second tick at the start of that window
//   ?minute        fire a minute fold instead
//   ?deploy=0.55   start part rolled
//   ?wire          wireframe on
// Example: /?tick&freeze=0.35

import { Cloth, P } from './cloth.js';
import { drawFace, DIAL_U, DIAL_V, DIAL_R } from './face.js';
import * as SH from './shaders.js';
import { mat4, perspective, lookAt, mul, invert } from './math.js';
import { buildPanel } from './ui.js';
import {
  createProgram, makeTarget, freeTarget, missingUniforms,
  set1f, set1i, set2f, set3f, setMat4,
} from './glu.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- error UI
const errEl = document.getElementById('err');
let failed = false;
function fail(msg) {
  failed = true;
  errEl.textContent += msg + '\n\n';
  errEl.classList.add('on');
  console.error(msg);
}
window.addEventListener('error', e => fail('Script error: ' + (e.message || e)));
window.addEventListener('unhandledrejection', e => fail('Unhandled rejection: ' + e.reason));

// ---------------------------------------------------------------- options
const Q = new URLSearchParams(location.search);
const DBG = {
  freeze: Q.has('freeze') ? Math.max(0, Number(Q.get('freeze')) || 0) : null,
  tick: Q.has('tick'),
  minute: Q.has('minute'),
  deploy: Q.has('deploy') ? Number(Q.get('deploy')) : null,
  wire: Q.has('wire'),
  age: Q.has('age') ? Math.max(0, Number(Q.get('age')) || 0) : 0,
};
// A fixed pose for the hands when frozen, so screenshots are comparable.
const FROZEN_CLOCK = { h: 10, m: 9, s: 32 };

// ---------------------------------------------------------------- palette
const RED = '#9A2A1B';     // the ground, warm pigment red
const BEIGE = '#E0D0AC';   // the cloth
const INK = '#7E2015';     // what is printed on it
const hex = h => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];
const cRed = hex(RED), cBeige = hex(BEIGE), cInk = hex(INK);

// Light, pointing from the cloth toward the lamp.
const L = (() => {
  const v = [-0.76, 0.44, 0.48];
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
})();
const TRAVEL = [-L[0], -L[1], -L[2]];
const WALL_Z = -0.42;
const DIAL_CENTER_Y = 0.26;   // the disc hangs high, so look at its middle
const TEX_ASPECT = 1.0;   // cloth height over width, square now that it is a disc

// ---------------------------------------------------------------- gl setup
const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl2', {
  antialias: false, alpha: false, depth: false, stencil: false,
  powerPreference: 'high-performance', preserveDrawingBuffer: true,
});
if (!gl) fail('WebGL2 is not available in this browser.');

let PR = {};
let floatTargets = false;

if (gl) {
  floatTargets = !!gl.getExtension('EXT_color_buffer_float');
  try {
    for (const [name, vs, fs] of SH.PROGRAMS) PR[name] = createProgram(gl, vs, fs, name);
  } catch (e) {
    fail(e.message);
  }
}

// ---------------------------------------------------------------- meshes
const GRIDS = [[32, 48], [40, 60], [48, 72], [56, 84], [64, 96]];
let gridIndex = 2;

let cloth = null;
let clothGL = null;
let posA = null, nrmA = null, posOut = null, nrmOut = null;

function destroyClothGL() {
  if (!clothGL) return;
  gl.deleteVertexArray(clothGL.vao);
  gl.deleteVertexArray(clothGL.lineVao);
  gl.deleteBuffer(clothGL.bPos);
  gl.deleteBuffer(clothGL.bNrm);
  gl.deleteBuffer(clothGL.bUV);
  gl.deleteBuffer(clothGL.bFold);
  gl.deleteBuffer(clothGL.ebo);
  gl.deleteBuffer(clothGL.lebo);
  clothGL = null;
}

function buildCloth() {
  const [nx, ny] = GRIDS[gridIndex];
  P.nx = nx; P.ny = ny;
  cloth = new Cloth(nx, ny);
  if (DBG.deploy !== null && isFinite(DBG.deploy)) {
    cloth.deploy = Math.min(1, Math.max(MIN_DEPLOY, DBG.deploy));
  }
  deployTarget = cloth.deploy;

  posA = new Float32Array(cloth.pos.length);
  nrmA = new Float32Array(cloth.nrm.length);
  posOut = new Float32Array(cloth.pos.length);
  nrmOut = new Float32Array(cloth.nrm.length);
  posA.set(cloth.pos);
  nrmA.set(cloth.nrm);

  if (!gl) return;
  destroyClothGL();

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const bPos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bPos);
  gl.bufferData(gl.ARRAY_BUFFER, cloth.pos.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  const bNrm = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bNrm);
  gl.bufferData(gl.ARRAY_BUFFER, cloth.nrm.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  const bUV = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bUV);
  gl.bufferData(gl.ARRAY_BUFFER, cloth.uv, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

  const bFold = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bFold);
  gl.bufferData(gl.ARRAY_BUFFER, cloth.fold.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, 0);

  const ebo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cloth.tri, gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  const lineVao = gl.createVertexArray();
  gl.bindVertexArray(lineVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, bPos);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  const lebo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lebo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cloth.line, gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  clothGL = { vao, lineVao, bPos, bNrm, bUV, bFold, ebo, lebo, count: cloth.tri.length, lineCount: cloth.line.length };
}

// ---- the pull tab: a cord and a ring hanging off the bottom of the cloth
const SEG = 28;
const TAB_VERTS = 4 + SEG * 2;
const tabPos = new Float32Array(TAB_VERTS * 3);
const tabNrm = new Float32Array(TAB_VERTS * 3);
const tabUV = new Float32Array(TAB_VERTS * 2);
const tabFold = new Float32Array(TAB_VERTS * 2);
const tabIdx = (() => {
  const a = [0, 1, 2, 2, 1, 3];
  for (let k = 0; k < SEG; k++) {
    const o0 = 4 + 2 * k, i0 = o0 + 1;
    const o1 = 4 + 2 * ((k + 1) % SEG), i1 = o1 + 1;
    a.push(o0, i0, o1, o1, i0, i1);
  }
  return new Uint32Array(a);
})();
const CORD = 0.085, RING_OUT = 0.041, RING_IN = 0.025;
const ringCentre = [0, 0, 0];
let tabGL = null;

function buildTabGL() {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const mk = (data, loc, size, usage) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    return b;
  };
  const bPos = mk(tabPos, 0, 3, gl.DYNAMIC_DRAW);
  const bNrm = mk(tabNrm, 1, 3, gl.DYNAMIC_DRAW);
  mk(tabUV, 2, 2, gl.STATIC_DRAW);
  mk(tabFold, 3, 2, gl.STATIC_DRAW);
  const ebo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tabIdx, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  tabGL = { vao, bPos, bNrm, count: tabIdx.length };
}

function updateTab() {
  const nx = cloth.nx, ny = cloth.ny;
  const att = (ny - 1) * nx + (nx >> 1);
  const above = att - nx;
  const o = att * 3, oa = above * 3;
  const px = posOut[o], py = posOut[o + 1], pz = posOut[o + 2];
  let dx = px - posOut[oa], dy = py - posOut[oa + 1], dz = pz - posOut[oa + 2];
  let l = Math.hypot(dx, dy, dz) || 1;
  dx /= l; dy /= l; dz /= l;
  const nxv = nrmOut[o], nyv = nrmOut[o + 1], nzv = nrmOut[o + 2];
  let rx = dy * nzv - dz * nyv, ry = dz * nxv - dx * nzv, rz = dx * nyv - dy * nxv;
  l = Math.hypot(rx, ry, rz) || 1;
  rx /= l; ry /= l; rz /= l;

  const W = 0.013;
  const put = (i, x, y, z) => {
    tabPos[i * 3] = x; tabPos[i * 3 + 1] = y; tabPos[i * 3 + 2] = z;
    tabNrm[i * 3] = nxv; tabNrm[i * 3 + 1] = nyv; tabNrm[i * 3 + 2] = nzv;
  };
  put(0, px - rx * W, py - ry * W, pz - rz * W);
  put(1, px + rx * W, py + ry * W, pz + rz * W);
  put(2, px - rx * W + dx * CORD, py - ry * W + dy * CORD, pz - rz * W + dz * CORD);
  put(3, px + rx * W + dx * CORD, py + ry * W + dy * CORD, pz + rz * W + dz * CORD);

  const cxp = px + dx * (CORD + RING_OUT);
  const cyp = py + dy * (CORD + RING_OUT);
  const czp = pz + dz * (CORD + RING_OUT);
  ringCentre[0] = cxp; ringCentre[1] = cyp; ringCentre[2] = czp;
  for (let k = 0; k < SEG; k++) {
    const a = (k / SEG) * TAU;
    const ca = Math.cos(a), sa = Math.sin(a);
    const ux = rx * ca + dx * sa, uy = ry * ca + dy * sa, uz = rz * ca + dz * sa;
    put(4 + 2 * k, cxp + ux * RING_OUT, cyp + uy * RING_OUT, czp + uz * RING_OUT);
    put(4 + 2 * k + 1, cxp + ux * RING_IN, cyp + uy * RING_IN, czp + uz * RING_IN);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, tabGL.bPos);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, tabPos);
  gl.bindBuffer(gl.ARRAY_BUFFER, tabGL.bNrm);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, tabNrm);
}

// ---- the back wall
let wallVao = null, emptyVao = null;
function buildStatic() {
  const q = new Float32Array([-6, -6, WALL_Z, 6, -6, WALL_Z, -6, 6, WALL_Z, 6, 6, WALL_Z]);
  wallVao = gl.createVertexArray();
  gl.bindVertexArray(wallVao);
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, q, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  emptyVao = gl.createVertexArray();
}

// ---------------------------------------------------------------- face texture
let faceTex = null;
function buildFace() {
  const cv = drawFace();
  faceTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, faceTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  if (aniso) {
    const m = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, m));
  }
}

// ---------------------------------------------------------------- sizing
const MAX_PIXELS = 2.6e6;
let W = 1, H = 1;
let sceneT = null, shadowA = null, shadowB = null;
const proj = mat4(), view = mat4(), viewProj = mat4(), invViewProj = mat4();
let camPos = [0, 0, 3];

function resize() {
  if (!gl) return;
  const cw = Math.max(1, canvas.clientWidth || window.innerWidth);
  const ch = Math.max(1, canvas.clientHeight || window.innerHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = Math.round(cw * dpr), h = Math.round(ch * dpr);
  const total = w * h;
  if (total > MAX_PIXELS) {
    const s = Math.sqrt(MAX_PIXELS / total);
    w = Math.max(1, Math.round(w * s));
    h = Math.max(1, Math.round(h * s));
  }
  if (w === W && h === H) return;
  W = w; H = h;
  canvas.width = W;
  canvas.height = H;

  freeTarget(gl, sceneT); freeTarget(gl, shadowA); freeTarget(gl, shadowB);
  try {
    sceneT = makeTarget(gl, W, H, floatTargets ? gl.RGBA16F : gl.RGBA8, true);
    const sw = Math.max(2, W >> 1), sh = Math.max(2, H >> 1);
    shadowA = makeTarget(gl, sw, sh, gl.RGBA8, false);
    shadowB = makeTarget(gl, sw, sh, gl.RGBA8, false);
  } catch (e) {
    fail(e.message);
  }
  updateCamera();
}

function updateCamera() {
  const aspect = W / H;
  const fov = 38 * Math.PI / 180;
  const t = Math.tan(fov / 2);
  const halfH = 0.60, halfW = 0.60;
  const dist = Math.max(halfH / t, halfW / (t * aspect)) + 0.30;
  camPos = [0, 0.02, dist];
  lookAt(view, camPos[0], camPos[1], camPos[2], 0, DIAL_CENTER_Y, 0, 0, 1, 0);
  perspective(proj, fov, aspect, 0.05, 24);
  mul(viewProj, proj, view);
  invert(invViewProj, viewProj);
}

// ---------------------------------------------------------------- clock
let lastSec = -1, lastMin = -1, lastHour = -1;
let handAngles = [0, 0, 0];

function clockNow() {
  if (DBG.freeze !== null) return FROZEN_CLOCK;
  const d = new Date();
  return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
}

function updateHands() {
  const { h, m, s } = clockNow();
  handAngles[0] = (((h % 12) + m / 60) / 12) * TAU;
  handAngles[1] = ((m + s / 60) / 60) * TAU;
  handAngles[2] = (s / 60) * TAU;   // the second hand jumps, it does not creep
  return { h, m, s };
}

// Where the tip of the second hand is, in cloth UV.
function secondTipUV() {
  const a = handAngles[2];
  return [
    DIAL_U + Math.sin(a) * DIAL_R * 0.90,
    DIAL_V + Math.cos(a) * DIAL_R * 0.90 / TEX_ASPECT,
  ];
}

const TICK_BASE = 14;
function fireSecond() {
  const [u, v] = secondTipUV();
  cloth.impulseAtUV(u, v, TICK_BASE * P.tick, 1.35);
}
function fireMinute() {
  const [, v] = secondTipUV();
  cloth.impulseRow(DIAL_V, TICK_BASE * P.tick * 0.34);
  cloth.impulseAtUV(0.5, v, TICK_BASE * P.tick * 0.7, 1.6);
}
function fireHour() {
  cloth.impulseRow(DIAL_V - 0.06, TICK_BASE * P.tick * 0.62);
  // The hour is pressed straight into the memory, so the mark is there before
  // the wave has even settled.
  cloth.imprintFold(DIAL_V - 0.06, 0.55);
}

// ---------------------------------------------------------------- interaction
const MIN_DEPLOY = 0.085;
let deployTarget = 1;
let dragMode = null;          // 'cloth' | 'tab' | null
let dragClip = [0, 0, 0, 1];
let pointerStart = [0, 0];
let pointerT0 = 0;

function ndcFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  return [
    ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1,
    1 - ((e.clientY - r.top) / Math.max(1, r.height)) * 2,
  ];
}

function projectPoint(x, y, z, out) {
  const m = viewProj;
  const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
  const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
  const cz = m[2] * x + m[6] * y + m[10] * z + m[14];
  const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
  out[0] = cx; out[1] = cy; out[2] = cz; out[3] = cw;
  return cw;
}

// Unproject the pointer keeping the grabbed point at its original depth.
const tmp4 = [0, 0, 0, 0];
function pointerToWorld(ndc, clip, out) {
  const w = clip[3];
  const x = ndc[0] * w, y = ndc[1] * w, z = clip[2], ww = w;
  const m = invViewProj;
  const ox = m[0] * x + m[4] * y + m[8] * z + m[12] * ww;
  const oy = m[1] * x + m[5] * y + m[9] * z + m[13] * ww;
  const oz = m[2] * x + m[6] * y + m[10] * z + m[14] * ww;
  const ow = m[3] * x + m[7] * y + m[11] * z + m[15] * ww;
  const s = Math.abs(ow) > 1e-9 ? 1 / ow : 1;
  out[0] = ox * s; out[1] = oy * s; out[2] = oz * s;
}

function pickParticle(ndc) {
  let best = -1, bd = Infinity;
  const px = ndc[0], py = ndc[1];
  for (let k = 0; k < cloth.n; k++) {
    if (cloth.kin[k]) continue;
    const o = k * 3;
    const w = projectPoint(cloth.pos[o], cloth.pos[o + 1], cloth.pos[o + 2], tmp4);
    if (w <= 0) continue;
    const dx = tmp4[0] / w - px, dy = tmp4[1] / w - py;
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = k; }
  }
  // within roughly 70 device pixels
  const lim = (140 / Math.max(W, H));
  return bd < lim * lim ? best : -1;
}

function tabHit(ndc) {
  const w = projectPoint(ringCentre[0], ringCentre[1], ringCentre[2], tmp4);
  if (w <= 0) return false;
  const dx = tmp4[0] / w - ndc[0], dy = tmp4[1] / w - ndc[1];
  const lim = 110 / Math.max(W, H);
  return dx * dx + dy * dy < lim * lim;
}

if (gl) {
  canvas.addEventListener('pointerdown', e => {
    if (failed) return;
    canvas.setPointerCapture(e.pointerId);
    const ndc = ndcFromEvent(e);
    pointerStart = [e.clientX, e.clientY];
    pointerT0 = performance.now();
    hideHint();

    if (tabHit(ndc)) {
      dragMode = 'tab';
      projectPoint(ringCentre[0], ringCentre[1], ringCentre[2], dragClip);
      return;
    }
    const k = pickParticle(ndc);
    if (k >= 0) {
      dragMode = 'cloth';
      cloth.grab = k;
      cloth.w[k] = 0;
      const o = k * 3;
      projectPoint(cloth.pos[o], cloth.pos[o + 1], cloth.pos[o + 2], dragClip);
      cloth.grabTarget[0] = cloth.pos[o];
      cloth.grabTarget[1] = cloth.pos[o + 1];
      cloth.grabTarget[2] = cloth.pos[o + 2];
      cloth.grabPrev[0] = cloth.grabTarget[0];
      cloth.grabPrev[1] = cloth.grabTarget[1];
      cloth.grabPrev[2] = cloth.grabTarget[2];
      canvas.classList.add('grabbing');
    }
  });

  canvas.addEventListener('pointermove', e => {
    if (!dragMode) return;
    const ndc = ndcFromEvent(e);
    const out = [0, 0, 0];
    pointerToWorld(ndc, dragClip, out);
    if (dragMode === 'cloth') {
      cloth.grabTarget[0] = out[0];
      cloth.grabTarget[1] = out[1];
      cloth.grabTarget[2] = out[2];
    } else {
      // How far below the roller the tab has been pulled sets how much cloth
      // is off the spool.
      const hang = cloth.spoolY - out[1] - CORD - RING_OUT;
      deployTarget = Math.min(1, Math.max(MIN_DEPLOY, hang / cloth.height));
      cloth.deploy = deployTarget;
      cloth.deployVel = 0;
    }
  });

  const endDrag = e => {
    if (!dragMode) return;
    const moved = Math.hypot(e.clientX - pointerStart[0], e.clientY - pointerStart[1]);
    const quick = performance.now() - pointerT0 < 420;
    if (dragMode === 'cloth') {
      if (cloth.grab >= 0) cloth.w[cloth.grab] = cloth.w0[cloth.grab];
      cloth.grab = -1;
    } else if (dragMode === 'tab') {
      if (moved < 7 && quick) {
        // a tap toggles all the way down or all the way up
        deployTarget = cloth.deploy > 0.55 ? MIN_DEPLOY : 1;
      } else {
        deployTarget = MIN_DEPLOY;   // let go and a blind retracts
      }
    }
    dragMode = null;
    canvas.classList.remove('grabbing');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
}

// ---------------------------------------------------------------- panel
const panelEl = document.getElementById('panel');
const hintEl = document.getElementById('hint');
let hintTimer = 0;
function hideHint() {
  if (!hintEl.classList.contains('gone')) hintEl.classList.add('gone');
}

let panel = null;
function setupPanel() {
  panel = buildPanel(panelEl, P, {
    gridIndex: () => gridIndex,
    gridLabel: i => GRIDS[i][0] + ' x ' + GRIDS[i][1],
    setGrid: i => {
      if (i === gridIndex) return;
      gridIndex = i;
      const keepDeploy = cloth ? cloth.deploy : 1;
      buildCloth();
      cloth.deploy = keepDeploy;
      deployTarget = keepDeploy;
    },
    reset: () => {
      const d = cloth.deploy;
      cloth.reset();
      cloth.deploy = d;
    },
  });
}

window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'h') { panelEl.classList.toggle('open'); hideHint(); }
  else if (k === 't') { if (cloth) fireSecond(); hideHint(); }
  else if (k === 'm') { if (cloth) fireMinute(); }
  else if (k === 'w') { P.wireframe = !P.wireframe; if (panel) panel.sync(); }
  else if (k === 'n') { P.normals = !P.normals; if (panel) panel.sync(); }
});

// ---------------------------------------------------------------- sim
const SIM_DT = 1 / 60;
let acc = 0;
let lastFrame = 0;
let frozen = false;

function stepDeploy(dt) {
  if (dragMode === 'tab') return;
  const k = 66, zeta = 0.44;
  const c = 2 * Math.sqrt(k) * zeta;
  cloth.deployVel += (deployTarget - cloth.deploy) * k * dt;
  cloth.deployVel *= Math.exp(-c * dt);
  // Never move more than a couple of rows in one step, or particles would
  // teleport onto the spool and yank their neighbours.
  const maxRate = 3.0;
  if (cloth.deployVel > maxRate) cloth.deployVel = maxRate;
  if (cloth.deployVel < -maxRate) cloth.deployVel = -maxRate;
  cloth.deploy += cloth.deployVel * dt;
  if (cloth.deploy < MIN_DEPLOY) { cloth.deploy = MIN_DEPLOY; cloth.deployVel = Math.abs(cloth.deployVel) * 0.26; }
  if (cloth.deploy > 1) { cloth.deploy = 1; cloth.deployVel = -Math.abs(cloth.deployVel) * 0.26; }
}

function simStep() {
  posA.set(cloth.pos);
  nrmA.set(cloth.nrm);
  stepDeploy(SIM_DT);
  cloth.step(SIM_DT);
}

let ageLeft = 0;
let ageSec = 0;

// One second of wall clock worth of ticking, the same hit the live clock makes.
function ageOneSecond() {
  ageSec++;
  const a = (ageSec / 60) * TAU;
  cloth.impulseAtUV(
    DIAL_U + Math.sin(a) * DIAL_R * 0.90,
    DIAL_V + Math.cos(a) * DIAL_R * 0.90 / TEX_ASPECT,
    TICK_BASE * P.tick, 1.35);
  if (ageSec % 60 === 0) cloth.impulseRow(DIAL_V, TICK_BASE * P.tick * 0.34);
  for (let i = 0; i < 60; i++) simStep();
}

function finishFreeze() {
  if (DBG.tick) fireSecond();
  if (DBG.minute) fireMinute();
  const steps = Math.round(DBG.freeze * 60);
  for (let i = 0; i < steps; i++) simStep();
  frozen = true;
  hideHint();
}

function checkClock() {
  const { s, m, h } = updateHands();
  if (lastSec < 0) { lastSec = s; lastMin = m; lastHour = h; return; }
  if (s !== lastSec) {
    lastSec = s;
    fireSecond();
    if (m !== lastMin) { lastMin = m; fireMinute(); }
    if (h !== lastHour) { lastHour = h; fireHour(); }
  }
}

// ---------------------------------------------------------------- render
function lerpInto(out, a, b, t) {
  for (let i = 0; i < out.length; i++) out[i] = a[i] + (b[i] - a[i]) * t;
}

function uploadMesh(alpha) {
  lerpInto(posOut, posA, cloth.pos, alpha);
  lerpInto(nrmOut, nrmA, cloth.nrm, alpha);
  for (let k = 0; k < cloth.n; k++) {
    const o = k * 3;
    const l = Math.hypot(nrmOut[o], nrmOut[o + 1], nrmOut[o + 2]);
    if (l > 1e-6) { nrmOut[o] /= l; nrmOut[o + 1] /= l; nrmOut[o + 2] /= l; }
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, clothGL.bPos);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, posOut);
  gl.bindBuffer(gl.ARRAY_BUFFER, clothGL.bNrm);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, nrmOut);
  gl.bindBuffer(gl.ARRAY_BUFFER, clothGL.bFold);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, cloth.fold);
}

function drawClothWith(pr, faceMix) {
  set1f(gl, pr, 'uFaceMix', faceMix);
  gl.bindVertexArray(clothGL.vao);
  gl.drawElements(gl.TRIANGLES, clothGL.count, gl.UNSIGNED_INT, 0);
  set1f(gl, pr, 'uFaceMix', 0);
  gl.bindVertexArray(tabGL.vao);
  gl.drawElements(gl.TRIANGLES, tabGL.count, gl.UNSIGNED_INT, 0);
}

function render(time) {
  // 1. cast the cloth onto the wall
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadowA.fb);
  gl.viewport(0, 0, shadowA.w, shadowA.h);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  let pr = PR.shadow;
  gl.useProgram(pr.program);
  setMat4(gl, pr, 'uViewProj', viewProj);
  set3f(gl, pr, 'uLightTravel', TRAVEL[0], TRAVEL[1], TRAVEL[2]);
  set1f(gl, pr, 'uWallZ', WALL_Z);
  gl.bindVertexArray(clothGL.vao);
  gl.drawElements(gl.TRIANGLES, clothGL.count, gl.UNSIGNED_INT, 0);
  gl.bindVertexArray(tabGL.vao);
  gl.drawElements(gl.TRIANGLES, tabGL.count, gl.UNSIGNED_INT, 0);

  // 2. soften it, two separable rounds
  pr = PR.blur;
  gl.useProgram(pr.program);
  gl.bindVertexArray(emptyVao);
  gl.activeTexture(gl.TEXTURE0);
  set1i(gl, pr, 'uTex', 0);
  const sx = 1.6 / shadowA.w, sy = 1.6 / shadowA.h;
  const pass = (src, dst, dx, dy) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.viewport(0, 0, dst.w, dst.h);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    set2f(gl, pr, 'uDir', dx, dy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  pass(shadowA, shadowB, sx, 0);
  pass(shadowB, shadowA, 0, sy);
  pass(shadowA, shadowB, sx * 2, 0);
  pass(shadowB, shadowA, 0, sy * 2);

  // 3. the scene, in linear light
  gl.bindFramebuffer(gl.FRAMEBUFFER, sceneT.fb);
  gl.viewport(0, 0, W, H);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  pr = PR.wall;
  gl.useProgram(pr.program);
  setMat4(gl, pr, 'uViewProj', viewProj);
  set2f(gl, pr, 'uRes', W, H);
  set3f(gl, pr, 'uWallCol', cRed[0], cRed[1], cRed[2]);
  set3f(gl, pr, 'uLightDir', L[0], L[1], L[2]);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, shadowA.tex);
  set1i(gl, pr, 'uShadow', 0);
  gl.bindVertexArray(wallVao);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  pr = PR.cloth;
  gl.useProgram(pr.program);
  setMat4(gl, pr, 'uViewProj', viewProj);
  set3f(gl, pr, 'uCam', camPos[0], camPos[1], camPos[2]);
  set3f(gl, pr, 'uLightDir', L[0], L[1], L[2]);
  set3f(gl, pr, 'uBeige', cBeige[0], cBeige[1], cBeige[2]);
  set3f(gl, pr, 'uInk', cInk[0], cInk[1], cInk[2]);
  set3f(gl, pr, 'uWallCol', cRed[0], cRed[1], cRed[2]);
  set3f(gl, pr, 'uDial', DIAL_U, DIAL_V, DIAL_R);
  set1f(gl, pr, 'uTexAspect', TEX_ASPECT);
  set3f(gl, pr, 'uHands', handAngles[0], handAngles[1], handAngles[2]);
  set2f(gl, pr, 'uWeave', 130, 195);
  set1f(gl, pr, 'uWeaveBump', 0.085);
  set1f(gl, pr, 'uCrease', 2.2);
  set1f(gl, pr, 'uAO', 0.9);
  set1f(gl, pr, 'uSheen', 0.42);
  set1i(gl, pr, 'uDebug', P.normals ? 1 : 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, faceTex);
  set1i(gl, pr, 'uFace', 0);
  // Blended so the shader cut edge of the dial comes out smooth. Alpha is 1
  // everywhere except the last texel of the rim.
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  drawClothWith(pr, 1);
  gl.disable(gl.BLEND);

  if (P.wireframe) {
    pr = PR.line;
    gl.useProgram(pr.program);
    setMat4(gl, pr, 'uViewProj', viewProj);
    set3f(gl, pr, 'uColor', 0.06, 0.02, 0.015);
    gl.bindVertexArray(clothGL.lineVao);
    gl.drawElements(gl.LINES, clothGL.lineCount, gl.UNSIGNED_INT, 0);
  }

  // 4. tonemap once, at the end
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, W, H);
  gl.disable(gl.DEPTH_TEST);
  pr = PR.post;
  gl.useProgram(pr.program);
  gl.bindVertexArray(emptyVao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, sceneT.tex);
  set1i(gl, pr, 'uScene', 0);
  set1f(gl, pr, 'uTime', time);
  set1f(gl, pr, 'uExposure', 1.12);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);
}

// ---------------------------------------------------------------- loop
function frame(now) {
  if (failed) return;
  if (!lastFrame) lastFrame = now;
  const dtReal = Math.min(0.12, (now - lastFrame) / 1000);
  lastFrame = now;

  if (!frozen) {
    checkClock();
    acc += dtReal;
    let n = 0;
    while (acc >= SIM_DT && n < 4) { simStep(); acc -= SIM_DT; n++; }
    if (acc >= SIM_DT) acc = 0;   // do not let it spiral
  }

  if (ageLeft > 0) {
    const slice = Math.min(4, ageLeft);
    for (let i = 0; i < slice; i++) ageOneSecond();
    ageLeft -= slice;
    if (ageLeft <= 0) finishFreeze();
  }

  const alpha = frozen ? 1 : Math.min(1, acc / SIM_DT);
  uploadMesh(alpha);
  updateTab();
  render(now / 1000);
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- boot
function boot() {
  if (!gl || failed) return;
  try {
    buildStatic();
    buildFace();
    buildCloth();
    buildTabGL();
    resize();
    setupPanel();
    if (DBG.wire) P.wireframe = true;

    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

    updateHands();

    // Let it find its hanging shape, then forget how it got there.
    for (let i = 0; i < 150; i++) simStep();
    cloth.clearCreases();

    if (DBG.freeze !== null) {

      // ?age=120 wears the cloth in first, because the piece only looks like
      // itself once it has taken a set. Spread across frames, never in one
      // blocking lump, so the page paints and you watch it crease up.
      ageLeft = DBG.age;
      if (!ageLeft) finishFreeze();
    } else {
      hintTimer = setTimeout(hideHint, 6200);
    }

    const miss = missingUniforms();
    if (miss.length) console.warn('uniforms not present in program:', miss);

    requestAnimationFrame(frame);
  } catch (e) {
    fail((e && e.stack) || String(e));
  }
}

boot();
