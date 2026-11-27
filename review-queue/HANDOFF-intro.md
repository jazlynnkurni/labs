# Handoff: review queue intro, five directions

Context for the receiving agent
- Adds an onboarding screen to the review queue prototype (Vite and React 19, plain CSS, no new dependencies). Everything lives in src/intro/. The only change outside it is a two line hook in src/main.jsx, shown last.
- Routing: with no param, direction 1 (Stream) plays once per browser session (sessionStorage "review-queue-intro-seen"), then the app opens straight away. ?intro=1 to ?intro=5 forces a direction on every load; ?intro=0 skips the intro.
- Reference: Twelve Labs brand motion. Read frame by frame at 10fps from her screen recording: three rounded capsule tiles hold still in a row and a pastel band (pink, peach, orange, gold, lime, mint, lilac) flows through them left to right at one capsule length every 1.2s, a 4.8s cycle at any point, linear. The pink band veils each front window as it passes. The intro keeps that colour flow, seen head on.
- Rendering (src/intro/shader.js): one WebGL2 context, a full screen triangle, ray marched rounded boxes. The camera faces the middle capsule straight on, level, pitched 24 degrees down so the tops read in 3D; the outer two are mirror images with equal small gaps. Shading keeps the marshmallow luminous: the band at 1.15 saturation, a key light from above and in front over a high ambient so shaded sides keep the band's tint, a white tinted rim screened on so it only brightens, a near white front window with feathered edges, soft white end cap windows, a lilac and pink aura and a one pixel edge feather. Canvas pixel ratio is capped at 1.5. The loop pauses when the tab is hidden and resumes without a jump; the context is released when the intro unmounts.
- Face content (src/intro/faces.js): each direction paints the three front windows into one 2D atlas canvas each frame, uploaded as a texture. Colours and glyphs are copied from the app (state ink, tint and glow from index.css, glyph paths from components/Icons.jsx). Case titles and counts come from src/data.js, so "988" and "12" follow the data.
- Directions: 1 Stream (tasks pass as tiny cards; coloured ones lift out of the middle capsule; the rest leave with a check). 2 Three states (Approve 4, Answer 4, Fix 4, one per capsule). 3 Funnel (1,000 dots thin out to the 12 that need you). 4 One case (the current case in the middle, the next one waiting on the left, the resolved one on the right; each band pass slides them along). 5 Handoff (agents tick tasks off; one case crosses the middle; it lands on your pile).
- Layout (src/intro/Intro.jsx): framing comes from the same projection the shader uses. The middle capsule sits on the page's centre line, the same axis as the centred copy, and the group is centred vertically. Desktop row width is min(960px, 68vw). On phones, directions 1, 2 and 4 crop the outer capsules evenly at both edges; 3 and 5 fit the whole row so their outer labels stay whole.
- Hover (mouse only): the capsule under the pointer lifts about 4px and its band and glow brighten; the whole row leans toward the pointer, up to 2 degrees from pointer y and 2.5 from pointer x. Both follow with a critically damped ease and come to rest dead still when the pointer leaves.
- Pull: press and drag a capsule and it stretches toward the drag like a soft marshmallow, anchored at its far end, tracking the pointer with rubber band resistance capped at 15% of its length (about 40px on a laptop); the neighbours take a quarter of the pull. On release it springs back with one soft bounce (stiffness 300, damping ratio 0.55), seeded with the release velocity, and can be caught again mid spring. Pointer events only, touch-action none on the stage, cursor grab and grabbing.
- Entrance, her ease-out cubic-bezier(0.2, 0.8, 0.1, 1): 350ms of white, then the capsules grow from the centre (middle at 350ms, the outer two at 470ms sliding out from it, 900ms each, opacity plus a blur that sharpens); the line of copy at 820ms and the CTA at 920ms, while the capsules are still settling (opacity, 8px rise, 8px blur, 600ms). The ambient colour flow runs only on this screen.
- Exit on the CTA press, one JS timeline under 900ms, the queue mounted underneath from the first frame and never animating in itself: the capsules fly apart on her ease-move cubic-bezier(0.77, 0, 0.175, 1) over 600ms, middle first and rising up and away, left 40ms later out to the left and a little up, right 80ms later out to the right and a little down, fading and blurring as they go; the copy and CTA fade and blur out with them on the same curve (40 to 440ms); the white field fades on her ease-out from 440ms over 400ms while the last capsule is still leaving. The CTA disables on press. Reduced motion: no lean or stretch, hover only brightens, one still frame, one 400ms fade in and a single 200ms crossfade out.
- Type: DM Sans 400 and 500, Plus Jakarta Sans 500 on the heading only, nothing above 500. Copy: "Agents handled 988 today. 12 need you." and the CTA "Start reviewing" (its accessible name is the same text). The CTA uses the app's pastel blue primary look; no press scale, the label never moves.
- Recreate each file at the path shown, replace src/main.jsx, then npm run dev and open / (once per session) or /?intro=1 to /?intro=5.

## src/intro/Intro.jsx

