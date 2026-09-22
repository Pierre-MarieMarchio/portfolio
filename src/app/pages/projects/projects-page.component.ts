import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ProjectListComponent } from '@app/features/projects/components';
import { ProjectFamily } from '@app/features/projects/models';
import { ProjectsManager } from '@app/features/projects/states';

type FamilyFilter = ProjectFamily | 'all';

@Component({
  selector: 'app-projects-page',
  imports: [ProjectListComponent],
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page' },
})
export class ProjectsPageComponent {
  protected readonly manager = inject(ProjectsManager);

  protected readonly filters: readonly {
    value: FamilyFilter;
    label: string;
  }[] = [
    { value: 'all', label: 'Tout' },
    { value: 'professional', label: 'En entreprise' },
    { value: 'personal', label: 'Personnels' },
  ];

  /**
   * Screen state, so a local signal: which family is shown is a matter of
   * this page, and no other screen has to agree with it.
   */
  protected readonly family = signal<FamilyFilter>('all');

  protected readonly visible = computed(() => {
    const family = this.family();

    return this.manager
      .projects()
      .filter((project) => family === 'all' || project.family === family);
  });
}
