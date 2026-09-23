import { WINDOW_CEILINGS } from './window.model';

describe('WINDOW_CEILINGS', () => {
  it('caps each size at its height in pixels, growing from s to l', () => {
    expect(WINDOW_CEILINGS).toEqual({ s: 300, m: 470, l: 920 });
  });
});
