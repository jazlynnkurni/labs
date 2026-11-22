/* metal.js: the folder as worn aluminium, a fragment shader rendered once into a canvas.
   The recipe the references agree on (Redshift's Scratches node, procedural edge-wear and rust
   setups in Blender and Unreal), rebuilt in GLSL:
   · brushed base: fine streaks stretched along the brushing, on the photo's light-from-the-top gradient
   · scratches in three sizes, random length and width, some following a bundle, cutting through
     to brighter metal; the deep ones a dark groove. The photo's three lines are three of those.
   · rust gated by an edge-wear mask broken up by noise, a few isolated spots, a little bleeding into
     the deep scratches, a brown stain round each patch, and more of it lower down where water sits
   Returns { canvas, grain } like concrete.js did: grain is where chalk takes (badly on smooth metal,
   not in the grooves, well on rust).                                                          */
const FRAG = `
precision highp float;
uniform vec2 uRes, uSize; uniform float uScale, uSeed, uMode, uBack, uLines; uniform vec3 uTop, uBot;
float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031 + uSeed * .0173); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++){ s += a * noise(p); p = m * p; a *= .5; } return s / .97; }
float scratches(vec2 p, float cell, float dens, float wid, float seed, float bias){
  vec2 g = floor(p / cell); float acc = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 c = g + vec2(i, j);
    float h0 = hash(c + seed), h1 = hash(c + seed + 17.1), h2 = hash(c + seed + 31.7), h3 = hash(c + seed + 47.3), h4 = hash(c + seed + 59.9);
    if (h0 > dens) continue;
    vec2 o = (c + vec2(h1, h2)) * cell;
    float ang = mix(h3 * 3.14159, bias + (h3 - .5) * .5, step(.45, h4));
    vec2 d = vec2(cos(ang), sin(ang)), q = p - o;
    float L = cell * (.3 + .9 * h4), t = clamp(dot(q, d), -L * .5, L * .5), dist = length(q - d * t);
    float taper = 1. - pow(abs(t) / (L * .5), 3.), w = wid * (.5 + h1);
    acc = max(acc, smoothstep(w, 0., dist) * taper * (.4 + .6 * h2));
  }
  return acc;
}
vec2 voronoi(vec2 p){ vec2 g = floor(p); float f1 = 9., id = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){ vec2 c = g + vec2(i, j), o = c + vec2(hash(c + 3.1), hash(c + 7.7)); float d = length(p - o); if (d < f1){ f1 = d; id = hash(c + 11.3); } }
  return vec2(f1, id); }
float sdRR(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale, uv = p / uSize;
  float ed = uBack > .5 ? -min(sdRR(p - vec2(138., 70.), vec2(138., 70.), 52.), sdRR(p - vec2(315., 98.), vec2(315., 42.), 45.))
                        : -sdRR(p - uSize * .5, uSize * .5, 40.);
  vec3 col = mix(uTop, uBot, smoothstep(0., 1., uv.y));
  float br = noise(vec2(p.x * .012, p.y * 1.3)) * .5 + noise(vec2(p.x * .03, p.y * 3.1)) * .35 + noise(vec2(p.x * .004, p.y * .6)) * .4;
  col += (br - .62) * 20. / 255.;                                             // brushing
  col += (hash(floor(p * uScale)) - .5) * 7. / 255.;                          // grain
  col += exp(-pow((p.x - uSize.x * .32 + p.y * .55) / 150., 2.)) * 9. / 255.;   // a broad soft sheen
  col *= 1. - (fbm(p / 90.) - .5) * .14;                                     // grime, mottled
  float sF = scratches(p, 12., .65, .35, 1., .12), sM = scratches(p, 55., .4, .55, 7., .2), sD = scratches(p, 170., .45, .8, 13., -.1);
  float lines = 0.;
  if (uLines > .5) for (int i = 0; i < 3; i++){ float ly = 398. + 8. * float(i) + sin(p.x * .011 + float(i)) * .8;
    lines = max(lines, smoothstep(.9, 0., abs(p.y - ly)) * (.55 + .45 * noise(vec2(p.x * .05, float(i) * 9.)))); }
  float deep = max(sD, lines);
  col += sF * 22. / 255. + sM * 32. / 255.;                                   // cut through to bright metal
  col = mix(col, col * .6, deep * .8);                                        // the deep ones are grooves
  float edgeF = 1. - smoothstep(0., 26., ed);
  vec2 vo = voronoi(p / 46. + (vec2(noise(p / 9.), noise(p / 9. + 5.)) - .5) * .9);   // warped, so spots are never round
  float spot = (1. - smoothstep(0., .32 + .2 * noise(p / 12.), vo.x)) * step(.95, vo.y);
  float rustAmt = fbm(p / 70. + 3.7) * .65 + fbm(p / 18. + 9.1) * .35 + edgeF * .38 * smoothstep(.35, .7, noise(p / 40. + 2.)) + uv.y * .08 + deep * .3 * noise(p / 20.) + spot * .4;
  float rust = smoothstep(.80, .90, rustAmt), stain = smoothstep(.70, .82, rustAmt) - rust;
  vec3 rc = mix(vec3(70., 38., 22.) / 255., vec3(140., 70., 32.) / 255., fbm(p / 9.));
  rc = mix(rc, vec3(182., 104., 52.) / 255., smoothstep(.6, .8, noise(p / 3.)) * .6);
  rc *= .85 + .3 * hash(floor(p * uScale * .5) + 5.);
  col = mix(col, col * vec3(.94, .88, .82), stain * .6);
  col = mix(col, rc, rust * .9);
  if (uMode > .5){ float a = smoothstep(.35, .7, .8 + (br - .62) * .9 - deep * .9 + rust * .3 + (hash(floor(p * uScale) + 9.) - .5) * .3); gl_FragColor = vec4(a); return; }
  gl_FragColor = vec4(col, 1.);
}`;
const VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }';

export function makeMetal({ w, h, s, seed, top, bot, back = false, lines = false }) {
  const W = Math.round(w * s), H = Math.round(h * s);
  const g = document.createElement('canvas'); g.width = W; g.height = H;
  const gl = g.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  gl.uniform2f(U('uRes'), W, H); gl.uniform2f(U('uSize'), w, h); gl.uniform1f(U('uScale'), s); gl.uniform1f(U('uSeed'), seed);
  gl.uniform1f(U('uBack'), back ? 1 : 0); gl.uniform1f(U('uLines'), lines ? 1 : 0);
  gl.uniform3f(U('uTop'), ...top.map(v => v / 255)); gl.uniform3f(U('uBot'), ...bot.map(v => v / 255));
  gl.viewport(0, 0, W, H);
  const out = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(g, 0, 0); return c; };
  gl.uniform1f(U('uMode'), 0); gl.drawArrays(gl.TRIANGLES, 0, 3); const canvas = out();
  gl.uniform1f(U('uMode'), 1); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3); const grain = out();
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return { canvas, grain };
}
