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
