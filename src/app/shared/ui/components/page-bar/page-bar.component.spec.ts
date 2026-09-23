import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { PageBarComponent } from './page-bar.component';

const LANGUAGES = [
  {
    code: 'FR',
    name: 'Français',
    lang: 'fr',
    route: '/projets',
    current: true,
  },
  {
    code: 'EN',
    name: 'English',
    lang: 'en',
    route: '/en/projects',
    current: false,
  },
];

const ITEMS = [
  { label: 'Accueil', route: '/' },
  { label: 'Projets', route: '/projets' },
];

const mount = async (current: string | null = null) => {
  TestBed.configureTestingModule({
    imports: [PageBarComponent],
    providers: [provideRouter([]), provideTexts()],
  });

  const fixture = TestBed.createComponent(PageBarComponent);
  fixture.componentRef.setInput('items', ITEMS);
  fixture.componentRef.setInput('current', current);
  fixture.componentRef.setInput('languages', LANGUAGES);
  await fixture.whenStable();

  return { fixture, host: fixture.nativeElement as HTMLElement };
};

describe('PageBarComponent', () => {
  it('lists one link per navigation item, in order', async () => {
    const { host } = await mount();
    const links = [...host.querySelectorAll('nav a')];

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Accueil',
      'Projets',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/projets',
    ]);
  });

  /** A sheet lights "Projets" although its own address is another one. */
  it('marks the entry it is told is current, and only that one', async () => {
    const { host } = await mount('/projets');
    const current = host.querySelectorAll('[aria-current="page"]');

    expect(current).toHaveLength(1);
    expect(current[0]?.textContent?.trim()).toBe('Projets');
  });

  /** D3: switching is a navigation, to the same page in the other language. */
  it('offers the other language as a link to the same page', async () => {
    const { host } = await mount();
    const other = host.querySelector('.language a');
    const attributes = ['href', 'hreflang', 'lang', 'aria-label'].map((name) =>
      other?.getAttribute(name),
    );

    expect(other?.textContent?.trim()).toBe('EN');
    expect(attributes).toEqual(['/en/projects', 'en', 'en', 'English']);
  });

  it('marks its own language, in a group named for it', async () => {
    const { host } = await mount();
    const group = host.querySelector('.language');
    const own = group?.querySelector('[aria-current="true"]');

    expect(group?.getAttribute('aria-label')).toBe('Langue du site');
    expect(own?.textContent?.trim()).toBe('FR');
  });

  it('names its navigation in the reader language', async () => {
    const { host } = await mount();

    expect(host.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Navigation principale',
    );
  });
});
