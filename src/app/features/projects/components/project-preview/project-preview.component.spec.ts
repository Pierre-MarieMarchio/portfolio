import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
} from '@testing/fixtures/project.fixture';
import { FEATURED } from '@app/features/projects/states';
import { PROJECTS_TEXTS } from '@app/features/projects/ports';
import { ProjectPreviewComponent } from './project-preview.component';
import { recordOutput } from '@testing/fixtures/testbed.fixture';
import { resizeTo, stubMedia } from '@testing/doubles/browser.double';

const TOUCH = new Set(['(pointer: coarse)', '(hover: none)']);

describe('ProjectPreviewComponent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const NAMES = ['One', 'Two', 'Three', 'Four', 'Five'];
  const TAGS = ['beta', 'live', 'archived', 'draft', 'wip'];

  const ENTRIES = NAMES.map((name, index) =>
    sampleEntry({
      project: {
        slug: `proj-${String(index + 1)}`,
        title: `Project ${name}`,
        short: name,
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

    return {
      fixture,
      manager,
      host: fixture.nativeElement as HTMLElement,
      texts: TestBed.inject(PROJECTS_TEXTS)().preview,
    };
  };

  it('renders nothing for a project the home page does not feature', async () => {
    const { host } = await mount({ slug: 'proj-5' });

    expect(ENTRIES.length).toBeGreaterThan(TestBed.inject(FEATURED));
    expect(host.querySelector('.window')).toBeNull();
  });

  it('opens a window titled after the project, with its rank among the featured', async () => {
    const { host, texts } = await mount({ slug: 'proj-2' });
    const windowEl = host.querySelector('.window');

    expect(windowEl?.getAttribute('aria-label')).toBe(texts.label);
    expect(windowEl?.querySelector('h2')?.textContent?.trim()).toBe(
      'Project Two',
    );
    expect(host.querySelector('.meta')?.textContent?.trim()).toBe(
      `02 / 0${String(TestBed.inject(FEATURED))}`,
    );
  });

  it('lists one toolbar button per featured project only, labelled and pressed on the shown one, on the phone', async () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);
    const { host, texts } = await mount({ slug: 'proj-2' });
    const toolbar = host.querySelector(`[aria-label="${texts.bodies}"]`);
    const buttons = [
      ...(toolbar?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ];

    const featuredCount = TestBed.inject(FEATURED);
    const featured = NAMES.slice(0, featuredCount);
    expect(buttons).toHaveLength(featuredCount);
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(
      featured.map((_, index) => `0${String(index + 1)}`),
    );
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(
      featured.map((name, index) =>
        texts.body(`0${String(index + 1)}`, `Project ${name}`),
      ),
    );
    expect(
      buttons.map((button) => button.getAttribute('aria-pressed')),
    ).toEqual(featured.map((_, index) => String(index === 1)));
  });

  it('emits chosen with the clicked project slug, without changing the shown project by itself, on the phone', async () => {
    stubMedia(TOUCH);
    resizeTo(390, 844);
    const { fixture, host, texts } = await mount({ slug: 'proj-2' });
    const emitted = recordOutput(fixture.componentInstance.chosen);

    host
      .querySelector(`[aria-label="${texts.bodies}"]`)
      ?.querySelectorAll<HTMLButtonElement>('button')[2]
      ?.click();
    await fixture.whenStable();

    expect(emitted).toEqual(['proj-3']);
    expect(host.querySelector('.window h2')?.textContent?.trim()).toBe(
      'Project Two',
    );
  });

  it('offers a named link to the previous and the next featured project, on the desktop', async () => {
    const { host, texts } = await mount({ slug: 'proj-2' });

    expect(host.querySelector('.previous')?.getAttribute('aria-label')).toBe(
      texts.previous('Project One'),
    );
    expect(host.querySelector('.previous')?.textContent?.trim()).toContain(
      'One',
    );
    expect(host.querySelector('.next')?.getAttribute('aria-label')).toBe(
      texts.next('Project Three'),
    );
    expect(host.querySelector('.next')?.textContent?.trim()).toContain('Three');
  });

  it('loops from the first featured project back to the last one, and back', async () => {
    const { host, texts } = await mount({ slug: 'proj-1' });

    const featuredCount = TestBed.inject(FEATURED);
    const last = NAMES[featuredCount - 1];
    expect(host.querySelector('.previous')?.getAttribute('aria-label')).toBe(
      texts.previous(`Project ${last ?? ''}`),
    );
  });

  it('emits chosen with the neighbour slug on a click, without changing the shown project by itself', async () => {
    const { fixture, host } = await mount({ slug: 'proj-2' });
    const emitted = recordOutput(fixture.componentInstance.chosen);

    host.querySelector<HTMLButtonElement>('.next')?.click();
    await fixture.whenStable();

    expect(emitted).toEqual(['proj-3']);
    expect(host.querySelector('.window h2')?.textContent?.trim()).toBe(
      'Project Two',
    );
  });

  it('shows the summary and the facts identity in the body, every value in the same type as the proof', async () => {
    const { host, texts } = await mount({ slug: 'proj-2' });

    expect(host.querySelector('.window')?.textContent).toContain('Summary two');
    const terms = [...host.querySelectorAll('dl dt')].map((dt) =>
      dt.textContent?.trim(),
    );
    const values = [...host.querySelectorAll<HTMLElement>('dl dd')];
    expect(terms).toEqual(Object.values(texts.terms));
    expect(values.map((dd) => dd.textContent?.trim())).toEqual([
      'Proof 2',
      'Role 2',
      'Stack 2',
    ]);
    expect(values.every((dd) => dd.classList.contains('data'))).toBe(true);
    expect(host.querySelector('.text')).toBeNull();
  });

  it('shows the project tag and a link to its sheet in the footer', async () => {
    const { host, texts } = await mount({ slug: 'proj-2' });

    expect(host.querySelector('.window')?.textContent).toContain('live');
    const link = [...host.querySelectorAll('a')].find(
      (anchor) => anchor.textContent?.trim() === texts.openSheet,
    );
    expect(link?.getAttribute('href')).toBe('/projet/proj-2');
  });

  it('has no tag in the footer when the project does not carry one, keeping the link to its sheet', async () => {
    const untagged = sampleEntry({
      project: { slug: 'proj-6', title: 'Project Six', tag: undefined },
      facts: { proof: 'Proof 6', role: 'Role 6', stack: 'Stack 6' },
    });
    TestBed.configureTestingModule({
      imports: [ProjectPreviewComponent],
      providers: [
        provideRouter([]),
        provideProjects([...ENTRIES, untagged], []),
        { provide: FEATURED, useValue: 6 },
      ],
    });
    await loadProjects();
    const fixture = TestBed.createComponent(ProjectPreviewComponent);
    fixture.componentRef.setInput('slug', 'proj-6');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const texts = TestBed.inject(PROJECTS_TEXTS)().preview;

    expect(host.querySelector('.tag')).toBeNull();
    const link = [...host.querySelectorAll('a')].find(
      (anchor) => anchor.textContent?.trim() === texts.openSheet,
    );
    expect(link?.getAttribute('href')).toBe('/projet/proj-6');
  });

  it('re-emits the window pin and close as its own outputs', async () => {
    const { fixture, host } = await mount({ slug: 'proj-2', pinned: true });
    const pinToggled = recordOutput(fixture.componentInstance.pinToggled);
    const closed = recordOutput(fixture.componentInstance.closed);

    host.querySelector<HTMLButtonElement>('button.pin')?.click();
    host.querySelector<HTMLButtonElement>('button.close')?.click();

    expect(pinToggled).toHaveLength(1);
    expect(closed).toHaveLength(1);
  });
});
