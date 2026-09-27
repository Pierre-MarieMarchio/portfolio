import { clamp, finiteOr, gaussian, TAU } from '@app/core/helpers';
import { Grain } from '../scene-bodies.rules';
import { REFERENCE_VIEWPORT } from '../../models/scene-constants.model';

interface GrainShape {
  readonly u: number;
  readonly ang: number;
  readonly alpha0: number;
  readonly w: number;
  readonly g: number;
}

export const RESERVE = 1.9;

const PART_BASE = 1 / RESERVE;

export const densityShare = (viewportArea: number): number =>
  clamp(
    viewportArea / (REFERENCE_VIEWPORT.width * REFERENCE_VIEWPORT.height),
    0.42,
    1,
  );

export const litShare = (
  homeScale: number,
  scale: number,
  grow: number,
): number => {
  const s0 = homeScale || 0.42;
  const zoom = clamp(finiteOr(scale, s0) / s0, 1, 3);
  const shareZoom = Math.min(1, PART_BASE * (0.62 + 0.38 * zoom * zoom));
  return Math.min(shareZoom, 0.03 + 1.7 * grow);
};

export const buildScene = (n: number, rnd: () => number): Grain[] => {
  const reserve = new GrainReserve(rnd);
  const sphereCount = Math.round(n * 0.13);
  reserve.addSphere(sphereCount);
  const arcCount = Math.round(n * 0.58);
  reserve.addArcs(arcCount);
  const bandCount = Math.round(n * 0.3);
  reserve.addBand(bandCount);
  reserve.addVeil(Math.max(0, n - sphereCount - arcCount - bandCount));
  reserve.addRing(Math.round(n * 0.16));
  return reserve.sorted();
};

class GrainReserve {
  private readonly grains: Grain[] = [];
  private readonly gauss: () => number;

  constructor(private readonly rnd: () => number) {
    this.gauss = gaussian(rnd);
  }

  public addSphere(count: number): void {
    const { rnd, gauss } = this;
    for (let i = 0; i < count; i++) {
      const lat = Math.asin(rnd() * 2 - 1);
      const ang = rnd() * TAU;
      const alpha0 = 0.16 + rnd() * 0.12;
      this.add(
        0,
        { u: 0, ang, alpha0, w: 0.075, g: gauss() * 0.01 },
        { lat, grain: 0.8 + rnd() * 0.4, accent: rnd() < 0.06 },
      );
    }
  }

  public addArcs(count: number): void {
    const { rnd, gauss } = this;
    for (let i = 0; i < count; i++) {
      const isHigh = rnd() < 0.62;
      const u = Math.min(1, Math.abs(gauss()) * (isHigh ? 0.44 : 0.52));
      const ang = rnd() * TAU;
      const fall = Math.exp(-u * u * 3.4);
      const base =
        (isHigh ? 0.16 : 0.07) +
        (isHigh ? 0.78 : 0.4) *
          fall *
          (0.84 + 0.16 * Math.sin(ang * 3.1 + u * 9));
      this.add(isHigh ? 1 : 2, {
        u,
        ang,
        alpha0: base,
        w: 0.12 / (1 + 2 * u),
        g: gauss() * 0.012,
      });
    }
  }

  public addBand(count: number): void {
    const { rnd, gauss } = this;
    for (let i = 0; i < count; i++) {
      const u = Math.pow(rnd(), 1.5);
      const ang = rnd() * TAU;
      this.add(3, {
        u,
        ang,
        alpha0: 0.05 + 0.42 * Math.exp(-u * 2.1),
        w: 0.22 / Math.pow(1 + 1.6 * u, 1.4),
        g: gauss(),
      });
    }
  }

  public addVeil(count: number): void {
    const { rnd, gauss } = this;
    for (let i = 0; i < count; i++) {
      const u = Math.abs(gauss()) * 0.55;
      this.add(4, {
        u,
        ang: rnd() * TAU,
        alpha0: 0.035 * Math.exp(-u * 1.6),
        w: 0.025,
        g: gauss() * 0.2,
      });
    }
  }

  public addRing(count: number): void {
    const { rnd, gauss } = this;
    for (let i = 0; i < count; i++) {
      const ang = rnd() * TAU;
      const alpha0 = 0.34 + rnd() * 0.3;
      const w = 0.072 + rnd() * 0.012;
      const g = gauss() * 0.0062;
      this.add(
        5,
        { u: 0, ang, alpha0, w, g },
        {
          gr2: gauss() * 0.4,
          ph2: rnd() * TAU,
          ph3: rnd() * TAU,
          grain: 0.85 + rnd() * 0.3,
          accent: false,
        },
      );
    }
  }

  public sorted(): Grain[] {
    this.grains.sort((a, b) => a.fam - b.fam);
    return this.grains;
  }

  private add(
    fam: Grain['fam'],
    shape: GrainShape,
    extra: Partial<Grain> = {},
  ): void {
    const rnd = this.rnd;
    this.grains.push({
      fam,
      ...shape,
      grain: 0.8 + rnd() * 0.4,
      accent: rnd() < (fam === 0 ? 0.3 : 0.08),
      depart: 2 + rnd() * 3,
      ph: rnd() * TAU,
      lat: 0,
      gr2: 0,
      ph2: 0,
      ph3: 0,
      dx: 0,
      dy: 0,
      z: 0,
      rho: 0,
      behind: false,
      ...extra,
    });
  }
}

export const litAmount = (order: number, share: number): number =>
  share >= 1 ? 1 : clamp((share * 1000 - ((order * 7919) % 1000)) / 20, 0, 1);
