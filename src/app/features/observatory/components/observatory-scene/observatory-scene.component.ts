import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { BrowserWindowService, DisplayFormatService } from '@app/core/services';
import { SpaceSceneComponent } from '@shared/space-scene/components';
import { SCENE_SURROUNDINGS } from '@shared/space-scene/ports';
import { ObservatoryView, Planet } from '../../models';
import { OBSERVATORY_TEXTS } from '../../ports';
import {
  sceneBodiesOf,
  sceneDirectionOf,
} from '../../rules/scene-direction.rules';
import { SceneSurroundingsService } from '../../services/scene-surroundings.service';
import { PlanetButtonsComponent } from '../planet-buttons/planet-buttons.component';

@Component({
  selector: 'app-observatory-scene',
  imports: [SpaceSceneComponent, PlanetButtonsComponent],
  providers: [
    { provide: SCENE_SURROUNDINGS, useClass: SceneSurroundingsService },
  ],
  templateUrl: './observatory-scene.component.html',
  styleUrl: './observatory-scene.component.scss',
})
export class ObservatorySceneComponent {
  protected readonly texts = inject(OBSERVATORY_TEXTS);
  private readonly browserWindow = inject(BrowserWindowService);
  private readonly format = inject(DisplayFormatService).format;
  private readonly viewport = signal(this.browserWindow.size());

  public readonly bodies = input<readonly Planet[]>([]);
  public readonly featured = input(4);
  public readonly view = input<ObservatoryView>('home');
  public readonly sheet = input<string | null>(null);
  public readonly chapter = input(0);
  public readonly part = input(0);
  public readonly preview = input<string | null>(null);
  public readonly hovered = input<string | null>(null);
  public readonly designated = input<string | null>(null);
  public readonly selected = input<string | null>(null);
  public readonly paused = input(false);
  public readonly revealed = input(false);

  public readonly bodyClicked = output<string>();
  public readonly bodyHovered = output<string | null>();

  private readonly scene = viewChild.required(SpaceSceneComponent);

  private readonly upright = computed(() => {
    const viewport = this.viewport();
    return (
      this.format() === 'phone' &&
      viewport !== null &&
      viewport.height >= viewport.width
    );
  });

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
      upright: this.upright(),
      designated: this.designated(),
    }),
  );

  constructor() {
    inject(DestroyRef).onDestroy(
      this.browserWindow.on('resize', () => {
        this.viewport.set(this.browserWindow.size());
      }),
    );
  }
}
