import { inject } from '@angular/core';
import type {
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterStateSnapshot,
} from '@angular/router';
import { Lang, LANGS, langOfUrl } from '@app/core/models';
import { ProjectsManager } from '@app/features/projects/states';
import { CatalogLoaderService, PagesTexts, translatePath } from '@app/i18n';

type HeadedView = keyof PagesTexts['heads'];

type DescribedView = 'home' | 'index' | 'about';

const headsOf = (state: RouterStateSnapshot): PagesTexts['heads'] =>
  inject(CatalogLoaderService).of(langOfUrl(state.url)).pages.heads;

export const viewTitle =
  (view: HeadedView): ResolveFn<string> =>
  (_route, state) =>
    headsOf(state)[view].title;

export const viewDescription =
  (view: DescribedView): ResolveFn<string> =>
  (_route, state) =>
    headsOf(state)[view].description;

const projectIn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
  inject(ProjectsManager).findIn(
    route.paramMap.get('slug') ?? '',
    langOfUrl(state.url),
  );

export const sheetTitle: ResolveFn<string> = (route, state) =>
  projectIn(route, state)?.title ?? headsOf(state).sheet.title;

export const sheetDescription: ResolveFn<string | null> = (route, state) =>
  projectIn(route, state)?.subject ?? null;

export const alternates: ResolveFn<Readonly<Record<Lang, string>>> = (
  _route,
  state,
) =>
  Object.fromEntries(
    LANGS.map((lang) => [lang, translatePath(state.url, lang)]),
  ) as Record<Lang, string>;
