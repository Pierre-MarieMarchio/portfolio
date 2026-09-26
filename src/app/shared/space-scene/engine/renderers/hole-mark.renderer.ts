import { diskOnScreen, drawnDisc } from '../../rules/camera/pointer.rules';
import type { SceneFrame } from '../../rules/scene-frame.rules';

const HOLE_ATTRIBUTES = [
  'data-hole-x',
  'data-hole-y',
  'data-hole-radius',
  'data-disc-width',
  'data-disc-height',
  'data-disc-roll',
];

export class HoleMarkRenderer {
  private node: HTMLElement | null = null;
  private readonly written = new Array<string>(HOLE_ATTRIBUTES.length).fill('');

  public setNode(node: HTMLElement | null): void {
    this.node = node;
    this.written.fill('');
  }

  public draw(frame: SceneFrame): void {
    const node = this.node;
    if (!node) {
      return;
    }
    const { hole, dpr } = frame;
    const disc = drawnDisc(diskOnScreen(frame), dpr);
    const values = [
      ...[hole.cx, hole.cy, hole.radius].map((value) =>
        (value / dpr).toFixed(1),
      ),
      disc.rx.toFixed(1),
      disc.ry.toFixed(1),
      Math.atan2(disc.sin, disc.cos).toFixed(3),
    ];
    for (const [k, name] of HOLE_ATTRIBUTES.entries()) {
      const value = values[k] ?? '';
      if (value !== this.written[k]) {
        this.written[k] = value;
        node.setAttribute(name, value);
      }
    }
  }
}
