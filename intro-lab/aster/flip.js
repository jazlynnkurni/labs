(function(){
/* THE SCREEN. A four-tone ordered dither on a WebGL quad, the way the reference does it:
   each cell of the screen takes the photo's luminance at its centre, an 8x8 Bayer threshold
   decides which of four inks it prints in, and idle "drizzle" keeps the dark areas alive.
   The pointer opens a soft window onto the colour photo; a drag brushes a stroke of it away
   and the stroke heals. Photos dissolve cell by cell in random order. */
const PHOTOS=['camera','dog-beach','teaching','snowboarding','mun','bagels'].map(n=>`aster/about/${n}.jpg`);
const P={dot:1.2,tones:3,rad:.56,rain:.6,ang:14,hold:3};
const screen=document.getElementById('screen'), fallback=document.getElementById('fallback');
const cv=document.createElement('canvas'); cv.style.visibility='hidden'; screen.insertBefore(cv,screen.querySelector('.glare'));
const gl=cv.getContext('webgl',{alpha:false,antialias:false,depth:false});
let live=false;
if(gl){
const VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FS=`precision highp float;
uniform vec2 uRes; uniform float uDot,uTones,uFade,uSeed,uTime,uRain,uReveal,uRad; uniform vec2 uMouse;
uniform sampler2D uA,uB,uMask; uniform float uAspA,uAspB,uColor; uniform vec3 uInk,uPaper;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float b2(vec2 a){a=floor(a);return fract(a.x*.5+a.y*a.y*.75);}
float b8(vec2 a){return b2(.25*a)*.0625+b2(.5*a)*.25+b2(a);}
vec2 cover(vec2 uv,float a){float f=uRes.x/uRes.y;vec2 s=(a>f)?vec2(f/a,1.):vec2(1.,a/f);return (uv-.5)*s+.5;}
float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
void main(){
  vec2 frag=gl_FragCoord.xy; vec2 uv=frag/uRes; vec2 cell=floor(frag/uDot); vec2 cuv=(cell+.5)*uDot/uRes;
  float pickB=step(hash(cell*.7311+uSeed),uFade);
  float La=lum(texture2D(uA,cover(cuv,uAspA)).rgb), Lb=lum(texture2D(uB,cover(cuv,uAspB)).rgb);
  float L=mix(La,Lb,pickB); L=clamp((L-.5)*1.06+.5,0.,1.); L=pow(L,.88);
  float q=clamp(floor(L*uTones+b8(cell))/uTones,0.,1.);
  float spd=3.+6.*hash(vec2(cell.x,91.7)); float drop=floor(uTime*spd);
  float onRain=step(hash(vec2(cell.x,mod(cell.y+drop,1024.))),L*1.25);
  float sparse=(1.-smoothstep(.05,.32,L))*uRain; float pickRain=step(hash(cell.yx*1.93+4.271),sparse);
  float on=mix(q,onRain,pickRain);
  float R=uReveal*uRad*min(uRes.x,uRes.y);
  float circ=(uReveal<.001)?0.:(1.-smoothstep(R*.25,R,distance(frag,uMouse)));
  float rev=clamp(circ+texture2D(uMask,uv).a,0.,1.);
  float tear=clamp(rev*1.45-hash(cell*2.17+9.13)*.45,0.,1.);
  vec3 photo=mix(texture2D(uA,cover(uv,uAspA)).rgb,texture2D(uB,cover(uv,uAspB)).rgb,uFade);
  /* phones have no hover to reveal the colour, so there the dither prints in the photo's own colours:
     each channel cut to the same steps on the same Bayer grid, so the pixel texture stays */
  vec3 C=mix(texture2D(uA,cover(cuv,uAspA)).rgb,texture2D(uB,cover(cuv,uAspB)).rgb,pickB);
  C=clamp((C-.5)*1.08+.5,0.,1.);
  float st=uTones+2.; vec3 cq=clamp(floor(C*st+b8(cell))/st,0.,1.);
  cq*=mix(1.,.82,pickRain*(1.-onRain));
  vec3 mono=mix(uInk,uPaper,on);
  gl_FragColor=vec4(mix(mix(mono,cq,uColor),photo,tear),1.);
}`;
const mk=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x;};
const pg=gl.createProgram();gl.attachShader(pg,mk(gl.VERTEX_SHADER,VS));gl.attachShader(pg,mk(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pg);gl.useProgram(pg);
const q=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,q);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
const aL=gl.getAttribLocation(pg,'a');gl.enableVertexAttribArray(aL);gl.vertexAttribPointer(aL,2,gl.FLOAT,false,0,0);
const U={};['uRes','uDot','uTones','uFade','uSeed','uTime','uRain','uReveal','uRad','uMouse','uA','uB','uMask','uAspA','uAspB','uInk','uPaper','uColor'].forEach(n=>U[n]=gl.getUniformLocation(pg,n));
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
const tex=src=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);['TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER'].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,gl[k],gl.LINEAR));['TEXTURE_WRAP_S','TEXTURE_WRAP_T'].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,gl[k],gl.CLAMP_TO_EDGE));gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);return t;};
const imgs=PHOTOS.map(s=>{const im=new Image();im.src=s;return im;}); const T=[]; const asp=i=>imgs[i].naturalWidth?imgs[i].naturalWidth/imgs[i].naturalHeight:1;
const MW=96,MH=128,mc=document.createElement('canvas');mc.width=MW;mc.height=MH;const mx=mc.getContext('2d');
const sp=document.createElement('canvas');sp.width=sp.height=64;{const c=sp.getContext('2d');const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.55,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64);}
const maskT=tex(mc); let maskE=0,maskDirty=false,heal=0;
function stamp(x,y){const r=MW*.17;mx.drawImage(sp,x-r,y-r,r*2,r*2);maskE=1;maskDirty=true;heal=1.4;}
function clearMask(){mx.clearRect(0,0,MW,MH);maskE=0;maskDirty=true;}
let idx=0,nextIdx=idx,fading=false,fadeT=0,holdT=0,seed=Math.random()*61.7,hovering=false,dragging=false,reveal=0,mX=-1e4,mY=-1e4,paused=false,simT=0,W=0,H=0,dot=3,dpr=1;
function ink(){const cs=getComputedStyle(document.documentElement);const p=h=>{h=h.trim();const m=h.match(/^#([0-9a-f]{6})$/i);if(m)return [0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)/255);const r=h.match(/rgba?\(([^)]+)\)/);return r?r[1].split(',').slice(0,3).map(v=>+v/255):[0,0,0];};
  const a=p(cs.getPropertyValue('--ink')),b=p(cs.getPropertyValue('--paper'));const l=c=>.299*c[0]+.587*c[1]+.114*c[2];return l(a)<=l(b)?[a,b]:[b,a];}
function resize(){const w=screen.clientWidth,h=screen.clientHeight;if(!w||!h)return;dpr=Math.min(2,devicePixelRatio||1);W=Math.round(w*dpr);H=Math.round(h*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}dot=Math.max(2,Math.round(P.dot*dpr));}
new ResizeObserver(resize).observe(screen);resize();
function beginFade(to){if(fading||to===idx||!T[to])return;nextIdx=to;fading=true;fadeT=0;seed=Math.random()*61.7;}
function endFade(){idx=nextIdx;fading=false;fadeT=0;holdT=0;clearMask();}
function step(d){for(let s=1;s<PHOTOS.length;s++){const t=(idx+d*s+PHOTOS.length*s)%PHOTOS.length;if(T[t])return t;}return -1;}
let prev=performance.now();
function frame(now){const dt=Math.min(.05,(now-prev)/1000);prev=now;simT=(simT+dt)%600;
  for(let i=0;i<PHOTOS.length;i++) if(!T[i]&&imgs[i].complete&&imgs[i].naturalWidth) T[i]=tex(imgs[i]);
  reveal+=(((hovering||dragging)?1:0)-reveal)*(1-Math.exp(-dt*6));
  if(fading){fadeT+=dt*1000;if(fadeT>=850)endFade();} else if(!paused&&!hovering&&!dragging){holdT+=dt*1000;if(holdT>=P.hold*1000){const to=step(1);if(to>=0)beginFade(to);else holdT=0;}}
  if(maskE>.003&&!dragging){heal-=dt;if(heal<=0){mx.globalCompositeOperation='destination-out';mx.globalAlpha=Math.min(1,dt*.28);mx.fillStyle='#fff';mx.fillRect(0,0,MW,MH);mx.globalCompositeOperation='source-over';mx.globalAlpha=1;maskE*=1-Math.min(1,dt*.28);if(maskE<=.003)clearMask();else maskDirty=true;}}
  if(W&&T[idx]){const tB=(fading&&T[nextIdx])?T[nextIdx]:T[idx];if(maskDirty){gl.bindTexture(gl.TEXTURE_2D,maskT);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,mc);maskDirty=false;}
    gl.viewport(0,0,W,H);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,T[idx]);gl.uniform1i(U.uA,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tB);gl.uniform1i(U.uB,1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,maskT);gl.uniform1i(U.uMask,2);
    const [I,Pp]=ink();gl.uniform3fv(U.uInk,I);gl.uniform3fv(U.uPaper,Pp);
    gl.uniform2f(U.uRes,W,H);gl.uniform1f(U.uColor,matchMedia('(hover:none),(max-width:640px)').matches?1:0);gl.uniform1f(U.uDot,dot);gl.uniform1f(U.uTones,P.tones);gl.uniform1f(U.uFade,fading?Math.min(1,fadeT/850):0);gl.uniform1f(U.uSeed,seed);gl.uniform1f(U.uTime,simT);gl.uniform1f(U.uRain,P.rain);gl.uniform1f(U.uReveal,reveal);gl.uniform1f(U.uRad,P.rad);gl.uniform2f(U.uMouse,mX,mY);gl.uniform1f(U.uAspA,asp(idx));gl.uniform1f(U.uAspB,asp(fading?nextIdx:idx));
    gl.drawArrays(gl.TRIANGLES,0,3); if(!live){live=true;cv.style.visibility='';fallback.style.visibility='hidden';}}
  requestAnimationFrame(frame);}
