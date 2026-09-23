import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DraggableDirective } from '../../directives/draggable.directive';
import { FitHeightDirective } from '../../directives/fit-height.directive';
import { RememberScrollDirective } from '../../directives/remember-scroll.directive';
import {
  WINDOW_CEILINGS,
  WindowAnchor,
  WindowSize,
} from '../../models/window.model';
import { WINDOW_TEXTS } from '../../ports/window-texts.port';

@Component({
  selector: 'app-window',
  imports: [DraggableDirective, FitHeightDirective, RememberScrollDirective],
  templateUrl: './window.component.html',
  styleUrl: './window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowComponent {
  protected readonly texts = inject(WINDOW_TEXTS);

  public readonly heading = input.required<string>();
  public readonly meta = input('');
  public readonly size = input<WindowSize>('m');
  public readonly anchor = input<WindowAnchor>('top');
  public readonly pinned = input(false);
  public readonly closable = input(true);
  public readonly label = input('');
  public readonly scrollKey = input('');
  public readonly scrollResetOn = input<unknown>();

  public readonly pinToggled = output();
  public readonly closed = output();

  protected readonly collapsed = signal(false);
  protected readonly name = computed(() => this.label() || this.heading());
  protected readonly ceiling = computed(() =>
    this.collapsed() ? null : WINDOW_CEILINGS[this.size()],
  );
  protected readonly pinLabel = computed(() =>
    this.pinned() ? this.texts().unpin : this.texts().pin,
  );
  protected readonly collapseLabel = computed(() =>
    this.collapsed() ? this.texts().unfold : this.texts().fold,
  );

  protected toggleCollapse(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }

  protected onBarDoubleClick(event: MouseEvent): void {
    const isOnControl =
      event.target instanceof Element &&
      event.target.closest('button, a') !== null;
    if (!isOnControl) {
      this.toggleCollapse();
    }
  }
}
