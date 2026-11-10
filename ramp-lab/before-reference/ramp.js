import { SPEC, clamp, lerp, bez } from './spec.js';

const $ = s => document.querySelector(s);
const phone = $('#phone'), rim = $('#rim'), svg = $('#glow');
const pay = $('#pay'), dim = $('#dim'), hold = $('#hold'), done = $('#done');
const isl = $('#isl'), cmp = $('#cmp'), exp = $('#exp'), xbtn = $('#xbtn'), app = $('#app'), det = $('#det');
const newRow = $('#new'), olds = [...document.querySelectorAll('.row.old')];
const sbTime = $('#sb .tm'), sbIcons = [...document.querySelectorAll('#sb .ic svg')];
const T = SPEC.t, G = SPEC.glow, R = SPEC.ramp, E = SPEC.ease, I = SPEC.island, X = SPEC.txn;

/* the lime card glyph: the one saturated thing once the rim lets go */
const GLYPH = `<rect x="1" y="4" width="18" height="12.5" rx="3" fill="${R.solar}"/><rect x="1" y="7" width="18" height="2.6" fill="#000"/><rect x="4" y="12" width="5" height="1.8" rx=".9" fill="#000" fill-opacity=".55"/>`;
document.querySelectorAll('svg.glyph').forEach(g => g.innerHTML = GLYPH);
const cglyph = $('#cglyph');

$('#mer').textContent = X.merchant; $('#amt').textContent = X.amount; $('#rbud').textContent = X.budget;
$('#camt').textContent = X.amount;
$('#xmer').textContent = X.merchant; $('#xamt').textContent = X.amount; $('#xsub').textContent = `Paid from ${X.budget}`;
$('#dmer').textContent = X.merchant; $('#dwhen').textContent = X.when; $('#damt').textContent = X.amount;
$('#dbud').textContent = X.budget; $('#dcard').textContent = `Physical card ending ${X.card}`;
$('#pnum').textContent = X.card;

const Q = new URLSearchParams(location.search);
if (Q.has('still')) document.body.classList.add('still');

/* ---- THE RIM: two halves of the screen's rounded rect, bottom centre up to
 * top centre, so one spark splits into two highlights that meet at the Island ---- */
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
  for (const c of [spark, sparkHalo]) { c.setAttribute('cx', W / 2); c.setAttribute('cy', H - G.inset); }
  render(S.t);
}

/* ---- STATE ----
 * The timeline drives everything while the demo plays or you scrub. Touch the
 * Island and you take over: `drive` goes false and the expanded and detail
 * progress (e, d) are tweened by your gestures instead. */
const S = { t: 0, playing: false, speed: 1, iso: 'all', drive: true, e: 0, d: 0, rx: 0, receipt: false };
let NOW = 0;
const P = (a, b) => clamp((NOW - a) / (b - a));

