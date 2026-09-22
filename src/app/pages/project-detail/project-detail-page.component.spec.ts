import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { fakeProjectsManager, sampleProject } from '@testing/fake-managers';
import { ProjectsManager } from '@app/features/projects/states';
import { ProjectDetailPageComponent } from './project-detail-page.component';

describe('ProjectDetailPageComponent', () => {
  const mount = async (slug: string) => {
    const manager = fakeProjectsManager([
      sampleProject({ slug: 'ngx-statewise', title: 'ngx-statewise' }),
    ]);

    TestBed.configureTestingModule({
      imports: [ProjectDetailPageComponent],
      providers: [
        provideRouter([]),
        { provide: ProjectsManager, useValue: manager },
      ],
    });

    const fixture = TestBed.createComponent(ProjectDetailPageComponent);
    fixture.componentRef.setInput('slug', slug);
    await fixture.whenStable();

    return { fixture, manager, host: fixture.nativeElement as HTMLElement };
  };

  const heading = (host: HTMLElement) =>
    host.querySelector('h1')?.textContent?.trim();

  it('shows the project behind the slug, and names the tab and the card after it', async () => {
    const { host } = await mount('ngx-statewise');

    expect(heading(host)).toBe('ngx-statewise');
    expect(TestBed.inject(Title).getTitle()).toBe(
      'ngx-statewise · Pierre-Marie Marchio',
    );
    expect(TestBed.inject(Meta).getTag('property="og:title"')?.content).toBe(
      'ngx-statewise · Pierre-Marie Marchio',
    );
  });

  it('says so when no project answers to the slug', async () => {
    const { host } = await mount('nope');

    expect(heading(host)).toBe('Projet introuvable');
    expect(host.textContent).toContain('« nope »');
  });

  /** The project is derived, not copied: a reload shows through it. */
  it('follows the list when the project changes behind the slug', async () => {
    const { fixture, manager, host } = await mount('ngx-statewise');

    manager.projects.set([
      sampleProject({ slug: 'ngx-statewise', title: 'ngx-statewise 1.0' }),
    ]);
    await fixture.whenStable();

    expect(heading(host)).toBe('ngx-statewise 1.0');
  });
});
