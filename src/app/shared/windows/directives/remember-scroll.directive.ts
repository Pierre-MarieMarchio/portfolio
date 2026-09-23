import {
  afterRenderEffect,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { ScrollMemoryService } from '../services/scroll-memory.service';

@Directive({ selector: '[appRememberScroll]' })
export class RememberScrollDirective {
  private readonly memory = inject(ScrollMemoryService);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly appRememberScroll = input.required<string>();
  public readonly resetOn = input<unknown>();

  constructor() {
    afterRenderEffect({
      write: () => {
        this.resetOn();
        this.element.scrollTop = 0;
      },
    });
    afterRenderEffect({
      write: () => {
        const key = this.appRememberScroll();
        if (key) {
          this.element.scrollTop = this.memory.read(key);
        }
      },
    });

    const remember = (): void => {
      const key = this.appRememberScroll();
      if (key) {
        this.memory.save(key, this.element.scrollTop);
      }
    };
    this.element.addEventListener('scroll', remember, { passive: true });
    inject(DestroyRef).onDestroy(() => {
      this.element.removeEventListener('scroll', remember);
    });
  }
}
