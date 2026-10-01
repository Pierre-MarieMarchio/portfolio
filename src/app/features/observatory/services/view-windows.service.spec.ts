import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { resizeTo, stubMedia } from '@testing/doubles/browser.double';
import { ViewHeadingDirective } from '@shared/ui/directives';
import { WindowStackService } from '@shared/windows/services';
import { ObservatoryManager } from '../states';
import { ViewSlotDirective } from '../directives';
import { ViewWindowsService } from './view-windows.service';

@Component({
  imports: [ViewHeadingDirective, ViewSlotDirective],
  template: `
    <div appViewSlot="home">
      <h1 tabindex="-1" appViewHeading>Home</h1>
    </div>
    <div appViewSlot="preview">
      <h1 tabindex="-1" appViewHeading>Preview</h1>
    </div>
  `,
})
class Views {}

@Component({
  imports: [ViewSlotDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div appViewSlot="about">
      <div class="rail">
        <app-window>
          <div class="body"><div class="page"></div></div>
        </app-window>
      </div>
    </div>
  `,
})
class Scrolling {}

const TOUCH = new Set(['(pointer: coarse)', '(hover: none)']);

const mount = async (isPhone = false) => {
  if (isPhone) {
    stubMedia(TOUCH);
    resizeTo(412, 915);
  }
  TestBed.configureTestingModule({
    imports: [Views],
    providers: [provideStatewise(), WindowStackService, ViewWindowsService],
  });
  const observatory = TestBed.inject(ObservatoryManager);
  observatory.syncRoute('home');
  TestBed.inject(ViewWindowsService);
  const fixture = TestBed.createComponent(Views);
  document.body.append(fixture.nativeElement as HTMLElement);
  const settle = async (): Promise<void> => {
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  };
  await settle();
  observatory.syncRoute('index');
  await settle();
  observatory.syncRoute('home');
  await settle();
  return {
    fixture,
    observatory,
    settle,
    focused: () => document.activeElement?.textContent,
  };
};

const mountScrolling = async (isReduced: boolean) => {
  stubMedia(
    isReduced ? new Set(['(prefers-reduced-motion: reduce)']) : new Set(),
  );
  TestBed.configureTestingModule({
    imports: [Scrolling],
    providers: [provideStatewise(), WindowStackService, ViewWindowsService],
  });
  const windows = TestBed.inject(ViewWindowsService);
  const fixture = TestBed.createComponent(Scrolling);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const part = (selector: string): HTMLElement =>
    host.querySelector(selector) as HTMLElement;
  const scrollTo = vi.fn();
  for (const element of host.querySelectorAll('*')) {
    Object.defineProperty(element, 'scrollTo', { value: scrollTo });
  }
  return {
    windows,
    scrollTo,
    rail: part('.rail'),
    body: part('.body'),
    page: part('.page'),
  };
};

describe('ViewWindowsService', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('focuses the preview title once it is opened from home, like a page window', async () => {
    const { observatory, settle, focused } = await mount();
    expect(focused()).toBe('Home');

    observatory.openPreview('skyted');
    await settle();

    expect(focused()).toBe('Preview');
  });

  it('gives the focus back to the home title once the preview closes', async () => {
    const { observatory, settle, focused } = await mount();
    observatory.openPreview('skyted');
    await settle();

    observatory.togglePreview('skyted');
    await settle();

    expect(focused()).toBe('Home');
  });

  it('does not move the focus for a preview pinned open away from home', async () => {
    const { observatory, settle, focused } = await mount();
    observatory.syncRoute('index');
    await settle();

    observatory.openPreview('skyted');
    observatory.togglePin('preview');
    await settle();

    expect(focused()).not.toBe('Preview');
  });

  describe('on the phone, where the preview has no window of its own', () => {
    it('keeps the focus on the home title when a project is posed, the home sheet having no other heading to give', async () => {
      const { observatory, settle, focused } = await mount(true);
      expect(focused()).toBe('Home');
      const before = document.activeElement;

      observatory.openPreview('skyted');
      await settle();

      expect(focused()).toBe('Home');
      expect(document.activeElement).toBe(before);
    });

    it('does not take the focus again for each project posed after it', async () => {
      const { observatory, settle } = await mount(true);
      observatory.openPreview('skyted');
      await settle();
      (document.activeElement as HTMLElement).blur();

      observatory.openPreview('other');
      await settle();

      expect(document.activeElement).toBe(document.body);
    });

    it('lands on the home title after coming back to home', async () => {
      const { observatory, settle, focused } = await mount(true);
      observatory.syncRoute('index');
      await settle();

      observatory.syncRoute('home');
      await settle();

      expect(focused()).toBe('Home');
    });
  });

  describe('the scroll of a window', () => {
    it('says a window was scrolled once any part of its content is below the top', async () => {
      const { windows, body, page } = await mountScrolling(false);

      expect(windows.scrollToTop('about')).toBe(false);

      page.scrollTop = 40;
      expect(windows.scrollToTop('about')).toBe(true);

      page.scrollTop = 0;
      body.scrollTop = 40;
      expect(windows.scrollToTop('about')).toBe(true);
    });

    it('does not take the sheet around the window for the page being scrolled', async () => {
      const { windows, rail, scrollTo } = await mountScrolling(false);

      rail.scrollTop = 250;

      expect(windows.scrollToTop('about')).toBe(false);
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('scrolls nothing for a window nobody has shown', async () => {
      const { windows } = await mountScrolling(false);

      expect(windows.scrollToTop('index')).toBe(false);
      expect(windows.scrollToTop(null)).toBe(false);
    });

    it('brings what is scrolled back to the top smoothly, and leaves the rest', async () => {
      const { windows, page, scrollTo } = await mountScrolling(false);
      page.scrollTop = 40;

      windows.scrollToTop('about');

      expect(scrollTo).toHaveBeenCalledOnce();
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('brings it back to the top at once under reduced motion', async () => {
      const { windows, page, scrollTo } = await mountScrolling(true);
      page.scrollTop = 40;

      windows.scrollToTop('about');

      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    });
  });
});
