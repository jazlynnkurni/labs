// ink lab.
// stage 1 makes a painting move like wind is going through it.
// stage 2 prints that moving frame onto damp paper.
// everything renders into half float targets in linear light and is tonemapped
// and gamma encoded exactly once, in the last pass.

(() => {
'use strict';

const P = UI.P;

// Debug hooks, because this piece is all slow motion and a screenshot lands
// wherever it lands:
//   ?inkMix=0      any numeric param by name, so stages can be isolated
//   ?t=3.5         hold the clock at that many seconds instead of running
const Q = new URLSearchParams(location.search);
const FIXED_T = Q.has('t') ? Number(Q.get('t')) : null;
for (const [k, v] of Q) {
  if (k === 't') continue;
  if (!(k in P)) continue;
  P[k] = typeof P[k] === 'number' ? Number(v) : v;
}
const canvas = document.getElementById('gl');
const errBox = document.getElementById('err');
const statEl = document.getElementById('stat');

// --------------------------------------------------------------- error overlay
let errShown = false;
function report(title, log, source) {
  let out = title + '\n' + ((log || '').trim() || 'no log returned by the driver') + '\n';
  if (source) {
    const lines = source.split('\n');
    const bad = {};
    const re = /ERROR:\s*\d+:(\d+)/g;
    let m;
    while ((m = re.exec(log || '')) !== null) bad[parseInt(m[1], 10)] = true;
    const keys = Object.keys(bad).map(Number);
    const windows = keys.length ? keys.map(n => [Math.max(1, n - 6), Math.min(lines.length, n + 6)])
                                : [[1, Math.min(lines.length, 40)]];
    const seen = {};
    out += '\n';
    windows.forEach(([a, b]) => {
      for (let i = a; i <= b; i++) {
        if (seen[i]) continue;
        seen[i] = true;
        out += (bad[i] ? '>>> ' : '    ') + String(i).padStart(4, ' ') + ' | ' + lines[i - 1] + '\n';
      }
      out += '\n';
    });
    out += 'those line numbers count the composed shader, the version line is 1.\n';
  }
  errBox.textContent += (errBox.textContent ? '\n' : '') + out;
  errBox.classList.add('on');
  errShown = true;
}
window.addEventListener('error', e => {
  report('javascript', (e.message || 'error') + '\n' + (e.filename || '') + ':' + (e.lineno || 0), null);
});

// ------------------------------------------------------------------- gl set up
const gl = canvas.getContext('webgl2', {
  antialias: false, alpha: false, depth: false, stencil: false,
  premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance'
});
if (!gl) {
  report('webgl2', 'this browser did not give a webgl2 context. the lab needs webgl2.', null);
  return;
}
const floatRender = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
const HALF_FLOAT = 0x140B;
const FMT = floatRender
  ? { internal: gl.RGBA16F, format: gl.RGBA, type: HALF_FLOAT }
  : { internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE };

function compile(type, src, label) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    report(label + ' did not compile', gl.getShaderInfoLog(s), src);
    gl.deleteShader(s);
    return null;
  }
  return s;
}
function makeProgram(name, fsSrc) {
  const vs = compile(gl.VERTEX_SHADER, SH.VERT, name + ' vertex');
  const fs = compile(gl.FRAGMENT_SHADER, fsSrc, name + ' fragment');
  if (!vs || !fs) return null;
  const id = gl.createProgram();
  gl.attachShader(id, vs);
  gl.attachShader(id, fs);
  gl.linkProgram(id);
  if (!gl.getProgramParameter(id, gl.LINK_STATUS)) {
    report(name + ' did not link', gl.getProgramInfoLog(id), fsSrc);
    return null;
  }
  const loc = {};
  const n = gl.getProgramParameter(id, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(id, i);
    const nm = info.name.replace(/\[0\]$/, '');
    loc[nm] = gl.getUniformLocation(id, nm);
  }
  return { name, id, loc, unit: 0 };
}

