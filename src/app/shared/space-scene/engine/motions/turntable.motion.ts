import { clamp, nearestTurn } from '@app/core/helpers';

const HAND_FRICTION = 1.4;
const HAND_WINDOW_MS = 90;
const HAND_STILL_MS = 60;
const HAND_MAX_SPEED = 14;
const HAND_MIN_RADIUS = 0.45;
const ORBITS_FROM = 3.3;
const DRAG_RATIO = 0.4;
const DRAG_LAG = 0.55;

const ORBITS_REFERENCE = 5;

type Rotor = 'disk' | 'orbits';

export interface PlanePoint {
  readonly angle: number;
  readonly radius: number;
}

interface RotorState {
  readonly angle: number;
  readonly speed: number;
}

export class TurntableMotion {
  private readonly rotors: Record<Rotor, { angle: number; speed: number }> = {
    disk: { angle: 0, speed: 0 },
    orbits: { angle: 0, speed: 0 },
  };
  private driver: Rotor = 'disk';
  private trail: { t: number; a: number }[] = [];
  private heldAngle = 0;
  private orbitTurns: number[] = [];
  private shared = 0;
  private reference = ORBITS_REFERENCE;
  private grip: {
    x: number;
    y: number;
    d: number;
    angle: number | null;
    rotor: Rotor;
  } | null = null;

  public get held(): boolean {
    return this.grip !== null;
  }

  public rotor(rotor: Rotor): RotorState {
    return this.rotors[rotor];
  }

  public orbitTurn(i: number): number {
    return this.orbitTurns[i] ?? 0;
  }

  public turns(): readonly number[] {
    return this.orbitTurns;
  }

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

function angleFrom(point: PlanePoint | null): number | null {
  return point && point.radius >= HAND_MIN_RADIUS ? point.angle : null;
}
