# Overview

knowledge-date: 2026-10-05
knowledge-commit: b299e1d

## README.md — L'état

- State keeps a slug and never a copy of the project — `src/app/features/observatory/states/observatory/observatory.state.ts:27` — origin: README.md:157 @ b299e1d
- What the reader looks at and designates is the observatory state and the pause is the animation state (D14) — `src/app/features/observatory/states/observatory/observatory.state.ts:26` — origin: README.md:158 @ b299e1d

## docs/architecture/organisation.md — 2.2 L'état (ngx-statewise)

- observatory concept holds what the reader looks at, open and pinned windows, hover and selection, the scene and the home opening — `src/app/features/observatory/states/observatory/observatory.state.ts:25` — origin: docs/architecture/organisation.md:93 @ b299e1d
- profile concept holds the about window and the contact links — `src/app/features/profile/components/index.ts:1` — origin: docs/architecture/organisation.md:96 @ b299e1d

## docs/architecture/raisons/bureau-et-pages.md — `src/testing/integration/featured-count.spec.ts`

- featured-count spec provides FEATURED at 3 and 5 over 3 and 12 projects — `src/testing/integration/featured-count.spec.ts:69` — origin: docs/architecture/raisons/bureau-et-pages.md:344 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/rules/display-format.rules.ts`

- Phone under 620 px wide or under 500 px tall with coarse pointer, tablet with coarse pointer or no hover, desktop otherwise — `src/app/core/rules/display-format.rules.ts:11` — origin: docs/architecture/raisons/core-et-interface.md:66 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/core/services/head/document-head.service.ts`

- A page without description removes the previous one — `src/app/core/services/head/document-head.service.ts:51` — origin: docs/architecture/raisons/core-et-interface.md:128 @ b299e1d
- Links are canonical, one hreflang per language and x-default as French, rewritten each page — `src/app/core/services/head/document-head.service.ts:84` — origin: docs/architecture/raisons/core-et-interface.md:130 @ b299e1d

## docs/architecture/decisions.md — 2026-10-02 — Au téléphone, on passe d'un filtre de la liste à l'autre en balayant (D92, amende D57)

- List filters run in the order All, Professional, Personal — `src/app/features/projects/models/project-family.model.ts:7` — origin: docs/architecture/decisions.md:2793 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/components/social-links/`

- An external link opens in a new tab — `src/app/shared/ui/components/social-links/social-links.component.html:7` — origin: docs/architecture/raisons/core-et-interface.md:173 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/models/entrance.model.ts`

- Entrance says where the rest of the home page stands during the opening crossing: timed, held or shown — `src/app/shared/ui/models/entrance.model.ts:1` — origin: docs/architecture/raisons/core-et-interface.md:198 @ b299e1d
- withheld: the script holds the element until the first gesture or the end of the crossing (arrival state, opposite of shown) — `src/app/shared/ui/models/entrance.model.ts:1` — origin: docs/architecture/raisons/core-et-interface.md:204 @ b299e1d

## docs/architecture/raisons/core-et-interface.md — `src/app/shared/ui/directives/hover-focus.directive.ts`

- Hover of a marker, line or planet is written only for a mouse on a screen that can hover — `src/app/shared/ui/directives/hover-focus.directive.ts:55` — origin: docs/architecture/raisons/core-et-interface.md:237 @ b299e1d
- Focus keeps its effect except the one a touch press gives — `src/app/shared/ui/directives/hover-focus.directive.ts:39` — origin: docs/architecture/raisons/core-et-interface.md:242 @ b299e1d
- exited only follows what entered: an ignored focus produces no exit — `src/app/shared/ui/directives/hover-focus.directive.ts:48` — origin: docs/architecture/raisons/core-et-interface.md:244 @ b299e1d
