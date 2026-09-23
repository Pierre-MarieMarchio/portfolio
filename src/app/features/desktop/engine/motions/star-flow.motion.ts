import { clamp, TAU } from '../../rules/scene/scene-math.rules';
import { CURSOR_REACH } from '../../models/scene-constants.model';
import { travelingElevation } from '../../rules/scene/camera/projection.rules';
import type { SkyCamera, SkyPan } from '../renderers/sky/star-sky.renderer';
import { forgetTrail, Star } from '../../rules/scene/sky/star-field.rules';

/**
 * How much of a star's sideways motion its trail keeps. A trail points away
 * from the vanishing point, whatever the camera does: in the turns the whole
 * field slides sideways, and trails that followed it turned into parallel
 * hatching, the tunnel gone. A quarter of the slide bends the tunnel into
 * the turn without breaking it.
 */
const TRAIL_SIDEWAYS = 0.5;
/**
 * The crossing's turn, as a hyperspace jump shows it: the tunnel stays
 * centred and BANKS into the turn, turning on itself around its vanishing
 * point, while its mouth leads a little towards where the run goes. The
 * mockup panned the whole field instead: the tunnel broke into parallel
 * hatching, and once the tunnel was kept, the turn could no longer be felt.
 */
const BANK = 0.35;
/** The share of the turn's pan the vanishing point keeps, as a lead. */
const LEAD = 0.3;
/**
 * The sky's flow once the tunnel is over, at the approach's peak speed. The
 * tunnel dies at 7.9 s while the object still comes on until 9.6 s: a sky
 * frozen under an object rushing at us read as the object flying in, not
 * as us arriving. The stars keep drifting out, slower and slower, and come
 * to rest with the landing.
 */
const COAST = 0.15;
export interface SkyFrame extends SkyPan {
  readonly cam: SkyCamera;
  readonly w: number;
  readonly h: number;
  readonly lens: { readonly x: number; readonly y: number } | null;
  readonly lensReach: number;
  readonly einsteinRadius: number;
  readonly deflectionMax: number;
  readonly scale: number;
  readonly cx0: number;
  readonly cy0: number;
  readonly bankCos: number;
  readonly bankSin: number;
  readonly run: number;
  readonly speed: number;
  readonly voyage: number;
  readonly dtc: number;
  readonly smooth: number;
  readonly drift: number;
}

export interface StarPass {
  x: number;
  y: number;
  depth: number;
  near: number;
  tx: number;
  ty: number;
}

const skyFrame = (
  w: number,
  h: number,
  cam: SkyCamera,
  dtc: number,
): SkyFrame => {
  const { trv, dpr } = cam;
  // The sky follows the camera: without it, the eye credits the motion to
  // the object. Each star moves by its depth; the biggest are the
  // closest, they move most. The camera at rest pans the field; its turn
  // during the crossing banks the tunnel and leads its mouth (BANK, LEAD).
  const turnEv = travelingElevation(cam.elev, trv.dEv);
  const turnX = -trv.dAz * 0.3 * w;
  const turnY = (turnEv - cam.elev) * 0.85 * h;
  // The bank: the camera's roll, and a lean into the turn.
  const bank = trv.dRoll + BANK * trv.dAz;
  // One profile: the speed starts from ZERO (the sky is still while the
  // title is read), rises, then dies. The spread is its integral, hence
  // monotonic: no star ever turns back. What dies is the speed, so the
  // trails' length.
  const tt = cam.reduced ? 99 : cam.time;
  const run = clamp((tt - 3.5) / 4.4, 0, 1);
  return {
    cam,
    w,
    h,
    lens: cam.reduced ? null : cam.pointer,
    // THE SAME FOOTPRINT as the disk's repulsion, 70 px: two radii for one
    // cursor would make two cursors. The Einstein radius is the scale of
    // the deflection, not its reach; the deflection is capped, or a star
    // passing right under the cursor would fly off fifty pixels.
    lensReach: CURSOR_REACH * dpr,
    einsteinRadius: 19 * dpr,
    deflectionMax: 26 * dpr,
    // PARALLAX: during the arrival the sky spreads far more than the object
    // grows. That ratio, not the scale, says that we move forward.
    scale: cam.scale * (1 + 0.55 * (1 - trv.grow)),
    panX: cam.camX - 0.42,
    panY: cam.camY - 0.46,
    // The vanishing point: the object, led a little into the turn.
    cx0: (cam.hole ? cam.hole.cx : w / 2) + turnX * LEAD,
    cy0: (cam.hole ? cam.hole.cy : h / 2) + turnY * LEAD,
    bankCos: Math.cos(bank),
    bankSin: Math.sin(bank),
    run,
    speed:
      6 * run * (1 - run) * (1 - run) + (cam.reduced ? 0 : COAST * trv.coast),
    // The trails come and go with the run instead of switching on and off:
    // cut at its end, a trail still long from the camera's motion vanished
    // in one frame. The last 4% only: earlier, it dimmed the run's end.
    voyage: clamp(run / 0.04, 0, 1) * clamp((1 - run) / 0.04, 0, 1),
    dtc,
    // Velocity smoothing as a rate: the same lag whatever the frame rate.
    smooth: dtc > 0 ? 1 - Math.pow(0.55, dtc * 60) : 0,
    drift: cam.reduced ? 0 : cam.time * 0.34,
  };
};

