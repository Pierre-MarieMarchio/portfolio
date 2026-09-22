import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

/**
 * The contact rail, fixed bottom right: e-mail, LinkedIn, GitHub, at 44px
 * each, and the object's pause when there is an object to pause.
 */
@Component({
  selector: 'app-contact-rail',
  templateUrl: './contact-rail.component.html',
  styleUrl: './contact-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactRailComponent {
  public readonly showPause = input(false);
  public readonly paused = input(false);

  public readonly pauseToggled = output();

  protected readonly pauseLabel = computed(() =>
    this.paused()
      ? 'Reprendre l’animation de l’objet'
      : 'Mettre l’animation de l’objet en pause',
  );
}
