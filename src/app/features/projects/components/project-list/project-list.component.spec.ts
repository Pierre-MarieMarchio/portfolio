import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { sampleProject } from '@testing/fake-managers';
import { ProjectListComponent } from './project-list.component';

describe('ProjectListComponent', () => {
  const mount = async (projects = [sampleProject()]) => {
    TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [provideRouter([])],
    });

    const fixture = TestBed.createComponent(ProjectListComponent);
    fixture.componentRef.setInput('projects', projects);
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  };

  it('links each project to its own page', async () => {
    const link = (await mount()).querySelector('a');

    expect(link?.getAttribute('href')).toBe('/projet/ngx-statewise');
    expect(link?.textContent?.trim()).toBe('ngx-statewise');
  });

  it('says where the project was made, in words', async () => {
    const host = await mount([sampleProject({ family: 'professional' })]);

    expect(host.querySelector('.family')?.textContent?.trim()).toBe(
      'En entreprise',
    );
  });

  it('says so when there is nothing to list', async () => {
    const host = await mount([]);

    expect(host.textContent?.trim()).toBe('Aucun projet.');
  });
});
