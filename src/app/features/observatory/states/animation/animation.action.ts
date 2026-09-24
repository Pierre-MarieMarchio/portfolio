import { defineSingleAction, emptyPayload } from 'ngx-statewise';

export const animationPauseToggled = defineSingleAction(
  'ANIMATION_PAUSE_TOGGLED',
  emptyPayload,
);
