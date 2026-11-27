# Handoff: food delivery review queue, with the intro

Context for the receiving agent
- Recreate every file below at the path shown, exactly as written. Then run npm install and npm run dev, and open the dev URL.
- Vite and React 19, plain CSS, no other dependencies. Entry is src/main.jsx, which wraps the app in the intro (src/intro/).
- The intro plays once per browser session. Add ?intro=1 to 5 to replay a direction, or ?intro=0 to skip it.
- Vite and React 19, plain CSS, no other dependencies. Entry is src/main.jsx. package.json and vite.config.js are included. The onboarding intro is handed off separately (HANDOFF-intro.md) and is not part of this file.
- Product: a review queue for a food delivery support lead. Agents handle about 1,000 cases a day and 12 need a human, in three states: needs approval, needs input, failed. The human is the exception handler, so the header carries one ratio, "12 of 1,000 need you", which counts down as cases resolve.
- All data is made up (src/data.js, unchanged). State persists in localStorage under "review-queue-v1".
- Fonts: DM Sans for all body and UI text, Plus Jakarta Sans only on h1 and h2 (and the address compare values). Weights are capped at medium: only --w-regular 400 and --w-medium 500 exist, and the Google Fonts link loads only DM Sans 400 and 500 and Plus Jakarta Sans 500.
- Information architecture: the queue is sorted by time left, most urgent first. Time left drives the order but is not shown anywhere. Filters name the action each state needs: Approve, Answer, Fix.
- Case pane anatomy (src/components/Detail.jsx), after Stripe Radar review, GitHub's merge box, Linear and Intercom properties panels and Ramp approvals: a header with the decision question, a state pill, open in focus and previous and next (also j and k); a one paragraph summary; a key facts strip (contact or restaurant with an avatar, restaurant, order, total) cut into cells by hairlines, with the reason a person is needed docked under it as a tinted callout; then the recommendation card (the agent's proposal, your answer, or what broke, with its inputs) and its docked action bar, beside evidence modules (addresses, receipt, details as a key and value list, activity as a quiet timeline). Resolved cases use the same anatomy. The previous single column pane is kept at ?pane=old (src/components/DetailOld.jsx).
- Alignment rule: the headline's left edge and every card's outer edge share one line, and card content is indented by --card-pad (20px) on all four sides, the action bar included. In the queue column the title, the slabs and the row cards share one outer edge.
- Palette, all as role tokens in index.css :root, never raw values in components: the signature colour, a soft feathery pastel blue --accent #CFE3FF, on the one primary action of each case (ink text, 12:1 or better), the toggle thumbs and every chosen or focused state; state ink, tint and glow for approve (#1E6B3B, #E3EFE0, #C6E4BF), answer (#8A5100, #F7E9D1, #F6D9A6) and fix (#B0291F, #F8DFDB, #F6C2BA); the agent's words in a purple to blue to rose gradient (#5A4BA0, #3D62B5, #A44F7E) on the proposal line and the prompt pill; six avatar tints; no lime and no black outlines anywhere. Every text pair is 4.5:1 or better.
- Material, after Ramp's charts: matte vertical colour fades, full tint at the top fading to near white at the base, on the toggle thumbs and the primary button (#CFE3FF to #F5F9FF), state pills, marks and the callout, and a faint neutral fade on the docked round buttons. No refraction and no WebGL.
- Chosen answers show a thin grey outline (the scrollbar grey) and a grey check; keyboard focus shows a feathered pastel blue glow. Text fields change nothing on focus; the caret is the signal. The chosen radio check is deeper blue #3F6FC2 (white check 4.9:1).
- Icon family (src/components/Icons.jsx), drawn here with no library: each mark is a small matte object, a tinted fade body with static grain, under a crisp line glyph whose stroke stays 1.4px at every size. States, reset, back, previous and next, open in focus, close, expand and collapse, the radio, the sparkle and the queue clear check.
- Toggles (src/components/Segmented.jsx): one shared component for both controls. Equal cells fill the slab, label and count centred as one unit 6px apart. The thumb's corners are concentric with the slab (--r-thumb = --r-slab minus --inset) and it glides on a clip-path transition, 250ms on her ease-out, retargeting if clicked mid slide. Counts roll like an odometer when they change: only the changed digits move, in a fixed box, no motion on load. Arrow keys, Home and End move between options.
- Focus sheet (src/components/FocusSheet.jsx): open in focus from the pane header. The app fades toward black and blurs, the case rises bigger from its trigger, and a docked cluster sits on the sheet's top right corner: the prompt pill above the sheet ending on its right edge, close beside it, expand or collapse under close, 3px apart. Choreography: scrim and sheet together over 250ms (the sheet from 16px down, scale 0.96 and blur 8px), the cluster from 80ms, 40ms apart, the last on the 400ms delight tail; close is everything together in 150ms. Expand toggles a clip-path; the cluster travels on transform. Escape closes and returns focus to the trigger; the app behind is inert; j and k move between cases inside. Phone: full screen, cluster inside the top right at 44px.
- The prompt pill sends text to the agent. On a case that needs input it is the answer and resolves the case; on other cases it is kept as an instruction, shown on the resolved record as "Told the agent", with Undo in the toast.
- Motion tokens in index.css, read by src/motion.js: --ease-out cubic-bezier(0.2, 0.8, 0.1, 1), --ease-move cubic-bezier(0.77, 0, 0.175, 1) only for rows closing a gap, --dur-state 250ms, --dur-fast 160ms, --dur-exit 150ms, --dur-delight 400ms (queue clear and the last docked button only). Resolve and undo move the list and pane; the toast rises and sinks; scroll edges feather only when content continues past them; selection with a click or j and k is instant; no entrance on load. Reduced motion keeps opacity only.
- Queue clear (src/components/QueueClear.jsx): a frosted disc and pill over three soft state glows with grain, blooming once in 400ms when the last case resolves, drifting with the pointer, still at rest.
- Style rules in use: no em dashes anywhere, sentence case UI copy, one soft shadow, thin translucent lines and never two in a row, no eyebrows, text in pills never moves, icon buttons have no grey tile.
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

## index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Review queue</title>
    <link rel="icon" href="data:," />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Plus+Jakarta+Sans:wght@500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## package.json

```json
{
  "name": "review-queue",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.0"
  }
}
```

## vite.config.js

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

## src/App.jsx

```jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cases, TOTAL_TODAY } from "./data";
import Queue from "./components/Queue";
import Detail from "./components/Detail";
import DetailOld from "./components/DetailOld";
import Resolved from "./components/Resolved";
import QueueClear from "./components/QueueClear";
import FocusSheet from "./components/FocusSheet";
import { ResetIcon } from "./components/Icons";

const KEY = "review-queue-v1";
const OPEN_FIRST = "FD-48236";
// ?pane=old shows the earlier single column pane, to compare.
const OLD_PANE = new URLSearchParams(window.location.search).get("pane") === "old";

const PROMPTS = {
  approval: "Tell the agent how to change this refund",
  input: "Answer the agent",
  failed: "Tell the agent how to fix this",
};

const byId = Object.fromEntries(cases.map((c) => [c.id, c]));

// Least time left first, so the top of the list is always the next thing to do.
// Time left drives the order but is not shown.
const sorted = [...cases].sort((a, b) => a.sla - b.sla || b.age - a.age);

const fresh = () => ({
  resolved: {},
  progress: {},
  notes: {},
  view: "open",
  filter: "all",
  selectedId: OPEN_FIRST,
});

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (!s) return fresh();
    const resolved = Object.fromEntries(
      Object.entries(s.resolved ?? {}).filter(([id]) => byId[id])
    );
    // A check that was mid flight when the page closed starts over.
    const progress = Object.fromEntries(
      Object.entries(s.progress ?? {}).map(([id, p]) => [id, p === "checking" ? "idle" : p])
    );
    return { ...fresh(), ...s, resolved, progress };
  } catch {
    return fresh();
  }
}

export default function App() {
  const [s, setS] = useState(load);
  const [showDetail, setShowDetail] = useState(false);
  // The toast stays mounted after it closes so it can leave the way it came.
  const [toast, setToast] = useState(null);
  // The last resolve or undo. It drives the only list and pane motion, and any other
  // move (a click, j or k, a filter) clears it so selection stays instant.
  const [act, setAct] = useState(null);
  // The focus sheet: open, and the point it grows from. The trigger gets focus back on close.
  const [focus, setFocus] = useState({ open: false, origin: null });
  const trigger = useRef(null);

  const patch = useCallback(
    (p) => setS((prev) => ({ ...prev, ...(typeof p === "function" ? p(prev) : p) })),
    []
  );

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      // Storage can be unavailable. The prototype still works for the session.
    }
  }, [s]);

  const open = useMemo(() => sorted.filter((c) => !s.resolved[c.id]), [s.resolved]);
  const items = useMemo(
    () => open.filter((c) => s.filter === "all" || c.state === s.filter),
    [open, s.filter]
  );
  const done = useMemo(
    () =>
      Object.entries(s.resolved)
        .sort((a, b) => b[1].at - a[1].at)
        .map(([id, rec]) => ({ c: byId[id], rec })),
    [s.resolved]
  );
  const list = useMemo(
    () => (s.view === "open" ? items.map((c) => ({ c })) : done),
    [s.view, items, done]
  );
  const selected = list.find((x) => x.c.id === s.selectedId) ?? null;

  const counts = {
    all: open.length,
    approval: open.filter((c) => c.state === "approval").length,
    input: open.filter((c) => c.state === "input").length,
    failed: open.filter((c) => c.state === "failed").length,
  };

  // Keep something selected whenever the list has something in it.
  useEffect(() => {
    if (!selected && list.length) patch({ selectedId: list[0].c.id });
  }, [selected, list, patch]);

  const select = useCallback(
    (id) => {
      setAct(null);
      patch({ selectedId: id });
      setShowDetail(true);
    },
    [patch]
  );

  const resolve = useCallback(
    (id, outcome, detail) => {
      const i = items.findIndex((c) => c.id === id);
      let next = items[i + 1] ?? items[i - 1] ?? null;
      let filter = s.filter;
      if (!next) {
        // Nothing left in this filter, so move on to whatever else is open.
        next = open.find((c) => c.id !== id) ?? null;
        if (next) filter = "all";
      }
      patch((prev) => ({
        resolved: {
          ...prev.resolved,
          [id]: {
            outcome,
            detail: { ...detail, notes: prev.notes?.[id] },
            kind: byId[id].state,
            at: Date.now(),
          },
        },
        selectedId: next ? next.id : null,
        filter,
      }));
      setAct({ kind: "resolve", id, at: Date.now() });
      setShowDetail(false);
      setToast({ id, text: outcome, open: true });
    },
    [items, open, s.filter, patch]
  );

  const reopen = useCallback(
    (id) => {
      patch((prev) => {
        const { [id]: _gone, ...rest } = prev.resolved;
        return { resolved: rest, view: "open", filter: "all", selectedId: id };
      });
      setAct(null);
      setToast((t) => t && { ...t, open: false });
      setShowDetail(true);
    },
    [patch]
  );

  const undo = useCallback(() => {
    if (!toast?.open) return;
    if (toast.kind === "note") {
      patch((prev) => ({
        notes: { ...prev.notes, [toast.id]: (prev.notes?.[toast.id] ?? []).slice(0, -1) },
      }));
      setToast((t) => t && { ...t, open: false });
      return;
    }
    patch((prev) => {
      const { [toast.id]: _gone, ...rest } = prev.resolved;
      const back = byId[toast.id];
      const filter = prev.filter !== "all" && prev.filter !== back.state ? "all" : prev.filter;
      return { resolved: rest, view: "open", filter, selectedId: toast.id };
    });
    setAct({ kind: "undo", id: toast.id, at: Date.now() });
    setToast((t) => t && { ...t, open: false });
  }, [toast, patch]);

  // The prompt pill. On a case that needs input the text is the answer and resolves it, the
  // same as a note sent from the card. On other cases it is kept as an instruction for the
  // agent and recorded when the case resolves.
  const tellAgent = useCallback(
    (id, text) => {
      if (byId[id].state === "input") {
        resolve(id, "Answer sent to the agent", { kind: "input", choice: null, note: text });
        return;
      }
      patch((prev) => ({
        notes: { ...prev.notes, [id]: [...(prev.notes?.[id] ?? []), text] },
      }));
      setToast({ id, text: "Sent to the agent", open: true, kind: "note" });
    },
    [resolve, patch]
  );

  const runCheck = useCallback(
    (id) => {
      patch((prev) => ({ progress: { ...prev.progress, [id]: "checking" } }));
      setTimeout(
        () => patch((prev) => ({ progress: { ...prev.progress, [id]: "confirmed" } })),
        1400
      );
    },
    [patch]
  );

  const reset = useCallback(() => {
    setS(fresh());
    setAct(null);
    setToast((t) => t && { ...t, open: false });
    setShowDetail(false);
  }, []);

  useEffect(() => {
    if (!toast?.open) return;
    const t = setTimeout(() => setToast((x) => x && { ...x, open: false }), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const down = e.key === "j" || e.key === "ArrowDown";
      const up = e.key === "k" || e.key === "ArrowUp";
      if (!down && !up) return;
      e.preventDefault();
      const i = list.findIndex((x) => x.c.id === s.selectedId);
      const next = list[down ? Math.min(i + 1, list.length - 1) : Math.max(i - 1, 0)];
      if (next) {
        setAct(null);
        patch({ selectedId: next.c.id });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [list, s.selectedId, patch]);

  // Feather a scroll edge only while there is content beyond it. The attribute changes
  // only when the answer changes, so scrolling does not restyle every frame.
  useEffect(() => {
    function fade(el) {
      const top = el.scrollTop > 1;
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      const v = top && bottom ? "both" : top ? "top" : bottom ? "bottom" : "";
      if ((el.dataset.fade ?? "") !== v) {
        if (v) el.dataset.fade = v;
        else delete el.dataset.fade;
      }
    }
    const all = () => document.querySelectorAll(".rows, .detail-scroll").forEach(fade);
    const onScroll = (e) => {
      if (e.target.matches?.(".rows, .detail-scroll")) fade(e.target);
    };
    all();
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", all);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", all);
    };
  });

  useEffect(() => {
    if (!s.selectedId) return;
    document
      .querySelector(`[data-id="${s.selectedId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [s.selectedId, s.view]);

  const at = selected ? list.findIndex((x) => x.c.id === selected.c.id) : -1;
  const step = { prev: at > 0, next: at > -1 && at < list.length - 1 };
  const onStep = useCallback(
    (dir) => {
      const next = list[at + dir];
      if (!next) return;
      setAct(null);
      patch({ selectedId: next.c.id });
    },
    [list, at, patch]
  );

  const openFocus = useCallback((el) => {
    const r = el.getBoundingClientRect();
    trigger.current = el;
    setFocus({ open: true, origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
  }, []);
  const closeFocus = useCallback(() => {
    setFocus((f) => ({ ...f, open: false }));
    requestAnimationFrame(() =>
      (trigger.current?.isConnected ? trigger.current : document.querySelector(".focus-open"))?.focus()
    );
  }, []);

  // Nothing left to focus on: close the sheet.
  useEffect(() => {
    if (focus.open && !selected) closeFocus();
  }, [focus.open, selected, closeFocus]);

  useEffect(() => {
    document.body.style.overflow = focus.open ? "hidden" : "";
  }, [focus.open]);

  // The pane slides forward to the next case after a resolve, and back after an undo.
  const enter =
    act && selected
      ? act.kind === "undo" && act.id === selected.c.id
        ? "back"
        : act.kind === "resolve"
          ? "forward"
          : null
      : null;

  let pane;
  if (!selected) {
    pane =
      s.view === "open" && !open.length ? (
        <QueueClear play={act?.kind === "resolve"} />
      ) : (
        <div className="detail empty">
          <p>{s.view === "resolved" ? "Nothing resolved yet" : "Nothing here"}</p>
        </div>
      );
  } else if (s.view === "open") {
    const Pane = OLD_PANE ? DetailOld : Detail;
    pane = (
      <Pane
        key={selected.c.id}
        onStep={onStep}
        step={step}
        onFocus={OLD_PANE ? undefined : openFocus}
        c={selected.c}
        enter={enter}
        phase={s.progress[selected.c.id]}
        onCheck={runCheck}
        onResolve={resolve}
        onBack={() => setShowDetail(false)}
      />
    );
  } else {
    pane = (
      <Resolved
        key={selected.c.id}
        c={selected.c}
        rec={selected.rec}
        onReopen={reopen}
        onBack={() => setShowDetail(false)}
      />
    );
  }

  let sheet = null;
  if (selected && !OLD_PANE) {
    sheet =
      s.view === "open" ? (
        <Detail
          key={selected.c.id}
          scope="focus-"
          c={selected.c}
          phase={s.progress[selected.c.id]}
          onCheck={runCheck}
          onResolve={resolve}
          onBack={closeFocus}
          onStep={onStep}
          step={step}
        />
      ) : (
        <Resolved key={selected.c.id} c={selected.c} rec={selected.rec} onReopen={reopen} onBack={closeFocus} />
      );
  }

  const cls = ["app", showDetail && "show-detail", !selected && "is-empty"]
    .filter(Boolean)
    .join(" ");

  return (
    <>
    <div className={cls} inert={focus.open}>
      <header className="top">
        <h1 className="brand">Review queue</h1>
        <p className="stats">
          <span className="stat">
            <span className="stat-n num">{open.length}</span> of{" "}
            <span className="num">{TOTAL_TODAY.toLocaleString("en-US")}</span> need you
          </span>
          <button type="button" className="reset" onClick={reset} aria-label="Reset demo">
            <ResetIcon />
          </button>
        </p>
      </header>

      <Queue
        list={list}
        act={act}
        view={s.view}
        onView={(view) => {
          setAct(null);
          patch({ view });
        }}
        counts={counts}
        doneCount={done.length}
        filter={s.filter}
        onFilter={(filter) => {
          setAct(null);
          patch({ filter });
        }}
        selectedId={s.selectedId}
        onSelect={select}
      />

      {pane}

    </div>

    <FocusSheet
      open={focus.open}
      origin={focus.origin}
      onClose={closeFocus}
      prompt={
        selected && s.view === "open"
          ? {
              key: selected.c.id,
              placeholder: PROMPTS[selected.c.state],
              onSend: (text) => tellAgent(selected.c.id, text),
            }
          : null
      }
    >
      {sheet}
    </FocusSheet>

    {toast && (
      <div className="toast" role="status" data-open={toast.open}>
        <span className="toast-text">{toast.text}</span>
        <button type="button" onClick={undo} tabIndex={toast.open ? 0 : -1}>
          Undo
        </button>
      </div>
    )}
    </>
  );
}
```

## src/data.js

```js
// Made-up cases for a food delivery support lead. Times are in minutes.
export const TOTAL_TODAY = 1000;

export const STATES = {
  approval: { label: "Needs approval" },
  input: { label: "Needs input" },
  failed: { label: "Failed" },
};

export const cases = [
  {
    id: "FD-48213",
    order: "20481",
    decision: "Refund Maya the full $38.40?",
    state: "approval",
    title: "Cold food, 38 minutes late",
    who: "Maya Roberts",
    restaurant: "Nasi Kita",
    total: 38.4,
    age: 42,
    sla: 9,
    why: "Refund is over the $30 the agent can approve alone",
    summary:
      "Maya says her dinner arrived cold after a long wait. The courier sat at the restaurant for 22 minutes and the drop off was 38 minutes past the estimate. Her photo shows a lukewarm bowl, which fits the delay.",
    facts: [
      ["Delivery", "38 min late"],
      ["Courier wait", "22 min at the restaurant"],
      ["Photo", "Attached, matches the order"],
      ["History", "14 orders, no refunds yet"],
    ],
    approval: {
      summary: "Full refund for the order",
      amount: 38.4,
      to: "Card ending 4421",
      audience: "Message to customer",
      message:
        "Hi Maya, I am sorry your dinner arrived cold. I have refunded the full $38.40 to your card ending 4421. It should show within 3 days.",
    },
  },
  {
    id: "FD-48220",
    order: "20493",
    decision: "Refund Jordan and pause the dish?",
    state: "approval",
    title: "Allergy report, peanuts in a nut free dish",
    who: "Jordan Ellis",
    restaurant: "Green Fork Kitchen",
    total: 52.1,
    age: 18,
    sla: 6,
    why: "Health and safety reports always need a person",
    summary:
      "Jordan had a mild reaction after eating the pad see ew, which is listed as nut free. They are fine and did not need a doctor. The restaurant has not replied. There were two earlier reports on this dish in the last 90 days.",
    facts: [
      ["Report", "Mild reaction, no medical care"],
      ["Dish", "Pad see ew, tagged nut free"],
      ["Earlier reports", "2 in the last 90 days"],
      ["Restaurant reply", "None after 25 min"],
    ],
    approval: {
      summary: "Full refund, pause the dish and notify the restaurant",
      amount: 52.1,
      to: "Card ending 9082",
      audience: "Message to customer",
      message:
        "Hi Jordan, I am very sorry, and I am glad you are okay. We have refunded $52.10 and paused this dish while we review it with the restaurant. Please tell us if you need anything else.",
    },
  },
  {
    id: "FD-48226",
    order: "20455",
    decision: "Refund Priya $24.90 and flag the courier?",
    state: "approval",
    title: "Marked delivered, never arrived",
    who: "Priya Nair",
    restaurant: "Burger Lab",
    total: 24.9,
    age: 55,
    sla: 31,
    why: "Courier location does not match the drop off address",
    summary:
      "Priya says nothing arrived. The courier marked it delivered 140 meters from her building and the proof photo shows a door that is not hers. She has never made a claim before.",
    facts: [
      ["Drop off", "140 m from the address"],
      ["Proof photo", "Different door"],
      ["Courier", "2 similar flags this month"],
      ["History", "31 orders, first claim"],
    ],
    approval: {
      summary: "Full refund and flag the courier for review",
      amount: 24.9,
      to: "Card ending 1175",
      audience: "Message to customer",
      message:
        "Hi Priya, thank you for telling us. I have refunded $24.90 to your card ending 1175 and passed the delivery to our courier team to look into.",
    },
  },
  {
    id: "FD-48236",
    order: "20502",
    decision: "Refund Nora $14.80 for the missing entree?",
    state: "approval",
    title: "Missing entree, refund requested",
    who: "Nora Castillo",
    restaurant: "Trattoria Fiore",
    total: 36.2,
    age: 27,
    sla: 33,
    why: "Any refund over $10 needs a person to check the receipt",
    summary:
      "Nora reports the chicken parmigiana was not in the bag. The receipt lists it as packed, but the courier photo shows only two of three containers.",
    receipt: [
      { name: "Chicken parmigiana", price: 14.8, missing: true },
      { name: "Spaghetti pomodoro", price: 11.2 },
      { name: "Caesar salad", price: 6.2 },
      { name: "Delivery fee", price: 2.5 },
      { name: "Service and tax", price: 1.5 },
    ],
    facts: [
      ["Courier photo", "2 of 3 containers"],
      ["History", "8 orders, 1 earlier claim"],
    ],
    approval: {
      summary: "Refund the missing entree",
      amount: 14.8,
      to: "Card ending 3306",
      audience: "Message to customer",
      message:
        "Hi Nora, I am sorry the chicken parmigiana was left out of your order. I have refunded $14.80 to your card ending 3306. It should show within 3 days.",
    },
  },
  {
    id: "FD-48202",
    order: "20437 +5",
    decision: "Should Kopi Hijau go live?",
    state: "input",
    title: "Can this restaurant go live again",
    who: "Kopi Hijau",
    restaurant: null,
    total: null,
    age: 64,
    sla: 40,
    why: "Needs the call you had with the owner this morning",
    summary:
      "Kopi Hijau was paused on Monday after a failed hygiene check. The owner uploaded a passing re inspection report dated today. The agent cannot tell whether it is the official report, or whether you agreed conditions on the phone.",
    facts: [
      ["Paused for", "Failed hygiene check on Monday"],
      ["Document", "Re inspection pass, uploaded 09:12"],
      ["Waiting", "6 orders held in the queue"],
    ],
    input: {
      options: [
        "Yes, go live now",
        "Yes, but hold new orders for 1 hour",
        "No, keep it paused until verified",
      ],
      placeholder: "Anything the agent should tell the owner",
    },
  },
  {
    id: "FD-48210",
    order: "20468",
    decision: "How far should the agent go with Dana?",
    state: "input",
    title: "Customer says they will post about it",
    who: "Dana Whitfield",
    restaurant: "Taco Norte",
    total: 41.2,
    age: 30,
    sla: 12,
    why: "Goodwill above the cap is your call",
    summary:
      "Two of five items were missing and the first reply was a standard refund. Dana says they write for a local paper and will post the thread today. The agent can offer up to $15 in credit on its own.",
    facts: [
      ["Order", "2 of 5 items missing"],
      ["Reply so far", "Standard refund sent"],
      ["Public risk", "Says they will post today"],
    ],
    input: {
      options: [
        "Refund plus $15 credit",
        "Refund plus $30 credit",
        "Hand to communications",
      ],
      placeholder: "Tone or limits for the reply",
    },
  },
  {
    id: "FD-48215",
    order: "20479",
    decision: "Has the safety team reached Samir?",
    state: "input",
    title: "Courier reported a bike crash",
    who: "Samir Aziz",
    restaurant: "Pho 88",
    total: 33,
    age: 15,
    sla: 20,
    why: "Only your team can confirm the safety follow up",
    summary:
      "Samir reported a minor crash at 14:02 and the order was lost. The agent sent a new courier and the customer is arriving at their door in 18 minutes. It cannot see whether the safety team has contacted Samir.",
    facts: [
      ["Courier", "Reported a minor crash at 14:02"],
      ["Order", "Remade, new courier in 18 min"],
      ["Customer", "Told about the delay"],
    ],
    input: {
      options: ["Yes, they are with him", "Not yet, I will call now"],
      placeholder: "Anything to add for the courier team",
    },
  },
  {
    id: "FD-48241",
    order: "20511",
    decision: "Does the photo support a misdelivery?",
    state: "input",
    title: "Delivery photo disputed",
    who: "Elena Marsh",
    restaurant: "Harbour Grill",
    total: 31.6,
    age: 33,
    sla: 25,
    why: "Only you can weigh the evidence before a courier is flagged",
    summary:
      "Elena says her order never arrived. The courier's proof photo shows building 218, but the order address is building 26. The agent cannot tell whether the courier went to the wrong building or photographed a neighbouring entrance.",
    compare: {
      left: {
        label: "Order says",
        value: "Building 26",
        note: "26 Harbour Row, apartment 4B",
      },
      right: {
        label: "Photo shows",
        value: "Building 218",
        note: "218 Harbour Row, number on the entrance",
      },
    },
    facts: [
      ["Courier GPS", "190 m from building 26"],
      ["Photo taken", "14:36, at the drop off"],
      ["Courier history", "1 earlier address mismatch"],
      ["Customer", "11 orders, first claim"],
    ],
    input: {
      options: [
        {
          label: "Confirm misdelivery",
          next: [
            "Refunds $31.60 to the card ending 5520",
            "Adds a strike to the courier record",
            "Apologises to Elena",
          ],
        },
        {
          label: "Request more evidence",
          next: [
            "Asks the courier for a second photo and a pin drop",
            "Holds the refund until the courier replies",
            "Tells Elena to expect an answer within 30 minutes",
          ],
        },
      ],
      placeholder: "Anything the agent should add to its message",
    },
  },
  {
    id: "FD-48198",
    order: "20431",
    decision: "Did Hannah's refund already go through?",
    state: "failed",
    title: "Refund provider timed out",
    who: "Hannah Kim",
    restaurant: "Bao Bar",
    total: 36,
    age: 25,
    sla: 14,
    why: "A blind retry could pay her twice, so the agent stopped",
    summary:
      "The agent sent Hannah's $36.00 refund at 14:11. The payment provider timed out after the request left, so nobody knows whether the money moved. Hannah has not been told anything yet.",
    facts: [
      ["Refund", "$36.00 to card ending 4421"],
      ["Provider", "Timed out after 30 s"],
      ["Customer told", "Not yet"],
    ],
    log: [
      { time: "14:11", text: "Agent approved a $36.00 refund" },
      { time: "14:11", text: "Refund request sent to the payment provider" },
      { time: "14:12", text: "Provider timed out, payment status unknown" },
    ],
    failed: {
      step: "Sending the refund",
      error: "The provider timed out after the request was sent, so the payment status is unknown.",
      check: {
        label: "Check refund status",
        started: { time: "14:37", text: "Status check sent to the payment provider" },
        result: [
          { time: "14:37", text: "Provider replied, refund of $36.00 completed at 14:12" },
          {
            time: "14:37",
            change: {
              label: "Payment status",
              from: { text: "Unknown", state: "input" },
              to: { text: "Refunded", state: "approval" },
            },
          },
        ],
        done: "The provider confirms the refund already went through at 14:12. Nothing more needs sending, and a retry would pay Hannah twice.",
        closeLabel: "Close case",
        outcome: "Case closed, refund confirmed",
      },
      fixes: [{ label: "Retry refund" }],
    },
  },
  {
    id: "FD-48205",
    order: "20452",
    decision: "How should Mateo get the apology?",
    state: "failed",
    title: "Message to customer bounced",
    who: "Mateo Silva",
    restaurant: "Casa Verde",
    total: 22.4,
    age: 70,
    sla: 44,
    why: "The phone number on file is not valid",
    summary:
      "The agent resolved Mateo's missing drink and tried to send the apology by text. The text bounced. He has an email on file but the agent is not allowed to switch channels alone.",
    facts: [
      ["Resolution", "$4.50 refunded"],
      ["Text", "Bounced, number not valid"],
      ["Email on file", "Yes"],
    ],
    failed: {
      step: "Telling the customer",
      error: "The text message bounced because the phone number is not valid.",
      fixes: [
        { label: "Send by email", primary: true },
        { label: "Call the customer" },
      ],
    },
  },
  {
    id: "FD-48217",
    order: "20450",
    decision: "How do we check Aiko's photo?",
    state: "failed",
    title: "Could not read the photo",
    who: "Aiko Tanaka",
    restaurant: "Sushi Den",
    total: 45,
    age: 95,
    sla: 62,
    why: "The photo file is damaged",
    summary:
      "Aiko says the sashimi was warm and sent a photo as proof. The file would not open, so the agent could not check the dish. Nothing has been decided.",
    facts: [
      ["Claim", "Sashimi arrived warm"],
      ["Photo", "File damaged"],
      ["History", "9 orders, 1 earlier claim"],
    ],
    failed: {
      step: "Checking the photo",
      error: "The photo file is damaged and could not be opened.",
      fixes: [
        { label: "Ask customer to resend", primary: true },
        { label: "Approve without the photo" },
      ],
    },
  },
  {
    id: "FD-48229",
    order: "20498 +4",
    decision: "Is Curry Lane open for orders?",
    state: "failed",
    title: "Restaurant tablet is offline",
    who: "Curry Lane",
    restaurant: null,
    total: null,
    age: 40,
    sla: 22,
    why: "Five orders were not confirmed by the restaurant",
    summary:
      "The tablet at Curry Lane has not responded for 40 minutes. The agent could not confirm five orders and cannot tell if the kitchen is open.",
    facts: [
      ["Offline for", "40 min"],
      ["Unconfirmed", "5 orders"],
      ["Last order", "14:06"],
    ],
    failed: {
      step: "Confirming orders",
      error: "The restaurant tablet has not answered for 40 minutes.",
      fixes: [
        { label: "Call the restaurant", primary: true },
        { label: "Pause the restaurant" },
        { label: "Reroute the orders" },
      ],
    },
  },
];
```

## src/format.js

```js
export function money(n) {
  return `$${n.toFixed(2)}`;
}

export function clock(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
```

## src/index.css

```css
:root {
  /* Ground and ink */
  --ground: #f6f6f4;
  --surface: #fff;
  --ink: #141414;
  --ink-2: #5c5c5c;
  --ink-3: #696969;
  --line: rgba(0, 0, 0, 0.08);
  --fill: rgba(0, 0, 0, 0.05);
  --fill-hover: rgba(0, 0, 0, 0.08);
  --slab: rgba(0, 0, 0, 0.05);

  /* The signature colour: a soft, feathery pastel blue. The primary action, the toggle thumbs, focus and chosen states. Ink on it is 12:1 or better. */
  --accent: #cfe3ff;
  --accent-hover: #b8d3fb;
  /* Deeper blue for the check inside a chosen answer: white check at 4.9:1 */
  --accent-ring: #3f6fc2;
  --accent-ring-fade: #4a78c9;
  /* Focus and chosen states: a feathered pastel blue, never a black outline */
  --focus-ring: 0 0 6px 1px rgba(207, 227, 255, 0.5), 0 0 18px 3px rgba(184, 211, 251, 0.9);
  --on-accent: #141414;

  /* States: ink for glyphs and text (5.2:1 or better on their tint), tint for fills, glow for the soft body */
  --approve-ink: #1e6b3b;
  --approve-tint: #e3efe0;
  --approve-glow: #c6e4bf;
  --input-ink: #8a5100;
  --input-tint: #f7e9d1;
  --input-glow: #f6d9a6;
  --failed-ink: #b0291f;
  --failed-tint: #f8dfdb;
  --failed-glow: #f6c2ba;

  /* The agent's own words: a quiet purple to blue to rose line, every stop 5.2:1 or better on white */
  --agent-1: #5a4ba0;
  --agent-2: #3d62b5;
  --agent-3: #a44f7e;

  /* Avatars: soft tints that only tell people apart, ink initials at 14:1 or better */
  --avatar-0: #e3ebe1;
  --avatar-1: #f4e2e6;
  --avatar-2: #eae3f0;
  --avatar-3: #e0e8f4;
  --avatar-4: #f7e5d5;
  --avatar-5: #ecebd6;

  /* Colour fades, after Ramp's charts: full tint at the top, near white at the base. Matte. */
  --thumb-top: var(--accent);
  --thumb-bottom: #f5f9ff;
  --accent-top: var(--accent);
  --accent-bottom: #f5f9ff;
  --accent-hover-top: var(--accent-hover);
  --approve-fade: #f6faf5;
  --input-fade: #fdf8ef;
  --failed-fade: #fdf5f3;
  --neutral-top: #fff;
  --neutral-bottom: #f1f1ef;

  --shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06),
    0 2px 4px 0 rgba(0, 0, 0, 0.04);
  --shadow-lift: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.08),
    0 4px 8px 0 rgba(0, 0, 0, 0.05);

  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -1.2 1.1'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");

  /* Type: nothing is ever heavier than medium. Hierarchy comes from size, ink and space. */
  --w-regular: 400;
  --w-medium: 500;

  /* Joined slabs: outer corners round, inner joints nearly square, a hairline gap between */
  --r-outer: 16px;
  --r-joint: 4px;
  --joint: 4px;
  /* The toggle thumb sits --inset inside its slab, so its corners are concentric with the slab's */
  --r-slab: var(--r-outer);
  --inset: 4px;
  --r-thumb: calc(var(--r-slab) - var(--inset));
  /* Every card's inner padding, all four sides */
  --card-pad: 20px;
  /* Scroll edges feather instead of cutting */
  --feather: 20px;

  /* Motion, one set. JS reads these too (src/motion.js). */
  --ease-out: cubic-bezier(0.2, 0.8, 0.1, 1); /* every enter, exit, state change and slide */
  --ease-move: cubic-bezier(0.77, 0, 0.175, 1); /* rows travelling to close a gap */
  --dur-state: 250ms; /* state changes, the pane, the toast, the toggle glass */
  --dur-menu: 180ms; /* menus and popovers, none in this build yet */
  --dur-fast: 160ms; /* icon swaps, hover in */
  --dur-exit: 150ms; /* exits are shorter than enters */
  --dur-close: 320ms; /* the focus sheet closing: one unhurried fade, everything together */
  --dur-open: 320ms; /* the focus sheet opening: the same, everything arrives as one */
  --dur-delight: 400ms; /* the last ending bit: queue clear */
  --t: var(--dur-state) var(--ease-out);
}

* {
  box-sizing: border-box;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  line-height: 20px;
  font-weight: var(--w-regular);
}

h1,
h2 {
  font-family: "Plus Jakarta Sans", "DM Sans", system-ui, sans-serif;
  font-weight: var(--w-medium);
}

h3,
h4,
b,
strong,
dt,
th {
  font-weight: var(--w-medium);
}

h1,
h2,
h3,
h4,
p,
dl,
dd,
ul,
ol {
  margin: 0;
  padding: 0;
}

ul,
ol {
  list-style: none;
}

button,
input,
textarea {
  font: inherit;
  color: inherit;
}

button {
  cursor: pointer;
  border: 0;
  background: none;
  padding: 0;
}

:focus-visible {
  outline: 0;
  box-shadow: var(--focus-ring);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.num {
  font-variant-numeric: tabular-nums;
}

.late {
  color: var(--failed-ink);
}

.strong {
  font-weight: var(--w-medium);
}

/* Icon family: frosted marks. A glow body, a glass highlight, static grain, a crisp glyph. */

.mark {
  position: relative;
  display: inline-grid;
  place-items: center;
  flex: none;
  border-radius: 50%;
  color: var(--mark-ink);
  background: linear-gradient(to bottom, var(--mark-glow), var(--mark-fade));
  box-shadow: inset 0 0 0 1px var(--mark-rim), 0 0 6px 0 var(--mark-halo);
}

.mark::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: var(--grain);
  background-size: 70px;
  opacity: 0.22;
  mix-blend-mode: multiply;
  pointer-events: none;
}

.mark .glyph {
  position: relative;
  z-index: 1;
}

.glyph path {
  vector-effect: non-scaling-stroke;
  stroke-width: 1.4px;
}

.tone-approval {
  --mark-ink: var(--approve-ink);
  --mark-glow: var(--approve-glow);
  --mark-tint: var(--approve-tint);
  --mark-rim: color-mix(in srgb, var(--approve-ink) 16%, transparent);
  --mark-halo: color-mix(in srgb, var(--approve-glow) 60%, transparent);
  --mark-fade: var(--approve-fade);
}

.tone-input {
  --mark-ink: var(--input-ink);
  --mark-glow: var(--input-glow);
  --mark-tint: var(--input-tint);
  --mark-rim: color-mix(in srgb, var(--input-ink) 16%, transparent);
  --mark-halo: color-mix(in srgb, var(--input-glow) 60%, transparent);
  --mark-fade: var(--input-fade);
}

.tone-failed {
  --mark-ink: var(--failed-ink);
  --mark-glow: var(--failed-glow);
  --mark-tint: var(--failed-tint);
  --mark-rim: color-mix(in srgb, var(--failed-ink) 16%, transparent);
  --mark-halo: color-mix(in srgb, var(--failed-glow) 60%, transparent);
  --mark-fade: var(--failed-fade);
}

/* Clear glass: icon buttons and an empty radio. No grey tile, the glyph colour is the feedback. */
.tone-neutral {
  --mark-ink: currentColor;
  --mark-glow: var(--neutral-top);
  --mark-fade: var(--neutral-bottom);
  --mark-rim: var(--line);
  --mark-halo: transparent;
}

/* Grey: a chosen radio, white check at 4.3:1 */
.tone-ink {
  --mark-ink: #fff;
  --mark-glow: #7a7a7a;
  --mark-fade: #8a8a8a;
  --mark-rim: transparent;
  --mark-halo: rgba(0, 0, 0, 0.12);
}

.avatar {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 11px;
  line-height: 1;
  font-weight: var(--w-medium);
  color: var(--ink);
}

.avatar[data-tone="0"] {
  background: var(--avatar-0);
}
.avatar[data-tone="1"] {
  background: var(--avatar-1);
}
.avatar[data-tone="2"] {
  background: var(--avatar-2);
}
.avatar[data-tone="3"] {
  background: var(--avatar-3);
}
.avatar[data-tone="4"] {
  background: var(--avatar-4);
}
.avatar[data-tone="5"] {
  background: var(--avatar-5);
}

/* Layout */

.app {
  height: 100dvh;
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  column-gap: 24px;
  padding: 24px;
}

/* The title sits on the queue column's edge, the same line as the slabs */
.top {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 40px;
  padding: 0 0 16px;
}

.brand {
  flex: none;
  font-size: 20px;
  line-height: 28px;
  letter-spacing: -0.02em;
}

.stats {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;
  font-size: 14px;
  color: var(--ink-2);
}

.stat {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.stat-n {
  color: var(--ink);
  font-weight: var(--w-medium);
}

.reset,
.back,
.step {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--ink-3);
  transition: color var(--dur-fast) var(--ease-out);
}

.reset {
  margin: -8px -8px -8px 0;
}

.step:disabled {
  opacity: 0.4;
  cursor: default;
}

@media (hover: hover) {
  .reset:hover,
  .back:hover,
  .step:not(:disabled):hover {
    color: var(--ink);
  }
}

/* Queue */

.queue {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.slabs {
  display: grid;
  gap: var(--joint);
  margin-bottom: 16px;
}

.slab {
  position: relative;
  padding: var(--inset);
  background: var(--slab);
  border-radius: var(--r-joint);
}

.slab:first-child {
  border-top-left-radius: var(--r-outer);
  border-top-right-radius: var(--r-outer);
}

.slab:last-child {
  border-bottom-left-radius: var(--r-outer);
  border-bottom-right-radius: var(--r-outer);
}

/* Segmented: one glass pill glides under the labels (src/components/Segmented.jsx) */

/* Equal cells that fill the slab, label and count centred together as one unit */
.seg {
  position: relative;
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: 4px;
}

/* The thumb: pastel blue fading to near white, one soft shadow that hugs it */
.seg-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  filter: drop-shadow(0 0 0.5px rgba(0, 0, 0, 0.18)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.08));
}

