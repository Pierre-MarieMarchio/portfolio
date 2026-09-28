import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
} from '@testing/fixtures/project.fixture';
import {
  DetailSource,
  FamilyFilter,
  ProjectEntry,
} from '@app/features/projects/models';
import { PROJECTS_TEXTS } from '@app/features/projects/ports';
import { ProjectListComponent } from './project-list.component';
import { at, recordOutput } from '@testing/fixtures/testbed.fixture';

const rows = (host: HTMLElement) => [
  ...host.querySelectorAll<HTMLButtonElement>('button.row'),
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

  const entryAt = (
    index: number,
    detail: Partial<DetailSource> = {},
  ): ProjectEntry => {
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
      detail,
    });
  };

  const ENTRIES = FAMILIES.map((_, index) => entryAt(index));

  const mount = async (
    inputs: {
      pinned?: boolean;
      selected?: string | null;
      visited?: readonly string[];
      family?: FamilyFilter;
    } = {},
    entries: readonly ProjectEntry[] = ENTRIES,
  ) => {
    TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [provideRouter([]), provideProjects(entries)],
    });
    const manager = await loadProjects();

    const fixture = TestBed.createComponent(ProjectListComponent);
    fixture.componentRef.setInput('pinned', inputs.pinned ?? false);
    fixture.componentRef.setInput('selected', inputs.selected ?? null);
    fixture.componentRef.setInput('visited', inputs.visited ?? []);
    fixture.componentRef.setInput('family', inputs.family ?? 'all');
    await fixture.whenStable();

    return {
      fixture,
      manager,
      host: fixture.nativeElement as HTMLElement,
      texts: TestBed.inject(PROJECTS_TEXTS)().index,
    };
  };

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

    expect(heading?.getAttribute('tabindex')).toBe('-1');
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

  it('keeps every fact of a card inside its row: stack, proof alone and role, the number before the title and the title before the proof', async () => {
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

  it('toggles the selection on a click, and reports the row as pressed', async () => {
    const { fixture, host } = await mount({ selected: null });
    const emitted = recordOutput(fixture.componentInstance.selectedChange);

    rows(host)[0]?.click();
    await fixture.whenStable();
    expect(emitted).toEqual(['proj-a']);

    fixture.componentRef.setInput('selected', 'proj-a');
    await fixture.whenStable();
    expect(rows(host)[0]?.getAttribute('aria-pressed')).toBe('true');

    rows(host)[0]?.click();
    await fixture.whenStable();
    expect(emitted).toEqual(['proj-a', null]);
  });

  it('opens a detail block after the selected row, with the subject and a link to the sheet', async () => {
    const { host, texts } = await mount({ selected: 'proj-b' });
    const row = rows(host)[1];
    const opened = row?.nextElementSibling;

    expect(opened?.classList.contains('opened')).toBe(true);
    expect(opened?.textContent).toContain('Sample subject.');
    const link = opened?.querySelector('a:not([target="_blank"])');
    expect(link?.getAttribute('href')).toBe('/projet/proj-b');
    expect(link?.textContent?.trim()).toBe(texts.openSheet);
  });

  it('has no opened block when nothing is selected', async () => {
    const { host } = await mount({ selected: null });
    expect(host.querySelector('.opened')).toBeNull();
  });

  it('adds an outbound link from the sheet, when the sheet has one', async () => {
    const { host } = await mount(
      { selected: 'proj-b' },
      ENTRIES.map((entry, index) =>
        index === 1
          ? entryAt(1, {
              links: [{ label: 'Dépôt', href: 'https://example.test/repo' }],
            })
          : entry,
      ),
    );
    const row = rows(host)[1];
    const opened = row?.nextElementSibling;
    const outbound = opened?.querySelector('a[target="_blank"]');

    expect(outbound?.textContent?.trim()).toBe('Dépôt ↗');
    expect(outbound?.getAttribute('href')).toBe('https://example.test/repo');
  });

  it('has no outbound link when the sheet has none', async () => {
    const { host } = await mount({ selected: 'proj-b' });
    const row = rows(host)[1];
    const opened = row?.nextElementSibling;

    expect(opened?.querySelector('a[target="_blank"]')).toBeNull();
  });

  it('emits hoveredChange on a mouse hover or a keyboard focus, and null on leaving them', async () => {
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

  it('counts the two families in the footer', async () => {
    const { host, texts } = await mount();
    expect(host.textContent).toContain(texts.summary('02', '03'));
  });

  it('re-emits the window pin and close as its own outputs', async () => {
    const { fixture, host } = await mount({ pinned: true });
    const pinToggled = recordOutput(fixture.componentInstance.pinToggled);
    const closed = recordOutput(fixture.componentInstance.closed);

    host.querySelector<HTMLButtonElement>('button.pin')?.click();
    host.querySelector<HTMLButtonElement>('button.close')?.click();

    expect(pinToggled).toHaveLength(1);
    expect(closed).toHaveLength(1);
  });
});
