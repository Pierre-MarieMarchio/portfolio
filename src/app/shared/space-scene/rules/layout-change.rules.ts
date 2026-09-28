const PAINT_ONLY = /color|shadow|fill|stroke|filter/;

export const canMoveLayout = (event: Event): boolean =>
  !(event instanceof TransitionEvent) || !PAINT_ONLY.test(event.propertyName);
