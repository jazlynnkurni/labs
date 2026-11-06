/* ascii.js: the shared plumbing for the ASCII nature scenes.
   a character grid drawn from a glyph atlas onto a layer canvas,
   stamped onto the page at cell offsets so every glyph wears a square
   halo, plus noise, a pixel helper and Matter.js particles.           */
(() => {
'use strict';
const GLYPHS = " .,:;-=+*#%@~^'\"/\\|()oO0[]{}<>vVAwW_`";
const S = { W: 0, H: 0, DPR: 1, COLS: 0, ROWS: 0, CW: 8, CH: 13, BG: '#171717', t: 0, halo: [0.18, 0.06] };
let canvas, ctx, layer, lctx, atlas, atlasX = {};

function buildAtlas() {
  atlas = document.createElement('canvas');
  atlas.width = GLYPHS.length * S.CW * S.DPR; atlas.height = S.CH * S.DPR;
  const a = atlas.getContext('2d');
  a.scale(S.DPR, S.DPR);
  a.fillStyle = '#fff';
  a.font = `500 ${Math.round(S.CH * 0.92)}px ui-monospace, "SF Mono", Menlo, monospace`;
  a.textBaseline = 'middle'; a.textAlign = 'center';
  for (let i = 0; i < GLYPHS.length; i++) { atlasX[GLYPHS[i]] = i * S.CW; a.fillText(GLYPHS[i], i * S.CW + S.CW / 2, S.CH / 2 + 0.5); }
}
function glyphOn(c, ch, x, y, alpha) {
  if (ch === ' ' || !(alpha > 0.02) || atlasX[ch] === undefined) return;
  c.globalAlpha = Math.min(1, alpha);
  c.drawImage(atlas, atlasX[ch] * S.DPR, 0, S.CW * S.DPR, S.CH * S.DPR, x, y, S.CW, S.CH);
}
const A = {
  S,
  // noise
  fract: v => v - Math.floor(v),
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  hash2: (i, j) => A.fract(Math.sin(i * 127.1 + j * 311.7) * 43758.5453),
  hash3: (i, j, k) => A.fract(Math.sin(i * 12.9898 + j * 78.233 + k * 37.719) * 43758.5453),
  vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    let fx = x - xi, fy = y - yi;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const a = A.hash2(xi, yi), b = A.hash2(xi + 1, yi), c = A.hash2(xi, yi + 1), d = A.hash2(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  },
  fbm: (x, y) => 0.55 * A.vnoise(x, y) + 0.3 * A.vnoise(x * 2.1 + 7, y * 2.1 + 3) + 0.15 * A.vnoise(x * 4.3 + 1, y * 4.3 + 9),
  rnd: Math.random,
  // drawing onto the glyph layer
  glyph: (ch, x, y, a) => glyphOn(lctx, ch, x, y, a),
  cell: (i, r, ch, a) => glyphOn(lctx, ch, i * S.CW, r * S.CH, a),
  cellPx(i, r, a, size = 4) { lctx.globalAlpha = Math.min(1, a); lctx.fillStyle = '#fff'; lctx.fillRect(i * S.CW + (S.CW - size) / 2, r * S.CH + (S.CH - size) / 2, size, size); },
  rect(x, y, w, h, a) { lctx.globalAlpha = Math.min(1, a); lctx.fillStyle = '#fff'; lctx.fillRect(x, y, w, h); },
  // drawing onto the page, above the halo: crisp pixels
  px(x, y, s, a) {
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.25 * a; ctx.fillRect(Math.round(x) - s / 2 - 2, Math.round(y) - s / 2 - 2, s + 4, s + 4);
    ctx.globalAlpha = a; ctx.fillRect(Math.round(x) - s / 2, Math.round(y) - s / 2, s, s);
    ctx.globalAlpha = 1;
  },
  ctx: () => ctx,
  // a canvas drawn straight onto the page, crisp, under the glyph layer
  blit(img, x, y, w, h, a = 1) { ctx.imageSmoothingEnabled = false; ctx.globalAlpha = a; ctx.drawImage(img, x, y, w, h); ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true; },
  // ramps
  RAMP: " .,:;-=+*#%@",
  ramp(b, n) { const r = A.RAMP; const i = Math.floor(A.clamp(b, 0, 0.999) * r.length + (n === undefined ? 0 : (n - 0.5) * 1.2)); return r[A.clamp(i, 0, r.length - 1)]; },

  /* Matter.js particles: pixel squares with gravity, drag and a lifetime */
  particles(opts = {}) {
    const M = window.Matter;
    const list = [];
    let engine = null, world = null;
    if (M) { engine = M.Engine.create(); world = engine.world; engine.gravity.y = opts.gravity === undefined ? 1 : opts.gravity; }
    const P = {
      list, engine,
      add(x, y, vx, vy, o = {}) {
        if (!M) return null;
        const size = o.size || (A.rnd() < 0.3 ? 4 : 3);
        const b = M.Bodies.rectangle(x, y, size, size, { frictionAir: o.drag === undefined ? 0.03 : o.drag, density: 0.0008, collisionFilter: { group: -2 } });
        M.Body.setVelocity(b, { x: vx, y: vy });
        b.size = size; b.age = 0; b.life = o.life || (1.2 + A.rnd() * 1.2); b.data = o.data;
        M.Composite.add(world, b); list.push(b);
        return b;
      },
      burst(x, y, n, power, spread, o) { for (let i = 0; i < n; i++) P.add(x + (A.rnd() - 0.5) * 8, y, (A.rnd() - 0.5) * spread, -(power * (0.5 + A.rnd())), o); },
      addStatic(verts) { if (!M) return; const c = M.Vertices.centre(verts); M.Composite.add(world, M.Bodies.fromVertices(c.x, c.y, [verts], { isStatic: true, friction: 0.5, restitution: 0.2 })); },
      update(dt, kill, force) {
        if (!M) return;
        if (force) for (const b of list) { const f = force(b, dt); if (f) M.Body.applyForce(b, b.position, f); }
        M.Engine.update(engine, 1000 / 60);
        for (let i = list.length - 1; i >= 0; i--) {
          const b = list[i]; b.age += dt;
          const p = b.position;
          if (b.age > b.life || p.y > S.H + 40 || p.y < -60 || p.x < -40 || p.x > S.W + 40 || (kill && kill(b))) { M.Composite.remove(world, b); list.splice(i, 1); }
        }
      },
      draw(fadeTime = 0.5) {
        for (const b of list) {
          const k = b.age > b.life - fadeTime ? (b.life - b.age) / fadeTime : 1;
          A.px(b.position.x, b.position.y, b.size, Math.max(0, k));
        }
      }
    };
    return P;
  },

  /* run a scene: { setup(S), update(dt, t, S), draw(t, S), overlay(t, S) } */
  start(scene) {
    canvas = document.getElementById('c'); ctx = canvas.getContext('2d');
    layer = document.createElement('canvas'); lctx = layer.getContext('2d');
    if (scene.cw) S.CW = scene.cw; if (scene.ch) S.CH = scene.ch; if (scene.bg) S.BG = scene.bg; if (scene.halo) S.halo = scene.halo;
    document.body.style.background = S.BG;
    function setup() {
      S.DPR = Math.min(2, devicePixelRatio || 1);
      S.W = innerWidth; S.H = innerHeight;
      for (const c of [canvas, layer]) { c.width = S.W * S.DPR; c.height = S.H * S.DPR; }
      ctx.setTransform(S.DPR, 0, 0, S.DPR, 0, 0); lctx.setTransform(S.DPR, 0, 0, S.DPR, 0, 0);
      S.COLS = Math.ceil(S.W / S.CW); S.ROWS = Math.ceil(S.H / S.CH);
      buildAtlas();
      scene.setup && scene.setup(S);
    }
    function halo() {
      const { CW, CH, W, H } = S;
      ctx.globalAlpha = S.halo[0];
      for (const [dx, dy] of [[CW, 0], [-CW, 0], [0, CH], [0, -CH], [CW, CH], [-CW, CH], [CW, -CH], [-CW, -CH]]) ctx.drawImage(layer, dx, dy, W, H);
      ctx.globalAlpha = S.halo[1];
      for (const [dx, dy] of [[2 * CW, 0], [-2 * CW, 0], [0, 2 * CH], [0, -2 * CH], [2 * CW, CH], [-2 * CW, -CH], [CW, 2 * CH], [-CW, -2 * CH]]) ctx.drawImage(layer, dx, dy, W, H);
      ctx.globalAlpha = 1;
      ctx.drawImage(layer, 0, 0, W, H);
    }
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; S.t += dt;
      scene.update && scene.update(dt, S.t, S);
      ctx.globalAlpha = 1; ctx.fillStyle = S.BG; ctx.fillRect(0, 0, S.W, S.H);
      scene.before && scene.before(S.t, S);
      lctx.clearRect(0, 0, S.W, S.H);
      scene.draw(S.t, S);
      halo();
      scene.overlay && scene.overlay(S.t, S);
      requestAnimationFrame(frame);
    }
    setup();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(setup, 200); });
    requestAnimationFrame(frame);
  }
};
window.ASCII = A;
})();
