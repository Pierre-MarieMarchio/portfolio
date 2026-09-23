/**
 * What a caller says about one choice, and nothing about its look: the look
 * is decided once, in the component, so two selectors never drift apart.
 */
export interface SegmentedItem {
  readonly label: string;
  /** Already formatted (the mockup pads to two digits: "07"). */
  readonly count?: string;
  readonly active: boolean;
  /** The accessible name when the label alone is too terse. */
  readonly aria?: string;
}
