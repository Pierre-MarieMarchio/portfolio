import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PhoneCodeService } from '@app/core/services';
import { recordingContext } from '@testing/doubles/recording-canvas.double';
import { SpaceSceneEngine } from '../../engine/space-scene.engine';
import { SCENE_SURROUNDINGS } from '../../ports/scene-surroundings.port';
import * as holeFocus from '../../rules/hole-focus.rules';
import { loadHoleFocus, SpaceSceneComponent } from './space-scene.component';

const mount = async () => {
  const code = signal<typeof holeFocus | null>(null);
  const load = vi.fn(() => code.asReadonly());
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() =>
    recordingContext('canvas', []),
  );
  const given = vi.spyOn(SpaceSceneEngine.prototype, 'setInputs');
  TestBed.configureTestingModule({
    imports: [SpaceSceneComponent],
    providers: [
      { provide: PhoneCodeService, useValue: { load } },
      {
        provide: SCENE_SURROUNDINGS,
        useValue: { panels: () => [], lines: () => [] },
      },
    ],
  });
  const fixture = TestBed.createComponent(SpaceSceneComponent);
  await fixture.whenStable();
  const lastHoleFocus = () => given.mock.calls.at(-1)?.[0].holeFocus;
  return { fixture, code, load, given, lastHoleFocus };
};

describe('SpaceSceneComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('asks for the framing code of the phone through the phone code loader', async () => {
    const { load, given, lastHoleFocus } = await mount();

    expect(load).toHaveBeenCalledWith(loadHoleFocus);
    expect(given).toHaveBeenCalled();
    expect(lastHoleFocus()).toBeNull();
  });

  it('gives that code to its engine once it arrives', async () => {
    const { fixture, code, lastHoleFocus } = await mount();

    code.set(holeFocus);
    await fixture.whenStable();

    expect(lastHoleFocus()).toBe(holeFocus);
  });
});
