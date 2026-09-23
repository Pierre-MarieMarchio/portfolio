import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { fakeProjectsManager, sampleProject } from '@testing/fake-managers';
import { PageTitleStrategy, SITE_NAME } from '@app/core/services';
import { ProjectsManager } from '@app/features/projects/states';
import { projectTitle } from './project-title.resolver';

@Component({ template: '' })
class Blank {}

/** The route resolves the name; the strategy writes it, alone. */
describe('projectTitle', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'projet/:slug', component: Blank, title: projectTitle },
        ]),
        { provide: TitleStrategy, useClass: PageTitleStrategy },
        {
          provide: ProjectsManager,
          useValue: fakeProjectsManager([
            sampleProject({ slug: 'ngx-statewise', title: 'ngx-statewise' }),
            sampleProject({ slug: 'speakey', title: 'Speakey' }),
          ]),
        },
      ],
    });
  });

  const go = (url: string) => TestBed.inject(Router).navigateByUrl(url);
  const title = () => TestBed.inject(Title).getTitle();

  it('names the tab and the share card after the project', async () => {
    await go('/projet/ngx-statewise');

    expect(title()).toBe(`ngx-statewise · ${SITE_NAME}`);
    expect(TestBed.inject(Meta).getTag('property="og:title"')?.content).toBe(
      `ngx-statewise · ${SITE_NAME}`,
    );
  });

  /** The regression a second writer caused: the strategy wrote "Projet" back. */
  it('renames the tab from one sheet to the next', async () => {
    await go('/projet/ngx-statewise');
    await go('/projet/speakey');

    expect(title()).toBe(`Speakey · ${SITE_NAME}`);
  });

  it('keeps the route word for a slug that names no project', async () => {
    await go('/projet/inconnu');

    expect(title()).toBe(`Projet · ${SITE_NAME}`);
  });
});
