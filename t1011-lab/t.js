/* Four alternative 10 to 11 transitions for the Manus deck, swapped in ahead of the deck's own hook.
   window.TV picks the variant. Everything is driven frame by frame; the incoming slide's own build
   animations are switched off (class .tv) so nothing replays once it lands. */
(function(){
const st=document.createElement('style');
st.textContent=`section.s.tv .wrap *,section.s.tvA .wrap *{animation:none!important}
section.s.tv .c11v .cvr{opacity:1!important}`;
document.head.appendChild(st);
const cl=t=>Math.max(0,Math.min(1,t)), io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, ou=t=>1-Math.pow(1-t,3), oi=t=>t*t*t;
const K=()=>document.getElementById('slide').getBoundingClientRect().width/1280;
const lerp=(a,b,q)=>a+(b-a)*q, mix=(c0,c1,q)=>c0.map((v,k)=>Math.round(lerp(v,c1[k],q)));
let touched=[];
const set=(e,o)=>{ if(!e) return; if(!touched.includes(e)) touched.push(e); Object.assign(e.style,o); };
function box(r,css){ const d=document.createElement('div'); d.style.cssText=`position:fixed;z-index:9999;pointer-events:none;box-sizing:border-box;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;${css||''}`; document.body.appendChild(d); return d; }
function place(d,r){ d.style.left=r.left+'px'; d.style.top=r.top+'px'; d.style.width=r.width+'px'; d.style.height=r.height+'px'; }
const R=(a,b,q)=>({left:lerp(a.left,b.left,q),top:lerp(a.top,b.top,q),width:lerp(a.width,b.width,q),height:lerp(a.height,b.height,q)});
/* clean up when slide 11 is left, so a later visit plays its own entrance */
function arm(B){ if(B.__tvobs) return; B.__tvobs=new MutationObserver(()=>{ if(!B.classList.contains('on')&&B.classList.contains('tv')){ B.classList.remove('tv'); B.querySelectorAll('*').forEach(e=>{ if(e.__tvk){ e.removeAttribute('style'); e.__tvk=false; } }); } }); B.__tvobs.observe(B,{attributes:true,attributeFilter:['class']}); }
function finish(A,B,overs){ overs.forEach(o=>o.remove()); A.classList.remove('tvA');
  touched.forEach(e=>{ if(A.contains(e)) e.removeAttribute('style'); else e.__tvk=true; }); touched=[];
  settle(A,B); }
function parts(A,B){ return {
  bars:[...A.querySelectorAll('.fun3 .fbw i')], gap:A.querySelector('.fun3 u.gp'), labels:[...A.querySelectorAll('.fun3 .fbw span')],
  src:[...A.querySelectorAll('.fun3 .fsrc')], aMeta:[A.querySelector('.act-t'),A.querySelector('.wrap>.fn')].filter(Boolean), aHead:A.querySelector('.wrap>.head'),
  rows:[...A.querySelectorAll('.fun3 .fr3')],
  cards:[0,1,2].map(k=>B.querySelector('.c11v .cn'+k)), lines:[...B.querySelectorAll('.c11v .c11')], svg:B.querySelector('.c11v .cvs'),
  cvp:B.querySelector('.c11v .cvp'), cvr:B.querySelector('.c11v .cvr'), cap:[...B.querySelectorAll('.c11v .cvr>b,.c11v .cvr>p:not(.mt)')],
  rmt:B.querySelector('.c11v .cvr>.mt'), lmt:B.querySelector('.c11v .cvl>.mt'), bHead:B.querySelector('.wrap>.head') }; }
function start(A,B){ rolling=true; A.classList.add('tvA'); [A,B].forEach(x=>x.style.transition='none'); wake(B); B.classList.add('tv','on'); arm(B); B.style.zIndex='30'; A.style.zIndex='20'; }
const drawLines=(P,t,t0,gap)=>P.lines.forEach((l,k)=>set(l,{strokeDashoffset:String(1-ou(cl((t-t0-k*gap)/520)))}));

/* 1. BARS BECOME CARDS */
function v1(A,B){ const P=parts(A,B), k=K(); start(A,B);
  const r0=P.bars.map(b=>b.getBoundingClientRect()), r1=P.cards.map(c=>c.getBoundingClientRect()), g0=P.gap.getBoundingClientRect(), g1=P.cvp.getBoundingClientRect();
  const C0=[[201,194,160],[169,153,57],[52,4,20]], C1=[[247,247,249],[247,247,249],[247,247,249]];
  const ov=r0.map((r,j)=>box(r,`border-radius:${4*k}px;background:rgb(${C0[j]})`)), gv=box(g0,`border:${1.5*k}px dashed #340414;border-radius:${4*k}px`);
  P.bars.forEach(b=>set(b,{visibility:'hidden'})); set(P.gap,{visibility:'hidden'});
  [...P.cards,P.cvp,...P.cap,P.rmt,P.lmt].forEach(e=>set(e,{opacity:'0'})); P.lines.forEach(l=>set(l,{strokeDashoffset:'1'}));
  set(B,{opacity:'0'}); const T0=performance.now();
  (function f(now){ const t=now-T0;
    const fo=io(cl(t/420)); P.rows.forEach(r=>{ set(r,{}); r.style.setProperty('border-bottom-color',`rgba(20,23,27,${(.14*(1-fo)).toFixed(3)})`,'important'); }); [...P.src,...P.aMeta,...P.labels,P.aHead].forEach(e=>set(e,{opacity:String(1-fo),transform:`translate3d(${(fo*40).toFixed(1)}px,0,0)`}));
    set(B,{opacity:String(ou(cl((t-250)/420)))});
    ov.forEach((d,j)=>{ const q=io(cl((t-180-j*90)/900)); place(d,R(r0[j],r1[j],q)); d.style.borderRadius=lerp(4,22,q)*k+'px';
      d.style.background=`rgb(${mix(C0[j],C1[j],q)})`; d.style.boxShadow=`0 ${24*k*q}px ${44*k*q}px ${-24*k*q}px rgba(52,4,20,${(.34*q).toFixed(2)})`; });
    const g=io(cl((t-260)/950)); place(gv,R(g0,g1,g)); gv.style.borderRadius=lerp(4,26,g)*k+'px'; gv.style.borderColor=`rgba(52,4,20,${(1-g*.8).toFixed(2)})`;
    const cx=cl((t-1080)/260); P.cards.forEach(c=>set(c,{opacity:String(cx)})); ov.forEach(d=>d.style.opacity=String(1-cx));
    const px=cl((t-1210)/300); set(P.cvp,{opacity:String(px)}); gv.style.opacity=String(1-px);
    set(P.lmt,{opacity:String(cl((t-500)/400))}); set(P.rmt,{opacity:String(cl((t-900)/400))});
    drawLines(P,t,1300,110); P.cap.forEach(e=>set(e,{opacity:String(ou(cl((t-1600)/400)))}));
    if(t<2050) return requestAnimationFrame(f); finish(A,B,[...ov,gv]); })(T0); return true; }

/* 2. BARS COLLAPSE TO LINES */
function v2(A,B){ const P=parts(A,B), k=K(); start(A,B);
  const r0=P.bars.map(b=>b.getBoundingClientRect()), M=P.svg.getScreenCTM();
  const pt=(x,y)=>{ const p=new DOMPoint(x,y).matrixTransform(M); return [p.x,p.y]; };
  const L=[[pt(4,55),pt(192,165)],[pt(4,165),pt(192,165)],[pt(4,275),pt(192,165)]];
  const C0=[[201,194,160],[169,153,57],[52,4,20]], G=[180,180,182];
  const ov=r0.map((r,j)=>box(r,`border-radius:${4*k}px;background:rgb(${C0[j]});transform-origin:0 50%`));
  P.bars.forEach(b=>set(b,{visibility:'hidden'})); set(P.gap,{opacity:'1'});
  [...P.cards,P.cvp,...P.cap,P.rmt,P.lmt].forEach(e=>set(e,{opacity:'0'})); P.lines.forEach(l=>set(l,{strokeDashoffset:'1'}));
  set(B,{opacity:'0'}); const T0=performance.now(), th=1.5*k;
  (function f(now){ const t=now-T0;
    const fo=io(cl(t/420)); P.rows.forEach(r=>{ set(r,{}); r.style.setProperty('border-bottom-color',`rgba(20,23,27,${(.14*(1-fo)).toFixed(3)})`,'important'); }); [...P.src,...P.aMeta,...P.labels,P.aHead,P.gap].forEach(e=>set(e,{opacity:String(1-fo),transform:`translate3d(${(fo*40).toFixed(1)}px,0,0)`}));
    set(B,{opacity:String(ou(cl((t-280)/380)))});
    ov.forEach((d,j)=>{ const r=r0[j], a=io(cl((t-j*70)/430)), b=io(cl((t-430-j*70)/650));
      const h=lerp(r.height,th,a), cy=r.top+r.height/2, w0=r.width;
      const [p0,p1]=L[j], len=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]), ang=Math.atan2(p1[1]-p0[1],p1[0]-p0[0]);
      const x=lerp(r.left,p0[0],b), y=lerp(cy,p0[1],b), w=lerp(w0,len,b), rot=lerp(0,ang,b);
      d.style.left=x+'px'; d.style.top=(y-h/2)+'px'; d.style.width=w+'px'; d.style.height=h+'px'; d.style.borderRadius=h/2+'px';
      d.style.transform=`rotate(${rot}rad)`; d.style.background=`rgba(${mix(C0[j],G,a)},${lerp(1,.75,a).toFixed(2)})`; });
    const sw=cl((t-1180)/160); ov.forEach(d=>d.style.opacity=String(1-sw)); if(t>1180) P.lines.forEach(l=>set(l,{strokeDashoffset:'0'}));
    P.cards.forEach((c,j)=>{ const q=ou(cl((t-1120-j*110)/480)); set(c,{opacity:String(q),transform:`translate3d(0,${((1-q)*22).toFixed(1)}px,0)`}); });
    set(P.lmt,{opacity:String(cl((t-1000)/400))}); set(P.rmt,{opacity:String(cl((t-1250)/400))});
    const px=ou(cl((t-1250)/450)); set(P.cvp,{opacity:String(px),transform:`translate3d(0,${((1-px)*14).toFixed(1)}px,0)`});
    P.cap.forEach(e=>set(e,{opacity:String(ou(cl((t-1550)/400)))}));
    if(t<2000) return requestAnimationFrame(f); finish(A,B,ov); })(T0); return true; }

