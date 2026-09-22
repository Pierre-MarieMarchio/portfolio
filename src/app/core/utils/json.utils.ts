/**
 * Whether a value survives `JSON.stringify`. A string answers `false` on
 * purpose: it is stored as it is, not wrapped in quotes.
 */
export function isSerializable(value: unknown): boolean {
  if (typeof value === 'string') return false;

  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}
