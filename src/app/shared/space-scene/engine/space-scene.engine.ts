import type { SceneNode } from '../models/scene-node.model';
import { Frame } from '../rules/camera/camera-frames.rules';
import { EngineHost, FrameLoopEngine } from './frame-loop.engine';
import { measureRest } from '../rules/camera/rest-frame.rules';
import { finiteOr } from '@app/core/helpers';
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
} from '../rules/camera/framing/framing.rules';
import { panelZones, topBarZone, Zone } from '../rules/panel-veil.rules';
import { restInFreeSky } from '../rules/camera/free-sky.rules';
import { figureRoomOf } from '../rules/figures/figure-room.rules';
import {
  clientOnCanvas,
  diskOnScreen,
  DiskOnScreen,
  onDiskPlane,
  pointerOnCanvas,
} from '../rules/camera/pointer.rules';
import { SceneFrame, sceneFrame } from '../rules/scene-frame.rules';
import { NO_STATE, SceneState, sceneState } from '../rules/scene-state.rules';
import { canLookCloser } from '../rules/camera/zoom.rules';
import type { SceneInputs, SkyFigures } from '../models/scene.model';
import type { SceneLayout } from '../models/scene-layout.model';

export type { EngineHost } from './frame-loop.engine';

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
  private topBar: Zone | null = null;
  private layout: SceneLayout | null = null;
  private disk: DiskOnScreen | null = null;
  private pointer: { x: number; y: number } | null = null;
  private needsDraw = true;
  private isTurning = false;

  private readonly turntable = new TurntableMotion();
  private readonly motion = new SceneMotion(this.turntable);
  private readonly framing: FramingScene = framingScene(
    this.motion.camera.rest,
    (i) => this.turntable.orbitTurn(i),
    (i) => this.renderer.labels.sizeOf(i),
  );
  private readonly frame: SceneFrame;
  private readonly renderer: SceneRenderer;
  private readonly frames: FrameLoopEngine;

  constructor(
    private readonly host: EngineHost,
    canvases: EngineCanvases,
    options: EngineOptions,
    viewportArea: number,
  ) {
    const density = Math.round(options.density * RESERVE);
    const grains = buildScene(density, options.rnd);
    this.motion.grains.startDensity(densityShare(viewportArea));
    this.frame = sceneFrame(this.state, options);
    this.renderer = new SceneRenderer(canvases, options, grains, this.motion);
    this.frames = new FrameLoopEngine(host, (dt, isVisible) =>
      this.step(dt, isVisible),
    );
  }

  public setInputs(inputs: SceneInputs): void {
    const previous = this.state;
    const state = sceneState(inputs);
    this.state = state;
    this.framing.holeFocus = inputs.holeFocus ?? null;
    this.motion.zoom.pan = inputs.pan ?? null;
    this.frames.setTouch(state.touch);
    if (previous.count !== state.count || this.orbits.length === 0) {
      this.orbits = placeOrbits(state.count);
    }
    this.motion.follow(previous, state);
    this.request();
  }

  public setNodes(
    buttons: readonly SceneNode[],
    labels: readonly SceneNode[],
    figures: readonly SceneNode[] = [],
  ): void {
    this.renderer.labels.setNodes(buttons, labels);
    this.renderer.figureTargets.setNodes(figures);
    this.request();
  }

  public setHoleMark(node: SceneNode | null): void {
    this.renderer.holeMark.setNode(node);
    this.request();
  }

  public setLines(lines: readonly SceneNode[]): void {
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
      restInFreeSky(
        layout,
        measureRest(
          layout.viewport,
          layout.topBarHeight,
          layout.bottomBarHeight,
        ),
      ),
    );
    this.zones = panelZones(layout, this.dpr);
    this.topBar = topBarZone(layout, this.dpr);
    this.request();
  }

  public resize(width: number, height: number, dpr: number): void {
    this.w = width;
    this.h = height;
    this.dpr = dpr;
    if (this.layout) {
      this.zones = panelZones(this.layout, dpr);
      this.topBar = topBarZone(this.layout, dpr);
    }
    this.needsDraw = true;
    this.draw();
    if (this.motion.zoom.resize(width, height)) {
      this.request();
    }
  }

  public setViewportArea(viewportArea: number): void {
    this.motion.grains.setDensity(densityShare(viewportArea));
    this.request();
  }

  public setVisible(isVisible: boolean): void {
    this.frames.setVisible(isVisible);
  }

  public setPointer(clientX: number | null, clientY = 0): void {
    const canvas = this.layout?.canvas;
    this.pointer =
      clientX === null || !canvas
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
    if (this.turntable.isGripped) {
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
    if (!this.turntable.isGripped) {
      return false;
    }
    const isDrag = this.turntable.release(this.host.now());
    this.request();
    return isDrag;
  }

  public grabZoom(clientX: number, clientY: number): boolean {
    const point = this.onCanvas(clientX, clientY);
    if (point) {
      this.release();
      this.motion.zoom.grab(point.x, point.y);
      this.request();
    }
    return point !== null;
  }

  public stretchZoom(clientX: number, clientY: number, ratio: number): void {
    const point = this.onCanvas(clientX, clientY);
    if (point) {
      this.motion.zoom.stretch(point.x, point.y, ratio);
      this.request();
    }
  }

  public releaseZoom(): void {
    this.motion.zoom.letGo();
    this.request();
  }

  public lookCloser(): boolean {
    const canLook = canLookCloser(this.state) && this.w > 0 && this.h > 0;
    if (canLook) {
      this.motion.zoom.toggle(this.frame.hole.cx, this.frame.hole.cy);
      this.request();
    }
    return canLook;
  }

  public request(): void {
    this.needsDraw = true;
    this.frames.wake();
  }

  public stop(): void {
    this.frames.stop();
  }

  private pointUnder(clientX: number, clientY: number): PlanePoint | null {
    const point = this.onCanvas(clientX, clientY);
    return point ? onDiskPlane(this.disk, point.x, point.y) : null;
  }

  private onCanvas(clientX: number, clientY: number) {
    return clientOnCanvas(clientX, clientY, this.layout?.canvas, this.dpr);
  }

  private fitOrbits(): void {
    const reach = this.motion.camera.fit(this.orbits, {
      w: this.w,
      h: this.h,
      dpr: this.dpr,
      isPhone: this.state.phone,
    });
    this.framing.reach = this.state.phone ? reach : null;
  }

  private step(dt: number, isVisible: boolean): boolean {
    this.advance(dt, isVisible);
    const hasMoved = this.motion.hasMoved || this.isTurning || this.needsDraw;
    if (hasMoved && isVisible) {
      this.draw();
      this.needsDraw = false;
    }
    return !this.motion.isSettled || this.turntable.isGripped || this.isTurning;
  }

  private advance(dt: number, isVisible: boolean): void {
    this.fitOrbits();
    this.motion.advance(dt, this.state, this.target(dt), isVisible);
    this.isTurning = this.turntable.step(dt, this.state.reduced, this.orbits);
    const hovered = this.state.phone ? -1 : this.state.emphasised;
    this.motion.hoverSlow.step(dt, this.motion.phase, hovered);
  }

  private target(dt: number): Frame {
    const scene = this.framing;
    scene.dims =
      this.w && this.h ? { w: this.w, h: this.h, dpr: this.dpr } : null;
    this.motion.camera.setDims(scene.dims);
    scene.layout = this.layout;
    scene.orbits = this.orbits;
    scene.phase = this.motion.phase;
    scene.azim = finiteOr(this.motion.camera.pose.azim, 0);
    return framingFor(this.state, scene, dt);
  }

  private draw(): void {
    this.fitOrbits();
    if (!this.w || !this.h || !this.motion.isDrawable) {
      return;
    }
    const frame = this.frame;
    frame.state = this.state;
    frame.w = this.w;
    frame.h = this.h;
    frame.dpr = this.dpr;
    frame.pointer = this.state.reduced ? null : this.pointer;
    frame.hoverPoint = this.pointer;
    frame.zones = this.zones;
    frame.topBar = this.topBar;
    frame.figureRoom = figureRoomOf(this.layout, this.w, this.dpr);
    frame.phoneRules = this.framing.holeFocus;
    frame.fade = 22 * this.dpr;
    frame.orbits = this.orbits;
    this.motion.lay(frame);
    this.disk = diskOnScreen(frame);
    this.renderer.draw(frame);
  }
}
