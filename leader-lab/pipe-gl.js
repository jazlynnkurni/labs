/* THE PIPE, IN THE DISCS' OWN MATERIAL. The home page's frosted discs are a shader that shades
   circles; this runs the same shader (copied unchanged from portfolio/public/sheets-gl.js) with
   one change: a sheet may be a capsule, a disc stretched along a segment. Its distance to the rim
   is measured from the nearest point on the segment, so the rim, the sheen and the cut edge are
   the disc's, and the grain is read at the true position so it does not smear along the pipe. */
import { VERT, FRAG_SCENE, FRAG_POST, buildProgram, makeTarget, hexLin, pigment } from './sheets-gl.js';

const UNIT = 650;   /* the discs' composition unit in CSS px, so the fibre is the same size */
const MAXD = 24;
const STYLE = { fibre: 0.35, edge: 0.240, sheen: 0.95, grain: 0.30, feather: 0.0 };   /* frosted glass, cut edge: the discs' style */

const SCENE = FRAG_SCENE
  .replace('vec2 v = p - d0.xy;',
    /* THE BAND BENDS. uBend bows the pipe sideways in its first mode, zero at both ends and most in the
       middle, the shape a plucked rubber band takes. The space is bent, not the pipe re-cut, so the rim,
       sheen and grain all follow the curve. */
    'vec2 vw = p - d0.xy; vec2 v = vw;\n    if (uD2[i].w > 0.0) { vec2 ax = vec2(cos(d0.w), sin(d0.w)), nr = vec2(-ax.y, ax.x);\n      vw -= nr * uBend * cos(1.5707963 * clamp(dot(vw, ax) / uD2[i].w, -1.0, 1.0));\n' +
    /* BY HAND. uHand lets the line wander off true, a slow drift with a finer tremor on it, and makes
       its weight swell and thin along the stroke and taper at both ends the way a pen lifts. It is
       fixed by the seed, so the same line is drawn every time, never animated. */
    '      float al = dot(vw, ax), hs = uD2[i].x;\n' +
    '      if (uHand > 0.0) vw -= nr * uHand * ((vnoise(vec2(al * 11.0 + hs, hs)) - 0.5) * 2.4 + (vnoise(vec2(al * 41.0, hs + 3.0)) - 0.5) * 0.7);\n' +
    '      v = vw - ax * clamp(dot(vw, ax), -uD2[i].w, uD2[i].w);\n' +
    '      if (uHand > 0.0) { float s = abs(clamp(al / uD2[i].w, -1.0, 1.0));\n' +
    '        v /= (0.55 + 0.8 * vnoise(vec2(al * 26.0 + hs * 2.0, 7.0))) * mix(0.45, 1.0, smoothstep(1.0, 0.55, s)); } }')
  .replace('vec2 q = inr * v + vec2(seed', 'vec2 q = inr * vw + vec2(seed')
  .replace('uniform int   uStyle;', 'uniform int   uStyle;\nuniform float uBend, uHand;');

export function mountPipe(cv, opts = {}) {
  const gl = cv.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
  if (!gl) return null;
  const scene = buildProgram(gl, VERT, SCENE, 'pipe'), post = buildProgram(gl, VERT, FRAG_POST, 'post');
  const vao = gl.createVertexArray();
  let W = 0, H = 0, cw = 1, ch = 1, dpr = 1, target = null;
  const D0 = new Float32Array(MAXD * 4), D1 = new Float32Array(MAXD * 4), D2 = new Float32Array(MAXD * 4);
  const light = { x: 0, y: 0.2 };
  const dark = () => document.documentElement.getAttribute('data-theme') !== 'light';
  function size() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    cw = r.width; ch = r.height; W = Math.max(1, Math.round(cw * dpr)); H = Math.max(1, Math.round(ch * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; target = makeTarget(gl, W, H, target); }
  }
  const toU = (x, y) => [(x - cw / 2) / UNIT, (ch / 2 - y) / UNIT];
  /* pipes: [{x0,y0,x1,y1,w,ink,op,seed}] in CSS px of the canvas */
  function draw(pipes, swatch, bend = 0, hand = 0) {
    size(); if (!target || !target.ok) return;
    const d = dark(), n = Math.min(pipes.length, MAXD);
    for (let i = 0; i < n; i++) {
      const p = pipes[i], o = i * 4, [ax, ay] = toU(p.x0, p.y0), [bx, by] = toU(p.x1, p.y1);
      const len = Math.hypot(bx - ax, by - ay), t = hexLin(d ? swatch[p.ink] : pigment(swatch[p.ink]));
      D0[o] = (ax + bx) / 2; D0[o + 1] = (ay + by) / 2; D0[o + 2] = p.w / 2 / UNIT; D0[o + 3] = Math.atan2(by - ay, bx - ax);
      D1[o] = t[0]; D1[o + 1] = t[1]; D1[o + 2] = t[2]; D1[o + 3] = p.op;
      D2[o] = p.seed; D2[o + 1] = p.emph || 0; D2[o + 2] = 1; D2[o + 3] = Math.max(1e-5, len / 2);
    }
    const ground = hexLin(opts.ground), paper = hexLin(opts.paper);
    gl.bindVertexArray(vao); gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); gl.viewport(0, 0, W, H);
    gl.useProgram(scene.program); const u = scene.u;
    gl.uniform4f(u.uFrame, W * 0.5, H * 0.5, UNIT * dpr * 0.5, 0);
    gl.uniform1i(u.uCount, n);
    gl.uniform4fv(u.uD0, D0); gl.uniform4fv(u.uD1, D1); gl.uniform4fv(u.uD2, D2);
    gl.uniform1f(u.uOpacity, d ? 0.115 : 1.15);
    gl.uniform1i(u.uStyle, 2); gl.uniform1f(u.uBend, bend / UNIT); gl.uniform1f(u.uHand, hand / UNIT);
    gl.uniform1f(u.uTintSpread, 1.0); gl.uniform1f(u.uFibre, STYLE.fibre); gl.uniform1f(u.uEdge, STYLE.edge); gl.uniform1f(u.uSheen, STYLE.sheen);
    gl.uniform1f(u.uFeather, STYLE.feather);
    gl.uniform2f(u.uLight, light.x, light.y);
    gl.uniform1f(u.uEncode, target.encode); gl.uniform1f(u.uMode, d ? 0 : 1);
    gl.uniform3f(u.uGround, ground[0], ground[1], ground[2]); gl.uniform3f(u.uPaper, paper[0], paper[1], paper[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(post.program);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, target.tex);
    gl.uniform1i(post.u.uTex, 0); gl.uniform2f(post.u.uRes, W, H); gl.uniform1i(post.u.uStyle, 2);
    gl.uniform1f(post.u.uGrain, 0.0);   /* no scan grain: it would show the canvas as a box; the frost is in the scene */ gl.uniform1f(post.u.uEncode, target.encode); gl.uniform1f(post.u.uMode, d ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  /* the canvas is laid over the page by blending: on black it screens (dark), on white it multiplies (light),
   so only the pipe shows and the page colour under it is untouched */
  /* the light follows the pointer, as it does over the discs */
  function lightAt(x, y) { const [lx, ly] = toU(x, y); light.x += (lx - light.x) * 0.12; light.y += (ly - light.y) * 0.12; }
  return { draw, lightAt, size };
}
