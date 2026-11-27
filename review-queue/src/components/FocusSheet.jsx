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
