import { TestBed } from '@angular/core/testing';
import { CanvasContextsService } from './canvas-contexts.service';
import { injectOn } from '@testing/fixtures/testbed.fixture';

describe('CanvasContextsService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('is inert on the server: no context, a ratio of 1', () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    const contexts = injectOn(CanvasContextsService, 'server');

    expect(contexts.context2d(document.createElement('canvas'))).toBeNull();
    expect(contexts.pixelRatio()).toBe(1);
    expect(getContext).not.toHaveBeenCalled();
  });

  it('gives the 2D context of a canvas, in the browser', () => {
    const context = {} as CanvasRenderingContext2D;
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context);

    expect(
      injectOn(CanvasContextsService, 'browser').context2d(
        document.createElement('canvas'),
      ),
    ).toBe(context);
    expect(getContext).toHaveBeenCalledWith('2d');
  });

  it('answers no context where the browser refuses one', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => {
        throw new Error('refused');
      },
    );

    expect(
      injectOn(CanvasContextsService, 'browser').context2d(
        document.createElement('canvas'),
      ),
    ).toBeNull();
  });

  it('reads the device pixel ratio in the browser', () => {
    expect(injectOn(CanvasContextsService, 'browser').pixelRatio()).toBe(
      window.devicePixelRatio || 1,
    );
  });
});
