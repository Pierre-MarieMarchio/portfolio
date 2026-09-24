// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, posix, relative, sep } from 'node:path';

const APP = 'src/app';
const TESTING = 'src/testing';
const MAX_SOURCES = 8;
const STRICT = process.argv.includes('--strict');

/** @type {Record<string, string>} */
const ROLE_OF = {
  component: 'components',
  directive: 'directives',
  pipe: 'pipes',
  service: 'services',
  manager: 'states',
  state: 'states',
  action: 'states',
  updater: 'states',
  effect: 'states',
  port: 'ports',
  provider: 'providers',
  guard: 'guards',
  resolver: 'resolvers',
  interceptor: 'interceptors',
  validator: 'validators',
  strategy: 'strategies',
  rules: 'rules',
  helper: 'helpers',
  signal: 'signals',
  model: 'models',
  data: 'data',
  engine: 'engine',
  motion: 'motions',
  renderer: 'renderers',
};

const CLASS_SUFFIXES = new Set([
  'component',
  'directive',
  'pipe',
  'service',
  'manager',
  'state',
  'effect',
  'strategy',
  'engine',
  'motion',
  'renderer',
]);

/** @type {Record<string, string[]>} */
const ROLES_IN = {
  core: [
    'services',
    'ports',
    'strategies',
    'interceptors',
    'models',
    'rules',
    'helpers',
    'signals',
  ],
  'shared/ui': [
    'components',
    'directives',
    'pipes',
    'services',
    'validators',
    'signals',
    'ports',
    'models',
    'data',
  ],
  feature: [
    'components',
    'directives',
    'pipes',
    'services',
    'states',
    'ports',
    'validators',
    'rules',
    'models',
    'data',
  ],
  'shared/windows': ['components', 'directives', 'services', 'models', 'ports'],
  'shared/space-scene': [
    'components',
    'directives',
    'services',
    'engine',
    'rules',
    'models',
    'ports',
  ],
  'features/common': ['ports', 'models'],
  i18n: ['services', 'providers', 'guards', 'models', 'rules', 'data'],
  pages: ['resolvers', 'guards', 'providers'],
};

const ENGINE_ZONES = new Set(['shared/space-scene']);

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

/**
 * @param {string} inApp
 * @returns {{ zone: string, kind: string, rest: string[] } | null}
 */
const zoneOf = (inApp) => {
  const parts = inApp.split('/');
  const [first, second] = parts;
  if (first === 'core' || first === 'i18n' || first === 'pages') {
    return { zone: first, kind: first, rest: parts.slice(1) };
  }
  if (first === 'shared' && second) {
    return {
      zone: `shared/${second}`,
      kind: `shared/${second}`,
      rest: parts.slice(2),
    };
  }
  if (first === 'features' && second === 'common') {
    return {
      zone: 'features/common',
      kind: 'features/common',
      rest: parts.slice(2),
    };
  }
  if (first === 'features' && second) {
    return {
      zone: `features/${second}`,
      kind: 'feature',
      rest: parts.slice(2),
    };
  }
  return null;
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
 * @param {{ kind: string, zone: string, rest: string[] }} where
 * @param {string} suffix
 * @param {string} name
 * @returns {string[]}
 */
const misplaced = ({ kind, zone, rest }, suffix, name) => {
  const role = ROLE_OF[suffix] ?? '';
  const [first = '', second = ''] = rest;
  if (kind === 'pages' && suffix === 'component') {
    const screenFile = /-(page|route)$/.test(name) && rest.length === 2;
    return screenFile
      ? []
      : ['a page folder holds only -page and -route components'];
  }
  if (suffix === 'motion' || suffix === 'renderer') {
    return first === 'engine' && second === role
      ? []
      : [`belongs in engine/${role}/`];
  }
  if (first !== role) {
    return [`belongs in ${role}/`];
  }
  const allowed = ROLES_IN[kind] ?? [];
  const engineHere = role === 'engine' && ENGINE_ZONES.has(zone);
  const errors =
    allowed.includes(role) || engineHere
      ? []
      : [`${zone}/ has no ${role}/ role`];
  if (suffix === 'component' && (rest.length !== 3 || second !== name)) {
    errors.push(`a component lives alone in components/${name}/`);
  }
  if (role === 'states' && rest.length !== 3) {
    errors.push('a state lives in states/<state>/');
  }
  return errors;
};

/**
 * @param {string} path
 * @returns {string[]}
 */
const appFileErrors = (path) => {
  const inApp = posix.relative(APP, path);
  const file = basename(path);
  if (!inApp.includes('/')) {
    return /^app\.[a-z.]+\.ts$|^app\.component\.(html|scss)$/.test(file)
      ? []
      : ['the root holds only the app.*.ts files'];
  }
  const where = zoneOf(inApp);
  if (!where) {
    return ['outside every zone'];
  }
  if (file === 'index.ts') {
    return [];
  }
  const parsed = FILE.exec(file)?.groups;
  if (!parsed?.suffix || !(parsed.suffix in ROLE_OF)) {
    return ['has no suffix from the list (organisation.md §3.2)'];
  }
  const { name = '', suffix, spec, ext } = parsed;
  if (ext !== 'ts' && suffix !== 'component') {
    return ['only a component has a template or a stylesheet'];
  }
  const errors = misplaced(where, suffix, name);
  if (!spec && ext === 'ts' && CLASS_SUFFIXES.has(suffix)) {
    errors.push(...misnamedClasses(path, suffix));
  }
  return errors;
};

/**
 * @param {string} path
 * @returns {string[]}
 */
const testingFileErrors = (path) => {
  const [role, file = '', ...deeper] = posix.relative(TESTING, path).split('/');
  const expected =
    role === 'fixtures' ? 'fixture' : role === 'doubles' ? 'double' : null;
  if (!expected || deeper.length > 0) {
    return ['src/testing holds fixtures/ and doubles/ only'];
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
