import { SCENE_CONFIG } from '../models/scene-config.model';
import { SkyPanMotion } from './motions/sky-pan.motion';
import { clientOnCanvas } from '../rules/camera/pointer.rules';
import { canLookCloser } from '../rules/camera/zoom.rules';
import { isSameList } from '../rules/planets/same-nodes.rules';
import { NO_STATE, SceneState, sceneState } from '../rules/scene-state.rules';
import type { SceneEngine } from '../models/scene-engine.model';
import type { SceneInputs } from '../models/scene.model';
import type { SceneLayout } from '../models/scene-layout.model';
import type { SceneNode } from '../models/scene-node.model';
import type {
  FromSceneWorker,
  NodeGroup,
  NodeWrite,
  SceneWorkerBoot,
  SceneWorkerCommands,
  SceneWorkerFrame,
  ToSceneWorker,
} from '../models/scene-worker.model';

export interface RemoteHost {
  frame(callback: (time: number) => void): () => void;
  now(): number;
  hidden(): boolean;
}

export interface SceneWorkerPort {
  post(message: ToSceneWorker): void;
  listen(handler: (message: FromSceneWorker) => void): void;
}

export interface ShownCanvas {
  readonly canvas: { width: number; height: number };
  readonly context: Pick<
    ImageBitmapRenderingContext,
    'transferFromImageBitmap'
  >;
}

export interface RemoteCanvases {
  readonly matter: ShownCanvas;
  readonly sky: ShownCanvas | null;
}

type Nodes = Record<NodeGroup, readonly SceneNode[]>;

const NO_NODES: Nodes = {
  buttons: [],
  labels: [],
  figures: [],
  lines: [],
  hole: [],
};

export class RemoteSceneEngine implements SceneEngine {
  private state: SceneState = NO_STATE;
  private layout: SceneLayout | null = null;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private grip: { x: number; y: number; d: number } | null = null;
  private nodes: Nodes = { ...NO_NODES };
  private readonly generations: Record<NodeGroup, number> = {
    buttons: 0,
    labels: 0,
    figures: 0,
    lines: 0,
    hole: 0,
  };
  private pan: SkyPanMotion | null = null;
  private sentPan = { x: 0, y: 0 };
  private matter: ImageBitmap | null = null;
  private sky: ImageBitmap | null = null;
  private readonly writes: NodeWrite[] = [];
  private cancelShow: (() => void) | null = null;

  constructor(
    private readonly port: SceneWorkerPort,
    private readonly host: RemoteHost,
    private readonly canvases: RemoteCanvases,
    boot: Omit<SceneWorkerBoot, 'kind'>,
  ) {
    port.listen((message) => {
      this.take(message);
    });
    port.post({ kind: 'boot', ...boot });
  }

  public setInputs(inputs: SceneInputs): void {
    this.state = sceneState(inputs);
    const pan = inputs.pan instanceof SkyPanMotion ? inputs.pan : null;
    if (pan !== this.pan) {
      this.pan = pan;
      this.sentPan = { x: pan?.x ?? 0, y: pan?.y ?? 0 };
    }
    const { holeFocus, ...rest } = inputs;
    this.send('setInputs', [
      { ...rest, holeFocus: Boolean(holeFocus), pan: pan !== null },
    ]);
  }

  public setNodes(
    buttons: readonly SceneNode[],
    labels: readonly SceneNode[],
    figures: readonly SceneNode[] = [],
  ): void {
    this.give('buttons', buttons);
    this.give('labels', labels);
    this.give('figures', figures);
    this.send('setNodes', [buttons.length, labels.length, figures.length]);
  }

  public setHoleMark(node: SceneNode | null): void {
    this.give('hole', node ? [node] : []);
    this.send('setHoleMark', [node !== null]);
  }

  public setLines(lines: readonly SceneNode[]): void {
    if (!isSameList(lines, this.nodes.lines)) {
      this.give('lines', lines);
      this.send('setLines', [lines.length]);
    }
  }

  public measureLabels(): void {
    this.send('measureLabels', [
      this.nodes.labels.map((label) => ({
        w: label.offsetWidth,
        h: label.offsetHeight,
      })),
    ]);
  }

  public setLayout(layout: SceneLayout): void {
    this.layout = layout;
    this.send('setLayout', [layout]);
  }

  public resize(width: number, height: number, dpr: number): void {
    this.w = width;
    this.h = height;
    this.dpr = dpr;
    this.send('resize', [width, height, dpr]);
  }

