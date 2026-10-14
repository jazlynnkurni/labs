// XPBD cloth with dihedral bending and plastic crease memory.
// No DOM here on purpose, so the solver can be run and checked under node.

const PI = Math.PI;

// Tunables shared with the control panel. main.js mutates these live.
export const P = {
  nx: 56,
  ny: 56,
  substeps: 8,
  stretch: 0.88,   // 0 floppy, 1 rigid
  bend: 0.56,      // 0 floppy, 1 rigid
  yield: 0.11,     // radians of bend before a hinge can take a set at all
  yieldRate: 6.0,  // radians per second of bending needed alongside it. This is
                   // the real discriminator: drape and a tick overlap in how far
                   // they bend the cloth, but not in how fast. Hanging tops out
                   // near 3.4 rad/s and a tick reaches 59, so a slow sag never
                   // creases and a hammer blow always does.
  plastic: 0.050,  // how much of the excess bend is kept, per step
  relax: 40,       // seconds for a crease to fade back to flat
  damping: 0.55,   // velocity drag per second
  gravity: 9.8,
  tick: 1.0,       // tick impulse scale
  wind: 0.35,
  wireframe: false,
  normals: false,
};

const CLOTH_W = 1.0;
const CLOTH_H = 1.0;   // square grid, the dial is inscribed in it
const DIAL_R_UV = 0.487;   // the visible dial, cut in the fragment shader
const ACT_R_UV = 0.530;    // simulated cloth, deliberately wider
const RIM_SLACK = 0.978;   // rim sits inside the material radius, so it bellies
const TOP_Y = 0.76;

// Spool geometry. The banner hangs from a roller at the top, so the cloth
// winds on from its top end and the bottom end is the last thing to go.
const SPOOL_R0 = 0.032;
const SPOOL_THICK = 0.0052;
const SPOOL_Z = -SPOOL_R0;

const REF_H = 1 / (60 * 8); // substep the compliance sliders are calibrated at

