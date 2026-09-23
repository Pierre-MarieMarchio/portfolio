/**
 * Stylelint looks at what Prettier does not: whether a stylesheet is right,
 * not how it is laid out. The layout rules of the standard set are switched
 * off, since Prettier already decides them, and so are the notations the
 * design tokens are written in (`oklch(0.165 0.02 265)`), which say the same
 * colour either way.
 *
 * A rule the stylesheets still break is a warning, until the step of the
 * audit plan (docs/audit/README.md) that fixes it turns it into an error.
 *
 * @type {import('stylelint').Config}
 */
export default {
  extends: ['stylelint-config-standard-scss'],
  ignoreFiles: ['dist/**', 'coverage/**', 'node_modules/**', '.angular/**'],
  overrides: [
    {
      files: ['src/assets/styles/_tokens.scss'],
      rules: { 'declaration-property-value-disallowed-list': null },
    },
  ],
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

    // The values a token holds are written once, in the tokens: a literal
    // gutter, control radius or glass here is a token bypassed, and the
    // copies drift apart.
    'declaration-property-value-disallowed-list': [
      {
        '/.*/': ['/clamp\\(20px, 4vw, 44px\\)/'],
        'border-radius': ['2px'],
        'backdrop-filter': ['/blur\\(/'],
      },
      { message: 'Use the design token (src/assets/styles/_tokens.scss)' },
    ],
  },
};
