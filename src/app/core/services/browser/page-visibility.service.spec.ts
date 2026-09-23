import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PageVisibilityService } from './page-visibility.service';

const inject = (platform: 'browser' | 'server') => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(PageVisibilityService);
};

describe('PageVisibilityService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('is inert on the server: hidden, and listens to nothing', () => {
    const addEventListener = vi.spyOn(document, 'addEventListener');
    const visibility = inject('server');
    const heard = vi.fn();

    expect(visibility.isHidden()).toBe(true);
    visibility.watch(heard)();
    document.dispatchEvent(new Event('visibilitychange'));

    expect(addEventListener).not.toHaveBeenCalled();
    expect(heard).not.toHaveBeenCalled();
  });

  it('reads and follows the tab visibility until stopped, in the browser', () => {
    const visibility = inject('browser');
    const heard: boolean[] = [];

    expect(visibility.isHidden()).toBe(document.hidden);
    const stop = visibility.watch((isHidden) => heard.push(isHidden));
    document.dispatchEvent(new Event('visibilitychange'));
    stop();
    document.dispatchEvent(new Event('visibilitychange'));

    expect(heard).toEqual([document.hidden]);
  });
});
