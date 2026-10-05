import { DestroyRef, inject, Service } from '@angular/core';
import { MOBILE_NAV_PLATFORM } from '../ports/mobile-nav-platform.port';
import {
  closedBy,
  layerOf,
  stepsBack,
  withLayer,
} from '../rules/back-layers.rules';

interface Layer {
  readonly depth: number;
  readonly onBack: () => void;
  readonly onLeave: () => void;
}

const ignore = (): void => {};

@Service()
export class BackLayersService {
  private readonly platform = inject(MOBILE_NAV_PLATFORM);
  private layers: Layer[] = [];
  private swallowed = 0;
  private stops: (() => void)[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const stop of this.stops.splice(0)) {
        stop();
      }
    });
  }

  public push(onBack: () => void): () => void {
    return this.platform.closesOnBack() ? ignore : this.stack(onBack, onBack);
  }

  public claim(onBack: () => void, onLeave: () => void): () => void {
    return this.platform.closesOnBack()
      ? this.watch(onBack, onLeave)
      : this.stack(onBack, onLeave);
  }

  private watch(onBack: () => void, onLeave: () => void): () => void {
    let stopWatching = ignore;
    let stopLeaving = ignore;
    const stop = (): void => {
      stopWatching();
      stopLeaving();
      stopWatching = ignore;
      stopLeaving = ignore;
    };
    const close = (): void => {
      stop();
      onBack();
    };
    stopWatching = this.platform.watchClose(close);
    stopLeaving = this.platform.onLeave(() => {
      stop();
      onLeave();
    });
    return stop;
  }

  private stack(onBack: () => void, onLeave: () => void): () => void {
    this.listen();
    const layer = { depth: this.layers.length + 1, onBack, onLeave };
    this.layers = [...this.layers, layer];
    this.platform.pushHistory(
      withLayer(this.platform.historyState(), layer.depth),
    );
    return () => {
      this.release(layer);
    };
  }

  private release(layer: Layer): void {
    const steps = stepsBack(this.depths(), layer.depth);
    if (steps === 0) {
      return;
    }
    const closed = this.closeAbove(layer.depth - 1);
    this.swallowed += 1;
    this.platform.historyBack(steps);
    for (const above of closed.filter((open) => open !== layer)) {
      above.onBack();
    }
  }

  private listen(): void {
    if (this.stops.length > 0) {
      return;
    }
    this.stops = [
      this.platform.onHistoryPop((state) => {
        this.popped(state);
      }),
      this.platform.onLeave(() => {
        this.swallowed = 0;
        for (const layer of this.closeAbove(0)) {
          layer.onLeave();
        }
      }),
    ];
  }

  private popped(state: unknown): void {
    if (this.swallowed > 0) {
      this.swallowed -= 1;
      return;
    }
    this.backFrom(layerOf(state));
  }

  private backFrom(arrived: number): void {
    for (const layer of this.closeAbove(arrived)) {
      layer.onBack();
    }
  }

  private closeAbove(arrived: number): Layer[] {
    const closed = closedBy(this.depths(), arrived);
    const layers = closed.flatMap((depth) =>
      this.layers.filter((layer) => layer.depth === depth),
    );
    this.layers = this.layers.filter((layer) => layer.depth <= arrived);
    return layers;
  }

  private depths(): number[] {
    return this.layers.map((layer) => layer.depth);
  }
}
