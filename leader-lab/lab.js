/* LEADER LAB. The home page's projects panel with its leader, the line from the hovered title to the
   card that ends on the year. The site draws it as travelling dots; these are five other lines.
   The geometry is the site's own lead(): from 20px past the end of the title to 12px before the year,
   which sits 14px in from the card, turning only when a row is above or below the card. */
import { mountPipe } from './pipe-gl.js';

const PROJECTS = [
  { t: 'Fostr', y: '2026', s: 'Founding design engineer' },
  { t: 'Halodoc', y: '2026', s: 'Product designer' },
  { t: 'Conduit Commerce', y: '2026', s: 'Product design lead' },
  { t: 'Second Self', y: '2026', s: 'Design engineer' },
  { t: 'Manus AI', y: '2025', s: 'Product designer' },
  { t: 'Olive', y: '2025', s: 'Product designer' },
  { t: 'SomiaCX', y: '2024', s: 'Product designer' },
];
const SWATCH = ['#dfddc8', '#c7c7c7', '#827a85', '#9ba69c', '#c4c1c8', '#dfddc8', '#c2beb3', '#dfdac8'];   /* the discs' eight */
const NS = 'http://www.w3.org/2000/svg';
const V = Math.min(5, Math.max(1, parseInt(new URLSearchParams(location.search).get('v')) || 1));

const VARIANTS = {
  1: { name: 'Vellum pipe', note: 'The discs’ own shader, stretched into a pipe: the same frosted grain, rim and sheen, lit by the pointer the way the discs are. It grows out of the title and stops short of the year.' },
  2: { name: 'Vellum pipeline, flowing', note: 'The same pipe, a little wider, with a short second sheet sliding inside it toward the card. Where the two overlap the vellum stacks and brightens, so the flow is the material itself, not dots.' },
  3: { name: 'White glow hairline', note: 'A single 1px white line with a soft two-step glow, drawn in from the title. Quiet at a distance, luminous up close.' },
  4: { name: 'Fibre pulse', note: 'A faint hairline that carries a glowing pulse from the title to the card on a loop, like light down a fibre. The pulse replaces the old travelling dots.' },
  5: { name: 'Glass tube', note: 'A hollow tube in plain SVG: a thin rim on both sides, a faint body and a top highlight, so it reads as a pipe without WebGL. The lightest of the five to port.' },
};

const $ = id => document.getElementById(id);
const panel = $('panel'), rows = $('rows'), preview = $('preview'), yr = $('yr'), svg = $('svg'), cv = $('gl');
$('name').textContent = VARIANTS[V].name; $('note').textContent = VARIANTS[V].note;
document.title = 'leader lab / ' + VARIANTS[V].name;
$('vs').innerHTML = [1, 2, 3, 4, 5].map(k => `<a href="?v=${k}"${k === V ? ' aria-current="page"' : ''}>${k}</a>`).join('');
rows.innerHTML = PROJECTS.map((p, i) => `<li data-i="${i}"><a href="#">${p.t}</a></li>`).join('');

const gl = V <= 2 ? mountPipe(cv, { ground: '#000000', paper: '#FFFFFF' }) : null;
if (!gl) cv.remove();

/* ---------- the SVG lines ---------- */
const el = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
const defs = el('defs', {});
const glow = el('filter', { id: 'glow', filterUnits: 'userSpaceOnUse', x: -400, y: -400, width: 4000, height: 3000 }, defs);
el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 7, result: 'wide' }, glow);
el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 2.2, result: 'near' }, glow);
const gm = el('feMerge', {}, glow); ['wide', 'near', 'wide', 'SourceGraphic'].forEach(n => el('feMergeNode', { in: n }, gm));
const grad = el('linearGradient', { id: 'comet', gradientUnits: 'userSpaceOnUse' }, defs);
el('stop', { offset: 0, 'stop-color': 'var(--glowc)', 'stop-opacity': 0 }, grad);
el('stop', { offset: 0.75, 'stop-color': 'var(--glowc)', 'stop-opacity': 0.7 }, grad);
el('stop', { offset: 1, 'stop-color': 'var(--glowc)', 'stop-opacity': 1 }, grad);