.seg-pill {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, var(--thumb-top), var(--thumb-bottom));
  transition: clip-path var(--dur-state) var(--ease-out);
}

.seg-opt {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  min-height: 40px;
  padding: 0 8px;
  border-radius: var(--r-thumb);
  font-size: 13px;
  font-weight: var(--w-medium);
  white-space: nowrap;
  color: var(--ink-2);
  transition: color var(--t);
}

.seg-opt[aria-checked="true"] {
  color: var(--ink);
}

@media (hover: hover) {
  .seg-opt[aria-checked="false"]:hover {
    color: var(--ink);
  }
}

.seg-count {
  display: inline-flex;
  color: var(--ink-3);
  font-weight: var(--w-regular);
  transition: color var(--t);
}

/* Odometer digits: a fixed box each, the roll is clipped inside it */
.digit {
  position: relative;
  display: inline-block;
  overflow: hidden;
  height: 20px;
}

.digit .d {
  display: block;
}

.digit .ghost {
  position: absolute;
  inset: 0;
}

.seg-opt[aria-checked="true"] .seg-count {
  color: var(--ink-2);
}

/* Feathered scroll edges, set by App only when an edge has content beyond it */
[data-fade="top"] {
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 var(--feather));
  mask-image: linear-gradient(to bottom, transparent, #000 var(--feather));
}

