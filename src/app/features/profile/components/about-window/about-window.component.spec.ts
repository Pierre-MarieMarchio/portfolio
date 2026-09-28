import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { twoDigits } from '@app/core/helpers';
import { WindowComponent } from '@shared/windows/components';
import { CONTACT_EMAIL } from '../../data';
import { PROFILE_TEXTS } from '../../ports/profile-texts.port';
import { AboutWindowComponent } from './about-window.component';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { componentOf, recordOutput } from '@testing/fixtures/testbed.fixture';

const mount = async (inputs: { pinned?: boolean; part?: number } = {}) => {
  TestBed.configureTestingModule({
    imports: [AboutWindowComponent],
    providers: [provideTexts(), provideRouter([])],
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
    'titles the focusable h1 after part %i',
    async (part) => {
      const { host, about, parts } = await mount({ part });
      const h1 = host.querySelector('h1');

      expect(h1?.getAttribute('tabindex')).toBe('-1');
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

  it('keeps only the current part’s content in the DOM when switching parts', async () => {
    const { fixture, host, about } = await mount({ part: 0 });

    expect(host.textContent).toContain(about.profile.lead);
    expect(host.textContent).not.toContain(about.skills.heading);

    fixture.componentRef.setInput('part', 1);
    await fixture.whenStable();

    expect(host.textContent).not.toContain(about.profile.lead);
    expect(host.textContent).toContain(about.skills.heading);
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

  it('links to every project instead of a next button, on the last part', async () => {
    const { host, about } = await mount({ part: 3 });
    const footer = host.querySelector('.footer');
    const link = footer?.querySelector<HTMLAnchorElement>('a.next');

    expect(footer?.textContent).toContain(about.method.title);
    expect(footer?.querySelector('button.next')).toBeNull();
    expect(link?.textContent?.trim()).toBe(about.back);
    expect(link?.getAttribute('href')).toBe('/projets');
  });

  it('re-emits the window pin and close as its own outputs', async () => {
    const { fixture, host } = await mount();
    const pinToggled = recordOutput(fixture.componentInstance.pinToggled);
    const closed = recordOutput(fixture.componentInstance.closed);

    host.querySelector<HTMLButtonElement>('button.pin')?.click();
    host.querySelector<HTMLButtonElement>('button.close')?.click();

    expect(pinToggled).toHaveLength(1);
    expect(closed).toHaveLength(1);
  });

  it.each([
    [1, 'next', [2]],
    [1, 'previous', [0]],
    [3, 'next', []],
    [0, 'previous', []],
  ] as const)(
    'turns a swipe on part %i towards %s into the neighbouring part, within bounds',
    async (part, direction, emitted) => {
      const { fixture } = await mount({ part });
      const values = recordOutput(fixture.componentInstance.partChange);

      componentOf(fixture, WindowComponent).swiped.emit(direction);

      expect(values).toEqual(emitted);
    },
  );
});
