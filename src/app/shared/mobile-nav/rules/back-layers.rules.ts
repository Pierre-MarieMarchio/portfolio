export const LAYER_KEY = 'mobileNavLayer';

const isRecord = (state: unknown): state is Record<string, unknown> =>
  typeof state === 'object' && state !== null;

export const withLayer = (
  state: unknown,
  depth: number,
): Record<string, unknown> => ({
  ...(isRecord(state) ? state : {}),
  [LAYER_KEY]: depth,
});

export const layerOf = (state: unknown): number => {
  const depth = isRecord(state) ? state[LAYER_KEY] : null;
  return typeof depth === 'number' && depth > 0 ? depth : 0;
};

export const closedBy = (open: readonly number[], arrived: number): number[] =>
  open.filter((depth) => depth > arrived).sort((a, b) => b - a);

export const stepsBack = (open: readonly number[], released: number): number =>
  open.includes(released) ? Math.max(...open) - released + 1 : 0;
