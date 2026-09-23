import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ViewFocusService } from './view-focus.service';
import { ViewHeadingDirective } from '../directives/view-heading.directive';

@Component({
  imports: [ViewHeadingDirective],
  template: `
    <section id="first">
      <h1 tabindex="-1" appViewHeading>First</h1>
    </section>
    <section id="second">
      @if (second()) {
        <h1 tabindex="-1" appViewHeading>Second</h1>
      }
    </section>
  `,
})
class Views {
  public readonly second = signal(false);
}

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [Views],
  });
  const fixture = TestBed.createComponent(Views);
  document.body.append(fixture.nativeElement as HTMLElement);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    focus: TestBed.inject(ViewFocusService),
    section: (id: string) => host.querySelector(`#${id}`) as Element,
    focused: () => document.activeElement?.textContent,
  };
};

describe('LandingFocus', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('focuses the heading inside the container it is asked for', async () => {
    const { focus, section, focused } = await mount();

    focus.claimWithin(() => section('first'));

    expect(focused()).toBe('First');
  });

  /** A window mounts in the render after the navigation that opens it. */
  it('waits for a heading that is not there yet', async () => {
    const { fixture, focus, section, focused } = await mount();

    focus.claimWithin(() => section('second'));
    expect(focused()).not.toBe('Second');

    fixture.componentInstance.second.set(true);
    await fixture.whenStable();

    expect(focused()).toBe('Second');
  });

  it('gives up after 2500 ms, and never steals the focus later', async () => {
    const { fixture, focus, section, focused } = await mount();
    vi.useFakeTimers({ toFake: ['Date'] });

    focus.claimWithin(() => section('second'));
    vi.advanceTimersByTime(2501);
    fixture.componentInstance.second.set(true);
    await fixture.whenStable();

    expect(focused()).not.toBe('Second');
  });

  it('drops a claim that was withdrawn or replaced', async () => {
    const { fixture, focus, section, focused } = await mount();

    const withdraw = focus.claimWithin(() => section('second'));
    withdraw();
    fixture.componentInstance.second.set(true);
    await fixture.whenStable();

    expect(focused()).not.toBe('Second');
  });
});
