import {
  mountEngineScene,
  SCENE_INPUTS,
} from '@testing/fixtures/engine-scene.fixture';
import { isOverlapping } from '@testing/fixtures/scene-layout.fixture';
import { sceneLayout } from '../../../rules/scene-layout.rules';
import { DrawnDisc, isBoxOverDisc } from '../../../rules/camera/pointer.rules';
import type { DisplayFormat } from '@app/core/models';

interface Box {
  readonly l: number;
  readonly t: number;
  readonly r: number;
  readonly b: number;
}

interface Phone {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly bar: Box;
  readonly glass: Box;
}

const PHONES: readonly Phone[] = [
  {
    name: '320×568',
    width: 320,
    height: 568,
    bar: { l: 0, t: 0, r: 320, b: 56 },
    glass: { l: 0, t: 341, r: 320, b: 568 },
  },
  {
    name: '390×844',
    width: 390,
    height: 844,
    bar: { l: 0, t: 0, r: 390, b: 56 },
    glass: { l: 0, t: 506, r: 390, b: 844 },
  },
  {
    name: '780×360',
    width: 780,
    height: 360,
    bar: { l: 0, t: 0, r: 390, b: 56 },
    glass: { l: 390, t: 0, r: 780, b: 360 },
  },
  {
    name: '568×320',
    width: 568,
    height: 320,
    bar: { l: 0, t: 0, r: 244, b: 56 },
    glass: { l: 244, t: 0, r: 568, b: 320 },
  },
];

const FIGURE_COUNT = 4;
const STAR_REACH = 3;
const NAME_SIZE = 11;
const NAME_SPACING = 0.14;
const MEASURED_CHARACTER = 7;
const SETTLE_MS = 12_000;

const rectOf = ({ l, t, r, b }: Box) => ({
  left: l,
  top: t,
  right: r,
  bottom: b,
  width: r - l,
  height: b - t,
});

const layoutOf = (phone: Phone) =>
  sceneLayout(
    { left: 0, top: 0 },
    { width: phone.width, height: phone.height },
    [
      { rect: rectOf(phone.bar), opacity: '1', role: 'top-bar' },
      { rect: rectOf(phone.glass), opacity: '1', role: '' },
    ],
  );

interface LoggedFigure {
  readonly stars: [number, number][];
  readonly alphas: number[];
  readonly radii: number[];
  name: (Box & { readonly text: string }) | null;
}

const numbersIn = (line: string, prefix: string): number[] | null =>
  line.startsWith(prefix)
    ? line.slice(prefix.length, line.indexOf(')')).split(',').map(Number)
    : null;

const nameAt = (line: string, isHung: boolean): LoggedFigure['name'] | null => {
  const text = /^sky\.fillText\(([^,]+),([\d.-]+),([\d.-]+)\)$/.exec(line);
  if (!text) {
    return null;
  }
  const label = text[1] ?? '';
  const x = Number(text[2]);
  const y = Number(text[3]);
  const width =
    label.length * MEASURED_CHARACTER + label.length * NAME_SPACING * NAME_SIZE;
  const top = isHung ? y : y - NAME_SIZE;
  return { text: label, l: x, r: x + width, t: top, b: top + NAME_SIZE };
};

const alphaIn = (line: string): number =>
  line.startsWith('sky.globalAlpha=')
    ? Number(line.slice('sky.globalAlpha='.length))
    : 1;

const logInto = (figure: LoggedFigure, line: string): void => {
  const halo = numbersIn(line, 'sky.radial(');
  if (halo && line.includes(').stop(0.000,')) {
    figure.stars.push([halo[0] ?? 0, halo[1] ?? 0]);
  }
  const alpha = alphaIn(line);
  if (alpha < 1) {
    figure.alphas.push(alpha);
  }
  const star = numbersIn(line, 'sky.arc(');
  if (star) {
    figure.radii.push(star[2] ?? 0);
  }
};

const lastFiguresOf = (log: readonly string[]): LoggedFigure[] => {
  const figures: LoggedFigure[] = [];
  let isHung = false;
  for (const line of log.slice(log.lastIndexOf('sky.lineCap=round') + 1)) {
    if (line.startsWith('sky.strokeStyle=')) {
      figures.push({ stars: [], alphas: [], radii: [], name: null });
    }
    if (line.startsWith('sky.textBaseline=')) {
      isHung = line === 'sky.textBaseline=top';
    }
    const figure = figures.at(-1);
    if (figure) {
      logInto(figure, line);
      figure.name = nameAt(line, isHung) ?? figure.name;
    }
  }
  return figures;
};

