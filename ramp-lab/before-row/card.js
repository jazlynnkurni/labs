/* THE CARD. One drawing of the black Ramp Visa, used everywhere it appears:
 * full size behind the app's wallet controls, small in the Apple Pay sheet,
 * and as a miniature in the Dynamic Island, so the card you paid with is the
 * card that arrives. The View details strip is NOT part of it: that belongs
 * to the app and sits on top. */

let uid = 0;

/* the Ramp mark: a tapered blade rising off a short base, in silver */
const MARK = 'M0.4 9.6 L4.2 9.6 C6.1 7.4 7.9 4.4 9.5 0.4 C7.4 3.6 5.1 6.4 2.2 8.4 Z M3.6 9.6 L10 9.6 L10 10.6 L3.2 10.6 Z';

/* the fine curved lines: two families of concentric arcs centred off the card,
   so they cross the face in long shallow sweeps like the engraved pattern */
function arcs(w, h, step, sw, a) {
  let s = '';
  const fam = [[-0.35 * w, 1.9 * h], [1.25 * w, -1.1 * h]];
  for (const [cx, cy] of fam) {
    const near = Math.hypot(Math.max(0 - cx, cx - w, 0), Math.max(0 - cy, cy - h, 0));
    const far = Math.hypot(Math.max(Math.abs(cx), Math.abs(cx - w)), Math.max(Math.abs(cy), Math.abs(cy - h)));
    for (let r = Math.floor(near / step) * step; r < far; r += step)
      s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"/>`;
  }
  return `<g fill="none" stroke="#fff" stroke-opacity="${a}" stroke-width="${sw}">${s}</g>`;
}

export function cardSVG(w, h) {
  const id = 'c' + (++uid), r = Math.round(w * 0.04);
  const k = w / 370;                    // everything below is laid out on the 370pt card
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <defs>
    <linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2c2b2a"/><stop offset="1" stop-color="#1b1a19"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9d9d9"/><stop offset="1" stop-color="#9c9c9c"/></linearGradient>
    <clipPath id="${id}c"><rect width="${w}" height="${h}" rx="${r}"/></clipPath>
  </defs>
  <g clip-path="url(#${id}c)">
    <rect width="${w}" height="${h}" fill="url(#${id}f)"/>
    ${arcs(w, h, 3.2 * k, 0.55 * k, 0.045)}
  </g>
  <text x="${20 * k}" y="${42 * k}" font-family="Lausanne, Arial, sans-serif" font-weight="400" font-size="${27 * k}" letter-spacing="${-0.6 * k}" fill="url(#${id}s)">ramp</text>
  <path d="${MARK}" transform="translate(${86 * k} ${23 * k}) scale(${1.85 * k})" fill="url(#${id}s)"/>
  <text x="${w - 20 * k}" y="${43 * k}" text-anchor="end" font-family="Helvetica Neue, Arial, sans-serif" font-weight="800" font-style="italic" font-size="${31 * k}" letter-spacing="${-1.2 * k}" fill="url(#${id}s)">VISA</text>
  <text x="${w - 20 * k}" y="${57 * k}" text-anchor="end" font-family="Helvetica Neue, Arial, sans-serif" font-weight="500" font-size="${8.6 * k}" fill="#a9a9a9">Signature Business</text>
</svg>`;
}

/* THE MINIATURE, for the Island: same charcoal face, a thin light edge so it
 * reads against the black, a few of the arcs, the silver mark. No lettering:
 * at this size it would only blur. `trace` adds the lime outline the edge glow
 * hands over, drawn and faded by the driver. */
export function miniSVG(w, h, trace = false) {
  const id = 'm' + (++uid), r = h * 0.2;
  const path = `M${w / 2} 0.5 H${w - r} A${r - 0.5} ${r - 0.5} 0 0 1 ${w - 0.5} ${r} V${h - r} A${r - 0.5} ${r - 0.5} 0 0 1 ${w - r} ${h - 0.5} H${r} A${r - 0.5} ${r - 0.5} 0 0 1 0.5 ${h - r} V${r} A${r - 0.5} ${r - 0.5} 0 0 1 ${r} 0.5 Z`;
  return `<svg viewBox="-2 -2 ${w + 4} ${h + 4}" width="${w + 4}" height="${h + 4}" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
  <defs>
    <linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34332f"/><stop offset="1" stop-color="#1f1e1c"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e2e2"/><stop offset="1" stop-color="#a6a6a6"/></linearGradient>
    <clipPath id="${id}c"><rect width="${w}" height="${h}" rx="${r}"/></clipPath>
  </defs>
  <g clip-path="url(#${id}c)">
    <rect width="${w}" height="${h}" fill="url(#${id}f)"/>
    <g fill="none" stroke="#fff" stroke-opacity=".10" stroke-width=".5">
      <circle cx="${-0.35 * w}" cy="${1.9 * h}" r="${1.55 * h}"/><circle cx="${-0.35 * w}" cy="${1.9 * h}" r="${1.85 * h}"/><circle cx="${-0.35 * w}" cy="${1.9 * h}" r="${2.15 * h}"/>
    </g>
  </g>
  <rect x=".3" y=".3" width="${w - 0.6}" height="${h - 0.6}" rx="${r - 0.3}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width=".6"/>
  <path d="${MARK}" transform="translate(${w * 0.13} ${h * 0.16}) scale(${h * 0.034})" fill="url(#${id}s)"/>
  ${trace ? `<path class="trace" d="${path}" fill="none" stroke="#e4f222" stroke-width="1.3" stroke-linecap="round" pathLength="1" stroke-dasharray="0 1" opacity="0"/>` : ''}
</svg>`;
}
