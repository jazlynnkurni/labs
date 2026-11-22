/* HorseFolder: the archival folder as a React component, built up one interaction state at a time.
   Now: idle, hover, drag-over, receiving, success, rejected.
   idle       horses held on their opening poses, light steady, nothing moving
   hover      the horses gallop at 8 fps and the front sheet lifts 4 px off the folder, casting a
              shadow: the folder answers the pointer like a drawer about to be opened
   settling   the pointer has gone; the horses finish the stride they are in and come to rest
   dragover   a real file is being dragged over: the front sheet tips forward on its bottom edge,
              showing the dark pocket behind it, a faint blue-white light runs along the opening,
              and the horses quicken to 12 fps for one stride, then ease back to 8
   receiving  the drop is validated; what can be kept slides in as paper slips, from where it was
              dropped into the pocket and behind the front sheet, while it is written to storage
   success    only once the write has completed and the slips are in: the folder closes gently,
              the horses finish their stride, and a quiet line says how many were added
   rejected   nothing could be kept: the folder closes and says why, with no success shown
   Keyboard focus counts as hover. Reduced motion: no gallop, lift, tilt or slide; the slips fade
   in at the opening and the shadow, the opening's light and the line of text carry the meaning.
   Still to come: open.                                                                       */
import React, { useEffect, useReducer, useRef } from 'react';
import htm from 'htm';
import { mountProcession } from './procession.js';
import { validate, add } from './store.js';
const html = htm.bind(React.createElement);

const GALLOP_FPS = 8, EAGER_FPS = 12, NOTE_MS = 2600;
const hasFiles = e => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const BUSY = ['receiving', 'success', 'rejected'];

const initial = { phase: 'idle', pointer: false, focus: false, drag: false, note: null };
const rest = (s, prev) => s.drag ? 'dragover' : (s.pointer || s.focus) ? 'hover' : (prev === 'idle' ? 'idle' : 'settling');
function reducer(s, e) {
  const busy = BUSY.includes(s.phase), next = { ...s };
  switch (e.type) {
    case 'pointer': next.pointer = e.on; break;
    case 'focus': next.focus = e.on; break;
    case 'drag': next.drag = e.on; break;
    case 'receive': return { ...s, drag: false, pointer: false, phase: 'receiving', note: null };   // pointer events do not fire during a drag
    case 'received': return { ...s, phase: 'success', note: e.note };
    case 'rejected': return { ...s, drag: false, pointer: false, phase: 'rejected', note: e.note };
    case 'done': return { ...s, note: null, phase: rest(s, 'settling') };
    case 'settled': return s.phase === 'settling' ? { ...s, phase: 'idle' } : s;
    default: return s;
  }
  if (busy) return next;                           // mid-delivery the folder finishes what it is doing first
  next.phase = rest(next, s.phase);
  return next;
}

/* what the line says */
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
function addedNote(n, skipped) { return { text: `${plural(n, 'file')} added${skipped.length ? ` · ${skipped.length} skipped` : ''}`, sub: 'Saved in this browser' }; }
function rejectNote(skipped) {
  if (skipped.length === 1) { const k = skipped[0]; return { text: k.why.startsWith('folders') ? 'Not added: folders can’t be added' : `Not added: ${k.name} is ${k.why}` }; }
  const why = [...new Set(skipped.map(k => k.why))];
  return { text: `Not added: ${plural(skipped.length, 'file')}${why.length === 1 ? ` ${why[0].startsWith('folders') ? 'are folders' : `are ${why[0]}`}` : ''}` };
}

/* the paper slips: from where the files were dropped, up to the opening, down into the pocket.
   They live between the back sheets and the front sheet, so the front sheet hides them as they go in. */
function slideIn(folderEl, files, at) {
  const front = folderEl.querySelector('.fold-front'), k = folderEl.clientWidth / 736, W = 78, H = 98;
  const mouthX = Math.min(626, Math.max(110, at.x));
  const runs = files.slice(0, 3).map((f, i) => {
    const slip = document.createElement('div'); slip.className = 'slip';
    const ext = (f.name.includes('.') ? f.name.split('.').pop() : f.type.split('/').pop() || 'file').slice(0, 5).toLowerCase();
    slip.innerHTML = `<i></i><span>.${ext}</span>`;
    const x0 = at.x - W / 2 + i * 6, y0 = at.y - H / 2 - i * 4, xm = mouthX - W / 2 + (i - 1) * 12;
    Object.assign(slip.style, { left: `${x0 / 7.36}%`, top: `${y0 / 7.36}%` });
    folderEl.insertBefore(slip, front);
    const dx = (xm - x0) * k, up = (201 - H * 0.62 - y0) * k, down = (216 - y0) * k;
    if (reduced()) return slip.animate([{ opacity: 0, transform: `translate(${dx}px, ${up}px)` }, { opacity: 1, offset: 0.4 }, { opacity: 0, transform: `translate(${dx}px, ${up}px)` }], { duration: 700, fill: 'forwards' }).finished.then(() => slip.remove());
    return slip.animate([
      { transform: 'translate(0, 0) rotate(-5deg) scale(1.03)', easing: 'cubic-bezier(.22, 1, .36, 1)' },
      { transform: `translate(${dx}px, ${up}px) rotate(-1deg) scale(1)`, offset: 0.55, easing: 'cubic-bezier(.55, 0, .75, .06)' },
      { transform: `translate(${dx}px, ${down}px) rotate(0deg) scale(1)` }
    ], { duration: 680, delay: i * 90, fill: 'forwards' }).finished.then(() => slip.remove());
  });
  return Promise.all(runs);
}

