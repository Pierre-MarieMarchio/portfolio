import { followOf, stepAfter } from './swipe-steps.rules';

const release = (travel: number, ms = 300, index = 1) => ({
  travel,
  ms,
  width: 400,
  index,
  count: 3,
});

describe('stepAfter', () => {
  it('goes to the next filter on a long drag to the left', () => {
    expect(stepAfter(release(-120))).toBe(1);
  });

  it('goes to the previous filter on a long drag to the right', () => {
    expect(stepAfter(release(120))).toBe(-1);
  });

  it('stays on a short, slow drag', () => {
    expect(stepAfter(release(-60))).toBe(0);
    expect(stepAfter(release(60))).toBe(0);
  });

  it('steps on a short flick in the direction of the drag', () => {
    expect(stepAfter(release(-40, 50))).toBe(1);
    expect(stepAfter(release(40, 50))).toBe(-1);
  });

  it('ignores a flick that is too short to be one', () => {
    expect(stepAfter(release(-10, 5))).toBe(0);
  });

  it('does not pass the first filter to the left of it', () => {
    expect(stepAfter(release(300, 100, 0))).toBe(0);
  });

  it('does not pass the last filter to the right of it', () => {
    expect(stepAfter(release(-300, 100, 2))).toBe(0);
  });

  it('stays when there is no drag at all', () => {
    expect(stepAfter(release(0))).toBe(0);
  });
});

describe('followOf', () => {
  it('follows the finger as a fraction of the width and lights the neighbour', () => {
    expect(followOf(-100, 400, 1, 3)).toEqual({ pane: -0.25, at: 1.25 });
    expect(followOf(100, 400, 1, 3)).toEqual({ pane: 0.25, at: 0.75 });
  });

  it('holds the finger back where there is no neighbour', () => {
    expect(followOf(100, 400, 0, 3)).toEqual({ pane: 0.0625, at: 0 });
    expect(followOf(-100, 400, 2, 3)).toEqual({ pane: -0.0625, at: 2 });
  });

  it('never goes past one width', () => {
    expect(followOf(-900, 400, 1, 3).pane).toBe(-1);
  });

  it('is nil on a zero width', () => {
    expect(followOf(-50, 0, 1, 3)).toEqual({ pane: 0, at: 1 });
  });
});
