/* KEEP TRANSITIONS MOVING WHEN THE DECK IS NOT IN FRONT. Presenting from a shared tab and switching to the notes tab
   hides the deck, but a shared tab is still painted, so its animation frames keep coming. The old fix moved every
   frame onto a timer the moment the tab was hidden, and a hidden tab's timers run once a second, so the audience saw
   a change stutter through in one-second steps. Now every frame asks the browser first, hidden or not, and only a
   frame that has not come within 250ms runs on a timer (a tab nobody can see, a covered window, some embeds), so a
   change always finishes. The deck's own timers (staggered reveals, the card shuffle, the counts) run on a worker
   clock, which a hidden tab does not slow down, so they land on the beat behind the notes too.
   __dropFrames() cancels every pending frame, for the watchdog to end a change for good. */
(function(){
  const nST=window.setTimeout.bind(window), nCT=window.clearTimeout.bind(window), nSI=window.setInterval.bind(window);
  try{
    const w=new Worker(URL.createObjectURL(new Blob(['const t=new Map();onmessage=e=>{const[k,ms,rep]=e.data;'+
      'if(ms<0){clearTimeout(t.get(k));clearInterval(t.get(k));t.delete(k);return;}'+
      't.set(k,(rep?setInterval:setTimeout)(()=>{if(!rep)t.delete(k);postMessage(k);},ms));};'],{type:'text/javascript'})));
    const cbs=new Map(); let m=1e9;
    w.onmessage=e=>{ const c=cbs.get(e.data); if(!c) return; if(!c.rep) cbs.delete(e.data); c.fn(...c.args); };
    const add=rep=>(fn,ms,...args)=>{ if(typeof fn!=='function') return (rep?nSI:nST)(fn,ms,...args);
      const k=++m; cbs.set(k,{fn,args,rep}); w.postMessage([k,Math.max(0,+ms||0),rep]); return k; };
    const clr=k=>{ if(cbs.has(k)){ cbs.delete(k); w.postMessage([k,-1]); } else nCT(k); };
    window.setTimeout=add(false); window.setInterval=add(true); window.clearTimeout=window.clearInterval=clr;
  }catch(e){}
  const nat=window.requestAnimationFrame.bind(window), natC=window.cancelAnimationFrame.bind(window);
  const pend=new Map(); let n=0;
  const fire=(k,t)=>{ const p=pend.get(k); if(!p) return; pend.delete(k); nCT(p.f); if(p.timer) nCT(p.h); else natC(p.h); p.cb(t); };
  const viaTimer=(k,p)=>{ natC(p.h); p.timer=true; p.h=nST(()=>fire(k,performance.now()),16); };
  window.requestAnimationFrame=cb=>{ const k=++n, p={cb,timer:false,h:0,f:0}; pend.set(k,p);
    p.h=nat(t=>fire(k,t));
    p.f=nST(()=>{ if(!pend.has(k)) return; if(document.hidden) fire(k,performance.now()); else viaTimer(k,p); },250);
    return k; };
  window.cancelAnimationFrame=k=>{ const p=pend.get(k); if(!p) return; pend.delete(k); nCT(p.f); p.timer?nCT(p.h):natC(p.h); };
  window.__dropFrames=()=>{ for(const p of pend.values()){ nCT(p.f); p.timer?nCT(p.h):natC(p.h); } pend.clear(); };
})();
/* Navigation from the Manus deck: arrows, space, click to advance, Home/End, f for fullscreen,
   ?s=N to open on a slide, ?print=1 for every slide stacked. Each slide's .b blocks build in. */
