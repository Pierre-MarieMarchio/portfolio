import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { twoDigits } from '@app/core/helpers';
import { SegmentedComponent } from '@shared/ui/components';
import { SegmentedItem } from '@shared/ui/models';
import { WindowComponent } from '@shared/windows/components';
import { ProjectsManager } from '../../states';
import { LINKS } from '@app/features/common';
import { PROJECTS_TEXTS } from '../../ports';
import { chapterTitle, positionOf } from '../../rules/project-labels.rules';
import { ViewHeadingDirective } from '@shared/ui/directives';
import {
  ChapterOnShow,
  ProjectChapterComponent,
} from '../project-chapter/project-chapter.component';

@Component({
  selector: 'app-project-detail',
  imports: [
    ViewHeadingDirective,
    ProjectChapterComponent,
    RouterLink,
    SegmentedComponent,
    WindowComponent,
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent {
  private readonly manager = inject(ProjectsManager);
  protected readonly texts = inject(PROJECTS_TEXTS);
  protected readonly links = inject(LINKS);

  public readonly slug = input.required<string>();
  public readonly pinned = input(false);
  public readonly chapter = input(0);

  public readonly pinToggled = output();
  public readonly closed = output();
  public readonly chapterChange = output<number>();

  protected readonly scrollKey = computed(() => `sheet:${this.slug()}`);

  protected readonly detail = computed(() =>
    this.manager.detailOf(this.slug()),
  );
  protected readonly project = computed(() => this.manager.find(this.slug()));

  protected readonly meta = computed(() => {
    const project = this.project();
    return project
      ? positionOf(project.rank + 1, this.manager.ranked().length)
      : '';
  });

  protected readonly identity = computed(() =>
    this.chapter() === 0 ? (this.project()?.facts ?? null) : null,
  );

  protected readonly current = computed<ChapterOnShow | null>(() => {
    const index = this.chapter();
    const chapter = this.detail()?.chapters[index];
    return chapter
      ? {
          ...chapter,
          number: twoDigits(index + 1),
          heading: this.titleOf(index),
        }
      : null;
  });

  protected readonly chapters = computed<readonly SegmentedItem<number>[]>(() =>
    (this.detail()?.chapters ?? []).map((_, index) => {
      const number = twoDigits(index + 1);
      return {
        value: index,
        label: number,
        active: index === this.chapter(),
        aria: this.texts().sheet.approach(number, this.titleOf(index)),
      };
    }),
  );

  private readonly last = computed(
    () => (this.detail()?.chapters.length ?? 1) - 1,
  );

  protected readonly nextChapter = computed(() => {
    const index = this.chapter();
    return index < this.last()
      ? this.texts().sheet.nextApproach(this.titleOf(index + 1))
      : null;
  });

  protected readonly nextProject = computed(() => {
    if (this.chapter() < this.last()) {
      return null;
    }
    const next = this.manager.nextOf(this.slug());
    return next
      ? { slug: next.slug, label: this.texts().sheet.nextProject(next.short) }
      : null;
  });

  private titleOf(index: number): string {
    return chapterTitle(
      this.detail(),
      index,
      this.texts().defaultChapterTitles,
    );
  }

  protected advance(): void {
    this.chapterChange.emit(Math.min(this.chapter() + 1, this.last()));
  }
}
