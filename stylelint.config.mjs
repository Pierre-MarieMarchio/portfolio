/**
 * Stylelint looks at what Prettier does not: whether a stylesheet is right,
 * not how it is laid out. The layout rules of the standard set are switched
 * off, since Prettier already decides them, and so are the notations the
 * design tokens are written in (`oklch(0.165 0.02 265)`), which say the same
 * colour either way.
 *
 * A rule the stylesheets break today starts as a warning. Step 3 of the plan
 * (docs/audit/README.md) migrates every `.scss` onto the tokens and the
 * shared partials, and turns those warnings into errors.
 *
 * @type {import('stylelint').Config}
 */
export default {
  extends: ['stylelint-config-standard-scss'],
  ignoreFiles: ['dist/**', 'coverage/**', 'node_modules/**', '.angular/**'],
  rules: {
    // Prettier's ground.
    'rule-empty-line-before': null,
    'comment-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'declaration-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'scss/double-slash-comment-empty-line-before': null,

    // The tokens' own notation.
    'lightness-notation': null,
    'hue-degree-notation': null,
    'alpha-value-notation': null,

    // Block, element and modifier: `.slot`, `.slot--index`.
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      { message: 'Expected a kebab-case class, with an optional --modifier' },
    ],
    'value-keyword-case': [
      'lower',
      { camelCaseSvgKeywords: true, ignoreKeywords: ['Helvetica', 'Arial'] },
    ],
    // Safari on iOS still reads only the prefixed form.
    'property-no-vendor-prefix': [
      true,
      { ignoreProperties: ['/text-size-adjust/'] },
    ],

    // Broken today, fixed by step 3.
    'media-feature-range-notation': ['context', { severity: 'warning' }],
    'declaration-property-value-keyword-no-deprecated': [
      true,
      { severity: 'warning' },
    ],
    // The empty stylesheets belong to the route markers, which step 5
    // folds into one component with none.
    'no-empty-source': [true, { severity: 'warning' }],
  },
};