[data-fade="bottom"] {
  -webkit-mask-image: linear-gradient(to top, transparent, #000 var(--feather));
  mask-image: linear-gradient(to top, transparent, #000 var(--feather));
}

[data-fade="both"] {
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent,
    #000 var(--feather),
    #000 calc(100% - var(--feather)),
    transparent
  );
  mask-image: linear-gradient(
    to bottom,
    transparent,
    #000 var(--feather),
    #000 calc(100% - var(--feather)),
    transparent
  );
}

.rows {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* A hairline scrollbar: 4px, faint thumb, no track (WebKit below, Firefox falls back to thin) */
  margin: 0 -8px;
  padding: 0 8px 8px;
}

.rows li + li {
  margin-top: 4px;
}

/* Selection is instant: rows are moved through with j and k many times a day */
.row {
  width: 100%;
  min-height: 64px;
  display: grid;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 12px;
  text-align: left;
}

.row[aria-current="true"] {
  background: var(--surface);
  box-shadow: var(--shadow);
}

@media (hover: hover) {
  .row[aria-current="false"]:hover {
    background: var(--surface);
    box-shadow: var(--shadow);
    transition: box-shadow var(--dur-fast) var(--ease-out),
      background-color var(--dur-fast) var(--ease-out);
  }
  .row[aria-current="true"]:hover {
    box-shadow: var(--shadow-lift);
  }
}

.row.ghost {
  position: absolute;
  pointer-events: none;
}

.row-title {
  font-weight: var(--w-medium);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  line-height: 16px;
  color: var(--ink-2);
}

.row-status {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.row-status span:not(.mark) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Empty and old panes share the white card */

.detail {
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: 20px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.detail.empty {
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 24px;
  font-weight: var(--w-medium);
}

.detail-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* A hairline scrollbar: 4px, faint thumb, no track (WebKit below, Firefox falls back to thin) */
  container-type: inline-size;
  padding: 48px 56px 56px;
}

.detail-inner {
  max-width: 880px;
}

/* After a resolve the next case arrives from the right, after an undo from the left */
.enter-forward .detail-inner {
  animation: pane-forward var(--dur-state) var(--ease-out) backwards;
}

.enter-back .detail-inner {
  animation: pane-back var(--dur-state) var(--ease-out) backwards;
}

@keyframes pane-forward {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
}

@keyframes pane-back {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
}

.back {
  display: none;
  margin: -8px 0 8px -8px;
}

/* Case pane: structured like a review page. Header, key facts with the reason docked under
   them, the agent's recommendation card with its action bar, then evidence modules. */

.detail.case {
  background: none;
  box-shadow: none;
  border-radius: 0;
  overflow: visible;
}

.detail.case .detail-scroll {
  margin: -4px -8px 0;
  padding: 4px 8px 48px;
}

.detail.case .detail-inner {
  max-width: 1040px;
}

/* The headline's left edge and every card's outer edge share one line; card content is
   indented by --card-pad on all four sides. */
.case-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  column-gap: 24px;
  padding: 0;
}

.case-head .decision {
  grid-column: 1;
}

.case-tools {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
}

.case-sub {
  grid-column: 1 / -1;
  max-width: 720px;
  margin-top: 8px;
  font-size: 15px;
  line-height: 22px;
  color: var(--ink-2);
  text-wrap: pretty;
}

.decision {
  font-size: 28px;
  line-height: 36px;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.pill-state,
.pill-time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: var(--w-medium);
  white-space: nowrap;
}

.pill-state.tone-approval {
  background: linear-gradient(to bottom, var(--approve-tint), var(--approve-fade));
  color: var(--approve-ink);
}
.pill-state.tone-input {
  background: linear-gradient(to bottom, var(--input-tint), var(--input-fade));
  color: var(--input-ink);
}
.pill-state.tone-failed {
  background: linear-gradient(to bottom, var(--failed-tint), var(--failed-fade));
  color: var(--failed-ink);
}

.pill-time {
  background: var(--slab);
  color: var(--ink-2);
}

.steps {
  display: flex;
  margin-right: -8px;
}

.case-stack {
  display: grid;
  gap: var(--joint);
  margin-top: 24px;
}

/* Key facts: one card cut into cells by hairlines, never two lines in a row */
.facts-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1px;
  overflow: hidden;
  border-radius: var(--r-outer) var(--r-outer) var(--r-joint) var(--r-joint);
  background: var(--line);
  box-shadow: var(--shadow);
}

.cell {
  display: grid;
  align-content: start;
  gap: 4px;
  min-width: 0;
  padding: 12px var(--card-pad);
  background: var(--surface);
}

.cell-label {
  font-size: 12px;
  line-height: 16px;
  color: var(--ink-2);
}

.cell-value {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  white-space: nowrap;
}

.cell-value > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* The mark sits inline at the start, so the callout text block keeps the pane's one text edge */
.callout {
  display: block;
  padding: 12px var(--card-pad);
  border-radius: var(--r-joint) var(--r-joint) var(--r-outer) var(--r-outer);
  box-shadow: var(--shadow);
  font-size: 15px;
  line-height: 22px;
  font-weight: var(--w-medium);
  text-wrap: pretty;
}

.callout .mark {
  margin-right: 8px;
  vertical-align: -4px;
}

.callout.tone-approval {
  background: linear-gradient(to bottom, var(--approve-tint), var(--approve-fade));
}
.callout.tone-input {
  background: linear-gradient(to bottom, var(--input-tint), var(--input-fade));
}
.callout.tone-failed {
  background: linear-gradient(to bottom, var(--failed-tint), var(--failed-fade));
}

.case-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  margin-top: 16px;
}

.case-col {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.card {
  min-width: 0;
  padding: var(--card-pad);
  border-radius: var(--r-outer);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.card-title {
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 16px;
  color: var(--ink-2);
}

/* The recommendation card and its docked action bar */
.rec {
  display: grid;
  gap: var(--joint);
}

.rec > .card {
  border-radius: var(--r-outer) var(--r-outer) var(--r-joint) var(--r-joint);
}

.rec-title {
  font-size: 17px;
  line-height: 24px;
  font-weight: var(--w-medium);
}

.rec-note {
  margin-top: 4px;
  color: var(--ink-2);
  text-wrap: pretty;
}

.agent-voice {
  width: fit-content;
  background: linear-gradient(90deg, var(--agent-1), var(--agent-2) 55%, var(--agent-3));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--joint);
  padding: var(--card-pad);
  border-radius: var(--r-joint) var(--r-joint) var(--r-outer) var(--r-outer);
  background: var(--surface);
  box-shadow: var(--shadow);
}

/* The bar is a card: its first button's edge sits on the card text edge */
.bar .btn {
  border-radius: var(--r-joint);
}

.bar .btn:first-child {
  border-radius: 12px var(--r-joint) var(--r-joint) 12px;
}

.bar .btn:last-child {
  border-radius: var(--r-joint) 12px 12px var(--r-joint);
}

.bar .btn:only-child {
  border-radius: 12px;
}

/* Key and value list inside a module: lines only between rows */
.kv > div {
  display: grid;
  grid-template-columns: minmax(96px, 0.8fr) minmax(0, 1.4fr);
  gap: 12px;
  padding: 8px 0;
}

.kv > div + div {
  border-top: 1px solid var(--line);
}

.kv > div:first-child {
  padding-top: 0;
}

.kv > div:last-child {
  padding-bottom: 0;
}

.kv dt {
  font-weight: var(--w-regular);
  color: var(--ink-2);
}

/* Fields */

.proposal {
  font-size: 16px;
  line-height: 24px;
  font-weight: var(--w-medium);
}

.label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 16px;
  font-weight: var(--w-medium);
  color: var(--ink-2);
}

.field {
  display: block;
  margin-top: 16px;
}

.field-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 16px;
}

.hint {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 16px;
  color: var(--ink-2);
}

.hint.error {
  color: var(--failed-ink);
}

.control {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--fill);
}

.control.money {
  gap: 4px;
  font-weight: var(--w-medium);
}

.control input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: none;
  padding: 0;
  font-weight: var(--w-medium);
  font-variant-numeric: tabular-nums;
}

.control input:focus-visible {
  outline: 0;
}

.control:focus-within {
  /* Text fields change nothing on focus: the caret is the signal */
  outline: 0;
  box-shadow: none;
}

.control.static {
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  line-height: 40px;
}

.control.area {
  display: block;
  padding: 12px;
  border: 0;
  resize: none;
  line-height: 22px;
  font-size: 15px;
}

.control.area:focus-visible {
  /* Text fields change nothing on focus: the caret is the signal */
  outline: 0;
  box-shadow: none;
}

.options {
  display: grid;
  gap: 8px;
}

.option {
  /* The chosen outline is feathered: a thin blue line, a soft halo, then a wider glow fading out */
  --ring: rgba(63, 111, 194, 0);
  --ring-halo: rgba(207, 227, 255, 0);
  --ring-glow: rgba(184, 211, 251, 0);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 48px;
  padding: 12px 16px;
  border-radius: 12px;
  text-align: left;
  font-size: 15px;
  /* The chosen ring fades in: both states keep the same shadow layers, so the colour interpolates */
  box-shadow: 0 0 0 1px var(--ring), 0 0 6px 1px var(--ring-halo), 0 0 18px 3px var(--ring-glow), var(--shadow);
  transition: box-shadow var(--t);
}

@media (hover: hover) {
  .option:hover {
    box-shadow: 0 0 0 1px var(--ring), 0 0 6px 1px var(--ring-halo), 0 0 18px 3px var(--ring-glow), var(--shadow-lift);
  }
}

.option[aria-checked="true"] {
  /* A thin grey outline, the scrollbar thumb's grey, no glow */
  --ring: rgba(0, 0, 0, 0.18);
  --ring-halo: rgba(207, 227, 255, 0);
  --ring-glow: rgba(184, 211, 251, 0);
  box-shadow: 0 0 0 1px var(--ring), 0 0 6px 1px var(--ring-halo), 0 0 18px 3px var(--ring-glow), var(--shadow);
}

.option > .mark {
  margin-top: 3px;
}

.option-body {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.option-label {
  font-weight: var(--w-medium);
}

.next {
  display: grid;
  gap: 2px;
  font-size: 13px;
  line-height: 18px;
  color: var(--ink-2);
}

/* Buttons. The primary action of a case is the only blue button on screen. */

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--joint);
  margin-top: 32px;
}

.btn {
  min-height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: var(--w-medium);
  white-space: nowrap;
  transition: background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.buttons.joined .btn:not(:only-child):first-child {
  border-radius: 999px var(--r-joint) var(--r-joint) 999px;
}

.buttons.joined .btn:not(:only-child):last-child {
  border-radius: var(--r-joint) 999px 999px var(--r-joint);
}

.buttons.joined .btn:not(:first-child):not(:last-child) {
  border-radius: var(--r-joint);
}

.btn.primary {
  background: linear-gradient(to bottom, var(--accent-top), var(--accent-bottom));
  color: var(--on-accent);
}

.btn.quiet {
  background: var(--fill);
}

/* Disabled reads as off: grey, not a faded blue */
.btn:disabled,
.btn.primary:disabled {
  background: var(--fill);
  color: var(--ink-3);
  cursor: default;
}

@media (hover: hover) {
  .btn.primary:not(:disabled):hover {
    background: linear-gradient(to bottom, var(--accent-hover-top), var(--accent-top));
  }
  .btn.quiet:not(:disabled):hover {
    background: var(--fill-hover);
  }
}

/* Evidence */

.receipt .line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
}

.receipt .line:first-child {
  padding-top: 0;
}

.receipt .line:last-child {
  padding-bottom: 0;
}

.receipt .line + .line {
  border-top: 1px solid var(--line);
}

.line-name {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
}

.line-flag {
  padding: 0 8px;
  border-radius: 999px;
  background: linear-gradient(to bottom, var(--failed-tint), var(--failed-fade));
  color: var(--failed-ink);
  font-size: 12px;
  line-height: 20px;
  font-weight: var(--w-medium);
}

.line.missing,
.line.total {
  font-weight: var(--w-medium);
}

.compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--joint);
}

.compare-side {
  display: grid;
  gap: 4px;
  align-content: start;
  padding: 12px 16px;
  border-radius: var(--r-joint);
  /* No grey fill: a thin translucent outline, unobtrusive */
  background: none;
  box-shadow: inset 0 0 0 1px var(--line);
}

.compare-side:first-child {
  border-radius: 12px var(--r-joint) var(--r-joint) 12px;
}

.compare-side:last-child {
  border-radius: var(--r-joint) 12px 12px var(--r-joint);
}

.compare-label {
  font-size: 12px;
  line-height: 16px;
  color: var(--ink-2);
}

.compare-value {
  font-family: "Plus Jakarta Sans", "DM Sans", system-ui, sans-serif;
  font-size: 20px;
  line-height: 24px;
  font-weight: var(--w-medium);
  letter-spacing: -0.01em;
}

.compare-note {
  font-size: 13px;
  line-height: 18px;
  color: var(--ink-2);
}

.pay {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.pay .label {
  margin: 0;
}

.pay-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: var(--w-medium);
}

/* Timeline: a quiet list, times on a fixed column, no row lines */
.log-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  padding: 4px 0;
  color: var(--ink-2);
}

.log-time {
  color: var(--ink-3);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  vertical-align: bottom;
  font-weight: var(--w-medium);
  color: var(--ink);
  white-space: nowrap;
}

/* The status check answering: new log rows rise in, the text and the glyph swap */
.log-item.arrive {
  animation: arrive var(--dur-state) var(--ease-out) backwards;
}

.arrive-text {
  animation: fade var(--dur-state) var(--ease-out) backwards;
}

.swap-in {
  transform-box: fill-box;
  transform-origin: center;
  animation: swap var(--dur-fast) var(--ease-out) backwards;
}

@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}

@keyframes fade {
  from {
    opacity: 0;
  }
}

@keyframes swap {
  from {
    opacity: 0;
    transform: scale(0.25);
    filter: blur(4px);
  }
}

.sent {
  padding: 16px;
  border-radius: 12px;
  background: var(--fill);
  font-size: 15px;
  line-height: 22px;
  white-space: pre-wrap;
}

/* Old pane, kept at ?pane=old for comparison */

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 24px;
  margin-top: 12px;
  color: var(--ink-2);
}

.meta-strong {
  color: var(--ink);
  font-weight: var(--w-medium);
}

