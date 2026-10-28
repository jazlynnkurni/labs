/* THE LOADER, shared. The signature loading screen from jazlynnwashere.com (seven cells breathing between two hairlines,
   inked in gold and plum one by one), as a module any page on this site can call: go(href) plays it and then leaves for
   href; play(done) plays it and calls done. Self-contained: it injects its own styles. */
const CSS=`:host{all:initial}#load{position:fixed;inset:0;z-index:200;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;opacity:0;animation:ld-in .3s ease forwards}
#load .ld{position:relative;display:flex;height:40px;width:min(300px,70vw)}
#load .ld i{position:absolute;left:0;right:0;height:1px;background:rgba(20,23,27,.16);transform:scaleX(0);transform-origin:left center;animation:ld-rule 560ms cubic-bezier(.2,.7,.2,1) forwards}
#load .ld i.head{top:0}#load .ld i.foot{bottom:0;animation-delay:120ms}
#load .lc{flex:0 0 auto;height:40px;position:relative;transition:background 160ms ease}
#load .lc::before{content:"";position:absolute;left:0;top:0;bottom:0;width:1px;background:rgba(20,23,27,.16);transform:scaleY(0);transform-origin:top;animation:ld-stem 420ms cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--d)}
#load .lc:last-child::after{content:"";position:absolute;right:0;top:0;bottom:0;width:1px;background:rgba(20,23,27,.16);transform:scaleY(0);transform-origin:top;animation:ld-stem 420ms cubic-bezier(.2,.7,.2,1) forwards;animation-delay:calc(var(--d) + 70ms)}
#load .lc.on{background:#340414}#load .lc.on.g{background:#A99939}
#load span{font:300 12.5px "Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:.08em;color:rgba(20,23,27,.42)}
#load.gone{animation:ld-out .52s ease forwards}
@keyframes ld-in{to{opacity:1}}@keyframes ld-out{from{opacity:1}to{opacity:0}}@keyframes ld-rule{to{transform:scaleX(1)}}@keyframes ld-stem{to{transform:scaleY(1)}}`;
export function play(done,hold=1650){
  const outer=document.createElement('div'); outer.id='load-host'; outer.style.cssText='position:fixed;inset:0;z-index:200'; const sh=outer.attachShadow({mode:'open'});
  sh.innerHTML='<style>'+CSS+'</style><div id="load"><div class="ld"><i class="head"></i><i class="foot"></i></div><span>loading</span></div>'; document.body.appendChild(outer);
  const host=sh.getElementById('load'); host.remove=()=>outer.remove();
  const row=host.querySelector('.ld'); const N=7, cells=[];
  for(let i=0;i<N;i++){ const c=document.createElement('span'); c.className='lc'; c.style.setProperty('--d',(120+i*60)+'ms'); row.appendChild(c); cells.push(c); }
  let deal; do{ deal=cells.map(()=>Math.random()<.5); }while(deal.filter(Boolean).length<2||deal.filter(x=>!x).length<2);
  deal.forEach((g,i)=>{ if(g) cells[i].classList.add('g'); });
  const t0=performance.now(); let inked=-1;
  (function frame(now){ const t=(now-t0)/1000; const W=row.clientWidth; let sum=0; const ws=[];
    for(let i=0;i<N;i++){ const k=.5+.5*Math.sin(t*.9*Math.PI+i*1.258); const w=1+k*k*1.6; ws.push(w); sum+=w; }
    for(let i=0;i<N;i++) cells[i].style.width=(ws[i]/sum*W).toFixed(1)+'px';
    const want=Math.min(N-1,Math.floor((t-.45)/.11)); while(inked<want){ inked++; cells[inked].classList.add('on'); }
    if(t<1.6) requestAnimationFrame(frame); })(t0);
  setTimeout(()=>{ if(done) done(host); },hold);
  return host;
}
export function go(href){ play(()=>{ location.href=href; },1250); }
