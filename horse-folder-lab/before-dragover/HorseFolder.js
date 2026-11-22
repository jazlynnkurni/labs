/* HorseFolder: the archival folder as a React component, built up one interaction state at a time.
   Now: idle and hover.
   idle      horses held on their opening poses, light steady, nothing moving
   hover     the horses gallop at 8 fps and the front sheet lifts 4 px off the folder, casting a
             shadow: the folder answers the pointer like a drawer about to be opened
   settling  the pointer has gone; the horses finish the stride they are in and come to rest
   Keyboard focus counts as hover. Reduced motion: no gallop and no lift, only the shadow.
   Still to come, one at a time: dragover, receiving, success, open.                        */
import React, { useEffect, useReducer, useRef } from 'react';
import htm from 'htm';
import { mountProcession } from './procession.js';
const html = htm.bind(React.createElement);

const GALLOP_FPS = 8;
const initial = { phase: 'idle', pointer: false, focus: false };
function reducer(s, e) {
  const next = { ...s };
  switch (e.type) {
    case 'pointer': next.pointer = e.on; break;
    case 'focus': next.focus = e.on; break;
    case 'settled': return s.phase === 'settling' ? { ...s, phase: 'idle' } : s;
    default: return s;
  }
  const engaged = next.pointer || next.focus;
  // engaged means hover; letting go means settling, never a hard stop and never a restart
  next.phase = engaged ? 'hover' : (s.phase === 'idle' ? 'idle' : 'settling');
  return next;
}

export function HorseFolder() {
  const [s, send] = useReducer(reducer, initial);
  const folder = useRef(), mirror = useRef(), ctl = useRef(null), phase = useRef(s.phase);
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
    if (p === 'hover') c.play(GALLOP_FPS);
    else if (p === 'settling') c.settle(() => send({ type: 'settled' }));
    else c.stop();
  }
  useEffect(() => apply(s.phase), [s.phase]);

  const notTouch = e => e.pointerType !== 'touch';
  return html`
    <div class="scene" data-phase=${s.phase}>
      <div class="mirror" ref=${mirror} aria-hidden="true"></div>
      <div class="folder" ref=${folder}></div>
      <div class="hit" role="button" tabIndex="0" aria-label="Horse archive folder"
        onPointerEnter=${e => notTouch(e) && send({ type: 'pointer', on: true })}
        onPointerLeave=${e => notTouch(e) && send({ type: 'pointer', on: false })}
        onFocus=${() => send({ type: 'focus', on: true })}
        onBlur=${() => send({ type: 'focus', on: false })}></div>
    </div>`;
}
