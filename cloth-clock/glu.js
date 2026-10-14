// Small WebGL2 helpers. Every failure carries the driver log so the page can
// show it instead of going black.

export function compileShader(gl, type, src, label) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) || '(no log)';
    gl.deleteShader(sh);
    throw new Error(label + ' failed to compile\n' + log + '\n' + numbered(src));
  }
  return sh;
}

function numbered(src) {
  return src.split('\n').map((l, i) => String(i + 1).padStart(4) + ' | ' + l).join('\n');
}

export function createProgram(gl, vsSrc, fsSrc, name) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc, name + ' vertex shader');
  let fs;
  try {
    fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc, name + ' fragment shader');
  } catch (e) {
    gl.deleteShader(vs);
    throw e;
  }
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || '(no log)';
    gl.deleteProgram(program);
    throw new Error(name + ' failed to link\n' + log);
  }

  const u = Object.create(null);
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const clean = info.name.replace(/\[0\]$/, '');
    u[clean] = gl.getUniformLocation(program, info.name);
  }

  const a = Object.create(null);
  const acount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (let i = 0; i < acount; i++) {
    const info = gl.getActiveAttrib(program, i);
    if (!info) continue;
    a[info.name] = gl.getAttribLocation(program, info.name);
  }

  return { program, u, a, name };
}

// Setting a uniform the compiler removed is not an error, but a typo is, so
// unknown names are collected and reported once.
const missing = new Set();
export function missingUniforms() { return [...missing]; }

function loc(pr, name) {
  const l = pr.u[name];
  if (l === undefined) {
    const key = pr.name + '.' + name;
    if (!missing.has(key)) missing.add(key);
    return null;
  }
  return l;
}

export const set1f = (gl, pr, n, v) => { const l = loc(pr, n); if (l) gl.uniform1f(l, v); };
export const set1i = (gl, pr, n, v) => { const l = loc(pr, n); if (l) gl.uniform1i(l, v); };
export const set2f = (gl, pr, n, x, y) => { const l = loc(pr, n); if (l) gl.uniform2f(l, x, y); };
export const set3f = (gl, pr, n, x, y, z) => { const l = loc(pr, n); if (l) gl.uniform3f(l, x, y, z); };
export const setMat4 = (gl, pr, n, m) => { const l = loc(pr, n); if (l) gl.uniformMatrix4fv(l, false, m); };

export function makeTarget(gl, w, h, internal, withDepth) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, internal, w, h);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

  let depth = null;
  if (withDepth) {
    depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
  }

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('framebuffer incomplete, status 0x' + status.toString(16) + ' at ' + w + 'x' + h);
  }
  return { tex, fb, depth, w, h };
}

export function freeTarget(gl, t) {
  if (!t) return;
  gl.deleteTexture(t.tex);
  gl.deleteFramebuffer(t.fb);
  if (t.depth) gl.deleteRenderbuffer(t.depth);
}
