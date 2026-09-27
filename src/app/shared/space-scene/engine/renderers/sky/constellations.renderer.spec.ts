import {
  mountEngineScene,
  SCENE_INPUTS,
} from '@testing/fixtures/engine-scene.fixture';
import { sceneLayout } from '../../../rules/scene-layout.rules';
import { DrawnDisc, isBoxOverDisc } from '../../../rules/camera/pointer.rules';

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
const LIT_HALO = 0.2;

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

interface Drawn {
  readonly stars: Box;
  readonly name: Box & { readonly text: string };
}

const numbersIn = (line: string, prefix: string): number[] | null =>
  line.startsWith(prefix)
    ? line.slice(prefix.length, line.indexOf(')')).split(',').map(Number)
    : null;

const litStarsOf = (log: readonly string[]): [number, number][] => {
  const stars: [number, number][] = [];
  let alpha = 0;
  for (const line of log) {
    if (line.startsWith('sky.globalAlpha=')) {
      alpha = Number(line.slice('sky.globalAlpha='.length));
    }
    const halo = numbersIn(line, 'sky.radial(');
    if (halo && alpha > LIT_HALO && line.includes(').stop(0.000,')) {
      stars.push([halo[0] ?? 0, halo[1] ?? 0]);
    }
  }
  return stars;
};

const nameOf = (log: readonly string[]): Drawn['name'] | null => {
  let isHung = false;
  let name: Drawn['name'] | null = null;
  for (const line of log) {
    if (line.startsWith('sky.textBaseline=')) {
      isHung = line === 'sky.textBaseline=top';
    }
    const text = /^sky\.fillText\(([^,]+),([\d.-]+),([\d.-]+)\)$/.exec(line);
    if (text) {
      const label = text[1] ?? '';
      const x = Number(text[2]);
      const y = Number(text[3]);
      const width =
        label.length * MEASURED_CHARACTER +
        label.length * NAME_SPACING * NAME_SIZE;
      const top = isHung ? y : y - NAME_SIZE;
      name = { text: label, l: x, r: x + width, t: top, b: top + NAME_SIZE };
    }
  }
  return name;
};

const drawnFigure = (phone: Phone, litFigure: number) => {
  const scene = mountEngineScene({
    layout: layoutOf(phone),
    inputs: { ...SCENE_INPUTS, reduced: true },
  });
  const stage = document.createElement('div');
  scene.engine.setHoleMark(stage);
  scene.run(SETTLE_MS);
  scene.set({
    reduced: true,
    direction: {
      framing: { kind: 'aside' },
      presence: 'hidden',
      labels: 'none',
      figuresShown: true,
      litFigure,
    },
  });
  scene.run(2000);
  scene.engine.request();
  const log = scene.run(20);
  const stars = litStarsOf(log);
  const disc: DrawnDisc = {
    x: Number(stage.dataset['holeX']),
    y: Number(stage.dataset['holeY']),
    rx: Number(stage.dataset['discWidth']),
    ry: Number(stage.dataset['discHeight']),
    cos: Math.cos(Number(stage.dataset['discRoll'])),
    sin: Math.sin(Number(stage.dataset['discRoll'])),
  };
  return {
    stars: {
      l: Math.min(...stars.map(([x]) => x)) - STAR_REACH,
      r: Math.max(...stars.map(([x]) => x)) + STAR_REACH,
      t: Math.min(...stars.map(([, y]) => y)) - STAR_REACH,
      b: Math.max(...stars.map(([, y]) => y)) + STAR_REACH,
    },
    starCount: stars.length,
    name: nameOf(log),
    disc,
  };
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

describe('ConstellationsRenderer, the lit figure on a phone', () => {
  for (const phone of PHONES) {
    it(`draws each lit figure and its name whole in the free sky, off the disc, at ${phone.name}`, () => {
      const faults: string[] = [];
      for (let lit = 0; lit < FIGURE_COUNT; lit++) {
        const drawn = drawnFigure(phone, lit);
        const where = `figure ${String(lit)}`;
        if (drawn.starCount === 0 || !drawn.name) {
          faults.push(`${where}: not drawn`);
          continue;
        }
        faults.push(
          ...faultsOf(phone, `${where} stars`, drawn.stars),
          ...faultsOf(phone, `${where} name`, drawn.name),
          ...(isBoxOverDisc(drawn.disc, drawn.name, 0)
            ? [`${where} name over the disc`]
            : []),
        );
      }

      expect(faults).toEqual([]);
    }, 60_000);
  }
});
