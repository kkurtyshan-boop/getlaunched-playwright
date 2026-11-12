# BUG PATTERNS

Project regression knowledge base. Companion to `PROJECT_KNOWLEDGE.md` (app
map) and `RELEASE_CHECKLIST.md` (what to test). This file is the **historical
memory** of every *confirmed* bug, regression, unstable area, workaround,
limitation, and important implementation detail discovered while testing
GetLaunched — so nothing has to be rediscovered from scratch in a future
session.

**Rules for maintaining this file** (do not violate these when appending):
- Only log **confirmed** findings — reproduced live, or documented in the
  codebase itself (README.md, CLAUDE.md, spec code/comments) by whoever
  originally discovered them through real test execution. Never invent or
  speculate a bug into existence here — unverified hypotheses belong in
  `RELEASE_CHECKLIST.md` as things still to check, not here.
- When a bug is fixed, **update its Status in place** — do not delete the
  entry. The point of this file is that history is never lost, including
  the history of things that *used* to be broken.
- **Newest entries go at the top** of both the detailed section and the
  quick-index in "Regression Checklist" at the end.
- If a future session finds no new confirmed bugs, still update this file's
  "Last reviewed" line below so it's clear the file was checked, not just
  stale.

**Last reviewed:** 2026-08-07, second pass (Dedicated Dashboard **Mobile**
QA follow-up — 390×844 only, both projects, Figma Mobile page re-attempted,
plus mobile-only surfaces: hamburger nav drawer, Notifications/Profile
overlays, Invite dialog layout parity, data-truncation recovery)

**Last reviewed:** 2026-08-07, first pass (Dedicated Dashboard QA session —
Figma comparison attempt via Dev Mode, empty-state project + populated "Dior
Brand" project, desktop + mobile, functional/data/edge-case/diagnostics
passes)

**Last reviewed:** 2026-08-06 (Full-suite regression run + release-readiness
pass across all 25 existing specs, plus new coverage for Dashboard, Magic
Triangle Overview, Financial, Business Plan, Invite, and Minor Global
Settings)

**How this initial version was populated:** no destructive/full regression
pass has been executed against the live app yet as of this writing — the
work done so far was app discovery (`PROJECT_KNOWLEDGE.md`) and checklist
planning (`RELEASE_CHECKLIST.md`), not systematic bug-hunting. This file's
initial entries are therefore seeded from **already-confirmed** facts sitting
in the codebase (`README.md` "Known quirks", `CLAUDE.md`, and code comments
in `tests/*.spec.js` written by whoever built the suite through real,
executed test runs), plus **one** anomaly directly observed during this
session's live exploration. Nothing below is speculative — items whose root
cause or exact scope is still uncertain are explicitly marked as such rather
than overstated.

