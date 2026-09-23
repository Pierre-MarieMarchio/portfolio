import { TAU } from '@app/core/helpers';

export interface Star {
  x: number;
  y: number;
  readonly radius: number;
  readonly vx: number;
  readonly vy: number;
  readonly alpha: number;
  readonly phase: number;
  readonly accent: boolean;
  /** Radial spread during the crossing, 1 at rest. */
  ray: number;
  /** Last drawn position, `NaN` when there is none to trail from. */
  px: number;
  py: number;
  /** Smoothed velocity, in device pixels per second, for the trail. */
  sdx: number;
  sdy: number;
}

interface Cluster {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

interface StarPlace {
  readonly x: number;
  readonly y: number;
}

export const buildStarField = (
  w: number,
  h: number,
  dpr: number,
  rnd: () => number,
): Star[] => {
  const count = Math.round((w * h) / (3600 * dpr));
  const clusters: Cluster[] = [];
  for (let i = 0; i < 4; i++) {
    clusters.push({
      x: rnd() * w,
      y: rnd() * h,
      radius: (0.18 + rnd() * 0.2) * Math.min(w, h),
    });
  }
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push(makeStar(placeStar(clusters, w, h, rnd), dpr, rnd));
  }
  return stars;
};

export const forgetTrail = (star: Star): void => {
  star.ray = 1;
  star.px = NaN;
  star.py = NaN;
  star.sdx = 0;
  star.sdy = 0;
};

const placeStar = (
  clusters: readonly Cluster[],
  w: number,
  h: number,
  rnd: () => number,
): StarPlace => {
  const x = rnd() * w;
  const y = rnd() * h;
  if (rnd() < 0.42) {
    const cluster = clusters[Math.floor(rnd() * clusters.length)];
    if (cluster) {
      return placeInCluster(cluster, w, h, rnd);
    }
  }
  return { x, y };
};

const placeInCluster = (
  cluster: Cluster,
  w: number,
  h: number,
  rnd: () => number,
): StarPlace => {
  const angle = rnd() * TAU;
  const distance = Math.pow(rnd(), 0.6) * cluster.radius;
  const x = cluster.x + Math.cos(angle) * distance;
  const y = cluster.y + Math.sin(angle) * distance * 0.8;
  return x < 0 || x > w || y < 0 || y > h
    ? { x: rnd() * w, y: rnd() * h }
    : { x, y };
};

const makeStar = (
  { x, y }: StarPlace,
  dpr: number,
  rnd: () => number,
): Star => {
  const isBig = rnd() > 0.94;
  return {
    x,
    y,
    radius: (isBig ? 1.6 + rnd() * 1 : 0.5 + Math.pow(rnd(), 2.1) * 1) * dpr,
    vx: (rnd() - 0.5) * 1.6,
    vy: (rnd() - 0.5) * 1.1,
    alpha: isBig ? 0.34 + rnd() * 0.26 : 0.07 + rnd() * 0.2,
    phase: rnd() * TAU,
    accent: rnd() < 0.1,
    ray: 1,
    px: NaN,
    py: NaN,
    sdx: 0,
    sdy: 0,
  };
};
