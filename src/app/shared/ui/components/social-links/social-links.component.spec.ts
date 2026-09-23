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

const mount = async (
  inputs: { showPause?: boolean; paused?: boolean } = {},
) => {
  TestBed.configureTestingModule({
    imports: [SocialLinksComponent],
    providers: [provideTexts()],
  });
  const fixture = TestBed.createComponent(SocialLinksComponent);
  fixture.componentRef.setInput('links', LINKS);
  fixture.componentRef.setInput('showPause', inputs.showPause ?? false);
  fixture.componentRef.setInput('paused', inputs.paused ?? false);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host,
    links: () => [...host.querySelectorAll('a')],
    pause: () => host.querySelector('button'),
  };
};

describe('ContactRailComponent', () => {
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

  /** A profile opens beside the site; a mail address opens the mail client. */
  it('opens only the external links in a new tab', async () => {
    const { links } = await mount();
    const [mail, github] = links();

    expect(mail?.hasAttribute('target')).toBe(false);
    expect(mail?.hasAttribute('rel')).toBe(false);
    expect(github?.getAttribute('target')).toBe('_blank');
    expect(github?.getAttribute('rel')).toBe('noopener');
  });

  it('shows the pause only when there is an object to pause', async () => {
    expect((await mount()).pause()).toBeNull();
    TestBed.resetTestingModule();

    const { pause, fixture } = await mount({ showPause: true });
    let toggled = 0;
    fixture.componentInstance.pauseToggled.subscribe(() => (toggled += 1));
    pause()?.click();

    expect(pause()?.getAttribute('aria-label')).toBe(
      'Mettre l’animation de l’objet en pause',
    );
    expect(toggled).toBe(1);
  });

  it('names the pause after what it will do', async () => {
    const { pause } = await mount({ showPause: true, paused: true });

    expect(pause()?.getAttribute('aria-label')).toBe(
      'Reprendre l’animation de l’objet',
    );
  });
});
