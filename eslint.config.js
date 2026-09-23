// @ts-check
import { readdirSync } from 'node:fs';
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import angular from 'angular-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

const APP = 'src/app';

const FEATURES = ['desktop', 'profile', 'projects'];

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

const SHARED_LIBS = ['ui', 'windows'];

const libsOnDisk = readdirSync(`${APP}/shared`, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

if (
  libsOnDisk.join() !==
  [...SHARED_LIBS].sort((a, b) => a.localeCompare(b)).join()
) {
  throw new Error(
    `eslint.config.js: SHARED_LIBS lists [${SHARED_LIBS.join(', ')}] but ` +
      `${APP}/shared holds [${libsOnDisk.join(', ')}]. Each library needs its ` +
      'row in the dependency law.',
  );
}

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

const UNICORN_RULES = [
  'catch-error-name',
  'consistent-boolean-name',
  'consistent-function-scoping',
  'dom-node-dataset',
  'explicit-length-check',
  'no-array-callback-reference',
  'no-array-push-push',
  'no-for-each',
  'no-lonely-if',
  'no-negated-condition',
  'no-typeof-undefined',
  'no-useless-fallback-in-spread',
  'no-useless-spread',
  'no-useless-undefined',
  'no-zero-fractions',
  'numeric-separators-style',
  'prefer-array-find',
  'prefer-array-flat-map',
  'prefer-array-index-of',
  'prefer-array-some',
  'prefer-at',
  'prefer-code-point',
  'prefer-date-now',
  'prefer-dom-node-append',
  'prefer-export-from',
  'prefer-global-number-constants',
  'prefer-includes',
  'prefer-math-min-max',
  'prefer-math-trunc',
  'prefer-modern-math-apis',
  'prefer-native-coercion-functions',
  'prefer-negative-index',
  'prefer-node-protocol',
  'prefer-optional-catch-binding',
  'prefer-regexp-test',
  'prefer-set-has',
  'prefer-spread',
  'prefer-string-raw',
  'prefer-string-replace-all',
  'prefer-string-slice',
  'prefer-structured-clone',
  'prefer-ternary',
  'prefer-top-level-await',
  'prefer-type-error',
  'switch-case-braces',
  'throw-new-error',
];

const FEATURE_WHY =
  'a feature reaches down only, to core, the shared libraries and features/common; what two features share descends into features/common, or is joined in pages/';

const LIBRARY_WHY =
  'a shared library, extractable as it stands: it may use core, and neither the portfolio nor another library';

/**
 * @typedef {object} Zone
 * @property {string[]} files
 * @property {string} name
 * @property {string} why
 * @property {string[]} denies
 */

/** @type {Zone[]} */
const ZONES = [
  {
    files: [`${APP}/core/**/*.ts`],
    name: 'core/',
    why: 'infrastructure: it must not know a business concept exists',
    denies: ['features', 'shared', 'i18n', 'pages', 'root'],
  },
  ...SHARED_LIBS.map((lib) => ({
    files: [`${APP}/shared/${lib}/**/*.ts`],
    name: `shared/${lib}/`,
    why: LIBRARY_WHY,
    denies: [
      ...SHARED_LIBS.filter((other) => other !== lib).map(
        (other) => `library:${other}`,
      ),
      'features',
      'i18n',
      'pages',
      'root',
    ],
  })),
  {
    files: [`${APP}/features/common/**/*.ts`],
    name: 'features/common/',
    why: 'the shared kernel: it imports nothing from this repository at all',
    denies: ['core', 'shared', 'features', 'i18n', 'pages', 'root', 'escapes'],
  },
  ...FEATURES.map((feature) => ({
    files: [`${APP}/features/${feature}/**/*.ts`],
    name: `features/${feature}/`,
    why: FEATURE_WHY,
    denies: [
      ...FEATURES.filter((other) => other !== feature),
      'i18n',
      'pages',
      'root',
    ],
  })),
  {
    files: [`${APP}/i18n/**/*.ts`],
    name: 'i18n/',
    why: 'the texts and the addresses: they serve the pages and know none',
    denies: ['pages', 'root'],
  },
  {
    files: [`${APP}/pages/**/*.ts`],
    name: 'pages/',
    why: 'composition: it may reach for any feature, never for the root that boots it',
    denies: ['root'],
  },
];

/** @type {Record<string, string[]>} */
const GROUPS = {
  core: [
    '@app/core',
    '@app/core/**',
    '**/core',
    '**/core/**',
    '!@angular/core',
  ],
  shared: ['@shared/**', '@app/shared/**', '**/shared/**'],
  features: ['@app/features/**', '**/features/**'],
  i18n: ['@app/i18n', '@app/i18n/**'],
  pages: ['@app/pages/**', '**/pages/**'],
  root: ['@app/app.*', '**/app.*'],
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
  ...Object.fromEntries(
    SHARED_LIBS.map((lib) => [
      `library:${lib}`,
      [
        `@shared/${lib}`,
        `@shared/${lib}/**`,
        `@app/shared/${lib}`,
        `@app/shared/${lib}/**`,
        `**/shared/${lib}/**`,
        `**/${lib}`,
        `**/${lib}/**`,
      ],
    ]),
  ),
  escapes: ['../../*', '../../**', '@testing/**'],
};

/**
 * @param {{ zones: Zone[], groups: Record<string, string[]> }} law
 * @returns {import('eslint').Linter.Config[]}
 */
function zoneLaws({ zones, groups }) {
  return zones.map(({ files, name, why, denies }) => ({
    files,
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: denies.flatMap((denied) => groups[denied] ?? []),
              message: `${name} — ${why}. See docs/architecture/organisation.md, §2.`,
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
      '.claude/**',
    ],
  },

  {
    files: ['src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...angular.configs.tsRecommended,
      sonarjs.configs.recommended,
    ],
    plugins: { unicorn },
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
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
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { overrides: { constructors: 'no-public' } },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
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
      ...Object.fromEntries(
        UNICORN_RULES.map((rule) => [`unicorn/${rule}`, 'error']),
      ),
    },
  },

  {
    files: ['src/**/*.spec.ts', 'src/testing/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-member-accessibility': 'off',
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
      '@angular-eslint/template/no-any': 'error',
      '@angular-eslint/template/conditional-complexity': [
        'error',
        { maxComplexity: 4 },
      ],
      '@angular-eslint/template/cyclomatic-complexity': [
        'error',
        { maxComplexity: 12 },
      ],
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },

  ...zoneLaws({ zones: ZONES, groups: GROUPS }),

  {
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
    files: [`${APP}/**/*.ts`],
    ignores: [
      `${APP}/**/*.spec.ts`,
      `${APP}/core/services/browser/browser-environment.service.ts`,
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

  prettier,
);
