export interface PointerAt {
  readonly x?: number;
  readonly y?: number;
  readonly at?: number;
  readonly id?: number;
  readonly isPrimary?: boolean;
  readonly kind?: string;
  readonly button?: number;
}

export const pointer = (
  type: string,
  {
    x = 0,
    y = 0,
    at = 0,
    id = 1,
    isPrimary = id === 1,
    kind = 'touch',
    button = 0,
  }: PointerAt = {},
): PointerEvent => {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button,
    pointerId: id,
    isPrimary,
    pointerType: kind,
  });
  Object.defineProperty(event, 'timeStamp', { value: at });
  return event;
};

export const firePointer = (
  target: EventTarget,
  type: string,
  at: PointerAt = {},
): void => {
  target.dispatchEvent(pointer(type, at));
};

export const tap = (
  on: EventTarget,
  press: PointerAt,
  release: PointerAt = {},
): void => {
  firePointer(on, 'pointerdown', press);
  firePointer(on, 'pointerup', { ...press, ...release });
};

export const drag = (
  on: EventTarget,
  path: readonly PointerAt[],
  release: PointerAt = path.at(-1) ?? {},
): void => {
  const [first, ...moves] = path;
  if (!first) {
    return;
  }
  firePointer(on, 'pointerdown', first);
  for (const move of moves) {
    firePointer(on, 'pointermove', move);
  }
  firePointer(on, 'pointerup', release);
};

export interface HeardClicks {
  readonly count: () => number;
  readonly stop: () => void;
}

export const heardClicks = (): HeardClicks => {
  let count = 0;
  const hear = (): void => {
    count += 1;
  };
  document.addEventListener('click', hear);
  return {
    count: () => count,
    stop: () => {
      document.removeEventListener('click', hear);
    },
  };
};
