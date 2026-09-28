export function restingPickOf(
  slugs: readonly string[],
  reading: string | null,
): string | null {
  return reading !== null && slugs.includes(reading)
    ? reading
    : (slugs[0] ?? null);
}
