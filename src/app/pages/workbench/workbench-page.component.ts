import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { SegmentedComponent } from '@shared/ui/components';
import { SegmentedItem } from '@shared/ui/models';
import { WindowComponent } from '@shared/windows/components';
import { WindowSize } from '@shared/windows/models';

type Scenario = 'index' | 'preview' | 'short' | 'fixed';

interface ScenarioSpec {
  readonly value: Scenario;
  readonly label: string;
}

const ROWS = Array.from({ length: 12 }, (_, i) => i + 1);

const SIZES: Readonly<Record<Scenario, WindowSize>> = {
  index: 'l',
  preview: 'm',
  short: 's',
  fixed: 'l',
};

/**
 * A development-only bench for the shared window and selector, until the
 * pages that use them show every state. Its rows are neutral placeholders:
 * the bench exercises the grammar, it carries no content of the site.
 */
@Component({
  selector: 'app-workbench-page',
  imports: [WindowComponent, SegmentedComponent],
  templateUrl: './workbench-page.component.html',
  styleUrl: './workbench-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page' },
})
export class WorkbenchPageComponent {
  protected readonly scenarios: readonly ScenarioSpec[] = [
    { value: 'index', label: 'Taille l' },
    { value: 'preview', label: 'Taille m, ancrée en bas' },
    { value: 'short', label: 'Taille s' },
    { value: 'fixed', label: 'Sans fermeture' },
  ];

  protected readonly scenario = signal<Scenario>('index');
  protected readonly pinned = signal(false);
  protected readonly isClosed = signal(false);
  protected readonly family = signal('tout');
  protected readonly rows = ROWS;

  protected readonly scenarioItems = computed<
    readonly SegmentedItem<Scenario>[]
  >(() =>
    this.scenarios.map((spec) => ({
      value: spec.value,
      label: spec.label,
      active: spec.value === this.scenario(),
    })),
  );

  /** The index's three families, to see a wrapping selector at 924px. */
  protected readonly familyItems = computed<readonly SegmentedItem[]>(() =>
    [
      { key: 'tout', label: 'Tout', count: '07' },
      { key: 'pro', label: 'En entreprise', count: '04' },
      { key: 'perso', label: 'Personnels', count: '03' },
    ].map(({ key, label, count }) => ({
      value: key,
      label,
      count,
      active: key === this.family(),
    })),
  );

  protected readonly size = computed<WindowSize>(() => SIZES[this.scenario()]);

  protected choose(scenario: Scenario): void {
    this.scenario.set(scenario);
    this.isClosed.set(false);
  }
}
