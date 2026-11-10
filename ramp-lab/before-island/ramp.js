import { SPEC, clamp, lerp, bez } from './spec.js';

const $ = s => document.querySelector(s);
const phone = $('#phone'), rim = $('#rim'), svg = $('#glow');
const pay = $('#pay'), dim = $('#dim'), hold = $('#hold'), done = $('#done');
const isl = $('#isl'), bud = $('#bud'), glyph = $('#glyph');
const sbSide = [...document.querySelectorAll('#sb .ic svg')].slice(0, 2);
const newRow = $('#new'), olds = [...document.querySelectorAll('.row.old')], cov = $('#cov');
const T = SPEC.t, G = SPEC.glow, R = SPEC.ramp, E = SPEC.ease;

$('#mer').textContent = SPEC.txn.merchant;
$('#meta').textContent = `${SPEC.txn.when} · ${SPEC.txn.card}`;
$('#amt').textContent = SPEC.txn.amount;
$('#budget').textContent = SPEC.txn.budget;
$('#pnum').textContent = SPEC.txn.card;

const Q = new URLSearchParams(location.search);
if (Q.has('still')) document.body.classList.add('still');

/* ---- THE RIM. Two halves of the screen's rounded rect, each from bottom
 * centre up its own side to top centre, so one spark splits into two
 * highlights that meet at the Island. Each half is five strokes: the lit rim
 * left behind (sharp and blurred), and the head (soft, mid, crisp core). ---- */
let W = SPEC.screen.w, H = SPEC.screen.h, L = 1;
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
const halves = [-1, 1].map(side => {
  const g = mk('g', {});
  const base = { fill: 'none', stroke: R.solar, 'stroke-linecap': 'round' };
  const trailSoft = mk('path', { ...base, 'stroke-width': 4, filter: 'url(#fTrail)' });
  const trail = mk('path', { ...base, 'stroke-width': 1.5 });
  const soft = mk('path', { ...base, 'stroke-width': G.soft, filter: 'url(#fSoft)' });
  const mid = mk('path', { ...base, 'stroke-width': G.mid, filter: 'url(#fMid)' });
  const core = mk('path', { ...base, 'stroke-width': G.core });
  [trailSoft, trail, soft, mid, core].forEach(p => g.appendChild(p));
  rim.appendChild(g);
  return { side, g, trailSoft, trail, soft, mid, core };
});
const sparkHalo = mk('circle', { fill: R.solar, filter: 'url(#fSoft)' });
const spark = mk('circle', { fill: R.solar });
rim.appendChild(sparkHalo); rim.appendChild(spark);

function halfPath(side) {
  const i = G.inset, r = SPEC.screen.r - i, cx = W / 2, l = i, t = i, rr = W - i, b = H - i;
  return side < 0
    ? `M${cx},${b} L${l + r},${b} A${r},${r} 0 0 1 ${l},${b - r} L${l},${t + r} A${r},${r} 0 0 1 ${l + r},${t} L${cx},${t}`
    : `M${cx},${b} L${rr - r},${b} A${r},${r} 0 0 0 ${rr},${b - r} L${rr},${t + r} A${r},${r} 0 0 0 ${rr - r},${t} L${cx},${t}`;
}