const dash = (p, len, end) => {
  len = Math.max(0, Math.min(len, end));
  p.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${(L * 3).toFixed(1)}`);
  p.setAttribute('stroke-dashoffset', (-(end - len)).toFixed(2));
};

/* the Island's compact and expanded progress at time t, before any gesture */
const compactAt = () => (S.iso === 'all' || S.iso === 'compact') ? bez(E.morph, P(...T.compact)) : (S.iso === 'expanded' ? 1 : 0);
const expandAt = () => (S.iso === 'all' || S.iso === 'expanded') ? bez(E.morph, P(...T.hold)) : 0;

function render(t) {
  NOW = t;
  const iso = S.iso, show = k => iso === 'all' || iso === k;
  const pre = iso === 'all';          // in isolation, Apple Pay and the row are already done

  /* APPLE PAY: rises, waits at the reader, Done, leaves */
  const pIn = pre ? bez(E.out, P(...T.payIn)) : 1;
  const pOut = pre ? bez(E.in, P(...T.payOut)) : 1;
  pay.style.transform = `translateY(${((1 - pIn) + pOut) * 110}%)`;
  dim.style.opacity = (0.22 * pIn * (1 - pOut)).toFixed(3);
  const dn = pre ? bez(E.out, P(T.payDone, T.payDone + 200)) : 1;
  hold.style.opacity = (1 - dn).toFixed(3);
  done.style.opacity = dn.toFixed(3);
  done.style.transform = `scale(${lerp(0.96, 1, dn)})`;

  /* THE PURCHASE APPEARS in the list */
  const rp = pre ? bez(E.out, P(...T.rowIn)) : 1;
  const rowH = newRow.offsetHeight;
  newRow.style.opacity = rp.toFixed(3);
  newRow.style.transform = `translateY(${((1 - rp) * 8).toFixed(2)}px)`;
  newRow.style.filter = rp < 1 ? `blur(${((1 - rp) * 8).toFixed(2)}px)` : 'none';
  for (const o of olds) o.style.transform = `translateY(${(-(1 - rp) * rowH).toFixed(2)}px)`;

  /* THE RIM, once */
  const gOn = show('glow');
  const sp = P(...T.spark), tr = bez(G.travelEase, P(...T.travel)), fd = bez(E.out, P(...T.fade));
  const live = t >= T.travel[0] ? 1 - fd : 0, s = tr * L;
  for (const h of halves) {
    h.g.style.display = gOn ? '' : 'none';
    if (!gOn) continue;
    dash(h.trail, s, s); dash(h.trailSoft, s, s);
    h.trail.setAttribute('opacity', (G.trail * live).toFixed(3));
    h.trailSoft.setAttribute('opacity', (G.trail * 0.45 * live).toFixed(3));
    dash(h.soft, G.head * 1.3, s); dash(h.mid, G.head, s); dash(h.core, G.head * 0.62, s);
    h.soft.setAttribute('opacity', (0.75 * live).toFixed(3));
    h.mid.setAttribute('opacity', (0.9 * live).toFixed(3));
    h.core.setAttribute('opacity', live.toFixed(3));
  }
  const sa = gOn ? bez(E.out, sp) * (1 - clamp(tr / 0.25)) : 0;
  spark.setAttribute('r', (1 + 3 * bez(E.out, sp)).toFixed(2));
  sparkHalo.setAttribute('r', (4 + 10 * bez(E.out, sp)).toFixed(2));
  spark.setAttribute('opacity', sa.toFixed(3));
  sparkHalo.setAttribute('opacity', (sa * 0.8).toFixed(3));

  /* THE ISLAND */
  const c = compactAt();
  const e = S.drive ? expandAt() : S.e;
  const d = S.drive ? 0 : S.d;
  island(c, e);

  /* the transaction view, pushed in from the right when the Island is tapped */
  const dd = bez(E.out, d);
  det.style.transform = `translateX(${((1 - dd) * 100).toFixed(2)}%)`;
  app.style.transform = `translateX(${(-dd * 30).toFixed(2)}%)`;

  timeline(t, c, e);
}

function island(c, e) {
  const C = I.compact, Xp = I.expanded;
  const hx = lerp(Xp.h, Xp.hReceipt, S.rx);
  const w = lerp(lerp(I.rest.w, C.w, c), Xp.w, e);
  const h = lerp(I.rest.h, hx, e);
  const r = Math.min(h / 2, lerp(I.rest.r, Xp.r, e));
  isl.style.width = w.toFixed(2) + 'px'; isl.style.height = h.toFixed(2) + 'px';
  isl.style.marginLeft = (-w / 2).toFixed(2) + 'px'; isl.style.borderRadius = r.toFixed(2) + 'px';

  /* compact: the glyph settles in (scale, blur, opacity, per the icon rule), the amount just fades */
  const co = c * (1 - clamp(e / 0.25));
  cmp.style.opacity = co.toFixed(3);
  cglyph.style.transform = `scale(${lerp(0.25, 1, c).toFixed(3)})`;
  cglyph.style.filter = c < 1 ? `blur(${((1 - c) * 4).toFixed(2)}px)` : 'none';
  $('#camt').style.opacity = clamp((c - 0.35) / 0.65).toFixed(3);

  /* expanded: text laid out at its final size, centred; it only fades in, late, once the panel is nearly there */
  const xo = bez(E.out, clamp((e - 0.55) / 0.45));
  exp.style.opacity = xo.toFixed(3);
  exp.style.pointerEvents = e > 0.9 ? 'auto' : 'none';
  xbtn.style.display = S.rx > 0 ? 'block' : 'none';
  xbtn.style.opacity = S.rx.toFixed(3);

  /* the status bar makes room: signal and Wi-Fi for the compact pill, all of it under the panel */
  const side = 1 - clamp(c * 1.6), all = 1 - clamp(e * 2.5);
  sbIcons[0].style.opacity = sbIcons[1].style.opacity = (side * all).toFixed(3);
  sbIcons[2].style.opacity = sbTime.style.opacity = all.toFixed(3);
}

/* ---- PLAYBACK ---- */
let last = 0, raf = 0;
const win = () => SPEC.windows[S.iso];
function play() {
  S.drive = true; S.e = 0; S.d = 0;
  S.t = win()[0]; S.playing = true; last = performance.now();
  cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
}
function tick(now) {
  const b = win()[1];
  S.t = Math.min(b, S.t + (now - last) * S.speed); last = now;
  render(S.t);
  if (S.t < b && S.playing) raf = requestAnimationFrame(tick); else S.playing = false;
}
function stop() { S.playing = false; cancelAnimationFrame(raf); }

/* small tweens for the gestures, on the same curves */
const tweens = {};
function tween(key, to, ms, curve = E.morph) {
  cancelAnimationFrame(tweens[key]);
  const from = S[key], t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / ms);
    S[key] = from + (to - from) * bez(curve, k);
    render(S.t);
    if (k < 1) tweens[key] = requestAnimationFrame(step);
  };
  tweens[key] = requestAnimationFrame(step);
}

/* ---- GESTURES on the Island: tap opens the transaction, press and hold expands ---- */
function takeOver() {
  if (S.drive) { const e = expandAt(); stop(); S.drive = false; S.e = e; S.d = 0; }
}
let holdTimer = 0, held = false;
isl.addEventListener('pointerdown', ev => {
  if (compactAt() < 0.5) return;               // nothing in the Island yet
  ev.stopPropagation(); takeOver();
  isl.setPointerCapture(ev.pointerId); held = false;
  clearTimeout(holdTimer);
  if (S.e < 0.5) holdTimer = setTimeout(() => { held = true; tween('e', 1, 460); }, SPEC.gesture.holdMs);
});
isl.addEventListener('pointerup', ev => {
  if (compactAt() < 0.5) return;
  ev.stopPropagation(); clearTimeout(holdTimer);
  if (held) return;                            // the hold already did its thing
  // a tap, compact or expanded: open the transaction in Ramp, and the Island settles back
  if (S.e > 0.01) tween('e', 0, 380);
  tween('d', 1, 420, E.out);
});
isl.addEventListener('pointercancel', () => clearTimeout(holdTimer));
isl.addEventListener('contextmenu', ev => ev.preventDefault());
// a touch anywhere else on the screen closes the expanded panel
phone.addEventListener('pointerdown', () => { if (!S.drive && S.e > 0.01) tween('e', 0, 380); });
$('#back').addEventListener('click', () => { takeOver(); tween('d', 0, 380, E.out); });

/* ---- THE LAB PANEL ---- */
$('#rcpt').addEventListener('change', ev => { S.receipt = ev.target.checked; tween('rx', S.receipt ? 1 : 0, 300, E.out); });
$('#play').addEventListener('click', play);

const TRACKS = [
  ['Apple Pay', [T.payIn[0], T.payOut[1]], 'all'],
  ['Row', T.rowIn, 'all'],
  ['Spark', T.spark, 'glow'],
  ['Rim run', T.travel, 'glow'],
  ['Rim fade', T.fade, 'glow'],
  ['Compact', T.compact, 'compact'],
  ['Hold', T.hold, 'expanded']
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
function timeline(t, c, e) {
  const bar = tracks.querySelector('.bar'), tb = tl.getBoundingClientRect(), bb = bar.getBoundingClientRect();
  ph.style.left = (bb.left - tb.left + bb.width * clamp(t / T.end)) + 'px';
  $('#rd').innerHTML = `t <b>${Math.round(t)}</b>ms &middot; rim <b>${Math.round(clamp((t - T.travel[0]) / (T.travel[1] - T.travel[0])) * 100)}%</b> &middot; compact <b>${Math.round(c * 100)}%</b> &middot; expanded <b>${Math.round(e * 100)}%</b>` +
    (S.speed !== 1 ? ` &middot; <b>${S.speed}&times;</b>` : '');
}
function scrub(ev) {
  const bb = tracks.querySelector('.bar').getBoundingClientRect();
  stop(); S.drive = true; S.d = 0;
  S.t = clamp((ev.clientX - bb.left) / bb.width) * T.end;
  render(S.t);
}
tl.addEventListener('pointerdown', ev => { tl.setPointerCapture(ev.pointerId); scrub(ev); });
tl.addEventListener('pointermove', ev => { if (tl.hasPointerCapture(ev.pointerId)) scrub(ev); });

const seg = (id, set) => $(id).addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  [...$(id).children].forEach(x => x.classList.toggle('on', x === b));
  set(b.dataset.v);
});
seg('#speed', v => { S.speed = +v; play(); });
seg('#iso', v => { S.iso = v; marks(); play(); });

/* ---- SWIFTUI, printed from the spec ---- */
function swift() {
  const s = ms => (ms / 1000).toFixed(2);
  $('#swift').textContent =
`let solar = Color(red: 0.894, green: 0.949, blue: 0.133)   // ${R.solar}

// THE ISLAND: a Live Activity
DynamicIsland {
  DynamicIslandExpandedRegion(.bottom) {
    // one transaction row: merchant and amount share a baseline
    VStack(alignment: .leading, spacing: 4) {
      HStack(alignment: .firstTextBaseline, spacing: 10) {
        RampCardGlyph().frame(width: 22, height: 22)
          .alignmentGuide(.firstTextBaseline) { $0[VerticalAlignment.center] + 6 }
        Text("${X.merchant}").font(.custom("Lausanne", size: 17))
        Spacer(minLength: 12)
        Text("${X.amount}").font(.custom("Lausanne", size: 17)).monospacedDigit()
      }
      Text("Paid from ${X.budget}")
        .font(.custom("Lausanne", size: 13)).foregroundStyle(.white.opacity(0.55))
        .padding(.leading, 32)          // starts at the merchant's left edge
      if receiptRequired {
        Button(intent: AttachReceipt()) { Text("Attach receipt").frame(maxWidth: .infinity) }
          .buttonStyle(.plain).frame(height: 34)
          .background(.white.opacity(0.14), in: Capsule())
          .padding(.top, 10)
      }
    }
    .foregroundStyle(.white)
    .padding(.horizontal, ${I.expanded.pad - 8})
  }
} compactLeading: {
  RampCardGlyph().frame(width: 20, height: 20)      // the only lime
} compactTrailing: {
  Text("${X.amount}").font(.custom("Lausanne", size: 13)).monospacedDigit()
    .contentTransition(.identity)                  // steady while the pill animates
} minimal: {
  RampCardGlyph()
}
.widgetURL(URL(string: "ramp://transactions/latest"))   // a tap opens it in Ramp

// THE RIM, in the app: once, then it lets go as the Activity starts
withAnimation(.timingCurve(${G.travelEase.join(', ')}, duration: ${s(T.travel[1] - T.travel[0])})) { run = 1 }
withAnimation(.timingCurve(${E.out.join(', ')}, duration: ${s(T.fade[1] - T.fade[0])}).delay(${s(T.travel[1] - T.travel[0])})) { letGo = 1 }`;
}

addEventListener('resize', size);
size(); swift(); marks();
if (Q.has('receipt')) { S.receipt = true; S.rx = 1; $('#rcpt').checked = true; }
if (Q.has('t')) { S.t = +Q.get('t'); render(S.t); }
else if (Q.has('still')) render(T.end);
else setTimeout(play, 500);
