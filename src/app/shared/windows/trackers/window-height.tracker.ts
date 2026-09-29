import type { FramedWindow } from '../models/window-frame.model';
import { fittedHeight } from '../rules/window-frame.rules';

const RESERVE = '--window-reserve';

const layoutTop = (element: HTMLElement): number => {
  let top = element.offsetTop;
  for (
    let parent = element.offsetParent;
    parent instanceof HTMLElement;
    parent = parent.offsetParent
  ) {
    top += parent.offsetTop + parent.clientTop;
  }
  return top;
};

const listen = <K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  type: K,
  handler: (event: HTMLElementEventMap[K]) => void,
): (() => void) => {
  element.addEventListener(type, handler);
  return () => {
    element.removeEventListener(type, handler);
  };
};

export class WindowHeightTracker {
  private readonly stops: (() => void)[];

  constructor(private readonly framed: FramedWindow) {
    const { section } = framed.parts;
    this.stops = [
      listen(section, 'animationend', () => this.fit()),
      framed.onResize(section, () => this.fit()),
    ];
    this.fit();
  }

  public fit(): void {
    const { section, anchor, ceiling, stable } = this.framed.parts;
    const viewport = this.framed.viewport();
    if (!viewport || this.framed.place()?.height != null) {
      this.clear();
      return;
    }
    const reserve = Number.parseFloat(this.framed.token(RESERVE, section)) || 0;
    const height = fittedHeight(
      { top: layoutTop(section), height: section.offsetHeight },
      anchor(),
      viewport,
      { reserve, ceiling: ceiling() },
    );
    this.paint(stable() ? height : null, stable() ? null : height);
  }

  public clear(): void {
    this.paint(null, null);
  }

  public stop(): void {
    for (const stop of this.stops.splice(0)) {
      stop();
    }
    this.clear();
  }

  private paint(fixed: number | null, ceiling: number | null): void {
    const style = this.framed.parts.section.style;
    style.height = fixed == null ? '' : `${String(fixed)}px`;
    style.maxHeight = ceiling == null ? '' : `${String(ceiling)}px`;
  }
}
