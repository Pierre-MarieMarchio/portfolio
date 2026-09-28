import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { WINDOW_TEXTS } from '../ports';
import { WindowComponent } from '../components/window/window.component';
import { KeptWindowDirective } from './kept-window.directive';

@Component({
  imports: [KeptWindowDirective, WindowComponent],
  template: `
    <div class="slot" appKeptWindow [shown]="shown()">
      <app-window heading="Console">
        <div body>BODY-MARK</div>
      </app-window>
    </div>
  `,
})
class KeptHost {
  public readonly shown = signal(true);
}

const mount = async () => {
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => {
    frames.push(fn);
    return frames.length;
  });
  TestBed.configureTestingModule({
    imports: [KeptHost],
    providers: [provideTexts()],
  });
  const fixture = TestBed.createComponent(KeptHost);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const slot = host.querySelector<HTMLElement>('.slot') as HTMLElement;
  const frame = async (): Promise<void> => {
    for (const next of frames.splice(0)) {
      next(0);
    }
    await fixture.whenStable();
  };
  const show = async (isShown: boolean): Promise<void> => {
    fixture.componentInstance.shown.set(isShown);
    await fixture.whenStable();
    await frame();
    await frame();
  };
  const fold = async (): Promise<void> => {
    const label = TestBed.inject(WINDOW_TEXTS)().fold;
    host
      .querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
      ?.click();
    await fixture.whenStable();
  };
  const isHidden = (): boolean =>
    slot.dataset['shown'] === 'false' &&
    slot.hasAttribute('inert') &&
    slot.style.getPropertyValue('content-visibility') === 'hidden';
  return { fixture, host, slot, frame, show, fold, isHidden };
};

describe('KeptWindowDirective', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the window it holds from the first render', async () => {
    const { slot } = await mount();

    expect(slot.dataset['shown']).toBe('true');
    expect(slot.hasAttribute('inert')).toBe(false);
    expect(slot.style.getPropertyValue('content-visibility')).toBe('');
  });

  it('hides a window without taking it off the page: inert, skipped, marked', async () => {
    const { host, show, isHidden } = await mount();

    await show(false);

    expect(isHidden()).toBe(true);
    expect(host.textContent).toContain('BODY-MARK');
  });

  it('shows a window again only once a frame has passed, so that its layout waits for the next one', async () => {
    const { fixture, frame, show, isHidden } = await mount();
    await show(false);

    fixture.componentInstance.shown.set(true);
    await fixture.whenStable();
    expect(isHidden()).toBe(true);
    await frame();
    expect(isHidden()).toBe(true);
    await frame();

    expect(isHidden()).toBe(false);
  });

  it('keeps where its body was scrolled to while hidden', async () => {
    const { host, show } = await mount();
    const body = host.querySelector<HTMLElement>('.body') as HTMLElement;
    body.scrollTop = 120;

    await show(false);
    await show(true);

    expect(host.querySelector('.body')).toBe(body);
    expect(body.scrollTop).toBe(120);
  });

  it('shows a window again unfolded, its glass back down, rising as it arrived', async () => {
    const { host, show, fold } = await mount();
    const pane = host.querySelector<HTMLElement>('.window') as HTMLElement;
    const rail = host.querySelector<HTMLElement>('.rail') as HTMLElement;
    const rise = { currentTime: 560 as number | null, play: vi.fn() };
    pane.getAnimations = () => [rise as unknown as Animation];
    await fold();
    expect(host.querySelector('.body')).toBeNull();

    await show(false);
    expect(host.querySelector('.body')).toBeNull();
    expect(rise.play).not.toHaveBeenCalled();
    rail.scrollTop = 300;
    rail.dataset['rest'] = 'end';
    await show(true);

    expect(host.querySelector('.body')?.textContent).toContain('BODY-MARK');
    expect(rail.scrollTop).toBe(0);
    expect(rise.currentTime).toBe(0);
    expect(rise.play).toHaveBeenCalledTimes(1);
  });

  it('leaves a lowered glass where it is when shown again', async () => {
    const { host, show } = await mount();
    const rail = host.querySelector<HTMLElement>('.rail') as HTMLElement;
    const writes: number[] = [];
    Object.defineProperty(rail, 'scrollTop', {
      get: () => 0,
      set: (top: number) => writes.push(top),
    });

    await show(false);
    await show(true);

    expect(writes).toEqual([]);
  });
});