export function HorseFolder() {
  const [s, send] = useReducer(reducer, initial);
  const folder = useRef(), mirror = useRef(), ctl = useRef(null), phase = useRef(s.phase), depth = useRef(0), ease = useRef(0), note = useRef(0);
  phase.current = s.phase;

  useEffect(() => {
    let live = true;
    mountProcession(folder.current, { finish: true, travel: true, mirror: mirror.current, controlled: true }).then(c => {
      if (!live) return; ctl.current = c; apply(phase.current);
    });
    return () => { live = false; };
  }, []);
  function apply(p) {
    const c = ctl.current; if (!c) return;
    clearTimeout(ease.current);
    if (p === 'dragover') {                         // eager for one stride, then the usual gallop
      c.play(EAGER_FPS); ease.current = setTimeout(() => phase.current === 'dragover' && c.play(GALLOP_FPS), 11 * 1000 / EAGER_FPS);
    }
    else if (p === 'hover' || p === 'receiving') c.play(GALLOP_FPS);
    else if (p === 'success' || p === 'rejected') c.settle(() => {});   // finish the stride, then rest
    else if (p === 'settling') c.settle(() => send({ type: 'settled' }));
    else c.stop();
  }
  useEffect(() => apply(s.phase), [s.phase]);

  // a file dropped anywhere else on the page must not make the browser open it
  useEffect(() => {
    const guard = e => { if (hasFiles(e) && !e.target.closest?.('.hit')) { e.preventDefault(); if (e.type === 'dragover') e.dataTransfer.dropEffect = 'none'; } };
    addEventListener('dragover', guard); addEventListener('drop', guard);
    return () => { removeEventListener('dragover', guard); removeEventListener('drop', guard); };
  }, []);

  async function receive(e) {
    const r = folder.current.getBoundingClientRect(), at = { x: (e.clientX - r.left) / r.width * 736, y: (e.clientY - r.top) / r.height * 736 };
    const { accepted, skipped } = validate(e.dataTransfer);
    const finish = n => { clearTimeout(note.current); note.current = setTimeout(() => send({ type: 'done' }), NOTE_MS); send(n); };
    if (!accepted.length) return finish({ type: 'rejected', note: rejectNote(skipped) });
    send({ type: 'receive' });
    try {
      await Promise.all([add(accepted), slideIn(folder.current, accepted, at)]);   // accepted means written, not just dropped
      finish({ type: 'received', note: addedNote(accepted.length, skipped) });
    } catch (err) {
      folder.current.querySelectorAll('.slip').forEach(el => el.remove());
      finish({ type: 'rejected', note: { text: 'Not added: this browser couldn’t save it' } });
    }
  }
  // native drag and drop, counted so moving across nested elements never reads as leaving
  const drag = {
    onDragEnter: e => { if (!hasFiles(e)) return; e.preventDefault(); if (++depth.current === 1) send({ type: 'drag', on: true }); },
    onDragOver: e => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = BUSY.includes(phase.current) ? 'none' : 'copy'; },
    onDragLeave: e => { if (!hasFiles(e)) return; depth.current = Math.max(0, depth.current - 1); if (depth.current === 0) send({ type: 'drag', on: false }); },
    onDrop: e => { if (!hasFiles(e)) return; e.preventDefault(); depth.current = 0; if (BUSY.includes(phase.current)) return; receive(e); }
  };

  const notTouch = e => e.pointerType !== 'touch';
  const live = s.phase === 'dragover' ? 'Release to add to the archive' : s.note ? s.note.text : '';
  return html`
    <div class="scene" data-phase=${s.phase}>
      <div class="mirror" ref=${mirror} aria-hidden="true"></div>
      <div class="folder" ref=${folder}></div>
      <div class="hit" role="button" tabIndex="0" aria-label="Horse archive folder"
        onPointerEnter=${e => notTouch(e) && send({ type: 'pointer', on: true })}
        onPointerLeave=${e => notTouch(e) && send({ type: 'pointer', on: false })}
        onFocus=${() => send({ type: 'focus', on: true })}
        onBlur=${() => send({ type: 'focus', on: false })}
        onDragEnter=${drag.onDragEnter} onDragOver=${drag.onDragOver} onDragLeave=${drag.onDragLeave} onDrop=${drag.onDrop}></div>
      <div class="note" data-show=${!!s.note} aria-hidden="true">
        <p>${s.note?.text || ''}</p>${s.note?.sub ? html`<p class="sub">${s.note.sub}</p>` : null}
      </div>
      <p class="sr-only" aria-live="polite">${live}</p>
    </div>`;
}
