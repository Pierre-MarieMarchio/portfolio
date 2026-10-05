import {
  afterEveryRender,
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DisplayFormatService, FormatCodeService } from '@app/core/services';
import { AnimatedCanvasService } from '../../services/animated-canvas.service';
import { TurnGestureDirective } from '../../directives/turn-gesture.directive';
import type { SceneEngine } from '../../models/scene-engine.model';
import {
  SceneCanvases,
  SceneEngineService,
} from '../../services/scene-engine.service';
import type { SkyPan } from '../../engine/motions/zoom.motion';
import { SceneLookService } from '../../services/scene-look.service';
import {
  RESTING_DIRECTION,
  SceneBody,
  SceneDirection,
  SceneInputs,
} from '../../models/scene.model';
import { SCENE_SURROUNDINGS } from '../../ports/scene-surroundings.port';
import { SCENE_WINDOW_DRAG } from '../../ports/scene-window-drag.port';
import { canvasResolution } from '../../rules/canvas-resolution.rules';
import { PanelAnchor, sceneLayout } from '../../rules/scene-layout.rules';
import { isSameList } from '../../rules/planets/same-nodes.rules';
import { canMoveLayout } from '../../rules/layout-change.rules';
import { settledRect } from '../../rules/rooms/settled-rect.rules';
import { isDraggedClick } from '../../rules/figures/figure-target.rules';
import { SceneTargetsService } from '../../services/scene-targets.service';
import {
  FALLBACK_VIEWPORT,
  REFERENCE_VIEWPORT,
} from '../../models/scene-constants.model';

export const loadHoleFocus = () => import('../../rules/hole-focus.rules');

@Component({
  selector: 'app-space-scene',
  imports: [TurnGestureDirective],
  providers: [SceneTargetsService, SceneLookService, SceneEngineService],
  templateUrl: './space-scene.component.html',
  styleUrl: './space-scene.component.scss',
})
export class SpaceSceneComponent {
  private readonly canvas = inject(AnimatedCanvasService);
  private readonly surroundings = inject(SCENE_SURROUNDINGS);
  private readonly windowDrag = inject(SCENE_WINDOW_DRAG, { optional: true });
  private readonly targets = inject(SceneTargetsService);
  private readonly display = inject(DisplayFormatService);
  private readonly holeFocus = inject(FormatCodeService).load(
    ['phone'],
    loadHoleFocus,
  );
  private readonly look = inject(SceneLookService);
  private readonly engines = inject(SceneEngineService);

  public readonly bodies = input<readonly SceneBody[]>([]);
  public readonly direction = input<SceneDirection>(RESTING_DIRECTION);
  public readonly figureNames = input<readonly string[]>([]);
  public readonly paused = input(false);

  public readonly figureChosen = output<number>();

  protected readonly failed = signal(false);
  protected readonly running = signal(false);
  private readonly reduced = signal(true);
  private readonly pan = signal<SkyPan | null>(null);

  public readonly animated = computed(() => this.running() && !this.reduced());

  protected readonly labelled = computed(
    () => this.direction().labels !== 'none',
  );

  private readonly sky =
    viewChild.required<ElementRef<HTMLCanvasElement>>('sky');
  private readonly matter =
    viewChild.required<ElementRef<HTMLCanvasElement>>('matter');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly labelNodes = viewChildren<ElementRef<HTMLElement>>('label');
  private readonly figureNodes =
    viewChildren<ElementRef<HTMLElement>>('figure');

