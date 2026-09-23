import { clamp, TAU } from '@app/core/helpers';
import {
  PLANET_GAP,
  repel,
  ScreenPoint,
} from '../../rules/scene/planets/planet-spacing.rules';
import { Rolled, rollFlatten } from '../../rules/scene/camera/projection.rules';
import { positionOrbit, Projected } from '../../rules/scene/scene-bodies.rules';
import { TurntableMotion } from '../motions/turntable.motion';
import { isUnderPanel } from '../../rules/scene/panel-veil.rules';
import {
  bodyLight,
  bodySize,
  isLively,
  isRinged,
  PlanetBody,
  rising,
} from '../../rules/scene/planets/planet-focus.rules';
import type { SceneFrame } from '../../rules/scene/scene-frame.rules';
import { PlanetLabelsRenderer } from './planet-labels.renderer';

interface PlanetOnScreen extends ScreenPoint {
  readonly shadow: number;
  readonly isShaded: boolean;
}

// Out of frame counts as covered: no invisible target stays
// clickable or in the tab order.
const isOffFrame = (frame: SceneFrame, sx: number, sy: number): boolean => {
  const margin = 26 * frame.dpr;
  return (
    sx < margin || sx > frame.w - margin || sy < margin || sy > frame.h - margin
  );
};

export class PlanetsRenderer {
  private readonly out: Projected = { x: 0, y: 0, z: 0 };
  private readonly rolled: Rolled = { nx: 0, ny: 0 };
  private readonly body: PlanetBody = {
    index: 0,
    sx: 0,
    sy: 0,
    radius: 0,
    shadow: 0,
    isShaded: false,
    isCold: false,
    isLively: false,
    isCovered: false,
    rising: 0,
    coverFade: 1,
  };

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly labels: PlanetLabelsRenderer,
    private readonly turntable: TurntableMotion,
  ) {}

  public draw(frame: SceneFrame): void {
    const focus = frame.focus;
    for (let i = 0; i < this.labels.lineCount; i++) {
      this.labels.writeLine(i, rising(focus, i));
    }
    const planets = this.place(frame);
    repel(
      planets,
      focus.shown,
      Math.min(PLANET_GAP * frame.dpr, frame.radius * 1.1),
    );
    this.labels.begin(frame);
    for (let i = 0; i < focus.shown; i++) {
      const planet = planets[i];
      if (planet) {
        this.drawPlanet(i, planet, frame);
      }
    }
    // Bodies outside the current scale leave neither a target nor a label.
    for (let i = focus.shown; i < this.labels.nodeCount; i++) {
      this.labels.hide(i);
    }
  }

  // Positions first, drawing next: in between, a repulsion pass
  // guarantees a minimal on-screen gap.
  private place(frame: SceneFrame): PlanetOnScreen[] {
    const { phase, elev, azim, cx, cy, radius } = frame;
    return frame.orbits.map((orbit, i) => {
      const pos = positionOrbit(
        orbit,
        { phase, elev, azim: azim + this.turntable.orbitTurn(i) },
        this.out,
      );
      const { nx, ny } = rollFlatten(pos, frame, this.rolled);
      // A planet passing behind the shadow is hidden by it.
      const rn = Math.hypot(nx, ny);
      const fR = clamp((1.16 - rn) / 0.14, 0, 1);
      const zn = pos.z / Math.max(0.001, orbit.rb);
      const fZ = clamp((0.035 - zn) / 0.07, 0, 1);
      const fo = fR * fZ;
      return {
        sx: cx + nx * radius,
        sy: cy + ny * radius,
        shadow: fo,
        isShaded: fo > 0.5,
      };
    });
  }

  private drawPlanet(
    i: number,
    planet: PlanetOnScreen,
    frame: SceneFrame,
  ): void {
    const labels = this.labels;
    if (frame.marks <= 0.02) {
      labels.hide(i);
      return;
    }
    const { sx, sy } = planet;
    const dpr = frame.dpr;
    const isOutside = isOffFrame(frame, sx, sy);
    const isCovered = isOutside || isUnderPanel(frame.zones, sx, sy, dpr);
    const vn = rising(frame.focus, i);
    if (vn <= 0.002) {
      labels.hide(i);
      return;
    }
    labels.writeButton(
      i,
      `translate(${String(sx / dpr)}px,${String(sy / dpr)}px)`,
      isCovered,
    );
    if (isCovered) {
      labels.writeLabel(i, null, '0');
      if (isOutside) {
        return;
      }
    }
    const body = this.shape(i, planet, frame, vn);
    body.isCovered = isCovered;
    this.drawBody(body, frame);
    if (labels.hasLabel(i)) {
      labels.label(body, frame);
    }
  }

  private shape(
    i: number,
    planet: PlanetOnScreen,
    frame: SceneFrame,
    vn: number,
  ): PlanetBody {
    const body = this.body;
    const focus = frame.focus;
    body.index = i;
    body.sx = planet.sx;
    body.sy = planet.sy;
    body.shadow = planet.shadow;
    body.isShaded = planet.isShaded;
    body.rising = vn;
    // At the map's scale a body does not vanish because the table passes
    // over it: it stays drawn, only its number and target go.
    body.coverFade = focus.isMap ? 1 : frame.veil(planet.sx, planet.sy);
    body.isCold = i >= focus.featured;
    body.isLively = isLively(focus, i);
    // A crisp halo and a thin ring that pulse slowly: the only things
    // brighter than the disk's core.
    const pulse = 1 + 0.18 * Math.sin(frame.time * 0.9 + i * 2.1);
    body.radius = bodySize(body) * frame.dpr * pulse * frame.entry;
    return body;
  }

  private drawBody(body: PlanetBody, frame: SceneFrame): void {
    const ctx = this.ctx;
    const { sx, sy, radius: rBase, isLively: isBright } = body;
    const { entry: e, marks, accent, dpr } = frame;
    const att = bodyLight(frame.focus, body);
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, rBase * 6);
    halo.addColorStop(0, accent);
    halo.addColorStop(1, 'transparent');
    ctx.globalAlpha = (isBright ? 0.5 : 0.32) * e * marks * att;
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
    ctx.globalAlpha = (isBright ? 0.95 : 0.7) * e * marks * att;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, 1.3 * dpr);
    ctx.beginPath();
    ctx.arc(sx, sy, rBase * (isBright ? 3.1 : 2.5), 0, TAU);
    ctx.stroke();
    if (isRinged(frame.focus, body.index)) {
      ctx.globalAlpha = 0.85 * e * marks;
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, 1.1 * dpr);
      ctx.beginPath();
      ctx.arc(sx, sy, rBase * 4.8, 0, TAU);
      ctx.stroke();
    }
  }
}
