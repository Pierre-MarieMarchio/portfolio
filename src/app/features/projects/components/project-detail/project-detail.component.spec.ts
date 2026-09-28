import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WindowComponent } from '@shared/windows/components';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
  sampleDetail,
} from '@testing/fixtures/project.fixture';
import { ProjectEntry } from '../../models';
import { PROJECTS_TEXTS } from '../../ports';
import { ProjectDetailComponent } from './project-detail.component';
import { componentOf, recordOutput } from '@testing/fixtures/testbed.fixture';

describe('ProjectDetailComponent', () => {
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
        period: `Period ${letter.toUpperCase()}`,
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

    return {
      fixture,
      manager,
      host: fixture.nativeElement as HTMLElement,
      texts: TestBed.inject(PROJECTS_TEXTS)(),
    };
  };

  it('renders nothing for a slug that names no project', async () => {
    const { host } = await mount({ slug: 'ghost' });
    expect(host.querySelector('.window')).toBeNull();
  });

  it('opens a window titled after the project, with its rank over the total', async () => {
    const { host, texts } = await mount({ slug: 'proj-b' });
    const window = host.querySelector('.window');

    expect(window?.getAttribute('aria-label')).toBe(texts.sheet.label);
    expect(window?.querySelector('h2')?.textContent?.trim()).toBe('Project B');
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('02 / 03');
  });

  it('lists one toolbar button per chapter, labelled and pressed on the current one', async () => {
    const { host, texts } = await mount({ slug: 'proj-b', chapter: 1 });
    const toolbar = host.querySelector(
      `[aria-label="${texts.sheet.approaches}"]`,
    );
    const buttons = [
      ...(toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ];

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      '01',
      '02',
      '03',
    ]);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      texts.sheet.approach('01', 'Pourquoi'),
      texts.sheet.approach('02', 'Comment'),
      texts.sheet.approach('03', 'Et ensuite'),
    ]);
    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(['false', 'true', 'false']);
  });

  it('emits chapterChange on a toolbar click, without changing by itself', async () => {
    const { fixture, host, texts } = await mount({
      slug: 'proj-b',
      chapter: 0,
    });
    const emitted = recordOutput(fixture.componentInstance.chapterChange);
    const toolbar = `[aria-label="${texts.sheet.approaches}"]`;

    host
      .querySelector(toolbar)
      ?.querySelectorAll<HTMLButtonElement>('button')[2]
      ?.click();
    await fixture.whenStable();

    expect(emitted).toEqual([2]);
    expect(
      host
        .querySelector(toolbar)
        ?.querySelectorAll('button')[0]
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('shows the lede and the facts identity only on the first chapter', async () => {
    const { host, texts } = await mount({ slug: 'proj-b', chapter: 0 });

    expect(host.querySelector('.lede')?.textContent?.trim()).toBe(
      'A short standfirst.',
    );
    const terms = [...host.querySelectorAll('dl.identity dt')].map((dt) =>
      dt.textContent?.trim(),
    );
    const values = [...host.querySelectorAll('dl.identity dd')].map((dd) =>
      dd.textContent?.trim(),
    );
    expect(terms).toEqual(Object.values(texts.sheet.terms));
    expect(values).toEqual([
      'Proof B',
      'Role B',
      'Stack B',
      'Context B',
      'Period B',
    ]);
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

    const bullet = [...host.querySelectorAll('li')].find(
      (li) => !li.closest('[aria-label="Parties"]'),
    );
    expect(bullet?.querySelector('.term')?.textContent?.trim()).toBe('Terme');
    expect(bullet?.textContent).toContain('Explication');
  });

  it('titles an untitled chapter with the default of its place', async () => {
    const { host, texts } = await mount({ slug: 'proj-a', chapter: 0 }, [
      sampleEntry({
        project: { slug: 'proj-a' },
        detail: { chapters: [{ paragraphs: ['Untitled.'] }] },
      }),
    ]);

    expect(host.querySelector('.chapter-title')?.textContent?.trim()).toBe(
      `01 · ${texts.defaultChapterTitles[0] ?? ''}`,
    );
  });

  it('lists the sheet links as outbound links', async () => {
    const { host } = await mount({ slug: 'proj-b' });
    const link = host.querySelector('a[target="_blank"]');

    expect(link?.textContent?.trim()).toBe('Dépôt ↗');
    expect(link?.getAttribute('href')).toBe('https://example.test/repo');
  });

  it('offers a next-chapter button before the last chapter', async () => {
    const { fixture, host, texts } = await mount({
      slug: 'proj-b',
      chapter: 0,
    });
    const emitted = recordOutput(fixture.componentInstance.chapterChange);

    expect(host.querySelector('.position')?.textContent?.trim()).toBe(
      'Pourquoi',
    );
    const next = host.querySelector<HTMLButtonElement>('button.next');
    expect(next?.textContent?.trim()).toBe(texts.sheet.nextApproach('Comment'));

    next?.click();
    expect(emitted).toEqual([1]);
  });

  it('links to the next project at the last chapter', async () => {
    const { host, texts } = await mount({ slug: 'proj-b', chapter: 2 });

    expect(host.querySelector('button.next')).toBeNull();
    const next = host.querySelector<HTMLAnchorElement>('a.next');
    expect(next?.textContent?.trim()).toBe(texts.sheet.nextProject('C'));
    expect(next?.getAttribute('href')).toBe('/projet/proj-c');
  });

  it('re-emits the window pin and close as its own outputs', async () => {
    const { fixture, host } = await mount({ slug: 'proj-b', pinned: true });
    const pinToggled = recordOutput(fixture.componentInstance.pinToggled);
    const closed = recordOutput(fixture.componentInstance.closed);

    host.querySelector<HTMLButtonElement>('button.pin')?.click();
    host.querySelector<HTMLButtonElement>('button.close')?.click();

    expect(pinToggled).toHaveLength(1);
    expect(closed).toHaveLength(1);
  });

  it.each([
    [1, 'next', [2]],
    [1, 'previous', [0]],
    [2, 'next', []],
    [0, 'previous', []],
  ] as const)(
    'turns a swipe on chapter %i towards %s into the neighbouring chapter, within bounds',
    async (chapter, direction, emitted) => {
      const { fixture } = await mount({ slug: 'proj-a', chapter });
      const values = recordOutput(fixture.componentInstance.chapterChange);

      componentOf(fixture, WindowComponent).swiped.emit(direction);

      expect(values).toEqual(emitted);
    },
  );
});
