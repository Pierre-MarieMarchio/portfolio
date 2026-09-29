export const cycleTarget = (
  shown: readonly HTMLElement[],
  direction: 1 | -1,
): HTMLElement | null => {
  if (shown.length === 0) {
    return null;
  }
  const index = (direction + shown.length) % shown.length;
  return shown[index] ?? null;
};

export const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.contentEditable === 'true');
