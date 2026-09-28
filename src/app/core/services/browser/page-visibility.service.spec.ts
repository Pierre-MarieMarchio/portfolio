import { PageVisibilityService } from './page-visibility.service';
import { injectOn } from '@testing/fixtures/testbed.fixture';

describe('PageVisibilityService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is inert on the server: hidden, and listens to nothing', () => {
    const addEventListener = vi.spyOn(document, 'addEventListener');
    const visibility = injectOn(PageVisibilityService, 'server');
    const heard = vi.fn();

    expect(visibility.isHidden()).toBe(true);
    visibility.watch(heard)();
    document.dispatchEvent(new Event('visibilitychange'));

    expect(addEventListener).not.toHaveBeenCalled();
    expect(heard).not.toHaveBeenCalled();
  });

  it('reads and follows the tab visibility until stopped, in the browser', () => {
    const visibility = injectOn(PageVisibilityService, 'browser');
    const heard: boolean[] = [];

    expect(visibility.isHidden()).toBe(document.hidden);
    const stop = visibility.watch((isHidden) => heard.push(isHidden));
    document.dispatchEvent(new Event('visibilitychange'));
    stop();
    document.dispatchEvent(new Event('visibilitychange'));

    expect(heard).toEqual([document.hidden]);
  });
});
