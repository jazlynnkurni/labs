Handoff chunk 1 of 11: food delivery review queue (Vite, React 19, plain CSS).
Over the next messages I will send every file of the project in chunks. For each block below, write the file exactly as given: "Create" means create or overwrite the file with exactly this content; "Append" means add this content to the end of that file, on a new line. Do not run, install or change anything until I send the last chunk.

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

Create index.html:

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

Create package.json:

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

Create vite.config.js:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

Create src/App.jsx:

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
