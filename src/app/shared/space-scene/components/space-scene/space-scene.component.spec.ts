import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { DisplayFormat } from '@app/core/models';
import { DisplayFormatService, FormatCodeService } from '@app/core/services';
import { recordingContext } from '@testing/doubles/recording-canvas.double';
import { SkyPanMotion } from '../../engine/motions/sky-pan.motion';
import { SpaceSceneEngine } from '../../engine/space-scene.engine';
import type { SceneLook, StartLook } from '../../models/scene-look.model';
import { SCENE_SURROUNDINGS } from '../../ports/scene-surroundings.port';
import * as holeFocus from '../../rules/hole-focus.rules';
import { loadSkyLook, loadTouchLook } from '../../services/scene-look.service';
import { loadHoleFocus, SpaceSceneComponent } from './space-scene.component';

const lookDouble = (pan: SkyPanMotion | null) => {
  const stop = vi.fn();
  const start = vi.fn<StartLook>((): SceneLook => ({ pan, stop }));
  return { start, stop };
};

const mount = async (start: DisplayFormat = 'desktop') => {
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
        useValue: { panels: () => [], lines: () => [] },
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

describe('SpaceSceneComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('asks for the framing code of the phone through the format code loader', async () => {
    const { load, given, lastHoleFocus } = await mount();

    expect(load).toHaveBeenCalledWith(['phone'], loadHoleFocus);
    expect(given).toHaveBeenCalled();
    expect(lastHoleFocus()).toBeNull();
  });

  it('gives that code to its engine once it arrives', async () => {
    const { fixture, code, lastHoleFocus } = await mount();

    code.set(holeFocus);
    await fixture.whenStable();

    expect(lastHoleFocus()).toBe(holeFocus);
  });

  it('asks for the gestures of the fingers and of the desktop, each for its own formats', async () => {
    const { load, lastPan } = await mount();

    expect(load).toHaveBeenCalledWith(['phone', 'tablet'], loadTouchLook);
    expect(load).toHaveBeenCalledWith(['desktop'], loadSkyLook);
    expect(lastPan()).toBeNull();
  });

  it('starts the wheel and the middle button on the desktop once their code arrives, and gives their pan to the engine', async () => {
    const { touch, desk, arrive, lastPan } = await mount();

    await arrive();

    expect(desk.start).toHaveBeenCalledTimes(1);
    expect(touch.start).not.toHaveBeenCalled();
    expect(lastPan()).toBeInstanceOf(SkyPanMotion);
  });

  it.each(['phone', 'tablet'] as const)(
    'starts the pinch and the double tap on a %s, and never the wheel',
    async (format) => {
      const { touch, desk, arrive, lastPan } = await mount(format);

      await arrive();

      expect(touch.start).toHaveBeenCalledTimes(1);
      expect(desk.start).not.toHaveBeenCalled();
      expect(lastPan()).toBeNull();
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
});
