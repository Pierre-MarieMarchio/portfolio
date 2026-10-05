import { inject, linkedSignal, Service } from '@angular/core';
import { ObservatoryManager } from '../states';
import type { ObservatoryView } from '../models';

interface Reading {
  readonly view: ObservatoryView;
  readonly slug: string | null;
  readonly lastSheet: string | null;
}

const isOpened = (previous: Reading | undefined, next: Reading): boolean => {
  if (next.view !== 'sheet') {
    return false;
  }
  if (!previous) {
    return true;
  }
  if (previous.view === 'index') {
    return true;
  }
  return previous.view === 'sheet'
    ? previous.slug !== next.slug
    : previous.lastSheet !== next.slug;
};

@Service({ autoProvided: false })
export class ProjectSheetService {
  private readonly observatory = inject(ObservatoryManager);

  public readonly openings = linkedSignal<Reading, number>({
    source: () => ({
      view: this.observatory.view(),
      slug: this.observatory.slug(),
      lastSheet: this.observatory.lastSheet(),
    }),
    computation: (reading, previous) =>
      (previous?.value ?? 0) + (isOpened(previous?.source, reading) ? 1 : 0),
  });
}
