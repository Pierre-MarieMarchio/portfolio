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
 * The caller provides meaning only (label, count, active) and hears the click;
 * which item becomes active is the caller's decision.
 */
@Component({
  selector: 'app-segmented',
  templateUrl: './segmented.component.html',
  styleUrl: './segmented.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedComponent {
  public readonly items = input.required<readonly SegmentedItem[]>();
  public readonly label = input('Sélection');

  public readonly selected = output<SegmentedItem>();
}
