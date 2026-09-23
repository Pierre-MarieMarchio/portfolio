import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Arrival } from '@shared/ui/page-bar';

/**
 * The contact rail, fixed bottom right: e-mail, LinkedIn, GitHub, at 44px
 * each, and the object's pause when there is an object to pause.
 *
 * The icons are Material Design Icons (Pictogrammers, Apache 2.0), inlined:
 * the community set drawn on Material's grid, which has the brand marks that
 * Google's Material Symbols leave out. The three from the one set, so they
 * share a weight: `email-outline`, `linkedin`, `github`.
 */
@Component({
  selector: 'app-contact-rail',
  templateUrl: './contact-rail.component.html',
  styleUrl: './contact-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-arrival]': 'arrival()' },
})
export class ContactRailComponent {
  public readonly showPause = input(false);
  public readonly paused = input(false);
  /** Arrives with the home page's rest, at the end of the crossing. */
  public readonly arrival = input<Arrival>('timed');

  public readonly pauseToggled = output();

  protected readonly pauseLabel = computed(() =>
    this.paused()
      ? 'Reprendre l’animation de l’objet'
      : 'Mettre l’animation de l’objet en pause',
  );
}
