const ignore = (): void => {};

interface Waiting {
  readonly ms: number;
  readonly fn: () => void;
}

export class ClockDouble {
  private frames: ((time: number) => void)[] = [];
  private waiting: Waiting[] = [];

  public readonly nextFrame = (fn: (time: number) => void): (() => void) => {
    this.frames.push(fn);
    return () => {
      this.frames = this.frames.filter((frame) => frame !== fn);
    };
  };

  public readonly after = (ms: number, fn: () => void): (() => void) => {
    const waiting = { ms, fn };
    this.waiting.push(waiting);
    return () => {
      this.waiting = this.waiting.filter((entry) => entry !== waiting);
    };
  };

  public frame(): void {
    const frames = this.frames;
    this.frames = [];
    for (const fn of frames) {
      fn(0);
    }
  }

  public elapse(ms: number): void {
    const due = this.waiting.filter((entry) => entry.ms <= ms);
    this.waiting = this.waiting.filter((entry) => entry.ms > ms);
    for (const { fn } of due) {
      fn();
    }
  }
}

export class ElementObserverDouble {
  public knowsSnapChanging = false;
  public readonly moving: Element[] = [];
  private readonly resized: (() => void)[] = [];
  private readonly sightings: ((isVisible: boolean) => void)[] = [];
  private readonly snapping = new Map<
    Element,
    (target: Element | null) => void
  >();
  private stillnesses: (() => void)[] = [];

  public readonly hasSnapChanging = (): boolean => this.knowsSnapChanging;

  public readonly onResize = (_element: Element, fn: () => void) => {
    this.resized.push(fn);
    return ignore;
  };

  public readonly onVisible = (
    _element: Element,
    _threshold: number,
    fn: (isVisible: boolean) => void,
  ) => {
    this.sightings.push(fn);
    return ignore;
  };

  public readonly onSnapChanging = (
    element: Element,
    fn: (target: Element | null) => void,
  ): (() => void) => {
    this.snapping.set(element, fn);
    return () => {
      this.snapping.delete(element);
    };
  };

  public readonly whenStill = (element: Element): Promise<void> => {
    this.moving.push(element);
    return new Promise((resolve) => {
      this.stillnesses.push(resolve);
    });
  };

  public resize(): void {
    for (const fn of this.resized) {
      fn();
    }
  }

  public sight(isVisible: boolean): void {
    for (const fn of this.sightings) {
      fn(isVisible);
    }
  }

  public snapTo(element: Element, target: Element | null): void {
    this.snapping.get(element)?.(target);
  }

  public async settle(): Promise<void> {
    const stillnesses = this.stillnesses;
    this.stillnesses = [];
    for (const resolve of stillnesses) {
      resolve();
    }
    await Promise.resolve();
  }
}

export class MediaPreferencesDouble {
  public isReduced = false;

  public readonly reducedMotion = (): boolean => this.isReduced;
}

export class HapticsDouble {
  public readonly vibrations: number[] = [];

  public readonly vibrate = (ms: number): void => {
    this.vibrations.push(ms);
  };
}

export class BrowserWindowDouble {
  public knowsScrollEnd = true;

  public readonly supportsEvent = (type: string): boolean =>
    type === 'scrollend' && this.knowsScrollEnd;
}
