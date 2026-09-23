import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { BrowserEnvironment } from '@app/core/services';
import { RouterLink } from '@angular/router';
import { RankedProject } from '../../models';
import { rowLabel } from '../project-labels';
import { Arrival } from '@shared/ui/arrival';
import { ObjectLineDirective } from '@shared/ui/object-marks';

/** Where the belt of markers starts, in % of the track. */
const BELT_START = 2;
/**
 * The gap between two markers, in % of the track: the export's four
 * markers over 56%. More markers keep it and widen the belt, up to
 * `BELT_MAX_SPAN`; fewer keep the export's belt.
 */
const BELT_STEP = 56 / 3;
const BELT_MIN_SPAN = 56;
const BELT_MAX_SPAN = 94;
/**
 * The room a marker's name takes, in px: ~130px of mono. Below it, two
 * neighbours' names overlapped and a click fell on the wrong project, so the
 * names give way and the numbers stay, as on a narrow screen.
 */
const LABEL_PX = 130;

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
  host: {
    '[attr.data-arrival]': 'arrival()',
    '[attr.data-crowded]': 'crowded()',
  },
})
export class OrbitRuleComponent {
  /** The featured projects, in rank order. */
  public readonly bodies = input.required<readonly RankedProject[]>();
  /** The id of the panel a marker opens, for `aria-controls`. */
  public readonly controls = input.required<string>();
  public readonly hovered = input<string | null>(null);
  /** The body the preview last showed: read when nothing is hovered. */
  public readonly reading = input<string | null>(null);
  /** Arrives with the home page's rest, at the end of the crossing. */
  public readonly arrival = input<Arrival>('timed');

  public readonly chosen = output<string>();
  public readonly hoveredChange = output<string | null>();

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  /**
   * Measured in a browser; `null` in the prerender, where nothing is, and a
   * width of 0 is a track not laid out yet, not a narrow one.
   */
  private readonly trackWidth = signal<number | null>(null);

  /** How much of the track the belt takes, for as many markers as there are. */
  private readonly span = computed(() => {
    const gaps = Math.max(1, this.bodies().length - 1);
    return Math.min(BELT_MAX_SPAN, Math.max(BELT_MIN_SPAN, gaps * BELT_STEP));
  });

  /** Too many markers for the width: the names give way to the numbers. */
  protected readonly crowded = computed(() => {
    const width = this.trackWidth();
    const gaps = this.bodies().length - 1;
    return (
      width !== null &&
      width > 0 &&
      gaps > 0 &&
      (width * this.span()) / 100 / gaps < LABEL_PX
    );
  });

  protected readonly markers = computed(() => {
    const bodies = this.bodies();
    const last = Math.max(1, bodies.length - 1);
    const span = this.span();
    return bodies.map((body, index) => ({
      ...body,
      left: `${(BELT_START + (index / last) * span).toFixed(1)}%`,
      label: rowLabel(body),
      lit: body.slug === this.hovered(),
    }));
  });

  constructor() {
    const browser = inject(BrowserEnvironment);
    let stop: () => void = () => undefined;
    afterNextRender(() => {
      const track = this.track().nativeElement;
      const measure = (): void => {
        this.trackWidth.set(track.getBoundingClientRect().width);
      };
      measure();
      stop = browser.observeResize(track, measure);
    });
    inject(DestroyRef).onDestroy(() => {
      stop();
    });
  }

  /** The line under the rule: the hovered body, else the last one read. */
  protected readonly line = computed(() => {
    const markers = this.markers();
    const slug = this.hovered() ?? this.reading();
    return markers.find((marker) => marker.slug === slug) ?? markers[0] ?? null;
  });
}
