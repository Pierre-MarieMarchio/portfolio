import { ORBIT_RATE, SHADOW_EDGE } from '../constants';
import { TAU } from '../math';
import { Rolled, rollFlatten } from '../projection';
import { Orbit, positionOrbit, Projected } from '../scene';
import { Turntable } from '../turntable';
import { isLively, rising } from '../../../../rules/scene/planet-focus.rules';
import type { SceneFrame } from '../../../../rules/scene/scene-frame.rules';

const SAMPLES = 84;
const LEVELS = 7;

interface TracePoint {
  x: number;
  y: number;
  depth: number;
  isShaded: boolean;
}

const tracePoint = (): TracePoint => ({
  x: 0,
  y: 0,
  depth: 0,
  isShaded: false,
});

// depth 0 furthest, 1 nearest
const isOnLevel = (a: TracePoint, b: TracePoint, level: number): boolean => {
  if (a.isShaded || b.isShaded) {
    return false;
  }
  const depth = 0.5 + 0.5 * ((a.depth + b.depth) / 2);
  return Math.min(LEVELS - 1, Math.floor(depth * LEVELS)) === level;
};

// The trace of each orbit, a hairline: it says "planet" rather than
// "grain of the disk". Sampled on 84 points and drawn SEGMENT BY
// SEGMENT, since joining two non-consecutive points would draw a chord
// across the ellipse; seven depth steps so the orbit darkens behind and
// comes back without a break. Only the shadow really cuts the line.
export class OrbitsRenderer {
  private readonly sample = { ang: 0, rb: 0, inc: 0, v: 0 };
  private readonly out: Projected = { x: 0, y: 0, z: 0 };
  private readonly rolled: Rolled = { nx: 0, ny: 0 };
  private readonly trace: TracePoint[] = Array.from(
    { length: SAMPLES + 1 },
    tracePoint,
  );

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly turntable: Turntable,
  ) {}

  public draw(frame: SceneFrame): void {
    if (frame.marks <= 0.02) {
      return;
    }
    this.ctx.strokeStyle = frame.accent;
    this.ctx.lineWidth = Math.max(1, 0.85 * frame.dpr);
    for (let i = 0; i < frame.focus.shown; i++) {
      const orbit = frame.orbits[i];
      if (orbit) {
        this.drawOrbit(orbit, i, frame);
      }
    }
  }

  private drawOrbit(orbit: Orbit, i: number, frame: SceneFrame): void {
    const focus = frame.focus;
    const base =
      (isLively(focus, i) ? 0.34 : 0.13) *
      (i >= focus.featured ? 0.42 : 1) *
      frame.entry *
      frame.marks *
      rising(focus, i);
    this.sampleOrbit(orbit, i, frame);
    for (let level = 0; level < LEVELS; level++) {
      this.strokeLevel(level, base);
    }
  }

  private sampleOrbit(orbit: Orbit, i: number, frame: SceneFrame): void {
    const sample = this.sample;
    const pose = {
      phase: 0,
      elev: frame.elev,
      azim:
        frame.azim +
        this.turntable.orbitTurn(i) +
        frame.phase * orbit.v * ORBIT_RATE,
    };
    for (const [k, point] of this.trace.entries()) {
      sample.ang = orbit.ang + k * (TAU / SAMPLES);
      sample.rb = orbit.rb;
      sample.inc = orbit.inc;
      const q = positionOrbit(sample, pose, this.out);
      const { nx, ny } = rollFlatten(q, frame, this.rolled);
      point.x = frame.cx + nx * frame.radius;
      point.y = frame.cy + ny * frame.radius;
      point.depth = q.z / orbit.rb;
      point.isShaded = q.z < 0 && Math.hypot(nx, ny) < SHADOW_EDGE;
    }
  }

  private strokeLevel(level: number, base: number): void {
    const ctx = this.ctx;
    const trace = this.trace;
    ctx.globalAlpha = base * (0.34 + (0.66 * level) / (LEVELS - 1));
    ctx.beginPath();
    let isTraced = false;
    for (let k = 1; k < trace.length; k++) {
      const a = trace[k - 1];
      const b = trace[k];
      if (a && b && isOnLevel(a, b, level)) {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        isTraced = true;
      }
    }
    if (isTraced) {
      ctx.stroke();
    }
  }
}
