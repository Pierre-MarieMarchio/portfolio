import { TAU } from './math';
import { ORBIT_RATE } from './constants';
import { rollFlatten } from './projection';

/*
 * The variant of "about": four comets, one per part, kept as the
 * alternative to the constellations (the default). Out of the disk's plane
 * and well beyond the planets' orbits (periapsis 4.8 to 6.6 radii, apoapsis
 * 12 to 18): these are not bodies of the system, they are visitors. The
 * tilt alternates on either side, and the speed is Kepler's, halved again:
 * a comet is watched passing by, it does not scroll past.
 */

interface Comet {
  readonly q: number;
  readonly Q: number;
  readonly arg: number;
  readonly M0: number;
  readonly inc: number;
  readonly a: number;
  readonly e: number;
  readonly v: number;
}

export const COMETS: readonly Comet[] = [
  { q: 4.8, Q: 12.0, arg: 0.42, M0: 0.0, inc: 0.44 },
  { q: 5.4, Q: 14.0, arg: 2.15, M0: 2.1, inc: -0.62 },
  { q: 6.0, Q: 16.0, arg: 3.86, M0: 4.0, inc: 0.78 },
  { q: 6.6, Q: 18.0, arg: 5.31, M0: 5.6, inc: -0.34 },
].map((c) => {
  const a = (c.q + c.Q) / 2;
  return {
    ...c,
    a,
    e: (c.Q - c.q) / (c.Q + c.q),
    v: 0.034 * Math.pow(6.0 / a, 1.5),
  };
});

/**
 * Kepler solved by Newton: the mean anomaly moves by a constant step, the
 * eccentric one is solved in four iterations. That is what gives the comet
 * its slowness far out and its rush at the passage; without it, it is just
 * a planet on an ellipse.
 */
export const positionComet = (
  c: Comet,
  phase: number,
  elev: number,
  azim: number,
): { x: number; y: number; z: number; r: number } => {
  const M = c.M0 + phase * c.v * ORBIT_RATE;
  let E = M;
  for (let k = 0; k < 4; k++) {
    E -= (E - c.e * Math.sin(E) - M) / (1 - c.e * Math.cos(E));
  }
  const cE = Math.cos(E);
  const sE = Math.sin(E);
  const X = c.a * (cE - c.e);
  const Y = c.a * Math.sqrt(1 - c.e * c.e) * sE;
  const cw = Math.cos(c.arg);
  const sw = Math.sin(c.arg);
  const xp = X * cw - Y * sw;
  const yp = X * sw + Y * cw;
  // Its own tilt: the out-of-plane part stays vertical on screen, which is
  // what takes the comet out of the disk instead of laying it in.
  const ci = Math.cos(c.inc);
  const si = Math.sin(c.inc);
  const ca = Math.cos(azim);
  const sa = Math.sin(azim);
  const Zo = yp * ci;
  const Yo = yp * si;
  const x2 = xp * ca - Zo * sa;
  const z2 = xp * sa + Zo * ca;
  return {
    x: x2,
    y: 0.04 + z2 * (0.05 + 0.62 * elev) + Yo,
    z: z2,
    r: c.a * (1 - c.e * cE),
  };
};