const asideAt = (litFigure: number, isShown = true) => ({
  direction: {
    framing: { kind: 'aside' as const },
    presence: 'hidden' as const,
    labels: 'none' as const,
    figuresShown: isShown,
    litFigure,
  },
});

const starsBoxOf = (stars: readonly [number, number][]): Box => ({
  l: Math.min(...stars.map(([x]) => x)) - STAR_REACH,
  r: Math.max(...stars.map(([x]) => x)) + STAR_REACH,
  t: Math.min(...stars.map(([, y]) => y)) - STAR_REACH,
  b: Math.max(...stars.map(([, y]) => y)) + STAR_REACH,
});

const drawnSky = (phone: Phone, litFigure: number, format: DisplayFormat) => {
  const scene = mountEngineScene({
    layout: layoutOf(phone),
    inputs: { ...SCENE_INPUTS, reduced: true, format },
    holeFocus: true,
  });
  const stage = document.createElement('div');
  scene.engine.setHoleMark(stage);
  scene.run(SETTLE_MS);
  scene.set({ reduced: true, format, ...asideAt(litFigure) });
  scene.run(2000);
  scene.engine.request();
  const figures = lastFiguresOf(scene.run(20));
  const disc: DrawnDisc = {
    x: Number(stage.dataset['holeX']),
    y: Number(stage.dataset['holeY']),
    rx: Number(stage.dataset['discWidth']),
    ry: Number(stage.dataset['discHeight']),
    cos: Math.cos(Number(stage.dataset['discRoll'])),
    sin: Math.sin(Number(stage.dataset['discRoll'])),
  };
  return { figures, disc };
};

const faultsOf = (phone: Phone, part: string, box: Box): string[] => {
  const isUpright = phone.height > phone.width;
  const skyBottom = isUpright ? phone.glass.t : phone.height;
  const skyRight = isUpright ? phone.width : phone.glass.l;
  return [
    ...(box.l >= 0 ? [] : [`${part} cut at the left`]),
    ...(box.r <= skyRight ? [] : [`${part} under the glass or off screen`]),
    ...(box.t >= phone.bar.b ? [] : [`${part} under the page bar`]),
    ...(box.b <= skyBottom ? [] : [`${part} under the glass or off screen`]),
  ];
};

const litFaultsOf = (phone: Phone, format: DisplayFormat): string[] => {
  const faults: string[] = [];
  for (let lit = 0; lit < FIGURE_COUNT; lit++) {
    const { figures, disc } = drawnSky(phone, lit, format);
    const drawn = figures[lit];
    const where = `figure ${String(lit)}`;
    if (!drawn || drawn.stars.length === 0 || !drawn.name) {
      faults.push(`${where}: not drawn`);
      continue;
    }
    faults.push(
      ...faultsOf(phone, `${where} stars`, starsBoxOf(drawn.stars)),
      ...faultsOf(phone, `${where} name`, drawn.name),
      ...(isBoxOverDisc(disc, drawn.name, 0)
        ? [`${where} name over the disc`]
        : []),
    );
  }
  return faults;
};

const crossingsOf = (
  boxes: readonly Box[],
  litName: Box | null,
  lit: number,
): string[] =>
  boxes.flatMap((box, k) => [
    ...boxes
      .slice(k + 1)
      .filter((other) => isOverlapping(box, other))
      .map(() => `figure ${String(k)} over another`),
    ...(k !== lit && litName && isOverlapping(box, litName)
      ? [`figure ${String(k)} under the lit name`]
      : []),
  ]);

const skyFaultsOf = (phone: Phone): string[] => {
  const faults: string[] = [];
  for (let lit = 0; lit < FIGURE_COUNT; lit++) {
    const { figures } = drawnSky(phone, lit, 'phone');
    const when = `lit ${String(lit)}`;
    if (figures.length !== FIGURE_COUNT) {
      faults.push(`${when}: ${String(figures.length)} figures drawn`);
      continue;
    }
    const boxes = figures.map((figure) => starsBoxOf(figure.stars));
    faults.push(
      ...boxes.flatMap((box, k) =>
        faultsOf(phone, `${when}, figure ${String(k)} stars`, box),
      ),
      ...crossingsOf(boxes, figures[lit]?.name ?? null, lit).map(
        (fault) => `${when}, ${fault}`,
      ),
    );
  }
  return faults;
};

