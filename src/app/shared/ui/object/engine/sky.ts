import { clamp, smoothstep, TAU } from './math';
import { Traveling } from './traveling';

interface Star {
  x: number;
  y: number;
  readonly r: number;
  readonly vx: number;
  readonly vy: number;
  readonly a: number;
  readonly ph: number;
  readonly accent: boolean;
  /** Radial spread during the crossing, 1 at rest. */
  ray: number;
  /** Last drawn position, `NaN` when there is none to trail from. */
  px: number;
  py: number;
  /** Smoothed velocity, in device pixels per second, for the trail. */
  sdx: number;
  sdy: number;
}

/**
 * A trail is as long as the path its star travels in this time: nine frames
 * at 60 Hz, the mockup's stretch, but in seconds, so that a frame that comes
 * late neither lengthens the trails nor jolts them.
 */
const TRAIL_SECONDS = 9 / 60;
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
/** Around this speed a star starts to trail: 0.45 px a frame at 60 Hz. */
const TRAIL_FROM = 0.45 * 60;

/** What the sky needs of the camera, read once per frame. */
export interface SkyCamera {
  readonly time: number;
  readonly reduced: boolean;
  readonly pointer: { readonly x: number; readonly y: number } | null;
  readonly dpr: number;
  readonly trv: Traveling;
  readonly azim: number;
  readonly elev: number;
  readonly scale: number;
  readonly camX: number;
  readonly camY: number;
  /** The object's centre and radius on screen, `null` before its first draw. */
  readonly hole: {
    readonly cx: number;
    readonly cy: number;
    readonly R: number;
  } | null;
  readonly ink: string;
  readonly accent: string;
  readonly entry: number;
}

/** What the sky hands to the constellations drawn on it. */
export interface SkyPan {
  readonly panX: number;
  readonly panY: number;
}

/**
 * The field of stars, behind the object. Not uniform: four clusters, a lot
 * of dust, rare sharp stars (6%). One star per 3600 px² divided by the dpr.
 */
export class Sky {
  private stars: Star[] = [];
  private builtW = 0;
  private builtH = 0;
  private flattened = false;
  private previousTime = 0;
  private warmed = false;

  constructor(private readonly rnd: () => number) {}

