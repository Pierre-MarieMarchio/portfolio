import { isOnControl } from '@app/core/helpers';
import {
  FRAME_EDGES,
  type DraggedFrame,
  type FrameArea,
  type FrameClearance,
  type FrameEdge,
  type FrameGrip,
  type FramePlace,
  type FrameRect,
  type FrameTracking,
  type FrameZone,
  type FramedWindow,
} from '../models/window-frame.model';
import {
  areaOf,
  clampMove,
  clearanceOf,
  frameOfZone,
  isZone,
  unsnapAt,
} from '../rules/window-frame.rules';
import { WindowDragTracker } from './window-drag.tracker';
import { WindowHeightTracker } from './window-height.tracker';

const NOWHERE: FramePlace = { dx: 0, dy: 0, width: null, height: null };
const RESERVE = '--window-reserve';
const HEAD = '--head-bottom';
const EDGE_STYLES: Readonly<Record<FrameEdge, string>> = {
  e: 'top:0;right:0;bottom:0;width:5px;cursor:ew-resize',
  w: 'top:0;left:0;bottom:0;width:5px;cursor:ew-resize',
  s: 'left:0;right:0;bottom:0;height:5px;cursor:ns-resize',
  se: 'right:0;bottom:0;width:14px;height:14px;cursor:nwse-resize',
  sw: 'left:0;bottom:0;width:14px;height:14px;cursor:nesw-resize',
};

const rectOf = (element: Element): FrameRect => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left, y: top, width, height };
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

export class WindowFrameTracker implements FrameTracking, DraggedFrame {
  private painted: FramePlace = NOWHERE;
  private restore: FramePlace | null = null;
  private drag: WindowDragTracker | null = null;
  private readonly edges: readonly HTMLElement[];
  private readonly stops: (() => void)[];
  private readonly height: WindowHeightTracker;

  constructor(private readonly framed: FramedWindow) {
    const { bar } = framed.parts;
    const edges = FRAME_EDGES.map((edge) => ({ edge, at: this.edgeOf(edge) }));
    this.edges = edges.map(({ at }) => at);
    this.height = new WindowHeightTracker(framed);
    this.stops = [
      listen(bar, 'pointerdown', (event) => {
        this.grab(event, 'bar', bar);
      }),
      ...edges.map(({ edge, at }) =>
        listen(at, 'pointerdown', (event) => {
          this.grab(event, edge, at);
        }),
      ),
      framed.onWindow('resize', () => this.fit(), { passive: true }),
    ];
  }

  public toggleMaximize(): void {
    this.settle();
    if (this.framed.mode() !== 'full') {
      this.snap('full');
      return;
    }
    const restore = this.restore;
    this.restore = null;
    this.paintPlace(restore);
    this.framed.commit(restore, restore ? 'free' : null);
  }

  public fit(): void {
    this.height.fit();
    const mode = this.framed.mode();
    const viewport = this.framed.viewport();
    if (this.drag || !viewport || mode === null) {
      return;
    }
    this.painted = this.framed.place() ?? NOWHERE;
    const rect = this.rect();
    const place = isZone(mode)
      ? this.placeAt(frameOfZone(mode, this.area(rect)))
      : this.moveTo(clampMove(rect, viewport, this.clearance()));
    this.framed.commit(place, mode);
  }

  public fitHeight(): void {
    this.height.fit();
  }

  public stop(): void {
    this.settle();
    for (const stop of this.stops.splice(0)) {
      stop();
    }
    for (const edge of this.edges) {
      edge.remove();
    }
    this.height.stop();
  }

  public rect(): FrameRect {
    return rectOf(this.framed.element);
  }

  public area(rect: FrameRect): FrameArea {
    const x = rect.x - this.painted.dx;
    const y = rect.y - this.painted.dy;
    return areaOf(
      { left: x, top: y, right: x + rect.width, bottom: y + rect.height },
      this.framed.parts.anchor(),
      this.framed.viewport() ?? { width: 0, height: 0 },
      Number.parseFloat(this.framed.token(RESERVE, this.framed.element)) || 0,
    );
  }

  public clearance(): FrameClearance {
    return clearanceOf(
      Number.parseFloat(this.framed.token(HEAD, this.framed.element)) || 0,
      Number.parseFloat(this.framed.token(RESERVE, this.framed.element)) || 0,
      this.framed.parts.bar.getBoundingClientRect().height,
    );
  }

  public moveTo(rect: FrameRect): FramePlace {
    const now = this.rect();
    const place = this.paintPlace({
      ...this.painted,
      dx: Math.round(this.painted.dx + rect.x - now.x),
      dy: Math.round(this.painted.dy + rect.y - now.y),
    });
    this.framed.live(rect);
    return place;
  }

  public placeAt(rect: FrameRect): FramePlace {
    this.paintPlace({
      ...this.painted,
      width: rect.width,
      height: rect.height,
    });
    return this.moveTo(rect);
  }

  public unsnap(grabX: number): FrameRect | null {
    if (!isZone(this.framed.mode())) {
      return null;
    }
    const zoned = this.rect();
    const restore = this.restore;
    this.restore = null;
    this.paintPlace({
      ...this.painted,
      width: restore?.width ?? null,
      height: restore?.height ?? null,
    });
    const sized = this.rect();
    return { ...sized, x: unsnapAt(zoned, sized.width, grabX), y: zoned.y };
  }

  public land(isMoved: boolean, zone: FrameZone | null): void {
    this.drag = null;
    this.framed.live(null);
    if (!isMoved) {
      return;
    }
    if (zone) {
      this.snap(zone);
      return;
    }
    this.framed.commit(this.painted, 'free');
  }

  private grab(
    event: PointerEvent,
    grip: FrameGrip,
    handle: HTMLElement,
  ): void {
    if (event.button !== 0 || (grip === 'bar' && isOnControl(event))) {
      return;
    }
    if (grip !== 'bar') {
      event.preventDefault();
    }
    this.settle();
    this.drag = new WindowDragTracker(this, this.framed, {
      grip,
      handle,
      x: event.clientX,
      y: event.clientY,
    });
  }

  private snap(zone: FrameZone): void {
    if (!isZone(this.framed.mode()) || !this.restore) {
      this.restore = this.painted === NOWHERE ? null : this.painted;
    }
    const rect = this.rect();
    this.framed.commit(this.placeAt(frameOfZone(zone, this.area(rect))), zone);
  }

  private settle(): void {
    this.drag?.stop();
    this.drag = null;
    this.painted = this.framed.place() ?? NOWHERE;
  }

  private paintPlace(place: FramePlace | null): FramePlace {
    this.painted = place ?? NOWHERE;
    if (place?.height != null) {
      this.height.clear();
    }
    this.framed.paint(place);
    return this.painted;
  }

  private edgeOf(edge: FrameEdge): HTMLElement {
    const { section } = this.framed.parts;
    const element = section.ownerDocument.createElement('div');
    element.setAttribute('aria-hidden', 'true');
    element.dataset['edge'] = edge;
    element.style.cssText = `position:absolute;z-index:1;touch-action:none;${EDGE_STYLES[edge]}`;
    section.append(element);
    return element;
  }
}
