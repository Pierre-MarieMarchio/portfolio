export const clampPage = (index: number, count: number): number =>
  Number.isFinite(index) && count > 0
    ? Math.min(Math.max(Math.round(index), 0), count - 1)
    : 0;

export const pageAt = (
  scrollLeft: number,
  pageWidth: number,
  count: number,
): number => (pageWidth > 0 ? clampPage(scrollLeft / pageWidth, count) : 0);

export const offsetOfPage = (
  index: number,
  pageWidth: number,
  maxScroll: number,
): number => Math.min(Math.max(index, 0) * pageWidth, Math.max(maxScroll, 0));

export const isAt = (scrollLeft: number, offset: number): boolean =>
  Math.abs(scrollLeft - offset) < 1;

export const indexOfChild = (
  container: Element,
  target: Element | null,
): number | null => {
  if (!target) {
    return null;
  }
  const index = Array.prototype.indexOf.call(container.children, target);
  return index === -1 ? null : index;
};
