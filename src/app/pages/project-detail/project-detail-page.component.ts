import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SeoService } from '@app/core/services';
import { ProjectsManager } from '@app/features/projects/states';
import { StationManager } from '@app/features/station/states';

/**
 * The address of a sheet. The sheet itself is rendered by the station; this
 * marker says which one, and names the tab after the project.
 */
@Component({
  selector: 'app-project-detail-page',
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
    const station = inject(StationManager);
    const title = inject(Title);
    const seo = inject(SeoService);

    // Declared at once, before the station's view is checked: inputs are not
    // bound yet, the snapshot already holds the slug.
    station.navigated(
      'sheet',
      inject(ActivatedRoute).snapshot.paramMap.get('slug'),
    );

    // From one sheet to the next the outlet keeps this component: the slug
    // input is what changes then.
    effect(() => {
      const slug = this.slug();
      untracked(() => {
        if (station.view() !== 'sheet' || station.slug() !== slug) {
          station.navigated('sheet', slug);
        }
      });
    });

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
