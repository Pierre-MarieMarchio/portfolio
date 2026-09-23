import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { BrowserEnvironment } from '@app/core/services';
import { twoDigits } from '@app/core/utils/format.utils';
import { STATION_TEXTS } from '../../i18n';
import { ObjectBody, ObjectView } from '../object/object.model';

@Component({
  selector: 'app-planet-buttons',
  templateUrl: './planet-buttons.component.html',
  styleUrl: './planet-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanetButtonsComponent {
  private readonly browser = inject(BrowserEnvironment);
  private readonly texts = inject(STATION_TEXTS);

  public readonly bodies = input<readonly ObjectBody[]>([]);
  public readonly view = input<ObjectView>('home');
  public readonly preview = input(-1);
  public readonly hovered = input(-1);

  public readonly bodyClicked = output<number>();
  public readonly bodyHovered = output<number>();

  public readonly buttons = viewChildren<ElementRef<HTMLElement>>('button');

  protected readonly entries = computed(() => {
    const isIndex = this.view() === 'index';
    const preview = this.preview();
    return this.bodies().map((body, rank) => ({
      name: isIndex
        ? this.texts().object.select(twoDigits(rank + 1), body.title)
        : this.texts().object.preview(body.title),
      expanded: isIndex ? null : preview === rank,
    }));
  });

  protected onClick(rank: number): void {
    if (this.needsRevealFirst(rank)) {
      this.bodyHovered.emit(rank);
      return;
    }
    this.bodyClicked.emit(rank);
  }

  protected onEnter(rank: number): void {
    this.bodyHovered.emit(rank);
  }

  protected onLeave(): void {
    this.bodyHovered.emit(-1);
  }

  private needsRevealFirst(rank: number): boolean {
    return (
      this.view() !== 'index' &&
      this.browser.cannotHover() &&
      this.hovered() !== rank &&
      this.preview() !== rank
    );
  }
}
