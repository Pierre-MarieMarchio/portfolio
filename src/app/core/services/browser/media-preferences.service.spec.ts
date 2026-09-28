import { TestBed } from '@angular/core/testing';
import { MediaPreferencesService } from './media-preferences.service';
import { stubMedia } from '@testing/doubles/browser.double';
import { injectOn } from '@testing/fixtures/testbed.fixture';

describe('MediaPreferencesService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('is inert on the server: less motion, hover, and no query asked', () => {
    const matchMedia = vi.fn();
    vi.stubGlobal('matchMedia', matchMedia);
    const media = injectOn(MediaPreferencesService, 'server');
    const heard = vi.fn();

    expect(media.reducedMotion()).toBe(true);
    expect(media.cannotHover()).toBe(false);
    expect(media.hasCoarsePointer()).toBe(false);
    media.watch('(min-width: 1px)', heard)();

    expect(matchMedia).not.toHaveBeenCalled();
    expect(heard).not.toHaveBeenCalled();
  });

  it('answers what the system says, in the browser', () => {
    stubMedia(
      (query) => query === '(hover: none)' || query === '(pointer: coarse)',
    );
    const media = injectOn(MediaPreferencesService, 'browser');

    expect(media.reducedMotion()).toBe(false);
    expect(media.cannotHover()).toBe(true);
    expect(media.hasCoarsePointer()).toBe(true);
  });

  it('calls back on each change until stopped, in the browser', () => {
    const change = stubMedia();
    const heard: boolean[] = [];

    const stop = injectOn(MediaPreferencesService, 'browser').watch(
      '(min-width: 1px)',
      (isMatching) => heard.push(isMatching),
    );
    change('(min-width: 1px)', true);
    stop();
    change('(min-width: 1px)', false);

    expect(heard).toEqual([true]);
  });
});
