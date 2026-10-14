// ink lab, controls.
// every slider writes straight into one flat params object that main.js reads
// when it sets uniforms. groups follow the two stages, in the order the frame
// travels through them.

const UI = (() => {

const P = {
  // stage 1, wind
  ambient: 0.85,
  push: 1.6,
  gustGain: 1.0,
  foliageAmp: 4.2,
  flutterAmp: 1.1,
  trunkLag: 0.22,
  flowerAmp: 1.8,
  flowerTwinkle: 0.06,
  waveAmp: 3.4,
  wavePeriod: 7.5,
  waveCount: 6.5,
  waveComp: 0.55,
  shimmer: 0.42,
  skyDrift: 0.7,
  twinkle: 0.10,

  // stage 2, tonal wash
  inkMix: 1.0,
  chroma: 0.28,
  blackLift: 0.22,
  whiteCrush: 0.70,
  duotone: 0.45,
  exposure: 1.22,

  // stage 2, bleed and pigment
  bleedRadius: 2.6,
  bleedAmount: 0.45,
  bleedThresh: 0.30,
  bleedSoft: 0.16,
  ragged: 0.22,
  creep: 0.012,
  rim: 0.24,
  rimWidth: 0.28,
  granulation: 0.18,

  // stage 2, light and sheet
  halation: 0.18,
  haloRadius: 3.5,
  darkHalo: 0.16,
  haloHi: 0.42,
  haloLo: 0.16,
  paperFibre: 0.45,
  dust: 0.25,
  vignette: 0.45,
  reg: 1.4,
  grain: 0.10,

  // print furniture
  blockShow: 0.85,
  blockSize: 0.34,
  blockReg: 2.2,
  wordShow: 0.9,
  wordSize: 0.62,
  wordText: 'wairere',

  // segmentation
  skyLine: 0.42,
  darkLevel: 0.22,
  greenHue: 110,
  greenSpan: 62,
  flowerHue: 262,
  roadLum: 0.52,
  streak: 0.045,
  texture: 0.010,

  // state
  debug: 0,
  paused: 0
};

const GROUPS = [
  ['stage 1, wind', [
    ['ambient', 'ambient breeze', 0, 1.6, 0.01],
    ['gustGain', 'gust response', 0, 2.5, 0.01],
    ['push', 'pointer push', 0, 4, 0.01],
    ['foliageAmp', 'canopy sway, px', 0, 14, 0.1],
    ['flutterAmp', 'leaf flutter, px', 0, 4, 0.05],
    ['trunkLag', 'trunk lag, sec', 0, 0.8, 0.01],
    ['flowerAmp', 'shrub shiver, px', 0, 6, 0.05],
    ['flowerTwinkle', 'shrub twinkle', 0, 0.3, 0.005],
    ['waveAmp', 'wave travel, px', 0, 12, 0.1],
    ['wavePeriod', 'wave set, sec', 4, 14, 0.1],
    ['waveCount', 'crest lines', 3, 22, 0.5],
    ['waveComp', 'crest crowding', 0, 2.5, 0.05],
    ['shimmer', 'crest sparkle', 0, 1.2, 0.01],
    ['skyDrift', 'sky drift, px', 0, 3, 0.05],
    ['twinkle', 'star twinkle', 0, 0.4, 0.005]
  ]],
  ['stage 2, tonal wash', [
    ['inkMix', 'painting to ink', 0, 1, 0.01],
    ['chroma', 'chroma kept', 0, 1, 0.01],
    ['blackLift', 'lift the blacks', 0, 0.6, 0.01],
    ['whiteCrush', 'whites to paper', 0, 1, 0.01],
    ['duotone', 'salmon duotone', 0, 1, 0.01],
    ['exposure', 'exposure', 0.4, 2.2, 0.01]
  ]],
  ['stage 2, bleed', [
    ['bleedRadius', 'bleed radius', 0, 8, 0.05],
    ['bleedAmount', 'bleed amount', 0, 1, 0.01],
    ['bleedThresh', 'wet front', 0.02, 0.9, 0.005],
    ['bleedSoft', 'front softness', 0.01, 0.5, 0.005],
    ['ragged', 'ragged edge', 0, 0.7, 0.005],
    ['creep', 'front creep', 0, 0.06, 0.001],
    ['rim', 'edge pigment', 0, 1.4, 0.01],
    ['rimWidth', 'rim width', 0.02, 1.4, 0.01],
    ['granulation', 'granulation', 0, 0.8, 0.01]
  ]],
  ['stage 2, light and sheet', [
    ['halation', 'halation', 0, 1.4, 0.01],
    ['haloRadius', 'halation radius', 0, 10, 0.05],
    ['darkHalo', 'dark halo', 0, 0.8, 0.01],
    ['haloHi', 'light threshold', 0, 1, 0.01],
    ['haloLo', 'dark threshold', 0, 0.6, 0.01],
    ['paperFibre', 'paper fibre', 0, 1, 0.01],
    ['dust', 'dust specks', 0, 1, 0.01],
    ['vignette', 'deckle edge', 0, 1, 0.01],
    ['reg', 'registration, px', 0, 4, 0.05],
    ['grain', 'grain', 0, 0.4, 0.005]
  ]],
  ['print furniture', [
    ['blockShow', 'salmon block', 0, 1, 0.01],
    ['blockSize', 'block size', 0.1, 0.9, 0.005],
    ['blockReg', 'block offset, px', 0, 8, 0.1],
    ['wordShow', 'wordmark', 0, 1, 0.01],
    ['wordSize', 'wordmark size', 0.2, 1.2, 0.01]
  ]],
  ['segmentation', [
    ['skyLine', 'sky line', 0.1, 0.8, 0.005],
    ['darkLevel', 'near black', 0.05, 0.5, 0.005],
    ['greenHue', 'bush hue', 50, 190, 1],
    ['greenSpan', 'bush hue span', 20, 120, 1],
    ['flowerHue', 'flower hue', 190, 320, 1],
    ['roadLum', 'road brightness', 0.2, 0.9, 0.005],
    ['streak', 'surf streaking', 0.005, 0.15, 0.001],
    ['texture', 'foliage texture', 0.001, 0.05, 0.001]
  ]]
];

const SCENE_KEYS = ['waveCount', 'waveComp'];
const SEG_KEYS = ['skyLine', 'darkLevel', 'greenHue', 'greenSpan', 'flowerHue', 'roadLum', 'streak', 'texture'];

const PRESETS = {
  'painting only': {
    inkMix: 0, duotone: 0, bleedAmount: 0, rim: 0, granulation: 0.05, halation: 0.10,
    darkHalo: 0, paperFibre: 0.05, dust: 0.05, vignette: 0.12, reg: 0, grain: 0.03,
    blockShow: 0, wordShow: 0, chroma: 1, blackLift: 0, whiteCrush: 0, exposure: 1.0, debug: 0
  },
  'half bleed': {
    inkMix: 0.55, chroma: 0.55, blackLift: 0.12, whiteCrush: 0.45, duotone: 0.22, exposure: 1.15,
    bleedRadius: 2.0, bleedAmount: 0.32, rim: 0.20, granulation: 0.18, halation: 0.20,
    darkHalo: 0.08, paperFibre: 0.25, dust: 0.18, vignette: 0.3, reg: 0.8, grain: 0.09,
    blockShow: 0.4, wordShow: 0.55, debug: 0
  },
  'full print': {
    inkMix: 1, chroma: 0.24, blackLift: 0.26, whiteCrush: 0.74, duotone: 0.52, exposure: 1.24,
    bleedRadius: 3.1, bleedAmount: 0.62, bleedThresh: 0.28, bleedSoft: 0.15, ragged: 0.26,
    creep: 0.014, rim: 0.26, rimWidth: 0.28, granulation: 0.20, halation: 0.20, haloRadius: 4.0,
    darkHalo: 0.16, paperFibre: 0.52, dust: 0.30, vignette: 0.5, reg: 1.6, grain: 0.11,
    blockShow: 0.9, wordShow: 0.95, debug: 0
  },
  'mask debug': { debug: 1 }
};

let panel, toggle, hooks = {}, activePreset = 'full print';
const inputs = {};

function row(parent, key, label, min, max, step) {
  const r = document.createElement('div');
  r.className = 'row';
  const l = document.createElement('label');
  l.textContent = label;
  const v = document.createElement('span');
  v.className = 'val';
  const s = document.createElement('input');
  s.type = 'range';
  s.min = min; s.max = max; s.step = step; s.value = P[key];
  const show = () => { v.textContent = (+P[key]).toFixed(step < 0.01 ? 3 : step < 1 ? 2 : 0); };
  show();
  s.addEventListener('input', () => {
    P[key] = parseFloat(s.value);
    show();
    markDirty();
    if (SEG_KEYS.indexOf(key) >= 0 && hooks.onSeg) hooks.onSeg();
    if (SCENE_KEYS.indexOf(key) >= 0 && hooks.onScene) hooks.onScene();
  });
  r.appendChild(l); r.appendChild(v); r.appendChild(s);
  parent.appendChild(r);
  inputs[key] = { slider: s, show };
}

function markDirty() {
  activePreset = null;
  paintPresets();
}

let presetButtons = [];
function paintPresets() {
  presetButtons.forEach(b => b.dataset.on = (b.textContent === activePreset) ? '1' : '0');
}

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  if (name === 'mask debug') {
    P.debug = P.debug ? 0 : 1;
  } else {
    Object.keys(p).forEach(k => { P[k] = p[k]; });
  }
  Object.keys(inputs).forEach(k => {
    inputs[k].slider.value = P[k];
    inputs[k].show();
  });
  activePreset = name === 'mask debug' ? activePreset : name;
  paintPresets();
}

function build() {
  panel = document.getElementById('panel');
  toggle = document.getElementById('toggle');

  const pres = document.createElement('div');
  pres.className = 'presets';
  Object.keys(PRESETS).forEach(name => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = name;
    b.addEventListener('click', () => applyPreset(name));
    pres.appendChild(b);
    presetButtons.push(b);
  });
  panel.appendChild(pres);

  const src = document.createElement('div');
  src.className = 'presets';
  const pick = document.createElement('button');
  pick.type = 'button';
  pick.textContent = 'load image';
  pick.addEventListener('click', () => document.getElementById('file').click());
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'use fallback';
  reset.addEventListener('click', () => hooks.onFallback && hooks.onFallback());
  src.appendChild(pick); src.appendChild(reset);
  panel.appendChild(src);

  const tr = document.createElement('div');
  tr.className = 'textrow';
  const ti = document.createElement('input');
  ti.type = 'text';
  ti.value = P.wordText;
  ti.placeholder = 'wordmark';
  ti.addEventListener('input', () => {
    P.wordText = ti.value;
    if (hooks.onWord) hooks.onWord();
  });
  tr.appendChild(ti);
  panel.appendChild(tr);

  GROUPS.forEach(([title, rows]) => {
    const h = document.createElement('h2');
    h.textContent = title;
    panel.appendChild(h);
    rows.forEach(r => row(panel, r[0], r[1], r[2], r[3], r[4]));
  });

  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = 'drag across the canvas to push wind. h hides this panel, m shows the masks, space pauses.';
  panel.appendChild(note);

  panel.hidden = true;
  toggle.addEventListener('click', () => { panel.hidden = !panel.hidden; });

  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'h') { panel.hidden = !panel.hidden; }
    else if (e.key === 'm') { P.debug = P.debug ? 0 : 1; }
    else if (e.code === 'Space') { e.preventDefault(); P.paused = P.paused ? 0 : 1; if (hooks.onPause) hooks.onPause(); }
  });

  paintPresets();
}

function segOpts() {
  return {
    skyLine: P.skyLine, darkLevel: P.darkLevel, greenHue: P.greenHue, greenSpan: P.greenSpan,
    flowerHue: P.flowerHue, roadLum: P.roadLum, streak: P.streak, texture: P.texture
  };
}

return { P, build, segOpts, applyPreset, hooks };
})();
