import type { FigureTarget } from '../../../rules/figures/figure-target.rules';

const INERT = 'pointer-events:none';

const styleOf = ({ x, y, width, height, isInert }: FigureTarget): string =>
  isInert
    ? INERT
    : `transform:translate(${x.toFixed(1)}px,${y.toFixed(1)}px);width:${width.toFixed(1)}px;height:${height.toFixed(1)}px;pointer-events:auto`;

export class FigureTargetsRenderer {
  private nodes: readonly HTMLElement[] = [];
  private styles: string[] = [];

  public setNodes(nodes: readonly HTMLElement[]): void {
    if (nodes !== this.nodes) {
      this.nodes = nodes;
      this.styles = nodes.map(() => '');
    }
  }

  public write(k: number, target: FigureTarget): void {
    const node = this.nodes[k];
    const style = styleOf(target);
    const last = this.styles[k];
    if (!node || style === last) {
      return;
    }
    this.styles[k] = style;
    node.style.cssText = style;
    if (!last || target.isInert !== (last === INERT)) {
      node.setAttribute('aria-hidden', String(target.isInert));
      node.tabIndex = target.isInert ? -1 : 0;
    }
  }

  public hideAll(): void {
    for (let k = 0; k < this.nodes.length; k++) {
      this.hide(k);
    }
  }

  public hide(k: number): void {
    this.write(k, { x: 0, y: 0, width: 0, height: 0, isInert: true });
  }
}
