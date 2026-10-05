import { twoDigits } from '@app/core/helpers';
import {
  CameraFraming,
  RESTING_DIRECTION,
  SceneBody,
  SceneDirection,
} from '@shared/space-scene/models';
import { ObservatoryView, Planet } from '../models';

export interface ObservatoryScene {
  readonly view: ObservatoryView;
  readonly sheet: string | null;
  readonly chapter: number;
  readonly part: number;
  readonly preview: string | null;
  readonly hovered: string | null;
  readonly selected: string | null;
  readonly revealed: boolean;
  readonly phone: boolean;
  readonly designated: string | null;
}

const DIRECTION_OF_VIEW: Record<
  ObservatoryView,
  (scene: ObservatoryScene, shared: SceneDirection) => SceneDirection
> = {
  home: homeDirection,
  index: indexDirection,
  sheet: sheetDirection,
  about: aboutDirection,
  'not-found': notFoundDirection,
};

export function sceneDirectionOf(scene: ObservatoryScene): SceneDirection {
  return DIRECTION_OF_VIEW[scene.view](scene, {
    ...RESTING_DIRECTION,
    emphasised: scene.hovered,
    litFigure: scene.part,
    landed: scene.revealed,
  });
}

function indexDirection(
  scene: ObservatoryScene,
  shared: SceneDirection,
): SceneDirection {
  return {
    ...shared,
    framing: { kind: 'overview' },
    presence: 'shown',
    labels: 'tags',
    ringed: scene.selected,
  };
}

function sheetDirection(
  scene: ObservatoryScene,
  shared: SceneDirection,
): SceneDirection {
  return {
    ...shared,
    framing: { kind: 'approach', body: scene.sheet ?? '', step: scene.chapter },
    presence: 'shown',
    turnable: false,
  };
}

function aboutDirection(
  _scene: ObservatoryScene,
  shared: SceneDirection,
): SceneDirection {
  return {
    ...shared,
    framing: { kind: 'aside' },
    presence: 'hidden',
    labels: 'none',
    figuresShown: true,
  };
}

function notFoundDirection(
  _scene: ObservatoryScene,
  shared: SceneDirection,
): SceneDirection {
  return {
    ...shared,
    framing: { kind: 'overview' },
    presence: 'hidden',
    labels: 'none',
    turnable: false,
  };
}

function homeDirection(
  scene: ObservatoryScene,
  shared: SceneDirection,
): SceneDirection {
  const isNamedByRule = scene.phone && scene.preview === null;
  const designated = isNamedByRule ? scene.designated : null;
  return {
    ...shared,
    framing: homeFraming(scene.preview),
    presence: scene.revealed ? 'shown' : 'held',
    labels: isNamedByRule ? 'none' : 'names',
    emphasised: scene.hovered ?? designated,
    aimed: designated ?? scene.hovered,
  };
}

function homeFraming(preview: string | null): CameraFraming {
  return preview === null
    ? { kind: 'rest' }
    : { kind: 'close-up', body: preview };
}

export function sceneBodiesOf(
  planets: readonly Planet[],
  view: ObservatoryView,
  featured: number,
): SceneBody[] {
  return planets.map((planet, rank) => ({
    id: planet.slug,
    label: view === 'index' ? twoDigits(rank + 1) : planet.short,
    faint: rank >= featured,
  }));
}
