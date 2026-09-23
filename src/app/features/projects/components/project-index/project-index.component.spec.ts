import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  fakeProjectsManager,
  sampleFacts,
  sampleProject,
  sampleSheet,
} from '@testing/fake-managers';
import { ProjectsManager } from '@app/features/projects/states';
import { ProjectIndexComponent } from './project-index.component';

describe('ProjectIndexComponent', () => {
  // Two professional, three personal, each with distinct facts so a row can
  // be told from another by its own text.
  const projects = [
    sampleProject({
      slug: 'proj-a',
      title: 'Project A',
      family: 'professional',
    }),
    sampleProject({ slug: 'proj-b', title: 'Project B', family: 'personal' }),
    sampleProject({
      slug: 'proj-c',
      title: 'Project C',
      family: 'professional',
    }),
    sampleProject({ slug: 'proj-d', title: 'Project D', family: 'personal' }),
    sampleProject({ slug: 'proj-e', title: 'Project E', family: 'personal' }),
  ];

  const facts = Object.fromEntries(
    projects.map((project, index) => [
      project.slug,
      sampleFacts({
        proof: `Proof ${project.slug}`,
        role: `Role ${project.slug}`,
        stack: `Stack ${project.slug}`,
        proofLevel: index % 2 === 0 ? 'public' : 'indirect',
      }),
    ]),
  );

  /** A manager pre-loaded with the sample projects and their distinct facts. */
  const createManager = () => {
    const manager = fakeProjectsManager(projects);
    manager.facts.set(facts);
    return manager;
  };

  const mount = async (
    inputs: {
      pinned?: boolean;
      selected?: string | null;
      visited?: readonly string[];
      family?: 'all' | 'professional' | 'personal';
    } = {},
    manager = createManager(),
  ) => {
    TestBed.configureTestingModule({
      imports: [ProjectIndexComponent],
      providers: [
        provideRouter([]),
        { provide: ProjectsManager, useValue: manager },
      ],
    });

    const fixture = TestBed.createComponent(ProjectIndexComponent);
    fixture.componentRef.setInput('pinned', inputs.pinned ?? false);
    fixture.componentRef.setInput('selected', inputs.selected ?? null);
    fixture.componentRef.setInput('visited', inputs.visited ?? []);
    fixture.componentRef.setInput('family', inputs.family ?? 'all');
    await fixture.whenStable();

    return { fixture, manager, host: fixture.nativeElement as HTMLElement };
  };

  const rows = (host: HTMLElement) =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('button.row'));

  it('opens a window titled and labelled for the index', async () => {
    const { host } = await mount();
    const window = host.querySelector('.window');

    expect(window?.getAttribute('aria-label')).toBe(
      'Fenêtre : relevé des projets',
    );
    expect(window?.querySelector('h2')?.textContent?.trim()).toBe(
      'Projets · le relevé',
    );
  });

  it('shows the total count in the meta, unfiltered', async () => {
    const { host } = await mount({ family: 'all' });
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('05 fiches');
  });

  it('shows a family / total fraction in the meta, once filtered', async () => {
    const { host } = await mount({ family: 'professional' });
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('02 / 05');
  });

  it('lists the three family choices with their counts, in order', async () => {
    const { host } = await mount({ family: 'personal' });
    const toolbar = host.querySelector('[aria-label="Familles de projets"]');
    const buttons = Array.from(toolbar?.querySelectorAll('button') ?? []);

    expect(
      buttons.map((button) => button.textContent?.replace(/\s+/g, '').trim()),
    ).toEqual(['Tout05', 'Enentreprise02', 'Personnels03']);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Voir tous les projets',
      'Ne voir que les réalisations faites en entreprise',
      'Ne voir que les projets personnels',
    ]);
    // 'personal' is the input: only that button is pressed.
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

    const toolbar = host.querySelector('[aria-label="Familles de projets"]');
    const buttons = Array.from(
      toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    );
    buttons[1]?.click();
    await fixture.whenStable();

    expect(emitted).toEqual(['professional']);
    // The component does not decide its own filter: the input still says 'all'.
    const toolbarAfter = host.querySelector(
      '[aria-label="Familles de projets"]',
    );
    expect(
      toolbarAfter?.querySelectorAll('button')[0]?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('titles the heading with the total realisations', async () => {
    const { host } = await mount();
    const heading = host.querySelector('h1');

    expect(heading?.getAttribute('tabindex')).toBe('-1');
    expect(heading?.textContent?.trim()).toBe(
      'Projets — le relevé des 05 réalisations',
    );
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

  it('leaves out a project with no facts', async () => {
    const manager = createManager();
    manager.facts.set(
      Object.fromEntries(
        Object.entries(facts).filter(([slug]) => slug !== 'proj-c'),
      ),
    );
    const { host } = await mount({}, manager);

    const titles = rows(host).map(
      (row) => row.querySelector('.title')?.textContent,
    );
    expect(titles?.some((title) => title?.includes('Project C'))).toBe(false);
    expect(rows(host)).toHaveLength(4);
  });

  it('marks the first four ranks as featured, and only those', async () => {
    const { host } = await mount();
    const featured = rows(host).map((row) =>
      row.querySelector('.number')?.classList.contains('featured'),
    );

    expect(featured).toEqual([true, true, true, true, false]);
  });

  it('filters the rows by family without renumbering them', async () => {
    const { host } = await mount({ family: 'personal' });
    const numbers = rows(host).map((row) =>
      row.querySelector('.number')?.textContent?.trim(),
    );
    const titles = rows(host).map(
      (row) => row.querySelector('.title')?.textContent,
    );

    // proj-b, proj-d, proj-e are personal, ranked 2, 4, 5 in the full list.
    expect(numbers).toEqual(['02', '04', '05']);
    expect(
      titles?.every((title) => title && !title.includes('Project A')),
    ).toBe(true);
  });

  it('shows a row facts: stack, proof with its level label, and role', async () => {
    const { host, manager } = await mount();
    const row = rows(host)[0];

    expect(row?.querySelector('.stack')?.textContent).toContain('Stack proj-a');
    const proofText = row?.querySelector('.proof')?.textContent ?? '';
    expect(proofText).toContain('Proof proj-a');
    expect(proofText).toContain(manager.proofLevelLabel('public'));
    expect(proofText.indexOf('Proof proj-a')).toBeLessThan(
      proofText.indexOf(manager.proofLevelLabel('public')),
    );
    expect(row?.querySelector('.role')?.textContent).toContain('Role proj-a');
  });

  it('marks a visited row read, and only that one', async () => {
    const { host } = await mount({ visited: ['proj-b'] });
    const titles = rows(host).map((row) => row.querySelector('.title'));

    expect(titles[1]?.querySelector('.read')?.textContent?.trim()).toBe('lu');
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
    expect(link?.textContent?.trim()).toBe('Ouvrir la fiche →');
  });

  it('has no opened block when nothing is selected', async () => {
    const { host } = await mount({ selected: null });
    expect(host.querySelector('.opened')).toBeNull();
  });

  it('adds an outbound link from the sheet, when the sheet has one', async () => {
    const manager = createManager();
    manager.sheets.set({
      'proj-b': sampleSheet({
        links: [{ label: 'Dépôt', href: 'https://example.test/repo' }],
      }),
    });
    const { host } = await mount({ selected: 'proj-b' }, manager);
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

  it('emits hovered on mouseenter/focus, and null on mouseleave/blur', async () => {
    const { fixture, host } = await mount();
    const emitted: (string | null)[] = [];
    fixture.componentInstance.hovered.subscribe((value: string | null) =>
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
    // The `.window` footer slot; look up the whole host since no other
    // element carries this exact wording.
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
