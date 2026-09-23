/** @type {import('stylelint').Config} */
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
    'rule-empty-line-before': null,
    'comment-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'declaration-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'scss/double-slash-comment-empty-line-before': null,

    'lightness-notation': null,
    'hue-degree-notation': null,
    'alpha-value-notation': null,

    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      { message: 'Expected a kebab-case class, with an optional --modifier' },
    ],
    'value-keyword-case': [
      'lower',
      { camelCaseSvgKeywords: true, ignoreKeywords: ['Helvetica', 'Arial'] },
    ],
    'property-no-vendor-prefix': [
      true,
      { ignoreProperties: ['/text-size-adjust/'] },
    ],

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
