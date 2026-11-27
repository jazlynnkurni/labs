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
