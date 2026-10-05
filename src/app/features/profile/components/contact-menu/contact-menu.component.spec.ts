import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ClipboardService } from '@app/core/services';
import { LanguageItem } from '@shared/ui/models';
import { SHARED_TEXTS } from '@shared/ui/ports';
import { CONTACT_ADDRESSES, CONTACT_EMAIL } from '../../data';
import { PROFILE_TEXTS } from '../../ports';
import { ContactMenuComponent } from './contact-menu.component';
import {
  MobileNavPlatformDouble,
  provideMobileNavPlatform,
} from '@testing/doubles/mobile-nav-platform.double';
import { restoreDialogs, stubDialogs } from '@testing/doubles/browser.double';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const byIcon = (icon: string) =>
  CONTACT_ADDRESSES.find((address) => address.icon === icon);

const ENGLISH: LanguageItem = {
  code: 'EN',
  name: 'English',
  lang: 'en',
  route: '/en/projects',
  current: false,
};

const setup = async ({
  canCopy = true,
  language = null as LanguageItem | null,
} = {}) => {
  const { showModal } = stubDialogs();
  const copy = vi.fn(() => Promise.resolve(canCopy));
  const platform = new MobileNavPlatformDouble();
  TestBed.configureTestingModule({
    imports: [ContactMenuComponent],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideTexts(),
      provideMobileNavPlatform(platform),
      { provide: ClipboardService, useValue: { copy } },
    ],
  });
  const texts = TestBed.inject(PROFILE_TEXTS)();
  const fixture = TestBed.createComponent(ContactMenuComponent);
  fixture.componentRef.setInput(
    'links',
    CONTACT_ADDRESSES.map((address) => ({
      ...address,
      label: texts.contact[address.icon],
    })),
  );
  fixture.componentRef.setInput('language', language);
  const host = fixture.nativeElement as HTMLElement;
  await fixture.whenStable();
  const opener = host.querySelector<HTMLButtonElement>('.opener');
  const rows = [...host.querySelectorAll<HTMLElement>('.action-row')];
  const copyRow = rows.find((row) => row.tagName === 'BUTTON');
  const said = () => host.querySelector('output');
  return {
    fixture,
    host,
    texts,
    opener,
    rows,
    copyRow,
    said,
    copy,
    showModal,
    stable: () => fixture.whenStable(),
  };
};

describe('ContactMenuComponent', () => {
  afterEach(() => {
    restoreDialogs();
    vi.useRealTimers();
  });

  it('opens its menu from one labelled button, named by the contact heading', async () => {
    const { host, texts, opener, showModal, stable } = await setup();

    expect(opener?.textContent?.trim()).toBe(texts.contactMenu.open);
    expect(opener?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(opener?.getAttribute('aria-expanded')).toBe('false');

    opener?.click();
    await stable();

    expect(showModal).toHaveBeenCalledOnce();
    expect(opener?.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('dialog h2')?.textContent?.trim()).toBe(
      TestBed.inject(SHARED_TEXTS)().contactRail.label,
    );
  });

  it('offers the e-mail, copying the address, then every other address, each named in words', async () => {
    const { rows, texts } = await setup();

    expect(rows.map((row) => row.getAttribute('href'))).toEqual([
      byIcon('email')?.href,
      null,
      byIcon('linkedin')?.href,
      byIcon('github')?.href,
      byIcon('cv')?.href,
    ]);
    expect(rows.map((row) => row.textContent?.trim())).toEqual([
      texts.contact.email,
      texts.contactMenu.copy,
      texts.contact.linkedin,
      texts.contact.github,
      texts.contact.cv,
    ]);
    expect(rows.every((row) => row.querySelector('svg path'))).toBe(true);
  });

  it('ends with a row to the same page in the other language, when given one', async () => {
    const { rows } = await setup({ language: ENGLISH });
    const last = rows.at(-1);

    expect(rows).toHaveLength(6);
    expect(last?.tagName).toBe('A');
    expect(last?.getAttribute('href')).toBe('/en/projects');
    expect(last?.getAttribute('hreflang')).toBe('en');
    expect(last?.getAttribute('lang')).toBe('en');
    expect(last?.textContent?.trim()).toBe('ENEnglish');
  });

  it('offers no language row without a language', async () => {
    const { rows } = await setup();

    expect(rows).toHaveLength(5);
  });

  it('opens only the external addresses in a new tab', async () => {
    const { rows } = await setup();
    const links = rows.filter((row) => row.tagName === 'A');

    expect(links.map((link) => link.getAttribute('target'))).toEqual(
      CONTACT_ADDRESSES.map((address) => (address.external ? '_blank' : null)),
    );
    expect(links.map((link) => link.getAttribute('rel'))).toEqual(
      CONTACT_ADDRESSES.map((address) =>
        address.external ? 'noopener' : null,
      ),
    );
  });

  it('copies the address, says so, and stays open', async () => {
    const { opener, copyRow, copy, said, texts, stable } = await setup();
    opener?.click();
    await stable();

    expect(said()?.textContent?.trim()).toBe('');

    copyRow?.click();
    await stable();

    expect(copy).toHaveBeenCalledWith(CONTACT_EMAIL);
    expect(said()?.textContent?.trim()).toBe(texts.contactMenu.copied);
    expect(opener?.getAttribute('aria-expanded')).toBe('true');
  });

  it('stops saying the address is copied a few seconds later', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { copyRow, said, stable } = await setup();

    copyRow?.click();
    await stable();
    vi.advanceTimersByTime(4000);
    await stable();

    expect(said()?.textContent?.trim()).toBe('');
  });

  it('says nothing when the browser would not copy', async () => {
    const { copyRow, copy, said, stable } = await setup({ canCopy: false });

    copyRow?.click();
    await stable();

    expect(copy).toHaveBeenCalledOnce();
    expect(said()?.textContent?.trim()).toBe('');
  });
});