describe('ConstellationsRenderer, the lit figure in a free sky', () => {
  for (const phone of PHONES) {
    it(`draws each lit figure and its name whole in the free sky, off the disc, at ${phone.name}`, () => {
      expect(litFaultsOf(phone, 'desktop')).toEqual([]);
    }, 60_000);
  }
});

describe('ConstellationsRenderer, the four figures on a phone', () => {
  for (const phone of PHONES) {
    it(`keeps the lit figure and its name whole in the free sky, off the disc, at ${phone.name}`, () => {
      expect(litFaultsOf(phone, 'phone')).toEqual([]);
    }, 60_000);

    it(`ranges all four figures whole in the free sky, apart from each other, at ${phone.name}`, () => {
      expect(skyFaultsOf(phone)).toEqual([]);
    }, 60_000);
  }
});

const centreOf = (figure: LoggedFigure | undefined): [number, number] => {
  const box = starsBoxOf(figure?.stars ?? []);
  return [(box.l + box.r) / 2, (box.t + box.b) / 2];
};

describe('ConstellationsRenderer, a phone changing sections', () => {
  it('glides the figures to their new places instead of jumping', () => {
    const phone = PHONES[1];
    if (!phone) {
      throw new Error('a phone expected');
    }
    const scene = mountEngineScene({
      layout: layoutOf(phone),
      inputs: { ...SCENE_INPUTS, format: 'phone' },
      holeFocus: true,
    });
    const centresAfter = (ms: number) =>
      lastFiguresOf(scene.run(ms)).map((figure) => centreOf(figure));
    scene.run(SETTLE_MS);
    scene.set(asideAt(0));
    const before = centresAfter(4000);
    scene.set(asideAt(1));
    const midway = centresAfter(250);
    const after = centresAfter(6000);
    const travels = before.map(([x, y], k) => {
      const [ex = 0, ey = 0] = after[k] ?? [];
      return Math.hypot(ex - x, ey - y);
    });

    expect(Math.max(...travels)).toBeGreaterThan(10);
    for (const [k, travel] of travels.entries()) {
      if (travel > 10) {
        const [sx = 0, sy = 0] = before[k] ?? [];
        const [mx = 0, my = 0] = midway[k] ?? [];
        const done = Math.hypot(mx - sx, my - sy) / travel;
        expect(done).toBeGreaterThan(0.05);
        expect(done).toBeLessThan(0.95);
      }
    }
  }, 60_000);
});

const WIDE: Phone = {
  name: '1280×800',
  width: 1280,
  height: 800,
  bar: { l: 900, t: 0, r: 1280, b: 44 },
  glass: { l: 780, t: 70, r: 1240, b: 640 },
};

const brightestOf = (figure: LoggedFigure | undefined): number =>
  Math.max(...(figure?.alphas ?? [0]));

const mountSky = (phone: Phone, format: DisplayFormat = 'desktop') => {
  const scene = mountEngineScene({
    layout: layoutOf(phone),
    inputs: { ...SCENE_INPUTS, reduced: true, format },
    holeFocus: true,
  });
  const targets = Array.from({ length: FIGURE_COUNT }, () => {
    const target = document.createElement('button');
    target.setAttribute('aria-hidden', 'true');
    target.tabIndex = -1;
    return target;
  });
  scene.engine.setNodes([], [], targets);
  scene.run(SETTLE_MS);
  const at = (litFigure: number, isShown = true): LoggedFigure[] => {
    scene.set({
      reduced: true,
      format,
      ...asideAt(litFigure, isShown),
    });
    scene.run(2000);
    scene.engine.request();
    return lastFiguresOf(scene.run(20));
  };
  return { scene, targets, at };
};

const targetBoxOf = (target: HTMLElement): Box => {
  const [x = 0, y = 0] = /translate\(([\d.-]+)px,\s*([\d.-]+)px\)/
    .exec(target.style.transform)
    ?.slice(1)
    .map(Number) ?? [NaN, NaN];
  const width = Number.parseFloat(target.style.width);
  const height = Number.parseFloat(target.style.height);
  return { l: x, t: y, r: x + width, b: y + height };
};

const isInert = (target: HTMLElement): boolean =>
  target.style.pointerEvents === 'none' &&
  target.getAttribute('aria-hidden') === 'true' &&
  target.tabIndex === -1;

const isShortOf = (box: Box, stars: Box): boolean =>
  box.l > stars.l + 0.1 ||
  box.t > stars.t + 0.1 ||
  box.r < stars.r - 0.1 ||
  box.b < stars.b - 0.1;

