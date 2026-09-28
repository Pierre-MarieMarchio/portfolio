export interface SegmentedItem<T = string> {
  readonly value: T;
  readonly label: string;
  readonly phoneLabel?: string;
  readonly count?: string;
  readonly active: boolean;
  readonly aria?: string;
}
