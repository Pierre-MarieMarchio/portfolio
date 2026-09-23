import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MediaPreferencesService } from '@app/core/services';
import { twoDigits } from '@app/core/helpers';
import { SceneTargetDirective } from '@shared/space-scene/directives';
import { DESKTOP_TEXTS } from '../../ports';
import { DesktopView, Planet } from '../../models';

@Component({
  selector: 'app-planet-buttons',
  imports: [SceneTargetDirective],
  templateUrl: './planet-buttons.component.html',
  styleUrl: './planet-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanetButtonsComponent {
  private readonly media = inject(MediaPreferencesService);
  private readonly texts = inject(DESKTOP_TEXTS);

  public readonly bodies = input<readonly Planet[]>([]);
  public readonly view = input<DesktopView>('home');
  public readonly preview = input<string | null>(null);
  public readonly hovered = input<string | null>(null);

  public readonly bodyClicked = output<string>();
  public readonly bodyHovered = output<string | null>();

  protected readonly entries = computed(() => {
    const isIndex = this.view() === 'index';
    const preview = this.preview();
    return this.bodies().map((body, rank) => ({
      slug: body.slug,
      name: isIndex
        ? this.texts().object.select(twoDigits(rank + 1), body.title)
        : this.texts().object.preview(body.title),
      expanded: isIndex ? null : preview === body.slug,
    }));
  });

  protected onClick(slug: string): void {
    if (this.needsRevealFirst(slug)) {
      this.bodyHovered.emit(slug);
      return;
    }
    this.bodyClicked.emit(slug);
  }

  protected onEnter(slug: string): void {
    this.bodyHovered.emit(slug);
  }

  protected onLeave(): void {
    this.bodyHovered.emit(null);
  }

  private needsRevealFirst(slug: string): boolean {
    return (
      this.view() !== 'index' &&
      this.media.cannotHover() &&
      this.hovered() !== slug &&
      this.preview() !== slug
    );
  }
}
