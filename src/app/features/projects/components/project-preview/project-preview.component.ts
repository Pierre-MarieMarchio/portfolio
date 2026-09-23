import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SegmentedComponent } from '@shared/ui/components';
import { SegmentedItem } from '@shared/ui/models';
import { WindowComponent } from '@shared/windows/components';
import { ProjectsManager } from '../../states';
import { LINKS } from '@app/features/common';
import { PROJECTS_TEXTS } from '../../ports';
import { positionOf } from '../../rules/project-labels.rules';

@Component({
  selector: 'app-project-preview',
  imports: [RouterLink, SegmentedComponent, WindowComponent],
  templateUrl: './project-preview.component.html',
  styleUrl: './project-preview.component.scss',
})
export class ProjectPreviewComponent {
  private readonly manager = inject(ProjectsManager);
  protected readonly texts = inject(PROJECTS_TEXTS);
  protected readonly links = inject(LINKS);

  public readonly slug = input.required<string>();
  public readonly pinned = input(false);

  public readonly pinToggled = output();
  public readonly closed = output();
  public readonly chosen = output<string>();

  protected readonly project = computed(() => {
    const project = this.manager.find(this.slug());
    return project?.featured ? project : null;
  });

  protected readonly meta = computed(() => {
    const project = this.project();
    return project
      ? positionOf(project.rank + 1, this.manager.featured().length)
      : '';
  });

  protected readonly choices = computed<readonly SegmentedItem[]>(() =>
    this.manager.featured().map((project) => ({
      value: project.slug,
      label: project.number,
      active: project.slug === this.slug(),
      aria: this.texts().preview.body(project.number, project.title),
    })),
  );
}
