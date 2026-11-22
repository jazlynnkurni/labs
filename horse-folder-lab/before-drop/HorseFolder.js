/* HorseFolder: the archival folder as a React component, built up one interaction state at a time.
   Now: idle, hover, drag-over.
   idle      horses held on their opening poses, light steady, nothing moving
   hover     the horses gallop at 8 fps and the front sheet lifts 4 px off the folder, casting a
             shadow: the folder answers the pointer like a drawer about to be opened
   settling  the pointer has gone; the horses finish the stride they are in and come to rest
   dragover  a real file is being dragged over: the front sheet tips forward on its bottom edge,
             showing the dark pocket behind it, a faint blue-white light runs along the opening,
             and the horses quicken to 12 fps for one stride, then ease back to 8
   Keyboard focus counts as hover. Reduced motion: no gallop, lift or tilt; the shadow and the
   opening's light carry the meaning on their own.
   A drop is caught (so the browser never opens the file) but not yet accepted: no success is
   shown until the receiving state exists. Still to come: receiving, success, open.          */
import React, { useEffect, useReducer, useRef } from 'react';
import htm from 'htm';
import { mountProcession } from './procession.js';
const html = htm.bind(React.createElement);

const GALLOP_FPS = 8, EAGER_FPS = 12;
const hasFiles = e => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
const initial = { phase: 'idle', pointer: false, focus: false, drag: false };
function reducer(s, e) {
  const next = { ...s };
  switch (e.type) {
    case 'pointer': next.pointer = e.on; break;
    case 'focus': next.focus = e.on; break;
    case 'drag': next.drag = e.on; break;
    case 'drop': next.drag = false; next.pointer = false; break;      // pointer events do not fire during a drag
    case 'settled': return s.phase === 'settling' ? { ...s, phase: 'idle' } : s;
    default: return s;
  }
  const engaged = next.pointer || next.focus;
  // a file over the folder wins; engaged means hover; letting go means settling, never a hard stop or a restart
  next.phase = next.drag ? 'dragover' : engaged ? 'hover' : (s.phase === 'idle' ? 'idle' : 'settling');
  return next;
}

export function HorseFolder() {
  const [s, send] = useReducer(reducer, initial);
  const folder = useRef(), mirror = useRef(), ctl = useRef(null), phase = useRef(s.phase), depth = useRef(0), ease = useRef(0);
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
    else if (p === 'hover') c.play(GALLOP_FPS);
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
  // native drag and drop, counted so moving across nested elements never reads as leaving
  const drag = {
    onDragEnter: e => { if (!hasFiles(e)) return; e.preventDefault(); if (++depth.current === 1) send({ type: 'drag', on: true }); },
    onDragOver: e => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; },
    onDragLeave: e => { if (!hasFiles(e)) return; depth.current = Math.max(0, depth.current - 1); if (depth.current === 0) send({ type: 'drag', on: false }); },
    onDrop: e => { if (!hasFiles(e)) return; e.preventDefault(); depth.current = 0; send({ type: 'drop' }); }
  };

  const notTouch = e => e.pointerType !== 'touch';
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
      <p class="sr-only" aria-live="polite">${s.phase === 'dragover' ? 'Release to add to the archive' : ''}</p>
    </div>`;
}
