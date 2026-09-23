import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { twoDigits } from '@app/core/helpers';
import { SegmentedComponent } from '@shared/ui/components';
import { SegmentedItem } from '@shared/ui/models';
import { WindowComponent } from '@shared/windows/components';
import { FAMILIES, FamilyFilter } from '../../models';
import { ProjectsManager } from '../../states';
import { LINKS } from '@app/features/common';
import { PROJECTS_TEXTS } from '../../ports';
import { positionOf, rowLabel } from '../../rules/project-labels.rules';
import { ViewHeadingDirective } from '@shared/ui/directives';

@Component({
  selector: 'app-project-list',
  imports: [
    ViewHeadingDirective,
    RouterLink,
    SegmentedComponent,
    WindowComponent,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent {
  private readonly manager = inject(ProjectsManager);

  public readonly pinned = input(false);
  public readonly selected = input<string | null>(null);
  public readonly visited = input<readonly string[]>([]);
  public readonly family = input<FamilyFilter>('all');

  public readonly pinToggled = output();
  public readonly closed = output();
  public readonly selectedChange = output<string | null>();
  public readonly hoveredChange = output<string | null>();
  public readonly familyChange = output<FamilyFilter>();

  protected readonly texts = inject(PROJECTS_TEXTS);
  protected readonly links = inject(LINKS);

  private readonly total = computed(() => this.manager.ranked().length);

  protected readonly heading = computed(() =>
    this.texts().index.title(twoDigits(this.total())),
  );

  protected readonly meta = computed(() => {
    const family = this.family();
    return family === 'all'
      ? this.texts().index.count(twoDigits(this.total()))
      : positionOf(this.manager.familyCounts()[family], this.total());
  });

  protected readonly familySummary = computed(() => {
    const counts = this.manager.familyCounts();
    return this.texts().index.summary(
      twoDigits(counts.professional),
      twoDigits(counts.personal),
    );
  });

  protected readonly familyItems = computed<
    readonly SegmentedItem<FamilyFilter>[]
  >(() => {
    const counts = this.manager.familyCounts();
    const families = this.texts().index.families;
    return FAMILIES.map((family) => ({
      value: family,
      label: families[family].label,
      aria: families[family].aria,
      active: family === this.family(),
      count: twoDigits(family === 'all' ? this.total() : counts[family]),
    }));
  });

  protected readonly rows = computed(() => {
    const family = this.family();
    const selected = this.selected();
    const visited = new Set(this.visited());
    return this.manager
      .ranked()
      .filter((project) => family === 'all' || project.family === family)
      .map((project) => ({
        ...project,
        label: rowLabel(project),
        isSelected: project.slug === selected,
        isVisited: visited.has(project.slug),
        link: this.manager.detailOf(project.slug)?.links[0] ?? null,
      }));
  });

  protected toggle(slug: string): void {
    this.selectedChange.emit(this.selected() === slug ? null : slug);
  }
}
