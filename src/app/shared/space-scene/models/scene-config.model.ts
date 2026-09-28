type Range = Readonly<{ min: number; max: number }>;
type Ramp = readonly [string, string, string, string, string];

export interface SceneConfig {
  readonly matter: Readonly<{
    density: number;
    reserve: number;
    phoneShare: number;
    entrySpan: number;
    colors: Readonly<{ hot: string; core: Ramp; matter: Ramp }>;
  }>;
  readonly sky: Readonly<{
    pixelsPerStar: number;
    phoneStarRatio: number;
    drift: number;
    panParallax: number;
    cursorReach: number;
    trail: Readonly<{ seconds: number; from: number }>;
  }>;
  readonly canvas: Readonly<{
    pixelBudget: number;
    maxPixelRatio: number;
    phoneMaxPixelRatio: number;
  }>;
  readonly camera: Readonly<{
    orbitRate: number;
    restScale: Range;
    zoom: Readonly<{ min: number; max: number; closeLook: number }>;
  }>;
  readonly hand: Readonly<{
    friction: number;
    speedWindowMs: number;
    stillMs: number;
    maxSpeed: number;
    orbitsDragRatio: number;
    orbitsDragLag: number;
  }>;
  readonly gestures: Readonly<{
    dragPx: number;
    tapMs: number;
    doubleTapMs: number;
    doubleTapPx: number;
    wheelNotchRatio: number;
  }>;
  readonly planets: Readonly<{ gap: number }>;
  readonly figures: Readonly<{
    targetMin: number;
    labelSize: number;
    labelSpacing: number;
    light: Readonly<{ unlit: number; unlitWhenShown: number; hovered: number }>;
  }>;
}

export const SCENE_CONFIG: SceneConfig = {
  matter: {
    density: 3800,
    reserve: 1.9,
    phoneShare: 0.6,
    entrySpan: 6.2,
    colors: {
      hot: '#ffe6c2',
      core: ['#e7f2fb', '#e2eefa', '#ffe6c2', '#fbd9ad', '#f0bb87'],
      matter: ['#d2e6f7', '#d8e3f0', '#dfe4ee', '#ebdfd0', '#e2cbad'],
    },
  },
  sky: {
    pixelsPerStar: 3600,
    phoneStarRatio: 2,
    drift: 0.34,
    panParallax: 0.55,
    cursorReach: 70,
    trail: { seconds: 9 / 60, from: 0.45 * 60 },
  },
  canvas: {
    pixelBudget: 4_200_000,
    maxPixelRatio: 2,
    phoneMaxPixelRatio: 1.5,
  },
  camera: {
    orbitRate: 0.42,
    restScale: { min: 0.07, max: 0.42 },
    zoom: { min: 1, max: 3, closeLook: 2.2 },
  },
  hand: {
    friction: 1.4,
    speedWindowMs: 90,
    stillMs: 60,
    maxSpeed: 14,
    orbitsDragRatio: 0.4,
    orbitsDragLag: 0.55,
  },
  gestures: {
    dragPx: 6,
    tapMs: 300,
    doubleTapMs: 320,
    doubleTapPx: 32,
    wheelNotchRatio: 1.1,
  },
  planets: {
    gap: 58,
  },
  figures: {
    targetMin: 44,
    labelSize: 11,
    labelSpacing: 0.14,
    light: { unlit: 0.2, unlitWhenShown: 0.45, hovered: 0.7 },
  },
};
