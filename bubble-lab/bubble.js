/* BUBBLE. The touch controls shared by the five directions: a heading dial, a vertical slider, a stick, a finger trail. */
window.B=(()=>{
  const pt=(e,el)=>{const r=el.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top,w:r.width,h:r.height};};
  function dragOn(el,fn,done){ let on=false; el.style.touchAction='none';
    el.addEventListener('pointerdown',e=>{on=true; el.setPointerCapture(e.pointerId); fn(pt(e,el),true); e.preventDefault();});
    el.addEventListener('pointermove',e=>{ if(on) fn(pt(e,el),false); });
    const up=e=>{ if(!on) return; on=false; if(done) done(pt(e,el)); }; el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up); }
  /* a heading dial: drag anywhere on it, the needle follows the angle from the centre */
  function dial(el,onChange,start=32){ let a=start; const set=v=>{a=((v%360)+360)%360; onChange(a);}; set(a);
    dragOn(el,p=>{ const dx=p.x-p.w/2, dy=p.y-p.h/2; set(Math.atan2(dx,-dy)*180/Math.PI); }); return {get:()=>a,set}; }
  /* a vertical slider: value 0 at the foot, 1 at the head */
  function vslider(el,onChange,start=.5){ let v=start; const set=x=>{v=Math.max(0,Math.min(1,x)); onChange(v);}; set(v);
    dragOn(el,p=>set(1-p.y/p.h)); return {get:()=>v,set}; }
  /* a horizontal slider */
  function hslider(el,onChange,start=.5){ let v=start; const set=x=>{v=Math.max(0,Math.min(1,x)); onChange(v);}; set(v);
    dragOn(el,p=>set(p.x/p.w)); return {get:()=>v,set}; }
  /* a stick: the offset from the centre, clamped to the radius, springing back when released */
  function stick(el,onChange,{spring=true,radius}={}){ const set=(x,y)=>onChange(x,y);
    dragOn(el,p=>{ const R=radius||Math.min(p.w,p.h)/2-18; let dx=p.x-p.w/2, dy=p.y-p.h/2; const d=Math.hypot(dx,dy); if(d>R){dx*=R/d;dy*=R/d;} set(dx/R,dy/R); },()=>{ if(spring) set(0,0); }); }
  /* a finger trail drawn into an svg path, in the svg's own pixel space */
  function trail(svg,path,onDone){ let pts=[]; dragOn(svg,(p,first)=>{ if(first) pts=[]; pts.push([p.x,p.y]); path.setAttribute('d',pts.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ')); },()=>{ if(onDone) onDone(pts); }); }
  /* press and hold: fills a ring over ms, fires when full */
  function hold(el,ms,onProgress,onDone){ let t0=0,raf=0; const tick=now=>{const p=Math.min(1,(now-t0)/ms); onProgress(p); if(p<1) raf=requestAnimationFrame(tick); else onDone();};
    el.addEventListener('pointerdown',e=>{t0=performance.now(); raf=requestAnimationFrame(tick); el.setPointerCapture(e.pointerId);});
    ['pointerup','pointercancel'].forEach(k=>el.addEventListener(k,()=>{cancelAnimationFrame(raf); onProgress(0);})); }
  const compass=a=>['N','NE','E','SE','S','SW','W','NW'][Math.round(a/45)%8];
  return {dial,vslider,hslider,stick,trail,hold,compass};
})();
