import { Frame, measureHome } from './camera';
import { clamp, finiteOr } from './math';
import { Orbit, placeOrbits } from './scene';
import { PlanePoint, Turntable } from './turntable';
import { SceneMotion } from './motions/scene.motion';
import { SceneRenderer } from './renderers/scene.renderer';
import { buildScene, RESERVE } from '../../../rules/scene/grain-reserve.rules';
import {
  framingFor,
  framingScene,
  FramingScene,
} from '../../../rules/scene/framing.rules';
import { panelZones, Zone } from '../../../rules/scene/panel-veil.rules';
import {
  diskOnScreen,
  DiskOnScreen,
  onDiskPlane,
  pointerOnCanvas,
} from '../../../rules/scene/pointer.rules';
import {
  NO_INPUTS,
  SceneFrame,
  sceneFrame,
} from '../../../rules/scene/scene-frame.rules';

export type ObjectView = 'home' | 'index' | 'sheet' | 'about' | 'not-found';

/** What the composition says, in ranks; -1 for none. */
export interface EngineInputs {
  readonly count: number;
  readonly featured: number;
  readonly view: ObjectView;
  readonly focus: number;
  readonly chapter: number;
  readonly part: number;
  readonly preview: number;
  readonly hovered: number;
  /** Rank of the index row open, -1 for none; read on the index only. */
  readonly selected: number;
  readonly paused: boolean;
  readonly reduced: boolean;
  /** The home page's rest has arrived: planets and orbits may rise. */
  readonly revealed: boolean;
  /**
   * The names the sky gives the parts of "about", in their order and in the
   * reader's language: the engine draws words, it does not write them.
   */
  readonly partLabels: readonly string[];
}

/** The browser as the engine needs it, handed in so the engine owns none. */
export interface EngineHost {
  frame(callback: (time: number) => void): () => void;
  now(): number;
  hidden(): boolean;
}

export interface EngineCanvases {
  readonly matter: CanvasRenderingContext2D;
  readonly sky: CanvasRenderingContext2D | null;
}

/**
 * A text panel, in CSS pixels of the viewport. The text comes before the
 * matter: the points that fall behind are dimmed, and the labels avoid it.
 */
export interface PanelRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly opacity: number;
}

/** What the component measured, outside the loop, for the engine to read. */
export interface Layout {
  readonly canvas: { readonly left: number; readonly top: number };
  readonly viewport: { readonly width: number; readonly height: number };
  readonly panels: readonly PanelRect[];
  /** The head's real height: it bounds the top of the free band. */
  readonly headHeight: number | null;
  readonly ruleHeight: number | null;
  /** The left edge of the sheet's panel: it bounds the sheet's approach. */
  readonly sheetLeft: number | null;
  readonly previewLeft: number | null;
}

export interface EngineOptions {
  readonly rnd: () => number;
  /** Points shown at rest, before the reserve (3800 in the mockup). */
  readonly density: number;
  /** "About" draws constellations (the default) or the comets variant. */
  readonly aboutBodies: 'constellations' | 'comets';
  readonly ink: string;
  readonly accent: string;
}

/** The views where the object is seen whole, and can be turned. */
const TURNABLE: ReadonlySet<ObjectView> = new Set(['home', 'index', 'about']);

/**
 * The object: the black hole, its disk, its planets, and the sky behind.
 * Ported from the mockup's `Component` (docs/maquette/objet-canvas.md):
 * everything is 2D, projected by hand, which is what holds 60 frames per
 * second with thousands of points.
 *
 * Nothing here knows Angular. The frame loop writes into the two canvases
 * and into the style of the planet buttons and labels, never into a signal:
 * in a zoneless application a signal read by a template would render the
 * page at 60 fps.
 */
