import { clamp } from '@app/core/helpers';
import type {
  WindowMenuAction,
  WindowMenuActionId,
  WindowMenuHost,
  WindowMenuTracking,
} from '../models/window-menu.model';
import { menuActionsOf } from '../rules/window-menu.rules';

const SCREEN_MARGIN = 8;
const PANEL_GAP = 4;

let panels = 0;

const nextPanelId = (): string => {
  panels += 1;
  return `window-menu-panel-${String(panels)}`;
};

export class WindowMenuTracker implements WindowMenuTracking {
  private panel: HTMLUListElement | null = null;
  private stopOutside: () => void = () => {};

  constructor(private readonly host: WindowMenuHost) {}

  public isOpen(): boolean {
    return this.panel !== null;
  }

  public open(): void {
    if (this.panel) {
      return;
    }
    const panel = this.build();
    this.panel = panel;
    this.host.button.insertAdjacentElement('afterend', panel);
    this.host.button.setAttribute('aria-controls', panel.id);
    this.host.button.setAttribute('aria-expanded', 'true');
    if (typeof panel.showPopover === 'function') {
      panel.showPopover();
    }
    this.position(panel);
    panel.querySelector('button')?.focus();
    this.stopOutside = this.host.onWindow('pointerdown', (event) => {
      this.onOutside(event);
    });
  }

  public close(shouldFocusButton: boolean): void {
    const panel = this.panel;
    if (!panel) {
      return;
    }
    panel.remove();
    this.panel = null;
    this.host.button.removeAttribute('aria-controls');
    this.host.button.setAttribute('aria-expanded', 'false');
    this.stopOutside();
    this.stopOutside = () => {};
    if (shouldFocusButton) {
      this.host.button.focus();
    }
  }

  public stop(): void {
    this.close(false);
  }

  private build(): HTMLUListElement {
    const document = this.host.button.ownerDocument;
    const panel = document.createElement('ul');
    panel.id = nextPanelId();
    panel.className = 'window-menu-panel';
    panel.setAttribute('role', 'menu');
    panel.setAttribute('popover', 'manual');
    panel.setAttribute('tabindex', '-1');
    panel.setAttribute('aria-label', this.host.texts().menu);
    panel.addEventListener('keydown', (event) => {
      this.onKeydown(event);
    });
    for (const action of this.actions()) {
      panel.append(this.itemOf(document, action));
    }
    return panel;
  }

  private actions(): readonly WindowMenuAction[] {
    return menuActionsOf(
      this.host.texts(),
      this.host.pinned(),
      this.host.maximizable(),
      this.host.frameMode(),
    );
  }

  private itemOf(document: Document, action: WindowMenuAction): HTMLLIElement {
    const li = document.createElement('li');
    li.setAttribute('role', 'none');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', action.role);
    if (action.checked !== null) {
      button.setAttribute('aria-checked', String(action.checked));
    }
    button.tabIndex = -1;
    button.textContent = action.label;
    button.addEventListener('click', () => {
      this.activate(action.id);
    });
    li.append(button);
    return li;
  }

  private onKeydown(event: KeyboardEvent): void {
    const panel = this.panel;
    if (!panel) {
      return;
    }
    const buttons = [...panel.querySelectorAll('button')];
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        this.focusAt(buttons, current < 0 ? 0 : (current + 1) % buttons.length);
        return;
      }
      case 'ArrowUp': {
        event.preventDefault();
        this.focusAt(
          buttons,
          current < 0
            ? buttons.length - 1
            : (current - 1 + buttons.length) % buttons.length,
        );
        return;
      }
      case 'Home': {
        event.preventDefault();
        this.focusAt(buttons, 0);
        return;
      }
      case 'End': {
        event.preventDefault();
        this.focusAt(buttons, buttons.length - 1);
        return;
      }
      case 'Escape': {
        event.preventDefault();
        event.stopPropagation();
        this.close(true);
        return;
      }
      case 'Tab': {
        event.preventDefault();
        this.close(true);
      }
    }
  }

  private focusAt(buttons: readonly HTMLButtonElement[], index: number): void {
    buttons[index]?.focus();
  }

  private activate(id: WindowMenuActionId): void {
    switch (id) {
      case 'pin': {
        this.host.emitPin();
        break;
      }
      case 'left': {
        this.host.snapTo('left');
        break;
      }
      case 'right': {
        this.host.snapTo('right');
        break;
      }
      case 'maximize': {
        this.host.toggleMaximize();
      }
    }
    this.close(true);
  }

  private onOutside(event: PointerEvent): void {
    const panel = this.panel;
    const target = event.target;
    if (!panel || !(target instanceof Node)) {
      return;
    }
    if (panel.contains(target) || this.host.button.contains(target)) {
      return;
    }
    this.close(false);
  }

  private position(panel: HTMLUListElement): void {
    const size = this.host.viewport();
    if (!size) {
      return;
    }
    const anchor = this.host.button.getBoundingClientRect();
    const box = panel.getBoundingClientRect();
    const left = clamp(
      anchor.left,
      SCREEN_MARGIN,
      Math.max(SCREEN_MARGIN, size.width - box.width - SCREEN_MARGIN),
    );
    const top = clamp(
      anchor.bottom + PANEL_GAP,
      SCREEN_MARGIN,
      Math.max(SCREEN_MARGIN, size.height - box.height - SCREEN_MARGIN),
    );
    panel.style.left = `${String(left)}px`;
    panel.style.top = `${String(top)}px`;
  }
}
