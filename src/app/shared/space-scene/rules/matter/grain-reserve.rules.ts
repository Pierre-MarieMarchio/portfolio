import { SCENE_CONFIG } from '../../models/scene-config.model';
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

export const RESERVE = SCENE_CONFIG.matter.reserve;

const PART_BASE = 1 / RESERVE;

const PHONE_MATTER = SCENE_CONFIG.matter.phoneShare;

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
  isPhone: boolean,
): number => {
  const s0 = homeScale || 0.42;
  const zoom = clamp(finiteOr(scale, s0) / s0, 1, 3);
  const shareZoom = Math.min(1, PART_BASE * (0.62 + 0.38 * zoom * zoom));
  return Math.min(shareZoom, 0.03 + 1.7 * grow) * (isPhone ? PHONE_MATTER : 1);
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

interface ArcProfile {
  readonly fam: Grain['fam'];
  readonly spread: number;
  readonly floor: number;
  readonly gain: number;
}

const HIGH_ARC: ArcProfile = { fam: 1, spread: 0.44, floor: 0.16, gain: 0.78 };
const LOW_ARC: ArcProfile = { fam: 2, spread: 0.52, floor: 0.07, gain: 0.4 };
const HIGH_ARC_SHARE = 0.62;
const ARC_FALL_RATE = 3.4;
const ARC_RIPPLE_BASE = 0.84;
const ARC_RIPPLE_DEPTH = 0.16;
const ARC_RIPPLE_TURNS = 3.1;
const ARC_RIPPLE_DRIFT = 9;
const ARC_WIDTH = 0.12;
const ARC_WIDENING = 2;
const ARC_DRIFT = 0.012;

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
      const profile = rnd() < HIGH_ARC_SHARE ? HIGH_ARC : LOW_ARC;
      const u = Math.min(1, Math.abs(gauss()) * profile.spread);
      const ang = rnd() * TAU;
      const fall = Math.exp(-u * u * ARC_FALL_RATE);
      const ripple =
        ARC_RIPPLE_BASE +
        ARC_RIPPLE_DEPTH *
          Math.sin(ang * ARC_RIPPLE_TURNS + u * ARC_RIPPLE_DRIFT);
      this.add(profile.fam, {
        u,
        ang,
        alpha0: profile.floor + profile.gain * fall * ripple,
        w: ARC_WIDTH / (1 + ARC_WIDENING * u),
        g: gauss() * ARC_DRIFT,
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
