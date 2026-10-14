import { VERT, FRAG } from './shaders.js';

// Compile and link, collecting every log so nothing can fail silently to black.
export function buildProgram(gl) {
  const out = { ok: false, program: null, log: '', uniforms: [] };

  const mk = (type, src, name) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    const info = gl.getShaderInfoLog(sh) || '';
    if (info.trim()) out.log += `[${name}]\n${info.trim()}\n`;
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      out.log += `[${name}] compile FAILED\n` + numbered(src);
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  };

  const vs = mk(gl.VERTEX_SHADER, VERT, 'vertex');
  if (!vs) return out;
  const fs = mk(gl.FRAGMENT_SHADER, FRAG, 'fragment');
  if (!fs) { gl.deleteShader(vs); return out; }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  const linfo = gl.getProgramInfoLog(prog) || '';
  if (linfo.trim()) out.log += `[link]\n${linfo.trim()}\n`;
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    out.log += '[link] FAILED\n';
    return out;
  }

  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const u = gl.getActiveUniform(prog, i);
    out.uniforms.push(u.name);
  }
  out.program = prog;
  out.ok = true;
  return out;
}

// Only ever shown when something already went wrong, so the cost does not matter.
function numbered(src) {
  return src.split('\n').map((l, i) => String(i + 1).padStart(4, ' ') + ' | ' + l).join('\n');
}

export function getContext(canvas, readback = false) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: readback,
    powerPreference: 'high-performance'
  });
  return gl;
}
