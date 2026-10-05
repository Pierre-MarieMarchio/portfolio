import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PagerComponent } from '@shared/mobile-nav/components';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
  sampleDetail,
} from '@testing/fixtures/project.fixture';
import { ProjectEntry } from '../../models';
import { PROJECTS_TEXTS } from '../../ports';
import { ProjectDetailComponent } from './project-detail.component';
import { WindowComponent } from '@shared/windows/components';
import { componentOf, recordOutput } from '@testing/fixtures/testbed.fixture';
import { stubViewport } from '@testing/doubles/browser.double';
import { provideMobileNavLayout } from '@testing/doubles/mobile-nav-layout.double';

const currentPage = (host: HTMLElement): HTMLElement =>
  host.querySelector('app-pager-page:not([inert])') as HTMLElement;

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
      current?: boolean;
    },
    entries: readonly ProjectEntry[] = ENTRIES,
  ) => {
    TestBed.configureTestingModule({
      imports: [ProjectDetailComponent],
      providers: [
        provideRouter([]),
        provideProjects(entries),
        provideMobileNavLayout(),
      ],
    });
    const manager = await loadProjects();

    const fixture = TestBed.createComponent(ProjectDetailComponent);
    fixture.componentRef.setInput('slug', inputs.slug);
    fixture.componentRef.setInput('pinned', inputs.pinned ?? false);
    fixture.componentRef.setInput('chapter', inputs.chapter ?? 0);
    fixture.componentRef.setInput('current', inputs.current ?? true);
    await fixture.whenStable();

    return {
      fixture,
      manager,
      host: fixture.nativeElement as HTMLElement,
      texts: TestBed.inject(PROJECTS_TEXTS)(),
    };
  };

  it('opens another project with its pages scrolled back to their top', async () => {
    const { fixture, host } = await mount({ slug: 'proj-a' });
    const page = currentPage(host);
    page.scrollTop = 300;
    page.dispatchEvent(new Event('scroll'));

    fixture.componentRef.setInput('slug', 'proj-b');
    await fixture.whenStable();

    expect(currentPage(host).scrollTop).toBe(0);
    expect(host.querySelector('h1')?.textContent).toContain('Project B');
  });

  it('writes an h2 in place of its h1 while it is not the window of the view', async () => {
    const { fixture, host } = await mount({ slug: 'proj-a' });

    fixture.componentRef.setInput('current', false);
    await fixture.whenStable();

    expect(host.querySelector('h1')).toBeNull();
    expect(host.querySelector('header h2')?.textContent).toContain('Project A');
  });

  it('renders nothing for a slug that names no project', async () => {
    const { host } = await mount({ slug: 'ghost' });
    expect(host.querySelector('.window')).toBeNull();
  });

  it('opens a window titled after the project, without a rank counter', async () => {
    const { host } = await mount({ slug: 'proj-b' });
    const window = host.querySelector('.window');

    expect(window?.getAttribute('aria-label')).toBe('Project B');
    expect(window?.querySelector('h2')?.textContent?.trim()).toBe('Project B');
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('');
  });

  it('links back to the list at the start of its title bar', async () => {
    const { host, texts } = await mount({ slug: 'proj-b' });
    const link = host.querySelector<HTMLAnchorElement>('.titlebar a.to-index');
    const titlebarChildren = [
      ...(host.querySelector('.titlebar')?.children ?? []),
    ];

    expect(link?.textContent?.trim()).toBe(texts.sheet.toIndex);
    expect(link?.getAttribute('aria-label')).toBe(texts.sheet.toIndexLabel);
    expect(link?.getAttribute('href')).toBe('/projets');
    expect(titlebarChildren.indexOf(link as Element)).toBe(0);
  });

  it('closes its window from its link to the list, without following the link', async () => {
    const { fixture, host } = await mount({ slug: 'proj-b' });
    const requested = vi.fn();
    fixture.componentInstance.closed.subscribe(requested);
    const link = host.querySelector<HTMLAnchorElement>('a.to-index');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    link?.dispatchEvent(click);

    expect(requested).toHaveBeenCalledOnce();
    expect(click.defaultPrevented).toBe(true);
  });

  it('asks for the list instead of closing when its sheet is not the one of the address', async () => {
    const { fixture, host } = await mount({ slug: 'proj-b', current: false });
    const closed = vi.fn();
    const listed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance.listChosen.subscribe(listed);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    host.querySelector('a.to-index')?.dispatchEvent(click);

    expect(listed).toHaveBeenCalledOnce();
    expect(closed).not.toHaveBeenCalled();
    expect(click.defaultPrevented).toBe(true);
  });

  it('leaves the link to the browser for a click that opens it elsewhere', async () => {
    const { fixture, host } = await mount({ slug: 'proj-b' });
    const requested = vi.fn();
    fixture.componentInstance.closed.subscribe(requested);
    const click = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });

    host.querySelector('a.to-index')?.dispatchEvent(click);

    expect(requested).not.toHaveBeenCalled();
    expect(click.defaultPrevented).toBe(false);
  });

  it('asks its window for a stable height, so a chapter change does not resize it', async () => {
    const { fixture } = await mount({ slug: 'proj-b' });

    expect(componentOf(fixture, WindowComponent).stableHeight()).toBe(true);
  });

  it('lists one toolbar button per chapter, titled by its own title, labelled and pressed on the current one', async () => {
    const { host, texts } = await mount({ slug: 'proj-b', chapter: 1 });
    const toolbar = host.querySelector(
      `[aria-label="${texts.sheet.approaches}"]`,
    );
    const buttons = [
      ...(toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ];

    expect(
      buttons.map((button) =>
        button.querySelector('span')?.textContent?.trim(),
      ),
    ).toEqual(['Pourquoi', 'Comment', 'Et ensuite']);
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
    const page = currentPage(host);

    expect(page.querySelector('.lede')?.textContent?.trim()).toBe(
      'A short standfirst.',
    );
    const terms = [...page.querySelectorAll('dl.identity dt')].map((dt) =>
      dt.textContent?.trim(),
    );
    const values = [...page.querySelectorAll('dl.identity dd')].map((dd) =>
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

    expect(currentPage(host).querySelector('.lede')).toBeNull();
    expect(currentPage(host).querySelector('dl.identity')).toBeNull();
  });

  it('renders the current chapter title, paragraphs and bullets, the others out of reach', async () => {
    const { host } = await mount({ slug: 'proj-b', chapter: 1 });
    const page = currentPage(host);

    expect(page.querySelector('.chapter-title')?.textContent?.trim()).toBe(
      '02 · Comment',
    );
    const paragraphs = [...page.querySelectorAll('p')].map((p) =>
      p.textContent?.trim(),
    );
    expect(paragraphs).toContain('Middle paragraph.');
    expect(paragraphs).not.toContain('First paragraph.');
    expect(host.querySelectorAll('app-pager-page[inert]')).toHaveLength(2);

    const bullet = page.querySelector('li');
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

  describe('on the phone', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('drops the next-chapter button and keeps the chapter title in the footer', async () => {
      stubViewport(390, 844);
      const { host, texts } = await mount({ slug: 'proj-b', chapter: 0 });

      expect(host.querySelector('.position')?.textContent?.trim()).toBe(
        'Pourquoi',
      );
      expect(host.querySelector('button.next')).toBeNull();
      expect(host.querySelector('.footer')?.textContent).not.toContain(
        texts.sheet.nextApproach('Comment'),
      );
    });

    it('keeps the generic window name', async () => {
      stubViewport(390, 844);
      const { host, texts } = await mount({ slug: 'proj-b' });

      expect(host.querySelector('.window')?.getAttribute('aria-label')).toBe(
        texts.sheet.label,
      );
    });

    it('still links to the next project at the last chapter', async () => {
      stubViewport(390, 844);
      const { host, texts } = await mount({ slug: 'proj-b', chapter: 2 });

      expect(host.querySelector('a.next')?.textContent?.trim()).toBe(
        texts.sheet.nextProject('C'),
      );
    });
  });

  it('links to the next project at the last chapter', async () => {
    const { host, texts } = await mount({ slug: 'proj-b', chapter: 2 });

    expect(host.querySelector('button.next')).toBeNull();
    const next = host.querySelector<HTMLAnchorElement>('a.next');
    expect(next?.textContent?.trim()).toBe(texts.sheet.nextProject('C'));
    expect(next?.getAttribute('href')).toBe('/projet/proj-c');
  });

  it('re-emits the window minimize, pin and close as its own outputs', async () => {
    const { fixture, host } = await mount({ slug: 'proj-b', pinned: true });
    const minimized = recordOutput(fixture.componentInstance.minimized);
    const pinToggled = recordOutput(fixture.componentInstance.pinToggled);
    const closed = recordOutput(fixture.componentInstance.closed);

    host.querySelector<HTMLButtonElement>('button.minimize')?.click();
    host.querySelector<HTMLButtonElement>('button.pin')?.click();
    host.querySelector<HTMLButtonElement>('button.close')?.click();

    expect(minimized).toHaveLength(1);
    expect(pinToggled).toHaveLength(1);
    expect(closed).toHaveLength(1);
  });

  it('turns the page the reader swiped to into chapterChange', async () => {
    const { fixture } = await mount({ slug: 'proj-a', chapter: 1 });
    const values = recordOutput(fixture.componentInstance.chapterChange);

    componentOf(fixture, PagerComponent).indexChange.emit(2);

    expect(values).toEqual([2]);
  });

  it('presses the tab of the page the pager is visibly on, before chapterChange settles', async () => {
    const { fixture, host, texts } = await mount({
      slug: 'proj-b',
      chapter: 0,
    });
    const toolbar = `[aria-label="${texts.sheet.approaches}"]`;

    componentOf(fixture, PagerComponent).shownChange.emit(2);
    await fixture.whenStable();

    const buttons = [
      ...(host.querySelector(toolbar)?.querySelectorAll('button') ?? []),
    ];
    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(['false', 'false', 'true']);
  });

  it('keeps the tab where the pager showed it once the committed chapter catches up to the same page', async () => {
    const { fixture, host, texts } = await mount({
      slug: 'proj-b',
      chapter: 0,
    });
    const toolbar = `[aria-label="${texts.sheet.approaches}"]`;

    componentOf(fixture, PagerComponent).shownChange.emit(2);
    await fixture.whenStable();
    fixture.componentRef.setInput('chapter', 2);
    await fixture.whenStable();

    expect(
      host
        .querySelector(toolbar)
        ?.querySelectorAll('button')[2]
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('moves the tab back if the gesture returns to the page it started from', async () => {
    const { fixture, host, texts } = await mount({
      slug: 'proj-b',
      chapter: 0,
    });
    const toolbar = `[aria-label="${texts.sheet.approaches}"]`;
    const pager = componentOf(fixture, PagerComponent);

    pager.shownChange.emit(2);
    pager.shownChange.emit(0);
    await fixture.whenStable();

    expect(
      host
        .querySelector(toolbar)
        ?.querySelectorAll('button')[0]
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });
});
