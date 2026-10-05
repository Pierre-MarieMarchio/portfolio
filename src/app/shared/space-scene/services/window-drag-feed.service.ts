import { effect, Service, Signal } from '@angular/core';
import type { LayoutBox } from '../models/scene-layout.model';
import type { SceneWindowDrag } from '../ports/scene-window-drag.port';

type DragHandler = (rect: LayoutBox | null) => void;

interface FrameBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface DragSource {
  onLive(handler: (rect: FrameBounds | null) => void): () => void;
}

const boxOf = (rect: FrameBounds): LayoutBox => ({
  left: rect.x,
  top: rect.y,
  right: rect.x + rect.width,
  bottom: rect.y + rect.height,
});

@Service({ autoProvided: false })
export class WindowDragFeedService implements SceneWindowDrag {
  private readonly handlers = new Set<DragHandler>();

  public follow(frames: Signal<readonly DragSource[]>): void {
    effect((onCleanup) => {
      const stops = frames().map((frame) =>
        frame.onLive((rect) => {
          const box = rect && boxOf(rect);
          for (const handler of this.handlers) {
            handler(box);
          }
        }),
      );
      onCleanup(() => {
        for (const stop of stops) {
          stop();
        }
      });
    });
  }

  public onDragging(handler: DragHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}