.q {
  margin-top: 24px;
}

.meta + .q {
  margin-top: 32px;
}

.q-act {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.body {
  max-width: 640px;
  font-size: 16px;
  line-height: 24px;
  text-wrap: pretty;
}

.why {
  position: relative;
  font-size: 16px;
  line-height: 24px;
  font-weight: var(--w-medium);
  text-wrap: pretty;
}

.q + .q:not(.q-act) {
  margin-top: 10px;
}

.why .mark {
  position: absolute;
  left: -24px;
  top: 4px;
}

.act {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 56px;
  align-items: start;
}

.evidence > :not(.sr-only) ~ :not(.sr-only) {
  margin-top: 24px;
}

.evidence .receipt {
  padding: 8px 16px;
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.evidence .receipt .line:first-child {
  padding-top: 8px;
}

.evidence .receipt .line:last-child {
  padding-bottom: 8px;
}

.facts .fact {
  padding: 12px 0;
  border-top: 1px solid var(--line);
}

.facts .fact:last-child {
  border-bottom: 1px solid var(--line);
}

.fact dt {
  color: var(--ink-2);
  font-size: 13px;
  line-height: 16px;
  font-weight: var(--w-regular);
}

.fact dd {
  margin-top: 4px;
}

/* Toast: rises 8px on the way in, sinks the same 8px faster on the way out */

.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  translate: -50% 0;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: calc(100vw - 32px);
  padding: 4px 4px 4px 20px;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  box-shadow: var(--shadow-lift);
  transition: opacity var(--dur-state) var(--ease-out),
    transform var(--dur-state) var(--ease-out), visibility 0s;
}

@starting-style {
  .toast[data-open="true"] {
    opacity: 0;
    transform: translateY(8px);
  }
}

.toast[data-open="false"] {
  opacity: 0;
  transform: translateY(8px);
  visibility: hidden;
  pointer-events: none;
  transition-duration: var(--dur-exit), var(--dur-exit), 0s;
  transition-delay: 0s, 0s, var(--dur-exit);
}

.toast-text {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.toast button {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-weight: var(--w-medium);
  transition: background-color var(--dur-fast) var(--ease-out);
}

@media (hover: hover) {
  .toast button:hover {
    background: rgba(255, 255, 255, 0.22);
  }
}

/* Queue clear: frosted glass docked as a disc and a pill, over one soft glow per state */

.detail.clear {
  position: relative;
  overflow: hidden;
  touch-action: none;
}

.clear-stage {
  position: relative;
  display: grid;
  place-items: center;
}

.aura {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 480px;
  height: 280px;
  translate: -50% -50%;
  pointer-events: none;
}

.glow {
  position: absolute;
  width: 168px;
  height: 168px;
}

/* Each glow sits off an edge of the glass, so the centre stays clear and only the rim takes colour */
.glow-approval {
  left: 40px;
  top: 64px;
}

.glow-input {
  right: 56px;
  top: 0;
}

.glow-failed {
  right: 96px;
  bottom: 0;
}

.glow-fill {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  filter: blur(36px);
  opacity: 0.85;
  will-change: transform;
  transition: transform var(--dur-delight) var(--ease-out);
}

.glow-approval .glow-fill {
  background: var(--approve-glow);
}

.glow-input .glow-fill {
  background: var(--input-glow);
}

.glow-failed .glow-fill {
  background: var(--failed-glow);
}

/* Static grain on the glow only, never over the type */
.grain {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  mix-blend-mode: multiply;
  background-image: var(--grain);
  -webkit-mask-image: radial-gradient(closest-side, #000 40%, transparent);
  mask-image: radial-gradient(closest-side, #000 40%, transparent);
}

.glass {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--joint);
}

.glass-disc,
.glass-pill {
  display: flex;
  align-items: center;
  height: 56px;
  background: rgba(255, 255, 255, 0.55);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  backdrop-filter: blur(20px) saturate(1.5);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45), 0 1px 2px -1px rgba(0, 0, 0, 0.06),
    0 4px 12px 0 rgba(0, 0, 0, 0.04);
}

.glass-disc {
  justify-content: center;
  width: 56px;
  border-radius: 999px var(--r-joint) var(--r-joint) 999px;
  color: var(--approve-ink);
}

.glass-pill {
  padding: 0 28px 0 22px;
  border-radius: var(--r-joint) 999px 999px var(--r-joint);
  font-size: 20px;
  line-height: 24px;
  font-weight: var(--w-medium);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* Only when the last case is resolved here: the glow blooms and the glass settles, 400ms, then still */
.clear-stage.play .glow {
  animation: bloom var(--dur-delight) var(--ease-out) backwards;
}

.clear-stage.play .glass-disc,
.clear-stage.play .glass-pill {
  animation: settle var(--dur-delight) var(--ease-out) backwards;
}

@keyframes bloom {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}

@keyframes settle {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
}

/* Narrow pane container */

@container (max-width: 720px) {
  .act,
  .case-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .act {
    gap: 32px;
  }

  .evidence {
    order: -1;
  }

  .q-act {
    padding-top: 0;
    border-top: 0;
  }

  .case-head {
    grid-template-columns: minmax(0, 1fr);
  }

  .case-tools {
    grid-column: 1;
    grid-row: auto;
    order: -1;
    margin-bottom: 12px;
  }

  .case-head .back {
    order: -2;
  }

  .field-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
}

/* Narrow screens: list first, case on top of it */

@media (max-width: 860px) {
  .app {
    grid-template-columns: minmax(0, 1fr);
    padding: 16px;
  }

  .app .detail {
    display: none;
  }

  .app.show-detail .detail {
    display: flex;
  }

  .app.show-detail .queue {
    display: none;
  }

  /* Nothing to list: the empty pane takes the space under the switch */
  .app.is-empty {
    grid-template-rows: auto auto minmax(0, 1fr);
  }

  .app.is-empty .detail {
    display: flex;
  }

  .back {
    display: flex;
  }

  .steps {
    display: none;
  }

  .detail-scroll {
    padding: 24px;
  }

  .detail.case .detail-scroll {
    padding: 4px 8px 32px;
  }

  .case-head {
    padding: 0;
  }

  .decision {
    font-size: 24px;
    line-height: 32px;
  }

  /* No margin to hang the glyph in, so it sits at the start of the line */
  .why .mark {
    position: static;
    display: inline-grid;
    margin-right: 8px;
    vertical-align: -3px;
  }
}

/* Reduced motion: nothing travels, scales or blurs; opacity still carries the change */

@media (prefers-reduced-motion: reduce) {
  .seg-pill {
    transition-property: opacity;
  }

  .glow-fill {
    transition: none;
  }

  .toast,
  .toast[data-open="false"] {
    transform: none;
  }

  @starting-style {
    .toast[data-open="true"] {
      transform: none;
    }
  }

  @keyframes pane-forward {
    from {
      opacity: 0;
    }
  }

  @keyframes pane-back {
    from {
      opacity: 0;
    }
  }

  @keyframes arrive {
    from {
      opacity: 0;
    }
  }

  @keyframes swap {
    from {
      opacity: 0;
    }
  }

  @keyframes bloom {
    from {
      opacity: 0;
    }
  }

  @keyframes settle {
    from {
      opacity: 0;
    }
  }
}

/* Focus sheet. Cast: the sheet leads, the docked cluster supports, the scrim decorates,
   the app behind is still. Open: scrim and sheet start together, 250ms on her ease-out,
   the sheet rising 16px from its trigger, scale 0.96 and blur 8px to rest. The cluster lands
   from 80ms, 40ms apart, the last on the 400ms delight tail. Close: all together, 150ms,
   the way it came. Size: a clip-path. The cluster travels on transform. */

.focus {
  --sheet-y: 72px;
  --sheet-x: max(72px, calc((100vw - 1180px) / 2));
  --dock: 44px;
  --kiss: 3px;
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}

.focus[data-open="true"] {
  pointer-events: auto;
}

.focus-scrim {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 10, 0.6);
  opacity: 0;
  -webkit-backdrop-filter: blur(0);
  backdrop-filter: blur(0);
  /* Feather out mirrors the feather in: same length, the scrim lifts as the sheet goes */
  transition: opacity var(--dur-state) var(--ease-out), backdrop-filter var(--dur-state) var(--ease-out),
    -webkit-backdrop-filter var(--dur-state) var(--ease-out);
}

.focus-sheet {
  position: absolute;
  inset: 0;
  background: var(--ground);
  /* The corner the cluster docks to takes the same joint radius as the pill and buttons, for one cohesive shape */
  clip-path: inset(var(--sheet-y) var(--sheet-x) round 24px var(--r-joint) 24px 24px);
  transform-origin: var(--origin, 50% 50%);
  /* Closed: the intro in reverse, so it feathers out the way it came in */
  opacity: 0;
  transform: translateY(16px) scale(0.96);
  filter: blur(8px);
  transition: opacity var(--dur-state) var(--ease-out), transform var(--dur-state) var(--ease-out),
    filter var(--dur-state) var(--ease-out), clip-path var(--dur-state) var(--ease-out);
}

/* Enter start values, applied for one frame with no transition */
.focus[data-phase="pre"] .focus-sheet {
  transform: translateY(16px) scale(0.96);
  filter: blur(8px);
  transition: none;
}

.focus[data-phase="open"] .focus-scrim {
  opacity: 1;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  transition-duration: var(--dur-open);
}

.focus[data-phase="open"] .focus-sheet {
  opacity: 1;
  transform: none;
  filter: none;
  transition-duration: var(--dur-open), var(--dur-open), var(--dur-open), var(--dur-state);
}

.focus[data-full="true"] .focus-sheet {
  clip-path: inset(0 round 0);
}

/* The content keeps one inset in both sizes, so nothing reflows when the sheet grows */
.focus-sheet .detail.case {
  height: 100%;
}

.focus-sheet .detail.case .detail-scroll {
  margin: 0;
  padding: calc(var(--sheet-y) + 40px) calc(var(--sheet-x) + 40px) calc(var(--sheet-y) + 40px);
}

.focus-sheet .detail.case .detail-inner {
  margin: 0 auto;
}

/* Open in focus: the one control with a spring, at her ask. It rests a touch small, springs up
   with a small overshoot when pointed at or focused, dips on press, then springs back. The glyph
   scales, the 40px hit area does not. */
.focus-open > .mark {
  transform: scale(0.88);
  transition: transform 380ms linear(0, 0.157 7.6%, 0.551 17.5%, 0.94 29.4%, 1.075 38.2%, 1.11 44.3%, 1.096 51.5%, 1.012 68.6%, 0.99 78%, 1);
}

@media (hover: hover) {
  .focus-open:hover > .mark {
    transform: scale(1);
  }
}

.focus-open:focus-visible > .mark {
  transform: scale(1);
}

.focus-open:active > .mark {
  transform: scale(0.9);
  transition-duration: 90ms;
  transition-timing-function: var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .focus-open > .mark,
  .focus-open:active > .mark {
    transform: none;
    transition: none;
  }
}

.focus-sheet .focus-open {
  display: none;
}

/* The docked cluster. Its cross point is the sheet's top right corner: the prompt pill sits
   above the sheet ending on its right edge, close sits right of the pill, expand sits under
   close beside the sheet. Kissing shapes, 3px of scrim between them, square at the joints. */
.focus-dock {
  position: absolute;
  top: var(--sheet-y);
  right: var(--sheet-x);
  width: 0;
  height: 0;
  transition: transform var(--dur-state) var(--ease-out);
}

.focus[data-full="true"] .focus-dock {
  transform: translate(
    calc(var(--sheet-x) - 16px - var(--dock) - var(--kiss)),
    calc(16px + var(--dock) + var(--kiss) - var(--sheet-y))
  );
}

.dock-shape {
  position: absolute;
  display: flex;
  align-items: center;
  height: var(--dock);
  background: linear-gradient(to bottom, var(--neutral-top), var(--neutral-bottom));
  box-shadow: 0 1px 2px -1px rgba(0, 0, 0, 0.12), 0 2px 6px 0 rgba(0, 0, 0, 0.06);
  color: var(--ink-2);
  pointer-events: auto;
  opacity: 0;
  transform: scale(0.9);
  filter: blur(4px);
  transition: opacity var(--dur-state) var(--ease-out), transform var(--dur-state) var(--ease-out),
    filter var(--dur-state) var(--ease-out), color var(--dur-fast) var(--ease-out);
}

/* Leaving, everything goes as one: sheet, cluster and scrim on the same slower, softer fade,
   so no button is left behind */
.focus[data-phase="closed"] .dock-shape,
.focus[data-phase="closed"] .focus-sheet,
.focus[data-phase="closed"] .focus-scrim {
  transition-duration: var(--dur-close);
  transition-delay: 0s;
}

.focus[data-phase="pre"] .dock-shape {
  transform: scale(0.9);
  filter: blur(4px);
  transition: none;
}

.focus[data-phase="open"] .dock-shape {
  opacity: 1;
  transform: none;
  filter: none;
  /* Opens with the sheet, as one: no button lands late */
  transition-duration: var(--dur-open), var(--dur-open), var(--dur-open), var(--dur-fast);
  transition-delay: 0s;
}

.dock-ask {
  right: 0;
  bottom: var(--kiss);
  width: auto;
  max-width: min(420px, calc(100vw - 2 * var(--sheet-x) - 24px));
  gap: 10px;
  padding: 0 20px 0 16px;
  border-radius: 22px 22px var(--r-joint) 22px;
  transform-origin: 100% 100%;
  color: var(--agent-1);
}

.dock-close,
.dock-size {
  justify-content: center;
  width: var(--dock);
}

.dock-close {
  left: var(--kiss);
  bottom: var(--kiss);
  border-radius: 22px 22px 22px var(--r-joint);
  transform-origin: 0 100%;
}

.dock-size {
  left: var(--kiss);
  top: var(--kiss);
  border-radius: var(--r-joint) 22px 22px 22px;
  transform-origin: 0 0;
}

@media (hover: hover) {
  .dock-close:hover,
  .dock-size:hover {
    color: var(--ink);
  }
}

.ask-input {
  /* Sits over the hint and spans the text area; the hint sets the width */
  position: absolute;
  z-index: 1;
  left: 44px;
  right: 20px;
  top: 0;
  min-width: 0;
  height: 100%;
  border: 0;
  background: none;
  padding: 0;
  font-size: 15px;
  color: var(--ink);
}

.ask-input:focus-visible {
  outline: 0;
}

.dock-ask:focus-within {
  /* Text fields change nothing on focus: the caret is the signal */
  outline: 0;
  box-shadow: none;
}

.ask-hint {
  /* In flow, so the pill hugs the placeholder with no dead space after it */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 15px;
  pointer-events: none;
}

/* Phone: the sheet is the whole screen and the cluster sits inside its top right */
@media (max-width: 860px) {
  .focus {
    --sheet-y: 0px;
    --sheet-x: 0px;
  }

  .focus-sheet,
  .focus[data-full="true"] .focus-sheet {
    clip-path: inset(0 round 0);
  }

  .focus-dock,
  .focus[data-full="true"] .focus-dock {
    transform: translate(calc(-12px - var(--dock) - var(--kiss)), calc(12px + var(--dock) + var(--kiss)));
  }

  .dock-ask {
    width: calc(100vw - 24px - var(--dock) - 2 * var(--kiss) - 12px);
  }

  .dock-size {
    display: none;
  }

  .focus-sheet .detail.case .detail-scroll {
    padding: calc(24px + var(--dock)) 16px 32px;
  }
}

/* Reduced motion for the focus sheet: fades only, no rise, scale, blur or travel */
@media (prefers-reduced-motion: reduce) {
  .focus .focus-sheet,
  .focus[data-phase] .focus-sheet {
    transform: none;
    filter: none;
    transition-property: opacity;
  }

  .focus .dock-shape,
  .focus[data-phase] .dock-shape {
    transform: none;
    transition-property: opacity, color;
  }

  .focus-dock {
    transition: none;
  }
}

/* Inside the sheet the docked close does the back button's job */
.focus-sheet .back {
  display: none;
}

/* Scrollbars, everywhere: a 4px hairline thumb with no track */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.14);
  border-radius: 999px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.24);
}

