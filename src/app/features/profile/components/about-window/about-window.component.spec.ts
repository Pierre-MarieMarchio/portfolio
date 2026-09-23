import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutWindowComponent } from './about-window.component';
import { provideTexts } from '@testing/fixtures/texts.fixture';

type Part = 0 | 1 | 2 | 3;

const TOOLBAR = '[aria-label="Rubriques"]';

const TITLES: Record<Part, string> = {
  0: 'Profil',
  1: 'Compétences',
  2: 'Parcours',
  3: 'Et après',
};

const mount = async (inputs: { pinned?: boolean; part?: Part } = {}) => {
  TestBed.configureTestingModule({
    imports: [AboutWindowComponent],
    providers: [provideTexts(), provideRouter([])],
  });

  const fixture = TestBed.createComponent(AboutWindowComponent);
  fixture.componentRef.setInput('pinned', inputs.pinned ?? false);
  fixture.componentRef.setInput('part', inputs.part ?? 0);
  await fixture.whenStable();

  return { fixture, host: fixture.nativeElement as HTMLElement };
};

describe('AboutWindowComponent', () => {
  it('defaults to the first part and unpinned, with no input set', async () => {
    TestBed.configureTestingModule({
      imports: [AboutWindowComponent],
      providers: [provideTexts(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AboutWindowComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'À propos : Profil',
    );
    expect(host.querySelector('button.pin')?.getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('opens a window titled "À propos", with an empty meta', async () => {
    const { host } = await mount();
    const window = host.querySelector('.window');

    expect(window?.getAttribute('aria-label')).toBe('À propos');
    expect(window?.querySelector('h2')?.textContent?.trim()).toBe('À propos');
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('');
  });

  it('lists the toolbar segmented buttons, in order, pressed on the current part', async () => {
    const { host } = await mount({ part: 2 });
    const toolbar = host.querySelector(TOOLBAR);
    const buttons = [
      ...(toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ];

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Profil',
      'Compétences',
      'Parcours',
      'Et après',
    ]);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Aller à la rubrique Profil',
      'Aller à la rubrique Compétences',
      'Aller à la rubrique Parcours',
      'Aller à la rubrique Et après',
    ]);
    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(['false', 'false', 'true', 'false']);
  });

  it('emits partChange on a toolbar click, without changing the part by itself', async () => {
    const { fixture, host } = await mount({ part: 0 });
    const emitted: number[] = [];
    fixture.componentInstance.partChange.subscribe((value: number) =>
      emitted.push(value),
    );

    const toolbar = host.querySelector(TOOLBAR);
    const buttons = [
      ...(toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ];
    buttons[2]?.click();
    await fixture.whenStable();

    expect(emitted).toEqual([2]);
    expect(
      host
        .querySelector(TOOLBAR)
        ?.querySelectorAll('button')[0]
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('titles the h1 "Profil" on part 00, with a tabindex of -1', async () => {
    const { host } = await mount({ part: 0 });
    const h1 = host.querySelector('h1');

    expect(h1?.getAttribute('tabindex')).toBe('-1');
    expect(h1?.textContent?.trim()).toBe('À propos : Profil');
  });

  it('titles the h1 after the skills part', async () => {
    const { host } = await mount({ part: 1 });

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'À propos : Compétences',
    );
  });

  it('titles the h1 after the path part', async () => {
    const { host } = await mount({ part: 2 });

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'À propos : Parcours',
    );
  });

  it('titles the h1 after the "Et après" part, the last one', async () => {
    const { host } = await mount({ part: 3 });

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'À propos : Et après',
    );
  });

  it('treats a part out of range as the first', async () => {
    TestBed.configureTestingModule({
      imports: [AboutWindowComponent],
      providers: [provideTexts(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AboutWindowComponent);
    fixture.componentRef.setInput('part', 9);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'À propos : Profil',
    );
  });

  it('shows part 00: the lead sentence and the identity list', async () => {
    const { host } = await mount({ part: 0 });
    const text = host.textContent ?? '';

    expect(text).toContain(
      'Mes premières lignes de code, je les ai écrites pour modder Skyrim et Crusader Kings.',
    );
    const terms = [...host.querySelectorAll('dt')].map((dt) =>
      dt.textContent?.trim(),
    );
    expect(terms).toEqual(['Poste', 'Formation', 'Rythme', 'Lieu', 'Langues']);
    expect(text).toContain('Toulouse, ou en télétravail');
    expect(text).toContain('Bilingue français-anglais');
  });

  it('shows part 01: the caps and seven numbered rows, in order', async () => {
    const { host } = await mount({ part: 1 });
    const text = host.textContent ?? '';

    expect(text).toContain('Ce que je pratique');

    const rows: Array<[string, string]> = [
      ['01', 'Web'],
      ['02', 'Back'],
      ['03', 'Desktop'],
      ['04', 'Mobile'],
      ['05', 'Bluetooth et audio'],
      ['06', 'Architecture'],
      ['07', 'Outillage'],
    ];
    let cursor = -1;
    for (const [number, label] of rows) {
      const numberAt = text.indexOf(number, cursor + 1);
      expect(numberAt).toBeGreaterThan(cursor);
      const labelAt = text.indexOf(label, numberAt + 1);
      expect(labelAt).toBeGreaterThan(numberAt);
      cursor = labelAt;
    }
  });

  it('shows part 03: the caps and four numbered items, the first about finishing the degree', async () => {
    const { host } = await mount({ part: 3 });
    const text = host.textContent ?? '';

    expect(text).toContain('Ce que je cherche');
    expect(text).toContain(
      'Une alternance pour terminer mon titre, jusqu’en avril 2027.',
    );

    let cursor = -1;
    for (const number of ['01', '02', '03', '04']) {
      const at = text.indexOf(number, cursor + 1);
      expect(at).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it('shows part 02: Étapes, eight dated milestones, and ordered facts', async () => {
    const { host } = await mount({ part: 2 });
    const text = host.textContent ?? '';

    expect(text).toContain('Étapes');

    const years = [...host.querySelectorAll('.milestones dt')].map((dt) =>
      dt.textContent?.trim(),
    );
    expect(years).toEqual([
      '2016 – 2021',
      '2020',
      '2021 – 2023',
      '2023',
      '2024',
      '2024',
      '2025',
      '2025 –',
    ]);

    let cursor = -1;
    for (const fact of [
      'Archéologue',
      'Licence d’archéologie',
      'Autoformation',
      'Apple Foundation Program',
      'Titre Développeur web',
      'Numerilis',
      'Projets open source',
      'Alternance chez Skyted',
    ]) {
      const at = text.indexOf(fact, cursor + 1);
      expect(at).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it('heads the path part with Étapes alone, no side note', async () => {
    const { host } = await mount({ part: 2 });
    const head = host.querySelector('.milestones')?.previousElementSibling;

    expect(head?.textContent?.trim()).toBe('Étapes');
    expect(host.querySelector('.missing')).toBeNull();
  });

  it('ends the "Et après" part with a line to write, after the list', async () => {
    const { host } = await mount({ part: 3 });
    const contact = host.querySelector('ul.method + p.contact');
    const address = contact?.querySelector<HTMLAnchorElement>('a');

    expect(contact?.textContent?.replaceAll(/\s+/g, ' ').trim()).toBe(
      'Pour en parler, écrivez-moi à pierremariemarchio.pro@gmail.com.',
    );
    expect(address?.textContent?.trim()).toBe(
      'pierremariemarchio.pro@gmail.com',
    );
    expect(address?.getAttribute('href')).toBe(
      'mailto:pierremariemarchio.pro@gmail.com',
    );
  });

  it('keeps only the current part’s content in the DOM when switching parts', async () => {
    const { fixture, host } = await mount({ part: 0 });

    expect(host.textContent).toContain('Mes premières lignes de code');
    expect(host.textContent).not.toContain('Ce que je pratique');

    fixture.componentRef.setInput('part', 1);
    await fixture.whenStable();

    expect(host.textContent).not.toContain('Mes premières lignes de code');
    expect(host.textContent).toContain('Ce que je pratique');
  });

  it('shows the current title in the footer and a next-part button, on part 00', async () => {
    const { fixture, host } = await mount({ part: 0 });
    const emitted: number[] = [];
    fixture.componentInstance.partChange.subscribe((value: number) =>
      emitted.push(value),
    );

    const footer = host.querySelector('.footer');
    expect(footer?.textContent).toContain(TITLES[0]);

    const next = [
      ...(footer?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ].find((button) => button.textContent?.trim().startsWith('Suite'));
    expect(next?.textContent?.trim()).toBe('Suite : Compétences →');

    next?.click();
    await fixture.whenStable();
    expect(emitted).toEqual([1]);
  });

  it('shows the current title in the footer and a next-part button, on part 01', async () => {
    const { fixture, host } = await mount({ part: 1 });
    const emitted: number[] = [];
    fixture.componentInstance.partChange.subscribe((value: number) =>
      emitted.push(value),
    );

    const footer = host.querySelector('.footer');
    expect(footer?.textContent).toContain(TITLES[1]);

    const next = [
      ...(footer?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ].find((button) => button.textContent?.trim().startsWith('Suite'));
    expect(next?.textContent?.trim()).toBe('Suite : Parcours →');

    next?.click();
    await fixture.whenStable();
    expect(emitted).toEqual([2]);
  });

  it('shows the current title in the footer and a next-part button, on part 02', async () => {
    const { fixture, host } = await mount({ part: 2 });
    const emitted: number[] = [];
    fixture.componentInstance.partChange.subscribe((value: number) =>
      emitted.push(value),
    );

    const footer = host.querySelector('.footer');
    expect(footer?.textContent).toContain(TITLES[2]);

    const next = [
      ...(footer?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ].find((button) => button.textContent?.trim().startsWith('Suite'));
    expect(next?.textContent?.trim()).toBe('Suite : Et après →');

    next?.click();
    await fixture.whenStable();
    expect(emitted).toEqual([3]);
  });

  it('links to every project instead of a next button, on the last part', async () => {
    const { host } = await mount({ part: 3 });
    const footer = host.querySelector('.footer');

    expect(footer?.textContent).toContain(TITLES[3]);
    const next = [...(footer?.querySelectorAll('button') ?? [])].find(
      (button) => button.textContent?.trim().startsWith('Suite'),
    );
    expect(next).toBeUndefined();

    const link = footer?.querySelector<HTMLAnchorElement>('a');
    expect(link?.textContent?.trim()).toBe('Voir les projets →');
    expect(link?.getAttribute('href')).toBe('/projets');
  });

  it('re-emits the window pin and close as its own outputs', async () => {
    const { fixture, host } = await mount({ part: 0 });
    let pinToggled = 0;
    let closed = 0;
    fixture.componentInstance.pinToggled.subscribe(() => (pinToggled += 1));
    fixture.componentInstance.closed.subscribe(() => (closed += 1));

    host.querySelector<HTMLButtonElement>('button.pin')?.click();
    host.querySelector<HTMLButtonElement>('button.close')?.click();
    await fixture.whenStable();

    expect(pinToggled).toBe(1);
    expect(closed).toBe(1);
  });
});