```jsx
import { useEffect, useRef, useState } from "react";

import { cases, TOTAL_TODAY } from "../data.js";
import { DIRECTIONS, easeOut } from "./faces.js";
import { ATLAS_W, BOX, FACE_H, REST, chainBounds, createCapsules, faceX, makeCamera, projectRaw } from "./shader.js";
import "./intro.css";

const NEED = cases.length;
const HANDLED = TOTAL_TODAY - NEED;

// Entrance, in seconds from the white screen. The capsules trail in along the
// chain; the line of copy and the CTA follow.
// Grows out from the centre: the middle capsule arrives first, then left and right together
const CAPSULE_START = [0.47, 0.35, 0.47];
const CAPSULE_DUR = 0.9;

// Exit on the CTA press, in ms, all on one timeline. The capsules fly apart on their
// own vectors, middle first then outward, accelerating off on her ease-move and
// fading as they go; the copy and CTA fade and blur out with them, on the same curve,
// so nothing is left alone; the white field fades on her ease-out while the last
// capsule is still leaving, revealing the queue already mounted below.
const EXIT_START = [40, 0, 80]; // left, middle, right
const EXIT_TRAVEL = 600;
const COPY_OUT = [40, 440]; // start and end
const EXIT_VEC = [
  [-7.5, 1.3, 0], // left: out left, a little up
  [0, 2.8, -5], // middle: rises up and away
  [7.5, -1.3, 0], // right: out right, a little down
];
const FIELD_AT = 440; // white field starts fading, while the last capsule leaves
const FIELD_MS = 400;
const GONE_AT = FIELD_AT + FIELD_MS + 20;
const REDUCED_EXIT_MS = 200;

// Hover and pull
const HOVER_LIFT = 0.04; // world units, about 4px on a laptop
const LEAN_X = (2 * Math.PI) / 180; // tilt from pointer y
const LEAN_Y = (2.5 * Math.PI) / 180; // tilt from pointer x
const FOLLOW = 14; // per second, critically damped follow for hover and lean
const PULL_MAX = 0.15; // stretch cap, as a share of the capsule's length
const NEIGHBOUR_PULL = 0.25; // how much of a pull the neighbours take
const SPRING_K = 300; // one soft bounce: damping ratio 0.55
const SPRING_C = 2 * 0.55 * Math.sqrt(SPRING_K);

function bezier(p1x, p1y, p2x, p2y) {
  const bx = (t) => 3 * (1 - t) * (1 - t) * t * p1x + 3 * (1 - t) * t * t * p2x + t * t * t;
  const by = (t) => 3 * (1 - t) * (1 - t) * t * p1y + 3 * (1 - t) * t * t * p2y + t * t * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 24; i++) {
      t = (lo + hi) / 2;
      if (bx(t) < x) lo = t;
      else hi = t;
    }
    return by(t);
  };
}
const easeMove = bezier(0.77, 0, 0.175, 1);
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

// Rubber band on a drag vector: 1:1 at first, then more resistance, never past max.
function rubber(x, y, max) {
  const m = Math.hypot(x, y);
  if (m < 1e-6) return [0, 0];
  const f = max * (1 - 1 / (m / max + 1));
  return [(x / m) * f, (y / m) * f];
}
function unrubber(x, y, max) {
  const f = Math.min(Math.hypot(x, y), max * 0.999);
  if (f < 1e-6) return [0, 0];
  const m = max * (1 / (1 - f / max) - 1);
  return [(x / f) * m, (y / f) * m];
}

const DEFAULT_DIRECTION = 1; // Stream, her pick
const SEEN_KEY = "review-queue-intro-seen";

// ?intro=N plays direction N, ?intro=0 skips. With no param the chosen intro plays once per
// browser session, then the app opens straight away.
function readDirection() {
  const raw = new URLSearchParams(window.location.search).get("intro");
  if (raw !== null) {
    const n = Number(raw);
    return DIRECTIONS[n] ? n : null;
  }
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return null;
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage can be unavailable; the intro then plays on each load.
  }
  return DEFAULT_DIRECTION;
}

// Mount point: the intro plays from white, and the CTA hands off to the queue.
export function IntroGate({ children }) {
  const [direction] = useState(readDirection);
  const [stage, setStage] = useState(direction ? "intro" : "app");
  if (!direction) return children;
  return (
    <>
      {stage !== "intro" && children}
      {stage !== "app" && (
        <Intro
          direction={direction}
          leaving={stage === "leaving"}
          onStart={() => setStage("leaving")}
          onGone={() => setStage("app")}
        />
      )}
    </>
  );
}

function computeLayout(vw, vh, cam, tileOver, copyH) {
  const b = chainBounds(cam);
  const bw = b.maxX - b.minX;
  const bh = b.maxY - b.minY;
  const mobile = vw < 640;
  const tile = mobile ? 48 : 56;
  const line = mobile ? 32 : 48;
  const gapTile = 12;
  const gapCap = 16;
  const gapCopy = mobile ? 40 : 56;
  const margin = mobile ? 24 : 48;
  // phones crop the outer capsules evenly at both edges, as the clip does; the
  // directions with labels on the outer capsules (3 and 5) fit the whole row
  let chainW = mobile ? vw * (tileOver === 1 ? 1.3 : 0.94) : Math.min(960, vw * 0.68);
  let k = 0;
  let geo = null;
  for (let pass = 0; pass < 2; pass++) {
    k = chainW / bw; // px per raw uv unit
    const chainH = bh * k;
    const [ax, ay] = projectRaw(cam, [faceX(tileOver), BOX[1], -BOX[2]]);
    const anchorX = (ax - b.minX) * k;
    const anchorY = (b.maxY - ay) * k;
    const tileTop = anchorY - gapCap - line - gapTile - tile;
    const top = 0; // no person tile above the capsules any more
    const bottom = chainH + gapCopy + copyH;
    const groupH = bottom - top;
    geo = { chainH, anchorX, anchorY, tileTop, top, groupH };
    const room = vh - margin * 2;
    if (groupH <= room) break;
    chainW *= Math.max(0.5, (room - (groupH - chainH)) / chainH);
  }
  const chainTop = (vh - geo.groupH) / 2 - geo.top;
  // Balance on the middle capsule, not the row's outer box: its centre sits on the page's centre
  // line, the same axis as the centred copy below
  const [mx] = projectRaw(cam, [faceX(1), 0, 0]);
  const chainLeft = vw / 2 - (mx - b.minX) * k;
  const focal = k / (vh / 2);
  // screen uv of the box centre, then the offset that puts the chain there
  const cx = chainLeft + chainW / 2;
  const cy = chainTop + geo.chainH / 2;
  const tx = (cx - vw / 2) / (vh / 2);
  const ty = (vh / 2 - cy) / (vh / 2);
  const off = [tx - ((b.minX + b.maxX) / 2) * focal, ty - ((b.minY + b.maxY) / 2) * focal];
  return {
    focal,
    off,
    chainW,
    chainH: geo.chainH,
    vars: {
      "--rq-copy-top": `${chainTop + geo.chainH + gapCopy}px`,
    },
  };
}

function Intro({ direction, leaving, onStart, onGone }) {
  const rootRef = useRef(null);
  const leavingAt = useRef(0);
  const goneRef = useRef(onGone);
  goneRef.current = onGone;
  const holderRef = useRef(null);
  const copyRef = useRef(null);
  const [reduced] = useState(
    () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const dir = DIRECTIONS[direction];

  useEffect(() => {
    const root = rootRef.current;
    const holder = holderRef.current;
    const copy = copyRef.current;
    // a fresh canvas per mount, so a remount never inherits a lost context
    const canvas = document.createElement("canvas");
    canvas.className = "rq-intro-canvas";
    canvas.setAttribute("aria-hidden", "true");
    holder.appendChild(canvas);

    const atlas = document.createElement("canvas");
    atlas.width = ATLAS_W;
    atlas.height = FACE_H;
    const actx = atlas.getContext("2d");

    let scene = null;
    try {
      scene = createCapsules(canvas, atlas);
    } catch (err) {
      console.warn("Intro capsules unavailable", err);
    }
    if (!scene) root.classList.add("no-gl");
    const cam = scene ? scene.cam : makeCamera();

    // Screen geometry the pointer needs: each capsule's rect, the row's rect, world
    // units per px at each capsule and the pull cap in px.
    const view = { rects: [], chain: null, worldPerPx: [], pullMax: [] };
    const fit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const { focal, off, vars } = computeLayout(vw, vh, cam, dir.tileOver, copyRef.current.offsetHeight);
      for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
      if (scene) scene.setView(Math.round(vw * dpr), Math.round(vh * dpr), focal, off);
      const toPx = ([u, v]) => [vw / 2 + (u * focal + off[0]) * (vh / 2), vh / 2 - (v * focal + off[1]) * (vh / 2)];
      const all = { l: Infinity, r: -Infinity, t: Infinity, b: -Infinity };
      for (let i = 0; i < 3; i++) {
        const r = { l: Infinity, r: -Infinity, t: Infinity, b: -Infinity };
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
          const [x, y] = toPx(projectRaw(cam, [faceX(i) + sx * BOX[0], sy * BOX[1], sz * BOX[2]]));
          r.l = Math.min(r.l, x);
          r.r = Math.max(r.r, x);
          r.t = Math.min(r.t, y);
          r.b = Math.max(r.b, y);
        }
        view.rects[i] = r;
        all.l = Math.min(all.l, r.l);
        all.r = Math.max(all.r, r.r);
        all.t = Math.min(all.t, r.t);
        all.b = Math.max(all.b, r.b);
        const c = [faceX(i), 0, 0];
        const z = (c[0] - cam.eye[0]) * cam.F[0] + (c[1] - cam.eye[1]) * cam.F[1] + (c[2] - cam.eye[2]) * cam.F[2];
        view.worldPerPx[i] = z / (focal * (vh / 2));
        view.pullMax[i] = (PULL_MAX * 2 * BOX[0]) / view.worldPerPx[i];
      }
      view.chain = { ...all, cx: (all.l + all.r) / 2, cy: (all.t + all.b) / 2 };
    };

    // Pointer state. Hover and lean follow their targets with a critically damped
    // ease; a pull tracks the pointer 1:1 under rubber band resistance and springs
    // back with one soft bounce when let go, and can be caught again mid-spring.
    const ix = {
      hover: -1,
      lift: [0, 0, 0],
      glow: [0, 0, 0],
      leanT: [0, 0],
      lean: [0, 0],
      disp: [[0, 0], [0, 0], [0, 0]], // displayed pull per capsule, px
      vel: [[0, 0], [0, 0], [0, 0]],
      drag: null,
    };
    const m = {
      lift: [0, 0, 0],
      glow: [0, 0, 0],
      rotInv: REST.rotInv.slice(),
      stretch: new Array(9).fill(0),
      exit: new Array(9).fill(0),
      fade: [1, 1, 1],
    };

    let clock = 0;
    let last = 0;
    let raf = 0;
    const draw = (t, enter) => {
      actx.clearRect(0, 0, ATLAS_W, FACE_H);
      dir.paint(actx, t);
      scene.render(t, enter, dir.veil, m);
    };

    const step = (dt, now) => {
      const a = 1 - Math.exp(-dt * FOLLOW);
      const ease = (v, target) => (Math.abs(target - v) < 1e-4 ? target : v + (target - v) * a);
      let moving = false;
      const exiting = leavingAt.current > 0 && !reduced;
      if (leavingAt.current) ix.drag = null;
      for (let i = 0; i < 3; i++) {
        const on = !exiting && ix.hover === i;
        ix.lift[i] = ease(ix.lift[i], on && !reduced ? HOVER_LIFT : 0);
        ix.glow[i] = ease(ix.glow[i], on ? 1 : 0);
        if (ix.lift[i] !== (on && !reduced ? HOVER_LIFT : 0) || ix.glow[i] !== (on ? 1 : 0)) moving = true;
      }
      for (let j = 0; j < 2; j++) {
        const target = exiting ? 0 : ix.leanT[j];
        ix.lean[j] = ease(ix.lean[j], target);
        if (ix.lean[j] !== target) moving = true;
      }
      // release springs, sub stepped for stability
      for (let i = 0; i < 3; i++) {
        if (ix.drag && ix.drag.i === i) continue;
        const d = ix.disp[i];
        const v = ix.vel[i];
        if (Math.abs(d[0]) + Math.abs(d[1]) < 0.05 && Math.abs(v[0]) + Math.abs(v[1]) < 2) {
          d[0] = d[1] = v[0] = v[1] = 0;
          continue;
        }
        moving = true;
        const n = Math.ceil(dt / 0.004);
        const h = dt / n;
        for (let s = 0; s < n; s++) {
          for (let c = 0; c < 2; c++) {
            v[c] += (-SPRING_K * d[c] - SPRING_C * v[c]) * h;
            d[c] += v[c] * h;
          }
        }
      }
      if (ix.drag) moving = true;

      // uniforms
      m.lift = ix.lift;
      m.glow = ix.glow;
      const [rx, ry] = ix.lean;
      const cx = Math.cos(-rx), sx = Math.sin(-rx), cy = Math.cos(-ry), sy = Math.sin(-ry);
      // Rx(-rx) * Ry(-ry), written column major
      m.rotInv = [cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy];
      for (let i = 0; i < 3; i++) {
        const own = ix.disp[i];
        const l = ix.disp[i - 1] || [0, 0];
        const r = ix.disp[i + 1] || [0, 0];
        const px = own[0] + NEIGHBOUR_PULL * (l[0] + r[0]);
        const py = own[1] + NEIGHBOUR_PULL * (l[1] + r[1]);
        const w = view.worldPerPx[i] || 0;
        for (let c = 0; c < 3; c++) m.stretch[i * 3 + c] = (cam.R[c] * px - cam.U[c] * py) * w;
      }
      if (exiting) {
        const te = now - leavingAt.current;
        for (let i = 0; i < 3; i++) {
          const p = clamp((te - EXIT_START[i]) / EXIT_TRAVEL, 0, 1);
          const e = easeMove(p);
          for (let c = 0; c < 3; c++) m.exit[i * 3 + c] = EXIT_VEC[i][c] * e;
          m.fade[i] = 1 - easeMove(clamp((p - 0.25) / 0.7, 0, 1));
        }
        const c = easeMove(clamp((te - COPY_OUT[0]) / (COPY_OUT[1] - COPY_OUT[0]), 0, 1));
        copy.style.opacity = String(1 - c);
        copy.style.filter = `blur(${(8 * c).toFixed(2)}px)`;
        root.style.opacity = String(1 - easeOut(clamp((te - FIELD_AT) / FIELD_MS, 0, 1)));
        moving = true;
      }
      return moving;
    };

    const frame = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      if (last) clock += dt;
      last = now;
      if (reduced) {
        const moving = step(dt, now);
        draw(1.2, [1, 1, 1]);
        raf = moving ? requestAnimationFrame(frame) : 0;
        if (!moving) last = 0;
        return;
      }
      step(dt, now);
      const enter = CAPSULE_START.map((s) => easeOut((clock - s) / CAPSULE_DUR));
      draw(clock, enter);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || !scene) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    // reduced motion renders only while the hover glow is settling
    const kick = () => {
      if (reduced && !document.hidden) start();
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    // ---- pointer
    const hitTest = (x, y) => {
      for (const i of [1, 0, 2]) {
        const r = view.rects[i];
        if (r && x >= r.l && x <= r.r && y >= r.t && y <= r.b) return i;
      }
      return -1;
    };
    const setCursor = () => {
      canvas.style.cursor = reduced ? "" : ix.drag ? "grabbing" : ix.hover >= 0 ? "grab" : "";
    };
    const onMove = (e) => {
      if (leavingAt.current) return;
      const x = e.clientX;
      const y = e.clientY;
      if (e.pointerType === "mouse") {
        ix.hover = ix.drag ? ix.drag.i : hitTest(x, y);
        const c = view.chain;
        const near = c && x > c.l - 120 && x < c.r + 120 && y > c.t - 120 && y < c.b + 120;
        ix.leanT = near && !reduced
          ? [clamp((y - c.cy) / ((c.b - c.t) / 2), -1, 1) * LEAN_X, clamp((x - c.cx) / ((c.r - c.l) / 2), -1, 1) * LEAN_Y]
          : [0, 0];
        setCursor();
        kick();
      }
      const d = ix.drag;
      if (d && e.pointerId === d.pid) {
        const max = view.pullMax[d.i];
        const raw = [d.base[0] + x - d.sx, d.base[1] + y - d.sy];
        const shown = rubber(raw[0], raw[1], max);
        const now = performance.now();
        const ddt = Math.max((now - d.t) / 1000, 1 / 240);
        const prev = ix.disp[d.i];
        // smoothed release velocity in px per second
        d.v = [
          d.v[0] * 0.6 + ((shown[0] - prev[0]) / ddt) * 0.4,
          d.v[1] * 0.6 + ((shown[1] - prev[1]) / ddt) * 0.4,
        ];
        d.t = now;
        ix.disp[d.i] = shown;
      }
    };
    const onDown = (e) => {
      if (reduced || leavingAt.current || ix.drag) return;
      const i = hitTest(e.clientX, e.clientY);
      if (i < 0) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      // catching it mid spring: continue from where it is
      const cur = ix.disp[i];
      ix.drag = {
        i,
        pid: e.pointerId,
        sx: e.clientX,
        sy: e.clientY,
        base: unrubber(cur[0], cur[1], view.pullMax[i]),
        t: performance.now(),
        v: [0, 0],
      };
      ix.vel[i] = [0, 0];
      if (e.pointerType === "mouse") ix.hover = i;
      setCursor();
    };
    const onUp = (e) => {
      const d = ix.drag;
      if (!d || e.pointerId !== d.pid) return;
      ix.vel[d.i] = d.v;
      ix.drag = null;
      if (e.pointerType === "mouse") ix.hover = hitTest(e.clientX, e.clientY);
      else ix.hover = -1;
      setCursor();
    };
    const onLeave = (e) => {
      if (e.pointerType !== "mouse" || ix.drag) return;
      ix.hover = -1;
      ix.leanT = [0, 0];
      setCursor();
      kick();
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);

    const onResize = () => {
      fit();
      if (reduced && scene) draw(1.2, [1, 1, 1]);
    };

    fit();
    window.addEventListener("resize", onResize);
    if (reduced) {
      // still composition: one frame, redrawn once the fonts arrive
      if (scene) draw(1.2, [1, 1, 1]);
      document.fonts?.ready.then(() => scene && draw(1.2, [1, 1, 1]));
    } else {
      document.addEventListener("visibilitychange", onVisibility);
      if (!document.hidden) start();
    }
    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      if (scene) scene.destroy();
      canvas.remove();
    };
  }, [dir, reduced]);

  // One way exit: the frame loop reads leavingAt and drives the capsules, the copy
  // and the white field together. Double presses are blocked by the disabled CTA.
  useEffect(() => {
    if (!leaving) return;
    leavingAt.current = performance.now();
    const t = setTimeout(() => goneRef.current(), reduced ? REDUCED_EXIT_MS + 20 : GONE_AT);
    return () => clearTimeout(t);
  }, [leaving, reduced]);

  return (
    <div
      ref={rootRef}
      className={`rq-intro${leaving ? " is-leaving" : ""}${reduced ? " is-reduced" : ""}`}
      data-direction={direction}
    >
      <div ref={holderRef} className="rq-intro-stage" />
      <div ref={copyRef} className="rq-intro-copy">
        <h1 className="rq-intro-title">
          <span>Agents handled {HANDLED.toLocaleString("en-US")} today.</span>{" "}
          <span>{NEED} need you.</span>
        </h1>
        <button type="button" className="rq-intro-cta" onClick={onStart} disabled={leaving}>
          Start reviewing
        </button>
      </div>
    </div>
  );
}
```

