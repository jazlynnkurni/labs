/* Fit the 1280x720 stage to the window. The slide rests fully built, like the deck (no entrance motion on load).
   Click, Space or the right arrow plays the build in reading order so the reveal can be judged: every [data-b] element
   enters at step n (110ms apart) with a small rise, blur and fade; SVG lines with [data-b] draw along their path. */
(()=>{
const st=document.getElementById('stage');
const fit=()=>st.style.setProperty('--k',Math.min(innerWidth/1280,innerHeight/720));addEventListener('resize',fit);fit();
const rm=matchMedia('(prefers-reduced-motion: reduce)').matches,ease='cubic-bezier(.2,.7,.2,1)';
function build(){
  if(rm)return;
  st.querySelectorAll('[data-b]').forEach(el=>{
    const delay=(+el.dataset.b)*110;
    if(el instanceof SVGGeometryElement){const L=el.getTotalLength();
      el.animate([{strokeDasharray:`${L}px`,strokeDashoffset:`${L}px`},{strokeDasharray:`${L}px`,strokeDashoffset:'0px'}],{duration:420,delay,easing:ease,fill:'backwards'});}
    else el.animate([{opacity:0,translate:'0 8px',filter:'blur(8px)'},{opacity:1,translate:'0 0',filter:'blur(0)'}],{duration:280,delay,easing:ease,fill:'backwards'});
  });
}
st.addEventListener('click',build);
addEventListener('keydown',e=>{if(e.key===' '||e.key==='ArrowRight'){e.preventDefault();build();}});
if(new URLSearchParams(location.search).has('build'))build();
})();
