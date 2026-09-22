import { computed, inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import {
  Project,
  ProjectFacts,
  ProjectFamily,
  ProjectSheet,
  ProjectWithFacts,
  ProofLevel,
} from '../../models';
import { getProjectsActions, projectsReset } from './projects.action';
import { ProjectsState } from './projects.state';
import { projectsUpdater } from './projects.updater';

/**
 * The home page carries the selection, not the corpus: the two published
 * applications and the two public repositories, four projects a reader can
 * open themself. They are the first four of the rank order.
 */
export const FEATURED_COUNT = 4;

/** The only API components and pages see of the projects. */
@Injectable({ providedIn: 'root' })
export class ProjectsManager {
  private readonly state = inject(ProjectsState);
  private readonly statewise = injectStatewise(projectsUpdater);

  public readonly projects = this.state.projects.asReadonly();
  public readonly layers = this.state.layers.asReadonly();
  public readonly isLoading = this.state.isLoading.asReadonly();
  public readonly isError = this.state.isError.asReadonly();

  /**
   * Derived from the rank, never stored: a flag per project would let the
   * home page's selection drift from the order it is taken from.
   */
  public readonly featured = computed(() =>
    this.projects().slice(0, FEATURED_COUNT),
  );

  /**
   * Every project with its facts, in rank order: what the index and the
   * preview draw. A project whose facts are missing is left out rather than
   * drawn with blanks.
   */
  public readonly withFacts = computed<readonly ProjectWithFacts[]>(() => {
    const facts = this.state.facts();
    return this.projects().flatMap((project) => {
      const found = facts[project.slug];
      return found ? [{ ...project, facts: found }] : [];
    });
  });

  public readonly familyCounts = computed<
    Readonly<Record<ProjectFamily, number>>
  >(() => {
    const counts: Record<ProjectFamily, number> = {
      professional: 0,
      personal: 0,
    };
    for (const project of this.projects()) {
      counts[project.family] += 1;
    }
    return counts;
  });

  /**
   * Rebuilt only when the list changes, so looking a project up by its slug
   * costs a map read however often a template asks.
   */
  private readonly bySlug = computed(
    () => new Map(this.projects().map((project) => [project.slug, project])),
  );

  /**
   * The project behind a slug, or `null` when there is none. A page keeps the
   * slug and derives the project through this, never a copy that could go
   * stale after a reload.
   */
  public find(slug: string): Project | null {
    return this.bySlug().get(slug) ?? null;
  }

  /** The facts of a project: the one table every view reads. */
  public factsOf(slug: string): ProjectFacts | null {
    return this.state.facts()[slug] ?? null;
  }

  public sheetOf(slug: string): ProjectSheet | null {
    return this.state.sheets()[slug] ?? null;
  }

  /** The 1-based place in the rank, as the index numbers it; 0 when unknown. */
  public rankOf(slug: string): number {
    return this.projects().findIndex((project) => project.slug === slug) + 1;
  }

  public proofLevelLabel(level: ProofLevel): string {
    return this.state.proofLevelLabels()[level];
  }

  /**
   * A chapter's title: its own when it names one, the default of its
   * position otherwise, and empty past the defaults.
   */
  public chapterTitle(slug: string, index: number): string {
    const chapter = this.sheetOf(slug)?.chapters[index];
    if (!chapter) {
      return '';
    }
    return chapter.title ?? this.state.defaultChapterTitles()[index] ?? '';
  }

  /** Resolves once the read and everything it cascaded into have settled. */
  public load(): Promise<void> {
    return this.statewise.dispatchAsync(getProjectsActions.request());
  }

  public reset(): Promise<void> {
    return this.statewise.dispatchAsync(projectsReset());
  }
}
