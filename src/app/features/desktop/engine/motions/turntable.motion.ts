import { clamp, nearestTurn } from '../../rules/scene/scene-math.rules';

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

/**
 * The orbits' turntable is no plate: each orbit takes its share of a turn by
 * Kepler, (r / radius)^1.5, the inner ones faster, the outer slower, as in
 * their own revolution. `r` is the radius the hand took them at, so the
 * planet under the finger follows it; dragged by the disk, a middle orbit.
 */
const ORBITS_REFERENCE = 5;

/** The two things a hand can turn: the disk, and the orbits around it. */
export type Rotor = 'disk' | 'orbits';

/** Where the finger is, in the disk's own plane, in object radii. */
export interface PlanePoint {
  readonly angle: number;
  readonly radius: number;
}

/** A turntable's rigid angle over its own rotation, and its speed (rad/s). */
export interface RotorState {
  readonly angle: number;
  readonly speed: number;
}

/**
 * The object turned by hand, as two turntables: the disk near the hole, the
 * orbits further out. The held one follows the hand angle for angle; let go,
 * it keeps the hand's speed over its last moments and slows by friction;
 * the other is dragged towards a share of its speed. Grabbing a spinning
 * turntable stops it, as a hand stops a turntable.
 *
 * It knows nothing of the screen: the engine hands it the finger's place in
 * the disk's plane, and reads back the angles it draws with.
 */
export class TurntableMotion {
  private readonly rotors: Record<Rotor, { angle: number; speed: number }> = {
    disk: { angle: 0, speed: 0 },
    orbits: { angle: 0, speed: 0 },
  };
  /** The turntable the hand last moved: it drags the other. */
  private driver: Rotor = 'disk';
  private trail: { t: number; a: number }[] = [];
  /** The held turntable's angle at the last frame, for its speed. */
  private heldAngle = 0;
  /** Each orbit's share of the orbits' turn, by Kepler. */
  private orbitTurns: number[] = [];
  /** The orbits' turn already shared out. */
  private shared = 0;
  /** The radius the orbits' turn is read at: see `ORBITS_REFERENCE`. */
  private reference = ORBITS_REFERENCE;
  private grip: {
    x: number;
    y: number;
    d: number;
    angle: number | null;
    rotor: Rotor;
  } | null = null;

  /** Whether a hand holds one of the turntables. */
  public get held(): boolean {
    return this.grip !== null;
  }

  public rotor(rotor: Rotor): RotorState {
    return this.rotors[rotor];
  }

  /** Orbit `i`'s share of the hand's turn. */
  public orbitTurn(i: number): number {
    return this.orbitTurns[i] ?? 0;
  }

  public turns(): readonly number[] {
    return this.orbitTurns;
  }

  /** Takes the turntable under the finger: the disk, or further out the orbits. */
  public grab(
    clientX: number,
    clientY: number,
    under: PlanePoint | null,
    now: number,
  ): void {
    const rotor: Rotor =
      under && under.radius >= ORBITS_FROM ? 'orbits' : 'disk';
    this.grip = {
      x: clientX,
      y: clientY,
      d: 0,
      angle: angleFrom(under),
      rotor,
    };
    this.driver = rotor;
    this.reference =
      rotor === 'orbits' && under ? under.radius : ORBITS_REFERENCE;
    const held = this.rotors[rotor];
    held.speed = 0;
    this.heldAngle = held.angle;
    this.trail = [{ t: now, a: held.angle }];
  }

  /** The held turntable follows the hand, angle for angle. */
  public turn(
    clientX: number,
    clientY: number,
    under: PlanePoint | null,
    now: number,
  ): void {
    const grip = this.grip;
    if (!grip) {
      return;
    }
    grip.d += Math.abs(clientX - grip.x) + Math.abs(clientY - grip.y);
    grip.x = clientX;
    grip.y = clientY;
    const angle = angleFrom(under);
    const held = this.rotors[grip.rotor];
    if (angle !== null && grip.angle !== null) {
      held.angle += nearestTurn(angle, grip.angle) - grip.angle;
    }
    grip.angle = angle;
    this.trail.push({ t: now, a: held.angle });
    while (
      this.trail.length > 2 &&
      now - (this.trail[0]?.t ?? now) > HAND_WINDOW_MS
    ) {
      this.trail.shift();
    }
  }

  /**
   * Lets go: the turntable keeps the hand's speed over its last moments, or
   * none if the hand had stopped. Answers whether the gesture was a drag
   * (over 6 px), not a click.
   */
  public release(now: number): boolean {
    const grip = this.grip;
    this.grip = null;
    if (!grip) {
      return false;
    }
    const last = this.trail.at(-1);
    const first = this.trail[0];
    this.rotors[grip.rotor].speed =
      last && first && now - last.t < HAND_STILL_MS && last.t - first.t > 8
        ? clamp(
            ((last.a - first.a) / (last.t - first.t)) * 1000,
            -HAND_MAX_SPEED,
            HAND_MAX_SPEED,
          )
        : 0;
    this.trail = [];
    return grip.d > 6;
  }

  /**
   * The two turntables for one frame. The held one's speed is read from its
   * angle; a free driver keeps its throw, taken by friction; the other is
   * dragged towards a share of the driver's speed, with a lag. The orbits'
   * turn is then shared out by Kepler over the orbits. Answers whether
   * either still turns.
   */
  public step(
    dt: number,
    isReduced: boolean,
    orbits: readonly { readonly rb: number }[],
  ): boolean {
    const held = this.grip ? this.rotors[this.grip.rotor] : null;
    if (held && dt > 0) {
      const measured = (held.angle - this.heldAngle) / dt;
      held.speed += (measured - held.speed) * (1 - Math.pow(0.5, dt / 0.05));
      this.heldAngle = held.angle;
    }
    const driver = this.rotors[this.driver];
    const driven = this.rotors[this.driver === 'disk' ? 'orbits' : 'disk'];
    const drag = isReduced ? 1 : 1 - Math.exp(-dt / DRAG_LAG);
    driven.speed += (driver.speed * DRAG_RATIO - driven.speed) * drag;
    let isTurning = held !== null;
    for (const rotor of [driver, driven]) {
      if (rotor !== held) {
        drift(rotor, dt, rotor === driver);
        isTurning = rotor.speed !== 0 || isTurning;
      }
    }
    this.share(orbits);
    return isTurning;
  }

  /** Shares out the orbits' turn since the last frame, orbit by orbit. */
  private share(orbits: readonly { readonly rb: number }[]): void {
    const turn = this.rotors.orbits.angle - this.shared;
    this.shared = this.rotors.orbits.angle;
    if (turn === 0) {
      return;
    }
    for (const [i, orbit] of orbits.entries()) {
      this.orbitTurns[i] =
        (this.orbitTurns[i] ?? 0) +
        turn * Math.pow(this.reference / orbit.rb, 1.5);
    }
  }
}

/**
 * A free turntable for one frame: it turns at its speed, and the driver
 * loses it to friction.
 */
function drift(
  rotor: { angle: number; speed: number },
  dt: number,
  isDriving: boolean,
): void {
  rotor.angle += rotor.speed * dt;
  if (isDriving) {
    rotor.speed *= Math.pow(0.5, dt / HAND_FRICTION);
  }
  if (Math.abs(rotor.speed) < 0.01) {
    rotor.speed = 0;
  }
}

/** The angle to follow, or `null` too near the centre to mean anything. */
function angleFrom(point: PlanePoint | null): number | null {
  return point && point.radius >= HAND_MIN_RADIUS ? point.angle : null;
}
