import {
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { clamp, isOnControl } from '@app/core/helpers';
import { BrowserWindowService, DisplayFormatService } from '@app/core/services';

const VISIBLE_SIDEWAYS = 150;
const EDGE_LEFT = 16;
const EDGE_TOP = 12;
const EDGE_BOTTOM = 60;

const wholePixelsWithin = (value: number, min: number, max: number): number =>
  clamp(Math.round(value), Math.ceil(min), Math.floor(max));

interface Grip {
  readonly x: number;
  readonly y: number;
  readonly dx: number;
  readonly dy: number;
}

@Directive({ selector: '[appDraggable]' })
export class DraggableDirective {
  private readonly browserWindow = inject(BrowserWindowService);
  private readonly display = inject(DisplayFormatService);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly appDraggable = input.required<HTMLElement>();

  private dx = 0;
  private dy = 0;
  private grip: Grip | null = null;
  private releaseDrag: (() => void)[] = [];

  constructor() {
    effect((onCleanup) => {
      const handle = this.appDraggable();
      const onGrab = (event: PointerEvent): void => {
        this.grab(event, handle);
      };
      handle.addEventListener('pointerdown', onGrab);
      onCleanup(() => {
        handle.removeEventListener('pointerdown', onGrab);
      });
    });
    const stopResize = this.browserWindow.on(
      'resize',
      () => this.keepOnScreen(),
      { passive: true },
    );
    inject(DestroyRef).onDestroy(() => {
      stopResize();
      this.release();
    });
  }

  private grab(event: PointerEvent, handle: HTMLElement): void {
    if (event.button !== 0 || isOnControl(event) || this.isOnPhone()) {
      return;
    }
    this.release();
    this.grip = {
      x: event.clientX,
      y: event.clientY,
      dx: this.dx,
      dy: this.dy,
    };
    handle.style.cursor = 'grabbing';
    this.releaseDrag = [
      this.browserWindow.on('pointermove', (move) => this.drag(move), {
        passive: false,
      }),
      this.browserWindow.on('pointerup', () => this.release()),
      this.browserWindow.on('pointercancel', () => this.release()),
      () => {
        handle.style.cursor = '';
      },
    ];
  }

  private drag(event: PointerEvent): void {
    const grip = this.grip;
    if (!grip) {
      return;
    }
    event.preventDefault();
    this.moveTo(
      grip.dx + (event.clientX - grip.x),
      grip.dy + (event.clientY - grip.y),
    );
  }

  private keepOnScreen(): void {
    if (this.isOnPhone()) {
      this.putBack();
    } else if (this.dx !== 0 || this.dy !== 0) {
      this.moveTo(this.dx, this.dy);
    }
  }

  private putBack(): void {
    this.release();
    this.dx = 0;
    this.dy = 0;
    this.element.style.transform = '';
  }

  private isOnPhone(): boolean {
    return this.display.format() === 'phone';
  }

  private moveTo(dx: number, dy: number): void {
    const viewport = this.browserWindow.size();
    if (!viewport) {
      return;
    }
    const rect = this.element.getBoundingClientRect();
    const left0 = rect.left - this.dx;
    const top0 = rect.top - this.dy;
    this.dx = wholePixelsWithin(
      dx,
      EDGE_LEFT - left0 - rect.width + VISIBLE_SIDEWAYS,
      viewport.width - VISIBLE_SIDEWAYS - left0,
    );
    this.dy = wholePixelsWithin(
      dy,
      EDGE_TOP - top0,
      viewport.height - EDGE_BOTTOM - top0,
    );
    this.element.style.transform = `translate(${String(this.dx)}px,${String(this.dy)}px)`;
  }

  private release(): void {
    for (const release of this.releaseDrag) {
      release();
    }
    this.releaseDrag = [];
    this.grip = null;
  }
}
