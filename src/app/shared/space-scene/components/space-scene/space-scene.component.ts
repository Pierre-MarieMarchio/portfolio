import {
  afterEveryRender,
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { BrowserEnvironmentService } from '@app/core/services';
import { TurnGestureDirective } from '../../directives/turn-gesture.directive';
import { SpaceSceneEngine } from '../../engine/space-scene.engine';
import {
  RESTING_DIRECTION,
  SceneBody,
  SceneDirection,
  SceneInputs,
} from '../../models/scene.model';
import { SCENE_SURROUNDINGS } from '../../ports/scene-surroundings.port';
import { canvasResolution } from '../../rules/canvas-resolution.rules';
import { PanelAnchor, sceneLayout } from '../../rules/scene-layout.rules';
import { SceneTargetsService } from '../../services/scene-targets.service';

const DENSITY = 3800;

@Component({
  selector: 'app-space-scene',
  imports: [TurnGestureDirective],
  providers: [SceneTargetsService],
  templateUrl: './space-scene.component.html',
  styleUrl: './space-scene.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceSceneComponent {
  private readonly browser = inject(BrowserEnvironmentService);
  private readonly surroundings = inject(SCENE_SURROUNDINGS);
  private readonly targets = inject(SceneTargetsService);

  public readonly bodies = input<readonly SceneBody[]>([]);
  public readonly direction = input<SceneDirection>(RESTING_DIRECTION);
  public readonly figureNames = input<readonly string[]>([]);
  public readonly paused = input(false);

  protected readonly failed = signal(false);
  protected readonly running = signal(false);
  private readonly reduced = signal(true);

  public readonly animated = computed(() => this.running() && !this.reduced());

  protected readonly labelled = computed(
    () => this.direction().labels !== 'none',
  );

  private readonly sky =
    viewChild.required<ElementRef<HTMLCanvasElement>>('sky');
  private readonly matter =
    viewChild.required<ElementRef<HTMLCanvasElement>>('matter');
  private readonly labelNodes = viewChildren<ElementRef<HTMLElement>>('label');

  protected readonly engine = signal<SpaceSceneEngine | null>(null);
  private readonly stops: (() => void)[] = [];
  private targetsGiven: readonly HTMLElement[] = [];
  private labelsGiven: readonly HTMLElement[] = [];

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const snapshot = this.snapshot();
      untracked(() => {
        this.engine()?.setInputs(snapshot);
      });
    });

    afterEveryRender({
      read: () => {
        this.giveNodes();
        this.measure();
      },
    });

    afterNextRender(() => {
      this.boot();
    });

    destroyRef.onDestroy(() => {
      for (const stop of this.stops) {
        stop();
      }
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
    };
  }

  private giveNodes(): void {
    const engine = this.engine();
    if (!engine) {
      return;
    }
    const targets = this.targets.list();
    const labels = this.labelNodes().map((ref) => ref.nativeElement);
    if (
      isSameList(targets, this.targetsGiven) &&
      isSameList(labels, this.labelsGiven)
    ) {
      return;
    }
    this.targetsGiven = targets;
    this.labelsGiven = labels;
    engine.setNodes(targets, labels);
  }

  private boot(): void {
    const matter = this.matter().nativeElement;
    const ctx = this.browser.context2d(matter);
    if (!ctx) {
      this.failed.set(true);
      return;
    }
    const skyCtx = this.browser.context2d(this.sky().nativeElement);
    this.reduced.set(this.browser.prefersReducedMotion());
    const engine = this.createEngine(ctx, skyCtx);
    this.engine.set(engine);
    engine.setInputs(untracked(() => this.snapshot()));
    this.giveNodes();
    this.resize();
    this.measure();
    this.watch(engine, matter);
    this.browser.whenFontsReady(() => this.measure());
    this.running.set(true);
  }

  private createEngine(
    ctx: CanvasRenderingContext2D,
    skyCtx: CanvasRenderingContext2D | null,
  ): SpaceSceneEngine {
    const viewport = this.browser.viewport() ?? { width: 1280, height: 800 };
    return new SpaceSceneEngine(
      {
        frame: (callback) => this.browser.nextFrame(callback),
        now: () => this.browser.now(),
        hidden: () => this.browser.isHidden(),
      },
      { matter: ctx, sky: skyCtx },
      {
        rnd: Math.random,
        density: DENSITY,
        figures: 'constellations',
        ink: this.browser.rootStyle('--ink') || '#2b2f3a',
        accent: this.browser.rootStyle('--accent') || '#3b62c4',
      },
      viewport.width * viewport.height,
    );
  }

  private watch(engine: SpaceSceneEngine, matter: HTMLCanvasElement): void {
    this.stops.push(
      this.browser.observeResize(matter, () => {
        this.resize();
        this.measure();
      }),
      this.browser.observeIntersection(matter, 0.01, (visible) => {
        engine.setVisible(visible);
      }),
      this.browser.watchVisibility((hidden) => {
        if (hidden) {
          engine.stop();
        } else {
          engine.request();
        }
      }),
      this.browser.watchMedia('(prefers-reduced-motion: reduce)', (reduce) => {
        this.reduced.set(reduce);
      }),
      this.browser.listen('resize', () => this.measure(), { passive: true }),
      this.browser.listen('pointerup', () => this.measure(), { passive: true }),
      this.browser.listen('animationend', () => this.measure(), {
        capture: true,
      }),
      this.browser.listen('transitionend', () => this.measure(), {
        capture: true,
      }),
      this.browser.listen(
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
    const matter = this.matter().nativeElement;
    const sky = this.sky().nativeElement;
    const { width, height, pixelRatio } = canvasResolution(
      matter.getBoundingClientRect(),
      this.browser.devicePixelRatio(),
    );
    for (const canvas of [matter, sky]) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }
    engine.resize(width, height, pixelRatio);
  }

  private measure(): void {
    const engine = this.engine();
    if (!engine) {
      return;
    }
    const canvas = this.matter().nativeElement.getBoundingClientRect();
    const anchors: PanelAnchor[] = [];
    for (const { element, role } of this.surroundings.panels()) {
      if (this.browser.computedStyle(element, 'visibility') === 'hidden') {
        continue;
      }
      anchors.push({
        rect: element.getBoundingClientRect(),
        opacity: this.browser.computedStyle(element, 'opacity'),
        role,
      });
    }
    engine.setLines(this.surroundings.lines());
    engine.measureLabels();
    const viewport = this.browser.viewport() ?? { width: 1200, height: 800 };
    engine.setLayout(sceneLayout(canvas, viewport, anchors));
  }
}

function isSameList(
  next: readonly HTMLElement[],
  given: readonly HTMLElement[],
): boolean {
  return (
    next.length === given.length &&
    next.every((element, i) => element === given[i])
  );
}
