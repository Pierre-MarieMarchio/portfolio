import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { SegmentedComponent, SegmentedItem } from '@shared/ui/segmented';
import { WindowComponent, WindowSize } from '@shared/ui/window';

type Scenario = 'index' | 'preview' | 'short' | 'fixed';

interface ScenarioSpec {
  readonly value: Scenario;
  readonly label: string;
}

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
  protected readonly rows = Array.from({ length: 12 }, (_, i) => i + 1);

  protected readonly scenarioItems = computed<readonly SegmentedItem[]>(() =>
    this.scenarios.map((spec) => ({
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
      label,
      count,
      active: key === this.family(),
    })),
  );

  protected readonly size = computed<WindowSize>(() => {
    const scenario = this.scenario();
    return scenario === 'preview' ? 'm' : scenario === 'short' ? 's' : 'l';
  });

  protected choose(item: SegmentedItem): void {
    const spec = this.scenarios.find((each) => each.label === item.label);
    if (spec) {
      this.scenario.set(spec.value);
      this.isClosed.set(false);
    }
  }

  protected chooseFamily(item: SegmentedItem): void {
    const keys: Record<string, string> = {
      Tout: 'tout',
      'En entreprise': 'pro',
      Personnels: 'perso',
    };
    this.family.set(keys[item.label] ?? 'tout');
  }
}
