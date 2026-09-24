import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { AnimationManager } from './animation.manager';

describe('AnimationManager', () => {
  let manager: AnimationManager;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewise()],
    });

    manager = TestBed.inject(AnimationManager);
  });

  it('exposes its state read-only', () => {
    expect('set' in manager.paused).toBe(false);
  });

  it('togglePause dispatches the pause flip', () => {
    manager.togglePause();

    expect(manager.paused()).toBe(true);

    manager.togglePause();

    expect(manager.paused()).toBe(false);
  });
});
