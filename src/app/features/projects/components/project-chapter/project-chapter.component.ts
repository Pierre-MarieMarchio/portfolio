import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DetailChapter } from '../../models';

export interface ChapterOnShow extends DetailChapter {
  readonly number: string;
  readonly heading: string;
}

@Component({
  selector: 'app-project-chapter',
  templateUrl: './project-chapter.component.html',
  styleUrl: './project-chapter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectChapterComponent {
  public readonly chapter = input.required<ChapterOnShow>();
}
