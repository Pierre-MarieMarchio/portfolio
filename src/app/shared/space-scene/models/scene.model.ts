import type { DisplayFormat } from '@app/core/models';
import type { SkyPan } from '../engine/motions/zoom.motion';
import type { HoleFocusRules } from '../rules/camera/framing/framing.rules';

export type CameraFraming =
  | { readonly kind: 'rest' }
  | { readonly kind: 'overview' }
  | { readonly kind: 'aside' }
  | { readonly kind: 'close-up'; readonly body: string }
  | { readonly kind: 'approach'; readonly body: string; readonly step: number };

export type FramingKind = CameraFraming['kind'];

export type BodiesPresence = 'shown' | 'held' | 'hidden';

export type LabelStyle = 'names' | 'tags' | 'none';

export type SkyFigures = 'constellations' | 'comets';

export interface SceneBody {
  readonly id: string;
  readonly label: string;
  readonly faint: boolean;
}

export interface SceneDirection {
  readonly framing: CameraFraming;
  readonly presence: BodiesPresence;
  readonly labels: LabelStyle;
  readonly emphasised: string | null;
  readonly aimed: string | null;
  readonly ringed: string | null;
  readonly turnable: boolean;
  readonly figuresShown: boolean;
  readonly litFigure: number;
  readonly landed: boolean;
}

export const RESTING_DIRECTION: SceneDirection = {
  framing: { kind: 'rest' },
  presence: 'held',
  labels: 'names',
  emphasised: null,
  aimed: null,
  ringed: null,
  turnable: true,
  figuresShown: false,
  litFigure: 0,
  landed: false,
};

export interface SceneInputs {
  readonly bodies: readonly SceneBody[];
  readonly direction: SceneDirection;
  readonly figureNames: readonly string[];
  readonly paused: boolean;
  readonly reduced: boolean;
  readonly format?: DisplayFormat;
  readonly holeFocus?: HoleFocusRules | null;
  readonly pan?: SkyPan | null;
}
