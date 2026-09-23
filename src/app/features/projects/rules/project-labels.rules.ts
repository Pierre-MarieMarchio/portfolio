import { twoDigits } from '@app/core/helpers';
import { ProjectDetail, ProofLevel, RankedProject } from '../models';

export function rowLabel(project: RankedProject): string {
  return `${project.number} — ${project.title} · ${project.facts.proof}`;
}

export function positionOf(place: number, total: number): string {
  return `${twoDigits(place)} / ${twoDigits(total)}`;
}

export function proofLevelLabel(
  level: ProofLevel,
  labels: Readonly<Record<ProofLevel, string>>,
): string {
  return labels[level];
}

export function chapterTitle(
  detail: ProjectDetail | null,
  index: number,
  defaultTitles: readonly string[],
): string {
  const chapter = detail?.chapters[index];
  return chapter ? (chapter.title ?? defaultTitles[index] ?? '') : '';
}
