import { inject, Injectable } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { PageHead } from './page-head.service';

/**
 * Every route names itself with `title`, and may describe itself with
 * `data.description`. This turns both into the document's head, in one place,
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
      description: deepestDescription(snapshot),
    });
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
