import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnimatedCanvasService } from './animated-canvas.service';

const inject = (platform: 'browser' | 'server') => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(AnimatedCanvasService);
};

describe('AnimatedCanvasService', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--probe');
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('is inert on the server: every answer neutral, nothing reached', () => {
    const matchMedia = vi.fn();
    vi.stubGlobal('matchMedia', matchMedia);
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    const listen = vi.spyOn(window, 'addEventListener');
    const frame = vi.spyOn(window, 'requestAnimationFrame');
    const canvas = inject('server');
    const element = document.createElement('canvas');
    const called = vi.fn();

    expect(canvas.context2d(element)).toBeNull();
    expect(canvas.pixelRatio()).toBe(1);
    expect(canvas.now()).toBe(0);
    expect(canvas.isHidden()).toBe(true);
    expect(canvas.reducedMotion()).toBe(true);
    expect(canvas.token('--probe')).toBe('');
    expect(canvas.windowSize()).toBeNull();
    canvas.nextFrame(called)();
    canvas.watchHidden(called)();
    canvas.watchMedia('(min-width: 1px)', called)();
    canvas.fontsReady(called);
    canvas.onResize(element, called)();
    canvas.onVisible(element, 0.01, called)();
    canvas.onWindow('resize', called)();

    expect(matchMedia).not.toHaveBeenCalled();
    expect(getContext).not.toHaveBeenCalled();
    expect(listen).not.toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
    expect(called).not.toHaveBeenCalled();
  });

  it('answers from the browser in the browser', () => {
    document.documentElement.style.setProperty('--probe', ' #3b62c4 ');
    const canvas = inject('browser');
    const heard: string[] = [];

    expect(canvas.token('--probe')).toBe('#3b62c4');
    expect(canvas.windowSize()).toEqual({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    expect(canvas.pixelRatio()).toBe(window.devicePixelRatio || 1);
    expect(canvas.now()).toBeGreaterThan(0);
    const stop = canvas.onWindow('pointerup', (event) =>
      heard.push(event.type),
    );
    window.dispatchEvent(new Event('pointerup'));
    stop();
    window.dispatchEvent(new Event('pointerup'));

    expect(heard).toEqual(['pointerup']);
  });
});
