# GetLaunched — Release Checklist

Standard pre-release regression checklist. Companion to `PROJECT_KNOWLEDGE.md`
(app map, fields, cross-module relationships) — read that first if a module
here is unfamiliar. Organized module-by-module; each module is checked
against the same nine lenses so nothing gets skipped just because it "seems
simple."

**How to use this**: work top to bottom for a full release; for a hotfix,
run Section 0 (Global) plus every module the change touches **and** every
module listed as a downstream dependency in `PROJECT_KNOWLEDGE.md` §8
(Cross-module relationships). Log every failure with module, category, and
repro steps. See §22 (Release Sign-off) for the go/no-go gate.

Target project for manual passes: **"Dior Brand"** (prod) unless a disposable
project is available — see the data-hygiene note in §0.

---

## 0. Global / Cross-cutting

These apply to *every* module below; check once per release rather than
re-deriving per module, but re-verify if the change touches shared UI
infrastructure (sidebar, modal system, dropdown component, toast system).

### Happy Path
- [ ] Sidebar renders all sections (Dashboard, Magic triangle + 3 sub-links,
      Operations, Financial + 2 sub-links, Implementation, Business plan) for
      a normal project.
- [ ] Breadcrumbs match the current page path on every section.
- [ ] Toast/inline success message appears after every create/update/delete
      across every module (`created|success|saved|added|updated|deleted`).

### Validation
- [ ] Required-field validation text is present and readable (not clipped)
      on every create/edit modal.

### Negative Scenarios
- [ ] Submitting a form with backend down / network offline shows an error
      state, not a silent failure or infinite spinner.
- [ ] Refreshing mid-modal-edit doesn't corrupt data (form should just close
      or reload cleanly, no partial writes).

### Edge Cases
- [ ] **Planning horizon** year-columns (Products quantity, Line Staff
      quantity, Running Costs cost/year, Financial charts) match the
      project's configured horizon length, not a hardcoded 2 — test with a
      project configured for 1 year and for a longer horizon (5+ years) if
      the field allows it.
- [ ] Very long text in any Name/Description field truncates in list views
      without breaking layout (seen: client/MVP names already truncate with
      `...` in cards — confirm no overflow elsewhere).
