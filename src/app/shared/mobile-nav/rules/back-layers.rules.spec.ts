import {
  closedBy,
  LAYER_KEY,
  layerOf,
  stepsBack,
  withLayer,
} from './back-layers.rules';

describe('back layers rules', () => {
  it('keeps what the history state already holds, and adds the layer', () => {
    expect(withLayer({ navigationId: 3 }, 1)).toEqual({
      navigationId: 3,
      [LAYER_KEY]: 1,
    });
  });

  it.each([null, undefined, 'text', 4])(
    'starts from an empty state when the history holds %s',
    (state) => {
      expect(withLayer(state, 2)).toEqual({ [LAYER_KEY]: 2 });
    },
  );

  it.each([
    [{ [LAYER_KEY]: 2 }, 2],
    [{ navigationId: 1 }, 0],
    [{ [LAYER_KEY]: 'two' }, 0],
    [{ [LAYER_KEY]: -1 }, 0],
    [null, 0],
  ])('reads the layer of %j as %i', (state, depth) => {
    expect(layerOf(state)).toBe(depth);
  });

  it('closes every layer above the one the back button arrived at, the top first', () => {
    expect(closedBy([1, 2, 3], 1)).toEqual([3, 2]);
    expect(closedBy([1, 2, 3], 0)).toEqual([3, 2, 1]);
    expect(closedBy([1, 2], 2)).toEqual([]);
  });

  it('goes back one entry per layer from the top down to the one released', () => {
    expect(stepsBack([1], 1)).toBe(1);
    expect(stepsBack([1, 2, 3], 2)).toBe(2);
    expect(stepsBack([1, 2], 3)).toBe(0);
  });
});
