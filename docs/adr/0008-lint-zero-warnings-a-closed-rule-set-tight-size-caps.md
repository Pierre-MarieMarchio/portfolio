# 0008 — Lint: zero warnings, a closed rule set, tight size caps

- **Id**: 0008
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

Lint runs with --max-warnings 0. Rules from eslint-plugin-sonarjs (full recommended profile) and a closed list of eslint-plugin-unicorn rules (those SonarLint reprises, plus consistent-boolean-name, switch-case-braces, no-useless-undefined, prefer-ternary) are all errors. Templates included. no-null and prefer-global-this stay out. The engine no longer has its own block for size or formula names. zones i18n/ and pages/ have their rules; no zone climbs to root app.*.ts. The remaining settings are per-file-category rules, each with its reason in this journal: specs and src/testing/ (no access modifiers, no line ceiling); @ts-expect-error with reason (the only way to test a type rejects a value); states/ (only manager imports state and updater); core/services/browser/ (sole folder touching browser globals, forbidden elsewhere); features/common/ (imports nothing from the repository; ../../ always exits; @testing has no place); _tokens.scss (where values that declaration-property-value-disallowed-list forbids elsewhere are written).

For production code in src/: max-lines-per-function 40 (was 60), complexity 8 (was 10), max-depth 2 (was 3), sonarjs/cognitive-complexity 10 (sonarjs default was 15); max-params 4 and max-lines 300 unchanged. The same six rules now apply to scripts/**/*.mjs, which had no lint rules. Specs and src/testing/ stay exempt from size and complexity rules, as they already were from length. No exception per file, no eslint-disable.

**Reason.** One rule in warning is held by nothing: CI passed with 43 warnings. A category setting is the rule of that category, not an exception.

Clean code work requested by operator: long functions hard to read at a glance. Measured on src/ (1 896 functions): each maximum touched exactly the old ceiling, which limited without guiding; median 4 lines, p90 17. 24 of the 30 heaviest functions were in the scene. They were split by zone, behavior unchanged, specs unchanged: scene (#167, #169), mobile-nav, core and i18n (#172), scripts (#171), then observatory and windows here. The thresholds chosen are those the code holds after this work.

## Alternatives set aside

- Full unicorn preset (roughly 1300 issues, many contrary to project choices)
- Three parameters max: 65 functions to revisit, mostly geometry where four values go together.
- Rule on names: the scene has consistent geometry notation (dx, w, az); opaque names were renamed in split functions.
- 250 lines per file: 13 files to cut for weak reading gain.

## References

origin: docs/architecture/decisions.md:256 @ b299e1d — `package.json:18` ; origin: docs/architecture/decisions.md:257 @ b299e1d — `eslint.config.js:70` ; origin: docs/architecture/decisions.md:410 @ b299e1d — `eslint.config.js:70` ; origin: docs/architecture/decisions.md:414 @ b299e1d — `eslint.config.js:70` ; source: docs/architecture/decisions.md:406 @ b299e1d ; source: docs/architecture/decisions.md:254 @ b299e1d ; origin: docs/architecture/decisions.md:3164 @ b299e1d — `eslint.config.js:320` ; origin: docs/architecture/decisions.md:3167 @ b299e1d — `eslint.config.js:337` ; source: docs/architecture/decisions.md:3162 @ b299e1d ; merges: 0011-lint-rules-and-per-category-settings.md, 0029-lint-caps-functions-at-40-lines-complexity-8-depth-2-scripts.md
