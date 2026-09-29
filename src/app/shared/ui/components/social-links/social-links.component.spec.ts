import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SocialLinksComponent } from './social-links.component';
import { SocialLink } from '../../models/social-link.model';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const LINKS: readonly SocialLink[] = [
  {
    href: 'mailto:someone@example.com',
    icon: 'email',
    label: 'Écrire à someone@example.com',
    title: 'Email',
    external: false,
  },
  {
    href: 'https://github.com/someone',
    icon: 'github',
    label: 'Dépôts GitHub',
    title: 'GitHub',
    external: true,
  },
];

const accessibleNameOf = (el: Element): string => {
  const labelledby = el.getAttribute('aria-labelledby');
  return labelledby
    ? labelledby
        .split(' ')
        .map((id) => el.ownerDocument.getElementById(id)?.textContent?.trim())
        .join(' ')
        .trim()
    : (el.getAttribute('aria-label') ?? el.textContent ?? '').trim();
};

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [SocialLinksComponent],
    providers: [provideTexts()],
  });
  const fixture = TestBed.createComponent(SocialLinksComponent);
  fixture.componentRef.setInput('links', LINKS);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host,
    links: () => [...host.querySelectorAll('a')],
  };
};

@Component({
  imports: [SocialLinksComponent],
  template: `<app-social-links [links]="links"
    ><button type="button">Extra</button></app-social-links
  >`,
})
class RailWithControl {
  protected readonly links = LINKS;
}

describe('SocialLinksComponent', () => {
  it('draws one named link per address, in order, with its icon', async () => {
    const { links } = await mount();

    expect(links().map((link) => link.getAttribute('href'))).toEqual([
      'mailto:someone@example.com',
      'https://github.com/someone',
    ]);
    expect(
      links().map((link) => link.querySelector('.label')?.textContent),
    ).toEqual(['Email', 'GitHub']);
    for (const link of links()) {
      expect(link.querySelector('svg path')?.getAttribute('d')).toBeTruthy();
      expect(link.hasAttribute('title')).toBe(false);
    }
  });

  it('names each link so the word it shows is in the name (label in name, WCAG 2.5.3)', async () => {
    const { links } = await mount();

    for (const link of links()) {
      const shown = link.querySelector('.label')?.textContent?.trim() ?? '';
      expect(shown).not.toBe('');
      expect(accessibleNameOf(link)).toContain(shown);
    }
    expect(accessibleNameOf(links()[0]!)).toContain(
      'Écrire à someone@example.com',
    );
    expect(accessibleNameOf(links()[1]!)).toContain('Dépôts GitHub');
  });

  it('opens only the external links in a new tab', async () => {
    const { links } = await mount();
    const [mail, github] = links();

    expect(mail?.hasAttribute('target')).toBe(false);
    expect(mail?.hasAttribute('rel')).toBe(false);
    expect(github?.getAttribute('target')).toBe('_blank');
    expect(github?.getAttribute('rel')).toBe('noopener');
  });

  it('names its list of links', async () => {
    const { host } = await mount();

    expect(host.querySelector('ul')?.getAttribute('aria-label')).toBe(
      'Me contacter',
    );
  });

  it('shows every link at once, behind no toggle', async () => {
    const { host, links } = await mount();

    expect(host.querySelector('button')).toBeNull();
    expect(links()).toHaveLength(2);
  });

  it('places the control it is given after its links, with them', async () => {
    TestBed.configureTestingModule({
      imports: [RailWithControl],
      providers: [provideTexts()],
    });
    const fixture = TestBed.createComponent(RailWithControl);
    await fixture.whenStable();
    const links = (fixture.nativeElement as HTMLElement).querySelector(
      'ul',
    )?.parentElement;

    expect(links?.lastElementChild?.textContent).toBe('Extra');
    expect(links?.firstElementChild?.tagName).toBe('UL');
  });

  it('shows no action button when none is given', async () => {
    const { host } = await mount();

    expect(host.querySelector('.action')).toBeNull();
  });

  it('places a given action right after the first link, named by its own visible word', async () => {
    TestBed.configureTestingModule({
      imports: [SocialLinksComponent],
      providers: [provideTexts()],
    });
    const fixture = TestBed.createComponent(SocialLinksComponent);
    fixture.componentRef.setInput('links', LINKS);
    fixture.componentRef.setInput('action', {
      icon: 'M0 0h24v24H0z',
      label: 'Copier l’adresse',
    });
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const items = [...host.querySelectorAll('ul > li')];
    const button = items[1]?.querySelector('button');

    expect(items).toHaveLength(3);
    expect(items[0]?.querySelector('a')?.getAttribute('href')).toBe(
      'mailto:someone@example.com',
    );
    expect(button?.querySelector('.label')?.textContent).toBe(
      'Copier l’adresse',
    );
    expect(button?.hasAttribute('title')).toBe(false);
    expect(button?.hasAttribute('aria-label')).toBe(false);
    expect(accessibleNameOf(button!)).toContain('Copier l’adresse');
    expect(items[2]?.querySelector('a')?.getAttribute('href')).toBe(
      'https://github.com/someone',
    );
  });

  it('reports when the action button is pressed', async () => {
    TestBed.configureTestingModule({
      imports: [SocialLinksComponent],
      providers: [provideTexts()],
    });
    const fixture = TestBed.createComponent(SocialLinksComponent);
    fixture.componentRef.setInput('links', LINKS);
    fixture.componentRef.setInput('action', {
      icon: 'M0 0h24v24H0z',
      label: 'Copier l’adresse',
    });
    const actioned = vi.fn();
    fixture.componentInstance.actioned.subscribe(actioned);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('.action')?.click();

    expect(actioned).toHaveBeenCalledOnce();
  });
});
