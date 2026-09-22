import {
  ChangeDetectionStrategy,
  Component,
  computed,
  NgZone,
  signal,
  ɵNoopNgZone as NoopNgZone,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { appConfig } from '@app/app.config';

@Component({
  template: `<p>{{ label() }}</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Counter {
  public readonly count = signal(0);
  public readonly label = computed(() => `count: ${String(this.count())}`);
}

/**
 * The mechanism under test: the application runs without zone.js, so a view
 * updates because a signal it reads changed, and for no other reason.
 */
describe('zoneless', () => {
  it('ships without zone.js', () => {
    expect((globalThis as { Zone?: unknown }).Zone).toBeUndefined();
  });

  /** What the composition root provides, not what TestBed defaults to. */
  it('gives the application a zone that does nothing', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(NgZone)).toBeInstanceOf(NoopNgZone);
  });

  /** No zone to notice the write: only the signal can schedule the render. */
  it('re-renders an OnPush view from a signal write alone', async () => {
    const fixture = TestBed.createComponent(Counter);
    await fixture.whenStable();

    fixture.componentInstance.count.set(2);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toBe('count: 2');
  });
});
