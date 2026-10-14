// The parameters the panel exposes, in the order they appear.
// key must match a uniform name minus the u prefix, unless virtual is set.
export const PARAMS = [
  { key: 'petals',    label: 'petals',      min: 5,    max: 24,   step: 1,      value: 16 },
  { key: 'loopLen',   label: 'loop length', min: 0.12, max: 0.52, step: 0.005,  value: 0.335 },
  { key: 'loopWidth', label: 'loop width',  min: 0.02, max: 0.22, step: 0.002,  value: 0.086 },
  { key: 'stroke',    label: 'loop softness', min: 0.002, max: 0.020, step: 0.0005, value: 0.0062 },
  { key: 'spread',    label: 'fan drift',   min: 0.0,  max: 0.30, step: 0.005,  value: 0.075 },
  { key: 'shadow',    label: 'lower shadow', min: 0.0, max: 1.0,  step: 0.01,   value: 0.72 },
  { key: 'rotRate',   label: 'turn, minutes', min: 1,  max: 30,   step: 0.5,    value: 6, virtual: true },
  { key: 'breathe',   label: 'breathe',     min: 0.0,  max: 0.40, step: 0.005,  value: 0.135 },
  { key: 'rayLen',    label: 'ray length',  min: 0.15, max: 0.90, step: 0.01,   value: 0.60 },
  { key: 'haze',      label: 'haze',        min: 0.0,  max: 2.0,  step: 0.02,   value: 0.92 },
  { key: 'hazeH',     label: 'haze height', min: 0.02, max: 0.30, step: 0.005,  value: 0.098 },
  { key: 'grain',     label: 'grain',       min: 0.0,  max: 1.0,  step: 0.01,   value: 0.86 },
  { key: 'tooth',     label: 'tooth scale', min: 80,   max: 900,  step: 5,      value: 360 },
  { key: 'exposure',  label: 'exposure',    min: 0.2,  max: 3.0,  step: 0.01,   value: 1.32 },
  { key: 'timeScale', label: 'time scale',  min: 0.25, max: 60,   step: 0.25,   value: 1, virtual: true }
];
