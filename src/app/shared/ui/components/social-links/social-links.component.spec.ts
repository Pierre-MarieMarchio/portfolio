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

describe('ContactRailComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('draws one named link per address, in order, with its icon', async () => {
    const { links } = await mount();

    expect(links().map((link) => link.getAttribute('href'))).toEqual([
      'mailto:someone@example.com',
      'https://github.com/someone',
    ]);
    expect(links().map((link) => link.getAttribute('aria-label'))).toEqual([
      'Écrire à someone@example.com',
      'Dépôts GitHub',
    ]);
    expect(links().map((link) => link.getAttribute('title'))).toEqual([
      'Email',
      'GitHub',
    ]);
    for (const link of links()) {
      expect(link.querySelector('svg path')?.getAttribute('d')).toBeTruthy();
    }
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

  it('folds its links behind one named toggle, which opens and closes them', async () => {
    const { fixture, host } = await mount();
    const toggle = host.querySelector('button');
    const panel = host.querySelector('ul')?.parentElement;
    const rail = host.querySelector<HTMLElement>('.rail');
    if (!toggle || !panel || !rail) {
      throw new Error('expected a toggle, its panel and the rail');
    }

    expect(toggle.getAttribute('aria-label')).toBe('Me contacter');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.id).toBeTruthy();
    expect(toggle.getAttribute('aria-controls')).toBe(panel.id);

    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(rail.dataset['open']).toBe('true');

    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
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
});
