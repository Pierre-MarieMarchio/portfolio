import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DisplayFormatService } from '@app/core/services';
import { WindowComponent } from '@shared/windows/components';
import { RankedProject } from '../../models';
import { ProjectsManager } from '../../states';
import { LINKS } from '@app/features/common';
import { PROJECTS_TEXTS } from '../../ports';
import { positionOf } from '../../rules/project-labels.rules';

interface Neighbours {
  readonly previous: RankedProject;
  readonly next: RankedProject;
}

@Component({
  selector: 'app-project-preview',
  imports: [NgTemplateOutlet, RouterLink, WindowComponent],
  templateUrl: './project-preview.component.html',
  styleUrl: './project-preview.component.scss',
})
export class ProjectPreviewComponent {
  private readonly manager = inject(ProjectsManager);
  protected readonly texts = inject(PROJECTS_TEXTS);
  protected readonly links = inject(LINKS);
  protected readonly display = inject(DisplayFormatService);

  public readonly slug = input.required<string | null>();
  public readonly pinned = input(false);

  public readonly pinToggled = output();
  public readonly closed = output();
  public readonly chosen = output<string>();

  protected readonly project = computed(() => {
    const slug = this.slug();
    const project = slug === null ? undefined : this.manager.find(slug);
    return project?.featured ? project : null;
  });

  protected readonly meta = computed(() => {
    const project = this.project();
    return project
      ? positionOf(project.rank + 1, this.manager.featured().length)
      : '';
  });

  protected readonly neighbours = computed<Neighbours | null>(() => {
    const featured = this.manager.featured();
    const index = featured.findIndex((project) => project.slug === this.slug());
    if (index < 0 || featured.length < 2) {
      return null;
    }
    const previous = featured[(index - 1 + featured.length) % featured.length];
    const next = featured[(index + 1) % featured.length];
    return previous && next ? { previous, next } : null;
  });
}
