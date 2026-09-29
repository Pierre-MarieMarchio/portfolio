import { ElementObserverService } from './element-observer.service';
import { StubObserver, stubObservers } from '@testing/doubles/browser.double';
import { injectOn } from '@testing/fixtures/testbed.fixture';

describe('ElementObserverService', () => {
  let observers: StubObserver[];

  beforeEach(() => {
    observers = stubObservers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is inert on the server: observes nothing', () => {
    const observer = injectOn(ElementObserverService, 'server');
    const element = document.createElement('div');
    const called = vi.fn();

    observer.onResize(element, called)();
    observer.onVisible(element, 0.5, called)();

    expect(observers).toEqual([]);
    expect(called).not.toHaveBeenCalled();
  });

  it('calls back when the element resizes, until stopped, in the browser', () => {
    const element = document.createElement('div');
    const called = vi.fn();

    const stop = injectOn(ElementObserverService, 'browser').onResize(
      element,
      called,
    );
    observers[0]?.callback([]);
    stop();

    expect(observers[0]?.kind).toBe('resize');
    expect(observers[0]?.observed).toEqual([element]);
    expect(observers[0]?.isDisconnected).toBe(true);
    expect(called).toHaveBeenCalledTimes(1);
  });

  it('calls back when the element enters or leaves the viewport, in the browser', () => {
    const element = document.createElement('div');
    const heard: boolean[] = [];

    const stop = injectOn(ElementObserverService, 'browser').onVisible(
      element,
      0.25,
      (isVisible) => heard.push(isVisible),
    );
    observers[0]?.callback([{ isIntersecting: true }]);
    observers[0]?.callback([]);
    observers[0]?.callback([{ isIntersecting: false }]);
    stop();

    expect(observers[0]?.kind).toBe('intersection');
    expect(observers[0]?.options).toEqual({ threshold: 0.25 });
    expect(observers[0]?.isDisconnected).toBe(true);
    expect(heard).toEqual([true, false]);
  });

  it('is deaf to snap changes where the browser does not announce them', () => {
    const element = document.createElement('div');
    const heard = vi.fn();

    const stop = injectOn(ElementObserverService, 'browser').onSnapChanging(
      element,
      heard,
    );
    element.dispatchEvent(new Event('scrollsnapchanging'));
    stop();

    expect(heard).not.toHaveBeenCalled();
  });

  it('reports the element the browser is about to snap to, until stopped', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'onscrollsnapchanging', {
      value: null,
      configurable: true,
    });
    const target = document.createElement('li');
    const heard: (Element | null)[] = [];

    const stop = injectOn(ElementObserverService, 'browser').onSnapChanging(
      element,
      (snapped) => {
        heard.push(snapped);
      },
    );
    const event = new Event('scrollsnapchanging');
    Object.defineProperty(event, 'snapTargetInline', { value: target });
    element.dispatchEvent(event);
    stop();
    element.dispatchEvent(event);

    expect(heard).toEqual([target]);
  });

  it('says whether the browser announces snap targets, from the document itself', () => {
    const observer = injectOn(ElementObserverService, 'browser');

    expect(observer.hasSnapChanging()).toBe(false);

    Object.defineProperty(document.documentElement, 'onscrollsnapchanging', {
      value: null,
      configurable: true,
    });

    expect(observer.hasSnapChanging()).toBe(true);

    Reflect.deleteProperty(document.documentElement, 'onscrollsnapchanging');
  });

  it('waits for the animations of an element to end, in the browser', async () => {
    const element = document.createElement('div');
    const ends: (() => void)[] = [];
    const finished = new Promise<void>((resolve) => {
      ends.push(resolve);
    });
    Object.defineProperty(element, 'getAnimations', {
      value: () => [
        { finished },
        { finished: Promise.reject(new Error('cancelled')) },
      ],
    });
    const still = vi.fn();

    void injectOn(ElementObserverService, 'browser')
      .whenStill(element)
      .then(still);
    await Promise.resolve();

    expect(still).not.toHaveBeenCalled();

    ends[0]?.();
    await vi.waitFor(() => {
      expect(still).toHaveBeenCalledOnce();
    });
  });

  it('is still at once on the server: reads no animation', async () => {
    const element = document.createElement('div');
    const getAnimations = vi.fn(() => []);
    Object.defineProperty(element, 'getAnimations', { value: getAnimations });

    await injectOn(ElementObserverService, 'server').whenStill(element);

    expect(getAnimations).not.toHaveBeenCalled();
  });

  it('is still at once where elements have no animations', async () => {
    await expect(
      injectOn(ElementObserverService, 'browser').whenStill(
        document.createElement('div'),
      ),
    ).resolves.toBeUndefined();
  });

  it('is inert in a browser without observers', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    vi.stubGlobal('IntersectionObserver', undefined);
    const observer = injectOn(ElementObserverService, 'browser');
    const element = document.createElement('div');

    expect(() => {
      observer.onResize(element, () => {})();
      observer.onVisible(element, 0.5, () => {})();
    }).not.toThrow();
  });
});
