import type {
  DisplayConditions,
  DisplayFormat,
} from '../models/display-format.model';

export const PHONE_WIDTH_BELOW = 620;
export const PHONE_HEIGHT_BELOW_WITH_COARSE_POINTER = 500;

export const SERVER_DISPLAY_FORMAT: DisplayFormat = 'desktop';

const isPhone = ({
  width,
  height,
  hasCoarsePointer,
}: DisplayConditions): boolean =>
  width < PHONE_WIDTH_BELOW ||
  (hasCoarsePointer && height < PHONE_HEIGHT_BELOW_WITH_COARSE_POINTER);

export const displayFormatOf = (
  conditions: DisplayConditions,
): DisplayFormat => {
  if (isPhone(conditions)) {
    return 'phone';
  }
  return conditions.hasCoarsePointer || conditions.cannotHover
    ? 'tablet'
    : 'desktop';
};