const S=[...document.querySelectorAll('.s')]; let i=0;
const slide=document.getElementById('slide');
function fit(){ const k=Math.min(innerWidth/1280, innerHeight/720); slide.style.transform=`scale(${k})`; }
function build(sec){ if(document.body.classList.contains('print')||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let k=0; sec.querySelectorAll('.b').forEach(el=>{ el.style.animation='none'; void el.offsetWidth;
    el.style.animation=`pinIn .45s ease ${Math.min(0.2+k*0.14,2.2).toFixed(2)}s both`; k++; }); }
/* a slide with a [data-step] holds one extra beat: the first advance plays it, the next one moves on */
function stepWB(sec,on){ const row=sec.querySelector('.lf12'); if(!row) return; const its=[...row.querySelectorAll('.lfx')];
  if(!on){ its.forEach(e=>e.style.transform=''); return; }
  const k=.36, gap=18, w=its.map(e=>e.offsetWidth*k), tot=w.reduce((a,b)=>a+b,0)+gap*(its.length-1); let x=(row.offsetWidth-tot)/2;
  const top=-parseFloat(getComputedStyle(row).getPropertyValue('--thumb-up')||70);
  its.forEach((e,j)=>{ e.style.transform=`translate(${x-e.offsetLeft}px,${top-e.offsetTop}px) scale(${k})`; x+=w[j]+gap; }); }
/* THE ROLL. Leaving the cover, the frosted disc from jazlynnwashere.com rolls in from the right: its leading
   edge pushes the cover off to the left, and the Context slide is uncovered behind it. The disc is the site's
   own component (window.mountSheets), mounted on a square canvas clipped to a circle and turned as it travels. */
let rolling=false;
function roll(){ const A=S[i], B=S[i+1]; if(rolling||!B) return false;
  if(!window.mountSheets||matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  rolling=true; const D=900, Wd=1280, R=D/2;
  const cv=document.createElement('canvas'); cv.className='roll';
  cv.style.cssText=`position:absolute;left:0;top:${(720-D)/2}px;width:${D}px;height:${D}px;z-index:40;pointer-events:none;clip-path:circle(50%);will-change:transform`;
  slide.appendChild(cv);
  const HS=window.mountSheets(cv,[{x:.5,y:.5,r:.5}],['#9ba69c'],{paper:'#FFFFFF',ground:'#1C1A17',bleed:0,clear:()=>0});
  if(!HS){ cv.remove(); rolling=false; return false; }
  const disc=HS.discs[0]; const rot0=disc.rot;
  [A,B].forEach(x=>x.style.transition='none');
  B.classList.add('on'); B.style.clipPath='inset(0 0 0 100%)'; B.style.zIndex='30'; A.style.zIndex='20';
  const x0=Wd+R+20, x1=-R-20, T=1500, t0=performance.now();
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  function f(now){ const t=Math.min(1,(now-t0)/T), cx=x0+(x1-x0)*ease(t);
    cv.style.transform=`translateX(${cx-R}px)`; disc.rot=rot0-(cx-x0)/R; HS.draw();
    A.style.transform=`translateX(${Math.min(0,cx-R-Wd)}px)`;
    B.style.clipPath=`inset(0 0 0 ${Math.max(0,Math.min(Wd,cx))}px)`;
    if(t<1) return requestAnimationFrame(f);
    cv.remove(); A.style.zIndex=B.style.zIndex=''; B.style.clipPath='';
    A.classList.remove('stepped'); A.classList.remove('on'); A.style.transform='';
    i=i+1; B.classList.add('on'); build(B); media();
    document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
/* LEAVING A CHAPTER DIVIDER. The divider drops down off the slide and the first slide of the chapter is
   already sitting underneath it. */
function drop(){ const A=S[i], B=S[i+1]; if(rolling||!B||matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  rolling=true; [A,B].forEach(x=>x.style.transition='none');
  B.classList.add('on'); B.style.opacity='0'; B.style.zIndex='20'; A.style.zIndex='30';
  const T=900, D=700, LAG=480, t0=performance.now(), ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, out=t=>1-Math.pow(1-t,3);
  let built=false;
  function f(now){ const ta=Math.min(1,(now-t0)/T), tb=Math.max(0,Math.min(1,(now-t0-LAG)/D));
    A.style.transform=`translateY(${ease(ta)*(720+BLEED+40)}px)`;            /* far enough that the whole top disc shows on the way down */
    if(tb>0&&!built){ built=true; build(B); B.querySelectorAll('video').forEach(v=>{ if(!v.closest('[data-hoverplay]')) v.play().catch(()=>{}); }); }
    B.style.transform=`translateY(${(1-out(tb))*-90}px)`; B.style.opacity=String(out(tb));
    if(ta<1||tb<1) return requestAnimationFrame(f);
    A.classList.remove('on'); A.style.transform=''; A.style.zIndex=B.style.zIndex=''; B.style.transform=''; B.style.opacity='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
/* WHAT EDEN ASKED -> WHAT I DISCOVERED. The green rule under the first slide's points runs off its right edge;
   the deck pans right along it, and the second slide arrives with the rule already running in from its left edge. */
function pan(dir){ const A=S[i], B=S[i+1]; if(rolling||!B||matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  rolling=true; [A,B].forEach(x=>x.style.transition='none'); B.classList.add('on'); build(B);
  const T=950, t0=performance.now(), ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, ax=dir==='down'?'Y':'X', L=dir==='down'?720:1280;
  function f(now){ const t=Math.min(1,(now-t0)/T), x=ease(t)*L;
    A.style.transform=`translate${ax}(${-x}px)`; B.style.transform=`translate${ax}(${L-x}px)`;
    if(t<1) return requestAnimationFrame(f);
    A.classList.remove('on'); A.style.transform=''; B.style.transform='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
function adv(){ if(rolling) return; if(S[i].querySelector('.vl3.down')&&S[i+1]?.querySelector('.vl3.in')&&pan('down')) return; if(S[i].querySelector('.gl3.out')&&S[i+1]?.querySelector('.gl3.in')&&pan('right')) return; if(S[i].querySelector('.sh60,.im55')&&S[i+1]&&!S[i+1].querySelector('.sh60,.im55')&&drop()) return; if(editing) endEdit(); const s=S[i]; const nx=S[i+1], beat=s.querySelector('[data-step]')&&!s.classList.contains('stepped');
  if(!beat&&nx&&nx.querySelector('.sh60,.im55')&&roll()) return;   /* every chapter divider arrives on the disc roll */ if(s.querySelector('[data-step]')&&!s.classList.contains('stepped')){ s.classList.add('stepped'); stepWB(s,true); return; } go(i+1); }
/* when the deck was reached from the intro (?intro=1), going back off the cover returns to the intro's last slide */
const FROM_INTRO=new URLSearchParams(location.search).get('intro')==='1';
/* THE SIGNATURE. Press the jazlynn mark in the corner and the site's loading screen plays, then the intro slides open;
   the intro hands back to this deck's cover when it ends. Standalone, without the site's loader, it just goes. */
/* (eden-readings-deck) the signature stays as the mark in the corner; there is no intro deck to open from it here */
const INTRO_N=12; const pct=i=>(FROM_INTRO?(INTRO_N+i+1)/(INTRO_N+S.length):(i+1)/S.length)*100+'%';   /* the progress line counts the intro's slides too when it came first */
function back(){ if(editing) endEdit(); const s=S[i]; if(s.classList.contains('stepped')){ s.classList.remove('stepped'); stepWB(s,false); return; } if(i===0&&FROM_INTRO){ location.href='intro?s=12'; return; } go(i-1); }
/* Videos load in step with the talk, not all at once: the slide on screen plays, the slides either side
   download in the background, and the rest wait. Opening the deck used to start ~40 videos together, which
   starved the images and the next slides of connections. A stalled video is retried once. */
document.querySelectorAll('section.s video').forEach(v=>{ v.removeAttribute('autoplay'); v.autoplay=false; v.preload='none'; v.muted=true;
  v.addEventListener('error',()=>{ if(v.dataset.retried) return; v.dataset.retried='1'; setTimeout(()=>{ v.load(); if(v.closest('.s.on')&&!v.closest('[data-hoverplay]')) v.play().catch(()=>{}); },400); }, true); });
function media(){ scatterNear(); S.forEach((s,j)=>{ const near=Math.abs(j-i)<=1;
  s.querySelectorAll('video').forEach(v=>{
    if(near&&v.preload!=='auto'){ v.preload='auto'; if(v.readyState===0) v.load(); }
    if(j===i&&!v.closest('[data-hoverplay]')){ if(v.currentTime>0&&v.paused) v.currentTime=0; v.play().catch(()=>{}); }
    else if(!v.paused) v.pause(); }); }); }
/* Warm-up: once the opening slides are in, every other video is fetched into the cache one at a time, so by
   the time a slide comes up its video is already on the machine. One request at a time leaves the rest free. */
function warm(){ const urls=[...new Set([...document.querySelectorAll('section.s video')].map(v=>{
    const ok=[...v.querySelectorAll('source')].find(x=>!x.type||v.canPlayType(x.type)); return ok?ok.src:v.src; }).filter(u=>u&&!u.startsWith('data:')))];   /* the single-file copy already holds every video */
  (async()=>{ for(const u of urls){ try{ await (await fetch(u,{cache:'force-cache'})).arrayBuffer(); }catch(e){} } document.documentElement.dataset.warm='done'; })(); }
addEventListener('load',()=>setTimeout(warm,800));
/* THE DISCS ON THE CHAPTER SLIDES. The jazlynnwashere.com hero's frosted discs, its own component and its eight
   swatches, scattered down the right of each chapter slide so they never cross the chapter number or name. Each
   canvas is mounted the first time its slide comes up, sits under the slide's text, and lets clicks through. */
const BLEED=260;
const SCATTER=[[790,300,120],[1010,230,110],[1230,360,150],[880,480,115],[1100,520,100],[700,500,80]];
const SWATCH=['#dfddc8','#c7c7c7','#827a85','#9ba69c','#c4c1c8','#dfddc8','#c2beb3','#dfdac8'];
let LAYOUT={}; try{ LAYOUT=window.DISCS||{}; }catch(e){}
fetch('discs.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{ if(j) LAYOUT=j; }).catch(()=>{});
const keyOf=sec=>sec.querySelector('.sh60 h1')?.textContent.trim()||'';
function scatter(sec,force){ if((sec.__discs&&!force)||!window.mountSheets||!sec.querySelector('.sh60')) return;
  sec.querySelector('canvas.scat')?.remove();
  const cv=document.createElement('canvas'); cv.className='scat';
  cv.style.cssText=`position:absolute;left:0;top:${-BLEED}px;width:1280px;height:${720+BLEED}px;z-index:-1;pointer-events:none`;   /* the canvas reaches above the slide, so a disc cut by the top edge is whole when the slide drops */
  sec.insertBefore(cv,sec.firstChild);
  const k=sec.querySelector('.sh60 .no')?.textContent.trim()||'0', off=(parseInt(k)||0)%SWATCH.length;
  const sw=SWATCH.slice(off).concat(SWATCH.slice(0,off));   /* each chapter leads with a different swatch */
  const L=sec.__layout||LAYOUT[keyOf(sec)]||SCATTER.map(([x,y,r],n)=>[x,y,r,n]);
  sec.__layout=L;
  const R0=cv.getBoundingClientRect(), b=R0.height*BLEED/(720+BLEED); sec.__geom={w:R0.width,h:R0.height,b};
  const HS=window.mountSheets(cv,L.map(([x,y,r])=>({x:x/1280,y:y/720,r:r/1280})),sw,{paper:'#FFFFFF',ground:'#1C1A17',bleed:b,clear:()=>0});
  if(HS) HS.discs.forEach((d,n)=>{ d.ink=(L[n][3]??n)%sw.length; d.ur=L[n][2]/1280; });
  sec.__discs=HS||1; if(HS) HS.draw(); }

/* EDIT THE DISCS. On a chapter slide press E: drag a disc to move it, scroll over it to resize, click + to add
   one, double-click a disc to remove it, and Save writes the layout to discs.json for every chapter. E again ends. */
let editing=null;
function readLayout(sec){ const H=sec.__discs; if(!H||H===1) return sec.__layout;
  const {w,h,b}=sec.__geom, hero=h-b;
  return H.discs.map(d=>[Math.round((d.x*650+w/2)/w*1280), Math.round((h/2-d.y*650-b)/hero*720), Math.round(d.ur*1280), d.ink]); }
function editBar(sec){ const b=document.createElement('div'); b.className='discbar';
  b.innerHTML='<b>Editing discs</b><button data-a="add">+ Disc</button><button data-a="shuffle">Shuffle colours</button><button data-a="save">Save</button><button data-a="done">Done</button><span class="msg">Drag to move · scroll to resize · double-click to remove</span>';
  b.addEventListener('click',e=>{ e.stopPropagation(); const a=e.target.dataset.a; if(!a) return;
    if(a==='add'){ sec.__layout=readLayout(sec).concat([[1000,360,90,Math.floor(Math.random()*8)]]); scatter(sec,true); arm(sec); }
    if(a==='shuffle'){ sec.__layout=readLayout(sec).map(d=>[d[0],d[1],d[2],Math.floor(Math.random()*8)]); scatter(sec,true); arm(sec); }
    if(a==='save'){ S.forEach(x=>{ if(x.__discs&&x.__discs!==1) LAYOUT[keyOf(x)]=readLayout(x); });
      fetch('save-discs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(LAYOUT)})
        .then(r=>{ b.querySelector('.msg').textContent=r.ok?'Saved to discs.json':'Could not save: is the deck running on serve.py?'; })
        .catch(()=>{ b.querySelector('.msg').textContent='Could not save: is the deck running on serve.py?'; }); }
    if(a==='done') endEdit(); });
  slide.appendChild(b); return b; }
function arm(sec){ const cv=sec.querySelector('canvas.scat'); if(!cv) return; cv.style.pointerEvents='auto'; cv.style.cursor='grab';
  const H=sec.__discs; if(!H||H===1) return;
  const at=e=>{ const r=cv.getBoundingClientRect(), g=sec.__geom, q=r.width/g.w; return [((e.clientX-r.left)/q-g.w/2)/650, (g.h/2-(e.clientY-r.top)/q)/650]; };
  const pick=e=>{ const [x,y]=at(e); for(let n=H.discs.length-1;n>=0;n--){ const d=H.discs[n]; if((x-d.x)**2+(y-d.y)**2<=d.r*d.r) return d; } return null; };
  cv.onwheel=e=>{ const d=pick(e); if(!d) return; e.preventDefault(); const f=Math.exp(-e.deltaY*0.0015); d.r*=f; d.ur*=f; H.draw(); };
  cv.ondblclick=e=>{ const d=pick(e); if(!d) return; const L=readLayout(sec); L.splice(H.discs.indexOf(d),1); sec.__layout=L; scatter(sec,true); arm(sec); }; }
function startEdit(){ const sec=S[i]; if(!sec.querySelector('.sh60')) return; scatter(sec,true); editing={sec,bar:editBar(sec)}; sec.classList.add('editing'); arm(sec); }
function endEdit(){ if(!editing) return; const {sec,bar}=editing; sec.__layout=readLayout(sec); bar.remove(); sec.classList.remove('editing');
  const cv=sec.querySelector('canvas.scat'); if(cv){ cv.style.pointerEvents='none'; cv.style.cursor=''; } editing=null; }
addEventListener('keydown',e=>{ if(e.key==='e'||e.key==='E'){ editing?endEdit():startEdit(); } });

/* mounted lazily: the slide on screen and the next one, so the deck never compiles every disc shader at once */
function scatterNear(){ if(!window.mountSheets) return; [i,i+1].forEach(j=>S[j]&&scatter(S[j])); }
addEventListener('load',()=>{ const t=setInterval(()=>{ if(window.mountSheets){ clearInterval(t); scatterNear(); } },50); });
function go(n){ const from=S[i]; from.classList.remove('stepped'); stepWB(from,false); from.classList.remove('on'); from.classList.add('off'); setTimeout(()=>from.classList.remove('off'),600);
  i=(n+S.length)%S.length; S[i].classList.remove('off'); S[i].classList.add('on'); build(S[i]);
  media();
  document.querySelector('#bar i').style.width=pct(i);
  document.title=`CPT at Eden, ${i+1}/${S.length}`; }
addEventListener('resize',fit);
addEventListener('keydown',e=>{
  if(zoomKey(e))return;
  if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown'){e.preventDefault();adv();}
  if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();back();}
  if(e.key==='Home')go(0); if(e.key==='End')go(S.length-1);
  if(e.key==='f')document.documentElement.requestFullscreen?.().catch(()=>{});});
addEventListener('click',e=>{ if(editing) return; if(e.target.closest('.stack')||e.target.closest('a')||e.target.closest('.arrow')||e.target.closest('.zoom')||e.target.closest('#zoomer'))return; adv(); });
document.addEventListener('click',e=>{const a=e.target.closest('[data-go]'); if(a){e.preventDefault(); e.stopPropagation(); go(parseInt(a.dataset.go)-1);}},true);
document.getElementById('prev').addEventListener('click',e=>{e.stopPropagation();back();});
document.getElementById('next').addEventListener('click',e=>{e.stopPropagation();adv();});
/* the floor rule: content ends 24px above the foot rule, or that slide's content scales down to fit */
function floor(sec){ const wrap=sec.querySelector('.wrap'), ft=sec.querySelector('.foot'); if(!wrap||!ft) return;
  const head=wrap.querySelector('.head');
  const kids=[...wrap.children].filter(e=>e!==head&&!e.classList.contains('fn')&&!e.classList.contains('gl3')); if(!kids.length) return;
  kids.forEach(k=>k.style.zoom='');
  const sc=(slide.getBoundingClientRect().width/1280)||1; const lim=ft.getBoundingClientRect().top-24*sc;
  const fn=wrap.querySelector('.fn'); const lim2=fn?Math.min(lim,fn.getBoundingClientRect().top-8*sc):lim;
  let top=1e9,bot=-1e9; kids.forEach(k=>{const b=k.getBoundingClientRect(); if(b.height<1) return; top=Math.min(top,b.top); bot=Math.max(bot,b.bottom);});
  if(bot>lim2&&bot>top){ const z=Math.max(.6,(lim2-top)/(bot-top)); kids.forEach(k=>k.style.zoom=z.toFixed(3)); } }
function floors(){ S.forEach(s=>{ const was=s.classList.contains('on'); if(!was){s.style.visibility='hidden';s.classList.add('on');} floor(s); if(!was){s.classList.remove('on');s.style.visibility='';} }); }
if(new URLSearchParams(location.search).get('print')==='1'){document.body.classList.add('print');}
else{ fit(); S.forEach(x=>x.style.transition='none'); go(Math.max(0,(parseInt(new URLSearchParams(location.search).get('s'))||1)-1)); requestAnimationFrame(()=>S.forEach(x=>x.style.transition='')); }
(document.fonts?document.fonts.ready:Promise.resolve()).then(floors); addEventListener('resize',()=>setTimeout(floors,50));

/* click to zoom: a .zoom element fills the slide; arrows step through the slide's other .zoom screens; Esc or a click closes */
const zoomer=document.createElement('div'); zoomer.id='zoomer'; zoomer.innerHTML='<figure><div class="dkz"><img alt=""><video muted loop playsinline></video></div><figcaption></figcaption><span class="zn"></span></figure>'; slide.appendChild(zoomer);
const zImg=zoomer.querySelector('img'), zVid=zoomer.querySelector('video');
/* every image and video on the slides can be enlarged */
document.querySelectorAll('section.s .wrap video, section.s .wrap img').forEach(v=>{ if(v.closest('.zoom')||v.closest('.c-brand')) return;   /* the logo is not a visual to enlarge */ const c=v.closest('.ex,.frame,.c-shot,.o28,.cph,.dv9,.dk')||v.parentElement;
  c.classList.add('zoom'); c.tabIndex=0; c.setAttribute('role','button'); c.setAttribute('aria-label','Enlarge: '+(v.getAttribute('aria-label')||v.alt||'image')); });
let zList=[], zAt=-1;
function zCaption(el, media){ const f=el.closest('figure')?.querySelector('figcaption'); if(f) return f.textContent;
  const box=el.closest('.p16c,.o4a>div,.ext2>div,.g'); const l=box&&box.querySelector('.vlab,.who,h3,b'); if(l) return l.textContent;
  return media.getAttribute('aria-label')||media.alt||''; }
function zoomShow(k){ zAt=(k+zList.length)%zList.length; const el=zList[zAt], v=el.querySelector('video'), im=el.querySelector('img');
  if(v){ zImg.style.display='none'; zVid.style.display='block'; zVid.innerHTML=v.innerHTML; zVid.poster=v.poster; zVid.load(); zVid.play().catch(()=>{}); }
  else { zVid.pause(); zVid.style.display='none'; zImg.style.display='block'; zImg.src=im.src; zImg.alt=im.alt; }
  zoomer.classList.toggle('isphone', !!el.closest('.cph'));   /* the phone recording opens as the phone, not as the raw recording */
  zoomer.querySelector('figcaption').textContent=zCaption(el, v||im);
  zoomer.querySelector('.zn').textContent=(zAt+1)+' of '+zList.length+'  ·  arrows to step, Esc to close'; zoomer.classList.add('on'); }
function zoomClose(){ zoomer.classList.remove('on'); zVid.pause(); zAt=-1; }
function zoomKey(e){ if(zAt<0) return false;
  if(e.key==='Escape'){zoomClose();} else if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();zoomShow(zAt+1);} else if(e.key==='ArrowLeft'){e.preventDefault();zoomShow(zAt-1);} else return false;
  return true; }
document.addEventListener('click',e=>{ const z=e.target.closest('.zoom'); if(z){ e.stopPropagation(); zList=[...z.closest('.s').querySelectorAll('.zoom')]; zoomShow(zList.indexOf(z)); return; }
  if(e.target.closest('#zoomer')){ e.stopPropagation(); zoomClose(); } },true);
document.addEventListener('keydown',e=>{ const z=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('.zoom'); if(z&&zAt<0&&(e.key==='Enter')){ zList=[...z.closest('.s').querySelectorAll('.zoom')]; zoomShow(zList.indexOf(z)); } });

/* from the Manus deck: the arrows lift as the pointer nears them, and their rim light turns to face it */
(function(){ const L=document.getElementById('prev'), R=document.getElementById('next');
  function ang(el,e){ const b=el.getBoundingClientRect(); const a=Math.atan2(e.clientY-(b.top+b.height/2), e.clientX-(b.left+b.width/2))*180/Math.PI; el.style.setProperty('--ang',(a+90)+'deg'); }
  /* an arrow lifts only when the pointer is actually near it: within 160px of its centre. Anywhere
     else both stay thin. The lift is held for a beat so it does not flicker at the edge. */
  let tL=0,tR=0;
  function near(el,e){ const b=el.getBoundingClientRect(); return Math.hypot(e.clientX-(b.left+b.width/2), e.clientY-(b.top+b.height/2))<130; }
  addEventListener('pointermove',e=>{
    const nl=near(L,e), nr=near(R,e);
    if(nl){ clearTimeout(tL); L.classList.add('near'); } else { clearTimeout(tL); tL=setTimeout(()=>L.classList.remove('near'),140); }
    if(nr){ clearTimeout(tR); R.classList.add('near'); } else { clearTimeout(tR); tR=setTimeout(()=>R.classList.remove('near'),140); }
    ang(L,e); ang(R,e); },{passive:true});
  /* leaving the window, the tab, or the arrow itself always drops the lift */
  const drop=()=>{ clearTimeout(tL); clearTimeout(tR); L.classList.remove('near'); R.classList.remove('near'); };
  document.documentElement.addEventListener('pointerleave',drop); addEventListener('blur',drop);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) drop(); });
  [L,R].forEach(el=>el.addEventListener('pointerleave',()=>{ setTimeout(()=>{ if(!el.matches(':hover')) el.classList.remove('near'); },150); }));
  addEventListener('keydown',drop);
})();

/* from the Manus deck: the quote cards; click or drag the top one and it goes under */
(function(){
  const st=document.getElementById('stack'); if(!st) return;
  const cards=[...st.querySelectorAll('.card')], dots=[...document.querySelectorAll('#dots i')];
  let order=cards.map((_,k)=>k), busy=false, dx=0, x0=null;
  function place(){ order.forEach((ci,pos)=>{ cards[ci].className='card p'+pos; }); dots.forEach((d,k)=>d.classList.toggle('on',k===order[0])); document.querySelectorAll('#finds .f').forEach((f,k)=>f.classList.toggle('on',k===order[0])); }
  function next(){ if(busy) return; busy=true; const top=cards[order[0]]; top.className='card out';
    setTimeout(()=>{ order.push(order.shift()); place(); busy=false; },380); }
  st.addEventListener('pointerdown',e=>{ x0=e.clientX; dx=0; st.setPointerCapture(e.pointerId); });
  st.addEventListener('pointermove',e=>{ if(x0===null) return; dx=e.clientX-x0; const top=cards[order[0]]; top.style.transition='none'; top.style.transform=`translateX(${dx*0.35}px) translateY(${Math.abs(dx)*0.25}px) rotate(${dx/60}deg)`; });
  const up=()=>{ if(x0===null) return; const top=cards[order[0]]; top.style.transition=''; top.style.transform=''; if(Math.abs(dx)>60||Math.abs(dx)<4) next(); x0=null; dx=0; };
  st.addEventListener('pointerup',up); st.addEventListener('pointercancel',up);
  place();
  /* AUTOPLAY. While the slide is up, the top quote goes under by itself every 2.8s and the pain point beside it lights in step,
     round after round for as long as the slide stays up. A touch on the stack pauses it, and it carries on 2.8s after. */
  const sec=st.closest('section'); let timer=null;
  function tickAuto(){ timer=null; if(!sec.classList.contains('on')) return; if(typeof rolling!=='undefined'&&rolling){ timer=setTimeout(tickAuto,400); return; } next(); timer=setTimeout(tickAuto,2800); }
  const startAuto=(ms)=>{ clearTimeout(timer); timer=setTimeout(tickAuto,ms); };
  new MutationObserver(()=>{ if(sec.classList.contains('on')){ if(!timer) startAuto(3200); } else { clearTimeout(timer); timer=null; } }).observe(sec,{attributes:true,attributeFilter:['class']});
  if(sec.classList.contains('on')) startAuto(3200);
  st.addEventListener('pointerdown',()=>{ clearTimeout(timer); timer=null; });
  st.addEventListener('pointerup',()=>startAuto(2800)); st.addEventListener('pointercancel',()=>startAuto(2800));
})();

/* [data-hoverplay]: its videos stay still until the pointer is on one, and only that one plays */
document.querySelectorAll('[data-hoverplay] video').forEach(v=>{ v.autoplay=false; v.removeAttribute('autoplay'); v.pause();
  const box=v.closest('.ex')||v.parentElement;
  box.addEventListener('mouseenter',()=>{ box.classList.add('live'); v.play().catch(()=>{}); });
  box.addEventListener('mouseleave',()=>{ box.classList.remove('live'); v.pause(); }); });
/* SLIDE 9 -> 10. The map fades to its five competitor beads; they gather on the left, then burst out to the
   four category tiles, each tile opening from its bead. The next click flips the tiles to Clover. */
(function(){
const st=document.createElement('style');st.textContent=`
.bead9{position:absolute;width:19px;height:19px;margin:-9.5px 0 0 -9.5px;border-radius:50%;z-index:50;pointer-events:none;
 background:radial-gradient(60% 45% at 50% 22%,rgba(255,255,255,.85),rgba(255,255,255,0) 70%),radial-gradient(circle at 50% 65%,#3a3d42,#0E1013 70%);
 box-shadow:0 4px 8px -3px rgba(0,0,0,.45);will-change:transform,opacity}
section.s.arrived .ft10{animation:none!important}`;document.head.appendChild(st);
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, out=t=>1-Math.pow(1-t,3), cl=t=>Math.max(0,Math.min(1,t));
function dots(){ const A=S[i],B=S[i+1]; if(rolling||!B||!B.querySelector('.fl10')||!A.querySelector('.o5map')) return false;
  rolling=true; const SR=slide.getBoundingClientRect(),k=SR.width/1280;
  const pos=e=>{const r=e.getBoundingClientRect();return [(r.left+r.width/2-SR.left)/k,(r.top+r.height/2-SR.top)/k]};
  const gs=[...A.querySelectorAll('.o5map g[filter]')], from=gs.map(g=>pos(g.querySelector('circle')));
  const svgParts=[...A.querySelectorAll('.o5map > *')].filter(e=>!gs.includes(e));
  const beads=from.map(([x,y])=>{const d=document.createElement('i');d.className='bead9';d.style.left=x+'px';d.style.top=y+'px';slide.appendChild(d);return d});
  gs.forEach(g=>g.style.opacity='0');
  const fade=[A.querySelector('.head'),A.querySelector('.fn'),...svgParts].filter(Boolean);
  const cluster=[[236,352],[262,340],[250,374],[276,366],[226,378]];
  /* slide 10, laid out but held: tiles closed to a point at their icon */
  [A,B].forEach(x=>x.style.transition='none'); B.classList.add('on','arrived');
  const tiles=[...B.querySelectorAll('.ft10')], icons=tiles.map(t=>pos(t.querySelector('.fca .gl10')));
  const tr=tiles.map(t=>{const r=t.getBoundingClientRect();return [(r.left-SR.left)/k,(r.top-SR.top)/k]});
  const bhead=B.querySelector('.head'), bfn=B.querySelector('.fn');
  tiles.forEach(t=>{t.style.clipPath='circle(0px at 50% 50%)';});
  [bhead,bfn].forEach(e=>e&&(e.style.opacity='0'));
  B.style.opacity='1'; B.style.zIndex='10'; A.style.zIndex='20';
  const T0=performance.now();
  function f(now){ const t=now-T0;
    const a=cl(t/520); fade.forEach(e=>e.style.opacity=String(1-a));
    if(t>=520&&A.style.opacity!=='0'){ A.style.opacity='0'; }
    /* gather */
    const g=ease(cl((t-300)/650));
    /* burst into the tiles */
    const b=ease(cl((t-1100)/650));
    beads.forEach((d,n)=>{ const [x0,y0]=from[n],[cx,cy]=cluster[n],m=Math.min(n,3),[tx,ty]=icons[m];
      const x1=x0+(cx-x0)*g, y1=y0+(cy-y0)*g, x=x1+(tx-x1)*b, y=y1+(ty-y1)*b, sc=1+b*2.4;
      d.style.transform=`translate(${x-x0}px,${y-y0}px) scale(${sc})`; d.style.opacity=String(1-cl((t-1650)/250)); });
    tiles.forEach((tl,n)=>{ const bt=ease(cl((t-1300-n*90)/650)), [ix,iy]=icons[n],[lx,ly]=tr[n];
      tl.style.clipPath=`circle(${bt*560}px at ${ix-lx}px ${iy-ly}px)`; });
    const h=out(cl((t-1100)/600)); [bhead,bfn].forEach(e=>e&&(e.style.opacity=String(h)));
    if(t<2350) return requestAnimationFrame(f);
    beads.forEach(d=>d.remove()); tiles.forEach(tl=>tl.style.clipPath='');
    [bhead,bfn].forEach(e=>e&&(e.style.opacity='')); fade.forEach(e=>e.style.opacity=''); gs.forEach(g=>g.style.opacity='');
    A.classList.remove('on'); A.style.opacity=''; A.style.zIndex=''; B.style.zIndex=''; B.style.opacity='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
const adv0=adv; adv=function(){ if(rolling) return; if(!S[i].classList.contains('stepped')&&S[i].querySelector('.o5map')&&dots()) return; adv0(); };
const go0=go; go=function(n){ S.forEach(s=>s.classList.remove('arrived')); go0(n); };
})();


/* SLIDE 10 -> MAYA. The profile card rises from the bottom over slide 10 into the middle; slide 10 then fades
   out and Maya's title fades in; the card settles to the left and her day fades in beside it. */
(function(){
const st=document.createElement('style');st.textContent='section.s.viaRise .mc9,section.s.viaRise .v9 .j9{animation:none!important}';document.head.appendChild(st);
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, out=t=>1-Math.pow(1-t,3), cl=t=>Math.max(0,Math.min(1,t));
function rise(){ const A=S[i],B=S[i+1]; if(rolling||!B||!B.querySelector('.mc9')||matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  rolling=true; [A,B].forEach(x=>x.style.transition='none');
  B.classList.add('on','viaRise'); B.style.zIndex='30'; A.style.zIndex='20';
  const card=B.querySelector('.mc9'), j=B.querySelector('.v9 .j9'), head=B.querySelector('.head'), rest=[head,B.querySelector('.foot'),B.querySelector('.sigtr'),B.querySelector(':scope>.wrap>.fn')].filter(Boolean);
  const CX=443, HALF=337, T0=performance.now();
  rest.forEach(e=>e.style.opacity='0'); j.style.opacity='0'; card.style.transform=`translate(${CX}px,600px)`;
  function f(now){ const t=now-T0;
    /* 1 peek: the card rises over slide 10 until half of it shows above the bottom edge */
    const p=out(cl(t/650)), y0=600+(HALF-600)*p;
    /* 2 rustle: a few small shakes, dying away */
    const rt=cl((t-700)/700), rot=Math.sin(rt*Math.PI*5)*3.2*(1-rt), jx=Math.sin(rt*Math.PI*7)*5*(1-rt);
    /* 3 drag: up and out to the left, into its place on the next slide */
    const m=ease(cl((t-1450)/850));
    card.style.transform=`translate(${CX*(1-m)+jx}px,${y0*(1-m)}px) rotate(${rot*(1-m)}deg)`;
    A.style.opacity=String((1-.5*out(cl(t/650)))*(1-cl((t-1450)/450))); const fa=cl((t-1850)/450);   /* slide 10 dims as the card rises over it */ rest.forEach(e=>e.style.opacity=String(fa));
    const fj=out(cl((t-2350)/600)); j.style.opacity=String(fj); j.style.transform=`translateX(${30*(1-fj)}px)`;
    if(t<3000) return requestAnimationFrame(f);
    card.style.transform=''; j.style.opacity=''; j.style.transform=''; rest.forEach(e=>e.style.opacity='');
    A.classList.remove('on','stepped'); A.style.opacity=''; A.style.zIndex=''; B.style.zIndex='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
const adv1=adv; adv=function(){ if(rolling) return; const s=S[i];
  if(S[i+1]?.querySelector('.mc9')&&(s.classList.contains('stepped')||!s.querySelector('[data-step]'))&&rise()) return; adv1(); };
const go1=go; go=function(n){ S.forEach(s=>s.classList.remove('viaRise')); go1(n); };
})();
/* SLIDE 11 -> 12. Everything on Maya's slide fades but her three key questions; they rise and stack in the middle,
   hold for two seconds to be read, squeeze into one point, and the problem statement fades in where they met while
   the marker sweeps its highlights. */
(function(){
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, out=t=>1-Math.pow(1-t,3), cl=t=>Math.max(0,Math.min(1,t));
const st=document.createElement('style');st.textContent=`
.qfly{position:absolute;z-index:60;pointer-events:none;display:inline-flex;align-items:center;white-space:nowrap;font:600 12.5px/1 "Plus Jakarta Sans",sans-serif;padding:9px 13px;border-radius:999px;background:#340414;color:#fff;transform-origin:center;will-change:transform,opacity}
section.s.viaQ .psq mark{background-size:0% 100%!important;background-repeat:no-repeat!important;transition:background-size .7s cubic-bezier(.3,.7,.2,1)}
section.s.viaQ.qsweep .psq mark{background-size:100% 100%!important}
section.s.viaQ .psq mark:nth-of-type(2){transition-delay:.35s}section.s.viaQ .psq mark:nth-of-type(3){transition-delay:.7s}section.s.viaQ .psq mark:nth-of-type(4){transition-delay:1.05s}`;
document.head.appendChild(st);
function qs(){ const A=S[i],B=S[i+1]; if(rolling||!B||!B.querySelector('.psq')||!A.querySelector('.jq9 .q')) return false;
  rolling=true; const SR=slide.getBoundingClientRect(),k=SR.width/1280;
  const R=e=>{const r=e.getBoundingClientRect();return {x:(r.left-SR.left)/k,y:(r.top-SR.top)/k,w:r.width/k,h:r.height/k}};
  const src=[...A.querySelectorAll('.jq9 .q')].map(q=>({el:q,r:R(q)}));
  const fl=src.map(({el,r})=>{const d=document.createElement('span');d.className='qfly';d.textContent=el.textContent;d.style.left=r.x+'px';d.style.top=r.y+'px';slide.appendChild(d);return d});
  src.forEach(({el})=>el.style.visibility='hidden');
  [A,B].forEach(x=>x.style.transition='none');
  B.classList.add('on','viaQ'); B.style.opacity='0'; B.style.zIndex='10'; A.style.zIndex='20';
  const quote=B.querySelector('.psq'), qr=R(quote), cx=qr.x+qr.w/2, cy=qr.y+qr.h/2;
  const T0=performance.now(); let marked=false;
  function f(now){ const t=now-T0;
    A.style.opacity=String(1-cl(t/450));                                   /* 1 everything but the questions fades */
    const s=ease(cl((t-350)/650));                                          /* 2 they rise to the middle and stack */
    const m=ease(cl((t-3050)/420));        /* held for 2s so the questions can be read */                                         /* 3 they squeeze into one point */
    fl.forEach((d,n)=>{ const r=src[n].r, sx=cx-r.w/2, sy=cy-r.h/2+(n-1)*46;
      const x=r.x+(sx-r.x)*s, y=r.y+(sy-r.y)*s, yy=y+(cy-r.h/2-y)*m;
      d.style.transform=`translate(${x-r.x}px,${yy-r.y}px) scale(${1+.25*s-.95*m})`; d.style.opacity=String(1-cl((t-3250)/250)); });
    B.style.opacity=String(out(cl((t-3350)/450)));                          /* 4 the statement fades in where they met */
    if(t>3700&&!marked){ marked=true; B.classList.add('qsweep'); }              /* 5 the marker sweeps the highlights */
    if(t<3850) return requestAnimationFrame(f);
    fl.forEach(d=>d.remove()); src.forEach(({el})=>el.style.visibility='');
    A.classList.remove('on'); A.style.opacity=''; A.style.zIndex=''; B.style.zIndex=''; B.style.opacity='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
const advQ=adv; adv=function(){ if(rolling) return; if(S[i+1]?.querySelector('.psq')&&S[i].querySelector('.jq9 .q')&&qs()) return; advQ(); };
const goQ=go; go=function(n){ S.forEach(s=>s.classList.remove('viaQ','qsweep')); goQ(n); };
})();
/* SLIDE 12 -> 13. The statement fades to its gold opening quote mark; the mark flies down and shrinks to where the
   first tester's quote begins, the quote card opens out from it, the stack fans in beneath, and the rest arrives. */
(function(){
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, out=t=>1-Math.pow(1-t,3), cl=t=>Math.max(0,Math.min(1,t));
function qmark(){ const A=S[i],B=S[i+1]; if(rolling||!B||!B.querySelector('.s47')||!A.querySelector('.psq .qm')) return false;
  rolling=true; const SR=slide.getBoundingClientRect(),k=SR.width/1280;
  const R=e=>{const r=e.getBoundingClientRect();return {x:(r.left-SR.left)/k,y:(r.top-SR.top)/k,w:r.width/k,h:r.height/k}};
  const qm=A.querySelector('.psq .qm'), q0=R(qm), cs=getComputedStyle(qm);
  const fly=document.createElement('span'); fly.textContent=qm.textContent;
  fly.style.cssText=`position:absolute;left:${q0.x}px;top:${q0.y}px;z-index:60;pointer-events:none;font:${cs.font};color:${cs.color};line-height:${cs.lineHeight};transform-origin:0 0;will-change:transform,opacity`;
  slide.appendChild(fly); qm.style.visibility='hidden';
  [A,B].forEach(x=>x.style.transition='none'); B.classList.add('on'); B.style.zIndex='10'; A.style.zIndex='20';
  const cards=[...B.querySelectorAll('.stack .card')], top=B.querySelector('.stack .card.p0'), backs=cards.filter(c=>c!==top);
  const tp=top.querySelector('.qcard p'), t0=R(tp), tc=R(top);
  const fsT=parseFloat(getComputedStyle(tp).fontSize), fsQ=parseFloat(cs.fontSize), sc=fsT/fsQ*1.05;
  const head=B.querySelector('.head'), n13=B.querySelector('.n13'), lead=B.querySelector('.finds .lead3'), fs=[...B.querySelectorAll('.finds .f')];
  const later=[head,n13,lead,...fs,B.querySelector('.foot'),B.querySelector('.sigtr')].filter(Boolean);
  cards.forEach(c=>c.style.transition='none');                      /* the cards' own fades would flash them; off for the move */
  later.forEach(e=>e.style.opacity='0'); backs.forEach(c=>c.style.setProperty('opacity','0','important')); top.style.clipPath='circle(0px at 0 0)';
  const ox=t0.x-tc.x+6, oy=t0.y-tc.y+10, T0=performance.now();
  function f(now){ const t=now-T0;
    A.style.opacity=String(1-cl(t/420));                                     /* 1 the statement fades, the mark stays */
    const m=ease(cl((t-300)/750));                                            /* 2 the mark flies to the first quote and shrinks */
    fly.style.transform=`translate(${(t0.x-q0.x)*m}px,${(t0.y-q0.y-6)*m}px) scale(${1+(sc-1)*m})`;
    fly.style.opacity=String(1-cl((t-1150)/200));
    const g=out(cl((t-1000)/600)); top.style.clipPath=`circle(${g*560}px at ${ox}px ${oy}px)`;   /* 3 the card opens from it */
    backs.forEach((c,n)=>c.style.setProperty('opacity',String(out(cl((t-1350-n*120)/350))),'important'));                /* the stack fans in beneath */
    if(head) head.style.opacity=String(out(cl((t-1100)/450)));               /* 4 the rest of slide 13 arrives */
    if(n13) n13.style.opacity=String(out(cl((t-1350)/400)));
    [lead,...fs].forEach((e,n)=>e&&(e.style.opacity=String(out(cl((t-1450-n*110)/380)))));
    later.slice(-2).forEach(e=>e.style.opacity=String(cl((t-900)/300)));
    if(t<2150) return requestAnimationFrame(f);
    fly.remove(); qm.style.visibility=''; requestAnimationFrame(()=>requestAnimationFrame(()=>cards.forEach(c=>c.style.transition=''))); top.style.clipPath=''; backs.forEach(c=>c.style.removeProperty('opacity')); later.forEach(e=>e.style.opacity='');
    A.classList.remove('on'); A.style.opacity=''; A.style.zIndex=''; B.style.zIndex='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
const advM=adv; adv=function(){ if(rolling) return; if(S[i+1]?.querySelector('.s47')&&S[i].querySelector('.psq .qm')&&qmark()) return; advM(); };
})();
/* SLIDE 13 -> 14. "A split by device" lights and lifts out of the pain points, rises to the middle, and its bead splits
   into the sage and mauve circles of the venn; the overlap, the chips and the caption follow. */
(function(){
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, out=t=>1-Math.pow(1-t,3), back=t=>1+2.2*Math.pow(t-1,3)+1.2*Math.pow(t-1,2), cl=t=>Math.max(0,Math.min(1,t));
const st=document.createElement('style');st.textContent=`
section.s.viaSplit .vn14 .vc,section.s.viaSplit .vn14 .vlap,section.s.viaSplit .vn14 .vch span,section.s.viaSplit .vn14 .vcap{animation:none!important}
.splitcard{position:absolute;z-index:60;pointer-events:none;border-radius:18px;padding:12px 18px 12px 44px;width:360px;box-sizing:border-box;
 background:linear-gradient(180deg,#fff,#fafafc 60%,#f2f2f6);box-shadow:inset 1.5px 1.5px 1px #fff,0 0 0 1px rgba(20,23,27,.07),0 18px 34px -20px rgba(52,4,20,.3);will-change:transform,opacity}
.splitcard b{display:block;font:600 19px/1.3 "Plus Jakarta Sans",sans-serif;color:#340414}.splitcard p{margin:2px 0 0;font:300 15.5px/1.45 "Helvetica Neue",Helvetica,Arial,sans-serif;color:#14171B}
.splitcard i{position:absolute;left:18px;top:17px;width:12px;height:12px;border-radius:50%;background:radial-gradient(60% 45% at 50% 22%,rgba(255,255,255,.85),rgba(255,255,255,0) 70%),radial-gradient(circle at 50% 65%,#6a2a3f,#340414 70%);box-shadow:0 3px 6px -2px rgba(52,4,20,.5)}`;
document.head.appendChild(st);
function split(){ const A=S[i],B=S[i+1]; if(rolling||!B||!B.querySelector('.vn14')||!A.querySelector('.s47 .finds .f')) return false;
  rolling=true; const SR=slide.getBoundingClientRect(),k=SR.width/1280;
  const R=e=>{const r=e.getBoundingClientRect();return {x:(r.left-SR.left)/k,y:(r.top-SR.top)/k,w:r.width/k,h:r.height/k}};
  const fs=[...A.querySelectorAll('.s47 .finds .f')], src=fs[1], was=fs.map(f=>f.classList.contains('on'));
  fs.forEach((f,n)=>f.classList.toggle('on',n===1));                       /* 1 "A split by device" lights */
  const r0=R(src);
  const card=document.createElement('div'); card.className='splitcard'; card.innerHTML='<i></i>'+src.innerHTML.replace(/<\/?b[^>]*>/g,m=>m);
  card.style.left=r0.x+'px'; card.style.top=r0.y+'px'; card.style.width=r0.w+'px'; card.style.opacity='0'; slide.appendChild(card);
  [A,B].forEach(x=>x.style.transition='none'); B.classList.add('on','viaSplit'); B.style.zIndex='10'; A.style.zIndex='20';
  const vn=B.querySelector('.vn14'), vg=B.querySelector('.vc.vcg'), vp=B.querySelector('.vc.vcp'), lap=B.querySelector('.vlap');
  const kids=[...vg.children,...vp.children], chips=[...B.querySelectorAll('.vn14 .vch span')], cap=B.querySelector('.vn14 .vcap');
  const later=[B.querySelector('.head'),B.querySelector('.foot'),B.querySelector('.sigtr')].filter(Boolean);
  const V=R(vn), cx=V.x+V.w/2, cy=V.y+185, G=R(vg), P=R(vp), gdx=cx-(G.x+G.w/2), pdx=cx-(P.x+P.w/2), gdy=cy-(G.y+G.h/2);
  [vg,vp].forEach(c=>{c.style.opacity='0'}); kids.forEach(e=>e.style.opacity='0'); lap.style.opacity='0'; chips.forEach(e=>e.style.opacity='0'); if(cap) cap.style.opacity='0';
  later.forEach(e=>e.style.opacity='0');
  const tx=cx-r0.x-r0.w/2, ty=cy-r0.y-r0.h/2, T0=performance.now();
  function f(now){ const t=now-T0;
    A.style.opacity=String(1-cl((t-250)/400));                                /* everything else on 13 fades */
    card.style.opacity=String(cl((t-200)/120)*(1-cl((t-1150)/150)));
    const u=ease(cl((t-350)/650));                                             /* 2 the lit card rises to the middle */
    card.style.transform=`translate(${tx*u}px,${ty*u}px) scale(${1+.08*u-.5*cl((t-1050)/200)})`;
    const sp=back(cl((t-1150)/750)), g=cl((t-1150)/200);                       /* 3 its bead splits into two circles */
    const sc=.05+.95*out(cl((t-1150)/750));
    vg.style.opacity=vp.style.opacity=String(g);
    vg.style.transform=`translate(${gdx*(1-sp)}px,${gdy*(1-sp)}px) scale(${sc})`;
    vp.style.transform=`translate(${pdx*(1-sp)}px,${gdy*(1-sp)}px) scale(${sc})`;
    const kf=out(cl((t-1750)/400)); kids.forEach(e=>e.style.opacity=String(kf));
    const lp=cl((t-1950)/350); lap.style.opacity=String(lp); lap.style.transform=`translate(-50%,-50%) scale(${.7+.3*back(lp)})`;   /* 4 the overlap */
    chips.forEach((e,n)=>{const c=out(cl((t-2150-n*70)/300)); e.style.opacity=String(c); e.style.transform=`translateY(${8*(1-c)}px)`;});
    if(cap) cap.style.opacity=String(out(cl((t-2550)/350)));
    later.forEach(e=>e.style.opacity=String(out(cl((t-900)/450))));
    if(t<2950) return requestAnimationFrame(f);
    card.remove(); fs.forEach((f,n)=>f.classList.toggle('on',was[n]));
    [vg,vp,lap,cap,...kids,...chips,...later].forEach(e=>{ if(e){e.style.opacity='';e.style.transform='';} });
    A.classList.remove('on'); A.style.opacity=''; A.style.zIndex=''; B.style.zIndex='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
const advS=adv; adv=function(){ if(rolling) return; if(S[i+1]?.querySelector('.vn14')&&S[i].querySelector('.s47')&&split()) return; advS(); };
const goS=go; go=function(n){ S.forEach(s=>s.classList.remove('viaSplit')); goS(n); };
})();

/* SLIDE 14 -> 15. A plain slide to the left: the venn moves off left and the sketches follow in from the right. */
(function(){ const advP=adv; adv=function(){ if(rolling) return; if(S[i].querySelector('.vn14')&&S[i+1]?.querySelector('.lf12')&&pan('right')) return; advP(); }; })();
/* SLIDE 18 -> 19. Everything on 18 fades but the broken Ben's Deli row; its gold breaks turn to green, "No app to open"
   becomes "Agent hears the intent", and each pill flies to its own node in 19's intent-led tree. */
(function(){
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, out=t=>1-Math.pow(1-t,3), cl=t=>Math.max(0,Math.min(1,t));
function repair(){ const A=S[i],B=S[i+1]; if(rolling||!B||!B.querySelector('.ia19')||!A.querySelector('.ev18w.wm')) return false;
  rolling=true; const SR=slide.getBoundingClientRect(),k=SR.width/1280;
  const R=e=>{const r=e.getBoundingClientRect();return {x:(r.left-SR.left)/k,y:(r.top-SR.top)/k,w:r.width/k,h:r.height/k}};
  const row=A.querySelector('.ev18w.wm'), fl=row.querySelector('.fl18'), r0=R(fl);
  /* a copy of the broken row floats above everything and gets repaired */
  const c=fl.cloneNode(true); c.style.cssText=`position:absolute;left:${r0.x}px;top:${r0.y}px;z-index:60;margin:0;will-change:transform`;
  slide.appendChild(c); fl.style.visibility='hidden';
  const brs=[...c.querySelectorAll('i.br')], no=c.querySelectorAll('.no')[0], dim=c.querySelector('.dim');
  const [A2]=[A]; A2.style.zIndex='20';
  [A,B].forEach(x=>x.style.transition='none');
  const tree=B.querySelectorAll('.ia19c')[1];
  const pills=[...c.querySelectorAll('span')], lines=[...c.querySelectorAll('i')];
  const tg=[tree.querySelector('.ia19n.root'), tree.querySelectorAll('.ia19n')[1], tree.querySelector('.ia19f')];   /* each pill to its own place */
  let p0=null, p1=null;
  let swapped=false, shown=false; const T0=performance.now();
  function f(now){ const t=now-T0;
    A.style.opacity=String(1-cl(t/450));                                         /* 1 all of 18 fades but the broken row */
    if(t>700&&!swapped){ swapped=true;                                            /* 2 the breaks become solid green lines */
      brs.forEach(b=>{b.style.transition='background .35s ease';b.style.background='#6F7C70';});
      no.style.transition='box-shadow .35s ease,color .35s ease'; no.style.boxShadow='0 0 0 1px rgba(52,4,20,.14)'; no.style.color='#14171B'; no.textContent='Agent hears the intent';
      if(dim){ dim.style.transition='all .35s ease'; dim.style.opacity='1'; dim.style.background='#340414'; dim.style.color='#fff'; dim.style.boxShadow='none'; dim.textContent='Glanceable card'; } }
    if(t>1900&&!shown){ shown=true; B.classList.add('on'); B.style.opacity='0'; B.style.zIndex='10'; build(B); }
    if(shown){ const g=out(cl((t-1900)/500)); B.style.opacity=String(g); }
    if(t>=1900&&!p0){ p0=pills.map(e=>R(e)); p1=tg.map(e=>R(e)); pills.forEach(e=>e.style.willChange='transform'); }   /* measured once, not every frame */
    const m=ease(cl((t-1900)/750));                                               /* 3 each pill flies to its own node: the question to the top, */
    if(p0) pills.forEach((e,n)=>{ const a=p0[n], b=p1[n], sx=b.w/a.w;           /*   the agent to Conversational intent, the card to Glanceable */
      e.style.transformOrigin='0 0'; e.style.transform=`translate3d(${(b.x-a.x)*m}px,${(b.y-a.y)*m}px,0) scale(${1+(sx-1)*m},${1+(b.h/a.h-1)*m})`; });
    lines.forEach(l=>l.style.opacity=String(1-cl((t-1900)/250)));
    c.style.opacity=String(1-cl((t-2700)/250));
    const vis=t<2700?'hidden':''; if(tg[0].style.visibility!==vis||tg[0].style.animation!=='none') tg.forEach(e=>{ e.style.animation='none'; e.style.visibility=vis; });   /* the pills land and become these nodes */
    if(t<2980) return requestAnimationFrame(f);
    c.remove(); tg.forEach(e=>e.style.visibility=''); B.__landed=tg;   /* they keep animation:none while the slide is up; cleared when the deck leaves it */ fl.style.visibility=''; A.classList.remove('on'); A.style.opacity=''; A.style.zIndex=''; B.style.zIndex=''; B.style.opacity='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
const advR=adv; adv=function(){ if(rolling) return; if(S[i+1]?.querySelector('.ia19')&&S[i].querySelector('.ev18')&&repair()) return; advR(); };
})();
/* a node that a transition landed on keeps its final state until its slide is left, so it never replays and vanishes */
(function(){ const goL=go; go=function(n){ S.forEach(s=>{ if(s.__landed&&s!==S[n]){ s.__landed.forEach(e=>{e.style.animation='';e.style.visibility='';}); s.__landed=null; } }); goL(n); }; })();
/* SLIDE 20 -> 21. Everything on Maya's slide fades but her final glanceable card; it grows and flies into the fused
   HUD system's video on 21 (her one answer is one of the 69 use cases), and 21 builds around it. */
(function(){
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, cl=t=>Math.max(0,Math.min(1,t));
function toSys(){ const A=S[i],B=S[i+1]; if(rolling||!B||!B.querySelector('.kp21')||!A.querySelector('.fl20')) return false;
  rolling=true; const SR=slide.getBoundingClientRect(),k=SR.width/1280;
  const R=e=>{const r=e.getBoundingClientRect();return {x:(r.left-SR.left)/k,y:(r.top-SR.top)/k,w:r.width/k,h:r.height/k}};
  const card=A.querySelector('.row20.af .st20:last-child .hd20'), c0=R(card);
  const fly=card.cloneNode(true); fly.style.cssText=`position:absolute;left:${c0.x}px;top:${c0.y}px;width:${c0.w}px;height:${c0.h}px;margin:0;z-index:60;transform-origin:0 0;will-change:transform,opacity`;
  slide.appendChild(fly); card.style.visibility='hidden';
  [A,B].forEach(x=>x.style.transition='none'); A.style.zIndex='20';
  B.classList.add('on'); B.style.opacity='0'; B.style.zIndex='10';
  const tgt=B.querySelector('.new21 .v21'); const t1=R(tgt); B.classList.remove('on'); B.style.opacity='';
  const T0=performance.now(); let shown=false;
  function f(now){ const t=now-T0;
    A.style.opacity=String(1-cl(t/450));
    const m=ease(cl((t-300)/900));
    fly.style.transform=`translate3d(${(t1.x-c0.x)*m}px,${(t1.y-c0.y)*m}px,0) scale(${1+(t1.w/c0.w-1)*m},${1+(t1.h/c0.h-1)*m})`;
    if(t>1000&&!shown){ shown=true; B.classList.add('on'); B.style.opacity='0'; B.style.zIndex='30'; build(B); B.querySelectorAll('video').forEach(v=>v.play().catch(()=>{})); }
    if(shown) B.style.opacity=String(cl((t-1000)/400));
    fly.style.opacity=String(1-cl((t-1250)/250));
    if(t<1550) return requestAnimationFrame(f);
    fly.remove(); card.style.visibility=''; A.classList.remove('on'); A.style.opacity=''; A.style.zIndex=''; B.style.zIndex=''; B.style.opacity='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
const advT=adv; adv=function(){ if(rolling) return; if(S[i].querySelector('.fl20')&&S[i+1]?.querySelector('.kp21')&&pan('right')) return; advT(); };   /* a plain slide to the left, like the slides before it */
})();
/* SLIDE 18 -> 19 (the three terms -> the navigation-first test): the usual slide to the left */
(function(){ const a=adv; adv=function(){ if(rolling) return; if(S[i].querySelector('.dc72')&&S[i+1]?.querySelector('.ev18')&&pan('right')) return; a(); }; })();
/* SLIDES 31 -> 32 -> 33. The iPhone stays exactly where it is: the old words fade out, the next slide comes up on top
   with its phone already in place so only the screen crossfades, then the new words slide in. */
(function(){
const cl=t=>Math.max(0,Math.min(1,t)), out=t=>1-Math.pow(1-t,3);
/* the header and the points sit together to the right of the phone, centred on it as one block */
function lay31(s){ const w=s.querySelector('.wrap'), h=w&&w.querySelector(':scope>.head'), ph=s.querySelector('.ph31'), pt=s.querySelector('.pt31'), ip=s.querySelector('.ip31')||s.querySelector('.hud6 .cv-r');   /* (eden) slide 6 centres on the HUD pair */
  if(!h||!ph||!pt||!ip) return; const keep=ph.offsetTop;
  w.style.position='relative'; h.style.cssText+=';position:absolute;left:560px;right:0;margin:0!important';
  ph.style.setProperty('margin-top',(keep-ph.offsetTop)+'px','important');
  const t2=h.querySelector('h2'), hh=t2?t2.offsetTop+t2.offsetHeight:h.offsetHeight, ph2=pt.offsetHeight, gap=34, mid=ph.offsetTop+ip.offsetTop+ip.offsetHeight/2, top=mid-(hh+gap+ph2)/2;
  h.style.top=top+'px'; pt.style.top=(top+hh+gap-ph.offsetTop)+'px'; }
const phs=S.filter(s=>s.querySelector('.ph31'));
(document.fonts&&document.fonts.ready||Promise.resolve()).then(()=>phs.forEach(lay31));
/* between rounds: the words leave one by one to the right, the screen crossfades inside the same frame, then the
   next round's header and points arrive one by one */
function swap(){ const A=S[i],B=S[i+1]; if(rolling||!B||!A.querySelector('.ph31')||!B.querySelector('.ph31')) return false;
  rolling=true; [A,B].forEach(x=>x.style.transition='none');
  const parts=s=>[s.querySelector('.wrap>.head'),...s.querySelectorAll('.pt31 li'),s.querySelector('.wrap>.fn')].filter(Boolean);
  const ax=parts(A), bx=parts(B), STEP=110, OUT=380, IN=520;
  const sbn=B.querySelector('.foot .n'); if(sbn) sbn.style.visibility='hidden';
  B.classList.add('on','ph31keep'); B.style.opacity='0'; B.style.zIndex='30'; A.style.zIndex='20';
  ax.forEach(e=>e.style.setProperty('animation','none','important')); bx.forEach(e=>{e.style.setProperty('animation','none','important');e.style.opacity='0';});
  B.querySelectorAll('video').forEach(v=>{try{v.currentTime=0;v.play().catch(()=>{});}catch(e){}});
  const outEnd=(ax.length-1)*STEP+OUT, fadeAt=outEnd-200, inAt=fadeAt+450, T0=performance.now();
  const ease=t=>t*t*(3-2*t);
  function f(now){ const t=now-T0;
    ax.forEach((e,n)=>{ const p=ease(cl((t-n*STEP)/OUT)); e.style.opacity=String(1-p); e.style.transform=`translate3d(${(p*70).toFixed(1)}px,0,0)`; });
    B.style.opacity=String(out(cl((t-fadeAt)/550)));          /* the screen crossfades; the frame is the same in both */
    bx.forEach((e,n)=>{ const p=out(cl((t-inAt-n*STEP*1.6)/IN)); e.style.opacity=String(p); e.style.transform=`translate3d(${((1-p)*24).toFixed(1)}px,0,0)`; });
    if(t<inAt+(bx.length-1)*STEP*1.6+IN) return requestAnimationFrame(f);
    ax.forEach(e=>{e.style.opacity='';e.style.transform='';e.style.removeProperty('animation');}); bx.forEach(e=>{e.style.opacity='';e.style.transform='';});
    if(sbn) sbn.style.visibility='';
    A.classList.remove('on'); A.style.zIndex=''; B.style.opacity=''; B.style.zIndex='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
const a=adv; adv=function(){ if(rolling) return; if(swap()) return; a(); };
const g=go; go=function(n){ S.forEach(s=>{s.classList.remove('ph31keep');s.querySelectorAll('.pt31 li,.wrap>.head,.wrap>.fn').forEach(e=>{if(e.closest('section').querySelector('.ph31')){e.style.removeProperty('animation');e.style.opacity='';e.style.transform='';}});}); g(n); };
})();
/* 33 to 34: the garden becomes the brand. Round 3's words leave one by one to the right, the iPhone's frame fades
   away leaving only its screen, and the screen glides across into the brand sheet's place, reshaping into that card
   as the garden crossfades into the sheet. Then the logo card, the title and the captions arrive one by one. */
(function(){
const cl=t=>Math.max(0,Math.min(1,t)), out=t=>1-Math.pow(1-t,3), io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function morph(){ const A=S[i],B=S[i+1]; if(rolling||!B||!A.querySelector('.ph31')||!B.querySelector('.e26')||matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const scr=A.querySelector('.scr31'), cols=[...B.querySelectorAll('.e26>div')]; if(!scr||cols.length<2) return false;
  const card=cols[1].querySelector('.ex'), frame=A.querySelector('.ip31'); if(!card) return false;
  rolling=true; [A,B].forEach(x=>x.style.transition='none');
  const aw=[A.querySelector('.wrap>.head'),...A.querySelectorAll('.pt31 li'),A.querySelector('.wrap>.fn')].filter(Boolean);
  aw.forEach(e=>e.style.setProperty('animation','none','important'));
  const bn=B.querySelector('.foot .n'), an=A.querySelector('.foot .n'); if(bn) bn.style.visibility='hidden';
  const bin=[cols[0],B.querySelector('.wrap>.head'),...cols[1].querySelectorAll(':scope>b,:scope>p')].filter(Boolean);
  B.classList.add('on'); B.style.opacity='0'; B.style.zIndex='30'; A.style.zIndex='20';
  bin.forEach(e=>{e.style.setProperty('animation','none','important');e.style.opacity='0';}); card.style.opacity='0';
  /* the travelling screen: the garden's current frame, then the brand sheet, in one rounded card */
  const r0=scr.getBoundingClientRect(), r1=card.getBoundingClientRect(), k=r0.height/scr.offsetHeight;
  const ov=document.createElement('div'); ov.style.cssText=`position:fixed;z-index:9999;overflow:hidden;pointer-events:none;background:#1E1E1E;left:${r0.left}px;top:${r0.top}px;width:${r0.width}px;height:${r0.height}px;border-radius:${51*k}px;box-shadow:0 22px 40px -14px rgba(52,4,20,.30)`;
  const v=scr.querySelector('video'); let g;
  try{ g=document.createElement('canvas'); g.width=v.videoWidth||720; g.height=v.videoHeight||1568; g.getContext('2d').drawImage(v,0,0,g.width,g.height); }catch(e){ g=document.createElement('img'); g.src=v.getAttribute('poster')||''; }
  g.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
  const sheet=card.querySelector('img').cloneNode(); sheet.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;max-width:none';
  ov.append(g,sheet); document.body.appendChild(ov); scr.style.visibility='hidden';
  if(frame) frame.style.setProperty('animation','none','important');
  const n=aw.length, STEP=110, OUT=380, WORDS=(n-1)*STEP+OUT, GO=WORDS-100, TRAVEL=900, LAND=GO+TRAVEL, IN0=LAND-60, T0=performance.now();
  function f(now){ const t=now-T0;
    aw.forEach((e,j)=>{ const p=io(cl((t-j*STEP)/OUT)); e.style.opacity=String(1-p); e.style.transform=`translate3d(${(p*70).toFixed(1)}px,0,0)`; });
    if(frame) frame.style.opacity=String(1-out(cl((t-150)/450)));
    B.style.opacity=String(out(cl((t-GO)/500)));
    const p=io(cl((t-GO)/TRAVEL)), L=(a,b)=>a+(b-a)*p;
    ov.style.left=L(r0.left,r1.left)+'px'; ov.style.top=L(r0.top,r1.top)+'px'; ov.style.width=L(r0.width,r1.width)+'px'; ov.style.height=L(r0.height,r1.height)+'px';
    ov.style.borderRadius=L(51*k,26*k)+'px';
    const x=out(cl((t-GO-250)/500)); sheet.style.opacity=String(x); g.style.opacity=String(1-x);
    bin.forEach((e,j)=>{ const q=out(cl((t-IN0-j*170)/520)); e.style.opacity=String(q); e.style.transform=`translate3d(0,${((1-q)*18).toFixed(1)}px,0)`; });
    if(t>=LAND){ card.style.opacity=''; if(bn) bn.style.visibility=''; if(an) an.style.visibility='hidden'; }
    if(t<IN0+(bin.length-1)*170+520) return requestAnimationFrame(f);
    ov.remove(); scr.style.visibility=''; if(an) an.style.visibility=''; if(bn) bn.style.visibility=''; if(frame){ frame.style.opacity=''; frame.style.removeProperty('animation'); }
    aw.forEach(e=>{e.style.opacity='';e.style.transform='';e.style.removeProperty('animation');});
    bin.forEach(e=>{e.style.opacity='';e.style.transform='';});
    A.classList.remove('on','ph31keep'); A.style.zIndex=''; B.style.opacity=''; B.style.zIndex='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
const a=adv; adv=function(){ if(rolling) return; if(morph()) return; a(); };
const g=go; go=function(n){ S.forEach(s=>{ if(s.querySelector('.e26')) s.querySelectorAll('.e26>div,.e26 .ex,.e26 b,.e26 p,.wrap>.head').forEach(e=>{e.style.removeProperty('animation');e.style.opacity='';e.style.transform='';}); }); g(n); };
})();
/* slide 38: the team photos shuffle as a pile. They are dealt in one by one, then every couple of seconds the top
   photo slides off to the side and tucks back under the others, each landing at a new messy angle. */
(function(){
const pr=document.querySelector('.pr38'); if(!pr||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
const sec=pr.closest('section'), cards=[...pr.querySelectorAll('.shot4')]; let order=cards.slice(), iv=null, ts=[];
const rnd=a=>(Math.random()*2-1)*a, pose=()=>({x:rnd(20),y:rnd(14),r:rnd(7)}), EASE='transform .9s cubic-bezier(.22,1,.36,1),opacity .5s ease';
const place=c=>{ c.style.transform=`translate(-50%,-50%) translate(${c.p.x.toFixed(1)}px,${c.p.y.toFixed(1)}px) rotate(${c.p.r.toFixed(2)}deg)`; };
const stack=()=>order.forEach((c,k)=>c.style.zIndex=String(k+1));
cards.forEach(c=>{ c.style.left='50%'; c.style.top='50%'; c.p=pose(); });
function stop(){ clearInterval(iv); iv=null; ts.forEach(clearTimeout); ts=[]; }
function shuffle(){ const top=order[order.length-1], s=Math.random()<.5?-1:1;
  top.style.transform=`translate(-50%,-50%) translate(${s*230}px,${rnd(30).toFixed(1)}px) rotate(${s*16}deg)`;
  ts.push(setTimeout(()=>{ order.pop(); order.unshift(top); stack(); order.forEach(c=>{ c.p=pose(); place(c); }); },560)); }
function start(){ stop(); order=cards.slice(); stack();
  cards.forEach(c=>{ c.style.transition='none'; c.style.opacity='0'; c.style.transform='translate(-50%,-50%) translate(-260px,70px) rotate(-14deg)'; });
  void pr.offsetWidth;
  order.forEach((c,k)=>ts.push(setTimeout(()=>{ c.style.transition=EASE; c.style.opacity='1'; c.p=pose(); place(c); },900+k*220)));
  ts.push(setTimeout(()=>{ shuffle(); iv=setInterval(shuffle,2400); },900+cards.length*220+1400)); }
let was=false;
new MutationObserver(()=>{ const on=sec.classList.contains('on'); if(on&&!was) start(); if(!on&&was) stop(); was=on; }).observe(sec,{attributes:true,attributeFilter:['class']});
if(sec.classList.contains('on')){ was=true; start(); }
})();
/* slide 36: 52 and -67% count up as they arrive */
(function(){
const box=document.querySelector('.s36'); if(!box) return; const sec=box.closest('section'); let was=false, ts=[];
function run(){ ts.forEach(clearTimeout); ts=[];
  box.querySelectorAll('[data-n36]').forEach((b,k)=>{ const n=+b.dataset.n36, s=b.dataset.s36||'', fmt=v=>(v<0?'−':'')+Math.abs(v)+s; b.textContent=fmt(0);
    ts.push(setTimeout(()=>{ const t0=performance.now(), D=900; const f=now=>{ const p=Math.min(1,(now-t0)/D); b.textContent=fmt(Math.round(n*(1-Math.pow(1-p,3)))); if(p<1&&sec.classList.contains('on')) requestAnimationFrame(f); else b.textContent=fmt(n); }; requestAnimationFrame(f); },1400+k*200)); }); }
new MutationObserver(()=>{ const on=sec.classList.contains('on'); if(on&&!was) run(); was=on; }).observe(sec,{attributes:true,attributeFilter:['class']});
if(sec.classList.contains('on')){ was=true; run(); }
})();

/* 36 to 37: the 2 becomes the north star. The divider and the results leave to the right, the grey 6 and its arrow
   fade, and the line under the 2 rises and grows into slide 37's big north-star line while the 2 shrinks away. */
(function(){
const cl=t=>Math.max(0,Math.min(1,t)), out=t=>1-Math.pow(1-t,3), io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function handoff(){ const A=S[i],B=S[i+1]; if(rolling||!B||!A.querySelector('.s36')||!B.querySelector('.s37')||matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  rolling=true; [A,B].forEach(x=>x.style.transition='none');
  const sb=A.querySelector('.sb36'), two=A.querySelector('.nn36 .now'), six=A.querySelector('.nn36 .was'), ar=A.querySelector('.nn36 i');
  const leave=[A.querySelector('.sp36'),A.querySelector('.rs36')].filter(Boolean), aRest=[A.querySelector('.wrap>.head'),A.querySelector('.wrap>.fn')].filter(Boolean);
  const st=B.querySelector('.st37'), ns=B.querySelector('.ns37'), bRest=[B.querySelector('.wrap>.head'),B.querySelector('.wrap>.fn')].filter(Boolean);
  [...leave,...aRest,six,ar,two,sb].forEach(e=>e&&e.style.setProperty('animation','none','important'));
  B.classList.add('on'); B.style.opacity='0'; B.style.zIndex='30'; A.style.zIndex='20';
  ns.style.setProperty('animation','none','important'); bRest.forEach(e=>e.style.opacity='0');
  const bn=B.querySelector('.foot .n'), an=A.querySelector('.foot .n'); if(bn) bn.style.visibility='hidden';
  const r0=sb.getBoundingClientRect(), r1=st.getBoundingClientRect(), k=r0.height/r1.height;
  /* the real north-star line travels: it starts drawn over the old caption, at its size, and grows into place */
  st.style.visibility=''; st.style.transformOrigin='0 0'; st.style.opacity='0';
  st.querySelectorAll('mark').forEach(m=>{ m.classList.remove('draw37'); m.style.setProperty('animation','none','important'); });
  const T0=performance.now(), MOVE0=380, MOVE=900, END=MOVE0+MOVE+380;
  function f(now){ const t=now-T0;
    leave.forEach(e=>{ const p=io(cl(t/480)); e.style.opacity=String(1-p); e.style.transform=`translate3d(${(p*50).toFixed(1)}px,0,0)`; });
    aRest.forEach(e=>e.style.opacity=String(1-out(cl(t/420))));
    [six,ar].forEach(e=>{ if(e) e.style.opacity=String(1-out(cl((t-120)/420))); });
    if(two){ const p=io(cl((t-MOVE0)/650)); two.style.opacity=String(1-p); two.style.transform=`scale(${1-.55*p})`; two.style.transformOrigin='50% 60%'; }
    const p=io(cl((t-MOVE0)/MOVE)), s=k+(1-k)*p;
    st.style.transform=`translate(${((r0.left-r1.left)*(1-p)).toFixed(1)}px,${((r0.top-r1.top)*(1-p)).toFixed(1)}px) scale(${s.toFixed(4)})`;
    st.style.opacity=String(cl((t-MOVE0)/300));
    sb.style.opacity=String(1-cl((t-MOVE0)/260)); sb.style.transform=`translate3d(0,${(-20*p).toFixed(1)}px,0)`;
    B.style.opacity=String(out(cl((t-MOVE0)/320)));
    bRest.forEach(e=>e.style.opacity=String(out(cl((t-MOVE0-500)/500))));
    if(t>=MOVE0+MOVE){ if(bn) bn.style.visibility=''; if(an) an.style.visibility='hidden'; }
    if(t<END) return requestAnimationFrame(f);
    st.style.transform=''; st.style.opacity=''; st.style.transformOrigin='';
    st.querySelectorAll('mark').forEach(m=>{ m.style.removeProperty('animation'); m.classList.add('draw37'); });
    [...leave,...aRest,six,ar,two,sb].forEach(e=>{ if(!e) return; e.style.opacity=''; e.style.transform=''; e.style.removeProperty('animation'); });
    ns.style.removeProperty('animation'); ns.classList.add('held37');
    bRest.forEach(e=>e.style.opacity=''); if(an) an.style.visibility=''; if(bn) bn.style.visibility='';
    A.classList.remove('on'); A.style.zIndex=''; B.style.opacity=''; B.style.zIndex='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
const a=adv; adv=function(){ if(rolling) return; if(handoff()) return; a(); };
const g=go; go=function(n){ const B=document.querySelector('.s37')?.closest('section'); if(B){ const ns=B.querySelector('.ns37'); ns.style.removeProperty('animation'); ns.classList.remove('held37'); B.querySelectorAll('.st37 mark').forEach(m=>{m.style.removeProperty('animation');m.classList.remove('draw37');}); } g(n); };
})();
/* 37 to 38: the measures for the next round give way to what I learned. The two columns of measures slide out to the
   left row by row, and slide 38's takeaways rise in row by row in the same place, before its photos are dealt in. */
(function(){
const cl=t=>Math.max(0,Math.min(1,t)), out=t=>1-Math.pow(1-t,3), io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function pass(){ const A=S[i],B=S[i+1]; if(rolling||!B||!A.querySelector('.s37')||!B.querySelector('.xk')||matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  rolling=true; [A,B].forEach(x=>x.style.transition='none');
  const aRows=[...A.querySelectorAll('.cl37 .q37,.cl37 .r37,.ns37')].filter(e=>getComputedStyle(e).opacity!=='0'), aRest=[A.querySelector('.wrap>.head'),A.querySelector('.wrap>.fn')].filter(Boolean);
  const bRows=[...B.querySelectorAll('.xk .st>.r')], bRest=[B.querySelector('.wrap>.head')].filter(Boolean);
  [...aRows,...aRest].forEach(e=>e.style.setProperty('animation','none','important'));
  B.classList.add('on'); B.style.zIndex='30'; A.style.zIndex='20'; B.style.opacity='0';
  [...bRows,...bRest].forEach(e=>{ e.style.setProperty('animation','none','important'); e.style.opacity='0'; });
  const bn=B.querySelector('.foot .n'), an=A.querySelector('.foot .n'); if(bn) bn.style.visibility='hidden';
  const STEP=60, OUT=420, outEnd=(aRows.length-1)*STEP+OUT, IN0=outEnd-120, T0=performance.now();
  function f(now){ const t=now-T0;
    aRows.forEach((e,k)=>{ const p=io(cl((t-k*STEP)/OUT)); e.style.opacity=String(1-p); e.style.transform=`translate3d(${(-60*p).toFixed(1)}px,0,0)`; });
    aRest.forEach(e=>e.style.opacity=String(1-out(cl((t-outEnd+300)/300))));
    B.style.opacity=String(out(cl((t-IN0+150)/300)));
    bRest.forEach(e=>e.style.opacity=String(out(cl((t-IN0)/450))));
    bRows.forEach((e,k)=>{ const p=out(cl((t-IN0-120-k*150)/520)); e.style.opacity=String(p); e.style.transform=`translate3d(0,${((1-p)*18).toFixed(1)}px,0)`; });
    if(t>=IN0){ if(bn) bn.style.visibility=''; if(an) an.style.visibility='hidden'; }
    const end=IN0+120+(bRows.length-1)*150+520;
    if(t<end) return requestAnimationFrame(f);
    [...aRows,...aRest].forEach(e=>{e.style.opacity='';e.style.transform='';e.style.removeProperty('animation');});
    [...bRows,...bRest].forEach(e=>{e.style.opacity='';e.style.transform='';e.style.removeProperty('animation');});
    if(an) an.style.visibility='';
    A.classList.remove('on','stepped'); A.style.zIndex=''; B.style.opacity=''; B.style.zIndex='';
    i=i+1; media(); document.querySelector('#bar i').style.width=pct(i); document.title=`CPT at Eden, ${i+1}/${S.length}`;
    requestAnimationFrame(()=>{ A.style.transition=B.style.transition=''; rolling=false; }); }
  requestAnimationFrame(f); return true; }
const a=adv; adv=function(){ if(rolling) return; if(S[i]&&S[i].querySelector('.s37')&&S[i].querySelector('[data-step]')&&!S[i].classList.contains('stepped')) return a(); if(pass()) return; a(); };
})();
/* NAVIGATION SAFETY. A slide change must never start while another one is still moving: pressing back, a footer
   chapter, Home/End or a click in the middle of a transition used to run go() underneath it, leaving two slides
   showing and the index out of step ("everything collapses"). So (1) every way of moving is ignored while a transition
   runs; (2) whenever a slide stops being the current one, the inline styles and helper classes that transitions put
   on it are cleared, so it comes back clean; (3) exactly one slide is ever "on"; (4) if a transition ever fails to
   finish, a watchdog releases the deck after a few seconds instead of leaving it frozen. */
(function(){
const PRE=['transform','opacity','visibility','clip-path','z-index','transition','filter','translate','scale','rotate','animation'];
const CLS=['off','stepped','arrived','viaRise','viaQ','qsweep','viaSplit','ph31keep','tv','viaGap','h13'];
const snap=new WeakMap();
const take=root=>[root,...root.querySelectorAll('*')].forEach(e=>{ if(!snap.has(e)) snap.set(e,new Set(Array.from(e.style))); });
S.forEach(take);
function resetSlide(s){
  [s,...s.querySelectorAll('*')].forEach(e=>{ const keep=snap.get(e); if(!keep) return;
    Array.from(e.style).forEach(p=>{ if(!keep.has(p)&&PRE.some(x=>p===x||p.startsWith(x+'-'))) e.style.removeProperty(p); }); });
  s.classList.remove(...CLS.filter(c=>c!=='off'));
  if(s.__landed){ s.__landed.forEach(e=>{e.style.animation='';e.style.visibility='';}); s.__landed=null; }
  if(s.querySelector('.lf12')) stepWB(s,false); }
function strays(){ [...document.body.children].forEach(e=>{ if(e.id||e.closest('#stage')) return; const st=e.style;
  if(st.position==='fixed'&&(+st.zIndex>=9000)) e.remove(); }); document.querySelectorAll('#slide>canvas.roll').forEach(c=>c.remove()); }
function normalize(hard){ S.forEach((s,k)=>{ if(k===i) return; if(s.classList.contains('on')) s.classList.remove('on'); resetSlide(s); });
  S[i].classList.add('on'); if(hard){ if(window.__dropFrames) __dropFrames(); strays(); resetSlide(S[i]); S[i].style.transform=''; S[i].style.opacity=''; S[i].style.clipPath=''; S[i].style.zIndex=''; S[i].style.transition=''; } }
/* 1: block every way of moving while a transition runs */
const navKeys=['ArrowRight','ArrowLeft',' ','PageDown','PageUp','Home','End','Enter'];
addEventListener('keydown',e=>{ if(rolling&&navKeys.includes(e.key)&&!(typeof zAt!=='undefined'&&zAt>=0)){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
addEventListener('click',e=>{ if(rolling&&!e.target.closest('#zoomer')){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
const backS=back; back=function(){ if(rolling) return; backS(); };
const goS=go; go=function(n){ if(rolling) return; goS(n); normalize(false); };
/* 2-3: tidy every slide that is no longer current as soon as a transition finishes */
let was=false, since=0;
setInterval(()=>{ if(rolling&&!was){ since=performance.now(); }
  if(!rolling&&was){ setTimeout(()=>{ if(!rolling) normalize(false); },700); }
  /* 4: the watchdog */
  if(rolling&&performance.now()-since>6500){ rolling=false; normalize(true); }
  was=rolling; },120);
window.resetSlide=resetSlide;
})();
/* EDEN TO MANUS. On the case-study site, going on from the last slide hands over to the Manus deck the way the intro
   hands over to this one: the last slide pushes off to the left like any other change, then the Manus deck opens and
   its cover slides in from the right (?from=eden). Off the site the deck wraps to the cover as before. */
(function(){ if(!/^\/clover\//.test(location.pathname)) return; const NEXT='/manus/deck.html?from=eden';
  /* from the second-last slide on, the browser readies the Manus deck in the background (a prerender where the browser
     supports it, a prefetch elsewhere), so it shows the moment the push ends */
  let warmed=false; const warm=()=>{ if(warmed) return; warmed=true;
    if(window.HTMLScriptElement&&HTMLScriptElement.supports&&HTMLScriptElement.supports('speculationrules')){
      const sr=document.createElement('script'); sr.type='speculationrules';
      sr.textContent=JSON.stringify({prerender:[{source:'list',urls:[NEXT],eagerness:'immediate'}]}); document.head.appendChild(sr); }
    else { const l=document.createElement('link'); l.rel='prefetch'; l.href=NEXT; document.head.appendChild(l); } };
  const g=go; let leaving=false;
  go=function(n){ if(n<S.length||rolling||leaving) return g(n);
    leaving=true;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){ location.href=NEXT; return; }
    rolling=true;
    const A=S[i], t0=performance.now(), io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    (function f(now){ const p=Math.max(0,Math.min(1,(now-t0)/520)); A.style.transform=`translateX(${(-100*io(p)).toFixed(2)}%)`;
      if(p<1) requestAnimationFrame(f); else location.href=NEXT; })(t0); };
  /* warm as soon as either of the last two slides comes on, however it was reached */
  S.slice(-2).forEach(s=>{ if(s.classList.contains('on')) warm(); new MutationObserver(()=>{ if(s.classList.contains('on')) warm(); }).observe(s,{attributes:true,attributeFilter:['class']}); });
  /* coming back with the browser's back button finds the deck as it was left */
  addEventListener('pageshow',e=>{ if(e.persisted&&leaving){ leaving=false; rolling=false; S[i].style.transform=''; } });
})();
