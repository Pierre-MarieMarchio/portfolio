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
import { FEATURED } from '@app/features/projects/states';
import { ProjectListComponent } from './project-list.component';

const rows = (host: HTMLElement) => [
  ...host.querySelectorAll<HTMLButtonElement>('button.row'),
];

describe('ProjectIndexComponent', () => {
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

    return { fixture, manager, host: fixture.nativeElement as HTMLElement };
  };

  it('opens a window titled and labelled for the index', async () => {
    const { host } = await mount();
    const window = host.querySelector('.window');

    expect(window?.getAttribute('aria-label')).toBe('Liste des projets');
    expect(window?.querySelector('h2')?.textContent?.trim()).toBe('Projets');
  });

  it('shows the total count in the meta, unfiltered', async () => {
    const { host } = await mount({ family: 'all' });
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('05 projets');
  });

  it('shows a family / total fraction in the meta, once filtered', async () => {
    const { host } = await mount({ family: 'professional' });
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('02 / 05');
  });

  it('lists the three family choices with their counts, in order', async () => {
    const { host } = await mount({ family: 'personal' });
    const toolbar = host.querySelector('[aria-label="Filtrer les projets"]');
    const buttons = [...(toolbar?.querySelectorAll('button') ?? [])];

    expect(
      buttons.map((button) =>
        button.textContent?.replaceAll(/\s+/g, '').trim(),
      ),
    ).toEqual(['Tous05', 'Enentreprise02', 'Personnels03']);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Afficher tous les projets',
      'Afficher les projets faits en entreprise',
      'Afficher les projets personnels',
    ]);
    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(['false', 'false', 'true']);
  });

  it('emits familyChange on a click, without changing its own filter', async () => {
    const { fixture, host } = await mount({ family: 'all' });
    const emitted: string[] = [];
    fixture.componentInstance.familyChange.subscribe((value: string) =>
      emitted.push(value),
    );

    const toolbar = host.querySelector('[aria-label="Filtrer les projets"]');
    const buttons = [
      ...(toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ];
    buttons[1]?.click();
    await fixture.whenStable();

    expect(emitted).toEqual(['professional']);
    const toolbarAfter = host.querySelector(
      '[aria-label="Filtrer les projets"]',
    );
    expect(
      toolbarAfter?.querySelectorAll('button')[0]?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('titles the heading with the total project count', async () => {
    const { host } = await mount();
    const heading = host.querySelector('h1');

    expect(heading?.getAttribute('tabindex')).toBe('-1');
    expect(heading?.textContent?.trim()).toBe('Les 05 projets');
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

  it('marks the first FEATURED ranks as featured, and only those', async () => {
    const { host } = await mount();
    const featured = rows(host).map((row) =>
      row.querySelector('.number')?.classList.contains('featured'),
    );

    expect(featured).toEqual(
      ENTRIES.map((_, rank) => rank < TestBed.inject(FEATURED)),
    );
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

  it('shows a row facts: stack, proof alone, and role', async () => {
    const { host } = await mount();
    const row = rows(host)[0];

    expect(row?.querySelector('.stack')?.textContent).toContain('Stack proj-a');
    expect(row?.querySelector('.proof')?.textContent?.trim()).toBe(
      'Proof proj-a',
    );
    expect(row?.querySelector('.role')?.textContent).toContain('Role proj-a');
  });

  it('marks a visited row consulted, and only that one', async () => {
    const { host } = await mount({ visited: ['proj-b'] });
    const titles = rows(host).map((row) => row.querySelector('.title'));

    expect(titles[1]?.querySelector('.read')?.textContent?.trim()).toBe(
      'consulté',
    );
    expect(titles[0]?.querySelector('.read')).toBeNull();
  });

  it('toggles the selection on a click, and reports the row as pressed', async () => {
    const { fixture, host } = await mount({ selected: null });
    const emitted: (string | null)[] = [];
    fixture.componentInstance.selectedChange.subscribe((value: string | null) =>
      emitted.push(value),
    );

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
    const { host } = await mount({ selected: 'proj-b' });
    const row = rows(host)[1];
    const opened = row?.nextElementSibling;

    expect(opened?.classList.contains('opened')).toBe(true);
    expect(opened?.textContent).toContain('Sample subject.');
    const link = opened?.querySelector('a:not([target="_blank"])');
    expect(link?.getAttribute('href')).toBe('/projet/proj-b');
    expect(link?.textContent?.trim()).toBe('Voir le projet →');
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

  it('emits hoveredChange on mouseenter/focus, and null on mouseleave/blur', async () => {
    const { fixture, host } = await mount();
    const emitted: (string | null)[] = [];
    fixture.componentInstance.hoveredChange.subscribe((value: string | null) =>
      emitted.push(value),
    );

    const row = rows(host)[0];
    row?.dispatchEvent(new MouseEvent('mouseenter'));
    row?.dispatchEvent(new FocusEvent('focus'));
    row?.dispatchEvent(new MouseEvent('mouseleave'));
    row?.dispatchEvent(new FocusEvent('blur'));
    await fixture.whenStable();

    expect(emitted).toEqual(['proj-a', 'proj-a', null, null]);
  });

  it('counts the two families in the footer', async () => {
    const { host } = await mount();
    expect(host.textContent).toContain('02 en entreprise · 03 personnels');
  });

  it('re-emits the window pin and close as its own outputs', async () => {
    const { fixture, host } = await mount({ pinned: true });
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
