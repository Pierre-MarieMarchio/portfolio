import { isSameList } from './same-nodes.rules';
import { elements } from '@testing/fixtures/engine-scene.fixture';
import { tupleOf } from '@testing/fixtures/testbed.fixture';

describe('isSameList', () => {
  it('holds two lists of the same nodes in the same order', () => {
    const [a, b] = tupleOf(elements(2), 2);

    expect(isSameList([a, b], [a, b])).toBe(true);
    expect(isSameList([], [])).toBe(true);
  });

  it('tells apart another order, another node or another length', () => {
    const [a, b, c] = tupleOf(elements(3), 3);

    expect(isSameList([a, b], [b, a])).toBe(false);
    expect(isSameList([a, b], [a, c])).toBe(false);
    expect(isSameList([a], [a, b])).toBe(false);
  });
});
