import { homeDetentAfter, posedSlugOf } from './home-sheet.rules';

describe('home sheet rules', () => {
  describe('homeDetentAfter', () => {
    it('rises to full as soon as a project is posed', () => {
      expect(homeDetentAfter(true, undefined)).toBe('full');
      expect(homeDetentAfter(true, 'folded')).toBe('full');
      expect(homeDetentAfter(true, 'half')).toBe('full');
    });

    it('arrives at half height', () => {
      expect(homeDetentAfter(false, undefined)).toBe('half');
    });

    it('comes down from full to half, and leaves folded or half where the reader put them', () => {
      expect(homeDetentAfter(false, 'full')).toBe('half');
      expect(homeDetentAfter(false, 'folded')).toBe('folded');
      expect(homeDetentAfter(false, 'half')).toBe('half');
    });
  });

  describe('posedSlugOf', () => {
    const slugs = ['alpha', 'beta', 'gamma'];

    it('takes the first candidate that is featured', () => {
      expect(posedSlugOf(slugs, ['beta', 'gamma'], 'alpha')).toBe('beta');
      expect(posedSlugOf(slugs, [null, 'gamma'], 'alpha')).toBe('gamma');
    });

    it('skips a candidate that is not featured', () => {
      expect(posedSlugOf(slugs, ['omega', 'beta'], 'alpha')).toBe('beta');
    });

    it('rests on the resting pick when no candidate is featured', () => {
      expect(posedSlugOf(slugs, [null, 'omega'], 'alpha')).toBe('alpha');
      expect(posedSlugOf([], [null], null)).toBeNull();
    });
  });
});