const narrow = () => matchMedia('(max-width: 760px)').matches;
function size() {
  if (narrow()) { W = innerWidth; H = innerHeight; phone.style.transform = ''; }
  else {
    W = SPEC.screen.w; H = SPEC.screen.h;
    const k = Math.min(1, (innerHeight - 56) / (H + 26), (innerWidth - 320 - 56) / (W + 26));
    phone.style.transform = `scale(${k})`;
  }
  phone.style.width = W + 'px'; phone.style.height = H + 'px';
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  for (const id of ['fMid', 'fSoft', 'fTrail']) {
    const f = document.getElementById(id);
    f.setAttribute('x', -60); f.setAttribute('y', -60); f.setAttribute('width', W + 120); f.setAttribute('height', H + 120);
  }
  $('#gMid').setAttribute('stdDeviation', G.midBlur);
  $('#gSoft').setAttribute('stdDeviation', G.softBlur);
  $('#gTrail').setAttribute('stdDeviation', G.trailBlur);
  for (const h of halves) { const d = halfPath(h.side); for (const k of ['trailSoft', 'trail', 'soft', 'mid', 'core']) h[k].setAttribute('d', d); }
  L = halves[0].core.getTotalLength();
  const bx = W / 2, by = H - G.inset;
  for (const c of [spark, sparkHalo]) { c.setAttribute('cx', bx); c.setAttribute('cy', by); }
  // the bud sits to the right of the Island, detached
  bud.style.left = (W / 2 + SPEC.island.w / 2 + SPEC.bud.gap) + 'px';
  render(S.t);
}

/* ---- STATE ---- */
const S = { t: 0, playing: false, speed: 1, iso: 'all' };
const P = (a, b) => clamp((S_t - a) / (b - a));
let S_t = 0;

