# Handoff part 1 of 2: food delivery review queue, with the intro

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

- This is part 1 of 2. Recreate these files now, but do not run anything until part 2 is in: part 2 has the remaining components, the intro and src/main.jsx.

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

