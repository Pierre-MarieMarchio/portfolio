import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
} from '@testing/fixtures/project.fixture';
import { FamilyFilter, ProjectEntry } from '@app/features/projects/models';
import { PROJECTS_TEXTS } from '@app/features/projects/ports';
import { ProjectListComponent } from './project-list.component';
import { loadWindowMenu } from '@shared/windows/components/window/window.component';
import { stubViewport } from '@testing/doubles/browser.double';
import { at, recordOutput } from '@testing/fixtures/testbed.fixture';
import {
  MobileNavPlatformDouble,
  provideMobileNavPlatform,
} from '@testing/doubles/mobile-nav-platform.double';
import { drag } from '@testing/fixtures/pointer.fixture';
import { loadSwipeSteps } from '@shared/mobile-nav/directives';

const stubPhoneViewport = (isCompact = false): void => {
  if (isCompact) {
    stubViewport(400, 800);
  }
};

const settleSwipeCode = async (
  fixture: ComponentFixture<unknown>,
  isCompact = false,
): Promise<void> => {
  if (isCompact) {
    await loadSwipeSteps();
    await fixture.whenStable();
  }
};

const rows = (host: HTMLElement) => [
  ...host.querySelectorAll<HTMLAnchorElement>('a.row'),
];

const squeezed = (text = ''): string => text.replaceAll(/\s+/g, '');

