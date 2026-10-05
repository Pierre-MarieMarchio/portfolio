import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ClipboardService } from '@app/core/services';
import { restoreDialogs, stubDialogs } from '@testing/doubles/browser.double';
import { provideMobileNavPlatform } from '@testing/doubles/mobile-nav-platform.double';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { PROFILE_TEXTS } from '../../ports';
import { ContactLinksComponent } from './contact-links.component';

const accessibleNameOf = (el: Element): string =>
  (el.getAttribute('aria-labelledby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map((id) => el.ownerDocument.getElementById(id)?.textContent)
    .join(' ');

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

const setup = async ({ canCopy = true, withLanguages = false } = {}) => {
  stubDialogs();
  const copy = vi.fn(() => Promise.resolve(canCopy));
  TestBed.configureTestingModule({
    imports: [ContactLinksComponent],
    providers: [
      provideRouter([]),
      provideTexts(),
      provideMobileNavPlatform(),
      { provide: ClipboardService, useValue: { copy } },
    ],
  });
  const texts = TestBed.inject(PROFILE_TEXTS)();
  const fixture = TestBed.createComponent(ContactLinksComponent);
  fixture.componentRef.setInput('arrival', 'shown');
  if (withLanguages) {
    fixture.componentRef.setInput('languages', LANGUAGES);
  }
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host,
    texts,
    copy,
    items: () => [...host.querySelectorAll('ul > li')],
    said: () => host.querySelector('.copy-said'),
    stable: () => fixture.whenStable(),
  };
};

describe('ContactLinksComponent', () => {
  afterEach(() => {
    restoreDialogs();
    vi.useRealTimers();
  });

  it('hands the other language to its menu, as the last row', async () => {
    const { host } = await setup({ withLanguages: true });
    const last = [...host.querySelectorAll('.action-row')].at(-1);

    expect(last?.getAttribute('href')).toBe('/en/projects');
    expect(last?.getAttribute('hreflang')).toBe('en');
  });

  it('has no language row when it is given no languages', async () => {
    const { host } = await setup();

    expect(host.querySelector('.action-row[hreflang]')).toBeNull();
  });

  it('shows each address as a labelled entry of the rail', async () => {
    const { host } = await setup();
    const links = [...host.querySelectorAll('ul a')];

    expect(
      links.map((link) => link.querySelector('.label')?.textContent),
    ).toEqual(['E-mail', 'LinkedIn', 'GitHub', 'CV']);
    expect(links.every((link) => !link.hasAttribute('title'))).toBe(true);
  });

  it('names each link so the word it shows is in the name (label in name, WCAG 2.5.3)', async () => {
    const { host, texts } = await setup();
    const links = [...host.querySelectorAll('ul a')];
    const names = links.map((link) => accessibleNameOf(link));
    const shown = links.map(
      (link) => link.querySelector('.label')?.textContent,
    );

    expect(names).toEqual([
      expect.stringContaining(texts.contact.email),
      expect.stringContaining(texts.contact.linkedin),
      expect.stringContaining(texts.contact.github),
      expect.stringContaining(texts.contact.cv),
    ]);
    for (const [index, name] of names.entries()) {
      expect(name).toContain(shown[index]);
    }
  });

  it('opens the CV in a new tab', async () => {
    const { host } = await setup();
    const cv = host.querySelector('a[href="Pierre-Marie-Marchio-CV.pdf"]');

    expect(cv?.getAttribute('target')).toBe('_blank');
    expect(cv?.getAttribute('rel')).toBe('noopener');
  });

  it('places a button to copy the address right after the e-mail entry', async () => {
    const { items, texts } = await setup();
    const [mail, copyButton, linkedin] = items();
    const button = copyButton!.querySelector('button')!;

    expect(mail!.querySelector('a')!.getAttribute('href')).toBe(
      'mailto:pierremariemarchio.pro@gmail.com',
    );
    expect(button.querySelector('.label')!.textContent).toBe(
      texts.contactMenu.copy,
    );
    expect(button.hasAttribute('title')).toBe(false);
    expect(button.textContent?.trim()).toBe(texts.contactMenu.copy);
    expect(linkedin!.querySelector('a')!.getAttribute('href')).toContain(
      'linkedin.com',
    );
  });

  it('copies the address and announces it, like the phone sheet', async () => {
    const { host, copy, said, texts, stable } = await setup();
    const button = host.querySelector<HTMLButtonElement>('.rail button');

    expect(said()?.textContent?.trim()).toBe('');

    button?.click();
    await stable();

    expect(copy).toHaveBeenCalledWith('pierremariemarchio.pro@gmail.com');
    expect(said()?.textContent?.trim()).toBe(texts.contactMenu.copied);
  });

  it('says nothing when the browser would not copy', async () => {
    const { host, copy, said, stable } = await setup({ canCopy: false });
    const button = host.querySelector<HTMLButtonElement>('.rail button');

    button?.click();
    await stable();

    expect(copy).toHaveBeenCalledOnce();
    expect(said()?.textContent?.trim()).toBe('');
  });
});
