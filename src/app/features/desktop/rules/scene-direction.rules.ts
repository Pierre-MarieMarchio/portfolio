import { twoDigits } from '@app/core/helpers';
import {
  CameraFraming,
  RESTING_DIRECTION,
  SceneBody,
  SceneDirection,
} from '@shared/space-scene/models';
import { DesktopView, Planet } from '../models';

export interface DesktopScene {
  readonly view: DesktopView;
  readonly sheet: string | null;
  readonly chapter: number;
  readonly part: number;
  readonly preview: string | null;
  readonly hovered: string | null;
  readonly selected: string | null;
  readonly revealed: boolean;
}

export function sceneDirectionOf(scene: DesktopScene): SceneDirection {
  const shared = {
    ...RESTING_DIRECTION,
    emphasised: scene.hovered,
    litFigure: scene.part,
  };
  switch (scene.view) {
    case 'home': {
      return {
        ...shared,
        framing: homeFraming(scene.preview),
        presence: scene.revealed ? 'shown' : 'held',
      };
    }
    case 'index': {
      return {
        ...shared,
        framing: { kind: 'overview' },
        presence: 'shown',
        labels: 'tags',
        ringed: scene.selected,
      };
    }
    case 'sheet': {
      return {
        ...shared,
        framing: {
          kind: 'approach',
          body: scene.sheet ?? '',
          step: scene.chapter,
        },
        presence: 'shown',
        turnable: false,
      };
    }
    case 'about': {
      return {
        ...shared,
        framing: { kind: 'aside' },
        presence: 'hidden',
        labels: 'none',
        figuresShown: true,
      };
    }
    case 'not-found': {
      return {
        ...shared,
        framing: { kind: 'overview' },
        presence: 'hidden',
        labels: 'none',
        turnable: false,
      };
    }
  }
}

function homeFraming(preview: string | null): CameraFraming {
  return preview === null
    ? { kind: 'rest' }
    : { kind: 'close-up', body: preview };
}

export function sceneBodiesOf(
  planets: readonly Planet[],
  view: DesktopView,
  featured: number,
): SceneBody[] {
  return planets.map((planet, rank) => ({
    id: planet.slug,
    label: view === 'index' ? twoDigits(rank + 1) : planet.short,
    faint: rank >= featured,
  }));
}
