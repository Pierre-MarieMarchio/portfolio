import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LINKS, SceneAnchorKind } from '@app/features/common';
import { PROJECTS_TEXTS } from '../../ports';
import { RankedProject } from '../../models';
import { rowLabel } from '../../rules/project-labels.rules';
import { Entrance } from '@shared/ui/models';
import {
  HoverFocusDirective,
  LayoutAnchorDirective,
} from '@shared/ui/directives';
import { elementSize } from '@shared/ui/signals';

const BELT_START_PERCENT = 2;
const BELT_MIN_SPAN = 56;
const BELT_MAX_SPAN = 94;
const EXPORT_MARKER_GAPS = 3;
const BELT_STEP = BELT_MIN_SPAN / EXPORT_MARKER_GAPS;
const LABEL_WIDTH_PX = 130;

@Component({
  selector: 'app-featured-bar',
  imports: [HoverFocusDirective, LayoutAnchorDirective, RouterLink],
  templateUrl: './featured-bar.component.html',
  styleUrl: './featured-bar.component.scss',
  host: {
    '[attr.data-arrival]': 'arrival()',
    '[attr.data-crowded]': 'crowded()',
  },
})
export class FeaturedBarComponent {
  public readonly bodies = input.required<readonly RankedProject[]>();
  public readonly controls = input.required<string>();
  public readonly hovered = input<string | null>(null);
  public readonly reading = input<string | null>(null);
  public readonly arrival = input<Entrance>('timed');

  public readonly chosen = output<string>();
  public readonly hoveredChange = output<string | null>();

  protected readonly texts = inject(PROJECTS_TEXTS);
  protected readonly links = inject(LINKS);
  protected readonly lineAnchor: SceneAnchorKind = 'line';

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly trackSize = elementSize(() => this.track().nativeElement);

  private readonly span = computed(() => {
    const gaps = Math.max(1, this.bodies().length - 1);
    return Math.min(BELT_MAX_SPAN, Math.max(BELT_MIN_SPAN, gaps * BELT_STEP));
  });

  protected readonly crowded = computed(() => {
    const width = this.trackSize()?.width ?? null;
    const gaps = this.bodies().length - 1;
    return (
      width !== null &&
      width > 0 &&
      gaps > 0 &&
      (width * this.span()) / 100 / gaps < LABEL_WIDTH_PX
    );
  });

  protected readonly markers = computed(() => {
    const bodies = this.bodies();
    const last = Math.max(1, bodies.length - 1);
    const span = this.span();
    return bodies.map((body, index) => ({
      ...body,
      left: `${(BELT_START_PERCENT + (index / last) * span).toFixed(1)}%`,
      label: rowLabel(body),
      lit: body.slug === this.hovered(),
    }));
  });

  protected readonly line = computed(() => {
    const markers = this.markers();
    const slug = this.hovered() ?? this.reading();
    return markers.find((marker) => marker.slug === slug) ?? markers[0] ?? null;
  });
}
