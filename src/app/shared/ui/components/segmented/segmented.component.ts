import { Component, computed, inject, input, output } from '@angular/core';
import { SHARED_TEXTS } from '../../ports';
import { SegmentedItem } from '../../models/segmented.model';

@Component({
  selector: 'app-segmented',
  templateUrl: './segmented.component.html',
  styleUrl: './segmented.component.scss',
})
export class SegmentedComponent<T> {
  public readonly items = input.required<readonly SegmentedItem<T>[]>();
  public readonly label = input<string | null>(null);

  public readonly valueChange = output<T>();

  private readonly texts = inject(SHARED_TEXTS);
  protected readonly name = computed(
    () => this.label() ?? this.texts().segmented.label,
  );
}
