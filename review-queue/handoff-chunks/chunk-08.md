Handoff chunk 8 of 11: food delivery review queue (Vite, React 19, plain CSS).
Same rules: "Create" writes the file exactly as given, "Append" adds to the end of that file on a new line. Do not run anything yet.

Create src/components/Icons.jsx:

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

Create src/components/Queue.jsx:

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

Create src/components/QueueClear.jsx:

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

Create src/components/Resolved.jsx:

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

Create src/components/Segmented.jsx:

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
