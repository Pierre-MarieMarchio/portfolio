import {
  RESTING_DIRECTION,
  SceneDirection,
  SceneInputs,
} from '../models/scene.model';
import { sceneState } from './scene-state.rules';

const inputs = (
  direction: Partial<SceneDirection> = {},
  overrides: Partial<SceneInputs> = {},
): SceneInputs => ({
  bodies: [
    { id: 'inner', label: 'Inner', faint: false },
    { id: 'middle', label: 'Middle', faint: false },
    { id: 'outer', label: 'Outer', faint: true },
  ],
  direction: { ...RESTING_DIRECTION, ...direction },
  figureNames: ['First', 'Second'],
  paused: false,
  reduced: false,
  ...overrides,
});

describe('sceneState', () => {
  it('reads each body by its rank on the orbits', () => {
    const state = sceneState(inputs({ emphasised: 'middle', ringed: 'outer' }));

    expect(state).toMatchObject({ count: 3, emphasised: 1, ringed: 2 });
  });

  it('reads a body it does not know as none', () => {
    const state = sceneState(inputs({ emphasised: 'gone', ringed: 'gone' }));

    expect(state).toMatchObject({ emphasised: -1, ringed: -1 });
  });

  it('makes the bodies faint from the first faint one outwards', () => {
    expect(sceneState(inputs()).faintFrom).toBe(2);
    expect(
      sceneState(
        inputs({}, { bodies: [{ id: 'only', label: 'Only', faint: false }] }),
      ).faintFrom,
    ).toBe(1);
  });

  it('closes up on a known body, and rests when it does not know it', () => {
    expect(
      sceneState(inputs({ framing: { kind: 'close-up', body: 'middle' } })),
    ).toMatchObject({ framing: 'close-up', framed: 1 });
    expect(
      sceneState(inputs({ framing: { kind: 'close-up', body: 'gone' } })),
    ).toMatchObject({ framing: 'rest', framed: -1 });
  });

  it('approaches a body step by step', () => {
    expect(
      sceneState(
        inputs({ framing: { kind: 'approach', body: 'outer', step: 3 } }),
      ),
    ).toMatchObject({ framing: 'approach', framed: 2, step: 3 });
  });

  it('holds the bodies back until shown, unless motion is reduced', () => {
    expect(sceneState(inputs({ presence: 'held' })).marksShown).toBe(false);
    expect(
      sceneState(inputs({ presence: 'held' }, { reduced: true })).marksShown,
    ).toBe(true);
    expect(sceneState(inputs({ presence: 'shown' })).marksShown).toBe(true);
    expect(
      sceneState(inputs({ presence: 'hidden' }, { reduced: true })).marksShown,
    ).toBe(false);
  });

  it('tags the bodies only when asked to', () => {
    expect(sceneState(inputs({ labels: 'tags' })).isTagged).toBe(true);
    expect(sceneState(inputs({ labels: 'names' })).isTagged).toBe(false);
    expect(sceneState(inputs({ labels: 'none' })).isTagged).toBe(false);
  });
});
