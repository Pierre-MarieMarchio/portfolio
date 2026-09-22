import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { fakeProjectsManager, sampleProject } from '@testing/fake-managers';
import { ProjectsManager } from '@app/features/projects/states';
import { ProjectsPageComponent } from './projects-page.component';

describe('ProjectsPageComponent', () => {
  const mount = async () => {
    const manager = fakeProjectsManager([
      sampleProject({ slug: 'a', title: 'A', family: 'professional' }),
      sampleProject({ slug: 'b', title: 'B', family: 'personal' }),
      sampleProject({ slug: 'c', title: 'C', family: 'professional' }),
    ]);

    TestBed.configureTestingModule({
      imports: [ProjectsPageComponent],
      providers: [
        provideRouter([]),
        { provide: ProjectsManager, useValue: manager },
      ],
    });

    const fixture = TestBed.createComponent(ProjectsPageComponent);
    await fixture.whenStable();

    return { fixture, manager, host: fixture.nativeElement as HTMLElement };
  };

  const titles = (host: HTMLElement) =>
    Array.from(host.querySelectorAll('app-project-list a')).map((link) =>
      link.textContent?.trim(),
    );

  it('lists every project until a family is chosen', async () => {
    const { host } = await mount();

    expect(titles(host)).toEqual(['A', 'B', 'C']);
  });

  /** Filtering is not re-sorting: the rank order survives it. */
  it('keeps one family, in the same order', async () => {
    const { fixture, host } = await mount();
    const professional = Array.from(
      host.querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.trim() === 'En entreprise');

    professional?.click();
    await fixture.whenStable();

    expect(titles(host)).toEqual(['A', 'C']);
    expect(professional?.getAttribute('aria-pressed')).toBe('true');
  });

  it('says so when the projects could not be read', async () => {
    const { fixture, manager, host } = await mount();

    manager.isError.set(true);
    await fixture.whenStable();

    expect(host.querySelector('[role="alert"]')).not.toBeNull();
  });
});
