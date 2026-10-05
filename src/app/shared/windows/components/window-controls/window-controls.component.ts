import { Component, computed, inject, input, output } from '@angular/core';
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
  private readonly frame = inject(WindowFrameDirective, { optional: true });

  public readonly minimizable = input(false);
  public readonly pinned = input<boolean | null>(null);
  public readonly closable = input(true);
  public readonly closeLabel = input('');

  public readonly minimized = output();
  public readonly pinToggled = output();
  public readonly closed = output();

  protected readonly controls = computed<readonly WindowControlView[]>(() => {
    const texts = this.texts();
    const isPinned = this.pinned();
    const controls: WindowControlView[] = [];
    if (this.minimizable()) {
      controls.push({
        name: 'minimize',
        label: texts.minimize,
        icon: ICONS.minimize,
        pressed: null,
        expanded: null,
      });
    }
    if (isPinned !== null) {
      controls.push({
        name: 'pin',
        label: texts.pin,
        icon: isPinned ? ICONS.pinned : ICONS.pin,
        pressed: isPinned,
        expanded: null,
      });
    }
    controls.push(...(this.frame?.controls() ?? []));
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

  protected press(control: WindowControl): void {
    switch (control) {
      case 'minimize': {
        this.minimized.emit();
        return;
      }
      case 'pin': {
        this.pinToggled.emit();
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