requestAnimationFrame(frame);
const pt=e=>{const r=screen.getBoundingClientRect();return [(e.clientX-r.left)*dpr,(r.height-(e.clientY-r.top))*dpr,(e.clientX-r.left)/r.width*MW,(e.clientY-r.top)/r.height*MH];};
screen.addEventListener('pointerenter',()=>hovering=true);screen.addEventListener('pointerleave',()=>{hovering=false;dragging=false;});
screen.addEventListener('pointermove',e=>{const [x,y,ux,uy]=pt(e);mX=x;mY=y;if(dragging)stamp(ux,uy);});
screen.addEventListener('pointerdown',e=>{dragging=true;const [x,y,ux,uy]=pt(e);mX=x;mY=y;stamp(ux,uy);});
addEventListener('pointerup',()=>dragging=false);
document.getElementById('prev').addEventListener('click',e=>{e.stopPropagation();const t=step(-1);if(t>=0)beginFade(t);});
document.getElementById('next').addEventListener('click',e=>{e.stopPropagation();const t=step(1);if(t>=0)beginFade(t);});
document.getElementById('play').addEventListener('click',e=>{e.stopPropagation();paused=!paused;e.target.title=paused?'Play':'Pause';});
}
/* THE HINGE. Closed, the lid lies over the keys with its outer face up; near it, it swings up
   and back a little past flat, on an ease with a small overshoot, the way a real one clicks open. */
