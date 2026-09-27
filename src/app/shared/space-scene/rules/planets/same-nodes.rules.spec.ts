import { isSameList } from './same-nodes.rules';

const nodes = (count: number): HTMLElement[] =>
  Array.from({ length: count }, () => document.createElement('span'));

describe('isSameList', () => {
  it('holds two lists of the same nodes in the same order', () => {
    const [a, b] = nodes(2);
    if (!a || !b) {
      throw new Error('two nodes expected');
    }

    expect(isSameList([a, b], [a, b])).toBe(true);
    expect(isSameList([], [])).toBe(true);
  });

  it('tells apart another order, another node or another length', () => {
    const [a, b, c] = nodes(3);
    if (!a || !b || !c) {
      throw new Error('three nodes expected');
    }

    expect(isSameList([a, b], [b, a])).toBe(false);
    expect(isSameList([a, b], [a, c])).toBe(false);
    expect(isSameList([a], [a, b])).toBe(false);
  });
});
