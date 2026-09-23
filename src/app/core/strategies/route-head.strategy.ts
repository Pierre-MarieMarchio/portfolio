import { inject, Service } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Lang, LANGS, langOfUrl } from '../models';
import { DocumentHeadService } from '../services/head/document-head.service';

@Service({ autoProvided: false })
export class RouteHeadStrategy extends TitleStrategy {
  private readonly head = inject(DocumentHeadService);

  public override updateTitle(snapshot: RouterStateSnapshot): void {
    this.head.set({
      title: this.buildTitle(snapshot),
      description: deepest(snapshot, 'description', isString),
      lang: langOfUrl(snapshot.url),
      alternates: deepest(snapshot, 'alternates', isAlternates),
    });
  }
}

function deepest<T>(
  snapshot: RouterStateSnapshot,
  key: string,
  isShaped: (value: unknown) => value is T,
): T | null {
  let route = snapshot.root;
  let found: T | null = null;

  while (route) {
    const candidate: unknown = route.data[key];

    if (isShaped(candidate)) {
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

const isAlternates = (value: unknown): value is Record<Lang, string> =>
  typeof value === 'object' &&
  value !== null &&
  LANGS.every(
    (lang) => typeof (value as Record<string, unknown>)[lang] === 'string',
  );
