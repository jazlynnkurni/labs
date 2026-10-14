// Control panel. Built from a spec so the markup stays in one place.

export function buildPanel(el, P, hooks) {
  const rows = [
    ['stretch', 'Stiffness', 0, 1, 0.01, v => v.toFixed(2)],
    ['bend', 'Bend stiffness', 0.05, 1, 0.01, v => v.toFixed(2)],
    ['yield', 'Yield', 0.01, 0.6, 0.005, v => v.toFixed(3) + ' rad'],
    ['plastic', 'Plastic rate', 0, 0.4, 0.005, v => v.toFixed(3)],
    ['relax', 'Relax', 3, 180, 1, v => Math.round(v) + ' s'],
    ['damping', 'Damping', 0.05, 3, 0.01, v => v.toFixed(2)],
    ['gravity', 'Gravity', 0, 20, 0.1, v => v.toFixed(1)],
    ['wind', 'Air', 0, 1.2, 0.01, v => v.toFixed(2)],
    ['tick', 'Tick strength', 0, 3, 0.01, v => v.toFixed(2)],
    ['substeps', 'Substeps', 4, 16, 1, v => String(Math.round(v))],
    ['grid', 'Grid', 0, 4, 1, v => hooks.gridLabel(Math.round(v))],
  ];

  el.innerHTML = '<h2>Cloth</h2>';
  const readouts = {};

  for (const [key, label, min, max, step, fmt] of rows) {
    const row = document.createElement('label');
    row.className = 'row';
    const name = document.createElement('span');
    name.textContent = label;
    const val = document.createElement('b');
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(key === 'grid' ? hooks.gridIndex() : P[key]);
    val.textContent = fmt(Number(input.value));
    readouts[key] = () => { val.textContent = fmt(Number(input.value)); };

    input.addEventListener('input', () => {
      const v = Number(input.value);
      val.textContent = fmt(v);
      if (key === 'grid') hooks.setGrid(Math.round(v));
      else if (key === 'substeps') P.substeps = Math.round(v);
      else P[key] = v;
    });

    row.append(name, val, input);
    el.appendChild(row);
  }

  const checks = document.createElement('div');
  checks.className = 'checks';
  const mk = (text, get, set) => {
    const b = document.createElement('button');
    b.textContent = text;
    const sync = () => b.classList.toggle('on', !!get());
    b.addEventListener('click', () => { set(!get()); sync(); });
    sync();
    return b;
  };
  checks.append(
    mk('Wireframe', () => P.wireframe, v => { P.wireframe = v; }),
    mk('Normals', () => P.normals, v => { P.normals = v; }),
  );
  const reset = document.createElement('button');
  reset.textContent = 'Reset cloth';
  reset.addEventListener('click', () => hooks.reset());
  checks.appendChild(reset);
  el.appendChild(checks);

  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = 'Press t to fire a tick. Press h to hide this.';
  el.appendChild(note);

  return { sync() { for (const k in readouts) readouts[k](); } };
}
