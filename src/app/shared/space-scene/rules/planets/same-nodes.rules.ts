export const isSameList = <T>(
  next: readonly T[],
  given: readonly T[],
): boolean =>
  next.length === given.length &&
  next.every((element, i) => element === given[i]);
