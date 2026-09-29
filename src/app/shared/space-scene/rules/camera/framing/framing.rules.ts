import type { Frame } from '../camera-frames.rules';
import type { SceneLayout } from '../../../models/scene-layout.model';
import type { SceneState } from '../../scene-state.rules';
import {
  aimOf,
  framingIn,
  FramingScene,
  skyRoomsOf,
  wholeInSky,
} from './body-framing.rules';
import {
  hasBand,
  holeHeldLeftOf,
  HoleView,
  layoutInRoom,
  isHoleInRoom,
  mirroredFrame,
  mirrorTurnStep,
  planetTurnOf,
  RoomSide,
  roomAfter,
  sideOf,
  skyOfRoom,
} from '../../rooms/window-room.rules';

export type { HoleFocusRules, FramingScene } from './body-framing.rules';
export { framingScene } from './body-framing.rules';

export const framingFor = (
  state: SceneState,
  scene: FramingScene,
  dt = 0,
): Frame => {
  const frame = viewFraming(state, scene, dt);
  const dims = scene.dims;
  const rules = scene.holeFocus;
  if (!state.phone || !dims || !rules) {
    return frame;
  }
  const focused = rules.holeInFocus(
    frame,
    {
      dims,
      rooms: skyRoomsOf(scene, rules),
      isCloseUp: state.framing === 'close-up',
      aim: aimOf(state, scene),
    },
    scene.focusMemo,
  );
  scene.focusMemo = focused.memo;
  return focused.frame;
};

const viewFraming = (
  state: SceneState,
  scene: FramingScene,
  dt: number,
): Frame => {
  scene.room = roomAfter(scene.room, scene.layout);
  const { layout, dims } = scene;
  const room = scene.room.room;
  if (state.phone || !layout || !room || !dims || hasBand(layout)) {
    return framingIn(state, scene, layout);
  }
  const side = sideOf(room, layout.viewport.width);
  const view = { dims, framing: state.framing };
  const seen = framingOnSide(state, scene, {
    side,
    layout: layoutInRoom(layout, room),
    view,
    dt,
  });
  return side !== 'middle' && isHoleInRoom(seen, room, view)
    ? seen
    : wholeInSky(seen, scene, skyOfRoom(layout, room));
};

interface OnSideContext {
  readonly side: RoomSide;
  readonly layout: SceneLayout;
  readonly view: HoleView;
  readonly dt: number;
}

const framingOnSide = (
  state: SceneState,
  scene: FramingScene,
  { side, layout, view, dt }: OnSideContext,
): Frame => {
  if (state.framing === 'rest' || side === 'middle') {
    return framingIn(state, scene, layout);
  }
  const seen = holeHeldLeftOf(framingIn(state, scene, layout), layout, view);
  const mirrored =
    side === 'right' ? mirroredFrame(seen, planetTurnOf(state, scene)) : seen;
  scene.turn = mirrorTurnStep(scene.turn, mirrored, dt);
  return { ...mirrored, i: scene.turn.i, az: scene.turn.az };
};
