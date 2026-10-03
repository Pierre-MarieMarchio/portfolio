import { bilingual, draft, Localized, Text } from '@app/core/rules';
import {
  DetailSource,
  FactsSource,
  PROJECT_FAMILIES,
  ProjectEntry,
  ProjectFamily,
  ProjectSource,
} from '../models';

type Fields = Record<string, unknown>;
type Reader<T> = (value: unknown, path: string) => T;
type Link = DetailSource['links'][number];
type Chapter = DetailSource['chapters'][number];
type Bullet = NonNullable<Chapter['bullets']>[number];
type Figure = NonNullable<Chapter['figure']>;
type Layer = Extract<Figure, { kind: 'layers' }>['layers'][number];

function childPath(path: string, key: string): string {
  return path === '' ? key : `${path}.${key}`;
}

function expected(path: string, what: string, value: unknown): never {
  const found = JSON.stringify(value) ?? 'missing';
  throw new Error(`${path}: expected ${what}, found ${found}`);
}

function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readFields(value: unknown, path: string): Fields {
  return isFields(value) ? value : expected(path, 'an object', value);
}

function readString(value: unknown, path: string): string {
  return typeof value === 'string' ? value : expected(path, 'a string', value);
}

function readList<T>(value: unknown, path: string, read: Reader<T>): T[] {
  return Array.isArray(value)
    ? value.map((each: unknown, index) => read(each, `${path}[${index}]`))
    : expected(path, 'an array', value);
}

function readBilingual(value: unknown, path: string): Localized {
  const fields = readFields(value, path);
  const hasEn = 'en' in fields;
  if (hasEn === 'enDraft' in fields) {
    throw new Error(`${path}: expected exactly one of en or enDraft`);
  }
  const fr = readString(fields['fr'], childPath(path, 'fr'));
  return hasEn
    ? bilingual(fr, readString(fields['en'], childPath(path, 'en')))
    : bilingual(
        fr,
        draft(readString(fields['enDraft'], childPath(path, 'enDraft'))),
      );
}

function readText(value: unknown, path: string): Text {
  return typeof value === 'string' ? value : readBilingual(value, path);
}

function readTexts(value: unknown, path: string): Text[] {
  return readList(value, path, readText);
}

function readFamily(value: unknown, path: string): ProjectFamily {
  return (
    PROJECT_FAMILIES.find((family) => family === value) ??
    expected(path, `one of ${PROJECT_FAMILIES.join(', ')}`, value)
  );
}

function required<T>(
  fields: Fields,
  path: string,
  key: string,
  read: Reader<T>,
): T {
  return read(fields[key], childPath(path, key));
}

function optional<T>(
  fields: Fields,
  path: string,
  key: string,
  read: Reader<T>,
): T | undefined {
  return fields[key] === undefined
    ? undefined
    : read(fields[key], childPath(path, key));
}

function listOf<T>(read: Reader<T>): Reader<T[]> {
  return (value, path) => readList(value, path, read);
}

function readProject(value: unknown, path: string): ProjectSource {
  const fields = readFields(value, path);
  const tag = optional(fields, path, 'tag', readText);
  return {
    slug: required(fields, path, 'slug', readString),
    title: required(fields, path, 'title', readText),
    short: required(fields, path, 'short', readText),
    ...(tag === undefined ? {} : { tag }),
    family: required(fields, path, 'family', readFamily),
    subject: required(fields, path, 'subject', readText),
    summary: required(fields, path, 'summary', readText),
  };
}

function readFacts(value: unknown, path: string): FactsSource {
  const fields = readFields(value, path);
  return {
    proof: required(fields, path, 'proof', readText),
    role: required(fields, path, 'role', readText),
    stack: required(fields, path, 'stack', readText),
    context: required(fields, path, 'context', readText),
    period: required(fields, path, 'period', readText),
  };
}

function readLink(value: unknown, path: string): Link {
  const fields = readFields(value, path);
  return {
    label: required(fields, path, 'label', readText),
    href: required(fields, path, 'href', readString),
  };
}

function readBullet(value: unknown, path: string): Bullet {
  const fields = readFields(value, path);
  return {
    term: required(fields, path, 'term', readText),
    text: required(fields, path, 'text', readText),
  };
}

function readLayer(value: unknown, path: string): Layer {
  const fields = readFields(value, path);
  return {
    name: required(fields, path, 'name', readText),
    projects: required(fields, path, 'projects', readText),
  };
}

function readFlow(value: unknown, path: string): Figure {
  const fields = readFields(value, path);
  return {
    kind: 'flow',
    steps: required(fields, path, 'steps', readTexts),
    loop: required(fields, path, 'loop', readText),
    caption: required(fields, path, 'caption', readText),
  };
}

function readLayers(value: unknown, path: string): Figure {
  const fields = readFields(value, path);
  return {
    kind: 'layers',
    layers: required(fields, path, 'layers', listOf(readLayer)),
    caption: required(fields, path, 'caption', readText),
  };
}

const FIGURE_READERS = new Map<unknown, Reader<Figure>>([
  ['flow', readFlow],
  ['layers', readLayers],
]);

function readFigure(value: unknown, path: string): Figure {
  const fields = readFields(value, path);
  const read = FIGURE_READERS.get(fields['kind']);
  return read
    ? read(value, path)
    : expected(childPath(path, 'kind'), 'flow or layers', fields['kind']);
}

function readChapter(value: unknown, path: string): Chapter {
  const fields = readFields(value, path);
  const title = optional(fields, path, 'title', readText);
  const bullets = optional(fields, path, 'bullets', listOf(readBullet));
  const figure = optional(fields, path, 'figure', readFigure);
  return {
    ...(title === undefined ? {} : { title }),
    paragraphs: required(fields, path, 'paragraphs', readTexts),
    ...(bullets === undefined ? {} : { bullets }),
    ...(figure === undefined ? {} : { figure }),
  };
}

function readDetail(value: unknown, path: string): DetailSource {
  const fields = readFields(value, path);
  return {
    lede: required(fields, path, 'lede', readText),
    links: required(fields, path, 'links', listOf(readLink)),
    chapters: required(fields, path, 'chapters', listOf(readChapter)),
  };
}

function readEntry(value: unknown): ProjectEntry {
  const fields = readFields(value, 'entry');
  return {
    project: required(fields, '', 'project', readProject),
    facts: required(fields, '', 'facts', readFacts),
    detail: required(fields, '', 'detail', readDetail),
  };
}

function slugOf(value: unknown): string | undefined {
  const project = isFields(value) ? value['project'] : undefined;
  const slug = isFields(project) ? project['slug'] : undefined;
  return typeof slug === 'string' ? slug : undefined;
}

function readNamedEntry(value: unknown, index: number): ProjectEntry {
  try {
    return readEntry(value);
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }
    const name = slugOf(value) ?? `#${index}`;
    throw new Error(`${name}: ${error.message}`, { cause: error });
  }
}

function rejectDuplicateSlugs(entries: readonly ProjectEntry[]): void {
  const seen = new Set<string>();
  for (const { project } of entries) {
    if (seen.has(project.slug)) {
      throw new Error(`${project.slug}: project.slug: duplicate slug`);
    }
    seen.add(project.slug);
  }
}

export function readProjectEntries(raw: unknown): readonly ProjectEntry[] {
  if (!Array.isArray(raw)) {
    return expected('projects', 'an array', raw);
  }
  const entries = raw.map((each: unknown, index) =>
    readNamedEntry(each, index),
  );
  rejectDuplicateSlugs(entries);
  return entries;
}