  public setViewportArea(viewportArea: number): void {
    this.send('setViewportArea', [viewportArea]);
  }

  public setVisible(isVisible: boolean): void {
    this.send('setVisible', [isVisible]);
  }

  public setPointer(clientX: number | null, clientY = 0): void {
    this.send('setPointer', [clientX, clientY]);
  }

  public grab(clientX: number, clientY: number): boolean {
    if (!this.state.turnable || this.state.reduced) {
      return false;
    }
    this.grip = { x: clientX, y: clientY, d: 0 };
    this.send('grab', [clientX, clientY]);
    return true;
  }

  public turn(clientX: number, clientY: number): void {
    const grip = this.grip;
    if (grip) {
      grip.d += Math.abs(clientX - grip.x) + Math.abs(clientY - grip.y);
      grip.x = clientX;
      grip.y = clientY;
      this.send('turn', [clientX, clientY]);
    }
  }

  public release(): boolean {
    const grip = this.grip;
    if (!grip) {
      return false;
    }
    this.grip = null;
    this.send('release', []);
    return grip.d > SCENE_CONFIG.gestures.dragPx;
  }

  public holdZoom(clientX: number, clientY: number): boolean {
    const isOnCanvas =
      clientOnCanvas(clientX, clientY, this.layout?.canvas, this.dpr) !== null;
    if (isOnCanvas) {
      this.grip = null;
    }
    this.send('holdZoom', [clientX, clientY]);
    return isOnCanvas;
  }

  public stretchZoom(clientX: number, clientY: number, ratio: number): void {
    this.send('stretchZoom', [clientX, clientY, ratio]);
  }

  public releaseZoom(): void {
    this.send('releaseZoom', []);
  }

  public lookCloser(): boolean {
    const canLook = canLookCloser(this.state) && this.w > 0 && this.h > 0;
    this.send('lookCloser', []);
    return canLook;
  }

  public request(): void {
    const pan = this.pan;
    if (pan && (pan.x !== this.sentPan.x || pan.y !== this.sentPan.y)) {
      this.send('panBy', [pan.x - this.sentPan.x, pan.y - this.sentPan.y]);
      this.sentPan = { x: pan.x, y: pan.y };
    }
    this.send('request', []);
  }

  public stop(): void {
    this.send('stop', []);
  }

  private give(group: NodeGroup, nodes: readonly SceneNode[]): void {
    this.nodes[group] = nodes;
    this.generations[group]++;
  }

  private send<K extends keyof SceneWorkerCommands>(
    name: K,
    args: Parameters<SceneWorkerCommands[K]>,
  ): void {
    this.port.post({
      kind: 'call',
      name,
      args,
      at: this.host.now(),
      hidden: this.host.hidden(),
    } as ToSceneWorker);
  }

  private take(message: FromSceneWorker): void {
    this.keep(message);
    this.cancelShow ??= this.host.frame(() => {
      this.cancelShow = null;
      this.show();
    });
  }

  private keep(frame: SceneWorkerFrame): void {
    if (frame.matter) {
      this.matter?.close();
      this.matter = frame.matter;
    }
    if (frame.sky) {
      this.sky?.close();
      this.sky = frame.sky;
    }
    for (const write of frame.writes) {
      if (frame.generations[write[0]] === this.generations[write[0]]) {
        this.writes.push(write);
      }
    }
    const pan = this.pan;
    if (pan && frame.pan) {
      pan.by(frame.pan.x - pan.x, frame.pan.y - pan.y);
      this.sentPan = { x: frame.pan.x, y: frame.pan.y };
    }
  }

  private show(): void {
    for (const [group, index, key, value] of this.writes.splice(0)) {
      const node = this.nodes[group][index];
      if (!node) {
        continue;
      }
      if (key.startsWith('@')) {
        node.setAttribute(key.slice(1), value);
      } else if (key === 'tabIndex') {
        node.tabIndex = Number(value);
      } else {
        node.style[key as keyof SceneNode['style']] = value;
      }
    }
    this.paint(this.canvases.matter, this.matter);
    this.paint(this.canvases.sky, this.sky);
    this.matter = null;
    this.sky = null;
  }

  private paint(shown: ShownCanvas | null, bitmap: ImageBitmap | null): void {
    if (!shown || !bitmap) {
      return;
    }
    const { canvas, context } = shown;
    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
    }
    context.transferFromImageBitmap(bitmap);
  }
}
