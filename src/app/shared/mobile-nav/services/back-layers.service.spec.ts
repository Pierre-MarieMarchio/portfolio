import { TestBed } from '@angular/core/testing';
import { BackLayersService } from './back-layers.service';
import { LAYER_KEY } from '../rules/back-layers.rules';
import {
  MobileNavPlatformDouble,
  provideMobileNavPlatform,
} from '@testing/doubles/mobile-nav-platform.double';

const setup = ({ hasCloseWatcher = false } = {}) => {
  const platform = new MobileNavPlatformDouble();
  platform.hasCloseWatcher = hasCloseWatcher;
  TestBed.configureTestingModule({
    providers: [provideMobileNavPlatform(platform)],
  });
  return { platform, layers: TestBed.inject(BackLayersService) };
};

describe('BackLayersService', () => {
  it('adds a history entry on the same address, keeping its state', () => {
    const { platform, layers } = setup();

    layers.push(vi.fn());

    expect(platform.entries).toEqual([
      { navigationId: 1 },
      { navigationId: 1, [LAYER_KEY]: 1 },
    ]);
  });

  it('closes the layer when the reader goes back, without going back again', () => {
    const { platform, layers } = setup();
    const onBack = vi.fn();
    const release = layers.push(onBack);

    platform.pressBack();
    release();

    expect(onBack).toHaveBeenCalledOnce();
    expect(platform.backs).toEqual([]);
  });

  it('takes its entry back when the page closes the layer, and swallows that return', () => {
    const { platform, layers } = setup();
    const onBack = vi.fn();
    const release = layers.push(onBack);

    release();
    platform.deliverPops();
    release();

    expect(platform.backs).toEqual([1]);
    expect(platform.place).toBe(0);
    expect(onBack).not.toHaveBeenCalled();
  });

  it('still hears the next back once the swallowed return is past', () => {
    const { platform, layers } = setup();
    layers.push(vi.fn())();
    platform.deliverPops();
    const onBack = vi.fn();
    layers.push(onBack);

    platform.pressBack();

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('closes the top layer first when two are open', () => {
    const { platform, layers } = setup();
    const closed: string[] = [];
    layers.push(() => closed.push('lower'));
    layers.push(() => closed.push('upper'));

    platform.pressBack();

    expect(closed).toEqual(['upper']);

    platform.pressBack();

    expect(closed).toEqual(['upper', 'lower']);
  });

  it('closes every layer when the router leaves the view, and takes no entry back', () => {
    const { platform, layers } = setup();
    const onBack = vi.fn();
    const release = layers.push(onBack);

    platform.leave();
    release();

    expect(onBack).toHaveBeenCalledOnce();
    expect(platform.backs).toEqual([]);
  });

  it('adds nothing to the history where the browser closes on back by itself', () => {
    const { platform, layers } = setup({ hasCloseWatcher: true });
    const onBack = vi.fn();

    const release = layers.push(onBack);
    platform.pressBack();
    release();

    expect(platform.entries).toHaveLength(1);
    expect(platform.backs).toEqual([]);
    expect(onBack).not.toHaveBeenCalled();
  });

  it('claims a layer through the history where the browser has no close watcher', () => {
    const { platform, layers } = setup();
    const onBack = vi.fn();

    layers.claim(onBack, vi.fn());
    platform.pressBack();

    expect(platform.entries).toHaveLength(2);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('claims a layer through a close watcher, without touching the history, where the browser has one', () => {
    const { platform, layers } = setup({ hasCloseWatcher: true });
    const onBack = vi.fn();

    layers.claim(onBack, vi.fn());
    platform.pressBack();

    expect(platform.entries).toHaveLength(1);
    expect(platform.backs).toEqual([]);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('gives each claimed layer its own close watcher, the last one closing first', () => {
    const { platform, layers } = setup({ hasCloseWatcher: true });
    const closed: string[] = [];
    layers.claim(() => closed.push('lower'), vi.fn());
    layers.claim(() => closed.push('upper'), vi.fn());

    platform.pressBack();
    platform.pressBack();

    expect(closed).toEqual(['upper', 'lower']);
  });

  it.each([true, false])(
    'no longer hears the back of a claimed layer once it is released, with a close watcher: %s',
    (hasCloseWatcher) => {
      const { platform, layers } = setup({ hasCloseWatcher });
      const onBack = vi.fn();

      layers.claim(onBack, vi.fn())();
      platform.deliverPops();
      platform.pressBack();

      expect(onBack).not.toHaveBeenCalled();
    },
  );

  it.each([true, false])(
    'lets go of a claimed layer when the router leaves the view, without closing it, with a close watcher: %s',
    (hasCloseWatcher) => {
      const { platform, layers } = setup({ hasCloseWatcher });
      const onBack = vi.fn();
      const onLeave = vi.fn();
      layers.claim(onBack, onLeave);

      platform.leave();

      expect(onLeave).toHaveBeenCalledOnce();
      expect(onBack).not.toHaveBeenCalled();

      platform.pressBack();

      expect(onBack).not.toHaveBeenCalled();
      expect(onLeave).toHaveBeenCalledOnce();
    },
  );
});
