import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { DoublePressDirective } from '../../directives/double-press.directive';
import { DraggableDirective } from '../../directives/draggable.directive';
import { FitHeightDirective } from '../../directives/fit-height.directive';
import { GlassGesturesDirective } from '../../directives/glass-gesture.directive';
import { KeptWindowDirective } from '../../directives/kept-window.directive';
import { RememberScrollDirective } from '../../directives/remember-scroll.directive';
import { ScrollStopsDirective } from '../../directives/scroll-stops.directive';
import {
  WINDOW_CEILINGS,
  WindowAnchor,
  WindowSize,
} from '../../models/window.model';
import { GlassGesture } from '../../models/glass-gesture.model';
import { WINDOW_TEXTS } from '../../ports/window-texts.port';

@Component({
  selector: 'app-window',
  imports: [
    DoublePressDirective,
    DraggableDirective,
    FitHeightDirective,
    GlassGesturesDirective,
    RememberScrollDirective,
    ScrollStopsDirective,
  ],
  templateUrl: './window.component.html',
  styleUrl: './window.component.scss',
})
export class WindowComponent {
  protected readonly texts = inject(WINDOW_TEXTS);
  private readonly kept = inject(KeptWindowDirective, { optional: true });
  private readonly rail = viewChild.required<ElementRef<HTMLElement>>('rail');
  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  private readonly isShown = computed(() => this.kept?.isShown() ?? true);

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

  protected readonly collapsed = linkedSignal<boolean, boolean>({
    source: this.isShown,
    computation: (isShown, previous) => !isShown && (previous?.value ?? false),
  });
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

  constructor() {
    let wasShown = true;
    afterRenderEffect({
      write: () => {
        const isShown = this.isShown();
        if (isShown && !wasShown) {
          this.arrive();
        }
        wasShown = isShown;
      },
    });
  }

  private arrive(): void {
    const rail = this.rail().nativeElement;
    if (rail.dataset['rest'] === 'end') {
      rail.scrollTop = 0;
    }
    const frame = this.frame().nativeElement;
    if (typeof frame.getAnimations !== 'function') {
      return;
    }
    for (const rise of frame.getAnimations()) {
      rise.currentTime = 0;
      rise.play();
    }
  }

  protected toggleCollapse(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }

  protected answer(gesture: GlassGesture): void {
    this.collapsed.set(gesture === 'fold');
  }
}
