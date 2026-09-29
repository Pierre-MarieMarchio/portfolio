import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { DisplayFormatService } from '@app/core/services';
import { OBSERVATORY_TEXTS } from '../../ports/observatory-texts.port';
import { Entrance } from '@shared/ui/models';
import { ViewHeadingDirective } from '@shared/ui/directives';
import { WINDOW_ICONS } from '@shared/windows/models/window-icons.model';
import { WINDOW_FOLD, WINDOW_TEXTS } from '@shared/windows/ports';
import { OBSERVATORY_IDS } from '../../models/observatory-ids.model';

@Component({
  selector: 'app-home-title',
  imports: [ViewHeadingDirective],
  templateUrl: './home-title.component.html',
  styleUrl: './home-title.component.scss',
  host: { '[attr.data-arrival]': 'arrival()' },
})
export class HomeTitleComponent {
  private readonly display = inject(DisplayFormatService);
  private readonly fold = inject(WINDOW_FOLD, { optional: true });
  private readonly bar = viewChild<ElementRef<HTMLElement>>('bar');

  public readonly arrival = input<Entrance>('timed');

  protected readonly headingId = OBSERVATORY_IDS.homeTitle;
  protected readonly texts = inject(OBSERVATORY_TEXTS);
  protected readonly windowTexts = inject(WINDOW_TEXTS);
  protected readonly icons = WINDOW_ICONS;
  protected readonly isLine = computed(() => this.display.format() === 'phone');
  protected readonly isFolded = computed(() => this.fold?.isFolded() ?? false);

  constructor() {
    afterRenderEffect((onCleanup) => {
      const bar = this.bar()?.nativeElement;
      if (bar) {
        const release = this.fold?.hold(bar);
        onCleanup(() => {
          release?.();
        });
      }
    });
  }

  protected toggleFold(): void {
    this.fold?.toggle();
  }
}
