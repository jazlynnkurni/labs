/* HorseFolder: the archival folder as a React component, built up one interaction state at a time.
   Now: idle, hover, drag-over, receiving, success, rejected, open.
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
   open       a click, Enter or Space: the front sheet tips open and an index card rises out of the
              pocket with what is inside. Each file opens from its row and can be removed (with
              undo); Add files is the keyboard way in; files dropped on the card are kept too.
              Escape, the close button or a click outside puts the card back.
   Keyboard focus counts as hover. Reduced motion: no gallop, lift, tilt or slide; the slips fade
   in at the opening and the shadow, the opening's light and the line of text carry the meaning.
                                                                                              */
import React, { useEffect, useReducer, useRef, useState } from 'react';
import htm from 'htm';
import { mountProcession } from './procession.js';
import { validate, add, list, remove } from './store.js';
const html = htm.bind(React.createElement);

const GALLOP_FPS = 8, EAGER_FPS = 12, NOTE_MS = 2600;
const hasFiles = e => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const BUSY = ['receiving', 'success', 'rejected'], HELD = [...BUSY, 'open'];

const initial = { phase: 'idle', pointer: false, focus: false, drag: false, note: null };
const rest = (s, prev) => s.drag ? 'dragover' : (s.pointer || s.focus) ? 'hover' : (prev === 'idle' ? 'idle' : 'settling');
function reducer(s, e) {
  const next = { ...s };
  switch (e.type) {
    case 'pointer': next.pointer = e.on; break;
    case 'focus': next.focus = e.on; break;
    case 'drag': next.drag = e.on; break;
    case 'receive': return { ...s, drag: false, pointer: false, phase: 'receiving', note: null };   // pointer events do not fire during a drag
    case 'received': return { ...s, phase: 'success', note: e.note };
    case 'rejected': return { ...s, drag: false, pointer: false, phase: 'rejected', note: e.note };
    case 'done': return { ...s, note: null, phase: rest(s, 'settling') };
    case 'open': return ['idle', 'hover', 'settling'].includes(s.phase) ? { ...s, phase: 'open', note: null } : s;
    case 'close': return s.phase === 'open' ? { ...s, phase: rest(s, 'settling') } : s;
    case 'settled': return s.phase === 'settling' ? { ...s, phase: 'idle' } : s;
    default: return s;
  }
  if (HELD.includes(s.phase)) return next;         // mid-delivery, or open, the folder finishes what it is doing first
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
  const hit = useRef(), folder = useRef(), mirror = useRef(), ctl = useRef(null), phase = useRef(s.phase), depth = useRef(0), ease = useRef(0), note = useRef(0);
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
    else if (p === 'success' || p === 'rejected' || p === 'open') c.settle(() => {});   // finish the stride, then rest
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
    onDragOver: e => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = HELD.includes(phase.current) ? 'none' : 'copy'; },
    onDragLeave: e => { if (!hasFiles(e)) return; depth.current = Math.max(0, depth.current - 1); if (depth.current === 0) send({ type: 'drag', on: false }); },
    onDrop: e => { if (!hasFiles(e)) return; e.preventDefault(); depth.current = 0; if (HELD.includes(phase.current)) return; receive(e); }
  };

  const notTouch = e => e.pointerType !== 'touch';
  const live = s.phase === 'dragover' ? 'Release to add to the archive' : s.note ? s.note.text : '';
  return html`
    <div class="scene" data-phase=${s.phase}>
      <div class="mirror" ref=${mirror} aria-hidden="true"></div>
      <div class="folder" ref=${folder}></div>
      <div class="hit" ref=${hit} role="button" tabIndex="0" aria-label="Horse archive folder" aria-haspopup="dialog" aria-expanded=${s.phase === 'open'}
        onClick=${() => send({ type: 'open' })}
        onKeyDown=${e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); send({ type: 'open' }); } }}
        onPointerEnter=${e => notTouch(e) && send({ type: 'pointer', on: true })}
        onPointerLeave=${e => notTouch(e) && send({ type: 'pointer', on: false })}
        onFocus=${() => send({ type: 'focus', on: true })}
        onBlur=${() => send({ type: 'focus', on: false })}
        onDragEnter=${drag.onDragEnter} onDragOver=${drag.onDragOver} onDragLeave=${drag.onDragLeave} onDrop=${drag.onDrop}></div>
      <div class="note" data-show=${!!s.note} aria-hidden="true">
        <p>${s.note?.text || ''}</p>${s.note?.sub ? html`<p class="sub">${s.note.sub}</p>` : null}
      </div>
      ${s.phase === 'open' ? html`<${ArchiveCard} onClose=${() => { send({ type: 'close' }); hit.current?.focus({ preventScroll: true }); }} />` : null}
      <p class="sr-only" aria-live="polite">${live}</p>
    </div>`;
}

