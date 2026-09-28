import {
  afterRenderEffect,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { ScrollMemoryService } from '../services/scroll-memory.service';

@Directive({
  selector: '[appRememberScroll]',
  host: { '(scroll)': 'remember()' },
})
export class RememberScrollDirective {
  private readonly memory = inject(ScrollMemoryService);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private top = 0;

  public readonly appRememberScroll = input.required<string>();
  public readonly resetOn = input<unknown>();

  constructor() {
    let isNew = true;
    afterRenderEffect({
      write: () => {
        this.resetOn();
        if (!isNew) {
          this.scrollTo(0);
        }
      },
    });
    afterRenderEffect({
      write: () => {
        const key = this.appRememberScroll();
        if (key) {
          this.scrollTo(this.memory.read(key));
        }
        isNew = false;
      },
    });
  }

  protected remember(): void {
    this.top = this.element.scrollTop;
    const key = this.appRememberScroll();
    if (key) {
      this.memory.save(key, this.top);
    }
  }

  private scrollTo(top: number): void {
    if (top !== this.top) {
      this.top = top;
      this.element.scrollTop = top;
    }
  }
}
