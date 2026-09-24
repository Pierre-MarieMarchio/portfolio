import { Frame, measureRest } from '../rules/camera/camera-frames.rules';
import { clamp, finiteOr } from '@app/core/helpers';
import { Orbit, placeOrbits } from '../rules/scene-bodies.rules';
import { PlanePoint, TurntableMotion } from './motions/turntable.motion';
import { SceneMotion } from './motions/scene.motion';
import { SceneRenderer } from './renderers/scene.renderer';
import {
  buildScene,
  densityShare,
  RESERVE,
} from '../rules/matter/grain-reserve.rules';
import {
  framingFor,
  framingScene,
  FramingScene,
} from '../rules/camera/framing.rules';
import { panelZones, Zone } from '../rules/panel-veil.rules';
import {
  diskOnScreen,
  DiskOnScreen,
  onDiskPlane,
  pointerOnCanvas,
} from '../rules/camera/pointer.rules';
import { SceneFrame, sceneFrame } from '../rules/scene-frame.rules';
import { NO_STATE, SceneState, sceneState } from '../rules/scene-state.rules';
import type { SceneInputs, SkyFigures } from '../models/scene.model';
import type { SceneLayout } from '../models/scene-layout.model';

export interface EngineHost {
  frame(callback: (time: number) => void): () => void;
  now(): number;
  hidden(): boolean;
}

export interface EngineCanvases {
  readonly matter: CanvasRenderingContext2D;
  readonly sky: CanvasRenderingContext2D | null;
}

export interface EngineOptions {
  readonly rnd: () => number;
  readonly density: number;
  readonly figures: SkyFigures;
  readonly ink: string;
  readonly accent: string;
}