**Last reviewed:** 2026-11-11/12 (Autotest suite updated to the redesigned
UI — Project form, Client needs Category, 3-step Product wizard, IP Rights,
Supplier/Location drawers, Action plan Area/Assignee, split Implementation
navigation, Business plan document view. Re-verified "Running-Cost Resources
Cannot Be Created" — still open, root cause confirmed, workaround found.
2026-11-12 full run: 1 new confirmed bug — "MVP List Shows Only the First 15
MVPs")

**Last reviewed:** 2026-10-20, second pass (Targeted re-test of "Deleting a
Marketing Channel Does Not Refresh Income, Cash Flow and Balance Sheet":
3/3 delete cycles + multi-channel delete + cancel refresh correctly — now
Fixed; no new bugs)

**Last reviewed:** 2026-10-20 (FTE per year for line staff + financial
reports refresh after mutations in Team, Marketing, Financing, Repayments,
Funding settings, Products, Resources; EN + DE; 5 new confirmed bugs;
"Employment % Inputs Silently Truncate Decimals" now Fixed)

**Last reviewed:** 2026-10-07, fourth pass (Targeted re-test of "Marketing
Funnel Deals Do Not Feed Revenue": 10 → 20 deals, revenue and
revenue_breakdown unchanged — still Confirmed; no new bugs)

**Last reviewed:** 2026-10-07, third pass (Income tax loss carry-forward
re-test: accumulation, partial use, exact-equal boundary 300 000 vs
300 000, Income tab, Business plan and PDF, 7 existing projects — all
correct; no new confirmed bugs. The carry-forward is still not shown in the
Income table — UX suggestion, not logged as a bug)

**Last reviewed:** 2026-10-07, second pass (Working capital re-test #2 with
focus on passing the values to the financial tables: fresh 5-year project,
defaults 60/30/30, custom 60/45/15, explicit 0, Balance sheet / Cash flow
tabs, Business plan and PDF, balance on 8 projects. Math correct
everywhere; one-line Cash flow still present; validation-text bug Fixed;
2 new confirmed bugs)

**Last reviewed:** 2026-10-07 (Business plan → Go-to-Market marketing-channel
page redesign: KPI row + funnel, channels with 1/2/3/4/5 steps on a
5-channel project, preview vs horizontal vs PDF export, AI intro after
Update. Numbers and edge cases correct; 3 new confirmed bugs. "Marketing
Funnel Deals Do Not Feed Revenue" still present)

**Last reviewed:** 2026-10-06 (Magic Triangle USP / Value proposition
saving — client feedback p. 5: manual save, leave/return/reload, German UI,
mobile, AI fill via page-level Assist me in EN/DE/UA, save-error handling,
Auto analyze interaction. Manual and AI saves persist on the backend; 3 new
confirmed bugs)

**Last reviewed:** 2026-10-05, fourth pass (Number & date localization
re-test in German on dev — 20 pages × 3 projects (UAH/EUR/CHF) in DE and EN,
every numeric input in every form, edit-form saved values, date picker,
profile/notifications dates. All 2026-10-01 number bugs still Confirmed
(integer-only inputs now also seen on Product quantity per year); 2 new
confirmed bugs)

**Last reviewed:** 2026-10-05, third pass (German localization — every screen
of "Autotest Project Karina" plus global, public and logged-out screens,
EN↔DE string diff incl. create/edit drawers, dropdowns, validation, delete
dialogs, tooltips; 2 new confirmed bugs; earlier untranslated strings still
present)

**Last reviewed:** 2026-10-05, second pass (Working capital re-test: AR /
Inventory / AP formulas, defaults 60/30/30, custom values, AP = COGS only,
balance and cash check on a fresh 5-year project + 7 existing projects — all
correct; "one net Working Capital line" still Confirmed; empty-field save is
now blocked by validation, but with a raw technical message — 1 new
confirmed bug)

**Last reviewed:** 2026-10-05 (Income tax loss carry-forward: accumulation,
partial/full use, profit→loss→profit, boundary 199 998 vs 200 000, 19.5%
rounding, Cash flow / Balance sheet downstream — all correct; no new
confirmed bugs)

**Last reviewed:** 2026-10-01, fifth pass (Working capital AR/Inventory/AP:
formulas, defaults 60/30/30 and balance verified on 4 projects incl. a fresh
one — correct; "Working Capital Defaults … Not Applied" now Fixed; 1 new
confirmed presentation issue in the Cash flow table)

**Last reviewed:** 2026-10-01, fourth pass (Marketing funnel fix: step rename
saved, deals recalculated live, "Step N: name" in details — all fixed;
deals still not fed into revenue; 1 new confirmed bug)

**Last reviewed:** 2026-10-01, third pass (Resources → Investment "Useful life,
years" + depreciation in P&L / balance sheet / cash flow: backend math
correct, UI field missing and investment creation blocked; 2 new confirmed
bugs; "Amortization Period Capped at 100" status changed)

**Last reviewed:** 2026-10-01, second pass (Number / date / translation
localization re-test EN↔DE on dev after the number-localization deploy: 6 of 7
bugs from 2026-09-30 still Confirmed, the financing-year 422 bug Partially fixed; 3 new confirmed bugs)

**Last reviewed:** 2026-10-01 (Audit-fix re-test on dev: delete error
handling in Competitors / Operations → Other, Dashboard & Profile load-error
state, AI chat lazy loading, German UI / shared business-plan `?lang=`,
Business plan navigation; 2 new confirmed bugs)

**Last reviewed:** 2026-09-30 (Number localization EN/DE — every page in
both languages, localized numeric inputs, pluralization; 7 new confirmed
bugs; Line staff creation now Fixed)

**Last reviewed:** 2026-09-29 (Income: "Direct service costs" category —
backend counts it like COGS; UI row still missing; no new bugs, existing
entry re-verified)

**Last reviewed:** 2026-09-28 (Create MVP + in-form Assist me re-test:
partially fixed; 2 new confirmed bugs. Also Product validation re-test.)

**Last reviewed:** 2026-09-24 (Assist me — AI form-fill in every create
form of the project, 15 forms; 6 new confirmed bugs; Assist me opened
22/22 times)

**Last reviewed:** 2026-09-23 (Products — Subscription payment period +
Cost type (COGS vs. Other direct costs) numeric verification against the
live financial-evaluation / balance-sheet APIs; 4 new confirmed bugs, one
previous bug now Fixed)

**Last reviewed:** 2026-09-21 (Create/Edit Product modal redesign review —
verified the new Cost type / Sourcing / Subscription type fields added for
the COGS-vs-Other-direct-cost income statement task; one new confirmed bug
found)

**Last reviewed:** 2026-08-26 (Dior-Brand decoupling refactor — full suite
migrated onto a bootstrapped "Autotest Project"; two new confirmed bugs found
via stricter persistence assertions and a live network probe)

---

## MVP List Shows Only the First 15 MVPs — No Pagination or "Load More"

### Module
Magic triangle → MVP (`/project/{id}/triangle/mvp`)

### Feature
MVP list

### Status
**Confirmed** (2026-11-12, dev `frontv2`, project "Autotest Project Karina")

### Description
`GET /projects/{id}/mvps` is paginated (15 items per page; on this project the response meta shows `current_page: 1`, `last_page: 2`). The MVP page renders only page 1 and offers no pagination control, "Load more" button or infinite scroll, so every MVP after the 15th is invisible in the UI — including one the user has just created.

### Expected Behaviour
All MVPs of the project are reachable in the list (pagination, "Load more" or infinite scroll), and a newly created MVP is visible right after creation.

### Actual Behaviour
The list always stops at 15 cards (oldest first). A newly created 16th MVP is saved (it counts toward `last_page: 2`) but never appears; scrolling and reloading do not help.

### Root Cause (if known)
The frontend requests only the first page of the paginated `/mvps` endpoint and ignores `meta.last_page`. Not verified in code.

### Regression Risk
High for projects with many MVPs — users cannot see, edit or delete MVPs beyond the 15th and may think creation failed. Other lists backed by paginated endpoints may have the same gap.

### Areas Affected
Magic triangle → MVP list; indirectly Action plan "Area: MVP", Business plan MVP content (not checked).

### QA Notes
Found in a full suite run on 2026-11-12: `tests/24-create-mvp.spec.js` test 01 and `tests/25-edit-mvp.spec.js` test 00 fail because the created MVP's card never appears (`findMvpHeading`). Verified by reading the `/mvps` response on page load: 15 items, `last_page: 2`, and 15 cards in the UI. The suites passed earlier the same week while the project still had ≤ 15 MVPs.

### Workaround (if any)
None in the UI. Deleting old MVPs brings newer ones into the first 15.

---

## Deleting a Marketing Channel Does Not Refresh Income, Cash Flow and Balance Sheet

### Module
Operations → Marketing channels → Financial → Forecasts & Reports

### Feature
Refresh financial reports after a mutation (no page reload)

### Status
**Fixed** (re-tested 2026-10-20 16:25–16:31 EEST, dev `frontv2`: 3/3 create → delete cycles plus a multi-channel delete now refetch `financial-evaluation`, `cash-flow` and `balance-sheet`; SPA figures equal the reload and return exactly to the pre-create baseline. Report: `test-reports/Marketing_Channel_Delete_Reports_Refresh_Retest_Test_Report.md`)

Previously **Confirmed** (2026-10-20, dev `frontv2`, 3/3 reproductions)

### Description
After a channel is deleted, opening Forecasts & Reports through the sidebar shows the old figures. No `financial-evaluation`, `cash-flow` or `balance-sheet` request is sent. The deleted channel's cost stays in the Income "Marketing channels" row, in Net profit, Closing cash, Total assets and Total equity, and in the OPEX tile. A reload shows the correct figures. Creating and editing a channel refresh the reports correctly.

### Expected Behaviour
After create, edit **and delete**, the three reports show the new figures without a reload (acceptance criterion of the FTE / report refresh task).

### Actual Behaviour
After delete the reports keep the pre-delete figures until a reload (for example, "Marketing channels" stays at −36 000 / −72 000 / −96 000 instead of 0).

### Root Cause (if known)
Probably the delete mutation in `useMarketingMutations.ts` does not call the shared "invalidate financial reports" helper (create and update do). A control run with navigation and no mutation does not refetch `financial-evaluation`, so the refetch after create and edit is caused by invalidation.

### Regression Risk
Medium — users see wrong financials after deleting a channel. Any other delete mutation that is not wired to the helper could have the same gap.

### Areas Affected
Forecasts & Reports (Income, Cash flow, Balance sheet, KPI tiles).

### QA Notes
Network-level check: GET requests to the three report endpoints are recorded between the mutation and the sidebar navigation, and the figures read through the SPA are compared with the figures after a reload. Evidence: `test-reports/screenshots/FTE_2026-10-20_channel_delete_stale_reports.png`. Report: `test-reports/FTE_and_Financial_Reports_Refresh_Test_Report.md`.

### Workaround (if any)
Reload the page.

---

## Running-Cost Resources Cannot Be Created — "Create" Does Nothing, No Request, No Message

### Module
Operations → Resources → Create new resource (Running costs)

### Feature
Create running-cost resource

### Status
**Confirmed — still open, scope narrowed** (2026-11-12, dev `frontv2`): fails only when the drawer is switched from Investment to Running costs **inside** the drawer. Opening "Create new resource" while the list filter is already on **Running costs** opens the drawer in Running costs mode and creation works (201). Re-tested 2026-11-11 with 6/6 reproductions of the in-drawer path; first confirmed 2026-10-20; worked on 2026-10-01.

### Description
With every visible field filled (name, category "Rent and Utilities", payment type Monthly or Annually, start year 2027, cost per year for both years, with or without a description), clicking **Create** or pressing Enter does nothing. No `POST /resources` request is sent, no validation message or toast is shown, and the dialog stays open. An Investment resource created in the same session succeeds (201).

### Expected Behaviour
The running-cost resource is created, or the blocking field is highlighted with a message.

### Actual Behaviour
Silent no-op. Running costs cannot be added at all.

### Root Cause (if known)
Confirmed 2026-11-12 by reading the react-hook-form state after Create: the drawer opens in Investment mode, whose single "Investment amount" field is bound to `yearly_costs.0`. After switching to Running costs that empty `{}` stays at index 0 and the per-year costs are appended at indexes 1…n (`yearly_costs: [{}, {year: 2027, quantity: …}, …]`). The schema requires `year`/`quantity` on every item, so validation fails on `yearly_costs.0` — a field that is not rendered, hence no message. (Filling the Investment tab first makes index 0 valid, which is why that also "works".)

### Regression Risk
High — running costs feed OPEX, "Running resources" in Income and the cash flow. Users cannot add them.

### Areas Affected
Operations → Resources; indirectly all financial reports.

### QA Notes
The suite's own `tests/16-create-resources.spec.js` / `17-edit-resources.spec.js` also fail on 2026-10-20, but for a different reason: test drift, because the Investment form now has an "Investment amount" field. Evidence: `test-reports/screenshots/FTE_2026-10-20_running_cost_create_no_request.png`. Update 2026-11-11: the Investment drift is fixed in the suite; `16-create-resources.spec.js` test 02 and `17-edit-resources.spec.js` test 00 now fail **because of this bug** (modal never closes) and should pass as soon as it is fixed. (The 2026-10-20 screenshot and reports were removed from `test-reports/` during the 2026-11-11 cleanup.)

### Workaround (if any)
Select **Running costs** in the list filter first, then click "Create new resource" — the drawer opens in Running costs mode and saves normally. Since 2026-11-12 the suite uses this path (`createResource` in `tests/helpers/resource.helper.js`), so `16`/`17` pass; the in-drawer switch itself is no longer exercised by the suite.

---

## Line-Staff Card Shows FTE With a Decimal Point in German ("0.5 Personal")

### Module
Operations → Team and staff (DE)

### Feature
FTE display on the line-staff card

### Status
**Confirmed** (2026-10-20, dev `frontv2`)

### Description
In German, the line-staff card shows "0.5 Personal", while the salary on the same card is localized ("₣ 100.000"). The role's details panel ("FTE pro Jahr") correctly shows "0,5" / "1,3", and the edit form prefills "0,5" / "1,3".

### Expected Behaviour
"0,5 Personal" (DE decimal comma), consistent with the details panel and the form.

### Actual Behaviour
"0.5 Personal".

### Root Cause (if known)
The card renders the raw number without the locale number formatter.

### Regression Risk
Low — cosmetic. Inconsistent with the DE number-localization work.

### Areas Affected
Team and staff card (DE).

### QA Notes
Evidence: `test-reports/screenshots/FTE_2026-10-20_de_card_fte_dot.png`.

### Workaround (if any)
—

---

## "Total Salary Costs" Header Ignores FTE / Head Count

### Module
Operations → Team and staff

### Feature
"Total salary costs" summary tile

### Status
**Confirmed** (2026-10-20, dev `frontv2`)

### Description
The tile adds up the nominal annual salaries and ignores FTE and employment %:
- FTE 2 / 2 × ₣50 000 shows ₣50 000 (Income: −100 000 per year);
- FTE 0.5 / 1.3 × ₣100 000 shows ₣100 000 (Income: −50 000 / −130 000);
- a key member at 50 % × ₣80 000 shows ₣80 000 (Income: −40 000).

### Expected Behaviour
The tile matches the salary cost the reports use (salary × FTE × employment %), or its label makes clear that it is the sum of nominal salaries.

### Actual Behaviour
The tile and the Income "Team & staffing" row disagree.

### Root Cause (if known)
The tile sums `salary` only.

### Regression Risk
Low–Medium — more visible now that FTE is fractional.

### Areas Affected
Team and staff header.

### QA Notes
Integer head count (FTE 2) is also ignored, so this is not specific to fractional FTE.

### Workaround (if any)
Use the Income table.

---

## "Total Salary Costs" Shows "₣ 0000" When the Team Is Empty

### Module
Operations → Team and staff

### Feature
"Total salary costs" summary tile, empty state

### Status
**Confirmed** (2026-10-20, dev `frontv2`, EN and DE)

### Description
With no team roles, the tile shows "₣ 0000" ("Gesamte Gehaltskosten ₣ 0000" in DE) instead of "₣ 0". With at least one role it is formatted correctly ("₣ 100,000").

### Expected Behaviour
"₣ 0".

### Actual Behaviour
"₣ 0000".

### Root Cause (if known)
Unknown — probably a placeholder or formatting fallback for an empty or zero total.

### Regression Risk
Low — cosmetic.

### Areas Affected
Team and staff header.

### QA Notes
Evidence: `test-reports/screenshots/FTE_2026-10-20_total_salary_0000.png`.

### Workaround (if any)
—

---

## Business Plan / PDF Cash Flow Shows the Working Capital Line With an Inverted Sign

### Module
Business plan → Financials → Cash flow (editor preview and PDF export)

### Feature
Operating activities — working-capital movement

### Status
**Confirmed** (2026-10-07, dev `frontv2`, fresh project "Audit WC 1007" and "Autotest Project Karina")

### Description
In the Financial → Cash flow tab, the "Working Capital" row has a "−" operator icon, so `€60K` reads as an outflow. The Business plan and the exported PDF reuse the values but drop the operator icons. The row is printed as a plain signed amount:
- **63K** (positive, black) in 2026–2027, when working capital grows and cash goes **out**;
- **−63K** (red) in 2029–2030, when working capital is released and cash comes **in**.

The column does not add up as printed (2026: 164.25K + 0 + 63K ≠ Operating Cash Flow 101.25K). In the same plan, CAPEX is printed with its cash-effect sign (Karina: CAPEX −1, Investing Cash Flow −1), so only the working-capital row is inverted.

### Expected Behaviour
Cash effect signs: −63K in 2026–2027 and +63K in 2029–2030. Ideally the three required lines are shown: −ΔAR, −ΔInventory, +ΔAP.

### Actual Behaviour
The sign is the opposite of the cash effect. Investors reading the PDF see working capital as a source of cash in growth years.

### Root Cause (if known)
The Business plan table prints the raw `working_capital_change` (an increase in working capital) without negating it. The app tab compensates with the operator icon, which the plan template does not render.

### Regression Risk
Medium — investor-facing document; the operating cash flow appears not to add up.

### Areas Affected
Business plan (vertical and horizontal) and the PDF export, Cash flow table.

### QA Notes
Fresh project, One-time product 365 000 / COGS 146 000, quantities 1/2/2/1/0, DIO 60 / DSO 45 / DPO 15 → 2026: Net Profit 164.25K, Working Capital printed "63K", OCF 101.25K. Evidence: `test-reports/screenshots/WC_2026-10-07_bp_pdf_cash_flow.png` (PDF p.6) vs `WC_2026-10-07_cf_single_line.png` (app tab with the "−" icon). Report: `test-reports/Working_Capital_Retest_2_Test_Report.md`. Related: "Cash Flow Shows One Net 'Working Capital' Line…".

### Workaround (if any)
—

---

## Domicile "Germany" Has No Legal Forms, So a Project With Domicile Germany Cannot Be Created

### Module
Projects → Create project (Business setup)

### Feature
Domicil → Legal form dependency (`GET /reference/legal-forms?country_id=…`)

### Status
**Confirmed** (2026-10-07, dev `frontv2`)

### Description
"Legal form" is required. For Switzerland and Austria it offers six forms (Sole Proprietorship, General Partnership, Limited Partnership, Limited Liability Company, Stock Corporation, Cooperative). With Domicil = **Germany**, the dropdown is empty, so the form cannot be submitted. Create project shows "Legal form is required" and sends no request.

### Expected Behaviour
German legal forms are offered (e.g. Einzelunternehmen, GbR, OHG, KG, GmbH, UG, AG, eG), or Legal form is optional when a country has none.

### Actual Behaviour
Empty dropdown and a blocking validation error.

### Root Cause (if known)
Missing reference data for Germany in the legal-forms list (suspected; only Switzerland and Austria were checked as working).

### Regression Risk
High for the German market — German users cannot create a project with their own domicile.

### Areas Affected
Create project; probably Edit project for existing projects that switch to Germany (not checked).

### QA Notes
Found while setting up the 2026-10-07 working-capital re-test. Other countries were not checked.

### Workaround (if any)
Choose another domicile (e.g. Switzerland or Austria).

---

## Business Plan Marketing Channel Page: Cost KPI Shows "Cost per month" Instead of "Cost per year"

### Module
Business plan → 2. Market & Strategy → Go-to-Market (editor preview, horizontal view, PDF export)

### Feature
Per-channel KPI row (Cost / New clients / Cost per client / Win rate)

### Status
**Confirmed** (2026-10-07, dev `frontv2`, project Autotest Project Karina, 5 channels)

### Description
The redesign spec defines the first KPI as "Cost per year" (the channel's cost for the year), with Cost per client = Cost per year / New clients. The page labels it **"Cost per month"** and shows the sum of the step costs as entered (₣12,000). The AI intro also says "new clients per month". For the same channel, the Income statement books **−144K** per year under "Marketing channels" (12,000 × 12). So the plan shows a monthly figure that the financial model treats as one twelfth of the annual cost. The acceptance numbers (12 000 → ₣167 per client) match only because 12 000 is divided by 72 directly.

### Expected Behaviour
The label reads "Cost per year" and the value is the channel's annual cost, consistent with the Income statement. Cost per client is derived from that annual cost.

### Actual Behaviour
The label reads "Cost per month" and the value is the monthly step-cost sum. The Income statement uses ×12 for the same channel.

### Root Cause (if known)
Funnel step `cost` is stored as a monthly amount (Income multiplies by 12). The page renders it unchanged under a monthly label instead of annualising it. Product needs to confirm whether "New clients" is also a monthly figure.

### Regression Risk
Medium–High — investor-facing document. Cost per client can be off by 12× depending on how the reader interprets the period.

### Areas Affected
Business plan Go-to-Market (all views + PDF), AI intro text, Income statement "Marketing channels" line.

### QA Notes
Re-check with one channel at 20 000 → 5% → 40% → 60% → 30%, cost 12 000. Compare the KPI label and value against Income → "Marketing channels" for the same year. Screenshot: `test-reports/screenshots/BPMC_2026-10-07_pdf_p9_4step.png`. Report: `test-reports/Business_Plan_Marketing_Channels_Test_Report.md`.

### Workaround (if any)
—

---

## Business Plan Marketing Channel Page Is Missing Drop-off, the "Year 2027" Label and the Weakest-Transition Highlight

### Module
Business plan → Go-to-Market (editor preview, horizontal view, PDF export)

### Feature
Marketing-channel funnel block (redesign)

### Status
**Confirmed** (2026-10-07, dev `frontv2`, channels with 1, 2, 3, 4 and 5 steps)

### Description
Three elements required by the redesign spec are not rendered in any view or in the PDF:
1. **Drop-off** (100% − step conversion): no drop-off value appears anywhere. Only "X% move on" is shown.
2. **Year under the channel title** ("Year 2027"): absent. Product · Client is shown directly under the title.
3. **Weakest transition highlight** (minimum conversion, excluding the first): every "move on" badge has the same white background and grey text `rgb(96,117,141)`. Examples: 30% in the 20 000→72 channel, 10% in the 5-step channel and 0% in the 3-step channel were not highlighted.

### Expected Behaviour
Each stage shows its drop-off. The channel title is followed by "Year <first plan year>". The weakest transition is shown in an accent colour.

### Actual Behaviour
None of the three is rendered.

### Root Cause (if known)
Not implemented in the template (no "drop" / "Year" text in the DOM; badges share one style).

### Regression Risk
Medium — acceptance criterion "Drop-off у каждого этапа = 100% − конверсия" cannot pass.

### Areas Affected
Business plan Go-to-Market in all orientations and the PDF.

### QA Notes
Use a channel whose weakest non-first conversion is unique (e.g. 50/20/50/10/40 → expect 10% highlighted). Screenshots: `BPMC_2026-10-07_4step_vertical.png`, `BPMC_2026-10-07_5step.png`.

### Workaround (if any)
—

---

## Business Plan Funnel Styling Ignores the Number of Steps (Last Tier Not Dark, White Text on Light Tiers, One-Step Channel Drawn as a Funnel)

### Module
Business plan → Go-to-Market (editor preview, horizontal view, PDF export)

### Feature
Funnel tier colours / text colour / one-step rendering

### Status
**Confirmed** (2026-10-07, dev `frontv2`)

### Description
Tier colours come from a fixed 5-colour palette by index instead of from the step count:
- **Last tier is dark only when there are exactly 5 tiers.** With 3 tiers the result tier is `rgb(90,163,218)` and with 4 tiers it is `rgb(67,143,201)` (both mid-blue). With 6 tiers (5-step channel) tiers 5 and 6 share the same dark colour, so the result is not distinguishable.
- **Tier numbers are always white**, including on the light tiers. Measured contrast: 1.87:1 (`rgb(113,200,240)`), 2.12:1, 2.73:1 and 3.49:1. Only the dark tier passes 4.5:1 (5.67:1).
- **A one-step channel is still drawn as a 2-tier funnel** (333 → 7% → 23). The spec requires KPIs only.

### Expected Behaviour
The result tier is always the dark one. Text is dark on light tiers and white on dark tiers. A one-step channel shows only the KPI row.

### Actual Behaviour
As described above, in the preview and in the PDF.

### Root Cause (if known)
Index-based palette and a fixed white text colour in the tier component. No special case for a single step.

### Regression Risk
Low–Medium — visual and legibility issue in the printed investor document.

### Areas Affected
Business plan Go-to-Market, all orientations, PDF.

### QA Notes
Check channels with 1, 2, 3 and 5 steps (1 → 6 tiers incl. "New clients"). Screenshots: `BPMC_2026-10-07_3ch_page2.png`, `BPMC_2026-10-07_3ch_page3.png`, `BPMC_2026-10-07_5step.png`, `BPMC_2026-10-07_pdf_p13_1step.png`.

### Workaround (if any)
—

---

## Magic Triangle Cards Not Refreshed After an AI Save — the Next Manual Edit Overwrites the AI's USP / Value Proposition

### Module
Magic triangle → Strategy details (USP, Value proposition) + page-level Assist me

### Feature
Live refresh after AI `action` events; `PUT /projects/{id}/value-proposition`

### Status
**Confirmed** (2026-10-06, dev `frontv2`, 4/4 reproductions)

### Description
When the AI saves the USP or the VP, the SSE stream emits `{"type":"action","entity":"value_proposition","operation":"updated"}` and the AI replies "saved". The page sends no `GET /magic-triangle`, so the cards (and the edit drawers' pre-fill) keep the old value until a manual reload. The PUT always sends `name` + `usp` + `description`, so saving one field from a drawer writes the stale copy of the other one and wipes the AI's change.

### Expected Behaviour
The cards update as soon as the AI save completes; editing one field never changes the other.

### Actual Behaviour
The cards stay stale. Editing the VP right after an AI USP save sent `"usp":"<previous value>"`; after a reload the AI's USP was gone.

### Root Cause (if known)
The frontend ignores `action` events for `value_proposition` / `strategy_health` (no query invalidation), and the update uses a full-object PUT built from the cached record.

### Regression Risk
High — silent data loss; matches the client's complaint "AI says it added it, but it doesn't". Likely also affects edits in two tabs at the same time (not tested).

### Areas Affected
Magic triangle USP / Value proposition cards and drawers; possibly any page where the AI can update records without a live refresh.

### QA Notes
After every AI save, check the card **without** reloading, then make a manual edit of the other field and reload. Screenshots: `test-reports/screenshots/USPVP_2026-10-06_ai_vp_stale_card.png`, `USPVP_2026-10-06_ai_usp_overwritten.png`. Report: `test-reports/USP_Value_Proposition_Test_Report.md`.

### Workaround (if any)
Reload the page after every AI save before editing.

---

## USP / Value Proposition Save Failure Shows No Error Message

### Module
Magic triangle → Strategy details → USP / Value proposition edit drawer

### Feature
Error handling of `PUT /projects/{id}/value-proposition`

### Status
**Confirmed** (2026-10-06, dev `frontv2`; HTTP 500 and network failure simulated)

### Description
On a failed save, the drawer just stays open with an active Update button. No toast or inline error is shown. A successful save shows no toast either (the drawer just closes).

### Expected Behaviour
A clear "could not save" message; the entered text is kept for a retry.

### Actual Behaviour
Silent failure; the user can't tell whether the text was saved. Retrying after recovery works (200).

### Root Cause (if known)
No `onError` handling in the update mutation (presumed).

### Regression Risk
Medium–High — one real (not simulated) save failed with a CORS / `net::ERR_FAILED` error in this session and went unnoticed in the UI; it did not reproduce on retry.

### Areas Affected
USP and Value proposition drawers.

### QA Notes
Simulate with `page.route('**/value-proposition', r => r.request().method()==='PUT' ? r.fulfill({status:500, body:'{}'}) : r.continue())`. Screenshot: `test-reports/screenshots/USPVP_2026-10-06_usp_put_500.png`.

### Workaround (if any)
Reload after saving to confirm.

---

## "Auto Analyze" Silently Overwrites Manually Entered USP and Value Proposition

### Module
Magic triangle → "Auto analyze" (`POST /projects/{id}/dashboard/ai-fill`)

### Feature
AI regeneration of the Strategy details

### Status
**Confirmed** (2026-10-06, dev `frontv2`). Needs product confirmation whether overwriting is intended.

### Description
"Auto analyze" replaces user-typed USP and VP text (and the hidden VP `name`) with generated text, with no warning or undo.

### Expected Behaviour
Manual text is kept, or the user is warned before it is replaced.

### Actual Behaviour
The manual USP "QA-USP-1006 manual before Auto analyze" was replaced by AI-generated Ukrainian text, both on the page and after a reload.

### Root Cause (if known)
`ai-fill` writes all Strategy details fields unconditionally.

### Regression Risk
Medium — user content is lost; plausible cause of "Einträge wurden nicht gespeichert".

### Areas Affected
Magic triangle USP, Value proposition, hidden VP `name`.

### QA Notes
The cards are labelled "Auto-generated analysis" even though users can edit them.

### Workaround (if any)
Don't run "Auto analyze" after editing USP/VP manually.

---

## German Date Picker Shows "15 Oktober 2026" (No Period) — a Third Date Style Next to "28.08.2026"

### Module
Implementation → Action plan → "Neuen Aktionspunkt erstellen"

### Feature
Due-date picker display value

### Status
**Confirmed** (2026-10-05, dev `frontv2`)

### Description
The calendar itself is localized ("Oktober 2026", "Mo Di Mi Do Fr Sa So"). After picking a day, the field shows `15 Oktober 2026`. The German long format requires a period after the day: `15. Oktober 2026`. The same date type on the Action plan cards is shown as `28.08.2026` (in both languages), and the Dashboard uses `21. Sept. 2026`. In English the picker shows `15 October 2026`, while the Dashboard shows `Sep 21, 2026`.

### Expected Behaviour
`15. Oktober 2026` (or `15.10.2026`), and one date style per language for the same kind of date.

### Actual Behaviour
`15 Oktober 2026`; three different styles across the app.

### Root Cause (if known)
Likely a hard-coded `d MMMM yyyy` pattern with only the month name localized.

### Regression Risk
Low — presentation only.

### Areas Affected
Action item drawer (create/edit), possibly other date pickers using the same component.

### QA Notes
Screenshot: `test-reports/screenshots/NUM_2026-10-05_de_action_item_date_selected.png`.

### Workaround (if any)
—

---

## Employment % Inputs Silently Truncate Decimals and Long Values ("12,5" → 12, "1500,50" → 15)

### Module
Operations → Team and staff → "Teamrolle erstellen" (key member)

### Feature
Employment % per year inputs

### Status
**Fixed** (re-verified 2026-10-20 in EN: `12.5` / `37.5` are kept in the input and Create is blocked with "Please enter a whole number" under each field; no request is sent. DE not re-checked. Was: Confirmed 2026-10-05, dev `frontv2`, both languages)

### Description
Typing `12,5` (DE) or `12.5` (EN) leaves `12`; typing `1500,50` leaves `15`. The decimal part and any digits beyond three are dropped silently, with no message. (The salary field in the same form has the separate 10×/100× issue — see "Integer-Only Numeric Inputs Drop the Decimal Separator".)

### Expected Behaviour
Either decimals are accepted (`12,5 %`), or the field blocks/announces the invalid input (e.g. "0–100, ganze Zahl").

### Actual Behaviour
The value is silently truncated.

### Root Cause (if known)
Input mask limited to 3 digits / integers without feedback.

### Regression Risk
Low–Medium — part-time percentages like 12,5 % or 37,5 % are stored wrong without notice.

### Areas Affected
Employment % grid in the key-member form.

### QA Notes
Found by typing the DE/EN acceptance cases into every numeric input of every form.

### Workaround (if any)
Enter whole percentages only.

---

## German Forms Show English Validation Messages, and Raw Schema Text in the Financing Form

### Module
Implementation → MVP / Action plan; Operations → Other → Location analysis; Financial → Funding & Setup

### Feature
Client-side form validation messages

### Status
**Confirmed** (2026-10-05, dev `frontv2`, project Autotest Project Karina)

### Description
With Deutsch selected, submitting these forms empty shows English validation texts (identical to the English UI):
- MVP builder (`/mvp/manage`): "Client is required", "Feature name is required".
- "Neuen Aktionspunkt erstellen": "Task name is required" (next to the German "Priorität ist erforderlich").
- "Standort hinzufügen": "Location name must be at least 2 characters", "Address is required".
- "Finanzierungsaktivität erstellen": "Expected 'issuing_equity' | 'issuing_debt', received null" (Typ), "Expected number, received null" (Betrag, Jahr) — raw schema-library text with internal enum values, in both languages.
Other forms (Clients, Products, Competitors, Criteria, Marketing, Team, Resources, Risk, Create/Edit project, Sign-up) show German messages.

### Expected Behaviour
All validation messages are German and written for users.

### Actual Behaviour
English messages in three forms; raw technical text in the financing form.

### Root Cause (if known)
These schemas use hard-coded English messages or no custom message (default Zod text), instead of i18n keys.

### Regression Risk
Low–Medium — visible on every failed submit in German.

### Areas Affected
MVP builder, Action item drawer, Location drawer, Financing activity drawer. Same root cause as "Working Capital Validation Shows Raw Technical Text" (Working capital form).

### QA Notes
Found by an EN↔DE identical-string diff after an empty submit. Screenshots: `test-reports/screenshots/L10N_2026-10-05_de_mvp_validation_english.png`, `..._de_action_item_validation.png`, `..._de_location_validation.png`, `..._de_funding_activity_validation.png`.

### Workaround (if any)
—

---

## Further Untranslated Strings in the German UI (Create Entry, Action Item, MVP, AI Chat, Business Plan, ARIA)

### Module
Financial → Forecasts & Reports; Implementation; Assist me; Business plan; Global / auth pages

### Feature
UI translations (de)

### Status
**Confirmed** (2026-10-05, dev `frontv2`)

### Description
New English strings found in German, in addition to the earlier entries (which are still present):
- Forecasts & Reports → "Eintrag erstellen": type toggle "Revenue / Expense".
- "Neuen Aktionspunkt erstellen": Phase value/options "To Do / In Progress / In Review / Done"; empty owner list "Empty list". The Action plan board also has an "In Review" column in English.
- MVP builder: feature type option "Core" (next to German "Optional").
- Assist me drawer: input placeholder "Frag AI etwas..." uses the English "AI" while the disclaimer says "Die KI…"; screen-reader-only heading "AI Chat" and region label "Messages".
- Business plan (editor, horizontal view, shared `?lang=de`): "Cash Conversion Cycle" in the Betriebskapital block; slider button text "Next slide".
- Accessibility labels: "Close" (Share dialog, Business-Plan-Assistent widget), "Loading..." (app loader, reset-password page), "Show password", "Login image" (sign-in/sign-up), "Dismiss" (toast), "Notifications Alt+T" (toast region), image alt "Laravel" on the logo.

### Expected Behaviour
All UI strings German.

### Actual Behaviour
Mixed German/English.

### Root Cause (if known)
Missing i18n keys / hard-coded strings.

### Regression Risk
Low — presentation only.

### Areas Affected
See list above.

### QA Notes
EN↔DE identical-string diff over 40+ screens and their drawers/dropdowns. Screenshots: `test-reports/screenshots/L10N_2026-10-05_de_create_entry_revenue_expense.png`, `..._de_action_item_empty_list.png`, `..._de_ai_chat_header_english.png`, `..._de_bp_Teilen.png`, `..._de_shared_bp.png`.

### Workaround (if any)
—

---

## Working Capital Validation Shows Raw Technical Text "Expected number, received null"

### Module
Financial → Funding & Setup → Working capital

### Feature
DIO / DSO / DPO input validation

### Status
**Fixed** (re-tested 2026-10-07, dev `frontv2`: the message is now "This field is required", no request is sent, and the saved values stay after a reload. Cash conversion cycle still shows "0days" while the fields are empty.) — was: **Confirmed** (2026-10-05)

### Description
When DIO, DSO or DPO is cleared and **Save changes** is clicked, the save is now blocked (no request is sent — the earlier silent no-op is gone), but each empty field shows the raw schema-library message "Expected number, received null" in English. The placeholders show the defaults (30 / 60 / 30), but empty fields are not filled with them. While a field is empty, Cash conversion cycle treats it as 0 (DIO 30 + DSO empty − DPO 30 → "0days").

### Expected Behaviour
A plain, translated message such as "Enter a number of days (0 or more)", or empty fields fall back to the defaults 60 / 30 / 30.

### Actual Behaviour
"Expected number, received null" under each empty field; cycle calculated with 0 for the empty field.

### Root Cause (if known)
The default form-validation (Zod) error text is shown without a custom message.

### Regression Risk
Low — presentation only; no wrong data is saved.

### Areas Affected
Working capital form; possibly other forms using the same numeric validation.

### QA Notes
Backend validation is sound: `PUT /financial-settings` rejects null (required), negative (min 0), decimals (integer) and > 65535 with 422. Typing "-5" in the UI strips the minus and saves 5. Screenshot: `test-reports/screenshots/WC_2026-10-05_empty_fields_save.png`.

### Workaround (if any)
Enter 0 or the default value explicitly.

---

## Cash Flow Shows One Net "Working Capital" Line Instead of −ΔAR / −ΔInventory / +ΔAP

### Module
Financial → Forecasts & Reports → Cash flow

### Feature
Operating activities — working-capital movement

### Status
**Confirmed** (2026-10-01, dev `frontv2`; re-tested 2026-10-05 and 2026-10-07, still present — `/cash-flow` still returns only `working_capital_change`, and the Cash flow tab, Business plan and PDF all show one line)

### Description
The requirement asks for the operating section to show −ΔAR, −ΔInventory and +ΔAP. The table shows a single net line "Working Capital" (ΔAR + ΔInventory − ΔAP) marked with a "−" operator icon. The math is correct and the section adds up (2026: Net Profit €219K − Working Capital €60K = Operating Cash Flow €159K), but the three components are not visible, and a release of working capital renders as a double negative ("−" icon next to `€-60K`, 2029).

### Expected Behaviour
Separate lines −ΔAR, −ΔInventory, +ΔAP (2026: −60 000 / −12 000 / +12 000), or a clearly signed net line.

### Actual Behaviour
One net line; double negative when working capital decreases.

### Root Cause (if known)
The API returns only the aggregated `working_capital_change`.

### Regression Risk
Low — presentation only.

### Areas Affected
Cash flow tab (and Business plan / PDF cash flow if it reuses the table).

### QA Notes
Initially suspected an inverted sign; the row's "−" operator icon shows it is subtracted, so the totals are consistent. Screenshot: `test-reports/screenshots/WC_2026-10-01_cf_defaults.png`.

### Workaround (if any)
—

---

## Marketing Funnel Deals Do Not Feed Revenue

### Module
Operations → Marketing channels → Financial (Income)

### Feature
Funnel "Final Result" deals → product revenue

### Status
**Confirmed** (2026-10-01, dev `frontv2`, project Autotest Project Karina; targeted re-test 2026-10-07: still present — channel 100 × 10% = 10 deals (POST 201), then 20% = 20 deals (PUT 200); revenue 204 012 / 254 012 and the product 369 / client 408 line `1000 × 100` / `1000 × 125` unchanged; `revenue_breakdown` sources still `product` only. Report: `test-reports/Marketing_Funnel_Revenue_Retest_Test_Report.md`)

### Description
The funnel now recalculates deals correctly (Leads × conversion of each step) and saves them, but the deals have no effect on revenue. Channel linked to product "Autotest Product 1789997843929-1" (price 1 000) and client 408: deals changed 10 → 20 → 200 (and 100 with two steps), while `financial-evaluation` revenue for that product/client stayed `1000 × 100 = 100 000` in 2027 (the attached-client quantity) and total revenue stayed unchanged. The revenue breakdown contains only `source: "product"` items; there is no marketing/deals source.

### Expected Behaviour
Per the requirement: recalculated deals flow into revenue (100 leads × 10 % → 10 deals; 20 % → 20 deals and revenue increases).

### Actual Behaviour
Revenue is independent of funnel deals.

### Root Cause (if known)
Revenue is still computed from the client quantity attached to the product (Attach clients), not from funnel deals.

### Regression Risk
High — the marketing plan has no effect on the financial model, which contradicts the requirement.

### Areas Affected
Income statement revenue, Dashboard financial tiles, Business plan financials.

### QA Notes
Verified via `GET /financial-evaluation` before/after each Update. Screenshot: `test-reports/screenshots/FUN_2026-10-01_en_edit_20pct_live.png`.

### Workaround (if any)
—

---

## Investment Resources Cannot Be Created — "Useful life" Field Missing, Backend Still Requires `amortization_period`

### Module
Operations → Resources (Investment)

### Feature
Create / Edit resource — useful life of an investment

### Status
**Confirmed** (2026-10-01, dev `frontv2`)

### Description
The Investment form has neither the new "Useful life, years" field nor the old "Amortization period" field (create and edit, EN and DE). On create the frontend sends `amortization_period: null`, and `POST /resources` returns 422 "The amortization period field is required when cost type is investment." The dialog stays open with no message. Edit still works because the hidden stored value is sent back unchanged, but the user cannot see or change the useful life.

### Expected Behaviour
A required "Useful life, years" field on Investment resources (create and edit), saved to the backend; creation succeeds.

### Actual Behaviour
No field. Every new Investment resource fails silently with 422.

### Root Cause (if known)
The old field was removed from the form, but the new one was not added (or not deployed). The backend still validates `amortization_period` (required, integer 1–100).

### Regression Risk
Critical — blocks a core create flow and the whole CAPEX / D&A feature.

### Areas Affected
Resources create/edit, CAPEX, D&A, Fixed assets, Cash flow, Business plan financials.

### QA Notes
Payload: `{"cost_type":"investment","amortization_period":null,"yearly_costs":[{"year":2027,"cost":100}]}` → 422. Screenshots: `test-reports/screenshots/UL_2026-10-01_en_investment_form_no_useful_life.png`, `UL_2026-10-01_en_create_investment_422.png`.

### Workaround (if any)
None in the UI.

---

## Existing Investments' Amortization Period (Stored in Months) Is Now Read as Years — D&A Understated 12×

### Module
Financial → Forecasts & Reports (Income, Cash flow, Balance sheet)

### Feature
Depreciation & amortisation calculation

### Status
**Confirmed** (2026-10-01, dev `frontv2`, project Dior Brand)

### Description
The backend now computes yearly D&A = purchase cost / `amortization_period`, treating the value as years (per-purchase, starting in the purchase year — correct for the new rule). Existing resources were entered when the field meant **months** (36, 48, 60, 84, 96), and no migration converted them. Example: POS terminals 45 000, 36 months (3 years) → D&A 1 250/year instead of 15 000/year. Dior 2027 D&A is 22 083 instead of 265 000 (12× lower). Net fixed assets and EBIT are overstated by the same amount.

### Expected Behaviour
Legacy month values are converted to years (÷12, rounded per a product rule) or flagged for the user to re-enter, so D&A stays correct.

### Actual Behaviour
Legacy values are used as years.

### Root Cause (if known)
Unit change from months to years without a data migration. The field name and validation (1–100) are also unchanged.

### Regression Risk
High — silently changes EBIT, net profit, tax, and the balance sheet of every existing project with investments.

### Areas Affected
All projects with Investment resources created before this change.

### QA Notes
Verified by recomputing every Dior depreciation item from `/resources` vs `/financial-evaluation` (exact match to cost / value-as-years). Screenshot: `test-reports/screenshots/UL_2026-10-01_en_dior_income_da_understated.png`.

### Workaround (if any)
—

---

## Weighted-Score Summary Uses English Decimals in German (Mixed With German Decimals on the Same Card)

### Module
Operations → Other (Location Analysis, Supplier Analysis)

### Feature
"Bester Standort / Höchste Punktzahl / Durchschnitt" summary under the comparison matrix

### Status
**Confirmed** (2026-10-01, dev `frontv2`, project Dior Brand)

### Description
In German, the matrix footer "Gewichtete Punktzahl" shows `7,9 · 7,6 · 7,5` (correct), but the summary right below it shows `7.9 Höchste Punktzahl` and `7.7 Durchschnitt` (English decimal point). The same value appears in two formats on one card.

### Expected Behaviour
`7,9` / `7,7` in German, `7.9` / `7.7` in English.

### Actual Behaviour
Always `7.9` / `7.7` regardless of language.

### Root Cause (if known)
The summary values are rendered with `toFixed(1)` / raw string instead of the locale number formatter.

### Regression Risk
Low (display only).

### Areas Affected
Location Analysis and Supplier Analysis summaries (and likely the Competitors equivalent if it has one).

### QA Notes
Found by an automated EN↔DE comparison of identical numeric tokens. Screenshot: `test-reports/screenshots/L10N_2026-10-01_de_location_score_7_9.png`.

### Workaround (if any)
—

---

## German Business Plan Keeps AI-Generated Text in English With English Number Formats

### Module
Business plan (editor and shared link `?lang=de`)

### Feature
AI-generated narrative sections (Management Summary, Clients, Products …)

### Status
**Confirmed** (2026-10-01, dev `frontv2`, project Autotest Project Karina)

### Description
With German selected, all UI labels and table numbers in the plan are German (`1.500,50`), but the AI-written paragraphs stay in English, including their numbers: "The model forecasts CHF 200,000 revenue and CHF 108,749.25 net profit…", "54.37% profitability". The same plan also mixes currency notation: the AI text uses `CHF`, the UI uses `₣`.

### Expected Behaviour
A German plan has German text and German number formatting (or the generated text is regenerated/translated for the selected language).

### Actual Behaviour
English prose with English numbers inside a German document.

### Root Cause (if known)
The narrative is generated once in the language active at generation time and stored as plain text; it is not localized on language change.

### Regression Risk
Medium — the business plan is the main shareable output for German-speaking investors.

### Areas Affected
All AI-generated sections of the business plan; shared link and PDF export.

### QA Notes
Related to the 2026-09-30 observation that Dior's AI text was frozen in Ukrainian format. Screenshot: `test-reports/screenshots/L10N_2026-10-01_de_business_plan_ai_text_english.png`.

### Workaround (if any)
Regenerate the plan while the UI is in German (not verified).

---

## More Untranslated Strings in the German UI (Statuses, MVP, Funnel, Charts, ARIA)

### Module
Implementation (Action plan, MVP), Operations (Team and staff, Marketing funnel, Other → IP Rights), Charts, Global ARIA labels

### Feature
German localization (Deutsch)

### Status
**Confirmed** (2026-10-01, dev `frontv2`)

### Description
In addition to the strings in "German UI Still Contains Untranslated English Strings", these remain English in German: Action plan board columns "To Do / In Progress / Done"; IP Rights "Registrierungsstatus" options "Not Filed / Pending / Registered / Rejected / Expired"; MVP builder hint "Define the core features that will be included in your MVP. At least one core feature is required to proceed."; Team and staff subtitle "Manage team members, roles, and staff responsibilities."; funnel step name "Step 1" (also saved to the backend as the step name); chart tooltip series "revenue / expenses"; ARIA labels "Next slide / Previous slide / Go to slide N", "Open navigation", "Close drawer", "Breadcrumb". Translation quality: Location/Supplier summary reads "Stärke des Führers / Schwäche des Führers" — "Führer" has a strong negative connotation in German; "Spitzenreiter" is the usual term.

### Expected Behaviour
All UI strings German.

### Actual Behaviour
Mixed German/English.

### Root Cause (if known)
Hardcoded strings / missing DE keys; status enums rendered from raw values.

### Regression Risk
Low–Medium (status columns are very visible; "Führer" wording is reputationally sensitive).

### Areas Affected
See description.

### QA Notes
Found by EN↔DE identical-string comparison over 18 page states × 3 projects plus 9 create forms. Screenshots: `test-reports/screenshots/L10N_2026-10-01_de_action_plan_status_english.png`, `..._de_ip_rights_status_options.png`, `..._de_mvp_core_features_english.png`, `..._de_team_subtitle_english.png`, `..._de_funnel_step.png`, `..._de_chart_tooltip.png`, `..._de_location_score_7_9.png`.

### Workaround (if any)
—

---

## Shared Business Plan Without `?lang` Uses the Viewer's Saved App Language Instead of English

### Module
Business plan → Share (public link `/shared/business-plan/{id}`)

### Feature
Language selection of the public business-plan page

### Status
**Confirmed** (2026-10-01, dev `frontv2`)

### Description
The public link is expected to render in English when it has no `lang` parameter. In a fresh browser (no stored language) it does. But in a browser where the GetLaunched app language was set to German (`localStorage.language = "de"`), the same link without `?lang` renders in German (`<html lang="de">`, "Inhaltsverzeichnis"). `?lang=de` → German and `?lang=en` → English work correctly in both cases.

### Expected Behaviour
No `lang` parameter → English, regardless of the viewer's saved app language.

### Actual Behaviour
No `lang` parameter → falls back to the viewer's saved app language (German).

### Root Cause (if known)
Likely the shared page falls back to the app's stored `language` key when `lang` is absent, instead of defaulting to `en`.

### Regression Risk
Low — affects only viewers who use the app in German themselves (e.g. the plan owner checking their own link).

### Areas Affected
Shared business plan page.

### QA Notes
Reproduce: set app language to Deutsch → open the share link without `?lang`. Fresh/incognito context shows English. If falling back to the viewer's language is intended, the acceptance criterion needs updating instead.

### Workaround (if any)
Always share the link with an explicit `?lang=en` / `?lang=de`.

---

## German UI Still Contains Untranslated English Strings

### Module
Global (sidebar), Operations → Resources, Project settings (Edit project), Shared business plan

### Feature
German localization (Deutsch)

### Status
**Confirmed** (2026-10-01, dev `frontv2`)

### Description
With the language switched to Deutsch, most of the UI is German, but these strings stay in English: the sidebar collapse button (☰ next to the logo) has an English accessible name on every page — `aria-label="Collapse sidebar"` + `sr-only` text "Collapse" (not visible on screen, screen readers only); Operations → Resources header "Operational resources" and subtitle "Manage the resources, tools, and assets your team uses."; Edit project placeholders "Select..." (Domizil) and "Type tax" (Einkommensteuer (%)); the "Management Summary" section heading in the German business plan / shared plan (`?lang=de`). ("Powered by" next to the getLaunched logo also stays English — possibly intentional branding.)

### Expected Behaviour
Every UI string is German when Deutsch is selected.

### Actual Behaviour
Mixed German/English UI.

### Root Cause (if known)
Strings hardcoded or missing from the DE translation file.

### Regression Risk
Low (cosmetic; the sidebar string is accessibility-only).

### Areas Affected
Sidebar, Resources, Edit project, Business plan.

### QA Notes
Found with a text-node sweep of 16 project routes in DE. No English flash on reload — the app loader is German too ("Anwendung wird geladen..."). Screenshots: `test-reports/screenshots/AuditFix_2026-10-01_de_*`.

### Workaround (if any)
—

---

## Integer-Only Numeric Inputs Drop the Decimal Separator and Multiply the Value

### Module
Operations → Team and staff, Marketing channels (funnel), Resources

### Feature
Numeric inputs (Salary, Funnel cost, Conversion rate %, Resource cost, Line-staff quantity)

### Status
**Confirmed** (2026-09-30, EN and DE)

### Description
Typing a decimal separator (`,` in DE, `.` in EN) in these fields discards it and joins the digits: Salary `12,5` → `125`, `1500,50` → `150.050`; Funnel conversion `2,5` → `25`, `12,75` → `1.275` (>100% accepted), `0,1` → `1`; Funnel cost and Resource cost `1500,50` → `150.050`. The inflated value is saved (funnel POST sent `cost: 150050, conversion_rate: 25`, 201). Product price/cost, Funding amount, Interest rate, Repayment and Project tax are NOT affected — they keep decimals correctly.

### Expected Behaviour
Decimals are kept (`12,5` stays `12,5`), or the separator is blocked/rejected with a message.

### Actual Behaviour
Silent 10×–100× value, saved to the backend.

### Root Cause (if known)
These fields use an integer-only input, not the new locale-aware decimal input used by Product price / Funding.

### Regression Risk
High — corrupts OPEX, funnel deals, break-even and the Business plan.

### Areas Affected
Team and staff (Key members and Line staff), Marketing funnel step, Resources (Investment and Running costs).

### QA Notes
Related to the older "Assist me Marketing Funnel: Decimal Conversion Rate Is Rounded" entry (same integer-only field), but this one is manual input and multiplies instead of rounding. Screenshots: `test-reports/screenshots/L10N_2026-09-30_*`.

### Workaround (if any)
Type whole numbers only.

---

## Zero Totals in Operations Summary Tiles Render as "0000"

### Module
Operations (Team and staff, Marketing channels, Resources)

### Feature
Header total tile

### Status
**Not a bug — by design** (confirmed by the product owner on 2026-10-05; the "0000" placeholder in zero-total tiles is intentional. Was: Confirmed)

### Description
With a zero total, "Total salary costs", "Total for channels" and "Total cost" show `₣ 0000` / `€ 0000`.

### Expected Behaviour
`₣ 0` / `€ 0`.

### Actual Behaviour
`0000`.

### Root Cause (if known)
Unknown (tile-specific formatter).

### Regression Risk
Low.

### Areas Affected
Operations header tiles.

### QA Notes
Other zero amounts (Funding & Setup) render `₣0` correctly.

### Workaround (if any)
—

---

## CHF Amounts Use the "₣" (French Franc) Sign

### Module
Global — currency formatting

### Feature
Currency symbol for CHF projects

### Status
**Confirmed** (2026-09-30, EN and DE)

### Description
A project in Swiss Franc shows every amount as `₣…` (dashboard, product cards, input adornments, Funding, Team).

### Expected Behaviour
`CHF 1.500,50` (standard `Intl` output for CHF in en/de).

### Actual Behaviour
`₣1,5K`, `₣ 500,00`.

### Root Cause (if known)
Custom currency-symbol map.

### Regression Risk
Low.

### Areas Affected
All money values in CHF projects.

### QA Notes
—

### Workaround (if any)
—

---

## Some Counts Are Not Thousands-Grouped

### Module
Dashboard; Operations → Team and staff

### Feature
"Products purchased by customers" matrix; Line-staff card count

### Status
**Confirmed** (2026-09-30, EN and DE)

### Description
Matrix shows `5904`; the Line-staff card/detail shows `1000 personnel` / `1000 Personal`, while the same modal's per-year grid shows `1.000`.

### Expected Behaviour
`5.904`, `1.000 Personal`.

### Actual Behaviour
Raw integers.

### Root Cause (if known)
Values bypass the number formatter.

### Regression Risk
Low.

### Areas Affected
Dashboard, Team and staff.

### QA Notes
—

### Workaround (if any)
—

---

## Count Labels Ignore Plural Rules

### Module
Dashboard, Competitors, Products, Business plan

### Feature
Count + noun labels

### Status
**Confirmed** (2026-09-30)

### Description
EN: `1 competitors:`, `9 Location`, `1 criteria`, `0 Client`, `1 active clients`. DE: `9 Standort(e)`, `1 Kriterien`, `0 Kunde`, `1 aktive Kunden`.

### Expected Behaviour
Singular for 1, plural for 0 and 2+ (EN/DE).

### Actual Behaviour
Fixed noun form or "(e)" suffix.

### Root Cause (if known)
No i18n plural handling for these strings.

### Regression Risk
Low.

### Areas Affected
Dashboard widgets, Competitors header, Product cards, Business plan product list.

### QA Notes
`3 Clients`, `10 criteria`, `9 Suppliers` render correctly.

### Workaround (if any)
—

---

## Mixed Number Styles Within One Page (Compact vs. Full, 0 vs. 2 Decimals)

### Module
Products / Services; Financial → Funding & Setup, Forecasts & Reports

### Feature
Amount display

### Status
**Confirmed** (2026-09-30, EN and DE)

### Description
Product cards: `₣ 500,00` for <1000 but `₣1,5K` for ≥1000. Loan card: `₣1,5K` and `₣1.501` for the same amount. Income tab full amounts vs. Cash flow/Balance sheet compact `M/K`. Edit Product shows saved price `1.500,5` next to margin `1.488,00`.

### Expected Behaviour
One style per component; trailing zero kept for currency.

### Actual Behaviour
Styles mixed within one view.

### Root Cause (if known)
Different formatters per component.

### Regression Risk
Low.

### Areas Affected
Products list, Funding cards, Forecasts tabs, Edit Product.

### QA Notes
Separators themselves are correct for the locale.

### Workaround (if any)
—

---

## Create Financing Activity Offers a Year the Backend Rejects (422, No Message)

### Module
Financial → Funding & Setup

### Feature
Create activity — Year dropdown

### Status
**Partially fixed** (2026-10-01: an error toast now appears, but it shows the raw backend text "Das Feld year muss mindestens 2027 sein." and 2026 is still offered. Was: Confirmed 2026-09-30, no message)

### Description
Year dropdown lists 2026/2027/2028; submitting with 2026 returns 422 and the dialog shows nothing. 2027 works (201).

### Expected Behaviour
Invalid year not offered, or a validation message.

### Actual Behaviour
Silent failure.

### Root Cause (if known)
Dropdown not aligned with backend year range.

### Regression Risk
Low.

### Areas Affected
Funding & Setup.

### QA Notes
Found incidentally during the localization session.

### Workaround (if any)
Pick a later year.

---

## Create MVP Form: AI Does Not Fill the Form Until a Target Segment Is Picked Manually

### Module
Implementation → MVP — Create MVP form

### Feature
In-form Assist me (AI form-fill)

### Status
**Confirmed** (2026-09-28, 3/3 runs; re-checked the same day with "Заповни
поля MVP рандомно": 0 fields filled in 2/2 runs without a segment; 17
fields filled with a segment pre-selected; nothing saved). Also checked
by giving the segment in the chat instead of the field: naming it exactly
(2/2) → "не вдалося зіставити з наявним сегментом, виберіть у полі"; "обери
будь-який сегмент сам" (1/1) → the AI wrongly claims the project has no
segment IDs (it has 2) and tells the user to hand the task to the "агент
клієнтів". 0 fields filled in all 3 runs, so the chat is no workaround.

### Description
The form's default context sends `client_ids: [0]` (no segment selected).
For both "Створи мені MVP" and the follow-up "Придумай усі значення сам і
заповни всі поля форми", the agent returns no `draft` and asks the user to
pick a segment first. It says it can't see segment names ("їхні назви не
відображені в доступному контексті") and that ID 0 matches no segment. With
a segment pre-selected manually, the same prompt fills the whole form on
the first try (4/4).

### Expected Behaviour
The AI fills the form, picking an existing segment itself or leaving the
segment empty, as the Marketing channel form does (it picks `client_id`
itself).

### Actual Behaviour
Nothing is filled until the user manually selects the Target segment.

### Root Cause (if known)
The MVP agent context carries no list of available segments, and the form
sends a placeholder `0` instead of an empty array.

### Regression Risk
Medium.

### Areas Affected
Create MVP form.

### QA Notes
—

### Workaround (if any)
Select Target segment first, then use Assist me.

---

## Page-Level Assist me Creates and Saves an MVP Immediately With AI-Invented Content

### Module
Implementation → MVP list (page-level AI side panel)

### Feature
Agent create action from the side panel

### Status
**Confirmed** (2026-09-28)

### Description
On the MVP list (context `screen: implementation/mvp`), the side panel
prompt "Створи мені MVP" immediately returned `{type: "action", entity:
"mvp", operation: "created", id: "92"}`. An MVP with fully AI-invented
content ("Тестовий MVP цифрового сервісу") was saved, with no preview and
no confirmation step. The follow-up "Придумай усі значення сам і заповни
всі поля форми" got "Форму MVP заповнено … без збереження запису", although
no form was open and nothing was filled.

### Expected Behaviour
Per the MVP/AI task: the final Create happens only after explicit user
confirmation. The AI should show the proposed content (or open a prefilled
form) and ask before saving.

### Actual Behaviour
The record is saved immediately. A later reply claims a form was filled
that doesn't exist.

### Root Cause (if known)
The side-panel agent has a direct create tool with no confirmation step.

### Regression Risk
High: unreviewed records are written to user data.

### Areas Affected
MVP (verified). Possibly other entities created from the side panel (not
verified).

### QA Notes
MVP #92 was deleted after the test.

### Workaround (if any)
Create MVPs only from the Create MVP form.

---

## Assist me in the Create MVP Form Saves an MVP Directly Instead of Filling the Form

### Module
Implementation → MVP — Create MVP form

### Feature
In-form "Assist me" (AI form-fill)

### Status
**Fixed** for the in-form flow (was: Confirmed 2026-09-24). Re-tested
2026-09-28: the form now sends `context.modal = {entity: "mvp", values}`.
In 8 in-form runs there were 0 unrequested saves and 0 `action` events.
"Збережи це MVP" gets the answer "натисніть кнопку Зберегти у формі". With
a segment selected, the `draft` fills every field, and Create MVP then
saves it (201). Remaining issues are split into two new entries:
"AI Does Not Fill the Form Until a Target Segment Is Picked Manually"
(in-form) and "Page-Level Assist me Creates and Saves an MVP Immediately"
(side panel).

### Description
The Create MVP form has an Assist me button, but its chat request carries
only `context: {screen: "mvp/manage"}`, with no `modal.entity` and no
`values`, unlike every working form. With the prompt "Створи мені MVP.
Придумай усі значення сам і заповни всі поля форми" the agent returned
`{type: "action", entity: "mvp", operation: "created", id: "88"}` and
replied "MVP створено та збережено у статусі чернетки". The MVP was
persisted to the project without the user pressing Create. The form fields
stayed empty. In another run (separate conversation) the agent only
described the values in chat. There was no `draft` event and nothing was
filled.

### Expected Behaviour
Same as other forms: a `draft` event fills the form, and nothing is saved
until the user clicks Create MVP.

### Actual Behaviour
Either nothing is filled, or an MVP is silently created and saved.

### Root Cause (if known)
The MVP form doesn't pass modal context to the agent, so the agent runs in
general "auto" mode and uses its create-tool.

### Regression Risk
High: unexpected writes to user data from a "fill the form" request.

### Areas Affected
MVP list and anything reading MVPs (Dashboard, Business Plan).

### QA Notes
Created MVP id 88 was deleted manually after the session.

### Workaround (if any)
None. Don't use Assist me on Create MVP.

---

## Assist me in "Create new action item" Never Fills the Form

### Module
Implementation → Action plan — Create new action item modal

### Feature
In-form Assist me

### Status
**Confirmed** (2026-09-24, 3/3 runs)

### Description
The modal sends correct context (`entity: action_item`, values incl.
`stage_id`). The agent lists proposed values (name, description, priority,
deadline, stage) in chat, but never emits a `draft` event, so Name and
Description stay empty. It justifies this with "у проєкті немає учасника
команди, а поле «Відповідальний» вимагає вибрати існуючу людину", but
Assignee is optional in this form (`tests/helpers/action-plan.helper.js`:
only Name and Priority are required).

### Expected Behaviour
The form is filled via `draft`, and Assignee is left empty.

### Actual Behaviour
The form stays empty, and the AI claims a non-required field is required.

### Root Cause (if known)
Likely the agent's action_item draft schema marks `assignee_id` as
required.

### Regression Risk
Medium.

### Areas Affected
Action plan.

### QA Notes
Test project has no team members. Re-test with at least one team member
to see if it then fills.

### Workaround (if any)
Fill manually.

---

## Assist me Is Missing From 6 Create Forms

### Module
Magic Triangle → Competitors; Operations → Other; Financial

### Feature
In-form Assist me availability

### Status
**Confirmed** (2026-09-24)

### Description
No Assist me button exists inside these create modals (0 matches in the
dialog; page-level button is inert/hidden behind the modal):
Evaluation criteria (Competitors), Add location, Add supplier, Criteria
Configuration (Location Analysis), Create entry (Forecasts & Reports →
Income), Create activity (Funding & Setup). The other 9 create forms
(Client, Product, Competitor, Marketing channel, Team role, Resource, Risk,
Action item, MVP) do have it.

### Expected Behaviour
Assist me is available in every create form of the project.

### Actual Behaviour
It is absent from 6 of 15 forms.

### Root Cause (if known)
The in-form Assist me is not wired into these modal components.

### Regression Risk
Medium: feature gap and inconsistency.

### Areas Affected
Listed forms. Supplier "Criteria Configuration" uses the same component
and is presumably affected too (not separately opened).

### QA Notes
The alternative (page-level side panel) fails for "create location", see
next entry.

### Workaround (if any)
Fill manually.

---

## Page-Level Assist me Hangs Indefinitely on "Create a Location" Request

### Module
Operations → Other (page-level AI side panel)

### Feature
Agent create requests from the side-panel chat

### Status
**Confirmed** (2026-09-24, 2/2 runs)

### Description
Operations → Other → Assist me (side panel, mode "Auto") → "Створи мені
локацію. Придумай усі значення сам і заповни всі поля форми". A spinner
shows, and `POST /agent/chat/stream` returned no response within 90 s (run
1) and 240 s (run 2, after which the client fired `POST /agent/chat`).
No reply, no error, and no location was created. Control: a simple
question in the same panel ("Скільки продуктів у моєму проєкті?")
answered in 14 s.

### Expected Behaviour
A reply within a reasonable time: create/draft the location, or explain
why not. On failure, show an error instead of an endless spinner.

### Actual Behaviour
Endless spinner, and nothing happens.

### Root Cause (if known)
Unknown (agent tool call for location hangs / times out server-side).

### Regression Risk
Medium.

### Areas Affected
Page-level chat create actions (only "location" verified).

### QA Notes
—

### Workaround (if any)
None.

---

## In-Form Assist me Chat Shows Raw Markdown (`**bold**`)

### Module
Global: in-form Assist me chat popover (all create modals that have it)

### Feature
AI reply rendering

### Status
**Confirmed** (2026-09-24)

### Description
Replies inside the in-form chat render literal Markdown markers, e.g.
"- **Назва:** Автоматизований моніторинг…". The page-level side panel
renders the same kind of reply correctly ("**10 продуктів**" shown in
bold).

### Expected Behaviour
Markdown is rendered (bold and lists), as in the side panel.

### Actual Behaviour
Raw `**` and `-` markers are shown.

### Root Cause (if known)
The in-form popover renders plain text instead of using the Markdown
renderer.

### Regression Risk
Low: cosmetic, but seen on every AI reply.

### Areas Affected
All 9 forms with in-form Assist me.

### QA Notes
Screenshot: `test-reports/screenshots/AssistMe_2026-09-24_product_filled_raw_markdown.png`.

### Workaround (if any)
—

---

## Assist me Marketing Funnel: Decimal Conversion Rate Is Rounded When Applied

### Module
Operations → Marketing channels — Create channel, step 2 (Sales funnels)

### Feature
AI draft → funnel step fields

### Status
**Confirmed** (2026-09-24, 1 observation)

### Description
The agent's draft contained `conversion_rate: 2.6` for the first funnel
step. After it was applied, the step's "Conversion rate, %" input showed
**3**. Other steps (10, 100) were applied exactly.

### Expected Behaviour
2.6 is kept, or the agent only proposes values the field accepts.

### Actual Behaviour
The value is silently rounded to 3, which changes funnel math (Final
Result).

### Root Cause (if known)
The field is integer-only while the agent returns decimals.

### Regression Risk
Low.

### Areas Affected
Marketing channel funnel.

### QA Notes
—

### Workaround (if any)
Correct manually.

---

## Working Capital Defaults (DIO/DSO/DPO) Are Displayed but Not Applied Until "Save changes" Is Clicked

### Module
Financial → Funding & Setup (Working capital) → Forecasts & Reports (Balance sheet, Cash flow)

### Feature
Working capital settings driving Inventory / Accounts Receivable / Accounts Payable

### Status
**Fixed** (2026-10-01: on projects with `is_configured: false` — Dior Brand and a freshly created project — the defaults 60/30/30 are applied without Save; fresh project Revenue 365 000 / COGS 146 000 → AR 60 000, Inventory 12 000, AP 12 000. Was: Confirmed 2026-09-23)

### Description
On a project whose working-capital settings were never saved,
`GET /financial-settings` returns `{dso: 60, dpo: 30, dio: 30,
is_configured: false}` and Funding & Setup renders those values pre-filled
in the DIO/DSO/DPO inputs with a computed "Cash conversion cycle: 60 days".
But the Balance sheet ignores them: with COGS = 55,000 (2027), Inventory,
Accounts Receivable and Accounts Payable were all 0, and Cash flow's
"Working Capital" row was 0. Clicking **Save changes** without changing any
value (30/60/30) flips `is_configured` to `true`, and only then does the
Balance sheet show Inventory 4,520.55 (= 55,000 / 365 × 30), AR 32,876.71,
AP 4,520.55.

### Expected Behaviour
Either the displayed defaults are actually applied to the Balance sheet /
Cash flow, or the inputs are shown empty (or explicitly labeled "not
configured") so the user isn't told a 60-day cycle is in effect when it
isn't.

### Actual Behaviour
The UI shows a working-capital configuration that has no effect on any
statement until an explicit, no-op Save.

### Root Cause (if known)
Backend computes working-capital lines only when `is_configured = true`,
while the frontend renders the default values as if they were configured.

### Regression Risk
High for the Cost type task specifically: acceptance criterion "COGS
100,000, DIO 30 → Inventory 8,219" only holds after Save; on an untouched
project Inventory is always 0 regardless of cost type, which masks both
correct and incorrect behavior.

### Areas Affected
Balance sheet (Inventory, AR, AP, Cash), Cash flow (Working Capital,
Operating Cash Flow), Funding & Setup.

### QA Notes
Reproduced on "Autotest Project Karina" 2026-09-23. After this session the
project's settings are saved (30/60/30, `is_configured: true`), so repro
needs a project that never saved working-capital settings. When testing
Inventory math, always Save working capital first.

### Workaround (if any)
Click "Save changes" on Funding & Setup once per project.

---

## Variable Production Cost Is Marked Required but an Empty Value Is Silently Saved as 0

### Module
Magic Triangle → Products / Services — Create/Edit product, step 1

### Feature
Variable production cost (`#productionCost`) validation

### Status
**Fixed — resolved by making the field optional** (was: Confirmed
2026-09-23). Re-tested 2026-09-28: the required asterisk was removed from
the "Variable production cost" label (other step-1 fields keep theirs, and
there is no `aria-required`). An empty value is still allowed and saved as
`variable_cost: 0` on Create (201) and Edit (200), which is now consistent
with the label. **Open requirement conflict:** the Cost type task says the
field "stays mandatory". Pending a Product Owner decision; if the field
must be mandatory, reopen this entry.

### Description
The field label carries a required asterisk ("Variable production cost*"),
and the Cost type task explicitly keeps `variable_production_cost`
mandatory. Clicking Next on an empty form shows errors for Name, Revenue
type and Selling price only — none for Variable production cost. Leaving it
empty and creating the product succeeds (201) with `variable_cost: 0` in
the request payload.

### Expected Behaviour
"Production cost is required" validation, Next blocked, like Selling price.

### Actual Behaviour
Empty value accepted and persisted as 0 — the product has zero COGS / Other
direct cost with no warning.

### Root Cause (if known)
Frontend form schema does not mark the field required and coerces empty to
0; backend accepts 0.

### Regression Risk
Medium — silently inflates Gross profit/EBITDA for products where the user
simply forgot the cost.

### Areas Affected
Products create/edit, Income statement (COGS / Other direct costs),
Inventory.

### QA Notes
Repro: Create product → Name, One-time, price 100, leave cost empty → Next →
Create → POST body has `"variable_cost":0`.

### Workaround (if any)
None.

---

## Create Product — "Revenue type is required" Error Stays Visible After a Revenue Type Is Selected

### Module
Magic Triangle → Products / Services — Create product, step 1

### Feature
Inline validation for the Revenue type custom dropdown

### Status
**Fixed** (was: Confirmed 2026-09-23). Re-verified 2026-09-28: after an
empty Next, each error clears as soon as its field is filled (Name,
Revenue type, Selling price). "Price is required" correctly re-appears
when the price is cleared again.

### Description
Click Next on an empty form → "Revenue type is required" appears. Select
any Revenue type (e.g. Subscription): the dropdown shows the selection, but
the error stays (verified 1.5 s later, and still present after switching
Hourly → Subscription again).

### Expected Behaviour
The error clears as soon as a valid value is selected, like text inputs.

### Actual Behaviour
Stale error remains until the next submit attempt.

### Root Cause (if known)
Not confirmed — likely the custom dropdown doesn't trigger field
re-validation on change.

### Regression Risk
Low — cosmetic, but confusing on a form that now has four dropdowns.

### Areas Affected
Create product step 1 (possibly other custom dropdowns app-wide — not
verified).

### QA Notes
—

### Workaround (if any)
Click Next again.

---

## Escape With an Open Dropdown Closes the Whole Create Product Drawer and Discards Input

### Module
Magic Triangle → Products / Services — Create product

### Feature
Keyboard handling of custom dropdowns inside the drawer

### Status
**Confirmed** (2026-09-23, reproduced twice)

### Description
With data typed in the Create product drawer, open any custom dropdown
(Sourcing, Subscription type) and press Escape: instead of closing only the
listbox, the entire drawer closes and all entered data is lost, with no
"discard changes?" prompt.

### Expected Behaviour
First Escape closes only the open listbox (WAI-ARIA listbox pattern); the
drawer stays open.

### Actual Behaviour
Drawer closes; typed data is lost.

### Root Cause (if known)
Escape keydown propagates from the listbox to the drawer's dismiss handler.

### Regression Risk
Low–Medium — data loss on a long, now 9-field form.

### Areas Affected
Create product drawer (likely any drawer that hosts the shared custom
dropdown — not verified).

### QA Notes
Test helpers must never press Escape to close a dropdown inside a drawer —
click an option instead.

### Workaround (if any)
Close dropdowns by clicking an option or outside.

---

## Subscription Payment Period Badge Always Shows "/Month"

### Module
Magic Triangle → Products / Services — Products list

### Feature
Product card — price cadence badge, for Revenue type = Subscription

### Status
**Fixed** (was: Confirmed 2026-09-21) — re-verified 2026-09-23: Annual
subscription cards show "₣ 600,00/Year", Monthly cards "₣ 50,00/Month".

### Description
The Create/Edit Product modal was redesigned to add a **Subscription type**
field (Monthly subscription / Annual subscription — only rendered when
Revenue type = Subscription), part of the task adding a payment-period
concept for subscription products (×12 in Financial for Monthly vs. a single
yearly payment for Annual). Selecting "Annual subscription", creating the
product, then re-opening it via Edit confirms the value **is persisted
correctly on the backend** (Edit modal pre-fills "Annual subscription"). But
the Products list card's price badge always renders "$ X,XX**/Month**"
regardless of the actual Subscription type — reproduced by creating a fresh
Annual-subscription product and reading the card's text content directly
(`$ 120,00/Month` for a product whose persisted Subscription type is Annual
subscription).

### Expected Behaviour
A Subscription product's card should show a cadence suffix matching its
actual Subscription type — "/Month" for Monthly, "/Year" (or equivalent) for
Annual.

### Actual Behaviour
Every Subscription product's card shows "/Month", even when Subscription
type = Annual subscription. Purely a list-card display bug — the underlying
data and the Edit modal are correct.

### Root Cause (if known)
Not confirmed — likely the card's cadence label is still hardcoded to
"/Month" for any Subscription-type product rather than reading the new
Subscription type field.

### Regression Risk
Medium — cosmetic only (doesn't affect Financial math, which reads the
persisted field directly per this session's product data), but actively
misleading for anyone relying on the Products list to sanity-check
subscription billing cadence, especially once Annual-subscription products
become common.

### Areas Affected
Magic Triangle → Products / Services list only. Edit modal, and (as far as
this session could observe without a clean financial baseline — see
`tests/06-create-product.spec.js` comments) Financial calculations, are
unaffected.

### QA Notes
`tests/06-create-product.spec.js` test "06. Create an Annual subscription
product and verify the period persists" asserts the persisted value via the
Edit modal (confirmed reliable) rather than the card badge, specifically to
avoid flapping on this known display bug. Re-verify the card badge itself
once this is fixed, and update that test to assert on it directly.

### Workaround (if any)
None needed — data integrity is unaffected, only the list card's display.

---

## Income Statement Is Missing the "Other Direct Costs" Line (Cost Type Split Not Reflected in Financial Reports)

### Module
Financial → Forecasts & Reports — Income statement (Planning horizon
breakdown table)

### Feature
Income statement line items, following the Create/Edit Product modal's new
**Cost type** field (`Cost of goods sold - held in stock` / `Other direct
cost - services, fees`)

### Status
**Confirmed** (2026-09-21) — scope limited by a live baseline that already
carries ~90 accumulated test products (see "Duplicate Products..." below),
so exact dollar amounts were not cross-checked; the missing line item itself
is unambiguous regardless of the mix of products.

**Re-verified 2026-09-29 — still Confirmed, now worse.** The task was
re-scoped: the row is to be called **"Direct service costs"** and counted
exactly like COGS (i.e. deducted *before* Gross profit). The backend change
has shipped: `gross_profit` = Revenue − COGS − `other_direct_costs` (e.g.
2027: 250,000 − 55,000 − 45,000 = 150,000; on 2026-09-23 it was 195,000).
The frontend row has **not** shipped: the Income table still goes Revenue
₣250,000 → Cost of goods sold ₣-55,000 → Gross profit ₣150,000. The
visible statement no longer adds up at the Gross profit line itself (the
gap used to be between Gross profit and EBITDA). No "Direct service costs"
/ "Other direct" text anywhere on the page, not even at ₣0. Expanding COGS
lists only `cogs` products (correct). Screenshots:
`test-reports/screenshots/DSC_2026-09-29_*.png`.

### Description
The task behind this session's Product modal review specifies a new
`Other direct costs` line that must always render in the Income statement,
positioned between `Gross profit` and the operating-expense lines
(`Team & staffing`, `Marketing channels`, etc.), fed exclusively by products
whose Cost type = "Other direct cost - services, fees" (while
`Cost of goods sold` should only include Cost-type = COGS products, and
`Inventory` in Funding & Setup should only be driven by that narrowed COGS
figure). As of this session, Financial → Forecasts & Reports' Planning
horizon breakdown shows: `Revenue → Cost of goods sold → Gross profit →
Team & staffing → Marketing channels → Running resources → Other expenses →
Custom entries → EBITDA → ...` — there is no `Other direct costs` row at
all, even though the project now contains multiple products with Cost type
= "Other direct cost - services, fees" (created both by this session and
pre-existing fixture data).

### Expected Behaviour
Per the task's acceptance criteria, `Other direct costs` should always
render as its own line (even at $0) between `Gross profit` and the
operating-expense lines, and should sum the variable cost of every product
flagged `other_direct`; `Cost of goods sold` should exclude those products.

### Actual Behaviour
No `Other direct costs` line exists in the Income statement. It is not
possible to confirm from the UI alone whether `Cost of goods sold` already
excludes `other_direct`-flagged products' cost internally (i.e. whether this
is a report-rendering gap only, or whether the split isn't wired into
Financial calculations at all) — flagged as open rather than guessed.

### Root Cause (if known)
Not confirmed — the Create/Edit Product modal side of this task (Cost type
field, helper text, persistence) is fully implemented; this appears to be
an unfinished or not-yet-shipped piece specifically in the Financial →
Forecasts & Reports report renderer.

### Regression Risk
High for this specific task's acceptance criteria (a required, always-shown
report line is absent), Low for existing functionality (nothing currently
rendered appears broken by this gap).

### Areas Affected
Financial → Forecasts & Reports (Income statement). Potentially Funding &
Setup → Inventory, which is formula-derived from `Cost of goods sold`
(unverified whether that figure is already correctly narrowed).

### QA Notes
Not covered by an automated spec yet — `tests/28-financial-forecasts.spec.js`
only smoke-tests that the existing stat tiles/line items render, and predates
this task. A dedicated assertion for the `Other direct costs` line (and a
COGS-vs-Inventory numeric check) should be added once this line ships;
until then, product-level Cost type coverage lives in
`tests/06-create-product.spec.js` tests 04–05.

### Workaround (if any)
None — this is a report gap, not a product-creation blocker.

---

## Team & Staff — "Line Staff" Creation Always Fails (Missing `employment_percent` in `staffing[]`)

### Module
Operations → Team and Staff — Create team role, "Line staff" shape

### Feature
Create Line Staff — form submission

### Status
**Fixed** (re-verified 2026-09-30: `staffing[]` now carries `employment_percent: 100` per year and `POST /team-members` returns 201; was: Confirmed 2026-08-26)

### Description
Creating a Line Staff role (as opposed to a Key Member) always fails.
Confirmed via a direct network probe (not just UI timeout): the frontend's
`POST /api/v1/projects/{id}/team-members` call always returns `422` with
`{"staffing.0.employment_percent field is required..."}`. The form's single
"Presence of the importance,%" input is sent as a top-level
`engagement_percent`, but is never copied into each `staffing[]` row (one row
per planning-horizon year, populated from "Quantity per year" — itself
required client-side). Reproduced 3x with different field values and fill
orders.

### Expected Behaviour
Submitting a fully-filled Line Staff form (Role name, Quantity per year,
Engagement %, Employment type, Salary, Pay period, Start year) should create
the record, matching Key Member's working submission.

### Actual Behaviour
Every Line Staff submission is rejected by the backend with a 422 validation
error the UI does not surface in a readable way (the click just appears to
do nothing).

### Root Cause (if known)
Frontend payload bug: `staffing[]` rows are built from "Quantity per year"
but never receive the `employment_percent` value the backend requires per
row.

### Regression Risk
High — Line Staff is a documented, load-bearing part of Operations → Team and
Staff (drives Resources/Financial cost rollups per PROJECT_KNOWLEDGE.md §8),
and is currently 0% functional.

### Areas Affected
Operations → Team and Staff → Create/Edit Line Staff.

### QA Notes
`tests/14-create-team-and-staff.spec.js` and `tests/15-edit-team-and-staff.spec.js`
now `test.skip()` their Line Staff cases with this explanation, keeping the
correct implementation in place so they start passing the moment this is
fixed — re-verify every release.

### Workaround (if any)
None found.

---

## Client Edit Form Discards an Uncommitted Name Change After Deleting a Need

### Module
Magic Triangle → Clients — Edit Client

### Feature
Edit Client form — Name field, combined with deleting a Need in the same
session

### Status
**Confirmed** (2026-08-24)

### Description
In the Edit Client form, typing a new Name and then deleting one of the
client's Needs (via the need's own delete + "Yes, delete this need" confirm)
silently discards the uncommitted Name edit — the need-delete action appears
to refetch/reset the form's data, and the Name reverts to its last-saved
value. Clicking Update afterward saves the need deletion but not the
intended rename.

### Expected Behaviour
An in-progress Name edit should survive an unrelated need deletion within the
same edit session, matching how Update is expected to save every changed
field together.

### Actual Behaviour
Confirmed by filling Name, deleting a need, clicking Update, reloading, and
finding the old Name unchanged while the need was correctly removed.

### Root Cause (if known)
Not confirmed from the outside — consistent with the need-delete action
refetching the client record into the form (to refresh the needs list) in a
way that also clobbers other locally-edited-but-unsaved fields.

### Regression Risk
Medium — silently loses user input with no error shown; easy to miss in
manual testing since the need deletion itself does succeed.

### Areas Affected
Magic Triangle → Clients → Edit Client, when combining a Name change with a
Need deletion in one session.

### QA Notes
`tests/05-edit-client-delete-need.spec.js` works around this by filling the
Name field *after* the need-delete confirmation, not before — confirmed this
ordering makes the rename persist correctly. No fix needed on the test side
beyond that ordering; flagging here as a real product bug.

### Workaround (if any)
Re-enter/re-confirm the Name field immediately before clicking Update, after
any need deletions in the same session.

---

## Dashboard — "Competitor Summary" Empty State Reuses the "Critical Risk" Icon

### Module
Dashboard (project overview)

### Feature
Empty-state illustration shown per widget card when a module has no data yet

### Status
**Confirmed** (2026-08-07)

### Description
On a freshly created, fully empty project, every Dashboard widget card shows
a distinct empty-state illustration (SVG icon) paired with its own
"Describe your ..." / "Add your ..." prompt — a box icon for "Products
purchased by customers", a banknote icon for "Financial overview", a map-pin
icon for "Location Analysis", a delivery-truck icon for "Supplier Analysis",
a kanban icon for "Action plan", and so on. **"Competitor summary" and
"Critical risk" are the only two widgets that render the identical
icon** — a hexagon with an exclamation mark — even though they are two
unrelated modules (competitive analysis vs. risk register). Confirmed by
diffing the two widgets' `<svg><path d="...">` data directly in the DOM: the
path strings are byte-for-byte identical between the "Critical risk" and
"Competitor summary" empty-state icons, while every other widget pair has a
distinct path. Reproduced on both Desktop (1440×900) and Mobile (390×844)
viewports, and confirmed visually via screenshot on both.

### Expected Behaviour
Consistent with every other widget on the page, "Competitor summary" should
show its own semantically distinct empty-state icon (e.g. something
evoking comparison/analysis — a chart, magnifying glass, or people icon),
not the risk-warning icon already used by "Critical risk".

### Actual Behaviour
"Competitor summary"'s empty-state icon is pixel-for-pixel (path-for-path)
identical to "Critical risk"'s.

### Root Cause (if known)
Not confirmed from the outside — consistent with the "Competitor summary"
empty-state component being wired to the wrong icon asset/key at
implementation time (e.g. copy-pasted from the Critical risk widget and the
icon reference never swapped).

### Regression Risk
Low functionally (doesn't block any action), but a real, visible content
bug on the very first screen every new user sees, and it will resurface on
every future empty project until the icon reference is fixed.

### Areas Affected
Dashboard → "Competitor summary" widget, empty state only (populated state
was not affected — the populated "Dior Brand" project's Competitor summary
widget renders its real weighted-score content, not this icon, once data
exists).

### QA Notes
Confirmed live on project `QA Empty State (2026-08-07)`
(`/project/019fdbaa-1d51-727a-9153-b79f4f6c0f45/dashboard`), both desktop and
mobile viewports. Verified via `document.querySelectorAll('svg')` path
comparison, not just visual inspection, to rule out a screenshot artifact.

### Workaround (if any)
None needed for end users (cosmetic only).

---

## Dashboard / Forecasts & Reports — "Revenue vs Expenses" Chart Y-Axis Mislabeled

### Module
Dashboard (Financial overview widget) and Financial → Forecasts & Reports

### Feature
"Revenue vs Expenses" line chart — Y-axis tick labels

### Status
**Confirmed** (2026-08-07)

### Description
The Y-axis of the "Revenue vs Expenses" chart renders tick labels as
`₴150000k`, `₴300000k`, `₴450000k`, `₴600000k` instead of a correctly
formatted compact value such as `₴150M` / `₴300M` / `₴450M` / `₴600M` (or, at
minimum, a thousands-separated `₴150,000K`). Confirmed by reading the actual
SVG `<text>` node contents via the DOM (`Array.from(document.querySelectorAll
('svg text')).map(t => t.textContent)`), not just visually — the raw
strings are exactly `"₴150000k"`, `"₴300000k"`, `"₴450000k"`, `"₴600000k"`.
Reproduced identically on both the Dashboard's "Financial overview" widget
mini-chart and the full-size chart on Financial → Forecasts & Reports, on
the populated "Dior Brand" project.

### Expected Behaviour
Axis labels should use a single, correctly scaled unit consistent with the
stat tiles directly above the chart on the same page, which format the same
order of magnitude correctly (e.g. "Initial Investment (CAPEX) ₴4.18M").

### Actual Behaviour
The axis appends a lowercase "k" suffix directly onto an already
6-digit number with no thousands separator, producing a value that reads as
"150,000 thousand" — off by a factor of 1,000 in how it's presented, even
though the underlying data/scale of the chart itself (line positions,
0–2028 range) is otherwise correct.

### Root Cause (if known)
Not confirmed — consistent with the axis tick formatter dividing the raw
value by 1,000 to compute a "k" label without also checking whether the
result should instead be promoted to "M", or with the formatter being
applied to an already-thousands-scaled value a second time.

### Regression Risk
Medium — this is a highly visible chart on both the Dashboard (seen by every
user on every visit) and the primary Financial reporting page, and a
mislabeled axis undermines trust in the financial numbers even though the
stat tiles themselves are accurate.

### Areas Affected
- Dashboard → Financial overview widget → Revenue vs Expenses mini-chart
- Financial → Forecasts & Reports → Revenue vs Expenses chart

### QA Notes
Confirmed live on `/project/019dfc93-1e50-70f3-ac16-7c8c5dd1e6c9/dashboard`
and `/project/019dfc93-1e50-70f3-ac16-7c8c5dd1e6c9/financial/forecasts-reports/financial-evaluation`.
The stat tiles on both pages (CAPEX/OPEX/Break-even/Profitability) were
cross-checked and are accurate and consistent between the two pages — only
this chart's axis labels are affected. **Reconfirmed on Mobile (390×844)**
during the 2026-08-07 mobile follow-up pass — same exact mislabeled values
visible on the Dashboard widget's mini-chart at that viewport too.

### Workaround (if any)
None needed for correctness of the underlying data — only the axis label
text is wrong.

---

## App-Wide Overlay Primitive Triggers Two Accessibility Violations on Open (Invite Dialog, Mobile Nav Drawer, Profile Menu — at Minimum)

### Module
Global — shared dialog/drawer/dropdown primitive underlying at least the
Invite dialog, the mobile hamburger navigation drawer, and the account
Profile menu

### Feature
Any overlay built on this shared primitive — dialog semantics and focus
management on open

### Status
**Confirmed** (2026-08-07; scope widened 2026-08-07 mobile follow-up)

### Description
Opening the "Add team members" dialog (via the Dashboard's "Invite" button)
reliably produces two distinct browser console warnings on every open,
confirmed on both the empty test project and the populated "Dior Brand"
project:
1. `Warning: Missing 'Description' or aria-describedby={undefined} for
   {DialogContent}.` — the dialog has no accessible description wired up.
2. `Blocked aria-hidden on an element because its descendant retained
   focus... Element with focus: <button ...>` — an ancestor of the
   currently-focused button (the app shell's root content wrapper) is
   marked `aria-hidden="true"` while a descendant of it still holds
   keyboard focus, which is an explicit WAI-ARIA violation the browser
   itself refuses to fully apply.

**Mobile follow-up (same day):** the identical `aria-hidden`/focus warning
(same exact ancestor class `div.flex h-dvh flex-col flex-auto overflow-hidden`)
was also reproduced by opening the **mobile hamburger navigation drawer**
("Open navigation" button, 390×844 viewport), and **both** warnings
(missing Description *and* the aria-hidden/focus conflict) were reproduced
together by opening the **account Profile menu** (avatar button, top-right,
mobile). This confirms the issue lives in a shared overlay/dialog primitive
used across the app, not something specific to the Invite dialog.

### Expected Behaviour
Radix/whatever dialog primitive backs this component should have an
accessible description (or `aria-describedby` explicitly set to nothing if
none is needed) and should not leave focus inside an `aria-hidden` subtree —
assistive-technology users should be able to both understand the dialog's
purpose and have their focus correctly exposed to the accessibility tree at
all times.

### Actual Behaviour
Both warnings fire on every observed open of this dialog, with no
functional breakage for sighted mouse/keyboard users — the dialog opens,
the form is usable, and it closes cleanly via Cancel/✕/Escape (per the
already-documented, mostly-reliable behavior of this specific dialog).

### Root Cause (if known)
Not confirmed — consistent with the dialog's underlying primitive (likely
Radix `Dialog`) being used without a `DialogDescription` child, and with
whatever mounts the background overlay applying `aria-hidden` to the app
shell before/without properly re-parenting or blurring focus first.

### Regression Risk
Low for sighted users, but a real, reproducible accessibility defect for
screen-reader/assistive-technology users, and now **confirmed on 3
independent surfaces** (Invite dialog, mobile nav drawer, Profile menu) —
strongly suggesting every overlay in the app built on the same shared
primitive is affected. Still worth spot-checking modals not yet tested
(Create Client, Create Product, Create Risk, Notifications panel, Language
menu, "Assist me" drawer) for the same pattern in a future accessibility
pass, but this should now be treated as a systemic/global issue rather than
an Invite-specific one.

### Areas Affected
- Dashboard → "Invite" button → "Add team members" dialog (both warnings)
- Mobile (390×844) → hamburger "Open navigation" button → nav drawer
  (aria-hidden/focus warning)
- Mobile (390×844) → account avatar button (top-right) → Profile menu
  (both warnings)
- Not yet checked: other create/edit modals (Create Client, Create Product,
  Create Risk, etc.), Notifications panel, Language menu, "Assist me" drawer.

### QA Notes
Confirmed via `page.on('console')` / browser console warnings on both
`/project/019fdbaa-1d51-727a-9153-b79f4f6c0f45/dashboard` (empty project) and
`/project/019dfc93-1e50-70f3-ac16-7c8c5dd1e6c9/dashboard` ("Dior Brand"),
including on a rapid double-click open of Invite (no duplicate dialogs were
spawned — that part is safe; only these accessibility warnings are at
issue). Mobile nav drawer and Profile menu reproductions confirmed on the
empty project at 390×844 on the 2026-08-07 mobile follow-up pass.

### Workaround (if any)
None needed for sighted users. No end-user-facing workaround for
assistive-technology users exists today.

---

## Mobile Invite Dialog Drops the "Cancel" Button Present on Desktop

### Module
Global — Invite / Add team members dialog, mobile layout only

### Feature
"Add team members" dialog footer — action buttons

### Status
**Confirmed** (2026-08-07, mobile follow-up)

### Description
On Desktop (1440×900), the "Add team members" dialog footer shows two
buttons side by side: **Cancel** and **Invite**. On Mobile (390×844), the
same dialog (now rendered as a full-screen sheet) shows only **Invite** at
the bottom and a "✕" icon in the header — the **Cancel** button does not
exist anywhere in the mobile DOM (confirmed via a text search across the
full page, not just a viewport/scroll check).

### Expected Behaviour
Per the task's own instruction to verify nothing is missing on Mobile
compared to Desktop where it should exist: the dialog should offer the same
explicit "Cancel" action on both viewports, consistent with every other
create/edit dialog in the app.

### Actual Behaviour
Mobile users can only dismiss the dialog via the "✕" icon (functionally
equivalent to Cancel — closes without saving, confirmed) or by submitting
via "Invite". The labeled "Cancel" affordance itself is simply absent.

### Root Cause (if known)
Not confirmed — consistent with the mobile dialog footer template only
including the primary action button and relying on the header "✕" to cover
the secondary/cancel action, without an explicit design decision to also
drop the "Cancel" label.

### Regression Risk
Low functionally (the "✕" provides an equivalent escape hatch, confirmed
working), but a real Desktop/Mobile parity gap and a minor discoverability
regression — "✕" icons are conventionally understood as "close", not
always as explicitly as a labeled "Cancel" button, and some users scan for
the labeled action they saw elsewhere in the app.

### Areas Affected
Dashboard → "Invite" button → "Add team members" dialog, Mobile (390px)
layout only. Not yet checked whether other dialogs have the same
Desktop-has-Cancel / Mobile-drops-Cancel pattern.

### QA Notes
Confirmed on the empty test project
(`/project/019fdbaa-1d51-727a-9153-b79f4f6c0f45/dashboard`) at 390×844,
cross-checked against the same dialog at 1440×900 on the same project.

### Workaround (if any)
None needed — the "✕" icon achieves the same result.

---

## Dashboard Widgets Truncate Long Data-Driven Text With No Way to Recover the Full Value

### Module
Dashboard — widgets that render real record names/descriptions as row
labels (confirmed: "Products purchased by customers" matrix rows,
"Critical risk" list items; likely also "Action plan" task names)

### Feature
Row-label text rendering inside Dashboard widget cards

### Status
**Confirmed** (2026-08-07, mobile follow-up; also visible on Desktop)

### Description
Several Dashboard widgets render real record text (product names, risk
descriptions, task names) truncated with a trailing ellipsis when the
container is too narrow — e.g. "Eau de Parfum Dior — Signature (50 мл)"
renders as "Eau de Par...", and "Internal risk — critical inventory system
outage in peak s..." is cut mid-sentence. Confirmed via direct DOM
inspection that the **full, untruncated text does exist** in the DOM (e.g.
`textContent` correctly returns the complete product name) — this is a
purely visual/CSS truncation, not missing data. However, unlike the
matrix's own **column** headers (which get single-letter chips *plus* a
legend below spelling out each full name), there is **no equivalent
recovery mechanism for the truncated row labels**: no `title` attribute
(confirmed absent via `getAttribute('title')` on the text node and its
parent), no tooltip on hover/tap, no legend, and the row itself is not
clickable/linked (confirmed — no ancestor element within 5 levels has
`cursor: pointer` or is an `<a>`/link) to view the full record elsewhere.
Most visible on Mobile (390px) due to narrower columns, but the same
truncation (without recovery) is also present on Desktop (1440px) once
names exceed the column width.

### Expected Behaviour
A user should always have some way to read the full value of a truncated
row label — at minimum a native `title` tooltip, ideally a proper tooltip
component, or making the row clickable through to the underlying record —
consistent with how the same widget already solves this exact problem for
its column headers via a legend.

### Actual Behaviour
Truncated row labels are a dead end: no tooltip, no legend, not clickable.

### Root Cause (if known)
Not confirmed — consistent with the row-label component using a plain
`truncate`/`text-overflow: ellipsis` CSS class with no accompanying
`title` prop or tooltip wrapper, while the column-header component (built
separately, evidently) was given the legend treatment.

### Regression Risk
Low-Medium — doesn't block any action, but is a real, repeatable usability
gap on the very widgets meant to give an at-a-glance summary, and will
worsen as product/risk/task names get longer or as more segments are added.

### Areas Affected
- Dashboard → "Products purchased by customers" widget → row labels
  (product names)
- Dashboard → "Critical risk" widget → list item descriptions
- Dashboard → "Action plan" widget → task names (same visual pattern
  observed; not independently DOM-verified for a `title` attribute)

### QA Notes
Confirmed on "Dior Brand" project, both 390×844 and 1440×900, via
`document.querySelectorAll` + `getBoundingClientRect`/`getAttribute`
inspection, not just visual screenshot comparison.

### Workaround (if any)
For product names specifically: the user can open the widget's own deep
link ("→") to the full Products / Services page, which shows untruncated
names — but this is a two-step detour, and no such detour exists for an
individual truncated Critical risk entry (the widget's arrow link goes to
the general Risk analysis page, not that specific risk).

---

## Intermittent Sidebar Menu/Panel/Drawer Open Failure (Assist me, Notifications, Language)

### Module
Global — Sidebar UI shell (Assist me AI chat, Notifications panel, Language
switcher; the Invite modal shares the same failure signature but is far less
affected)

### Feature
Any sidebar-triggered dropdown/menu/drawer that renders via a client-side
overlay (as opposed to a full page navigation)

### Status
**Confirmed, but not reproduced 2026-08-07 — likely fixed or greatly
improved, pending a larger re-verification sample** (see History below)

### Description
Clicking several different sidebar controls — the **"Assist me"** button
(AI chat drawer), the **Notifications** bell/link, and the **Language**
switcher — frequently does nothing visible at all: no dialog, menu, or
listbox ever appears, the triggering `<button>`'s `aria-expanded`/
`data-state` attributes never change, and the page's DOM is otherwise
byte-for-byte identical before and after the click (confirmed via
screenshot diffing). This is sometimes, but not reliably, accompanied by a
generic browser console error: `Uncaught application error: undefined
{componentStack: ...}` referencing the app's main JS bundle — the error
does not fire on every failed attempt, and does not fire on every
*successful* attempt either, so it should be treated as a loosely
correlated symptom of the same underlying issue rather than its direct
cause.

Failure rates observed across repeated live attempts in a single session
(headless Chromium, prod):
- **Assist me**: failed to open in **5 out of 5** attempts.
- **Notifications**: failed to open in **6 out of 6** attempts.
- **Language**: opened successfully in roughly half of ~7 attempts; on the
  attempts where it *did* open, the menu itself was sometimes observed to
  detach from the DOM moments later, causing a subsequent click on one of
  its menu items to fail with "element was detached from the DOM".
- **Invite** (Dashboard "Invite" button → "Add team members" drawer): the
  most reliable of the four — opened correctly in the large majority of
  attempts across two separate sessions today, but did show the same
  console error once, correlated with a stray `401` on a background
  request that same time (not reproduced again in 7 further attempts).

### Expected Behaviour
Every one of these controls should reliably open its corresponding
dropdown/menu/drawer on click, every time, with no console errors.

### Actual Behaviour
As described above — failure is the *norm*, not the exception, for Assist
me and Notifications specifically; Language is a coin flip; Invite is
mostly fine but not immune.

### Root Cause (if known)
Not confirmed from the outside. The shared, generic
`componentStack`-only error message (no readable stack trace, no specific
component name) suggests either: (a) a shared error boundary wrapping all
of these overlay-rendering components that swallows the real underlying
error and only logs a stub message, or (b) a race condition in whatever
shared state/portal-mounting mechanism backs these overlays (all four are
plausibly built on the same underlying drawer/dialog/dropdown library given
the shared visual language elsewhere in the app). The fact that failure
rates differ sharply by feature (Assist me/Notifications ~100% failure,
Language ~50%, Invite <15%) suggests it isn't a single global outage but
something sensitive to each component's specific data-loading path (e.g.
Assist me and Notifications both need to fetch data before rendering,
whereas Invite's form has no such dependency and Language's option list is
presumably static/small).

### Regression Risk
**High** — this affects four distinct, real features (one of them, Assist
me, is documented in `PROJECT_KNOWLEDGE.md` §7 as present on almost every
page in the app) and none of it was previously covered by any automated
spec, so it could have been present for any number of past releases
without being caught. It's also exactly the kind of bug that's easy to
miss manually, since a single retry click "fixes" it often enough that a
tester who doesn't count attempts could walk away thinking the feature
works.

### Areas Affected
- Dashboard / every page → "Assist me" button (chat drawer)
- Sidebar → Notifications bell/link (panel)
- Sidebar → Language switcher (menu)
- Dashboard → "Invite" button (drawer) — lower rate, same signature

### QA Notes
Reproduction recipe: navigate to any project's Dashboard, click "Assist
me" (or Notifications, or Language) once, and check whether a
`role="dialog"`/`role="menu"`/`role="listbox"` element became visible and
whether the DOM changed at all (a plain screenshot diff works fine — no
special tooling needed). Repeat 5+ times fresh (full page reload between
attempts is *not* required to reproduce it — it recurs within the same
page load too). `tests/32-minor-global-settings.spec.js` encodes a
click-and-retry-up-to-5-times workaround for Notifications and Language
specifically so that spec doesn't flake — **that retry loop is a
test-robustness workaround, not evidence the bug is fixed**; re-verify the
underlying failure rate every release rather than assuming it's resolved
because the spec passes. No automated coverage exists yet for "Assist me"
itself (deliberately — see `RELEASE_CHECKLIST.md` §18's guidance to test
AI features by behavior, and this bug means "does it open at all" is
itself the behavior worth asserting before anything about the AI response
can be tested).

### Workaround (if any)
For end users: click the control again (or a few times) — it does
eventually open, at least for Language and Invite. For Assist me and
Notifications, 5 consecutive attempts in this session never once
succeeded, so there may be no reliable end-user workaround for those two
specifically today.

### History
- **2026-08-06:** First systematically confirmed — Assist me 0/5, Notifications
  0/6, Language ~50% (~3-4/7), Invite mostly fine but not immune.
- **2026-08-07 (Dashboard QA session, re-verification):** Re-tested on the
  populated "Dior Brand" project, Dashboard page. **Assist me: 5/5 successful
  opens** (open → close → reopen, repeated 5 times, no console errors on any
  attempt). **Notifications: 1/1 successful open.** **Language: 1/1
  successful open.** This is a sharp reversal from 2026-08-06's near-total
  failure rate for Assist me and Notifications specifically. Given the much
  smaller sample size for Notifications and Language this session (1 attempt
  each, vs. Assist me's 5), this is reported as **likely fixed/improved, not
  yet fully re-confirmed** — a future session should repeat Notifications and
  Language 5+ times each (as was done for Assist me here and for all three in
  the original 2026-08-06 pass) before marking this entry's Status as
  **Fixed**. Do not assume this is fully resolved from a single successful
  attempt on the weaker-sampled two controls.

---

## Marketing Channel — Custom "Other" Category Names Permanently Pollute the Shared Category Dropdown

### Module
Operations → Marketing Channels

### Feature
Create/Edit Channel — Category field, "Other" option's custom free-text
name

### Status
**Confirmed** (2026-08-06)

### Description
When a Marketing Channel is created with Category = "Other" and a custom
category name is typed into the resulting free-text field, that custom
name does **not** stay scoped to the one channel that introduced it — it
permanently joins the shared Category dropdown's option list for **every**
future channel created on the project, indistinguishable from the seven
built-in categories. There is no visible admin/cleanup surface for this
list. Confirmed live: the Category dropdown on the shared "Dior Brand"
project currently contains, alongside the real categories, several
custom values from unrelated past sessions — including two that are
obvious throwaway/test input (`"test test test test test test test test
test test"` and `"наг"`) sitting permanently in a list every real user of
this project now sees.

### Expected Behaviour
Unconfirmed against actual product intent — a per-project custom-category
list that grows over time may well be intentional (so a user doesn't have
to retype "Influencer & UGC" every time). If so, there should likely be a
way to rename/remove a custom category later; if not, "Other" entries
probably should stay scoped to the one record that introduced them.

### Actual Behaviour
Every custom "Other" category name ever entered on a project accumulates
forever in that project's Category dropdown, with no way (found in this
pass) to edit or delete an entry, and no visual distinction from the
built-in categories.

### Root Cause (if known)
Not confirmed — consistent with "Other" custom values being stored as
regular rows in a project-scoped categories table rather than as a
channel-local field, with no delete/admin path exposed in the UI explored
so far.

### Regression Risk
Low functionally (doesn't break anything), but real and compounding for
UX/data-quality: every QA session or user that exercises "Other" adds one
more permanent, unremovable entry to a list every future user of that
project sees. On the shared "Dior Brand" test project specifically, this
list is already visibly polluted with test/garbage strings.

### Areas Affected
Operations → Marketing Channels → Create/Edit Channel, Category dropdown
(shared per-project list).

### QA Notes
`tests/12-create-marketing-channels.spec.js` exercises "Other" once per
run with a name tagged `(QA)` (previously untagged, e.g. "Influencer &
UGC") specifically so future entries stay identifiable as test data among
real ones — but this does not fix the underlying accumulation, and every
run still adds one more permanent row. Consider using a disposable project
for this specific scenario rather than the shared live one, per
`CLAUDE.md`'s data-hygiene guidance, if this becomes a maintenance problem.

### Workaround (if any)
None found. Avoid typing throwaway/garbage text into the "Other" custom
category field on the shared project even for a one-off manual check —
it does not go away afterward.

---

## Marketing Channels — Sales Funnels Step Redesigned Into a Multi-Stage Funnel Builder

### Module
Operations → Marketing Channels

### Feature
Create/Edit Channel — Step 2 ("Sales funnels")

### Status
Confirmed implementation detail, not a defect (documentation/automation
was simply out of date)

### Description
`PROJECT_KNOWLEDGE.md` (and, until this session, `tests/12` and `tests/13`)
described Step 2 of the Channel wizard as four flat fields: Monthly budget,
Reach, Conversion to lead %, Conversion to customer %. The live app has
replaced this with a **"Build your sales funnel"** builder: a channel
starts with one generic funnel stage (**Quantity**, **Cost (optional)**,
and a **Conversion rate,%** into the next stage), and an **"Add funnel
step"** button lets a user chain up to 5 stages end-to-end (e.g. a
"Reach" stage feeding a "Leads" stage), with each stage after the first
having its Quantity auto-computed (and shown disabled) from the previous
stage's quantity × conversion rate. The page totals a **Total Cost** and a
**Final Result** ("N Deals") across all configured stages.

### Expected Behaviour
N/A — this is a legitimate feature enhancement (a fixed 4-field form
generalized into a flexible N-stage funnel model), not a bug. Documenting
it here purely so it isn't mistaken for a regression the next time
someone opens this form and it doesn't match `PROJECT_KNOWLEDGE.md`.

### Actual Behaviour
Confirmed live on both Create and Edit: a fresh channel starts with
exactly one stage ("Step 1", all three fields enabled); an
already-multi-stage channel (e.g. one edited by an earlier QA session)
shows named stages ("Reach", "Leads") with later stages' Quantity/Cost
shown disabled once auto-computed.

### Root Cause (if known)
Intentional product redesign.

### Regression Risk
Low for the feature itself; was **High** for test-suite maintenance until
this session — `tests/12-create-marketing-channels.spec.js` and
`tests/13-edit-marketing-channels.spec.js` both broke completely on Step 2
until rewritten against the new field structure (see their in-file
comments for the mapping from old field names to new one:
`quantity`/`cost`/`conversionRate` replace
`reach`/`monthlyBudget`/`conversionToLead`; `conversionToCustomer` has no
direct one-stage equivalent anymore and was dropped from the fixture data).

### Areas Affected
Operations → Marketing Channels → Create/Edit Channel, Step 2.

### QA Notes
Only the first funnel stage's fields are exercised by the current specs;
adding a second stage via "Add funnel step" and editing an existing
second stage are both coverage gaps worth closing in a future session.

### Workaround (if any)
N/A.

---

## Marketing Channel Category Labels Recapitalized / "Paid Search" Dropped "(Google Ads)"

### Module
Operations → Marketing Channels

### Feature
Create/Edit Channel — Category dropdown option labels

### Status
Confirmed implementation detail, not a defect

### Description
The Category dropdown's built-in option labels are now Title Case in the
live app ("Social Media", "Direct Sales", "Email Marketing", "Paid
Search", "SEO & Content") where `PROJECT_KNOWLEDGE.md` and the pre-existing
specs expected sentence case ("Social media", "Direct sales", "Email
marketing", "SEO & content"). Additionally, "Paid search (Google Ads)" has
been shortened to just **"Paid Search"** — the "(Google Ads)" qualifier is
gone. "Events & PR", "Referral", and "Other" are unchanged.

### Expected Behaviour
N/A — a copy/content change, not a functional issue.

### Actual Behaviour
Exact-match category selectors written against the old labels fail to find
any option at all (not a wrong-option selection — a `strict mode`/"element
not found" failure), because Playwright's `exact: true` name matching is
case-sensitive.

### Root Cause (if known)
Intentional copy update.

### Regression Risk
Low for the product; was the direct cause of `tests/12`'s and (indirectly,
once past the category step) `tests/13`'s full-suite failures this
session — now fixed by updating both specs' category values to match.

### Areas Affected
Operations → Marketing Channels → Create/Edit Channel, Category dropdown.

### QA Notes
Update `PROJECT_KNOWLEDGE.md` §3.3 to stop describing sentence-case labels
and the "(Google Ads)" qualifier as current.

### Workaround (if any)
N/A — specs now use the Title Case labels.

---

## Duplicate Products From Non-Idempotent, Unmarked Test Fixtures

### Module
Magic Triangle → Products / Services (and, by the same mechanism, likely
every other module whose create-spec has no unique run-marker — see
`CLAUDE.md`'s Data Hygiene section and this file's Regression Checklist
notes on specs `06`, `08`, `09`, `12`, `14`, `16`, `18`, `20`, `22`, `24`)

### Feature
Products list on the shared "Dior Brand" project

### Status
Confirmed (2026-08-06) — a concrete, observed instance of the
already-documented general data-hygiene risk, not a new mechanism

### Description
The shared live project currently has **two** copies of all four seed
products (`Eau de Parfum Dior — Signature`, `Parfum Intense Dior —
L'Imperiale`, `Сироватка для обличчя Dior — Capture / Hydra`, `Крем для
обличчя Dior — Anti-Age / Зволоження`), each pair sharing an identical
name, description, price, and revenue type — because
`tests/06-create-product.spec.js` has no unique-run marker and has now
been executed at least twice against this project without any teardown.
This directly caused a downstream test-suite bug: `tests/07`'s
name-based product lookup (`page.getByText(name).first()`) always
resolves to whichever copy happens to render first in DOM order, and a
prior session's edits (attaching/detaching a client) had only ever been
applied to that first-rendered copy — so when a later session re-ran and
a *different* first-rendered copy existed, the hardcoded "this product has
the client" assumption from `tests/07` broke (see the fix in that file's
in-code comments for the idempotent rewrite).

### Expected Behaviour
N/A for the product itself (creating a product with the same name as an
existing one is a documented open question in `RELEASE_CHECKLIST.md` §6,
not asserted here either way). Documented purely because it's now a
*confirmed*, concrete instance with real consequences for testing, not
just a theoretical risk.

### Actual Behaviour
8 total product records exist today where 4 unique ones were intended;
confirmed by reading the live Products / Services list directly.

### Root Cause (if known)
Test-data hygiene: `06-create-product.spec.js` creates its fixture
products with static, non-unique names and no cleanup step, so every full
suite run against the shared project adds another complete duplicate set.

### Regression Risk
Medium and growing — every additional full-suite run adds another
duplicate set, and any spec (existing or future) that locates a product by
name and takes `.first()` is silently at risk of operating on the wrong
copy depending on DOM/creation order, exactly as happened to `tests/07`.

### Areas Affected
Magic Triangle → Products / Services directly; potentially every other
module listed above via the same mechanism. **Now also confirmed
(2026-08-07) in two further modules on the same "Dior Brand" project**,
visible directly on the Dashboard: **Implementation → Action Plan** (the
Dashboard's "Action plan" widget shows two identical entries each for
"Prepare investor update deck" (Done) and "Coordinate boutique staff
training session" (To Do)) and **Implementation → Risk analysis** (the
Dashboard's "Critical risk" widget lists two identical "Internal risk —
critical inventory system outage in peak s..." entries under Extreme). Same
root cause as Products — non-idempotent create-test fixtures with no unique
run marker, re-run against the shared project with no teardown.

### QA Notes
`tests/07-edit-product-add-delete-client.spec.js` was rewritten this
session to detect *which* of its two named products currently holds the
client attachment at runtime rather than assuming a fixed one, and to
restore the attachment to the same product it removed it from — making
that specific pair of tests idempotent regardless of duplication. This
does **not** clean up the existing duplicate records, and does not
prevent new duplicates from `06` on the next full-suite run. A disposable
project per full-suite run (already suggested in `TESTING_IMPROVEMENTS.md`
and the repo's env-config work) would fix this at the root.

### Workaround (if any)
None applied — the existing duplicates were left in place (deleting them
was out of scope for this session and risks removing a copy something else
now depends on). Recommend a dedicated cleanup pass or, better, switching
the create-heavy specs to a disposable per-run project.

---

## Session Lost on One Side When Two Tabs/Contexts Reload Concurrently

### Module
Global — Authentication / Session

### Feature
Session/refresh-token handling across multiple concurrent browser
tabs/contexts sharing the same login

### Status
**Confirmed** (upgraded from "Open — unconfirmed hypothesis" after a
deliberate, successful reproduction on 2026-08-05; see history below)

### Description
When two browser contexts are authenticated with the **same** session
(e.g. a user with the app open in two tabs) and both perform a full-page
reload at close to the same time, one side silently loses its session and
is redirected to `/sign-in`, while the other continues working normally.
The losing side does **not** recover on its own — subsequent solo reloads
of that same tab stay on `/sign-in` until the user logs in again manually.
Which of the two tabs "wins" is not fixed — repeating the experiment showed
either side could be the one logged out.

### Expected Behaviour
Opening the same authenticated session in two tabs and reloading both
around the same time should not log either one out; both should remain
authenticated, the same way a single tab does across any number of solo
reloads.

### Actual Behaviour
Reproduced deliberately: two Playwright browser contexts were seeded with
the same post-login `storageState` and made to `goto()` the app's root URL
concurrently, five rounds in a row. In the first 5-round run, the same
context lost its session on every single round (5/5). In a follow-up run,
the *other* context lost its session instead — confirming the outcome is a
race, not tied to a specific tab. Once a context loses the race, it stays
logged out through further solo reloads with no automatic recovery.

### Root Cause (if known)
Consistent with the original hypothesis, now supported by reproducible
evidence: refresh-token rotation. Each full-page load appears to trigger a
call to `POST /api/v1/auth/refresh`; if two contexts sharing one refresh
token call it at nearly the same time, the backend most likely rotates the
token on the first request it processes and invalidates the old one — the
second, now-stale request is then rejected, and that context has no valid
token left to fall back on, so it drops to the signed-out state. This is
inferred from behavior, not from reading the backend implementation, so it
should still be treated as the leading explanation rather than a verified
mechanism.

### Regression Risk
High-ish for real users, low for visibility: this is exactly the kind of
bug that never shows up in single-tab manual testing (which is how this
app has almost certainly been tested so far) but will affect any user who
routinely keeps the app open in two tabs or windows — a common habit, not
an edge case. Every existing Playwright spec is unaffected because the
suite deliberately avoids concurrent contexts, so this class of bug has no
automated coverage today and could regress or worsen silently.

### Areas Affected
Every page and every module — this lives at the session/auth layer, below
any individual feature. Any multi-tab or multi-device-simultaneous-use
scenario for the same account is at risk.

### QA Notes
Reproduction recipe (headless Playwright, adaptable to manual multi-tab
testing): log in once, capture `storageState`, open two `browser.newContext()`
instances with that same state, then call `page.goto(BASE_URL)` on both
pages inside a single `Promise.all([...])` so they fire together; repeat a
few rounds. Expect one side to land on `/sign-in?redirect=%2F` within the
first round or two. This is now reliable enough to turn into a real
automated regression test (e.g. `tests/26-concurrent-session.spec.js`) —
recommended as a follow-up, since right now the only verification is the
manual reproduction run during this QA session, not a committed spec.

### Workaround (if any)
None at the product level. For test authors: continue relying on a single
shared `storageState.json` per run (per `auth.setup.js`) rather than
spinning up multiple concurrent authenticated contexts against the same
account, until this is fixed. For end users: if the app unexpectedly shows
the sign-in screen in one tab while another tab still works, simply log
back in on the affected tab — no data was found to be lost, only the
session token.

---

### History
- **2026-08-05 (earlier same day):** First noticed as a single, unreproduced
  anomaly during live app exploration for `PROJECT_KNOWLEDGE.md`. Logged as
  "Open — unconfirmed," root cause marked as a hypothesis only.
- **2026-08-05 (this entry):** Deliberately reproduced via two concurrent
  Playwright contexts sharing one session, 5/5 rounds in the first attempt;
  confirmed the effect is a genuine race (not one-sided) via a follow-up
  run; confirmed the losing side does not self-recover. Status upgraded to
  **Confirmed**.

---

## Action Plan Edit Form Does Not Persist Stage Changes

### Module
Implementation → Action Plan

### Feature
Edit Task modal — Stage field

### Status
Open

### Description
In the "Edit action item" form, the **Stage** dropdown (the field that
determines which Kanban column a task belongs to) visually updates when a
different stage is selected, but the change does not persist once **Update**
is clicked and the page is reloaded.

### Expected Behaviour
Changing a task's Stage in the Edit form and clicking Update should move the
task to the newly selected stage/column, matching what drag-and-drop does.

### Actual Behaviour
The task remains in its original column after Update, even though the
dropdown appeared to change during the edit session. The **only** way to
move a task between stages is dragging its card to a different column on the
board.

### Root Cause (if known)
Not confirmed. Suspected that the Update handler for this form omits the
Stage field from its payload, or the Stage field is display-only/decorative
in this modal while the backend relationship is only updated by the
board's dedicated drag-and-drop mutation.

### Regression Risk
Medium. This is exactly the kind of thing that silently "fixes itself" (or
breaks further) during an unrelated Action Plan refactor without anyone
noticing, since the form doesn't error — it just quietly fails to save one
field.

### Areas Affected
- Implementation → Action Plan → Edit Task modal
- Any automated test or manual workflow that assumes editing Stage via the
  form is equivalent to drag-and-drop

### QA Notes
- Confirmed via `tests/23-edit-action-plan.spec.js` (explicit code comment:
  *"Note: the Stage dropdown (index 1) in this form visually updates but
  does not persist the change on Update — moving stages only works via
  drag-and-drop."*) and cross-referenced in `README.md` → "Known quirks".
- Re-verify every release per `RELEASE_CHECKLIST.md` §15 (Action Plan
  Regression items) — if this is ever fixed, this entry's Status should
  move to **Fixed** (not deleted) and the affected specs/checklist updated
  to actually exercise Stage-change-via-form.

### Workaround (if any)
To move a task between stages, use drag-and-drop on the board
(`dragCardToColumn` helper in `tests/22-create-action-plan.spec.js`) instead
of the Edit form.

---

## Action Plan Board Ignores Playwright's Native `dragTo()`

### Module
Implementation → Action Plan

### Feature
Kanban board drag-and-drop (test-automation compatibility)

### Status
Open

### Description
Not a user-facing defect — an implementation detail that breaks the
"normal" way of automating drag-and-drop. The board's drag-and-drop
implementation does not respond to Playwright's built-in
`locator.dragTo()` call; dragging a card produces no visible movement and no
state change when triggered that way.

### Expected Behaviour
N/A for end users (the board's manual mouse-driven drag-and-drop works fine
for a real human user). For test automation, a standard `dragTo()` call
would ideally work like it does on most drag-and-drop UIs.

### Actual Behaviour
`dragTo()` is a silent no-op against this board. A card only moves when
driven by a manual `mouse.down()` → several stepped `mouse.move()` calls →
`mouse.up()` sequence, with explicit waits between steps.

### Root Cause (if known)
Likely the underlying drag-and-drop library requires intermediate
`pointermove`/`dragover` events with real timing/step counts that
Playwright's single-jump `dragTo()` doesn't emit, so the library never
registers a valid drag gesture.

### Regression Risk
Low for end users; Medium for test suite maintenance — if the drag library
is ever swapped or upgraded, this constraint should be re-tested, since a
library change could either fix `dragTo()` compatibility (test code could
then simplify) or make the manual sequence unreliable in a new way.

### Areas Affected
- Any current or future automated test exercising Action Plan
  drag-and-drop (`tests/22-create-action-plan.spec.js`,
  `tests/23-edit-action-plan.spec.js`)

### QA Notes
Documented in `README.md` → "Known quirks" and `CLAUDE.md`. This is a
testing-technique constraint, not something to file against the product
team — but it must survive in institutional memory or every future spec
author re-discovers it the hard way.

### Workaround (if any)
Use the `dragCardToColumn` helper pattern already established in
`tests/22-create-action-plan.spec.js`: `mouse.down()` on the card center →
`mouse.move()` in small steps toward the target column → pause → final
`mouse.move()` to the target center → `mouse.up()`, with short
`waitForTimeout` pauses between phases.

---

## MVP Submission Requires At Least One "Core" Feature

### Module
Implementation → MVP

### Feature
Create/Edit MVP — Key Feature Type field

### Status
Open (confirmed business rule, not yet verified whether intentional or a
missing "at least one feature of any type" fallback)

### Description
An MVP cannot be created (or, presumably, saved in edit) if all of its Key
Features are marked "Optional" — at least one Feature must be Feature Type
"Core" or the submission is rejected.

### Expected Behaviour
Unconfirmed from a product-requirements standpoint — this may well be
correct, intentional business logic (an MVP should always have some
non-negotiable core capability). Flagged here so it isn't mistaken for a
random validation bug if a future test unexpectedly fails on it.

### Actual Behaviour
Submitting an MVP whose only Key Feature(s) are "Optional" type fails
validation/submission.

### Root Cause (if known)
By design, most likely — but not confirmed against actual product
requirements/documentation.

### Regression Risk
Medium for test-suite stability: any new MVP-creation test that forgets to
include a Core feature will fail in a way that looks like an unrelated bug
if this rule isn't front-of-mind.

### Areas Affected
- Implementation → MVP → Create MVP (full-page form, not a modal)
- Implementation → MVP → Edit MVP

### QA Notes
Confirmed via `README.md` → "Known quirks" (*"MVP creation requires at
least one Key feature of type 'Core' — an MVP with only 'Optional' features
fails to submit."*) and exercised by every MVP fixture in
`tests/24-create-mvp.spec.js` (each MVP's single feature is always type
"Core"). No spec currently exists that *deliberately* tests the
all-Optional rejection path — that's a coverage gap noted in
`RELEASE_CHECKLIST.md` §16, not a bug in itself.

### Workaround (if any)
Always include at least one Key Feature with Feature Type = "Core" when
creating or editing an MVP.

---

## IP Rights Nav Buttons Carry a Live Status Badge in Their Label

### Module
Operations → Other → Intellectual Property Rights

### Feature
IP Type selector buttons (Trademark / Patent / Copyright / Design)

### Status
Open (confirmed implementation detail, not a defect)

### Description
The four IP Rights type-selector buttons render their current registration
status as part of the visible button label (e.g. "Patent Planned"), and
this label updates immediately after Save (e.g. becomes "Patent
Registered"). Anything matching these buttons by **exact** text will break
the moment the status changes.

### Expected Behaviour
N/A — this is working as designed; documenting purely so automated
selectors and manual testers don't get tripped up by it.

### Actual Behaviour
Button accessible name is `"{Type} {Status}"` (e.g. "Trademark Planned",
"Design Registered"), not just the bare type name.

### Root Cause (if known)
Intentional UI design — the status badge is meant to be visible at a
glance without opening each panel.

### Regression Risk
Low functionally, but High for test-suite fragility if this pattern isn't
followed consistently — any new selector written against an exact IP Rights
button label will be flaky by construction.

### Areas Affected
- Operations → Other → IP Rights, all four type panels
- Any test or automation selecting these buttons

### QA Notes
Confirmed via `README.md` → "Known quirks" and directly implemented in
`tests/18-create-other.spec.js` / `tests/19-edit-other.spec.js`, which match
by prefix regex (`/^Patent\b/`) rather than exact label text specifically
because of this behavior.

### Workaround (if any)
Always match IP Rights type buttons by **prefix** (`getByRole('button',
{ name: /^Patent\b/ })`), never by exact full-label text.

---

## Resources — Amortization Period Capped at 100

### Module
Operations → Resources (Investment type)

### Feature
Create/Edit Resource — Amortization period field

### Status
**Changed** (2026-10-01): the field is no longer shown in the UI (see "Investment Resources Cannot Be Created"). The backend still validates `amortization_period` as an integer 1–100 and now treats it as years. Was: Open (confirmed validation limit, months).

### Description
The Amortization period field (months) for an Investment resource rejects
values above 100.

### Expected Behaviour
Unconfirmed whether 100 months (~8.3 years) is an intentional business rule
or an arbitrary/legacy limit that should be higher for long-lived assets
(e.g. the "Office space" category in the current seed data uses a 96-month
amortization, close to this ceiling).

### Actual Behaviour
Values above 100 are rejected by client-side (and presumably server-side)
validation.

### Root Cause (if known)
Not confirmed — flagged for product clarification rather than assumed to be
either "working as intended" or "a bug."

### Regression Risk
Low functionally (it's a stable, apparently-enforced limit), but worth
re-checking after any Resources form refactor since it's an easy
off-by-one to accidentally loosen or tighten (99 vs. 100 vs. 101).

### Areas Affected
Operations → Resources → Investment create/edit form.

### QA Notes
Confirmed via `README.md` → "Known quirks" (*"Amortization period has a
max value of 100"*). No dedicated boundary test exists yet for exactly 100
(accepted) vs. 101 (rejected) — see `RELEASE_CHECKLIST.md` §10 Edge Cases.

### Workaround (if any)
N/A — keep Amortization period ≤ 100 when creating test fixtures.

---

## Resources — Running Cost Rejected for Years Before Start Year

### Module
Operations → Resources (Running costs type)

### Feature
Create/Edit Resource — Cost per year fields

### Status
Open (confirmed validation rule)

### Description
For a Running Costs resource, the "Cost" input for any planning-horizon
year **before** the resource's own Start year is rejected by validation.

### Expected Behaviour
Consistent with the rule's evident intent: a running cost shouldn't be
recorded for a year before the resource existed. Not independently
confirmed against product requirements, but internally logical.

### Actual Behaviour
Attempting to fill a per-year cost column for a year earlier than Start
year fails validation; the existing test suite works around this by simply
skipping those columns rather than asserting on the rejection message
itself.

### Root Cause (if known)
By design, most likely.

### Regression Risk
Low functionally; Medium for test-suite correctness if a future spec
naively fills every year column without checking Start year first (as
`tests/16-create-resources.spec.js` already does correctly).

### Areas Affected
Operations → Resources → Running Costs create/edit form.

### QA Notes
Confirmed via `README.md` → "Known quirks" and implemented defensively in
`tests/16-create-resources.spec.js` (`if (columnYear < startYearNum)
continue;`). No spec currently asserts on the actual rejection/error
message when this rule is violated on purpose — coverage gap, see
`RELEASE_CHECKLIST.md` §10.

### Workaround (if any)
When filling Running Costs cost-per-year fields programmatically, always
skip any year column earlier than the resource's Start year.

---

## App Never Reaches `networkidle` (Continuous Background Polling)

### Module
Global / Test Infrastructure

### Feature
All pages — network activity

### Status
Open (confirmed, ongoing app behavior)

### Description
The application continuously makes background network requests (observed:
notification polling, likely session/token-refresh checks, possibly other
live-data polling), so `page.waitForLoadState('networkidle')` never
naturally resolves — calling it without an explicit timeout hangs for the
full test/action budget.

### Expected Behaviour
N/A — not necessarily wrong for a live, notification-driven app; documented
purely as a hard constraint on how tests and any manual network-based
waiting must be written.

### Actual Behaviour
`networkidle` waits hang indefinitely (until timeout) on every page in the
app, including static-looking pages.

### Root Cause (if known)
Background polling — likely the Notifications bell and/or an
auth-refresh interval, not confirmed exhaustively across every module.

### Regression Risk
Low (stable, long-known constraint) but High-impact if forgotten: any new
test written with a bare `waitForLoadState('networkidle')` (no timeout)
will intermittently or permanently hang.

### Areas Affected
Every page in the application; every existing and future Playwright spec.

### QA Notes
Documented in `README.md`, `CLAUDE.md`, and applied consistently across
every existing spec as
`page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})`.
Any new spec must follow the same pattern — never call it bare.

### Workaround (if any)
Always pass an explicit timeout and swallow the resulting timeout error;
prefer waiting on a concrete signal (element visible/enabled, URL change,
specific response) over `networkidle` entirely where possible.

---

## Create Project Empty-Field Validation Relies on the Browser's Native Tooltip

### Module
Project Management

### Feature
Create Project form — required-field validation UX

### Status
**Fixed** (confirmed 2026-08-05 as Open; re-verified 2026-08-07 during
full-app functional regression session — now shows styled in-app messages)

### Description
Submitting the Create Project form with required fields empty is correctly
blocked (the form does not submit), but the only feedback shown to the
user is the browser's own native HTML5 constraint-validation tooltip
("Please fill out this field.") popping up on the first empty required
field. There is no in-app, styled validation message — unlike Clients,
Products, Marketing Channels, and other create forms across the app, which
all show the app's own red/styled inline text ("required",
"must be at least 2 characters", etc.).

**2026-08-07 re-verification — now Fixed:** submitting the fully-empty
Create Project form now shows a styled, accessible (`role="alert"`) inline
message under **every** required field simultaneously, not just the first
one: "Project name must be at least 2 characters", "Legal form is
required", "Development stage is required", "Currency is required", "Tax
rate is required", "Foundation year is required", "Calculation plan year
is required", "Planning years is required". This exactly matches the
"Expected Behaviour" below and the validation style used elsewhere in the
app. Confirmed via a full DOM snapshot after an empty submit, not just a
screenshot.

### Expected Behaviour
Consistent with the rest of the app: a styled, in-app validation message
under or near each invalid field, matching the visual language used by
every other create form (Clients, Products, Competitors, Evaluation
Criteria, and others all show custom validation text, confirmed live in
this same session).

### Actual Behaviour
Only the browser's default tooltip appears; no custom validation text is
rendered anywhere in the form's DOM (confirmed via a full innerText dump of
the modal after an empty submit — no "required"/"must be" text present at
all, only the transient native tooltip visible in a screenshot).

### Root Cause (if known)
Likely the Project name (and possibly other) fields rely on the native
`required` HTML attribute alone for validation, without the app's own
form-validation library/component being wired up the way it is on other
forms.

### Regression Risk
Low functionally (the block itself works correctly — no invalid project
can be created), but it's a real UX/consistency defect: the native tooltip
only appears on the *first* invalid field and disappears as soon as the
user interacts with anything else, so a user with multiple empty required
fields (Legal form, Development stage, Currency, Income tax, Year of
foundation, Start calculation year, Planning years are all marked
required) gets no indication of the other unmet requirements after fixing
the first one.

### Areas Affected
Project Management → Create Project modal. Not observed on Edit Project
(not retested independently, but shares the same form component, so likely
affected too) or on any other module's create form.

### QA Notes
Confirmed by screenshotting the modal immediately after clicking "Create
project" on a fully empty form: the visible feedback was exclusively the
orange native browser tooltip anchored to the Project name field, with no
other styled error text anywhere on the page. Cross-checked against
Clients/Products/Competitors in the same session, all of which show clear
custom validation text instead.

### Workaround (if any)
None needed for correctness (the form is safely blocked either way); this
is a UI/UX consistency issue to fix, not a functional blocker.

---

# Regression Checklist

Quick-reference index of every entry above, **newest first**. When a new
confirmed bug is added to this file, add its row to the **top** of this
table (below the header) as well as writing its full entry above. When an
existing bug's status changes (e.g. Open → Fixed), update its row here too
— do not remove the row or its detailed section.

| Bug Name | Module | Status |
|---|---|---|
| MVP List Shows Only the First 15 MVPs — No Pagination or "Load More" | Magic triangle → MVP | **Confirmed** |
| Deleting a Marketing Channel Does Not Refresh Income, Cash Flow and Balance Sheet | Operations → Marketing channels / Financial | **Fixed** (2026-10-20 re-test) |
| Running-Cost Resources Cannot Be Created — "Create" Does Nothing, No Request, No Message | Operations → Resources | **Confirmed** (2026-11-12: only when switching type inside the drawer; root cause found) |
| Line-Staff Card Shows FTE With a Decimal Point in German ("0.5 Personal") | Operations → Team and staff | **Confirmed** |
| "Total Salary Costs" Header Ignores FTE / Head Count | Operations → Team and staff | **Confirmed** |
| "Total Salary Costs" Shows "₣ 0000" When the Team Is Empty | Operations → Team and staff | **Confirmed** |
| Business Plan / PDF Cash Flow Shows the Working Capital Line With an Inverted Sign | Business plan → Financials | **Confirmed** |
| Domicile "Germany" Has No Legal Forms, So a Project With Domicile Germany Cannot Be Created | Projects → Create project | **Confirmed** |
| Business Plan Marketing Channel Page: Cost KPI Shows "Cost per month" Instead of "Cost per year" | Business plan | **Confirmed** |
| Business Plan Marketing Channel Page Is Missing Drop-off, the "Year 2027" Label and the Weakest-Transition Highlight | Business plan | **Confirmed** |
| Business Plan Funnel Styling Ignores the Number of Steps (Last Tier Not Dark, White Text on Light Tiers, One-Step Channel Drawn as a Funnel) | Business plan | **Confirmed** |
| Magic Triangle Cards Not Refreshed After an AI Save — the Next Manual Edit Overwrites the AI's USP / Value Proposition | Magic triangle | **Confirmed** |
| USP / Value Proposition Save Failure Shows No Error Message | Magic triangle | **Confirmed** |
| "Auto Analyze" Silently Overwrites Manually Entered USP and Value Proposition | Magic triangle | **Confirmed** (needs product confirmation) |
| German Date Picker Shows "15 Oktober 2026" (No Period) — a Third Date Style Next to "28.08.2026" | Implementation → Action plan | **Confirmed** |
| Employment % Inputs Silently Truncate Decimals and Long Values ("12,5" → 12, "1500,50" → 15) | Operations → Team and staff | **Fixed** |
| German Forms Show English Validation Messages, and Raw Schema Text in the Financing Form | Implementation / Operations / Financial | **Confirmed** |
| Further Untranslated Strings in the German UI (Create Entry, Action Item, MVP, AI Chat, Business Plan, ARIA) | Financial / Implementation / Assist me / Business plan / Global | **Confirmed** |
| Working Capital Validation Shows Raw Technical Text "Expected number, received null" | Financial → Funding & Setup | **Fixed** (2026-10-07; was: Confirmed) |
| Cash Flow Shows One Net "Working Capital" Line Instead of −ΔAR / −ΔInventory / +ΔAP | Financial → Forecasts & Reports | **Confirmed** (re-tested 2026-10-05 and 2026-10-07, still present) |
| Marketing Funnel Deals Do Not Feed Revenue | Operations → Marketing / Financial | **Confirmed** (re-tested 2026-10-07, still present) |
| Investment Resources Cannot Be Created — "Useful life" Field Missing, Backend Still Requires `amortization_period` | Operations → Resources | **Confirmed** |
| Existing Investments' Amortization Period (Stored in Months) Is Now Read as Years — D&A Understated 12× | Financial → Forecasts & Reports | **Confirmed** |
| Weighted-Score Summary Uses English Decimals in German (Mixed With German Decimals on the Same Card) | Operations → Other | **Confirmed** |
| German Business Plan Keeps AI-Generated Text in English With English Number Formats | Business plan | **Confirmed** |
| More Untranslated Strings in the German UI (Statuses, MVP, Funnel, Charts, ARIA) | Implementation / Operations / Charts / Global | **Confirmed** |
| Shared Business Plan Without `?lang` Uses the Viewer's Saved App Language Instead of English | Business plan → Share | **Confirmed** |
| German UI Still Contains Untranslated English Strings | Global / Resources / Edit project / Business plan | **Confirmed** |
| Integer-Only Numeric Inputs Drop the Decimal Separator and Multiply the Value | Operations → Team/Marketing/Resources | **Confirmed** |
| Zero Totals in Operations Summary Tiles Render as "0000" | Operations | **Not a bug — by design** (2026-10-05; was: Confirmed) |
| CHF Amounts Use the "₣" (French Franc) Sign | Global — currency formatting | **Confirmed** |
| Some Counts Are Not Thousands-Grouped | Dashboard, Team and staff | **Confirmed** |
| Count Labels Ignore Plural Rules | Dashboard, Competitors, Products, Business plan | **Confirmed** |
| Mixed Number Styles Within One Page (Compact vs. Full, 0 vs. 2 Decimals) | Products, Financial | **Confirmed** |
| Create Financing Activity Offers a Year the Backend Rejects (422, No Message) | Financial → Funding & Setup | **Partially fixed** (toast now shown, raw text; 2026 still offered; was: Confirmed) |
| Create MVP Form: AI Does Not Fill the Form Until a Target Segment Is Picked Manually | Implementation → MVP | **Confirmed** |
| Page-Level Assist me Creates and Saves an MVP Immediately With AI-Invented Content | Implementation → MVP (AI side panel) | **Confirmed** |
| Assist me in the Create MVP Form Saves an MVP Directly Instead of Filling the Form | Implementation → MVP | **Fixed** (in-form flow; was: Confirmed) |
| Assist me in "Create new action item" Never Fills the Form | Implementation → Action plan | **Confirmed** |
| Assist me Is Missing From 6 Create Forms | Competitors / Operations → Other / Financial | **Confirmed** |
| Page-Level Assist me Hangs Indefinitely on "Create a Location" Request | Operations → Other (AI side panel) | **Confirmed** |
| In-Form Assist me Chat Shows Raw Markdown (`**bold**`) | Global — in-form AI chat | **Confirmed** |
| Assist me Marketing Funnel: Decimal Conversion Rate Is Rounded When Applied | Operations → Marketing Channels | **Confirmed** |
| Working Capital Defaults (DIO/DSO/DPO) Are Displayed but Not Applied Until "Save changes" Is Clicked | Financial → Funding & Setup / Balance sheet | **Fixed** (2026-10-01; was: Confirmed) |
| Variable Production Cost Is Marked Required but an Empty Value Is Silently Saved as 0 | Magic Triangle → Products / Services | **Fixed** (was: Confirmed). Field made optional (asterisk removed); conflicts with the spec, pending PO decision |
| Create Product — "Revenue type is required" Error Stays Visible After a Revenue Type Is Selected | Magic Triangle → Products / Services | **Fixed** (was: Confirmed) |
| Escape With an Open Dropdown Closes the Whole Create Product Drawer and Discards Input | Magic Triangle → Products / Services | **Confirmed** |
| Income Statement Is Missing the "Other Direct Costs" Line (Cost Type Split Not Reflected in Financial Reports) | Financial → Forecasts & Reports | **Confirmed** (re-verified 2026-09-29 as "Direct service costs": backend now deducts it before Gross profit, UI row still missing, so Gross profit no longer equals Revenue − COGS on screen) |
| Subscription Payment Period Badge Always Shows "/Month" | Magic Triangle → Products / Services | **Fixed** (was: Confirmed) |
| Team & Staff — "Line Staff" Creation Always Fails (Missing `employment_percent` in `staffing[]`) | Operations → Team and Staff | **Fixed** 2026-09-30 (was: Confirmed) |
| Client Edit Form Discards an Uncommitted Name Change After Deleting a Need | Magic Triangle → Clients | **Confirmed** |
| Dashboard Widgets Truncate Long Data-Driven Text With No Way to Recover the Full Value | Dashboard | **Confirmed** |
| Mobile Invite Dialog Drops the "Cancel" Button Present on Desktop | Global — Invite dialog (Mobile) | **Confirmed** |
| App-Wide Overlay Primitive Triggers Two Accessibility Violations on Open (Invite Dialog, Mobile Nav Drawer, Profile Menu) | Global — shared overlay primitive | **Confirmed** |
| Dashboard — "Competitor Summary" Empty State Reuses the "Critical Risk" Icon | Dashboard | **Confirmed** |
| Dashboard / Forecasts & Reports — "Revenue vs Expenses" Chart Y-Axis Mislabeled | Dashboard, Financial | **Confirmed** |
| Intermittent Sidebar Menu/Panel/Drawer Open Failure (Assist me, Notifications, Language) | Global — Sidebar UI shell | Confirmed, **not reproduced 2026-08-07**; **Assist me part not reproduced 2026-09-24 (22/22 opens: in-form + page-level)**. Notifications/Language not re-checked. |
| Marketing Channel — Custom "Other" Category Names Permanently Pollute the Shared Category Dropdown | Operations → Marketing Channels | **Confirmed** |
| Marketing Channels — Sales Funnels Step Redesigned Into a Multi-Stage Funnel Builder | Operations → Marketing Channels | Confirmed (not a defect) |
| Marketing Channel Category Labels Recapitalized / "Paid Search" Dropped "(Google Ads)" | Operations → Marketing Channels | Confirmed (not a defect) |
| Duplicate Products From Non-Idempotent, Unmarked Test Fixtures | Magic Triangle → Products / Services | **Confirmed** |
| Create Project Empty-Field Validation Relies on the Browser's Native Tooltip | Project Management | **Fixed** (was: Open) |
| Session Lost on One Side When Two Tabs/Contexts Reload Concurrently | Global — Auth/Session | **Confirmed** (was: Open/unconfirmed) |
| App Never Reaches `networkidle` (Continuous Background Polling) | Global / Test Infrastructure | Open |
| Resources — Running Cost Rejected for Years Before Start Year | Operations → Resources | Open |
| Resources — Amortization Period Capped at 100 | Operations → Resources | **Changed** (field removed from UI; backend 1–100, now years; was: Open) |
| IP Rights Nav Buttons Carry a Live Status Badge in Their Label | Operations → Other → IP Rights | Open |
| MVP Submission Requires At Least One "Core" Feature | Implementation → MVP | Open |
| Action Plan Board Ignores Playwright's Native `dragTo()` | Implementation → Action Plan | Open |
| Action Plan Edit Form Does Not Persist Stage Changes | Implementation → Action Plan | Open |

**Next entry goes here (top of table + new section above).**

## Session log

- **2026-09-30 — Number localization (EN → DE) on DEV**: all 14 project
  pages + tabs crawled in both languages for Karina (CHF), Dior (UAH) and
  QA Full Regression (EUR); automated EN↔DE token diff found no leftover EN
  formats in DE, no `-0`/`NaN`, no RU space grouping (except AI-generated
  Business plan prose). Inputs: Product price/cost, Funding amount/rate/
  repayment, Tax parse `1500,50`/`15.000`/`1500.50` correctly and persist
  exact values; Salary, Funnel cost/conversion, Resource cost do not (new
  bug). Line staff creation now Fixed. 7 new entries above (6 localization + 1
  incidental Funding year 422). All created records deleted; account
  language restored to English. Report: `test-reports/Number_Localization_Test_Report.md`.

- **2026-09-29 — Income: "Direct service costs" category (counted like
  COGS for `other_direct` products)**: one controlled product (id 404,
  client 408, qty 100/125) was driven through One-time 500/450
  other_direct → cogs → Monthly subscription 50/10 other_direct, then
  deleted. Backend passes: `other_direct_costs` 45,000/56,250 (One-time)
  and 12,000/15,000 (Monthly ×12); `gross_profit` = Revenue − COGS −
  other_direct (new behavior); GP and EBITDA are identical whether the
  product is flagged cogs or other_direct; Inventory = COGS only (4,520.55
  at DIO 30); AP = (COGS + other_direct)/365 × DPO (8,219.18). Fails: the
  Income table has no "Direct service costs" row (merged into the existing
  "Other Direct Costs line" entry above). No new bugs. Baseline restored
  exactly (GP 145,000 / 181,250).

- **2026-09-28 — Create MVP + AI re-test**: the in-form Assist me now
  sends MVP modal context. There were no unrequested saves in 8 in-form
  runs, and an explicit "save" request is deferred to the Create button.
  With a segment selected, the whole form is filled (4/4) and it saves via
  Create MVP (201). Still broken: without a manually selected segment
  nothing is filled (3/3). New: the side panel on the MVP list saves an
  AI-invented MVP immediately with no confirmation. Test MVPs #92 and #93
  deleted; MVP list back to empty.

- **2026-09-28 — Create/Edit Product validation re-test** (2 reported
  fixes): stale "Revenue type is required" error (and the other step-1
  errors) → **Fixed**. Empty Variable production cost → **resolved by
  making the field optional**: the asterisk was removed, and empty is still
  saved as `variable_cost: 0` (Create and Edit). This conflicts with the
  task spec ("stays mandatory"), so it needs a PO decision. (An earlier
  draft of this session's report wrongly said the asterisk was still
  present; corrected after checking the label DOM.) Probe products
  deleted.

- **2026-09-24 — Assist me AI form-fill across all create forms**: 15
  create forms opened. Assist me opens in 22/22 attempts. Mechanism:
  in-form button → chat popover inside the modal → `POST
  /agent/chat/stream` with `context.modal.{entity, values}` → SSE `draft`
  event → frontend fills the form (nothing saved until user clicks
  Create). Works: Client (+needs), Product (all fields incl. Subscription
  type/Cost type; saved OK), Competitor (saved OK), Marketing channel (step
  1 + funnel steps), Team role, Resource, Risk. For Client, Product, Team
  role, Resource, MVP and Action item the first prompt ("Створи мені X")
  only returns clarifying questions; a follow-up ("придумай сам і заповни")
  is needed. 6 new bugs: MVP saves directly instead of filling; Action
  item never fills; Assist me missing in 6 forms; page-level "create
  location" hangs; raw Markdown in in-form chat; funnel conversion rate
  rounded. Cleanup: competitor, product and AI-created MVP #88 deleted.

- **2026-09-23 — Products: Subscription period + Cost type numeric
  verification**: drove controlled products (client 408, qty 100/125) and
  read `financial-evaluation` / `balance-sheet` API responses after each
  step. Backend math passes every acceptance criterion: Monthly = price ×
  12 × qty (variable cost also × 12), Annual = price × 1 × qty; switching
  period/revenue type recalculates and clears `subscription_period`;
  other_direct cost goes to `other_direct_costs` (not COGS), Gross profit =
  Revenue − COGS, EBITDA identical for cogs vs. other_direct at equal
  amounts, all-other_direct → COGS 0 / Inventory 0, COGS 100,000 + DIO 30 →
  Inventory 8,219.18. Still open: the Income statement UI doesn't render the
  Other direct costs row although the API returns it (table then doesn't
  reconcile Gross profit → EBITDA). "/Month" badge bug now Fixed. 4 new
  confirmed bugs (working-capital defaults not applied until Save; empty
  production cost saved as 0; stale Revenue type error; Escape closes the
  drawer). All probe products deleted; baseline financials restored exactly.
  Side effect: the project's working-capital settings are now saved
  (30/60/30, `is_configured: true`).

- **2026-09-21 — Create/Edit Product modal review (COGS vs. Other direct
  cost task)**: the redesigned Create/Edit Product modal (Name/Description/
  Revenue type/Selling price/**Subscription type** [Subscription only]/
  **Sourcing**/**Cost type**/Variable production cost/**Margin per unit**)
  was verified live end-to-end. Cost type (`Cost of goods sold - held in
  stock` / `Other direct cost - services, fees`) and Subscription type
  (`Monthly subscription` / `Annual subscription`) both work correctly and
  persist on the backend (confirmed via Edit re-open), and the auto-computed
  Margin per unit field is correct (selling price − production cost). 2 new
  confirmed bugs: the Products list card's price-cadence badge always shows
  "/Month" for any Subscription product regardless of its actual
  Subscription type; and Financial → Forecasts & Reports' Income statement
  has no "Other direct costs" line at all, so the task's required always-on
  report line and the COGS/Other-direct split are not yet reflected in
  Financial reporting (product-level classification itself is fine).
  `tests/helpers/product.helper.js` also had a latent locator bug fixed
  while adding coverage: `selectFromCustomDropdown()`'s `.first()` dropdown
  match only ever worked because Product step 1 used to have exactly one
  custom dropdown (Revenue type) — now that the redesigned modal renders up
  to 4 at once, a new `selectFromLabeledDropdown()` scopes by field label
  instead. `tests/06-create-product.spec.js` gained 3 new tests (04–06)
  covering the Cost type toggle, an Other-direct-cost product end-to-end,
  and an Annual-subscription product's persistence.

- **2026-08-07 — Dashboard Mobile-only follow-up** (390×844 exclusively,
  both projects; Figma Mobile page re-attempted with the same result as the
  first pass that day — canvas screenshot fails, Dev Mode paywalled, Layers
  tree still won't expand): 2 new confirmed bugs (mobile Invite dialog is
  missing the "Cancel" button that exists on Desktop; Dashboard widgets
  truncate real product/risk/task names with zero recovery path — no
  `title`, no legend, not clickable — confirmed via direct DOM inspection,
  present on Desktop too but most visible on Mobile). Widened the scope of
  the same-day accessibility finding from "Invite dialog only" to a
  **3-surface confirmed pattern** by reproducing the identical aria-hidden/
  focus warning on the mobile hamburger nav drawer, and both warnings
  together on the account Profile menu — now treated as a shared overlay
  primitive issue, not Invite-specific. Reconfirmed the Revenue vs Expenses
  chart axis mislabeling reproduces on Mobile too. Functionally clean
  otherwise: mobile nav drawer, Notifications, Profile menu, "Assist me",
  and the Role picker (rendered as a native-style bottom sheet on mobile)
  all opened and closed correctly with no console errors; no horizontal
  overflow on either project; a mobile deep-link tap navigated correctly
  with a clean console. Full results in
  `test-reports/Dashboard_Mobile_UA_Test_Report_2026-08-07.md`.

- **2026-08-07 — Dedicated Dashboard QA session** (empty-state project +
  populated "Dior Brand" project, desktop 1440×900 + mobile 390×844,
  Figma comparison attempt via Figma Dev Mode/Properties panel, functional/
  data-validation/edge-case/diagnostics passes): 3 new confirmed bugs
  (Competitor summary empty-state icon incorrectly reusing Critical risk's
  icon; Revenue vs Expenses chart Y-axis mislabeled as "₴150000k" instead of
  "₴150M" on both Dashboard and Forecasts & Reports; Invite modal firing two
  accessibility console warnings — missing Dialog description, and
  aria-hidden blocking a focused descendant — on every open). Extended the
  existing "Duplicate Products" data-hygiene finding with two new confirmed
  instances (Action Plan tasks, Risk analysis entries) on the same "Dior
  Brand" project. Re-verified the "Intermittent Sidebar Menu/Panel/Drawer
  Open Failure" bug and found it **not reproduced** this session — Assist me
  5/5 successful opens (vs. 0/5 on 2026-08-06), Notifications 1/1,
  Language 1/1 — reported as likely fixed/improved pending a larger
  re-verification sample for Notifications/Language specifically. All
  Financial stat tiles (CAPEX/OPEX/Break-even/Profitability) confirmed
  consistent between Dashboard and Forecasts & Reports with no drift; no
  broken images or failed network requests found; no horizontal overflow on
  mobile for either project. Figma's canvas remains impossible to
  screenshot in this environment (WebGL tab-capture readback failure,
  reconfirmed), and Figma Dev Mode requires a paid seat upgrade not
  available on this account — but the Properties panel and Layers list
  still yielded real, non-fabricated structural facts (Dashboard section
  bounding boxes for both the Desktop "Ready to Dev" and dedicated "Mobile"
  pages, confirming a mobile Dashboard design does exist). Full results in
  `test-reports/Dashboard_UA_Test_Report_2026-08-07.md`.

- **2026-08-06 — Full release-readiness pass** (all 25 existing specs run
  as a regression baseline, plus new coverage written and validated for
  Dashboard, Magic Triangle Overview, Financial x2, Business Plan, Invite,
  and Minor Global Settings): 5 new confirmed findings — the cross-cutting
  intermittent sidebar drawer/menu/panel open failure (Assist me 0/5,
  Notifications 0/6, Language ~50%, Invite mostly fine but not immune),
  custom "Other" category names permanently polluting the Marketing
  Channels category list, the Sales Funnels step's redesign into a
  multi-stage funnel builder, Category label recapitalization (+ "Paid
  Search" dropping "(Google Ads)"), and a concrete, observed instance of
  duplicate Products from non-idempotent test fixtures. The 4 real
  full-suite failures this session (`tests/07`, `12`, `13`, `23`) were all
  test-suite/fixture issues rather than product defects, and are now fixed
  and confirmed idempotent (each re-run twice consecutively without
  failure) — see each spec's in-file comments and the entries above for
  the underlying app changes that caused them. Full results in
  `test-reports/Release_Readiness_Test_Report.md`.

- **2026-08-05 — Core Flows manual QA session** (Login, Project, Client,
  Product, Competitor, Magic Triangle): 1 new confirmed issue (Create
  Project native-tooltip validation), 1 existing issue upgraded from
  unconfirmed to **Confirmed** with a reliable repro (concurrent-tab session
  loss). All other tested behavior across these 6 flows matched expectations
  — no new regressions found in Login, Client, Product, Competitor CRUD, or
  Magic Triangle overview. Full results in
  `test-reports/Core_Flows_Test_Report.md`.

No known bugs have been marked **Fixed**, **Regression**, or **Cannot
Reproduce** yet — this is the file's first population. As real testing
sessions are run against the app (per `RELEASE_CHECKLIST.md`), append
genuinely new confirmed findings here; do not backfill speculative items
from the checklist's open questions until they've actually been verified.
