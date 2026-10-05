import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { twoDigits } from '@app/core/helpers';
import { PagerComponent } from '@shared/mobile-nav/components';
import { CONTACT_EMAIL } from '../../data';
import { PROFILE_TEXTS } from '../../ports/profile-texts.port';
import { AboutWindowComponent } from './about-window.component';
import { WindowComponent } from '@shared/windows/components';
import { ScrollMemoryService } from '@shared/windows/services';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { componentOf, recordOutput } from '@testing/fixtures/testbed.fixture';
import { stubViewport } from '@testing/doubles/browser.double';
import { provideMobileNavLayout } from '@testing/doubles/mobile-nav-layout.double';

const mount = async (inputs: { pinned?: boolean; part?: number } = {}) => {
  TestBed.configureTestingModule({
    imports: [AboutWindowComponent],
    providers: [provideTexts(), provideRouter([]), provideMobileNavLayout()],
  });

  const fixture = TestBed.createComponent(AboutWindowComponent);
  if (inputs.pinned !== undefined) {
    fixture.componentRef.setInput('pinned', inputs.pinned);
  }
  if (inputs.part !== undefined) {
    fixture.componentRef.setInput('part', inputs.part);
  }
  await fixture.whenStable();
  const about = TestBed.inject(PROFILE_TEXTS)().about;

  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    about,
    parts: [about.profile, about.skills, about.path, about.method],
    toolbar: `[aria-label="${about.parts}"]`,
  };
};

const textsOf = (elements: Iterable<Element>): (string | undefined)[] =>
  [...elements].map((element) => element.textContent?.trim());

