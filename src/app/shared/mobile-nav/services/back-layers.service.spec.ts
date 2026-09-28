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
});