/* 3. GAP ZOOM */
function v3(A,B){ const P=parts(A,B), k=K(); start(A,B);
  const g0=P.gap.getBoundingClientRect(), g1=P.cvp.getBoundingClientRect(), Ar=A.getBoundingClientRect();
  const cx=g0.left+g0.width/2, cy=g0.top+g0.height/2, Z=2.4;
  A.style.transformOrigin=`${(cx-Ar.left)/k}px ${(cy-Ar.top)/k}px`;
  const zr={left:cx-(g0.width*Z)/2,top:cy-(g0.height*Z)/2,width:g0.width*Z,height:g0.height*Z};
  const gv=box(g0,`border:${1.5*k}px dashed #340414;border-radius:${4*k}px;background:rgba(255,255,255,0)`); set(P.gap,{visibility:'hidden'});
  [...P.cards,P.cvp,...P.cap,P.rmt,P.lmt].forEach(e=>set(e,{opacity:'0'})); P.lines.forEach(l=>set(l,{strokeDashoffset:'1'}));
  set(B,{opacity:'0'}); const T0=performance.now();
  (function f(now){ const t=now-T0;
    const z=oi(cl(t/650)); A.style.transform=`scale(${lerp(1,Z,z)})`; A.style.opacity=String(1-io(cl((t-120)/520)));
    const a=io(cl(t/650)), b=io(cl((t-560)/620)); const r=t<560?R(g0,zr,a):R(zr,g1,b); place(gv,r);
    gv.style.borderRadius=lerp(4,26,b)*k+'px'; gv.style.borderColor=`rgba(52,4,20,${(1-b*.75).toFixed(2)})`;
    gv.style.background=`rgba(255,255,255,${(b*.9).toFixed(2)})`; gv.style.boxShadow=`0 ${22*k*b}px ${40*k*b}px ${-14*k*b}px rgba(52,4,20,${(.3*b).toFixed(2)})`;
    set(B,{opacity:String(ou(cl((t-420)/380)))});
    const px=cl((t-1180)/320); set(P.cvp,{opacity:String(px)}); gv.style.opacity=String(1-px);
    P.cards.forEach((c,j)=>{ const q=ou(cl((t-760-j*110)/480)); set(c,{opacity:String(q),transform:`translate3d(${((q-1)*30).toFixed(1)}px,0,0)`}); });
    set(P.lmt,{opacity:String(cl((t-700)/400))}); set(P.rmt,{opacity:String(cl((t-1100)/400))});
    drawLines(P,t,1250,110); P.cap.forEach(e=>set(e,{opacity:String(ou(cl((t-1550)/400)))}));
    if(t<2000) return requestAnimationFrame(f); A.style.transform=''; A.style.opacity=''; A.style.transformOrigin=''; finish(A,B,[gv]); })(T0); return true; }

