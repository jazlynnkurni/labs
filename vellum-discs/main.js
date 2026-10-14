import { VERT, FRAG_SCENE, FRAG_POST, MAX_DISCS } from './shaders.js';
import { getContext, buildProgram, uniformMap, makeTarget } from './gl.js';
import { CAP, PALETTE, mulberry, layout, makeDisc, pick, liveCount } from './discs.js';

// ------------------------------------------------------------- error surface

const overlay = document.getElementById('err');
function fail(title, body) {
  overlay.style.display = 'block';
  overlay.textContent += title + '\n' + (String(body || '').trim() || '(no log)') + '\n\n';
}
window.addEventListener('error', (e) => fail('script error', e.message + '\n' + (e.filename || '')));
window.addEventListener('unhandledrejection', (e) => fail('promise rejection', (e.reason && e.reason.stack) || e.reason));

// -------------------------------------------------------------------- params

const P = {
  opacity: 0.115,
  tintSpread: 1.0,
  fibre: 0.55,
  edge: 0.105,
  sheen: 0.50,
  grain: 0.5,
  vignette: 0.72,
  defocus: 0.55,
  chroma: 0.5,
  drift: 1.0,
  count: 11
};

const FRAME_ASPECT = 3 / 4;      // width over height, portrait
const MAX_PIXELS = 2.1e6;
const IDLE_DELAY = 3.2;

// ---------------------------------------------------------------- gl startup

const canvas = document.getElementById('c');
let gl;
try {
  gl = getContext(canvas);
} catch (e) {
  fail('no webgl2', e.message);
  throw e;
}

const scene = buildProgram(gl, VERT, FRAG_SCENE, 'scene');
const post = buildProgram(gl, VERT, FRAG_POST, 'post');
if (!scene.ok) fail('scene program failed', scene.log);
if (!post.ok) fail('post program failed', post.log);
if (scene.log && scene.ok) console.log(scene.log);
if (post.log && post.ok) console.log(post.log);

let uScene = null, uPost = null;
if (scene.ok) uScene = uniformMap(gl, scene.program);
if (post.ok) uPost = uniformMap(gl, post.program);

const vao = gl.createVertexArray();   // empty, the vertex shader builds the triangle

let target = null;

// ------------------------------------------------------------------- sizing

let W = 1, H = 1, scale = 1;
let frame = { cx: 0, cy: 0, hw: 1, hh: 1 };
let aspectH = 0.6667;   // composition half height in composition units

function resize() {
  const cw = Math.max(1, canvas.clientWidth);
  const ch = Math.max(1, canvas.clientHeight);
  let s = Math.min(window.devicePixelRatio || 1, 2);
  if (cw * ch * s * s > MAX_PIXELS) s = Math.sqrt(MAX_PIXELS / (cw * ch));
  scale = s;
  W = Math.max(1, Math.round(cw * s));
  H = Math.max(1, Math.round(ch * s));
  canvas.width = W;
  canvas.height = H;

  // letterbox a portrait frame inside whatever the window is
  const fw = Math.min(W, H * FRAME_ASPECT);
  const fh = fw / FRAME_ASPECT;
  frame = { cx: W * 0.5, cy: H * 0.5, hw: fw * 0.5, hh: fh * 0.5 };
  aspectH = (fh * 0.5) / fw;

  target = makeTarget(gl, W, H, target);
  if (!target.ok) fail('render target incomplete', 'framebuffer status ' + target.status);
}

const ro = new ResizeObserver(resize);
ro.observe(canvas);
window.addEventListener('resize', resize);

// ------------------------------------------------------------------- discs

let rnd = mulberry(20260913);
let discs = [];

function anchor(d) { d.ax = d.hx; d.ay = d.hy; }

function build(count) {
  discs = layout(count, rnd, aspectH).map((s) => {
    const d = makeDisc(s, rnd);
    d.alive = 1;
    anchor(d);
    return d;
  });
}
build(P.count);

function addDisc(x, y) {
  if (discs.length >= CAP) return;
  const d = makeDisc({
    x, y,
    r: 0.198 + (rnd() - 0.5) * 0.03,
    rot: rnd() * Math.PI * 2,
    tint: PALETTE[Math.floor(rnd() * PALETTE.length)],
    op: 0.82 + rnd() * 0.42,
    seed: rnd() * 100
  }, rnd);
  d.alive = 0;
  d.aliveT = 1;
  anchor(d);
  discs.push(d);
  P.count = liveCount(discs);
  syncCount();
}

