import type { SheetDetent } from '@shared/mobile-nav/models';

export function homeDetentAfter(
  isPosed: boolean,
  previous: SheetDetent | undefined,
): SheetDetent {
  if (isPosed) {
    return 'full';
  }
  return previous === undefined || previous === 'full' ? 'half' : previous;
}

export function posedSlugOf(
  slugs: readonly string[],
  candidates: readonly (string | null)[],
  resting: string | null,
): string | null {
  return (
    candidates.find(
      (slug): slug is string => slug !== null && slugs.includes(slug),
    ) ?? resting
  );
}
