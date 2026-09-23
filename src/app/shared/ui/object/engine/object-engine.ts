import {
  ABOUT_FRAME,
  Dims,
  Frame,
  HOME_FRAME,
  HomeMeasure,
  INDEX_FRAME,
  isFiniteFrame,
  measureHome,
  previewFrame,
  referenceRadius,
  sheetFrame,
} from './camera';
import { drawComets } from './comets';
import { CONSTELLATIONS, drawConstellations } from './constellations';
import {
  clamp,
  easeOut,
  halfLifeStep,
  litAmount,
  nearestTurn,
  onCurrentTurn,
  PLANET_GAP,
  repel,
  ScreenPoint,
  TAU,
} from './math';
import {
  buildScene,
  fitOrbits,
  Grain,
  opening,
  Orbit,
  placeGrain,
  placeOrbits,
  positionOrbit,
  Projected,
} from './scene';
import { Sky } from './sky';
import { Traveling, traveling, TRAVELING_END } from './traveling';

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
}

/** The browser as the engine needs it, handed in so the engine owns none. */
export interface EngineHost {
  frame(callback: (time: number) => void): () => void;
  now(): number;
  hidden(): boolean;
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

interface Zone {
  readonly l: number;
  readonly r: number;
  readonly t: number;
  readonly b: number;
  readonly o: number;
}

interface PlanetOnScreen extends ScreenPoint {
  readonly shadeF: number;
  readonly shade: boolean;
}

/** What was last written on a node, so an unchanged frame writes nothing. */
interface Written {
  transform: string;
  events: string;
  hidden: string;
  tab: number;
  opacity: string;
}

const written = (): Written => ({
  transform: '',
  events: '',
  hidden: '',
  tab: 99,
  opacity: '',
});

/*
 * The object turned by hand, like two turntables: the disk, and the orbits
 * around it. The one grabbed follows the hand, angle for angle, and stops
 * turning on its own; thrown, it keeps the hand's speed and loses it to
 * friction; let go still, it stays put. The torque the mockup summed never
 * matched the hand: the disk slipped under the finger, and a throw was
 * capped rather than measured. And turned in one piece, disk and orbits
 * together, the object did not turn: the camera seemed to go round it.
 */
/** Half-life of a thrown spin: a lively throw turns some three times. */
const HAND_FRICTION = 1.4;
/** The hand's speed is read over its last moments only. */
const HAND_WINDOW_MS = 90;
/** Still for this long before letting go: a release, not a throw. */
const HAND_STILL_MS = 60;
/** No throw faster than this, in radians per second. */
const HAND_MAX_SPEED = 14;
/**
 * Under this radius, in the disk's plane, the angle under the finger is
 * meaningless: near the centre a tiny move sweeps a whole turn.
 */
const HAND_MIN_RADIUS = 0.45;
/**
 * Where the hand takes the orbits rather than the disk, in object radii in
 * the disk's plane: the disk fades out near 2.4, the orbits start at 4.1.
 */
const ORBITS_FROM = 3.3;
/**
 * The other turntable is dragged, never geared: it tends to this share of
 * the driving one's speed, and gets there with this lag, in seconds.
 */
const DRAG_RATIO = 0.4;
const DRAG_LAG = 0.55;

type Rotor = 'disk' | 'orbits';

/** The reserve holds 1.9 times what is shown at rest; zooming lights more. */
const RESERVE = 1.9;

const finiteOr = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

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
  private inputs: EngineInputs = {
    count: 0,
    featured: 0,
    view: 'home',
    focus: -1,
    chapter: 0,
    part: 0,
    preview: -1,
    hovered: -1,
    selected: -1,
    paused: false,
    reduced: false,
    revealed: false,
  };

  private readonly grains: Grain[];
  private orbits: Orbit[] = [];
  private readonly sky: Sky;
  private readonly partBase = 1 / RESERVE;

  private buttons: readonly HTMLElement[] = [];
  private labels: readonly HTMLElement[] = [];
  private buttonsWritten: Written[] = [];
  private labelsWritten: Written[] = [];
  private lines: readonly HTMLElement[] = [];
  private linesWritten: Written[] = [];
  private labelSizes: { w: number; h: number }[] = [];

  private w = 0;
  private h = 0;
  private dpr = 1;
  private zones: Zone[] = [];
  private layout: Layout | null = null;

  /** The home framing, eased towards its measure. */
  private readonly home: { -readonly [K in keyof Frame]: Frame[K] } = {
    ...HOME_FRAME,
  };
  private measure: HomeMeasure | null = null;
  private measured = false;

  // The camera, NaN until the first frame sets it on its target.
  private roll = Number.NaN;
  private scale = Number.NaN;
  private camX = Number.NaN;
  private camY = Number.NaN;
  private elev = Number.NaN;
  private azim = Number.NaN;
  private marks = Number.NaN;
  private about = Number.NaN;
  private readonly lit: number[] = [];

  private time = 0;
  private phase = 0;
  private marksTime = 0;
  private entry = 0;
  private openT = 0;
  /**
   * The turn the hand gave each turntable: a rigid angle over its own
   * rotation, and its speed, in radians per second.
   */
  private readonly rotors: Record<Rotor, { angle: number; speed: number }> = {
    disk: { angle: 0, speed: 0 },
    orbits: { angle: 0, speed: 0 },
  };
  /** The turntable the hand last moved: it drags the other. */
  private driver: Rotor = 'disk';
  private handTrail: { t: number; a: number }[] = [];
  /** The held turntable's angle at the last frame, for its speed. */
  private heldAngle = 0;
  /** The disk's own rotation, 0 while held, easing back once let go. */
  private idle = 1;
  /** How the disk lay on screen at the last frame: to read the hand's angle. */
  private disk: {
    cx: number;
    cy: number;
    R: number;
    cr: number;
    sr: number;
    squash: number;
  } | null = null;
  private settling = false;
  private needsDraw = true;
  private visible = true;
  private started = false;

  private hole: { cx: number; cy: number; R: number } | null = null;
  private pointer: { x: number; y: number } | null = null;
  private grip: {
    x: number;
    y: number;
    d: number;
    angle: number | null;
    rotor: Rotor;
  } | null = null;

  private cancelFrame: (() => void) | null = null;
  private last = 0;
  private trvTime = Number.NaN;
  private trv: Traveling = traveling(0, false);

  private readonly scratch: Projected = { x: 0, y: 0, z: 0 };

