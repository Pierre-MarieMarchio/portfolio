import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SeoService } from '@app/core/services';
import { ProjectsManager } from '@app/features/projects/states';

@Component({
  selector: 'app-project-detail-page',
  imports: [RouterLink],
  templateUrl: './project-detail-page.component.html',
  styleUrl: './project-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page' },
})
export class ProjectDetailPageComponent {
  private readonly manager = inject(ProjectsManager);

  /** Bound from `:slug` by `withComponentInputBinding()`. */
  public readonly slug = input.required<string>();

  /** Derived from the slug, never stored: a reload shows through it. */
  protected readonly project = computed(() => this.manager.find(this.slug()));

  constructor() {
    const title = inject(Title);
    const seo = inject(SeoService);

    // The route can only say "Projet"; the project's own name is known here.
    // Both the tab and the share card are renamed, or they would disagree.
    effect(() => {
      const project = this.project();

      if (project) {
        const fullTitle = `${project.title} · ${environment.SITE_NAME}`;

        title.setTitle(fullTitle);
        seo.name(fullTitle);
      }
    });
  }
}
