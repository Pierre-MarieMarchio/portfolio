# Documentation

Everything that describes the project without being code. The root `README.md` says how to run
the project; this folder holds the knowledge it rests on. Every tree has its own `README.md`.

```
docs/
  architecture/   how the code is arranged and how its parts behave (layers, reuse, flows,
                  desktop and pages, space scene, projects and texts)
  conventions/    how the code is written and checked (code, tooling)
  domain/         what the site is for: overview, business rules, glossary, content
  adr/            the decision record, one file per decision; docs/ADR.md is its index
  backlog/        what is known and left for later; docs/BACKLOG.md is its index
```

## Which document holds what

| Question                                    | Document                 |
| ------------------------------------------- | ------------------------ |
| Where a file goes, who may import what      | `architecture/layers.md` |
| Is there already a unit that does this      | `architecture/reuse.md`  |
| Why the code is the way it is               | `ADR.md`, then `adr/`    |
| How to add a project or change a text       | `domain/content.md`      |
| What a word of the domain names in the code | `domain/glossary.md`     |
| What is known to be missing or wrong        | `BACKLOG.md`             |

## Rules for these documents

- `architecture/`, `conventions/` and `domain/` are knowledge documents: a `knowledge-date:` and
  a `knowledge-commit:` header, one `## ` section per subject, a `path:line` citation of the code
  in every section. A line carried over from the former documentation also says
  `origin: <document:line> @ <commit>`; `status: declared` marks a line never checked against the
  code. `/refresh` brings them up to date when the code moves.
- A decision is recorded with `frame.sh decision`, never edited afterwards: a new decision
  supersedes it.
- A new tree (a new folder under `docs/`) gets its own `README.md` listing its documents, and a
  line in the map above.
