import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { stubViewport } from '@testing/doubles/browser.double';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { LanguageSwitchComponent } from './language-switch.component';

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

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [LanguageSwitchComponent],
    providers: [provideRouter([]), provideTexts()],
  });

  const fixture = TestBed.createComponent(LanguageSwitchComponent);
  fixture.componentRef.setInput('languages', LANGUAGES);
  await fixture.whenStable();

  return { fixture, host: fixture.nativeElement as HTMLElement };
};

describe('LanguageSwitchComponent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing on the phone, where the language lives in the contact menu', async () => {
    stubViewport(390, 844);
    const { host } = await mount();

    expect(host.querySelector('.language')).toBeNull();
    expect(host.querySelector('a')).toBeNull();
  });

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

  it('separates the languages with a hidden slash', async () => {
    const { host } = await mount();
    const slashes = host.querySelectorAll('.slash[aria-hidden="true"]');

    expect(slashes).toHaveLength(1);
    expect(slashes[0]?.textContent).toBe('/');
  });
});
