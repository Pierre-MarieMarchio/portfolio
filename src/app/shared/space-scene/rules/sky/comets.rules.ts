import { ORBIT_RATE } from '../../models/scene-constants.model';

export interface Comet {
  readonly periapsis: number;
  readonly apoapsis: number;
  readonly arg: number;
  readonly startAnomaly: number;
  readonly inc: number;
  readonly semiMajorAxis: number;
  readonly eccentricity: number;
  readonly meanMotion: number;
}

export const COMETS: readonly Comet[] = [
  { periapsis: 4.8, apoapsis: 12, arg: 0.42, startAnomaly: 0, inc: 0.44 },
  { periapsis: 5.4, apoapsis: 14, arg: 2.15, startAnomaly: 2.1, inc: -0.62 },
  { periapsis: 6, apoapsis: 16, arg: 3.86, startAnomaly: 4, inc: 0.78 },
  { periapsis: 6.6, apoapsis: 18, arg: 5.31, startAnomaly: 5.6, inc: -0.34 },
].map((c) => {
  const semiMajorAxis = (c.periapsis + c.apoapsis) / 2;
  return {
    ...c,
    semiMajorAxis,
    eccentricity: (c.apoapsis - c.periapsis) / (c.apoapsis + c.periapsis),
    meanMotion: 0.034 * Math.pow(6 / semiMajorAxis, 1.5),
  };
});

export const positionComet = (
  c: Comet,
  phase: number,
  elev: number,
  azim: number,
): { x: number; y: number; z: number; r: number } => {
  const e = c.eccentricity;
  const meanAnomaly = c.startAnomaly + phase * c.meanMotion * ORBIT_RATE;
  let anomaly = meanAnomaly;
  for (let k = 0; k < 4; k++) {
    anomaly -=
      (anomaly - e * Math.sin(anomaly) - meanAnomaly) /
      (1 - e * Math.cos(anomaly));
  }
  const cE = Math.cos(anomaly);
  const sE = Math.sin(anomaly);
  const orbitX = c.semiMajorAxis * (cE - e);
  const orbitY = c.semiMajorAxis * Math.sqrt(1 - e * e) * sE;
  const cw = Math.cos(c.arg);
  const sw = Math.sin(c.arg);
  const xp = orbitX * cw - orbitY * sw;
  const yp = orbitX * sw + orbitY * cw;
  const ci = Math.cos(c.inc);
  const si = Math.sin(c.inc);
  const ca = Math.cos(azim);
  const sa = Math.sin(azim);
  const inPlane = yp * ci;
  const outOfPlane = yp * si;
  const x2 = xp * ca - inPlane * sa;
  const z2 = xp * sa + inPlane * ca;
  return {
    x: x2,
    y: 0.04 + z2 * (0.05 + 0.62 * elev) + outOfPlane,
    z: z2,
    r: c.semiMajorAxis * (1 - e * cE),
  };
};
