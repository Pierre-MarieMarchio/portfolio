import type { SpaceSceneEngine } from '../engine/space-scene.engine';

export type SceneEngine = Pick<
  SpaceSceneEngine,
  | 'setInputs'
  | 'setNodes'
  | 'setHoleMark'
  | 'setLines'
  | 'measureLabels'
  | 'setLayout'
  | 'resize'
  | 'setViewportArea'
  | 'setVisible'
  | 'setPointer'
  | 'grab'
  | 'turn'
  | 'release'
  | 'grabZoom'
  | 'stretchZoom'
  | 'releaseZoom'
  | 'lookCloser'
  | 'request'
  | 'stop'
>;