function removeDisc(d) {
  if (!d || d.dead) return;
  d.aliveT = 0;
  d.dead = true;
  if (d === dragDisc) dragDisc = null;
  if (d === hoverDisc) hoverDisc = null;
  P.count = liveCount(discs);
  syncCount();
}

// ------------------------------------------------------------------ shuffle

let shuffle = null;
function reshuffle() {
  const live = discs.filter((d) => !d.dead);
  const next = layout(live.length, rnd, aspectH);
  shuffle = {
    t: 0,
    dur: 1.9,
    from: live.map((d) => ({ x: d.x, y: d.y, r: d.r, rot: d.rot, tint: d.tint.slice() })),
    to: next.map((s) => ({ x: s.x, y: s.y, r: s.r, rot: s.rot, tint: s.tint.slice() })),
    live
  };
  touch();
}

// ------------------------------------------------------------- pointer state

const ptr = { x: 0, y: 0, inside: false, down: false };
const light = { x: 0.0, y: 0.15 };
let hoverDisc = null;
let dragDisc = null;
let grab = { x: 0, y: 0 };
let lastInput = 0;
let driftAmt = 0;
let now = 0;

function touch() { lastInput = now; if (typeof retireHint === 'function') retireHint(); }

function toComp(ev) {
  const rect = canvas.getBoundingClientRect();
  const fx = (ev.clientX - rect.left) * (W / rect.width);
  const fy = (1 - (ev.clientY - rect.top) / rect.height) * H;
  return {
    x: (fx - frame.cx) * (0.5 / frame.hw),
    y: (fy - frame.cy) * (0.5 / frame.hw)
  };
}

canvas.addEventListener('pointermove', (ev) => {
  const p = toComp(ev);
  ptr.x = p.x; ptr.y = p.y; ptr.inside = true;
  touch();
  if (dragDisc) {
    dragDisc.tx = p.x + grab.x;
    dragDisc.ty = p.y + grab.y;
    dragDisc.hx = dragDisc.tx; dragDisc.hy = dragDisc.ty;
  } else {
    hoverDisc = pick(discs, p.x, p.y);
  }
  if (pinch.active) updatePinch(ev);
});

canvas.addEventListener('pointerleave', () => { ptr.inside = false; hoverDisc = null; });

canvas.addEventListener('pointerdown', (ev) => {
  const p = toComp(ev);
  ptr.x = p.x; ptr.y = p.y;
  touch();
  if (ev.button === 2 || ev.altKey || ev.metaKey || ev.shiftKey) {
    removeDisc(pick(discs, p.x, p.y));
    return;
  }
  if (ev.button !== 0) return;
  canvas.setPointerCapture(ev.pointerId);
  pinch.ids.set(ev.pointerId, p);
  if (pinch.ids.size === 2) { startPinch(); return; }
  const d = pick(discs, p.x, p.y);
  if (!d) return;
  dragDisc = d;
  ptr.down = true;
  grab.x = d.x - p.x;
  grab.y = d.y - p.y;
});

function endPointer(ev) {
  pinch.ids.delete(ev.pointerId);
  if (pinch.ids.size < 2) pinch.active = false;
  if (dragDisc) {
    // let it slide on a little past the release, then settle
    dragDisc.hx = dragDisc.x + dragDisc.vx * 0.13;
    dragDisc.hy = dragDisc.y + dragDisc.vy * 0.13;
    anchor(dragDisc);
  }
  dragDisc = null;
  ptr.down = false;
  touch();
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

canvas.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  const p = toComp(ev);
  removeDisc(pick(discs, p.x, p.y));
  touch();
});

canvas.addEventListener('dblclick', (ev) => {
  const p = toComp(ev);
  addDisc(p.x, p.y);
  touch();
});

canvas.addEventListener('wheel', (ev) => {
  const p = toComp(ev);
  const d = pick(discs, p.x, p.y);
  touch();
  if (!d) return;
  ev.preventDefault();
  const k = ev.ctrlKey ? 0.010 : 0.0016;   // trackpad pinch sends wheel with ctrl
  d.tr = Math.min(0.44, Math.max(0.045, d.tr * Math.exp(-ev.deltaY * k)));
}, { passive: false });

