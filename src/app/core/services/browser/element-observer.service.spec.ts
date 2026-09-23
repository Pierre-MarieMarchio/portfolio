import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ElementObserverService } from './element-observer.service';

const inject = (platform: 'browser' | 'server') => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(ElementObserverService);
};

const observers: {
  kind: string;
  callback: (entries: { isIntersecting: boolean }[]) => void;
  options: unknown;
  observed: Element[];
  isDisconnected: boolean;
}[] = [];

const stubObserver = (kind: string) =>
  class {
    private readonly record;
    public constructor(
      callback: (entries: { isIntersecting: boolean }[]) => void,
      options?: unknown,
    ) {
      this.record = {
        kind,
        callback,
        options,
        observed: [] as Element[],
        isDisconnected: false,
      };
      observers.push(this.record);
    }
    public observe(element: Element): void {
      this.record.observed.push(element);
    }
    public disconnect(): void {
      this.record.isDisconnected = true;
    }
  };

describe('ElementObserverService', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', stubObserver('resize'));
    vi.stubGlobal('IntersectionObserver', stubObserver('intersection'));
  });

  afterEach(() => {
    observers.length = 0;
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('is inert on the server: observes nothing', () => {
    const observer = inject('server');
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

    const stop = inject('browser').onResize(element, called);
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

    const stop = inject('browser').onVisible(element, 0.25, (isVisible) =>
      heard.push(isVisible),
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
    const observer = inject('browser');
    const element = document.createElement('div');

    expect(() => {
      observer.onResize(element, () => {})();
      observer.onVisible(element, 0.5, () => {})();
    }).not.toThrow();
  });
});
