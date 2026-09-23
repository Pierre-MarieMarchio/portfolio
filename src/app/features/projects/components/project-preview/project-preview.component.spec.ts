import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  fakeProjectsManager,
  sampleFacts,
  sampleProject,
} from '@testing/fake-managers';
import { ProjectsManager } from '@app/features/projects/states';
import { ProjectPreviewComponent } from './project-preview.component';

describe('ProjectPreviewComponent', () => {
  /** Five projects: fakeProjectsManager's `featured` keeps only the first four. */
  const projects = [
    sampleProject({
      slug: 'proj-1',
      title: 'Project One',
      tag: 'beta',
      summary: 'Summary one',
    }),
    sampleProject({
      slug: 'proj-2',
      title: 'Project Two',
      tag: 'live',
      summary: 'Summary two',
    }),
    sampleProject({
      slug: 'proj-3',
      title: 'Project Three',
      tag: 'archived',
      summary: 'Summary three',
    }),
    sampleProject({
      slug: 'proj-4',
      title: 'Project Four',
      tag: 'draft',
      summary: 'Summary four',
    }),
    sampleProject({
      slug: 'proj-5',
      title: 'Project Five',
      tag: 'wip',
      summary: 'Summary five',
    }),
  ];

  const facts = {
    'proj-1': sampleFacts({
      proof: 'Proof 1',
      role: 'Role 1',
      stack: 'Stack 1',
    }),
    'proj-2': sampleFacts({
      proof: 'Proof 2',
      role: 'Role 2',
      stack: 'Stack 2',
    }),
    'proj-3': sampleFacts({
      proof: 'Proof 3',
      role: 'Role 3',
      stack: 'Stack 3',
    }),
    'proj-4': sampleFacts({
      proof: 'Proof 4',
      role: 'Role 4',
      stack: 'Stack 4',
    }),
    'proj-5': sampleFacts({
      proof: 'Proof 5',
      role: 'Role 5',
      stack: 'Stack 5',
    }),
  };

  /** A manager with five projects and facts for each of them. */
  const createManager = () => {
    const manager = fakeProjectsManager(projects);
    manager.facts.set(facts);
    return manager;
  };

  const mount = async (
    inputs: { slug: string; pinned?: boolean },
    manager = createManager(),
  ) => {
    TestBed.configureTestingModule({
      imports: [ProjectPreviewComponent],
      providers: [
        provideRouter([]),
        { provide: ProjectsManager, useValue: manager },
      ],
    });

    const fixture = TestBed.createComponent(ProjectPreviewComponent);
    fixture.componentRef.setInput('slug', inputs.slug);
    fixture.componentRef.setInput('pinned', inputs.pinned ?? false);
    await fixture.whenStable();

    return { fixture, manager, host: fixture.nativeElement as HTMLElement };
  };

  it('renders nothing when the manager has no facts or project for the slug', async () => {
    const { host } = await mount({ slug: 'ghost-slug' });
    expect(host.querySelector('.window')).toBeNull();
  });

  it('opens a window titled after the project, with its rank among the featured', async () => {
    const { host } = await mount({ slug: 'proj-2' });
    const windowEl = host.querySelector('.window');

    expect(windowEl?.getAttribute('aria-label')).toBe(
      'Fenêtre : aperçu du projet',
    );
    expect(windowEl?.querySelector('h2')?.textContent?.trim()).toBe(
      'Project Two',
    );
    // proj-2 is the second of the first four (featured), which stay four
    // even with five projects in the catalog.
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('02 / 04');
  });

  it('lists one toolbar button per featured project only, labelled and pressed on the shown one', async () => {
    const { host } = await mount({ slug: 'proj-2' });
    const toolbar = host.querySelector('[aria-label="Corps en orbite"]');
    const buttons = Array.from(
      toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    );

    expect(buttons).toHaveLength(4);
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      '01',
      '02',
      '03',
      '04',
    ]);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Aperçu 01 — Project One',
      'Aperçu 02 — Project Two',
      'Aperçu 03 — Project Three',
      'Aperçu 04 — Project Four',
    ]);
    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(['false', 'true', 'false', 'false']);
  });

  it('emits chosen with the clicked project slug, without changing the shown project by itself', async () => {
    const { fixture, host } = await mount({ slug: 'proj-2' });
    const emitted: string[] = [];
    fixture.componentInstance.chosen.subscribe((slug: string) =>
      emitted.push(slug),
    );

    const toolbar = host.querySelector('[aria-label="Corps en orbite"]');
    const buttons = Array.from(
      toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    );
    buttons[2]?.click();
    await fixture.whenStable();

    expect(emitted).toEqual(['proj-3']);
    // Stateless: the component only reflects what its own `slug` input says.
    expect(host.querySelector('.window h2')?.textContent?.trim()).toBe(
      'Project Two',
    );
  });

  it('shows the summary and the facts identity in the body', async () => {
    const { host } = await mount({ slug: 'proj-2' });

    expect(host.querySelector('.window')?.textContent).toContain('Summary two');
    const terms = Array.from(host.querySelectorAll('dl dt')).map((dt) =>
      dt.textContent?.trim(),
    );
    const values = Array.from(host.querySelectorAll('dl dd')).map((dd) =>
      dd.textContent?.trim(),
    );
    expect(terms).toEqual(['Preuve', 'Rôle', 'Pile']);
    expect(values).toEqual(['Proof 2', 'Role 2', 'Stack 2']);
  });

  it('shows the project tag and a link to its sheet in the footer', async () => {
    const { host } = await mount({ slug: 'proj-2' });

    expect(host.querySelector('.window')?.textContent).toContain('live');
    const link = Array.from(host.querySelectorAll('a')).find(
      (anchor) => anchor.textContent?.trim() === 'Ouvrir la fiche →',
    );
    expect(link?.getAttribute('href')).toBe('/projet/proj-2');
  });

  it('re-emits the window pin and close as its own outputs', async () => {
    const { fixture, host } = await mount({ slug: 'proj-2', pinned: true });
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
