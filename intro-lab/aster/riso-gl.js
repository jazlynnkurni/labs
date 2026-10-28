/* THE LIVING PRINT. The flip phone's screen from the home page, as a reusable print: a three-tone ordered dither on a
   WebGL quad in one ink on paper, where an 8x8 Bayer threshold decides which cells print and idle "drizzle" keeps the dark
   areas alive, so the picture never sits still. Works on a photograph or a video (the frame is re-uploaded each tick).
   mountPrint(el, {src, video, ink:[r,g,b], w, h, fit:'cover'|'contain'}) sizes a canvas into el and renders it while
   el's slide (.sl) is on. All prints share one frame loop. */
const PAPER=[250/255,249/255,247/255];
const P={dot:2.4,tones:3,rain:.6};
const VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FS=`precision highp float;
uniform vec2 uRes; uniform float uDot,uTones,uTime,uRain,uAsp; uniform sampler2D uA; uniform vec3 uInk,uPaper;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float b2(vec2 a){a=floor(a);return fract(a.x*.5+a.y*a.y*.75);}
float b8(vec2 a){return b2(.25*a)*.0625+b2(.5*a)*.25+b2(a);}
vec2 cover(vec2 uv,float a){float f=uRes.x/uRes.y;vec2 s=(a>f)?vec2(f/a,1.):vec2(1.,a/f);return (uv-.5)*s+.5;}
float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
void main(){
  vec2 frag=gl_FragCoord.xy; vec2 cell=floor(frag/uDot); vec2 cuv=(cell+.5)*uDot/uRes;
  float L=lum(texture2D(uA,cover(cuv,uAsp)).rgb); L=clamp((L-.5)*1.06+.5,0.,1.); L=pow(L,.88);
  float q=clamp(floor(L*uTones+b8(cell))/uTones,0.,1.);
  float spd=3.+6.*hash(vec2(cell.x,91.7)); float drop=floor(uTime*spd);
  float onRain=step(hash(vec2(cell.x,mod(cell.y+drop,1024.))),L*1.25);
  float sparse=(1.-smoothstep(.05,.32,L))*uRain; float pickRain=step(hash(cell.yx*1.93+4.271),sparse);
  float on=mix(q,onRain,pickRain);
  gl_FragColor=vec4(mix(uInk,uPaper,on),1.);
}`;
const prints=[]; let looping=false, t0=performance.now();
function loop(now){ const t=((now-t0)/1000)%600;
  for(const p of prints){ const on=!p.sec||p.sec.classList.contains('on');
    if(p.video){ if(on&&p.media.paused) p.media.play().catch(()=>{}); if(!on&&!p.media.paused) p.media.pause(); }
    if(!on) continue;
    const gl=p.gl; gl.bindTexture(gl.TEXTURE_2D,p.tex);
    if(p.video&&p.media.readyState>=2) gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,p.media);
    gl.uniform1f(p.U.uTime,t); gl.drawArrays(gl.TRIANGLES,0,3); }
  requestAnimationFrame(loop); }
export function mountPrint(el,o){
  const media=o.video?document.createElement('video'):new Image();
  if(o.video){ media.muted=true; media.loop=true; media.playsInline=true; media.preload='auto'; }
  return new Promise((res,rej)=>{
    const ready=()=>{ const nw=media.naturalWidth||media.videoWidth, nh=media.naturalHeight||media.videoHeight; if(!nw) return rej(new Error('no size'));
      let w=o.w,h=o.h; if(o.fit!=='cover'){ const k=Math.min((o.w||1e9)/nw,(o.h||1e9)/nh); w=Math.round(nw*k); h=Math.round(nh*k); }
      const cv=document.createElement('canvas'); const S=2; cv.width=w*S; cv.height=h*S; cv.style.width=w+'px'; cv.style.height=h+'px'; cv.style.display='block';
      const gl=cv.getContext('webgl',{alpha:false,antialias:false,depth:false,preserveDrawingBuffer:false}); if(!gl) return rej(new Error('no webgl'));
      const mk=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x;};
      const pg=gl.createProgram(); gl.attachShader(pg,mk(gl.VERTEX_SHADER,VS)); gl.attachShader(pg,mk(gl.FRAGMENT_SHADER,FS)); gl.linkProgram(pg); gl.useProgram(pg);
      const q=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,q); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      const aL=gl.getAttribLocation(pg,'a'); gl.enableVertexAttribArray(aL); gl.vertexAttribPointer(aL,2,gl.FLOAT,false,0,0);
      const U={}; ['uRes','uDot','uTones','uTime','uRain','uAsp','uA','uInk','uPaper'].forEach(n=>U[n]=gl.getUniformLocation(pg,n));
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      const tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,media);
      gl.viewport(0,0,cv.width,cv.height); gl.uniform2f(U.uRes,cv.width,cv.height); gl.uniform1f(U.uDot,P.dot); gl.uniform1f(U.uTones,P.tones); gl.uniform1f(U.uRain,P.rain);
      gl.uniform1f(U.uAsp,nw/nh); gl.uniform1i(U.uA,0); gl.uniform3fv(U.uInk,(o.ink||[52,4,20]).map(v=>v/255)); gl.uniform3fv(U.uPaper,PAPER); gl.uniform1f(U.uTime,0);
      gl.drawArrays(gl.TRIANGLES,0,3); el.appendChild(cv);
      prints.push({el,sec:el.closest('.sl'),media,video:!!o.video,gl,tex,U}); if(!looping){looping=true;requestAnimationFrame(loop);} res(cv); };
    media.onerror=()=>rej(new Error('load')); if(o.video) media.addEventListener('loadeddata',ready,{once:true}); else media.onload=ready; media.src=o.src; });
}