const coverFaultsOf = (
  target: HTMLElement,
  figure: LoggedFigure | undefined,
  where: string,
): string[] => {
  const box = targetBoxOf(target);
  const isLive =
    target.style.pointerEvents === 'auto' &&
    target.getAttribute('aria-hidden') === 'false' &&
    target.tabIndex === 0;
  const isFingerWide = box.r - box.l >= 44 && box.b - box.t >= 44;
  return [
    ...(isLive ? [] : [`${where} inert`]),
    ...(isFingerWide ? [] : [`${where} smaller than a finger`]),
    ...(isShortOf(box, starsBoxOf(figure?.stars ?? []))
      ? [`${where} short of its figure`]
      : []),
  ];
};

describe('ConstellationsRenderer, how bright the figures are', () => {
  it('draws the figures not lit at about 45 % and the lit one at full light', () => {
    const figures = mountSky(WIDE).at(0);

    expect(brightestOf(figures[0])).toBeCloseTo(0.95, 2);
    for (const k of [1, 2, 3]) {
      expect(brightestOf(figures[k])).toBeCloseTo(0.95 * 0.45, 2);
    }
  }, 60_000);

  it('draws the stars of a figure not lit a quarter larger than when it is lit', () => {
    const sky = mountSky(WIDE);
    const lit = sky.at(1)[1]?.radii ?? [];
    const unlit = sky.at(0)[1]?.radii ?? [];

    expect(unlit.length).toBeGreaterThan(0);
    expect(unlit.length).toBe(lit.length);
    for (const [i, radius] of unlit.entries()) {
      expect(radius / (lit[i] ?? 1)).toBeCloseTo(1.25, 2);
    }
  }, 60_000);

  it('lights a figure not lit to about 70 % under the pointer', () => {
    const sky = mountSky(WIDE);
    sky.at(0);
    const box = targetBoxOf(sky.targets[2] ?? document.createElement('b'));
    sky.scene.engine.setPointer((box.l + box.r) / 2, (box.t + box.b) / 2);
    sky.scene.engine.request();
    const figures = lastFiguresOf(sky.scene.run(20));

    expect(brightestOf(figures[2])).toBeCloseTo(0.95 * 0.7, 2);
    expect(brightestOf(figures[1])).toBeCloseTo(0.95 * 0.45, 2);
  }, 60_000);
});

describe('ConstellationsRenderer, a target over each figure', () => {
  it('lays a live target of a finger at least over each whole figure of the about view', () => {
    const sky = mountSky(WIDE);
    const figures = sky.at(0);

    expect(
      sky.targets.flatMap((target, k) =>
        coverFaultsOf(target, figures[k], `target ${String(k)}`),
      ),
    ).toEqual([]);
  }, 60_000);

  it('leaves every target inert out of the about view', () => {
    const sky = mountSky(WIDE);
    sky.at(0);
    sky.at(0, false);

    expect(sky.targets.every((target) => isInert(target))).toBe(true);
  }, 60_000);

  it('leaves the target of a figure under a glass inert', () => {
    const phone = PHONES[1];
    if (!phone) {
      throw new Error('a phone expected');
    }
    const sky = mountSky(phone);
    sky.at(0);

    expect(sky.targets.map((target) => isInert(target))).toEqual([
      false,
      false,
      true,
      true,
    ]);
  }, 60_000);

  it('keeps all four targets of a phone live, each over its figure', () => {
    const faults: string[] = [];
    for (const phone of PHONES) {
      const sky = mountSky(phone, 'phone');
      for (let lit = 0; lit < FIGURE_COUNT; lit++) {
        const figures = sky.at(lit);
        faults.push(
          ...sky.targets.flatMap((target, k) =>
            coverFaultsOf(
              target,
              figures[k],
              `${phone.name}, lit ${String(lit)}, target ${String(k)}`,
            ),
          ),
        );
      }
    }

    expect(faults).toEqual([]);
  }, 60_000);
});

describe('ConstellationsRenderer, paused', () => {
  it('finishes lighting the chosen figure while the animation is paused', () => {
    const scene = mountEngineScene({
      layout: layoutOf(WIDE),
      holeFocus: true,
    });
    scene.run(SETTLE_MS);
    scene.set({ paused: true, ...asideAt(0) });
    scene.run(4000);
    scene.set({ paused: true, ...asideAt(1) });
    scene.run(4000);
    scene.engine.request();
    const figures = lastFiguresOf(scene.run(20));

    expect(brightestOf(figures[1])).toBeCloseTo(0.95, 2);
    expect(brightestOf(figures[0])).toBeCloseTo(0.95 * 0.45, 2);
  }, 60_000);
});
