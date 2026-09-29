import type { SceneInputs, SkyFigures } from './scene.model';
import type { SceneLayout } from './scene-layout.model';

export type NodeGroup = 'buttons' | 'labels' | 'figures' | 'lines' | 'hole';

export type NodeKey =
  | 'transform'
  | 'opacity'
  | 'pointerEvents'
  | 'zIndex'
  | 'cssText'
  | 'tabIndex'
  | `@${string}`;

export type NodeWrite = readonly [
  group: NodeGroup,
  index: number,
  key: NodeKey,
  value: string,
];

export interface LabelSize {
  readonly w: number;
  readonly h: number;
}

export type WorkerInputs = Omit<SceneInputs, 'holeFocus' | 'pan'> & {
  readonly holeFocus: boolean;
  readonly pan: boolean;
};

export interface SceneWorkerCommands {
  readonly setInputs: (inputs: WorkerInputs) => void;
  readonly setNodes: (buttons: number, labels: number, figures: number) => void;
  readonly setHoleMark: (isMarked: boolean) => void;
  readonly setLines: (count: number) => void;
  readonly measureLabels: (sizes: readonly LabelSize[]) => void;
  readonly setLayout: (layout: SceneLayout) => void;
  readonly resize: (width: number, height: number, dpr: number) => void;
  readonly setViewportArea: (viewportArea: number) => void;
  readonly setVisible: (isVisible: boolean) => void;
  readonly setPointer: (clientX: number | null, clientY: number) => void;
  readonly grab: (clientX: number, clientY: number) => void;
  readonly turn: (clientX: number, clientY: number) => void;
  readonly release: () => void;
  readonly holdZoom: (clientX: number, clientY: number) => void;
  readonly stretchZoom: (
    clientX: number,
    clientY: number,
    ratio: number,
  ) => void;
  readonly releaseZoom: () => void;
  readonly lookCloser: () => void;
  readonly panBy: (dx: number, dy: number) => void;
  readonly request: () => void;
  readonly stop: () => void;
}

export const PASSED_COMMANDS = [
  'setLayout',
  'setViewportArea',
  'setVisible',
  'setPointer',
  'grab',
  'turn',
  'release',
  'holdZoom',
  'stretchZoom',
  'releaseZoom',
  'lookCloser',
  'request',
  'stop',
] as const satisfies readonly (keyof SceneWorkerCommands)[];

export type PassedCommand = (typeof PASSED_COMMANDS)[number];

export type SceneWorkerCall = {
  [K in keyof SceneWorkerCommands]: {
    readonly kind: 'call';
    readonly name: K;
    readonly args: Parameters<SceneWorkerCommands[K]>;
    readonly at: number;
    readonly hidden: boolean;
  };
}[keyof SceneWorkerCommands];

export interface SceneWorkerBoot {
  readonly kind: 'boot';
  readonly density: number;
  readonly figures: SkyFigures;
  readonly ink: string;
  readonly accent: string;
  readonly viewportArea: number;
  readonly timeOrigin: number;
}

export type ToSceneWorker = SceneWorkerBoot | SceneWorkerCall;

export interface SceneWorkerFrame {
  readonly kind: 'frame';
  readonly matter: ImageBitmap | null;
  readonly sky: ImageBitmap | null;
  readonly writes: readonly NodeWrite[];
  readonly generations: Readonly<Record<NodeGroup, number>>;
  readonly pan: { readonly x: number; readonly y: number } | null;
}

export type FromSceneWorker = SceneWorkerFrame;
