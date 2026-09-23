export type { ObjectView } from './engine/object-engine';

/** A body of the system, as the object names it. */
export interface ObjectBody {
  readonly title: string;
  /** The name where room is short: the planet's label. */
  readonly short: string;
}
