import { computed, inject, Injectable, InjectionToken } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { Locale, resolve } from '@app/core/i18n';
import { twoDigits } from '@app/core/utils/format.utils';
import { PROJECTS_TEXTS } from '../../i18n';
import {
  Project,
  ProjectFacts,
  ProjectFamily,
  ProjectSheet,
  ProofLevel,
  RankedProject,
} from '../../models';
import { getProjectsActions, projectsReset } from './projects.action';
import { ProjectsState } from './projects.state';
import { projectsUpdater } from './projects.updater';

/**
 * The home page carries the selection, not the corpus: the two published
 * applications and the two public repositories, projects a reader can open
 * themself. They are the first of the rank order. The one value to change
 * to feature more or fewer: every view reads it through `featured`.
 */
export const FEATURED_COUNT = 4;

/**
 * The count the manager reads: `FEATURED_COUNT`, unless a spec provides
 * another to see the home page at three or five. A default, unlike a port's
 * token: the application never provides it, the constant is the setting.
 */
export const FEATURED = new InjectionToken<number>('FEATURED', {
  providedIn: 'root',
  factory: () => FEATURED_COUNT,
});

/** The only API components and pages see of the projects. */
@Injectable({ providedIn: 'root' })
export class ProjectsManager {
  private readonly state = inject(ProjectsState);
  private readonly statewise = injectStatewise(projectsUpdater);
  private readonly featuredCount = inject(FEATURED);
  private readonly lang = inject(Locale).lang;
  private readonly texts = inject(PROJECTS_TEXTS);

  /**
   * The projects in the reader's language. The state holds both; reading
   * them in one is a derivation, so a language switch reloads nothing.
   */
  public readonly projects = computed(() =>
    resolve(this.state.projects(), this.lang()),
  );
  public readonly isLoading = this.state.isLoading.asReadonly();
  public readonly isError = this.state.isError.asReadonly();

  /**
   * Every project in its place, with its facts, its rank from 0 and its
   * printed number. The number follows the rank and nothing else: the index,
   * the rule, the preview and the sheet read it here, so a filter or a
   * missing entry can never shift one view's numbers against another's.
   *
   * The type of an entry requires its facts; a catalog from elsewhere that
   * lacks some still draws no blank row, and keeps every other number.
   */
  public readonly ranked = computed<readonly RankedProject[]>(() => {
    const facts = this.state.facts();
    const lang = this.lang();
    return this.projects().flatMap((project, rank) => {
      const found = facts[project.slug];
      return found
        ? [
            {
              ...project,
              facts: resolve(found, lang),
              rank,
              number: twoDigits(rank + 1),
              featured: rank < this.featuredCount,
            },
          ]
        : [];
    });
  });

  /**
   * Derived from the rank, never stored: a flag per project would let the
   * home page's selection drift from the order it is taken from.
   */
  public readonly featured = computed(() =>
    this.ranked().filter((project) => project.featured),
  );

  /** Counted on the rows drawn, so a count and its rows always agree. */
  public readonly familyCounts = computed<
    Readonly<Record<ProjectFamily, number>>
  >(() => {
    const counts: Record<ProjectFamily, number> = {
      professional: 0,
      personal: 0,
    };
    for (const project of this.ranked()) {
      counts[project.family] += 1;
    }
    return counts;
  });

  /**
   * Rebuilt only when the list changes, so looking a project up by its slug
   * costs a map read however often a template asks.
   */
  private readonly bySlug = computed(
    () => new Map(this.ranked().map((project) => [project.slug, project])),
  );

  /**
   * The project behind a slug, or `null` when there is none. A page keeps the
   * slug and derives the project through this, never a copy that could go
   * stale after a reload.
   */
  public find(slug: string): RankedProject | null {
    return this.bySlug().get(slug) ?? null;
  }

  public isFeatured(slug: string): boolean {
    return this.find(slug)?.featured ?? false;
  }

  /**
   * The project after this one in the rank, wrapping round after the last:
   * the reading never ends in a dead end. `null` for an unknown slug, or
   * when there is no other project to go to.
   */
  public nextOf(slug: string): Project | null {
    const project = this.find(slug);
    const ranked = this.ranked();
    return !project || ranked.length < 2
      ? null
      : (ranked[(ranked.indexOf(project) + 1) % ranked.length] ?? null);
  }

  /** The facts of a project: the one table every view reads. */
  public factsOf(slug: string): ProjectFacts | null {
    return this.find(slug)?.facts ?? null;
  }

  /** Every sheet in the reader's language, read once per language. */
  private readonly sheets = computed(() =>
    resolve(this.state.sheets(), this.lang()),
  );

  public sheetOf(slug: string): ProjectSheet | null {
    return this.sheets()[slug] ?? null;
  }

  public proofLevelLabel(level: ProofLevel): string {
    return this.texts().proofLevels[level];
  }

  /**
   * A chapter's title: its own when it names one, the default of its
   * position otherwise, and empty past the defaults.
   */
  public chapterTitle(slug: string, index: number): string {
    const chapter = this.sheetOf(slug)?.chapters[index];
    return chapter
      ? (chapter.title ?? this.texts().defaultChapterTitles[index] ?? '')
      : '';
  }

  /** Resolves once the read and everything it cascaded into have settled. */
  public load(): Promise<void> {
    return this.statewise.dispatchAsync(getProjectsActions.request());
  }

  public reset(): Promise<void> {
    return this.statewise.dispatchAsync(projectsReset());
  }
}
