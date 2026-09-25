const SCENE_TARGET = '[data-scene-target]';
const OTHER_GESTURES = '[data-panel], a, input, textarea, select';

const targetOf = (event: Event): Element | null =>
  event.target instanceof Element ? event.target : null;

export const isOnSky = (event: Event): boolean => {
  const target = targetOf(event);
  return (
    target !== null &&
    !target.closest(SCENE_TARGET) &&
    !target.closest(OTHER_GESTURES)
  );
};

export const isOnScene = (event: Event): boolean => {
  const target = targetOf(event);
  return (
    target !== null &&
    (target.closest(SCENE_TARGET) !== null || !target.closest(OTHER_GESTURES))
  );
};
