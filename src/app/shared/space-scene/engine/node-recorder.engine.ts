import type { SceneNode, SceneNodeStyle } from '../models/scene-node.model';
import type {
  LabelSize,
  NodeGroup,
  NodeKey,
  NodeWrite,
} from '../models/scene-worker.model';

type StyleKey = keyof SceneNodeStyle;
type Write = (key: NodeKey, value: string) => void;

class RecordedStyle implements SceneNodeStyle {
  private readonly values: Partial<Record<StyleKey, string>> = {};

  constructor(private readonly write: Write) {}

  public get transform(): string {
    return this.values.transform ?? '';
  }

  public set transform(value: string) {
    this.keep('transform', value);
  }

  public get opacity(): string {
    return this.values.opacity ?? '';
  }

  public set opacity(value: string) {
    this.keep('opacity', value);
  }

  public get pointerEvents(): string {
    return this.values.pointerEvents ?? '';
  }

  public set pointerEvents(value: string) {
    this.keep('pointerEvents', value);
  }

  public get zIndex(): string {
    return this.values.zIndex ?? '';
  }

  public set zIndex(value: string) {
    this.keep('zIndex', value);
  }

  public get cssText(): string {
    return this.values.cssText ?? '';
  }

  public set cssText(value: string) {
    this.keep('cssText', value);
  }

  private keep(key: StyleKey, value: string): void {
    this.values[key] = value;
    this.write(key, value);
  }
}

class RecordedNode implements SceneNode {
  public readonly style: SceneNodeStyle;
  public offsetWidth = 0;
  public offsetHeight = 0;
  private tab = 0;

  constructor(private readonly write: Write) {
    this.style = new RecordedStyle(write);
  }

  public get tabIndex(): number {
    return this.tab;
  }

  public set tabIndex(value: number) {
    this.tab = value;
    this.write('tabIndex', String(value));
  }

  public setAttribute(name: string, value: string): void {
    this.write(`@${name}`, value);
  }
}

export class NodeRecorderEngine {
  private readonly writes: NodeWrite[] = [];
  private readonly counts: Record<NodeGroup, number> = {
    buttons: 0,
    labels: 0,
    figures: 0,
    lines: 0,
    hole: 0,
  };
  private labels: RecordedNode[] = [];

  public get hasWrites(): boolean {
    return this.writes.length > 0;
  }

  public get generations(): Readonly<Record<NodeGroup, number>> {
    return { ...this.counts };
  }

  public nodes(group: NodeGroup, count: number): SceneNode[] {
    this.counts[group]++;
    const nodes = Array.from(
      { length: count },
      (_, index) =>
        new RecordedNode((key, value) => {
          this.writes.push([group, index, key, value]);
        }),
    );
    if (group === 'labels') {
      this.labels = nodes;
    }
    return nodes;
  }

  public sizeLabels(sizes: readonly LabelSize[]): void {
    for (const [i, label] of this.labels.entries()) {
      label.offsetWidth = sizes[i]?.w ?? 0;
      label.offsetHeight = sizes[i]?.h ?? 0;
    }
  }

  public take(): NodeWrite[] {
    return this.writes.splice(0);
  }
}