- [ ] Cyrillic / non-Latin text (already the seed data's actual content)
      renders correctly everywhere — search, sort, and matching by name must
      not assume ASCII.

### Permissions
- [ ] Confirm what the **Invite** role dropdown options actually are (not
      enumerated as of this checklist's writing) and what each role can/can't
      do — this is currently an open gap in `PROJECT_KNOWLEDGE.md` §6.
- [ ] A user with a restricted role cannot reach Billing & Subscription or
      Delete-project actions if roles are meant to be scoped (verify against
      actual product intent, not assumption).

### Navigation
- [ ] Every sidebar link and sub-link loads without a full page reload
      (SPA client-side nav) and updates the breadcrumb + URL.
- [ ] Deep-linking directly to a nested URL (e.g.
      `/project/{id}/financial/funding-setup`) while already authenticated
      loads correctly, not just navigation via clicks.
- [ ] Browser back/forward between modules preserves scroll position/tab
      selection reasonably (no jarring resets).

### UI
- [ ] Custom dropdown pattern (`button[data-open]` → listbox → option) is
      visually consistent across all modules — no module uses a native
      `<select>` where the rest use the custom component, or vice versa.
- [ ] Modal dialogs trap focus and close on Escape / backdrop click /
      explicit close button consistently.
- [ ] Responsive check: sidebar "Collapse" control works and content
      reflows at narrower viewport widths.

### Regression (known app quirks — re-verify every release)
- [ ] `page.waitForLoadState('networkidle')` never truly resolves (app polls
      in the background) — confirm this is still true; if fixed, tests can
      be simplified, but until then all waits must use explicit timeouts.
- [ ] **Session persistence risk**: navigating via full page reload
      (`page.goto` / hard refresh) shortly after another full reload has, in
      manual testing, occasionally bounced the session back to `/sign-in`
      (suspected refresh-token rotation race). Re-test: perform 2 rapid
      full-page reloads in different tabs/requests and confirm the session
      survives both.
- [ ] Data hygiene: confirm whether stale test projects (`test`, `Premium`,
      `test 3` were observed on the shared test account) have been cleaned
      up before this release's manual pass, so screenshots/results aren't
      contaminated by unrelated leftover data.

### Performance Observations
- [ ] Time-to-interactive for the project dashboard on first load after
      login (cold cache).
- [ ] No layout shift/jank when the AI "Assist me" panel opens/closes over
      page content.
- [ ] No memory leak / listener buildup from repeatedly opening and closing
      modals in one session (spot-check via long manual session or dev
      tools memory profile).

---

## 1. Authentication & Session

**Path:** `/sign-in`

### Happy Path
- [ ] Valid email/password logs in and redirects to `/` (Select a project).
- [ ] "Login with Google" completes OAuth and lands on `/`.
- [ ] "Stay connected" checkbox extends session lifetime as expected.

### Validation
- [ ] Empty email/password shows inline validation, no request fired.
- [ ] Malformed email format is rejected client-side.

### Negative Scenarios
- [ ] Wrong password shows a clear error, doesn't leak whether the email
      exists (security-relevant copy check).
- [ ] Repeated failed logins — confirm there's rate-limiting/lockout
      behavior (or explicitly confirm there isn't, so it's a known gap).
- [ ] Expired/invalid session token on a deep link redirects to sign-in with
      `?redirect=` back to the original page, and actually returns there
      post-login.

### Edge Cases
- [ ] Password field's show/hide (eye icon) toggles visibility correctly.
- [ ] "Forgot password?" flow reachable and functional (not exercised by
      current spec suite at all).
- [ ] "Sign up here" flow reachable (also unexercised).

### Permissions
- [ ] N/A pre-login — verify post-login landing respects account state
      (e.g., account with zero projects lands on an empty/create-first-project
      state, not an error).

### Navigation
- [ ] Direct navigation to any authenticated route while logged out redirects
      to `/sign-in?redirect=<original path>`.
- [ ] Logout (avatar menu) clears session and redirects to `/sign-in`;
      browser back button after logout does not reveal cached authenticated
      content.

### UI
- [ ] Language switcher on the sign-in page (flag selector) changes the
      sign-in form's language.
- [ ] Layout holds on narrow viewports (form + hero image side-by-side
      layout seen on desktop).

### Regression
- [ ] `01-login.spec.js`'s clean-slate approach (`storageState: {cookies:
      [], origins: []}`) still correctly exercises a real, non-cached
      sign-in each release.

### Performance Observations
- [ ] Sign-in submit → redirect latency (auth + first authenticated payload).

---

## 2. Project Management (list, create, edit, delete, templates)

**Path:** `/` (Select a project)

### Happy Path
- [ ] Create project with all fields (name, website, description, income
      tax, currency, founding year, legal form, planning horizon) succeeds
      and the new card appears in the list.
- [ ] Edit an existing project's fields and confirm changes persist after
      reload.
- [ ] Delete a project via row "..." → Delete → confirm dialog removes it
      from the list.

### Validation
- [ ] Empty required fields on Create block submission with visible
      messages ("must be at least 2 characters", "required", etc.).
- [ ] Website field rejects non-URL input (or gracefully accepts free text —
      confirm actual behavior, don't assume).
- [ ] Income tax field rejects non-numeric / out-of-range values (e.g.
      negative, >100%).

### Negative Scenarios
- [ ] Cancel mid-create discards the draft cleanly (no orphaned partial
      project).
- [ ] Deleting a project with lots of child data (clients, products, risks,
      etc.) succeeds without timing out or partially deleting.

### Edge Cases
- [ ] Creating a project with the exact same name as an existing one is
      allowed/blocked — confirm actual behavior (duplicate names currently
      exist on the shared test account: multiple similarly-named test
      projects).
- [ ] Currency selection affects money formatting throughout the entire
      project (Products pricing, Financial tiles, Resources costs) —
      spot-check at least one non-default currency end-to-end.
- [ ] Whatever `select.nth(4)` in the create/edit form actually controls
      (suspected: planning horizon length) — confirm the exact field and
      that changing it correctly adds/removes year-columns across Products,
      Line Staff, Running Costs, and Financial reports.

### Permissions
- [ ] Only the project owner (or roles with sufficient permission, once
      enumerated per §0) can Edit/Delete a project from the list.

### Navigation
- [ ] "Projects templates" button opens a template gallery — confirm what
      selecting a template actually pre-fills (unexplored as of this
      checklist).
- [ ] Opening a project card always lands on its Dashboard.

### UI
- [ ] Project card shows logo/initials, business concept snippet, currency,
      legal form, founding year, and team avatars consistently.
- [ ] Row "..." menu positions correctly near the clicked card, doesn't get
      clipped at viewport edges.

### Regression
- [ ] Re-verify `02`/`03` specs' known coupling via `globalThis
      .__createdProjectName` hasn't silently started leaking across
      parallel/sharded runs (see `TESTING_IMPROVEMENTS.md`).

### Performance Observations
- [ ] Project list load time as the account accumulates more projects
      (currently 5; watch for linear/pagination issues as this grows).

---

## 3. Dashboard

**Path:** `/project/{id}/dashboard`

**Coverage status: covered by `tests/26-dashboard.spec.js` as of 2026-08-06**
(widget rendering, project header, widget deep-link hrefs, Invite modal).
Empty/partial-data states and Permissions remain untested below.

### Happy Path
- [ ] All widgets render with real data once the project has clients,
      products, resources, risks, competitors, locations, suppliers, and
      action plan tasks: Products purchased by customers, Financial
      overview, Critical risk, Competitor summary, Location Analysis,
      Supplier Analysis, Action plan.
- [ ] "Invite" button opens the Add team members modal from this entry
      point.

### Validation
N/A — read-only page, no direct form fields besides the Invite modal
(covered in §19).

### Negative Scenarios
- [ ] Dashboard for a brand-new project (no child data anywhere) shows
      sensible empty states per widget instead of blank/broken layout.
- [ ] A widget whose underlying module has partial data (e.g. clients but no
      products) degrades gracefully, not with a crash or NaN values.

### Edge Cases
- [ ] "Products purchased by customers" matrix scales layout reasonably with
      many products × many clients (current data: 4 products × 3 clients).
- [ ] Financial overview tile values match what's shown on the full
      Forecasts & Reports page (no drift between the summarized and detailed
      views).

### Permissions
- [ ] Confirm whether invited collaborators with a restricted role see the
      same Dashboard or a scoped-down version.

### Navigation
- [ ] Each widget's "→" / expand icon deep-links to the correct full module
      page.

### UI
- [ ] Stage badge (e.g. "Idea") and "Created <date>" render correctly next
      to the project logo.

### Regression
- [ ] None specific yet — first release with dedicated Dashboard coverage;
      establish a baseline screenshot for future visual diffing.

### Performance Observations
- [ ] Dashboard aggregates ~7 modules' data in one load — measure load time
      specifically as a project's data volume grows (many clients/products/
      risks); this is the single most expensive page to render.

---

## 4. Magic Triangle — Overview

**Path:** `/project/{id}/triangle`

**Coverage status: covered by `tests/27-magic-triangle-overview.spec.js`
as of 2026-08-06** (section rendering, "Auto analyze" loading state).

### Happy Path
- [ ] Overview renders AI insights, Overall Strategy Health score,
      Competitor Summary, Strategy details, USP, and Value proposition for a
      populated project.
- [ ] "Auto analyze" button triggers a (re)analysis and updates the
      displayed insights.

### Validation
N/A — no direct data entry on this page.

### Negative Scenarios
- [ ] "Auto analyze" on a project with little/no data shows a helpful
      empty/insufficient-data state, not an error or blank AI response.
- [ ] Clicking "Auto analyze" repeatedly in quick succession doesn't fire
      duplicate/overlapping requests or corrupt the displayed state.

### Edge Cases
- [ ] Very long AI-generated text (insights, strategy details) wraps/scrolls
      without breaking the layout.

### Permissions
- [ ] Confirm whether "Auto analyze" (likely a metered/costed AI call) is
      restricted to certain roles.

### Navigation
- [ ] Sub-links (Clients, Products / Services, Competitors) all present and
      correctly scoped under Magic Triangle.

### UI
- [ ] Loading state while "Auto analyze" runs (spinner/disabled button) is
      visible and clears correctly on completion or error.

### Regression
- [ ] None yet — 0 prior spec coverage on this page.

### Performance Observations
- [ ] "Auto analyze" response latency — this is an AI-backed call and a
      likely slow point; confirm a reasonable timeout and user-facing
      loading indicator rather than an unbounded wait.

---

## 5. Magic Triangle — Clients

**Path:** `/project/{id}/triangle/clients`

### Happy Path
- [ ] Create a client with name, description, and multiple needs (each with
      Priority + Satisfaction); appears in the list immediately.
- [ ] Create a client with **zero** needs succeeds.
- [ ] Edit a client's name and needs; changes persist after reload.
- [ ] Delete a single need from within a client without deleting the whole
      client.

### Validation
- [ ] Empty client name blocked with "must be at least 2 characters" /
      "required" message.
- [ ] Need name required once a need row is added (can't save a half-filled
      need).

### Negative Scenarios
- [ ] Canceling out of "Delete this need" confirm dialog leaves the need
      intact.
- [ ] Attempting to delete a client that's referenced elsewhere (attached to
      a Product, a Marketing Channel, or an MVP target segment) — confirm
      actual behavior: hard block, cascade delete, or orphaned references
      left behind in Products/Channels/MVP. **This is currently unverified
      and is the single highest-value negative-path gap** given how many
      modules reference Client.

### Edge Cases
- [ ] Client with a very high Needs count (10+) — list/detail view still
      usable, "X Needs" badge count stays accurate.
- [ ] Priority/Satisfaction dropdown option sets are exactly as documented
      (Priority: Low/High/Critical — confirm Medium also exists; Satisfaction:
      Not Satisfied/Partially Satisfied/Fully Satisfied) — verify no options
      are missing from either enum.

### Permissions
- [ ] Confirm restricted-role users can/can't create or delete clients per
      the (currently unenumerated) Invite role model.

### Navigation
- [ ] Clicking a client card opens its detail view; browser back returns to
      the list without losing scroll position.

### UI
- [ ] Long client names truncate consistently in both the list and the
      detail header.

### Regression
- [ ] **No spec deletes a whole Client** (only needs) — confirm this gap is
      intentional or add coverage; deleting a client is the riskiest
      untested destructive action given the cross-module references above.

### Performance Observations
- [ ] List render time with the current data volume (4 clients) vs. a
      larger set (20+) — needs list nesting could get expensive.

---

## 6. Magic Triangle — Products / Services

**Path:** `/project/{id}/triangle/products`

### Happy Path
- [ ] Create a product through both wizard steps (Product details → Attach
      clients), including at least one attached client with quantity/year
      filled for every planning-horizon year.
- [ ] Create a product with **zero** attached clients (Step 2 skipped/empty).
- [ ] Edit a product's base fields and separately its client attachments;
      both persist independently.
- [ ] Remove a client attachment and add a different one in the same edit
      session.

### Validation
- [ ] Step 1 "Next" is blocked until Name, Description, Revenue Type,
      Selling price, and Variable production cost are all filled.
- [ ] Selling price / production cost reject non-numeric input.
- [ ] Quantity-per-year inputs on Step 2 reject non-numeric/negative values.

### Negative Scenarios
- [ ] Going "Back" from Step 2 to Step 1 preserves already-entered Step 1
      data (no data loss navigating between wizard steps).
- [ ] Attaching the same client twice to one product — confirm blocked or
      explicitly allowed (and if allowed, how quantities combine).

### Edge Cases
- [ ] Each **Revenue Type** (Item / Subscription / Hourly / Donate) displays
      the correct price-cadence suffix everywhere the price is shown
      (product card, Dashboard matrix, Business Plan) — verify all four, not
      just the ones already spot-checked.
- [ ] Product price formatting matches the project's configured currency
      (₴, $, €, etc.) with correct thousands/decimal separators.
- [ ] A product attached to a deleted client — confirm the app's actual
      behavior (see §5's cross-reference gap).

### Permissions
- [ ] Confirm create/edit/delete restrictions per role once roles are
      enumerated.

### Navigation
- [ ] Deep link to a specific product's edit state (if supported) works, or
      confirm it's modal-only and not deep-linkable.

### UI
- [ ] Client-count badge ("0 Client" / "1 Client" / "N Clients" — check
      pluralization) is accurate and updates live after attach/detach.

### Regression
- [ ] **No spec deletes a whole product** — same gap pattern as Clients;
      confirm intentional or add coverage.
- [ ] Re-verify the 2-step wizard shape hasn't silently collapsed into a
      single step (or vice versa) — this is a structural assumption baked
      into every Products spec.

### Performance Observations
- [ ] Attach-clients step with many clients in the dropdown (currently 4) —
      watch for dropdown performance/scroll issues as client count grows.

---

## 7. Magic Triangle — Competitors (+ Evaluation Criteria + Evaluation Matrix)

**Path:** `/project/{id}/triangle/competitors`

### Happy Path
- [ ] Create a competitor (name, URL, type) — appears in the list.
- [ ] Create an evaluation criterion with a weight (1–10) — appears in the
      criteria list.
- [ ] Fill every cell of the evaluation matrix (competitor × criterion) and
      confirm the **Total weighted score** footer row computes correctly.
- [ ] Edit a competitor's name and delete a different competitor
      independently.

### Validation
- [ ] Empty competitor Create form shows validation and does not submit.
- [ ] Empty criterion Create form shows validation and does not submit.

### Negative Scenarios
- [ ] Deleting a competitor that has matrix scores filled in — confirm the
      matrix column is removed/recalculated correctly, not left as a stale
      column or causing a broken total.
- [ ] Deleting a criterion that has matrix scores filled in — confirm the
      matrix row and the weighted-total formula update correctly (weights
      sum changes, so all totals should recompute).

### Edge Cases
- [ ] **Weighted score formula** — recompute by hand for at least one
      dataset each release: `Σ(criterion weight × cell score) / Σ(weights)`
      per competitor, and confirm displayed totals match to the same
      precision (1 decimal place seen in existing data, e.g. "6.6").
- [ ] Competitor Type enum (Direct/Indirect/Potential) — confirm no
      additional/missing values.
- [ ] Matrix with a large number of competitors and criteria (current: 5×3)
      — confirm horizontal scroll or layout doesn't break at, say, 10×10.

### Permissions
- [ ] Confirm create/edit/delete restrictions per role.

### Navigation
- [ ] All three sub-sections (Competitors, Evaluation criteria, Evaluation
      matrix) are reachable and visible on one page without requiring extra
      navigation.

### UI
- [ ] Competitor URL renders as a clickable link and opens in a new tab.
- [ ] Matrix cell dropdown (`button[data-open]`) is keyboard-accessible
      (tab to it, open with Enter/Space, arrow through options).

### Regression
- [ ] This exact 3-part pattern (items + weighted criteria + matrix) is
      reused for Location Analysis (§11) and Supplier Analysis (§11) — any
      shared component fix here should be cross-checked against both of
      those modules too, and vice versa.

### Performance Observations
- [ ] Matrix recalculation latency when changing a single cell — should feel
      instant (client-side), not trigger a full page reload/refetch.

---

## 8. Operations — Marketing Channels

**Path:** `/project/{id}/operations` (tab: Marketing channels)

### Happy Path
- [ ] Create a channel through both wizard steps for every category
      (Social media, Paid search, SEO & content, Email marketing, Events &
      PR, Direct sales, Referral, Other) at least once.
- [ ] "Other" category reveals and requires the custom category-name field;
      submitting with it filled succeeds.
- [ ] Edit a channel's name, category, client link, strategy, and each
      Sales Funnels metric independently; each persists.

### Validation
- [ ] Step 1 "Next" blocked until Name, Category (+ custom name if "Other"),
      Client, and Strategy are filled.
- [ ] Sales Funnels numeric fields (Budget, Reach, Conversion to lead/
      customer) reject non-numeric input.
- [ ] Conversion-to-customer logically shouldn't exceed conversion-to-lead —
      confirm whether this is actually validated or just visually odd if
      violated.

### Negative Scenarios
- [ ] Switching category away from "Other" after typing a custom name
      clears/hides that field correctly (no leftover hidden value submitted).
- [ ] Deleting the client a channel is linked to — confirm behavior (same
      cross-reference concern as §5/§6).

### Edge Cases
- [ ] Percent fields (conversion rates) — confirm behavior at 0% and 100%
      boundaries, and whether >100% is rejected.
- [ ] Very large Monthly budget / Reach numbers format/display correctly
      (thousands separators, no overflow in the table).

### Permissions
- [ ] Confirm create/edit/delete restrictions per role.

### Navigation
- [ ] Marketing channels tab is the default tab when landing on `/operations`.

### UI
- [ ] List renders as a **table** (confirmed different from the card-based
      lists used elsewhere) — verify column headers, sorting (if any), and
      row action menu placement are consistent with the rest of the table's
      styling.

### Regression
- [ ] Re-verify the "Other" category's conditional custom-name field still
      renders and is still required — this is a conditional-field pattern
      shared with Risk Analysis's PESTEL field (§14); a shared-component
      regression could break both simultaneously.

### Performance Observations
- [ ] Creating 8 channels sequentially (per spec 12) currently needs a
      240s test timeout — track whether this grows further as more
      categories/steps are added.

---

## 9. Operations — Team and Staff

**Path:** `/project/{id}/operations` (tab: Team and staff)

### Happy Path
- [ ] Create a Key Member with all fields (first/last name, background,
      role, engagement %, employment type, salary, pay period, start year).
- [ ] Create a Line Staff role with quantity-per-year filled for every
      planning-horizon year.
- [ ] Edit a Key Member's role/salary and a Line Staff's quantities/
      description independently.

### Validation
- [ ] Radio toggle correctly swaps the form fields between Key Member and
      Line Staff shapes without leaving stale fields/values from the other
      mode.
- [ ] Engagement % field bounded to 0–100.
- [ ] Salary field rejects non-numeric/negative input.

### Negative Scenarios
- [ ] Deleting a Key Member who is currently assigned to one or more Action
      Plan tasks — confirm the task's Assignee field gracefully falls back
      (unassigned) rather than showing a broken/blank reference.

### Edge Cases
- [ ] Employment Type × Pay Period combinations (Full time/Freelance ×
      Monthly/Hourly/Annually) — confirm all sensible combinations are
      selectable and salary is interpreted/displayed consistent with the
      chosen period.
- [ ] Line Staff quantity-per-year with a 0 value — confirm allowed and
      doesn't break downstream cost calculations (feeds Resources-adjacent
      financial rollups).

### Permissions
- [ ] Confirm create/edit/delete restrictions per role.
- [ ] Confirm only Key Members (not Line Staff) are selectable as Action
      Plan assignees, matching documented behavior — this is a real
      functional rule, not just a UI convenience, and should be explicitly
      asserted.

### Navigation
- [ ] "Team and staff" tab state persists correctly on reload (URL or tab
      memory, whichever the app uses).

### UI
- [ ] Key Member and Line Staff cards are visually distinguishable from each
      other in the combined list.

### Regression
- [ ] None yet beyond what's spec-covered; establish a baseline for the
      Key-Member-as-assignee link with Action Plan (§15) since that's a
      cross-module dependency easy to silently break.

### Performance Observations
- [ ] Creating 3 key members + 3 line staff sequentially currently needs
      120s timeouts each — watch for growth.

---

## 10. Operations — Resources

**Path:** `/project/{id}/operations` (tab: Resources)

### Happy Path
- [ ] Create an Investment resource for every category (Equipment, Hardware,
      Office space, Inventory, Copyrights, Trade secrets, Other).
- [ ] Create a Running Costs resource for every category (11 categories per
      `PROJECT_KNOWLEDGE.md` §3.3) with cost-per-year filled for valid years.
- [ ] Edit an Investment's cost/amortization and a Running Cost's cost-per-
      year/payment type independently.
- [ ] Filter the list by the Investments/Running costs radio toggle and
      confirm each shows only its own type.

### Validation
- [ ] **Amortization period max is 100** — confirm 100 is accepted and 101
      is rejected (known, documented limit; must be re-verified every
      release since it's an easy off-by-one to regress).
- [ ] **Running cost per-year field before the resource's Start year is
      rejected** — confirm this validation still fires (documented quirk).
- [ ] Cost fields reject non-numeric/negative input.

### Negative Scenarios
- [ ] Setting Start year to the last available planning-horizon year and
      confirming only that single year's cost input is enabled/relevant for
      Running Costs (all earlier years should be disabled or hidden per the
      Start-year rule above).
- [ ] Switching an existing resource from Investment to Running Costs (or
      vice versa) mid-edit — confirm this is actually possible, and if so
      that fields remap sensibly rather than retaining stale values.

### Edge Cases
- [ ] Amortization period at exactly 1 and exactly 100 (boundary values).
- [ ] A resource with Start year equal to the *last* planning-horizon year —
      confirm it still creates successfully with just one valid cost column.

### Permissions
- [ ] Confirm create/edit/delete restrictions per role.

### Navigation
- [ ] Resources tab list/filter state (Investments vs Running costs) doesn't
      leak into other tabs when switching away and back.

### UI
- [ ] Category dropdown lists are long (7 and 11 options respectively) —
      confirm they scroll properly and don't get clipped near the viewport
      edge.

### Regression
- [ ] Re-verify both documented quirks above (amortization max 100,
      start-year cost gating) every release — these are exactly the kind of
      validation rule that regresses silently when the form is refactored.
- [ ] Confirm Resources still correctly feeds Financial → Forecasts &
      Reports CAPEX/OPEX tiles (cross-module dependency, §12).

### Performance Observations
- [ ] Creating 7 Investment + 12 Running Cost resources sequentially
      currently needs up to 480s — this is the single longest-running create
      flow in the suite; watch for further growth or consider a bulk-create
      API path if one exists.

---

## 11. Operations — Other (IP Rights, Location Analysis, Supplier Analysis)

**Path:** `/project/{id}/operations` (tab: Other)

### Happy Path
- [ ] Fill and Save each of the 4 IP Rights types (Trademark, Patent,
      Copyright, Design) independently — Tracked switch, Registration
      status, Notes.
- [ ] Location Analysis: add locations, add criteria, fill the full
      comparison matrix, confirm weighted totals.
- [ ] Supplier Analysis: same as above, independently from Location
      Analysis (separate criteria sets).

### Validation
- [ ] IP Rights Notes field has a reasonable max length / doesn't silently
      truncate on save.
- [ ] Location/Supplier Create forms validate required fields (Name;
      Address for Location; Email/Country for Supplier).
- [ ] Supplier Email field validates email format.

### Negative Scenarios
- [ ] Toggling an IP Right's "Tracked" switch off — confirm whether
      Registration status/Notes are hidden, disabled, or retained but
      inert, and that this state persists correctly after Save + reload.
- [ ] Deleting a Location or Supplier that has matrix scores — same
      recalculation concern as Competitors (§7).

### Edge Cases
- [ ] **IP Rights nav button labels carry a live status badge** (e.g.
      "Patent Planned" → "Patent Registered") — confirm the badge always
      updates immediately after Save and that automated tests keep matching
      by prefix (`/^Patent\b/`) rather than exact text.
- [ ] Location Analysis and Supplier Analysis, though visually identical in
      pattern, must remain **independent datasets** — confirm criteria/
      scores never leak between the two accordions.

### Permissions
- [ ] Confirm create/edit/delete restrictions per role for all three
      sub-sections.

### Navigation
- [ ] Accordion sections expand/collapse independently and remember state
      reasonably within a session.

### UI
- [ ] IP Rights type-selector buttons remain distinguishable (selected vs.
      unselected state) alongside their status badges.

### Regression
- [ ] Re-verify the IP Rights prefix-matching quirk after any copy/label
      change to the badges.
- [ ] Cross-check the shared weighted-matrix component against Competitors
      (§7) whenever either is modified.

### Performance Observations
- [ ] Filling all 4 IP types + both analyses (3 locations/suppliers + 3
      criteria + 9 matrix cells each) sequentially currently needs up to
      240s per sub-flow — same "long sequential form-filling" pattern as
      Resources; consider whether this indicates a UX opportunity (bulk
      entry) as much as a test-runtime concern.

---

## 12. Financial — Forecasts & Reports

**Path:** `/project/{id}/financial/forecasts-reports/*`
**Coverage status: covered by `tests/28-financial-forecasts.spec.js` as of
2026-08-06** (stat tiles, chart, all 3 tabs load their own breakdown
table). "Create entry" and "Export" themselves remain untested below.

### Happy Path
- [ ] Stat tiles (Initial Investment/CAPEX, Monthly Burn Rate/OPEX,
      Break-even Point, Profitability) render correct computed values for a
      known dataset.
- [ ] Revenue vs Expenses chart renders with correct Revenue/Expenses/
      Break-even series across the planning horizon.
- [ ] Each tab (Income, Cash flow, Balance sheet) loads its own "Planning
      horizon breakdown" table.
- [ ] "Create entry" successfully adds a manual entry on top of the computed
      forecast on at least one of the three tabs.
- [ ] "Export" produces a downloadable file (confirm format — PDF/Excel/CSV)
      with content matching the on-screen data.

### Validation
- [ ] "Create entry" form validates required fields and numeric inputs.

### Negative Scenarios
- [ ] Export on a project with no data yet — confirm a sensible
      empty/near-empty file rather than an error.
- [ ] "Create entry" with values that would make the chart nonsensical
      (e.g. negative revenue) — confirm behavior (rejected vs. accepted with
      a visibly odd chart).

### Edge Cases
- [ ] **CAPEX tile should equal the sum of all Investment resources'
      cost** (§10) — verify against a known fixture.
- [ ] **OPEX tile should equal Running Costs aggregated per the payment
      type/year rules** (§10) — verify against a known fixture.
- [ ] **Break-even Point** — confirm it correctly identifies the first year/
      period where cumulative revenue ≥ cumulative expenses.
- [ ] **Profitability / net margin %** — verify the formula
      (`(Revenue − Expenses) / Revenue`, or confirm actual formula) against
      a hand-calculated fixture.
- [ ] Switching between Income/Cash flow/Balance sheet tabs preserves the
      stat tiles and chart above (those are page-level, not tab-scoped) —
      confirm this is intentional.

### Permissions
- [ ] Confirm create/export restrictions per role — Export in particular
      may be sensitive (exposes full financials) and worth restricting.

### Navigation
- [ ] Each tab has its own URL (`financial-evaluation`, `cash-flow`,
      `balance-sheet`) and is independently deep-linkable/bookmarkable.

### UI
- [ ] Chart legend (Revenue/Expenses/Break-even) and axis labels/currency
      formatting match the project's configured currency.

### Regression
- [ ] N/A — establish baseline this release; re-verify computed-tile
      formulas after any change to Resources or Products pricing logic,
      since this module is entirely derived data.

### Performance Observations
- [ ] Chart/table recompute time when the underlying Resources/Products
      dataset is large — this is the most computation-heavy page in the app
      and currently has zero coverage of any kind.

---

## 13. Financial — Funding & Setup

**Path:** `/project/{id}/financial/funding-setup`
**Coverage status: covered by `tests/29-financial-funding.spec.js` as of
2026-08-06** (working capital calculation incl. CCC banding, Total
equity/debt/Net funding tiles, empty state, Create activity button
present). Actually creating a financing activity remains untested below.

### Happy Path
- [ ] Fill DIO/DSO/DPO and confirm **Cash conversion cycle** computes
      live as `DIO + DSO − DPO` with "Save changes" persisting the inputs.
- [ ] Create a financing activity via "Create activity"; it replaces the
      "No financing activities yet" empty state.

### Validation
- [ ] DIO/DSO/DPO fields reject non-numeric/negative input.
- [ ] "Create activity" form validates its required fields (fields not yet
      enumerated — document them on first real pass).

### Negative Scenarios
- [ ] Negative Cash Conversion Cycle (DPO > DIO+DSO) — confirm it displays
      correctly (a negative CCC is a valid real-world result, shouldn't be
      treated as an error).
- [ ] Deleting the only financing activity returns cleanly to the "No
      financing activities yet" empty state.

### Edge Cases
- [ ] **Healthy/Moderate/High banding** (0–30 / 30–60 / 60+ days) — verify
      the boundary values (exactly 30 and exactly 60) land in the correct
      band, not an off-by-one neighbor.
- [ ] Very large DIO/DSO/DPO values (e.g. 9999 days) don't break the banding
      display or the CCC calculation.

### Permissions
- [ ] Confirm create/edit/delete restrictions per role.

### Navigation
- [ ] "Funding & Setup" and "Forecasts & Reports" sub-links don't lose
      unsaved Working Capital input when switching between them (or clearly
      warn before discarding).

### UI
- [ ] Cash conversion cycle result card's color coding matches the
      documented Healthy/Moderate/High legend.

### Regression
- [ ] N/A — establish baseline this release.

### Performance Observations
- [ ] "Save changes" round-trip latency for the Working Capital form.

---

## 14. Implementation — Risk Analysis

**Path:** `/project/{id}/implementation/risk-analysis`

### Happy Path
- [ ] Create an External risk for each of the 6 PESTEL categories
      (Political, Economic, Social, Technological, Environmental, Legal).
- [ ] Create an Internal risk (no PESTEL category shown/required).
- [ ] Edit a risk's Consequences/Probability/description; confirm the
      computed Risk level updates accordingly.
- [ ] Hover a risk-matrix marker and confirm the tooltip shows Consequences,
      Probability, and Risk level.

### Validation
- [ ] Name and Description required; Type, Consequences, and Probability
      radios required before Create is enabled/succeeds.

### Negative Scenarios
- [ ] Selecting Internal after having selected External (with a PESTEL
      category chosen) correctly clears/hides the now-irrelevant PESTEL
      value rather than submitting a stale one.
- [ ] Deleting a risk removes its marker from the risk matrix immediately.

### Edge Cases
- [ ] **Risk level matrix** — verify the full Consequences × Probability
      grid (5×5 = 25 combinations) maps to the correct Low/Moderate/High/
      Extreme level; the existing spec only spot-checks that *some* level
      renders, not that it's the *correct* one for each combination — this
      is a real correctness gap worth closing.
- [ ] Multiple risks landing on the same matrix cell (same Consequences ×
      Probability) — confirm the marker/tooltip correctly represents/lists
      all of them rather than only showing one.

### Permissions
- [ ] Confirm create/edit/delete restrictions per role.

### Navigation
- [ ] "Risk analysis" is the default Implementation tab.

### UI
- [ ] Risk matrix markers use truncated labels ("Internal…"/"External…") —
      confirm truncation doesn't make two different risks visually
      indistinguishable without hovering.

### Regression
- [ ] Re-verify the conditional PESTEL field still only renders for External
      risk type (shared conditional-field pattern with Marketing Channels'
      "Other" category, §8 — a shared-component bug could hit both).

### Performance Observations
- [ ] Creating 12 risks sequentially currently needs 300s, each waiting on
      its own table row appearing — watch for growth as risk count scales
      up in a real long-lived project.

---

## 15. Implementation — Action Plan

**Path:** `/project/{id}/implementation/action-plan`

### Happy Path
- [ ] Add a new stage (column) via "Add Stage".
- [ ] Create a task with all fields (name, description, priority, due date,
      assignee) in a given stage.
- [ ] Create a task with only required fields (name, priority — stage
      defaults to the column).
- [ ] Drag a card from one stage to another; confirm it persists after
      reload.

### Validation
- [ ] Empty stage name blocked on "Add Stage".
- [ ] Task Name and Priority required; Create disabled/blocked otherwise.

### Negative Scenarios
- [ ] Dragging a card and releasing it outside any valid column drop-target
      — confirm it snaps back to its original column rather than
      disappearing or erroring.
- [ ] Deleting a stage that still has tasks in it — confirm actual behavior
      (block, cascade-delete tasks, or move tasks to a default stage) —
      currently unverified.

### Edge Cases
- [ ] Due date picker at month/year boundaries (e.g. last day of December)
      navigates correctly.
- [ ] A task with an **overdue** due date — confirm the "(Overdue)" badge
      seen in the dashboard/board view appears/disappears correctly as the
      current date crosses the due date.
- [ ] Reordering stages themselves (not just tasks) — confirm whether this
      is supported at all; if not, confirm stage order is otherwise stable
      across reloads.

### Permissions
- [ ] Confirm create/edit/delete/drag restrictions per role — a
      "viewer"-type role dragging cards would be a meaningful permission
      leak if not actually blocked.

### Navigation
- [ ] "Action plan" tab state (scroll position within the board) is
      reasonable on tab switch/return.

### UI
- [ ] Priority badges (Low/Medium/High/Critical) use consistent, visually
      distinct colors.
- [ ] Board scrolls horizontally when there are more stages than fit the
      viewport, without breaking card drag-and-drop across the scroll
      boundary.

### Regression
- [ ] **Native `dragTo()` does not work on this board** — any automated
      regression must keep using the manual `mouse.down` → stepped
      `mouse.move` → `mouse.up` sequence; if the drag library changes,
      re-verify this is still required.
- [ ] **Editing a task's Stage dropdown in the Edit modal visually updates
      but does not persist** — moving stages only actually works via
      drag-and-drop. Re-verify this exact bug is still present (or confirm
      it's been fixed and update this checklist item + the affected specs
      accordingly) every release, since it's the kind of thing that's easy
      to "fix by accident" or regress silently.

### Performance Observations
- [ ] Drag-and-drop responsiveness (visual lag between mouse move and card
      following) — this board's custom drag implementation is more fragile
      than a native HTML5 DnD; watch for regressions in feel, not just
      function.

---

## 16. Implementation — MVP

**Path:** `/project/{id}/implementation/mvp`

### Happy Path
- [ ] Create an MVP for each of the 5 types (Prototype, Test sales, Pilot
      project, Landing page, Explanatory video) with a full hypothesis,
      one Core feature, and a validation plan.
- [ ] Edit an MVP's segment, hypothesis, feature description, and
      validation fields independently; each persists.

### Validation
- [ ] **At least one Key Feature of type "Core" is required** — confirm an
      MVP with only "Optional" features is still correctly rejected on
      submit (documented, must-not-regress rule).
- [ ] MVP Name, Type, and Target segment required before submit.

### Negative Scenarios
- [ ] Deleting the Client that an MVP's Target segment points to — confirm
      behavior (same cross-reference concern as §5).
- [ ] Submitting the hypothesis fields with only one of the three
      If/Then/Because sentence-starters filled — confirm whether partial
      hypotheses are allowed or all three are effectively required.

### Edge Cases
- [ ] Target value / Time frame are **free text** (e.g. "> 15%", "30 days")
      — confirm no hidden format validation silently rejects reasonable
      variations (e.g. "15%+", "1 month").
- [ ] Success metric placeholder text has a typo in the app itself
      ("Conversation rate" instead of "Conversion rate") — not a test bug;
      flag to product/design, don't "fix" it by pattern-matching around it
      in future tests without also filing the copy bug.

### Permissions
- [ ] Confirm create/edit/delete restrictions per role.

### Navigation
- [ ] **MVP create/edit is a full page, not a modal** — the one exception
      to the app-wide modal convention (§0 UI). Confirm this is still true;
      if MVP is ever converted to a modal, most of the existing MVP specs'
      navigation assumptions would need updating.
- [ ] After creating an MVP, landing back on the MVP list still shows
      "Create MVP" ready to use immediately for the next one (confirmed
      current behavior — re-verify).

### UI
- [ ] MVP cards on the list show Name and Type clearly; Feature Type
      (Core/Optional) is visually distinguishable within the feature list.

### Regression
- [ ] Re-verify the Core-feature-required validation every release — it's
      the one hard business rule in this form and easy to silently drop in
      a refactor.

### Performance Observations
- [ ] Creating 5 MVPs sequentially (long multi-section form each) currently
      needs up to 300s — the longest single-record create form in the app;
      watch load time of the full-page form itself, not just submission.

---

## 17. Business Plan

**Path:** `/project/{id}/business-plan/generate`
**Coverage status: covered by `tests/30-business-plan.spec.js` as of
2026-08-06** (major sections render, "Next slide" advances). Template/
orientation picker and gap-degradation still untested below.

### Happy Path
- [ ] Generate the plan for a fully-populated project and confirm every
      section (Management Summary, Value Proposition & USP, Clients,
      Products & Services, Competitive Analysis, Go-to-Market, Team,
      Resources, Financials, Risk Analysis, Action Plan, IP Rights,
      Conclusion) renders with data matching the source modules.
- [ ] "Next slide" advances through the presentation-style view correctly.

### Validation
N/A — read-only aggregate view.

### Negative Scenarios
- [ ] Generate the plan for a project with large gaps (e.g. no risks, no
      MVPs) — confirm each section degrades gracefully (empty state) rather
      than showing broken/undefined content or crashing the whole page.

### Edge Cases
- [ ] Confirm what `?template=minimal&orientation=vertical` actually
      controls — locate the template/orientation picker UI (not found in
      this pass) and verify at least one alternate template and orientation
      render correctly end-to-end.
- [ ] Every numeric/derived value shown here (weighted scores, financial
      figures, risk levels) must exactly match its source module — this
      page has no data of its own, so any mismatch is a real bug, not a
      display quirk.

### Permissions
- [ ] Confirm whether Business Plan generation/export is gated by role or
      subscription plan (plausible given the Billing module's existence —
      confirm intent).

### Navigation
- [ ] Reachable directly from the sidebar and produces a stable/bookmarkable
      URL for a given template+orientation combination.

### UI
- [ ] Slide/section transitions ("Next slide") are smooth and don't lose
      the current scroll/zoom state unexpectedly.
- [ ] Print/PDF export (if available from this view) renders each section
      without cutting off content at page breaks.

### Regression
- [ ] N/A — establish baseline this release. This page is the best
      **end-to-end smoke test candidate** in the app: seed known data once
      across every module, generate the plan, and snapshot/assert against
      it as a single high-leverage regression test.

### Performance Observations
- [ ] Full-plan generation time for a data-heavy project (this page reads
      from essentially every module at once — the most cross-cutting query
      in the app).

---

## 18. AI Features — "Assist me" & "Auto analyze"

**Paths:** chat drawer available from most module pages; "Auto analyze" on
Magic Triangle overview (§4).
**Coverage status: "Auto analyze" covered by
`tests/27-magic-triangle-overview.spec.js` as of 2026-08-06. "Assist me"
chat remains 0% covered — and confirmed live that same date to fail to
open at all in 5/5 attempts; see `BUG_PATTERNS.md` "Intermittent Sidebar
Menu/Panel/Drawer Open Failure" before investing in chat-content specs.**

### Happy Path
- [ ] Open "Assist me" from at least 3 different pages (Dashboard, Magic
      Triangle, Business Plan) and confirm the greeting + quick-prompt chips
      render each time.
- [ ] Click a quick-prompt chip and confirm a relevant AI response streams
      in.
- [ ] Type a free-text question in "Ask AI anything..." and submit with
      Enter; confirm Shift+Enter inserts a newline instead of submitting.
- [ ] "Reset" clears the current conversation back to the greeting state.

### Validation
- [ ] Empty message can't be submitted (button disabled or no-op).
- [ ] Extremely long input (thousands of characters) is either truncated
      client-side or handled gracefully server-side, not silently dropped.

### Negative Scenarios
- [ ] AI backend timeout/error shows a clear failure state in the chat, not
      an infinite "typing" indicator.
- [ ] Asking about a project with no data yet still returns something
      sensible rather than erroring.

### Edge Cases
- [ ] Non-English input (matching the project's actual Ukrainian content)
      is handled correctly, not just English.
- [ ] Rapid repeated submissions (spam-clicking send) don't queue up
      duplicate overlapping responses.

### Permissions
- [ ] Confirm whether AI features are gated by subscription plan/role
      (likely, given a real LLM call has a cost) — cross-check against
      Billing & Subscription (§21).

### Navigation
- [ ] Closing and reopening the drawer on a different page starts a fresh,
      page-relevant context (or explicitly confirm conversation persists
      across pages/navigation, whichever is intended).

### UI
- [ ] Drawer opens/closes with a smooth transition and doesn't shift the
      underlying page's scroll position.
- [ ] Markdown/rich formatting in AI responses (if any) renders correctly,
      not as raw text.

### Regression
- [ ] N/A — establish baseline this release; because responses are
      non-deterministic, automated coverage should assert on *behavior*
      (a response appears, loading state clears, error states are handled)
      rather than exact response text.

### Performance Observations
- [ ] Response latency for both quick-prompt chips and free-text questions —
      set an explicit, generous timeout in any automated test (this is the
      least predictable latency in the whole app) and treat consistent
      slowness as a real bug, not just "AI is slow."

---

## 19. Collaboration — Invite

**Path:** "Invite" button (Dashboard and likely elsewhere)
**Coverage status: covered by `tests/31-invite.spec.js` as of 2026-08-06**
(Role dropdown lists Editor/Viewer, empty-email and malformed-email
rejection, Cancel closes cleanly). Actually completing an invite (real
email delivery, pending-invite lifecycle) and role permissions remain
untested below — see the Permissions note further down, still the
single highest-priority gap in this section.

### Happy Path
- [ ] Invite a new email with a role selected; confirm the invitee receives
      an email/notification and the pending invite shows somewhere (team
      list, if one exists — not yet located).
- [ ] Cancel the modal without submitting; no invite is sent.

### Validation
- [ ] Email field validates format; Role is required before Invite is
      enabled.
- [ ] Inviting an email that's already a collaborator on the project shows
      a clear message rather than silently duplicating or erroring.

### Negative Scenarios
- [ ] Invite to an email with no existing account — confirm the resulting
      sign-up flow correctly lands the invitee on the right project with
      the right role.
- [ ] Revoking a pending invite (if a management UI exists — not yet
      located) actually prevents that email from joining if they later
      click the original invite link.

### Edge Cases
- [ ] Inviting the same email twice in a row (before they've accepted) —
      confirm behavior (resend vs. duplicate vs. blocked).

### Permissions
- [ ] **This entire flow is a permissions surface and is currently
      completely unverified**: enumerate the actual Role options in the
      dropdown and confirm what each role can/cannot do across every module
      in this checklist — this should become its own dedicated pass, not
      just a checklist line item, before this feature ships more broadly.

### Navigation
- [ ] After a successful invite, is there any team-management page to view/
      manage existing collaborators? Locate it if so and add it to this
      checklist as its own module.

### UI
- [ ] Modal fields (Email, Role) match the screenshot-verified layout;
      Role dropdown is a native `<select>`-style "Select" — confirm it
      actually follows the app's custom dropdown pattern (§0 UI) or is a
      deliberate exception.

### Regression
- [ ] N/A — first pass.

### Performance Observations
- [ ] Invite email delivery latency (external dependency — confirm
      acceptable turnaround, not indefinite).

---

## 20. Profile Settings

**Path:** `/profile`
**Coverage status: 0 automated specs; manually confirmed live 2026-08-06**
that the page loads with Change personal Info, Password (+ Change
password), a "My Invoices" link, an inline Subscription and Usage section
(see `PROJECT_KNOWLEDGE.md` §4 — supersedes the old separate-billing-tab
description), and Delete account. No form submission (destructive or
otherwise) was exercised.

### Happy Path
- [ ] "Change personal Info" updates and persists name/other profile fields.
- [ ] "Change password" with correct current password + valid new password
      succeeds and the new password works on next login.

### Validation
- [ ] "Change password" enforces a real password policy (length/complexity)
      and requires current password confirmation.
- [ ] "Change personal Info" validates any required fields (e.g. name not
      empty).

### Negative Scenarios
- [ ] "Change password" with an incorrect current password is rejected with
      a clear message.
- [ ] "Delete account" — confirm it requires a strong confirmation step
      (re-auth, typed confirmation, etc.) given it's fully destructive; **do
      not exercise this against the shared test account** without an
      explicitly disposable account.

### Edge Cases
- [ ] Changing the email address (if supported via "Change personal Info")
      — confirm re-verification flow and that the old email stops working
      for login afterward.

### Permissions
- [ ] Confirm a user can only ever edit their own profile (no
      cross-account access via manipulated IDs/requests).

### Navigation
- [ ] "Select a project" link from this page returns to the project list
      correctly.

### UI
- [ ] All three actions (Change personal Info / Change password / Delete
      account) are visually distinct in destructiveness (Delete account
      should read as clearly higher-risk than the other two).

### Regression
- [ ] N/A — first pass.

### Performance Observations
- [ ] N/A — low-traffic page, no specific concern identified yet.

---

## 21. Billing & Subscription

**Path:** `/profile/billing`
**Coverage status: 0 existing specs. Real payment/subscription side effects
— do not exercise destructive or paid actions against the shared test
account without an explicitly sanctioned test payment method/sandbox.**

### Happy Path
- [ ] "Add payment method" completes with a test card (via payment provider
      test mode) and replaces the "No payment method added" state.
- [ ] "Change plan" successfully upgrades/downgrades and the "Subscription
      details" section reflects the new plan immediately.
- [ ] An invoice appears under "Recent invoices" after a billable event, and
      "Download invoices" produces a valid file.

### Validation
- [ ] Payment method form validates card fields.

### Negative Scenarios
- [ ] "Cancel subscription" — confirm what actually happens (immediate loss
      of access vs. access until period end) and that the UI communicates
      this clearly before the user confirms.
- [ ] Declined test card is handled with a clear error, not a silent
      failure.

### Edge Cases
- [ ] Plan change mid-billing-cycle — confirm proration behavior (if any)
      is correctly reflected.

### Permissions
- [ ] Confirm only the account owner (not invited collaborators) can access
      Billing & Subscription at all.

### Navigation
- [ ] "View history" opens a fuller invoice/billing history view — confirm
      it exists and loads correctly.

### UI
- [ ] Empty states ("No payment method added", "You don't have any invoices
      yet") render cleanly and don't imply an error.

### Regression
- [ ] N/A — first pass. Given the real-money nature of this module, treat
      it as **manual/sandbox-only test coverage**, not something to
      automate against a shared live account casually.

### Performance Observations
- [ ] N/A — not yet assessed; payment provider round-trip latency would be
      the main concern once tested.

---

## 22. Minor Global Settings — Notifications, Language, Learning Center

**Coverage status: covered by `tests/32-minor-global-settings.spec.js` as
of 2026-08-06** — and this is what surfaced a significant confirmed bug:
Notifications failed to open in 6/6 attempts and Language in ~50% of
attempts; see `BUG_PATTERNS.md` "Intermittent Sidebar Menu/Panel/Drawer
Open Failure". The spec itself retries up to 5 times to avoid flaking on
this, which is a test-robustness workaround, not a fix. Also note:
"Knowledge Base" has been renamed **"Learning Center"** in the live app.

### Happy Path
- [ ] Notifications bell opens a panel listing notifications; "Mark all as
      read" clears the unread state/badge.
- [ ] Language switcher changes the UI language and it persists across
      reload/re-login.
- [ ] "Knowledge base" link opens the help center (confirm internal page vs.
      external link, and that it opens sensibly — new tab vs. same tab).

### Validation
N/A — no forms in this group.

### Negative Scenarios
- [ ] Notifications panel with zero notifications shows a clean empty state.

### Edge Cases
- [ ] Switching language mid-session while a modal is open — confirm the
      open modal's labels update or the switch is deferred sensibly.
- [ ] Confirm the actual list of supported languages (only 🇬🇧 English seen
      so far) — verify Ukrainian is/isn't a selectable UI language given the
      seed data is Ukrainian content (content language ≠ UI language, but
      worth confirming both are intentional).

### Permissions
N/A — account-level preferences, not data-permission-relevant.

### Navigation
- [ ] Notification items (if clickable) deep-link to the relevant
      project/module.

### UI
- [ ] Unread notification count badge is accurate and updates in real time
      (or on a reasonable poll interval) as new notifications arrive.

### Regression
- [ ] N/A — first pass.

### Performance Observations
- [ ] Notification polling frequency — this is likely part of why
      `networkidle` never resolves app-wide (§0 Regression); confirm the
      polling interval is reasonable and not contributing to unnecessary
      load.

---

## 23. Release Sign-off

- [ ] All **Happy Path** items across every module pass.
- [ ] Zero open **Critical** defects (data loss, security, payment
      correctness, cross-account data leakage).
- [ ] Zero open **High** defects in modules touched by this release's
      change set.
- [ ] All **Regression** items (known quirks) re-verified as either "still
      behaves as documented" or explicitly updated in `PROJECT_KNOWLEDGE.md`
      / this checklist if intentionally fixed/changed.
- [ ] Data hygiene: no test artifacts (throwaway projects/records) left on
      the shared prod test account from this release's manual pass.
- [ ] Sign-off recorded with: tester name, date, app version/commit, list of
      any accepted **Medium/Low** defects deferred to next release with
      linked tickets.
