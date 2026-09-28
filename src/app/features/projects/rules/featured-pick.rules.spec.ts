import { restingPickOf } from './featured-pick.rules';

describe('featured pick', () => {
  const slugs = ['alpha', 'beta', 'gamma'];

  it('rests on the last featured project read, else on the first one', () => {
    expect(restingPickOf(slugs, 'gamma')).toBe('gamma');
    expect(restingPickOf(slugs, null)).toBe('alpha');
    expect(restingPickOf(slugs, 'omega')).toBe('alpha');
    expect(restingPickOf([], null)).toBeNull();
  });
});
