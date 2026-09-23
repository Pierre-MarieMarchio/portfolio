export const isOnControl = (event: Event): boolean =>
  event.target instanceof Element && event.target.closest('button, a') !== null;
