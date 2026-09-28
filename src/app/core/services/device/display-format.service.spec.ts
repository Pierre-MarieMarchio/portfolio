import { TestBed } from '@angular/core/testing';
import { DisplayFormatService } from './display-format.service';
import { resizeTo, stubMedia } from '@testing/doubles/browser.double';
import { injectOn } from '@testing/fixtures/testbed.fixture';

const TOUCH = new Set(['(pointer: coarse)', '(hover: none)']);

describe('DisplayFormatService', () => {
  beforeEach(() => {
    delete document.documentElement.dataset['format'];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete document.documentElement.dataset['format'];
  });

  it('is a desktop on the server, listens to nothing and writes nothing on the root', () => {
    const matchMedia = vi.fn();
    vi.stubGlobal('matchMedia', matchMedia);
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const display = injectOn(DisplayFormatService, 'server');

    display.publishOnRoot();
    TestBed.tick();

    expect(display.format()).toBe('desktop');
    expect(matchMedia).not.toHaveBeenCalled();
    expect(addEventListener).not.toHaveBeenCalled();
    expect(document.documentElement.dataset['format']).toBeUndefined();
    addEventListener.mockRestore();
  });

  it('reads the viewport and the pointer in the browser', () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);

    expect(injectOn(DisplayFormatService, 'browser').format()).toBe('phone');
  });

  it('follows a resize and a rotation', () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);
    const display = injectOn(DisplayFormatService, 'browser');

    resizeTo(820, 1180);
    expect(display.format()).toBe('tablet');
    resizeTo(844, 390, 'orientationchange');
    expect(display.format()).toBe('phone');
  });

  it('follows a change of pointer', () => {
    const change = stubMedia(TOUCH);
    resizeTo(1180, 820);
    const display = injectOn(DisplayFormatService, 'browser');

    change('(pointer: coarse)', false);
    expect(display.format()).toBe('tablet');
    change('(hover: none)', false);
    expect(display.format()).toBe('desktop');
  });

  it('writes the format on the root once rendered, and keeps it current', () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);
    const display = injectOn(DisplayFormatService, 'browser');

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
    const display = injectOn(DisplayFormatService, 'browser');

    TestBed.resetTestingModule();
    resizeTo(820, 1180);

    expect(display.format()).toBe('phone');
  });
});
