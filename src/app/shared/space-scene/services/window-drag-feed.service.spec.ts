import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DragSource, WindowDragFeedService } from './window-drag-feed.service';

type Live = (
  rect: { x: number; y: number; width: number; height: number } | null,
) => void;

const frameDouble = () => {
  const lives = new Set<Live>();
  const frame: DragSource = {
    onLive: (handler) => {
      lives.add(handler);
      return () => {
        lives.delete(handler);
      };
    },
  };
  return { frame, lives };
};

const start = () => {
  const first = frameDouble();
  const frames = signal<readonly DragSource[]>([first.frame]);
  const feed = Injector.create({
    providers: [WindowDragFeedService],
    parent: TestBed.inject(Injector),
  }).get(WindowDragFeedService);
  TestBed.runInInjectionContext(() => {
    feed.follow(frames);
  });
  return { feed, frames, first };
};

describe('WindowDragFeedService', () => {
  it('hears a frame that appears after the handler was given, as a box', () => {
    const { feed, frames } = start();
    const heard = vi.fn();
    feed.onDragging(heard);
    const later = frameDouble();

    frames.set([...frames(), later.frame]);
    TestBed.tick();
    for (const live of later.lives) {
      live({ x: 10, y: 20, width: 30, height: 40 });
    }

    expect(heard).toHaveBeenCalledWith({
      left: 10,
      top: 20,
      right: 40,
      bottom: 60,
    });
  });

  it('stops listening to a frame that goes', () => {
    const { frames, first } = start();
    TestBed.tick();
    expect(first.lives.size).toBe(1);

    frames.set([]);
    TestBed.tick();

    expect(first.lives.size).toBe(0);
  });

  it('stops giving a handler that was stopped', () => {
    const { feed, first } = start();
    TestBed.tick();
    const heard = vi.fn();
    feed.onDragging(heard)();

    for (const live of first.lives) {
      live(null);
    }

    expect(heard).not.toHaveBeenCalled();
  });
});
