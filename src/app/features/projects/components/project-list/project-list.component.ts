import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../models';

/**
 * A list of projects, each leading to its page. It takes the projects as an
 * input rather than reading the manager, so the page decides which ones
 * (featured, all of them, one family) and the list only draws them.
 */
@Component({
  selector: 'app-project-list',
  imports: [RouterLink],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectListComponent {
  public readonly projects = input.required<readonly Project[]>();

  protected readonly familyLabel: Record<Project['family'], string> = {
    professional: 'En entreprise',
    personal: 'Personnel',
  };
}
