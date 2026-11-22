/* folder.js: the three folder sheets as one SVG in the reference's 736 grid, with the aged
   texture laid into each sheet. mountFolder(el) returns { svg, frontPath } so the horses can be
   clipped to the front sheet.                                                                 */
import { makeSheet, SHEETS } from './texture.js';
const NS = 'http://www.w3.org/2000/svg';
export const FRONT_D = 'M89 201 H647 A36 36 0 0 1 683 237 V604 A42 42 0 0 1 641 646 H95 A42 42 0 0 1 53 604 V237 A36 36 0 0 1 89 201 Z';
export function mountFolder(el, { textured = true, s = null } = {}) {
  // the texture is made at the size it is shown, so the grain is never averaged away
  s = s || Math.max(1, el.clientWidth / 736 * Math.min(2, devicePixelRatio || 1));
  el.innerHTML = `
  <svg viewBox="0 0 736 736" role="img" aria-label="Three overlapping stone-grey folders" style="position:absolute;inset:0;width:100%;height:100%">
    <defs>
      <filter id="depth" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="8" stdDeviation="11" flood-color="#000" flood-opacity=".14"/>
        <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000" flood-opacity=".16"/>
      </filter>
      <clipPath id="cBR"><rect x="200" y="144" width="471" height="200" rx="32"/></clipPath>
      <clipPath id="cBL"><rect x="64" y="93" width="245" height="260" rx="30"/></clipPath>
      <clipPath id="cF"><path d="${FRONT_D}"/></clipPath>
    </defs>
    <g filter="url(#depth)">
      <rect x="200" y="144" width="471" height="200" rx="32" fill="rgb(131,134,136)"/>
      <image id="tBR" x="200" y="144" width="471" height="200" clip-path="url(#cBR)" preserveAspectRatio="none"/>
      <rect x="64" y="93" width="245" height="260" rx="30" fill="rgb(141,145,148)"/>
      <image id="tBL" x="64" y="93" width="245" height="260" clip-path="url(#cBL)" preserveAspectRatio="none"/>
      <path d="${FRONT_D}" fill="rgb(150,152,152)"/>
      <image id="tF" x="53" y="201" width="630" height="445" clip-path="url(#cF)" preserveAspectRatio="none"/>
    </g>
  </svg>`;
  const svg = el.querySelector('svg');
  if (textured) for (const [id, key] of [['tBR', 'backRight'], ['tBL', 'backLeft'], ['tF', 'front']]) {
    const cv = makeSheet({ ...SHEETS[key], s });
    cv.toBlob(b => svg.querySelector('#' + id).setAttribute('href', URL.createObjectURL(b)));
  }
  return { svg };
}