const phone=document.getElementById('phone'), stage=document.getElementById('fstage'), lid=document.getElementById('lid');
/* THE SWING. The lid's angle is animated here, frame by frame, from where it is to where it is
   going, on an ease with a small overshoot at the open end and a firm stop at the closed end.
   The face showing is decided from the same angle: the cover until the lid passes edge-on
   (90 degrees), the inside after. One number drives both, so they cannot disagree. */
let open=false, ang=180, from=180, to=180, t0=0, dur=900, raf=0;
const ease=(x,over)=>{ if(!over) return 1-Math.pow(1-x,3); const c=1.4; return 1+c*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
function place(a){ lid.style.transform=`translateZ(14px) rotateX(${a}deg)`; lid.classList.toggle('shut',a>90); }
function tick(now){ const x=Math.min(1,(now-t0)/dur); const e=ease(x, to<90); ang=from+(to-from)*e; place(ang);
  if(x<1) raf=requestAnimationFrame(tick); else { raf=0; ang=to; place(ang); } }
function setOpen(on){
  const stayEl=document.getElementById('stay'); const want=on||!!(stayEl&&stayEl.checked); if(want===open) return; open=want;
  from=ang; to=open?-P.ang:180; dur=open?900:700; t0=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(tick);
}
place(-P.ang); open=true;
let leaveT=0;
stage.addEventListener('pointerleave',()=>{phone.style.transform='';});
/* the light and the tilt follow the pointer across the stage */
stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  document.documentElement.style.setProperty('--lx',`${x*100}%`);document.documentElement.style.setProperty('--ly',`${y*100}%`);
  document.documentElement.style.setProperty('--hx',`${(x-.5)*-3}px`);document.documentElement.style.setProperty('--hy',`${(y-.5)*-3}px`);
  phone.style.transform=`rotateY(${(x-.5)*14}deg) rotateX(${(.5-y)*8}deg)`;});
/* the closed lid tells the time in New York */
const ext=document.getElementById('ext');
(function tick(){ext.textContent=new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'});setTimeout(tick,15000);})();

})();