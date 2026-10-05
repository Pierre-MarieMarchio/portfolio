# Architecture

How the code is arranged and how its parts behave. Every line of these documents cites the code
that bears it out (`path:line`) and the sentence of the former documentation it comes from
(`origin: <document:line> @ <commit>`); a line marked `status: declared` could not be checked
against the code.

## Documents

- [layers.md](layers.md) — the layers, what each may contain and import; held by the lint
  (`eslint.config.ts:169`) and by check:structure (`scripts/check-structure.ts:17`)
- [reuse.md](reuse.md) — the reusable units, one line each: what, when to use, when not, callers
- [flows.md](flows.md) — the entry points and the main paths through the code
- [desktop-and-pages.md](desktop-and-pages.md) — the desktop, its windows, the phone sheets and the pages
- [space-scene.md](space-scene.md) — the canvas scene: engine, worker, camera, rendering
- [projects-and-texts.md](projects-and-texts.md) — the project catalogue and the interface texts

Adding a document: a new document here follows the same shape: `knowledge-date:` and `knowledge-commit:` header
lines, one `## ` section per subject, a `path:line` citation in every section. It is checked by
`bash .claude/skills/check/knowledge.sh validate docs/architecture`, and listed above.
