// @ts-check
import { readdirSync } from 'node:fs';
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

const APP = 'src/app';

/**
 * Every feature of the application, by folder name. `features/common` is not
 * one: it is the shared kernel, with a zone of its own below.
 *
 * Each feature gets a row denying every other one, so adding a feature means
 * adding its name here, and the check right after refuses to lint until that
 * is done. Without it, a new folder would lint with no law at all, and the
 * first cross-feature import would pass in silence.
 */
const FEATURES = ['projects', 'station'];

const onDisk = readdirSync(`${APP}/features`, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'common')
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

if (onDisk.join() !== [...FEATURES].sort((a, b) => a.localeCompare(b)).join()) {
  throw new Error(
    `eslint.config.js: FEATURES lists [${FEATURES.join(', ')}] but ` +
      `${APP}/features holds [${onDisk.join(', ')}]. Each feature needs its ` +
      'row in the dependency law.',
  );
}

/**
 * The names the code base already follows, written down so a new file follows
 * them too: camelCase for values and members, PascalCase for types and
 * classes, SCREAMING_CASE for module constants and injection tokens. Keys that
 * need quotes (`'data-view'`, `'--head-bottom'`) are the DOM's names, not
 * ours, and are left alone. A leading underscore marks a parameter that is
 * there for its position only.
 */
const NAMES = [
  { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
  { selector: 'typeLike', format: ['PascalCase'] },
  { selector: 'enumMember', format: ['PascalCase'] },
  {
    selector: 'classProperty',
    modifiers: ['static', 'readonly'],
    format: ['camelCase', 'UPPER_CASE'],
  },
  {
    selector: 'variable',
    modifiers: ['const'],
    format: ['camelCase', 'UPPER_CASE'],
  },
  { selector: 'import', format: ['camelCase', 'PascalCase'] },
  {
    selector: ['objectLiteralProperty', 'typeProperty'],
    modifiers: ['requiresQuotes'],
    format: null,
  },
];

const SIBLING_WHY =
  'no feature imports another feature; the need descends into features/common, or is joined in pages/';

/**
 * @typedef {object} Zone
 * @property {string} zone   A folder under `src/app/`.
 * @property {string} why    The sentence the lint error gives back.
 * @property {string[]} denies  Names of `GROUPS` this zone may not import.
 */

/**
 * The zones and what each is forbidden to reach for. Read a row as "this zone
 * may not import those". `core` sits at the bottom and knows nothing, `pages`
 * sits at the top and composes everything.
 */
/** @type {Zone[]} */
const ZONES = [
  {
    zone: 'core',
    why: 'infrastructure: it must not know a business concept exists',
    denies: ['features', 'shared', 'pages'],
  },
  {
    zone: 'shared/ui',
    why: 'reusable UI, almost extractable: it may use core and nothing above',
    denies: ['features', 'pages'],
  },
  {
    zone: 'features/common',
    why: 'the shared kernel: it imports nothing from this repository at all',
    denies: ['core', 'shared', 'features', 'pages', 'escapes'],
  },
  ...FEATURES.map((feature) => ({
    zone: `features/${feature}`,
    why: SIBLING_WHY,
    denies: [...FEATURES.filter((other) => other !== feature), 'pages'],
  })),
  {
    zone: 'pages',
    why: 'composition: it may reach for any feature and any shared component',
    denies: [],
  },
];

/**
 * What each denial name expands to, in every form an import can be written.
 * A pattern matches the import string, not a resolved path, so the alias form
 * and the relative forms are both listed.
 */
/** @type {Record<string, string[]>} */
const GROUPS = {
  core: ['@app/core', '@app/core/**', '**/core', '**/core/**'],
  shared: ['@shared/**', '@app/shared/**', '**/shared/**'],
  features: ['@app/features/**', '**/features/**'],
  pages: ['@app/pages/**', '**/pages/**'],
  // A sibling feature is denied by its bare name as well as by its alias:
  // `../../contact/services` climbs out of a feature without ever writing the
  // word `features`. No legitimate path inside one feature carries another
  // feature's name, so the bare form costs nothing and closes the climb. The
  // generic `../!(..)/**` would say it in one line, but the rule does not
  // read extglob, hence one group per feature.
  ...Object.fromEntries(
    FEATURES.map((feature) => [
      feature,
      [
        `@app/features/${feature}`,
        `@app/features/${feature}/**`,
        `**/features/${feature}/**`,
        `**/${feature}`,
        `**/${feature}/**`,
      ],
    ]),
  ),
  // Only features/common uses this: inside it, `../<sibling>` is legitimate
  // and `../../anything` always leaves the folder.
  escapes: ['../../*', '../../**', '@testing/**'],
};

/**
 * Turns the table of zones into one lint block each.
 *
 * @param {{ app: string, zones: Zone[], groups: Record<string, string[]> }} law
 * @returns {import('eslint').Linter.Config[]}
 */
function zoneLaws({ app, zones, groups }) {
  return zones
    .filter(({ denies }) => denies.length > 0)
    .map(({ zone, why, denies }) => ({
      files: [`${app}/${zone}/**/*.ts`],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: denies.flatMap((name) => groups[name] ?? []),
                message: `${zone}/ — ${why}. See README.md, "La loi de dépendance".`,
              },
            ],
          },
        ],
      },
    }));
}

