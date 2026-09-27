import type {
  ClickAbsorber,
  LookableScene,
  WindowEvents,
} from '../models/scene-look.model';
import { SkyLookTracker } from '../trackers/sky-look.tracker';
import { ZoomGestureTracker } from '../trackers/zoom-gesture.tracker';
import { loadSkyLook, loadTouchLook } from './scene-look.service';

const scene: LookableScene = {
  holdZoom: () => true,
  stretchZoom: () => {},
  releaseZoom: () => {},
  lookCloser: () => true,
  request: () => {},
};

const stopListening = (): void => {};

const events: WindowEvents = { onWindow: () => stopListening };

const absorber: ClickAbsorber = { absorbNext: () => {}, stop: () => {} };

describe('scene look loaders', () => {
  it('start the pinch and the double tap from the code of the fingers', async () => {
    const start = await loadTouchLook();
    const look = start(scene, events, absorber);

    expect(look).toBeInstanceOf(ZoomGestureTracker);
    expect(look.pan).toBeNull();
    look.stop();
  });

  it('start the wheel and the middle button from the code of the desktop, with its pan', async () => {
    const start = await loadSkyLook();
    const look = start(scene, events, absorber);

    expect(look).toBeInstanceOf(SkyLookTracker);
    expect(look.pan).not.toBeNull();
    look.stop();
  });
});
