import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MediaPreferencesService } from './media-preferences.service';

const inject = (platform: 'browser' | 'server') => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(MediaPreferencesService);
};

const mediaList = (isMatching: boolean) => {
  const listeners = new Set<(event: { matches: boolean }) => void>();
  return {
    matches: isMatching,
    addEventListener: (
      _type: string,
      listener: (event: { matches: boolean }) => void,
    ) => listeners.add(listener),
    removeEventListener: (
      _type: string,
      listener: (event: { matches: boolean }) => void,
    ) => listeners.delete(listener),
    change: (isNowMatching: boolean) => {
      for (const listener of listeners) {
        listener({ matches: isNowMatching });
      }
    },
  };
};

describe('MediaPreferencesService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('is inert on the server: less motion, hover, and no query asked', () => {
    const matchMedia = vi.fn();
    vi.stubGlobal('matchMedia', matchMedia);
    const media = inject('server');
    const heard = vi.fn();

    expect(media.reducedMotion()).toBe(true);
    expect(media.cannotHover()).toBe(false);
    media.watch('(min-width: 1px)', heard)();

    expect(matchMedia).not.toHaveBeenCalled();
    expect(heard).not.toHaveBeenCalled();
  });

  it('answers what the system says, in the browser', () => {
    vi.stubGlobal('matchMedia', (query: string) =>
      mediaList(query === '(hover: none)'),
    );
    const media = inject('browser');

    expect(media.reducedMotion()).toBe(false);
    expect(media.cannotHover()).toBe(true);
  });

  it('calls back on each change until stopped, in the browser', () => {
    const list = mediaList(false);
    vi.stubGlobal('matchMedia', () => list);
    const heard: boolean[] = [];

    const stop = inject('browser').watch('(min-width: 1px)', (isMatching) =>
      heard.push(isMatching),
    );
    list.change(true);
    stop();
    list.change(false);

    expect(heard).toEqual([true]);
  });
});
