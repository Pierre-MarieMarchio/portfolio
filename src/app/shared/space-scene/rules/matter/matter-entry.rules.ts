export const MATTER_ENTRY_SPAN = 6.2;

export const hastenedEntrySpan = (entry: number, within: number): number =>
  Math.min(MATTER_ENTRY_SPAN, within / (1 - entry));
