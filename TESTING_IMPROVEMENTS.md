# Testing improvements — data isolation & test independence

**Status (2026-08): Phase 1 and Phase 2 are implemented.** `globalThis.__createdProjectName`
is gone; every spec gets its target project from the `project` fixture
(`tests/fixtures/project.fixture.js`), backed by a run context
(`tests/.auth/run-context.json`) written once by `tests/auth.setup.js` via
`tests/helpers/project.js`'s `ensureTestProject` — which creates the project
via the UI on a brand-new account, or adopts+renames an existing leftover
project if the account can't create a new one (see that file for the
project-limit fallback). Edit/delete specs create their own prerequisite
records via `tests/helpers/*.helper.js` instead of depending on a numbered
sibling file having run first. Phase 3 (marker-based cleanup of leaf
entities) and Phase 4 (further `data-testid` adoption) remain open — see
below, now historical context for what led here.

## The two problems

### 1. No teardown → data piles up on a live project
Every spec creates records (clients, products, competitors, channels, risks,
tasks, MVPs…) on the **live "Dior Brand" project on prod**, and nothing deletes
them. Each full run leaves duplicates behind, so the project drifts further from
a known state and assertions like "the created item is visible" get noisier over
time.

### 2. Tests depend on each other
- Specs are **numbered by run order** and later ones assume data created
  earlier exists (a client from `04`, a team member from `14`, …).
- `02` and `03` share state through **`globalThis.__createdProjectName`**, which
  only works in a single serial process and breaks with sharding, `-g` filters,
  or running one file in isolation.
- A failure mid-suite **cascades** into every dependent spec after it.

## Guiding principle

Each run should start from a **known, disposable state** and clean up after
itself, so re-runs are idempotent and any spec can run alone.

## Options (roughly increasing effort)

| # | Approach | Isolation | Effort | Needs backend? |
|---|----------|-----------|--------|----------------|
| A | Add teardown that deletes what each run created (by unique marker) | Partial (prod stays clean) | Low–Med | Delete endpoints |
| B | Create a fresh project per run, run the suite against it, delete it at the end | Strong | Medium | Create/delete project |
| C | Dedicated test environment + DB reset between runs | Full | High | Infra + reset hook |

## Recommended path (staged)

### Phase 1 — kill the hidden coupling (low effort)
- Remove `globalThis.__createdProjectName`. Replace with an explicit
  **run context**: a fixture (or a small `test-data/run.json` written by
  `auth.setup.js`) holding the target project's name/id. Specs read it instead
  of reaching into globals or hardcoding `'Dior Brand'`.
- Result: specs stop leaking state through the process; a single spec becomes
  runnable on its own.

### Phase 2 — per-run disposable project (biggest win)
- In `auth.setup.js` (or a `projectSetup` project), **create a fresh project**
  named `Autotest <runId>` — ideally via the **API** (fast, reliable), UI only
  as a fallback. Store its id in the run context.
- Point every spec's navigation at that project instead of `'Dior Brand'`.
- Add a **`globalTeardown`** that deletes the project (and its children) via API
  using the saved auth token.
- Result: idempotent re-runs, no prod pollution, no cross-run drift. This is the
  largest change because every spec's `openX(page)` currently assumes the
  project already exists — they'd navigate via the run-context project instead.

### Phase 3 — defensive cleanup for anything still created on shared data
- For records that must live on a shared project, tag names with
  `_test_<runId>` and have `globalTeardown` delete everything matching the
  marker via API. Prefer API deletes over UI (UI teardown is slow and flaky).

### Phase 4 — de-flake and widen coverage (parallel track)
- Replace positional `.nth()` locators with `data-testid` (request from the app
  team) so the ongoing component refactors don't break tests.
- Add negative/validation coverage (currently almost all happy-path) and the
  401 → token-refresh flow.

## Trade-offs / decisions to make with the team

- **Can the frontend point at a non-prod backend?** If a staging/seedable API
  exists, Option C becomes viable and is the cleanest long-term. If prod is the
  only backend with the test account, go with B + teardown.
- **Are there API endpoints for create/delete of projects and child entities?**
  They make setup/teardown fast and reliable; without them, fall back to UI
  create + UI delete (slower, flakier), which makes Phase 2 heavier.
- **Serial vs. isolated:** once Phase 2 lands, most specs can drop the strict
  numbering and the `describe.serial` coupling, enabling `fullyParallel` later.

## Suggested order of work
1. Phase 1 (run context) — small, unblocks single-spec runs.
2. Phase 2 (disposable project + teardown) — the real fix for both problems.
3. Phase 3 (marker cleanup) for any residual shared-data writes.
4. Phase 4 (testids + coverage) continuously.
