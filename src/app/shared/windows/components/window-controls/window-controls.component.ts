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
import { WINDOW_ICONS as ICONS } from '../../models/window-icons.model';
import { WINDOW_TEXTS } from '../../ports/window-texts.port';

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
