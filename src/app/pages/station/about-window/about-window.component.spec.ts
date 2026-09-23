import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutWindowComponent } from './about-window.component';
import { provideTexts } from '@testing/texts';

type Part = 0 | 1 | 2 | 3;

const TOOLBAR = '[aria-label="Parties du profil"]';

/** The full title shown in the h1 and the footer, per part. */
const TITLES: Record<Part, string> = {
  0: 'Profil',
  1: 'Compétences · ce sur quoi j’ai livré',
  2: 'Méthode de travail',
  3: 'Parcours',
};

describe('AboutWindowComponent', () => {
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

  it('defaults to the first part and unpinned, with no input set', async () => {
    TestBed.configureTestingModule({
      imports: [AboutWindowComponent],
      providers: [provideTexts(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AboutWindowComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'À propos — Profil',
    );
    expect(host.querySelector('button.pin')?.getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('opens a window titled "À propos", with an empty meta', async () => {
    const { host } = await mount();
    const window = host.querySelector('.window');

    expect(window?.getAttribute('aria-label')).toBe('Fenêtre : à propos');
    expect(window?.querySelector('h2')?.textContent?.trim()).toBe('À propos');
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('');
  });

  it('lists the toolbar segmented buttons, in order, pressed on the current part', async () => {
    const { host } = await mount({ part: 2 });
    const toolbar = host.querySelector(TOOLBAR);
    const buttons = Array.from(
      toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    );

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Profil',
      'Compétences',
      'Méthode',
      'Parcours',
    ]);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Aller à : Profil',
      'Aller à : Compétences · ce sur quoi j’ai livré',
      'Aller à : Méthode de travail',
      'Aller à : Parcours',
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
    const buttons = Array.from(
      toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    );
    buttons[2]?.click();
    await fixture.whenStable();

    expect(emitted).toEqual([2]);
    // The part input alone decides pressed state: a click does not flip it by itself.
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
    expect(h1?.textContent?.trim()).toBe('À propos — Profil');
  });

  it('titles the h1 after the skills part', async () => {
    const { host } = await mount({ part: 1 });

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'À propos — Compétences · ce sur quoi j’ai livré',
    );
  });

  it('titles the h1 after the method part', async () => {
    const { host } = await mount({ part: 2 });

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'À propos — Méthode de travail',
    );
  });

  it('titles the h1 after the path part', async () => {
    const { host } = await mount({ part: 3 });

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'À propos — Parcours',
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
      'À propos — Profil',
    );
  });

  it('shows part 00: the archaeology sentence and the identity list, placeholders included', async () => {
    const { host } = await mount({ part: 0 });
    const text = host.textContent ?? '';

    expect(text).toContain(
      'Je viens de l’archéologie. J’en ai gardé une habitude : ne rien affirmer sans preuve.',
    );
    const terms = Array.from(host.querySelectorAll('dt')).map((dt) =>
      dt.textContent?.trim(),
    );
    expect(terms).toEqual(['Poste', 'Pile', 'Lieu', 'Écoute']);
    expect(text).toContain('Lorem ipsum — ville et mobilité à renseigner');
    expect(text).toContain(
      'Lorem ipsum — CDI, mission, freelance : à préciser',
    );
  });

  it('shows part 01: the caps and five numbered rows, in order', async () => {
    const { host } = await mount({ part: 1 });
    const text = host.textContent ?? '';

    expect(text).toContain('Ce sur quoi j’ai livré');

    const rows: Array<[string, string]> = [
      ['01', 'Web'],
      ['02', 'Mobile'],
      ['03', 'Matériel'],
      ['04', 'Desktop'],
      ['05', 'Métier'],
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

  it('shows part 02: the caps and three numbered items, the first about seeing a project through', async () => {
    const { host } = await mount({ part: 2 });
    const text = host.textContent ?? '';

    expect(text).toContain('Comment je travaille');
    expect(text).toContain(
      'Tenir un projet jusqu’à la mise en production : c’est la seule façon d’en voir le coût réel.',
    );

    let cursor = -1;
    for (const number of ['01', '02', '03']) {
      const at = text.indexOf(number, cursor + 1);
      expect(at).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it('shows part 03: Étapes, five milestones with no invented date, and ordered facts', async () => {
    const { host } = await mount({ part: 3 });
    const text = host.textContent ?? '';

    expect(text).toContain('Étapes');
    expect(text).toContain('années à renseigner');

    // Five milestones, each carrying the same never-guessed date placeholder.
    expect((text.match(/— — — —/g) ?? []).length).toBe(5);
    // A real year would show as four digits; none does.
    expect(text).not.toMatch(/\b(19|20)\d{2}\b/);

    let cursor = -1;
    for (const fact of [
      'Archéologie',
      'Reconversion',
      'Formation',
      'Numerilis',
      'Skyted',
    ]) {
      const at = text.indexOf(fact, cursor + 1);
      expect(at).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it('keeps only the current part’s content in the DOM when switching parts', async () => {
    const { fixture, host } = await mount({ part: 0 });

    expect(host.textContent).toContain('Je viens de l’archéologie.');
    expect(host.textContent).not.toContain('Ce sur quoi j’ai livré');

    fixture.componentRef.setInput('part', 1);
    await fixture.whenStable();

    expect(host.textContent).not.toContain('Je viens de l’archéologie.');
    expect(host.textContent).toContain('Ce sur quoi j’ai livré');
  });

  it('shows the current title in the footer and a next-part button, on part 00', async () => {
    const { fixture, host } = await mount({ part: 0 });
    const emitted: number[] = [];
    fixture.componentInstance.partChange.subscribe((value: number) =>
      emitted.push(value),
    );

    const footer = host.querySelector('.footer');
    expect(footer?.textContent).toContain(TITLES[0]);

    const next = Array.from(
      footer?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    ).find((button) => button.textContent?.trim().startsWith('Suite'));
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

    const next = Array.from(
      footer?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    ).find((button) => button.textContent?.trim().startsWith('Suite'));
    expect(next?.textContent?.trim()).toBe('Suite : Méthode →');

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

    const next = Array.from(
      footer?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    ).find((button) => button.textContent?.trim().startsWith('Suite'));
    expect(next?.textContent?.trim()).toBe('Suite : Parcours →');

    next?.click();
    await fixture.whenStable();
    expect(emitted).toEqual([3]);
  });

  it('links to every project instead of a next button, on the last part', async () => {
    const { host } = await mount({ part: 3 });
    const footer = host.querySelector('.footer');

    expect(footer?.textContent).toContain(TITLES[3]);
    const next = Array.from(footer?.querySelectorAll('button') ?? []).find(
      (button) => button.textContent?.trim().startsWith('Suite'),
    );
    expect(next).toBeUndefined();

    const link = footer?.querySelector<HTMLAnchorElement>('a');
    expect(link?.textContent?.trim()).toBe('Tous les projets →');
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
