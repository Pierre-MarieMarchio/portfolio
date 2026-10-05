const drafts: unknown[] = [];

export function draft<T extends string | ((...values: never[]) => string)>(
  text: T,
): T {
  drafts.push(text);
  return text;
}

export function draftsLeft(): number {
  return drafts.length;
}

export function forgetDraftsAfter(count: number): void {
  drafts.length = Math.min(drafts.length, count);
}
