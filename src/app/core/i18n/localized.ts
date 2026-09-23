import { Lang } from './lang';

/** A text written in each language, side by side (D5). */
export interface Localized<T = string> {
  readonly fr: T;
  readonly en: T;
}

/**
 * A text of the content: a plain string when it reads the same in both
 * languages (a name, a stack), a `Localized` pair when it does not.
 */
export type Text = string | Localized;

/** The same shape, every text read in one language. */
export type Resolved<T> =
  T extends Localized<infer U>
    ? U
    : T extends readonly (infer E)[]
      ? readonly Resolved<E>[]
      : T extends object
        ? { readonly [K in keyof T]: Resolved<T[K]> }
        : T;

/**
 * A pair of texts is an object with exactly the keys `fr` and `en`. No
 * other object of the content has that shape; a spec keeps it so.
 */
function isLocalized(value: object): value is Localized<unknown> {
  const keys = Object.keys(value);
  return keys.length === 2 && 'fr' in value && 'en' in value;
}

/** Reads every text of `value` in `lang`, however deep, keeping the rest. */
export function resolve<T>(value: T, lang: Lang): Resolved<T> {
  return resolveAny(value, lang) as Resolved<T>;
}

function resolveAny(value: unknown, lang: Lang): unknown {
  if (Array.isArray(value)) {
    return value.map((each: unknown) => resolveAny(each, lang));
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  return isLocalized(value)
    ? value[lang]
    : Object.fromEntries(
        Object.entries(value).map(([key, each]) => [
          key,
          resolveAny(each, lang),
        ]),
      );
}