@supports not selector(::-webkit-scrollbar) {
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.14) transparent;
  }
}
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

## src/motion.js

```js
// Reads the motion tokens from index.css, so CSS and the few JS animations share one set.
const cache = {};

export function token(name) {
  if (cache[name] != null) return cache[name];
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = raw.endsWith("ms") ? parseFloat(raw) : raw;
  cache[name] = value;
  return value;
}

export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

## src/components/Avatar.jsx

```jsx
// Initials on a soft tint. The tint only tells people apart; it follows the name, so the
// same person always gets the same one.
export default function Avatar({ name }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span className="avatar" data-tone={h % 6} aria-hidden="true">
      {initials}
    </span>
  );
}
```

## src/components/Detail.jsx

```jsx
import { useRef, useState } from "react";
import { ChevronLeft, Mark, RadioMark, StateIcon } from "./Icons";
import Avatar from "./Avatar";
import { STATES } from "../data";
import { money } from "../format";

const cents = (n) => Math.round(n * 100);

function Chip({ s }) {
  return (
    <span className="chip">
      <StateIcon state={s.state} />
      {s.text}
    </span>
  );
}

// Rows from `from` on arrived after a press in this view, so they rise in; earlier rows sit still.
function Timeline({ log, from = Infinity }) {
  return (
    <ol className="log">
      {log.map((e, i) => (
        <li key={i} className={i >= from ? "log-item arrive" : "log-item"}>
          <span className="log-time num">{e.time}</span>
          <span className="log-text">
            {e.change ? (
              <>
                {e.change.label} changed from <Chip s={e.change.from} /> to{" "}
                <Chip s={e.change.to} />
              </>
            ) : (
              e.text
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

// Shared by the open and resolved case: question, state, time, then key facts with the
// reason a person is needed docked under them.
export function CaseHead({ c, title, pill, time, onBack, onStep, step, onFocus }) {
  return (
    <>
      <header className="case-head">
        <button type="button" className="back" onClick={onBack} aria-label="Back to the queue">
          <ChevronLeft />
        </button>
        <h2 className="decision">{title}</h2>
        <div className="case-tools">
          {pill}
          {time && <span className="pill-time num">{time}</span>}
          {onFocus && (
            <button
              type="button"
              className="step focus-open"
              aria-label="Open in focus"
              onClick={(e) => onFocus(e.currentTarget)}
            >
              <Mark glyph="expand" size={24} />
            </button>
          )}
          {onStep && (
            <span className="steps">
              <button
                type="button"
                className="step"
                aria-label="Previous case"
                disabled={!step.prev}
                onClick={() => onStep(-1)}
              >
                <Mark glyph="up" size={24} />
              </button>
              <button
                type="button"
                className="step"
                aria-label="Next case"
                disabled={!step.next}
                onClick={() => onStep(1)}
              >
                <Mark glyph="down" size={24} />
              </button>
            </span>
          )}
        </div>
        <p className="case-sub">{c.summary}</p>
      </header>

      <div className="case-stack">
        <dl className="facts-strip">
          <div className="cell">
            <dt className="cell-label">{c.restaurant ? "Contact" : "Restaurant"}</dt>
            <dd className="cell-value">
              <Avatar name={c.who} />
              <span>{c.who}</span>
            </dd>
          </div>
          {c.restaurant && (
            <div className="cell">
              <dt className="cell-label">Restaurant</dt>
              <dd className="cell-value">
                <span>{c.restaurant}</span>
              </dd>
            </div>
          )}
          <div className="cell">
            <dt className="cell-label">Order</dt>
            <dd className="cell-value num">
              <span>#{c.order}</span>
            </dd>
          </div>
          {c.total != null && (
            <div className="cell">
              <dt className="cell-label">Total</dt>
              <dd className="cell-value num">
                <span>{money(c.total)}</span>
              </dd>
            </div>
          )}
        </dl>
        <p className={`callout tone-${c.state}`}>
          <StateIcon state={c.state} size={20} />
          <span>
            <span className="sr-only">Why you: </span>
            {c.why}
          </span>
        </p>
      </div>
    </>
  );
}

export default function Detail({
  c,
  enter,
  phase = "idle",
  onCheck,
  onResolve,
  onBack,
  onStep,
  step,
  onFocus,
  scope = "",
}) {
  const a = c.approval;
  const f = c.failed;
  const chk = f?.check;
  const options = c.input
    ? c.input.options.map((o) => (typeof o === "string" ? { label: o } : o))
    : [];

  const [amount, setAmount] = useState(a ? a.amount.toFixed(2) : "");
  const [message, setMessage] = useState(a ? a.message : "");
  const [choice, setChoice] = useState(null);
  const [note, setNote] = useState("");
  // The amount text currently written into the drafted message.
  const embedded = useRef(a ? money(a.amount) : "");
  // The check phase this view opened with. Only changes after that animate.
  const openedAt = useRef(phase);
  const moved = phase !== openedAt.current;

  const amt = Number(amount);
  const typed = amount.trim() !== "" && Number.isFinite(amt) && amt > 0;
  const overTotal = typed && c.total != null && cents(amt) > cents(c.total);
  const amountOk = typed && !overTotal && Math.abs(amt * 100 - cents(amt)) < 1e-6;
  const edited = !!a && amountOk && (cents(amt) !== cents(a.amount) || message !== a.message);
  const approveReady = amountOk && message.trim() !== "";

  const checking = phase === "checking";
  const confirmed = phase === "confirmed";
  const log = c.log
    ? [
        ...c.log,
        ...(chk && phase !== "idle" ? [chk.started] : []),
        ...(chk && confirmed ? chk.result : []),
      ]
    : null;
  // Where the rows added by this view's check begin.
  const logFrom = c.log
    ? c.log.length +
      (chk && openedAt.current !== "idle" ? 1 : 0) +
      (chk && openedAt.current === "confirmed" ? chk.result.length : 0)
    : Infinity;

  function changeAmount(value) {
    setAmount(value);
    const n = Number(value);
    if (value.trim() === "" || !Number.isFinite(n) || n <= 0) return;
    const next = money(n);
    if (next !== embedded.current && message.includes(embedded.current)) {
      setMessage(message.split(embedded.current).join(next));
      embedded.current = next;
    }
  }

  function approve() {
    onResolve(c.id, `${money(amt)} refund approved${edited ? " with edits" : ""}`, {
      kind: "approval",
      approved: true,
      amount: amt,
      proposed: a.amount,
      to: a.to,
      audience: a.audience,
      message,
      edited,
    });
  }

  function send() {
    const opt = options.find((o) => o.label === choice);
    onResolve(c.id, opt?.next ? `${choice} sent to the agent` : "Answer sent to the agent", {
      kind: "input",
      choice,
      note: note.trim(),
      next: opt?.next,
    });
  }

  return (
    <article className={enter ? `detail case enter-${enter}` : "detail case"}>
      <div className="detail-scroll">
        <div className="detail-inner">
          <CaseHead
            c={c}
            title={c.decision}
            pill={
              <span className={`pill-state tone-${c.state}`}>{STATES[c.state].label}</span>
            }
            onBack={onBack}
            onStep={onStep}
            step={step}
            onFocus={onFocus}
          />

          <div className="case-grid">
            <div className="case-col">
              <section className="rec" aria-label="What you can do">
                <div className="card">
                  {a && (
                    <>
                      <h3 className="rec-title agent-voice">{a.summary}</h3>
                      <div className="field-row">
                        <div className="field">
                          <label className="label" htmlFor={`amount-${scope}${c.id}`}>
                            Amount
                          </label>
                          <span className="control money">
                            <span aria-hidden="true">$</span>
                            <input
                              id={`amount-${scope}${c.id}`}
                              inputMode="decimal"
                              value={amount}
                              onChange={(e) => changeAmount(e.target.value)}
                              aria-invalid={!amountOk}
                            />
                          </span>
                          {overTotal && (
                            <span className="hint error">Over the {money(c.total)} order</span>
                          )}
                          {amountOk && cents(amt) !== cents(a.amount) && (
                            <span className="hint">Proposed {money(a.amount)}</span>
                          )}
                        </div>
                        <div className="field">
                          <span className="label">To</span>
                          <span className="control static">{a.to}</span>
                        </div>
                      </div>
                      <label className="field">
                        <span className="label">Message</span>
                        <textarea
                          className="control area"
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                      </label>
                    </>
                  )}

                  {c.input && (
                    <>
                      <h3 className="rec-title">Your answer</h3>
                      <div
                        className="options field"
                        role="radiogroup"
                        aria-label={c.decision}
                      >
                        {options.map((o) => (
                          <button
                            key={o.label}
                            type="button"
                            role="radio"
                            aria-checked={choice === o.label}
                            className="option"
                            onClick={() => setChoice(o.label)}
                          >
                            <RadioMark on={choice === o.label} />
                            <span className="option-body">
                              <span className="option-label">{o.label}</span>
                              {o.next && (
                                <ul className="next">
                                  {o.next.map((s) => (
                                    <li key={s}>{s}</li>
                                  ))}
                                </ul>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                      <label className="field">
                        <span className="label">Note</span>
                        <textarea
                          className="control area"
                          rows={3}
                          placeholder={c.input.placeholder}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </label>
                    </>
                  )}

                  {f && (
                    <>
                      <h3 className="rec-title">{f.step}</h3>
                      <p
                        key={confirmed ? "done" : "error"}
                        className={moved ? "rec-note arrive-text" : "rec-note"}
                      >
                        {confirmed ? chk.done : f.error}
                      </p>
                      {chk && (
                        <p className="pay">
                          <span className="label">Payment status</span>
                          <span className="pay-status">
                            <StateIcon
                              key={confirmed ? "approval" : "input"}
                              state={confirmed ? "approval" : "input"}
                              swap={moved && confirmed}
                            />
                            {confirmed ? "Refunded" : "Unknown"}
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="bar">
                  {a && (
                    <>
                      <button
                        type="button"
                        className="btn primary"
                        disabled={!approveReady}
                        onClick={approve}
                      >
                        {amountOk ? `Approve ${money(amt)}` : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="btn quiet"
                        onClick={() =>
                          onResolve(c.id, "Rejected, the agent will close the case", {
                            kind: "approval",
                            approved: false,
                          })
                        }
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {c.input && (
                    <button
                      type="button"
                      className="btn primary"
                      disabled={!choice && !note.trim()}
                      onClick={send}
                    >
                      Send
                    </button>
                  )}
                  {f &&
                    (chk && confirmed ? (
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() =>
                          onResolve(c.id, chk.outcome, {
                            kind: "failed",
                            action: `${chk.label}, then closed`,
                            status: "Refunded",
                            log,
                          })
                        }
                      >
                        {chk.closeLabel}
                      </button>
                    ) : (
                      <>
                        {chk && (
                          <button
                            type="button"
                            className="btn primary"
                            disabled={checking}
                            onClick={() => onCheck(c.id)}
                          >
                            {checking ? "Checking" : chk.label}
                          </button>
                        )}
                        {f.fixes.map((x) => (
                          <button
                            key={x.label}
                            type="button"
                            className={x.primary ? "btn primary" : "btn quiet"}
                            disabled={checking}
                            onClick={() =>
                              onResolve(c.id, `${x.label}, the agent is on it`, {
                                kind: "failed",
                                action: x.label,
                              })
                            }
                          >
                            {x.label}
                          </button>
                        ))}
                      </>
                    ))}
                </div>
              </section>
            </div>

            <div className="case-col" aria-label="Evidence">
              {c.compare && (
                <section className="card">
                  <h3 className="card-title">Addresses</h3>
                  <div className="compare">
                    {[c.compare.left, c.compare.right].map((s) => (
                      <div key={s.label} className="compare-side">
                        <span className="compare-label">{s.label}</span>
                        <span className="compare-value">{s.value}</span>
                        <span className="compare-note">{s.note}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {c.receipt && (
                <section className="card">
                  <h3 className="card-title">Receipt</h3>
                  <ul className="receipt">
                    {c.receipt.map((l) => (
                      <li key={l.name} className={l.missing ? "line missing" : "line"}>
                        <span className="line-name">
                          {l.name}
                          {l.missing && <span className="line-flag">Missing</span>}
                        </span>
                        <span className="num">{money(l.price)}</span>
                      </li>
                    ))}
                    <li className="line total">
                      <span>Total</span>
                      <span className="num">{money(c.total)}</span>
                    </li>
                  </ul>
                </section>
              )}
              <section className="card">
                <h3 className="card-title">Details</h3>
                <dl className="kv">
                  {c.facts.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              {log && (
                <section className="card">
                  <h3 className="card-title">Activity</h3>
                  <Timeline log={log} from={moved ? logFrom : Infinity} />
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
```

## src/components/DetailOld.jsx

```jsx
import { useRef, useState } from "react";
import { ChevronLeft, RadioMark, StateIcon } from "./Icons";
import { money } from "../format";

const cents = (n) => Math.round(n * 100);

function Chip({ s }) {
  return (
    <span className="chip">
      <StateIcon state={s.state} />
      {s.text}
    </span>
  );
}

// Rows from `from` on arrived after a press in this view, so they fade in; earlier rows sit still.
function Activity({ log, from = Infinity }) {
  return (
    <ol className="log">
      {log.map((e, i) => (
        <li key={i} className={i >= from ? "log-item arrive" : "log-item"}>
          <span className="log-time num">{e.time}</span>
          <span className="log-text">
            {e.change ? (
              <>
                {e.change.label} changed from <Chip s={e.change.from} /> to{" "}
                <Chip s={e.change.to} />
              </>
            ) : (
              e.text
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function DetailOld({ c, enter, phase = "idle", onCheck, onResolve, onBack }) {
  const a = c.approval;
  const f = c.failed;
  const chk = f?.check;
  const options = c.input
    ? c.input.options.map((o) => (typeof o === "string" ? { label: o } : o))
    : [];

  const [amount, setAmount] = useState(a ? a.amount.toFixed(2) : "");
  const [message, setMessage] = useState(a ? a.message : "");
  const [choice, setChoice] = useState(null);
  const [note, setNote] = useState("");
  // The amount text currently written into the drafted message.
  const embedded = useRef(a ? money(a.amount) : "");
  // The check phase this view opened with. Only changes after that animate.
  const openedAt = useRef(phase);
  const moved = phase !== openedAt.current;

  const amt = Number(amount);
  const typed = amount.trim() !== "" && Number.isFinite(amt) && amt > 0;
  const overTotal = typed && c.total != null && cents(amt) > cents(c.total);
  const amountOk = typed && !overTotal && Math.abs(amt * 100 - cents(amt)) < 1e-6;
  const edited = !!a && amountOk && (cents(amt) !== cents(a.amount) || message !== a.message);
  const approveReady = amountOk && message.trim() !== "";

  const checking = phase === "checking";
  const confirmed = phase === "confirmed";
  const log = c.log
    ? [
        ...c.log,
        ...(chk && phase !== "idle" ? [chk.started] : []),
        ...(chk && confirmed ? chk.result : []),
      ]
    : null;

  // Where the rows added by this view's check begin.
  const logFrom = c.log
    ? c.log.length + (chk && openedAt.current !== "idle" ? 1 : 0) +
      (chk && openedAt.current === "confirmed" ? chk.result.length : 0)
    : Infinity;

  function changeAmount(value) {
    setAmount(value);
    const n = Number(value);
    if (value.trim() === "" || !Number.isFinite(n) || n <= 0) return;
    const next = money(n);
    if (next !== embedded.current && message.includes(embedded.current)) {
      setMessage(message.split(embedded.current).join(next));
      embedded.current = next;
    }
  }

  function approve() {
    onResolve(c.id, `${money(amt)} refund approved${edited ? " with edits" : ""}`, {
      kind: "approval",
      approved: true,
      amount: amt,
      proposed: a.amount,
      to: a.to,
      audience: a.audience,
      message,
      edited,
    });
  }

  function send() {
    const opt = options.find((o) => o.label === choice);
    onResolve(c.id, opt?.next ? `${choice} sent to the agent` : "Answer sent to the agent", {
      kind: "input",
      choice,
      note: note.trim(),
      next: opt?.next,
    });
  }

  const approveLabel = amountOk ? `Approve ${money(amt)}` : "Approve";

  return (
    <article className={enter ? `detail enter-${enter}` : "detail"}>
      <div className="detail-scroll">
        <div className="detail-inner">
          <button type="button" className="back" onClick={onBack} aria-label="Back to the queue">
            <ChevronLeft />
          </button>

          <h2 className="decision">{c.decision}</h2>
          <p className="meta">
            <span className="meta-strong">{c.who}</span>
            <span className="num">#{c.order}</span>
            {c.total != null && <span className="num">{money(c.total)} total</span>}
            </p>

          <section className="q">
            <h3 className="sr-only">What happened</h3>
            <p className="body">{c.summary}</p>
          </section>

          <section className="q">
            <h3 className="sr-only">Why you</h3>
            <p className="why">
              <StateIcon state={c.state} />
              <span>{c.why}</span>
            </p>
          </section>

          <section className="q q-act">
            <h3 className="sr-only">What you can do</h3>
            <div className="act">
              <div className="act-main">
                {a && (
                  <>
                    <p className="proposal">{a.summary}</p>
                    <div className="field-row">
                      <div className="field">
                        <label className="label" htmlFor={`amount-${c.id}`}>
                          Amount
                        </label>
                        <span className="control money">
                          <span aria-hidden="true">$</span>
                          <input
                            id={`amount-${c.id}`}
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => changeAmount(e.target.value)}
                            aria-invalid={!amountOk}
                          />
                        </span>
                        {overTotal && (
                          <span className="hint error">Over the {money(c.total)} order</span>
                        )}
                        {amountOk && cents(amt) !== cents(a.amount) && (
                          <span className="hint">Proposed {money(a.amount)}</span>
                        )}
                      </div>
                      <div className="field">
                        <span className="label">To</span>
                        <span className="control static">{a.to}</span>
                      </div>
                    </div>
                    <label className="field">
                      <span className="label">Message</span>
                      <textarea
                        className="control area"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </label>
                    <div className="buttons joined">
                      <button
                        type="button"
                        className="btn primary"
                        disabled={!approveReady}
                        onClick={approve}
                      >
                        {approveLabel}
                      </button>
                      <button
                        type="button"
                        className="btn quiet"
                        onClick={() =>
                          onResolve(c.id, "Rejected, the agent will close the case", {
                            kind: "approval",
                            approved: false,
                          })
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}

                {c.input && (
                  <>
                    <div className="options" role="radiogroup" aria-label={c.decision}>
                      {options.map((o) => (
                        <button
                          key={o.label}
                          type="button"
                          role="radio"
                          aria-checked={choice === o.label}
                          className="option"
                          onClick={() => setChoice(o.label)}
                        >
                          <RadioMark on={choice === o.label} />
                          <span className="option-body">
                            <span className="option-label">{o.label}</span>
                            {o.next && (
                              <ul className="next">
                                {o.next.map((step) => (
                                  <li key={step}>{step}</li>
                                ))}
                              </ul>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                    <label className="field">
                      <span className="label">Note</span>
                      <textarea
                        className="control area"
                        rows={3}
                        placeholder={c.input.placeholder}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </label>
                    <div className="buttons joined">
                      <button
                        type="button"
                        className="btn primary"
                        disabled={!choice && !note.trim()}
                        onClick={send}
                      >
                        Send
                      </button>
                    </div>
                  </>
                )}

                {f && (
                  <>
                    <p className="body">
                      <span className="strong">{f.step}.</span>{" "}
                      <span key={confirmed ? "done" : "error"} className={moved ? "arrive-text" : undefined}>
                        {confirmed ? chk.done : f.error}
                      </span>
                    </p>
                    {chk && (
                      <p className="pay">
                        <span className="label">Payment status</span>
                        <span className="pay-status">
                          <StateIcon
                            key={confirmed ? "approval" : "input"}
                            state={confirmed ? "approval" : "input"}
                            swap={moved && confirmed}
                          />
                          {confirmed ? "Refunded" : "Unknown"}
                        </span>
                      </p>
                    )}
                    <div className="buttons joined">
                      {chk && confirmed ? (
                        <button
                          type="button"
                          className="btn primary"
                          onClick={() =>
                            onResolve(c.id, chk.outcome, {
                              kind: "failed",
                              action: `${chk.label}, then closed`,
                              status: "Refunded",
                              log,
                            })
                          }
                        >
                          {chk.closeLabel}
                        </button>
                      ) : (
                        <>
                          {chk && (
                            <button
                              type="button"
                              className="btn primary"
                              disabled={checking}
                              onClick={() => onCheck(c.id)}
                            >
                              {checking ? "Checking" : chk.label}
                            </button>
                          )}
                          {f.fixes.map((x) => (
                            <button
                              key={x.label}
                              type="button"
                              className={x.primary ? "btn primary" : "btn quiet"}
                              disabled={checking}
                              onClick={() =>
                                onResolve(c.id, `${x.label}, the agent is on it`, {
                                  kind: "failed",
                                  action: x.label,
                                })
                              }
                            >
                              {x.label}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              <aside className="evidence" aria-label="Evidence">
                {c.compare && (
                  <>
                    <h4 className="sr-only">Addresses</h4>
                    <div className="compare">
                      {[c.compare.left, c.compare.right].map((s) => (
                        <div key={s.label} className="compare-side">
                          <span className="compare-label">{s.label}</span>
                          <span className="compare-value">{s.value}</span>
                          <span className="compare-note">{s.note}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {c.receipt && (
                  <>
                    <h4 className="sr-only">Receipt</h4>
                    <ul className="receipt">
                      {c.receipt.map((l) => (
                        <li key={l.name} className={l.missing ? "line missing" : "line"}>
                          <span className="line-name">
                            {l.name}
                            {l.missing && <span className="line-flag">Missing</span>}
                          </span>
                          <span className="num">{money(l.price)}</span>
                        </li>
                      ))}
                      <li className="line total">
                        <span>Total</span>
                        <span className="num">{money(c.total)}</span>
                      </li>
                    </ul>
                  </>
                )}
                <h4 className="sr-only">Evidence</h4>
                <dl className="facts">
                  {c.facts.map(([k, v]) => (
                    <div key={k} className="fact">
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                {log && (
                  <>
                    <h4 className="sr-only">Activity</h4>
                    <Activity log={log} from={moved ? logFrom : Infinity} />
                  </>
                )}
              </aside>
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
```

## src/components/FocusSheet.jsx

```jsx
import { useEffect, useRef, useState } from "react";
import { Glyph } from "./Icons";

// The prompt pill: the agent hears you without leaving the case. Enter sends, Escape clears.
function AskAgent({ placeholder, onSend }) {
  const [text, setText] = useState("");
  return (
    <form
      className="dock-shape dock-ask"
      onSubmit={(e) => {
        e.preventDefault();
        const v = text.trim();
        if (!v) return;
        onSend(v);
        setText("");
      }}
    >
      <Glyph name="sparkle" size={18} />
      <label className="sr-only" htmlFor="ask-agent">
        {placeholder}
      </label>
      <input
        id="ask-agent"
        className="ask-input"
        value={text}
        autoComplete="off"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setText("");
            e.currentTarget.blur();
          }
        }}
      />
      {/* Always rendered so the pill keeps its width; hidden once she types */}
      <span
        className="ask-hint agent-voice"
        aria-hidden="true"
        style={text ? { visibility: "hidden" } : undefined}
      >
        {placeholder}
      </span>
    </form>
  );
}

// A focus sheet for deep review of one case. Cast: the sheet leads, the docked cluster
// supports, the scrim decorates, the app behind stays still. Open: scrim and sheet start
// together (250ms), the sheet rises from its trigger; the cluster lands as the sheet
// settles, 40ms apart, the last on the 400ms delight tail. Close: everything together in
// 150ms, the way it came. The size toggle is a clip-path; the cluster travels on transform.
export default function FocusSheet({ open, origin, onClose, prompt, children }) {
  const [full, setFull] = useState(false);
  const [swapped, setSwapped] = useState(false);
  // closed, pre (enter start values, no transition), open
  const [phase, setPhase] = useState("closed");
  const [shown, setShown] = useState(false);
  const closeRef = useRef(null);
  const settled = useRef(true);

  useEffect(() => {
    if (open) {
      setShown(true);
      if (settled.current) {
        setPhase("pre");
        let b;
        const a = requestAnimationFrame(() => {
          b = requestAnimationFrame(() => setPhase("open"));
        });
        settled.current = false;
        return () => {
          cancelAnimationFrame(a);
          cancelAnimationFrame(b);
        };
      }
      setPhase("open");
      return;
    }
    setPhase("closed");
    setFull(false);
    setSwapped(false);
    const t = setTimeout(() => {
      settled.current = true;
      setShown(false);
    }, 360); // the close fade (320ms), everything together, plus a frame of margin
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className="focus"
      data-phase={phase}
      data-open={open}
      data-full={full}
      role="dialog"
      aria-modal="true"
      aria-label="Case in focus"
      inert={!open}
      style={origin ? { "--origin": `${origin.x}px ${origin.y}px` } : undefined}
    >
      <div className="focus-scrim" onClick={onClose} />
      <div className="focus-sheet">{(open || shown) && children}</div>
      <div className="focus-dock">
        {prompt && (open || shown) && (
          <AskAgent key={prompt.key} placeholder={prompt.placeholder} onSend={prompt.onSend} />
        )}
        <button
          ref={closeRef}
          type="button"
          className="dock-shape dock-close"
          aria-label="Close focus"
          onClick={onClose}
        >
          <Glyph name="close" size={20} />
        </button>
        <button
          type="button"
          className="dock-shape dock-size"
          aria-label={full ? "Collapse" : "Expand"}
          aria-pressed={full}
          onClick={() => {
            setFull((f) => !f);
            setSwapped(true);
          }}
        >
          <Glyph key={full ? "c" : "e"} name={full ? "collapse" : "expand"} size={20} swap={swapped} />
        </button>
      </div>
    </div>
  );
}
```

## src/components/Icons.jsx

```jsx
// One small icon family, drawn here. Each mark is a frosted object: a soft tinted glow
// body with a little grain and a glass highlight, all static CSS, and a crisp line glyph
// on top whose stroke stays 1.4px at every size (non scaling stroke, set in index.css).

const GLYPHS = {
  approval: <path d="M4.8 8.4l2.2 2.2 4.2-4.5" />,
  input: (
    <>
      <path d="M6.2 6.3a1.8 1.8 0 1 1 2.6 1.6c-.5.3-.8.7-.8 1.2" />
      <path d="M8 11.2h.01" />
    </>
  ),
  failed: (
    <>
      <path d="M8 4.7v3.9" />
      <path d="M8 11.2h.01" />
    </>
  ),
  check: <path d="M4.8 8.4l2.2 2.2 4.2-4.5" />,
  back: <path d="M9.3 4.8L6.1 8l3.2 3.2" />,
  up: <path d="M4.8 9.6L8 6.4l3.2 3.2" />,
  close: <path d="M5.2 5.2l5.6 5.6M10.8 5.2l-5.6 5.6" />,
  sparkle: (
    <>
      <path d="M8 2.8v3.4M8 9.8v3.4M2.8 8h3.4M9.8 8h3.4M4.4 4.4l2.2 2.2M9.4 9.4l2.2 2.2M11.6 4.4L9.4 6.6M6.6 9.4l-2.2 2.2" />
      <rect x="6.9" y="6.9" width="2.2" height="2.2" rx="0.4" />
    </>
  ),
  expand: <path d="M9.4 3.9h2.7v2.7M12.1 3.9L9 7M6.6 12.1H3.9V9.4M3.9 12.1L7 9" />,
  collapse: <path d="M9 4.6V7h2.4M12.1 3.9L9 7M7 11.4V9H4.6M3.9 12.1L7 9" />,
  down: <path d="M4.8 6.4L8 9.6l3.2-3.2" />,
  reset: (
    <>
      <path d="M4.9 8a3.1 3.1 0 1 0 .95-2.25" />
      <path d="M4.9 4.3v1.9h1.9" />
    </>
  ),
};

export function Glyph({ name, size = 16, swap = false }) {
  return (
    <svg
      className={swap ? "glyph swap-in" : "glyph"}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {GLYPHS[name]}
    </svg>
  );
}

// tone: approval, input, failed, neutral (clear glass) or ink (dark glass).
export function Mark({ glyph, tone = "neutral", size = 16, swap = false }) {
  return (
    <span className={`mark tone-${tone}`} style={{ width: size, height: size }} aria-hidden="true">
      {glyph && <Glyph name={glyph} size={size} swap={swap} />}
    </span>
  );
}

export function StateIcon({ state, size = 16, swap = false }) {
  return <Mark glyph={state} tone={state} size={size} swap={swap} />;
}

export function RadioMark({ on }) {
  return on ? <Mark glyph="check" tone="ink" swap /> : <Mark tone="neutral" />;
}

export function ChevronLeft() {
  return <Mark glyph="back" size={24} />;
}

export function ResetIcon() {
  return <Mark glyph="reset" size={24} />;
}
```

## src/components/Queue.jsx

```jsx
import { useLayoutEffect, useRef } from "react";
import { StateIcon } from "./Icons";
import Segmented from "./Segmented";
import { STATES } from "../data";
import { reducedMotion, token } from "../motion";

const FILTERS = [
  ["all", "All"],
  ["approval", "Approve"],
  ["input", "Answer"],
  ["failed", "Fix"],
];

// After a resolve the acted-on row leaves to the left while the rows below close the gap,
// and after an undo it comes back from the left. Nothing else in the list moves.
function useListMotion(ul, list, act) {
  const before = useRef(new Map());
  const played = useRef(null);

  useLayoutEffect(() => {
    const host = ul.current;
    if (!host) return;
    const now = new Map();
    host.querySelectorAll("[data-id]").forEach((el) => {
      now.set(el.dataset.id, { el, r: el.getBoundingClientRect() });
    });

    const fresh = act && played.current !== act.at;
    if (fresh) played.current = act.at;

    if (fresh && !reducedMotion()) {
      const move = { duration: token("--dur-state"), easing: token("--ease-move") };
      now.forEach(({ el, r }, id) => {
        const was = before.current.get(id);
        if (!was || id === act.id) return;
        const dy = was.r.top - r.top;
        if (dy) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], move);
      });

      const gone = before.current.get(act.id);
      if (act.kind === "resolve" && gone && !now.has(act.id)) {
        const box = host.getBoundingClientRect();
        const ghost = gone.clone;
        ghost.removeAttribute("data-id");
        ghost.setAttribute("aria-hidden", "true");
        ghost.tabIndex = -1;
        ghost.className += " ghost";
        Object.assign(ghost.style, {
          top: `${gone.r.top - box.top + host.scrollTop}px`,
          left: `${gone.r.left - box.left}px`,
          width: `${gone.r.width}px`,
        });
        host.appendChild(ghost);
        ghost
          .animate(
            [
              { opacity: 1, transform: "none" },
              { opacity: 0, transform: "translateX(-8px)" },
            ],
            { duration: token("--dur-exit"), easing: token("--ease-out"), fill: "forwards" }
          )
          .finished.then(() => ghost.remove(), () => ghost.remove());
      }

      const back = now.get(act.id);
      if (act.kind === "undo" && back) {
        back.el.animate(
          [
            { opacity: 0, transform: "translateX(-8px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: token("--dur-state"), easing: token("--ease-out") }
        );
      }
    }

    // Remember where every row sits, and a copy of it, for the next resolve.
    const next = new Map();
    now.forEach(({ el, r }, id) => {
      if (r.height) next.set(id, { r, clone: el.cloneNode(true) });
    });
    before.current = next;
  }, [ul, list, act]);
}

export default function Queue({
  list,
  act,
  view,
  onView,
  counts,
  doneCount,
  filter,
  onFilter,
  selectedId,
  onSelect,
}) {
  const ul = useRef(null);
  useListMotion(ul, list, act);

  return (
    <aside className="queue" aria-label="Cases">
      <div className="slabs">
        <Segmented
          label="Open or resolved"
          className="slab switch"
          value={view}
          onChange={onView}
          options={[
            { key: "open", label: "Open", count: counts.all },
            { key: "resolved", label: "Resolved", count: doneCount },
          ]}
        />
        {view === "open" && (
          <Segmented
            label="Filter cases"
            className="slab tabs"
            value={filter}
            onChange={onFilter}
            options={FILTERS.map(([key, label]) => ({
              key,
              label,
              count: counts[key],
            }))}
          />
        )}
      </div>

      <ul className="rows" ref={ul}>
        {list.map(({ c, rec }) => (
          <li key={c.id}>
            <button
              type="button"
              className="row"
              data-id={c.id}
              aria-current={c.id === selectedId}
              onClick={() => onSelect(c.id)}
            >
              <span className="row-title">{c.title}</span>
              <span className="row-meta">
                {rec ? (
                  <span className="row-status">
                    <span>{rec.outcome}</span>
                  </span>
                ) : (
                  <span className="row-status">
                    <StateIcon state={c.state} />
                    <span>{STATES[c.state].label}</span>
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

## src/components/QueueClear.jsx

```jsx
import { useRef } from "react";
import { Glyph } from "./Icons";
import { reducedMotion } from "../motion";

// One glow per state cleared. Each drifts its own way under the pointer, so the edge
// of the glass shifts colour while the type on it stays still and sharp.
const GLOWS = [
  { state: "approval", x: 1, y: 0.6 },
  { state: "input", x: -0.8, y: 1 },
  { state: "failed", x: 0.5, y: -0.9 },
];
const REACH = 18;

export default function QueueClear({ play }) {
  const fills = useRef([]);
  const frame = useRef(0);

  function drift(nx, ny) {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      GLOWS.forEach((g, i) => {
        const el = fills.current[i];
        if (el) el.style.transform = `translate(${nx * g.x * REACH}px, ${ny * g.y * REACH}px)`;
      });
    });
  }

  function onPointerMove(e) {
    if (reducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    drift(nx, ny);
  }

  return (
    <div
      className="detail empty clear"
      onPointerMove={onPointerMove}
      onPointerLeave={() => drift(0, 0)}
    >
      <div className={play ? "clear-stage play" : "clear-stage"}>
        <div className="aura" aria-hidden="true">
          {GLOWS.map((g, i) => (
            <span key={g.state} className={`glow glow-${g.state}`}>
              <span className="glow-fill" ref={(el) => (fills.current[i] = el)} />
            </span>
          ))}
          <span className="grain" />
        </div>
        <p className="glass">
          <span className="glass-disc">
            <Glyph name="check" size={24} />
          </span>
          <span className="glass-pill">Queue clear</span>
        </p>
      </div>
    </div>
  );
}
```

## src/components/Resolved.jsx

```jsx
import { CaseHead } from "./Detail";
import { StateIcon } from "./Icons";
import { clock, money } from "../format";

function Chip({ s }) {
  return (
    <span className="chip">
      <StateIcon state={s.state} />
      {s.text}
    </span>
  );
}

function rowsFor(d) {
  const told = d.notes?.length
    ? [
        [
          "Told the agent",
          <ul key="told" className="next">
            {d.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>,
        ],
      ]
    : [];
  return [...decisionRows(d), ...told];
}

function decisionRows(d) {
  if (d.kind === "approval" && d.approved) {
    return [
      ["Decision", d.edited ? "Approved with edits" : "Approved"],
      ["Refund", money(d.amount)],
      ...(d.edited && d.proposed !== d.amount ? [["Agent proposed", money(d.proposed)]] : []),
      ["To", d.to],
    ];
  }
  if (d.kind === "approval") {
    return [
      ["Decision", "Rejected"],
      ["Agent next", "Closes the case with the standard reply"],
    ];
  }
  if (d.kind === "input") {
    return [
      ["Your choice", d.choice ?? "No option, note only"],
      ...(d.note ? [["Your note", d.note]] : []),
      ...(d.next
        ? [
            [
              "Agent next",
              <ul key="next" className="next">
                {d.next.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>,
            ],
          ]
        : []),
    ];
  }
  if (d.kind === "failed") {
    return [["Action", d.action], ...(d.status ? [["Payment status", d.status]] : [])];
  }
  return [];
}

export default function Resolved({ c, rec, onReopen, onBack }) {
  const d = rec.detail ?? {};
  return (
    <article className="detail case">
      <div className="detail-scroll">
        <div className="detail-inner">
          <CaseHead
            c={c}
            title={rec.outcome}
            time={`Resolved ${clock(rec.at)}`}
            onBack={() => onBack()}
          />

          <div className="case-grid">
            <div className="case-col">
              <section className="rec" aria-label="What you decided">
                <div className="card">
                  <dl className="kv">
                    {rowsFor(d).map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="bar">
                  <button type="button" className="btn quiet" onClick={() => onReopen(c.id)}>
                    Reopen
                  </button>
                </div>
              </section>
            </div>
            <div className="case-col">
              {d.message && (
                <section className="card">
                  <h3 className="card-title">Message</h3>
                  <p className="sent">{d.message}</p>
                </section>
              )}
              {d.log && (
                <section className="card">
                  <h3 className="card-title">Activity</h3>
                  <ol className="log">
                    {d.log.map((e, i) => (
                      <li key={i} className="log-item">
                        <span className="log-time num">{e.time}</span>
                        <span className="log-text">
                          {e.change ? (
                            <>
                              {e.change.label} changed from <Chip s={e.change.from} /> to{" "}
                              <Chip s={e.change.to} />
                            </>
                          ) : (
                            e.text
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
```

## src/components/Segmented.jsx

```jsx
import { useLayoutEffect, useRef, useState } from "react";
import { reducedMotion, token } from "../motion";

// One thumb that glides between options. Used by the Open or Resolved switch and by the
// filters, so both move the same way: a CSS transition on clip-path, 250ms on her ease-out,
// which retargets from where it is if a second click lands mid slide. The thumb is a full
// width layer cut down to the chosen option's box with corners concentric to the slab
// (--r-thumb), and the labels sit above it, so they never move.
// A count that rolls like an odometer when its value changes: only the digits that change
// move, the old one up and out as the new one comes in from below (down when the count
// grows). Each digit has a fixed box and tabular figures, so nothing shifts sideways.
// No motion on mount, and an instant swap under reduced motion.
function Count({ value }) {
  const ref = useRef(null);
  const prev = useRef(value);
  useLayoutEffect(() => {
    const from = prev.current;
    prev.current = value;
    const el = ref.current;
    if (from === value || !el || reducedMotion()) return;
    const a = String(from);
    const b = String(value);
    const up = value < from;
    const timing = { duration: token("--dur-state"), easing: token("--ease-out") };
    el.querySelectorAll(".digit").forEach((box, i) => {
      const old = a.length === b.length ? a[i] : null;
      if (old === b[i]) return;
      box.firstChild.animate(
        [
          { transform: `translateY(${up ? 100 : -100}%)`, opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        timing
      );
      if (old == null) return;
      const ghost = document.createElement("span");
      ghost.className = "d ghost";
      ghost.textContent = old;
      box.appendChild(ghost);
      ghost
        .animate(
          [
            { transform: "none", opacity: 1 },
            { transform: `translateY(${up ? -100 : 100}%)`, opacity: 0 },
          ],
          { ...timing, fill: "forwards" }
        )
        .finished.then(
          () => ghost.remove(),
          () => ghost.remove()
        );
    });
  }, [value]);
  return (
    <span className="seg-count num" ref={ref}>
      <span className="sr-only">{value}</span>
      {String(value)
        .split("")
        .map((d, i) => (
          <span key={i} className="digit" aria-hidden="true">
            <span className="d">{d}</span>
          </span>
        ))}
    </span>
  );
}

export default function Segmented({ label, options, value, onChange, className = "" }) {
  const group = useRef(null);
  const [boxes, setBoxes] = useState(null);

  // Measure every option once, then again on resize and when fonts settle.
  useLayoutEffect(() => {
    const el = group.current;
    if (!el) return;
    function measure() {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const next = {};
      el.querySelectorAll("[data-key]").forEach((b) => {
        next[b.dataset.key] = [
          b.offsetTop,
          w - b.offsetLeft - b.offsetWidth,
          h - b.offsetTop - b.offsetHeight,
          b.offsetLeft,
        ];
      });
      setBoxes((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.querySelectorAll("[data-key]").forEach((b) => ro.observe(b));
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [options.length]);

  const index = options.findIndex((o) => o.key === value);
  const box = boxes?.[value];

  function onKeyDown(e) {
    const last = options.length - 1;
    const to =
      e.key === "ArrowRight"
        ? Math.min(index + 1, last)
        : e.key === "ArrowLeft"
          ? Math.max(index - 1, 0)
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (to == null) return;
    e.preventDefault();
    onChange(options[to].key);
    group.current.querySelector(`[data-key="${options[to].key}"]`)?.focus();
  }

  return (
    <div
      ref={group}
      className={`seg ${className}`}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {box && (
        <span className="seg-shade" aria-hidden="true">
          <span
            className="seg-pill"
            style={{
              clipPath: `inset(${box.map((n) => `${n}px`).join(" ")} round var(--r-thumb))`,
            }}
          />
        </span>
      )}
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          data-key={o.key}
          className="seg-opt"
          aria-checked={o.key === value}
          tabIndex={o.key === value ? 0 : -1}
          onClick={() => onChange(o.key)}
        >
          <span>{o.label}</span>
          <Count value={o.count} />
        </button>
      ))}
    </div>
  );
}
```

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
