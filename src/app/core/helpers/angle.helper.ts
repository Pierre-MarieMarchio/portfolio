export const TAU = 6.2832;

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

export const onCurrentTurn = (target: number, current: number): number => {
  const turns = Math.round((current - target) / TAU);
  return turns ? target + turns * TAU : target;
};
