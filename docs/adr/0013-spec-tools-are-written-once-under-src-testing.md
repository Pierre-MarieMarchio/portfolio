# 0013 — Spec tools are written once, under src/testing/

- **Id**: 0013
- **Date**: 2026-10-05
- **Status**: accepted
- **Author**: operator

## Decision

A spec tool recopied from file to file comes into src/testing/, once: the browser of a spec (screen size, matchMedia, observers) in doubles/browser.double.ts, gestures in fixtures/pointer.fixture.ts, TestBed (platform, outputs, child component) in fixtures/testbed.fixture.ts, geometry of scene rules, scene watched and observatory of a spec in their file. Page scene and worker scene share ENGINE_OPTIONS. Integration suites move from src/integration/ to src/testing/integration/, which holds only .spec files. Unit specs stay next to what they test.

**Reason.** Same stubViewport written 5 times, same inject(platform) 11 times, same matchMedia stub under 6 names; specs lose roughly 400 lines without a test changing. Parity test between page and worker did not compare the same settings but because three copies looked alike; it now compares by construction. Under src/testing/, everything not shipped is in one place, and tsconfig.app.json excludes only one folder.

## Alternatives set aside

- src/test/ folder mirroring src/app/ to put each spec there: then you see only one file has its test, contrary to Angular convention. Rename src/testing/: the @testing/* alias would change in dozens of specs for barely clearer names. Local counters (closed += 1) and events that do not bubble stay in their spec: sharing them would change what their tests verify.

## References

merges: 0020-spec-tools-written-once-everything-test-related-under-src-te.md