export default defineConfig(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.angular/**',
      'docs/maquette/**',
      // Local tooling, ignored by git: an agent's worktree lives here while
      // it works, and its unfinished code is not this checkout's.
      '.claude/**',
    ],
  },

  {
    files: ['src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    // Type-aware, because banning `any` has to see the ones nobody wrote: a
    // library returning `any`, a `JSON.parse`, a matcher. `no-explicit-any`
    // alone only catches the keyword.
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // `any` is banned from this repository, written or inherited. What is
      // not known yet is `unknown`, and gets narrowed before it is used.
      '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true }],
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-declaration-merging': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      // `public` / `private` / `protected` written out on every member: in a
      // component, it is what says which members the template may use.
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { overrides: { constructors: 'no-public' } },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
    },
  },

  {
    // Size, shape and names, as errors: the code obeys them, and the ground
    // won cannot be lost. The files the audit of September 23
    // (docs/audit/README.md) has not reached yet keep them as warnings, in
    // the block right after, each with the step that takes it on.
    files: ['src/**/*.ts'],
    rules: {
      'max-lines': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 60, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/naming-convention': ['error', ...NAMES],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/prefer-signals': 'error',
    },
  },

  {
    // Not reached yet: the sheets' data (step 6 splits it per project) and
    // the object with its engine (step 9, within the limits of D2).
    files: [
      `${APP}/features/projects/data/sheets.data.ts`,
      `${APP}/features/station/components/object/**/*.ts`,
    ],
    rules: {
      'max-lines': [
        'warn',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'warn',
        { max: 60, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ['warn', 10],
      'max-depth': ['warn', 3],
      'max-params': ['warn', 4],
    },
  },

  {
    // The canvas engine writes its physics as the formulas do: `R` a radius,
    // `Q` a quaternion, `M0` a mean anomaly at the epoch. Spelled out, they
    // would read worse next to the equations they come from.
    files: [`${APP}/features/station/components/object/engine/**/*.ts`],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['variable', 'parameter', 'property'],
          filter: { regex: '^[A-Z][A-Za-z]?[0-9]?$', match: true },
          format: null,
        },
        ...NAMES,
      ],
    },
  },

  {
    // Specs build throwaway doubles; the accessibility rule aimed at the
    // application's surface only gets in the way there.
    files: ['src/**/*.spec.ts', 'src/testing/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-member-accessibility': 'off',
      // A spec is one `describe` holding its cases: its length is the number
      // of behaviours it pins, not a function grown too big.
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },

  {
    files: ['src/**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // The template's own way of writing `any`.
      '@angular-eslint/template/no-any': 'error',
      // A template stays a view: a branch that needs more than this belongs
      // in a `computed` of its component.
      '@angular-eslint/template/conditional-complexity': [
        'warn',
        { maxComplexity: 4 },
      ],
      '@angular-eslint/template/cyclomatic-complexity': [
        'warn',
        { maxComplexity: 12 },
      ],
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },

  // The dependency law, enforced rather than documented.
  ...zoneLaws({ app: APP, zones: ZONES, groups: GROUPS }),

  {
    // Only the manager reads the state and only the updater writes it; the
    // rest of the application talks to the manager. The base rule is used
    // on purpose: the zone laws own `@typescript-eslint/no-restricted-imports`,
    // and a second block on the same rule would replace them, not add to them.
    files: [`${APP}/**/*.ts`],
    ignores: [`${APP}/**/states/**`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/*.state', '**/*.updater'],
              message:
                'state and updater stay behind the manager: import the manager from the states barrel.',
            },
          ],
        },
      ],
    },
  },

  {
    // The prerender runs with no window: a direct browser global either
    // throws at build time or ships a page that was rendered wrong. This
    // service is the only door, and is inert on the server.
    files: [`${APP}/**/*.ts`],
    ignores: [
      `${APP}/**/*.spec.ts`,
      `${APP}/core/services/browser-environment.service.ts`,
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        ...[
          'window',
          'document',
          'navigator',
          'localStorage',
          'sessionStorage',
          'matchMedia',
          'requestAnimationFrame',
          'cancelAnimationFrame',
        ].map((name) => ({
          name,
          message: `${name} is not there at prerender: go through BrowserEnvironment, and extend it if it lacks it.`,
        })),
      ],
      'no-restricted-properties': [
        'error',
        ...['localStorage', 'sessionStorage', 'window', 'document'].map(
          (property) => ({
            object: 'globalThis',
            property,
            message: `globalThis.${property} dodges the same ban: go through BrowserEnvironment.`,
          }),
        ),
      ],
    },
  },

  // Last: switches off every rule Prettier already decides.
  prettier,
);
