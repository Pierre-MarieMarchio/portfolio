import { progress, smoothstep } from '@app/core/helpers';

export interface Traveling {
  readonly grow: number;
  readonly dEv: number;
  readonly dAz: number;
  readonly dRoll: number;
  readonly dx: number;
  readonly dy: number;
  readonly matter: number;
  readonly light: number;
  readonly spin: number;
  readonly coast: number;
}

export const ARRIVED: Traveling = {
  grow: 1,
  dEv: 0,
  dAz: 0,
  dRoll: 0,
  dx: 0,
  dy: 0,
  matter: 1,
  light: 1,
  spin: 1,
  coast: 0,
};

const APPROACH_FROM = 4.2;
const APPROACH_TO = 9.6;

export const TRAVELING_END = 9.7;

const approach = (p: number): number => {
  const q = 1 - p;
  return p ** 5 * (56 * q ** 3 + 28 * p * q ** 2 + 8 * p ** 2 * q + p ** 3);
};

const approachSpeed = (p: number): number =>
  (p ** 4 * (1 - p) ** 3) / ((4 / 7) ** 4 * (3 / 7) ** 3);

export const traveling = (time: number, isReduced: boolean): Traveling => {
  if (isReduced) {
    return ARRIVED;
  }
  const t = Number.isFinite(time) ? time : 0;
  const pA = progress(t, APPROACH_FROM, APPROACH_TO);
  const distance = Math.pow(58, 1 - approach(pA));
  const pD = progress(t, 4.2, 8.8);
  const qI = smoothstep(progress(t, 5.4, 8.8));
  const qO = smoothstep(progress(t, 6, 8.8));
  const pC = progress(t, 5.6, 8.8);
  const back = 1 + 1.32 * Math.pow(qI - 1, 3) + 0.32 * Math.pow(qI - 1, 2);
  const outQ = 1 - Math.pow(1 - qO, 4);
  const sine = 0.5 - 0.5 * Math.cos(Math.PI * pC);
  const mA = progress(t, 3.8, 8);
  const envelope = Math.pow(Math.sin(Math.PI * pC), 2);
  const w1 = Math.sin(t * 0.23 + 0.6);
  const w2 = Math.sin(t * 0.41 + 2.1);
  const w3 = Math.sin(t * 0.13 + 4.2);
  return {
    grow: 1 / distance,
    dEv: -(1 - outQ),
    dAz: -1.05 * (1 - back) + (0.055 * w1 + 0.021 * w2) * envelope,
    dRoll: -0.19 * (1 - sine) + 0.03 * w2 * envelope,
    dx: -0.075 * (1 - sine) + 0.013 * w3 * envelope,
    dy: 0.052 * (1 - sine) + 0.01 * w1 * envelope,
    spin: 1 + 4.2 * (1 - smoothstep(pD)),
    matter: Math.pow(smoothstep(mA), 1.8),
    light: Math.pow(1 / distance, 0.95),
    coast: approachSpeed(pA),
  };
};