  protected readonly engine = signal<SceneEngine | null>(null);
  private readonly stops: (() => void)[] = [];
  private targetsGiven: readonly HTMLElement[] = [];
  private labelsGiven: readonly HTMLElement[] = [];
  private figuresGiven: readonly HTMLElement[] = [];
  private figurePress: { readonly x: number; readonly y: number } | null = null;
  private cancelMeasure: (() => void) | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const snapshot = this.snapshot();
      untracked(() => {
        this.engine()?.setInputs(snapshot);
      });
    });

    effect((onCleanup) => {
      const engine = this.engine();
      const look = engine ? this.look.start(engine) : null;
      if (!look) {
        return;
      }
      this.pan.set(look.pan);
      onCleanup(() => {
        look.stop();
        this.pan.set(null);
      });
    });

    afterEveryRender({
      read: () => {
        this.giveNodes();
        this.measure();
      },
    });

    afterNextRender(() => {
      void this.boot();
    });

    destroyRef.onDestroy(() => {
      for (const stop of this.stops) {
        stop();
      }
      this.cancelMeasure?.();
      this.engine()?.stop();
      this.engine.set(null);
    });
  }

  private snapshot(): SceneInputs {
    return {
      bodies: this.bodies(),
      direction: this.direction(),
      figureNames: this.figureNames(),
      paused: this.paused(),
      reduced: this.reduced(),
      format: this.display.format(),
      holeFocus: this.holeFocus(),
      pan: this.pan(),
    };
  }

  protected onFigurePress(event: PointerEvent): void {
    this.figurePress = { x: event.clientX, y: event.clientY };
  }

  protected onFigureClick(figure: number, event: MouseEvent): void {
    const press = this.figurePress;
    this.figurePress = null;
    if (!isDraggedClick(press, event)) {
      this.figureChosen.emit(figure);
    }
  }

  private giveNodes(): void {
    const engine = this.engine();
    if (!engine) {
      return;
    }
    const targets = this.targets.list();
    const labels = this.labelNodes().map((ref) => ref.nativeElement);
    const figures = this.figureNodes().map((ref) => ref.nativeElement);
    if (
      isSameList(targets, this.targetsGiven) &&
      isSameList(labels, this.labelsGiven) &&
      isSameList(figures, this.figuresGiven)
    ) {
      return;
    }
    this.targetsGiven = targets;
    this.labelsGiven = labels;
    this.figuresGiven = figures;
    engine.setNodes(targets, labels, figures);
  }

  private async boot(): Promise<void> {
    const matter = this.matter().nativeElement;
    const engine = await this.engines.create(
      this.canvases(),
      this.viewportArea(),
    );
    if (!engine) {
      this.failed.set(true);
      return;
    }
    this.reduced.set(this.canvas.reducedMotion());
    this.engine.set(engine);
    engine.setInputs(untracked(() => this.snapshot()));
    this.giveNodes();
    engine.setHoleMark(this.stage().nativeElement);
    this.resize();
    this.measure();
    this.watch(engine, matter);
    this.canvas.fontsReady(() => this.measure());
    this.running.set(true);
  }

  private canvases(): SceneCanvases {
    return {
      matter: this.matter().nativeElement,
      sky: this.sky().nativeElement,
    };
  }

  private viewportArea(): number {
    const viewport = this.canvas.windowSize() ?? REFERENCE_VIEWPORT;
    return viewport.width * viewport.height;
  }

  private watch(engine: SceneEngine, matter: HTMLCanvasElement): void {
    this.stops.push(
      this.canvas.onResize(matter, () => {
        this.resize();
        this.measure();
      }),
      this.canvas.onVisible(matter, 0.01, (visible) =>
        engine.setVisible(visible),
      ),
      this.canvas.watchHidden((hidden) =>
        hidden ? engine.stop() : engine.request(),
      ),
      this.canvas.watchMedia('(prefers-reduced-motion: reduce)', (reduce) => {
        this.reduced.set(reduce);
      }),
      ...(
        ['resize', 'pointerup', 'animationend', 'transitionend'] as const
      ).map((type) =>
        this.canvas.onWindow(type, (event) => this.measureSoon(event), {
          capture: true,
          passive: true,
        }),
      ),
      ...(this.windowDrag
        ? [this.windowDrag.onDragging(() => this.measureSoon())]
        : []),
      this.canvas.onWindow(
        'pointermove',
        (event) => {
          if (event.pointerType !== 'touch') {
            engine.setPointer(event.clientX, event.clientY);
          }
        },
        { passive: true },
      ),
    );
  }

  private resize(): void {
    const engine = this.engine();
    if (!engine) {
      return;
    }
    const canvases = this.canvases();
    const { width, height, pixelRatio } = canvasResolution(
      canvases.matter.getBoundingClientRect(),
      this.canvas.pixelRatio(),
      this.display.format(),
    );
    this.engines.fit(canvases, width, height);
    engine.resize(width, height, pixelRatio);
    engine.setViewportArea(this.viewportArea());
  }

  private measureSoon(event?: Event): void {
    if (event && !canMoveLayout(event)) {
      return;
    }
    this.cancelMeasure ??= this.canvas.nextFrame(() => {
      this.cancelMeasure = null;
      this.measure();
    });
  }

  private measure(): void {
    const engine = this.engine();
    if (!engine) {
      return;
    }
    const canvas = this.matter().nativeElement.getBoundingClientRect();
    const anchors: PanelAnchor[] = [];
    for (const { element, role } of this.surroundings.panels()) {
      if (this.canvas.token('visibility', element) === 'hidden') {
        continue;
      }
      anchors.push({
        rect: settledRect(element),
        opacity: this.canvas.token('opacity', element),
        role,
      });
    }
    engine.setLines(this.surroundings.lines());
    engine.measureLabels();
    const viewport = this.canvas.windowSize() ?? FALLBACK_VIEWPORT;
    engine.setLayout(sceneLayout(canvas, viewport, anchors));
  }
}
