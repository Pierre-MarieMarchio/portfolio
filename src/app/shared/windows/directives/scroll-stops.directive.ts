import { Directive, ElementRef, inject } from '@angular/core';

const MIN_TRAVEL = 48;
const EDGE_SLACK = 1;

type ScrollRest = 'start' | 'end';

@Directive({
  selector: '[appScrollStops]',
  host: {
    '(scroll)': 'noteEdge()',
    '(scrollend)': 'settle()',
  },
})
export class ScrollStopsDirective {
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private rest: ScrollRest = 'start';

  protected noteEdge(): void {
    const edge = this.edgeReached();
    if (edge) {
      this.restAt(edge);
    }
  }

  protected settle(): void {
    if (this.edgeReached()) {
      this.noteEdge();
      return;
    }
    const target = this.restAfter(this.element.scrollTop - this.restingTop());
    this.restAt(target);
    this.element.scrollTo({ top: target === 'end' ? this.endTop() : 0 });
  }

  private restAfter(travel: number): ScrollRest {
    if (Math.abs(travel) < MIN_TRAVEL) {
      return this.rest;
    }
    return travel > 0 ? 'end' : 'start';
  }

  private edgeReached(): ScrollRest | null {
    const end = this.endTop();
    const top = this.element.scrollTop;
    if (end <= EDGE_SLACK || top <= EDGE_SLACK) {
      return 'start';
    }
    return top >= end - EDGE_SLACK ? 'end' : null;
  }

  private restingTop(): number {
    return this.rest === 'end' ? this.endTop() : 0;
  }

  private endTop(): number {
    return this.element.scrollHeight - this.element.clientHeight;
  }

  private restAt(rest: ScrollRest): void {
    this.rest = rest;
    if (this.element.dataset['rest'] !== rest) {
      this.element.dataset['rest'] = rest;
    }
  }
}
