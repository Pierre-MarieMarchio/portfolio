import { Lang } from '../models/lang.model';

export interface Localized<T = string> {
  readonly fr: T;
  readonly en: T;
}

export type Text = string | Localized;

export type Resolved<T> =
  T extends Localized<infer U>
    ? U
    : T extends readonly (infer E)[]
      ? readonly Resolved<E>[]
      : T extends object
        ? { readonly [K in keyof T]: Resolved<T[K]> }
        : T;

function isLocalized(value: object): value is Localized<unknown> {
  const keys = Object.keys(value);
  return keys.length === 2 && 'fr' in value && 'en' in value;
}

export function localize<T>(value: T, lang: Lang): Resolved<T> {
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
