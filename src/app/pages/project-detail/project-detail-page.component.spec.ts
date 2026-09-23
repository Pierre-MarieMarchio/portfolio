import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { fakeProjectsManager, sampleProject } from '@testing/fake-managers';
import { ProjectsManager } from '@app/features/projects/states';
import { StationManager } from '@app/features/station/states';
import { ProjectDetailPageComponent } from './project-detail-page.component';

describe('ProjectDetailPageComponent', () => {
  const mount = async (slug: string) => {
    const manager = fakeProjectsManager([
      sampleProject({ slug: 'ngx-statewise', title: 'ngx-statewise' }),
      sampleProject({ slug: 'speakey', title: 'Speakey' }),
    ]);

    TestBed.configureTestingModule({
      imports: [ProjectDetailPageComponent],
      providers: [
        provideStatewise(),
        { provide: ProjectsManager, useValue: manager },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ slug }) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(ProjectDetailPageComponent);
    const station = TestBed.inject(StationManager);
    const declared = { view: station.view(), slug: station.slug() };
    fixture.componentRef.setInput('slug', slug);
    await fixture.whenStable();

    return { fixture, manager, station, declared };
  };

  /** Before any render: the station's first check already sees the sheet. */
  it('declares the sheet to the station as soon as it is created', async () => {
    const { declared } = await mount('ngx-statewise');

    expect(declared).toEqual({ view: 'sheet', slug: 'ngx-statewise' });
  });

  it('names the tab and the share card after the project', async () => {
    await mount('ngx-statewise');

    expect(TestBed.inject(Title).getTitle()).toBe(
      'ngx-statewise · Pierre-Marie Marchio',
    );
    expect(TestBed.inject(Meta).getTag('property="og:title"')?.content).toBe(
      'ngx-statewise · Pierre-Marie Marchio',
    );
  });

  /** From one sheet to the next the outlet keeps the marker: the input moves. */
  it('follows the slug when the outlet reuses it for another sheet', async () => {
    const { fixture, station } = await mount('ngx-statewise');

    fixture.componentRef.setInput('slug', 'speakey');
    await fixture.whenStable();

    expect(station.slug()).toBe('speakey');
    expect(station.visited()).toEqual(['ngx-statewise', 'speakey']);
    expect(TestBed.inject(Title).getTitle()).toBe(
      'Speakey · Pierre-Marie Marchio',
    );
  });

  /** The project is derived, not copied: a reload shows through it. */
  it('follows the list when the project changes behind the slug', async () => {
    const { fixture, manager } = await mount('ngx-statewise');

    manager.projects.set([
      sampleProject({ slug: 'ngx-statewise', title: 'ngx-statewise 1.0' }),
    ]);
    await fixture.whenStable();

    expect(TestBed.inject(Title).getTitle()).toBe(
      'ngx-statewise 1.0 · Pierre-Marie Marchio',
    );
  });
});
