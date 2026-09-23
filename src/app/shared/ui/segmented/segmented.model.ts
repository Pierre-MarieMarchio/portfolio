/**
 * What a caller says about one choice, and nothing about its look: the look
 * is decided once, in the component, so two selectors never drift apart.
 *
 * `value` is what the click hands back: the caller knows its own keys, and
 * never has to find the item again by its label or its identity.
 */
export interface SegmentedItem<T = string> {
  readonly value: T;
  readonly label: string;
  /** Already formatted (the mockup pads to two digits: "07"). */
  readonly count?: string;
  readonly active: boolean;
  /** The accessible name when the label alone is too terse. */
  readonly aria?: string;
}