describe('AboutWindowComponent', () => {
  it('defaults to the first part and unpinned, with no input set', async () => {
    const { host, about } = await mount();

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      about.title(about.profile.title),
    );
    expect(host.querySelector('button.pin')?.getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('opens a window titled and labelled for "about", with an empty meta', async () => {
    const { host, about } = await mount();
    const window = host.querySelector('.window');

    expect(window?.getAttribute('aria-label')).toBe(about.label);
    expect(window?.querySelector('h2')?.textContent?.trim()).toBe(
      about.heading,
    );
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('');
  });

  it('asks its window for a stable height, so a section change does not resize it', async () => {
    const { fixture } = await mount();

    expect(componentOf(fixture, WindowComponent).stableHeight()).toBe(true);
  });

  it('lists the parts in the toolbar, in order, pressed on the current one', async () => {
    const { host, about, parts, toolbar } = await mount({ part: 2 });
    const buttons = [
      ...(host.querySelector(toolbar)?.querySelectorAll('button') ?? []),
    ];

    expect(textsOf(buttons)).toEqual(parts.map((part) => part.label));
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(
      parts.map((part) => about.goTo(part.title)),
    );
    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(['false', 'false', 'true', 'false']);
  });

  it('emits partChange on a toolbar click, without changing the part by itself', async () => {
    const { fixture, host, toolbar } = await mount({ part: 0 });
    const emitted = recordOutput(fixture.componentInstance.partChange);

    host
      .querySelector(toolbar)
      ?.querySelectorAll<HTMLButtonElement>('button')[2]
      ?.click();
    await fixture.whenStable();

    expect(emitted).toEqual([2]);
    expect(
      host
        .querySelector(toolbar)
        ?.querySelectorAll('button')[0]
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it.each([0, 1, 2, 3])(
    'titles the h1, left to the window title for the focus, after part %i',
    async (part) => {
      const { host, about, parts } = await mount({ part });
      const h1 = host.querySelector('h1');

      expect(h1?.hasAttribute('tabindex')).toBe(false);
      expect(h1?.textContent?.trim()).toBe(
        about.title(parts[part]?.title ?? ''),
      );
    },
  );

  it('treats a part out of range as the first', async () => {
    const { host, about } = await mount({ part: 9 });

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      about.title(about.profile.title),
    );
  });

  it('shows the profile part: the lead sentence and the identity list', async () => {
    const { host, about } = await mount({ part: 0 });

    expect(host.querySelector('p.lead')?.textContent?.trim()).toBe(
      about.profile.lead,
    );
    expect(textsOf(host.querySelectorAll('.facts dt'))).toEqual(
      about.profile.facts.map((fact) => fact.term),
    );
    expect(textsOf(host.querySelectorAll('.facts dd'))).toEqual(
      about.profile.facts.map((fact) => fact.value),
    );
  });

  it('shows the skills part: its heading and the domains numbered 01 to n, in data order', async () => {
    const { host, about } = await mount({ part: 1 });

    expect(host.textContent).toContain(about.skills.heading);
    expect(textsOf(host.querySelectorAll('.domains .number'))).toEqual(
      about.skills.domains.map((_, index) => twoDigits(index + 1)),
    );
    expect(textsOf(host.querySelectorAll('.domains .label'))).toEqual(
      about.skills.domains.map((domain) => domain.label),
    );
  });

  it('shows the path part: its heading over the milestones, in data order', async () => {
    const { host, about } = await mount({ part: 2 });
    const milestones = host.querySelector('.milestones');

    expect(milestones?.previousElementSibling?.textContent?.trim()).toBe(
      about.path.heading,
    );
    expect(textsOf(host.querySelectorAll('.milestones dt'))).toEqual(
      about.path.milestones.map((milestone) => milestone.year),
    );
    expect(textsOf(host.querySelectorAll('.milestones dd'))).toEqual(
      about.path.milestones.map((milestone) => milestone.fact),
    );
  });

  it('shows the last part: its heading and the steps numbered 01 to n, in data order', async () => {
    const { host, about } = await mount({ part: 3 });

    expect(host.textContent).toContain(about.method.heading);
    expect(textsOf(host.querySelectorAll('ul.method .step'))).toEqual(
      about.method.steps.map((_, index) => twoDigits(index + 1)),
    );
    expect(textsOf(host.querySelectorAll('ul.method .text'))).toEqual(
      about.method.steps,
    );
  });

  it('ends the last part with a line to write to the contact address, after the list', async () => {
    const { host, about } = await mount({ part: 3 });
    const contact = host.querySelector('ul.method + p.contact');
    const address = contact?.querySelector<HTMLAnchorElement>('a');

    expect(contact?.textContent?.replaceAll(/\s+/g, ' ').trim()).toBe(
      `${about.method.contact} ${CONTACT_EMAIL}.`,
    );
    expect(address?.textContent?.trim()).toBe(CONTACT_EMAIL);
    expect(address?.getAttribute('href')).toBe(`mailto:${CONTACT_EMAIL}`);
  });

  it('lets only the current part be reached when switching parts', async () => {
    const { fixture, host, about } = await mount({ part: 0 });
    const reachable = () =>
      host.querySelector('app-pager-page:not([inert])')?.textContent ?? '';

    expect(reachable()).toContain(about.profile.lead);
    expect(reachable()).not.toContain(about.skills.heading);

    fixture.componentRef.setInput('part', 1);
    await fixture.whenStable();

    expect(reachable()).not.toContain(about.profile.lead);
    expect(reachable()).toContain(about.skills.heading);
  });

  it.each([0, 1, 2])(
    'shows the title of part %i in the footer, and a button to the next part',
    async (part) => {
      const { fixture, host, about, parts } = await mount({ part });
      const emitted = recordOutput(fixture.componentInstance.partChange);
      const footer = host.querySelector('.footer');
      const next = footer?.querySelector<HTMLButtonElement>('button.next');

      expect(footer?.textContent).toContain(parts[part]?.title);
      expect(next?.textContent?.trim()).toBe(
        about.next(parts[part + 1]?.label ?? ''),
      );

      next?.click();
      expect(emitted).toEqual([part + 1]);
    },
  );

  describe('on the phone', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('drops the next-part button and keeps the part title in the footer', async () => {
      stubViewport(390, 844);
      const { host, parts } = await mount({ part: 1 });
      const footer = host.querySelector('.footer');

      expect(footer?.textContent).toContain(parts[1]?.title);
      expect(footer?.querySelector('button.next')).toBeNull();
      expect(footer?.querySelector('a.next')).toBeNull();
    });

    it('still links to every project on the last part', async () => {
      stubViewport(390, 844);
      const { host, about } = await mount({ part: 3 });

      expect(host.querySelector('.footer a.next')?.textContent?.trim()).toBe(
        about.back,
      );
    });
  });

  it('links to every project instead of a next button, on the last part', async () => {
    const { host, about } = await mount({ part: 3 });
    const footer = host.querySelector('.footer');
    const link = footer?.querySelector<HTMLAnchorElement>('a.next');

    expect(footer?.textContent).toContain(about.method.title);
    expect(footer?.querySelector('button.next')).toBeNull();
    expect(link?.textContent?.trim()).toBe(about.back);
    expect(link?.getAttribute('href')).toBe('/projets');
  });

  it('re-emits the window minimize, pin and close as its own outputs', async () => {
    const { fixture, host } = await mount();
    const minimized = recordOutput(fixture.componentInstance.minimized);
    const pinToggled = recordOutput(fixture.componentInstance.pinToggled);
    const closed = recordOutput(fixture.componentInstance.closed);

    host.querySelector<HTMLButtonElement>('button.minimize')?.click();
    host.querySelector<HTMLButtonElement>('button.pin')?.click();
    host.querySelector<HTMLButtonElement>('button.close')?.click();

    expect(minimized).toHaveLength(1);
    expect(pinToggled).toHaveLength(1);
    expect(closed).toHaveLength(1);
  });

  it('turns the page the reader swiped to into partChange', async () => {
    const { fixture } = await mount({ part: 1 });
    const values = recordOutput(fixture.componentInstance.partChange);

    componentOf(fixture, PagerComponent).indexChange.emit(2);

    expect(values).toEqual([2]);
  });

  it('presses the tab of the page the pager is visibly on, before partChange settles', async () => {
    const { fixture, host, toolbar } = await mount({ part: 0 });

    componentOf(fixture, PagerComponent).shownChange.emit(2);
    await fixture.whenStable();

    const buttons = [
      ...(host.querySelector(toolbar)?.querySelectorAll('button') ?? []),
    ];
    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(['false', 'false', 'true', 'false']);
  });

  it('keeps the tab where the pager showed it once the committed part catches up to the same page', async () => {
    const { fixture, host, toolbar } = await mount({ part: 0 });

    componentOf(fixture, PagerComponent).shownChange.emit(2);
    await fixture.whenStable();
    fixture.componentRef.setInput('part', 2);
    await fixture.whenStable();

    expect(
      host
        .querySelector(toolbar)
        ?.querySelectorAll('button')[2]
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('moves the tab back if the gesture returns to the page it started from', async () => {
    const { fixture, host, toolbar } = await mount({ part: 0 });
    const pager = componentOf(fixture, PagerComponent);

    pager.shownChange.emit(2);
    pager.shownChange.emit(0);
    await fixture.whenStable();

    expect(
      host
        .querySelector(toolbar)
        ?.querySelectorAll('button')[0]
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('remembers where its body was scrolled, under its own key', async () => {
    const { host } = await mount();
    const body = host.querySelector<HTMLElement>('.body');
    if (!body) {
      throw new Error('expected a body');
    }

    body.scrollTop = 90;
    body.dispatchEvent(new Event('scroll'));

    expect(TestBed.inject(ScrollMemoryService).read('about')).toBe(90);
  });
});
