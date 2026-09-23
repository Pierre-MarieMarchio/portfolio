import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideStatewise } from 'ngx-statewise';
import { SITE_NAME } from '@app/core/services';
import { RouteHeadStrategy } from '@app/core/strategies';
import { DesktopEffect } from '@app/features/desktop/states';
import { ProjectsEffect, ProjectsManager } from '@app/features/projects/states';
import { CatalogLoaderService, provideI18n } from '@app/i18n';
import { EN } from '@app/i18n/data/en.data';
import { FR } from '@app/i18n/data/fr.data';
import { routes } from '../app/app.routes';

const harness = async () => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      { provide: TitleStrategy, useClass: RouteHeadStrategy },
      provideStatewise({ effects: [ProjectsEffect, DesktopEffect] }),
      provideI18n(),
    ],
  });
  await TestBed.inject(CatalogLoaderService).ensure('fr');
  await TestBed.inject(ProjectsManager).load();
  return RouterTestingHarness.create();
};

const head = () => ({
  title: TestBed.inject(Title).getTitle(),
  description:
    TestBed.inject(Meta).getTag('name="description"')?.content ?? null,
});

describe('page head across a language switch', () => {
  afterEach(() => {
    document.documentElement.setAttribute('lang', 'fr');
    TestBed.resetTestingModule();
  });

  it('names and describes the page in English from a French page', async () => {
    const router = await harness();
    await router.navigateByUrl('/projets');

    await router.navigateByUrl('/en/projects');

    expect(head()).toEqual({
      title: `${EN.pages.heads.index.title} · ${SITE_NAME}`,
      description: EN.pages.heads.index.description,
    });
  });

  it('names and describes the page in French from an English page', async () => {
    const router = await harness();
    await router.navigateByUrl('/en/about');

    await router.navigateByUrl('/a-propos');

    expect(head()).toEqual({
      title: `${FR.pages.heads.about.title} · ${SITE_NAME}`,
      description: FR.pages.heads.about.description,
    });
  });

  it('names an unknown address in the language it was asked in', async () => {
    const router = await harness();
    await router.navigateByUrl('/inconnue');

    await router.navigateByUrl('/en/unknown');

    expect(head().title).toBe(
      `${EN.pages.heads.notFound.title} · ${SITE_NAME}`,
    );
  });

  it('describes a sheet in English from its French sheet', async () => {
    const router = await harness();
    await router.navigateByUrl('/projet/bkone');

    await router.navigateByUrl('/en/project/bkone');

    expect(head().description).toBe(
      TestBed.inject(ProjectsManager).findIn('bkone', 'en')?.subject,
    );
    expect(head().description).toMatch(/^A module of the BKLINK/);
  });
});
