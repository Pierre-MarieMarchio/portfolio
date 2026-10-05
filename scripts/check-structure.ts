import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, posix, relative, sep } from 'node:path';
import {
  BARREL_EXCEPTIONS,
  CLASS_SUFFIXES,
  ENGINE_ZONES,
  EXTENSIONS_OF,
  ROLES_IN,
  ROLE_OF,
} from './structure-tables.ts';

const APP = 'src/app';
const TESTING = 'src/testing';
const MAX_SOURCES = 8;
const STRICT = process.argv.includes('--strict');

const FILE =
  /^(?<name>[a-z0-9-]+)\.(?<suffix>[a-z]+)(?:\.golden)?(?<spec>\.spec)?\.(?<ext>ts|html|scss|json)$/;

const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative('.', join(entry.parentPath, entry.name)).split(sep).join('/'),
    );

const emptyDirsUnder = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((path) => readdirSync(path).length === 0);

const SINGLE_ZONES = new Set(['core', 'i18n', 'pages']);

interface Zone {
  zone: string;
  kind: string;
  rest: string[];
}

const zoneOf = (inApp: string): Zone | null => {
  const parts = inApp.split('/');
  const [first = '', second = ''] = parts;
  if (SINGLE_ZONES.has(first)) {
    return { zone: first, kind: first, rest: parts.slice(1) };
  }
  const zone = `${first}/${second}`;
  const rest = parts.slice(2);
  if (!second) {
    return null;
  }
  if (first === 'shared' || zone === 'features/common') {
    return { zone, kind: zone, rest };
  }
  return first === 'features' ? { zone, kind: 'feature', rest } : null;
};

const classSuffix = (suffix: string): string =>
  suffix.charAt(0).toUpperCase() + suffix.slice(1);

const misnamedClasses = (path: string, suffix: string): string[] => {
  const expected = classSuffix(suffix);
  return [
    ...readFileSync(path, 'utf8').matchAll(/export (?:abstract )?class (\w+)/g),
  ]
    .map((match) => match[1] ?? '')
    .filter((name) => !name.endsWith(expected))
    .map((name) => `class ${name} should end with ${expected}`);
};

const pageComponentErrors = (
  kind: string,
  suffix: string,
  name: string,
  rest: string[],
): string[] | null => {
  if (kind !== 'pages' || suffix !== 'component') {
    return null;
  }
  const screenFile = /-(page|route)$/.test(name) && rest.length === 2;
  return screenFile
    ? []
    : ['a page folder holds only -page and -route components'];
};

const engineRoleErrors = (
  suffix: string,
  role: string,
  first: string,
  second: string,
): string[] | null => {
  if (suffix !== 'motion' && suffix !== 'renderer') {
    return null;
  }
  return first === 'engine' && second === role
    ? []
    : [`belongs in engine/${role}/`];
};

const componentFolderErrors = (
  suffix: string,
  name: string,
  rest: string[],
): string[] =>
  suffix === 'component' && (rest.length !== 3 || rest[1] !== name)
    ? [`a component lives alone in components/${name}/`]
    : [];

const stateFolderErrors = (role: string, rest: string[]): string[] =>
  role === 'states' && rest.length !== 3
    ? ['a state lives in states/<state>/']
    : [];

const roleAllowanceErrors = (
  { kind, zone }: Pick<Zone, 'kind' | 'zone'>,
  role: string,
): string[] => {
  const engineHere = role === 'engine' && ENGINE_ZONES.has(zone);
  return (ROLES_IN[kind] ?? []).includes(role) || engineHere
    ? []
    : [`${zone}/ has no ${role}/ role`];
};

const roleErrors = (
  where: Zone,
  suffix: string,
  name: string,
  role: string,
): string[] => [
  ...roleAllowanceErrors(where, role),
  ...componentFolderErrors(suffix, name, where.rest),
  ...stateFolderErrors(role, where.rest),
];

const misplaced = (where: Zone, suffix: string, name: string): string[] => {
  const role = ROLE_OF[suffix] ?? '';
  const [first = '', second = ''] = where.rest;
  return (
    pageComponentErrors(where.kind, suffix, name, where.rest) ??
    engineRoleErrors(suffix, role, first, second) ??
    (first === role
      ? roleErrors(where, suffix, name, role)
      : [`belongs in ${role}/`])
  );
};

interface ParsedFileName {
  name: string;
  suffix: string;
  spec: boolean;
  ext: string;
}

const parsedFileName = (file: string): ParsedFileName | null => {
  const groups = FILE.exec(file)?.groups;
  if (!groups?.suffix || !(groups.suffix in ROLE_OF)) {
    return null;
  }
  return {
    name: groups.name ?? '',
    suffix: groups.suffix,
    spec: Boolean(groups.spec),
    ext: groups.ext ?? '',
  };
};

