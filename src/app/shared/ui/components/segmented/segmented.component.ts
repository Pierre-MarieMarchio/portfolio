import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { SHARED_TEXTS } from '../../ports';
import { SegmentedItem } from '../../models/segmented.model';

/**
 * The segmented selector: the same gesture and the same drawing everywhere
 * (pages, project families, the chapters of a sheet, the parts of "about").
 * The caller provides meaning only (value, label, count, active) and hears
 * which value was chosen; which item becomes active is the caller's decision.
 */
@Component({
  selector: 'app-segmented',
  templateUrl: './segmented.component.html',
  styleUrl: './segmented.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedComponent<T> {
  public readonly items = input.required<readonly SegmentedItem<T>[]>();
  /** The group's accessible name; a neutral one when the caller gives none. */
  public readonly label = input<string | null>(null);

  public readonly chosen = output<T>();

  private readonly texts = inject(SHARED_TEXTS);
  protected readonly name = computed(
    () => this.label() ?? this.texts().segmented.label,
  );
}
