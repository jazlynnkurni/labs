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