  /**
   * Draws the sky and answers the pan it used, so the constellations drift
   * with the fixed stars.
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cam: SkyCamera,
  ): SkyPan {
    ctx.clearRect(0, 0, w, h);
    if (this.builtW !== w || this.builtH !== h) {
      this.build(w, h, cam.dpr);
    }
    if (!this.warmed) {
      this.warmed = true;
      this.warm(ctx, cam);
    }
    const { trv, dpr } = cam;
    const time = cam.time;
    const lens = cam.reduced ? null : cam.pointer;
    // THE SAME FOOTPRINT as the disk's repulsion, 70 px: two radii for one
    // cursor would make two cursors. The Einstein radius is the scale of
    // the deflection, not its reach; the deflection is capped, or a star
    // passing right under the cursor would fly off fifty pixels.
    const rPtr = 70 * dpr;
    const rE = 19 * dpr;
    const deflMax = 26 * dpr;
    // The sky follows the camera: without it, the eye credits the motion to
    // the object. Each star moves by its depth; the biggest are the
    // closest, they move most. The camera at rest pans the field; its turn
    // during the crossing banks the tunnel and leads its mouth (BANK, LEAD).
    const az = cam.azim;
    const ev = cam.elev;
    const turnEv = Math.max(0.018, cam.elev + (0.022 - cam.elev) * -trv.dEv);
    const turnX = -trv.dAz * 0.3 * w;
    const turnY = (turnEv - ev) * 0.85 * h;
    // PARALLAX: during the arrival the sky spreads far more than the object
    // grows. That ratio, not the scale, says that we move forward.
    const scale = cam.scale * (1 + 0.55 * (1 - trv.grow));
    const panX = cam.camX - 0.42;
    const panY = cam.camY - 0.46;
    // The vanishing point: the object, led a little into the turn.
    const cx0 = (cam.hole ? cam.hole.cx : w / 2) + turnX * LEAD;
    const cy0 = (cam.hole ? cam.hole.cy : h / 2) + turnY * LEAD;
    // The bank: the camera's roll, and a lean into the turn.
    const bank = trv.dRoll + BANK * trv.dAz;
    const bankCos = Math.cos(bank);
    const bankSin = Math.sin(bank);
    // One profile: the speed starts from ZERO (the sky is still while the
    // title is read), rises, then dies. The spread is its integral, hence
    // monotonic: no star ever turns back. What dies is the speed, so the
    // trails' length.
    const tt = cam.reduced ? 99 : time;
    const u = clamp((tt - 3.5) / 4.4, 0, 1);
    const speed = 6 * u * (1 - u) * (1 - u);
    // How fast a star at this depth spreads from the vanishing point, per
    // second: its position AND its trail read it, so the two cannot part.
    const spreadRate = (depth: number): number =>
      speed * (0.55 + 1.25 * depth) * 1.7;
    // The trails come and go with the run instead of switching on and off:
    // cut at its end, a trail still long from the camera's motion vanished
    // in one frame. The last 4% only: earlier, it dimmed the run's end.
    const voyage = clamp(u / 0.04, 0, 1) * clamp((1 - u) / 0.04, 0, 1);
    const dtc = clamp(time - this.previousTime, 0, 0.08);
    this.previousTime = time;
    // Velocity smoothing as a rate: the same lag whatever the frame rate.
    const smooth = dtc > 0 ? 1 - Math.pow(0.55, dtc * 60) : 0;
    const drift = cam.reduced ? 0 : time * 0.34;
    const depthOf = (star: Star): number =>
      0.32 + 0.68 * Math.min(1, star.r / (2.4 * dpr));
    const slideX = (depth: number): number =>
      (-az * 0.3 - panX * 0.55) * w * depth;
    const slideY = (depth: number): number =>
      ((ev - 0.18) * 0.85 - panY * 0.55) * h * depth;
    // At the end of the run the field is flattened once and for all: the
    // radial spread is not reversible, and without this the sky would stay
    // empty for the whole visit.
    // The spread applies to the star's DRAWN base, drift and slide included:
    // folded into its position alone, every spread star jumped by its slide
    // times its spread at the end of the run.
    if (!this.flattened && u >= 1 && speed <= 0) {
      this.flattened = true;
      for (const star of this.stars) {
        if (star.ray > 1.0005) {
          const depth = depthOf(star);
          const ox = star.vx * drift + slideX(depth);
          const oy = star.vy * drift + slideY(depth);
          star.x = cx0 + (star.x + ox - cx0) * star.ray - ox;
          star.y = cy0 + (star.y + oy - cy0) * star.ray - oy;
        }
        star.ray = 1;
        star.px = Number.NaN;
        star.py = Number.NaN;
        star.sdx = 0;
        star.sdy = 0;
      }
    }
    const hole = cam.hole;
    // Two inks only: the fill changes when the ink does, not per star.
    let fill = '';
    for (const star of this.stars) {
      const twinkle = cam.reduced
        ? 1
        : 0.72 + 0.28 * Math.sin(time * 0.26 + star.ph);
      const depth = depthOf(star);
      const k = 1 + (scale - 1) * 0.72 * depth;
      // RADIAL FLOW. The star leaves the vanishing point, faster and faster,
      // and never comes back. One that leaves the frame is RECYCLED near
      // the centre. A modulo would turn the radial flight into a
      // translation, and stars would cross the frame diagonally.
      if (speed > 0.0001) {
        star.ray *= 1 + dtc * spreadRate(depth);
      }
      // Scaled and banked around the vanishing point.
      const sx0 = (star.x + star.vx * drift + slideX(depth) - cx0) * k;
      const sy0 = (star.y + star.vy * drift + slideY(depth) - cy0) * k;
      const bx = cx0 + sx0 * bankCos - sy0 * bankSin;
      const by = cy0 + sx0 * bankSin + sy0 * bankCos;
      let x: number;
      let y: number;
      if (star.ray > 1.0005) {
        x = cx0 + (bx - cx0) * star.ray;
        y = cy0 + (by - cy0) * star.ray;
        const margin = 30 * dpr;
        if (x < -margin || x > w + margin || y < -margin || y > h + margin) {
          // Back from afar, but spread on a real surface: too tight a disk
          // would tie a knot at the vanishing point.
          const angR = this.rnd() * TAU;
          const dR = 0.02 + this.rnd() * 0.26;
          star.x = cx0 + Math.cos(angR) * w * dR;
          star.y = cy0 + Math.sin(angR) * h * dR;
          star.ray = 1;
          star.px = Number.NaN;
          star.py = Number.NaN;
          star.sdx = 0;
          star.sdy = 0;
          continue;
        }
      } else {
        x = ((bx % w) + w) % w;
        y = ((by % h) + h) % h;
      }
      const r = star.r * (1 + (scale - 1) * 0.42 * depth);
      // The sky brightens near the disk.
      let near = 1;
      if (hole) {
        const reach = hole.R * 3.2;
        const d = Math.sqrt(
          (x - hole.cx) * (x - hole.cx) + (y - hole.cy) * (y - hole.cy),
        );
        // NOTHING crosses the shadow. The sky is painted on a separate
        // layer, under the object: without this cut, stars showed through
        // the hole and the shadow stopped being one. The photon rim is at
        // 0.958 radius; the cut sits just beyond so the edge stays sharp
        // without eating the ring.
        if (d < hole.R * 1.02) {
          continue;
        }
        // A short fade on the shadow's edge: a hard cut would read as a
        // rendering defect.
        if (d < hole.R * 1.22) {
          near = (d - hole.R * 1.02) / (hole.R * 0.2);
        } else if (d < reach) {
          near = 1 + 1.15 * Math.pow(1 - d / reach, 1.8);
        }
      }
      // The trail is the velocity really travelled since the last frame,
      // stretched: it cannot point where the star did not go. A wrap jump
      // is not a displacement and leaves no trace.
      if (dtc > 0) {
        let tdx = Number.isNaN(star.px) ? 0 : x - star.px;
        let tdy = Number.isNaN(star.py) ? 0 : y - star.py;
        if (Math.abs(tdx) > w / 2 || Math.abs(tdy) > h / 2) {
          tdx = 0;
          tdy = 0;
        }
        // Smoothed, so the trail's length does not jitter frame to frame.
        star.sdx += (tdx / dtc - star.sdx) * smooth;
        star.sdy += (tdy / dtc - star.sdy) * smooth;
      }
      star.px = x;
      star.py = y;
      // The trail's velocity: the star's FLIGHT away from the vanishing
      // point, which the spread gives and the camera does not touch, plus a
      // quarter of what it slides across. Measured on screen instead, the
      // flight of the stars the turn pushes back towards the vanishing point
      // cancelled out, and half the tunnel went dark.
      const ox = x - cx0;
      const oy = y - cy0;
      const od = Math.sqrt(ox * ox + oy * oy);
      let tx = star.sdx;
      let ty = star.sdy;
      if (od > 1 && star.ray > 1.0005) {
        const ux = ox / od;
        const uy = oy / od;
        const flight = od * spreadRate(depth);
        const across = tx * -uy + ty * ux;
        tx = ux * flight - uy * across * TRAIL_SIDEWAYS;
        ty = uy * flight + ux * across * TRAIL_SIDEWAYS;
      }
      const velocity = Math.sqrt(tx * tx + ty * ty);
      // A star near the threshold no longer flips between a dot and a
      // trail from one frame to the next: the two cross-fade just UNDER it,
      // from 0.7 to 1 times the threshold. Above, a trail is at full light,
      // as in the mockup: centred on the threshold, the fade dimmed half the
      // field and the run looked washed out.
      const trailing =
        voyage *
        smoothstep(clamp((velocity / (TRAIL_FROM * dpr) - 0.7) / 0.3, 0, 1));
      const color = star.accent ? cam.accent : cam.ink;
      if (trailing > 0.004) {
        const qx = x - tx * TRAIL_SECONDS;
        const qy = y - ty * TRAIL_SECONDS;
        this.strokeTrail(
          ctx,
          x,
          y,
          qx,
          qy,
          color,
          Math.min(
            0.8,
            (0.06 + star.a) * twinkle * near * (0.7 + 1.5 * speed),
          ) * trailing,
          Math.max(0.7, r * 0.8),
        );
        if (trailing >= 0.996) {
          continue;
        }
        near *= 1 - trailing;
      }
      // THE CURSOR'S GRAVITATIONAL LENS. The cursor is a mass: it deflects
      // the light passing near it, in 1/d, and the flux is conserved, so
      // what spreads brightens. Applied to the drawing only, never to the
      // remembered position, or it would make false trails.
      let lx = x;
      let ly = y;
      let gain = 1;
      if (lens) {
        const ldx = x - lens.x;
        const ldy = y - lens.y;
        const ld = Math.sqrt(ldx * ldx + ldy * ldy);
        if (ld > 0.01 && ld < rPtr) {
          const defl = Math.min(deflMax, (rE * rE) / Math.max(ld, rE * 0.5));
          lx = x + (ldx / ld) * defl;
          ly = y + (ldy / ld) * defl;
          gain = 1 + 1.6 * Math.pow(rE / (ld + rE * 0.7), 2);
        }
      }
      const rl = r * Math.min(2.1, Math.sqrt(gain));
      ctx.globalAlpha = Math.min(
        0.88,
        star.a * twinkle * cam.entry * near * Math.min(2.5, gain),
      );
      if (color !== fill) {
        fill = color;
        ctx.fillStyle = color;
      }
      ctx.fillRect(
        lx - rl / 2,
        ly - rl / 2,
        Math.max(0.5, rl),
        Math.max(0.5, rl),
      );
    }
    return { panX, panY };
  }

  /**
   * Draws every star's trail once, nobody seeing it, on the first frame,
   * under the title card. The GPU compiles a program the first time it
   * draws each kind of stroke: done when the run set off, it held the first
   * frames of the trails 40 to 360 ms. The same strokes as the run's, same
   * widths, same path through `strokeTrail`, so none is left to compile.
   */
  private warm(ctx: CanvasRenderingContext2D, cam: SkyCamera): void {
    for (const star of this.stars) {
      const r = star.r;
      this.strokeTrail(
        ctx,
        star.x,
        star.y,
        star.x - 12 * cam.dpr,
        star.y - 5 * cam.dpr,
        star.accent ? cam.accent : cam.ink,
        0.004,
        Math.max(0.7, r * 0.8),
      );
    }
    ctx.globalAlpha = 1;
  }

