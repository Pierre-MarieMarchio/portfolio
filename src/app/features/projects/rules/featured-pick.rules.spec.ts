import { neighbourOf, restingPickOf, swipeStepOf } from './featured-pick.rules';

describe('featured pick', () => {
  const slugs = ['alpha', 'beta', 'gamma'];

  it('steps to the next and the previous featured project', () => {
    expect(neighbourOf(slugs, 'beta', 1)).toBe('gamma');
    expect(neighbourOf(slugs, 'beta', -1)).toBe('alpha');
  });

  it('stops at both ends instead of wrapping', () => {
    expect(neighbourOf(slugs, 'alpha', -1)).toBeNull();
    expect(neighbourOf(slugs, 'gamma', 1)).toBeNull();
  });

  it('steps from the first one when the current one is not featured', () => {
    expect(neighbourOf(slugs, 'omega', 1)).toBe('beta');
    expect(neighbourOf(slugs, null, -1)).toBeNull();
  });

  it('has nowhere to go without featured projects', () => {
    expect(neighbourOf([], null, 1)).toBeNull();
  });

  it('reads a swipe to the left as the next one, to the right as the previous one', () => {
    expect(swipeStepOf(-48, 0)).toBe(1);
    expect(swipeStepOf(60, 10)).toBe(-1);
  });

  it('ignores a short swipe', () => {
    expect(swipeStepOf(-47, 0)).toBe(0);
  });

  it('ignores a swipe that is not clearly horizontal', () => {
    expect(swipeStepOf(-60, 40)).toBe(0);
    expect(swipeStepOf(60, -41)).toBe(0);
    expect(swipeStepOf(-61, 40)).toBe(1);
  });

  it('rests on the last featured project read, else on the first one', () => {
    expect(restingPickOf(slugs, 'gamma')).toBe('gamma');
    expect(restingPickOf(slugs, null)).toBe('alpha');
    expect(restingPickOf(slugs, 'omega')).toBe('alpha');
    expect(restingPickOf([], null)).toBeNull();
  });
});
