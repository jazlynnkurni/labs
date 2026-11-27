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
