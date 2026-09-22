import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SeoService } from './seo.service';

/**
 * Every route names itself with `title`, and may describe itself with
 * `data.description`. This turns both into the document's head, in one place,
 * so no page has to remember to call a service from its constructor.
 *
 * A page whose title depends on its content (a project's name) calls
 * `Title` itself once it knows it; this strategy only sets the default.
 */
@Injectable()
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly seo = inject(SeoService);

  public override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    const fullTitle = pageTitle
      ? `${pageTitle} · ${environment.SITE_NAME}`
      : environment.SITE_NAME;

    this.title.setTitle(fullTitle);
    this.seo.name(fullTitle);
    this.seo.describe(deepestDescription(snapshot));
  }
}

/** The description of the deepest route that declares one. */
function deepestDescription(snapshot: RouterStateSnapshot): string | null {
  let route = snapshot.root;
  let description: string | null = null;

  while (route) {
    const candidate: unknown = route.data['description'];

    if (typeof candidate === 'string') {
      description = candidate;
    }

    if (!route.firstChild) {
      break;
    }

    route = route.firstChild;
  }

  return description;
}
