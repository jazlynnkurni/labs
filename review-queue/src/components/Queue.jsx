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
