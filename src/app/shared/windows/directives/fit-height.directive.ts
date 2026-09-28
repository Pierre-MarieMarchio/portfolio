import {
  afterNextRender,
  afterRenderEffect,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import {
  BrowserWindowService,
  DisplayFormatService,
  DocumentStylesService,
  ElementObserverService,
} from '@app/core/services';
import { WindowAnchor } from '../models/window.model';

const MIN_ROOM = 200;
const RESERVE = '--window-reserve';

const layoutTop = (element: HTMLElement): number => {
  const parent = element.offsetParent;
  const parentTop = parent
    ? parent.getBoundingClientRect().top + parent.clientTop
    : 0;
  return parentTop + element.offsetTop;
};

@Directive({
  selector: '[appFitHeight]',
  host: { '(animationend)': 'fit()' },
})
export class FitHeightDirective {
  private readonly browserWindow = inject(BrowserWindowService);
  private readonly styles = inject(DocumentStylesService);
  private readonly display = inject(DisplayFormatService);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly appFitHeight = input.required<number | null>();
  public readonly anchor = input<WindowAnchor>('top');

  constructor() {
    const observer = inject(ElementObserverService);
    afterRenderEffect({ write: () => this.fit() });
    const stops = [
      this.browserWindow.on('resize', () => this.fit(), { passive: true }),
    ];
    afterNextRender(() => {
      stops.push(observer.onResize(this.element, () => this.fit()));
    });
    inject(DestroyRef).onDestroy(() => {
      for (const stop of stops) {
        stop();
      }
    });
  }

  protected fit(): void {
    const ceiling = this.appFitHeight();
    if (ceiling === null || this.display.format() === 'phone') {
      this.element.style.maxHeight = '';
      return;
    }
    const viewport = this.browserWindow.size();
    if (!viewport) {
      return;
    }
    const top = layoutTop(this.element);
    const reserve =
      Number.parseFloat(this.styles.token(RESERVE, this.element)) || 0;
    const room =
      this.anchor() === 'bottom'
        ? top + this.element.offsetHeight - reserve
        : viewport.height - top - reserve;
    const height = Math.min(Math.max(MIN_ROOM, room), ceiling);
    this.element.style.maxHeight = `${String(height)}px`;
  }
}
