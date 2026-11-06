/* tile.js: one cut-sticker tile as an inline SVG, with its own palette,
   its pixel and ascii clash, and a proximity bloom. makeTile() builds
   one; bloom(tiles) drives all of them from the cursor.                */
(() => {
'use strict';
const POOL = ['#f4e71f', '#e2208e', '#ffffff', '#9be03a', '#2aa84a', '#e5212b', '#2f5fe0', '#f5a31a', '#ff6fb0', '#f7f0c2'];
const BODIES = ['#2f9be0', '#2f5fe0', '#2f9be0', '#2f9be0', '#161616'];
const CROSSES = ['#e5212b', '#2f5fe0', '#9be03a', '#ffffff', '#e5212b'];
const GLYPHS = '+x.:;=#/\\*^~-|<>[]{}'.split('');
const NS = 'http://www.w3.org/2000/svg';
let n = 0, styled = false;
const rnd = Math.random;
const pick = a => a[Math.floor(rnd() * a.length)];
function mix(hex, to, k) {
  const h = v => parseInt(hex.slice(v, v + 2), 16), t = v => parseInt(to.slice(v, v + 2), 16);
  const ch = (a, b) => Math.round(a + (b - a) * k).toString(16).padStart(2, '0');
  return '#' + ch(h(1), t(1)) + ch(h(3), t(3)) + ch(h(5), t(5));
}
const CSS = `
.tile { position: absolute; --b:0; --bv:0; --bb:0; --bp:0; --bc:0; --bk:0; --bx:0; pointer-events: none; }
.tile svg { display: block; width: 100%; height: 100%; overflow: visible; opacity: var(--bv); filter: blur(calc(8px * (1 - var(--bv)))); }
.tile * { transform-box: view-box; }
.tile .body { transform-origin: 200px 200px; transform: scale(calc(0.82 + 0.18 * var(--bb))); }
.tile .petals { transform-origin: 200px 200px; transform: rotate(calc(-12deg * (1 - var(--bp)))); }
.tile .arm .reach { transform-origin: 0 0; transform: translateX(calc(-22px * (1 - var(--bp)))) scale(calc(0.5 + 0.5 * var(--bp)), calc(0.78 + 0.22 * var(--bp))); }
.tile .arm .twin { transform-origin: 0 0; transform: rotate(calc(14deg * var(--bp))); }
.tile .cross { transform-origin: 200px 200px; transform: scale(calc(0.7 + 0.3 * var(--bc))); }
.tile .core { transform-origin: 200px 200px; transform: scale(calc(0.6 + 0.4 * var(--bk))); }
.tile .art { opacity: var(--bt, 1); }
.tile .scatter { transform-origin: 200px 200px; transform: scale(calc(0.72 + 0.28 * var(--bx))); opacity: var(--bx); }
.tile .scatter rect { shape-rendering: crispEdges; animation: var(--bleep, none) var(--dur, 1s) steps(1, end) var(--delay, 0s) infinite; }
.tile .scatter text { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-weight: 500; text-anchor: middle; dominant-baseline: central; }
@keyframes bleepShort { 0%, 18% { opacity: 1; } 18.01%, 100% { opacity: 0; } }
@keyframes bleepHalf  { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }
@keyframes bleepLong  { 0%, 82% { opacity: 1; } 82.01%, 100% { opacity: 0; } }
@keyframes bleepTwice { 0%, 12% { opacity: 1; } 12.01%, 30% { opacity: 0; } 30.01%, 44% { opacity: 1; } 44.01%, 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .tile .scatter rect { animation: none; } }
`;
function palette() {
  return { body: pick(BODIES), cross: pick(CROSSES), petals: [pick(POOL), pick(POOL), pick(POOL), pick(POOL)], core: rnd() < 0.7 ? '#f7f0c2' : '#ffffff' };
}
function makeTile(opts = {}) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const id = 't' + (n++);
  const p = opts.palette || palette();
  const size = opts.size || 120;
  const el = document.createElement('div');
  el.className = 'tile';
  el.style.width = el.style.height = size + 'px';
  el.style.left = (opts.x - size / 2) + 'px'; el.style.top = (opts.y - size / 2) + 'px';
  const pd = +(6.5 * 400 / size).toFixed(2);     // dot pitch: about 6.5px on screen whatever the tile size
  const lumOf = hex => (0.2126 * parseInt(hex.slice(1, 3), 16) + 0.7152 * parseInt(hex.slice(3, 5), 16) + 0.0722 * parseInt(hex.slice(5, 7), 16)) / 255;
  const dot = hex => lumOf(hex) < 0.25 ? mix(hex, '#ffffff', 0.28) : mix(hex, '#000000', 0.5);   // dark fills get light dots
  const arm = (a, col) => `<g class="arm" transform="translate(200 200) rotate(${a})"><g class="reach">
    <g class="twin"><use href="#${id}-pill" fill="${mix(col, '#ffffff', 0.35)}"/></g><use href="#${id}-pill" fill="${col}"/></g></g>`;
  el.innerHTML = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="${id}-cut" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${7 + n}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <g id="${id}-body"><rect x="95" y="95" width="210" height="210" rx="46"/>
      <circle cx="118" cy="118" r="40"/><circle cx="282" cy="118" r="40"/><circle cx="118" cy="282" r="40"/><circle cx="282" cy="282" r="40"/></g>
    <rect id="${id}-pill" x="12" y="-27" width="163" height="54" rx="27"/>
    <pattern id="${id}-db" width="${pd}" height="${pd}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="${pd}" height="${pd}" fill="${p.body}"/><circle cx="${pd / 2}" cy="${pd / 2}" r="${pd * 0.26}" fill="${dot(p.body)}"/></pattern>
    <pattern id="${id}-dc" width="${pd}" height="${pd}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="${pd}" height="${pd}" fill="${p.cross}"/><circle cx="${pd / 2}" cy="${pd / 2}" r="${pd * 0.26}" fill="${dot(p.cross)}"/></pattern>
  </defs>
  <g class="scatter under"></g>
  <g class="art" filter="url(#${id}-cut)">
    <g class="body"><g filter="url(#${id}-soft)"><use href="#${id}-body" fill="url(#${id}-db)"/></g></g>
    <g class="petals" filter="url(#${id}-soft)">${arm(-135, p.petals[0])}${arm(-45, p.petals[1])}${arm(45, p.petals[2])}${arm(135, p.petals[3])}</g>
    <g class="cross" fill="url(#${id}-dc)" filter="url(#${id}-soft)"><rect x="82" y="183" width="236" height="34" rx="17"/><rect x="183" y="82" width="34" height="236" rx="17"/></g>
    <g class="core" fill="${p.core}" filter="url(#${id}-soft)"><rect x="146" y="191" width="108" height="18" rx="9"/><rect x="191" y="146" width="18" height="108" rx="9"/></g>
  </g>
  <g class="scatter over"></g></svg>`;
  // the clash: pixels and glyphs in this tile's colours
  const pal = [p.body, p.cross, p.core, ...p.petals].filter(c => c !== '#161616');
  const G = 10;
  const spot = (r0, r1) => {
    const r = r0 + (r1 - r0) * Math.pow(rnd(), 0.85);
    let a = rnd() * Math.PI * 2;
    if (rnd() < 0.6) a = (Math.PI / 4) + Math.floor(rnd() * 4) * (Math.PI / 2) + (rnd() - 0.5) * 0.5;
    return [200 + r * Math.cos(a), 200 + r * Math.sin(a)];
  };
  const fill = (g, count, r0, r1, black, glyphs) => {
    for (let i = 0; i < count; i++) {
      const [x, y] = spot(r0, r1);
      if (i < glyphs) {
        const e = document.createElementNS(NS, 'text');
        e.setAttribute('x', Math.round(x / G) * G); e.setAttribute('y', Math.round(y / G) * G);
        e.setAttribute('font-size', 11 + Math.floor(rnd() * 11)); e.setAttribute('fill', pick(pal));
        e.textContent = rnd() < 0.25 ? pick(GLYPHS) + pick(GLYPHS) + pick(GLYPHS) : pick(GLYPHS);
        g.appendChild(e);
      } else {
        const e = document.createElementNS(NS, 'rect');
        const sz = rnd() < 0.22 ? 2 * G : G;
        e.setAttribute('x', Math.round(x / G) * G); e.setAttribute('y', Math.round(y / G) * G);
        e.setAttribute('width', sz); e.setAttribute('height', sz);
        e.setAttribute('fill', black && rnd() < black ? '#000' : pick(pal));
        e.style.setProperty('--bleep', pick(['bleepShort', 'bleepHalf', 'bleepLong', 'bleepTwice', 'bleepHalf']));
        e.style.setProperty('--dur', (0.5 + rnd() * 3.2).toFixed(2) + 's');
        e.style.setProperty('--delay', (-rnd() * 4).toFixed(2) + 's');
        g.appendChild(e);
      }
    }
  };
  const dens = opts.scatter === undefined ? 1 : opts.scatter;
  fill(el.querySelector('.under'), Math.round(50 * dens), 60, 250, 0, Math.round(16 * dens));
  fill(el.querySelector('.over'), Math.round(20 * dens), 40, 200, 0.35, Math.round(7 * dens));
  const tile = { el, x: opts.x, y: opts.y, size, b: 0, target: 0, pinned: false, palette: p };
  return tile;
}
/* drive the bloom of many tiles from the cursor. each wakes within
   about a tile-width and is full when the cursor is on it.            */
function bloom(tiles, opts = {}) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const smooth = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
  const seg = (v, a, w) => smooth((v - a) / w);
  let cx = -1e5, cy = -1e5;
  if (fine) {
    addEventListener('pointermove', e => { cx = e.clientX; cy = e.clientY; }, { passive: true });
    document.addEventListener('pointerleave', () => { cx = cy = -1e5; });
  } else {
    addEventListener('pointerdown', e => {
      for (const t of tiles) { const d = Math.hypot(e.clientX - t.x, e.clientY - t.y); if (d < t.size * 0.6) t.pinned = !t.pinned; }
    });
  }
  const tau = reduced ? 0 : (opts.tau || 420);
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(now - last, 100); last = now;
    const k = tau ? 1 - Math.exp(-dt / tau) : 1;
    for (const t of tiles) {
      const d = Math.hypot(cx - t.x, cy - t.y);
      const inner = t.size * 0.42, reach = t.size * (opts.reach || 1.1);
      t.target = t.pinned ? 1 : clamp01(1 - (d - inner) / reach);
      if (t.b === t.target && t.settled) continue;          // nothing moving here: no style writes
      t.b += (t.target - t.b) * k;
      if (Math.abs(t.target - t.b) < 0.002) t.b = t.target;
      t.settled = t.b === t.target;
      const s = t.el.style, b = t.b;
      // pixelsFirst: the scatter bleeps in over the first third, the tile itself blooms after it
      const q = opts.pixelsFirst ? clamp01((b - 0.3) / 0.7) : b;
      s.setProperty('--b', b.toFixed(4));
      s.setProperty('--bv', (opts.pixelsFirst ? seg(b, 0, 0.3) : smooth(b * 1.6)).toFixed(4));   // the veil opens with whatever comes first
      s.setProperty('--bt', opts.pixelsFirst ? smooth(q * 1.6).toFixed(4) : '1');
      s.setProperty('--bb', smooth(q * 1.25).toFixed(4));
      s.setProperty('--bp', smooth(q).toFixed(4));
      s.setProperty('--bc', seg(q, 0.25, 0.75).toFixed(4));
      s.setProperty('--bk', seg(q, 0.45, 0.55).toFixed(4));
      s.setProperty('--bx', (opts.pixelsFirst ? seg(b, 0, 0.3) : seg(b, 0.35, 0.65)).toFixed(4));
      t.el.style.visibility = b < 0.002 ? 'hidden' : '';      // dark tiles cost nothing
      if (opts.stick && (t.target >= 0.999 || b > (opts.stickAt || 0.97))) t.pinned = true;   // the cursor passing over it is enough: it stays and finishes opening
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
window.Tile = { makeTile, bloom, palette };
})();
