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

  public readonly closable = input(true);
  public readonly closeLabel = input('');

  public readonly closed = output();

  protected readonly controls = computed<readonly WindowControlView[]>(() => {
    const controls: WindowControlView[] = [...(this.frame?.controls() ?? [])];
    if (this.closable()) {
      controls.push({
        name: 'close',
        label: this.closeLabel() || this.texts().close,
        icon: ICONS.close,
        pressed: null,
        expanded: null,
      });
    }
    return controls;
  });

  protected press(control: WindowControl): void {
    switch (control) {
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
