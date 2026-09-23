import { halfLifeStep } from './easing.helper';

const approachAfter = (frames: number): number => {
  let value = 0;
  for (let i = 0; i < frames; i++) {
    value += (1 - value) * halfLifeStep(1 / frames, 0.55);
  }
  return value;
};

describe('halfLifeStep', () => {
  it('covers half the way in one half-life', () => {
    expect(halfLifeStep(0.55, 0.55)).toBeCloseTo(0.5, 10);
  });

  it('lands at the same place whatever the frame rate', () => {
    expect(approachAfter(30)).toBeCloseTo(approachAfter(144), 10);
  });
});
