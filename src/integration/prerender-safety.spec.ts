import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  BrowserWindowService,
  CanvasContextsService,
  ClockService,
  CursorService,
  DocumentStylesService,
  ElementObserverService,
  MediaPreferencesService,
  PageVisibilityService,
  UserPresenceService,
} from '@app/core/services';

const on = (platform: 'browser' | 'server') => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
};

/**
 * The mechanism under test: the services that touch the browser are inert
 * while prerendering. The server platform is simulated by
 * `PLATFORM_ID`, while jsdom still provides `matchMedia`, a document and a
 * layout, so a method that forgot its guard would reach them and this suite
 * would see it.
 */
describe('prerender safety', () => {
  it('answers the no-motion default without asking matchMedia on the server', () => {
    const matchMedia = vi.fn();
    vi.stubGlobal('matchMedia', matchMedia);
    on('server');
    const media = TestBed.inject(MediaPreferencesService);

    expect(media.reducedMotion()).toBe(true);
    expect(media.watch('(min-width: 1px)', () => {})).toEqual(
      expect.any(Function),
    );
    expect(matchMedia).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  /** A window that drags or measures itself must render on the server too. */
  it('answers no viewport, listens to nothing and waits for no frame on the server', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener');
    on('server');
    const browserWindow = TestBed.inject(BrowserWindowService);

    expect(browserWindow.size()).toBeNull();
    browserWindow.on('resize', () => {})();
    expect(addEventListener).not.toHaveBeenCalled();
    const frame = vi.spyOn(window, 'requestAnimationFrame');
    TestBed.inject(ClockService).nextFrame(() => {})();
    expect(frame).not.toHaveBeenCalled();
    frame.mockRestore();

    addEventListener.mockRestore();
  });

  /**
   * The object's doors: every one answers its neutral value on the server
   * and reaches for nothing. The spies catch the browser APIs a forgotten
   * guard would call.
   */
  it('gives the object no context, no observer, no clock and no fonts on the server', () => {
    const matchMedia = vi.fn();
    vi.stubGlobal('matchMedia', matchMedia);
    const observed = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observed;
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = observed;
        disconnect = vi.fn();
      },
    );
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    const listen = vi.spyOn(document, 'addEventListener');
    const computed = vi.spyOn(window, 'getComputedStyle');
    const now = vi.spyOn(performance, 'now');
    on('server');
    const contexts = TestBed.inject(CanvasContextsService);
    const visibility = TestBed.inject(PageVisibilityService);
    const observer = TestBed.inject(ElementObserverService);
    const styles = TestBed.inject(DocumentStylesService);
    const canvas = document.createElement('canvas');
    const onFonts = vi.fn();

    expect(TestBed.inject(MediaPreferencesService).cannotHover()).toBe(false);
    expect(contexts.pixelRatio()).toBe(1);
    expect(TestBed.inject(ClockService).now()).toBe(0);
    expect(visibility.isHidden()).toBe(true);
    visibility.watch(() => {})();
    observer.onResize(canvas, () => {})();
    observer.onVisible(canvas, 0.01, () => {})();
    expect(contexts.context2d(canvas)).toBeNull();
    expect(styles.token('opacity', canvas)).toBe('');
    expect(styles.token('--ink')).toBe('');
    styles.fontsReady(onFonts);

    expect(matchMedia).not.toHaveBeenCalled();
    expect(observed).not.toHaveBeenCalled();
    expect(getContext).not.toHaveBeenCalled();
    expect(listen).not.toHaveBeenCalled();
    expect(computed).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
    expect(onFonts).not.toHaveBeenCalled();

    getContext.mockRestore();
    listen.mockRestore();
    computed.mockRestore();
    now.mockRestore();
    vi.unstubAllGlobals();
  });

  it('observes, times and reads styles in the browser', () => {
    const observed: Element[] = [];
    const disconnected: string[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(element: Element) {
          observed.push(element);
        }
        disconnect() {
          disconnected.push('resize');
        }
      },
    );
    on('browser');
    const canvas = document.createElement('canvas');
    const heard: boolean[] = [];

    TestBed.inject(ElementObserverService).onResize(canvas, () => {})();
    expect(observed).toEqual([canvas]);
    expect(disconnected).toEqual(['resize']);

    const stop = TestBed.inject(PageVisibilityService).watch((hidden) =>
      heard.push(hidden),
    );
    document.dispatchEvent(new Event('visibilitychange'));
    stop();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(heard).toEqual([document.hidden]);

    expect(TestBed.inject(ClockService).now()).toBeGreaterThan(0);
    expect(TestBed.inject(CanvasContextsService).pixelRatio()).toBe(
      window.devicePixelRatio || 1,
    );
    canvas.style.opacity = '0.5';
    document.body.append(canvas);
    expect(TestBed.inject(DocumentStylesService).token('opacity', canvas)).toBe(
      '0.5',
    );
    canvas.remove();

    vi.unstubAllGlobals();
  });

  it('reads the viewport and stops listening when asked, in the browser', () => {
    on('browser');
    const browserWindow = TestBed.inject(BrowserWindowService);
    const heard: string[] = [];

    expect(browserWindow.size()).toEqual({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    const stop = browserWindow.on('resize', (event) => heard.push(event.type));
    window.dispatchEvent(new Event('resize'));
    stop();
    window.dispatchEvent(new Event('resize'));
    expect(heard).toEqual(['resize']);
  });

  /** The object drags the cursor: never while prerendering. */
  it('leaves the cursor alone on the server', () => {
    on('server');

    TestBed.inject(CursorService).set('grabbing');

    expect(document.body.style.cursor).toBe('');
  });

  it('sets the cursor and reads the root tokens in the browser', () => {
    document.documentElement.style.setProperty('--ink', ' #2b2f3a ');
    on('browser');
    const cursor = TestBed.inject(CursorService);

    cursor.set('grabbing');
    expect(document.body.style.cursor).toBe('grabbing');
    cursor.set('');
    expect(document.body.style.cursor).toBe('');
    expect(TestBed.inject(DocumentStylesService).token('--ink')).toBe(
      '#2b2f3a',
    );

    document.documentElement.style.removeProperty('--ink');
  });

  /** The choreography's timing is read from the CSS, never from the server. */
  it('reads no duration and waits for no gesture on the server', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    document.documentElement.style.setProperty('--arrival-at', '8700ms');
    on('server');
    const styles = TestBed.inject(DocumentStylesService);
    const called = vi.fn();

    expect(styles.duration('--arrival-at')).toBeNull();
    TestBed.inject(UserPresenceService).whenPresent(10, called);
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event('keydown'));

    expect(called).not.toHaveBeenCalled();
    document.documentElement.style.removeProperty('--arrival-at');
    vi.useRealTimers();
  });

  it('reads a duration token in ms or s, and nothing else, in the browser', () => {
    on('browser');
    const styles = TestBed.inject(DocumentStylesService);
    const read = (value: string): number | null => {
      document.documentElement.style.setProperty('--probe', value);
      return styles.duration('--probe');
    };

    expect(read('8700ms')).toBe(8700);
    expect(read('5.6s')).toBe(5600);
    expect(read('auto')).toBeNull();
    document.documentElement.style.removeProperty('--probe');
    expect(styles.duration('--probe')).toBeNull();
  });

  it('calls back once, at the first gesture or the timeout, in the browser', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    on('browser');
    const presence = TestBed.inject(UserPresenceService);
    const byGesture = vi.fn();
    const byTime = vi.fn();
    const cancelled = vi.fn();

    presence.whenPresent(1000, byGesture);
    window.dispatchEvent(new Event('wheel'));
    window.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(1000);
    expect(byGesture).toHaveBeenCalledTimes(1);

    presence.whenPresent(1000, byTime);
    vi.advanceTimersByTime(999);
    expect(byTime).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    window.dispatchEvent(new Event('pointerdown'));
    expect(byTime).toHaveBeenCalledTimes(1);

    presence.whenPresent(1000, cancelled)();
    vi.advanceTimersByTime(1000);
    window.dispatchEvent(new Event('touchstart'));
    expect(cancelled).not.toHaveBeenCalled();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});