export class Cloth {
  constructor(nx, ny) {
    this.nx = nx;
    this.ny = ny;
    this.width = CLOTH_W;
    this.height = CLOTH_H;
    this.topY = TOP_Y;
    this.spoolY = TOP_Y;
    this.spoolZ = SPOOL_Z;
    this.r0 = SPOOL_R0;
    this.thick = SPOOL_THICK;

    const n = nx * ny;
    this.n = n;
    this.pos = new Float32Array(n * 3);
    this.prev = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.nrm = new Float32Array(n * 3);
    this.uv = new Float32Array(n * 2);
    this.fold = new Float32Array(n * 2);
    this.foldW = new Float32Array(n);
    this.w = new Float32Array(n);
    this.w0 = new Float32Array(n);
    this.kin = new Uint8Array(n);

    // The clock is a round piece of cloth. The grid is square and everything
    // outside the inscribed circle simply is not there: no triangle, no
    // constraint, no mass. Nothing else in the solver needs to know.
    this.act = new Uint8Array(n);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const dx = i / (nx - 1) - 0.5, dy = j / (ny - 1) - 0.5;
        this.act[j * nx + i] = (dx * dx + dy * dy) <= ACT_R_UV * ACT_R_UV ? 1 : 0;
      }
    }

    // The rim, so it can be snapped onto the true circle and stop looking
    // like a staircase.
    this.bnd = new Uint8Array(n);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        if (!this.act[k]) continue;
        const miss =
          (i === 0 || !this.act[k - 1]) || (i === nx - 1 || !this.act[k + 1]) ||
          (j === 0 || !this.act[k - nx]) || (j === ny - 1 || !this.act[k + nx]);
        if (miss) this.bnd[k] = 1;
      }
    }

    // What holds it: the whole rim, like a skin on a hoop.
    this.hold = new Uint8Array(n);
    for (let k = 0; k < n; k++) if (this.bnd[k]) this.hold[k] = 1;
    let topRow = ny;
    for (let k = 0; k < n; k++) if (this.act[k]) { topRow = Math.floor(k / nx); break; }
    this.topRow = topRow;

    this.cell = Math.min(CLOTH_W / (nx - 1), CLOTH_H / (ny - 1));
    this.rowSpacing = CLOTH_H / (ny - 1);

    // Ambient air is separable, so it costs two small tables per step
    // instead of a few sin calls per particle per substep.
    this.windRowZ = new Float32Array(ny);
    this.windColZ = new Float32Array(nx);
    this.windRowX = new Float32Array(ny);

    // Mass, spread evenly over the cloth that exists. Absent cells get none.
    let live = 0;
    for (let k = 0; k < n; k++) if (this.act[k]) live++;
    const per = 0.55 / live;
    for (let k = 0; k < n; k++) {
      this.w0[k] = this.act[k] ? 1 / per : 0;
      this.w[k] = this.w0[k];
    }
    this.live = live;

    this.buildTopology();
    this.reset();

    // Average inverse mass, used to normalise the compliance sliders so the
    // same slider value feels the same at any grid resolution.
    let wsum = 0;
    for (let k = 0; k < n; k++) wsum += this.w0[k];
    const wAvg = wsum / n;
    this.distBase = 2 * wAvg * REF_H * REF_H;
    const qref = 2 / this.cell;
    this.bendBase = 4 * wAvg * qref * qref * 16 * REF_H * REF_H;

    this.rimHeld = true;
    this.anchorRow = this.topRow;
    this.deploy = 1;
    this.deployVel = 0;
    this.grab = -1;
    this.grabW = 0;
    this.grabTarget = [0, 0, 0];
    this.grabPrev = [0, 0, 0];
    this.time = 0;
  }

  buildTopology() {
    const { nx, ny } = this;

    // Triangles. Quad (i,j) becomes (a,c,b) and (b,c,d) so every face points
    // toward +z when the cloth is flat.
    const tri = new Uint32Array((nx - 1) * (ny - 1) * 6);
    let t = 0;
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
        if (!(this.act[a] && this.act[b] && this.act[c] && this.act[d])) continue;
        tri[t++] = a; tri[t++] = c; tri[t++] = b;
        tri[t++] = b; tri[t++] = c; tri[t++] = d;
      }
    }
    this.tri = tri.subarray(0, t);

    // Wireframe lines, one per structural and shear edge.
    const lines = [];
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        if (!this.act[k]) continue;
        if (i < nx - 1 && this.act[k + 1]) lines.push(k, k + 1);
        if (j < ny - 1 && this.act[k + nx]) lines.push(k, k + nx);
        if (i < nx - 1 && j < ny - 1 && this.act[k + 1] && this.act[k + nx]) lines.push(k + 1, k + nx);
      }
    }
    this.line = new Uint32Array(lines);

    // Distance constraints: structural then shear.
    const md = (nx - 1) * ny + nx * (ny - 1) + 2 * (nx - 1) * (ny - 1);
    this.dIdx = new Int32Array(md * 2);
    this.dRest = new Float32Array(md);
    this.dLam = new Float32Array(md);
    let dn = 0;
    const push = (a, b) => {
      if (!this.act[a] || !this.act[b]) return;
      this.dIdx[dn * 2] = a; this.dIdx[dn * 2 + 1] = b; dn++;
    };
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx - 1; i++) push(j * nx + i, j * nx + i + 1);
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx; i++) push(j * nx + i, (j + 1) * nx + i);
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        push(j * nx + i, (j + 1) * nx + i + 1);
        push(j * nx + i + 1, (j + 1) * nx + i);
      }
    }
    this.dn = dn;

    // Dihedral bending constraints, one per interior edge of the triangulation.
    // p1,p2 is the hinge. p3,p4 are the opposite corners, ordered so that
    // cross(p2-p1, p3-p1) points toward +z in the flat rest pose. That makes
    // the signed fold angle mean the same thing for all three families.
    const mb = (nx - 1) * (ny - 1) + (nx - 1) * Math.max(0, ny - 2) + Math.max(0, nx - 2) * (ny - 1);
    this.bIdx = new Int32Array(mb * 4);
    this.bRest = new Float32Array(mb);   // plastic rest angle, 0 is flat
    this.bLam = new Float32Array(mb);
    this.bTheta = new Float32Array(mb);  // signed fold angle from the last solve
    this.bPrev = new Float32Array(mb);   // and the one before, so we can see how fast it folds
    let bn = 0;
    const pushB = (p1, p2, p3, p4) => {
      if (!this.act[p1] || !this.act[p2] || !this.act[p3] || !this.act[p4]) return;
      const o = bn * 4;
      this.bIdx[o] = p1; this.bIdx[o + 1] = p2; this.bIdx[o + 2] = p3; this.bIdx[o + 3] = p4;
      bn++;
    };
    // Diagonal hinge inside each quad.
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
        pushB(c, b, a, d);
      }
    }
    // Horizontal hinge between vertically stacked quads.
    for (let j = 1; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        pushB(j * nx + i, j * nx + i + 1, (j - 1) * nx + i + 1, (j + 1) * nx + i);
      }
    }
    // Vertical hinge between side by side quads.
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        pushB(j * nx + i, (j + 1) * nx + i, j * nx + i + 1, (j + 1) * nx + i - 1);
      }
    }
    this.bn = bn;
  }

  reset() {
    const { nx, ny, pos, prev, vel, uv } = this;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        let u = i / (nx - 1);
        let vv = j / (ny - 1);
        if (this.hold[k]) {
          const dx = u - 0.5, dy = vv - 0.5;
          u = 0.5 + dx * RIM_SLACK;
          vv = 0.5 + dy * RIM_SLACK;
        }
        const x = (u - 0.5) * this.width;
        const yy = this.topY - vv * this.height;
        pos[k * 3] = x; pos[k * 3 + 1] = yy; pos[k * 3 + 2] = 0;
        prev[k * 3] = x; prev[k * 3 + 1] = yy; prev[k * 3 + 2] = 0;
        vel[k * 3] = vel[k * 3 + 1] = vel[k * 3 + 2] = 0;
        uv[k * 2] = u; uv[k * 2 + 1] = 1 - vv;
      }
    }
    // Rest lengths come from the material, measured on the unslacked grid, so
    // pulling the rim in leaves genuine spare cloth in the middle.
    for (let c = 0; c < this.dn; c++) {
      const ka = this.dIdx[c * 2], kb = this.dIdx[c * 2 + 1];
      const ia = ka % nx, ja = (ka / nx) | 0, ib = kb % nx, jb = (kb / nx) | 0;
      const ax = (ia / (nx - 1) - 0.5) * this.width, ay = -(ja / (ny - 1)) * this.height;
      const bx = (ib / (nx - 1) - 0.5) * this.width, by = -(jb / (ny - 1)) * this.height;
      this.dRest[c] = Math.hypot(ax - bx, ay - by);
    }
    this.dLam.fill(0);
    this.bLam.fill(0);
    this.bRest.fill(0);
    this.bTheta.fill(0);
    this.bPrev.fill(0);
    this.fold.fill(0);
    this.computeNormals();
  }

  // Distance from the top end of the cloth, in metres of material.
  matS(j) { return (j / (this.ny - 1)) * this.height; }

  outerRadius() {
    const rolled = (1 - this.deploy) * this.height;
    return Math.sqrt(this.r0 * this.r0 + this.thick * rolled / PI);
  }

  // Park the wound part of the cloth on the spool as an Archimedean spiral.
  // Radius grows with the length taken up, so the roll gets visibly fatter.
  updateSpool() {
    const { nx, ny, pos, vel } = this;
    const rolled = (1 - this.deploy) * this.height;
    this.anchorRow = 0;
    const rOut = this.outerRadius();
    const r0sq = this.r0 * this.r0;
    for (let j = 0; j < ny; j++) {
      const s = this.matS(j);
      const onRoll = s <= rolled;
      let rowY = 0, rowZ = 0;
      if (onRoll) {
        // Radius and angle depend only on how deep into the roll this row is.
        const a = rolled - s;
        const r = Math.sqrt(Math.max(r0sq, rOut * rOut - this.thick * a / PI));
        const th = 2 * PI * (rOut - r) / this.thick;
        rowY = this.spoolY + r * Math.sin(th);
        rowZ = this.spoolZ + r * Math.cos(th);
      }
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        if (!onRoll) {
          this.kin[k] = this.hold[k];
          if (k !== this.grab) this.w[k] = this.hold[k] ? 0 : this.w0[k];
          continue;
        }
        const x = (i / (nx - 1) - 0.5) * this.width;
        pos[k * 3] = x;
        pos[k * 3 + 1] = rowY;
        pos[k * 3 + 2] = rowZ;
        vel[k * 3] = vel[k * 3 + 1] = vel[k * 3 + 2] = 0;
        this.kin[k] = 1;
        this.w[k] = 0;
      }
      if (onRoll) this.anchorRow = j;
    }
  }

  // Where the cloth leaves the roll. The hanging sheet sits at this z.
  tangentPoint() {
    const rOut = this.outerRadius();
    return [this.spoolY, this.spoolZ + rOut];
  }

  step(dt) {
    this.time += dt;
    const sub = Math.max(2, Math.round(P.substeps));
    const h = dt / sub;
    const n = this.n;
    const { pos, prev, vel, w } = this;

    this.updateSpool();

    const distComp = this.distBase * Math.pow(10, (1 - P.stretch) * 5 - 4);
    const bendComp = this.bendBase * Math.pow(10, (1 - P.bend) * 6 - 3);
    const alphaD = distComp / (h * h);
    const alphaB = bendComp / (h * h);
    const drag = Math.exp(-P.damping * h);
    const g = P.gravity;
    const maxMove = this.cell * 0.42;

    // Slow ambient air. Low frequency so it sways rather than buzzes.
    const wt = this.time;
    const windAmp = P.wind;

    // Two 1D tables stand in for the ambient air field.
    if (windAmp > 0) {
      for (let j = 0; j < this.ny; j++) {
        const y = this.topY - (j / (this.ny - 1)) * this.height;
        this.windRowZ[j] = Math.sin(wt * 0.71 + y * 2.1) * 0.62 * windAmp;
        this.windRowX[j] = Math.sin(wt * 0.47 + y * 1.4) * 0.5 * windAmp * 0.35;
      }
      for (let i = 0; i < this.nx; i++) {
        const x = (i / (this.nx - 1) - 0.5) * this.width;
        this.windColZ[i] = Math.sin(wt * 1.33 - x * 3.1) * 0.38 * windAmp;
      }
    }
    const wRZ = this.windRowZ, wCZ = this.windColZ, wRX = this.windRowX;
    const nx = this.nx;

    for (let s = 0; s < sub; s++) {
      // XPBD resets its multipliers every substep.
      this.dLam.fill(0);
      this.bLam.fill(0);
      for (let k = 0; k < n; k++) {
        if (this.kin[k] || w[k] === 0) continue;
        const o = k * 3;
        const x = pos[o], y = pos[o + 1], z = pos[o + 2];
        let vx = vel[o], vy = vel[o + 1], vz = vel[o + 2];
        vy -= g * h;
        if (windAmp > 0) {
          const j = (k / nx) | 0, i = k - j * nx;
          vz += (wRZ[j] + wCZ[i]) * h;
          vx += wRX[j] * h;
        }
        vx *= drag; vy *= drag; vz *= drag;
        prev[o] = x; prev[o + 1] = y; prev[o + 2] = z;
        vel[o] = vx; vel[o + 1] = vy; vel[o + 2] = vz;
        pos[o] = x + vx * h;
        pos[o + 1] = y + vy * h;
        pos[o + 2] = z + vz * h;
      }

      this.solveDistance(alphaD, maxMove);
      this.solveTethers();
      this.solveBend(alphaB, maxMove, s === sub - 1);

      if (this.grab >= 0) {
        const o = this.grab * 3;
        pos[o] = this.grabTarget[0];
        pos[o + 1] = this.grabTarget[1];
        pos[o + 2] = this.grabTarget[2];
      }


      const inv = 1 / h;
      for (let k = 0; k < n; k++) {
        if (this.kin[k] || w[k] === 0) continue;
        const o = k * 3;
        vel[o] = (pos[o] - prev[o]) * inv;
        vel[o + 1] = (pos[o + 1] - prev[o + 1]) * inv;
        vel[o + 2] = (pos[o + 2] - prev[o + 2]) * inv;
      }
    }

    // The held particle carries the velocity of the hand, so letting go throws
    // the cloth instead of dropping it dead.
    if (this.grab >= 0) {
      const o = this.grab * 3;
      const inv = 1 / dt;
      vel[o] = (this.grabTarget[0] - this.grabPrev[0]) * inv;
      vel[o + 1] = (this.grabTarget[1] - this.grabPrev[1]) * inv;
      vel[o + 2] = (this.grabTarget[2] - this.grabPrev[2]) * inv;
      this.grabPrev[0] = this.grabTarget[0];
      this.grabPrev[1] = this.grabTarget[1];
      this.grabPrev[2] = this.grabTarget[2];
    }

    this.updatePlasticity(dt);
    this.computeNormals();
    this.computeFold();
  }

  solveDistance(alpha, maxMove) {
    const { pos, w, dIdx, dRest, dLam } = this;
    const dn = this.dn;
    for (let c = 0; c < dn; c++) {
      const a = dIdx[c * 2], b = dIdx[c * 2 + 1];
      const wa = w[a], wb = w[b];
      const wsum = wa + wb;
      if (wsum === 0) continue;
      const ao = a * 3, bo = b * 3;
      let dx = pos[ao] - pos[bo];
      let dy = pos[ao + 1] - pos[bo + 1];
      let dz = pos[ao + 2] - pos[bo + 2];
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len < 1e-9) continue;
      const C = len - dRest[c];
      const dl = (-C - alpha * dLam[c]) / (wsum + alpha);
      dLam[c] += dl;
      let s = dl / len;
      const mag = Math.abs(dl);
      if (mag * wsum > maxMove) s *= maxMove / (mag * wsum);
      dx *= s; dy *= s; dz *= s;
      if (wa) { pos[ao] += dx * wa; pos[ao + 1] += dy * wa; pos[ao + 2] += dz * wa; }
      if (wb) { pos[bo] -= dx * wb; pos[bo + 1] -= dy * wb; pos[bo + 2] -= dz * wb; }
    }
  }

  // Long range attachment. A point of cloth can never be further from its
  // anchor than the material between them, so this is an inequality: it only
  // bites when the sheet is overstretched. One sweep of it removes the sag
  // that Gauss-Seidel would need dozens of iterations to squeeze out.
  solveTethers() {
    if (this.rimHeld) return;
    const { nx, ny, pos, w } = this;
    const jA = this.anchorRow;
    const sp = this.rowSpacing;
    for (let i = 0; i < nx; i++) {
      // Only tether a column that actually hangs from something. On a disc the
      // outer columns have no cloth at the anchor row, and tethering them to a
      // dead cell out there holds the whole sheet rigid.
      const ak = jA * nx + i;
      if (!this.act[ak] || !this.hold[ak]) continue;
      const ao = ak * 3;
      const ax = pos[ao], ay = pos[ao + 1], az = pos[ao + 2];
      for (let j = jA + 1; j < ny; j++) {
        const k = j * nx + i;
        if (w[k] === 0) continue;
        const o = k * 3;
        const dx = pos[o] - ax, dy = pos[o + 1] - ay, dz = pos[o + 2] - az;
        const d2 = dx * dx + dy * dy + dz * dz;
        const lim = (j - jA) * sp;
        if (d2 <= lim * lim) continue;
        const len = Math.sqrt(d2);
        const s = lim / len;
        pos[o] = ax + dx * s;
        pos[o + 1] = ay + dy * s;
        pos[o + 2] = az + dz * s;
      }
    }
  }

  // Dihedral angle constraint, Mueller 2007 gradients wrapped in XPBD.
  // theta is signed: positive means the two wings lift toward +z, so the
  // hinge reads as a valley when seen from the front.
  solveBend(alpha, maxMove, record) {
    const { pos, w, bIdx, bRest, bLam, bTheta } = this;
    const bn = this.bn;
    const S_FLOOR = 0.05;
    for (let c = 0; c < bn; c++) {
      const o = c * 4;
      const i1 = bIdx[o], i2 = bIdx[o + 1], i3 = bIdx[o + 2], i4 = bIdx[o + 3];
      const w1 = w[i1], w2 = w[i2], w3 = w[i3], w4 = w[i4];
      if (w1 + w2 + w3 + w4 === 0) { if (record) bTheta[c] = 0; continue; }
      const o1 = i1 * 3, o2 = i2 * 3, o3 = i3 * 3, o4 = i4 * 3;
      const x1 = pos[o1], y1 = pos[o1 + 1], z1 = pos[o1 + 2];
      const ex = pos[o2] - x1, ey = pos[o2 + 1] - y1, ez = pos[o2 + 2] - z1;
      const ax = pos[o3] - x1, ay = pos[o3 + 1] - y1, az = pos[o3 + 2] - z1;
      const bx = pos[o4] - x1, by = pos[o4 + 1] - y1, bz = pos[o4 + 2] - z1;

      let n1x = ey * az - ez * ay, n1y = ez * ax - ex * az, n1z = ex * ay - ey * ax;
      let n2x = ey * bz - ez * by, n2y = ez * bx - ex * bz, n2z = ex * by - ey * bx;
      const l1 = Math.sqrt(n1x * n1x + n1y * n1y + n1z * n1z);
      const l2 = Math.sqrt(n2x * n2x + n2y * n2y + n2z * n2z);
      if (l1 < 1e-12 || l2 < 1e-12) { if (record) bTheta[c] = 0; continue; }
      const il1 = 1 / l1, il2 = 1 / l2;
      n1x *= il1; n1y *= il1; n1z *= il1;
      n2x *= il2; n2y *= il2; n2z *= il2;

      let d = n1x * n2x + n1y * n2y + n1z * n2z;
      if (d > 1) d = 1; else if (d < -1) d = -1;
      const rest = bRest[c];

      // A dead flat hinge is a singular point of this constraint: at d = -1
      // every q vector is exactly zero, so the correction is zero no matter
      // what the rest angle says. A hinge that remembers a fold could never
      // start folding again. Flat and unset is the common case and just exits;
      // flat but creased gets a nudge to break the symmetry, after which the
      // constraint proper takes over.
      if (d < -0.99995) {
        if (record) bTheta[c] = 0;
        if (rest > 1e-3 || rest < -1e-3) {
          const ar = rest < 0 ? -rest : rest;
          const amt = (rest < 0 ? -1 : 1) * this.cell * 0.004 * (ar < 1 ? ar : 1);
          const ax1 = n1x * amt, ay1 = n1y * amt, az1 = n1z * amt;
          if (w3) { pos[o3] += ax1; pos[o3 + 1] += ay1; pos[o3 + 2] += az1; }
          if (w4) { pos[o4] += ax1; pos[o4 + 1] += ay1; pos[o4 + 2] += az1; }
          if (w1) { pos[o1] -= ax1 * 0.5; pos[o1 + 1] -= ay1 * 0.5; pos[o1 + 2] -= az1 * 0.5; }
          if (w2) { pos[o2] -= ax1 * 0.5; pos[o2 + 1] -= ay1 * 0.5; pos[o2 + 2] -= az1 * 0.5; }
        }
        continue;
      }

      // Signed fold angle. Flat is d = -1, which is theta 0.
      const cx = n1y * n2z - n1z * n2y;
      const cy = n1z * n2x - n1x * n2z;
      const cz = n1x * n2y - n1y * n2x;
      const sgn = (cx * ex + cy * ey + cz * ez) >= 0 ? 1 : -1;
      const theta = sgn * (PI - Math.acos(d));
      if (record) bTheta[c] = theta;

      const C = theta - rest;
      if (C > -3e-4 && C < 3e-4) continue;

      let sq = Math.sqrt(Math.max(1e-8, 1 - d * d));
      if (sq < S_FLOOR) sq = S_FLOOR;

      // q vectors are the gradients of d with respect to each point.
      const q3x = (ey * n2z - ez * n2y + (n1y * ez - n1z * ey) * d) * il1;
      const q3y = (ez * n2x - ex * n2z + (n1z * ex - n1x * ez) * d) * il1;
      const q3z = (ex * n2y - ey * n2x + (n1x * ey - n1y * ex) * d) * il1;
      const q4x = (ey * n1z - ez * n1y + (n2y * ez - n2z * ey) * d) * il2;
      const q4y = (ez * n1x - ex * n1z + (n2z * ex - n2x * ez) * d) * il2;
      const q4z = (ex * n1y - ey * n1x + (n2x * ey - n2y * ex) * d) * il2;
      const t1x = -(ay * n2z - az * n2y + (n1y * az - n1z * ay) * d) * il1;
      const t1y = -(az * n2x - ax * n2z + (n1z * ax - n1x * az) * d) * il1;
      const t1z = -(ax * n2y - ay * n2x + (n1x * ay - n1y * ax) * d) * il1;
      const t2x = -(by * n1z - bz * n1y + (n2y * bz - n2z * by) * d) * il2;
      const t2y = -(bz * n1x - bx * n1z + (n2z * bx - n2x * bz) * d) * il2;
      const t2z = -(bx * n1y - by * n1x + (n2x * by - n2y * bx) * d) * il2;
      const q2x = t1x + t2x, q2y = t1y + t2y, q2z = t1z + t2z;
      const q1x = -(q2x + q3x + q4x), q1y = -(q2y + q3y + q4y), q1z = -(q2z + q3z + q4z);

      // grad(theta) = -sgn * q / sqrt(1 - d^2). The q vectors from the
      // Mueller derivation are the gradients of -d, not of d, so the sign
      // matters: get it wrong and the constraint amplifies bends instead of
      // resisting them. Verified against a finite difference.
      const k = -sgn / sq;
      const g1x = q1x * k, g1y = q1y * k, g1z = q1z * k;
      const g2x = q2x * k, g2y = q2y * k, g2z = q2z * k;
      const g3x = q3x * k, g3y = q3y * k, g3z = q3z * k;
      const g4x = q4x * k, g4y = q4y * k, g4z = q4z * k;

      const gg1 = g1x * g1x + g1y * g1y + g1z * g1z;
      const gg2 = g2x * g2x + g2y * g2y + g2z * g2z;
      const gg3 = g3x * g3x + g3y * g3y + g3z * g3z;
      const gg4 = g4x * g4x + g4y * g4y + g4z * g4z;
      const denom = w1 * gg1 + w2 * gg2 + w3 * gg3 + w4 * gg4;
      if (denom < 1e-12) continue;

      let dl = (-C - alpha * bLam[c]) / (denom + alpha);
      bLam[c] += dl;

      // Clamp the largest single move so a bad frame cannot explode.
      let gm = w1 * w1 * gg1;
      const m2 = w2 * w2 * gg2; if (m2 > gm) gm = m2;
      const m3 = w3 * w3 * gg3; if (m3 > gm) gm = m3;
      const m4 = w4 * w4 * gg4; if (m4 > gm) gm = m4;
      const gmax = Math.sqrt(gm);
      const adl = dl < 0 ? -dl : dl;
      if (gmax > 0 && adl * gmax > maxMove) dl = (dl < 0 ? -1 : 1) * maxMove / gmax;

      if (w1) { const m = w1 * dl; pos[o1] += g1x * m; pos[o1 + 1] += g1y * m; pos[o1 + 2] += g1z * m; }
      if (w2) { const m = w2 * dl; pos[o2] += g2x * m; pos[o2 + 1] += g2y * m; pos[o2 + 2] += g2z * m; }
      if (w3) { const m = w3 * dl; pos[o3] += g3x * m; pos[o3 + 1] += g3y * m; pos[o3 + 2] += g3z * m; }
      if (w4) { const m = w4 * dl; pos[o4] += g4x * m; pos[o4 + 1] += g4y * m; pos[o4 + 2] += g4z * m; }
    }
  }

  // The crease memory. Bend past the yield angle and the hinge keeps a share
  // of the excess as a new rest angle. Everything then creeps back to flat on
  // a long time constant, so fresh folds are sharp and old ones fade.
  updatePlasticity(dt) {
    const { bRest, bTheta, bPrev } = this;
    const bn = this.bn;
    const yieldA = P.yield;
    const yieldR = P.yieldRate;
    const invDt = 1 / Math.max(dt, 1e-6);
    const rate = P.plastic;
    const relax = Math.exp(-dt / Math.max(0.5, P.relax));
    const MAXF = 2.3;
    for (let c = 0; c < bn; c++) {
      let r = bRest[c];
      const th = bTheta[c];
      const at = th < 0 ? -th : th;

      // Whatever bend sits beyond the yield angle is the set the hinge wants
      // to take. A hinge only ever takes a deeper set, never a shallower one:
      // a cloth under tension gets ironed flat within a second, and if the
      // rest angle followed it back down there would be no memory at all.
      // Forgetting is the relax term's job and nothing else's.
      // How fast this hinge is folding right now.
      const dth = th - bPrev[c];
      const speed = (dth < 0 ? -dth : dth) * invDt;
      bPrev[c] = th;

      if (at > yieldA && speed > yieldR) {
        const target = th - (th < 0 ? -yieldA : yieldA);
        const atg = target < 0 ? -target : target;
        const ar = r < 0 ? -r : r;
        if (atg > ar) r += rate * (target - r);
      }

      r *= relax;
      if (r > MAXF) r = MAXF; else if (r < -MAXF) r = -MAXF;
      bRest[c] = r;
    }
  }

  // Falling from flat into its hanging shape is itself a fast fold, so the
  // cloth would arrive already creased by its own settling. Wipe the memory
  // once it has found its shape: the piece starts pristine and every crease
  // after that was earned by a tick.
  clearCreases() {
    this.bRest.fill(0);
    this.bPrev.set(this.bTheta);
    this.fold.fill(0);
  }

  computeNormals() {
    const { pos, nrm, tri } = this;
    nrm.fill(0);
    const m = tri.length;
    for (let t = 0; t < m; t += 3) {
      const a = tri[t] * 3, b = tri[t + 1] * 3, c = tri[t + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz;
      nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz;
      nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
    }
    for (let k = 0; k < this.n; k++) {
      const o = k * 3;
      const l = Math.sqrt(nrm[o] * nrm[o] + nrm[o + 1] * nrm[o + 1] + nrm[o + 2] * nrm[o + 2]);
      if (l > 1e-12) { nrm[o] /= l; nrm[o + 1] /= l; nrm[o + 2] /= l; }
      else { nrm[o] = 0; nrm[o + 1] = 0; nrm[o + 2] = 1; }
    }
  }

  // Per vertex fold data for the shader.
  // x is unsigned crease strength, live bend plus remembered bend.
  // y is signed curvature, positive means a valley facing the viewer.
  computeFold() {
    const { fold, foldW, bIdx, bRest, bTheta } = this;
    fold.fill(0);
    foldW.fill(0);
    const bn = this.bn;
    for (let c = 0; c < bn; c++) {
      const o = c * 4;
      const th = bTheta[c];
      const rs = bRest[c];
      const mag = (th < 0 ? -th : th) * 0.55 + (rs < 0 ? -rs : rs) * 1.0;
      const sg = th * 0.6 + rs * 0.8;
      for (let s = 0; s < 4; s++) {
        const v = bIdx[o + s];
        const wt = s < 2 ? 1.0 : 0.35;
        fold[v * 2] += mag * wt;
        fold[v * 2 + 1] += sg * wt;
        foldW[v] += wt;
      }
    }
    for (let k = 0; k < this.n; k++) {
      const iw = foldW[k] > 0 ? 1 / foldW[k] : 0;
      fold[k * 2] *= iw;
      fold[k * 2 + 1] *= iw;
    }
  }

  // A hammer, not a push. One velocity kick, spread over a few cells.
  impulseAtUV(u, v, strength, radiusCells) {
    const { nx, ny, vel, nrm, kin, w } = this;
    const ci = u * (nx - 1);
    const cj = (1 - v) * (ny - 1);
    const r = radiusCells;
    const i0 = Math.max(0, Math.floor(ci - r * 2)), i1 = Math.min(nx - 1, Math.ceil(ci + r * 2));
    const j0 = Math.max(0, Math.floor(cj - r * 2)), j1 = Math.min(ny - 1, Math.ceil(cj + r * 2));
    const inv2r2 = 1 / (2 * r * r);
    let hit = 0;
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const k = j * nx + i;
        if (kin[k] || w[k] === 0) continue;
        const dx = i - ci, dy = j - cj;
        const f = Math.exp(-(dx * dx + dy * dy) * inv2r2);
        if (f < 0.01) continue;
        const o = k * 3;
        const s = strength * f;
        vel[o] -= nrm[o] * s;
        vel[o + 1] -= nrm[o + 1] * s;
        vel[o + 2] -= nrm[o + 2] * s;
        hit++;
      }
    }
    return hit;
  }

  // A fold that runs the full width at a given height.
  impulseRow(v, strength) {
    const { nx, ny, vel, nrm, kin, w } = this;
    const cj = Math.round((1 - v) * (ny - 1));
    const spread = 2.2;
    for (let j = Math.max(0, cj - 5); j <= Math.min(ny - 1, cj + 5); j++) {
      const dj = j - cj;
      const f = Math.exp(-(dj * dj) / (2 * spread * spread));
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        if (kin[k] || w[k] === 0) continue;
        const prof = 0.45 + 0.55 * Math.sin((i / (nx - 1)) * PI);
        const o = k * 3;
        const s = strength * f * prof;
        vel[o] -= nrm[o] * s;
        vel[o + 1] -= nrm[o + 1] * s;
        vel[o + 2] -= nrm[o + 2] * s;
      }
    }
  }

  // Press a fold straight into the memory. Used on the hour so the mark is
  // there before the wave even settles.
  imprintFold(v, amount) {
    const { ny, bIdx, bRest, nx } = this;
    const cj = (1 - v) * (ny - 1);
    const bn = this.bn;
    for (let c = 0; c < bn; c++) {
      const p1 = bIdx[c * 4];
      const j = Math.floor(p1 / nx);
      const dj = j - cj;
      const f = Math.exp(-(dj * dj) / 8);
      if (f < 0.02) continue;
      let r = bRest[c] + amount * f;
      if (r > 2.3) r = 2.3; else if (r < -2.3) r = -2.3;
      bRest[c] = r;
    }
  }

  nearestFree(x, y, z) {
    const { pos, kin, w } = this;
    let best = -1, bd = Infinity;
    for (let k = 0; k < this.n; k++) {
      if (kin[k] || w[k] === 0) continue;
      const o = k * 3;
      const dx = pos[o] - x, dy = pos[o + 1] - y, dz = pos[o + 2] - z;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }

  hasNaN() {
    for (let k = 0; k < this.pos.length; k++) if (!Number.isFinite(this.pos[k])) return true;
    return false;
  }

  bounds() {
    let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
    for (let k = 0; k < this.n; k++) {
      const o = k * 3;
      if (this.pos[o] < mnx) mnx = this.pos[o];
      if (this.pos[o] > mxx) mxx = this.pos[o];
      if (this.pos[o + 1] < mny) mny = this.pos[o + 1];
      if (this.pos[o + 1] > mxy) mxy = this.pos[o + 1];
      if (this.pos[o + 2] < mnz) mnz = this.pos[o + 2];
      if (this.pos[o + 2] > mxz) mxz = this.pos[o + 2];
    }
    return [mnx, mny, mnz, mxx, mxy, mxz];
  }
}