  /** A trail that fades towards its tail: a trace, not a stick. */
  private strokeTrail(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    qx: number,
    qy: number,
    color: string,
    alpha: number,
    width: number,
  ): void {
    const gradient = ctx.createLinearGradient(x, y, qx, qy);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.45, color);
    gradient.addColorStop(1, 'transparent');
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(qx, qy);
    ctx.stroke();
  }

  private build(w: number, h: number, dpr: number): void {
    const rnd = this.rnd;
    const n = Math.round((w * h) / (3600 * dpr));
    const clusters: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < 4; i++) {
      clusters.push({
        x: rnd() * w,
        y: rnd() * h,
        r: (0.18 + rnd() * 0.2) * Math.min(w, h),
      });
    }
    const stars: Star[] = [];
    for (let i = 0; i < n; i++) {
      let x = rnd() * w;
      let y = rnd() * h;
      if (rnd() < 0.42) {
        const cluster = clusters[Math.floor(rnd() * clusters.length)];
        if (cluster) {
          const t = rnd() * TAU;
          const d = Math.pow(rnd(), 0.6) * cluster.r;
          x = cluster.x + Math.cos(t) * d;
          y = cluster.y + Math.sin(t) * d * 0.8;
          if (x < 0 || x > w || y < 0 || y > h) {
            x = rnd() * w;
            y = rnd() * h;
          }
        }
      }
      const big = rnd() > 0.94;
      stars.push({
        x,
        y,
        r: (big ? 1.6 + rnd() * 1.0 : 0.5 + Math.pow(rnd(), 2.1) * 1.0) * dpr,
        vx: (rnd() - 0.5) * 1.6,
        vy: (rnd() - 0.5) * 1.1,
        a: big ? 0.34 + rnd() * 0.26 : 0.07 + rnd() * 0.2,
        ph: rnd() * TAU,
        accent: rnd() < 0.1,
        ray: 1,
        px: Number.NaN,
        py: Number.NaN,
        sdx: 0,
        sdy: 0,
      });
    }
    this.stars = stars;
    this.builtW = w;
    this.builtH = h;
  }
}
