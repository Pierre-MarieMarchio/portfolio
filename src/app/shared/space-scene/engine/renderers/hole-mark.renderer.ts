import type { SceneFrame } from '../../rules/scene-frame.rules';

const HOLE_ATTRIBUTES = ['data-hole-x', 'data-hole-y', 'data-hole-radius'];

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
    const values = [hole.cx, hole.cy, hole.radius].map((value) =>
      (value / dpr).toFixed(1),
    );
    for (const [k, name] of HOLE_ATTRIBUTES.entries()) {
      const value = values[k] ?? '';
      if (value !== this.written[k]) {
        this.written[k] = value;
        node.setAttribute(name, value);
      }
    }
  }
}
