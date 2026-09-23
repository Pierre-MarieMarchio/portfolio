import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SegmentedComponent, SegmentedItem } from '@shared/ui/segmented';
import { WindowComponent } from '@shared/ui/window';
import { ProjectsManager } from '../../states';
import { positionOf } from '../project-labels';

/**
 * The home preview: a small window anchored bottom right, over the object,
 * with what a recruiter asks first (proof, role, stack) and the way to the
 * sheet. Its selector changes the body in place among the featured ones.
 */
@Component({
  selector: 'app-project-preview',
  imports: [RouterLink, SegmentedComponent, WindowComponent],
  templateUrl: './project-preview.component.html',
  styleUrl: './project-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPreviewComponent {
  private readonly manager = inject(ProjectsManager);

  public readonly slug = input.required<string>();
  public readonly pinned = input(false);

  public readonly pinToggled = output();
  public readonly closed = output();
  /** Another featured body chosen in the selector. */
  public readonly chosen = output<string>();

  protected readonly project = computed(() => this.manager.find(this.slug()));

  /** The badge names what the window shows, not the last body hovered. */
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
      aria: `Aperçu ${project.number} — ${project.title}`,
    })),
  );
}
