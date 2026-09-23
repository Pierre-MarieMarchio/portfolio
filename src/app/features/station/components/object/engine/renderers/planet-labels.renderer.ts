import {
  PanelEdges,
  placeName,
  placeNumber,
  Stage,
  TakenPlace,
} from '../labels';
import {
  isHighlighted,
  isNamed,
  PlanetBody,
} from '../../../../rules/scene/planet-focus.rules';
import type { SceneFrame } from '../../../../rules/scene/scene-frame.rules';

type NamePlace = ReturnType<typeof placeName>;

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

export class PlanetLabelsRenderer {
  private buttons: readonly HTMLElement[] = [];
  private labels: readonly HTMLElement[] = [];
  private buttonsWritten: Written[] = [];
  private labelsWritten: Written[] = [];
  private lines: readonly HTMLElement[] = [];
  private linesWritten: Written[] = [];
  private labelSizes: { w: number; h: number }[] = [];
  private places: TakenPlace[] = [];
  private panels: PanelEdges[] = [];
  private stage: Stage = { w: 0, h: 0 };

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  public get lineCount(): number {
    return this.lines.length;
  }

  public get nodeCount(): number {
    return Math.max(this.buttons.length, this.labels.length);
  }

  public setNodes(
    buttons: readonly HTMLElement[],
    labels: readonly HTMLElement[],
  ): void {
    if (buttons !== this.buttons) {
      this.buttons = buttons;
      this.buttonsWritten = buttons.map(() => written());
    }
    if (labels !== this.labels) {
      this.labels = labels;
      this.labelsWritten = labels.map(() => written());
    }
  }

  public setLines(lines: readonly HTMLElement[]): boolean {
    const isSame =
      lines.length === this.lines.length &&
      lines.every((line, i) => line === this.lines[i]);
    if (isSame) {
      return false;
    }
    this.lines = lines;
    this.linesWritten = lines.map(() => written());
    return true;
  }

  /**
   * Reads the labels' sizes. Called when they may have changed (a render,
   * the fonts arriving), never from the loop: a read after a style write
   * forces a layout per element.
   */
  public measure(): void {
    this.labelSizes = this.labels.map((label) => ({
      w: label.offsetWidth,
      h: label.offsetHeight,
    }));
  }

  // The text panels are laid out in advance among the taken places: a
  // planet's label cannot write itself over a line of text.
  public begin(frame: SceneFrame): void {
    const { zones, dpr } = frame;
    this.places = zones.map((z) => ({
      x: z.l / dpr,
      y: (z.t + z.b) / 2 / dpr,
      w: (z.r - z.l) / dpr,
      h: (z.b - z.t) / dpr,
    }));
    this.stage = { w: frame.w / dpr, h: frame.h / dpr };
    this.panels = zones.map((z) => ({
      l: z.l / dpr,
      r: z.r / dpr,
      t: z.t / dpr,
      b: z.b / dpr,
    }));
  }

  public hasLabel(i: number): boolean {
    return this.labels[i] !== undefined;
  }

  public hide(i: number): void {
    this.writeButton(i, null, true);
    this.writeLabel(i, null, '0');
  }

  public label(body: PlanetBody, frame: SceneFrame): void {
    // Index: the label is a two-character number, the one of the REF
    // column. It sits right against its body, no elbow, no search: it is
    // the planet/project link and must never vanish.
    if (frame.focus.isIndex) {
      this.number(body, frame);
    } else {
      this.name(body, frame);
    }
  }

  /**
   * A covered or out-of-frame button is switched off, made inert, taken out
   * of the tab order and hidden from assistive technologies: no invisible
   * target stays clickable. Only what changed is written.
   */
  public writeButton(
    i: number,
    transform: string | null,
    isCovered: boolean,
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
    const events = isCovered ? 'none' : 'auto';
    if (events !== last.events) {
      last.events = events;
      button.style.pointerEvents = events;
    }
    this.writeReach(button, last, isCovered);
  }

  public writeLabel(
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
  public writeLine(i: number, rise: number): void {
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

  private writeReach(
    button: HTMLElement,
    last: Written,
    isCovered: boolean,
  ): void {
    const hidden = isCovered ? 'true' : 'false';
    if (hidden !== last.hidden) {
      last.hidden = hidden;
      button.setAttribute('aria-hidden', hidden);
    }
    const tab = isCovered ? -1 : 0;
    if (tab !== last.tab) {
      last.tab = tab;
      button.tabIndex = tab;
    }
  }

  private number(body: PlanetBody, frame: SceneFrame): void {
    const i = body.index;
    const dpr = frame.dpr;
    const size = this.labelSizes[i];
    const number = placeNumber(
      {
        x: body.sx / dpr,
        y: body.sy / dpr,
        gap: (body.radius * 2.2) / dpr + 5,
      },
      { w: size?.w || 20, h: size?.h || 16 },
      this.stage,
      this.panels,
    );
    let opacity = '0';
    if (!body.isCovered && !number.onText) {
      opacity = isHighlighted(frame.focus, i) ? '1' : '0.8';
    }
    this.writeLabel(
      i,
      `translate(${String(number.x)}px,${String(number.y)}px)`,
      opacity,
    );
  }

  private name(body: PlanetBody, frame: SceneFrame): void {
    const i = body.index;
    const dpr = frame.dpr;
    const size = this.labelSizes[i];
    const lw = size?.w || 120;
    const lh = size?.h || 20;
    const isBright = isHighlighted(frame.focus, i);
    const isNamedHere = isNamed(frame.focus, body);
    const place = placeName(
      {
        x: body.sx / dpr,
        y: body.sy / dpr,
        radius: body.radius,
        objectRadius: frame.radius,
        dpr,
        named: isNamedHere,
      },
      { w: lw, h: lh },
      this.stage,
      this.places,
    );
    const isVisible = isNamedHere && place.free;
    let opacity = '0';
    if (isVisible) {
      opacity = isBright ? '1' : '0.62';
    }
    this.writeLabel(
      i,
      `translate(${String(place.x)}px,${String(place.y - lh / 2)}px)`,
      opacity,
    );
    if (isVisible) {
      this.stroke(body, frame, place, lw);
    }
  }

  private stroke(
    body: PlanetBody,
    frame: SceneFrame,
    place: NamePlace,
    lw: number,
  ): void {
    const dpr = frame.dpr;
    const l1 = body.radius * 3.4;
    const endX = (place.dir > 0 ? place.x - 6 : place.x + lw + 6) * dpr;
    const ctx = this.ctx;
    ctx.globalAlpha =
      (isHighlighted(frame.focus, body.index) ? 0.85 : 0.34) *
      frame.entry *
      frame.marks;
    ctx.beginPath();
    ctx.moveTo(body.sx + place.dir * l1, body.sy);
    ctx.lineTo(body.sx + place.dir * (l1 + 26 * dpr), place.y * dpr);
    ctx.lineTo(endX, place.y * dpr);
    ctx.stroke();
  }
}
