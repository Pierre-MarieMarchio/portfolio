import { ErrorHandler, Injectable, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserEnvironment, LocalStorageService } from '@app/core/services';

/** A feature's stored preference, as it would subclass the base. */
@Injectable({ providedIn: 'root' })
class StoredChoice extends LocalStorageService {
  public read(): unknown {
    return this.getItem('choice');
  }

  public write(value: unknown): void {
    this.setItem('choice', value);
  }
}

/**
 * The mechanism under test: every service that touches the browser is inert
 * while prerendering. The server platform is simulated by `PLATFORM_ID`, while
 * jsdom still provides `localStorage` and `matchMedia`, so a service that
 * forgot its guard would reach them and this suite would see it.
 */
describe('prerender safety', () => {
  const on = (platform: 'browser' | 'server') => {
    const reported: unknown[] = [];

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platform },
        {
          provide: ErrorHandler,
          useValue: { handleError: (error: unknown) => reported.push(error) },
        },
      ],
    });

    return { reported };
  };

  afterEach(() => {
    localStorage.clear();
  });

  it('never reads or writes storage on the server', () => {
    localStorage.setItem('choice', '"kept"');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    on('server');
    const choice = TestBed.inject(StoredChoice);

    choice.write('ignored');

    expect(choice.read()).toBeNull();
    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();

    setItem.mockRestore();
    getItem.mockRestore();
  });

  it('round-trips a value in the browser', () => {
    on('browser');
    const choice = TestBed.inject(StoredChoice);

    choice.write({ family: 'personal' });

    expect(choice.read()).toEqual({ family: 'personal' });
  });

  /** A blocked storage throws on read, at bootstrap: it must not crash. */
  it('turns a blocked storage into a missing value and a report', () => {
    const { reported } = on('browser');
    const blocked = new DOMException('blocked', 'SecurityError');
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw blocked;
      });

    expect(TestBed.inject(StoredChoice).read()).toBeNull();
    expect(reported).toEqual([blocked]);

    getItem.mockRestore();
  });

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
  it('answers no viewport and listens to nothing on the server', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener');
    on('server');
    const environment = TestBed.inject(BrowserEnvironment);

    expect(environment.viewport()).toBeNull();
    environment.listen('resize', () => undefined)();
    expect(addEventListener).not.toHaveBeenCalled();

    addEventListener.mockRestore();
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
});
