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
