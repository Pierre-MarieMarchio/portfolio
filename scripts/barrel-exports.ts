import { readFileSync } from 'node:fs';
import { dirname, posix } from 'node:path';

const EXPORT_FROM = /export\s[^;]*?from\s*'([^']+)'/gs;

const exportTarget = (
  index: string,
  specifier: string,
  known: Set<string>,
): string | undefined => {
  const base = posix.join(dirname(index), specifier);
  return [`${base}.ts`, `${base}/index.ts`].find((path) => known.has(path));
};

export const exportedBy = (
  index: string,
  known: Set<string>,
  seen = new Set<string>(),
): Set<string> => {
  if (seen.has(index)) {
    return seen;
  }
  seen.add(index);
  for (const [, specifier = ''] of readFileSync(index, 'utf8').matchAll(
    EXPORT_FROM,
  )) {
    const target = exportTarget(index, specifier, known);
    if (target) {
      exportedBy(target, known, seen);
    }
  }
  return seen;
};
