import { computed, inject, Injectable } from '@angular/core';
import { FamilyFilter } from '@app/features/projects/components';
import { ProjectsManager } from '@app/features/projects/states';
import { DesktopView } from '@app/features/desktop/models';
import { DesktopManager } from '@app/features/desktop/states';

/**
 * Where the station meets the projects. The station speaks in slugs and
 * knows no catalogue; the projects know the catalogue and no station; the
 * object speaks in ranks, the catalogue's order. This is the one place the
 * three are translated into each other, so it is where a sheet's slug is
 * found to name a project or not.
 *
 * Provided by the station component, which composes the two features.
 */
@Injectable()
export class DesktopProjectsBinding {
  private readonly station = inject(DesktopManager);
  private readonly projects = inject(ProjectsManager);

  /** The slug of the sheet on show, when it names a project. */
  public readonly sheetSlug = computed(() => {
    const slug = this.station.slug();
    return slug && this.projects.find(slug) ? slug : null;
  });

  public readonly isNotFound = computed(
    () =>
      this.station.view() === 'not-found' ||
      (this.station.view() === 'sheet' && this.sheetSlug() === null),
  );

  /** The station keeps the filter opaque; only a known family passes. */
  public readonly family = computed<FamilyFilter>(() => {
    const family = this.station.family();
    return family === 'professional' || family === 'personal' ? family : 'all';
  });

  /** The featured projects, numbered, for the home rule. */
  public readonly featured = this.projects.featured;

  public readonly featuredSlugs = computed(() =>
    this.projects.featured().map((project) => project.slug),
  );

  public readonly projectCount = computed(() => this.projects.ranked().length);

  public readonly featuredCount = computed(
    () => this.projects.featured().length,
  );

  public readonly objectView = computed<DesktopView>(() =>
    this.isNotFound() ? 'not-found' : this.station.view(),
  );

  public isFeatured(slug: string): boolean {
    return this.projects.isFeatured(slug);
  }
}