const PROG = {
  scene: makeProgram('scene', SH.SCENE),
  gust: makeProgram('gust', SH.GUST),
  motion: makeProgram('motion', SH.MOTION),
  wash: makeProgram('wash', SH.WASH),
  bleed1: makeProgram('bleed pass one', SH.frag(SH.BLUR, '#define PASS_FIRST\n')),
  bleed2: makeProgram('bleed pass two', SH.frag(SH.BLUR, '')),
  halo1: makeProgram('halation pass one', SH.frag(SH.BLUR, '#define MODE_HALO\n#define PASS_FIRST\n')),
  halo2: makeProgram('halation pass two', SH.frag(SH.BLUR, '#define MODE_HALO\n')),
  print: makeProgram('print', SH.PRINT)
};
if (Object.keys(PROG).some(k => !PROG[k])) return;

// one fullscreen triangle, attribute 0, bound by a layout qualifier in the shader
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
gl.disable(gl.DEPTH_TEST);
gl.disable(gl.BLEND);

let cur = null;
function use(p) {
  cur = p;
  p.unit = 0;
  gl.useProgram(p.id);
}
function f(name, ...v) {
  const l = cur.loc[name];
  if (l === undefined || l === null) return;   // driver dropped an unused uniform
  if (v.length === 1) gl.uniform1f(l, v[0]);
  else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
  else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
  else gl.uniform4f(l, v[0], v[1], v[2], v[3]);
}
function i1(name, v) {
  const l = cur.loc[name];
  if (l === undefined || l === null) return;
  gl.uniform1i(l, v);
}
function tex(name, texture) {
  const l = cur.loc[name];
  if (l === undefined || l === null) return;
  const unit = cur.unit++;
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(l, unit);
}
function target(t) {
  if (t) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
    gl.viewport(0, 0, t.w, t.h);
  } else {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
}
function draw() { gl.drawArrays(gl.TRIANGLES, 0, 3); }

function makeTarget(w, h, fmt, filter) {
  w = Math.max(1, w | 0); h = Math.max(1, h | 0);
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internal, w, h, 0, fmt.format, fmt.type, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (st !== gl.FRAMEBUFFER_COMPLETE && !errShown) {
    report('framebuffer', 'a render target of ' + w + ' by ' + h + ' came back incomplete, status ' + st +
      (floatRender ? '' : '\nthis device has no float colour buffers, so the lab fell back to 8 bit targets.'), null);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex: t, fb, w, h };
}
function dropTarget(t) {
  if (!t) return;
  gl.deleteTexture(t.tex);
  gl.deleteFramebuffer(t.fb);
}

const RGBA8 = { internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE };

// ------------------------------------------------------------------- resources
let T = {};
let maskA = null, maskB = null;     // painting space, always linear filtered
let maskFboA = null, maskFboB = null;
let imageTex = null;
let hasImage = 0;
let aspect = 0.62;                  // the fallback painting is a tall portrait
let oceanBand = [0.30, 0.445];
let rect = [0, 0, 1, 1];
let sourceName = 'procedural';

