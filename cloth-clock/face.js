// The printed clock face. Drawn once into a 2D canvas and used as a UV space
// texture, so it stretches and buckles with the cloth. Only the static ink
// lives here. The hands are drawn analytically in the fragment shader so they
// stay sharp and can move without re-uploading the texture every frame.

export const FACE_W = 1024;
export const FACE_H = 1024;   // square, the cloth is a disc now

// Dial centre and radius, expressed the way the shader wants them.
// v is measured from the bottom of the cloth, matching the mesh UVs.
export const DIAL_CX_PX = 512;
export const DIAL_CY_PX = 512;
export const DIAL_R_PX = 430;

export const DIAL_U = DIAL_CX_PX / FACE_W;
export const DIAL_V = 1 - DIAL_CY_PX / FACE_H;
// Radius in world units across the cloth width, which is 1.0.
export const DIAL_R = DIAL_R_PX / FACE_W;

export function drawFace() {
  const cv = document.createElement('canvas');
  cv.width = FACE_W;
  cv.height = FACE_H;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, FACE_W, FACE_H);

  // Everything is drawn in white. The alpha channel is the ink coverage and
  // the shader supplies the colour.
  g.fillStyle = '#fff';
  g.strokeStyle = '#fff';
  g.lineCap = 'butt';

  const cx = DIAL_CX_PX, cy = DIAL_CY_PX, R = DIAL_R_PX;

  // Outer ring of the dial.
  g.globalAlpha = 0.9;
  g.lineWidth = 5;
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  g.globalAlpha = 0.45;
  g.lineWidth = 1.8;
  g.beginPath(); g.arc(cx, cy, R - 16, 0, Math.PI * 2); g.stroke();

  // Minute track.
  const rOuter = R - 26;
  for (let m = 0; m < 60; m++) {
    const a = (m / 60) * Math.PI * 2 - Math.PI / 2;
    const isHour = m % 5 === 0;
    const len = isHour ? 34 : 13;
    const wdt = isHour ? 7 : 2.6;
    g.globalAlpha = isHour ? 0.92 : 0.6;
    g.save();
    g.translate(cx, cy);
    g.rotate(a + Math.PI / 2);
    g.fillRect(-wdt / 2, -rOuter, wdt, len);
    g.restore();
  }

  // Hour numerals.
  g.globalAlpha = 0.95;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '600 92px "Times New Roman", Georgia, serif';
  const rNum = R - 108;
  for (let h = 1; h <= 12; h++) {
    const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
    g.fillText(String(h), cx + Math.cos(a) * rNum, cy + Math.sin(a) * rNum + 4);
  }

  g.globalAlpha = 1;
  return cv;
}

// Letterspaced centred text. Canvas has no tracking control, so place glyphs.
function spaced(g, text, track) {
  const chars = [...text];
  let total = 0;
  for (const ch of chars) total += g.measureText(ch).width + track;
  total -= track;
  let x = -total / 2;
  g.textAlign = 'left';
  for (const ch of chars) {
    const w = g.measureText(ch).width;
    g.fillText(ch, x, 0);
    x += w + track;
  }
  g.textAlign = 'center';
}
