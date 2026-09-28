import { cardAt, centredOffset } from './carousel.rules';

describe('centredOffset', () => {
  it('scrolls a card to the middle of the viewport', () => {
    expect(centredOffset(620, 280, 360, 1000)).toBe(580);
  });

  it('never scrolls past the end, nor before the start', () => {
    expect(centredOffset(40, 280, 360, 1000)).toBe(0);
    expect(centredOffset(1400, 280, 360, 1000)).toBe(1000);
  });

  it('stays at the start when nothing is laid out', () => {
    expect(centredOffset(0, 0, 0, 0)).toBe(0);
    expect(centredOffset(NaN, 280, 360, 1000)).toBe(0);
  });
});

describe('cardAt', () => {
  const offsets = [0, 290, 580, 870];

  it.each([
    [0, 0],
    [144, 0],
    [146, 1],
    [580, 2],
    [2000, 3],
    [-40, 0],
  ])('reads a scroll of %d px as card %d', (scrollLeft, card) => {
    expect(cardAt(scrollLeft, offsets)).toBe(card);
  });

  it('keeps the first of the cards that share a place', () => {
    expect(cardAt(0, [0, 0, 0])).toBe(0);
  });

  it('reads the first card when there is none', () => {
    expect(cardAt(300, [])).toBe(0);
  });
});
