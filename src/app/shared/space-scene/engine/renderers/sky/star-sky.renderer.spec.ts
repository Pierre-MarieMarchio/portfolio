import { SkyCamera, StarSkyRenderer } from './star-sky.renderer';
import {
  ARRIVED,
  Traveling,
  traveling,
} from '../../../rules/camera/traveling.rules';
import { seededRandom } from '@testing/doubles/seeded-random.double';

interface Stroke {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly alpha: number;
}

const trailRecorder = () => {
  const strokes: Stroke[] = [];
  let from = { x: 0, y: 0 };
  let to = { x: 0, y: 0 };
  const ctx = {
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '' as unknown,
    lineCap: '',
    lineWidth: 1,
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    moveTo: (x: number, y: number) => {
      from = { x, y };
    },
    lineTo: (x: number, y: number) => {
      to = { x, y };
    },
    stroke: () => {
      strokes.push({
        x0: from.x,
        y0: from.y,
        x1: to.x,
        y1: to.y,
        alpha: ctx.globalAlpha,
      });
    },
    createLinearGradient: () => ({ addColorStop: () => {} }),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, strokes };
};

interface StarView {
  readonly px: number;
  readonly py: number;
  readonly ray: number;
}
const starsOf = (sky: StarSkyRenderer): readonly StarView[] =>
  (sky as unknown as { stars: StarView[] }).stars;

const W = 1200;
const H = 800;

const FLATTENING_FROM = 7.6;
const FLATTENING_UNTIL = 8.4;
const FASTEST_FLIGHT = 5.2;
const SWING = 6.5;

const offRestCamera = (time: number, trv: Traveling = traveling(time, false)) =>
  ({
    time,
    reduced: false,
    pointer: null,
    dpr: 1,
    trv,
    azim: 0.4,
    elev: 0.18,
    scale: 1,
    camX: 0.5,
    camY: 0.5,
    hole: null,
    ink: '#000',
    accent: '#00f',
    entry: 1,
  }) satisfies SkyCamera;

const run = (hz: number, until: number) => {
  const sky = new StarSkyRenderer(seededRandom(7));
  const { ctx, strokes } = trailRecorder();
  const frames = Math.round(until * hz);
  let last: Stroke[] = [];
  for (let i = 0; i <= frames; i++) {
    strokes.length = 0;
    sky.draw(ctx, W, H, offRestCamera(i / hz));
    last = [...strokes];
  }
  return { sky, ctx, strokes: last };
};

const length = (s: Stroke): number => Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
const largestStep = (
  before: readonly { x: number; y: number }[],
  now: readonly { x: number; y: number }[],
): number => {
  let largest = 0;
  for (const [k, star] of now.entries()) {
    const was = before[k];
    if (!was || Number.isNaN(was.x) || Number.isNaN(star.x)) {
      continue;
    }
    const dx = Math.abs(star.x - was.x);
    const dy = Math.abs(star.y - was.y);
    const isWrappedRoundAnEdge = dx >= W / 2 || dy >= H / 2;
    if (!isWrappedRoundAnEdge) {
      largest = Math.max(largest, Math.hypot(dx, dy));
    }
  }
  return largest;
};
const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

describe('Sky', () => {
  it('draws trails of the same length whatever the frame rate', () => {
    const fast = run(60, FASTEST_FLIGHT).strokes.map((stroke) =>
      length(stroke),
    );
    const slow = run(20, FASTEST_FLIGHT).strokes.map((stroke) =>
      length(stroke),
    );

    expect(fast.length).toBeGreaterThan(20);
    expect(slow.length).toBeGreaterThan(20);
    expect(median(slow) / median(fast)).toBeGreaterThan(0.8);
    expect(median(slow) / median(fast)).toBeLessThan(1.25);
  });

  it('keeps a tunnel in the turn: the trails stream away from the vanishing point', () => {
    const { strokes } = run(60, SWING);
    const vanishingX = W / 2;
    const vanishingY = H / 2;
    const radial = strokes.filter((s) => {
      const hx = s.x0 - vanishingX;
      const hy = s.y0 - vanishingY;
      const tx = s.x0 - s.x1;
      const ty = s.y0 - s.y1;
      const cos =
        (hx * tx + hy * ty) / (Math.hypot(hx, hy) * Math.hypot(tx, ty) || 1);
      return cos > 0.85;
    });

    expect(strokes.length).toBeGreaterThan(20);
    expect(radial.length / strokes.length).toBeGreaterThan(0.75);
  });

  it('moves no star by a jump when the field is flattened at the end of the run', () => {
    const hz = 60;
    const sky = new StarSkyRenderer(seededRandom(11));
    const { ctx } = trailRecorder();
    let before: { x: number; y: number; ray: number }[] = [];
    let worst = 0;
    for (let i = 0; i <= Math.round(FLATTENING_UNTIL * hz); i++) {
      const time = i / hz;
      sky.draw(ctx, W, H, offRestCamera(time));
      const now = starsOf(sky).map((star) => ({
        x: star.px,
        y: star.py,
        ray: star.ray,
      }));
      if (time > FLATTENING_FROM) {
        worst = Math.max(worst, largestStep(before, now));
      }
      before = now;
    }
    expect(worst).toBeLessThan(8);
  });

  it('keeps the stars drifting out after the tunnel, until the object has landed', () => {
    const hz = 60;
    const sky = new StarSkyRenderer(seededRandom(3));
    const { ctx } = trailRecorder();
    const snapshots = new Map<number, { x: number; y: number }[]>();
    for (let i = 0; i <= Math.round(9.9 * hz); i++) {
      sky.draw(ctx, W, H, offRestCamera(i / hz));
      if ([8.4, 8.6, 9.7, 9.9].some((t) => i === Math.round(t * hz))) {
        snapshots.set(
          i,
          starsOf(sky).map((star) => ({ x: star.px, y: star.py })),
        );
      }
    }
    const moved = (a: number, b: number): number => {
      const from = snapshots.get(Math.round(a * hz)) ?? [];
      const to = snapshots.get(Math.round(b * hz)) ?? [];
      const steps = to
        .map((star, k) =>
          Math.hypot(
            star.x - (from[k]?.x ?? NaN),
            star.y - (from[k]?.y ?? NaN),
          ),
        )
        .filter((d) => Number.isFinite(d) && d < W / 2);
      return median(steps);
    };

    expect(moved(8.4, 8.6)).toBeGreaterThan(1);
    expect(moved(9.7, 9.9)).toBeLessThan(0.5);
  });

  it('draws no trail at rest, once the run is over', () => {
    const sky = new StarSkyRenderer(seededRandom(3));
    const { ctx, strokes } = trailRecorder();
    sky.draw(ctx, W, H, offRestCamera(12, ARRIVED));
    strokes.length = 0;
    sky.draw(ctx, W, H, offRestCamera(12.02, ARRIVED));

    expect(strokes).toHaveLength(0);
  });

  it('warms the GPU with trails nobody sees, on its first frame only', () => {
    const sky = new StarSkyRenderer(seededRandom(5));
    const { ctx, strokes } = trailRecorder();
    sky.draw(ctx, W, H, offRestCamera(0));
    const first = strokes.length;
    strokes.length = 0;
    sky.draw(ctx, W, H, offRestCamera(1 / 60));

    expect(first).toBeGreaterThan(0);
    expect(strokes).toHaveLength(0);
  });
});