const extensionErrors = (
  suffix: string,
  spec: boolean,
  ext: string,
): string[] => {
  if (!(EXTENSIONS_OF[suffix] ?? ['ts']).includes(ext)) {
    return [`a .${suffix} file is not written as .${ext}`];
  }
  return spec && ext !== 'ts' ? ['a spec is written in .ts'] : [];
};

const namedFileErrors = (path: string, file: string, where: Zone): string[] => {
  const parsed = parsedFileName(file);
  if (!parsed) {
    return ['has no suffix from the list (scripts/structure-tables.ts)'];
  }
  const { name, suffix, spec, ext } = parsed;
  const extensionProblems = extensionErrors(suffix, spec, ext);
  if (extensionProblems.length > 0) {
    return extensionProblems;
  }
  const checksClassNames = !spec && ext === 'ts' && CLASS_SUFFIXES.has(suffix);
  return [
    ...misplaced(where, suffix, name),
    ...(checksClassNames ? misnamedClasses(path, suffix) : []),
  ];
};

const rootFileErrors = (file: string): string[] =>
  /^app\.[a-z.]+\.ts$|^app\.component\.(html|scss)$/.test(file)
    ? []
    : ['the root holds only the app.*.ts files'];

const appFileErrors = (path: string): string[] => {
  const inApp = posix.relative(APP, path);
  const file = basename(path);
  if (!inApp.includes('/')) {
    return rootFileErrors(file);
  }
  const where = zoneOf(inApp);
  if (!where) {
    return ['outside every zone'];
  }
  return file === 'index.ts' ? [] : namedFileErrors(path, file, where);
};

const TESTING_SUFFIX_OF: Record<string, string> = {
  fixtures: 'fixture',
  doubles: 'double',
  integration: 'spec',
};

const testingFileErrors = (path: string): string[] => {
  const [role = '', file = '', ...deeper] = posix
    .relative(TESTING, path)
    .split('/');
  const expected = TESTING_SUFFIX_OF[role];
  if (!expected || deeper.length > 0) {
    return ['src/testing holds fixtures/, doubles/ and integration/ only'];
  }
  return file.endsWith(`.${expected}.ts`)
    ? []
    : [`a file in ${role}/ ends with .${expected}.ts`];
};

const isBarrelUnit = (path: string): boolean =>
  path.endsWith('.ts') &&
  !path.includes('.spec.') &&
  basename(path) !== 'index.ts';

const crowdedFolders = (paths: string[]): string[] => {
  const sources = new Map<string, number>();
  for (const path of paths.filter(isBarrelUnit)) {
    sources.set(dirname(path), (sources.get(dirname(path)) ?? 0) + 1);
  }
  return [...sources]
    .filter(([, count]) => count > MAX_SOURCES)
    .map(
      ([dir, count]) =>
        `${dir}/: ${count} source files, over ${MAX_SOURCES}: split it by concept`,
    );
};

const EXPORT_FROM = /export\s[^;]*?from\s*'([^']+)'/gs;

const exportTarget = (
  index: string,
  specifier: string,
  known: Set<string>,
): string | undefined => {
  const base = posix.join(dirname(index), specifier);
  return [`${base}.ts`, `${base}/index.ts`].find((path) => known.has(path));
};

const exportedBy = (
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

const barrelErrors = (paths: string[]): string[] => {
  const known = new Set(paths);
  const units = paths
    .filter(isBarrelUnit)
    .filter(
      (unit) => !BARREL_EXCEPTIONS.some(({ unit: rule }) => rule.test(unit)),
    );
  return paths
    .filter((path) => basename(path) === 'index.ts')
    .flatMap((index) => {
      const exported = exportedBy(index, known);
      return units
        .filter((unit) => unit.startsWith(`${dirname(index)}/`))
        .filter((unit) => !exported.has(unit))
        .map(
          (unit) =>
            `${unit}: not exported by ${index}: export it, or write an exception in BARREL_EXCEPTIONS (scripts/structure-tables.ts)`,
        );
    });
};

const appFiles = filesUnder(APP);
const testingFiles = filesUnder(TESTING);

const findings = [
  ...appFiles.flatMap((path) =>
    appFileErrors(path).map((error) => `${path}: ${error}`),
  ),
  ...testingFiles.flatMap((path) =>
    testingFileErrors(path).map((error) => `${path}: ${error}`),
  ),
  ...barrelErrors(appFiles),
  ...crowdedFolders([...appFiles, ...testingFiles]),
  ...[...emptyDirsUnder(APP), ...emptyDirsUnder(TESTING)].map(
    (dir) => `${dir}/: empty`,
  ),
];

if (findings.length === 0) {
  console.log('check-structure: every file is in its place.');
} else {
  const mode = STRICT ? 'error' : 'report';
  console.log(
    `check-structure (${mode}): ${findings.length} files out of place.`,
  );
  for (const finding of findings) {
    console.log(`  ${finding}`);
  }
  process.exitCode = STRICT ? 1 : 0;
}