/* one dash of length `len` ending at distance `end` along the half */
const dash = (p, len, end) => {
  len = Math.max(0, Math.min(len, end));
  p.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${(L * 3).toFixed(1)}`);
  p.setAttribute('stroke-dashoffset', (-(end - len)).toFixed(2));
};

function render(t) {
  S_t = t;
  const iso = S.iso;
  const show = k => iso === 'all' || iso === k;

  /* APPLE PAY. Familiar: the sheet rises, waits at the reader, says Done, leaves. */
  const pIn = iso === 'all' ? bez(E.out, P(...T.payIn)) : 1;
  const pOut = iso === 'all' ? bez(E.in, P(...T.payOut)) : 1;
  pay.style.transform = `translateY(${((1 - pIn) + pOut) * 110}%)`;
  dim.style.opacity = (0.22 * pIn * (1 - pOut)).toFixed(3);
  const dn = iso === 'all' ? bez(E.out, P(T.payDone, T.payDone + 200)) : 1;
  hold.style.opacity = (1 - dn).toFixed(3);
  done.style.opacity = dn.toFixed(3);
  done.style.transform = `scale(${lerp(0.96, 1, dn)})`;

  /* THE ROW lands in the list, quietly: the old rows make room, it fades up */
  const rp = iso === 'all' ? bez(E.out, P(...T.rowIn)) : 1;
  const rowH = newRow.offsetHeight;
  newRow.style.opacity = rp.toFixed(3);
  newRow.style.transform = `translateY(${((1 - rp) * 8).toFixed(2)}px)`;
  newRow.style.filter = rp < 1 ? `blur(${((1 - rp) * 8).toFixed(2)}px)` : 'none';
  for (const o of olds) o.style.transform = `translateY(${(-(1 - rp) * rowH).toFixed(2)}px)`;

  /* THE EDGE GLOW */
  const gOn = show('glow');
  const sp = P(...T.spark);
  const tr = bez(G.travelEase, P(...T.travel));
  const fd = bez(E.out, P(...T.fade));
  const started = t >= T.travel[0];
  const s = tr * L;
  for (const h of halves) {
    h.g.style.display = gOn ? '' : 'none';
    if (!gOn) continue;
    dash(h.trail, s, s); dash(h.trailSoft, s, s);
    const live = started ? 1 - fd : 0;
    h.trail.setAttribute('opacity', (G.trail * live).toFixed(3));
    h.trailSoft.setAttribute('opacity', (G.trail * 0.45 * live).toFixed(3));
    // the head: a short bright core inside a longer, softer falloff
    dash(h.soft, G.head * 1.3, s); dash(h.mid, G.head, s); dash(h.core, G.head * 0.62, s);
    h.soft.setAttribute('opacity', (0.75 * live).toFixed(3));
    h.mid.setAttribute('opacity', (0.9 * live).toFixed(3));
    h.core.setAttribute('opacity', live.toFixed(3));
  }
  // the spark: a small point at the bottom edge, gone as the two heads pull away
  const sa = gOn ? bez(E.out, sp) * (1 - clamp(tr / 0.25)) : 0;
  spark.setAttribute('r', (1 + 3 * bez(E.out, sp)).toFixed(2));
  sparkHalo.setAttribute('r', (4 + 10 * bez(E.out, sp)).toFixed(2));
  spark.setAttribute('opacity', sa.toFixed(3));
  sparkHalo.setAttribute('opacity', (sa * 0.8).toFixed(3));

  /* THE GLYPH buds out from under the Island as the rim lets go */
  const gp = show('glyph') ? bez(E.out, P(...T.glyph)) : 0;
  const away = SPEC.bud.size + SPEC.bud.gap;
  bud.style.opacity = gp > 0 ? '1' : '0';
  bud.style.transform = `translateX(${(-(1 - gp) * away).toFixed(2)}px)`;
  glyph.style.opacity = gp.toFixed(3);
  // signal and Wi-Fi step aside for the bud, as the system clears room beside the Island; battery stays
  for (const i of sbSide) i.style.opacity = (1 - clamp(gp * 1.6)).toFixed(3);
  glyph.style.transform = `scale(${lerp(0.25, 1, gp).toFixed(3)})`;
  glyph.style.filter = `blur(${((1 - gp) * 4).toFixed(2)}px) drop-shadow(0 0 ${(2 + 6 * (1 - gp)).toFixed(1)}px rgba(228,242,34,${(0.35 + 0.4 * (1 - gp)).toFixed(2)}))`;

  /* THE BUDGET under the amount, in the same beat */
  const rv = show('reveal') ? bez(E.out, P(...T.reveal)) : 0;
  cov.style.opacity = rv.toFixed(3);
  cov.style.transform = `translateY(${((1 - rv) * 8).toFixed(2)}px)`;
  cov.style.filter = rv < 1 ? `blur(${((1 - rv) * 8).toFixed(2)}px)` : 'none';

  timeline(t);
}

/* ---- PLAYBACK ---- */
let last = 0, raf = 0;
const win = () => SPEC.windows[S.iso];
function play() {
  const [a] = win();
  S.t = a; S.playing = true; last = performance.now();
  cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
}
function tick(now) {
  const [, b] = win();
  S.t = Math.min(b, S.t + (now - last) * S.speed); last = now;
  render(S.t);
  if (S.t < b && S.playing) raf = requestAnimationFrame(tick); else S.playing = false;
}

/* ---- THE LAB PANEL ---- */
const TRACKS = [
  ['Apple Pay', [T.payIn[0], T.payOut[1]], 'all'],
  ['Row', T.rowIn, 'all'],
  ['Spark', T.spark, 'glow'],
  ['Rim run', T.travel, 'glow'],
  ['Rim fade', T.fade, 'glow'],
  ['Glyph', T.glyph, 'glyph'],
  ['Budget', T.reveal, 'reveal']
];
const tracks = $('#tracks'), ph = $('#ph'), tl = $('#tl');
tracks.innerHTML = TRACKS.map(([n, [a, b]]) =>
  `<div class="tr"><span>${n}</span><span class="bar"><i style="left:${(a / T.end * 100).toFixed(2)}%;width:${((b - a) / T.end * 100).toFixed(2)}%"></i></span></div>`).join('');
function marks() {
  [...tracks.children].forEach((el, i) => {
    const k = TRACKS[i][2];
    el.classList.toggle('hot', S.iso !== 'all' && k === S.iso);
    el.classList.toggle('off', S.iso !== 'all' && k !== S.iso);
  });
}
function timeline(t) {
  const bar = tracks.querySelector('.bar'), tb = tl.getBoundingClientRect(), bb = bar.getBoundingClientRect();
  ph.style.left = (bb.left - tb.left + bb.width * clamp(t / T.end)) + 'px';
  const pct = (r) => Math.round(clamp((t - r[0]) / (r[1] - r[0])) * 100);
  $('#rd').innerHTML = `t <b>${Math.round(t)}</b>ms &middot; rim <b>${pct(T.travel)}%</b> &middot; glyph <b>${pct(T.glyph)}%</b> &middot; budget <b>${pct(T.reveal)}%</b>` +
    (S.speed !== 1 ? ` &middot; <b>${S.speed}&times;</b>` : '');
}
function scrub(e) {
  const bb = tracks.querySelector('.bar').getBoundingClientRect();
  S.playing = false; cancelAnimationFrame(raf);
  S.t = clamp((e.clientX - bb.left) / bb.width) * T.end;
  render(S.t);
}
tl.addEventListener('pointerdown', e => { tl.setPointerCapture(e.pointerId); scrub(e); });
tl.addEventListener('pointermove', e => { if (tl.hasPointerCapture(e.pointerId)) scrub(e); });

const seg = (id, set) => $(id).addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  [...$(id).children].forEach(x => x.classList.toggle('on', x === b));
  set(b.dataset.v);
});
seg('#speed', v => { S.speed = +v; play(); });
seg('#iso', v => { S.iso = v; marks(); play(); });
$('#play').addEventListener('click', play);
phone.addEventListener('click', play);   // tap the screen to replay, on a phone too

/* ---- SWIFTUI, printed from the spec ---- */
function swift() {
  const f = n => n.toFixed(2), s = ms => (ms / 1000).toFixed(2);
  const head = G.head / L;
  $('#swift').textContent =
`// Ramp tokens
let solar = Color(red: 0.894, green: 0.949, blue: 0.133)   // ${R.solar}
// the rim: each half runs bottom centre to top centre
struct HalfRim: Shape {
  var side: CGFloat            // -1 left, 1 right
  func path(in r: CGRect) -> Path { /* same path as halfPath() in ramp.js, radius ${SPEC.screen.r} */ }
}
ForEach([-1, 1], id: \\.self) { side in
  ZStack {
    HalfRim(side: side).trim(from: 0, to: run)
      .stroke(solar.opacity(${G.trail}), lineWidth: 1.5)
    HalfRim(side: side).trim(from: max(0, run - ${f(head * 1.3)}), to: run)
      .stroke(solar, style: .init(lineWidth: ${G.soft}, lineCap: .round))
      .blur(radius: ${G.softBlur}).opacity(0.75)
    HalfRim(side: side).trim(from: max(0, run - ${f(head)}), to: run)
      .stroke(solar, style: .init(lineWidth: ${G.mid}, lineCap: .round))
      .blur(radius: ${G.midBlur})
    HalfRim(side: side).trim(from: max(0, run - ${f(head * 0.62)}), to: run)
      .stroke(solar, style: .init(lineWidth: ${G.core}, lineCap: .round))
  }
}
.opacity(1 - letGo)
.ignoresSafeArea().allowsHitTesting(false)

// the run, then everything lands together at the top
withAnimation(.timingCurve(${G.travelEase.join(', ')}, duration: ${s(T.travel[1] - T.travel[0])})) { run = 1 }
withAnimation(.timingCurve(${E.out.join(', ')}, duration: ${s(T.fade[1] - T.fade[0])}).delay(${s(T.travel[1] - T.travel[0])})) {
  letGo = 1
}
withAnimation(.timingCurve(${E.out.join(', ')}, duration: ${s(T.reveal[1] - T.reveal[0])}).delay(${s(T.travel[1] - T.travel[0])})) {
  covered = true   // "Covered by ${SPEC.txn.budget}": .opacity + .offset(y: 8) + .blur(8)
}
// the glyph: Live Activity, minimal presentation
minimal: { Image(systemName: "creditcard.fill").foregroundStyle(solar) }`;
}

addEventListener('resize', size);
size(); swift(); marks();
if (Q.has('t')) { S.t = +Q.get('t'); render(S.t); }
else if (Q.has('still')) render(T.end);
else setTimeout(play, 500);