/* 4. STAGED SLIDE-UP */
function v4(A,B){ const P=parts(A,B); start(A,B);
  const out=[P.aHead,P.aMeta[0],...P.rows,P.aMeta[1]].filter(Boolean);
  const inn=[P.bHead,P.lmt,...P.cards,P.rmt,P.cvp].filter(Boolean);
  inn.forEach(e=>set(e,{opacity:'0'})); P.cap.forEach(e=>set(e,{opacity:'0'})); P.lines.forEach(l=>set(l,{strokeDashoffset:'1'}));
  set(B,{opacity:'0'}); const T0=performance.now();
  (function f(now){ const t=now-T0;
    out.forEach((e,j)=>{ const q=io(cl((t-j*70)/360)); set(e,{opacity:String(1-q),transform:`translate3d(0,${(-40*q).toFixed(1)}px,0)`}); });
    if(t>560) set(B,{opacity:'1'});
    inn.forEach((e,j)=>{ const q=ou(cl((t-600-j*85)/460)); set(e,{opacity:String(q),transform:`translate3d(0,${((1-q)*30).toFixed(1)}px,0)`}); });
    drawLines(P,t,600+inn.length*85+60,100); P.cap.forEach(e=>set(e,{opacity:String(ou(cl((t-1500)/400)))}));
    if(t<2000) return requestAnimationFrame(f); finish(A,B,[]); })(T0); return true; }

const V=[null,v1,v2,v3,v4][window.TV||1];
const prev=advance;
advance=function(){ if(rolling) return; const c=S[i], nx=S[i+1];
  if(c&&c.querySelector('.fun3 u.gp')&&nx&&nx.querySelector('.c11v .cvp')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){ V(c,nx); return; }
  prev(); };
})();
