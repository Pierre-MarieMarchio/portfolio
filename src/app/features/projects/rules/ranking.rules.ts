import { twoDigits } from '@app/core/helpers';
import { Ranking } from '../models';

export function rank<T extends object>(
  projects: readonly T[],
  featuredCount: number,
): (T & Ranking)[] {
  return projects.map((project, place) => ({
    ...project,
    rank: place,
    number: twoDigits(place + 1),
    featured: place < featuredCount,
  }));
}