const css = document.createElement('style');
css.textContent = `:root{--glowc:#14171B;--rim:rgba(20,23,27,.30);--body:rgba(20,23,27,.04);--spec:rgba(255,255,255,.95);--shade:rgba(20,23,27,.10)}
[data-theme="dark"]{--glowc:#FFFFFF;--rim:rgba(250,249,247,.30);--body:rgba(250,249,247,.05);--spec:rgba(250,249,247,.62);--shade:rgba(0,0,0,.45)}`;
document.head.appendChild(css);

const P = {};   /* the parts each SVG variant draws with */
if (V === 3) {
  P.line = el('path', { fill: 'none', stroke: 'var(--glowc)', 'stroke-width': 1, 'stroke-linecap': 'round', filter: 'url(#glow)', opacity: 0.9 });
}
if (V === 4) {
  P.base = el('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1, 'stroke-linecap': 'round', opacity: 0.22 });
  P.comet = el('path', { fill: 'none', stroke: 'url(#comet)', 'stroke-width': 1.5, 'stroke-linecap': 'round', filter: 'url(#glow)' });
}
if (V === 5) {
  P.shade = el('path', { fill: 'none', stroke: 'var(--shade)', 'stroke-width': 11, 'stroke-linecap': 'round', transform: 'translate(0 2.5)', style: 'filter:blur(2.5px)' });
  P.rim = el('path', { fill: 'none', stroke: 'var(--rim)', 'stroke-width': 10, 'stroke-linecap': 'round' });
  P.hole = el('path', { fill: 'none', stroke: 'var(--paper)', 'stroke-width': 8, 'stroke-linecap': 'round' });
  P.body = el('path', { fill: 'none', stroke: 'var(--body)', 'stroke-width': 8, 'stroke-linecap': 'round' });
  P.spec = el('path', { fill: 'none', stroke: 'var(--spec)', 'stroke-width': 1.1, 'stroke-linecap': 'round' });
}

/* ---------- the geometry: the site's lead() ---------- */
let on = -1, start = 0, geo = null, raf = 0, ptr = { x: 0, y: 0 };
function measure(i) {
  const a = rows.children[i].querySelector('a'), R = document.createRange(); R.selectNodeContents(a);
  const Pn = panel.getBoundingClientRect(), T = R.getBoundingClientRect(), C = preview.getBoundingClientRect();
  const x0 = T.right - Pn.left + 20, y = T.top - Pn.top + T.height / 2;
  const cx = C.left - Pn.left, top = C.top - Pn.top, bot = C.bottom - Pn.top;
  const cy = Math.max(top + 26, Math.min(bot - 26, y));
  const yrX = cx - 14; yr.textContent = PROJECTS[i].y; yr.style.left = yrX + 'px'; yr.style.top = cy + 'px';
  const x1 = Math.min(yrX - yr.offsetWidth - 12, Pn.width - 8);
  return x1 > x0 + 12 ? { x0, y, x1, cy } : null;
}
const ease = t => 1 - Math.pow(1 - t, 3);
const at = (g, k) => [g.x0 + (g.x1 - g.x0) * k, g.y + (g.cy - g.y) * k];
const d = (a, b) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;

function frame(ms) {
  raf = 0; if (on < 0 || !geo) return;
  const g = geo, now = ms / 1000;
  const t = ease(Math.min(1, (ms - start) / 340));
  const head = at(g, t), tail = [g.x0, g.y];
  if (gl) {
    const o = 40;   /* the canvas hangs 40px past the panel on every side */
    gl.lightAt(ptr.x + o, ptr.y + o);
    const w = V === 1 ? 2.4 : 14;
    const pipes = [{ x0: tail[0] + o + w / 2, y0: tail[1] + o, x1: Math.max(tail[0] + w / 2 + 0.5, head[0] - w / 2) + o, y1: head[1] + o, w, ink: V === 1 ? (on % 2 ? 2 : 3) : 0, op: V === 1 ? (on % 2 ? 6.5 : 4.5) : 2.0, seed: 3.1 }];
    if (V === 2 && t >= 1) {
      /* the flow: a short second sheet slides through the pipe toward the card, two at a time */
      const len = Math.hypot(g.x1 - g.x0, g.cy - g.y), seg = Math.min(90, len * 0.3);
      for (const ph of [0, 0.5]) {
        const k = ((now / 2.2) + ph) % 1, a0 = Math.max(0, k * (len + seg) - seg) / len, a1 = Math.min(len, k * (len + seg)) / len;
        if (a1 - a0 < 0.01) continue;
        const A = at(g, a0), B = at(g, a1);
        pipes.push({ x0: A[0] + o + w / 2, y0: A[1] + o, x1: Math.max(A[0] + w / 2 + 0.5, B[0] - w / 2) + o, y1: B[1] + o, w: w - 2, ink: 0, op: 2.6, seed: 9.7 + ph });
      }
    }
    gl.draw(pipes, SWATCH);
  }
  if (V === 3) P.line.setAttribute('d', d(tail, head));
  if (V === 4) {
    P.base.setAttribute('d', d(tail, head));
    const len = Math.hypot(g.x1 - g.x0, g.cy - g.y), k = ((now - start / 1000) / 1.8) % 1, hk = Math.min(1, k * 1.25) * t;
    const tk = Math.max(0, hk - 110 / len), H = at(g, hk), Tl = at(g, tk);
    P.comet.setAttribute('d', d(Tl, H));
    grad.setAttribute('x1', Tl[0]); grad.setAttribute('y1', Tl[1]); grad.setAttribute('x2', H[0]); grad.setAttribute('y2', H[1]);
    P.comet.setAttribute('opacity', k > 0.8 ? (1 - (k - 0.8) / 0.2).toFixed(3) : 1);
  }
  if (V === 5) {
    const a = [tail[0] + 5, tail[1]], b = [Math.max(tail[0] + 5.5, head[0] - 5), head[1]], path = d(a, b);
    ['shade', 'rim', 'hole', 'body'].forEach(k => P[k].setAttribute('d', path));
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = Math.sin(ang) * 2.2, ny = -Math.cos(ang) * 2.2;   /* the highlight rides the top of the bore */
    P.spec.setAttribute('d', d([a[0] + nx + 2, a[1] + ny], [b[0] + nx - 2, b[1] + ny]));
  }
  raf = requestAnimationFrame(frame);
}
function show(i) {
  if (i === on) return; on = i;
  [...rows.children].forEach((li, j) => li.classList.toggle('on', j === i));
  $('pv').textContent = PROJECTS[i].s;
  geo = measure(i); start = performance.now(); panel.classList.add('hot');
  if (!raf) raf = requestAnimationFrame(frame);
}
function hide() { on = -1; panel.classList.remove('hot'); [...rows.children].forEach(li => li.classList.remove('on')); }
rows.addEventListener('pointerover', e => { const li = e.target.closest('a') && e.target.closest('li'); if (li) show(+li.dataset.i); });
rows.addEventListener('pointerleave', hide);
rows.addEventListener('pointermove', e => { if (!e.target.closest('a')) hide(); }, { passive: true });
rows.addEventListener('click', e => e.preventDefault());
panel.addEventListener('pointermove', e => { const r = panel.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; }, { passive: true });
addEventListener('resize', () => { if (on >= 0) geo = measure(on); });
/* 1 to 5 switch line, t switches light and dark (the site has both) */
addEventListener('keydown', e => {
  if (/^[1-5]$/.test(e.key)) location.search = '?v=' + e.key;
  if (e.key === 't') { const h = document.documentElement; h.dataset.theme = h.dataset.theme === 'dark' ? 'light' : 'dark'; }
});
window.__show = show;
