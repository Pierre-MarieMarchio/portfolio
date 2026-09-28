import {
  afterNextRender,
  afterRenderEffect,
  Component,
  DestroyRef,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  ElementObserverService,
  MediaPreferencesService,
} from '@app/core/services';
import { SHARED_TEXTS } from '../../ports';
import { SegmentedItem } from '../../models/segmented.model';

const ignore = (): void => {};

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
  private readonly media = inject(MediaPreferencesService);
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
  private hasShown = false;

  protected readonly name = computed(
    () => this.label() ?? this.texts().segmented.label,
  );

  constructor() {
    const observer = inject(ElementObserverService);
    let isLaidOut = false;
    let stop = ignore;
    afterRenderEffect(() => {
      this.items();
      if (isLaidOut) {
        this.showActive(this.list().nativeElement);
      }
    });
    afterNextRender(() => {
      const list = this.list().nativeElement;
      stop = observer.onResize(list, () => {
        isLaidOut = true;
        this.showActive(list);
      });
    });
    inject(DestroyRef).onDestroy(() => {
      stop();
    });
  }

  private showActive(list: HTMLElement): void {
    const active = list.querySelector('[data-active="true"]');
    const shift = active ? shiftToShow(list, active) : 0;
    if (shift !== 0) {
      list.scrollBy({
        left: shift,
        behavior:
          this.hasShown && !this.media.reducedMotion() ? 'smooth' : 'instant',
      });
    }
    this.hasShown = true;
  }
}

const shiftToShow = (list: Element, item: Element): number => {
  const inside = list.getBoundingClientRect();
  const shown = item.getBoundingClientRect();
  return shown.left < inside.left
    ? shown.left - inside.left
    : Math.max(0, shown.right - inside.right);
};
