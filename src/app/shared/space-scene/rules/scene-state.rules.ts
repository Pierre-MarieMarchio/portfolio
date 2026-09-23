import type {
  CameraFraming,
  FramingKind,
  SceneBody,
  SceneInputs,
} from '../models/scene.model';

export interface SceneState {
  readonly count: number;
  readonly faintFrom: number;
  readonly framing: FramingKind;
  readonly framed: number;
  readonly step: number;
  readonly emphasised: number;
  readonly ringed: number;
  readonly marksShown: boolean;
  readonly isTagged: boolean;
  readonly turnable: boolean;
  readonly figuresShown: boolean;
  readonly litFigure: number;
  readonly figureNames: readonly string[];
  readonly paused: boolean;
  readonly reduced: boolean;
}

export const NO_STATE: SceneState = {
  count: 0,
  faintFrom: 0,
  framing: 'rest',
  framed: -1,
  step: 0,
  emphasised: -1,
  ringed: -1,
  marksShown: false,
  isTagged: false,
  turnable: true,
  figuresShown: false,
  litFigure: 0,
  figureNames: [],
  paused: false,
  reduced: false,
};

const rankOf = (bodies: readonly SceneBody[], id: string | null): number =>
  id === null ? -1 : bodies.findIndex((body) => body.id === id);

const faintFrom = (bodies: readonly SceneBody[]): number => {
  const first = bodies.findIndex((body) => body.faint);
  return first < 0 ? bodies.length : first;
};

const framed = (
  bodies: readonly SceneBody[],
  framing: CameraFraming,
): { readonly kind: FramingKind; readonly rank: number } => {
  switch (framing.kind) {
    case 'close-up': {
      const rank = rankOf(bodies, framing.body);
      return rank < 0 ? { kind: 'rest', rank } : { kind: 'close-up', rank };
    }
    case 'approach': {
      return { kind: 'approach', rank: rankOf(bodies, framing.body) };
    }
    default: {
      return { kind: framing.kind, rank: -1 };
    }
  }
};

export const sceneState = ({
  bodies,
  direction,
  figureNames,
  paused,
  reduced,
}: SceneInputs): SceneState => {
  const framing = framed(bodies, direction.framing);
  const presence = direction.presence;
  return {
    count: bodies.length,
    faintFrom: faintFrom(bodies),
    framing: framing.kind,
    framed: framing.rank,
    step: direction.framing.kind === 'approach' ? direction.framing.step : 0,
    emphasised: rankOf(bodies, direction.emphasised),
    ringed: rankOf(bodies, direction.ringed),
    marksShown: presence === 'shown' || (presence === 'held' && reduced),
    isTagged: direction.labels === 'tags',
    turnable: direction.turnable,
    figuresShown: direction.figuresShown,
    litFigure: direction.litFigure,
    figureNames,
    paused,
    reduced,
  };
};

export const isCloseUp = (state: SceneState): boolean =>
  state.framing === 'close-up';

export const isAtRest = (state: SceneState): boolean =>
  state.framing === 'rest' || state.framing === 'close-up';
