# 0004 — File suffixes say the role and how the file is used

- **Id**: 0004
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

Files and classes keep their role suffix, services included: window.component.ts / WindowComponent, clock.service.ts / ClockService. The list of suffixes is closed (organisation.md §3). angular.json fixes type for each schematic, so ng generate produces the same form.

A file's suffix says how it is used: placed in a template (.component, .directive), injected (.service, .manager and ngx-statewise pieces, .port), declared in a configuration (.provider, .guard, .resolver, .strategy), called (.rules, .helper, .signal), imported (.model, .data), instantiated in the scene (.engine, .motion, .renderer). .helper replaces .utils. .port unites a contract and its token, text slices included. Angular concepts (.pipe, .interceptor, .validator…) are in the list by right: we build with the framework, not against it. Only a role Angular does not know requires an entry in this journal. Each file goes, from its creation, in the folder of its role (helpers/, directives/…), never beside its user: nothing is to move the day a second user arrives. A role folder stays readable: one file per subject, at most 8, one subfolder per concept beyond.

**Reason.** The suffix tells the role before opening the file, and a search by role (*.service.ts) orders the repository at a glance.

When creating or reading a file, we know right away its role, who uses it and in what context.

## Alternatives set aside

- The convention of Angular's style guide since v20 (window.ts / Window), which ng generate follows by default in v22.
- .utils instead of .helper as the suffix for utility functions.

## References

origin: docs/architecture/decisions.md:226 @ b299e1d — `angular.json:13` ; source: docs/architecture/decisions.md:221 @ b299e1d ; source: docs/architecture/decisions.md:367 @ b299e1d ; merges: 0004-files-keep-their-role-suffix.md, 0009-suffixes-say-how-a-file-is-used.md
