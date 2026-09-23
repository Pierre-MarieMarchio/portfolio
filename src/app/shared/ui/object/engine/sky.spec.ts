import { SkyCamera, Sky } from './sky';
import { ARRIVED, Traveling, traveling } from './traveling';

/** A seeded generator: the same sky on every run. */
const seeded = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

interface Stroke {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly alpha: number;
}

/** A 2D context that keeps the trails it is asked to stroke. */
const recordingContext = () => {
  const strokes: Stroke[] = [];
  let from = { x: 0, y: 0 };
  let to = { x: 0, y: 0 };
  const ctx = {
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '' as unknown,
    lineCap: '',
    lineWidth: 1,
    clearRect: () => undefined,
    fillRect: () => undefined,
    beginPath: () => undefined,
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
    createLinearGradient: () => ({ addColorStop: () => undefined }),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, strokes };
};

/** What the spec reads of a star, behind the class's back. */
interface StarView {
  readonly px: number;
  readonly py: number;
  readonly ray: number;
}
const starsOf = (sky: Sky): readonly StarView[] =>
  (sky as unknown as { stars: StarView[] }).stars;

const W = 1200;
const H = 800;

const camera = (time: number, trv: Traveling = traveling(time, false)) =>
  ({
    time,
    reduced: false,
    pointer: null,
    dpr: 1,
    trv,
    // A camera off its rest, so that the slide is not zero.
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

/** Runs the sky from 0 to `until` seconds at `hz`, drawing every frame. */
const run = (hz: number, until: number) => {
  const sky = new Sky(seeded(7));
  const { ctx, strokes } = recordingContext();
  const frames = Math.round(until * hz);
  let last: Stroke[] = [];
  for (let i = 0; i <= frames; i++) {
    strokes.length = 0;
    sky.draw(ctx, W, H, camera(i / hz));
    last = [...strokes];
  }
  return { sky, ctx, strokes: last };
};

const length = (s: Stroke): number => Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

describe('Sky', () => {
  it('draws trails of the same length whatever the frame rate', () => {
    // 5.2 s: mid-run, where the stars fly fastest.
    const fast = run(60, 5.2).strokes.map(length);
    const slow = run(20, 5.2).strokes.map(length);

    expect(fast.length).toBeGreaterThan(20);
    expect(slow.length).toBeGreaterThan(20);
    // Measured per frame, a trail three frames long at 20 Hz was three times
    // the one at 60 Hz.
    expect(median(slow) / median(fast)).toBeGreaterThan(0.8);
    expect(median(slow) / median(fast)).toBeLessThan(1.25);
  });

  it('keeps a tunnel in the turn: the trails stream away from the vanishing point', () => {
    // 6.5 s: the camera swings round (the crossing's azimuth), the whole
    // field slides sideways.
    const { strokes } = run(60, 6.5);
    // The vanishing point leads the turn by a few pixels only: the frame's
    // centre stands for it.
    const vx = W / 2;
    const vy = H / 2;
    const radial = strokes.filter((s) => {
      // The head is the stroke's start, its tail streams back.
      const hx = s.x0 - vx;
      const hy = s.y0 - vy;
      const tx = s.x0 - s.x1;
      const ty = s.y0 - s.y1;
      const cos =
        (hx * tx + hy * ty) / (Math.hypot(hx, hy) * Math.hypot(tx, ty) || 1);
      return cos > 0.85;
    });

    expect(strokes.length).toBeGreaterThan(20);
    // Trails that followed the slide made parallel hatching: under a third
    // of them streamed away from the vanishing point. The rest bend with the
    // quarter of the slide they keep.
    expect(radial.length / strokes.length).toBeGreaterThan(0.75);
  });

  it('moves no star by a jump when the field is flattened at the end of the run', () => {
    const hz = 60;
    const sky = new Sky(seeded(11));
    const { ctx } = recordingContext();
    let before: { x: number; y: number; ray: number }[] = [];
    let worst = 0;
    // The run ends at 7.9 s: the flattening happens in this window.
    for (let i = 0; i <= Math.round(8.4 * hz); i++) {
      const time = i / hz;
      sky.draw(ctx, W, H, camera(time));
      const now = starsOf(sky).map((star) => ({
        x: star.px,
        y: star.py,
        ray: star.ray,
      }));
      if (time > 7.6) {
        now.forEach((star, k) => {
          const was = before[k];
          if (!was || Number.isNaN(was.x) || Number.isNaN(star.x)) {
            return;
          }
          // A star wrapped round an edge jumps by the frame's size: not
          // a displacement.
          const dx = Math.abs(star.x - was.x);
          const dy = Math.abs(star.y - was.y);
          if (dx < W / 2 && dy < H / 2) {
            worst = Math.max(worst, Math.hypot(dx, dy));
          }
        });
      }
      before = now;
    }
    // At the end of the run a star still moves a few pixels a frame;
    // folding the spread into the position alone moved spread stars by
    // hundreds, in one frame.
    expect(worst).toBeLessThan(8);
  });

  it('keeps the stars drifting out after the tunnel, until the object has landed', () => {
    const hz = 60;
    const sky = new Sky(seeded(3));
    const { ctx } = recordingContext();
    const snapshots = new Map<number, { x: number; y: number }[]>();
    for (let i = 0; i <= Math.round(9.9 * hz); i++) {
      sky.draw(ctx, W, H, camera(i / hz));
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

    // The tunnel is over at 7.9 s; the object lands at 9.6 s. In between,
    // the sky froze under an object rushing at us (a tenth of a pixel in
    // 0.2 s); it now drifts out some ten pixels a second.
    expect(moved(8.4, 8.6)).toBeGreaterThan(1);
    // Landed: only the slow drift of the stars is left.
    expect(moved(9.7, 9.9)).toBeLessThan(0.5);
  });

  it('draws no trail at rest, once the run is over', () => {
    const sky = new Sky(seeded(3));
    const { ctx, strokes } = recordingContext();
    // The first frame warms the GPU with invisible strokes: skipped here.
    sky.draw(ctx, W, H, camera(12, ARRIVED));
    strokes.length = 0;
    sky.draw(ctx, W, H, camera(12.02, ARRIVED));

    expect(strokes).toHaveLength(0);
  });

  it('warms the GPU with trails nobody sees, on its first frame only', () => {
    const sky = new Sky(seeded(5));
    const { ctx, strokes } = recordingContext();
    sky.draw(ctx, W, H, camera(0));
    const first = strokes.length;
    strokes.length = 0;
    sky.draw(ctx, W, H, camera(1 / 60));

    expect(first).toBeGreaterThan(0);
    expect(strokes).toHaveLength(0);
  });
});
