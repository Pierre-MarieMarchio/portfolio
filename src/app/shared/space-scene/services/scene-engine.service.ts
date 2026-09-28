import { DestroyRef, inject, PendingTasks, Service } from '@angular/core';
import { AnimatedCanvasService } from './animated-canvas.service';
import type { EngineHost, EngineOptions } from '../engine/space-scene.engine';
import {
  RemoteCanvases,
  RemoteSceneEngine,
  ShownCanvas,
} from '../engine/remote-scene.engine';
import type { SceneEngine } from '../models/scene-engine.model';
import type {
  FromSceneWorker,
  ToSceneWorker,
} from '../models/scene-worker.model';

const DENSITY = 3800;

export interface SceneCanvases {
  readonly matter: HTMLCanvasElement;
  readonly sky: HTMLCanvasElement;
}

@Service({ autoProvided: false })
export class SceneEngineService {
  private readonly canvas = inject(AnimatedCanvasService);
  private readonly pending = inject(PendingTasks);
  private worker: Worker | null = null;
  private isDestroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.isDestroyed = true;
      this.worker?.terminate();
      this.worker = null;
    });
  }

  public async create(
    canvases: SceneCanvases,
    viewportArea: number,
  ): Promise<SceneEngine | null> {
    const remote = this.remote(canvases, viewportArea);
    if (remote) {
      return remote;
    }
    const done = this.pending.add();
    try {
      return await this.local(canvases, viewportArea);
    } finally {
      done();
    }
  }

  public fit(canvases: SceneCanvases, width: number, height: number): void {
    const sized = this.worker ? [] : [canvases.matter, canvases.sky];
    for (const canvas of sized) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }
  }

  private host(): EngineHost & { travel(isTravelling: boolean): void } {
    return {
      frame: (callback) => this.canvas.nextFrame(callback),
      now: () => this.canvas.now(),
      hidden: () => this.canvas.isHidden(),
      travel: (isOn) => {
        this.canvas.flagRoot('sky-travel', isOn);
      },
    };
  }

  private options(): Omit<EngineOptions, 'rnd'> {
    return {
      density: DENSITY,
      figures: 'constellations',
      ink: this.canvas.token('--ink') || '#2b2f3a',
      accent: this.canvas.token('--accent') || '#3b62c4',
    };
  }

  private async local(
    canvases: SceneCanvases,
    viewportArea: number,
  ): Promise<SceneEngine | null> {
    const code = await import('../engine/space-scene.engine');
    const matter = this.isDestroyed
      ? null
      : this.canvas.context2d(canvases.matter);
    return matter
      ? new code.SpaceSceneEngine(
          this.host(),
          { matter, sky: this.canvas.context2d(canvases.sky) },
          { rnd: Math.random, ...this.options() },
          viewportArea,
        )
      : null;
  }

  private remote(
    canvases: SceneCanvases,
    viewportArea: number,
  ): SceneEngine | null {
    const shown = this.shown(canvases);
    const worker = shown ? this.canvas.sceneWorker() : null;
    if (!shown || !worker) {
      return null;
    }
    this.worker = worker;
    return new RemoteSceneEngine(
      {
        post: (message: ToSceneWorker) => {
          worker.postMessage(message);
        },
        listen: (handler) => {
          worker.addEventListener(
            'message',
            (event: MessageEvent<FromSceneWorker>) => {
              handler(event.data);
            },
          );
        },
      },
      this.host(),
      shown,
      {
        ...this.options(),
        viewportArea,
        timeOrigin: this.canvas.timeOrigin(),
      },
    );
  }

  private shown(canvases: SceneCanvases): RemoteCanvases | null {
    if (!this.canvas.canDrawOffThread()) {
      return null;
    }
    const matter = this.bitmapped(canvases.matter);
    const sky = this.bitmapped(canvases.sky);
    return matter && sky ? { matter, sky } : null;
  }

  private bitmapped(canvas: HTMLCanvasElement): ShownCanvas | null {
    const context = this.canvas.bitmapContext(canvas);
    return context ? { canvas, context } : null;
  }
}
