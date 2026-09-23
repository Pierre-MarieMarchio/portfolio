import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { SegmentedItem } from './segmented.model';

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
  public readonly label = input('Sélection');

  public readonly chosen = output<T>();
}
