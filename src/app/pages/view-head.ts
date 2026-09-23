import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { Lang, LANGS } from '@app/core/i18n';
import { PAGES_TEXTS, PagesTexts, translatePath } from '@app/i18n';

/** The views whose head the catalogue writes. */
type HeadedView = keyof PagesTexts['heads'];

/** A view's title, in the reader's language: the route's `title`. */
export const headTitle =
  (view: HeadedView): ResolveFn<string> =>
  () =>
    inject(PAGES_TEXTS)().heads[view].title;

/** A view's description, for `data.description`. */
export const headDescription =
  (view: 'home' | 'index' | 'about'): ResolveFn<string> =>
  () =>
    inject(PAGES_TEXTS)().heads[view].description;

/**
 * The address of this page in each language, for the head's `hreflang`
 * links and its canonical: the same view, its slug kept.
 */
export const alternates: ResolveFn<Readonly<Record<Lang, string>>> = (
  _route,
  state,
) =>
  Object.fromEntries(
    LANGS.map((lang) => [lang, translatePath(state.url, lang)]),
  ) as Record<Lang, string>;
