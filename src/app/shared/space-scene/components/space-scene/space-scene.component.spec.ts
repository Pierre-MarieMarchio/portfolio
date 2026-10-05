import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { DisplayFormat } from '@app/core/models';
import { DisplayFormatService, FormatCodeService } from '@app/core/services';
import { recordingContext } from '@testing/doubles/recording-canvas.double';
import { pointer } from '@testing/fixtures/pointer.fixture';
import { SkyPanMotion } from '../../engine/motions/sky-pan.motion';
import { SpaceSceneEngine } from '../../engine/space-scene.engine';
import type { SceneLook, StartLook } from '../../models/scene-look.model';
import {
  SCENE_SURROUNDINGS,
  ScenePanel,
} from '../../ports/scene-surroundings.port';
import * as holeFocus from '../../rules/hole-focus.rules';
import { loadSkyLook, loadTouchLook } from '../../services/scene-look.service';
import { loadHoleFocus, SpaceSceneComponent } from './space-scene.component';

const lookDouble = (pan: SkyPanMotion | null) => {
  const stop = vi.fn();
  const start = vi.fn<StartLook>((): SceneLook => ({ pan, stop }));
  return { start, stop };
};

const mount = async (
  start: DisplayFormat = 'desktop',
  panels: () => readonly ScenePanel[] = () => [],
) => {
  const code = signal<typeof holeFocus | null>(null);
  const touchCode = signal<StartLook | null>(null);
  const deskCode = signal<StartLook | null>(null);
  const format = signal<DisplayFormat>(start);
  const load = vi.fn((formats: readonly DisplayFormat[]) => {
    if (formats.includes('desktop')) {
      return deskCode.asReadonly();
    }
    return formats.includes('tablet')
      ? touchCode.asReadonly()
      : code.asReadonly();
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() =>
    recordingContext('canvas', []),
  );
  const given = vi.spyOn(SpaceSceneEngine.prototype, 'setInputs');
  TestBed.configureTestingModule({
    imports: [SpaceSceneComponent],
    providers: [
      { provide: FormatCodeService, useValue: { load } },
      { provide: DisplayFormatService, useValue: { format } },
      {
        provide: SCENE_SURROUNDINGS,
        useValue: { panels, lines: () => [] },
      },
    ],
  });
  const fixture = TestBed.createComponent(SpaceSceneComponent);
  await fixture.whenStable();
  const lastHoleFocus = () => given.mock.calls.at(-1)?.[0].holeFocus;
  const lastPan = () => given.mock.calls.at(-1)?.[0].pan ?? null;
  const touch = lookDouble(null);
  const desk = lookDouble(new SkyPanMotion());
  const arrive = async (): Promise<void> => {
    touchCode.set(touch.start);
    deskCode.set(desk.start);
    await fixture.whenStable();
  };
  return {
    fixture,
    code,
    format,
    load,
    given,
    touch,
    desk,
    arrive,
    lastHoleFocus,
    lastPan,
  };
};

const transitionEnd = (propertyName: string): Event =>
  new TransitionEvent('transitionend', { propertyName });

const deferredFrames = () => {
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((fn) => {
    frames.push(fn);
    return frames.length;
  });
  return () => {
    for (const frame of frames.splice(0)) {
      frame(0);
    }
  };
};

describe('SpaceSceneComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks for the framing code of the phone and for the gestures of each format through the format code loader, and gives the framing code to its engine once it arrives', async () => {
    const { fixture, code, load, lastHoleFocus, lastPan } = await mount();

    expect(load).toHaveBeenCalledWith(['phone'], loadHoleFocus);
    expect(load).toHaveBeenCalledWith(['phone', 'tablet'], loadTouchLook);
    expect(load).toHaveBeenCalledWith(['desktop'], loadSkyLook);
    expect(lastHoleFocus()).toBeNull();
    expect(lastPan()).toBeNull();

    code.set(holeFocus);
    await fixture.whenStable();

    expect(lastHoleFocus()).toBe(holeFocus);
  }, 60_000);

  it.each([
    { format: 'desktop', gestures: 'the wheel and the middle button' },
    { format: 'phone', gestures: 'the pinch and the double tap' },
    { format: 'tablet', gestures: 'the pinch and the double tap' },
  ] as const)(
    'starts $gestures alone on a $format once their code arrives, and gives their pan to the engine',
    async ({ format }) => {
      const { touch, desk, arrive, lastPan } = await mount(format);
      const isDesk = format === 'desktop';

      await arrive();

      expect((isDesk ? desk : touch).start).toHaveBeenCalledTimes(1);
      expect((isDesk ? touch : desk).start).not.toHaveBeenCalled();
      expect(lastPan()).toEqual(isDesk ? expect.any(SkyPanMotion) : null);
    },
  );

  it('starts nothing before the code arrives', async () => {
    const { fixture, touch, desk, format } = await mount('phone');

    format.set('desktop');
    await fixture.whenStable();

    expect(touch.start).not.toHaveBeenCalled();
    expect(desk.start).not.toHaveBeenCalled();
  });

  it('swaps the gestures when the format changes, and stops them when the scene goes', async () => {
    const { fixture, touch, desk, format, arrive, lastPan } = await mount();
    await arrive();

    format.set('tablet');
    await fixture.whenStable();
    expect(desk.stop).toHaveBeenCalledTimes(1);
    expect(touch.start).toHaveBeenCalledTimes(1);
    expect(lastPan()).toBeNull();

    format.set('desktop');
    await fixture.whenStable();
    expect(touch.stop).toHaveBeenCalledTimes(1);
    expect(desk.start).toHaveBeenCalledTimes(2);
    expect(lastPan()).toBeInstanceOf(SkyPanMotion);

    fixture.destroy();
    expect(desk.stop).toHaveBeenCalledTimes(2);
  });

  it('lays the panels out once per frame, however many transitions end in it', async () => {
    const flush = deferredFrames();
    await mount();
    const laid = vi.spyOn(SpaceSceneEngine.prototype, 'setLayout');

    for (const property of ['transform', 'opacity', 'translate', 'height']) {
      globalThis.dispatchEvent(transitionEnd(property));
    }
    expect(laid).not.toHaveBeenCalled();
    flush();

    expect(laid).toHaveBeenCalledTimes(1);
  });

  it('lays a panel out where its entrance will leave it, then lets the entrance carry on', async () => {
    const flush = deferredFrames();
    const entrance = { currentTime: 300 as CSSNumberish | null };
    const element = document.createElement('div');
    element.getAnimations = () =>
      [
        {
          get currentTime() {
            return entrance.currentTime;
          },
          set currentTime(value) {
            entrance.currentTime = value;
          },
          effect: { getComputedTiming: () => ({ endTime: 1000 }) },
        },
      ] as unknown as Animation[];
    element.getBoundingClientRect = () =>
      new DOMRect(0, entrance.currentTime === 1000 ? 6 : 18, 100, 44);
    await mount('phone', () => [{ element, role: 'chrome' }]);
    const laid = vi.spyOn(SpaceSceneEngine.prototype, 'setLayout');

    globalThis.dispatchEvent(transitionEnd('height'));
    flush();

    expect(laid.mock.calls[0]?.[0].panels[0]?.top).toBe(6);
    expect(entrance.currentTime).toBe(300);
  });

  it('does not lay the panels out again when only a colour ends its transition', async () => {
    const flush = deferredFrames();
    await mount();
    const laid = vi.spyOn(SpaceSceneEngine.prototype, 'setLayout');

    globalThis.dispatchEvent(transitionEnd('background-color'));
    globalThis.dispatchEvent(transitionEnd('box-shadow'));
    flush();

    expect(laid).not.toHaveBeenCalled();
  });

  it('follows a mouse pointer over the scene, not a finger', async () => {
    const followed = vi.spyOn(SpaceSceneEngine.prototype, 'setPointer');
    await mount();

    globalThis.dispatchEvent(
      pointer('pointermove', { x: 120, y: 80, kind: 'mouse' }),
    );
    globalThis.dispatchEvent(
      pointer('pointermove', { x: 60, y: 40, kind: 'touch' }),
    );

    expect(followed.mock.calls).toEqual([[120, 80]]);
  });
});
