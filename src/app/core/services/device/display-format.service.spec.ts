import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DisplayFormatService } from './display-format.service';

type Listener = (event: { matches: boolean }) => void;

const stubMedia = (matching: Set<string>) => {
  const listeners = new Map<string, Set<Listener>>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matching.has(query),
    addEventListener: (_type: string, listener: Listener) => {
      listeners.set(query, (listeners.get(query) ?? new Set()).add(listener));
    },
    removeEventListener: (_type: string, listener: Listener) => {
      listeners.get(query)?.delete(listener);
    },
  }));
  return (query: string, isMatching: boolean) => {
    for (const listener of listeners.get(query) ?? []) {
      listener({ matches: isMatching });
    }
  };
};

const TOUCH = new Set(['(pointer: coarse)', '(hover: none)']);

const resizeTo = (width: number, height: number, event = 'resize') => {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('innerHeight', height);
  window.dispatchEvent(new Event(event));
};

const inject = (platform: 'browser' | 'server') => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(DisplayFormatService);
};

describe('DisplayFormatService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    delete document.documentElement.dataset['format'];
  });

  it('is a desktop on the server, and writes nothing on the root', () => {
    const matchMedia = vi.fn();
    vi.stubGlobal('matchMedia', matchMedia);
    const display = inject('server');

    display.publishOnRoot();
    TestBed.tick();

    expect(display.format()).toBe('desktop');
    expect(matchMedia).not.toHaveBeenCalled();
    expect(document.documentElement.dataset['format']).toBeUndefined();
  });

  it('reads the viewport and the pointer in the browser', () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);

    expect(inject('browser').format()).toBe('phone');
  });

  it('follows a resize and a rotation', () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);
    const display = inject('browser');

    resizeTo(820, 1180);
    expect(display.format()).toBe('tablet');
    resizeTo(844, 390, 'orientationchange');
    expect(display.format()).toBe('phone');
  });

  it('follows a change of pointer', () => {
    const change = stubMedia(TOUCH);
    resizeTo(1180, 820);
    const display = inject('browser');

    change('(pointer: coarse)', false);
    expect(display.format()).toBe('tablet');
    change('(hover: none)', false);
    expect(display.format()).toBe('desktop');
  });

  it('writes the format on the root once rendered, and keeps it current', () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);
    const display = inject('browser');

    display.publishOnRoot();
    expect(document.documentElement.dataset['format']).toBeUndefined();
    TestBed.tick();
    expect(document.documentElement.dataset['format']).toBe('phone');

    resizeTo(820, 1180);
    TestBed.tick();
    expect(document.documentElement.dataset['format']).toBe('tablet');
  });

  it('stops listening when destroyed', () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);
    const display = inject('browser');

    TestBed.resetTestingModule();
    resizeTo(820, 1180);

    expect(display.format()).toBe('phone');
  });
});