function newMaskTex() {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
maskA = newMaskTex();
maskB = newMaskTex();

// a one pixel stand in so the scene program always has something bound to uImage
imageTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, imageTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

// the wordmark is drawn on a 2d canvas and then joins the ink field, so the
// letters bleed into the sheet exactly like the painting does
const wordCanvas = document.createElement('canvas');
wordCanvas.width = 1024;
wordCanvas.height = 384;
const wordTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, wordTex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

function drawWordmark() {
  const c2 = wordCanvas.getContext('2d');
  c2.clearRect(0, 0, wordCanvas.width, wordCanvas.height);
  const t = (P.wordText || '').trim();
  if (t) {
    const stack = '"Snell Roundhand", "Apple Chancery", "Brush Script MT", "Segoe Script", "Palatino Linotype", Georgia, serif';
    let size = 300;
    c2.textAlign = 'center';
    c2.textBaseline = 'middle';
    c2.fillStyle = '#ffffff';
    c2.font = 'italic ' + size + 'px ' + stack;
    const maxW = wordCanvas.width * 0.88;
    const m = c2.measureText(t).width;
    if (m > maxW) {
      size = Math.max(24, size * maxW / m);
      c2.font = 'italic ' + size + 'px ' + stack;
    }
    c2.fillText(t, wordCanvas.width / 2, wordCanvas.height * 0.56);
  }
  gl.bindTexture(gl.TEXTURE_2D, wordTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, wordCanvas);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
}

// ---------------------------------------------------------------- sizing
const MAX_PIXELS = 2.6e6;
let W = 1, H = 1;

function resize() {
  const cssW = Math.max(1, canvas.clientWidth);
  const cssH = Math.max(1, canvas.clientHeight);
  let dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = Math.round(cssW * dpr);
  let h = Math.round(cssH * dpr);
  const over = (w * h) / MAX_PIXELS;
  if (over > 1) {
    const k = 1 / Math.sqrt(over);
    w = Math.round(w * k);
    h = Math.round(h * k);
  }
  if (w === W && h === H) return false;
  W = w; H = h;
  canvas.width = W;
  canvas.height = H;

  ['src', 'live', 'wash', 'bleed1', 'bleed2', 'halo1', 'halo2'].forEach(k => dropTarget(T[k]));
  const hw = Math.max(1, Math.ceil(W / 2)), hh = Math.max(1, Math.ceil(H / 2));
  const qw = Math.max(1, Math.ceil(W / 4)), qh = Math.max(1, Math.ceil(H / 4));
  T.src = makeTarget(W, H, FMT, gl.LINEAR);
  T.live = makeTarget(W, H, FMT, gl.LINEAR);
  T.wash = makeTarget(W, H, FMT, gl.LINEAR);
  T.bleed1 = makeTarget(hw, hh, FMT, gl.LINEAR);
  T.bleed2 = makeTarget(hw, hh, FMT, gl.LINEAR);
  T.halo1 = makeTarget(qw, qh, FMT, gl.LINEAR);
  T.halo2 = makeTarget(qw, qh, FMT, gl.LINEAR);

  if (!T.gust1) {
    const gw = 160, gh = 224;
    T.gust1 = makeTarget(gw, gh, FMT, gl.LINEAR);
    T.gust2 = makeTarget(gw, gh, FMT, gl.LINEAR);
    gl.clearColor(0, 0, 0, 1);
    [T.gust1, T.gust2].forEach(t => { target(t); gl.clear(gl.COLOR_BUFFER_BIT); });
  }
  layout();
  return true;
}

// the painting is a tall portrait, so it is letterboxed and the paper ground
// fills whatever is left, which is what reference A does anyway
function setAspect(a) {
  aspect = a;
}

function layout() {
  const margin = Math.min(W, H) < 640 ? 0.045 : 0.065;
  const availW = W * (1 - margin * 2);
  const availH = H * (1 - margin * 2);
  let pw = availW;
  let ph = pw / aspect;
  if (ph > availH) { ph = availH; pw = ph * aspect; }
  rect = [(W - pw) / 2 / W, (H - ph) / 2 / H, (W + pw) / 2 / W, (H + ph) / 2 / H];
  renderSource();
}

function blockRect() {
  const w0 = rect[2] - rect[0], h0 = rect[3] - rect[1];
  const bw = P.blockSize * w0;
  const bh = P.blockSize * 0.82 * h0;
  const x0 = rect[0] - 0.045 * w0;
  const y1 = rect[3] + 0.035 * h0;
  return [x0, y1 - bh, x0 + bw, y1];
}
function wordRect() {
  const w0 = rect[2] - rect[0], h0 = rect[3] - rect[1];
  const ww = Math.min(1.0, P.wordSize) * w0 * 0.95;
  const wh = ww * (wordCanvas.height / wordCanvas.width);
  const x0 = rect[0] + 0.02 * w0;
  const y1 = rect[3] - 0.02 * h0;
  return [x0, y1 - wh, x0 + ww, y1];
}

// ------------------------------------------------- stage 0, draw the source plate
const PAPER = [0.937, 0.914, 0.871];
const INK = [0.129, 0.118, 0.110];
const SALMON = [0.831, 0.588, 0.541];
let seed = [Math.random() * 10, Math.random() * 10];

function renderSource() {
  if (!T.src) return;
  gl.bindVertexArray(vao);
  use(PROG.scene);
  f('uRect', rect[0], rect[1], rect[2], rect[3]);
  f('uPaperCol', PAPER[0], PAPER[1], PAPER[2]);
  f('uPaintSpace', 0);
  f('uHasImage', hasImage);
  f('uSeed', seed[0], seed[1]);
  f('uWaveCount', P.waveCount);
  f('uWaveComp', P.waveComp);
  i1('uMode', 0);
  tex('uImage', imageTex);
  target(T.src);
  draw();

  // the fallback scene knows its own layers, so it writes its own masks
  if (!hasImage) {
    const mw = 384, mh = Math.max(1, Math.round(384 / aspect));
    if (!maskFboA) {
      maskFboA = { fb: gl.createFramebuffer(), w: mw, h: mh };
      maskFboB = { fb: gl.createFramebuffer(), w: mw, h: mh };
    }
    // the mask textures may have been resized by an image that was loaded and
    // then dropped, so give them the fallback size back before attaching
    maskFboA.w = mw; maskFboA.h = mh;
    maskFboB.w = mw; maskFboB.h = mh;
    gl.bindTexture(gl.TEXTURE_2D, maskA);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, mw, mh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, maskB);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, mw, mh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, maskFboA.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, maskA, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, maskFboB.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, maskB, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    use(PROG.scene);
    f('uRect', rect[0], rect[1], rect[2], rect[3]);
    f('uPaperCol', PAPER[0], PAPER[1], PAPER[2]);
    f('uPaintSpace', 1);
    f('uHasImage', 0);
    f('uSeed', seed[0], seed[1]);
    f('uWaveCount', P.waveCount);
    f('uWaveComp', P.waveComp);
    tex('uImage', imageTex);
    i1('uMode', 1);
    target(maskFboA);
    draw();
    i1('uMode', 2);
    target(maskFboB);
    draw();
    oceanBand = [0.30, 0.445];
  }
  target(null);
}

