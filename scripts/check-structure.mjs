// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, posix, relative, sep } from 'node:path';
import {
  CLASS_SUFFIXES,
  ENGINE_ZONES,
  ROLES_IN,
  ROLE_OF,
} from './structure-tables.mjs';

const APP = 'src/app';
const TESTING = 'src/testing';
const MAX_SOURCES = 8;
const STRICT = process.argv.includes('--strict');

const FILE =
  /^(?<name>[a-z0-9-]+)\.(?<suffix>[a-z]+)(?:\.golden)?(?<spec>\.spec)?\.(?<ext>ts|html|scss)$/;

/**
 * @param {string} dir
 * @returns {string[]}
 */
const filesUnder = (dir) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative('.', join(entry.parentPath, entry.name)).split(sep).join('/'),
    );

/**
 * @param {string} dir
 * @returns {string[]}
 */
const emptyDirsUnder = (dir) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((path) => readdirSync(path).length === 0);

const SINGLE_ZONES = new Set(['core', 'i18n', 'pages']);

/**
 * @param {string} inApp
 * @returns {{ zone: string, kind: string, rest: string[] } | null}
 */
const zoneOf = (inApp) => {
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

/**
 * @param {string} suffix
 * @returns {string}
 */
const classSuffix = (suffix) =>
  suffix.charAt(0).toUpperCase() + suffix.slice(1);

/**
 * @param {string} path
 * @param {string} suffix
 * @returns {string[]}
 */
const misnamedClasses = (path, suffix) => {
  const expected = classSuffix(suffix);
  return [
    ...readFileSync(path, 'utf8').matchAll(/export (?:abstract )?class (\w+)/g),
  ]
    .map((match) => match[1] ?? '')
    .filter((name) => !name.endsWith(expected))
    .map((name) => `class ${name} should end with ${expected}`);
};

/**
 * @param {string} kind
 * @param {string} suffix
 * @param {string} name
 * @param {string[]} rest
 * @returns {string[] | null}
 */
const pageComponentErrors = (kind, suffix, name, rest) => {
  if (kind !== 'pages' || suffix !== 'component') {
    return null;
  }
  const screenFile = /-(page|route)$/.test(name) && rest.length === 2;
  return screenFile
    ? []
    : ['a page folder holds only -page and -route components'];
};

/**
 * @param {string} suffix
 * @param {string} role
 * @param {string} first
 * @param {string} second
 * @returns {string[] | null}
 */
const engineRoleErrors = (suffix, role, first, second) => {
  if (suffix !== 'motion' && suffix !== 'renderer') {
    return null;
  }
  return first === 'engine' && second === role
    ? []
    : [`belongs in engine/${role}/`];
};

/**
 * @param {string} suffix
 * @param {string} name
 * @param {string[]} rest
 * @returns {string[]}
 */
const componentFolderErrors = (suffix, name, rest) =>
  suffix === 'component' && (rest.length !== 3 || rest[1] !== name)
    ? [`a component lives alone in components/${name}/`]
    : [];

/**
 * @param {string} role
 * @param {string[]} rest
 * @returns {string[]}
 */
const stateFolderErrors = (role, rest) =>
  role === 'states' && rest.length !== 3
    ? ['a state lives in states/<state>/']
    : [];

/**
 * @param {{ kind: string, zone: string }} where
 * @param {string} role
 * @returns {string[]}
 */
const roleAllowanceErrors = ({ kind, zone }, role) => {
  const engineHere = role === 'engine' && ENGINE_ZONES.has(zone);
  return (ROLES_IN[kind] ?? []).includes(role) || engineHere
    ? []
    : [`${zone}/ has no ${role}/ role`];
};

/**
 * @param {{ kind: string, zone: string, rest: string[] }} where
 * @param {string} suffix
 * @param {string} name
 * @param {string} role
 * @returns {string[]}
 */
const roleErrors = (where, suffix, name, role) => [
  ...roleAllowanceErrors(where, role),
  ...componentFolderErrors(suffix, name, where.rest),
  ...stateFolderErrors(role, where.rest),
];

/**
 * @param {{ kind: string, zone: string, rest: string[] }} where
 * @param {string} suffix
 * @param {string} name
 * @returns {string[]}
 */
const misplaced = (where, suffix, name) => {
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

/**
 * @param {string} file
 * @returns {{ name: string, suffix: string, spec: boolean, ext: string } | null}
 */
const parsedFileName = (file) => {
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

/**
 * @param {string} path
 * @param {string} file
 * @param {{ kind: string, zone: string, rest: string[] }} where
 * @returns {string[]}
 */
const namedFileErrors = (path, file, where) => {
  const parsed = parsedFileName(file);
  if (!parsed) {
    return ['has no suffix from the list (organisation.md §3.2)'];
  }
  const { name, suffix, spec, ext } = parsed;
  if (ext !== 'ts' && suffix !== 'component') {
    return ['only a component has a template or a stylesheet'];
  }
  const checksClassNames = !spec && ext === 'ts' && CLASS_SUFFIXES.has(suffix);
  return [
    ...misplaced(where, suffix, name),
    ...(checksClassNames ? misnamedClasses(path, suffix) : []),
  ];
};

/**
 * @param {string} file
 * @returns {string[]}
 */
const rootFileErrors = (file) =>
  /^app\.[a-z.]+\.ts$|^app\.component\.(html|scss)$/.test(file)
    ? []
    : ['the root holds only the app.*.ts files'];

/**
 * @param {string} path
 * @returns {string[]}
 */
const appFileErrors = (path) => {
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

/** @type {Record<string, string>} */
const TESTING_SUFFIX_OF = {
  fixtures: 'fixture',
  doubles: 'double',
  integration: 'spec',
};

/**
 * @param {string} path
 * @returns {string[]}
 */
const testingFileErrors = (path) => {
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

/**
 * @param {string[]} paths
 * @returns {string[]}
 */
const crowdedFolders = (paths) => {
  /** @type {Map<string, number>} */
  const sources = new Map();
  for (const path of paths) {
    const file = basename(path);
    if (
      file === 'index.ts' ||
      file.includes('.spec.') ||
      !file.endsWith('.ts')
    ) {
      continue;
    }
    sources.set(dirname(path), (sources.get(dirname(path)) ?? 0) + 1);
  }
  return [...sources]
    .filter(([, count]) => count > MAX_SOURCES)
    .map(
      ([dir, count]) =>
        `${dir}/: ${count} source files, over ${MAX_SOURCES}: split it by concept`,
    );
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
