import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DisplayFormatService } from '@app/core/services';
import { WindowFrameDirective } from '../../directives/window-frame.directive';
import type { WindowControlView } from '../../models/window-frame.model';
import { WindowControl } from '../../models/window.model';
import { WINDOW_TEXTS } from '../../ports/window-texts.port';

const ICONS = {
  pin: 'M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z',
  pinned: 'M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z',
  up: 'M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z',
  down: 'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z',
  close:
    'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z',
} as const;

@Component({
  selector: 'app-window-controls',
  templateUrl: './window-controls.component.html',
  styleUrl: './window-controls.component.scss',
})
export class WindowControlsComponent {
  private readonly texts = inject(WINDOW_TEXTS);
  private readonly display = inject(DisplayFormatService);
  private readonly frame = inject(WindowFrameDirective, { optional: true });

  public readonly pinned = input(false);
  public readonly foldable = input(false);
  public readonly folded = input(false);
  public readonly closable = input(true);
  public readonly closeLabel = input('');

  public readonly pinToggled = output();
  public readonly foldToggled = output();
  public readonly closed = output();

  private readonly asked = signal<boolean | null>(null);

  protected readonly controls = computed<readonly WindowControlView[]>(() => {
    const texts = this.texts();
    const controls: WindowControlView[] = [];
    if (this.display.format() === 'phone') {
      const isPinned = this.pinned();
      controls.push({
        name: 'pin',
        label: isPinned ? texts.phone.unpin : texts.phone.pin,
        icon: isPinned ? ICONS.pinned : ICONS.pin,
        pressed: isPinned,
        expanded: null,
      });
    }
    controls.push(...this.middle());
    if (this.closable()) {
      controls.push({
        name: 'close',
        label: this.closeLabel() || texts.close,
        icon: ICONS.close,
        pressed: null,
        expanded: null,
      });
    }
    return controls;
  });

  private middle(): readonly WindowControlView[] {
    if (!this.foldable()) {
      return this.frame?.controls() ?? [];
    }
    const isFolded = this.folded();
    const words = this.texts().phone;
    return [
      {
        name: 'fold',
        label: isFolded ? words.unfold : words.fold,
        icon: isFolded ? ICONS.up : ICONS.down,
        pressed: null,
        expanded: !isFolded,
      },
    ];
  }

  protected readonly note = computed(() => {
    const isPinned = this.pinned();
    if (this.asked() !== isPinned) {
      return '';
    }
    return isPinned ? this.texts().kept : this.texts().released;
  });

  protected press(control: WindowControl): void {
    switch (control) {
      case 'pin': {
        this.asked.set(!this.pinned());
        this.pinToggled.emit();
        return;
      }
      case 'fold': {
        this.foldToggled.emit();
        return;
      }
      case 'maximize': {
        this.frame?.toggleMaximize();
        return;
      }
      case 'close': {
        this.closed.emit();
      }
    }
  }
}