  constructor(
    private readonly host: EngineHost,
    private readonly ctx: CanvasRenderingContext2D,
    private readonly skyCtx: CanvasRenderingContext2D | null,
    private readonly options: EngineOptions,
    viewportArea: number,
  ) {
    // The same composition everywhere, fewer points on a small screen.
    const factor = clamp(viewportArea / (1280 * 800), 0.42, 1);
    this.grains = buildScene(
      Math.round(options.density * factor * RESERVE),
      options.rnd,
    );
    this.sky = new Sky(options.rnd);
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
    if (!this.started) {
      this.entry = inputs.reduced ? 1 : 0;
      this.openT = inputs.preview >= 0 ? 1 : 0;
      this.started = true;
    }
    this.request();
  }

  public setNodes(
    buttons: readonly HTMLElement[],
    labels: readonly HTMLElement[],
  ): void {
    if (buttons !== this.buttons) {
      this.buttons = buttons;
      this.buttonsWritten = buttons.map(written);
    }
    if (labels !== this.labels) {
      this.labels = labels;
      this.labelsWritten = labels.map(written);
    }
    this.request();
  }

  /**
   * The home rule's lines, in rank order: each rises with its planet, on
   * the same clock. Kept when the same elements come back in a new list,
   * so what was written is not written again.
   */
  public setLines(lines: readonly HTMLElement[]): void {
    const same =
      lines.length === this.lines.length &&
      lines.every((line, i) => line === this.lines[i]);
    if (same) {
      return;
    }
    this.lines = lines;
    this.linesWritten = lines.map(written);
    this.request();
  }

  /**
   * Reads the labels' sizes. Called when they may have changed (a render,
   * the fonts arriving), never from the loop: a read after a style write
   * forces a layout per element.
   */
  public measureLabels(): void {
    this.labelSizes = this.labels.map((label) => ({
      w: label.offsetWidth,
      h: label.offsetHeight,
    }));
  }

  public setLayout(layout: Layout): void {
    this.layout = layout;
    this.measure = measureHome(
      layout.viewport,
      layout.headHeight,
      layout.ruleHeight,
    );
    if (!this.measured) {
      this.measured = true;
      Object.assign(this.home, {
        y: this.measure.y,
        s: this.measure.s,
        i: this.measure.i,
        ev: this.measure.ev,
      });
    }
    this.zonesFrom(layout);
    this.request();
  }

