import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SessionHistoryService } from '@app/core/services';
import { BackLayersService } from './back-layers.service';
import { LAYER_KEY } from '../rules/back-layers.rules';
import { HistoryStackDouble } from '@testing/doubles/session-history.double';

const setup = ({ hasCloseWatcher = false } = {}) => {
  const history = new HistoryStackDouble();
  history.hasWatcher = hasCloseWatcher;
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      BackLayersService,
      { provide: SessionHistoryService, useValue: history },
    ],
  });
  return {
    history,
    layers: TestBed.inject(BackLayersService),
    leave: () => TestBed.inject(Router).navigateByUrl('/elsewhere'),
  };
};

describe('BackLayersService', () => {
  it('adds a history entry on the same address, keeping its state', () => {
    const { history, layers } = setup();

    layers.push(vi.fn());

    expect(history.entries).toEqual([
      { navigationId: 1 },
      { navigationId: 1, [LAYER_KEY]: 1 },
    ]);
  });

  it('closes the layer when the reader goes back, without going back again', () => {
    const { history, layers } = setup();
    const onBack = vi.fn();
    const release = layers.push(onBack);

    history.pressBack();
    release();

    expect(onBack).toHaveBeenCalledOnce();
    expect(history.backs).toEqual([]);
  });

  it('takes its entry back when the page closes the layer, and swallows that return', () => {
    const { history, layers } = setup();
    const onBack = vi.fn();
    const release = layers.push(onBack);

    release();
    history.deliverPops();
    release();

    expect(history.backs).toEqual([1]);
    expect(history.place).toBe(0);
    expect(onBack).not.toHaveBeenCalled();
  });

  it('still hears the next back once the swallowed return is past', () => {
    const { history, layers } = setup();
    layers.push(vi.fn())();
    history.deliverPops();
    const onBack = vi.fn();
    layers.push(onBack);

    history.pressBack();

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('closes the top layer first when two are open', () => {
    const { history, layers } = setup();
    const closed: string[] = [];
    layers.push(() => closed.push('lower'));
    layers.push(() => closed.push('upper'));

    history.pressBack();

    expect(closed).toEqual(['upper']);

    history.pressBack();

    expect(closed).toEqual(['upper', 'lower']);
  });

  it('closes every layer when the router leaves the view, and takes no entry back', async () => {
    const { history, layers, leave } = setup();
    const onBack = vi.fn();
    const release = layers.push(onBack);

    await leave();
    release();

    expect(onBack).toHaveBeenCalledOnce();
    expect(history.backs).toEqual([]);
  });

  it('adds nothing to the history where the browser closes on back by itself', () => {
    const { history, layers } = setup({ hasCloseWatcher: true });
    const onBack = vi.fn();

    const release = layers.push(onBack);
    history.pressBack();
    release();

    expect(history.entries).toHaveLength(1);
    expect(history.backs).toEqual([]);
    expect(onBack).not.toHaveBeenCalled();
  });

  it('claims a layer through the history where the browser has no close watcher', () => {
    const { history, layers } = setup();
    const onBack = vi.fn();

    layers.claim(onBack, vi.fn());
    history.pressBack();

    expect(history.entries).toHaveLength(2);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('claims a layer through a close watcher, without touching the history, where the browser has one', () => {
    const { history, layers } = setup({ hasCloseWatcher: true });
    const onBack = vi.fn();

    layers.claim(onBack, vi.fn());
    history.pressBack();

    expect(history.entries).toHaveLength(1);
    expect(history.backs).toEqual([]);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('gives each claimed layer its own close watcher, the last one closing first', () => {
    const { history, layers } = setup({ hasCloseWatcher: true });
    const closed: string[] = [];
    layers.claim(() => closed.push('lower'), vi.fn());
    layers.claim(() => closed.push('upper'), vi.fn());

    history.pressBack();
    history.pressBack();

    expect(closed).toEqual(['upper', 'lower']);
  });

  it.each([true, false])(
    'no longer hears the back of a claimed layer once it is released, with a close watcher: %s',
    (hasCloseWatcher) => {
      const { history, layers } = setup({ hasCloseWatcher });
      const onBack = vi.fn();

      layers.claim(onBack, vi.fn())();
      history.deliverPops();
      history.pressBack();

      expect(onBack).not.toHaveBeenCalled();
    },
  );

  it.each([true, false])(
    'lets go of a claimed layer when the router leaves the view, without closing it, with a close watcher: %s',
    async (hasCloseWatcher) => {
      const { history, layers, leave } = setup({ hasCloseWatcher });
      const onBack = vi.fn();
      const onLeave = vi.fn();
      layers.claim(onBack, onLeave);

      await leave();

      expect(onLeave).toHaveBeenCalledOnce();
      expect(onBack).not.toHaveBeenCalled();

      history.pressBack();

      expect(onBack).not.toHaveBeenCalled();
      expect(onLeave).toHaveBeenCalledOnce();
    },
  );

  it('stops hearing the router once a claimed layer is released, where the browser has a close watcher', async () => {
    const { layers, leave } = setup({ hasCloseWatcher: true });
    const onLeave = vi.fn();

    layers.claim(vi.fn(), onLeave)();
    await leave();

    expect(onLeave).not.toHaveBeenCalled();
  });
});
