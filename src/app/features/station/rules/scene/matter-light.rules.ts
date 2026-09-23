import { Grain, Projected } from '../../components/object/engine/scene';

export interface GrainSpot extends Projected {
  rx: number;
  ry: number;
  sx: number;
  sy: number;
  doppler: number;
}

const isLensedArc = (grain: Grain): boolean =>
  grain.fam === 1 || grain.fam === 2;

// The sphere and its ring stay perfectly round; the flattening only
// takes the outer parts of the disk.
export const flattenedHeight = (
  grain: Grain,
  y: number,
  flatten: number,
): number => {
  if (grain.fam === 0 || grain.fam === 5) {
    return y;
  }
  return isLensedArc(grain)
    ? y * (1 - (1 - flatten) * Math.min(1, grain.u * 2.4))
    : y * flatten;
};

export const litMatter = (
  alpha: number,
  grain: Grain,
  spot: GrainSpot,
  preview: number,
): number => {
  let lit = alpha;
  if (grain.fam !== 0) {
    lit *= 1 - 0.32 * preview;
  }
  if (isLensedArc(grain)) {
    lit *= 0.3 + 0.7 * Math.min(1, Math.pow(Math.abs(spot.y), 0.95));
  }
  if (grain.fam === 3 && grain.behind) {
    const dist = Math.hypot(spot.x, spot.y);
    lit *= dist < 1.02 ? 0 : 0.94;
  }
  return litByFamily(lit, grain, spot);
};

const litByFamily = (alpha: number, grain: Grain, spot: GrainSpot): number => {
  if (grain.fam === 5) {
    // The rim is the brightest thing in the image, barely modulated.
    // Thinned, it loses surface: it gets back in light what it lost in
    // thickness, or the shadow's edge comes apart.
    return alpha * 1.52;
  }
  return grain.fam === 0
    ? alpha * (0.03 + 0.95 * Math.pow(grain.rho, 5))
    : litDisk(alpha, grain, spot);
};

// Light hierarchy: a glowing core at the inner edge, a frank fall
// outwards, and the upper halo brighter than the lower. The outer
// edge keeps a floor (0.52), or the disk ends in the dark and the
// planets flying over it lose a legible ground.
const litDisk = (alpha: number, grain: Grain, spot: GrainSpot): number => {
  let lit = alpha * (0.52 + 0.9 * Math.exp(-grain.u * 2.8));
  lit *= spot.ry < 0 ? 1.34 : 0.78;
  if (grain.fam === 3) {
    lit *= 1.95;
  }
  // The hole's shadow, lightly veiled.
  const d2c = Math.hypot(spot.rx, spot.ry);
  if (d2c < 0.9 && (grain.fam === 4 || (grain.fam === 3 && grain.behind))) {
    lit *= 0.08 + 0.3 * (d2c / 0.9);
  }
  // Nothing shines IN the shadow: the lensed arcs go out there too,
  // which gives the black disk its sharp edge and detaches the rim.
  if (isLensedArc(grain) && d2c < 0.99) {
    lit *= 0.04 + 0.5 * Math.pow(d2c / 0.99, 6);
  }
  return lit;
};

export const isCoreGrain = (grain: Grain): boolean => {
  if (grain.fam === 5) {
    return true;
  }
  return grain.fam === 0 ? grain.rho > 0.9 : grain.u < 0.11 && grain.fam !== 4;
};

export const grainSize = (grain: Grain, isCore: boolean): number => {
  if (grain.fam === 5) {
    return 2.15;
  }
  if (isCore) {
    return 2.8;
  }
  return grain.fam === 4 ? 2.4 : 2.5;
};

// The tint follows the Doppler shift in five steps: five colours
// reused, not a gradient per point, or changing fillStyle would cost
// more than drawing. The sphere and the veil stay neutral.
export const isTinted = (grain: Grain): boolean =>
  isLensedArc(grain) || grain.fam === 3 || grain.fam === 5;

export const tintStep = (doppler: number): number => {
  if (doppler < -0.52) {
    return 0;
  }
  if (doppler < -0.16) {
    return 1;
  }
  if (doppler > 0.52) {
    return 4;
  }
  return doppler > 0.16 ? 3 : 2;
};
