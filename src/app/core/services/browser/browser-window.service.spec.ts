import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserWindowService } from './browser-window.service';

const inject = (platform: 'browser' | 'server') => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(BrowserWindowService);
};

describe('BrowserWindowService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('is inert on the server: no size, and listens to nothing', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const browserWindow = inject('server');
    const heard = vi.fn();

    expect(browserWindow.size()).toBeNull();
    const stop = browserWindow.on('resize', heard);
    window.dispatchEvent(new Event('resize'));
    stop();

    expect(addEventListener).not.toHaveBeenCalled();
    expect(heard).not.toHaveBeenCalled();
  });

  it('reads the window size in the browser', () => {
    expect(inject('browser').size()).toEqual({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  });

  it('listens to a window event until stopped, in the browser', () => {
    const browserWindow = inject('browser');
    const heard: string[] = [];

    const stop = browserWindow.on('keydown', (event) => heard.push(event.type));
    window.dispatchEvent(new Event('keydown'));
    stop();
    window.dispatchEvent(new Event('keydown'));

    expect(heard).toEqual(['keydown']);
  });
});