export class SpaceSceneEngine {
  private state: SceneState = NO_STATE;
  private orbits: Orbit[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private zones: Zone[] = [];
  private layout: SceneLayout | null = null;
  private disk: DiskOnScreen | null = null;
  private pointer: { x: number; y: number } | null = null;
  private needsDraw = true;
  private isVisible = true;
  private isTurning = false;
  private cancelFrame: (() => void) | null = null;
  private last = 0;

  private readonly turntable = new TurntableMotion();
  private readonly motion = new SceneMotion(this.turntable);
  private readonly framing: FramingScene = framingScene(
    this.motion.camera.rest,
    (i) => this.turntable.orbitTurn(i),
  );
  private readonly frame: SceneFrame;
  private readonly renderer: SceneRenderer;

  constructor(
    private readonly host: EngineHost,
    canvases: EngineCanvases,
    options: EngineOptions,
    viewportArea: number,
  ) {
    const grains = buildScene(
      Math.round(options.density * RESERVE),
      options.rnd,
    );
    this.motion.grains.startDensity(densityShare(viewportArea));
    this.frame = sceneFrame(this.state, options);
    this.renderer = new SceneRenderer(canvases, options, grains, this.motion);
  }

  public get running(): boolean {
    return this.cancelFrame !== null;
  }

  public setInputs(inputs: SceneInputs): void {
    const previous = this.state;
    const state = sceneState(inputs);
    this.state = state;
    if (previous.count !== state.count || this.orbits.length === 0) {
      this.orbits = placeOrbits(state.count);
    }
    if (previous === NO_STATE) {
      this.motion.start(state);
    } else if (previous.reduced && !state.reduced) {
      this.motion.skipCrossing();
    }
    this.request();
  }

  public setNodes(
    buttons: readonly HTMLElement[],
    labels: readonly HTMLElement[],
  ): void {
    this.renderer.labels.setNodes(buttons, labels);
    this.request();
  }

  public setLines(lines: readonly HTMLElement[]): void {
    if (this.renderer.labels.setLines(lines)) {
      this.request();
    }
  }

  public measureLabels(): void {
    this.renderer.labels.measure();
  }

  public setLayout(layout: SceneLayout): void {
    this.layout = layout;
    this.motion.camera.measureRest(
      measureRest(layout.viewport, layout.topBarHeight, layout.bottomBarHeight),
    );
    this.zones = panelZones(layout, this.dpr);
    this.request();
  }

  public resize(width: number, height: number, dpr: number): void {
    this.w = width;
    this.h = height;
    this.dpr = dpr;
    if (this.layout) {
      this.zones = panelZones(this.layout, dpr);
    }
    this.needsDraw = true;
    this.draw();
  }

  public setViewportArea(viewportArea: number): void {
    this.motion.grains.setDensity(densityShare(viewportArea));
    this.request();
  }

  public setVisible(isVisible: boolean): void {
    this.isVisible = isVisible;
    if (isVisible) {
      this.loop();
    } else {
      this.stop();
    }
  }

  public setPointer(clientX: number | null, clientY = 0): void {
    const canvas = this.layout?.canvas;
    this.pointer =
      clientX === null || !canvas || this.state.reduced
        ? null
        : pointerOnCanvas(clientX - canvas.left, clientY - canvas.top, {
            w: this.w,
            h: this.h,
            dpr: this.dpr,
          });
    this.request();
  }

  public grab(clientX: number, clientY: number): boolean {
    if (!this.state.turnable || this.state.reduced) {
      return false;
    }
    this.turntable.grab(
      clientX,
      clientY,
      this.pointUnder(clientX, clientY),
      this.host.now(),
    );
    this.request();
    return true;
  }

  public turn(clientX: number, clientY: number): void {
    if (this.turntable.held) {
      this.turntable.turn(
        clientX,
        clientY,
        this.pointUnder(clientX, clientY),
        this.host.now(),
      );
      this.request();
    }
  }

  public release(): boolean {
    if (!this.turntable.held) {
      return false;
    }
    const isDrag = this.turntable.release(this.host.now());
    this.request();
    return isDrag;
  }

  public request(): void {
    this.needsDraw = true;
    if (!this.cancelFrame) {
      this.loop();
    }
  }

  public stop(): void {
    this.cancelFrame?.();
    this.cancelFrame = null;
  }

  private pointUnder(clientX: number, clientY: number): PlanePoint | null {
    const canvas = this.layout?.canvas;
    return canvas
      ? onDiskPlane(
          this.disk,
          (clientX - canvas.left) * this.dpr,
          (clientY - canvas.top) * this.dpr,
        )
      : null;
  }

  private fitOrbits(): void {
    this.motion.camera.fit(this.orbits, {
      w: this.w,
      h: this.h,
      dpr: this.dpr,
    });
  }

  private loop(): void {
    this.stop();
    if (this.host.hidden() || !this.isVisible) {
      return;
    }
    this.last = this.host.now();
    this.cancelFrame = this.host.frame(this.tick);
  }

  private readonly tick = (now: number): void => {
    this.cancelFrame = null;
    const dt = clamp(now - this.last, 0, 60) / 1000;
    this.last = now;
    this.advance(dt);
    if (this.hasMoved() && this.isVisible) {
      this.draw();
      this.needsDraw = false;
    }
    if (this.isVisible && this.isMoving()) {
      this.cancelFrame = this.host.frame(this.tick);
    }
  };

  private advance(dt: number): void {
    this.fitOrbits();
    this.motion.advance(dt, this.state, this.target(), this.isVisible);
    this.isTurning = this.turntable.step(dt, this.state.reduced, this.orbits);
  }

  private hasMoved(): boolean {
    return this.motion.hasMoved || this.isTurning || this.needsDraw;
  }

  private isMoving(): boolean {
    return !this.motion.isSettled || this.turntable.held || this.isTurning;
  }

  private target(): Frame {
    const scene = this.framing;
    scene.dims =
      this.w && this.h ? { w: this.w, h: this.h, dpr: this.dpr } : null;
    scene.layout = this.layout;
    scene.orbits = this.orbits;
    scene.phase = this.motion.phase;
    scene.azim = finiteOr(this.motion.camera.pose.azim, 0);
    return framingFor(this.state, scene);
  }

  private draw(): void {
    this.fitOrbits();
    if (!this.w || !this.h) {
      return;
    }
    const frame = this.frame;
    frame.state = this.state;
    frame.w = this.w;
    frame.h = this.h;
    frame.dpr = this.dpr;
    frame.pointer = this.pointer;
    frame.zones = this.zones;
    frame.fade = 22 * this.dpr;
    frame.orbits = this.orbits;
    this.motion.lay(frame);
    this.disk = diskOnScreen(frame);
    this.renderer.draw(frame);
  }
}