  /** Canvas size in device pixels; the zones follow the new ratio. */
  public resize(width: number, height: number, dpr: number): void {
    this.w = width;
    this.h = height;
    this.dpr = dpr;
    if (this.layout) {
      this.zonesFrom(this.layout);
    }
    this.needsDraw = true;
    this.draw();
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) {
      this.loop();
    } else {
      this.stop();
    }
  }

  /** The cursor, in client coordinates, or `null` once it left. */
  public setPointer(clientX: number | null, clientY = 0): void {
    const canvas = this.layout?.canvas;
    if (clientX === null || !canvas || this.inputs.reduced) {
      this.pointer = null;
    } else {
      const dpr = this.dpr;
      const cssW = this.w / dpr;
      const cssH = this.h / dpr;
      const x = clientX - canvas.left;
      const y = clientY - canvas.top;
      const inside = x > -80 && x < cssW + 80 && y > -80 && y < cssH + 80;
      this.pointer = inside ? { x: x * dpr, y: y * dpr } : null;
    }
    this.request();
  }

  /**
   * Turning the object by hand, home only. Nothing announces it: the
   * reader grabs the void around the disk and pushes: near the hole, the
   * disk; further out, the orbits. Grabbing a spinning turntable stops it,
   * as a hand stops a turntable.
   */
  public grab(clientX: number, clientY: number): boolean {
    if (this.inputs.view !== 'home' || this.inputs.reduced) {
      return false;
    }
    const under = this.pointUnder(clientX, clientY);
    const rotor: Rotor =
      under && under.radius >= ORBITS_FROM ? 'orbits' : 'disk';
    this.grip = {
      x: clientX,
      y: clientY,
      d: 0,
      angle: this.angleFrom(under),
      rotor,
    };
    this.driver = rotor;
    const held = this.rotors[rotor];
    held.speed = 0;
    this.heldAngle = held.angle;
    this.handTrail = [{ t: this.host.now(), a: held.angle }];
    this.request();
    return true;
  }

  /** The held turntable follows the hand, angle for angle. */
  public turn(clientX: number, clientY: number): void {
    const grip = this.grip;
    if (!grip) {
      return;
    }
    grip.d += Math.abs(clientX - grip.x) + Math.abs(clientY - grip.y);
    grip.x = clientX;
    grip.y = clientY;
    const angle = this.angleFrom(this.pointUnder(clientX, clientY));
    const held = this.rotors[grip.rotor];
    if (angle !== null && grip.angle !== null) {
      held.angle += nearestTurn(angle, grip.angle) - grip.angle;
    }
    grip.angle = angle;
    const now = this.host.now();
    this.handTrail.push({ t: now, a: held.angle });
    while (
      this.handTrail.length > 2 &&
      now - (this.handTrail[0]?.t ?? now) > HAND_WINDOW_MS
    ) {
      this.handTrail.shift();
    }
    this.request();
  }

  /**
   * Lets go: the disk keeps the hand's speed over its last moments, or
   * none if the hand had stopped. Answers whether the gesture was a drag
   * (over 6 px), not a click.
   */
  public release(): boolean {
    const grip = this.grip;
    this.grip = null;
    if (!grip) {
      return false;
    }
    const now = this.host.now();
    const last = this.handTrail.at(-1);
    const first = this.handTrail[0];
    this.rotors[grip.rotor].speed =
      last && first && now - last.t < HAND_STILL_MS && last.t - first.t > 8
        ? clamp(
            ((last.a - first.a) / (last.t - first.t)) * 1000,
            -HAND_MAX_SPEED,
            HAND_MAX_SPEED,
          )
        : 0;
    this.handTrail = [];
    this.request();
    return grip.d > 6;
  }

  /**
   * The point under the pointer in the disk's own plane, in object radii:
   * the roll undone, the opening stretched back to a circle.
   */
  private pointUnder(
    clientX: number,
    clientY: number,
  ): { angle: number; radius: number } | null {
    const disk = this.disk;
    const canvas = this.layout?.canvas;
    if (!disk || !canvas || disk.R <= 0) {
      return null;
    }
    const px = (clientX - canvas.left) * this.dpr - disk.cx;
    const py = (clientY - canvas.top) * this.dpr - disk.cy;
    const x = (px * disk.cr + py * disk.sr) / disk.R;
    const y = (-px * disk.sr + py * disk.cr) / disk.R / disk.squash;
    return { angle: Math.atan2(y, x), radius: Math.hypot(x, y) };
  }

  /** The angle to follow, or `null` too near the centre to mean anything. */
  private angleFrom(
    point: { angle: number; radius: number } | null,
  ): number | null {
    return point && point.radius >= HAND_MIN_RADIUS ? point.angle : null;
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

  private loop(): void {
    this.stop();
    if (this.host.hidden() || !this.visible) {
      return;
    }
    this.last = this.host.now();
    this.cancelFrame = this.host.frame(this.tick);
  }

  private traveling(): Traveling {
    if (this.trvTime !== this.time) {
      this.trvTime = this.time;
      this.trv = traveling(this.time, this.inputs.reduced);
    }
    return this.trv;
  }

  private readonly tick = (now: number): void => {
    this.cancelFrame = null;
    const inputs = this.inputs;
    const reduced = inputs.reduced;
    // A frame's timestamp can precede the `now` read when the loop started:
    // never a step back in time.
    const dt = clamp(now - this.last, 0, 60) / 1000;
    this.last = now;
    const open = inputs.preview >= 0;
    const openTarget = open ? 1 : 0;
    const openBefore = this.openT;
    this.openT +=
      (openTarget - this.openT) * (reduced ? 1 : Math.min(1, dt * 3.2));
    if (Math.abs(openTarget - this.openT) < 0.002) {
      this.openT = openTarget;
    }
    const entryBefore = this.entry;
    // The entry waits for nothing but its clock: the reader SEES the dust
    // come from afar and settle, rather than finding a finished object.
    if (this.entry < 1) {
      this.entry = Math.min(1, this.entry + dt / (reduced ? 0.001 : 6.2));
    }
    let target = this.target();
    if (!isFiniteFrame(target)) {
      target = this.home;
    }
    if (Number.isFinite(this.azim)) {
      target = { ...target, az: onCurrentTurn(target.az, this.azim) };
    }
    const view = inputs.view;
    const marksTarget =
      (view === 'home' && inputs.revealed) ||
      view === 'index' ||
      view === 'sheet'
        ? 1
        : 0;
    const part = clamp(inputs.part, 0, CONSTELLATIONS.length - 1);
    const aboutTarget = view === 'about' ? 1 : 0;
    if (this.lit.length === 0) {
      CONSTELLATIONS.forEach((_, k) => this.lit.push(k === part ? 1 : 0));
    }
    // One NaN in the camera wipes the whole drawing and nothing repairs it:
    // every term is kept finite, whatever target came in.
    this.roll = finiteOr(this.roll, target.i);
    this.scale = finiteOr(this.scale, target.s);
    this.camX = finiteOr(this.camX, target.x);
    this.camY = finiteOr(this.camY, target.y);
    this.elev = finiteOr(this.elev, target.ev);
    this.azim = finiteOr(this.azim, target.az);
    this.marks = finiteOr(this.marks, marksTarget);
    this.about = finiteOr(this.about, aboutTarget);
    this.time = finiteOr(this.time, 0);
    // What is left of the camera move: while it lasts, the object's own
    // rotation nearly fades. The object is flown over, it does not pivot.
    const left =
      Math.abs(target.i - this.roll) +
      Math.abs(target.s - this.scale) +
      2 * Math.abs(target.x - this.camX) +
      2 * Math.abs(target.y - this.camY) +
      2 * Math.abs(target.ev - this.elev) +
      Math.abs(target.az - this.azim);
    // The brake gives back progressively too: a hard switch would jump.
    const resume = reduced ? 1 : clamp((this.time - 8.8) / 1.3, 0, 1);
    const flyover =
      Math.min(1, left / 0.22) * resume * resume * (3 - 2 * resume);
    const camBefore = this.camSum();
    // Half-life of 0.55 s: the motion takes its time and stops without a jolt.
    const kc = reduced ? 1 : halfLifeStep(dt, 0.55);
    // The measured home framing joins the current one at the camera's pace:
    // no jump when the head or the rule take their place.
    const measure = this.measure;
    if (measure) {
      const km = reduced ? 1 : halfLifeStep(dt, 0.75);
      const home = this.home;
      home.y += (measure.y - home.y) * km;
      home.s += (measure.s - home.s) * km;
      home.i += (measure.i - home.i) * km;
      home.ev += (measure.ev - home.ev) * km;
    }
    this.roll += (target.i - this.roll) * kc;
    this.scale += (target.s - this.scale) * kc;
    this.camX += (target.x - this.camX) * kc;
    this.camY += (target.y - this.camY) * kc;
    this.elev += (target.ev - this.elev) * kc;
    this.marks += (marksTarget - this.marks) * kc;
    this.azim += (target.az - this.azim) * kc;
    this.about += (aboutTarget - this.about) * kc;
    for (let k = 0; k < this.lit.length; k++) {
      this.lit[k] =
        (this.lit[k] ?? 0) + ((k === part ? 1 : 0) - (this.lit[k] ?? 0)) * kc;
    }
    const camMoves = Math.abs(camBefore - this.camSum()) > 0.0002;
    const animated = !inputs.paused && !reduced && this.visible;
    if (animated) {
      this.time += dt;
      // The bodies' own clock: each rises in turn.
      if (marksTarget) {
        this.marksTime += dt;
      }
      // The slowdown applies to the INCREMENT, never to the total, or the
      // angle jumps several turns at once. While a preview is read, the
      // revolution nearly stops: the camera arrives and holds its frame.
      const brake = open ? 0.12 : 1;
      this.phase +=
        dt * (1 - 0.92 * flyover) * brake * this.idle * this.traveling().spin;
    }
    // Held, the disk's own rotation stops at once, or it slips under the
    // finger; let go, it comes back gently.
    const idleBefore = this.idle;
    this.idle +=
      ((this.grip ? 0 : 1) - this.idle) *
      (reduced ? 1 : halfLifeStep(dt, this.grip ? 0.05 : 0.6));
    if (Math.abs(this.idle - 1) < 0.001) {
      this.idle = 1;
    }
    const turning = this.turnRotors(dt, reduced);
    const moves =
      animated ||
      camMoves ||
      openBefore !== this.openT ||
      entryBefore !== this.entry ||
      idleBefore !== this.idle ||
      turning ||
      this.needsDraw ||
      this.settling;
    if (moves && this.visible) {
      this.draw();
      this.needsDraw = false;
    }
    const crossing = !reduced && this.time < TRAVELING_END;
    // The loop stops by itself once nothing moves.
    if (
      this.visible &&
      (animated ||
        camMoves ||
        crossing ||
        this.openT !== openTarget ||
        this.entry < 1 ||
        this.settling ||
        this.grip !== null ||
        turning ||
        this.idle !== 1)
    ) {
      this.cancelFrame = this.host.frame(this.tick);
    }
  };

  /**
   * The two turntables for one frame. The held one's speed is read from its
   * angle; a free driver keeps its throw, taken by friction; the other is
   * dragged towards a share of the driver's speed, with a lag. Answers
   * whether either still turns.
   */
  private turnRotors(dt: number, reduced: boolean): boolean {
    const held = this.grip ? this.rotors[this.grip.rotor] : null;
    if (held && dt > 0) {
      const measured = (held.angle - this.heldAngle) / dt;
      held.speed += (measured - held.speed) * (1 - Math.pow(0.5, dt / 0.05));
      this.heldAngle = held.angle;
    }
    const driver = this.rotors[this.driver];
    const driven = this.rotors[this.driver === 'disk' ? 'orbits' : 'disk'];
    const drag = reduced ? 1 : 1 - Math.exp(-dt / DRAG_LAG);
    driven.speed += (driver.speed * DRAG_RATIO - driven.speed) * drag;
    let turning = held !== null;
    for (const rotor of [driver, driven]) {
      if (rotor === held) {
        continue;
      }
      rotor.angle += rotor.speed * dt;
      if (rotor === driver) {
        rotor.speed *= Math.pow(0.5, dt / HAND_FRICTION);
      }
      if (Math.abs(rotor.speed) < 0.01) {
        rotor.speed = 0;
      }
      turning ||= rotor.speed !== 0;
    }
    return turning;
  }

  private camSum(): number {
    return (
      this.roll +
      this.scale +
      this.camX +
      this.camY +
      this.elev +
      this.marks +
      this.azim +
      this.about
    );
  }

  /** The framing for the current view. */
  private target(): Frame {
    const { view, preview, focus, chapter } = this.inputs;
    const dims = this.dims();
    // The framings aim at planets: they turn with the orbits.
    const azim = finiteOr(this.azim, 0) + this.rotors.orbits.angle;
    switch (view) {
      case 'about':
        return ABOUT_FRAME;
      case 'index':
      case 'not-found':
        return INDEX_FRAME;
      case 'sheet':
        return sheetFrame({
          chapter,
          home: this.home,
          viewportWidth: this.layout?.viewport.width ?? 1200,
          dims,
          orbit: this.orbits[Math.max(0, focus)] ?? null,
          panelLeft: this.layout?.sheetLeft ?? null,
          phase: this.phase,
          azim,
        });
      case 'home':
        if (preview < 0) {
          return this.home;
        }
        return previewFrame({
          home: this.home,
          dims,
          orbit: this.orbits[preview] ?? null,
          cardLeft: this.layout?.previewLeft ?? null,
          phase: this.phase,
          azim,
          offset: (az) => this.offsetOrbit(preview, az),
        });
    }
  }

  private dims(): Dims | null {
    return this.w && this.h ? { w: this.w, h: this.h, dpr: this.dpr } : null;
  }

  /**
   * Where planet `i` is, in object radii after roll, on the home framing:
   * what the aim point takes off to know where to put the centre.
   */
  private offsetOrbit(i: number, az: number): { nx: number; ny: number } {
    const orbit = this.orbits[i];
    if (!orbit) {
      return { nx: 0, ny: 0 };
    }
    const elev = this.home.ev;
    const p = positionOrbit(orbit, this.phase, elev, az, { x: 0, y: 0, z: 0 });
    const py = p.y * (0.88 + 0.34 * elev);
    const cr = Math.cos(this.home.i);
    const sr = Math.sin(this.home.i);
    return { nx: p.x * cr - py * sr, ny: p.x * sr + py * cr };
  }

  private zonesFrom(layout: Layout): void {
    const dpr = this.dpr;
    const { left, top } = layout.canvas;
    this.zones = layout.panels
      .filter(
        (panel) =>
          panel.right > panel.left &&
          panel.bottom > panel.top &&
          panel.opacity >= 0.004,
      )
      .map((panel) => ({
        l: (panel.left - left) * dpr,
        r: (panel.right - left) * dpr,
        t: (panel.top - top) * dpr,
        b: (panel.bottom - top) * dpr,
        o: panel.opacity,
      }));
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    if (!w || !h) {
      return;
    }
    const dpr = this.dpr;
    const inputs = this.inputs;
    const reduced = inputs.reduced;
    ctx.clearRect(0, 0, w, h);
    const ink = this.options.ink;
    const accent = this.options.accent;
    const t = this.openT;
    const e = reduced ? 1 : easeOut(this.entry);
    // The matter only shows with the crossing's DECELERATION: the trails die
    // as the disk reveals itself, the two motions hand over.
    const trv = this.traveling();
    const arrival = trv.matter;
    const cx = w * (finiteOr(this.camX, 0.44) + trv.dx);
    const cy = h * (finiteOr(this.camY, 0.5) + trv.dy);
    const elevC = finiteOr(this.elev, 0.18);
    // 0.022: the disk is a slice during the journey, it opens on arrival.
    const elev = Math.max(0.018, elevC + (0.022 - elevC) * -trv.dEv);
    const flatten = 0.88 + 0.34 * elev;
    // The object grows with the approach, from afar to its place.
    const R =
      referenceRadius(w, h, finiteOr(this.scale, 1)) *
      (1 - 0.06 * t) *
      trv.grow;
    const time = this.time;
    const phase = this.phase;
    const azimBase = finiteOr(this.azim, 0) + trv.dAz;
    const azim = azimBase + this.rotors.disk.angle;
    const orbitAzim = azimBase + this.rotors.orbits.angle;
    const pointer = this.pointer;
    const reach = 70 * dpr;
    // The roll straightens on arrival: under the plane, then back up.
    const roll = finiteOr(this.roll, -0.33) + trv.dRoll;
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    this.hole = { cx, cy, R };
    this.disk = { cx, cy, R, cr, sr, squash: opening(elev) * flatten };
    const hot = '#ffe6c2';
    // Doppler ramps, from approach (blue) to recession (amber): five steps,
    // the inner edge's glow apart from the cold matter. The tint must be
    // noticed without becoming the subject; the subject is the text beside.
    const coreRamp = ['#e7f2fb', '#e2eefa', hot, '#fbd9ad', '#f0bb87'];
    const matterRamp = ['#d2e6f7', '#d8e3f0', '#dfe4ee', '#ebdfd0', '#e2cbad'];
    // The text comes before the matter: points behind a panel are dimmed to
    // 13%, with a 22 px fade so that no hard hole shows.
    const zones = this.zones;
    const fade = 22 * dpr;
    const veil = (px: number, py: number): number => {
      let f = 1;
      for (const q of zones) {
        const d = Math.min(
          px - q.l + fade,
          q.r + fade - px,
          py - q.t + fade,
          q.b + fade - py,
        );
        if (d > 0) {
          const base = 0.13 + 0.87 * Math.max(0, 1 - d / fade);
          f = Math.min(f, 1 - q.o * (1 - base));
        }
      }
      return f;
    };
    let settling = false;
    let alphaNow = -1;
    let colorNow = '';

    // Dynamic density: closer, the same matter spreads over more pixels and
    // the grain thins out, so more is drawn from the reserve in proportion:
    // the APPARENT density stays constant.
    const s0 = this.home.s || 0.42;
    const zoom = clamp(finiteOr(this.scale, s0) / s0, 1, 3);
    const shareZoom = Math.min(1, this.partBase * (0.62 + 0.38 * zoom * zoom));
    const share = Math.min(shareZoom, 0.03 + 1.7 * trv.grow);
    const pos = this.scratch;
    const edgeMargin = 0.06 * Math.min(w, h);
    for (let i = 0; i < this.grains.length; i++) {
      const lit = litAmount(i, share);
      if (lit <= 0) {
        continue;
      }
      const p = this.grains[i];
      if (!p) {
        continue;
      }
      placeGrain(p, phase, e, elev, azim, pos);
      // The sphere and its ring stay perfectly round; the flattening only
      // takes the outer parts of the disk.
      const py0 =
        p.fam === 0 || p.fam === 5
          ? pos.y
          : pos.y *
            (p.fam === 1 || p.fam === 2
              ? 1 - (1 - flatten) * Math.min(1, p.u * 2.4)
              : flatten);
      const rx = pos.x * cr - py0 * sr;
      const ry = pos.x * sr + py0 * cr;
      let sx = cx + rx * R;
      let sy = cy + ry * R;
      // Held, the matter goes with the hand: no push aside.
      if (pointer && !this.grip) {
        const ddx = sx - pointer.x;
        const ddy = sy - pointer.y;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < reach * reach && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const force = (1 - d / reach) * 4 * dpr;
          p.dx += (ddx / d) * force;
          p.dy += (ddy / d) * force;
        }
      }
      p.dx *= 0.88;
      p.dy *= 0.88;
      if (Math.abs(p.dx) > 0.05 || Math.abs(p.dy) > 0.05) {
        settling = true;
      }
      sx += p.dx;
      sy += p.dy;
      const twinkle = 0.93 + 0.07 * Math.sin(time * 0.8 + p.ph);
      // Doppler: the left side comes towards us, lighter AND bluer; the
      // right recedes, darker AND redder. Brightness gives the speed, the
      // tint gives the direction.
      const dopN = clamp(rx * 0.8, -1, 1);
      const dop = 1 - 0.33 * dopN;
      let alpha =
        p.alpha0 *
        p.grain *
        dop *
        twinkle *
        e *
        arrival *
        trv.light *
        lit *
        1.75;
      if (p.fam !== 0) {
        alpha *= 1 - 0.32 * t;
      }
      if (p.fam === 1 || p.fam === 2) {
        alpha *= 0.3 + 0.7 * Math.min(1, Math.pow(Math.abs(pos.y), 0.95));
      }
      if (p.fam === 3 && p.behind) {
        const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
        alpha *= dist < 1.02 ? 0 : 0.94;
      }
      let core: boolean;
      if (p.fam === 5) {
        // The rim is the brightest thing in the image, barely modulated.
        // Thinned, it loses surface: it gets back in light what it lost in
        // thickness, or the shadow's edge comes apart.
        alpha *= 1.52;
        core = true;
      } else if (p.fam === 0) {
        alpha *= 0.03 + 0.95 * Math.pow(p.rho, 5);
        core = p.rho > 0.9;
      } else {
        // Light hierarchy: a glowing core at the inner edge, a frank fall
        // outwards, and the upper halo brighter than the lower. The outer
        // edge keeps a floor (0.52), or the disk ends in the dark and the
        // planets flying over it lose a legible ground.
        alpha *= 0.52 + 0.9 * Math.exp(-p.u * 2.8);
        alpha *= ry < 0 ? 1.34 : 0.78;
        if (p.fam === 3) {
          alpha *= 1.95;
        }
        core = p.u < 0.11 && p.fam !== 4;
        // The hole's shadow, lightly veiled.
        const d2c = Math.sqrt(rx * rx + ry * ry);
        if (d2c < 0.9 && (p.fam === 4 || (p.fam === 3 && p.behind))) {
          alpha *= 0.08 + 0.3 * (d2c / 0.9);
        }
        // Nothing shines IN the shadow: the lensed arcs go out there too,
        // which gives the black disk its sharp edge and detaches the rim.
        if ((p.fam === 1 || p.fam === 2) && d2c < 0.99) {
          alpha *= 0.04 + 0.5 * Math.pow(d2c / 0.99, 6);
        }
      }
      if (zones.length) {
        alpha *= veil(sx, sy);
      }
      // The bottom edge does not fade: a framing cut, on purpose.
      const edge = Math.min(sx, w - sx, sy) / edgeMargin;
      if (edge < 1) {
        alpha *= Math.max(0, edge);
      }
      if (alpha < 0.012) {
        continue;
      }
      const size =
        (p.fam === 5 ? 2.15 : core ? 2.8 : p.fam === 4 ? 2.4 : 2.5) * dpr;
      if (alpha !== alphaNow) {
        alphaNow = alpha;
        ctx.globalAlpha = Math.min(core ? 0.96 : 0.8, alpha);
      }
      // The tint follows the Doppler shift in five steps: five colours
      // reused, not a gradient per point, or changing fillStyle would cost
      // more than drawing. The sphere and the veil stay neutral.
      let color = core ? hot : p.accent ? accent : ink;
      if (p.fam === 1 || p.fam === 2 || p.fam === 3 || p.fam === 5) {
        const j =
          dopN < -0.52
            ? 0
            : dopN < -0.16
              ? 1
              : dopN > 0.52
                ? 4
                : dopN > 0.16
                  ? 3
                  : 2;
        color = (core ? coreRamp[j] : matterRamp[j]) ?? color;
      }
      if (color !== colorNow) {
        colorNow = color;
        ctx.fillStyle = color;
      }
      // fillRect, never arc: the difference between 60 and 25 fps.
      ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
    }

    this.drawPlanets({
      ctx,
      w,
      h,
      dpr,
      cx,
      cy,
      R,
      cr,
      sr,
      elev,
      azim: orbitAzim,
      flatten,
      phase,
      time,
      e,
      t,
      accent,
      zones,
      veil,
    });

    const about = finiteOr(this.about, 0);
    if (about > 0.02 && this.options.aboutBodies === 'comets') {
      drawComets(ctx, w, h, {
        phase,
        elev,
        azim,
        flatten,
        cr,
        sr,
        cx,
        cy,
        R,
        dpr,
        accent,
        entry: e,
        shown: about,
        part: clamp(inputs.part, 0, 3),
        veil,
      });
    }
    ctx.globalAlpha = 1;
    this.settling = settling;
    this.drawSky(ink, accent, e);
  }

  private drawPlanets(f: {
    readonly ctx: CanvasRenderingContext2D;
    readonly w: number;
    readonly h: number;
    readonly dpr: number;
    readonly cx: number;
    readonly cy: number;
    readonly R: number;
    readonly cr: number;
    readonly sr: number;
    readonly elev: number;
    readonly azim: number;
    readonly flatten: number;
    readonly phase: number;
    readonly time: number;
    readonly e: number;
    readonly t: number;
    readonly accent: string;
    readonly zones: readonly Zone[];
    readonly veil: (x: number, y: number) => number;
  }): void {
    const {
      ctx,
      w,
      h,
      dpr,
      cx,
      cy,
      R,
      cr,
      sr,
      elev,
      azim,
      flatten,
      phase,
      time,
      e,
      accent,
      zones,
      veil,
    } = f;
    const inputs = this.inputs;
    const orbits = this.orbits;
    const hovered = inputs.hovered;
    const active = inputs.preview;
    const open = active >= 0;
    // Home shows the selection, the index shows the whole system: one
    // scene, two scales of reading.
    const mapMode = inputs.view === 'index' || inputs.view === 'not-found';
    const onSheet = inputs.view === 'sheet';
    const read = onSheet ? inputs.focus : -1;
    const selected = inputs.view === 'index' ? inputs.selected : -1;
    const featured = inputs.featured;
    const shown =
      mapMode || onSheet ? orbits.length : Math.min(featured, orbits.length);
    const marks = finiteOr(this.marks, 1);
    // Staggered entry: 0.42 s between two bodies, 0.7 s to raise each. The
    // rule's line and its planet are the same event, one clock rules both.
    const clock =
      inputs.reduced || inputs.view !== 'home' ? 99 : this.marksTime;
    const rising = (i: number): number =>
      clamp((clock - 0.15 - i * 0.42) / 0.7, 0, 1);
    for (let i = 0; i < this.lines.length; i++) {
      this.writeLine(i, rising(i));
    }

    // Positions first, drawing next: in between, a repulsion pass
    // guarantees a minimal on-screen gap.
    fitOrbits(orbits, w, h, this.home, this.measure?.freeHalf ?? null, dpr);
    const planets: PlanetOnScreen[] = orbits.map((orbit) => {
      const pos = positionOrbit(orbit, phase, elev, azim, this.scratch);
      const npy = pos.y * flatten;
      const nx = pos.x * cr - npy * sr;
      const ny = pos.x * sr + npy * cr;
      // A planet passing behind the shadow is hidden by it.
      const rn = Math.sqrt(nx * nx + ny * ny);
      const fR = clamp((1.16 - rn) / 0.14, 0, 1);
      const zn = pos.z / Math.max(0.001, orbit.rb);
      const fZ = clamp((0.035 - zn) / 0.07, 0, 1);
      const fo = fR * fZ;
      return { sx: cx + nx * R, sy: cy + ny * R, shadeF: fo, shade: fo > 0.5 };
    });
    // The trace of each orbit, a hairline: it says "planet" rather than
    // "grain of the disk". Sampled on 84 points and drawn SEGMENT BY
    // SEGMENT, since joining two non-consecutive points would draw a chord
    // across the ellipse; seven depth steps so the orbit darkens behind and
    // comes back without a break. Only the shadow really cuts the line.
    if (marks > 0.02) {
      const N = 84;
      const LEVELS = 7;
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, 0.85 * dpr);
      const sample = { ang: 0, rb: 0, inc: 0, v: 0 };
      const out: Projected = { x: 0, y: 0, z: 0 };
      for (let i = 0; i < shown; i++) {
        const orbit = orbits[i];
        if (!orbit) {
          continue;
        }
        const lively =
          hovered === i ||
          selected === i ||
          i === read ||
          (open && active === i);
        const base =
          (lively ? 0.34 : 0.13) *
          (i >= featured ? 0.42 : 1) *
          e *
          marks *
          rising(i);
        const trace: { x: number; y: number; depth: number; shade: boolean }[] =
          [];
        for (let k = 0; k <= N; k++) {
          sample.ang = orbit.ang + k * (TAU / N);
          sample.rb = orbit.rb;
          sample.inc = orbit.inc;
          const q = positionOrbit(
            sample,
            0,
            elev,
            azim + phase * orbit.v * 0.42,
            out,
          );
          const qy = q.y * flatten;
          const qx2 = q.x * cr - qy * sr;
          const qy2 = q.x * sr + qy * cr;
          trace.push({
            x: cx + qx2 * R,
            y: cy + qy2 * R,
            depth: q.z / orbit.rb,
            shade: q.z < 0 && Math.sqrt(qx2 * qx2 + qy2 * qy2) < 1.02,
          });
        }
        for (let level = 0; level < LEVELS; level++) {
          ctx.globalAlpha = base * (0.34 + (0.66 * level) / (LEVELS - 1));
          ctx.beginPath();
          let traced = false;
          for (let k = 1; k < trace.length; k++) {
            const a = trace[k - 1];
            const b = trace[k];
            if (!a || !b || a.shade || b.shade) {
              continue;
            }
            // depth 0 furthest, 1 nearest
            const depth = 0.5 + 0.5 * ((a.depth + b.depth) / 2);
            if (Math.min(LEVELS - 1, Math.floor(depth * LEVELS)) !== level) {
              continue;
            }
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            traced = true;
          }
          if (traced) {
            ctx.stroke();
          }
        }
      }
    }
    repel(planets, shown, Math.min(PLANET_GAP * dpr, R * 1.1));
    // The text panels are laid out in advance among the taken places: a
    // planet's label cannot write itself over a line of text.
    const places = zones.map((z) => ({
      x: z.l / dpr,
      y: (z.t + z.b) / 2 / dpr,
      w: (z.r - z.l) / dpr,
      h: (z.b - z.t) / dpr,
    }));
    const stageW = w / dpr;
    const stageH = h / dpr;
    for (let i = 0; i < shown; i++) {
      const planet = planets[i];
      if (!planet) {
        continue;
      }
      if (marks <= 0.02) {
        this.writeButton(i, null, true);
        this.writeLabel(i, null, '0');
        continue;
      }
      const { sx, sy } = planet;
      // Out of frame counts as covered: no invisible target stays
      // clickable or in the tab order.
      const margin = 26 * dpr;
      const outside =
        sx < margin || sx > w - margin || sy < margin || sy > h - margin;
      const covered =
        outside ||
        zones.some(
          (z) =>
            sx > z.l - 10 * dpr &&
            sx < z.r + 10 * dpr &&
            sy > z.t - 10 * dpr &&
            sy < z.b + 10 * dpr,
        );
      const vn = rising(i);
      if (vn <= 0.002) {
        this.writeButton(i, null, true);
        this.writeLabel(i, null, '0');
        continue;
      }
      this.writeButton(
        i,
        `translate(${String(sx / dpr)}px,${String(sy / dpr)}px)`,
        covered,
      );
      if (covered) {
        this.writeLabel(i, null, '0');
        if (outside) {
          continue;
        }
      }
      // At the map's scale a body does not vanish because the table passes
      // over it: it stays drawn, only its number and target go.
      const coverFade = mapMode ? 1 : veil(sx, sy);
      // A cold body: smaller, darker, nameless. No extra colour, no icon.
      const cold = i >= featured;
      const lively =
        hovered === i || selected === i || i === read || (open && active === i);
      // A crisp halo and a thin ring that pulse slowly: the only things
      // brighter than the disk's core.
      const pulse = 1 + 0.18 * Math.sin(time * 0.9 + i * 2.1);
      const rBase =
        (cold ? (lively ? 4.2 : 3.2) : lively ? 6.6 : 5.2) * dpr * pulse * e;
      // The body aimed at never turns into a ghost behind the shadow.
      const aimed = (open && active === i) || i === read || selected === i;
      const att =
        (open && active !== i ? 0.2 : 1) *
        (onSheet && i !== read ? 0.26 : 1) *
        (aimed ? 1 : 1 - 0.66 * planet.shadeF) *
        (cold && !aimed ? 0.4 : 1) *
        coverFade *
        vn;
      const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, rBase * 6);
      halo.addColorStop(0, accent);
      halo.addColorStop(1, 'transparent');
      ctx.globalAlpha = (lively ? 0.5 : 0.32) * e * marks * att;
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(sx, sy, rBase * 6, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = e * marks * att;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(1.2, rBase * 0.42), 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.96 * e * marks * att;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(1.5, rBase), 0, TAU);
      ctx.fill();
      ctx.globalAlpha = (lively ? 0.95 : 0.7) * e * marks * att;
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, 1.3 * dpr);
      ctx.beginPath();
      ctx.arc(sx, sy, rBase * (lively ? 3.1 : 2.5), 0, TAU);
      ctx.stroke();
      // The selection (or the body read): a second ring, wider and held.
      // Hovering is a flash, selecting is a lock; the two never merge.
      if (selected === i || (onSheet && i === read)) {
        ctx.globalAlpha = 0.85 * e * marks;
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(1, 1.1 * dpr);
        ctx.beginPath();
        ctx.arc(sx, sy, rBase * 4.8, 0, TAU);
        ctx.stroke();
      }
      if (!this.labels[i]) {
        continue;
      }
      const size = this.labelSizes[i];
      const px = sx / dpr;
      const py = sy / dpr;
      // Index: the label is a two-character number, the one of the REF
      // column. It sits right against its body, no elbow, no search: it is
      // the planet/project link and must never vanish.
      if (inputs.view === 'index') {
        const lw = size?.w || 20;
        const lh = size?.h || 16;
        const gap = (rBase * 2.2) / dpr + 5;
        const nx2 = clamp(px + gap, 2, stageW - lw - 2);
        const ny2 = clamp(py - lh - gap * 0.5, 2, stageH - lh - 2);
        // A number falling on the table goes; the body stays.
        const onText = zones.some(
          (z) =>
            nx2 + lw > z.l / dpr &&
            nx2 < z.r / dpr &&
            ny2 + lh > z.t / dpr &&
            ny2 < z.b / dpr,
        );
        this.writeLabel(
          i,
          `translate(${String(nx2)}px,${String(ny2)}px)`,
          covered || onText
            ? '0'
            : hovered === i || (open && active === i)
              ? '1'
              : '0.8',
        );
        continue;
      }
      const lw = size?.w || 120;
      const lh = size?.h || 20;
      // The label leaves the structure: an elbow proportional to the
      // object's radius, on the side towards the outside of the frame.
      let elbow = Math.max((rBase * 3.4) / dpr + 20, (R / dpr) * 0.5);
      if (px + elbow + 14 + lw > stageW && px - elbow - 14 - lw < 0) {
        elbow = (rBase * 3.4) / dpr + 12;
      }
      const rise = (py <= stageH / 2 ? -1 : 1) * 24;
      const roomRight = px + elbow + 14 + lw <= stageW;
      const roomLeft = px - elbow - 14 - lw >= 0;
      // ALWAYS towards the outside of the frame, never over the disk. If the
      // place is taken, the other flank is tried before giving up: a
      // permanent label is not sacrificed to its neighbour.
      const outward = px >= stageW / 2 ? 1 : -1;
      let dir = (outward > 0 && roomRight) || !roomLeft ? 1 : -1;
      // Shown at rest, dimmed; hovering brings it to full. None behind the
      // shadow, and while a preview is open only the aimed body keeps its
      // name (the card already carries it).
      const livelyL = hovered === i || (open && active === i);
      const named = onSheet
        ? i === read
        : cold || vn < 0.75
          ? false
          : open
            ? active === i
            : !planet.shade;
      const placeX = (d: number): number => {
        let x2 = px + d * (elbow + 14);
        if (d < 0) {
          x2 -= lw;
        }
        return clamp(x2, 2, stageW - lw - 2);
      };
      const boundY = (y2: number): number =>
        clamp(y2, lh / 2 + 2, stageH - lh / 2 - 2);
      const overlaps = (x2: number, y2: number): boolean =>
        places.some(
          (q) =>
            Math.abs(q.x - x2) < (q.w + lw) / 2 - 4 &&
            Math.abs(q.y - y2) < (q.h + lh) / 2 + 4,
        );
      let lx = placeX(dir);
      let ly = boundY(py + rise);
      let free = true;
      if (named) {
        free = false;
        const step = lh + 8;
        const flanks = [dir, -dir].filter(
          (d) => d === dir || (d > 0 ? roomRight : roomLeft),
        );
        for (const d of flanks) {
          const x2 = placeX(d);
          for (let k = 0; k <= 4 && !free; k++) {
            for (const sign of k === 0 ? [1] : [-1, 1]) {
              const y2 = boundY(py + rise + sign * k * step);
              if (!overlaps(x2, y2)) {
                lx = x2;
                ly = y2;
                dir = d;
                free = true;
                break;
              }
            }
          }
          if (free) {
            break;
          }
        }
        if (free) {
          places.push({ x: lx, y: ly, w: lw, h: lh });
        }
      }
      const visible = named && free;
      this.writeLabel(
        i,
        `translate(${String(lx)}px,${String(ly - lh / 2)}px)`,
        visible ? (livelyL ? '1' : '0.62') : '0',
      );
      if (visible) {
        const l1 = rBase * 3.4;
        const endX = (dir > 0 ? lx - 6 : lx + lw + 6) * dpr;
        ctx.globalAlpha = (livelyL ? 0.85 : 0.34) * e * marks;
        ctx.beginPath();
        ctx.moveTo(sx + dir * l1, sy);
        ctx.lineTo(sx + dir * (l1 + 26 * dpr), ly * dpr);
        ctx.lineTo(endX, ly * dpr);
        ctx.stroke();
      }
    }
    // Bodies outside the current scale leave neither a target nor a label.
    for (
      let i = shown;
      i < Math.max(this.buttons.length, this.labels.length);
      i++
    ) {
      this.writeButton(i, null, true);
      this.writeLabel(i, null, '0');
    }
  }

  /**
   * A covered or out-of-frame button is switched off, made inert, taken out
   * of the tab order and hidden from assistive technologies: no invisible
   * target stays clickable. Only what changed is written.
   */
  private writeButton(
    i: number,
    transform: string | null,
    covered: boolean,
  ): void {
    const button = this.buttons[i];
    const last = this.buttonsWritten[i];
    if (!button || !last) {
      return;
    }
    if (transform !== null && transform !== last.transform) {
      last.transform = transform;
      button.style.transform = transform;
    }
    const events = covered ? 'none' : 'auto';
    if (events !== last.events) {
      last.events = events;
      button.style.pointerEvents = events;
    }
    const hidden = covered ? 'true' : 'false';
    if (hidden !== last.hidden) {
      last.hidden = hidden;
      button.setAttribute('aria-hidden', hidden);
    }
    const tab = covered ? -1 : 0;
    if (tab !== last.tab) {
      last.tab = tab;
      button.tabIndex = tab;
    }
  }

  private writeLabel(
    i: number,
    transform: string | null,
    opacity: string,
  ): void {
    const label = this.labels[i];
    const last = this.labelsWritten[i];
    if (!label || !last) {
      return;
    }
    if (transform !== null && transform !== last.transform) {
      last.transform = transform;
      label.style.transform = transform;
    }
    if (opacity !== last.opacity) {
      last.opacity = opacity;
      label.style.opacity = opacity;
    }
  }

  /** A rule's line rises 9 px as it appears, and takes no click half-seen. */
  private writeLine(i: number, rise: number): void {
    const line = this.lines[i];
    const last = this.linesWritten[i];
    if (!line || !last) {
      return;
    }
    const opacity = rise.toFixed(3);
    if (opacity !== last.opacity) {
      last.opacity = opacity;
      line.style.opacity = opacity;
    }
    const transform =
      rise < 1 ? `translateY(${((1 - rise) * 9).toFixed(1)}px)` : 'none';
    if (transform !== last.transform) {
      last.transform = transform;
      line.style.transform = transform;
    }
    const events = rise > 0.5 ? 'auto' : 'none';
    if (events !== last.events) {
      last.events = events;
      line.style.pointerEvents = events;
    }
  }

  private drawSky(ink: string, accent: string, entry: number): void {
    const ctx = this.skyCtx;
    if (!ctx) {
      return;
    }
    const w = this.w;
    const h = this.h;
    const trv = this.traveling();
    const camX = finiteOr(this.camX, 0.42);
    const camY = finiteOr(this.camY, 0.46);
    const pan = this.sky.draw(ctx, w, h, {
      time: this.time,
      reduced: this.inputs.reduced,
      pointer: this.pointer,
      dpr: this.dpr,
      trv,
      azim: finiteOr(this.azim, 0),
      elev: finiteOr(this.elev, 0.18),
      scale: finiteOr(this.scale, 1),
      camX,
      camY,
      hole: this.hole,
      ink,
      accent,
      entry,
    });
    if (this.options.aboutBodies === 'constellations') {
      drawConstellations(ctx, w, h, {
        dpr: this.dpr,
        accent,
        entry,
        panX: pan.panX,
        panY: pan.panY,
        time: this.time,
        shown: finiteOr(this.about, 0),
        lit: this.lit,
        hole: this.hole,
      });
    }
    ctx.globalAlpha = 1;
  }
}
