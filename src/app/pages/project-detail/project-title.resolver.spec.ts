import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import {
  loadProjects,
  provideProjects,
  sampleEntry,
} from '@testing/fake-managers';
import { RouteHeadStrategy } from '@app/core/strategies';
import { SITE_NAME } from '@app/core/services';
import { projectTitle } from './project-title.resolver';

@Component({ template: '' })
class Blank {}

const go = (url: string) => TestBed.inject(Router).navigateByUrl(url);

const title = () => TestBed.inject(Title).getTitle();

/** The route resolves the name; the strategy writes it, alone. */
describe('projectTitle', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'projet/:slug', component: Blank, title: projectTitle },
        ]),
        { provide: TitleStrategy, useClass: RouteHeadStrategy },
        provideProjects([
          sampleEntry({
            project: { slug: 'ngx-statewise', title: 'ngx-statewise' },
          }),
          sampleEntry({ project: { slug: 'speakey', title: 'Speakey' } }),
        ]),
      ],
    });
    await loadProjects();
  });

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
