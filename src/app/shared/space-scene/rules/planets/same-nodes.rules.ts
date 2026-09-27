export const isSameList = (
  next: readonly HTMLElement[],
  given: readonly HTMLElement[],
): boolean =>
  next.length === given.length &&
  next.every((element, i) => element === given[i]);
