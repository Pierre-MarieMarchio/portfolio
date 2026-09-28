type MediaListener = (event: { matches: boolean }) => void;

export type MediaMatch = ((query: string) => boolean) | ReadonlySet<string>;

export const stubViewport = (width: number, height: number): void => {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('innerHeight', height);
};

export const resizeTo = (
  width: number,
  height: number,
  event = 'resize',
): void => {
  stubViewport(width, height);
  window.dispatchEvent(new Event(event));
};

export const stubMedia = (
  matching: MediaMatch = () => false,
): ((query: string, isMatching: boolean) => void) => {
  const isMatching =
    typeof matching === 'function'
      ? matching
      : (query: string) => matching.has(query);
  const listeners = new Map<string, Set<MediaListener>>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: isMatching(query),
    addEventListener: (_type: string, listener: MediaListener) => {
      listeners.set(query, (listeners.get(query) ?? new Set()).add(listener));
    },
    removeEventListener: (_type: string, listener: MediaListener) => {
      listeners.get(query)?.delete(listener);
    },
  }));
  return (query, isNowMatching) => {
    for (const listener of listeners.get(query) ?? []) {
      listener({ matches: isNowMatching });
    }
  };
};

export interface StubObserver {
  readonly kind: 'resize' | 'intersection';
  readonly callback: (entries: { isIntersecting: boolean }[]) => void;
  readonly options: unknown;
  readonly observed: Element[];
  isDisconnected: boolean;
}

export const stubObservers = (): StubObserver[] => {
  const observers: StubObserver[] = [];
  const observerOf = (kind: StubObserver['kind']) =>
    class {
      private readonly record: StubObserver;
      public constructor(
        callback: StubObserver['callback'],
        options?: unknown,
      ) {
        this.record = {
          kind,
          callback,
          options,
          observed: [],
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
  vi.stubGlobal('ResizeObserver', observerOf('resize'));
  vi.stubGlobal('IntersectionObserver', observerOf('intersection'));
  return observers;
};

export const resizeObserved = (observers: readonly StubObserver[]): void => {
  for (const observer of observers) {
    if (observer.kind === 'resize') {
      observer.callback([]);
    }
  }
};

export const stubDialogs = () => {
  const showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  const close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
  for (const [name, value] of Object.entries({ showModal, close })) {
    Object.defineProperty(HTMLDialogElement.prototype, name, {
      value,
      configurable: true,
    });
  }
  return { showModal, close };
};

export const restoreDialogs = (): void => {
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
};
