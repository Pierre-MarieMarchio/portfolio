# Domain

What the site is for and the rules it must hold, independent of how the code is arranged. The
projects it shows are described once, in `src/app/features/projects/data/projects.data.ts:5`.

## Documents

- [overview.md](overview.md) — what the repository does and for whom
- [business-rules.md](business-rules.md) — the rules the code must hold, each with where it is applied
- [glossary.md](glossary.md) — the domain's terms and the unit of code each one names
- [content.md](content.md) — adding a project, changing a text; the projects are read from `src/app/features/projects/data/projects.data.ts:5`

Adding a document: same shape as every knowledge document: header lines `knowledge-date:` and
`knowledge-commit:`, one `## ` section per subject, a `path:line` citation in every section,
checked by `bash .claude/skills/check/knowledge.sh validate docs/domain`.
