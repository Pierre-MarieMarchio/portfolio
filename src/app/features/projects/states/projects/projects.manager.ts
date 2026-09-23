import { computed, inject, Injectable, InjectionToken } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { Lang } from '@app/core/models';
import { LocaleService } from '@app/core/services';
import { localize } from '@app/core/rules';
import {
  Project,
  ProjectDetail,
  ProjectFamily,
  RankedProject,
} from '../../models';
import { rank } from '../../rules/ranking.rules';
import { getProjectsActions } from './projects.action';
import { ProjectsState } from './projects.state';
import { projectsUpdater } from './projects.updater';

export const FEATURED = new InjectionToken<number>('FEATURED', {
  providedIn: 'root',
  factory: () => 4,
});

@Injectable({ providedIn: 'root' })
export class ProjectsManager {
  private readonly state = inject(ProjectsState);
  private readonly statewise = injectStatewise(projectsUpdater);
  private readonly featuredCount = inject(FEATURED);
  private readonly lang = inject(LocaleService).lang;

  public readonly projects = computed(() =>
    localize(this.state.projects(), this.lang()),
  );

  public readonly ranked = computed<readonly RankedProject[]>(() => {
    const facts = this.state.facts();
    const lang = this.lang();
    return rank(this.projects(), this.featuredCount).flatMap((project) => {
      const found = facts[project.slug];
      return found ? [{ ...project, facts: localize(found, lang) }] : [];
    });
  });

  public readonly featured = computed(() =>
    this.ranked().filter((project) => project.featured),
  );

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

  private readonly bySlug = computed(
    () => new Map(this.ranked().map((project) => [project.slug, project])),
  );

  private readonly details = computed(() =>
    localize(this.state.details(), this.lang()),
  );

  public find(slug: string): RankedProject | null {
    return this.bySlug().get(slug) ?? null;
  }

  public findIn(slug: string, lang: Lang): RankedProject | null {
    const found = this.find(slug);
    const project = this.state.projects().find((each) => each.slug === slug);
    const facts = this.state.facts()[slug];
    return found && project && facts
      ? { ...found, ...localize(project, lang), facts: localize(facts, lang) }
      : null;
  }

  public detailOf(slug: string): ProjectDetail | null {
    return this.details()[slug] ?? null;
  }

  public nextOf(slug: string): Project | null {
    const project = this.find(slug);
    const ranked = this.ranked();
    return !project || ranked.length < 2
      ? null
      : (ranked[(ranked.indexOf(project) + 1) % ranked.length] ?? null);
  }

  public isFeatured(slug: string): boolean {
    return this.find(slug)?.featured ?? false;
  }

  public load(): Promise<void> {
    return this.statewise.dispatchAsync(getProjectsActions.request());
  }
}
