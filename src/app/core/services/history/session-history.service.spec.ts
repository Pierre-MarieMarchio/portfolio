import { SessionHistoryService } from './session-history.service';
import { injectOn } from '@testing/fixtures/testbed.fixture';

describe('SessionHistoryService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'CloseWatcher');
  });

  it('is inert on the server: no state, no entry, no step back, no listening', () => {
    const pushState = vi.spyOn(history, 'pushState');
    const go = vi.spyOn(history, 'go');
    const heard = vi.fn();
    Object.defineProperty(window, 'CloseWatcher', {
      value: class {},
      configurable: true,
    });
    const sessionHistory = injectOn(SessionHistoryService, 'server');

    sessionHistory.push({ layer: 1 });
    sessionHistory.back(1);
    const stop = sessionHistory.onPop(heard);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    stop();

    expect(sessionHistory.state()).toBeNull();
    expect(sessionHistory.hasCloseWatcher()).toBe(false);
    expect(pushState).not.toHaveBeenCalled();
    expect(go).not.toHaveBeenCalled();
    expect(heard).not.toHaveBeenCalled();
  });

  it('adds an entry on the same address with the given state, in the browser', () => {
    const address = location.href;
    const sessionHistory = injectOn(SessionHistoryService, 'browser');

    sessionHistory.push({ layer: 1 });

    expect(sessionHistory.state()).toEqual({ layer: 1 });
    expect(location.href).toBe(address);
  });

  it('steps back as many entries as asked, in the browser', () => {
    const go = vi.spyOn(history, 'go').mockImplementation(() => {});

    injectOn(SessionHistoryService, 'browser').back(2);

    expect(go).toHaveBeenCalledWith(-2);
  });

  it('hands over the state of each return in the history until stopped', () => {
    const heard: unknown[] = [];
    const stop = injectOn(SessionHistoryService, 'browser').onPop((state) =>
      heard.push(state),
    );

    window.dispatchEvent(new PopStateEvent('popstate', { state: { at: 1 } }));
    stop();
    window.dispatchEvent(new PopStateEvent('popstate', { state: { at: 2 } }));

    expect(heard).toEqual([{ at: 1 }]);
  });

  it('tells whether the browser has a close watcher', () => {
    const sessionHistory = injectOn(SessionHistoryService, 'browser');

    expect(sessionHistory.hasCloseWatcher()).toBe(false);

    Object.defineProperty(window, 'CloseWatcher', {
      value: class {},
      configurable: true,
    });

    expect(sessionHistory.hasCloseWatcher()).toBe(true);
  });
});
