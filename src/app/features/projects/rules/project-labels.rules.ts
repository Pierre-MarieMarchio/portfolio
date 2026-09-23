import { twoDigits } from '@app/core/helpers';
import { RankedProject } from '../models';

/**
 * A project's accessible name wherever it is listed ("01 — Skyted Voice ·
 * Publiée · deux magasins"): its number, its title and what can be checked,
 * the three things a reader scanning a list compares.
 */
export function rowLabel(project: RankedProject): string {
  return `${project.number} — ${project.title} · ${project.facts.proof}`;
}

/** Where an item stands among its peers, as the badges print it: "03 / 07". */
export function positionOf(place: number, total: number): string {
  return `${twoDigits(place)} / ${twoDigits(total)}`;
}
