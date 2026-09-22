import { computed, inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { Project } from '../../models';
import { getProjectsActions, projectsReset } from './projects.action';
import { ProjectsState } from './projects.state';
import { projectsUpdater } from './projects.updater';

/** The only API components and pages see of the projects. */
@Injectable({ providedIn: 'root' })
export class ProjectsManager {
  private readonly state = inject(ProjectsState);
  private readonly statewise = injectStatewise(projectsUpdater);

  public readonly projects = this.state.projects.asReadonly();
  public readonly isLoading = this.state.isLoading.asReadonly();
  public readonly isError = this.state.isError.asReadonly();

  /** In rank order, since filtering never reorders. */
  public readonly featured = computed(() =>
    this.projects().filter((project) => project.featured),
  );

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

  /** Resolves once the read and everything it cascaded into have settled. */
  public load(): Promise<void> {
    return this.statewise.dispatchAsync(getProjectsActions.request());
  }

  public reset(): Promise<void> {
    return this.statewise.dispatchAsync(projectsReset());
  }
}
