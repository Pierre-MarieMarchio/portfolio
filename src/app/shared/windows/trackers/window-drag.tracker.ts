import type {
  DraggedFrame,
  FrameGrab,
  FrameRect,
  FrameZone,
  FramedWindow,
} from '../models/window-frame.model';
import {
  clampMove,
  clampResize,
  frameOfZone,
  snapZoneOf,
} from '../rules/window-frame.rules';

const SLOP = 4;
const OUTLINE_HIDDEN = 'scale(0.97)';
const OUTLINE_STYLE = [
  'position:absolute',
  'box-sizing:border-box',
  'pointer-events:none',
  'border:1px solid var(--sig)',
  'border-radius:var(--radius)',
  'background:color-mix(in oklab,var(--sig) 6%,transparent)',
  'opacity:0',
  `transform:${OUTLINE_HIDDEN}`,
].join(';');
const OUTLINE_MOTION = 'opacity var(--t),transform var(--t)';

export class WindowDragTracker {
  private start: FrameRect;
  private zone: FrameZone | null = null;
  private isMoved = false;
  private readonly outline: HTMLElement | null;
  private readonly stops: (() => void)[];

  constructor(
    private readonly frame: DraggedFrame,
    private readonly framed: FramedWindow,
    private readonly grab: FrameGrab,
  ) {
    this.start = frame.rect();
    this.outline = grab.grip === 'bar' ? this.outlineOf() : null;
    if (grab.grip === 'bar') {
      grab.handle.style.cursor = 'grabbing';
    }
    framed.blockSelection(true);
    this.stops = [
      framed.onWindow('pointermove', (move) => this.drag(move), {
        passive: false,
      }),
      framed.onWindow('pointerup', () => this.drop()),
      framed.onWindow('pointercancel', () => this.drop()),
    ];
  }

  public stop(): void {
    for (const stop of this.stops.splice(0)) {
      stop();
    }
    this.outline?.remove();
    if (this.grab.grip === 'bar') {
      this.grab.handle.style.cursor = '';
    }
    this.framed.blockSelection(false);
  }

  private drag(event: PointerEvent): void {
    const viewport = this.framed.viewport();
    if (!viewport) {
      return;
    }
    event.preventDefault();
    const delta = {
      dx: event.clientX - this.grab.x,
      dy: event.clientY - this.grab.y,
    };
    const { grip } = this.grab;
    if (grip !== 'bar') {
      this.isMoved = true;
      const area = this.frame.area(this.start);
      this.frame.placeAt(clampResize(this.start, grip, delta, area));
      return;
    }
    if (!this.isMoved) {
      if (Math.hypot(delta.dx, delta.dy) < SLOP) {
        return;
      }
      this.isMoved = true;
      this.start = this.frame.unsnap(this.grab.x) ?? this.start;
    }
    const { start } = this;
    this.frame.moveTo(
      clampMove(
        { ...start, x: start.x + delta.dx, y: start.y + delta.dy },
        viewport,
        this.frame.clearance(),
      ),
    );
    this.show(snapZoneOf(event.clientX, event.clientY, viewport));
  }

  private drop(): void {
    this.stop();
    this.frame.land(this.isMoved, this.zone);
  }

  private outlineOf(): HTMLElement {
    const outline = this.framed.element.ownerDocument.createElement('div');
    outline.setAttribute('aria-hidden', 'true');
    outline.style.cssText = OUTLINE_STYLE;
    if (!this.framed.reducedMotion()) {
      outline.style.transition = OUTLINE_MOTION;
    }
    this.framed.element.after(outline);
    return outline;
  }

  private show(zone: FrameZone | null): void {
    const outline = this.outline;
    if (!outline || zone === this.zone) {
      return;
    }
    this.zone = zone;
    if (!zone) {
      outline.style.opacity = '0';
      outline.style.transform = OUTLINE_HIDDEN;
      return;
    }
    const rect = frameOfZone(zone, this.frame.area(this.frame.rect()));
    const box = this.framed.element.offsetParent?.getBoundingClientRect();
    Object.assign(outline.style, {
      left: `${String(rect.x - (box?.left ?? 0))}px`,
      top: `${String(rect.y - (box?.top ?? 0))}px`,
      width: `${String(rect.width)}px`,
      height: `${String(rect.height)}px`,
      zIndex: this.framed.token('z-index', this.framed.element),
      opacity: '1',
      transform: 'none',
    });
  }
}
