import { SkyPanMotion } from './motions/sky-pan.motion';
import { NodeRecorderEngine } from './node-recorder.engine';
import { SpaceSceneEngine } from './space-scene.engine';
import type { HoleFocusRules } from '../rules/camera/framing/framing.rules';
import {
  FromSceneWorker,
  PASSED_COMMANDS,
  PassedCommand,
  SceneWorkerBoot,
  SceneWorkerCall,
  SceneWorkerCommands,
  ToSceneWorker,
  WorkerInputs,
} from '../models/scene-worker.model';

export interface WorkerCanvas {
  width: number;
  height: number;
  getContext(kind: '2d'): Pick<CanvasRect, 'clearRect'> | null;
  transferToImageBitmap(): ImageBitmap;
}

export interface SceneWorkerScope {
  readonly timeOrigin: number;
  readonly rnd: () => number;
  canvas(): WorkerCanvas;
  frame(callback: (time: number) => void): () => void;
  now(): number;
  post(message: FromSceneWorker, transfer: Transferable[]): void;
  loadHoleFocus(): Promise<HoleFocusRules>;
}

type Command = (...args: unknown[]) => void;

export class SceneWorkerEngine {
  private commands: SceneWorkerCommands | null = null;
  private readonly recorder = new NodeRecorderEngine();
  private matter: WorkerCanvas | null = null;
  private sky: WorkerCanvas | null = null;
  private isMatterDrawn = false;
  private isSkyDrawn = false;
  private isHidden = false;
  private at: number | null = null;
  private shift = 0;
  private inputs: WorkerInputs | null = null;
  private pan: SkyPanMotion | null = null;
  private holeFocus: HoleFocusRules | null = null;
  private isHoleFocusAsked = false;
  private isFlushQueued = false;

  constructor(private readonly scope: SceneWorkerScope) {}

  public take(message: ToSceneWorker): void {
    if (message.kind === 'boot') {
      this.boot(message);
    } else {
      this.call(message);
    }
    this.queueFlush();
  }

  private boot(boot: SceneWorkerBoot): void {
    this.shift = boot.timeOrigin - this.scope.timeOrigin;
    this.matter = this.scope.canvas();
    this.sky = this.scope.canvas();
    const matter = this.drawnOn(this.matter, () => {
      this.isMatterDrawn = true;
    });
    if (!matter) {
      return;
    }
    const sky = this.drawnOn(this.sky, () => {
      this.isSkyDrawn = true;
    });
    const engine = new SpaceSceneEngine(
      {
        frame: (callback) =>
          this.scope.frame((time) => {
            callback(time);
            this.flush();
          }),
        now: () => this.at ?? this.scope.now(),
        hidden: () => this.isHidden,
      },
      { matter, sky },
      {
        rnd: this.scope.rnd,
        density: boot.density,
        figures: boot.figures,
        ink: boot.ink,
        accent: boot.accent,
      },
      boot.viewportArea,
    );
    this.commands = { ...this.passed(engine), ...this.owned(engine) };
  }

  private drawnOn(
    canvas: WorkerCanvas,
    onDrawn: () => void,
  ): CanvasRenderingContext2D | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    const clear = ctx.clearRect.bind(ctx);
    ctx.clearRect = (x, y, w, h) => {
      onDrawn();
      clear(x, y, w, h);
    };
    return ctx as CanvasRenderingContext2D;
  }

  private call(message: SceneWorkerCall): void {
    const command = this.commands?.[message.name] as Command | undefined;
    if (!command) {
      return;
    }
    this.isHidden = message.hidden;
    this.at = message.at + this.shift;
    try {
      command(...message.args);
    } finally {
      this.at = null;
    }
  }

  private passed(
    engine: SpaceSceneEngine,
  ): Pick<SceneWorkerCommands, PassedCommand> {
    const passed: Partial<Record<PassedCommand, Command>> = {};
    for (const name of PASSED_COMMANDS) {
      passed[name] = engine[name].bind(engine) as Command;
    }
    return passed as Pick<SceneWorkerCommands, PassedCommand>;
  }

  private owned(
    engine: SpaceSceneEngine,
  ): Omit<SceneWorkerCommands, PassedCommand> {
    const recorder = this.recorder;
    return {
      setInputs: (inputs) => {
        this.inputs = inputs;
        this.pan = inputs.pan ? (this.pan ?? new SkyPanMotion()) : null;
        this.askHoleFocus(inputs, engine);
        this.giveInputs(engine);
      },
      setNodes: (buttons, labels, figures) => {
        engine.setNodes(
          recorder.nodes('buttons', buttons),
          recorder.nodes('labels', labels),
          recorder.nodes('figures', figures),
        );
      },
      setHoleMark: (isMarked) => {
        engine.setHoleMark(recorder.nodes('hole', isMarked ? 1 : 0)[0] ?? null);
      },
      setLines: (count) => {
        engine.setLines(recorder.nodes('lines', count));
      },
      measureLabels: (sizes) => {
        recorder.sizeLabels(sizes);
        engine.measureLabels();
      },
      resize: (width, height, dpr) => {
        this.fit(width, height);
        engine.resize(width, height, dpr);
      },
      panBy: (dx, dy) => {
        this.pan?.by(dx, dy);
      },
    };
  }

  private fit(width: number, height: number): void {
    for (const canvas of [this.matter, this.sky]) {
      if (canvas && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
      }
    }
  }

  private askHoleFocus(inputs: WorkerInputs, engine: SpaceSceneEngine): void {
    if (!inputs.holeFocus || this.isHoleFocusAsked) {
      return;
    }
    this.isHoleFocusAsked = true;
    void this.scope.loadHoleFocus().then((rules) => {
      this.holeFocus = rules;
      this.giveInputs(engine);
      this.queueFlush();
    });
  }

  private giveInputs(engine: SpaceSceneEngine): void {
    const inputs = this.inputs;
    if (inputs) {
      engine.setInputs({
        ...inputs,
        holeFocus: inputs.holeFocus ? this.holeFocus : null,
        pan: this.pan,
      });
    }
  }

  private queueFlush(): void {
    if (this.isFlushQueued) {
      return;
    }
    this.isFlushQueued = true;
    queueMicrotask(() => {
      this.isFlushQueued = false;
      this.flush();
    });
  }

  private flush(): void {
    if (!this.isMatterDrawn && !this.isSkyDrawn && !this.recorder.hasWrites) {
      return;
    }
    const matter = this.isMatterDrawn ? this.bitmapOf(this.matter) : null;
    const sky = this.isSkyDrawn ? this.bitmapOf(this.sky) : null;
    this.isMatterDrawn = false;
    this.isSkyDrawn = false;
    const pan = this.pan;
    this.scope.post(
      {
        kind: 'frame',
        matter,
        sky,
        writes: this.recorder.take(),
        generations: this.recorder.generations,
        pan: pan ? { x: pan.x, y: pan.y } : null,
      },
      [matter, sky].filter((bitmap) => bitmap !== null),
    );
  }

  private bitmapOf(canvas: WorkerCanvas | null): ImageBitmap | null {
    return canvas && canvas.width > 0 && canvas.height > 0
      ? canvas.transferToImageBitmap()
      : null;
  }
}