## src/intro/intro.css

```css
/* Intro: pure white, three marshmallow capsules, one line of copy and one CTA. Scoped under .rq-intro so nothing leaks into the app. */

.rq-intro {
  --rq-ink: #141414;
  --rq-ink-2: #5c5c5c;
  --rq-accent-top: var(--accent);
  --rq-accent-bottom: var(--accent-bottom);
  --rq-accent-hover: var(--accent-hover);
  --rq-ease: cubic-bezier(0.2, 0.8, 0.1, 1);
  --rq-stroke: 1.5px;

  position: fixed;
  inset: 0;
  z-index: 1000;
  overflow: hidden;
  background: #ffffff;
  color: var(--rq-ink);
  font-family: "DM Sans", system-ui, sans-serif;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
}

/* Exit on the CTA press: Intro.jsx drives the capsules, the copy and this field's
   opacity on one timeline, so nothing here animates. */
.rq-intro.is-leaving {
  pointer-events: none;
}

.rq-intro-stage,
.rq-intro-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* the capsules can be pulled with a finger; the browser must not pan or zoom */
.rq-intro-stage {
  touch-action: none;
}

.rq-intro-copy {
  position: absolute;
  left: 0;
  right: 0;
  top: var(--rq-copy-top, 70%);
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
}

.rq-intro-title {
  margin: 0;
  max-width: 22em;
  font-family: "Plus Jakarta Sans", "DM Sans", system-ui, sans-serif;
  font-weight: 500;
  font-size: 28px;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--rq-ink);
  text-wrap: balance;
  font-variant-numeric: tabular-nums;
}

/* Same face as the app's primary action: the signature pastel blue, ink text, a full pill. The label never
   moves in any state, and there is no press scale on a capsule with text. */
/* each sentence keeps its own line when the line has to break */
.rq-intro-title span {
  white-space: nowrap;
}

.rq-intro-cta {
  appearance: none;
  border: 0;
  margin: 0;
  min-height: 48px;
  padding: 0 28px;
  border-radius: 999px;
  background: linear-gradient(to bottom, var(--rq-accent-top), var(--rq-accent-bottom));
  color: var(--rq-ink);
  font: 500 15px/1 "DM Sans", system-ui, sans-serif;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 160ms var(--rq-ease);
}

.rq-intro-cta:disabled {
  cursor: default;
}

.rq-intro-cta:focus-visible {
  outline: 2px solid var(--rq-ink);
  outline-offset: 3px;
}

@media (hover: hover) {
  .rq-intro-cta:not(:disabled):hover {
    background: linear-gradient(to bottom, var(--rq-accent-hover), var(--rq-accent-top));
  }
}

@media (max-width: 639px) {
  .rq-intro-title {
    font-size: 22px;
  }
  .rq-intro-copy {
    gap: 20px;
  }
  .rq-intro-cta {
    min-height: 44px;
  }
}

/* Entrance after the capsules: the line of copy, then the CTA. */
@keyframes rq-intro-in {
  from {
    opacity: 0;
    transform: translateY(8px);
    filter: blur(8px);
  }
}

/* They arrive while the capsules are still settling, so nothing waits on white. */
.rq-intro-title {
  animation: rq-intro-in 600ms var(--rq-ease) 820ms both;
}

.rq-intro-cta {
  animation: rq-intro-in 600ms var(--rq-ease) 920ms both;
}

/* Reduced motion: the still composition, one fade for the whole screen. */
@keyframes rq-intro-fade {
  from {
    opacity: 0;
  }
}

.rq-intro.is-reduced {
  animation: rq-intro-fade 400ms var(--rq-ease) both;
}

.rq-intro.is-reduced .rq-intro-title,
.rq-intro.is-reduced .rq-intro-cta {
  animation: none;
}

/* Reduced motion exit: one 200ms crossfade to the queue. */
.rq-intro.is-reduced.is-leaving {
  animation: none;
  opacity: 0;
  transition: opacity 200ms var(--rq-ease);
}
```

