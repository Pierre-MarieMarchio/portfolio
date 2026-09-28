import { TestBed } from '@angular/core/testing';
import { ElementObserverService } from './element-observer.service';
import { StubObserver, stubObservers } from '@testing/doubles/browser.double';
import { injectOn } from '@testing/fixtures/testbed.fixture';

describe('ElementObserverService', () => {
  let observers: StubObserver[];

  beforeEach(() => {
    observers = stubObservers();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
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
