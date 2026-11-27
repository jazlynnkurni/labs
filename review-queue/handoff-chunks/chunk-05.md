Handoff chunk 5 of 11: food delivery review queue (Vite, React 19, plain CSS).
Same rules: "Create" writes the file exactly as given, "Append" adds to the end of that file on a new line. Do not run anything yet.

Append to the end of src/index.css:

```css
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

Create src/main.jsx:

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

Create src/motion.js:

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

Create src/components/Avatar.jsx:

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
