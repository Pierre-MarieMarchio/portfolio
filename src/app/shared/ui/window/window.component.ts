import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { BrowserEnvironment } from '@app/core/services';
import { SHARED_TEXTS } from '@shared/ui/texts';
import { ScrollMemory } from './scroll-memory.service';
import { WindowAnchor, WindowSize } from './window.model';

/** Ceilings in pixels; the real one is the smaller of this and the room left. */
const CEILINGS: Readonly<Record<WindowSize, number>> = {
  s: 300,
  m: 470,
  l: 920,
};

/** Below this, a window is not worth opening: it keeps it even when cramped. */
const MIN_ROOM = 200;

/**
 * The bounds keep the title bar catchable: at least this much of the window
 * stays visible sideways, and the bar never leaves the top or sinks below
 * the bottom.
 */
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

/**
 * The station's window: one grammar for every view. Four gestures, always in
 * the same place and the same order: pin (keep the window across pages),
 * collapse (keep only the title bar and give the view back to the object),
 * close, and the title bar grabs to move.
 *
 * The pin belongs to the caller: the window emits `pinToggled` and stores
 * nothing, since it is the application that decides to keep it mounted.
 * Collapsing changes what is rendered, so it is a signal. The position is
 * written into the DOM and never into a signal: dragging a window must not
 * re-render its content on every frame, and in a zoneless application a
 * listener no template declares schedules no render.
 */
