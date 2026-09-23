import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
} from '@testing/fake-managers';
import { FEATURED_COUNT } from '@app/features/projects/states';
import { ProjectPreviewComponent } from './project-preview.component';

describe('ProjectPreviewComponent', () => {
  const NAMES = ['One', 'Two', 'Three', 'Four', 'Five'];
  const TAGS = ['beta', 'live', 'archived', 'draft', 'wip'];

  /** One more project than the home page features. */
  const ENTRIES = NAMES.map((name, index) =>
    sampleEntry({
      project: {
        slug: `proj-${String(index + 1)}`,
        title: `Project ${name}`,
        tag: TAGS[index] ?? '',
        summary: `Summary ${name.toLowerCase()}`,
      },
      facts: {
        proof: `Proof ${String(index + 1)}`,
        role: `Role ${String(index + 1)}`,
        stack: `Stack ${String(index + 1)}`,
      },
    }),
  );

  const mount = async (inputs: { slug: string; pinned?: boolean }) => {
    TestBed.configureTestingModule({
      imports: [ProjectPreviewComponent],
      providers: [provideRouter([]), provideProjects(ENTRIES)],
    });
    const manager = await loadProjects();

    const fixture = TestBed.createComponent(ProjectPreviewComponent);
    fixture.componentRef.setInput('slug', inputs.slug);
    fixture.componentRef.setInput('pinned', inputs.pinned ?? false);
    await fixture.whenStable();

    return { fixture, manager, host: fixture.nativeElement as HTMLElement };
  };

  it('holds one more project than it features, so the limit is exercised', () => {
    expect(ENTRIES.length).toBeGreaterThan(FEATURED_COUNT);
  });

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
    // proj-2 is the second of the featured ones, which stay FEATURED_COUNT
    // even with more projects in the catalog.
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe(
      `02 / 0${String(FEATURED_COUNT)}`,
    );
  });

  it('lists one toolbar button per featured project only, labelled and pressed on the shown one', async () => {
    const { host } = await mount({ slug: 'proj-2' });
    const toolbar = host.querySelector('[aria-label="Corps en orbite"]');
    const buttons = [
      ...(toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ];

    const featured = NAMES.slice(0, FEATURED_COUNT);
    expect(buttons).toHaveLength(FEATURED_COUNT);
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(
      featured.map((_, index) => `0${String(index + 1)}`),
    );
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(
      featured.map(
        (name, index) => `Aperçu 0${String(index + 1)} — Project ${name}`,
      ),
    );
    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(featured.map((_, index) => String(index === 1)));
  });

  it('emits chosen with the clicked project slug, without changing the shown project by itself', async () => {
    const { fixture, host } = await mount({ slug: 'proj-2' });
    const emitted: string[] = [];
    fixture.componentInstance.chosen.subscribe((slug: string) =>
      emitted.push(slug),
    );

    const toolbar = host.querySelector('[aria-label="Corps en orbite"]');
    const buttons = [
      ...(toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ];
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
    const terms = [...host.querySelectorAll('dl dt')].map((dt) =>
      dt.textContent?.trim(),
    );
    const values = [...host.querySelectorAll('dl dd')].map((dd) =>
      dd.textContent?.trim(),
    );
    expect(terms).toEqual(['Preuve', 'Rôle', 'Pile']);
    expect(values).toEqual(['Proof 2', 'Role 2', 'Stack 2']);
  });

  it('shows the project tag and a link to its sheet in the footer', async () => {
    const { host } = await mount({ slug: 'proj-2' });

    expect(host.querySelector('.window')?.textContent).toContain('live');
    const link = [...host.querySelectorAll('a')].find(
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
