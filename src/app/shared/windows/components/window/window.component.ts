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
  untracked,
  viewChild,
} from '@angular/core';
import {
  BrowserWindowService,
  DisplayFormatService,
  FormatCodeService,
} from '@app/core/services';
import { DoublePressDirective } from '../../directives/double-press.directive';
import { KeptWindowDirective } from '../../directives/kept-window.directive';
import { RememberScrollDirective } from '../../directives/remember-scroll.directive';
import { WindowFrameDirective } from '../../directives/window-frame.directive';
import type {
  WindowMenuCode,
  WindowMenuHost,
  WindowMenuTracking,
} from '../../models/window-menu.model';
import {
  WINDOW_CEILINGS,
  WindowAnchor,
  WindowSize,
} from '../../models/window.model';
import { WINDOW_FOLD } from '../../ports/window-fold.port';
import { WINDOW_TEXTS } from '../../ports/window-texts.port';
import { WindowControlsComponent } from '../window-controls/window-controls.component';

const NOTHING = (): void => {};

export const loadWindowMenu = (): Promise<WindowMenuCode> =>
  import('../../trackers/window-menu.tracker').then((tracker) => ({
    create: (host: WindowMenuHost) => new tracker.WindowMenuTracker(host),
  }));

@Component({
  selector: 'app-window',
  imports: [
    DoublePressDirective,
    RememberScrollDirective,
    WindowControlsComponent,
  ],
  templateUrl: './window.component.html',
  styleUrl: './window.component.scss',
})
export class WindowComponent {
  private readonly kept = inject(KeptWindowDirective, { optional: true });
  private readonly fold = inject(WINDOW_FOLD, { optional: true });
  private readonly frame = inject(WindowFrameDirective, { optional: true });
  private readonly display = inject(DisplayFormatService);
  private readonly browserWindow = inject(BrowserWindowService);
  protected readonly texts = inject(WINDOW_TEXTS);
  private readonly menuCode = inject(FormatCodeService).load(
    ['desktop', 'tablet'],
    loadWindowMenu,
  );
  private readonly section =
    viewChild.required<ElementRef<HTMLElement>>('frame');
  private readonly bar = viewChild.required<ElementRef<HTMLElement>>('bar');
  private readonly isShown = computed(() => this.kept?.isShown() ?? true);

  public readonly heading = input.required<string>();
  public readonly meta = input('');
  public readonly size = input<WindowSize>('m');
  public readonly anchor = input<WindowAnchor>('top');
  public readonly preview = input(false);
  public readonly pinned = input(false);
  public readonly closable = input(true);
  public readonly closeLabel = input('');
  public readonly label = input('');
  public readonly scrollKey = input('');
  public readonly scrollResetOn = input<unknown>();
  public readonly stableHeight = input(false);

  public readonly pinToggled = output();
  public readonly closed = output();

  protected readonly isHeld = computed(() => this.fold?.isActive() ?? false);
  protected readonly folded = computed(
    () => this.isHeld() && (this.fold?.isFolded() ?? false),
  );
  protected readonly maximizable = computed(() => !this.preview());
  protected readonly name = computed(() => this.label() || this.heading());
  protected readonly isMenuActive = computed(
    () => this.display.format() !== 'phone',
  );

  private menu: WindowMenuTracking | null = null;
  private pendingButton: HTMLButtonElement | null = null;

  constructor() {
    let wasShown = true;
    afterRenderEffect({
      write: () => {
        const isShown = this.isShown();
        if (isShown && !wasShown) {
          this.rise();
          this.frame?.cascade();
        }
        wasShown = isShown;
        const code = this.menuCode();
        const button = this.pendingButton;
        if (code && button) {
          untracked(() => {
            this.pendingButton = null;
            const menu = code.create(this.menuHostOf(button));
            this.menu = menu;
            menu.open();
          });
        }
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
      this.menu?.stop();
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

  protected onMenuClick(event: Event): void {
    if (this.menu?.isOpen()) {
      this.menu.close(false);
      return;
    }
    this.openMenu(event.currentTarget as HTMLButtonElement);
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'ArrowDown'
    ) {
      event.preventDefault();
      this.openMenu(event.currentTarget as HTMLButtonElement);
    }
  }

  private openMenu(button: HTMLButtonElement): void {
    if (this.menu) {
      this.menu.open();
      return;
    }
    const code = this.menuCode();
    if (!code) {
      this.pendingButton = button;
      return;
    }
    this.menu = code.create(this.menuHostOf(button));
    this.menu.open();
  }

  private menuHostOf(button: HTMLButtonElement): WindowMenuHost {
    return {
      button,
      texts: () => this.texts(),
      pinned: () => this.pinned(),
      maximizable: () => this.maximizable(),
      frameMode: () => (this.frame?.mode() === 'full' ? 'full' : null),
      viewport: () => this.browserWindow.size(),
      onWindow: (type, handler) => this.browserWindow.on(type, handler),
      emitPin: () => {
        this.pinToggled.emit();
      },
      snapTo: (zone) => {
        this.frame?.snapTo(zone);
      },
      toggleMaximize: () => {
        this.frame?.toggleMaximize();
      },
    };
  }
}
