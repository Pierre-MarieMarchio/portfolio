import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
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

@Component({
  imports: [ViewHeadingDirective],
  template: `
    <app-window id="framed">
      <h2 tabindex="-1" data-window-title>Title</h2>
      <h1 class="landing">Hidden</h1>
    </app-window>
    <app-window id="registered">
      <h2 tabindex="-1" data-window-title>Other title</h2>
      <h1 tabindex="-1" appViewHeading>Registered</h1>
    </app-window>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Framed {}

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

describe('ViewFocusService', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('focuses the heading inside the container it is asked for, once the page has rendered', async () => {
    const { fixture, focus, section, focused } = await mount();

    focus.claimWithin(() => section('first'));
    expect(document.activeElement?.tagName).not.toBe('H1');

    await fixture.whenStable();
    expect(focused()).toBe('First');
  });

  it('keeps its claim while the heading cannot take the focus yet', async () => {
    const { fixture, focus, section } = await mount();
    const heading = section('first').querySelector('h1') as HTMLElement;
    heading.focus = () => {};

    focus.claimWithin(() => section('first'));
    await fixture.whenStable();
    expect(document.activeElement).not.toBe(heading);

    Reflect.deleteProperty(heading, 'focus');
    fixture.componentInstance.second.set(true);
    await fixture.whenStable();
    expect(document.activeElement).toBe(heading);
  });

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
    vi.useFakeTimers({ toFake: ['performance'] });

    focus.claimWithin(() => section('second'));
    vi.advanceTimersByTime(2501);
    fixture.componentInstance.second.set(true);
    await fixture.whenStable();

    expect(focused()).not.toBe('Second');
  });

  it('drops a claim that was withdrawn', async () => {
    const { fixture, focus, section, focused } = await mount();

    const withdraw = focus.claimWithin(() => section('second'));
    withdraw();
    fixture.componentInstance.second.set(true);
    await fixture.whenStable();

    expect(focused()).not.toBe('Second');
  });

  it('drops a claim that was replaced by another', async () => {
    const { fixture, focus, section, focused } = await mount();

    focus.claimWithin(() => section('second'));
    focus.claimWithin(() => section('first'));
    await fixture.whenStable();
    fixture.componentInstance.second.set(true);
    await fixture.whenStable();

    expect(focused()).toBe('First');
  });

  it('keeps the new claim when the one it replaced is withdrawn', async () => {
    const { fixture, focus, section, focused } = await mount();

    const withdrawReplaced = focus.claimWithin(() => section('second'));
    focus.claimWithin(() => section('second'));
    withdrawReplaced();
    fixture.componentInstance.second.set(true);
    await fixture.whenStable();

    expect(focused()).toBe('Second');
  });

  it('focuses the window title when the window has no registered heading', async () => {
    TestBed.configureTestingModule({ imports: [Framed] });
    const fixture = TestBed.createComponent(Framed);
    document.body.append(fixture.nativeElement as HTMLElement);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const focus = TestBed.inject(ViewFocusService);

    focus.claimWithin(() => host.querySelector('#framed') ?? undefined);
    await fixture.whenStable();

    expect(document.activeElement?.textContent).toBe('Title');
  });

  it('prefers the registered heading over the window title', async () => {
    TestBed.configureTestingModule({ imports: [Framed] });
    const fixture = TestBed.createComponent(Framed);
    document.body.append(fixture.nativeElement as HTMLElement);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const focus = TestBed.inject(ViewFocusService);

    focus.claimWithin(() => host.querySelector('#registered') ?? undefined);
    await fixture.whenStable();

    expect(document.activeElement?.textContent).toBe('Registered');
  });
});
