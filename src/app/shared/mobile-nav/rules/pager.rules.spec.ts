import { clampPage, isAt, offsetOfPage, pageAt } from './pager.rules';

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
