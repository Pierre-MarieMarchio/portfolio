import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { twoDigits } from '@app/core/utils/format.utils';
import { ProjectWithFacts } from '@app/features/projects/models';
import { Arrival } from '@shared/ui/arrival';
import { ObjectLineDirective } from '@shared/ui/object-marks';

/**
 * The rule of the projects in orbit, along the bottom of the home page: one
 * marker per featured project, its title under it. The axis is a rank of
 * importance, so the markers are evenly spaced and every title sits on the
 * same line. Hovering a marker lights its planet, and the reverse: both read
 * the same `hovered`.
 */
@Component({
  selector: 'app-orbit-rule',
  imports: [ObjectLineDirective, RouterLink],
  templateUrl: './orbit-rule.component.html',
  styleUrl: './orbit-rule.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-arrival]': 'arrival()' },
})
export class OrbitRuleComponent {
  /** The featured projects, in rank order. */
  public readonly bodies = input.required<readonly ProjectWithFacts[]>();
  /** The id of the panel a marker opens, for `aria-controls`. */
  public readonly controls = input.required<string>();
  public readonly hovered = input<string | null>(null);
  /** The body the preview last showed: read when nothing is hovered. */
  public readonly reading = input<string | null>(null);
  /** Arrives with the home page's rest, at the end of the crossing. */
  public readonly arrival = input<Arrival>('timed');

  public readonly chosen = output<string>();
  public readonly hoveredChange = output<string | null>();

  protected readonly markers = computed(() => {
    const bodies = this.bodies();
    const last = Math.max(1, bodies.length - 1);
    return bodies.map((body, index) => ({
      ...body,
      number: twoDigits(index + 1),
      // Spread on the real width of a label (~130px of mono): tighter, two
      // neighbours' boxes overlapped and a click fell on the wrong project.
      left: `${(2 + (index / last) * 56).toFixed(1)}%`,
      label: `${twoDigits(index + 1)} — ${body.title} · ${body.facts.proof}`,
      lit: body.slug === this.hovered(),
    }));
  });

  /** The line under the rule: the hovered body, else the last one read. */
  protected readonly line = computed(() => {
    const markers = this.markers();
    const slug = this.hovered() ?? this.reading();
    return markers.find((marker) => marker.slug === slug) ?? markers[0] ?? null;
  });
}