describe('ProjectListComponent', () => {
  const FAMILIES = [
    'professional',
    'personal',
    'professional',
    'personal',
    'personal',
  ] as const;

  const entryAt = (index: number): ProjectEntry => {
    const slug = `proj-${'abcde'.charAt(index)}`;
    return sampleEntry({
      project: {
        slug,
        title: `Project ${'ABCDE'.charAt(index)}`,
        family: FAMILIES[index] ?? 'personal',
      },
      facts: {
        proof: `Proof ${slug}`,
        role: `Role ${slug}`,
        stack: `Stack ${slug}`,
      },
    });
  };

  const ENTRIES = FAMILIES.map((_, index) => entryAt(index));

  const mount = async (
    inputs: {
      pinned?: boolean;
      selected?: string | null;
      visited?: readonly string[];
      family?: FamilyFilter;
      compact?: boolean;
      reduced?: boolean;
    } = {},
    entries: readonly ProjectEntry[] = ENTRIES,
  ) => {
    const platform = new MobileNavPlatformDouble();
    platform.compact.set(inputs.compact ?? false);
    platform.isReduced = inputs.reduced ?? false;
    stubPhoneViewport(inputs.compact);
    TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideProjects(entries),
        provideMobileNavPlatform(platform),
      ],
    });
    const manager = await loadProjects();

    const fixture = TestBed.createComponent(ProjectListComponent);
    fixture.componentRef.setInput('pinned', inputs.pinned ?? false);
    fixture.componentRef.setInput('selected', inputs.selected ?? null);
    fixture.componentRef.setInput('visited', inputs.visited ?? []);
    fixture.componentRef.setInput('family', inputs.family ?? 'all');
    await fixture.whenStable();
    await settleSwipeCode(fixture, inputs.compact);

    return {
      fixture,
      manager,
      platform,
      host: fixture.nativeElement as HTMLElement,
      texts: TestBed.inject(PROJECTS_TEXTS)().index,
    };
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens a window titled and labelled for the index', async () => {
    const { host, texts } = await mount();
    const window = host.querySelector('.window');

    expect(window?.getAttribute('aria-label')).toBe(texts.label);
    expect(window?.querySelector('h2')?.textContent?.trim()).toBe(
      texts.heading,
    );
  });

  it('shows the total count in the meta, unfiltered', async () => {
    const { host, texts } = await mount({ family: 'all' });
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe(
      texts.count('05'),
    );
  });

  it('shows a family / total fraction in the meta, once filtered', async () => {
    const { host } = await mount({ family: 'professional' });
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('02 / 05');
  });

  it('shows no count in the bar on the phone, whether filtered or not', async () => {
    stubViewport(390, 844);
    const all = await mount({ family: 'all' });

    expect(all.host.querySelector('.meta')?.textContent?.trim()).toBe('');

    all.fixture.componentRef.setInput('family', 'professional');
    await all.fixture.whenStable();

    expect(all.host.querySelector('.meta')?.textContent?.trim()).toBe('');
  });

  it('lists the three family choices with their counts, in order', async () => {
    const { host, texts } = await mount({ family: 'personal' });
    const { families } = texts;
    const toolbar = host.querySelector(`[aria-label="${families.label}"]`);
    const buttons = [...(toolbar?.querySelectorAll('button') ?? [])];

    expect(buttons.map((button) => squeezed(button.textContent))).toEqual([
      squeezed(`${families.all.label}05`),
      squeezed(`${families.professional.label}02`),
      squeezed(`${families.personal.label}03`),
    ]);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      families.all.aria,
      families.professional.aria,
      families.personal.aria,
    ]);
    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(['false', 'false', 'true']);
  });

  it('emits familyChange on a click, without changing its own filter', async () => {
    const { fixture, host, texts } = await mount({ family: 'all' });
    const emitted = recordOutput(fixture.componentInstance.familyChange);
    const toolbar = `[aria-label="${texts.families.label}"]`;

    host
      .querySelector(toolbar)
      ?.querySelectorAll<HTMLButtonElement>('button')[1]
      ?.click();
    await fixture.whenStable();

    expect(emitted).toEqual(['professional']);
    expect(
      host
        .querySelector(toolbar)
        ?.querySelectorAll('button')[0]
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('titles the heading with the total project count', async () => {
    const { host, texts } = await mount();
    const heading = host.querySelector('h1');

    expect(heading?.hasAttribute('tabindex')).toBe(false);
    expect(heading?.textContent?.trim()).toBe(texts.title('05'));
  });

  it('lists one row per project, in the manager order, numbered from the full list', async () => {
    const { host } = await mount();
    const numbers = rows(host).map((row) =>
      row.querySelector('.number')?.textContent?.trim(),
    );
    const titles = rows(host).map((row) =>
      row.querySelector('.title')?.textContent?.trim(),
    );

    expect(numbers).toEqual(['01', '02', '03', '04', '05']);
    expect(titles).toEqual([
      'Project A',
      'Project B',
      'Project C',
      'Project D',
      'Project E',
    ]);
  });

  it('filters the rows by family without renumbering them', async () => {
    const { host } = await mount({ family: 'personal' });
    const numbers = rows(host).map((row) =>
      row.querySelector('.number')?.textContent?.trim(),
    );
    const titles = rows(host).map(
      (row) => row.querySelector('.title')?.textContent,
    );

    expect(numbers).toEqual(['02', '04', '05']);
    expect(
      titles?.every((title) => title && !title.includes('Project A')),
    ).toBe(true);
  });

  it('keeps every fact of a row: stack, proof alone and role, the number before the title and the title before the proof', async () => {
    const { host } = await mount();
    const row = at(rows(host), 0);
    const part = (selector: string): Element =>
      at([...row.querySelectorAll(selector)], 0);
    const follows = (first: string, second: string): number =>
      part(first).compareDocumentPosition(part(second));

    expect(part('.stack').textContent).toContain('Stack proj-a');
    expect(part('.proof').textContent?.trim()).toBe('Proof proj-a');
    expect(part('.role').textContent).toContain('Role proj-a');
    expect(follows('.number', '.title')).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows('.title', '.proof')).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('marks a visited row consulted, and only that one', async () => {
    const { host, texts } = await mount({ visited: ['proj-b'] });
    const titles = rows(host).map((row) => row.querySelector('.title'));

    expect(titles[1]?.querySelector('.read')?.textContent?.trim()).toBe(
      texts.read,
    );
    expect(titles[0]?.querySelector('.read')).toBeNull();
  });

  it('makes every row a real link to its sheet, named like its facts', async () => {
    const { host } = await mount({ family: 'personal' });

    expect(rows(host).map((row) => row.getAttribute('href'))).toEqual([
      '/projet/proj-b',
      '/projet/proj-d',
      '/projet/proj-e',
    ]);
  });

  it('opens the sheet in one tap on a row', async () => {
    const { fixture, host } = await mount({ selected: null });

    rows(host)[2]?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/projet/proj-c');
  });

  it('lights the planet of a row on a mouse hover or a keyboard focus, and lets it go on leaving', async () => {
    const { fixture, host } = await mount();
    const emitted = recordOutput(fixture.componentInstance.hoveredChange);

    const row = rows(host)[0];
    row?.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    row?.focus();
    row?.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    row?.blur();
    await fixture.whenStable();

    expect(emitted).toEqual(['proj-a', 'proj-a', null, null]);
  });

  it('highlights the row of a project selected from outside the list, without offering to select one itself', async () => {
    const { host } = await mount({ selected: 'proj-b' });

    expect(rows(host)[1]?.dataset['selected']).toBe('true');
    expect(rows(host)[0]?.dataset['selected']).toBe('false');
  });

  it('counts the two families in the footer', async () => {
    const { host, texts } = await mount();
    expect(host.textContent).toContain(texts.summary('02', '03'));
  });

  it('re-emits the window pin and close as its own outputs', async () => {
    const { fixture, host } = await mount({ pinned: true });
    const pinToggled = recordOutput(fixture.componentInstance.pinToggled);
    const closed = recordOutput(fixture.componentInstance.closed);

    await loadWindowMenu();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
    host.querySelector<HTMLButtonElement>('button.menu-opener')?.click();
    await fixture.whenStable();
    host.querySelector<HTMLButtonElement>('[role="menuitemcheckbox"]')?.click();
    host.querySelector<HTMLButtonElement>('button.close')?.click();

    expect(pinToggled).toHaveLength(1);
    expect(closed).toHaveLength(1);
  });

  describe('swiping the list on the phone', () => {
    const WIDTH = 400;

    const swipe = async (
      inputs: Parameters<typeof mount>[0],
      path: readonly { x: number; y: number; at: number }[],
    ) => {
      const mounted = await mount({ compact: true, ...inputs });
      const list = mounted.host.querySelector<HTMLElement>('.rows');
      Object.defineProperty(list, 'clientWidth', { value: WIDTH });
      const emitted = recordOutput(
        mounted.fixture.componentInstance.familyChange,
      );
      drag(list as HTMLElement, path);
      mounted.platform.frame();
      mounted.platform.elapse(180);
      await mounted.fixture.whenStable();
      mounted.platform.elapse(180);
      return { ...mounted, list: list as HTMLElement, emitted };
    };

    const left = [
      { x: 300, y: 100, at: 0 },
      { x: 250, y: 104, at: 40 },
      { x: 150, y: 110, at: 80 },
    ];

    const right = left.map((point) => ({ ...point, x: 400 - point.x }));

    it('goes to the next filter on a swipe to the left', async () => {
      const { emitted } = await swipe({ family: 'all' }, left);
      expect(emitted).toEqual(['professional']);
    });

    it('goes to the previous filter on a swipe to the right', async () => {
      const { emitted } = await swipe({ family: 'personal' }, right);
      expect(emitted).toEqual(['professional']);
    });

    it('follows the order of the toolbar from one filter to the next', async () => {
      const { emitted } = await swipe({ family: 'professional' }, left);
      expect(emitted).toEqual(['personal']);
    });

    it('does not pass the last filter', async () => {
      const { emitted } = await swipe({ family: 'personal' }, left);
      expect(emitted).toEqual([]);
    });

    it('does not pass the first filter', async () => {
      const { emitted } = await swipe({ family: 'all' }, right);
      expect(emitted).toEqual([]);
    });

    it('stays on a short and slow swipe', async () => {
      const { emitted } = await swipe({ family: 'all' }, [
        { x: 300, y: 100, at: 0 },
        { x: 260, y: 100, at: 600 },
      ]);
      expect(emitted).toEqual([]);
    });

    it('leaves a gesture more vertical than horizontal to the scroll', async () => {
      const { emitted } = await swipe({ family: 'all' }, [
        { x: 300, y: 100, at: 0 },
        { x: 240, y: 300, at: 80 },
      ]);
      expect(emitted).toEqual([]);
    });

    it('does nothing outside the phone', async () => {
      const { emitted } = await swipe({ family: 'all', compact: false }, left);
      expect(emitted).toEqual([]);
    });

    it('ignores a mouse drag', async () => {
      const { emitted } = await swipe(
        { family: 'all' },
        left.map((point) => ({ ...point, kind: 'mouse' })),
      );
      expect(emitted).toEqual([]);
    });

    it('writes the list and the filters position to the window while the finger moves', async () => {
      const mounted = await mount({ compact: true, family: 'all' });
      const list = mounted.host.querySelector<HTMLElement>('.rows');
      Object.defineProperty(list, 'clientWidth', { value: WIDTH });
      const scope = mounted.host.querySelector<HTMLElement>('app-window');

      list?.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          pointerId: 1,
          isPrimary: true,
          pointerType: 'touch',
          clientX: 300,
          clientY: 100,
        }),
      );
      list?.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          pointerId: 1,
          isPrimary: true,
          pointerType: 'touch',
          clientX: 200,
          clientY: 100,
        }),
      );
      mounted.platform.frame();

      expect(scope?.style.getPropertyValue('--swipe-pane')).toBe('-0.25');
      expect(scope?.style.getPropertyValue('--swipe-at')).toBe('0.25');
      expect(scope?.style.getPropertyValue('--swipe-t')).toBe('');
    });

    it('lights the next filter on release, then brings the new list in from the side', async () => {
      const mounted = await mount({ compact: true, family: 'all' });
      const list = mounted.host.querySelector<HTMLElement>('.rows');
      Object.defineProperty(list, 'clientWidth', { value: WIDTH });
      const scope = mounted.host.querySelector<HTMLElement>('app-window');
      const emitted = recordOutput(
        mounted.fixture.componentInstance.familyChange,
      );

      drag(list as HTMLElement, left);
      mounted.platform.frame();

      expect(emitted).toEqual(['professional']);
      expect(scope?.style.getPropertyValue('--swipe-at')).toBe('1');

      mounted.platform.elapse(100);

      expect(scope?.style.getPropertyValue('--swipe-pane')).toBe('0');
      expect(scope?.style.getPropertyValue('--swipe-t')).toBe(
        'var(--t-duration)',
      );

      mounted.platform.elapse(180);

      expect(scope?.style.getPropertyValue('--swipe-pane')).toBe('');
      expect(scope?.style.getPropertyValue('--swipe-at')).toBe('');
    });

    it('brings the list back in the time of a transition when the swipe is short', async () => {
      const mounted = await mount({ compact: true, family: 'all' });
      const list = mounted.host.querySelector<HTMLElement>('.rows');
      Object.defineProperty(list, 'clientWidth', { value: WIDTH });
      const scope = mounted.host.querySelector<HTMLElement>('app-window');

      drag(list as HTMLElement, [
        { x: 300, y: 100, at: 0 },
        { x: 260, y: 100, at: 600 },
      ]);
      mounted.platform.frame();

      expect(scope?.style.getPropertyValue('--swipe-pane')).toBe('0');
      expect(scope?.style.getPropertyValue('--swipe-t')).toBe(
        'var(--t-duration)',
      );

      mounted.platform.elapse(180);

      expect(scope?.style.getPropertyValue('--swipe-pane')).toBe('');
    });

    it('changes at once, without a trip, with reduced motion', async () => {
      const mounted = await mount({
        compact: true,
        reduced: true,
        family: 'all',
      });
      const list = mounted.host.querySelector<HTMLElement>('.rows');
      Object.defineProperty(list, 'clientWidth', { value: WIDTH });
      const scope = mounted.host.querySelector<HTMLElement>('app-window');
      const emitted = recordOutput(
        mounted.fixture.componentInstance.familyChange,
      );

      drag(list as HTMLElement, left);

      expect(emitted).toEqual(['professional']);
      expect(scope?.style.getPropertyValue('--swipe-pane')).toBe('');
    });
  });
});