## src/intro/shader.js

```js
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
```

## src/intro/faces.js

```js
// What shows through each capsule's front window, one painter per direction.
// Every painter draws all three faces into one atlas canvas, in face space
// (FACE_W x FACE_H, y down), on a clear background: the shader lays the near
// white plate and the marshmallow veil around it.

import { FACE_W, FACE_H, FACE_PAD, PERIOD } from "./shader.js";
import { cases, TOTAL_TODAY } from "../data.js";

const W = FACE_W;
const H = FACE_H;

// Colours copied from the app's role tokens (src/index.css), not new ones.
const INK = "#141414";
const INK_2 = "#5c5c5c";
const STATE = {
  approval: { ink: "#1e6b3b", tint: "#e3efe0", glow: "#c6e4bf", word: "Approve" },
  input: { ink: "#8a5100", tint: "#f7e9d1", glow: "#f6d9a6", word: "Answer" },
  failed: { ink: "#b0291f", tint: "#f8dfdb", glow: "#f6c2ba", word: "Fix" },
};
const ORDER = ["approval", "input", "failed"];

// The app's own glyphs (src/components/Icons.jsx) on its 16 unit grid, plus a person.
const GLYPH = {
  approval: ["M4.8 8.4l2.2 2.2 4.2-4.5"],
  input: ["M6.2 6.3a1.8 1.8 0 1 1 2.6 1.6c-.5.3-.8.7-.8 1.2", "M8 11.2h.01"],
  failed: ["M8 4.7v3.9", "M8 11.2h.01"],
  sparkle: [
    "M8 2.8v3.4M8 9.8v3.4M2.8 8h3.4M9.8 8h3.4M4.4 4.4l2.2 2.2M9.4 9.4l2.2 2.2M11.6 4.4L9.4 6.6M6.6 9.4l-2.2 2.2",
    "M7.3 6.9h1.4a.4 .4 0 0 1 .4.4v1.4a.4 .4 0 0 1-.4.4H7.3a.4 .4 0 0 1-.4-.4V7.3a.4 .4 0 0 1 .4-.4z",
  ],
};
const PATHS = {};
const path = (name) => (PATHS[name] ||= GLYPH[name].map((d) => new Path2D(d)));

const SANS = '"DM Sans", system-ui, sans-serif';

// Her ease-out, cubic-bezier(0.2, 0.8, 0.1, 1), solved for x.
export function easeOut(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const p1x = 0.2, p1y = 0.8, p2x = 0.1, p2y = 1;
  const bx = (t) => 3 * (1 - t) * (1 - t) * t * p1x + 3 * (1 - t) * t * t * p2x + t * t * t;
  const by = (t) => 3 * (1 - t) * (1 - t) * t * p1y + 3 * (1 - t) * t * t * p2y + t * t * t;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 24; i++) {
    t = (lo + hi) / 2;
    if (bx(t) < x) lo = t;
    else hi = t;
  }
  return by(t);
}
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function glyph(ctx, name, cx, cy, size, color, stroke) {
  const k = size / 16;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(k, k);
  ctx.strokeStyle = color;
  ctx.lineWidth = stroke / k;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const p of path(name)) ctx.stroke(p);
  ctx.restore();
}

// The app's frosted state mark: a tinted glow body under a crisp glyph.
function mark(ctx, state, cx, cy, d) {
  const s = STATE[state];
  const g = ctx.createRadialGradient(cx - d * 0.15, cy - d * 0.2, d * 0.05, cx, cy, d * 0.55);
  g.addColorStop(0, s.tint);
  g.addColorStop(1, s.glow);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
  ctx.fill();
  glyph(ctx, state, cx, cy, d * 0.62, s.ink, Math.max(3, d * 0.06));
}

function fitText(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s.trimEnd() + "…";
}

const firstOf = (state) => cases.filter((c) => c.state === state);
const countOf = (state) => cases.filter((c) => c.state === state).length;
const NEED = cases.length;

// ---------------------------------------------------------------- 1. Stream
// The day's tasks pass through as tiny cards. A few carry a state colour; in the
// middle capsule, under the person tile, they lift out of the stream toward it.
// Past the middle, the rest wear a small check: handled by an agent.
function stream(ctx, t) {
  const speed = W / 2.4;
  const gap = 100;
  const cw = 72;
  const ch = 42;
  const rows = [H * 0.24, H * 0.5, H * 0.76];
  const total = 3 * W;
  const n = Math.ceil(total / gap);
  for (let r = 0; r < rows.length; r++) {
    const off = r * 41;
    for (let k = 0; k < n; k++) {
      const raw = k * gap + t * speed + off;
      const loop = Math.floor(raw / total);
      const gx = raw - loop * total;
      const id = loop * 997 + k * 7 + r * 131;
      const face = Math.floor(gx / W);
      const lx = gx - face * W;
      const flagged = hash(id) < 0.1;
      const state = ORDER[Math.floor(hash(id + 3) * 3)];
      let y = rows[r];
      let alpha = 1;
      let scale = 1;
      if (flagged) {
        const lift = face === 1 ? clamp01((lx - W * 0.3) / (W * 0.42)) : face === 2 ? 1 : 0;
        if (lift >= 1) continue;
        const e = easeOut(lift);
        y -= e * H * 0.95;
        scale = 1 + e * 0.18;
        alpha = 1 - clamp01((e - 0.6) / 0.4);
      }
      const x0 = face * (W + FACE_PAD);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, 0, W, H);
      ctx.clip();
      ctx.globalAlpha = alpha;
      ctx.translate(x0 + lx, y);
      ctx.scale(scale, scale);
      rr(ctx, -cw / 2, -ch / 2, cw, ch, 10);
      if (flagged) {
        const s = STATE[state];
        ctx.fillStyle = s.glow;
        ctx.fill();
        ctx.fillStyle = s.ink;
        ctx.beginPath();
        ctx.arc(-cw / 2 + 15, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha * 0.55;
        rr(ctx, -cw / 2 + 28, -3.5, 30, 7, 3.5);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(20,20,20,0.06)";
        ctx.fill();
        ctx.fillStyle = "rgba(20,20,20,0.22)";
        rr(ctx, -cw / 2 + 12, -9, 32, 6, 3);
        ctx.fill();
        rr(ctx, -cw / 2 + 12, 3, 22, 6, 3);
        ctx.fill();
        if (face === 2) glyph(ctx, "approval", cw / 2 - 14, 0, 22, STATE.approval.ink, 2.6);
      }
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------- 2. Three states
// One capsule per kind of exception, named the way the app's filters name them.
function states(ctx) {
  ORDER.forEach((state, i) => {
    const x0 = i * (W + FACE_PAD);
    const s = STATE[state];
    const d = 104;
    ctx.font = `500 46px ${SANS}`;
    const word = s.word;
    const count = String(countOf(state));
    const ww = ctx.measureText(word).width;
    ctx.font = `400 46px ${SANS}`;
    const cw = ctx.measureText(count).width;
    const gapA = 28;
    const gapB = 16;
    const total = d + gapA + ww + gapB + cw;
    let x = x0 + (W - total) / 2;
    mark(ctx, state, x + d / 2, H / 2, d);
    x += d + gapA;
    ctx.textBaseline = "middle";
    ctx.font = `500 46px ${SANS}`;
    ctx.fillStyle = INK;
    ctx.fillText(word, x, H / 2 + 2);
    x += ww + gapB;
    ctx.font = `400 46px ${SANS}`;
    ctx.fillStyle = INK_2;
    ctx.fillText(count, x, H / 2 + 2);
  });
}

// ---------------------------------------------------------------- 3. Funnel
// Dots stream right and thin out: the day's tasks on the left, most finished by
// agents in the middle, the few left gather as the cases that need you.
const DOTS = Array.from({ length: 240 }, (_, j) => ({
  y: 0.14 + 0.72 * hash(j + 0.5),
  x0: hash(j + 9.1),
  v: 0.85 + 0.3 * hash(j + 4.2),
  die: hash(j + 2.7),
  keep: j % 20 === 0,
  state: ORDER[j % 3],
}));
function funnel(ctx, t) {
  const labelW = W * 0.34;
  const gridX = 2 * (W + FACE_PAD) + 40;
  const path = 2 * W + 40;
  const speed = W / 3.2;
  // labels
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = `500 52px ${SANS}`;
  ctx.fillText(TOTAL_TODAY.toLocaleString("en-US"), 40, H / 2 + 8);
  ctx.fillStyle = INK_2;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText("tasks today", 40, H / 2 + 50);
  const x2 = 2 * (W + FACE_PAD);
  ctx.textAlign = "right";
  ctx.fillStyle = INK;
  ctx.font = `500 52px ${SANS}`;
  ctx.fillText(String(NEED), x2 + W - 40, H / 2 + 8);
  ctx.fillStyle = INK_2;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText("need you", x2 + W - 40, H / 2 + 50);
  ctx.textAlign = "left";

  // the twelve, settled
  const cols = 4;
  const rows = 3;
  const cell = 46;
  const gy = (H - (rows - 1) * cell) / 2;
  for (let k = 0; k < NEED; k++) {
    const c = k % cols;
    const r = Math.floor(k / cols);
    const st = STATE[cases[k]?.state || ORDER[k % 3]];
    ctx.fillStyle = st.glow;
    ctx.beginPath();
    ctx.arc(gridX + 20 + c * cell, gy + r * cell, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = st.ink;
    ctx.beginPath();
    ctx.arc(gridX + 20 + c * cell, gy + r * cell, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // the flow
  for (const d of DOTS) {
    const gx = (d.x0 * path + t * speed * d.v) % path; // 0 .. 2W+40 in flow space
    const face = gx < W ? 0 : gx < 2 * W ? 1 : 2;
    const lx = gx - face * W;
    if (face === 0 && lx < labelW) continue;
    let a = 0.42;
    let r = 4.5;
    let col = INK;
    if (d.keep) {
      // survivors take their state colour as the others fall away
      const k = face === 0 ? 0 : face === 1 ? clamp01(lx / (W * 0.6)) : 1;
      col = k > 0.5 ? STATE[d.state].ink : INK;
      a = 0.42 + 0.5 * k;
      r = 4.5 + 2.5 * k;
      if (face === 2) a *= 1 - clamp01(lx / 40);
    } else if (face >= 1) {
      const dieAt = W * (0.1 + 0.8 * d.die);
      if (face === 2) continue;
      a *= 1 - clamp01((lx - dieAt + 40) / 40);
    }
    if (a <= 0.01) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(face * (W + FACE_PAD) + lx, H * d.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- 4. One case
// One case at a time in the middle: approve, answer, fix. Each time the pink band
// sweeps through, the case is done and slides right into the resolved capsule with a
// check, and the next one slides in from the incoming capsule on the left.
const SEQ = [firstOf("approval")[0], firstOf("input")[0], firstOf("failed")[0], firstOf("approval")[1], firstOf("input")[1], firstOf("failed")[1]].filter(Boolean);

function caseCard(ctx, c, x, y, alpha, done) {
  if (!c) return;
  const s = STATE[c.state];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  const pad = 36;
  if (done) {
    mark(ctx, "approval", pad + 30, 58, 60);
  } else {
    mark(ctx, c.state, pad + 30, 58, 60);
  }
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK;
  ctx.font = `500 34px ${SANS}`;
  ctx.fillText(fitText(ctx, c.title, W - pad * 2 - 84), pad + 84, 58);
  ctx.fillStyle = INK_2;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText(fitText(ctx, c.decision, W - pad * 2), pad, 132);
  // pill with the action the case needs
  ctx.font = `500 26px ${SANS}`;
  const word = done ? "Done" : s.word;
  const pw = ctx.measureText(word).width + 40;
  rr(ctx, pad, 180, pw, 48, 24);
  ctx.fillStyle = done ? STATE.approval.tint : s.tint;
  ctx.fill();
  ctx.fillStyle = done ? STATE.approval.ink : s.ink;
  ctx.fillText(word, pad + 20, 205);
  ctx.restore();
}

function oneCase(ctx, t) {
  // the band is over the middle window at phase 0.08 of each cycle at x = 0
  const beatT = (t - 0.08 * PERIOD + PERIOD * 10) % PERIOD;
  const beat = Math.floor((t - 0.08 * PERIOD + PERIOD * 10) / PERIOD) - 10;
  const p = easeOut(clamp01(beatT / 0.7));
  const n = SEQ.length;
  const at = (k) => SEQ[((k % n) + n) % n];
  const slide = W * 0.4;
  for (let face = 0; face < 3; face++) {
    const x0 = face * (W + FACE_PAD);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, 0, W, H);
    ctx.clip();
    // what was on this face leaves right, what is next arrives from the left
    const incoming = at(beat + 1 - face);
    const outgoing = at(beat - face);
    const dim = face === 1 ? 1 : 0.38;
    caseCard(ctx, outgoing, x0 + slide * p, 0, dim * (1 - p), face === 2);
    caseCard(ctx, incoming, x0 - slide * (1 - p), 0, dim * p, face === 2);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- 5. Handoff
// Left, the agents clear tasks fast; middle, the one that needs a person is handed
// across; right, it lands on your pile, under the person tile.
function handoff(ctx, t) {
  // agents: rows tick off as they climb
  const x0 = 0;
  const rowH = 56;
  const speed = 90;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, 0, W, H);
  ctx.clip();
  // the agent mark
  ctx.fillStyle = "rgba(20,20,20,0.06)";
  ctx.beginPath();
  ctx.arc(x0 + 86, H / 2, 50, 0, Math.PI * 2);
  ctx.fill();
  glyph(ctx, "sparkle", x0 + 86, H / 2, 58, INK, 3.4);
  const scroll = (t * speed) % rowH;
  for (let k = -1; k < 7; k++) {
    const y = H + rowH - k * rowH - scroll - rowH / 2 - 20;
    if (y < -rowH || y > H + rowH) continue;
    const done = y < H * 0.62;
    ctx.fillStyle = "rgba(20,20,20,0.18)";
    rr(ctx, x0 + 176, y - 4, 230 - (k % 3) * 40, 8, 4);
    ctx.fill();
    if (done) {
      const a = clamp01((H * 0.62 - y) / 30);
      ctx.globalAlpha = a;
      ctx.fillStyle = STATE.approval.tint;
      ctx.beginPath();
      ctx.arc(x0 + W - 70, y, 16, 0, Math.PI * 2);
      ctx.fill();
      glyph(ctx, "approval", x0 + W - 70, y, 22, STATE.approval.ink, 2.6);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();

  // the handoff: one card crosses the middle with the band, one per cycle
  const beatT = (t + PERIOD * 10) % PERIOD;
  const beat = Math.floor((t + PERIOD * 10) / PERIOD) - 10;
  const at = (k) => cases[((k % cases.length) + cases.length) % cases.length];
  const x1 = W + FACE_PAD;
  const cw = 250;
  const chh = 120;
  const card = (cs, x, y, scale, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + cw / 2, y + chh / 2);
    ctx.scale(scale, scale);
    rr(ctx, -cw / 2, -chh / 2, cw, chh, 22);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 2;
    ctx.stroke();
    mark(ctx, cs.state, -cw / 2 + 50, 0, 56);
    ctx.fillStyle = "rgba(20,20,20,0.22)";
    rr(ctx, -cw / 2 + 96, -16, 120, 9, 4.5);
    ctx.fill();
    rr(ctx, -cw / 2 + 96, 6, 80, 9, 4.5);
    ctx.fill();
    ctx.restore();
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(x1, 0, W, H);
  ctx.clip();
  card(at(beat), x1 - cw + (beatT / PERIOD) * (W + cw), (H - chh) / 2, 1, 1);
  ctx.restore();

  // your pile: the card that just crossed lands on top, the stack keeps three
  const x2 = 2 * (W + FACE_PAD);
  const e = easeOut(clamp01(beatT / 0.6));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x2, 0, W, H);
  ctx.clip();
  for (let k = 3; k >= 0; k--) {
    const kk = k - 1 + e; // each card steps back one slot as the new one lands
    let a = kk > 2 ? 1 - clamp01(kk - 2) : 1;
    if (k === 0) a = e;
    if (a <= 0.01) continue;
    const back = Math.max(kk, 0);
    card(at(beat - 1 - k), x2 + 60, (H - chh) / 2 + 12 - kk * 18, 1 - back * 0.06, a * (1 - back * 0.25));
  }
  ctx.fillStyle = INK;
  ctx.font = `500 52px ${SANS}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(NEED), x2 + W - 40, H / 2 + 8);
  ctx.fillStyle = INK_2;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText("need you", x2 + W - 40, H / 2 + 50);
  ctx.textAlign = "left";
  ctx.restore();
}

// Which capsule the person tile stands over, and how strongly the pink band veils
// the windows (the clip covers its footage fully; the cases stay readable here).
export const DIRECTIONS = {
  1: { name: "Stream", paint: stream, tileOver: 1, veil: 0.55 },
  2: { name: "Three states", paint: states, tileOver: 1, veil: 0.45 },
  3: { name: "Funnel", paint: funnel, tileOver: 2, veil: 0.5 },
  4: { name: "One case", paint: oneCase, tileOver: 1, veil: 0.8 },
  5: { name: "Handoff", paint: handoff, tileOver: 2, veil: 0.5 },
};
```

## src/main.jsx

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./index.css";
import { IntroGate } from "./intro/Intro.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <IntroGate>
      <App />
    </IntroGate>
  </StrictMode>,
);
```

## The main.jsx change

Two lines: import the gate, and wrap App in it.

```diff
 import App from "./App.jsx";
 import "./index.css";
+import { IntroGate } from "./intro/Intro.jsx";

 createRoot(document.getElementById("root")).render(
   <StrictMode>
-    <App />
+    <IntroGate>
+      <App />
+    </IntroGate>
   </StrictMode>,
 );
```
