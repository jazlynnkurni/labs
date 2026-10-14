import { getContext, buildProgram } from './gl.js';
import { PARAMS } from './params.js';
import { makePanel } from './panel.js';

const MAX_PIXELS = 1_500_000;   // hard cap, so a 6K display does not melt the loop
const MAX_DPR    = 2;

const errBox = document.getElementById('err');

// A black frame and a working frame look identical in a piece this dark, so a
// failure has to shout. Full bleed red over the plate, with the whole log.
function fail(title, body) {
  errBox.textContent = title.toUpperCase() + '\n\n' + (String(body || '').trim() || '(no log returned)');
  errBox.style.display = 'block';
  document.querySelector('.frame')?.style.setProperty('opacity', '0.2');
}

addEventListener('error', (e) => fail('Page error', e.message + '\n' + (e.error?.stack || '')));
addEventListener('unhandledrejection', (e) => fail('Page error', String(e.reason?.stack || e.reason)));

const state = { paused: false };
for (const p of PARAMS) state[p.key] = p.value;

// Headless capture and quick looks: ?t=90 starts ninety seconds in, and any
// parameter key can be overridden the same way.
const qp = new URLSearchParams(location.search);
for (const p of PARAMS) if (qp.has(p.key)) state[p.key] = parseFloat(qp.get(p.key));
const startT = qp.has('t') ? (parseFloat(qp.get('t')) || 0) : 0;

const canvas = document.getElementById('c');
const gl = getContext(canvas);

if (!gl) {
  fail('No WebGL2', 'This browser did not give back a webgl2 context. The piece needs WebGL2.');
} else {
  const built = buildProgram(gl);
  if (!built.ok) {
    fail('Shader did not build', built.log);
  } else {
    if (built.log.trim()) console.warn(built.log);
    run(built.program);
  }
}

function run(program) {
  gl.useProgram(program);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const loc = {};
  const need = ['uRes', 'uT', 'uRot', 'uExposure', 'uPetals', 'uLoopLen', 'uLoopWidth',
                'uStroke', 'uBreathe', 'uSpread', 'uShadow', 'uRayLen', 'uHaze',
                'uHazeH', 'uGrain', 'uTooth', 'uPan'];
  for (const n of need) loc[n] = gl.getUniformLocation(program, n);

  let w = 0, h = 0;
  function resize() {
    const cw = Math.max(1, canvas.clientWidth);
    const ch = Math.max(1, canvas.clientHeight);
    let dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
    let pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
    const total = pw * ph;
    if (total > MAX_PIXELS) {
      const k = Math.sqrt(MAX_PIXELS / total);
      pw = Math.max(1, Math.round(pw * k));
      ph = Math.max(1, Math.round(ph * k));
    }
    if (pw === w && ph === h) return;
    w = pw; h = ph;
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  resize();
  addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

  // Drag moves the drawing and nothing else listens to the pointer. The piece
  // is deliberately inert to a cursor passing over it.
  let panX = 0, panY = 0, dragging = false, grabX = 0, grabY = 0, grabPanX = 0, grabPanY = 0;
  const plateScale = () => Math.min(w / 0.68, h);

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    grabX = e.clientX; grabY = e.clientY;
    grabPanX = panX; grabPanY = panY;
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;              // the only time the pointer means anything
    const k = (devicePixelRatio || 1) / plateScale() * Math.min(devicePixelRatio || 1, MAX_DPR);
    panX = grabPanX + (e.clientX - grabX) * k;
    panY = grabPanY - (e.clientY - grabY) * k;
  });
  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    canvas.style.cursor = 'grab';
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.style.cursor = 'grab';

  const ui = makePanel(state, () => { panX = 0; panY = 0; });

  let artT = startT;   // seconds of art time
  let rot = startT * (Math.PI * 2) / (state.rotRate * 60);
  let last = performance.now();
  let fps = 60, acc = 0;

  function frame(now) {
    const dtReal = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (dtReal > 0) fps += ((1 / dtReal) - fps) * 0.08;

    if (!state.paused) {
      const dt = dtReal * state.timeScale;
      artT += dt;
      rot += dt * (Math.PI * 2) / (state.rotRate * 60);
    }

    acc += dtReal;
    if (acc > 0.4) { acc = 0; ui.stat(fps); }

    resize();
    gl.uniform2f(loc.uRes, w, h);
    gl.uniform1f(loc.uT, artT);
    gl.uniform1f(loc.uRot, rot);
    gl.uniform2f(loc.uPan, panX, panY);
    gl.uniform1f(loc.uExposure, state.exposure);
    gl.uniform1f(loc.uPetals, state.petals);
    gl.uniform1f(loc.uLoopLen, state.loopLen);
    gl.uniform1f(loc.uLoopWidth, state.loopWidth);
    gl.uniform1f(loc.uStroke, state.stroke);
    gl.uniform1f(loc.uBreathe, state.breathe);
    gl.uniform1f(loc.uSpread, state.spread);
    gl.uniform1f(loc.uShadow, state.shadow);
    gl.uniform1f(loc.uRayLen, state.rayLen);
    gl.uniform1f(loc.uHaze, state.haze);
    gl.uniform1f(loc.uHazeH, state.hazeH);
    gl.uniform1f(loc.uGrain, state.grain);
    gl.uniform1f(loc.uTooth, state.tooth);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
