/**
 * The English texts written without the author's review: each is marked
 * `draft(…)` where it stands, and counted here. Reviewing one is removing
 * its `draft(` call; the spec that counts them then asks for the new count.
 *
 * A text that takes values (a count, a title) is a function, and is marked
 * the same way. Registered when its module loads, so the count covers what
 * a spec imports: the English catalogue and the project files.
 */
const drafts: unknown[] = [];

export function draft<T extends string | ((...values: never[]) => string)>(
  text: T,
): T {
  drafts.push(text);
  return text;
}

/** How many English texts still wait for their review. */
export function draftsLeft(): number {
  return drafts.length;
}
