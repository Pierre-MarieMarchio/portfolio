import { inject, Injectable } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Lang, LANGS, langOfUrl } from '../i18n';
import { PageHead } from './page-head.service';

/**
 * Every route names itself with `title`, and may describe itself with
 * `data.description` and give its other languages' addresses with
 * `data.alternates`. This turns both into the document's head, in one place,
 * so no page has to remember to call a service from its constructor.
 *
 * A title that depends on the content (a project's name) is a route
 * resolver's job: the router hands this strategy the resolved string like
 * any other, and `PageHead` stays the only writer of the head.
 */
@Injectable()
export class PageTitleStrategy extends TitleStrategy {
  private readonly head = inject(PageHead);

  public override updateTitle(snapshot: RouterStateSnapshot): void {
    this.head.set({
      title: this.buildTitle(snapshot),
      description: deepest(snapshot, 'description', isString),
      lang: langOfUrl(snapshot.url),
      alternates: deepest(snapshot, 'alternates', isAlternates),
    });
  }
}

/** A value of the deepest route that declares one of the right shape. */
function deepest<T>(
  snapshot: RouterStateSnapshot,
  key: string,
  is: (value: unknown) => value is T,
): T | null {
  let route = snapshot.root;
  let found: T | null = null;

  while (route) {
    const candidate: unknown = route.data[key];

    if (is(candidate)) {
      found = candidate;
    }

    if (!route.firstChild) {
      break;
    }

    route = route.firstChild;
  }

  return found;
}

const isString = (value: unknown): value is string => typeof value === 'string';

/** The page's address in each language, as `alternates` resolves it. */
const isAlternates = (value: unknown): value is Record<Lang, string> =>
  typeof value === 'object' &&
  value !== null &&
  LANGS.every(
    (lang) => typeof (value as Record<string, unknown>)[lang] === 'string',
  );
