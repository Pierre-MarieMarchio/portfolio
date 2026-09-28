import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
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
import { KeptWindowDirective } from '../../directives/kept-window.directive';
import { RememberScrollDirective } from '../../directives/remember-scroll.directive';
import {
  WINDOW_CEILINGS,
  WindowAnchor,
  WindowSize,
} from '../../models/window.model';
import { WINDOW_FOLD } from '../../ports/window-fold.port';
import { WindowControlsComponent } from '../window-controls/window-controls.component';

@Component({
  selector: 'app-window',
  imports: [
    DoublePressDirective,
    DraggableDirective,
    FitHeightDirective,
    RememberScrollDirective,
    WindowControlsComponent,
  ],
  templateUrl: './window.component.html',
  styleUrl: './window.component.scss',
})
export class WindowComponent {
  private readonly kept = inject(KeptWindowDirective, { optional: true });
  private readonly fold = inject(WINDOW_FOLD, { optional: true });
  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  private readonly bar = viewChild.required<ElementRef<HTMLElement>>('bar');
  private readonly isShown = computed(() => this.kept?.isShown() ?? true);
  private readonly isHeld = computed(() => this.fold?.isActive() ?? false);

  public readonly heading = input.required<string>();
  public readonly meta = input('');
  public readonly size = input<WindowSize>('m');
  public readonly anchor = input<WindowAnchor>('top');
  public readonly pinned = input(false);
  public readonly closable = input(true);
  public readonly closeLabel = input('');
  public readonly label = input('');
  public readonly scrollKey = input('');
  public readonly scrollResetOn = input<unknown>();

  public readonly pinToggled = output();
  public readonly closed = output();

  private readonly collapsed = linkedSignal<boolean, boolean>({
    source: this.isShown,
    computation: (isShown, previous) => !isShown && (previous?.value ?? false),
  });
  protected readonly folded = computed(() =>
    this.isHeld() ? (this.fold?.isFolded() ?? false) : this.collapsed(),
  );
  protected readonly hidesBody = computed(
    () => !this.isHeld() && this.collapsed(),
  );
  protected readonly name = computed(() => this.label() || this.heading());
  protected readonly ceiling = computed(() =>
    this.hidesBody() ? null : WINDOW_CEILINGS[this.size()],
  );

  constructor() {
    let wasShown = true;
    afterRenderEffect({
      write: () => {
        const isShown = this.isShown();
        if (isShown && !wasShown) {
          this.rise();
        }
        wasShown = isShown;
      },
    });
    const fold = this.fold;
    if (fold) {
      let release: () => void = () => {};
      afterNextRender(() => {
        release = fold.hold(this.bar().nativeElement);
      });
      inject(DestroyRef).onDestroy(() => {
        release();
      });
    }
  }

  private rise(): void {
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
    if (this.fold && this.isHeld()) {
      this.fold.toggle();
      return;
    }
    this.collapsed.update((collapsed) => !collapsed);
  }
}
