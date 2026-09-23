import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
  sampleDetail,
} from '@testing/fixtures/project.fixture';
import { ProjectEntry } from '../../models';
import { ProjectDetailComponent } from './project-detail.component';

describe('ProjectSheetComponent', () => {
  const detail = sampleDetail({
    lede: 'A short standfirst.',
    links: [{ label: 'Dépôt', href: 'https://example.test/repo' }],
    chapters: [
      { title: 'Pourquoi', paragraphs: ['First paragraph.', 'Second one.'] },
      {
        title: 'Comment',
        paragraphs: ['Middle paragraph.'],
        bullets: [{ term: 'Terme', text: 'Explication' }],
        figure: {
          kind: 'flow',
          steps: ['action', 'updator', 'effect'],
          loop: 'nouvelles actions',
          caption: 'Séquence documentée dans le dépôt. Schéma de lecture.',
        },
      },
      {
        title: 'Et ensuite',
        paragraphs: ['Last paragraph.'],
        figure: {
          kind: 'layers',
          layers: [
            { name: 'UI', projects: 'proj-a, proj-b' },
            { name: 'Core', projects: 'proj-b, proj-c' },
          ],
          caption: 'Arborescence réelle du dépôt.',
        },
      },
    ],
  });

  /** Three ranked projects, each with its facts and the same detail. */
  const ENTRIES = ['a', 'b', 'c'].map((letter) =>
    sampleEntry({
      project: {
        slug: `proj-${letter}`,
        title: `Project ${letter.toUpperCase()}`,
        short: letter.toUpperCase(),
      },
      facts: {
        proof: `Proof ${letter.toUpperCase()}`,
        role: `Role ${letter.toUpperCase()}`,
        stack: `Stack ${letter.toUpperCase()}`,
        context: `Context ${letter.toUpperCase()}`,
      },
      detail,
    }),
  );

  const mount = async (
    inputs: {
      slug: string;
      pinned?: boolean;
      chapter?: number;
    },
    entries: readonly ProjectEntry[] = ENTRIES,
  ) => {
    TestBed.configureTestingModule({
      imports: [ProjectDetailComponent],
      providers: [provideRouter([]), provideProjects(entries)],
    });
    const manager = await loadProjects();

    const fixture = TestBed.createComponent(ProjectDetailComponent);
    fixture.componentRef.setInput('slug', inputs.slug);
    fixture.componentRef.setInput('pinned', inputs.pinned ?? false);
    fixture.componentRef.setInput('chapter', inputs.chapter ?? 0);
    await fixture.whenStable();

    return { fixture, manager, host: fixture.nativeElement as HTMLElement };
  };

  it('renders nothing for a slug that names no project', async () => {
    const { host } = await mount({ slug: 'ghost' });
    expect(host.querySelector('.window')).toBeNull();
  });

  it('opens a window titled after the project, with its rank over the total', async () => {
    const { host } = await mount({ slug: 'proj-b' });
    const window = host.querySelector('.window');

    expect(window?.getAttribute('aria-label')).toBe(
      'Fenêtre : fiche de projet',
    );
    expect(window?.querySelector('h2')?.textContent?.trim()).toBe('Project B');
    // proj-b is the second of three in the manager's order.
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('02 / 03');
  });

  it('lists one toolbar button per chapter, labelled and pressed on the current one', async () => {
    const { host } = await mount({ slug: 'proj-b', chapter: 1 });
    const toolbar = host.querySelector('[aria-label="Approches de la fiche"]');
    const buttons = [
      ...(toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ];

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      '01',
      '02',
      '03',
    ]);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Approche 01 — Pourquoi',
      'Approche 02 — Comment',
      'Approche 03 — Et ensuite',
    ]);
    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(['false', 'true', 'false']);
  });

  it('emits chapterChange on a toolbar click, without changing by itself', async () => {
    const { fixture, host } = await mount({ slug: 'proj-b', chapter: 0 });
    const emitted: number[] = [];
    fixture.componentInstance.chapterChange.subscribe((value: number) =>
      emitted.push(value),
    );

    const toolbar = host.querySelector('[aria-label="Approches de la fiche"]');
    const buttons = [
      ...(toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ];
    buttons[2]?.click();
    await fixture.whenStable();

    expect(emitted).toEqual([2]);
    expect(
      host
        .querySelector('[aria-label="Approches de la fiche"]')
        ?.querySelectorAll('button')[0]
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('shows the lede and the facts identity only on the first chapter', async () => {
    const { host } = await mount({ slug: 'proj-b', chapter: 0 });

    expect(host.querySelector('.lede')?.textContent?.trim()).toBe(
      'A short standfirst.',
    );
    const terms = [...host.querySelectorAll('dl.identity dt')].map((dt) =>
      dt.textContent?.trim(),
    );
    const values = [...host.querySelectorAll('dl.identity dd')].map((dd) =>
      dd.textContent?.trim(),
    );
    expect(terms).toEqual(['Accès', 'Rôle', 'Technique', 'Contexte']);
    // The identity comes from the facts table, never from the sheet's own prose.
    expect(values).toEqual(['Proof B', 'Role B', 'Stack B', 'Context B']);
  });

  it('has no lede and no identity list past the first chapter', async () => {
    const { host } = await mount({ slug: 'proj-b', chapter: 1 });

    expect(host.querySelector('.lede')).toBeNull();
    expect(host.querySelector('dl.identity')).toBeNull();
  });

  it('renders the current chapter title, paragraphs and bullets', async () => {
    const { host } = await mount({ slug: 'proj-b', chapter: 1 });

    expect(host.querySelector('.chapter-title')?.textContent?.trim()).toBe(
      '02 · Comment',
    );
    const paragraphs = [...host.querySelectorAll('p')].map((p) =>
      p.textContent?.trim(),
    );
    expect(paragraphs).toContain('Middle paragraph.');
    expect(paragraphs).not.toContain('First paragraph.');

    // Exclude the toolbar's own `<li>` items (one per chapter button).
    const bullet = [...host.querySelectorAll('li')].find(
      (li) => !li.closest('[aria-label="Approches de la fiche"]'),
    );
    expect(bullet?.querySelector('.term')?.textContent?.trim()).toBe('Terme');
    expect(bullet?.textContent).toContain('Explication');
  });

  it('titles an untitled chapter with the default of its place', async () => {
    const { host } = await mount({ slug: 'proj-a', chapter: 0 }, [
      sampleEntry({
        project: { slug: 'proj-a' },
        detail: { chapters: [{ paragraphs: ['Untitled.'] }] },
      }),
    ]);

    expect(host.querySelector('.chapter-title')?.textContent?.trim()).toBe(
      '01 · Pourquoi ?',
    );
  });

  it('draws the flow figure from its steps, loop and caption', async () => {
    const { host } = await mount({ slug: 'proj-b', chapter: 1 });
    const boxes = [...host.querySelectorAll('.box')].map((box) =>
      box.textContent?.trim(),
    );

    expect(boxes).toEqual(['action', 'updator', 'effect']);
    expect(host.querySelectorAll('.flow .arrow')).toHaveLength(3);
    expect(host.querySelector('.flow .data')?.textContent?.trim()).toBe(
      'nouvelles actions',
    );
    expect(
      host
        .querySelector('figcaption')
        ?.textContent?.trim()
        .startsWith('Séquence documentée dans le dépôt.'),
    ).toBe(true);
  });

  it('draws one layer row per layer of the figure, with its caption', async () => {
    const { host } = await mount({ slug: 'proj-b', chapter: 2 });
    const layers = [...host.querySelectorAll('.layer')];

    expect(layers).toHaveLength(2);
    expect(layers[0]?.querySelector('.layer-name')?.textContent?.trim()).toBe(
      'UI',
    );
    expect(
      layers[0]?.querySelector('.layer-projects')?.textContent?.trim(),
    ).toBe('proj-a, proj-b');
    expect(host.querySelector('figcaption')?.textContent?.trim()).toBe(
      'Arborescence réelle du dépôt.',
    );
  });

  it('lists the sheet links as outbound links', async () => {
    const { host } = await mount({ slug: 'proj-b' });
    const link = host.querySelector('a[target="_blank"]');

    expect(link?.textContent?.trim()).toBe('Dépôt ↗');
    expect(link?.getAttribute('href')).toBe('https://example.test/repo');
  });

  it('offers a next-chapter button before the last chapter', async () => {
    const { fixture, host } = await mount({ slug: 'proj-b', chapter: 0 });
    const emitted: number[] = [];
    fixture.componentInstance.chapterChange.subscribe((value: number) =>
      emitted.push(value),
    );

    expect(host.querySelector('.position')?.textContent?.trim()).toBe(
      'Pourquoi',
    );
    const next = host.querySelector<HTMLButtonElement>('button.next');
    expect(next?.textContent?.trim()).toBe('Suite : Comment →');

    next?.click();
    await fixture.whenStable();
    expect(emitted).toEqual([1]);
  });

  it('links to the next project at the last chapter, wrapping from last to first', async () => {
    const { host } = await mount({ slug: 'proj-b', chapter: 2 });

    expect(host.querySelector('button.next')).toBeNull();
    const next = host.querySelector<HTMLAnchorElement>('a.next');
    // proj-b is followed by proj-c, the last project in the manager's order.
    expect(next?.textContent?.trim()).toBe('Suivant : C →');
    expect(next?.getAttribute('href')).toBe('/projet/proj-c');
  });

  it('wraps to the first project when the last one is the current sheet', async () => {
    const { host } = await mount({ slug: 'proj-c', chapter: 2 });

    const next = host.querySelector<HTMLAnchorElement>('a.next');
    expect(next?.textContent?.trim()).toBe('Suivant : A →');
    expect(next?.getAttribute('href')).toBe('/projet/proj-a');
  });

  it('re-emits the window pin and close as its own outputs', async () => {
    const { fixture, host } = await mount({ slug: 'proj-b', pinned: true });
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
