import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DisplayFormatService } from '@app/core/services';
import { DoublePressDirective } from '../../directives/double-press.directive';
import { KeptWindowDirective } from '../../directives/kept-window.directive';
import { RememberScrollDirective } from '../../directives/remember-scroll.directive';
import { WindowFrameDirective } from '../../directives/window-frame.directive';
import { WINDOW_ICONS } from '../../models/window-icons.model';
import {
  WINDOW_CEILINGS,
  WindowAnchor,
  WindowSize,
} from '../../models/window.model';
import { WINDOW_FOLD } from '../../ports/window-fold.port';
import { WINDOW_TEXTS } from '../../ports/window-texts.port';
import { WindowControlsComponent } from '../window-controls/window-controls.component';
import { WindowGripComponent } from '../window-grip/window-grip.component';

const NOTHING = (): void => {};

@Component({
  selector: 'app-window',
  imports: [
    DoublePressDirective,
    RememberScrollDirective,
    WindowControlsComponent,
    WindowGripComponent,
  ],
  templateUrl: './window.component.html',
  styleUrl: './window.component.scss',
})
export class WindowComponent {
  private readonly kept = inject(KeptWindowDirective, { optional: true });
  private readonly fold = inject(WINDOW_FOLD, { optional: true });
  private readonly frame = inject(WindowFrameDirective, { optional: true });
  private readonly display = inject(DisplayFormatService);
  protected readonly texts = inject(WINDOW_TEXTS);
  private readonly section =
    viewChild.required<ElementRef<HTMLElement>>('frame');
  private readonly bar = viewChild.required<ElementRef<HTMLElement>>('bar');
  private readonly isShown = computed(() => this.kept?.isShown() ?? true);

  public readonly heading = input.required<string>();
  public readonly meta = input('');
  public readonly size = input<WindowSize>('m');
  public readonly anchor = input<WindowAnchor>('top');
  public readonly preview = input(false);
  public readonly pinned = input<boolean | null>(null);
  public readonly minimizable = input(false);
  public readonly closable = input(true);
  public readonly closeLabel = input('');
  public readonly label = input('');
  public readonly scrollKey = input('');
  public readonly scrollResetOn = input<unknown>();
  public readonly stableHeight = input(false);

  public readonly minimized = output();
  public readonly pinToggled = output();
  public readonly closed = output();

  protected readonly isHeld = computed(() => this.fold?.isActive() ?? false);
  protected readonly folded = computed(
    () => this.isHeld() && (this.fold?.isFolded() ?? false),
  );
  protected readonly maximizable = computed(() => !this.preview());
  protected readonly isFramed = computed(
    () => this.display.format() !== 'phone',
  );
  protected readonly isKeptOpen = computed(
    () => this.isFramed() && this.pinned() === true,
  );
  protected readonly name = computed(() => {
    const label = this.label() || this.heading();
    return this.isKeptOpen() ? `${label}, ${this.texts().keptOpen}` : label;
  });
  protected readonly keptIcon = WINDOW_ICONS.pinned;

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
    const releases: (() => void)[] = [];
    afterNextRender(() => {
      const bar = this.bar().nativeElement;
      releases.push(
        this.fold?.hold(bar) ?? NOTHING,
        this.frame?.hold({
          section: this.section().nativeElement,
          bar,
          anchor: this.anchor,
          ceiling: () => WINDOW_CEILINGS[this.size()],
          stable: this.stableHeight,
          maximizable: this.maximizable,
        }) ?? NOTHING,
      );
    });
    inject(DestroyRef).onDestroy(() => {
      for (const release of releases) {
        release();
      }
    });
  }

  private rise(): void {
    const section = this.section().nativeElement;
    if (typeof section.getAnimations !== 'function') {
      return;
    }
    for (const rise of section.getAnimations()) {
      rise.currentTime = 0;
      rise.play();
    }
  }

  protected toggleFold(): void {
    this.fold?.toggle();
  }

  protected onDoublePress(): void {
    if (this.isHeld()) {
      this.toggleFold();
    } else if (this.frame?.isActive() && this.maximizable()) {
      this.frame.toggleMaximize();
    }
  }
}
