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
