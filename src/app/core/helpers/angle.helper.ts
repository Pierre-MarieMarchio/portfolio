export const TAU = 6.2832;

/**
 * Brings an azimuth to within half a turn of `reference`, so the camera
 * always takes the short way round.
 */
export const nearestTurn = (azimuth: number, reference: number): number => {
  let az = azimuth;
  while (az - reference > Math.PI) {
    az -= TAU;
  }
  while (reference - az > Math.PI) {
    az += TAU;
  }
  return az;
};

/**
 * Puts a target azimuth back on the camera's current turn. Every preview
 * unrolls the azimuth by a further quarter turn; without this, going back
 * to a constant framing would make the camera catch up every revolution
 * accumulated so far.
 */
export const onCurrentTurn = (target: number, current: number): number => {
  const turns = Math.round((current - target) / TAU);
  return turns ? target + turns * TAU : target;
};
