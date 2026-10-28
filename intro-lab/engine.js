/* the stage, the keys and the dots. A concept gives {build(slides) and go(i, dir)}. */
const Intro=(()=>{
  const stage=document.getElementById('stage'); let cur=0, concept=null, busy=false;
  function fit(){ document.documentElement.style.setProperty('--k', Math.min(innerWidth/1280, innerHeight/720)*0.96); }
  addEventListener('resize',fit); fit();
  const dots=document.createElement('div'); dots.className='dots'; document.body.appendChild(dots);
  const hint=document.createElement('div'); hint.className='hint'; hint.textContent='click, space or → to advance · ← back'; document.body.appendChild(hint);
  function paint(){ dots.innerHTML=SLIDES.map((s,i)=>`<i class="${i===cur?'on':''}"></i>`).join(''); }
  function go(n,dir){ if(busy||n<0||n>=SLIDES.length||n===cur) return; busy=true; const from=cur; cur=n; paint(); Promise.resolve(concept.go(from,cur,dir)).then(()=>busy=false); }
  addEventListener('keydown',e=>{ if(e.key==='ArrowRight'||e.key===' '||e.key==='Enter'){e.preventDefault();go(cur+1,1);} if(e.key==='ArrowLeft'){e.preventDefault();go(cur-1,-1);} });
  stage.addEventListener('click',e=>{ go(e.clientX<innerWidth*0.2?cur-1:cur+1, e.clientX<innerWidth*0.2?-1:1); });
  /* the shared markup of one slide: text column and pictures; concepts lay them out */
  function markup(s,i){ const pics=s.pics.map(([k,l],j)=>`<figure class="ph ${k} p${j}"><span>${l}</span></figure>`).join('');
    const dict=s.dict?`<div class="dict"><div class="word">${s.dict.word} <em>${s.dict.hello||''}</em></div><div class="pron">${s.dict.pron} <span class="pos">${s.dict.pos}</span></div><p class="def">${s.dict.def}</p></div>`:'';
    return `<div class="tx"><div class="label">${s.eyebrow}</div>${dict}<h1 class="title">${s.title}</h1><div class="lines">${s.lines.map(l=>`<p class="body">${l}</p>`).join('')}</div><div class="chips">${s.chips.map(c=>`<span>${c}</span>`).join('')}</div></div><div class="pics">${pics}</div>`; }
  return { start(c){ concept=c; concept.build(SLIDES, markup); paint(); const q=new URLSearchParams(location.search).get('s'); if(q){ cur=Math.max(0,Math.min(SLIDES.length-1,+q-1)); paint(); concept.jump&&concept.jump(cur); } }, get cur(){return cur;}, stage };
})();
