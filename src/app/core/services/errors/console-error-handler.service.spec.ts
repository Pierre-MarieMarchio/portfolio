import { ErrorHandler, Service, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createEffect,
  defineSingleAction,
  defineUpdater,
  emptyPayload,
  injectStatewise,
  provideStatewise,
} from 'ngx-statewise';
import { ConsoleErrorHandlerService } from './console-error-handler.service';

const promised = defineSingleAction('PROMISED', emptyPayload);

@Service()
class PromisedState {
  public readonly count = signal(0);
}

const promisedUpdater = defineUpdater(PromisedState, (on) => {
  on(promised, (state) => {
    state.count.update((count) => count + 1);
  });
});

const giveNoAnswer = (): void => {};

@Service()
class SilentEffect {
  public readonly promisedEffect = createEffect(promised, giveNoAnswer, {
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

  it('logs what it is handed, in every build', () => {
    const failure = new Error('the catalogue did not load');

    new ConsoleErrorHandlerService().handleError(failure);

    expect(logged).toEqual([failure]);
  });

  it('receives what ngx-statewise reports', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideStatewise({ effects: [SilentEffect] }),
        { provide: ErrorHandler, useClass: ConsoleErrorHandlerService },
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
