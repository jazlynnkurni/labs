import { PARAMS } from './params.js';

// Controls live in the plate chassis panel. h toggles, the gear toggles, space pauses.
export function makePanel(state, resetPan) {
  const panel  = document.getElementById('panel');
  const hint   = document.getElementById('hint');

  const syncers = [];
  const syncAll = () => { for (const f of syncers) f(); };

  // restore anything saved from last time, unless the url already said otherwise
  try {
    const raw = localStorage.getItem('rosette.settings.v1');
    if (raw && !location.search) {
      const o = JSON.parse(raw);
      for (const p of PARAMS) if (typeof o[p.key] === 'number') state[p.key] = o[p.key];
    }
  } catch (_) {}

  for (const p of PARAMS) {
    const row = document.createElement('label');
    row.className = 'row';

    const name = document.createElement('span');
    name.textContent = p.label;
    const val = document.createElement('b');
    const input = document.createElement('input');
    input.type = 'range';
    input.min = p.min; input.max = p.max; input.step = p.step;
    input.value = state[p.key];
    input.setAttribute('aria-label', p.label);

    const dp = String(p.step).includes('.') ? String(p.step).split('.')[1].length : 0;
    const show = () => { val.textContent = state[p.key].toFixed(dp); };
    input.addEventListener('input', () => {
      state[p.key] = parseFloat(input.value);
      show();
      save();
    });
    syncers.push(() => { input.value = state[p.key]; show(); });
    show();

    row.append(name, val, input);
    panel.append(row);
  }

  // Settings persist, so a look you liked is still there next time.
  const STORE = 'rosette.settings.v1';
  const save = () => {
    try {
      const o = {};
      for (const p of PARAMS) o[p.key] = state[p.key];
      localStorage.setItem(STORE, JSON.stringify(o));
    } catch (_) {}
  };

  const buttons = document.createElement('div');
  buttons.className = 'row btns';
  const mk = (label, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', fn);
    buttons.append(b);
    return b;
  };
  mk('reset', () => {
    for (const p of PARAMS) state[p.key] = p.value;
    if (resetPan) resetPan();
    syncAll();
    save();
  });
  mk('recentre', () => { if (resetPan) resetPan(); });
  mk('copy link', () => {
    const q = PARAMS.filter(p => state[p.key] !== p.value)
      .map(p => p.key + '=' + state[p.key]).join('&');
    const url = location.origin + location.pathname + (q ? '?' + q : '');
    navigator.clipboard?.writeText(url);
    const b = buttons.lastChild;
    const t = b.textContent; b.textContent = 'copied';
    setTimeout(() => { b.textContent = t; }, 1100);
  });
  panel.append(buttons);

  const stat = document.createElement('div');
  stat.className = 'row stat';
  const statName = document.createElement('span');
  statName.textContent = 'space pauses';
  const statVal = document.createElement('b');
  stat.append(statName, statVal);
  panel.append(stat);

  panel.classList.add('open');

  let dismissed = false;
  const dismiss = () => { if (!dismissed) { dismissed = true; hint.classList.add('gone'); } };
  setTimeout(dismiss, 6000);

  const setOpen = (v) => { panel.classList.toggle('open', v); dismiss(); };

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target instanceof HTMLInputElement && e.key !== 'h') return;
    const k = e.key.toLowerCase();
    if (k === 'h') { setOpen(!panel.classList.contains('open')); e.preventDefault(); }
    else if (k === ' ') { state.paused = !state.paused; dismiss(); e.preventDefault(); }
  });

  return {
    stat(fps) { statVal.textContent = state.paused ? 'paused' : fps.toFixed(0) + ' fps'; }
  };
}
