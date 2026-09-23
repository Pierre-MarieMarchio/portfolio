import { TestBed } from '@angular/core/testing';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import { animationPauseToggled } from './animation.action';
import { AnimationState } from './animation.state';
import { animationUpdater } from './animation.updater';

describe('animationUpdater', () => {
  let statewise: Statewise;
  let state: AnimationState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewiseTesting()],
    });

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(animationUpdater),
    );
    state = TestBed.inject(AnimationState);
  });

  it('starts with the scene in motion', () => {
    expect(state.paused()).toBe(false);
  });

  it('animationPauseToggled flips the paused flag', () => {
    statewise.dispatch(animationPauseToggled());

    expect(state.paused()).toBe(true);

    statewise.dispatch(animationPauseToggled());

    expect(state.paused()).toBe(false);
  });
});