// ------------------------------------------------------------- loading an image
function uploadMasks(res) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, maskA);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, res.a);
  gl.bindTexture(gl.TEXTURE_2D, maskB);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, res.b);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  oceanBand = res.oceanBand;
}

let lastSource = null;
function resegment() {
  if (!lastSource) return;
  try {
    uploadMasks(SEG.segment(lastSource, UI.segOpts()));
  } catch (e) {
    report('segmentation', String(e && e.message || e), null);
  }
}

function adoptImage(bmp, name) {
  // downscale anything enormous, the source plate never needs more than this
  let sw = bmp.width, sh = bmp.height;
  const maxEdge = 2048;
  const k = Math.min(1, maxEdge / Math.max(sw, sh));
  const cw = Math.max(1, Math.round(sw * k)), ch = Math.max(1, Math.round(sh * k));
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  cv.getContext('2d').drawImage(bmp, 0, 0, cw, ch);

  gl.bindTexture(gl.TEXTURE_2D, imageTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  lastSource = cv;
  hasImage = 1;
  sourceName = name || 'image';
  resegment();
  setAspect(cw / ch);
  layout();
}

function loadFile(file) {
  if (!file || !/^image\//.test(file.type)) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { adoptImage(img, file.name); URL.revokeObjectURL(url); };
  img.onerror = () => { URL.revokeObjectURL(url); };
  img.src = url;
}

function tryAutoLoad() {
  const names = ['./source.jpg', './source.png', './source.jpeg', './source.webp'];
  let idx = 0;
  const next = () => {
    if (idx >= names.length) return;
    const n = names[idx++];
    const img = new Image();
    img.onload = () => adoptImage(img, n.replace('./', ''));
    img.onerror = next;   // nothing there, quietly try the next name
    img.src = n;
  };
  next();
}

function useFallback() {
  hasImage = 0;
  lastSource = null;
  sourceName = 'procedural';
  setAspect(0.62);
  layout();
}

// ------------------------------------------------------------------- pointer
let ptr = [0.5, 0.5], ptrVel = [0, 0], ptrActive = 0, ptrDown = false;
let lastPtr = null, lastPtrT = 0;
canvas.addEventListener('pointerdown', e => { ptrDown = true; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointerup', () => { ptrDown = false; });
canvas.addEventListener('pointercancel', () => { ptrDown = false; });
canvas.addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect();
  const u = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
  const now = performance.now();
  if (lastPtr) {
    const dt = Math.max(0.008, (now - lastPtrT) / 1000);
    const vx = (u[0] - lastPtr[0]) / dt, vy = (u[1] - lastPtr[1]) / dt;
    ptrVel = [ptrVel[0] * 0.5 + vx * 0.5, ptrVel[1] * 0.5 + vy * 0.5];
  }
  lastPtr = u; lastPtrT = now;
  ptr = u;
  ptrActive = ptrDown ? 1.0 : 0.35;
});

// -------------------------------------------------------------- drag and drop
['dragenter', 'dragover'].forEach(k => window.addEventListener(k, e => {
  e.preventDefault();
  document.body.classList.add('dragging');
}));
['dragleave', 'dragend'].forEach(k => window.addEventListener(k, e => {
  e.preventDefault();
  if (!e.relatedTarget) document.body.classList.remove('dragging');
}));
window.addEventListener('drop', e => {
  e.preventDefault();
  document.body.classList.remove('dragging');
  const f0 = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f0) loadFile(f0);
});
document.getElementById('file').addEventListener('change', e => {
  if (e.target.files && e.target.files[0]) loadFile(e.target.files[0]);
});

// ------------------------------------------------------------------ the frame
let time = 0, last = performance.now(), fps = 60, frames = 0, fpsT = last;

function frame(now) {
  requestAnimationFrame(frame);
  if (errShown) return;
  let dt = (now - last) / 1000;
  last = now;
  if (!(dt > 0) || dt > 0.1) dt = 1 / 60;
  if (FIXED_T !== null) time = FIXED_T;
  else if (!P.paused) time += dt;
  if (!T.src) return;
  gl.bindVertexArray(vao);

  // the gust field, advected and relaxed
  use(PROG.gust);
  tex('uPrev', T.gust1.tex);
  f('uTime', time);
  f('uDt', P.paused ? 0.0 : dt);
  f('uAmbient', P.ambient);
  f('uRelax', 0.45);
  f('uPush', P.push);
  f('uAspect', W / Math.max(1, H));
  f('uPointer', ptr[0], ptr[1]);
  f('uPointerVel', ptrVel[0], ptrVel[1]);
  f('uPointerActive', ptrActive);
  target(T.gust2);
  draw();
  const g = T.gust1; T.gust1 = T.gust2; T.gust2 = g;
  ptrActive *= 0.90;
  ptrVel = [ptrVel[0] * 0.90, ptrVel[1] * 0.90];

  // stage 1, wind through the painting
  use(PROG.motion);
  tex('uSrc', T.src.tex);
  tex('uMaskA', maskA);
  tex('uMaskB', maskB);
  tex('uGust', T.gust1.tex);
  f('uRect', rect[0], rect[1], rect[2], rect[3]);
  f('uTexel', 1 / W, 1 / H);
  f('uOceanBand', oceanBand[0], oceanBand[1]);
  f('uTime', time);
  f('uGustGain', P.gustGain);
  f('uFoliageAmp', P.foliageAmp);
  f('uFlutterAmp', P.flutterAmp);
  f('uTrunkLag', P.trunkLag);
  f('uFlowerAmp', P.flowerAmp);
  f('uFlowerTwinkle', P.flowerTwinkle);
  f('uWaveAmp', P.waveAmp);
  f('uWavePeriod', P.wavePeriod);
  f('uWaveCount', P.waveCount);
  f('uWaveComp', P.waveComp);
  f('uShimmer', P.shimmer);
  f('uSkyDrift', P.skyDrift);
  f('uTwinkle', P.twinkle);
  target(T.live);
  draw();

  // stage 2 step 1, the tonal wash, with the print furniture joining the ink
  const br = blockRect(), wr = wordRect();
  use(PROG.wash);
  tex('uLive', T.live.tex);
  tex('uWordTex', wordTex);
  f('uTexel', 1 / W, 1 / H);
  f('uBlockRect', br[0], br[1], br[2], br[3]);
  f('uWordRect', wr[0], wr[1], wr[2], wr[3]);
  f('uPaperCol', PAPER[0], PAPER[1], PAPER[2]);
  f('uInkCol', INK[0], INK[1], INK[2]);
  f('uSalmonCol', SALMON[0], SALMON[1], SALMON[2]);
  f('uInkMix', P.inkMix);
  f('uChroma', P.chroma);
  f('uBlackLift', P.blackLift);
  f('uWhiteCrush', P.whiteCrush);
  f('uDuotone', P.duotone);
  f('uBlockShow', P.blockShow);
  f('uBlockReg', P.blockReg);
  f('uWordShow', P.wordShow);
  target(T.wash);
  draw();

  // stage 2 step 2, the spread. the radius on the second axis is divided down
  // because that pass reads a smaller texture, so the blur stays round.
  const rB = Math.max(0.5, P.bleedRadius);
  use(PROG.bleed1);
  tex('uTex', T.wash.tex);
  f('uDir', 1, 0);
  f('uTexel', 1 / W, 1 / H);
  f('uRadius', rB);
  target(T.bleed1);
  draw();
  use(PROG.bleed2);
  tex('uTex', T.bleed1.tex);
  f('uDir', 0, 1);
  f('uTexel', 1 / T.bleed1.w, 1 / T.bleed1.h);
  f('uRadius', rB * 0.5);
  target(T.bleed2);
  draw();

  const rH = Math.max(0.5, P.haloRadius);
  use(PROG.halo1);
  tex('uTex', T.wash.tex);
  f('uDir', 1, 0);
  f('uTexel', 1 / W, 1 / H);
  f('uRadius', rH);
  f('uHaloLo', P.haloLo);
  f('uHaloHi', P.haloHi);
  target(T.halo1);
  draw();
  use(PROG.halo2);
  tex('uTex', T.halo1.tex);
  f('uDir', 0, 1);
  f('uTexel', 1 / T.halo1.w, 1 / T.halo1.h);
  f('uRadius', rH * 0.25);
  target(T.halo2);
  draw();

  // stage 2 steps 3 to 8, onto the sheet
  use(PROG.print);
  tex('uWash', T.wash.tex);
  tex('uBleed', T.bleed2.tex);
  tex('uHalo', T.halo2.tex);
  tex('uMaskA', maskA);
  tex('uMaskB', maskB);
  f('uRect', rect[0], rect[1], rect[2], rect[3]);
  f('uTexel', 1 / W, 1 / H);
  f('uBleedTexel', 1 / T.bleed2.w, 1 / T.bleed2.h);
  f('uPaperCol', PAPER[0], PAPER[1], PAPER[2]);
  f('uInkCol', INK[0], INK[1], INK[2]);
  f('uTime', time);
  f('uReg', P.reg);
  f('uBleedAmount', P.bleedAmount);
  f('uBleedThresh', P.bleedThresh);
  f('uBleedSoft', P.bleedSoft);
  f('uRagged', P.ragged);
  f('uCreep', P.creep);
  f('uRim', P.rim);
  f('uRimWidth', P.rimWidth);
  f('uGranulation', P.granulation);
  f('uHalation', P.halation);
  f('uDarkHalo', P.darkHalo);
  f('uHaloHi', P.haloHi);
  f('uHaloLo', P.haloLo);
  f('uPaperFibre', P.paperFibre);
  f('uDust', P.dust);
  f('uVignette', P.vignette);
  f('uGrain', P.grain);
  f('uExposure', P.exposure);
  f('uDebug', P.debug);
  target(null);
  draw();

  frames++;
  if (now - fpsT > 500) {
    fps = frames * 1000 / (now - fpsT);
    frames = 0; fpsT = now;
    statEl.textContent = sourceName + '  ' + W + 'x' + H + '  ' + fps.toFixed(0) + ' fps' +
      (P.paused ? '  paused' : '') + (P.debug ? '  masks' : '');
  }
}

// ----------------------------------------------------------------------- boot
UI.build();
UI.hooks.onSeg = (() => {
  let t = 0;
  return () => { clearTimeout(t); t = setTimeout(resegment, 120); };
})();
UI.hooks.onWord = (() => {
  let t = 0;
  return () => { clearTimeout(t); t = setTimeout(drawWordmark, 90); };
})();
UI.hooks.onFallback = useFallback;
UI.hooks.onScene = (() => {
  let t = 0;
  return () => { clearTimeout(t); t = setTimeout(renderSource, 70); };
})();

drawWordmark();
setAspect(0.62);
resize();
window.addEventListener('resize', resize);
if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
tryAutoLoad();
requestAnimationFrame(frame);

})();
