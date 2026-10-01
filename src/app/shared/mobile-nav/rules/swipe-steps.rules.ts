import type { SwipeFollow, SwipeRelease } from '../models/swipe.model';
import { clampPage } from './pager.rules';

const REACH = 0.25;
const FLICK_SPEED = 0.4;
const FLICK_REACH = 24;
const RESISTANCE = 0.25;

const stepToward = (travel: number, index: number, count: number): number =>
  clampPage(index - Math.sign(travel), count) - index;

export const stepAfter = ({
  travel,
  ms,
  width,
  index,
  count,
}: SwipeRelease): number => {
  const distance = Math.abs(travel);
  const isFar = distance >= width * REACH;
  const isFlick =
    distance >= FLICK_REACH && distance / Math.max(ms, 1) > FLICK_SPEED;
  return isFar || isFlick ? stepToward(travel, index, count) : 0;
};

export const followOf = (
  travel: number,
  width: number,
  index: number,
  count: number,
): SwipeFollow => {
  const fraction = width > 0 ? Math.max(-1, Math.min(1, travel / width)) : 0;
  return stepToward(travel, index, count) === 0
    ? { pane: fraction * RESISTANCE, at: index }
    : { pane: fraction, at: index - fraction };
};