// two finger pinch on touch
const pinch = { ids: new Map(), active: false, disc: null, d0: 1, r0: 1 };
function startPinch() {
  const pts = [...pinch.ids.values()];
  const mx = (pts[0].x + pts[1].x) * 0.5, my = (pts[0].y + pts[1].y) * 0.5;
  const d = pick(discs, mx, my);
  if (!d) return;
  pinch.active = true;
  pinch.disc = d;
  pinch.d0 = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1e-4;
  pinch.r0 = d.tr;
  dragDisc = null;
}
function updatePinch(ev) {
  if (!pinch.ids.has(ev.pointerId)) return;
  pinch.ids.set(ev.pointerId, toComp(ev));
  const pts = [...pinch.ids.values()];
  if (pts.length < 2 || !pinch.disc || pinch.disc.dead) return;
  const dd = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1e-4;
  pinch.disc.tr = Math.min(0.44, Math.max(0.045, pinch.r0 * (dd / pinch.d0)));
}

window.addEventListener('keydown', (ev) => {
  if (ev.target && ev.target.tagName === 'INPUT') return;
  const k = ev.key.toLowerCase();
  if (k === 'r') { reshuffle(); }
  else if (k === 'h') { togglePanel(); }
});

// ---------------------------------------------------------------- the panel

const panel = document.getElementById('panel');
const hint = document.getElementById('hint');

const CONTROLS = [
  ['sheet opacity', 'opacity', 0.02, 0.32, 0.002],
  ['tint spread', 'tintSpread', 0, 1.6, 0.01],
  ['fibre', 'fibre', 0, 1.4, 0.01],
  ['edge', 'edge', 0, 0.26, 0.002],
  ['sheen', 'sheen', 0, 1.6, 0.01],
  ['grain', 'grain', 0, 1.5, 0.01],
  ['vignette', 'vignette', 0, 1, 0.01],
  ['defocus', 'defocus', 0, 1.6, 0.01],
  ['drift', 'drift', 0, 3, 0.01],
  ['sheets', 'count', 1, CAP, 1]
];

const outs = {};
for (const [label, key, lo, hi, step] of CONTROLS) {
  const row = document.createElement('label');
  row.className = 'row';
  const nm = document.createElement('span');
  nm.textContent = label;
  const val = document.createElement('b');
  val.textContent = fmt(P[key], step);
  const inp = document.createElement('input');
  inp.type = 'range';
  inp.min = lo; inp.max = hi; inp.step = step; inp.value = P[key];
  outs[key] = val;
  inp.addEventListener('input', () => {
    const v = parseFloat(inp.value);
    val.textContent = fmt(v, step);
    if (key === 'count') setCount(Math.round(v));
    else P[key] = v;
    touch();
  });
  row.append(nm, val, inp);
  panel.appendChild(row);
  if (key === 'count') outs.countInput = inp;
}

const note = document.createElement('p');
note.className = 'note';
note.innerHTML = '<b>double click</b> adds a sheet, <b>right click</b> removes one. '
  + '<b>r</b> reshuffles, <b>h</b> hides this. '
  + '<span id="countOut">11 of 24</span> sheets, and 24 is all the uniform array holds.';
panel.appendChild(note);
const countOut = document.getElementById('countOut');

function fmt(v, step) { return step >= 1 ? String(Math.round(v)) : v.toFixed(step < 0.005 ? 3 : 2); }

function syncCount() {
  if (outs.countInput) {
    outs.countInput.value = P.count;
    outs.count.textContent = String(P.count);
  }
  if (countOut) countOut.textContent = P.count + ' of ' + CAP;
}

function togglePanel() {
  panel.classList.toggle('open');
}
document.getElementById('toggle').addEventListener('click', (ev) => { ev.preventDefault(); togglePanel(); });

function setCount(n) {
  n = Math.max(1, Math.min(CAP, n));
  const live = discs.filter((d) => !d.dead);
  if (n > live.length) {
    const specs = layout(n, mulberry(Math.floor(rnd() * 1e9)), aspectH);
    for (let i = live.length; i < n; i++) addDisc(specs[i % specs.length].x, specs[i % specs.length].y);
  } else if (n < live.length) {
    for (let i = live.length - 1; i >= n; i--) removeDisc(live[i]);
  }
  P.count = n;
  syncCount();
}

