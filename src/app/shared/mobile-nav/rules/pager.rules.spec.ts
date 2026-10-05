import {
  clampPage,
  indexOfChild,
  isAt,
  offsetOfPage,
  pageAfterSwipe,
  pageAt,
} from './pager.rules';

describe('clampPage', () => {
  it.each([
    [2, 4, 2],
    [-1, 4, 0],
    [7, 4, 3],
    [1.6, 4, 2],
    [NaN, 4, 0],
    [2, 0, 0],
  ])('keeps %d among %d pages at %d', (index, count, page) => {
    expect(clampPage(index, count)).toBe(page);
  });
});

describe('pageAt', () => {
  it.each([
    [0, 390, 4, 0],
    [390, 390, 4, 1],
    [584, 390, 4, 1],
    [586, 390, 4, 2],
    [2000, 390, 4, 3],
    [400, 0, 4, 0],
  ])(
    'reads a scroll of %d px over pages of %d px, %d of them, as page %d',
    (scrollLeft, width, count, page) => {
      expect(pageAt(scrollLeft, width, count)).toBe(page);
    },
  );
});

describe('offsetOfPage', () => {
  it('puts a page at its rank times the page width', () => {
    expect(offsetOfPage(2, 390, 1170)).toBe(780);
  });

  it('never scrolls past the end, nor before the start', () => {
    expect(offsetOfPage(3, 390, 780)).toBe(780);
    expect(offsetOfPage(-1, 390, 780)).toBe(0);
  });

  it('stays at the start when the pages show one at a time', () => {
    expect(offsetOfPage(2, 390, 0)).toBe(0);
  });
});

describe('isAt', () => {
  it('takes a scroll within a pixel of the offset as there', () => {
    expect(isAt(779.5, 780)).toBe(true);
    expect(isAt(778, 780)).toBe(false);
  });
});

describe('indexOfChild', () => {
  const container = document.createElement('ul');
  const children = [
    document.createElement('li'),
    document.createElement('li'),
    document.createElement('li'),
  ];
  for (const child of children) {
    container.append(child);
  }

  it('reads the rank of the snapped-to child among its siblings', () => {
    expect(indexOfChild(container, children[1] ?? null)).toBe(1);
  });

  it('reads no index where the browser announces none', () => {
    expect(indexOfChild(container, null)).toBeNull();
  });

  it('reads no index for an element outside the container', () => {
    expect(indexOfChild(container, document.createElement('li'))).toBeNull();
  });
});

describe('pageAfterSwipe', () => {
  it.each([
    [1, { dx: -40, dy: 4, ms: 80 }, 4, 2],
    [1, { dx: 40, dy: -4, ms: 80 }, 4, 0],
    [0, { dx: -70, dy: 0, ms: 430 }, 4, 1],
  ])(
    'moves page %#: one page in the direction of a short horizontal swipe',
    (origin, swipe, count, expected) => {
      expect(pageAfterSwipe(origin, swipe, count)).toBe(expected);
    },
  );

  it.each([
    ['too short', { dx: -10, dy: 0, ms: 60 }],
    ['more vertical than horizontal', { dx: -40, dy: 60, ms: 60 }],
    ['too slow to be a flick', { dx: -40, dy: 0, ms: 900 }],
    ['instant, with no time elapsed and no travel', { dx: 0, dy: 0, ms: 0 }],
  ])('stays where the swipe is %s', (_case, swipe) => {
    expect(pageAfterSwipe(1, swipe, 4)).toBe(1);
  });

  it('never leaves the first or the last page', () => {
    expect(pageAfterSwipe(0, { dx: 40, dy: 0, ms: 80 }, 4)).toBe(0);
    expect(pageAfterSwipe(3, { dx: -40, dy: 0, ms: 80 }, 4)).toBe(3);
  });
});
