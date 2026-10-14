// small webgl2 helpers. every failure path returns a log string so nothing dies silently.

export function getContext(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance'
  });
  if (!gl) throw new Error('webgl2 is not available in this browser');
  return gl;
}

export function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  const ok = gl.getShaderParameter(sh, gl.COMPILE_STATUS);
  const log = gl.getShaderInfoLog(sh) || '';
  return { shader: sh, ok, log };
}

export function buildProgram(gl, vsSrc, fsSrc, name) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const logs = [];
  if (!vs.ok) logs.push(`[${name}] vertex compile:\n${vs.log}`);
  if (!fs.ok) logs.push(`[${name}] fragment compile:\n${fs.log}`);
  if (vs.log.trim() && vs.ok) logs.push(`[${name}] vertex notes:\n${vs.log}`);
  if (fs.log.trim() && fs.ok) logs.push(`[${name}] fragment notes:\n${fs.log}`);

  let prog = null;
  let ok = vs.ok && fs.ok;
  if (ok) {
    prog = gl.createProgram();
    gl.attachShader(prog, vs.shader);
    gl.attachShader(prog, fs.shader);
    gl.linkProgram(prog);
    ok = gl.getProgramParameter(prog, gl.LINK_STATUS);
    const llog = gl.getProgramInfoLog(prog) || '';
    if (!ok) logs.push(`[${name}] link:\n${llog}`);
    else if (llog.trim()) logs.push(`[${name}] link notes:\n${llog}`);
  }
  gl.deleteShader(vs.shader);
  gl.deleteShader(fs.shader);
  return { program: prog, ok, log: logs.join('\n\n') };
}

// every active uniform, so the probe can prove the array slots really exist
export function activeUniforms(gl, prog) {
  const out = [];
  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(prog, i);
    out.push({ name: info.name, size: info.size, type: info.type });
  }
  return out;
}

export function uniformMap(gl, prog) {
  const map = Object.create(null);
  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(prog, i);
    const base = info.name.replace(/\[0\]$/, '');
    map[base] = gl.getUniformLocation(prog, info.name);
  }
  return map;
}

// float render target if the extension is there, otherwise 8 bit with a sqrt encode
export function makeTarget(gl, w, h, prev) {
  if (prev) {
    gl.deleteFramebuffer(prev.fbo);
    gl.deleteTexture(prev.tex);
  }
  const hasFloat = !!gl.getExtension('EXT_color_buffer_half_float') || !!gl.getExtension('EXT_color_buffer_float');
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  let encode = 0;
  if (hasFloat) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    encode = 1;
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return { fbo, tex, w, h, encode, status, ok: status === gl.FRAMEBUFFER_COMPLETE };
}