syncCount();

// the hint retires once she has actually touched the piece
let hintGone = false;
function retireHint() {
  if (hintGone) return;
  hintGone = true;
  hint.classList.add('gone');
}

// -------------------------------------------------------------- disc update

function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function step(dt) {
  const idle = now - lastInput;
  const wantDrift = idle > IDLE_DELAY ? 1 : 0;
  driftAmt += (wantDrift - driftAmt) * (1 - Math.exp(-dt / (wantDrift ? 1.6 : 0.25)));

  if (shuffle) {
    shuffle.t += dt;
    const u = Math.min(1, shuffle.t / shuffle.dur);
    const e = easeInOut(u);
    for (let i = 0; i < shuffle.live.length; i++) {
      const d = shuffle.live[i], a = shuffle.from[i], b = shuffle.to[i % shuffle.to.length];
      d.x = a.x + (b.x - a.x) * e;
      d.y = a.y + (b.y - a.y) * e;
      d.r = a.r + (b.r - a.r) * e;
      d.tr = d.r;
      d.rot = a.rot + (b.rot - a.rot) * e;
      for (let c = 0; c < 3; c++) d.tint[c] = a.tint[c] + (b.tint[c] - a.tint[c]) * e;
      d.vx = 0; d.vy = 0;
      d.hx = d.x; d.hy = d.y; d.tx = d.x; d.ty = d.y;
      anchor(d);
    }
    if (u >= 1) shuffle = null;
  }

  const k = 58, c = 2 * Math.sqrt(58) * 0.95;
  const driftSpeed = 0.0042 * P.drift;

  for (let i = discs.length - 1; i >= 0; i--) {
    const d = discs[i];

    // fade in and out
    d.alive += (d.aliveT - d.alive) * (1 - Math.exp(-dt / (d.aliveT > 0 ? 0.34 : 0.30)));
    if (d.dead && d.alive < 0.004) { discs.splice(i, 1); continue; }

    // hover emphasis
    d.emphT = (d === hoverDisc && !d.dead) ? 1 : 0;
    d.emph += (d.emphT - d.emph) * (1 - Math.exp(-dt / 0.22));

    if (!shuffle) {
      if (d !== dragDisc) {
        // idle wander on a slowly turning heading, with a weak pull back to the anchor
        d.driftAng += dt * 0.085 * (0.55 + (d.seed % 1)) * P.drift;
        d.hx += Math.cos(d.driftAng) * driftSpeed * dt * driftAmt;
        d.hy += Math.sin(d.driftAng) * driftSpeed * dt * driftAmt;
        d.hx += (d.ax - d.hx) * 0.10 * dt;
        d.hy += (d.ay - d.hy) * 0.10 * dt;
        d.tx = d.hx; d.ty = d.hy;
      }
      // critically damped spring, so it lags and settles instead of sticking to the cursor
      d.vx += ((d.tx - d.x) * k - d.vx * c) * dt;
      d.vy += ((d.ty - d.y) * k - d.vy * c) * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.r += (d.tr - d.r) * (1 - Math.exp(-dt * 9));
      d.rot += d.rotV * dt * (0.22 + 0.78 * driftAmt) * P.drift;
    }
  }

  // the light follows the pointer, and drifts on its own when nothing is there
  let lx, ly;
  if (ptr.inside) { lx = ptr.x; ly = ptr.y; }
  else { lx = Math.cos(now * 0.13) * 0.42; ly = Math.sin(now * 0.09) * 0.42; }
  light.x += (lx - light.x) * (1 - Math.exp(-dt * 3.4));
  light.y += (ly - light.y) * (1 - Math.exp(-dt * 3.4));
}

// ------------------------------------------------------------------- render

const D0 = new Float32Array(MAX_DISCS * 4);
const D1 = new Float32Array(MAX_DISCS * 4);
const D2 = new Float32Array(MAX_DISCS * 4);

function pack() {
  const n = Math.min(discs.length, MAX_DISCS);
  for (let i = 0; i < n; i++) {
    const d = discs[i], o = i * 4;
    D0[o] = d.x; D0[o + 1] = d.y; D0[o + 2] = d.r * (0.86 + 0.14 * d.alive); D0[o + 3] = d.rot;
    D1[o] = d.tint[0]; D1[o + 1] = d.tint[1]; D1[o + 2] = d.tint[2]; D1[o + 3] = d.op;
    D2[o] = d.seed; D2[o + 1] = d.emph; D2[o + 2] = d.alive; D2[o + 3] = 0;
  }
  return n;
}

