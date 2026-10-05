# Conventions

How the code is written and checked. What a tool already applies (Prettier, the lint with zero
warnings, `package.json:18`, the comment check, `package.json:23`) is not restated here: these
documents hold what the tools do not check, and why.

## Documents

- [code.md](code.md) — naming, suffixes, comments, imports, styles; the lint fails on any warning (`package.json:18`)
- [tooling.md](tooling.md) — the check chain, tests, CI and deployment; comments are refused by `package.json:23`

Adding a document: same shape as every knowledge document: header lines `knowledge-date:` and
`knowledge-commit:`, one `## ` section per subject, a `path:line` citation in every section,
checked by `bash .claude/skills/check/knowledge.sh validate docs/conventions`.
