import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { twoDigits } from '@app/core/utils/format.utils';
import { SegmentedComponent, SegmentedItem } from '@shared/ui/segmented';
import { WindowComponent } from '@shared/ui/window';
import { ProjectFamily } from '../../models';
import { ProjectsManager } from '../../states';

/** Which family the index shows; `all` is no filter. */
export type FamilyFilter = ProjectFamily | 'all';

interface FamilyChoice {
  readonly value: FamilyFilter;
  readonly label: string;
  readonly aria: string;
}

const FAMILIES: readonly FamilyChoice[] = [
  { value: 'all', label: 'Tout', aria: 'Voir tous les projets' },
  {
    value: 'professional',
    label: 'En entreprise',
    aria: 'Ne voir que les réalisations faites en entreprise',
  },
  {
    value: 'personal',
    label: 'Personnels',
    aria: 'Ne voir que les projets personnels',
  },
];

/**
 * The index: the seven projects in a table whose most important column is
 * what a reader can check. Selecting a row opens it one notch (subject, the
 * sheet, the outbound link); the selection belongs to the station, since
 * Escape and a click in the void close it too.
 *
 * Filtering is not re-sorting: the rank order never changes.
 */
@Component({
  selector: 'app-project-index',
  imports: [RouterLink, SegmentedComponent, WindowComponent],
  templateUrl: './project-index.component.html',
  styleUrl: './project-index.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectIndexComponent {
  private readonly manager = inject(ProjectsManager);

  public readonly pinned = input(false);
  /** The slug of the open row, or `null`. */
  public readonly selected = input<string | null>(null);
  /** The sheets already read, marked "lu". */
  public readonly visited = input<readonly string[]>([]);
  /**
   * The family shown. The station holds it: in the mockup the filter
   * survives a trip to a sheet and back, like the selection.
   */
  public readonly family = input<FamilyFilter>('all');

  public readonly pinToggled = output();
  public readonly closed = output();
  /** The slug to select, or `null` to close the open row. */
  public readonly selectedChange = output<string | null>();
  /** The row under the pointer or the focus, for the object to light up. */
  public readonly hoveredChange = output<string | null>();
  public readonly familyChange = output<FamilyFilter>();

  private readonly total = computed(() => this.manager.projects().length);

  protected readonly heading = computed(
    () => `Projets — le relevé des ${twoDigits(this.total())} réalisations`,
  );

  protected readonly meta = computed(() => {
    const family = this.family();
    return family === 'all'
      ? `${twoDigits(this.total())} fiches`
      : `${twoDigits(this.manager.familyCounts()[family])} / ${twoDigits(this.total())}`;
  });

  protected readonly familySummary = computed(() => {
    const counts = this.manager.familyCounts();
    return `${twoDigits(counts.professional)} en entreprise · ${twoDigits(counts.personal)} personnels`;
  });

  protected readonly familyItems = computed<
    readonly SegmentedItem<FamilyFilter>[]
  >(() => {
    const counts = this.manager.familyCounts();
    return FAMILIES.map((choice) => ({
      value: choice.value,
      label: choice.label,
      aria: choice.aria,
      active: choice.value === this.family(),
      count: twoDigits(
        choice.value === 'all' ? this.total() : counts[choice.value],
      ),
    }));
  });

  protected readonly rows = computed(() => {
    const family = this.family();
    const selected = this.selected();
    const visited = new Set(this.visited());
    const featured = new Set(
      this.manager.featured().map((project) => project.slug),
    );
    return this.manager.withFacts().flatMap((project, index) => {
      if (family !== 'all' && project.family !== family) {
        return [];
      }
      const number = twoDigits(index + 1);
      const link = this.manager.sheetOf(project.slug)?.links[0] ?? null;
      return [
        {
          ...project,
          number,
          featured: featured.has(project.slug),
          level: this.manager.proofLevelLabel(project.facts.proofLevel),
          label: `${number} — ${project.title} · ${project.facts.proof}`,
          isSelected: project.slug === selected,
          isVisited: visited.has(project.slug),
          link,
        },
      ];
    });
  });

  /** A second click on the open row closes it. */
  protected toggle(slug: string): void {
    this.selectedChange.emit(this.selected() === slug ? null : slug);
  }
}
