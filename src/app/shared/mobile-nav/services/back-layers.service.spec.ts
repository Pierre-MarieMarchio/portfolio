import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { ClockService, SessionHistoryService } from '@app/core/services';
import { BackLayersService } from './back-layers.service';
import { LAYER_KEY } from '../rules/back-layers.rules';
import { ClockDouble } from '@testing/doubles/browser-services.double';
import { HistoryStackDouble } from '@testing/doubles/session-history.double';

const setup = ({ hasCloseWatcher = false } = {}) => {
  const history = new HistoryStackDouble();
  history.hasWatcher = hasCloseWatcher;
  const clock = new ClockDouble();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      BackLayersService,
      { provide: SessionHistoryService, useValue: history },
      { provide: ClockService, useValue: clock },
    ],
  });
  return {
    history,
    clock,
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

  it('says when a navigation ends, and no longer once it stops listening', async () => {
    const { layers, leave } = setup();
    const onArrive = vi.fn();
    const stop = layers.onArrive(onArrive);

    expect(onArrive).not.toHaveBeenCalled();

    await leave();

    expect(onArrive).toHaveBeenCalledOnce();

    stop();
    await TestBed.inject(Router).navigateByUrl('/again');

    expect(onArrive).toHaveBeenCalledOnce();
  });

  it.each<[string, Routes]>([
    ['cancelled', [{ path: '**', canActivate: [() => false], children: [] }]],
    ['failed', []],
  ])(
    'takes the entry the leave left for the next layer, with a navigation %s, so that one back closes it',
    async (_ending, routes) => {
      const { history, layers } = setup();
      const router = TestBed.inject(Router);
      router.resetConfig(routes);
      const first = vi.fn();
      layers.claim(first, vi.fn());

      await router.navigateByUrl('/elsewhere').catch(() => false);
      const onBack = vi.fn();
      layers.claim(onBack, vi.fn());

      expect(history.entries).toHaveLength(2);

      history.pressBack();

      expect(onBack).toHaveBeenCalledOnce();
      expect(first).not.toHaveBeenCalled();
      expect(history.place).toBe(0);
    },
  );

  it('still adds its own entry while the return from a released layer is on its way', () => {
    const { history, layers } = setup();
    layers.push(vi.fn())();
    const staying = history.entries[1];
    vi.spyOn(history, 'state').mockReturnValue(staying);
    const push = vi.spyOn(history, 'push');

    layers.push(vi.fn());

    expect(push).toHaveBeenCalledOnce();
  });

  it.each<[string, Routes]>([
    ['cancelled', [{ path: '**', canActivate: [() => false], children: [] }]],
    ['failed', []],
  ])(
    'takes back the entry a layer left behind when the navigation is %s and nothing retook it, so that no step is invisible',
    async (_ending, routes) => {
      const { history, clock, layers } = setup();
      const router = TestBed.inject(Router);
      router.resetConfig(routes);
      const onBack = vi.fn();
      layers.push(onBack);

      await router.navigateByUrl('/elsewhere').catch(() => false);

      expect(history.backs).toEqual([]);

      clock.frame();

      expect(history.backs).toEqual([]);

      clock.frame();
      history.deliverPops();

      expect(history.backs).toEqual([1]);
      expect(history.place).toBe(0);
      expect(onBack).toHaveBeenCalledOnce();

      history.pressBack();

      expect(history.backs).toEqual([1]);
      expect(onBack).toHaveBeenCalledOnce();
    },
  );

  it('takes back nothing where the browser has a close watcher', async () => {
    const { history, clock, layers } = setup({ hasCloseWatcher: true });
    const router = TestBed.inject(Router);
    router.resetConfig([
      { path: '**', canActivate: [() => false], children: [] },
    ]);
    layers.claim(vi.fn(), vi.fn());
    layers.push(vi.fn());

    await router.navigateByUrl('/elsewhere').catch(() => false);
    clock.frame();
    clock.frame();

    expect(history.backs).toEqual([]);
    expect(history.entries).toHaveLength(1);
  });

  it('takes back nothing when the navigation ends well', async () => {
    const { history, clock, layers, leave } = setup();
    layers.push(vi.fn());

    await leave();
    clock.frame();
    clock.frame();

    expect(history.backs).toEqual([]);
  });

  it('takes back what a navigation left above a retaken layer before that layer goes back itself', async () => {
    const { history, clock, layers } = setup();
    const router = TestBed.inject(Router);
    router.resetConfig([
      { path: '**', canActivate: [() => false], children: [] },
    ]);
    layers.push(vi.fn());
    layers.push(vi.fn());
    await router.navigateByUrl('/elsewhere').catch(() => false);
    const release = layers.claim(vi.fn(), vi.fn());

    release();
    clock.frame();
    clock.frame();

    expect(history.backs).toEqual([1, 1]);
    expect(history.place).toBe(0);
  });
});