export const drawComets = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  args: {
    readonly phase: number;
    readonly elev: number;
    readonly azim: number;
    readonly flatten: number;
    readonly cr: number;
    readonly sr: number;
    readonly cx: number;
    readonly cy: number;
    readonly R: number;
    readonly dpr: number;
    readonly accent: string;
    readonly entry: number;
    readonly shown: number;
    readonly part: number;
    /** The name of each part, drawn by its comet. */
    readonly labels: readonly string[];
    readonly veil: (x: number, y: number) => number;
  },
): void => {
  const { phase, elev, azim, flatten, cr, sr, cx, cy, R, dpr, accent } = args;
  const plane = { flatten, cr, sr };
  ctx.lineCap = 'round';
  COMETS.forEach((c, i) => {
    const p = positionComet(c, phase, elev, azim);
    const { nx: rx2, ny: ry2 } = rollFlatten(p, plane, { nx: 0, ny: 0 });
    const sx = cx + rx2 * R;
    const sy = cy + ry2 * R;
    // Behind the shadow it goes out like everything else.
    const dCentre = Math.sqrt(rx2 * rx2 + ry2 * ry2);
    const shade =
      p.z < 0 && dCentre < 1.18 ? Math.max(0, (dCentre - 1.0) / 0.18) : 1;
    const active = i === args.part;
    const a0 =
      (active ? 1 : 0.52) * args.entry * args.shown * shade * args.veil(sx, sy);
    if (a0 < 0.015) {
      return;
    }
    // TWO TAILS, because a comet has two and the difference shows: the
    // plasma tail, thin and blue, points exactly away from the object; the
    // dust tail, wide and pale, lags on the trajectory and curves. Both
    // lengthen near the object: its radiation blows them.
    const d0 = Math.max(0.001, dCentre);
    const ux = rx2 / d0;
    const uy = ry2 / d0;
    const ahead = positionComet(c, phase + 0.6, elev, azim);
    const next = rollFlatten(ahead, plane, { nx: 0, ny: 0 });
    const vx0 = next.nx - rx2;
    const vy0 = next.ny - ry2;
    const vn0 = Math.max(0.0001, Math.sqrt(vx0 * vx0 + vy0 * vy0));
    let dx2 = ux - (0.62 * vx0) / vn0;
    let dy2 = uy - (0.62 * vy0) / vn0;
    const dn2 = Math.max(0.0001, Math.sqrt(dx2 * dx2 + dy2 * dy2));
    dx2 /= dn2;
    dy2 /= dn2;
    const len = Math.max(
      R * 0.34,
      Math.min(R * 2.1, R * 0.7 * Math.pow(c.q / p.r, 1.7)),
    );
    const tail = (
      dxq: number,
      dyq: number,
      L: number,
      half: number,
      curve: number,
      color: string,
      alpha: number,
    ): void => {
      const nx2 = -dyq;
      const ny2 = dxq;
      const mx = sx + dxq * L * 0.5 + nx2 * curve * L;
      const my = sy + dyq * L * 0.5 + ny2 * curve * L;
      const ex = sx + dxq * L + nx2 * curve * L * 2.2;
      const ey = sy + dyq * L + ny2 * curve * L * 2.2;
      const gradient = ctx.createLinearGradient(sx, sy, ex, ey);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.42, color);
      gradient.addColorStop(1, 'transparent');
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(sx + nx2 * half, sy + ny2 * half);
      ctx.quadraticCurveTo(
        mx + nx2 * half * 0.55,
        my + ny2 * half * 0.55,
        ex,
        ey,
      );
      ctx.quadraticCurveTo(
        mx - nx2 * half * 0.55,
        my - ny2 * half * 0.55,
        sx - nx2 * half,
        sy - ny2 * half,
      );
      ctx.closePath();
      ctx.fill();
    };
    tail(
      dx2,
      dy2,
      len * 0.78,
      (active ? 5.2 : 3.4) * dpr,
      0.1,
      '#cfd8e6',
      a0 * 0.4,
    );
    tail(ux, uy, len, (active ? 2.0 : 1.3) * dpr, 0, '#bcd8f5', a0 * 0.72);
    if (active) {
      const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, 18 * dpr);
      halo.addColorStop(0, accent);
      halo.addColorStop(1, 'transparent');
      ctx.globalAlpha = a0 * 0.55;
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(sx, sy, 18 * dpr, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = a0;
    ctx.fillStyle = active ? '#ffffff' : '#e7f2fb';
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(1.6, (active ? 3.6 : 2.5) * dpr), 0, TAU);
    ctx.fill();
    // Named, as the planets are on the home page: otherwise one watches an
    // effect, not an object of the story.
    const name = args.labels[i] ?? '';
    if (
      name &&
      sx > 60 * dpr &&
      sx < w - 60 * dpr &&
      sy > 24 * dpr &&
      sy < h - 24 * dpr
    ) {
      ctx.globalAlpha = a0 * (active ? 0.95 : 0.5);
      ctx.fillStyle = active ? '#ffffff' : '#cfd8e6';
      ctx.font = `500 ${String(Math.round(11 * dpr))}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textAlign = ux < 0 ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        name.toUpperCase(),
        sx - ux * 13 * dpr,
        sy - uy * 13 * dpr - 9 * dpr,
      );
      ctx.textAlign = 'left';
    }
  });
};
