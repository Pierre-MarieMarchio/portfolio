const CONTROLS = 'button, a, input, select, textarea, label';

export interface HandleTapHost {
  readonly element: HTMLElement;
  readonly handle: () => HTMLElement | null;
  readonly isFolded: () => boolean;
  readonly toggle: () => void;
}

export class HandleTapService {
  constructor(private readonly host: HandleTapHost) {
    host.element.addEventListener('pointerup', this.onTap, { capture: true });
  }

  public readonly stop = (): void => {
    this.host.element.removeEventListener('pointerup', this.onTap, {
      capture: true,
    });
  };

  private readonly onTap = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (
      this.host.isFolded() &&
      target &&
      this.host.handle()?.contains(target) &&
      !target.closest(CONTROLS)
    ) {
      event.stopPropagation();
      this.host.toggle();
    }
  };
}
