# 0014 — CI and deployment: staging on dev, production on main, quality gate, no host detail in the repository

- **Id**: 0014
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

The deploy job runs on main for both a push and a manual workflow_dispatch run; only pull requests do not deploy.

PRs go to dev; a general PR dev → main publishes. A push to dev deploys staging, a push to main does production; one deploy job, parameterized by target, with concurrency group per target. Staging lives under a path of production, https://pm-marchio.fr/staging/: built with base /staging/ and STAGING_SITE_URL, sent to www/staging, and closed by its own .htaccess: HTTP Basic auth (htpasswd file from CI using STAGING_USER and STAGING_PASSWORD secrets, stored outside www), X-Robots-Tag: noindex, nofollow, 404 pages rewritten to /staging/404.html and /staging/en/404.html, robots.txt forbidding all, no sitemap. Production mirror excludes this folder from its --delete, to the first folder the site lacks.

Twelve findings from the first analysis of main are fixed without visible change: role="status" becomes <output> (window buttons, sheet, and contact rail); two optional chains, including view-focus.service.ts, become explicit true checks; two selector pairs merge; structure check splits under complexity threshold; prerender check regex is linear; replaceAll is used. Others are excluded in sonar-project.properties (sonar.issue.ignore.multicriteria), each limited to its file except the first: typescript:S7773 (Number.NaN), on src/** (contradicts lint rule unicorn/prefer-global-number-constants which takes precedence); Web:S6822, card-carousel (role="list" restores list semantics that Safari removes with list-style: none); Web:S6819, segmented and language-switch (toggle buttons and links, not fields; fieldset would change meaning); typescript:S7754, observatory-page (find is a business method of the manager, not array find); Web:S6825, space-scene (aria-hidden canvas never focusable).

The SITE_URL and BASE_HREF defaults in ci.yml and angular.json point at the OVH site, not at GitHub Pages

The hosting account path lives only in the STAGING_HTPASSWD_PATH repository variable; ci.yml carries no hard-coded default

**Reason.** On 2026-09-28, four merges landed on main without GitHub triggering the CI. When rerun manually, the job passed, but the site did not deploy: a commit had to be pushed for nothing. A manual run passes through the same checks as a push, and deployment still waits for lint, build, and sonar.

The operator wants to see and show a version before publishing it, without the public or engines accessing it. OVH free hosting accepts only one site: a staging subdomain could not be added. Without exclusion, each production deploy would delete staging. Verified with real SFTP server and lftp 4.9 in Docker, running workflow blocks: staging survives production, extra file at root is removed, guard refuses any folder outside production; and in Apache 2.4: 401 without credentials, 200 and X-Robots-Tag with, 404 from staging in French and English, production public. Real build under /staging/ opens without error, links and canonical under /staging/.

A first analysis counts all code as new: the gate failed and blocked deployment; since then it only judges new code, but an open finding left unaddressed eventually masks new ones. Excluding by config file keeps the decision in the repo, reviewed in PR, without NOSONAR in code (D10) or trace-free clicks in the interface. Naive rewrite of view-focus (heading?.ownerDocument.activeElement === heading) emptied the focus claim before the title existed: two tests reject it.

Chosen by the operator at the onboarding interview; ci.yml:27-28 and angular.json:43 still default to GitHub Pages after the move to OVH

Chosen by the operator at the onboarding interview; the default at ci.yml:189 exposes the hosting account name in a public repository

## Alternatives set aside

- Separate workflow for deployment: it would rebuild, or fetch the artifact from another run, which D48 already rejected.
- Subdomain (free offer) or second paid hosting.
- Staging only noindex: anyone guessing the address would see it.
- Follow Sonar against lint on Number.NaN: thirteen lint errors
- Mark findings by hand in the interface: reasoning is lost.
- No default, a missing variable fails the CI
- Keep GitHub Pages as fallback
- Keep the hard-coded default

## References

origin: docs/architecture/decisions.md:1693 @ b299e1d — `.github/workflows/ci.yml:12` ; source: docs/architecture/decisions.md:1691 @ b299e1d ; origin: docs/architecture/decisions.md:2871 @ b299e1d — status: declared ; origin: docs/architecture/decisions.md:2875 @ b299e1d — `.github/workflows/ci.yml:160` ; origin: docs/architecture/decisions.md:2876 @ b299e1d — `.github/workflows/ci.yml:309` ; origin: docs/architecture/decisions.md:2891 @ b299e1d — `.github/workflows/ci.yml:168` ; origin: docs/architecture/decisions.md:2929 @ b299e1d — `.github/workflows/ci.yml:299` ; origin: docs/architecture/decisions.md:2932 @ b299e1d — status: declared ; origin: docs/architecture/decisions.md:2950 @ b299e1d — `.github/workflows/ci.yml:127` ; origin: docs/architecture/decisions.md:2954 @ b299e1d — `.github/workflows/ci.yml:211` ; origin: docs/architecture/decisions.md:2959 @ b299e1d — `.github/workflows/ci.yml:287` ; Site moves from GitHub Pages to OVH hosting of its domain: docs/architecture/decisions.md:2868 @ b299e1d ; Deploy over SFTP with pinned server key: docs/architecture/decisions.md:2927 @ b299e1d ; CI and continuous deployment to GitHub Pages: docs/architecture/decisions.md:25 @ b299e1d ; source: docs/architecture/decisions.md:2947 @ b299e1d
origin: docs/architecture/decisions.md:2950 @ b299e1d — `.github/workflows/ci.yml:128`
origin: docs/architecture/decisions.md:2955 @ b299e1d — `.github/workflows/ci.yml:211` ; origin: docs/architecture/decisions.md:1569 @ b299e1d — `.github/workflows/ci.yml:31` ; origin: docs/architecture/decisions.md:1577 @ b299e1d — `.github/workflows/ci.yml:27` ; origin: docs/architecture/decisions.md:2520 @ b299e1d — `sonar-project.properties:15` ; origin: docs/architecture/decisions.md:2521 @ b299e1d — `sonar-project.properties:18` ; origin: docs/architecture/decisions.md:2523 @ b299e1d — `eslint.config.js:96` ; origin: docs/architecture/decisions.md:2525 @ b299e1d — `sonar-project.properties:20` ; origin: docs/architecture/decisions.md:2539 @ b299e1d — status: declared ; CI split, coverage, Sonar, deploys its own build: docs/architecture/decisions.md:1567 @ b299e1d ; source: docs/architecture/decisions.md:2511 @ b299e1d ; merges: 0021-manual-ci-run-deploys-too.md, 0026-dev-branch-deploys-password-protected-staging-under-staging.md, 0024-sonarqube-cloud-findings-fixed-or-excluded-in-writing.md, 0055-the-site-url-and-base-href-defaults-in-ci-yml-and-angular-js.md, 0056-the-hosting-account-path-lives-only-in-the-staging-htpasswd.md
