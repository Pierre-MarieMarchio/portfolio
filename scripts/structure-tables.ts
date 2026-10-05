export const ROLE_OF: Record<string, string> = {
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
  tracker: 'trackers',
  worker: 'engine',
};

export const EXTENSIONS_OF: Record<string, string[]> = {
  component: ['ts', 'html', 'scss'],
  data: ['ts', 'json'],
};

export const CLASS_SUFFIXES = new Set([
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
  'tracker',
]);

export const ROLES_IN: Record<string, string[]> = {
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
  'shared/windows': [
    'components',
    'directives',
    'services',
    'rules',
    'trackers',
    'models',
    'ports',
  ],
  'shared/mobile-nav': [
    'components',
    'directives',
    'services',
    'rules',
    'models',
    'ports',
  ],
  'shared/space-scene': [
    'components',
    'directives',
    'services',
    'engine',
    'rules',
    'trackers',
    'models',
    'ports',
  ],
  'features/common': ['ports', 'models'],
  i18n: [
    'services',
    'providers',
    'guards',
    'resolvers',
    'models',
    'rules',
    'data',
  ],
  pages: [],
};

export const ENGINE_ZONES = new Set(['shared/space-scene']);

interface UnitException {
  unit: RegExp;
  why: `bundle size: ${string}` | `internal unit: ${string}`;
}

export const BARREL_EXCEPTIONS: UnitException[] = [
  {
    unit: /^src\/app\/features\/[a-z-]+\/states\/[a-z-]+\/[a-z-]+\.(?:state|updater|action)\.ts$/,
    why: 'internal unit: the state, its updater and its actions are written through the manager alone, which the states barrel exports',
  },
  {
    unit: /^src\/app\/i18n\/data\/(?:en|fr)(?:-profile)?\.data\.ts$/,
    why: 'bundle size: the catalogs are loaded by import() on demand, and a barrel export moves them into the initial bundle (544.60 kB to 551.81 kB)',
  },
  {
    unit: /^src\/app\/shared\/mobile-nav\/services\/swipe-steps\.service\.ts$/,
    why: 'bundle size: the swipe service is loaded by import() on demand, and a barrel export moves it into the initial bundle (544.60 kB to 547.46 kB)',
  },
];
