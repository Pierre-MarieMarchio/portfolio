export type { SceneView } from '../engine/space-scene.engine';

/** A body of the system, as the object names it. */
export interface SceneBody {
  readonly title: string;
  /** The name where room is short: the planet's label. */
  readonly short: string;
}
