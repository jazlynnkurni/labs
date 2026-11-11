/* folder.js: the three folder sheets in the reference's 736 grid, with the aged texture laid into
   each sheet. Two layers, so the front sheet can move on its own:
   .fold-back   the two back sheets, and the shadow the front sheet casts when it lifts
   .fold-front  the front sheet; the horses' canvas goes in here too, so they lift with it
   mountFolder(el) returns { back, front }.                                                    */
import { makeSheet, SHEETS } from './texture.js';
export const FRONT_D = 'M89 201 H647 A36 36 0 0 1 683 237 V604 A42 42 0 0 1 641 646 H95 A42 42 0 0 1 53 604 V237 A36 36 0 0 1 89 201 Z';
const FILL = 'position:absolute;inset:0;width:100%;height:100%';
const LIP_D = 'M56 226 A36 36 0 0 1 89 201.5 H647 A36 36 0 0 1 680 226';   // the folder's opening: the front sheet's top edge
const DEPTH = `<filter id="depth" x="-10%" y="-10%" width="120%" height="125%">
  <feDropShadow dx="0" dy="8" stdDeviation="11" flood-color="#000" flood-opacity=".14"/>
  <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000" flood-opacity=".16"/></filter>`;
export function mountFolder(el, { textured = true, s = null } = {}) {
  // the texture is made at the size it is shown, so the grain is never averaged away
  s = s || Math.max(1, el.clientWidth / 736 * Math.min(2, devicePixelRatio || 1));
  el.innerHTML = `
  <div class="fold-back" style="${FILL}">
    <svg viewBox="0 0 736 736" aria-hidden="true" style="${FILL}">
      <defs>${DEPTH}
        <filter id="liftBlur" x="-10%" y="-10%" width="120%" height="130%"><feGaussianBlur stdDeviation="5"/></filter>
        <clipPath id="cBR"><rect x="200" y="144" width="471" height="200" rx="32"/></clipPath>
        <clipPath id="cBL"><rect x="64" y="93" width="245" height="260" rx="30"/></clipPath>
      </defs>
      <g filter="url(#depth)">
        <rect x="200" y="144" width="471" height="200" rx="32" fill="rgb(131,134,136)"/>
        <image class="t-br" x="200" y="144" width="471" height="200" clip-path="url(#cBR)" preserveAspectRatio="none"/>
        <rect x="64" y="93" width="245" height="260" rx="30" fill="rgb(141,145,148)"/>
        <image class="t-bl" x="64" y="93" width="245" height="260" clip-path="url(#cBL)" preserveAspectRatio="none"/>
      </g>
      <!-- the pocket: the dark inside of the folder just behind the front sheet's top edge; hidden at rest,
           it shows when the sheet tips forward to take a file -->
      <defs><linearGradient id="pocketG" x1="0" y1="203" x2="0" y2="250" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="rgb(28,27,26)" stop-opacity=".78"/><stop offset="1" stop-color="rgb(28,27,26)" stop-opacity=".25"/></linearGradient></defs>
      <rect class="pocket" x="62" y="203" width="612" height="60" rx="18" fill="url(#pocketG)"/>
      <!-- the shadow the front sheet casts on what is behind and below it, shown only while it lifts -->
      <path class="lift-shadow" d="${FRONT_D}" transform="translate(0 5)" fill="#000" filter="url(#liftBlur)" opacity="0"/>
    </svg>
  </div>
  <div class="fold-front" style="${FILL}">
    <svg viewBox="0 0 736 736" aria-hidden="true" style="${FILL}">
      <defs><clipPath id="cF"><path d="${FRONT_D}"/></clipPath>
        <filter id="lipGlow" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>
      <g filter="url(#depth)">
        <path d="${FRONT_D}" fill="rgb(150,152,152)"/>
        <image class="t-f" x="53" y="201" width="630" height="445" clip-path="url(#cF)" preserveAspectRatio="none"/>
      </g>
      <g class="lip" opacity="0" fill="none" stroke="rgb(222,238,255)" stroke-linecap="round">
        <path d="${LIP_D}" stroke-width="6" stroke-opacity=".5" filter="url(#lipGlow)"/>
        <path d="${LIP_D}" stroke-width="1.2" stroke-opacity=".85"/>
      </g>
    </svg>
  </div>`;
  const back = el.querySelector('.fold-back'), front = el.querySelector('.fold-front');
  if (textured) for (const [cls, key] of [['t-br', 'backRight'], ['t-bl', 'backLeft'], ['t-f', 'front']]) {
    const cv = makeSheet({ ...SHEETS[key], s });
    cv.toBlob(b => el.querySelector('.' + cls).setAttribute('href', URL.createObjectURL(b)));
  }
  return { back, front };
}
