import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { SpaceSceneComponent } from '@shared/space-scene/components';
import { SCENE_SURROUNDINGS } from '@shared/space-scene/ports';
import { DesktopView, Planet } from '../../models';
import { DESKTOP_TEXTS } from '../../ports';
import {
  sceneBodiesOf,
  sceneDirectionOf,
} from '../../rules/scene-direction.rules';
import { SceneSurroundingsService } from '../../services/scene-surroundings.service';
import { PlanetButtonsComponent } from '../planet-buttons/planet-buttons.component';

@Component({
  selector: 'app-desktop-scene',
  imports: [SpaceSceneComponent, PlanetButtonsComponent],
  providers: [
    { provide: SCENE_SURROUNDINGS, useClass: SceneSurroundingsService },
  ],
  templateUrl: './desktop-scene.component.html',
  styleUrl: './desktop-scene.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopSceneComponent {
  protected readonly texts = inject(DESKTOP_TEXTS);

  public readonly bodies = input<readonly Planet[]>([]);
  public readonly featured = input(4);
  public readonly view = input<DesktopView>('home');
  public readonly sheet = input<string | null>(null);
  public readonly chapter = input(0);
  public readonly part = input(0);
  public readonly preview = input<string | null>(null);
  public readonly hovered = input<string | null>(null);
  public readonly selected = input<string | null>(null);
  public readonly paused = input(false);
  public readonly revealed = input(false);

  public readonly bodyClicked = output<string>();
  public readonly bodyHovered = output<string | null>();

  private readonly scene = viewChild.required(SpaceSceneComponent);

  public readonly animated = computed(() => this.scene().animated());

  protected readonly targets = computed(() => {
    const view = this.view();
    return view === 'home' || view === 'index';
  });

  protected readonly sceneBodies = computed(() =>
    sceneBodiesOf(this.bodies(), this.view(), this.featured()),
  );

  protected readonly direction = computed(() =>
    sceneDirectionOf({
      view: this.view(),
      sheet: this.sheet(),
      chapter: this.chapter(),
      part: this.part(),
      preview: this.preview(),
      hovered: this.hovered(),
      selected: this.selected(),
      revealed: this.revealed(),
    }),
  );
}
