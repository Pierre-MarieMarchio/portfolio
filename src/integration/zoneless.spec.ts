import {
  ApplicationRef,
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
})
class Counter {
  public readonly count = signal(0);
  public readonly label = computed(() => `count: ${String(this.count())}`);
}

@Component({
  template: `<p>{{ read() }}</p>`,
})
class Unwatched {
  public checks = 0;
  public text = 'first';

  public read(): string {
    this.checks += 1;
    return this.text;
  }
}

describe('zoneless', () => {
  it('ships without zone.js', () => {
    expect('Zone' in globalThis).toBe(false);
  });

  it('gives the application a zone that does nothing', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(NgZone)).toBeInstanceOf(NoopNgZone);
  });

  it('re-renders an OnPush view from a signal write alone', async () => {
    const fixture = TestBed.createComponent(Counter);
    await fixture.whenStable();

    fixture.componentInstance.count.set(2);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toBe('count: 2');
  });

  it('leaves a view unchecked by default when nothing it reads changed', async () => {
    const fixture = TestBed.createComponent(Unwatched);
    await fixture.whenStable();
    const checked = fixture.componentInstance.checks;

    fixture.componentInstance.text = 'second';
    TestBed.inject(ApplicationRef).tick();
    await fixture.whenStable();

    expect(fixture.componentInstance.checks).toBe(checked);
    expect((fixture.nativeElement as HTMLElement).textContent).toBe('first');
  });
});
