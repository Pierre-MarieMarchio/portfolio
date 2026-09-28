export const centredOffset = (
  start: number,
  width: number,
  viewport: number,
  maxScroll: number,
): number => {
  const offset = start + width / 2 - viewport / 2;
  return Number.isFinite(offset)
    ? Math.min(Math.max(offset, 0), Math.max(maxScroll, 0))
    : 0;
};

export const cardAt = (
  scrollLeft: number,
  offsets: readonly number[],
): number =>
  offsets.reduce(
    (nearest, offset, index) =>
      Math.abs(scrollLeft - offset) <
      Math.abs(scrollLeft - (offsets[nearest] ?? 0))
        ? index
        : nearest,
    0,
  );