export class ObjectEngine {
  private inputs: EngineInputs = NO_INPUTS;
  private orbits: Orbit[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private zones: Zone[] = [];
  private layout: Layout | null = null;
  private disk: DiskOnScreen | null = null;
  private pointer: { x: number; y: number } | null = null;
  private needsDraw = true;
  private isVisible = true;
  private isTurning = false;
  private cancelFrame: (() => void) | null = null;
  private last = 0;

  /** The object turned by hand: the disk, and the orbits around it. */
  private readonly turntable = new Turntable();
  private readonly motion = new SceneMotion(this.turntable);
  private readonly framing: FramingScene = framingScene(
    this.motion.camera.home,
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
    // The same composition everywhere, fewer points on a small screen.
    const factor = clamp(viewportArea / (1280 * 800), 0.42, 1);
    const grains = buildScene(
      Math.round(options.density * factor * RESERVE),
      options.rnd,
    );
    this.frame = sceneFrame(this.inputs, options);
    this.renderer = new SceneRenderer(canvases, options, grains, this.motion);
  }

  /** Whether a frame is scheduled: the loop rests once nothing moves. */
  public get running(): boolean {
    return this.cancelFrame !== null;
  }

  public setInputs(inputs: EngineInputs): void {
    const previous = this.inputs;
    this.inputs = inputs;
    if (previous.count !== inputs.count || this.orbits.length === 0) {
      this.orbits = placeOrbits(inputs.count);
    }
    if (previous === NO_INPUTS) {
      this.motion.start(inputs);
    } else if (previous.reduced && !inputs.reduced) {
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

  /**
   * The home rule's lines, in rank order: each rises with its planet, on
   * the same clock. Kept when the same elements come back in a new list,
   * so what was written is not written again.
   */
  public setLines(lines: readonly HTMLElement[]): void {
    if (this.renderer.labels.setLines(lines)) {
      this.request();
    }
  }

  public measureLabels(): void {
    this.renderer.labels.measure();
  }

  public setLayout(layout: Layout): void {
    this.layout = layout;
    this.motion.camera.measureHome(
      measureHome(layout.viewport, layout.headHeight, layout.ruleHeight),
    );
    this.zones = panelZones(layout, this.dpr);
    this.request();
  }

  /** Canvas size in device pixels; the zones follow the new ratio. */
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

  public setVisible(isVisible: boolean): void {
    this.isVisible = isVisible;
    if (isVisible) {
      this.loop();
    } else {
      this.stop();
    }
  }

  /** The cursor, in client coordinates, or `null` once it left. */
  public setPointer(clientX: number | null, clientY = 0): void {
    const canvas = this.layout?.canvas;
    this.pointer =
      clientX === null || !canvas || this.inputs.reduced
        ? null
        : pointerOnCanvas(clientX - canvas.left, clientY - canvas.top, {
            w: this.w,
            h: this.h,
            dpr: this.dpr,
          });
    this.request();
  }

  /**
   * Turning the object by hand, on the home page, the index and "about":
   * wherever the object is seen whole. Not on a sheet, where the camera is
   * framed on one planet and a turn would carry it off. Nothing announces it: the
   * reader grabs the void around the disk and pushes: near the hole, the
   * disk; further out, the orbits. Grabbing a spinning turntable stops it,
   * as a hand stops a turntable.
   */
  public grab(clientX: number, clientY: number): boolean {
    if (!TURNABLE.has(this.inputs.view) || this.inputs.reduced) {
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

  /** The held turntable follows the hand, angle for angle. */
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

  /**
   * Lets go: the turntable keeps the hand's speed over its last moments, or
   * none if the hand had stopped. Answers whether the gesture was a drag
   * (over 6 px), not a click.
   */
  public release(): boolean {
    if (!this.turntable.held) {
      return false;
    }
    const isDrag = this.turntable.release(this.host.now());
    this.request();
    return isDrag;
  }

  /** Draws once more, and runs the loop if it rested. */
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

  /** The orbits fitted to the room: see `fitOrbits`. */
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
    // A frame's timestamp can precede the `now` read when the loop started:
    // never a step back in time.
    const dt = clamp(now - this.last, 0, 60) / 1000;
    this.last = now;
    this.advance(dt);
    if (this.hasMoved() && this.isVisible) {
      this.draw();
      this.needsDraw = false;
    }
    // The loop stops by itself once nothing moves.
    if (this.isVisible && this.isMoving()) {
      this.cancelFrame = this.host.frame(this.tick);
    }
  };

  private advance(dt: number): void {
    // Fitted before the camera reads them: its aim, the sheet's and the
    // preview's frames and the hand's share of a turn all read the orbits'
    // radii, which used to be the last frame's (1.6 at the first).
    this.fitOrbits();
    this.motion.advance(dt, this.inputs, this.target(), this.isVisible);
    this.isTurning = this.turntable.step(dt, this.inputs.reduced, this.orbits);
  }

  private hasMoved(): boolean {
    return this.motion.hasMoved || this.isTurning || this.needsDraw;
  }

  private isMoving(): boolean {
    return !this.motion.isSettled || this.turntable.held || this.isTurning;
  }

  /** The framing for the current view. */
  private target(): Frame {
    const scene = this.framing;
    scene.dims =
      this.w && this.h ? { w: this.w, h: this.h, dpr: this.dpr } : null;
    scene.layout = this.layout;
    scene.orbits = this.orbits;
    scene.phase = this.motion.phase;
    // The framings aim at a planet: it turns with its orbit.
    scene.azim = finiteOr(this.motion.camera.pose.azim, 0);
    return framingFor(this.inputs, scene);
  }

  private draw(): void {
    this.fitOrbits();
    if (!this.w || !this.h) {
      return;
    }
    const frame = this.frame;
    frame.inputs = this.inputs;
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
