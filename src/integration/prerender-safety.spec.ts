import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@app/core/services';

/**
 * The mechanism under test: the one service that touches the browser is
 * inert while prerendering. The server platform is simulated by
 * `PLATFORM_ID`, while jsdom still provides `matchMedia`, a document and a
 * layout, so a method that forgot its guard would reach them and this suite
 * would see it.
 */
describe('prerender safety', () => {
  const on = (platform: 'browser' | 'server') => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
    });
  };

  it('answers the no-motion default without asking matchMedia on the server', () => {
    const matchMedia = vi.fn();
    vi.stubGlobal('matchMedia', matchMedia);
    on('server');
    const environment = TestBed.inject(BrowserEnvironment);

    expect(environment.prefersReducedMotion()).toBe(true);
    expect(environment.watchMedia('(min-width: 1px)', () => undefined)).toEqual(
      expect.any(Function),
    );
    expect(matchMedia).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  /** A window that drags or measures itself must render on the server too. */
  it('answers no viewport, listens to nothing and waits for no frame on the server', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener');
    on('server');
    const environment = TestBed.inject(BrowserEnvironment);

    expect(environment.viewport()).toBeNull();
    environment.listen('resize', () => undefined)();
    expect(addEventListener).not.toHaveBeenCalled();
    const frame = vi.spyOn(window, 'requestAnimationFrame');
    environment.nextFrame(() => undefined)();
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
    const environment = TestBed.inject(BrowserEnvironment);
    const canvas = document.createElement('canvas');
    const onFonts = vi.fn();

    expect(environment.cannotHover()).toBe(false);
    expect(environment.devicePixelRatio()).toBe(1);
    expect(environment.now()).toBe(0);
    expect(environment.isHidden()).toBe(true);
    environment.watchVisibility(() => undefined)();
    environment.observeResize(canvas, () => undefined)();
    environment.observeIntersection(canvas, 0.01, () => undefined)();
    expect(environment.context2d(canvas)).toBeNull();
    expect(environment.computedStyle(canvas, 'opacity')).toBe('');
    expect(environment.rootStyle('--ink')).toBe('');
    environment.whenFontsReady(onFonts);

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
    const environment = TestBed.inject(BrowserEnvironment);
    const canvas = document.createElement('canvas');
    const heard: boolean[] = [];

    environment.observeResize(canvas, () => undefined)();
    expect(observed).toEqual([canvas]);
    expect(disconnected).toEqual(['resize']);

    const stop = environment.watchVisibility((hidden) => heard.push(hidden));
    document.dispatchEvent(new Event('visibilitychange'));
    stop();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(heard).toEqual([document.hidden]);

    expect(environment.now()).toBeGreaterThan(0);
    expect(environment.devicePixelRatio()).toBe(window.devicePixelRatio || 1);
    canvas.style.opacity = '0.5';
    document.body.append(canvas);
    expect(environment.computedStyle(canvas, 'opacity')).toBe('0.5');
    canvas.remove();

    vi.unstubAllGlobals();
  });

  it('reads the viewport and stops listening when asked, in the browser', () => {
    on('browser');
    const environment = TestBed.inject(BrowserEnvironment);
    const heard: string[] = [];

    expect(environment.viewport()).toEqual({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    const stop = environment.listen('resize', (event) =>
      heard.push(event.type),
    );
    window.dispatchEvent(new Event('resize'));
    stop();
    window.dispatchEvent(new Event('resize'));
    expect(heard).toEqual(['resize']);
  });

  /** The object drags the cursor: never while prerendering. */
  it('leaves the cursor alone on the server', () => {
    on('server');

    TestBed.inject(BrowserEnvironment).setCursor('grabbing');

    expect(document.body.style.cursor).toBe('');
  });

  it('sets the cursor and reads the root tokens in the browser', () => {
    document.documentElement.style.setProperty('--ink', ' #2b2f3a ');
    on('browser');
    const environment = TestBed.inject(BrowserEnvironment);

    environment.setCursor('grabbing');
    expect(document.body.style.cursor).toBe('grabbing');
    environment.setCursor('');
    expect(document.body.style.cursor).toBe('');
    expect(environment.rootStyle('--ink')).toBe('#2b2f3a');

    document.documentElement.style.removeProperty('--ink');
  });

  /** The choreography's timing is read from the CSS, never from the server. */
  it('reads no duration and waits for no gesture on the server', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    document.documentElement.style.setProperty('--arrival-at', '8700ms');
    on('server');
    const environment = TestBed.inject(BrowserEnvironment);
    const called = vi.fn();

    expect(environment.rootDuration('--arrival-at')).toBeNull();
    environment.firstGesture(10, called);
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event('keydown'));

    expect(called).not.toHaveBeenCalled();
    document.documentElement.style.removeProperty('--arrival-at');
    vi.useRealTimers();
  });

  it('reads a duration token in ms or s, and nothing else, in the browser', () => {
    on('browser');
    const environment = TestBed.inject(BrowserEnvironment);
    const read = (value: string): number | null => {
      document.documentElement.style.setProperty('--probe', value);
      return environment.rootDuration('--probe');
    };

    expect(read('8700ms')).toBe(8700);
    expect(read('5.6s')).toBe(5600);
    expect(read('auto')).toBeNull();
    document.documentElement.style.removeProperty('--probe');
    expect(environment.rootDuration('--probe')).toBeNull();
  });

  it('calls back once, at the first gesture or the timeout, in the browser', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    on('browser');
    const environment = TestBed.inject(BrowserEnvironment);
    const byGesture = vi.fn();
    const byTime = vi.fn();
    const cancelled = vi.fn();

    environment.firstGesture(1000, byGesture);
    window.dispatchEvent(new Event('wheel'));
    window.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(1000);
    expect(byGesture).toHaveBeenCalledTimes(1);

    environment.firstGesture(1000, byTime);
    vi.advanceTimersByTime(999);
    expect(byTime).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    window.dispatchEvent(new Event('pointerdown'));
    expect(byTime).toHaveBeenCalledTimes(1);

    environment.firstGesture(1000, cancelled)();
    vi.advanceTimersByTime(1000);
    window.dispatchEvent(new Event('touchstart'));
    expect(cancelled).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
