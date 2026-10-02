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

export interface FingerAt {
  readonly x?: number;
  readonly y?: number;
}

export interface TouchAt {
  readonly fingers?: readonly FingerAt[];
  readonly at?: number;
}

const listOf = (fingers: readonly FingerAt[]): TouchList => {
  const touches = fingers.map(
    ({ x = 0, y = 0 }) => ({ clientX: x, clientY: y }) as Touch,
  );
  return {
    length: touches.length,
    item: (index: number) => touches[index] ?? null,
  } as TouchList;
};

export const touch = (
  type: string,
  { fingers = [{}], at = 0 }: TouchAt = {},
): TouchEvent => {
  const event = new TouchEvent(type, { bubbles: true, cancelable: true });
  const list = listOf(fingers);
  const none = listOf([]);
  const isEnding = type === 'touchend' || type === 'touchcancel';
  Object.defineProperty(event, 'touches', { value: isEnding ? none : list });
  Object.defineProperty(event, 'changedTouches', { value: list });
  Object.defineProperty(event, 'timeStamp', { value: at });
  return event;
};

export const fireTouch = (
  target: EventTarget,
  type: string,
  at: TouchAt = {},
): void => {
  target.dispatchEvent(touch(type, at));
};

export const swipe = (
  on: EventTarget,
  { dx = 0, dy = 0, ms = 100 }: { dx?: number; dy?: number; ms?: number } = {},
): void => {
  fireTouch(on, 'touchstart', { fingers: [{ x: 200, y: 200 }], at: 0 });
  fireTouch(on, 'touchend', {
    fingers: [{ x: 200 + dx, y: 200 + dy }],
    at: ms,
  });
};
