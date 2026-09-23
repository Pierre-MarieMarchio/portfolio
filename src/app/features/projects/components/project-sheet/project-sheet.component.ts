import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { twoDigits } from '@app/core/utils/format.utils';
import { SegmentedComponent, SegmentedItem } from '@shared/ui/segmented';
import { WindowComponent } from '@shared/ui/window';
import { ProjectsManager } from '../../states';
import { LINKS } from '@app/features/common';
import { PROJECTS_TEXTS } from '../../i18n';
import { positionOf } from '../project-labels';
import { LandingHeadingDirective } from '@shared/ui/landing-focus';
import {
  ChapterOnShow,
  ProjectChapterComponent,
} from '../project-chapter/project-chapter.component';

/**
 * A project's sheet: its approaches, one at a time, chosen in the toolbar;
 * the footer says where the reader is and moves the reading on. One thing
 * steers at a time: scrolling drives nothing.
 *
 * The first approach also shows the identity list, read from the facts and
 * never from the sheet, so the sheet speaks the index's vocabulary.
 */
@Component({
  selector: 'app-project-sheet',
  imports: [
    LandingHeadingDirective,
    ProjectChapterComponent,
    RouterLink,
    SegmentedComponent,
    WindowComponent,
  ],
  templateUrl: './project-sheet.component.html',
  styleUrl: './project-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSheetComponent {
  private readonly manager = inject(ProjectsManager);
  protected readonly texts = inject(PROJECTS_TEXTS);
  protected readonly links = inject(LINKS);

  public readonly slug = input.required<string>();
  public readonly pinned = input(false);
  /**
   * The approach on show. The station holds it: the camera frames each one,
   * and every navigation starts again from the first.
   */
  public readonly chapter = input(0);

  public readonly pinToggled = output();
  public readonly closed = output();
  public readonly chapterChange = output<number>();

  private readonly window = viewChild(WindowComponent);

  /** Reading memory is per sheet: coming back to one finds its place. */
  protected readonly scrollKey = computed(() => `sheet:${this.slug()}`);

  protected readonly sheet = computed(() => this.manager.sheetOf(this.slug()));
  protected readonly facts = computed(() => this.manager.factsOf(this.slug()));
  protected readonly project = computed(() => this.manager.find(this.slug()));

  protected readonly meta = computed(() => {
    const project = this.project();
    return project
      ? positionOf(project.rank + 1, this.manager.ranked().length)
      : '';
  });

  protected readonly identity = computed(() =>
    this.chapter() === 0 ? this.facts() : null,
  );

  protected readonly current = computed<ChapterOnShow | null>(() => {
    const index = this.chapter();
    const chapter = this.sheet()?.chapters[index];
    return chapter
      ? {
          ...chapter,
          number: twoDigits(index + 1),
          heading: this.manager.chapterTitle(this.slug(), index),
        }
      : null;
  });

  protected readonly approaches = computed<readonly SegmentedItem<number>[]>(
    () =>
      (this.sheet()?.chapters ?? []).map((_, index) => {
        const number = twoDigits(index + 1);
        return {
          value: index,
          label: number,
          active: index === this.chapter(),
          aria: this.texts().sheet.approach(
            number,
            this.manager.chapterTitle(this.slug(), index),
          ),
        };
      }),
  );

  private readonly last = computed(
    () => (this.sheet()?.chapters.length ?? 1) - 1,
  );

  /** "Suite : <next approach> →" while there is one. */
  protected readonly nextApproach = computed(() => {
    const index = this.chapter();
    return index < this.last()
      ? this.texts().sheet.nextApproach(
          this.manager.chapterTitle(this.slug(), index + 1),
        )
      : null;
  });

  /**
   * At the last approach, the next project in the rank, wrapping round: the
   * reading never ends in a dead end.
   */
  protected readonly nextProject = computed(() => {
    if (this.chapter() < this.last()) {
      return null;
    }
    const next = this.manager.nextOf(this.slug());
    return next
      ? { slug: next.slug, label: this.texts().sheet.nextProject(next.short) }
      : null;
  });

  constructor() {
    // A new approach starts at its top. The first run is skipped: arriving
    // on a sheet restores its reading position instead.
    let isFirst = true;
    effect(() => {
      this.chapter();
      if (isFirst) {
        isFirst = false;
        return;
      }
      untracked(() => this.window()?.scrollBodyTo(0));
    });
  }

  protected advance(): void {
    this.chapterChange.emit(Math.min(this.chapter() + 1, this.last()));
  }
}