@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  styleUrl: './window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowComponent {
  private readonly browser = inject(BrowserEnvironment);
  private readonly memory = inject(ScrollMemory);
  protected readonly texts = inject(SHARED_TEXTS);

  /**
   * The name in the title bar. Not `title`: that is an HTML attribute, and a
   * static `title="…"` on the host landed in the DOM as a tooltip over the
   * whole window.
   */
  public readonly heading = input.required<string>();
  public readonly meta = input('');
  public readonly size = input<WindowSize>('m');
  /**
   * The room left free under the window: that is where the fixed contact
   * rail lives, and a window that runs under it hides its own footer.
   * Anchored at the bottom, it is the reserve above the window instead.
   */
  public readonly margin = input(26);
  public readonly anchor = input<WindowAnchor>('top');
  public readonly pinned = input(false);
  public readonly closable = input(true);
  /** The section's accessible name; the heading when left empty. */
  public readonly label = input('');
  /**
   * The name its reading position is remembered under, for the visit: the
   * body is put back where it was left when a window with this key opens
   * again. Empty keeps no memory.
   */
  public readonly scrollKey = input('');

  public readonly pinToggled = output();
  public readonly closed = output();

  protected readonly collapsed = signal(false);
  protected readonly name = computed(() => this.label() || this.heading());
  protected readonly pinLabel = computed(() =>
    this.pinned() ? this.texts().window.unpin : this.texts().window.pin,
  );
  protected readonly collapseLabel = computed(() =>
    this.collapsed() ? this.texts().window.unfold : this.texts().window.fold,
  );

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly bar = viewChild.required<ElementRef<HTMLElement>>('bar');
  /** Absent while collapsed. */
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  /** The body and key the memory was last restored for. */
  private remembered: { body: HTMLElement; key: string } | null = null;
  private stopRemembering: (() => void) | null = null;

  private dx = 0;
  private dy = 0;
  private grip: Grip | null = null;
  private releaseDrag: (() => void)[] = [];

  constructor() {
    // After every render, like the export after every update: the room left
    // depends on where the page put the window, which only layout knows.
    afterEveryRender({
      write: () => {
        this.fitHeight();
        this.restoreScroll();
      },
    });

    const stopResize = this.browser.listen('resize', () => this.fitHeight(), {
      passive: true,
    });
    inject(DestroyRef).onDestroy(() => {
      stopResize();
      this.endDrag();
      this.stopRemembering?.();
    });
  }

  /**
   * Where the body is scrolled to. The caller owns what it means (a chapter
   * starting at the top, a position restored on the way back): the window
   * only knows its own scroller. 0 while collapsed.
   */
  public bodyScrollTop(): number {
    return this.body()?.nativeElement.scrollTop ?? 0;
  }

  public scrollBodyTo(top: number): void {
    const body = this.body()?.nativeElement;
    if (body) {
      body.scrollTop = top;
    }
  }

  /**
   * Once per body and key: a body recreated by unfolding, or a key changed
   * by the caller, is put back where it was left. The scroll listener is
   * imperative, so reading never schedules a render.
   */
  private restoreScroll(): void {
    const body = this.body()?.nativeElement ?? null;
    const key = this.scrollKey();
    if (!body || !key) {
      return;
    }
    if (this.remembered?.body === body && this.remembered.key === key) {
      return;
    }
    this.stopRemembering?.();
    body.scrollTop = this.memory.read(key);
    const onScroll = (): void => {
      this.memory.write(key, body.scrollTop);
    };
    body.addEventListener('scroll', onScroll, { passive: true });
    this.stopRemembering = () => {
      body.removeEventListener('scroll', onScroll);
    };
    this.remembered = { body, key };
  }

  protected onLanded(): void {
    this.fitHeight();
  }

  protected togglePin(): void {
    this.pinToggled.emit();
  }

  protected toggleCollapse(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }

  /** A double-click on a button is two clicks on that button, not a fold. */
  protected onBarDoubleClick(event: MouseEvent): void {
    if (!this.startsOnControl(event)) {
      this.toggleCollapse();
    }
  }

  /**
   * Never grab the window by a button or a link: a click on "close" would
   * become a micro-drag and the action would be lost.
   */
  protected onGrab(event: PointerEvent): void {
    if (event.button !== 0 || this.startsOnControl(event)) {
      return;
    }
    this.endDrag();
    this.grip = {
      x: event.clientX,
      y: event.clientY,
      dx: this.dx,
      dy: this.dy,
    };
    this.bar().nativeElement.style.cursor = 'grabbing';
    this.releaseDrag = [
      this.browser.listen('pointermove', (move) => this.onDrag(move), {
        passive: false,
      }),
      this.browser.listen('pointerup', () => this.endDrag()),
      this.browser.listen('pointercancel', () => this.endDrag()),
    ];
  }

  private onDrag(event: PointerEvent): void {
    const grip = this.grip;
    const viewport = this.browser.viewport();
    if (!grip || !viewport) {
      return;
    }
    event.preventDefault();
    const element = this.root().nativeElement;
    const rect = element.getBoundingClientRect();
    // Where the window would sit with no offset: the bounds are relative to it.
    const left0 = rect.left - this.dx;
    const top0 = rect.top - this.dy;
    const dx = grip.dx + (event.clientX - grip.x);
    const dy = grip.dy + (event.clientY - grip.y);
    this.dx = clamp(
      dx,
      EDGE_LEFT - left0 - rect.width + VISIBLE_SIDEWAYS,
      viewport.width - VISIBLE_SIDEWAYS - left0,
    );
    this.dy = clamp(dy, EDGE_TOP - top0, viewport.height - EDGE_BOTTOM - top0);
    element.style.transform = `translate(${String(Math.round(this.dx))}px,${String(Math.round(this.dy))}px)`;
  }

  private endDrag(): void {
    for (const release of this.releaseDrag) {
      release();
    }
    this.releaseDrag = [];
    if (this.grip) {
      this.grip = null;
      this.bar().nativeElement.style.cursor = '';
    }
  }

  /**
   * Written into the DOM, not bound in the template: re-measuring must not
   * re-render the content. Anchored at the bottom, the room is measured from
   * the bottom edge, or the sum chases its own tail: the taller it grows, the
   * higher its top, the more room it believes it has.
   */
  private fitHeight(): void {
    const element = this.root().nativeElement;
    if (this.collapsed()) {
      element.style.maxHeight = '';
      return;
    }
    const viewport = this.browser.viewport();
    if (!viewport) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const margin = this.margin();
    const room =
      this.anchor() === 'bottom'
        ? rect.bottom - this.dy - margin
        : viewport.height - (rect.top - this.dy) - margin;
    const ceiling = Math.min(Math.max(MIN_ROOM, room), CEILINGS[this.size()]);
    element.style.maxHeight = `${String(ceiling)}px`;
  }

  private startsOnControl(event: Event): boolean {
    return (
      event.target instanceof Element &&
      event.target.closest('button, a') !== null
    );
  }
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));
