import { NO_STATE, SceneState } from '../scene-state.rules';
import {
  anchorKeeping,
  canLookCloser,
  clampZoom,
  isSameFraming,
  unzoomedAt,
  ZOOM_MAX,
  ZOOM_MIN,
  zoomedAt,
} from './zoom.rules';

const WIDTH = 400;

const stateOf = (change: Partial<SceneState>): SceneState => ({
  ...NO_STATE,
  ...change,
});

describe('zoom rules', () => {
  it('holds the factor between the view itself and three times closer', () => {
    expect(clampZoom(0.4)).toBe(ZOOM_MIN);
    expect(clampZoom(1.7)).toBeCloseTo(1.7, 12);
    expect(clampZoom(6)).toBe(ZOOM_MAX);
  });

  it('leaves every point where it is at the factor of the view', () => {
    expect(zoomedAt(123.4, 250, 1)).toBeCloseTo(123.4, 12);
  });

  it('keeps the anchor fixed and takes a point back where it was', () => {
    expect(zoomedAt(250, 250, 2.5)).toBe(250);
    expect(zoomedAt(150, 250, 2)).toBe(50);
    expect(unzoomedAt(zoomedAt(150, 250, 2.2), 250, 2.2)).toBeCloseTo(150, 9);
  });

  it('keeps the point under the fingers when they spread', () => {
    const anchor = anchorKeeping(120, 120, 2, WIDTH);
    expect(zoomedAt(120, anchor, 2)).toBeCloseTo(120, 9);
  });

  it('follows the fingers when they move while they spread', () => {
    const anchor = anchorKeeping(120, 150, 2, WIDTH);
    expect(zoomedAt(120, anchor, 2)).toBeCloseTo(150, 9);
  });

  it('never slides the sky past the edge of the canvas', () => {
    const factor = 2;
    const anchor = anchorKeeping(10, 300, factor, WIDTH);
    expect(zoomedAt(0, anchor, factor)).toBeLessThanOrEqual(0);
    expect(zoomedAt(WIDTH, anchor, factor)).toBeGreaterThanOrEqual(WIDTH);
    expect(anchor).toBeGreaterThanOrEqual(0);
    expect(anchor).toBeLessThanOrEqual(WIDTH);
  });

  it.each<readonly [string, boolean, Partial<SceneState>, Partial<SceneState>]>(
    [
      [
        'the same view with another planet emphasised',
        true,
        { framing: 'rest' },
        { emphasised: 2 },
      ],
      ['a new view', false, { framing: 'rest' }, { framing: 'overview' }],
      [
        'a new chapter',
        false,
        { framing: 'approach', framed: 1, step: 0 },
        { framing: 'approach', framed: 1, step: 1 },
      ],
      [
        'a new section',
        false,
        { framing: 'aside', litFigure: 0 },
        { framing: 'aside', litFigure: 1 },
      ],
      [
        'a new preview',
        false,
        { framing: 'close-up', framed: 0 },
        { framing: 'close-up', framed: 2 },
      ],
    ],
  )('takes %s for the same framing: %s', (_, isSame, from, to) => {
    expect(isSameFraming(stateOf(from), stateOf(to))).toBe(isSame);
  });

  it('looks closer on a double tap only at the rest of the home', () => {
    expect(canLookCloser(stateOf({ framing: 'rest' }))).toBe(true);
    expect(canLookCloser(stateOf({ framing: 'close-up', framed: 0 }))).toBe(
      false,
    );
    expect(canLookCloser(stateOf({ framing: 'overview' }))).toBe(false);
  });
});
