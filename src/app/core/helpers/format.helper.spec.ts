import { twoDigits } from '.';

describe('twoDigits', () => {
  it('pads a single digit and leaves two digits alone', () => {
    expect(twoDigits(0)).toBe('00');
    expect(twoDigits(7)).toBe('07');
    expect(twoDigits(12)).toBe('12');
  });
});