// How fast a star at this depth spreads from the vanishing point, per
// second: its position AND its trail read it, so the two cannot part.
const spreadRate = (frame: SkyFrame, depth: number): number =>
  frame.speed * (0.55 + 1.25 * depth) * 1.7;

const depthOf = (star: Star, dpr: number): number =>
  0.32 + 0.68 * Math.min(1, star.radius / (2.4 * dpr));

const slideX = (frame: SkyFrame, depth: number): number =>
  (-frame.cam.azim * 0.3 - frame.panX * 0.55) * frame.w * depth;

const slideY = (frame: SkyFrame, depth: number): number =>
  ((frame.cam.elev - 0.18) * 0.85 - frame.panY * 0.55) * frame.h * depth;

export class StarFlowMotion {
  public readonly pass: StarPass = {
    x: 0,
    y: 0,
    depth: 0,
    near: 0,
    tx: 0,
    ty: 0,
  };
  private isFlattened = false;
  private previousTime = 0;

  constructor(private readonly rnd: () => number) {}

  public update(
    stars: readonly Star[],
    w: number,
    h: number,
    cam: SkyCamera,
  ): SkyFrame {
    const dtc = clamp(cam.time - this.previousTime, 0, 0.08);
    this.previousTime = cam.time;
    const frame = skyFrame(w, h, cam, dtc);
    // At the end of the run the field is flattened once and for all: the
    // radial spread is not reversible, and without this the sky would stay
    // empty for the whole visit.
    if (!this.isFlattened && frame.run >= 1 && frame.speed <= 0) {
      this.isFlattened = true;
      this.flatten(stars, frame);
    }
    return frame;
  }

  public place(star: Star, frame: SkyFrame): boolean {
    const pass = this.pass;
    pass.depth = depthOf(star, frame.cam.dpr);
    // RADIAL FLOW. The star leaves the vanishing point, faster and faster,
    // and never comes back. One that leaves the frame is RECYCLED near
    // the centre. A modulo would turn the radial flight into a
    // translation, and stars would cross the frame diagonally.
    if (frame.speed > 0.0001) {
      star.ray *= 1 + frame.dtc * spreadRate(frame, pass.depth);
    }
    return this.locate(star, frame);
  }

  public follow(star: Star, frame: SkyFrame): void {
    this.track(star, frame);
    this.aimTrail(star, frame);
  }

  // The spread applies to the star's DRAWN base, drift and slide included:
  // folded into its position alone, every spread star jumped by its slide
  // times its spread at the end of the run.
  private flatten(stars: readonly Star[], frame: SkyFrame): void {
    const { cx0, cy0, drift } = frame;
    for (const star of stars) {
      if (star.ray > 1.0005) {
        const depth = depthOf(star, frame.cam.dpr);
        const ox = star.vx * drift + slideX(frame, depth);
        const oy = star.vy * drift + slideY(frame, depth);
        star.x = cx0 + (star.x + ox - cx0) * star.ray - ox;
        star.y = cy0 + (star.y + oy - cy0) * star.ray - oy;
      }
      forgetTrail(star);
    }
  }

