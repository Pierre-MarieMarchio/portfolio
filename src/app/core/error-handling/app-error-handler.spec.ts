import { ErrorHandler, Injectable, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createEffect,
  defineSingleAction,
  defineUpdater,
  emptyPayload,
  injectStatewise,
  provideStatewise,
} from 'ngx-statewise';
import { appConfig } from '../../app.config';
import { AppErrorHandler } from './app-error-handler';

const promised = defineSingleAction('PROMISED', emptyPayload);

@Injectable({ providedIn: 'root' })
class PromisedState {
  public readonly count = signal(0);
}

const promisedUpdater = defineUpdater(PromisedState, (on) => {
  on(promised, (state) => {
    state.count.update((count) => count + 1);
  });
});

/** An effect that promised an answer and gives none. */
@Injectable({ providedIn: 'root' })
class SilentEffect {
  public readonly promisedEffect = createEffect(promised, () => undefined, {
    mustAnswer: true,
  });
}

describe('AppErrorHandler', () => {
  let logged: unknown[];

  beforeEach(() => {
    logged = [];
    vi.spyOn(console, 'error').mockImplementation((error: unknown) => {
      logged.push(error);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is the handler the composition root provides', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(ErrorHandler)).toBeInstanceOf(AppErrorHandler);
  });

  it('logs what it is handed, in every build', () => {
    const failure = new Error('the catalogue did not load');

    new AppErrorHandler().handleError(failure);

    expect(logged).toEqual([failure]);
  });

  /**
   * The library reports a fire-and-forget dispatch's failure to Angular's
   * handler (an awaited one rejects instead), so it lands here.
   */
  it('receives what ngx-statewise reports', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideStatewise({ effects: [SilentEffect] }),
        { provide: ErrorHandler, useClass: AppErrorHandler },
      ],
    });
    const statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(promisedUpdater),
    );

    statewise.dispatch(promised());

    await vi.waitFor(() => {
      expect(logged).toEqual([expect.any(Error)]);
    });
  });
});
