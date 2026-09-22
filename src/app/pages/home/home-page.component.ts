import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectListComponent } from '@app/features/projects/components';
import { ProjectsManager } from '@app/features/projects/states';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ProjectListComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page' },
})
export class HomePageComponent {
  protected readonly projects = inject(ProjectsManager);
}