  private locate(star: Star, frame: SkyFrame): boolean {
    const { w, h, cx0, cy0, bankCos, bankSin, drift } = frame;
    const depth = this.pass.depth;
    const depthScale = 1 + (frame.scale - 1) * 0.72 * depth;
    // Scaled and banked around the vanishing point.
    const sx0 =
      (star.x + star.vx * drift + slideX(frame, depth) - cx0) * depthScale;
    const sy0 =
      (star.y + star.vy * drift + slideY(frame, depth) - cy0) * depthScale;
    const bx = cx0 + sx0 * bankCos - sy0 * bankSin;
    const by = cy0 + sx0 * bankSin + sy0 * bankCos;
    if (star.ray > 1.0005) {
      return this.spreadOut(star, frame, bx, by);
    }
    this.pass.x = ((bx % w) + w) % w;
    this.pass.y = ((by % h) + h) % h;
    return true;
  }

  private spreadOut(
    star: Star,
    frame: SkyFrame,
    bx: number,
    by: number,
  ): boolean {
    const { w, h, cx0, cy0 } = frame;
    const x = cx0 + (bx - cx0) * star.ray;
    const y = cy0 + (by - cy0) * star.ray;
    const margin = 30 * frame.cam.dpr;
    if (x < -margin || x > w + margin || y < -margin || y > h + margin) {
      // Back from afar, but spread on a real surface: too tight a disk
      // would tie a knot at the vanishing point.
      const angle = this.rnd() * TAU;
      const spread = 0.02 + this.rnd() * 0.26;
      star.x = cx0 + Math.cos(angle) * w * spread;
      star.y = cy0 + Math.sin(angle) * h * spread;
      forgetTrail(star);
      return false;
    }
    this.pass.x = x;
    this.pass.y = y;
    return true;
  }

  // The trail is the velocity really travelled since the last frame,
  // stretched: it cannot point where the star did not go. A wrap jump
  // is not a displacement and leaves no trace.
  private track(star: Star, frame: SkyFrame): void {
    const { x, y } = this.pass;
    const { dtc, w, h } = frame;
    if (dtc > 0) {
      let tdx = Number.isNaN(star.px) ? 0 : x - star.px;
      let tdy = Number.isNaN(star.py) ? 0 : y - star.py;
      if (Math.abs(tdx) > w / 2 || Math.abs(tdy) > h / 2) {
        tdx = 0;
        tdy = 0;
      }
      // Smoothed, so the trail's length does not jitter frame to frame.
      star.sdx += (tdx / dtc - star.sdx) * frame.smooth;
      star.sdy += (tdy / dtc - star.sdy) * frame.smooth;
    }
    star.px = x;
    star.py = y;
  }

  // The trail's velocity: the star's FLIGHT away from the vanishing
  // point, which the spread gives and the camera does not touch, plus a
  // quarter of what it slides across. Measured on screen instead, the
  // flight of the stars the turn pushes back towards the vanishing point
  // cancelled out, and half the tunnel went dark.
  private aimTrail(star: Star, frame: SkyFrame): void {
    const pass = this.pass;
    const ox = pass.x - frame.cx0;
    const oy = pass.y - frame.cy0;
    const distance = Math.hypot(ox, oy);
    let tx = star.sdx;
    let ty = star.sdy;
    if (distance > 1 && star.ray > 1.0005) {
      const ux = ox / distance;
      const uy = oy / distance;
      const flight = distance * spreadRate(frame, pass.depth);
      const across = tx * -uy + ty * ux;
      tx = ux * flight - uy * across * TRAIL_SIDEWAYS;
      ty = uy * flight + ux * across * TRAIL_SIDEWAYS;
    }
    pass.tx = tx;
    pass.ty = ty;
  }
}