function draw() {
  if (!scene.ok || !post.ok || !target || !target.ok) return;
  const n = pack();

  gl.bindVertexArray(vao);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  // pass one: the sheets, in linear light, into the offscreen target
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
  gl.viewport(0, 0, W, H);
  gl.useProgram(scene.program);
  gl.uniform4f(uScene.uFrame, frame.cx, frame.cy, frame.hw, frame.hh);
  gl.uniform1i(uScene.uCount, n);
  gl.uniform4fv(uScene.uD0, D0);
  gl.uniform4fv(uScene.uD1, D1);
  gl.uniform4fv(uScene.uD2, D2);
  gl.uniform1f(uScene.uOpacity, P.opacity);
  gl.uniform1f(uScene.uTintSpread, P.tintSpread);
  gl.uniform1f(uScene.uFibre, P.fibre);
  gl.uniform1f(uScene.uEdge, P.edge);
  gl.uniform1f(uScene.uSheen, P.sheen);
  gl.uniform2f(uScene.uLight, light.x, light.y);
  gl.uniform1f(uScene.uEncode, target.encode);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // pass two: defocus, chroma, vignette, tonemap, grain
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, W, H);
  gl.useProgram(post.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, target.tex);
  gl.uniform1i(uPost.uTex, 0);
  gl.uniform2f(uPost.uRes, W, H);
  gl.uniform4f(uPost.uFrame, frame.cx, frame.cy, frame.hw, frame.hh);
  gl.uniform1f(uPost.uVignette, P.vignette);
  gl.uniform1f(uPost.uGrain, P.grain);
  gl.uniform1f(uPost.uDefocus, P.defocus);
  gl.uniform1f(uPost.uChroma, P.chroma);
  gl.uniform1f(uPost.uEncode, target.encode);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ?still holds a single settled frame, for headless capture
const STILL = new URLSearchParams(location.search).has('still');

let prev = performance.now() / 1000;
function loop(ms) {
  now = ms / 1000;
  const dt = Math.min(1 / 30, Math.max(1 / 480, now - prev));
  prev = now;
  step(dt);
  draw();
  requestAnimationFrame(loop);
}

resize();
lastInput = -999;

if (STILL) {
  now = 0;
  for (let i = 0; i < 40; i++) { now += 1 / 60; step(1 / 60); }
  ptr.inside = true; ptr.x = -0.18; ptr.y = 0.24;
  light.x = ptr.x; light.y = ptr.y;
  draw();
  // headless self check: sample the middle of the frame so a black render is loud
  const px = new Uint8Array(4);
  gl.readPixels((W >> 1), (H >> 1), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  document.documentElement.setAttribute('data-still',
    `ready n=${discs.length} W=${W} H=${H} frame=${frame.hw.toFixed(0)}x${frame.hh.toFixed(0)} ` +
    `target=${target && target.ok} enc=${target && target.encode} centre=${px[0]},${px[1]},${px[2]} ` +
    `rect=${(() => { const b = canvas.getBoundingClientRect();
      return [b.left, b.top, b.width, b.height].map((v) => Math.round(v)).join(','); })()}`);
  // headless compositing does not always pick up the gl surface, so hand the
  // pixels over directly. preserveDrawingBuffer keeps them readable.
  const dump = document.createElement('script');
  dump.type = 'text/plain';
  dump.id = 'shot';
  dump.textContent = canvas.toDataURL('image/png');
  document.body.appendChild(dump);

  // geometry too, so the accumulation ladder can be measured off the render
  // rather than guessed at by eye
  const geom = document.createElement('script');
  geom.type = 'text/plain';
  geom.id = 'geom';
  geom.textContent = JSON.stringify({
    W, H, frame,
    discs: discs.map((d) => ({ x: d.x, y: d.y, r: d.r }))
  });
  document.body.appendChild(geom);
} else {
  requestAnimationFrame(loop);
  // one render right away so nothing ever shows an empty canvas
  step(0.016);
  draw();
}

window.vellum = { P, discs, draw, step, scene, post, gl, get target() { return target; }, get frame() { return frame; } };
