import {
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { BrowserEnvironmentService } from '@app/core/services';

const VISIBLE_SIDEWAYS = 150;
const EDGE_LEFT = 16;
const EDGE_TOP = 12;
const EDGE_BOTTOM = 60;

interface Grip {
  readonly x: number;
  readonly y: number;
  readonly dx: number;
  readonly dy: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const isOnControl = (event: Event): boolean =>
  event.target instanceof Element && event.target.closest('button, a') !== null;

@Directive({ selector: '[appDraggable]' })
export class DraggableDirective {
  private readonly browser = inject(BrowserEnvironmentService);
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
    inject(DestroyRef).onDestroy(() => {
      this.release();
    });
  }

  private grab(event: PointerEvent, handle: HTMLElement): void {
    if (event.button !== 0 || isOnControl(event)) {
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
      this.browser.listen('pointermove', (move) => this.drag(move), {
        passive: false,
      }),
      this.browser.listen('pointerup', () => this.release()),
      this.browser.listen('pointercancel', () => this.release()),
      () => {
        handle.style.cursor = '';
      },
    ];
  }

  private drag(event: PointerEvent): void {
    const grip = this.grip;
    const viewport = this.browser.viewport();
    if (!grip || !viewport) {
      return;
    }
    event.preventDefault();
    const rect = this.element.getBoundingClientRect();
    const left0 = rect.left - this.dx;
    const top0 = rect.top - this.dy;
    this.dx = clamp(
      grip.dx + (event.clientX - grip.x),
      EDGE_LEFT - left0 - rect.width + VISIBLE_SIDEWAYS,
      viewport.width - VISIBLE_SIDEWAYS - left0,
    );
    this.dy = clamp(
      grip.dy + (event.clientY - grip.y),
      EDGE_TOP - top0,
      viewport.height - EDGE_BOTTOM - top0,
    );
    this.element.style.transform = `translate(${String(Math.round(this.dx))}px,${String(Math.round(this.dy))}px)`;
  }

  private release(): void {
    for (const release of this.releaseDrag) {
      release();
    }
    this.releaseDrag = [];
    this.grip = null;
  }
}
