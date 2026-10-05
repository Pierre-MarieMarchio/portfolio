import type { HeldSheet, ViewSlot } from '../models';

export type SheetContent = 'detail' | 'not-found' | null;

export interface SheetWindow {
  readonly key: number;
  readonly id: string;
  readonly slot: ViewSlot | null;
  readonly slug: string;
  readonly chapter: number;
  readonly isPinned: boolean;
  readonly isShown: boolean;
  readonly isFraming: boolean;
  readonly content: SheetContent;
  readonly isCurrent: boolean;
  readonly closeLabel: string;
}

export interface AddressSheet {
  readonly slug: string | null;
  readonly chapter: number;
  readonly isPinned: boolean;
  readonly isShown: boolean;
  readonly isKept: boolean;
  readonly isCurrent: boolean;
  readonly closeLabel: string;
}

export interface HandOverFrom {
  readonly key: number;
  readonly held: readonly HeldSheet[];
  readonly slug: string | null;
  readonly chapter: number;
  readonly isPinned: boolean;
  readonly isMinimized: boolean;
}

export interface HandOver {
  readonly key: number;
  readonly held: readonly HeldSheet[];
  readonly chapter: number | null;
}

export const sheetIdOf = (key: number): string => `sheet:${String(key)}`;

function parkedSheetOf(
  { key, slug, chapter, isPinned, isMinimized }: HandOverFrom,
  arriving: string,
): HeldSheet | null {
  return isPinned && slug !== null && slug !== arriving
    ? { key, slug, chapter, minimized: isMinimized }
    : null;
}

export function handOverSheet(from: HandOverFrom, arriving: string): HandOver {
  const { key, slug, chapter, isPinned } = from;
  const parked = parkedSheetOf(from, arriving);
  const held = parked ? [...from.held, parked] : from.held;
  const pulled = held.find((sheet) => sheet.slug === arriving);
  if (pulled) {
    return {
      key: pulled.key,
      held: held.filter((sheet) => sheet !== pulled),
      chapter: pulled.chapter,
    };
  }
  if (slug === arriving && isPinned) {
    return { key, held, chapter };
  }
  return {
    key: parked
      ? Math.max(key, ...from.held.map((sheet) => sheet.key)) + 1
      : key,
    held,
    chapter: null,
  };
}

function contentOf({ isKept, slug }: AddressSheet): SheetContent {
  if (!isKept) {
    return null;
  }
  return slug === null ? 'not-found' : 'detail';
}

export function sheetWindowsOf(
  held: readonly HeldSheet[],
  key: number,
  address: AddressSheet,
): readonly SheetWindow[] {
  const parked = held.map<SheetWindow>((sheet) => ({
    key: sheet.key,
    id: sheetIdOf(sheet.key),
    slot: null,
    slug: sheet.slug,
    chapter: sheet.chapter,
    isPinned: true,
    isShown: !sheet.minimized,
    isFraming: false,
    content: 'detail',
    isCurrent: false,
    closeLabel: '',
  }));
  const current: SheetWindow = {
    ...address,
    slug: address.slug ?? '',
    content: contentOf(address),
    key,
    id: sheetIdOf(key),
    slot: 'sheet',
    isFraming: address.isShown,
  };
  const sorted = [...parked, current].sort((a, b) => a.key - b.key);
  const framing = address.isShown
    ? null
    : [...sorted].reverse().find((window) => window.isShown);
  return sorted.map((window) =>
    window === framing ? { ...window, isFraming: true } : window,
  );
}