/* the contents: an aged index card that rises out of the pocket and lists what the folder holds */
const VIEWABLE = /^(image|text|audio|video)\/|^application\/pdf$/;
const size = b => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(b < 10240 ? 1 : 0)} KB` : `${(b / 1048576).toFixed(1)} MB`;
const day = t => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const extOf = f => (f.name.includes('.') ? f.name.split('.').pop() : (f.type.split('/').pop() || 'file')).slice(0, 5).toLowerCase();

function ArchiveCard({ onClose }) {
  const [files, setFiles] = useState(null), [msg, setMsg] = useState(null), [over, setOver] = useState(false);
  const card = useRef(), input = useRef(), urls = useRef(new Map()), depth = useRef(0), closing = useRef(false);
  const refresh = () => list().then(setFiles).catch(() => setFiles([]));
  function close() {                                // leaves by fading, quickly
    if (closing.current) return; closing.current = true;
    const a = card.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced() ? 0 : 160, easing: 'ease-out', fill: 'forwards' });
    (a ? a.finished : Promise.resolve()).then(onClose);
  }
  useEffect(() => {
    refresh(); card.current.focus({ preventScroll: true });
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    addEventListener('keydown', key);
    return () => { removeEventListener('keydown', key); urls.current.forEach(u => URL.revokeObjectURL(u)); };
  }, []);
  const url = f => { if (!urls.current.has(f.id)) urls.current.set(f.id, URL.createObjectURL(f.blob)); return urls.current.get(f.id); };
  async function take(source) {
    const { accepted, skipped } = validate(source);
    if (!accepted.length) { setMsg({ text: rejectNote(skipped).text }); return; }
    try { await add(accepted); setMsg({ text: addedNote(accepted.length, skipped).text }); refresh(); }
    catch { setMsg({ text: 'Not added: this browser couldn’t save it' }); }
  }
  async function drop(f) {
    try { await remove(f.id); setMsg({ text: `Removed ${f.name}`, undo: f }); refresh(); }
    catch { setMsg({ text: 'Couldn’t remove it' }); }
  }
  async function undo(f) { await add([f.blob]); setMsg(null); refresh(); }
  const cardDrag = {
    onDragEnter: e => { if (!hasFiles(e)) return; e.preventDefault(); if (++depth.current === 1) setOver(true); },
    onDragOver: e => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; },
    onDragLeave: e => { if (!hasFiles(e)) return; depth.current = Math.max(0, depth.current - 1); if (!depth.current) setOver(false); },
    onDrop: e => { if (!hasFiles(e)) return; e.preventDefault(); e.stopPropagation(); depth.current = 0; setOver(false); take(e.dataTransfer); }
  };
  const n = files ? files.length : 0;
  return html`<${React.Fragment}>
    <div class="veil" onClick=${close}></div>
    <section class="card" ref=${card} role="dialog" aria-label="Horse archive" tabIndex="-1" data-over=${over} ...${cardDrag}>
      <header>
        <div><h2>Horse archive</h2><p class="count">${files ? `${n} ${n === 1 ? 'file' : 'files'}` : ' '}</p></div>
        <button class="x" aria-label="Close" onClick=${close}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>
      </header>
      ${files && !n ? html`<p class="empty">Nothing here yet. Drop files on the folder, or add them below.</p>` : null}
      <ul>
        ${(files || []).map(f => html`
          <li key=${f.id}>
            <a href=${url(f)} target="_blank" rel="noopener" download=${VIEWABLE.test(f.type) ? undefined : f.name} title=${f.name}>
              <span class="ext">.${extOf(f)}</span><span class="name">${f.name}</span><span class="meta">${size(f.size)}</span><span class="meta">${day(f.added)}</span>
            </a>
            <button class="rm" aria-label=${`Remove ${f.name}`} onClick=${() => drop(f)}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>
          </li>`)}
      </ul>
      <footer>
        <button class="add" onClick=${() => input.current.click()}>Add files</button>
        <input ref=${input} type="file" multiple hidden onChange=${e => { take(e.target); e.target.value = ''; }} />
        <p class="msg" aria-live="polite">${msg ? msg.text : 'Saved in this browser'}${msg?.undo ? html` <button class="undo" onClick=${() => undo(msg.undo)}>Undo</button>` : null}</p>
      </footer>
    </section><//>`;
}
