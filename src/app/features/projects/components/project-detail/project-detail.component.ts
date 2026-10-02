import {
  afterRenderEffect,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { twoDigits } from '@app/core/helpers';
import { DisplayFormatService } from '@app/core/services';
import {
  PagerComponent,
  PagerPageComponent,
} from '@shared/mobile-nav/components';
import { SegmentedComponent } from '@shared/ui/components';
import { SegmentedItem } from '@shared/ui/models';
import { WindowComponent } from '@shared/windows/components';
import { ProjectsManager } from '../../states';
import { LINKS } from '@app/features/common';
import { PROJECTS_TEXTS } from '../../ports';
import { chapterTitle } from '../../rules/project-labels.rules';
import { ViewHeadingDirective } from '@shared/ui/directives';
import {
  ChapterOnShow,
  ProjectChapterComponent,
} from '../project-chapter/project-chapter.component';

@Component({
  selector: 'app-project-detail',
  imports: [
    ViewHeadingDirective,
    PagerComponent,
    PagerPageComponent,
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
  private readonly display = inject(DisplayFormatService);
  protected readonly isPhone = computed(
    () => this.display.format() === 'phone',
  );

  public readonly slug = input.required<string>();
  public readonly pinned = input(false);
  public readonly current = input(true);
  public readonly closeLabel = input('');
  public readonly chapter = input(0);

  public readonly pinToggled = output();
  public readonly closed = output();
  public readonly chapterChange = output<number>();

  protected readonly scrollKey = computed(() => `sheet:${this.slug()}`);

  private readonly sheet = viewChild<ElementRef<HTMLElement>>('sheet');

  protected readonly detail = computed(() =>
    this.manager.detailOf(this.slug()),
  );
  protected readonly project = computed(() => this.manager.find(this.slug()));

  protected readonly pages = computed<readonly ChapterOnShow[]>(() =>
    (this.detail()?.chapters ?? []).map((chapter, index) => ({
      ...chapter,
      number: twoDigits(index + 1),
      heading: this.titleOf(index),
    })),
  );

  protected readonly shownChapter = computed(
    () => this.pages()[this.chapter()] ?? null,
  );

  protected readonly visibleChapter = linkedSignal(() => this.chapter());

  protected readonly chapters = computed<readonly SegmentedItem<number>[]>(() =>
    this.pages().map((page, index) => ({
      value: index,
      label: page.heading,
      active: index === this.visibleChapter(),
      aria: this.texts().sheet.approach(page.number, page.heading),
    })),
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

  private readonly scrolled = new Set<HTMLElement>();

  constructor() {
    effect((onCleanup) => {
      const sheet = this.sheet()?.nativeElement;
      if (!sheet) {
        return;
      }
      sheet.addEventListener('scroll', this.noteScroll, {
        capture: true,
        passive: true,
      });
      onCleanup(() => {
        sheet.removeEventListener('scroll', this.noteScroll, { capture: true });
      });
    });
    let shown: string | null = null;
    afterRenderEffect({
      write: () => {
        const slug = this.slug();
        if (shown !== null && shown !== slug) {
          this.backToTop();
        }
        shown = slug;
      },
    });
  }

  private readonly noteScroll = (event: Event): void => {
    if (event.target instanceof HTMLElement) {
      this.scrolled.add(event.target);
    }
  };

  private backToTop(): void {
    for (const page of this.scrolled) {
      page.scrollTop = 0;
    }
    this.scrolled.clear();
  }

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
